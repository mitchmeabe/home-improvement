/**
 * San José Level 2: audit alternative managed EV charging vs service-panel work.
 * A conditional *quoted cost difference* is not a technical recommendation.
 * No electrical calculations, inspections, permit decisions, rebates, leads or affiliates.
 * Official agency source review: 2026-11-06.
 */
import {SJ_EV_REVIEWED,SJ_EV_SOURCES,sjEvidenceCurrent,type SJInput,type SJOutcome} from "./san-jose-ev.ts";

export const SJ_PANEL_REVIEWED="2026-11-06";
export const SJ_PANEL_MAX_AGE=30;
export const SJ_PANEL_SOURCES={
 city:SJ_EV_SOURCES.city.url,
 electrical:SJ_EV_SOURCES.electrical.url,
 panel:SJ_EV_SOURCES.panel.url,
 utility:"https://www.pge.com/en/account/service-requests/building-and-renovation/residential-project-resources.html",
 contractor:"https://www.cslb.ca.gov/Consumers/Hire_A_Contractor/Finding_the_Right_Contractor.aspx",
 licensing:"https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx"
} as const;
export type SJPanelYesNo="yes"|"no"|"unsure";
export type SJPanelAmps="125-or-less"|"over-125"|"unsure";
export type SJPanelAssessment="both-feasible"|"panel-required"|"managed-not-viable"|"not-determined";
export type SJPanelPriceBasis="before-incentives"|"after-incentives"|"unsure";
export type SJPanelUtilityBasis="included"|"separate"|"unsure";
export type SJPanelOfferId="managed"|"upgrade";
export type SJPanelOffer={
 id:SJPanelOfferId;
 amount:number|null; // entire installed proposal, excluding separate utility cost
 priceBasis:SJPanelPriceBasis;
 utilityBasis:SJPanelUtilityBasis;
 additionalUtilityCost:number|null; // 0 only when written confirmation of none
 firstYearOngoingCost:number|null; // 0 only if no recurring cost confirmed in writing
 permitIncluded:SJPanelYesNo;
 inspectionIncluded:SJPanelYesNo;
 equipmentModelDocumented:SJPanelYesNo;
 technicalScopeDocumented:SJPanelYesNo;
 warrantyWritten:SJPanelYesNo;
};
export type SJPanelInput={
 panelAmps:SJPanelAmps;
 writtenLoadAssessment:SJPanelYesNo;
 existingPanelDefect:SJPanelYesNo; // if yes, panel work may be needed for reasons unrelated to charger
 contractorLicenseChecked:SJPanelYesNo;
 electricianAssessment:SJPanelAssessment;
 sameChargingOutcome:SJPanelYesNo; // same charging speed/service goal, independently assessed
 managedEquipmentReviewed:SJPanelYesNo; // compatible code-compliant equipment per electrician
 utilityCoordinationReviewed:SJPanelYesNo; // proposed service upgrade costs/status confirmed
 offers:readonly [SJPanelOffer,SJPanelOffer];
};
export const emptySJPanelOffer=(id:SJPanelOfferId):SJPanelOffer=>({
 id,amount:null,priceBasis:"unsure",utilityBasis:"unsure",additionalUtilityCost:null,
 firstYearOngoingCost:null,permitIncluded:"unsure",inspectionIncluded:"unsure",
 equipmentModelDocumented:"unsure",technicalScopeDocumented:"unsure",warrantyWritten:"unsure"
});
export const INITIAL_SJ_PANEL_INPUT:SJPanelInput={
 panelAmps:"unsure",writtenLoadAssessment:"unsure",existingPanelDefect:"unsure",
 contractorLicenseChecked:"unsure",electricianAssessment:"not-determined",
 sameChargingOutcome:"unsure",managedEquipmentReviewed:"unsure",utilityCoordinationReviewed:"unsure",
 offers:[emptySJPanelOffer("managed"),emptySJPanelOffer("upgrade")]
};
export type SJPanelResult={
 status:"outside-scope"|"source-review"|"needs-assessment"|"panel-work-review"|"compare";
 headline:string;notes:readonly string[];requiredEvidence:readonly string[];
 firstYearTotals:{managed:number|null;upgrade:number|null};
 offerIssues:{managed:readonly string[];upgrade:readonly string[]};
 priceDifference:number|null;
 lowerQuote:SJPanelOfferId|null;
 noDesignApproval:true;noReferral:true;reviewedOn:string;
};
const safe=(x:unknown):x is number=>typeof x==="number"&&Number.isFinite(x)&&x>=0&&x<=1000000&&Math.abs(x*100-Math.round(x*100))<1e-6;
const safeOffer=(o:unknown,id:SJPanelOfferId):o is SJPanelOffer=>{
 if(!o||typeof o!=="object"||Array.isArray(o))return false;
 const q=o as SJPanelOffer;
 return q.id===id&&["before-incentives","after-incentives","unsure"].includes(q.priceBasis)&&
  ["included","separate","unsure"].includes(q.utilityBasis)&&
  [q.amount,q.additionalUtilityCost,q.firstYearOngoingCost].every(v=>v===null||safe(v))&&
  [q.permitIncluded,q.inspectionIncluded,q.equipmentModelDocumented,q.technicalScopeDocumented,q.warrantyWritten].every(v=>["yes","no","unsure"].includes(v));
};
const none={managed:null,upgrade:null} as const;
const noIssues={managed:[],upgrade:[]} as const;
function result(status:SJPanelResult["status"],headline:string,notes:string[],requiredEvidence:string[],
 totals:SJPanelResult["firstYearTotals"]={...none},offerIssues:SJPanelResult["offerIssues"]={managed:[],upgrade:[]},
 priceDifference:number|null=null,lowerQuote:SJPanelOfferId|null=null):SJPanelResult{
 return {status,headline,notes,requiredEvidence,firstYearTotals:totals,offerIssues,priceDifference,lowerQuote,
  noDesignApproval:true,noReferral:true,reviewedOn:SJ_PANEL_REVIEWED};
}
function costReview(q:SJPanelOffer):{total:number|null;issues:string[]}{
 const issues:string[]=[];
 if(q.amount===null||q.amount<=0)issues.push("Missing positive written installed total.");
 if(q.priceBasis==="unsure")issues.push("Confirm whether the installed price is before or after incentives; do not double-subtract rebates.");
 if(q.utilityBasis==="unsure")issues.push("Written scope does not identify utility coordination/upgrade costs as included or separate.");
 if(q.utilityBasis==="separate"&&q.additionalUtilityCost===null)issues.push("Utility costs charged separately are unknown; obtain a written PG&E estimate or confirm zero.");
 if(q.firstYearOngoingCost===null)issues.push("Annual recurring or subscription cost is unknown; confirm zero in writing if none.");
 for(const [field,message] of [
  ["permitIncluded","Confirm required City electrical permit and fee responsibility."],
  ["inspectionIncluded","Confirm City final inspection, scheduling and closeout responsibility."],
  ["equipmentModelDocumented","Obtain exact EV charger/equipment model and listing documentation."],
  ["technicalScopeDocumented","Obtain itemized circuit/wiring/equipment or panel/utility work scope."],
  ["warrantyWritten","Obtain written labor/equipment warranties and exclusions."]
 ] as const)if(q[field]!=="yes")issues.push(message);
 const total=issues.length===0?Math.round((q.amount!+
   (q.utilityBasis==="separate"?q.additionalUtilityCost!:0)+q.firstYearOngoingCost!)*100)/100:null;
 return {total,issues};
}
export function evaluateSJPanelAlternatives(project:unknown,permit:unknown,input:unknown,asOf:string=SJ_PANEL_REVIEWED):SJPanelResult{
 const p=project as SJInput;const t=permit as SJOutcome;
 if(!p||!t||!["city-verified","elsewhere","unsure"].includes(p.location)||
  p.location!=="city-verified"||p.property!=="single-duplex"||p.charge!=="level2"||
  !["proposed","unsure"].includes(p.panel)||t.status!=="electrical-permit")
  return result("outside-scope","This panel-alternative audit does not apply",[
   "Use the parent San José charger permit screen first. This tool only evaluates a proposed or unresolved panel replacement for Level 2 work at a verified single-family/duplex City property."
  ],[]);
 if(!sjEvidenceCurrent(asOf)||SJ_EV_REVIEWED!==SJ_PANEL_REVIEWED)
  return result("source-review","Refresh San José EV and panel permitting sources before reviewing options",[
   "The manually reviewed City source snapshot is stale or invalid; no quote comparison or electrical recommendation is permitted."
  ],["Review current City EV charging, panel upgrade and electrical permit guidance."]);
 if(!input||typeof input!=="object"||Array.isArray(input))
  return result("needs-assessment","Collect the electrician's written load and panel evaluation",["The information is incomplete."],["Do not approve or purchase a panel replacement from this worksheet."]);
 const x=input as SJPanelInput;
 if(!["125-or-less","over-125","unsure"].includes(x.panelAmps)||
  !["both-feasible","panel-required","managed-not-viable","not-determined"].includes(x.electricianAssessment)||
  [x.writtenLoadAssessment,x.existingPanelDefect,x.contractorLicenseChecked,x.sameChargingOutcome,x.managedEquipmentReviewed,x.utilityCoordinationReviewed].some(v=>!["yes","no","unsure"].includes(v))||
  !Array.isArray(x.offers)||x.offers.length!==2||!safeOffer(x.offers[0],"managed")||!safeOffer(x.offers[1],"upgrade"))
  return result("needs-assessment","Correct incomplete or invalid assessment and quote fields",[
   "Negative, infinite, fractional-cent or unsupported inputs cannot establish a valid price or design outcome."
  ],["Request written electrician and permit documentation."]);
 const needs:string[]=[];
 if(x.panelAmps==="unsure")needs.push("Document existing panel rating with the electrician. A panel amp label by itself cannot establish spare capacity.");
 if(x.panelAmps==="125-or-less")needs.push("San José requires EV load calculations when the service panel is rated 125 A or less. The electrician must account for the continuous EV load; the site does not compute it.");
 if(x.writtenLoadAssessment!=="yes")needs.push("Obtain a written load assessment, required circuit and charging equipment basis from a qualified electrician.");
 if(x.contractorLicenseChecked!=="yes")needs.push("Independently check the electrician's appropriate active CSLB license and insurance/workers' compensation information; this site does not verify it.");
 if(x.existingPanelDefect!=="no")needs.push("Confirm whether the existing panel has an independent safety, condition or code defect. If it does, EV load management cannot make that unrelated panel problem disappear.");
 if(x.utilityCoordinationReviewed!=="yes")needs.push("Confirm PG&E scope, service-change needs, costs, scheduling and meter work for any panel or utility change. A City permit does not establish utility approval.");
 if(x.electricianAssessment==="panel-required"||x.electricianAssessment==="managed-not-viable")
  return result("panel-work-review","Panel or utility upgrades need independent professional review",[
   "A licensed electrician reports that the proposed managed-only alternative is not viable or that a panel upgrade is required. Do not characterize a lower managed-charging bid as an equivalent, safe solution.",
   "Only qualified electrical professionals and the City/utility can confirm compliance; this tool does not approve work."
  ],needs);
 if(x.electricianAssessment!=="both-feasible")
  needs.push("Obtain a written determination that BOTH proposed designs meet the specific charging goal under relevant code and City/utility requirements.");
 if(x.sameChargingOutcome!=="yes")
  needs.push("Confirm both proposals meet the same desired charging power/performance and installation outcome; otherwise they are different products, not an apples-to-apples choice.");
 if(x.managedEquipmentReviewed!=="yes")
  needs.push("Verify the listed/model-specific load-management equipment and its applicable control/load-limit installation design in writing.");
 const findings=[costReview(x.offers[0]),costReview(x.offers[1])];
 const issues={managed:findings[0].issues,upgrade:findings[1].issues};
 if(x.offers[0].priceBasis!==x.offers[1].priceBasis)
  needs.push("Compare both quotes on the same pre/post-incentive basis, without claiming rebates are awarded.");
 const totals={managed:findings[0].total,upgrade:findings[1].total};
 const ready=x.panelAmps!=="unsure"&&x.writtenLoadAssessment==="yes"&&x.existingPanelDefect==="no"&&
  x.contractorLicenseChecked==="yes"&&x.electricianAssessment==="both-feasible"&&
  x.sameChargingOutcome==="yes"&&x.managedEquipmentReviewed==="yes"&&x.utilityCoordinationReviewed==="yes"&&
  findings.every(f=>f.total!==null)&&x.offers[0].priceBasis===x.offers[1].priceBasis;
 if(!ready)return result("needs-assessment","Do not choose a panel upgrade or managed alternative from price alone",[
  "The alternatives may differ technically, in scope, utility responsibility or first-year operating costs. Resolve documented gaps before comparing quoted prices.",
  "This screen makes no safety, circuit sizing, code compliance, actual cost-savings or permit approval determination."
 ],needs,totals,issues);
 const diff=Math.round(Math.abs(totals.managed!-totals.upgrade!)*100)/100;
 const lower=totals.managed!<totals.upgrade!?"managed":totals.upgrade!<totals.managed!?"upgrade":null;
 return result("compare","Two electrician-reviewed options have a conditional quoted first-year cost difference",[
  "The reported plans have written evidence of equal charging goals, professional feasibility and identical quoted price basis. The difference is from visitor-entered numbers only—not verified savings, equivalence certification or a preferred contractor.",
  "First-year comparison includes confirmed installation and separately billed utility costs and stated first-year ongoing charges. Later years, repair needs, electricity costs and incentives are not evaluated."
 ],needs,totals,issues,diff,lower);
}
export function sanJosePanelRequest(x:SJPanelResult):string{
 return ["SAN JOSÉ HOME LEVEL 2 — ELECTRICIAN PANEL VS MANAGED CHARGING REVIEW",
  "Source review "+SJ_PANEL_REVIEWED,"Review result: "+x.status,x.headline,
  "Please provide: existing main panel rating and measured/calculated service load, 125%-continuous-load basis where applicable, proposed EV equipment/circuit and listed load management details.",
  "State explicitly whether a panel/utility service upgrade is required by load, panel safety, or other non-EV conditions; do not assume it from a 100 A or 125 A label.",
  "Provide separate written bids for: (A) code-compliant managed EV charging without panel replacement, (B) proposed panel/service upgrade with Level 2 charging. State if the same desired charging performance is supported.",
  "Itemize equipment model, permit and inspection, separate utility charge, first-year recurring services, panel and electrical work, payment terms and warranties; verify any PG&E meter/service coordination.",
  "Confirm current active CSLB contracting classification and workers' comp/insurance status through the official CSLB check.",
  ...x.requiredEvidence.map(v=>"VERIFY: "+v),
  "Government references:",...Object.entries(SJ_PANEL_SOURCES).map(([k,v])=>k+": "+v),
  "No design approval or quote submission. No affiliate, lead capture or electrician partnership."
 ].join("\n");
}
export function sanJosePanelReport(x:SJPanelResult,input:SJPanelInput):string{
 return [sanJosePanelRequest(x),"",
 "Self-reported conditional quote review (not a safety recommendation)",
 "Managed installed: "+(input.offers[0].amount??"unknown"),
 "Upgrade installed: "+(input.offers[1].amount??"unknown"),
 "Managed first-year cost: "+(x.firstYearTotals.managed??"unknown"),
 "Upgrade first-year cost: "+(x.firstYearTotals.upgrade??"unknown"),
 "Comparison allowed: "+(x.status==="compare"),
 "Absolute quote difference: "+(x.priceDifference??"unavailable"),
 "Lower quoted total: "+(x.lowerQuote??"none"),
 ...Object.entries(x.offerIssues).flatMap(([k,v])=>v.map(z=>k+": "+z)),
 ...x.notes,"No provider endorsement, permit issuance or verified savings."].join("\n");
}
