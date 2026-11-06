import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {PROJECT_WORKFLOWS} from "../src/lib/project-directory.ts";
import {SJ_INITIAL,screenSanJoseEV} from "../src/lib/san-jose-ev.ts";
const read=p=>fs.readFileSync(p,"utf8");
test("all original home improvement routes and new San Jose decision route are integrated",()=>{
 for(const x of ["/massachusetts/heat-pumps","/oregon/heat-pump-water-heaters","/california/san-jose-ev-charger"])assert.ok(PROJECT_WORKFLOWS.some(y=>y.href===x),x);
 assert.ok(fs.existsSync("src/app/california/san-jose-ev-charger/page.tsx"));
 assert.ok(fs.existsSync("tests/proposal-text-import.test.mjs"));
});
test("San Jose retains official sources and none of the Oregon and Massachusetts references are lost",()=>{
 const ids=JSON.parse(read("docs/SOURCE_REGISTRY.json")).sources.map(x=>x.id);
 assert.equal(new Set(ids).size,ids.length);
 for(const x of ["portland-mechanical","oregon-hp3","sj-ev-charge-city-2026","sj-ev-electric-2026","sj-ev-panel-2026","sj-ev-online-2026"])assert.ok(ids.includes(x));
});
test("no no-work electrician-quote intent or invented referral",()=>{
 assert.equal(screenSanJoseEV({...SJ_INITIAL,location:"city-verified",property:"single-duplex",charge:"level1-existing",panel:"not-proposed",ventilation:"confirmed-not-required"},"2026-11-06").status,"no-new-station-permit");
 const page=read("src/app/california/san-jose-ev-charger/page.tsx");
 assert.ok(page.includes('outcome.status==="electrical-permit"'));
 for(const event of ["sj_ev_matcher_start","sj_ev_checklist_copied","sj_ev_quote_intent","sj_ev_official_outbound"])assert.ok(page.includes(event));
 assert.ok(read("src/app/robots.ts").includes('disallow:"/"'));
 assert.ok(read("src/app/layout.tsx").includes("index: false"));
});
