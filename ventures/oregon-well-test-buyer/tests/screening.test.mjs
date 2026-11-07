import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
 ANALYTES,START_SITUATION,emptyRecords,emptyQuote,screenWell,
 sourceFresh,withinYears,REVIEWED_ON,MAX_SOURCE_AGE_DAYS,
 makeWellRequest,makeWellComparison,SOURCES
} from "../src/lib/well.ts";

const never=()=>({coliform:{kind:"never",sampledOn:""},nitrate:{kind:"never",sampledOn:""},arsenic:{kind:"never",sampledOn:""}});
const dated=(date)=>({kind:"dated",sampledOn:date});
const situation=(patch={})=>({
 ...START_SITUATION,source:"domestic",purpose:"routine",role:"owner",
 offerAccepted:"no",urgentConcern:"no",areaReview:"clear-reviewed",
 records:never(),priorLabAccreditationConfirmed:"unknown",priorSaleSamplingCompliant:"unknown",
 ...patch
});
const sale=(patch={})=>situation({purpose:"sale",role:"seller",offerAccepted:"yes",...patch});
const quote=(id,patch={})=>({
 ...emptyQuote(id),label:"Offer "+id,offeredTests:{coliform:"yes",nitrate:"yes",arsenic:"yes"},
 eColiWithColiform:"yes",activeAccreditationForTests:"yes",
 acceptsPrivateSamples:"yes",instructionsAndContainers:"yes",holdingTimeArranged:"yes",
 resultsAndTurnaroundConfirmed:"yes",saleSamplingRulesConfirmed:"yes",
 mandatoryPrice:id==="a"?70:85,sampleCollectionAndDeliveryFee:10,otherMandatoryCharges:0,
 collectionMode:"dropoff",...patch
});
const screen=(s=situation(),q=[quote("a"),quote("b")],date=REVIEWED_ON)=>screenWell(s,q,date);

