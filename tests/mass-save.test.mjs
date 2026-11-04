import test from "node:test";
import assert from "node:assert/strict";
import {EMPTY_MASS_INPUT,readMassSchedule,evaluateMassSave,newMassQuote,compareMassQuotes,massCopyPlan} from "../src/lib/mass-save.ts";
const good={...EMPTY_MASS_INPUT,year:"2026",route:"whole",heatingFuel:"oil",inMassachusetts:"yes",residentialAccount:"yes",propertyUnits:"one-four",residentialSponsorConfirmed:"yes",winterOccupied:"yes",hasOldHeatPump:"no",displacesPrimaryHeating:"yes",wholeWeatherization:"yes",wholeFormSigned:"yes",installerInNetwork:"yes",equipmentOnQualifiedList:"yes",newEquipment:"yes",coolingCapacityBtu:36000};
test("2026 published whole, partial, basic rebate schedule and caps",()=>{
 assert.deepEqual(readMassSchedule("2026","whole"),{rate:2650,cap:8500});
 assert.deepEqual(readMassSchedule("2026","partial"),{rate:1125,cap:8500});
 assert.deepEqual(readMassSchedule("2026","basic"),{rate:250,cap:2500});
});
test("2027 announced reductions and no unsupported basic amount",()=>{
 assert.deepEqual(readMassSchedule("2027","whole"),{rate:2350,cap:7500});
 assert.deepEqual(readMassSchedule("2027","partial"),{rate:1000,cap:7500});
 assert.equal(readMassSchedule("2027","basic"),null);
 assert.equal(evaluateMassSave({...good,year:"2027"}).status,"schedule-only");
});
test("2026 whole three ton formula: 7950, no greater than cap",()=>{
 assert.equal(evaluateMassSave(good).theoreticalScheduleAmount,7950);
 assert.equal(evaluateMassSave({...good,coolingCapacityBtu:48000}).theoreticalScheduleAmount,8500);
});
test("unknown input never claims rebate eligibility",()=>{
 const r=evaluateMassSave(EMPTY_MASS_INPUT);
 assert.equal(r.status,"needs-verification");
 assert.equal(r.theoreticalScheduleAmount,null);
});
test("no Mass Save sponsor is explicit not-supported",()=>{
 assert.equal(evaluateMassSave({...good,residentialSponsorConfirmed:"no"}).status,"not-supported");
});
test("whole home needs weatherization, occupancy and signed verification",()=>{
 for(const key of ["wholeWeatherization","winterOccupied","wholeFormSigned"]){
  assert.notEqual(evaluateMassSave({...good,[key]:"no"}).status,"requirements-reported");
 }
});
test("existing heat pump replacement is not whole-home rebate",()=>{
 assert.equal(evaluateMassSave({...good,heatingFuel:"existing-heat-pump",hasOldHeatPump:"yes"}).status,"not-supported");
});
test("partial fossil backup requires integrated controls or documented disconnect",()=>{
 const common={...good,route:"partial",fossilHeatingRemains:"yes",partialIntegratedControls:"unsure"};
 assert.equal(evaluateMassSave(common).status,"needs-verification");
 assert.equal(evaluateMassSave({...common,partialIntegratedControls:"no"}).status,"not-supported");
 assert.equal(evaluateMassSave({...common,partialIntegratedControls:"yes"}).status,"requirements-reported");
 const disconnected={...common,fossilHeatingRemains:"no",removedFuelEvidence:"yes"};
 assert.equal(evaluateMassSave(disconnected).status,"requirements-reported");
});
test("basic rejects primary replacement; standard 2026 only",()=>{
 const b={...good,route:"basic",displacesPrimaryHeating:"yes"};
 assert.equal(evaluateMassSave(b).status,"not-supported");
 assert.equal(evaluateMassSave({...b,displacesPrimaryHeating:"no"}).theoreticalScheduleAmount,750);
});
test("invalid tonnage is rejected",()=>{
 for(const v of [-12,0,NaN,Infinity,300001])
 assert.throws(()=>evaluateMassSave({...good,coolingCapacityBtu:v}),RangeError);
});
const {installerInNetwork,equipmentOnQualifiedList,newEquipment,coolingCapacityBtu,...shared}=good;
const make=(id,price)=>({...newMassQuote(id),scope:"reuse-existing-ducts",price,priceBasis:"before-rebate",proposedRebate:5000,rebateDocumentation:"yes",installerInNetwork:"yes",equipmentOnQualifiedList:"yes",newEquipment:"yes",coolingCapacityBtu:36000});
test("bid comparison shows conditional scenario with written confirmation, no awarded rebate",()=>{
 const r=compareMassQuotes(shared,[make("a",16000),make("b",18000)]);
 assert.equal(r.quotes[0].conditionalPostRebate,11000);
 assert.equal(r.comparablePriceGap,2000);
 assert.equal(r.comparativeWinner,"a");
});
test("unsigned or larger than schedule proposed rebate never subtracted",()=>{
 let q=make("a",16000);q.rebateDocumentation="unsure";
 let r=compareMassQuotes(shared,[q,make("b",18000)]);
 assert.equal(r.quotes[0].conditionalPostRebate,null);
 q={...make("a",16000),proposedRebate:8500};
 r=compareMassQuotes(shared,[q,make("b",18000)]);
 assert.equal(r.quotes[0].conditionalPostRebate,null);
});
test("after-rebate quote not double discounted",()=>{
 const q={...make("a",11000),priceBasis:"after-rebate"};
 const r=compareMassQuotes(shared,[q,{...make("b",18000),priceBasis:"after-rebate"}]);
 assert.equal(r.quotes[0].conditionalPostRebate,null);
});
test("2027 numeric rebate is schedule-only, no conditional after-rebate price",()=>{
 const r=compareMassQuotes({...shared,year:"2027"},[make("a",16000),make("b",18000)]);
 assert.equal(r.quotes[0].program.theoreticalScheduleAmount,7050);
 assert.equal(r.quotes[0].conditionalPostRebate,null);
});
test("mixed quote price bases are not ranked",()=>{
 const r=compareMassQuotes(shared,[make("a",16000),{...make("b",18000),priceBasis:"after-rebate"}]);
 assert.equal(r.comparablePriceGap,null);
});
test("copy plan warns and cites original authority",()=>{
 const r=compareMassQuotes(shared,[make("a",16000),make("b",18000)]);
 const t=massCopyPlan(r);
 assert.match(t,/NOT Mass Save preapproval/);
 assert.match(t,/masssave.com/);
});

