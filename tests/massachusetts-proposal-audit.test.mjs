import test from "node:test";
import assert from "node:assert/strict";
import {EMPTY_MASS_INPUT,newMassQuote} from "../src/lib/mass-save.ts";
import {auditMassachusettsProposals,blankEquipment,massAuditReport} from "../src/lib/massachusetts-proposal-audit.ts";
const {installerInNetwork,equipmentOnQualifiedList,newEquipment,coolingCapacityBtu,...rest}=EMPTY_MASS_INPUT;
const shared={...rest,year:"2026",route:"whole",heatingFuel:"oil",inMassachusetts:"yes",
 residentialAccount:"yes",propertyUnits:"one-four",residentialSponsorConfirmed:"yes",
 hasOldHeatPump:"no",winterOccupied:"yes",displacesPrimaryHeating:"yes",
 wholeWeatherization:"yes",wholeFormSigned:"yes"};
const quote=(id,price)=>({...newMassQuote(id),price,priceBasis:"before-rebate",
 scope:"reuse-existing-ducts",proposedRebate:5000,rebateDocumentation:"yes",
 installerInNetwork:"yes",equipmentOnQualifiedList:"yes",newEquipment:"yes",coolingCapacityBtu:36000});
const full={ahriReference:"123456789",outdoorModel:"AOU36RLXFZ",indoorModel:"ASU36RLXFZ",
 refrigerant:"at-most-700",systemClass:"split"};
const run=(opts={})=>auditMassachusettsProposals(opts.common??shared,
 opts.quotes??[quote("a",16000),quote("b",18000)],
 opts.evidence??{a:full,b:full},opts.timeline??{installationDate:"2026-11-15",submissionDate:"2027-01-15"});
test("matched reported system and 2026 date allow a conditional illustration, not awarded funding",()=>{
 const r=run();
 assert.equal(r.timeline.status,"2026");
 assert.equal(r.comparison.quotes[0].conditionalPostRebate,11000);
 assert.equal(r.quotes[0].readiness,"reported-ready");
 assert.ok(r.timeline.documents.some(x=>/nameplate photographs/.test(x)));
 assert.match(massAuditReport(r,{a:full,b:full},{installationDate:"2026-11-15",submissionDate:"2027-01-15"}),/Not a heat-pump product approval/);
});
test("unknown or disagreeing installation year cannot support a net cost",()=>{
 assert.equal(run({timeline:{installationDate:"",submissionDate:""}}).comparison.quotes[0].conditionalPostRebate,null);
 const r=run({timeline:{installationDate:"2027-01-01",submissionDate:"2027-02-12"}});
 assert.equal(r.timeline.status,"2027-announced");
 assert.equal(r.timeline.scheduleMatches,false);
 assert.equal(r.comparison.quotes[0].conditionalPostRebate,null);
 assert.ok(r.timeline.problems.some(x=>/conflict/.test(x)));
});
test("December 31 versus January 1 selects different date periods",()=>{
 assert.equal(run({timeline:{installationDate:"2026-12-31",submissionDate:"2027-02-28"}}).timeline.year,"2026");
 assert.equal(run({timeline:{installationDate:"2027-01-01",submissionDate:""}}).timeline.year,"2027");
});
test("late or before-install submission blocks conditional value",()=>{
 const late=run({timeline:{installationDate:"2026-12-10",submissionDate:"2027-03-01"}});
 assert.equal(late.comparison.quotes[0].conditionalPostRebate,null);
 assert.ok(late.timeline.problems.some(x=>/after the published/.test(x)));
 const early=run({timeline:{installationDate:"2026-12-10",submissionDate:"2026-11-01"}});
 assert.equal(early.comparison.quotes[0].conditionalPostRebate,null);
 assert.ok(early.timeline.problems.some(x=>/before installation/.test(x)));
});
test("ordinary 2026 split R-410A fails standard HPQPL constraint",()=>{
 const r=run({evidence:{a:{...full,refrigerant:"r410a"},b:full}});
 assert.equal(r.quotes[0].readiness,"blocked");
 assert.equal(r.quotes[0].refrigerantFinding,"unsupported-standard");
 assert.equal(r.comparison.quotes[0].conditionalPostRebate,null);
 assert.equal(r.comparison.quotes[1].conditionalPostRebate,13000);
});
test("VRF high GWP exception only sent for official review; never automatic approval",()=>{
 const v={...full,refrigerant:"r410a",systemClass:"vrf"};
 assert.equal(run({evidence:{a:v,b:full}}).quotes[0].refrigerantFinding,"unsupported-standard");
 const big=run({quotes:[{...quote("a",16000),coolingCapacityBtu:72000},quote("b",18000)],evidence:{a:v,b:full}});
 assert.equal(big.quotes[0].refrigerantFinding,"exception-needs-review");
 assert.equal(big.quotes[0].readiness,"verify");
 assert.equal(big.comparison.quotes[0].conditionalPostRebate,null);
 const packaged=run({evidence:{a:{...v,systemClass:"self-contained"},b:full}});
 assert.equal(packaged.quotes[0].refrigerantFinding,"exception-needs-review");
});
test("missing identities or unknown refrigerant block conditional net amount despite checkbox",()=>{
 const missing=run({evidence:{a:blankEquipment(),b:full}});
 assert.equal(missing.quotes[0].readiness,"verify");
 assert.equal(missing.comparison.quotes[0].conditionalPostRebate,null);
 assert.ok(missing.quotes[0].risks.some(x=>/AHRI certified reference/.test(x)));
 const unknown=run({evidence:{a:{...full,refrigerant:"unsure"},b:full}});
 assert.equal(unknown.quotes[0].readiness,"verify");
 assert.equal(unknown.comparison.quotes[0].conditionalPostRebate,null);
});
test("malformed dates and model IDs are rejected and out-of-period installs unsupported",()=>{
 assert.throws(()=>run({timeline:{installationDate:"2026-02-30",submissionDate:""}}),RangeError);
 assert.throws(()=>run({evidence:{a:{...full,ahriReference:"<script>"},b:full}}),RangeError);
 const previous=run({timeline:{installationDate:"2025-12-30",submissionDate:"2026-01-20"}});
 assert.equal(previous.timeline.status,"unsupported");
 assert.equal(previous.comparison.quotes[0].conditionalPostRebate,null);
});

test("unknown equipment configuration keeps high-GWP claims out of conditional price arithmetic",()=>{
 const e={...full,refrigerant:"r410a",systemClass:"unsure"};
 const x=run({evidence:{a:e,b:full}});
 assert.equal(x.quotes[0].readiness,"verify");
 assert.equal(x.comparison.quotes[0].conditionalPostRebate,null);
 const y=run({evidence:{a:{...full,systemClass:"unsure"},b:full}});
 assert.equal(y.quotes[0].readiness,"verify");
});
