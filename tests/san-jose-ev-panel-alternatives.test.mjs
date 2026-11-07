import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {SJ_INITIAL,screenSanJoseEV} from "../src/lib/san-jose-ev.ts";
import {
 INITIAL_SJ_PANEL_INPUT,emptySJPanelOffer,SJ_PANEL_REVIEWED,SJ_PANEL_SOURCES,
 evaluateSJPanelAlternatives,sanJosePanelRequest,sanJosePanelReport
} from "../src/lib/san-jose-ev-panel-alternatives.ts";
const project={location:"city-verified",property:"single-duplex",charge:"level2",panel:"proposed",ventilation:"confirmed-not-required"};
const yes="yes",no="no";
function proposal(id,amount=1500){
 return {...emptySJPanelOffer(id),amount,priceBasis:"before-incentives",utilityBasis:"included",
  firstYearOngoingCost:0,permitIncluded:yes,inspectionIncluded:yes,
  equipmentModelDocumented:yes,technicalScopeDocumented:yes,warrantyWritten:yes};
}
function good(){
 return {...INITIAL_SJ_PANEL_INPUT,panelAmps:"125-or-less",writtenLoadAssessment:yes,existingPanelDefect:no,
  contractorLicenseChecked:yes,electricianAssessment:"both-feasible",sameChargingOutcome:yes,
  managedEquipmentReviewed:yes,utilityCoordinationReviewed:yes,
  offers:[proposal("managed",1600),proposal("upgrade",6800)]};
}
const audit=(i=good(),p=project,date="2026-11-06")=>evaluateSJPanelAlternatives(p,screenSanJoseEV(p,date),i,date);
test("in-scope San José panel replacement offers reviewed first-year conditional difference, NOT best electrician",()=>{
 const r=audit();
 assert.equal(r.status,"compare");
 assert.equal(r.priceDifference,5200);assert.equal(r.lowerQuote,"managed");
 assert.deepEqual(r.firstYearTotals,{managed:1600,upgrade:6800});
 assert.equal(r.noDesignApproval,true);assert.equal(r.noReferral,true);
 assert.match(r.notes.join(" "),/not verified savings/i);
});
test("panel rated <=125A includes City documented load requirement but never computes ampacity",()=>{
 const r=audit({...good(),writtenLoadAssessment:"unsure"});
 assert.equal(r.status,"needs-assessment");
 assert.equal(r.priceDifference,null);
 assert.match(r.requiredEvidence.join(" "),/125 A or less/);
 assert.match(r.requiredEvidence.join(" "),/load assessment/);
});
test("over 125A panel is not presumed sufficient, and unknown panel still blocks comparisons",()=>{
 const over=audit({...good(),panelAmps:"over-125"});
 assert.equal(over.status,"compare");
 const unknown=audit({...good(),panelAmps:"unsure"});
 assert.equal(unknown.status,"needs-assessment");assert.equal(unknown.priceDifference,null);
 assert.match(unknown.requiredEvidence.join(" "),/amp label by itself/);
});
test("independent defective panel / electrician-required service replacement cannot be dismissed by cheaper EV load management",()=>{
 for(const safety of ["yes","unsure"]){
  const r=audit({...good(),existingPanelDefect:safety});
  assert.notEqual(r.status,"compare");assert.equal(r.priceDifference,null);
  assert.match(r.requiredEvidence.join(" "),/safety|condition|code defect/i);
 }
 for(const conclusion of ["panel-required","managed-not-viable"]){
  const r=audit({...good(),electricianAssessment:conclusion});
  assert.equal(r.status,"panel-work-review");assert.equal(r.priceDifference,null);
  assert.match(r.notes.join(" "),/not viable|required/i);
 }
});
test("unverified load review, electrician license or utility coordination suppress quote advantage",()=>{
 for(const key of ["writtenLoadAssessment","contractorLicenseChecked","managedEquipmentReviewed","utilityCoordinationReviewed","sameChargingOutcome"]){
  for(const status of ["no","unsure"]){
   const r=audit({...good(),[key]:status});
   assert.equal(r.status,"needs-assessment",key);
   assert.equal(r.priceDifference,null,key);
  }
 }
 assert.equal(audit({...good(),electricianAssessment:"not-determined"}).status,"needs-assessment");
});
test("non-comparable quote bases and missing required scope disallow differences",()=>{
 const f=good();
 for(const patch of [
  {amount:null},{amount:0},{priceBasis:"unsure"},{priceBasis:"after-incentives"},
  {utilityBasis:"unsure"},{firstYearOngoingCost:null},{permitIncluded:"no"},
  {inspectionIncluded:"unsure"},{equipmentModelDocumented:"no"},
  {technicalScopeDocumented:"unsure"},{warrantyWritten:"no"}
 ]){
  const r=audit({...f,offers:[{...f.offers[0],...patch},f.offers[1]]});
  assert.equal(r.status,"needs-assessment",JSON.stringify(patch));
  assert.equal(r.priceDifference,null);
 }
});
test("quoted utility costs are added only when separate, with known zero and no double counting",()=>{
 const f=good();
 const managed={...f.offers[0],utilityBasis:"separate",additionalUtilityCost:400,firstYearOngoingCost:80};
 const upgrade={...f.offers[1],utilityBasis:"included",additionalUtilityCost:100000,firstYearOngoingCost:0};
 const r=audit({...f,offers:[managed,upgrade]});
 assert.equal(r.status,"compare");
 assert.equal(r.firstYearTotals.managed,2080);
 assert.equal(r.firstYearTotals.upgrade,6800); // included means no second addition
 assert.equal(r.priceDifference,4720);
 const blank=audit({...f,offers:[{...managed,additionalUtilityCost:null},upgrade]});
 assert.equal(blank.firstYearTotals.managed,null);assert.equal(blank.status,"needs-assessment");
});
test("reported first-year ongoing charges include subscription but not manufactured lifetime savings",()=>{
 const f=good();
 const a={...f.offers[0],firstYearOngoingCost:320};
 const b={...f.offers[1],firstYearOngoingCost:0};
 const r=audit({...f,offers:[a,b]});
 assert.equal(r.firstYearTotals.managed,1920);assert.equal(r.priceDifference,4880);
 assert.match(r.notes.join(" "),/Later years/);
});
test("equal quoted totals do not invent winner or vendor selection",()=>{
 const f=good();const r=audit({...f,offers:[f.offers[0],{...f.offers[1],amount:1600}]});
 assert.equal(r.status,"compare");assert.equal(r.priceDifference,0);assert.equal(r.lowerQuote,null);
});
test("negative, infinite, fractional-cent and invalid price fields fail closed",()=>{
 const f=good();
 for(const v of [-1,NaN,Infinity,-Infinity,79.999,1000000.01]){
  for(const field of ["amount","additionalUtilityCost","firstYearOngoingCost"]){
   const input={...f,offers:[{...f.offers[0],[field]:v},f.offers[1]]};
   const r=audit(input);
   assert.equal(r.status,"needs-assessment",field+" "+v);
   assert.equal(r.priceDifference,null);
  }
 }
 for(const val of [0.01,79.99,199.95,999999.99]){
  const r=audit({...f,offers:[{...f.offers[0],amount:val},f.offers[1]]});
  assert.equal(r.status,"compare",String(val));
 }
});
test("unsupported locations, property types, Level 1 and panel already ruled out never show alternatives",()=>{
 const cases=[
  {location:"unsure"},{location:"elsewhere"},{property:"multi-common"},
  {property:"multi-assigned"},{charge:"level1-existing"},
  {charge:"level1-new-outlet"},{panel:"not-proposed"},{ventilation:"unsure",property:"unsure"}
 ];
 for(const change of cases){
  const r=audit(good(),{...project,...change});
  assert.equal(r.status,"outside-scope",JSON.stringify(change));
  assert.equal(r.priceDifference,null);
 }
});
test("source snapshot expires after 30 days; malformed and backdated dates have no cost comparison",()=>{
 for(const date of ["2026-12-07","2026-11-05","2026-02-30","bad"]){
  const r=audit(good(),project,date);
  assert.notEqual(r.status,"compare",date);
  assert.equal(r.priceDifference,null);
 }
 assert.equal(audit(good(),project,"2026-12-06").status,"compare");
});
test("unsupported input shape, wrong offer identities and strange enum values never show price advantage",()=>{
 for(const v of [null,{},[],undefined,
  {...good(),electricianAssessment:"approved-for-500-amp"},
  {...good(),offers:[proposal("upgrade"),proposal("managed")]},
  {...good(),panelAmps:"1000"},
  {...good(),offers:[{...good().offers[0],permitIncluded:"maybe"},good().offers[1]]}
 ]){
  const r=audit(v);
  assert.equal(r.status,"needs-assessment");assert.equal(r.priceDifference,null);
 }
});
test("visitor reports, official sources and no private-data telemetry",()=>{
 const r=audit();const req=sanJosePanelRequest(r),report=sanJosePanelReport(r,good());
 assert.match(req,/LOAD|load/);assert.match(req,/PG&E/);
 assert.match(req,/cslb.ca.gov/);assert.match(req,/sanjoseca.gov/);
 assert.match(report,/5200/);assert.match(report,/No provider endorsement/);
 const ui=fs.readFileSync("src/components/san-jose-ev-panel-alternatives.tsx","utf8");
 const page=fs.readFileSync("src/app/california/san-jose-ev-charger/page.tsx","utf8");
 const layout=fs.readFileSync("src/app/layout.tsx","utf8");
 assert.match(page,/SanJoseEVPanelAlternatives/);
 assert.match(layout,/index: false/);
 assert.doesNotMatch(ui,/\btrack\(|\bfetch\(|localStorage|sessionStorage|sendBeacon|affiliate_id|utm_/);
 for(const [key,url] of Object.entries(SJ_PANEL_SOURCES)){
  assert.match(url,/^https:\/\//,key);
 }
 assert.equal(SJ_PANEL_REVIEWED,"2026-11-06");
});