test("outside MA or no residential account never passes the standard screen",()=>{
 assert.equal(evaluateMassSave({...good,inMassachusetts:"no"}).status,"not-supported");
 assert.equal(evaluateMassSave({...good,residentialAccount:"no"}).status,"not-supported");
});
test("multifamily 5+ requires case review for special conditions",()=>{
 const r=evaluateMassSave({...good,propertyUnits:"five-plus"});
 assert.equal(r.status,"needs-verification");
 assert.equal(r.conditions.find(x=>x.id==="property-units").status,"verify");
});

test("different installation scopes cannot be ranked by nominal price",()=>{
 const a=make("a",22000);
 const b={...make("b",45000),scope:"replace-or-build-ducts"};
 const r=compareMassQuotes(shared,[a,b]);
 assert.equal(r.comparablePriceGap,null);
 assert.equal(r.comparativeWinner,null);
 assert.match(r.comparisonExplanation,/new ductwork/);
});
test("unknown installation scope prohibits misleading lowest-bid winner",()=>{
 const a={...make("a",24000),scope:"unknown"};
 const r=compareMassQuotes(shared,[a,make("b",26000)]);
 assert.equal(r.comparativeWinner,null);
 assert.ok(r.quotes[0].risks.some(x=>/Identify whether/.test(x)));
});

test("downloaded text explains differences in bid scope and evidence without claiming approval",()=>{
 const r=compareMassQuotes(shared,[make("a",26000),{...make("b",45000),scope:"replace-or-build-ducts"}]);
 const report=massCopyPlan(r);
 assert.match(report,/Broad installation scope: reuse-existing-ducts/);
 assert.match(report,/Broad installation scope: replace-or-build-ducts/);
 assert.match(report,/Permits & electrical documented/);
 assert.match(report,/NOT Mass Save preapproval/);
});
