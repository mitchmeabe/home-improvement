/**
 * Independent heat-pump proposal quality / scope review.
 * It checks documented proposal evidence, NOT sizing adequacy, engineering,
 * contractor competence, incentive eligibility, installed performance or permits.
 * User-entered quote/equipment information stays in browser memory.
 */
import type {QuoteItem,QuoteScope} from "./heat-pump-quotes.ts";
export const BID_QUALITY_REVIEWED="2026-11-06";
export const BID_QUALITY_MAX_AGE_DAYS=60;
export const BID_QUALITY_SOURCES={
 energyStar:{label:"ENERGY STAR — Air-source heat pumps and proper sizing",url:"https://www.energystar.gov/products/air_source_heat_pumps"},
 acca:{label:"ACCA — Manual S equipment selection",url:"https://www.acca.org/standards/technical-manuals/manual-s"},
 doe:{label:"DOE Building America — Heat pump replacement checklist",url:"https://basc.pnnl.gov/home-improvement-expert/checklists/heat-pump-replacement"},
 pnnl:{label:"DOE Building America — Installation and commissioning",url:"https://basc.pnnl.gov/resource-guides/heat-pump-quality-installation-and-commissioning"},
} as const;
export type HeatGoal="whole-home"|"specific-rooms"|"supplemental"|"unsure";
export type HeatPlan={
 goal:HeatGoal;
 replaceExisting:"yes"|"no"|"unsure";
 existingDucts:"yes"|"no"|"unsure";
};
export const INITIAL_HEAT_PLAN:HeatPlan={goal:"unsure",replaceExisting:"unsure",existingDucts:"unsure"};
export type Evidence="yes"|"no"|"unsure";
export type DesignMethod="manual-j"|"equivalent-documented"|"square-foot-only"|"unsure";
export type Backup="retain-existing"|"new-auxiliary"|"heat-pump-alone"|"unsure";
export type DuctCheck="documented"|"not-applicable-ductless"|"not-documented"|"unsure";
export interface HeatBidQuality{
 id:QuoteItem["id"];
 loadMethod:DesignMethod;
 loadReportProvided:Evidence;
 manufacturerPerformanceAtDesign:Evidence;
 matchedEquipmentModels:Evidence;
 roomsOrZonesDocumented:Evidence;
 backup:Backup;
 ductReview:DuctCheck;
 commissioningReport:Evidence;
 ownerControlsHandover:Evidence;
 designOutdoorTempF:number|null;
 documentedHeatLoadBtu:number|null;
 manufacturerCapacityBtuAtDesign:number|null;
 zonesServed:number|null;
}
export function blankHeatBidQuality(id:QuoteItem["id"]):HeatBidQuality{
 return {id,loadMethod:"unsure",loadReportProvided:"unsure",
  manufacturerPerformanceAtDesign:"unsure",matchedEquipmentModels:"unsure",
  roomsOrZonesDocumented:"unsure",backup:"unsure",ductReview:"unsure",
  commissioningReport:"unsure",ownerControlsHandover:"unsure",
  designOutdoorTempF:null,documentedHeatLoadBtu:null,
  manufacturerCapacityBtuAtDesign:null,zonesServed:null};
}
export interface HeatBidFinding{
 id:QuoteItem["id"];
 status:"needs-evidence"|"documented-for-review";
 documented:number;
 required:number;
 questions:string[];
 notes:string[];
}
export interface HeatBidAssessment{
 status:"review-sources"|"need-project-definition"|"different-projects"|"needs-evidence"|"ready-for-professional-review";
 heading:string;
 explanation:string;
 findings:HeatBidFinding[];
 differences:string[];
 projectQuestions:string[];
 notEquipmentApproval:true;
 noContractorEndorsement:true;
}
const validYes=(v:unknown):v is Evidence=>v==="yes"||v==="no"||v==="unsure";
const validMethod=(v:unknown):v is DesignMethod=>["manual-j","equivalent-documented","square-foot-only","unsure"].includes(String(v));
const validBackup=(v:unknown):v is Backup=>["retain-existing","new-auxiliary","heat-pump-alone","unsure"].includes(String(v));
const validDuct=(v:unknown):v is DuctCheck=>["documented","not-applicable-ductless","not-documented","unsure"].includes(String(v));
const valueOk=(n:number|null,low:number,high:number)=>n===null||
 typeof n==="number"&&Number.isFinite(n)&&Number.isInteger(n)&&n>=low&&n<=high;
