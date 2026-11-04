/**
 * Massachusetts air-source proposal verification, reviewed 2026-11-04.
 * Not a product certification or approved rebate. User-supplied details stay
 * in browser state; no serial number or utility account identifier is needed.
 */
import {compareMassQuotes,type MassBidComparison,type MassQuote,type MassInput,type MassYear} from "./mass-save.ts";
export const MASS_AUDIT_REVIEWED="2026-11-04";
export const MA_AUDIT_SOURCES={
 rules:"https://www.masssave.com/en/residential/rebates-offers-services/heating-and-cooling/heat-pumps/air-source-heat-pumps",
 equipment:"https://www.masssave.com/heat-pump-qualified-list",
} as const;
export type RefrigerantClass="at-most-700"|"r410a"|"other-over-700"|"unsure";
export type SystemClass="split"|"vrf"|"self-contained"|"unsure";
export interface EquipmentEvidence{
 ahriReference:string;outdoorModel:string;indoorModel:string;
 refrigerant:RefrigerantClass;systemClass:SystemClass;
}
export const blankEquipment=():EquipmentEvidence=>({
 ahriReference:"",outdoorModel:"",indoorModel:"",refrigerant:"unsure",systemClass:"unsure"
});
export interface TimelineEvidence{installationDate:string;submissionDate:string}
export interface EquipmentFinding{
 id:MassQuote["id"];identity:"complete-reported"|"incomplete"|"requires-official-check";
 refrigerantFinding:"unsupported-standard"|"exception-needs-review"|"not-established"|"no-known-high-gwp-barrier";
 risks:string[];readiness:"blocked"|"verify"|"reported-ready";
}
export interface MassachusettsProposalAudit{
 timeline:{status:"2026"|"2027-announced"|"unverified"|"unsupported";year:MassYear;problems:string[];documents:string[];scheduleMatches:boolean};
 quotes:EquipmentFinding[];
 comparison:MassBidComparison;
 priorityQuestions:string[];
}
const validDate=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&
 !Number.isNaN(new Date(v+"T00:00:00Z").getTime())&&new Date(v+"T00:00:00Z").toISOString().slice(0,10)===v;
