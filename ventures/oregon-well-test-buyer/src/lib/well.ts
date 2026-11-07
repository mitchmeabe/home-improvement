/**
 * Oregon private domestic-well laboratory purchasing screen.
 * Manual OHA/ORELAP source snapshot Nov 7, 2026; 30-day review gate.
 * No water-quality diagnosis, safe-to-drink determination, legal filing,
 * laboratory certification, live prices, lab booking or referral.
 */
export const REVIEWED_ON="2026-11-07";
export const MAX_SOURCE_AGE_DAYS=30;
export const SOURCES={
 routine:"https://www.oregon.gov/oha/ph/healthyenvironments/drinkingwater/sourcewater/domesticwellsafety/pages/testing-recommendations.aspx",
 transactions:"https://www.oregon.gov/oha/ph/healthyenvironments/drinkingwater/sourcewater/domesticwellsafety/pages/testing-regulations.aspx",
 statute:"https://www.oregonlegislature.gov/bills_laws/ors/ors448.html",
 labs:"https://www.oregon.gov/oha/ph/laboratoryservices/environmentallaboratoryaccreditation/pages/tni-lams.aspx",
 map:"https://www.oregon.gov/oha/ph/HealthyEnvironments/DrinkingWater/Monitoring/Pages/labs.aspx",
 accreditation:"https://www.oregon.gov/oha/PH/LaboratoryServices/EnvironmentalLaboratoryAccreditation/Pages/DrinkingWaterTesting.aspx",
 epa:"https://www.epa.gov/privatewells/protect-your-homes-water",
 hazards:"https://www.oregon.gov/oha/PH/HEALTHYENVIRONMENTS/DRINKINGWATER/SOURCEWATER/DOMESTICWELLSAFETY/Pages/Emergencies-Disasters-and-Wells.aspx"
} as const;
export type Answer="yes"|"no"|"unknown";
export type SourceType="domestic"|"municipal"|"spring"|"irrigation"|"new-well"|"unknown";
export type Purpose="routine"|"sale"|"problem"|"unknown";
export type UserRole="seller"|"buyer"|"owner"|"unknown";
export type AreaReview="clear-reviewed"|"concern"|"not-reviewed";
export type Analyte="coliform"|"nitrate"|"arsenic";
export const ANALYTES=["coliform","nitrate","arsenic"] as const;
export const ANALYTE_NAMES:Record<Analyte,string>={
 coliform:"Total coliform bacteria (routine: include E. coli)",
 nitrate:"Nitrate",
 arsenic:"Arsenic"
};
export type TestRecord={kind:"unknown"|"never"|"dated";sampledOn:string};
export type Records=Record<Analyte,TestRecord>;
export type Situation={
 source:SourceType;purpose:Purpose;role:UserRole;
 offerAccepted:Answer;areaReview:AreaReview;
 urgentConcern:Answer; // recent flood, illness, known contamination, damaged system etc.
 priorLabAccreditationConfirmed:Answer;
 priorSaleSamplingCompliant:Answer;
 records:Records;
};
export function emptyRecords():Records{return {coliform:{kind:"unknown",sampledOn:""},
 nitrate:{kind:"unknown",sampledOn:""},arsenic:{kind:"unknown",sampledOn:""}};}
export const START_SITUATION:Situation={
 source:"unknown",purpose:"unknown",role:"unknown",offerAccepted:"unknown",
 areaReview:"not-reviewed",urgentConcern:"unknown",
 priorLabAccreditationConfirmed:"unknown",priorSaleSamplingCompliant:"unknown",
 records:emptyRecords()
};
export type QuoteId="a"|"b";
export type CollectionMode="dropoff"|"mail"|"professional"|"unknown";
export type LabQuote={
 id:QuoteId;label:string;
 offeredTests:Record<Analyte,Answer>;
 eColiWithColiform:Answer;
 activeAccreditationForTests:Answer;
 acceptsPrivateSamples:Answer;
 instructionsAndContainers:Answer;
 holdingTimeArranged:Answer;
 resultsAndTurnaroundConfirmed:Answer;
 saleSamplingRulesConfirmed:Answer;
 mandatoryPrice:number|null;
 sampleCollectionAndDeliveryFee:number|null;
 otherMandatoryCharges:number|null;
 collectionMode:CollectionMode;
};
export function emptyQuote(id:QuoteId):LabQuote{return {
 id,label:"",offeredTests:{coliform:"unknown",nitrate:"unknown",arsenic:"unknown"},
 eColiWithColiform:"unknown",activeAccreditationForTests:"unknown",
 acceptsPrivateSamples:"unknown",instructionsAndContainers:"unknown",
 holdingTimeArranged:"unknown",resultsAndTurnaroundConfirmed:"unknown",
 saleSamplingRulesConfirmed:"unknown",mandatoryPrice:null,
 sampleCollectionAndDeliveryFee:null,otherMandatoryCharges:null,collectionMode:"unknown"
};}
export type Status="source-review"|"needs-context"|"not-covered"|"urgent-review"|
 "buyer-not-duty"|"needs-records"|"no-repeat"|"order-plan";
