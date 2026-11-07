import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {SJ_INITIAL,screenSanJoseEV} from "../src/lib/san-jose-ev.ts";
import {newEVQuote,compareSanJoseEVQuotes} from "../src/lib/san-jose-ev-quotes.ts";
import {INITIAL_HEAT_PLAN,blankHeatBidQuality,evaluateHeatPumpBidQuality} from "../src/lib/heat-pump-bid-quality.ts";
import {emptyQuote} from "../src/lib/heat-pump-quotes.ts";
import {initialInput} from "../src/lib/oregon-heat-pump-water-heater.ts";
import {newHPWHSite,newHPWHModelReview,assessHPWHFit} from "../src/lib/hpwh-purchase-fit.ts";
import {PROJECT_WORKFLOWS,filterProjectWorkflows} from "../src/lib/project-directory.ts";

const reviewed="2026-11-06";

test("three purchasing engines load together and preserve cautious no-buy defaults",()=>{
 const permit=screenSanJoseEV(SJ_INITIAL,reviewed);
 const ev=compareSanJoseEVQuotes(SJ_INITIAL,permit,[newEVQuote("a"),newEVQuote("b")]);
 assert.notEqual(ev.status,"comparable","Unverified California jurisdiction cannot create a lower-cost electrician ranking");
 const heat=evaluateHeatPumpBidQuality(INITIAL_HEAT_PLAN,[emptyQuote("a"),emptyQuote("b")],
   [blankHeatBidQuality("a"),blankHeatBidQuality("b")],reviewed);
 assert.notEqual(heat.status,"ready-for-professional-review","Unknown heating scope cannot certify HVAC design evidence");
 assert.equal(heat.notEquipmentApproval,true);
 assert.equal(heat.noContractorEndorsement,true);
 const water=initialInput();
 const fit=assessHPWHFit(water,newHPWHSite(),water.quotes.map(q=>newHPWHModelReview(q.id)),reviewed);
 assert.equal(fit.safeToCompareAsQuoted,false);
 assert.equal(fit.notProductApproval,true);
 assert.equal(fit.noRebateAssumption,true);
});

test("original human-reviewed source ledger and six feature records are preserved without duplicates",()=>{
 const data=JSON.parse(fs.readFileSync("docs/SOURCE_REGISTRY.json","utf8"));
 assert.equal(data.version,1);
 const ids=data.sources.map(s=>s.id);
 assert.equal(data.sources.length,17);
 assert.equal(new Set(ids).size,ids.length);
 for(const id of [
  "heat-pump-doe-design-2026","heat-pump-doe-commission-2026",
  "hpwh-energy-star-air-design-2026","hpwh-energy-star-install-2026",
  "hpwh-doe-single-family-2026","hpwh-energy-star-buying-2026",
  "sj-ev-charge-city-2026","portland-hpwh-jurisdiction"
 ])assert.ok(ids.includes(id),"Missing regulator/technical source "+id);
 for(const s of data.sources){
  assert.match(s.url,/^https:\/\//,s.id);
  assert.match(s.lastReviewed,/^\d{4}-\d{2}-\d{2}$/,s.id);
 }
});

test("review hub, complete purchasing routes, source guides and original PR histories are discoverable",()=>{
 const files=[
  "src/app/california/san-jose-ev-charger/page.tsx",
  "src/app/projects/heat-pump-bid-quality/page.tsx",
  "src/app/oregon/heat-pump-water-heaters/page.tsx",
  "src/app/oregon/heat-pump-water-heaters/buying-guide/page.tsx",
  "src/app/pilot-review/page.tsx",
  "src/components/san-jose-ev-quote-workspace.tsx",
  "src/components/heat-pump-bid-quality.tsx",
  "src/components/hpwh-purchase-fit.tsx"
 ];
 for(const file of files)assert.ok(fs.existsSync(file),file+" absent from protected integration");
 const review=fs.readFileSync("src/app/pilot-review/page.tsx","utf8");
 for(const n of [27,28,29])assert.ok(review.includes("pr:"+n),"Missing link to original PR #"+n);
 assert.match(review,/robots:\s*\{index:false,follow:false\}/);
 assert.match(fs.readFileSync("src/components/site-wayfinding.tsx","utf8"),/href="\/pilot-review"/);
});

test("cross-market directory keeps specific California EV and Oregon water-heater pathways separate",()=>{
 assert.equal(PROJECT_WORKFLOWS.length,4);
 assert.deepEqual(filterProjectWorkflows("ev-charger","ca").map(x=>x.id),["ca-sj-ev"]);
 assert.deepEqual(filterProjectWorkflows("water-heater","or").map(x=>x.id),["or-water"]);
 assert.deepEqual(filterProjectWorkflows("water-heater","ma"),[]);
 assert.deepEqual(filterProjectWorkflows("space-heat-pump","or").map(x=>x.id),["or-space"]);
 const homepage=fs.readFileSync("src/app/page.tsx","utf8");
 for(const href of [
  "/california/san-jose-ev-charger",
  "/projects/heat-pump-bid-quality",
  "/oregon/heat-pump-water-heaters"
 ])assert.ok(homepage.includes('href="'+href+'"'),"Missing homepage discovery for "+href);
});

test("integration retains global search blocking and no hidden checkout or personal events",()=>{
 const layout=fs.readFileSync("src/app/layout.tsx","utf8");
 assert.match(layout,/robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
 assert.match(fs.readFileSync("src/app/robots.ts","utf8"),/disallow/);
 const paths=[
  "src/components/san-jose-ev-quote-workspace.tsx",
  "src/components/heat-pump-bid-quality.tsx",
  "src/components/hpwh-purchase-fit.tsx"
 ];
 for(const path of paths){
  const body=fs.readFileSync(path,"utf8");
  assert.doesNotMatch(body,/track\(\s*[^,]+\s*,\s*\{/,path+" must not attach quote/household data to analytics");
 }
});
