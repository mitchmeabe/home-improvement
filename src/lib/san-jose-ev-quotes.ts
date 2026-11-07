/**
 * San José EV installation bid reconciliation. Browser-memory inputs only.
 * No engineering load calculation, permit issuance, incentive award or partner referral.
 */
import {SJ_EV_SOURCES,type SJInput,type SJOutcome} from "./san-jose-ev.ts";

export type EVQuoteId="a"|"b";
export type EVAnswer="yes"|"no"|"unsure";
export type EVScope="new-120v"|"level2-dedicated"|"level2-managed"|"level2-panel-work"|"unsure";
export type EVPriceBasis="before-incentives"|"after-incentives"|"unsure";
export type EVQuoteWorkKey="equipmentIncluded"|"wiringIncluded"|"electricalPermitIncluded"|
  "inspectionIncluded"|"panelWorkIncluded"|"trenchingIncluded"|"mechanicalPermitIncluded";
export type EVQuoteEvidenceKey="loadReviewDocumented"|"managedChargingDocumented"|
  "panelRationaleDocumented"|"equipmentModelDocumented"|"warrantyWritten";
export interface EVQuote {
  id:EVQuoteId;
  amount:number|null;
  basis:EVPriceBasis;
  scope:EVScope;
  equipmentIncluded:EVAnswer;
  wiringIncluded:EVAnswer;
  electricalPermitIncluded:EVAnswer;
  inspectionIncluded:EVAnswer;
  panelWorkIncluded:EVAnswer;
  trenchingIncluded:EVAnswer;
  mechanicalPermitIncluded:EVAnswer;
  loadReviewDocumented:EVAnswer;
  managedChargingDocumented:EVAnswer;
  panelRationaleDocumented:EVAnswer;
  equipmentModelDocumented:EVAnswer;
  warrantyWritten:EVAnswer;
}
export interface EVQuoteResult {
  status:"not-applicable"|"needs-information"|"scope-mismatch"|"comparable";
  headline:string;
  explanation:string;
  lowest:EVQuoteId|null;
  quotedPriceGap:number|null;
  issues:string[];
  differences:string[];
  perQuote:Record<EVQuoteId,string[]>;
  /** Never implies permitting approval, a correct load design, or a best contractor. */
  noEngineeringApproval:true;
  noAffiliate:true;
}
export const EV_WORK_FIELDS:ReadonlyArray<{key:EVQuoteWorkKey;label:string}>=[
 {key:"equipmentIncluded",label:"Charging equipment / EVSE"},
 {key:"wiringIncluded",label:"New circuit, outlet and wiring work"},
 {key:"electricalPermitIncluded",label:"City electrical permit and fee"},
 {key:"inspectionIncluded",label:"Scheduling and closing required inspection"},
 {key:"panelWorkIncluded",label:"Service-panel change"},
 {key:"trenchingIncluded",label:"Trenching or other material site work"},
 {key:"mechanicalPermitIncluded",label:"Additional mechanical permit, if applicable"},
];
export const EV_EVIDENCE_FIELDS:ReadonlyArray<{key:EVQuoteEvidenceKey;label:string}>=[
 {key:"loadReviewDocumented",label:"Written load assessment / basis for available capacity"},
 {key:"managedChargingDocumented",label:"Managed-charging equipment and controls documented"},
 {key:"panelRationaleDocumented",label:"Written reason a panel change is necessary"},
 {key:"equipmentModelDocumented",label:"Exact charging equipment model and compatibility"},
 {key:"warrantyWritten",label:"Equipment and workmanship warranties in writing"},
];
const humanScope:Record<EVScope,string>={
 "new-120v":"New 120 V outlet for Level 1",
 "level2-dedicated":"Level 2 equipment and dedicated circuit, no panel change",
 "level2-managed":"Level 2 equipment with proposed managed-charging controls",
 "level2-panel-work":"Level 2 equipment including a proposed service-panel change",
 "unsure":"Scope not identified",
};
export function newEVQuote(id:EVQuoteId):EVQuote{
 return {
  id,amount:null,basis:"unsure",scope:"unsure",
  equipmentIncluded:"unsure",wiringIncluded:"unsure",electricalPermitIncluded:"unsure",
  inspectionIncluded:"unsure",panelWorkIncluded:"unsure",trenchingIncluded:"unsure",
  mechanicalPermitIncluded:"unsure",loadReviewDocumented:"unsure",
  managedChargingDocumented:"unsure",panelRationaleDocumented:"unsure",
  equipmentModelDocumented:"unsure",warrantyWritten:"unsure",
 };
}
function amountOK(value:number|null):value is number{
 return typeof value==="number"&&Number.isFinite(value)&&value>0&&value<=1000000&&
   Math.abs(Math.round(value*100)-value*100)<1e-6;
}
function validStatus(s:unknown):s is EVAnswer{return s==="yes"||s==="no"||s==="unsure";}
function validScope(s:unknown):s is EVScope{return Object.hasOwn(humanScope,String(s));}
function validBasis(s:unknown):s is EVPriceBasis{return s==="before-incentives"||s==="after-incentives"||s==="unsure";}
const roundCents=(v:number)=>Math.round(v*100)/100;
function result(status:EVQuoteResult["status"],headline:string,explanation:string,issues:string[],
 differences:string[],perQuote:Record<EVQuoteId,string[]>,lowest:EVQuoteId|null=null,quotedPriceGap:number|null=null):EVQuoteResult{
 return {status,headline,explanation,issues,differences,perQuote,lowest,quotedPriceGap,
  noEngineeringApproval:true,noAffiliate:true};
}
export function compareSanJoseEVQuotes(plan:SJInput,permit:SJOutcome,quotes:readonly EVQuote[]):EVQuoteResult{
 const warnings:Record<EVQuoteId,string[]>={a:[],b:[]};
 if(permit.status!=="electrical-permit"||plan.location!=="city-verified"||
    (plan.property!=="single-duplex"&&plan.property!=="multi-assigned")||
    (plan.charge!=="level1-new-outlet"&&plan.charge!=="level2"))
  return result("not-applicable","Confirm the project before comparing bids",
    "Only covered new electrical work in verified San José city jurisdiction can use this comparison. No price recommendation is made.",
    ["Resolve the permit/jurisdiction result first."],[],warnings);
 if(quotes.length!==2||quotes[0].id!=="a"||quotes[1].id!=="b")
  return result("needs-information","Two distinct electrician quotes required",
    "Enter independent quotes A and B for the same planned work.",["Two quotes are required."],[],warnings);
 const issues:string[]=[],differences:string[]=[];
 for(const q of quotes){
  const label="Quote "+q.id.toUpperCase();
  if(!amountOK(q.amount)){issues.push(label+": enter a valid positive installed quote total in dollars, at most two decimal places.");warnings[q.id].push("Price missing or invalid.");}
  if(!validBasis(q.basis)||q.basis==="unsure"){issues.push(label+": identify whether the total is before or after incentives.");warnings[q.id].push("Price basis unverified; incentives are never deducted.");}
  if(!validScope(q.scope)||q.scope==="unsure"){issues.push(label+": identify the exact electrical installation scope.");warnings[q.id].push("No documented electrical scope.");}
  for(const f of EV_WORK_FIELDS)if(!validStatus(q[f.key])||q[f.key]==="unsure"){
   issues.push(label+": clarify whether "+f.label.toLowerCase()+" is included.");warnings[q.id].push(f.label+" is not confirmed.");
  }
  if(q.wiringIncluded==="no")issues.push(label+": quote excludes the new electrical work being evaluated.");
  if(q.electricalPermitIncluded!=="yes")issues.push(label+": quote does not establish included City electrical permitting.");
  if(q.inspectionIncluded!=="yes")issues.push(label+": quote does not establish included inspection closeout.");
  if(q.equipmentModelDocumented!=="yes")warnings[q.id].push("Ask for exact equipment make/model, listing and compatible charging specification.");
  if(q.warrantyWritten!=="yes")warnings[q.id].push("Request written equipment and labor warranty terms.");
  if(q.loadReviewDocumented!=="yes")issues.push(label+": ask for a documented service-load assessment and assumptions; this tool cannot approve capacity.");
  if(q.scope==="level2-managed"&&q.managedChargingDocumented!=="yes")
   issues.push(label+": managed-charging model, controls and approval need documentation.");
  if(q.scope==="level2-panel-work"&&q.panelRationaleDocumented!=="yes")
   issues.push(label+": require the electrician's documented need for a service-panel change.");
 }
 const [a,b]=quotes;
 if(validScope(a.scope)&&validScope(b.scope)&&a.scope!=="unsure"&&b.scope!=="unsure"&&a.scope!==b.scope)
  differences.push("Installation scope: "+humanScope[a.scope]+" versus "+humanScope[b.scope]+".");
 if(validBasis(a.basis)&&validBasis(b.basis)&&a.basis!=="unsure"&&b.basis!=="unsure"&&a.basis!==b.basis)
  differences.push("Price basis: before-incentives versus after-incentives. Do not subtract any incentives again.");
 for(const f of EV_WORK_FIELDS)if(validStatus(a[f.key])&&validStatus(b[f.key])&&
   a[f.key]!=="unsure"&&b[f.key]!=="unsure"&&a[f.key]!==b[f.key])
  differences.push(f.label+": A "+a[f.key]+", B "+b[f.key]+".");
 if(plan.panel==="unsure")issues.push("Panel work is not settled; have the electrician document service capacity and any alternatives.");
 if(plan.charge==="level1-new-outlet"){
  if(a.scope!=="new-120v"||b.scope!=="new-120v")issues.push("Both quotes must describe a new Level 1 120 V outlet, not Level 2 equipment.");
 }else{
  if(a.scope==="new-120v"||b.scope==="new-120v")issues.push("A Level 1 outlet quote is not the same project as Level 2 charging.");
  if(plan.ventilation==="unsure")issues.push("Check the selected charger manufacturer's mechanical-ventilation requirement before comparing totals.");
  if(plan.ventilation==="requires-mechanical"&&
    (a.mechanicalPermitIncluded!=="yes"||b.mechanicalPermitIncluded!=="yes"))
    issues.push("Manufacturer-reported mechanical ventilation needs permitting scope confirmed in both quotes.");
 }
 if(plan.panel==="proposed"&&
    (a.scope!=="level2-panel-work"||b.scope!=="level2-panel-work"||
     a.panelWorkIncluded!=="yes"||b.panelWorkIncluded!=="yes"))
  issues.push("The proposed panel-change scope is not included and documented consistently in both quotes.");
 if(plan.panel==="not-proposed"&&(a.panelWorkIncluded!=="no"||b.panelWorkIncluded!=="no"))
  issues.push("The project says no panel change is proposed; clarify any quote that includes or leaves panel work uncertain.");
 if(plan.panel==="not-proposed"&&(a.scope==="level2-panel-work"||b.scope==="level2-panel-work"))
  issues.push("A quote describes a panel-upgrade project despite the homeowner reporting no panel change is proposed.");
 if(issues.length||differences.length)
  return result(differences.length?"scope-mismatch":"needs-information",
    differences.length?"Quotes describe different work":"More bid details are needed",
    "No lowest-price conclusion. Compare the same verified project and both complete included-work lists before interpreting price differences.",
    [...new Set(issues)],differences,warnings);
 // Both prices are genuine user-entered as-quoted numbers, no discount/subsidy math.
 const lowest=a.amount!<=b.amount!?"a":"b";
 return result("comparable","Reported installation scopes appear comparable",
  "The included work and incentive price basis match your entries. This is an as-quoted dollar comparison only: not a best-installer rating, technical approval, final checkout or rebate eligibility.",
  [],[],warnings,lowest,roundCents(Math.abs(a.amount!-b.amount!)));
}
export function evInstallationRequest(plan:SJInput,permit:SJOutcome):string{
 const scope=plan.charge==="level1-existing"?"Existing suitable 120 V outlet; no new work reported":
    plan.charge==="level1-new-outlet"?"New 120 V outlet for Level 1 charging":
    plan.charge==="level2"?"Level 2 charger and its electrical installation":"Charging work not confirmed";
 return [
  "SAN JOSÉ — EV CHARGER INSTALLATION / BID SPECIFICATION",
  "Independent homeowner question list — NOT a construction design, approval, rebate or contractor solicitation.",
  "City permit planning: "+permit.heading,
  "Reported charging approach: "+scope,
  "Permit outcome: electrical "+permit.electricalPermit+"; mechanical "+permit.mechanicalPermit+
  "; separate panel "+permit.panelPermit+".",
  "REQUEST THE SAME WRITTEN DETAILS FROM EACH ELECTRICIAN:",
  "1. Confirm actual City building jurisdiction and property/parking type before relying on these rules.",
  "2. Identify exact charger/EVSE manufacturer, model, listing, vehicle connector and proposed location; explain if the homeowner supplies the equipment.",
  "3. Detail new outlet/circuit, wire route, conduit, panel/breaker work, charging load and how the existing service/load was evaluated by the electrician.",
  "4. Offer any code-compliant alternative to a panel upgrade if supported by site conditions (for example load-managed charging); provide the model, controls and written rationale. Do NOT assume a panel change is needed.",
  "5. Quote permit application/fee ownership, required inspection scheduling and final closeout; confirm possible mechanical permit if manufacturer requires ventilation.",
  "6. Identify any trenching, drywall, utility service/meter coordination, parking permissions or restoration as explicitly included or excluded.",
  "7. Provide the full installed total, what it includes, before/after-incentives basis, taxes, deposits, conditions and any separately paid equipment costs. Do not subtract conditional incentives twice.",
  "8. Supply equipment/workmanship warranties, change-order process and a dated written breakdown.",
  "9. Compare proposals with equivalent equipment and scope; ask for corrections before interpreting the cheapest listed total.",
  "PERSONALIZED NEXT STEPS:",
  ...permit.nextSteps.map((s,i)=>(i+1)+". "+s),
  "OFFICIAL SOURCES:",
  ...permit.sourceKeys.map(k=>SJ_EV_SOURCES[k].url),
  "No contractor is contacted; no quote or homeowner data is uploaded."
 ].join("\n");
}
export function evQuoteComparisonReport(plan:SJInput,permit:SJOutcome,quotes:readonly EVQuote[],comparison:EVQuoteResult):string{
 const lines=[evInstallationRequest(plan,permit),"","TWO SELF-REPORTED ELECTRICIAN PROPOSALS",
 "No automatic rebate subtraction, engineering verification or contractor recommendation."];
 for(const q of quotes){
  lines.push("QUOTE "+q.id.toUpperCase(),
   "Installed amount: "+(amountOK(q.amount)?"$"+q.amount.toFixed(2):"not safely established"),
   "Price basis: "+q.basis,
   "Installation scope: "+(validScope(q.scope)?humanScope[q.scope]:"unknown"),
   ...EV_WORK_FIELDS.map(f=>f.label+": "+q[f.key]),
   ...EV_EVIDENCE_FIELDS.map(f=>f.label+": "+q[f.key]));
 }
 lines.push("COMPARISON: "+comparison.headline,comparison.explanation,
   ...(comparison.lowest===null?["No price winner is identified."]:[
    "Lowest reported as-quoted amount: quote "+comparison.lowest.toUpperCase()+
    "; difference $"+comparison.quotedPriceGap!.toFixed(2)+
    ". Not a lowest total project cost or best contractor judgment."]),
   ...comparison.differences.map(s=>"DIFFERENCE: "+s),
   ...comparison.issues.map(s=>"FOLLOW UP: "+s),
   ...(["a","b"] as const).flatMap(id=>comparison.perQuote[id].map(x=>"QUOTE "+id.toUpperCase()+" — "+x)),
   "All answers remain in this browser until you deliberately copy or download this text.",
   "Independent planning only; current City rules and a qualified electrician control the project.");
 return lines.join("\n");
}