export type QuoteReview={
 id:QuoteId;status:"blocked"|"needs-information"|"ready-for-comparison";
 issues:string[];total:number|null;
};
export type Decision={
 status:Status;title:string;description:string;
 tests:Analyte[];possibleAddOns:string[];notes:string[];
 quoteReviews:[QuoteReview,QuoteReview];comparisonAllowed:boolean;
 costDifference:number|null;lowerQuote:QuoteId|null;reviewedOn:string;
 noLabApproval:true;noSafetyCertificate:true;noReferral:true;
};
const validDate=(date:string):boolean=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const value=Date.parse(date+"T00:00:00Z");
 return Number.isFinite(value)&&new Date(value).toISOString().slice(0,10)===date;
};
const dateUTC=(d:string)=>Date.parse(d+"T00:00:00Z");
export function sourceFresh(asOf:string):boolean{
 return validDate(asOf)&&validDate(REVIEWED_ON)&&dateUTC(asOf)>=dateUTC(REVIEWED_ON)&&
  dateUTC(asOf)-dateUTC(REVIEWED_ON)<=MAX_SOURCE_AGE_DAYS*86400000;
}
/** Inclusive month/year anniversary, avoids treating a legal calendar year as an invented fixed 365-day window. */
export function withinYears(date:string,asOf:string,years:number):boolean{
 if(!validDate(date)||!validDate(asOf)||dateUTC(date)>dateUTC(asOf))return false;
 const [y,m,d]=date.split("-").map(Number),a=new Date(Date.UTC(y+years,m-1,d));
 // Feb 29 uses the final day of February in a non-leap anniversary year.
 if(m===2&&d===29&&a.getUTCMonth()!==1)a.setUTCDate(0);
 return dateUTC(asOf)<=a.getTime();
}
const enumIncludes=(value:unknown,values:readonly string[]):value is string=>typeof value==="string"&&values.includes(value);
const money=(v:unknown):v is number=>typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=100000&&
 Math.abs(v*100-Math.round(v*100))<1e-5;