const safeId=(s:string)=>typeof s==="string"&&s.length<=80&&
 (s.trim()===""||/^[a-zA-Z0-9][a-zA-Z0-9 _./#()-]*$/.test(s.trim()));
export function auditMassachusettsProposals(
 common:Omit<MassInput,"installerInNetwork"|"equipmentOnQualifiedList"|"newEquipment"|"coolingCapacityBtu">,
 quotes:MassQuote[],
 evidence:Partial<Record<MassQuote["id"],EquipmentEvidence>>,
 timeline:TimelineEvidence
):MassachusettsProposalAudit{
 if(!timeline||typeof timeline.installationDate!=="string"||typeof timeline.submissionDate!=="string"||
  timeline.installationDate!==""&&!validDate(timeline.installationDate)||
  timeline.submissionDate!==""&&!validDate(timeline.submissionDate))
  throw new RangeError("Use valid calendar dates or leave dates unknown.");
 const comparison=compareMassQuotes(common,quotes);
 const problems:string[]=[];
 const documents:string[]=[
  "Keep the participating installer, actual indoor/outdoor model IDs, AHRI reference and installed capacity with each proposal.",
  "Confirm the exact matched system on Mass Save's current Heat Pump Qualified Product List.",
  "Retain final itemized invoice, rebate application and required project-specific forms."
 ];
 const installation=timeline.installationDate;
 let year:MassYear="unknown";
 if(installation){
  const n=Number(installation.slice(0,4));
  if(n===2026)year="2026";
  else if(n===2027)year="2027";
  else problems.push("This planner has no validated air-source heat-pump rate schedule for the stated installation date.");
 }
 if(!installation)problems.push("Enter the actual or planned installation date; year-only assumptions do not establish an eligible rate period.");
 if(year!=="unknown"&&common.year!==year)problems.push("Installation date and selected rebate year conflict; the stated year must be reconciled before using a net-cost scenario.");
 if(year==="2027")problems.push("Only announced 2027 whole/partial rate changes are known; other 2027 eligibility and submission rules are not independently verified.");
 if(year==="2026"){
  documents.push("For 2026 installations, submit the complete rebate form and supporting documents by February 28, 2027.");

  if(timeline.submissionDate&&timeline.submissionDate>"2027-02-28")problems.push("Planned 2026 rebate submission is after the published February 28, 2027 receipt deadline.");
 }
 // The Oct 1 change applies to APPLICATIONS, not just systems installed
 // after Oct 1. An earlier installation submitted later still needs photos.
 if(!timeline.submissionDate||timeline.submissionDate>="2026-10-01")
  documents.push("Applications submitted on or after October 1, 2026 require serial numbers and legible outdoor-unit nameplate photographs; do not enter serial numbers in this tool.");
 if(timeline.submissionDate&&installation&&timeline.submissionDate<installation)
  problems.push("Submission is reported before installation. Check the actual application and installation chronology.");
 const scheduleMatches=year!=="unknown"&&common.year===year&&
  (year!=="2026"||!timeline.submissionDate||timeline.submissionDate<="2027-02-28")&&
  (!timeline.submissionDate||!installation||timeline.submissionDate>=installation);
 let status:MassachusettsProposalAudit["timeline"]["status"]=
  year==="2026"?"2026":year==="2027"?"2027-announced":"unverified";
 if(installation&&!["2026","2027"].includes(installation.slice(0,4)))status="unsupported";
 const findings:EquipmentFinding[]=comparison.quotes.map(row=>{
  const q=row.quote, e=evidence[q.id]??blankEquipment();
  if(![e.ahriReference,e.outdoorModel,e.indoorModel].every(safeId)||
    !["at-most-700","r410a","other-over-700","unsure"].includes(e.refrigerant)||
    !["split","vrf","self-contained","unsure"].includes(e.systemClass))
    throw new RangeError("Equipment identity has an unsupported identifier or type.");
  const risks:string[]=[];
  const ahri=e.ahriReference.trim(),outdoor=e.outdoorModel.trim(),indoor=e.indoorModel.trim();
  const complete=ahri.length>0&&outdoor.length>0&&indoor.length>0;
  if(!complete)risks.push("Require the AHRI certified reference and matching indoor/outdoor model numbers; incomplete identities cannot be compared against the official product list.");
  if(q.equipmentOnQualifiedList==="yes"&&!complete)
   risks.push("A user-reported qualified-list match is not supported by enough system identifiers to independently cross-check it.");
  if(q.equipmentOnQualifiedList!=="yes")risks.push("Exact qualified-list status remains unverified (or marked not listed).");
  if(q.coolingCapacityBtu===null)risks.push("AHRI cooling capacity missing; the per-ton schedule example cannot be checked against a system certificate.");
  let refrigerantFinding:EquipmentFinding["refrigerantFinding"]="not-established";
  const highGwp=e.refrigerant==="r410a"||e.refrigerant==="other-over-700";
  if(e.refrigerant==="at-most-700")refrigerantFinding="no-known-high-gwp-barrier";
  if(highGwp&&year==="2026"){
   if(e.systemClass==="split"){refrigerantFinding="unsupported-standard";risks.push("A split system with refrigerant GWP above 700, including R-410A, was removed from the 2026 Mass Save HPQPL.");}
   else if(e.systemClass==="vrf"&&q.coolingCapacityBtu!==null&&q.coolingCapacityBtu<65000){
    refrigerantFinding="unsupported-standard";
    risks.push("The published temporary VRF exception requires capacity of at least 65,000 BTU/h; the reported system is below that threshold.");
   }else if(e.systemClass==="vrf"||e.systemClass==="self-contained"){
    refrigerantFinding="exception-needs-review";
    risks.push("A narrow high-GWP VRF or factory-charged self-contained exception may apply; verify exact system, capacity and date in the live HPQPL.");
   }else risks.push("High-GWP equipment reported, but system class is unknown. Confirm official listing before signing.");
  }else if(highGwp&&year==="2027"){
   risks.push("High-GWP system reported for 2027. Do not rely on the temporary 2026 VRF exception; verify exact 2027 product eligibility.");
  }else if(e.refrigerant==="unsure")risks.push("Confirm the proposed refrigerant and GWP class against the model plate and manufacturer specification.");
  if(!timeline.installationDate)risks.push("No installation date supplied, so the 2026/2027 rate selection is unverified.");
  const blocked=refrigerantFinding==="unsupported-standard"||
    q.equipmentOnQualifiedList==="no"||status==="unsupported";
  const verify=!complete||q.equipmentOnQualifiedList!=="yes"||
    refrigerantFinding==="exception-needs-review"||e.refrigerant==="unsure"||
    e.systemClass==="unsure"||!scheduleMatches||year==="2027";
  return {
   id:q.id,
   identity:complete?"complete-reported":q.equipmentOnQualifiedList==="yes"?"requires-official-check":"incomplete",
   refrigerantFinding,
   risks,
   readiness:blocked?"blocked":verify?"verify":"reported-ready"
  };
 });
 const missingSchedule=!scheduleMatches||status==="unsupported"||problems.some(x=>/deadline|chronology/.test(x));
 // A missing or uncertain system identity cannot support even conditional
 // post-rebate arithmetic. Preserve original, as-quoted totals.
 for(const row of comparison.quotes){
  const item=findings.find(x=>x.id===row.quote.id);
  if(missingSchedule||item?.readiness!=="reported-ready")row.conditionalPostRebate=null;
 }
 const priorityQuestions=[
  ...(problems.length?[problems[0]]:[]),
  ...findings.flatMap(f=>f.risks.slice(0,2).map(x=>"Quote "+f.id.toUpperCase()+": "+x)),
  "Ask each installer to confirm whether the rebate is already included in its price and whether another incentive is being stacked.",
  "Verify the current qualified system, program sponsor, installer network and exact application instructions directly with Mass Save."
 ];
 return {timeline:{status,year,problems,documents,scheduleMatches},quotes:findings,comparison,priorityQuestions};
}
export function massAuditReport(audit:MassachusettsProposalAudit,evidence:Partial<Record<MassQuote["id"],EquipmentEvidence>>,timeline:TimelineEvidence):string {
 return ["MASSACHUSETTS PROPOSAL EVIDENCE AUDIT · "+MASS_AUDIT_REVIEWED,
  "Not a heat-pump product approval, program award or inspection.",
  "Installation: "+(timeline.installationDate||"unknown")+"; submission: "+(timeline.submissionDate||"unknown"),
  "Date status: "+audit.timeline.status,
  ...audit.timeline.problems.map(x=>"DATE REVIEW: "+x),
  ...audit.quotes.flatMap(f=>{
   const q=evidence[f.id]??blankEquipment();
   return ["QUOTE "+f.id.toUpperCase()+" equipment: AHRI "+(q.ahriReference||"unknown")+
    "; outdoor "+(q.outdoorModel||"unknown")+"; indoor "+(q.indoorModel||"unknown"),
    "Refrigerant: "+q.refrigerant+"; system type: "+q.systemClass+"; review: "+f.readiness,
    ...f.risks.map(x=>"- "+x)];
  }),
  ...audit.timeline.documents,
  ...audit.priorityQuestions.map((q,i)=>(i+1)+". "+q),
  MA_AUDIT_SOURCES.rules,MA_AUDIT_SOURCES.equipment
 ].join("\n");
}
