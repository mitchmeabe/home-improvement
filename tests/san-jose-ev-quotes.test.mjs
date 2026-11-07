import test from "node:test";
import assert from "node:assert/strict";
import {SJ_INITIAL,screenSanJoseEV} from "../src/lib/san-jose-ev.ts";
import {compareSanJoseEVQuotes,evInstallationRequest,evQuoteComparisonReport,newEVQuote,EV_WORK_FIELDS} from "../src/lib/san-jose-ev-quotes.ts";
const scenario={location:"city-verified",property:"single-duplex",charge:"level2",panel:"not-proposed",ventilation:"confirmed-not-required"};
const plan=(patch={})=>({...scenario,...patch});
const permit=(p=plan())=>screenSanJoseEV(p,"2026-11-06");
function quote(id,patch={}){
 return {...newEVQuote(id),amount:id==="a"?2300:3000,basis:"before-incentives",
 scope:"level2-dedicated",equipmentIncluded:"yes",wiringIncluded:"yes",
 electricalPermitIncluded:"yes",inspectionIncluded:"yes",
 panelWorkIncluded:"no",trenchingIncluded:"no",mechanicalPermitIncluded:"no",
 loadReviewDocumented:"yes",managedChargingDocumented:"no",
 panelRationaleDocumented:"no",equipmentModelDocumented:"yes",warrantyWritten:"yes",...patch};
}
const compare=(patchA={},patchB={},p=plan())=>
 compareSanJoseEVQuotes(p,permit(p),[quote("a",patchA),quote("b",patchB)]);