const validDate=(date:string)=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const d=new Date(date+"T00:00:00Z");return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===date;
};
export function heatBidSourcesFresh(asOf:string):boolean{
 if(!validDate(asOf))return false;
 const days=(Date.parse(asOf+"T00:00:00Z")-Date.parse(BID_QUALITY_REVIEWED+"T00:00:00Z"))/86400000;
 return days>=0&&days<=BID_QUALITY_MAX_AGE_DAYS;
}
function validate(goal:HeatPlan,quotes:readonly QuoteItem[],bids:readonly HeatBidQuality[]){
 if(!goal||!["whole-home","specific-rooms","supplemental","unsure"].includes(goal.goal)||
  !validYes(goal.replaceExisting)||!validYes(goal.existingDucts))
  throw new RangeError("Select a supported project intention and current equipment status.");
 if(quotes.length<2||quotes.length>3||bids.length!==quotes.length||
  new Set(quotes.map(q=>q.id)).size!==quotes.length||
  new Set(bids.map(b=>b.id)).size!==bids.length||
  !quotes.every(q=>bids.some(b=>b.id===q.id)))
  throw new RangeError("Every unique quote must have exactly one matching quality review.");
 for(const q of quotes){
  if(!["reuse-existing-ducts","new-ductwork","ductless","mixed","unknown"].includes(q.scope))throw new RangeError("Invalid installation scope.");
  if(!["before-discounts","after-discounts","unsure"].includes(q.priceBasis))throw new RangeError("Invalid quote price basis.");
 }
 for(const b of bids){
  if(!validMethod(b.loadMethod)||!validBackup(b.backup)||!validDuct(b.ductReview)||
   ![b.loadReportProvided,b.manufacturerPerformanceAtDesign,b.matchedEquipmentModels,
     b.roomsOrZonesDocumented,b.commissioningReport,b.ownerControlsHandover].every(validYes)||
   !valueOk(b.designOutdoorTempF,-60,120)||
   !valueOk(b.documentedHeatLoadBtu,1,500000)||
   !valueOk(b.manufacturerCapacityBtuAtDesign,1,500000)||
   !valueOk(b.zonesServed,1,32))
    throw new RangeError("One or more bid design/evidence values are unsupported.");
 }
}
export function evaluateHeatPumpBidQuality(goal:HeatPlan,quotes:readonly QuoteItem[],bids:readonly HeatBidQuality[],asOf:string):HeatBidAssessment{
 validate(goal,quotes,bids);
 const projectQuestions=[
  "Which rooms or floors must be heated and cooled, and is this the primary whole-home system or a supplemental installation?",
  "Will existing heating, cooling, ducts, controls and auxiliary heat be kept, modified or removed? Make this consistent across proposals.",
  "Ask each contractor for site-specific heating/cooling load calculations (ACCA Manual J or appropriate documented equivalent), including room/zone assumptions and outdoor design conditions.",
  "Ask how selected matched indoor/outdoor equipment capacities were evaluated at the actual outdoor heating design temperature (not only nameplate tonnage). Review manufacturer's performance data or ACCA Manual S rationale.",
  "For existing/new ducts, request a duct/airflow assessment (Manual D where applicable); for ductless, confirm head coverage, placement and line sets rather than claiming duct testing is required.",
  "Agree on backup/auxiliary heating and controls strategy. Confirm which rooms are served on the coldest days and who will configure and demonstrate the controls.",
  "Request itemized mechanical/electrical work, permits, inspections, old-system removal, condensate drainage, electrical upgrades, startup commissioning and equipment/labor warranty terms.",
  "Require written commissioning evidence appropriate to the system (refrigerant pressure/vacuum/charge checks, controls, airflow and measured performance as applicable).",
  "Compare identical installed scope and before/after-discount price basis. Verify rebates separately; no utility incentives, federal credits or future energy savings are assumed.",
 ];
 const findings:HeatBidFinding[]=quotes.map(q=>{
  const b=bids.find(x=>x.id===q.id)!;
  const questions:string[]=[],notes:string[]=[];
  let documented=0;
  const check=(ok:boolean,question:string)=>{if(ok)documented++;else questions.push(question)};
  check(b.loadMethod==="manual-j"||b.loadMethod==="equivalent-documented",
   b.loadMethod==="square-foot-only"
    ?"Ask for a professional site-specific heating/cooling load calculation rather than square-foot rules of thumb."
    :"Ask for an ACCA Manual J or appropriate equivalent load calculation method.");
  check(b.loadReportProvided==="yes","Request the written load report and design assumptions; a verbal estimate is not supporting evidence.");
  check(b.manufacturerPerformanceAtDesign==="yes","Ask for heating capacity at the local design temperature using exact manufacturer performance data.");
  check(b.matchedEquipmentModels==="yes","Ask for the exact matched indoor and outdoor model numbers and equipment-selection reasoning.");
  check(b.roomsOrZonesDocumented==="yes","Have the contractor document room/zone coverage and equipment placement.");
  check(b.backup!=="unsure","Clarify whether existing heat stays, new backup is installed, or the heat pump will serve alone, with design-condition rationale.");
  const ductValid=q.scope==="ductless"?
    b.ductReview==="not-applicable-ductless":
    b.ductReview==="documented";
  check(ductValid,q.scope==="ductless"?
    "Ductless system: confirm no duct assessment applies and instead document head placement, lines and room coverage.":
    "Request duct sizing/condition and airflow evaluation; a ductless exception cannot satisfy a ducted project.");
  check(b.commissioningReport==="yes","Ask for startup commissioning and a written verification/commissioning report.");
  check(b.ownerControlsHandover==="yes","Confirm homeowner controls setup, operation instructions and maintenance handover.");
  if(b.designOutdoorTempF===null)questions.push("Request the outdoor design temperature assumed in sizing and model performance.");
  if(b.documentedHeatLoadBtu===null)questions.push("Request the calculated design heating load in BTU/h; this tool never computes it.");
  if(b.manufacturerCapacityBtuAtDesign===null)questions.push("Request manufacturer heating capacity in BTU/h at the SAME stated design temperature.");
  if(b.zonesServed===null)questions.push("Record how many conditioned rooms/zones are included in this proposed scope.");
  if(b.documentedHeatLoadBtu!==null&&b.manufacturerCapacityBtuAtDesign!==null)
   notes.push("Self-reported load "+b.documentedHeatLoadBtu.toLocaleString("en-US")+" BTU/h versus manufacturer capacity "+
    b.manufacturerCapacityBtuAtDesign.toLocaleString("en-US")+" BTU/h. No adequacy finding: conditions, operating range, auxiliary heat, distribution and derating require professional review.");
  if(b.commissioningReport==="yes"&&q.commissioningIncluded==="no")
   questions.push("Proposal claims a commissioning report but price scope excludes commissioning: obtain a corrected written quote.");
  if(b.matchedEquipmentModels==="yes"&&q.modelAndRatingsDocumented==="no")
   questions.push("Matched model numbers reported in this review conflict with the base quote's equipment documentation answer.");
  return {id:b.id,status:documented===9&&questions.length===0?"documented-for-review":"needs-evidence",
   documented,required:9,questions,notes};
 });
 const differences:string[]=[];
 const compare=(label:string,parts:(string|null)[])=>{
  const known=parts.filter(x=>x!==null&&x!=="unsure");
  if(new Set(known).size>1)differences.push(label+": "+quotes.map((q,i)=>q.id.toUpperCase()+" "+(parts[i]??"not reported")).join("; ")+".");
 };
 compare("Ductwork and installation scope",quotes.map(q=>q.scope==="unknown"?null:q.scope));
 compare("Before/after-discount quoted basis",quotes.map(q=>q.priceBasis==="unsure"?null:q.priceBasis));
 compare("Heating/backup strategy",quotes.map(q=>bids.find(b=>b.id===q.id)!.backup));
 compare("Number of rooms/zones served",quotes.map(q=>{
  const n=bids.find(b=>b.id===q.id)!.zonesServed;return n===null?null:String(n);
 }));
 compare("Outdoor sizing design temperature",quotes.map(q=>{
  const n=bids.find(b=>b.id===q.id)!.designOutdoorTempF;return n===null?null:n+"°F";
 }));
 if(goal.goal==="whole-home"&&bids.some(b=>b.roomsOrZonesDocumented!=="yes"))
  differences.push("A whole-home project has not established written coverage for every quote.");
 if(goal.replaceExisting==="yes"&&bids.some(b=>b.backup==="retain-existing"))
  differences.push("The homeowner expects to replace existing heat, but at least one proposed backup strategy retains it; confirm intent.");
 const badQuoteBasis=quotes.some(q=>q.scope==="unknown"||q.priceBasis==="unsure"||q.installedPrice===null);
 const hasEvidenceGaps=findings.some(f=>f.questions.length>0);
 const status:HeatBidAssessment["status"]=
  !heatBidSourcesFresh(asOf)?"review-sources":
  goal.goal==="unsure"?"need-project-definition":
  differences.length?"different-projects":
  badQuoteBasis||hasEvidenceGaps?"needs-evidence":"ready-for-professional-review";
 const heading={
  "review-sources":"Refresh reference guidance before relying on this analysis",
  "need-project-definition":"Decide what heating problem you are solving first",
  "different-projects":"These proposals describe different heating projects",
  "needs-evidence":"Resolve design, equipment and scope evidence before selecting a bid",
  "ready-for-professional-review":"Written proposal evidence appears sufficiently complete for professional review"
 }[status];
 const explanation=status==="ready-for-professional-review"?
  "Your self-reported scopes, design assumptions and nine documentation categories are aligned. This is NOT an equipment-sizing approval, a technical inspection, a verified quotation or a contractor ranking.":
  status==="review-sources"?
  "The reference snapshot is beyond its review window. Use linked current primary guides before treating this result as up to date.":
  "Do not interpret the cheapest stated total as the best installation. Ask for corrections and evidence, then have a qualified contractor validate equipment performance, design and local requirements.";
 return {status,heading,explanation,findings,differences,projectQuestions,
  notEquipmentApproval:true,noContractorEndorsement:true};
}
export function heatPumpBidRequest(goal:HeatPlan):string{
 return [
 "HOME HEAT-PUMP INSTALLATION — CONSISTENT REQUEST FOR A WRITTEN BID",
 "Independent homeowner scope questions, not a code-compliant design or contractor solicitation.",
 "Project goal: "+goal.goal,
 "Replace existing heating/cooling: "+goal.replaceExisting,
 "Existing ducts reported: "+goal.existingDucts,
 "ASK EVERY CONTRACTOR TO ITEMIZE THE SAME PROJECT:",
 ...[
  "Conduct site inspection; document heated/cooled rooms, floor areas and any planned weatherization or duct changes.",
  "Provide heating and cooling load calculations (ACCA Manual J or appropriate documented equivalent) and the local winter design temperature.",
  "List full indoor/outdoor heat-pump model pairing, matched rating/certification, manufacturer heating capacity at design temperature, room/zone coverage and sizing explanation.",
  "Describe duct reuse/repairs/new ducts and airflow, or ductless indoor heads and line sets, including the costed scope.",
  "State whether existing furnace/boiler is kept, removed or used for backup; identify auxiliary heat and thermostat/controls strategy.",
  "Itemize mechanical/electrical work, permits, inspections, breakers, condensate, line sets, repairs, equipment disposal and any separately priced upgrades.",
  "Provide a written startup commissioning/testing plan: system pressure/vacuum/refrigerant charge verification, airflow/static pressure as relevant, controls and commissioning report.",
  "Include written equipment and workmanship warranties, service/support terms, owner instructions and controls handover.",
  "Show the installed total BEFORE vs AFTER discounts clearly, including only confirmed rebates. State conditional funds separately; never deduct an incentive twice.",
  "Identify all exclusions, change-order conditions, deposit/milestone payment terms and expected inspection closeout deliverables.",
 ].map((s,i)=>(i+1)+". "+s),
 "OFFICIAL GUIDANCE:",
 ...Object.values(BID_QUALITY_SOURCES).map(s=>s.label+": "+s.url),
 "Do not upload quotes, addresses or utility accounts to this planning tool."
 ].join("\n");
}
export function heatPumpBidQualityReport(
 goal:HeatPlan,quotes:readonly QuoteItem[],bids:readonly HeatBidQuality[],report:HeatBidAssessment
):string{
 return [heatPumpBidRequest(goal),"","SIDE-BY-SIDE SELF-REPORTED CONTRACTOR PROPOSAL EVIDENCE",
  report.heading,report.explanation,
  ...quotes.flatMap(q=>{
   const b=bids.find(x=>x.id===q.id)!,f=report.findings.find(x=>x.id===q.id)!;
   return ["QUOTE "+q.id.toUpperCase()+": "+
    (q.installedPrice===null?"no stated price":"$"+q.installedPrice.toFixed(2))+
    "; scope "+q.scope+"; basis "+q.priceBasis,
    "Load method: "+b.loadMethod+"; report provided: "+b.loadReportProvided,
    "Design temperature: "+(b.designOutdoorTempF??"unknown")+"°F; heating load: "+(b.documentedHeatLoadBtu??"unknown")+" BTU/h; manufacturer capacity at design: "+(b.manufacturerCapacityBtuAtDesign??"unknown")+" BTU/h",
    "Matched models: "+b.matchedEquipmentModels+"; served rooms/zones: "+(b.zonesServed??"unknown"),
    "Backup strategy: "+b.backup+"; duct review: "+b.ductReview+
    "; commissioning: "+b.commissioningReport+"; controls handover: "+b.ownerControlsHandover,
    "Reported documentary evidence: "+f.documented+"/"+f.required+" (not independently verified)",
    ...f.notes.map(s=>"CONTEXT: "+s),
    ...f.questions.map(s=>"ASK INSTALLER: "+s)];
  }),
  "MATERIAL DIFFERENCES:",...(report.differences.length?report.differences:["None identified from the self-reported scope/design fields; unknowns still require confirmation."]),
  "No model, warranty, service, rebate or contractor was independently verified. No recommendation, savings guarantee or purchase was made."
 ].join("\n");
}