const answer=(v:unknown)=>v==="yes"||v==="no"||v==="unknown";
function validSituation(x:unknown,asOf:string):x is Situation{
 if(!x||typeof x!=="object"||Array.isArray(x))return false;
 const s=x as Situation;
 if(!enumIncludes(s.source,["domestic","municipal","spring","irrigation","new-well","unknown"])||
 !enumIncludes(s.purpose,["routine","sale","problem","unknown"])||
 !enumIncludes(s.role,["seller","buyer","owner","unknown"])||
 !enumIncludes(s.areaReview,["clear-reviewed","concern","not-reviewed"])||
 !answer(s.offerAccepted)||!answer(s.urgentConcern)||
 !answer(s.priorLabAccreditationConfirmed)||!answer(s.priorSaleSamplingCompliant)||
 !s.records||typeof s.records!=="object")return false;
 return ANALYTES.every(id=>{
  const r=s.records[id];
  return r&&enumIncludes(r.kind,["unknown","never","dated"])&&typeof r.sampledOn==="string"&&
   (r.kind!=="dated"||(validDate(r.sampledOn)&&dateUTC(r.sampledOn)<=dateUTC(asOf)));
 });
}
function validQuote(x:unknown,id:QuoteId):x is LabQuote{
 if(!x||typeof x!=="object"||Array.isArray(x))return false;
 const q=x as LabQuote;
 return q.id===id&&typeof q.label==="string"&&q.label.length<=90&&
 q.offeredTests&&typeof q.offeredTests==="object"&&
 ANALYTES.every(k=>answer(q.offeredTests[k]))&&
 [q.eColiWithColiform,q.activeAccreditationForTests,q.acceptsPrivateSamples,
 q.instructionsAndContainers,q.holdingTimeArranged,q.resultsAndTurnaroundConfirmed,
 q.saleSamplingRulesConfirmed].every(answer)&&
 enumIncludes(q.collectionMode,["dropoff","mail","professional","unknown"])&&
 [q.mandatoryPrice,q.sampleCollectionAndDeliveryFee,q.otherMandatoryCharges].every(v=>v===null||money(v));
}
function reviewQuote(q:LabQuote,tests:readonly Analyte[],isSale:boolean):QuoteReview{
 const issues:string[]=[];
 for(const t of tests)if(q.offeredTests[t]!=="yes")
  issues.push("Confirm that the written lab order includes "+ANALYTE_NAMES[t]+".");
 if(tests.includes("coliform")&&!isSale&&q.eColiWithColiform!=="yes")
  issues.push("Routine coliform panel should include E. coli reporting; verify before ordering.");
 for(const [k,text] of [
  ["activeAccreditationForTests","Verify current ORELAP accreditation for each needed analyte and method, not only the laboratory name."],
  ["acceptsPrivateSamples","Confirm that this lab accepts consumer private-well samples."],
  ["instructionsAndContainers","Get correct laboratory bottles, preservation instructions and sample-collection protocol."],
  ["holdingTimeArranged","Confirm each analyte's actual holding time and feasible handoff/delivery window."],
  ["resultsAndTurnaroundConfirmed","Get written results format and lab turnaround timing."],
  ...(isSale?[["saleSamplingRulesConfirmed","Verify Oregon real-estate collection rules OAR 333-061-0335 with the laboratory."]]:[])
 ] as [keyof LabQuote,string][])if(q[k]!=="yes")issues.push(text);
 if(q.collectionMode==="unknown")issues.push("Confirm professional sampling, lab dropoff or shipping route; do not compare different collection arrangements.");
 if(q.mandatoryPrice===null||q.sampleCollectionAndDeliveryFee===null||
  q.otherMandatoryCharges===null)issues.push("Written total is incomplete: base tests, collection/delivery and mandatory fees must each be confirmed (zero only when confirmed).");
 const total=issues.length===0?Math.round((q.mandatoryPrice!+
  q.sampleCollectionAndDeliveryFee!+q.otherMandatoryCharges!)*100)/100:null;
 return {id:q.id,status:issues.length?"needs-information":"ready-for-comparison",issues,total};
}
const blocked=(id:QuoteId):QuoteReview=>({id,status:"blocked",issues:[],total:null});
function make(status:Status,title:string,description:string,tests:Analyte[],notes:string[],quotes:unknown,
 addOns:string[]=[]):Decision{
 let qr:[QuoteReview,QuoteReview]=[blocked("a"),blocked("b")],allowed=false,low:QuoteId|null=null,diff:number|null=null;
 if(status==="order-plan"&&tests.length&&Array.isArray(quotes)&&quotes.length===2&&
 validQuote(quotes[0],"a")&&validQuote(quotes[1],"b")){
  qr=[reviewQuote(quotes[0],tests,description.includes("real estate")),
      reviewQuote(quotes[1],tests,description.includes("real estate"))];
  allowed=qr.every(q=>q.status==="ready-for-comparison")&&
   quotes[0].collectionMode===quotes[1].collectionMode;
  if(!allowed&&qr.every(q=>q.status==="ready-for-comparison"))
   qr=qr.map(q=>({...q,status:"needs-information",issues:[...q.issues,"Collection methods differ; compare quotes with the same collection service."]})) as [QuoteReview,QuoteReview];
  if(allowed){
   diff=Math.round(Math.abs(qr[0].total!-qr[1].total!)*100)/100;
   low=qr[0].total!<qr[1].total!?"a":qr[1].total!<qr[0].total!?"b":null;
  }
 }
 return {status,title,description,tests,possibleAddOns:addOns,notes,quoteReviews:qr,
  comparisonAllowed:allowed,costDifference:diff,lowerQuote:low,
  reviewedOn:REVIEWED_ON,noLabApproval:true,noSafetyCertificate:true,noReferral:true};
}
const BASE_NOTE="These tests do not certify that water is safe to drink or exclude every possible contaminant. If the well has contamination or unusual conditions, contact your county health department or Oregon Health Authority before selecting add-ons.";
const SALE_NOTE="Seller or designee must supply results to buyer and send the Oregon RET form plus results to OHA within 90 days of receiving results. This app does not complete, submit or certify that reporting.";
export function screenWell(raw:unknown,quotes:unknown,asOf=REVIEWED_ON):Decision{
 if(!sourceFresh(asOf))return make("source-review","State source review is overdue",
  "Pause legal and lab-purchase recommendations until Oregon OHA and ORELAP sources are rechecked.",[],[],quotes);
 if(!validSituation(raw,asOf))return make("needs-context","Resolve incomplete or invalid inputs",
  "Check your well type, purpose and sample dates before comparing laboratories.",[],[],quotes);
 const x=raw as Situation;
 if(x.source==="unknown"||x.purpose==="unknown")
  return make("needs-context","Confirm well type and testing purpose",
   "Oregon public-water and domestic-well rules differ. No sample order is inferred.",[],[],quotes);
 if(x.source!=="domestic")return make("not-covered","Different water source: use the correct program",
  "This pilot covers an existing Oregon domestic groundwater well used for household water. Municipal service, spring supply, irrigation-only supplies and new well construction require separate guidance. This is not a conclusion that testing is unnecessary.",[],
  ["Oregon's domestic-well real-estate testing rule exempts specified spring, irrigation-only and undeveloped-land cases; confirm facts with OHA for any sale."],quotes);
 if(x.purpose==="problem"||x.urgentConcern==="yes"||x.areaReview==="concern")
  return make("urgent-review","Seek situation-specific contaminant and safety guidance before ordering",
   "A contamination concern, unusual water event, flood, recent system failure or a declared area of concern needs tailored advice. No generic triad or safe-to-drink result is sufficient.",[],
   ["Contact county environmental health or OHA Domestic Well Safety; if water may be contaminated, follow their interim drinking-water advice. Do not rely on this calculator to determine potability or treatment.",
    "An area of public-health concern can trigger additional real-estate tests beyond the usual three."],quotes);
 if(x.purpose==="sale"&&x.role!=="seller"){
  return make(x.role==="buyer"?"buyer-not-duty":"needs-context",
   x.role==="buyer"?"Oregon generally places required sale testing on the seller":"Confirm whether you are responsible for the seller's testing",
   "For a qualifying Oregon domestic-well property sale, the seller or chosen representative is responsible for tests and reporting. As buyer, request the seller's valid laboratory results and seek separate advice before purchasing your own duplicate tests.",
   [],[SALE_NOTE,BASE_NOTE],quotes);
 }
 if(x.purpose==="routine"&&x.role==="unknown")
  return make("needs-context","Confirm routine well-owner testing context",
   "A household user may order voluntary testing; this does not establish a legal transaction duty.",[],[],quotes);
 if(x.purpose==="sale"&&x.areaReview!=="clear-reviewed")
  return make("needs-context","Check whether OHA requires extra tests for this well's area",
   "Arsenic, nitrate and total coliform form Oregon's standard real-estate panel, but designated areas of public-health concern may require more. Check county/OHA guidance before ordering or labeling a test panel complete.",
   ["coliform","nitrate","arsenic"],[SALE_NOTE,BASE_NOTE],quotes);
 const isSale=x.purpose==="sale";
 const needed:Analyte[]=[];
 const unknown:Analyte[]=[];
 const notes:string[]=[];
 for(const a of ANALYTES){
  const r=x.records[a];
  if(r.kind==="unknown"){unknown.push(a);continue;}
  if(r.kind==="never"){needed.push(a);continue;}
  if(isSale){if(!withinYears(r.sampledOn,asOf,1))needed.push(a);}
  else if(a==="arsenic"){
   if(!withinYears(r.sampledOn,asOf,3)){
    needed.push(a);notes.push("OHA recommends arsenic every 3–5 years; at three years this is a conservative recommendation, not a legal deadline.");
   }
  }else if(!withinYears(r.sampledOn,asOf,1))needed.push(a);
 }
 if(unknown.length)return make("needs-records","Review the previous lab results before paying again",
  "Previous test dates are unknown for: "+unknown.map(a=>ANALYTE_NAMES[a]).join(", ")+". Verify whether those analytes were already tested within Oregon's applicable interval. Missing records are not proof a new kit is necessary.",
  needed,[...notes,isSale?SALE_NOTE:BASE_NOTE],quotes);
 if(isSale){
  if(x.priorLabAccreditationConfirmed!=="yes"||x.priorSaleSamplingCompliant!=="yes"){
   // Existing samples cannot be blindly credited toward a legal sale package.
   if(needed.length<3)return make("needs-records","Confirm prior legal sample quality before buying partial repeats",
    "Existing within-year results cannot yet be treated as reusable for the sale until the laboratory's analyte accreditation and compliant sample collection have been checked. Ask OHA/lab before duplicating tests.",
    needed,[SALE_NOTE,BASE_NOTE],quotes);
  }
  if(!needed.length)return make("no-repeat","No duplicate laboratory purchase indicated by the recorded results",
   "All three required tests have dates within one year, with user-confirmed accredited analysis and correct sale collection. Verify that these exact results are legally reusable for this transaction; the seller still has reporting obligations.",
   [],[SALE_NOTE,BASE_NOTE],quotes);
  return make("order-plan","Request only the missing real-estate well-water tests",
   "This is a provisional real estate seller test-order worksheet, not proof of compliance. Ask an ORELAP-accredited laboratory to confirm partial-result reuse, correct collection and all required analytes.",
   needed,[SALE_NOTE,"An accepted offer triggers the statutory testing obligation; before acceptance this is advance planning, not an immediate legally due sale package.",
    "Recent prior results count only if the lab and compliant collection documentation are acceptable.",BASE_NOTE],quotes);
 }
 if(!needed.length)return make("no-repeat","Recent routine records suggest no repeat core tests are due now",
  "OHA's ordinary annual coliform/E. coli and nitrate and 3–5-year arsenic intervals are based on previous test dates you entered. This does NOT verify safe water or rule out other contaminants.",
  [],[BASE_NOTE,"EPA also recommends checking pH and total dissolved solids annually; consult the county for additional local risks."],quotes);
 return make("order-plan","Build a targeted routine private-well lab request",
  "These are Oregon OHA testing recommendations, not a mandated consumer purchase. Confirm that every analyte is within the laboratory's current accreditation and sample-handling scope.",
  needed,[...notes,BASE_NOTE,"Routine results normally do not need to be reported to OHA."],quotes,
  ["EPA also recommends pH and total dissolved solids (TDS) annually; these are optional considerations here, not Oregon's three real-estate analytes.",
   "Ask the county about area-specific hazards (for example, pesticides or metals); never infer them just from an unverified ZIP code."]);
}
export function makeWellRequest(result:Decision):string{
 return ["OREGON PRIVATE WELL — NEUTRAL LAB TEST-ORDER REQUEST",
  "Decision state: "+result.status,"Official source reviewed: "+REVIEWED_ON,result.title,result.description,
  "Requested analyses:",...(result.tests.length?result.tests.map(x=>"• "+ANALYTE_NAMES[x]):["No immediate laboratory order determined."]),
  "Please quote in writing: laboratory accreditation by analyte/method, collection bottles/preservation, exact sample handling/holding times, shipping or dropoff, separate mandatory fees, results turnaround, and if applicable Oregon real-estate collection compliance.",
  "Confirm your laboratory accepts owner-supplied domestic-well samples.",
  ...result.notes.map(x=>"NOTE: "+x),...result.possibleAddOns.map(x=>"OPTIONAL: "+x),
  "Public ORELAP search: "+SOURCES.labs,
  "OHA real estate sale guidance: "+SOURCES.transactions,
  "OHA routine testing: "+SOURCES.routine,
  "This document is neither a lab order nor an OHA filing. No sampling or compliance approved by this website."].join("\n");
}
export function makeWellComparison(result:Decision,quotes:[LabQuote,LabQuote]):string{
 return [makeWellRequest(result),"",
 "USER-ENTERED LABORATORY QUOTE AUDIT — NO LAB ACCREDITATION VERIFIED",
 ...quotes.flatMap((q,i)=>["Quote "+q.id.toUpperCase()+" — "+q.label,
  "Collection: "+q.collectionMode,
  "Test price: "+(q.mandatoryPrice??"unknown")+", delivery/collection: "+(q.sampleCollectionAndDeliveryFee??"unknown")+", fees: "+(q.otherMandatoryCharges??"unknown"),
  "Comparison subtotal: "+(result.quoteReviews[i].total??"not verified"),
  ...result.quoteReviews[i].issues.map(x=>"CHECK: "+x)]),
 "Comparable: "+result.comparisonAllowed,
 "Conditional absolute quote difference: "+(result.costDifference??"not calculated"),
 "Lower self-reported offer: "+(result.lowerQuote??"none"),"No lab endorsement, safety decision, booking or referral."
 ].join("\n");
}