test("identically documented Level 2 proposals compare as-quoted totals without a best-installer claim",()=>{
 const r=compare();assert.equal(r.status,"comparable");assert.equal(r.lowest,"a");
 assert.equal(r.quotedPriceGap,700);assert.match(r.explanation,/not a best-installer rating/i);
 assert.equal(r.noAffiliate,true);assert.equal(r.noEngineeringApproval,true);
});
test("incentive basis mismatch blocks dollar ranking and disallows any automatic rebate arithmetic",()=>{
 const r=compare({basis:"before-incentives"},{basis:"after-incentives"});
 assert.equal(r.status,"scope-mismatch");assert.equal(r.lowest,null);
 assert.match(r.differences.join(" "),/price basis/i);
});
test("Level 1 outlet and Level 2 circuit are fundamentally different installations",()=>{
 const r=compare({scope:"new-120v"});assert.equal(r.status,"scope-mismatch");assert.equal(r.lowest,null);
 assert.match(r.issues.join(" "),/level 1 outlet/i);
});
test("a new 120V Level 1 outlet can compare only two identical 120V bids",()=>{
 const p=plan({charge:"level1-new-outlet"});
 const good=compare({scope:"new-120v"},{scope:"new-120v"},p);
 assert.equal(good.status,"comparable");
 assert.equal(compare({}, {},p).status,"needs-information");
});
test("unknown City, existing outlet, stale source, shared parking and missing quote are never commercially ranked",()=>{
 for(const p of [
  plan({location:"unsure"}),plan({charge:"level1-existing"}),
  plan({property:"multi-common"}),plan({charge:"unsure"})
 ]){
  const r=compare({}, {},p);assert.equal(r.status,"not-applicable");assert.equal(r.lowest,null);
 }
 const stale=screenSanJoseEV(plan(),"2026-12-09");
 assert.equal(compareSanJoseEVQuotes(plan(),stale,[quote("a"),quote("b")]).status,"not-applicable");
 assert.equal(compareSanJoseEVQuotes(plan(),permit(),[quote("a")]).status,"needs-information");
});
test("missing inclusion facts, permits, inspections or wiring withhold a price ranking",()=>{
 for(const p of [
  {equipmentIncluded:"unsure"}, {wiringIncluded:"no"},{electricalPermitIncluded:"no"},
  {inspectionIncluded:"no"}, {trenchingIncluded:"unsure"},
  {equipmentModelDocumented:"unsure",loadReviewDocumented:"unsure"}
 ]){
  const r=compare(p);assert.notEqual(r.status,"comparable");assert.equal(r.lowest,null);
 }
});
test("charger model and warranty uncertainty are disclosed, not silently treated as audited",()=>{
 const r=compare({equipmentModelDocumented:"unsure",warrantyWritten:"no"});
 assert.ok(r.perQuote.a.some(x=>/equipment make/i.test(x)));
 assert.ok(r.perQuote.a.some(x=>/warranty/i.test(x)));
});
test("proposed panel work demands consistent included scope and documented rationale",()=>{
 const p=plan({panel:"proposed"});
 const patch={scope:"level2-panel-work",panelWorkIncluded:"yes",panelRationaleDocumented:"yes"};
 assert.equal(compare(patch,patch,p).status,"comparable");
 assert.equal(compare({...patch,panelRationaleDocumented:"unsure"},patch,p).lowest,null);
 assert.equal(compare({scope:"level2-dedicated"},patch,p).lowest,null);
 assert.equal(compare({scope:"level2-panel-work",panelWorkIncluded:"no"},{scope:"level2-panel-work",panelWorkIncluded:"no"}).lowest,null);
});
test("unknown panel state, managed EV charging and manufacturer ventilation remain distinct technical review gates",()=>{
 assert.notEqual(compare({}, {},plan({panel:"unsure"})).status,"comparable");
 const managed={scope:"level2-managed",managedChargingDocumented:"yes"};
 assert.equal(compare(managed,managed).status,"comparable");
 assert.equal(compare({...managed,managedChargingDocumented:"unsure"},managed).lowest,null);
 assert.equal(compare({}, {},plan({ventilation:"unsure"})).lowest,null);
 const vent={mechanicalPermitIncluded:"yes"};
 assert.equal(compare(vent,vent,plan({ventilation:"requires-mechanical"})).status,"comparable");
 assert.equal(compare({}, {},plan({ventilation:"requires-mechanical"})).lowest,null);
});
test("invalid numeric inputs and invalid quote IDs fail closed",()=>{
 for(const bad of [null,0,-1,Infinity,NaN,1500000,21.123])assert.equal(compare({amount:bad}).lowest,null);
 assert.equal(compareSanJoseEVQuotes(plan(),permit(),[quote("a"),quote("a")]).status,"needs-information");
});
test("scope differences are not ranked even when the lower number is compelling",()=>{
 for(const field of EV_WORK_FIELDS.map(x=>x.key)){
  const r=compare({[field]:"yes"},{[field]:"no"});
  assert.equal(r.lowest,null,field);
  assert.ok(r.differences.some(x=>x.toLowerCase().includes(field==="equipmentIncluded"?"charging equipment":field==="trenchingIncluded"?"trenching":field==="inspectionIncluded"?"inspection":field==="wiringIncluded"?"wiring":field==="panelWorkIncluded"?"panel":field==="mechanicalPermitIncluded"?"mechanical":"electrical permit")),field);
 }
});
test("copy/download-ready reports preserve official sources, quote context and unverified limitations",()=>{
 const p=plan();const x=permit(p);const quotes=[quote("a"),quote("b")];
 const t=evInstallationRequest(p,x);
 assert.match(t,/load/i);assert.match(t,/manufacturer/i);assert.match(t,/sanjoseca.gov/);
 assert.doesNotMatch(t,/approved rebate|automatically required panel/i);
 const report=evQuoteComparisonReport(p,x,quotes,compareSanJoseEVQuotes(p,x,quotes));
 assert.match(report,/QUOTE A/);assert.match(report,/\$2300.00/);
 assert.match(report,/\$700.00/);
 assert.match(report,/No contractor is contacted/);
});

test("ordinary cent-denominated EV installation prices are valid and not misclassified",()=>{
 for(const price of [0.01,19.29,79.99,199.95,1450.29,999999.99]){
  const x=compare({amount:price},{amount:price});
  assert.equal(x.status,"comparable",String(price));
  assert.equal(x.quotedPriceGap,0,String(price));
 }
 const invalid=compare({amount:79.999},{amount:99.95});
 assert.notEqual(invalid.status,"comparable");
 assert.equal(invalid.lowest,null);
});