test("routine OHA panel requests coliform E. coli, nitrate and arsenic after no previous tests",()=>{
 const r=screen();assert.equal(r.status,"order-plan");
 assert.deepEqual(r.tests,["coliform","nitrate","arsenic"]);
 assert.match(r.description,/recommendations, not a mandated/i);
 assert.ok(r.possibleAddOns.some(x=>/pH and total dissolved solids/.test(x)));
 assert.equal(r.noSafetyCertificate,true);assert.equal(r.noReferral,true);assert.equal(r.noLabApproval,true);
});
test("Oregon mandatory property sale includes arsenic nitrate and total coliform, not pH or TDS",()=>{
 const r=screen(sale());
 assert.equal(r.status,"order-plan");
 assert.deepEqual(r.tests,["coliform","nitrate","arsenic"]);
 assert.equal(r.possibleAddOns.length,0);
 assert.match(r.notes.join(" "),/within 90 days/);
 assert.match(r.notes.join(" "),/accepted offer/);
 assert.match(r.description,/real estate seller/);
});
test("seller with all three recent compliant accredited results has no duplicate test order",()=>{
 const recent={coliform:dated("2026-09-01"),nitrate:dated("2026-09-01"),arsenic:dated("2026-09-01")};
 const r=screen(sale({records:recent,priorLabAccreditationConfirmed:"yes",priorSaleSamplingCompliant:"yes"}));
 assert.equal(r.status,"no-repeat");assert.deepEqual(r.tests,[]);
 assert.equal(r.comparisonAllowed,false);
 assert.match(r.notes.join(" "),/still|90 days/i);
});
test("one-year sale reuse is not falsely inferred without accreditation and collection proof",()=>{
 const r=screen(sale({records:{coliform:dated("2026-01-01"),nitrate:dated("2026-01-01"),arsenic:dated("2026-01-01")}}));
 assert.equal(r.status,"needs-records");assert.equal(r.comparisonAllowed,false);
 assert.match(r.description,/accreditation and compliant sample collection/i);
});
test("sale with one expired result orders only missing analyte if previous test validity documented",()=>{
 const records={coliform:dated("2026-01-01"),nitrate:dated("2025-07-01"),arsenic:dated("2026-01-01")};
 const r=screen(sale({records,priorLabAccreditationConfirmed:"yes",priorSaleSamplingCompliant:"yes"}));
 assert.equal(r.status,"order-plan");assert.deepEqual(r.tests,["nitrate"]);
 assert.equal(r.quoteReviews[0].status,"ready-for-comparison");
 assert.equal(r.comparisonAllowed,true);
});
test("unknown prior test records are not treated as missing or never-tested",()=>{
 const r=screen(situation({records:emptyRecords()}));
 assert.equal(r.status,"needs-records");assert.equal(r.tests.length,0);
 assert.equal(r.comparisonAllowed,false);
 assert.match(r.description,/not proof/i);
});
test("rutine prior fresh annual and arsenic records return no repeat; routine never legally mandatory",()=>{
 const r=screen(situation({records:{coliform:dated("2026-02-01"),nitrate:dated("2026-02-01"),arsenic:dated("2025-05-01")}}));
 assert.equal(r.status,"no-repeat");assert.deepEqual(r.tests,[]);
 assert.equal(r.comparisonAllowed,false);
 assert.match(r.description,/does NOT verify safe water/);
});
test("routine timed intervals: annual tests, arsenic at 3 years, 3–5 year not legal deadline",()=>{
 const records={coliform:dated("2025-10-01"),nitrate:dated("2026-09-01"),arsenic:dated("2023-10-01")};
 const r=screen(situation({records}));
 assert.equal(r.status,"order-plan");assert.deepEqual(r.tests,["coliform","arsenic"]);
 assert.match(r.notes.join(" "),/conservative recommendation, not a legal deadline/);
 assert.equal(withinYears("2025-11-07","2026-11-07",1),true);
 assert.equal(withinYears("2025-11-06","2026-11-07",1),false);
 assert.equal(withinYears("2023-11-07","2026-11-07",3),true);
 assert.equal(withinYears("2023-11-06","2026-11-07",3),false);
});
test("leap-day anniversary uses Feb 28 in non-leap year and never accepts impossible dates",()=>{
 assert.equal(withinYears("2024-02-29","2025-02-28",1),true);
 assert.equal(withinYears("2024-02-29","2025-03-01",1),false);
 assert.equal(withinYears("2026-02-30","2026-11-07",1),false);
 assert.equal(withinYears("2027-01-01","2026-11-07",1),false);
});
test("buyer's sale intent does not create statutory seller lab purchase",()=>{
 const r=screen(sale({role:"buyer"}));
 assert.equal(r.status,"buyer-not-duty");assert.deepEqual(r.tests,[]);
 assert.equal(r.comparisonAllowed,false);assert.match(r.description,/seller or chosen representative/);
});
test("not yet accepted offer remains advance planning and unknown acceptance prevents sale obligations",()=>{
 const before=screen(sale({offerAccepted:"no"}));
 assert.equal(before.status,"order-plan");assert.match(before.notes.join(" "),/advance planning/);
 const unknown=screen(sale({offerAccepted:"unknown"}));
 assert.equal(unknown.status,"needs-context");assert.equal(unknown.comparisonAllowed,false);
});
test("unknown designated-area status blocks 'complete' sale panel until county review",()=>{
 const r=screen(sale({areaReview:"not-reviewed"}));
 assert.equal(r.status,"needs-context");assert.deepEqual(r.tests,["coliform","nitrate","arsenic"]);
 assert.equal(r.comparisonAllowed,false);
 assert.match(r.description,/may require more/);
});
test("known contamination or flood overrides standard package and prevents 'safe' claims",()=>{
 for(const p of [
  {purpose:"problem"},{urgentConcern:"yes"},{areaReview:"concern"}
 ]){
  const r=screen(situation(p));assert.equal(r.status,"urgent-review");
  assert.deepEqual(r.tests,[]);assert.equal(r.comparisonAllowed,false);
  assert.match(r.notes.join(" "),/county environmental health/);
 }
 const unknown=screen(situation({urgentConcern:"unknown"}));
 assert.equal(unknown.status,"needs-context");assert.equal(unknown.comparisonAllowed,false);
});
test("municipal, spring, irrigation-only and new well are not incorrectly sold normal domestic kit",()=>{
 for(const source of ["municipal","spring","irrigation","new-well"]){
  const r=screen(situation({source}));assert.equal(r.status,"not-covered",source);
  assert.deepEqual(r.tests,[]);assert.match(r.description,/not a conclusion that testing is unnecessary/);
 }
});
test("both matching lab quotes with confirmed sampling and all fees compare exactly",()=>{
 const r=screen(sale());
 assert.equal(r.quoteReviews[0].total,80);assert.equal(r.quoteReviews[1].total,95);
 assert.equal(r.comparisonAllowed,true);assert.equal(r.costDifference,15);assert.equal(r.lowerQuote,"a");
 assert.equal(r.noLabApproval,true);assert.equal(r.noSafetyCertificate,true);
 const equal=screen(sale(),[quote("a"),quote("b",{mandatoryPrice:70})]);
 assert.equal(equal.comparisonAllowed,true);assert.equal(equal.costDifference,0);assert.equal(equal.lowerQuote,null);
});
test("not-yet-confirmed analytes, accreditation and sampling scope suppress price ranking",()=>{
 const fields=["activeAccreditationForTests","acceptsPrivateSamples","instructionsAndContainers",
 "holdingTimeArranged","resultsAndTurnaroundConfirmed","saleSamplingRulesConfirmed"];
 for(const key of fields)for(const value of ["no","unknown"]){
  const r=screen(sale(),[quote("a"),quote("b",{[key]:value})]);
  assert.equal(r.comparisonAllowed,false,key+" "+value);
  assert.equal(r.costDifference,null);
 }
 for(const analyte of ANALYTES){
  const b=quote("b");b.offeredTests[analyte]="no";
  const r=screen(sale(),[quote("a"),b]);
  assert.equal(r.comparisonAllowed,false,analyte);
 }
});
test("routine coliform/E. coli reporting required for apples-to-apples lab quote check",()=>{
 for(const x of ["no","unknown"]){
  const r=screen(situation(),[quote("a"),quote("b",{eColiWithColiform:x})]);
  assert.equal(r.comparisonAllowed,false,x);
 }
 assert.equal(screen(situation()).comparisonAllowed,true);
});
test("unknown additional fees are not zero and shipping vs dropoff are not equivalent",()=>{
 const a=quote("a"),b=quote("b");
 for(const key of ["mandatoryPrice","sampleCollectionAndDeliveryFee","otherMandatoryCharges"]){
  const r=screen(sale(),[a,{...b,[key]:null}]);
  assert.equal(r.comparisonAllowed,false);assert.equal(r.quoteReviews[1].total,null);
 }
 const mode=screen(sale(),[a,{...b,collectionMode:"mail"}]);
 assert.equal(mode.comparisonAllowed,false);assert.equal(mode.quoteReviews[1].status,"needs-information");
});
test("dollar amounts accept exact cents, add mandatory fees once, never rank negative or invalid",()=>{
 const a=quote("a",{mandatoryPrice:99.95,sampleCollectionAndDeliveryFee:3.21,otherMandatoryCharges:2.35});
 const b=quote("b",{mandatoryPrice:105.50,sampleCollectionAndDeliveryFee:0,otherMandatoryCharges:0});
 const r=screen(sale(),[a,b]);
 assert.equal(r.comparisonAllowed,true);assert.equal(r.quoteReviews[0].total,105.51);
 assert.equal(r.costDifference,.01);assert.equal(r.lowerQuote,"b");
 for(const bad of [NaN,Infinity,-1,100.001,100000.01]){
  for(const field of ["mandatoryPrice","sampleCollectionAndDeliveryFee","otherMandatoryCharges"]){
   const other=screen(sale(),[a,{...b,[field]:bad}]);
   assert.equal(other.comparisonAllowed,false,String(field)+" "+bad);
   assert.equal(other.quoteReviews[1].status,"blocked");
  }
 }
});
test("dated results later than today, malformed shapes and stale source snapshots fail closed",()=>{
 const invalid=screen(situation({records:{...never(),nitrate:dated("2027-01-01")}}));
 assert.equal(invalid.status,"needs-context");
 for(const x of [null,[],{},undefined,{...situation(),source:"chemically-clean"}]){
  const r=screenWell(x,[quote("a"),quote("b")],"2026-11-07");
  assert.equal(r.status,"needs-context");assert.equal(r.comparisonAllowed,false);
 }
 assert.equal(MAX_SOURCE_AGE_DAYS,30);assert.equal(REVIEWED_ON,"2026-11-07");
 assert.equal(sourceFresh("2026-12-07"),true);
 for(const asOf of ["2026-12-08","2026-11-06","2026-02-30","bad"]){
  const r=screen(sale(),[quote("a"),quote("b")],asOf);
  assert.equal(r.status,"source-review");assert.equal(r.comparisonAllowed,false);
 }
});
test("exported neutral lab request and quote audit contain official sources, requirements, no booking",()=>{
 const s=screen(sale()),q=[quote("a"),quote("b")];
 const req=makeWellRequest(s),cmp=makeWellComparison(s,q);
 assert.match(req,/Total coliform/);assert.match(req,/OHA/);
 assert.match(req,/oregon.gov/);assert.match(req,/No sampling or compliance approved/);
 assert.match(cmp,/80/);assert.match(cmp,/95/);
 assert.match(cmp,/No lab endorsement/);
});
test("across source, purpose, area and role combinations no fake price winner for restricted cases",()=>{
 let n=0;
 for(const source of ["domestic","municipal","spring","irrigation","new-well","unknown"])
 for(const purpose of ["routine","sale","problem","unknown"])
 for(const role of ["owner","buyer","seller","unknown"])
 for(const areaReview of ["clear-reviewed","concern","not-reviewed"]){
  const s=situation({source,purpose,role,areaReview});
  const r=screen(s);
  assert.equal(r.noReferral,true);assert.equal(r.noSafetyCertificate,true);
  if(source!=="domestic"||purpose==="problem"||purpose==="unknown"||areaReview==="concern"){
   assert.equal(r.comparisonAllowed,false,JSON.stringify({source,purpose,role,areaReview}));
  }
  if(purpose==="sale"&&role==="buyer")assert.equal(r.comparisonAllowed,false);
  n++;
 }
 assert.equal(n,6*4*4*3);
});
test("no personal user data, treatment order, referral tracking or non-government lab seller links",()=>{
 const ui=fs.readFileSync("src/WellApp.tsx","utf8");
 const engine=fs.readFileSync("src/lib/well.ts","utf8");
 const html=fs.readFileSync("index.html","utf8");
 const robot=fs.readFileSync("public/robots.txt","utf8");
 assert.match(html,/noindex,nofollow/);assert.match(robot,/Disallow: \/$/m);
 assert.doesNotMatch(ui+engine,/\bfetch\(|\bsendBeacon\(|\blocalStorage\b|\bsessionStorage\b|affiliate_id|\btrack\(|utm_source/);
 for(const [key,url] of Object.entries(SOURCES))assert.match(url,/^(https:\/\/www\.oregon\.gov|https:\/\/www\.oregonlegislature\.gov|https:\/\/www\.epa\.gov)/,key);
});
