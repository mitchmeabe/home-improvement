/** San José EV charging permit *planning*, not electrical design or permit issuance.
 * Sources reviewed 2026-11-06. Only city-jurisdiction-confirmed projects.
 */
export const SJ_EV_REVIEWED="2026-11-06";
export const SJ_EV_MAX_DAYS=30;
export const SJ_EV_SOURCES={
 city:{label:"San José — Electric Vehicle Charging Stations (2026)",url:"https://www.sanjoseca.gov/businesses/development-services-permit-center/start-your-project/electric-vehicle-charging-stations"},
 electrical:{label:"San José — Electrical Projects",url:"https://www.sanjoseca.gov/businesses/development-services-permit-center/start-your-project/electrical-projects"},
 panel:{label:"San José — Electrical Service Panel Upgrades",url:"https://www.sanjoseca.gov/businesses/development-services-permit-center/start-your-project/single-family-duplex-properties/electrical-service-panel-upgrades"},
 online:{label:"San José — Online Building Permits and eligibility by property type",url:"https://www.sanjoseca.gov/business/development-services-permit-center/online-permits-at-sjpermits-org/building-online-permits"},
 energy:{label:"US DOE — Charging Electric Vehicles at Home",url:"https://afdc.energy.gov/fuels/electricity-charging-home"},
} as const;
export type SJKey=keyof typeof SJ_EV_SOURCES;
export type SJLocation="city-verified"|"elsewhere"|"unsure";
export type SJProperty="single-duplex"|"multi-assigned"|"multi-common"|"other"|"unsure";
export type SJCharge="level1-existing"|"level1-new-outlet"|"level2"|"unsure";
export type SJPanel="not-proposed"|"proposed"|"unsure";
export type SJVent="requires-mechanical"|"confirmed-not-required"|"unsure";
export type SJInput={location:SJLocation;property:SJProperty;charge:SJCharge;panel:SJPanel;ventilation:SJVent};
export const SJ_INITIAL:SJInput={location:"unsure",property:"unsure",charge:"unsure",panel:"unsure",ventilation:"unsure"};
export type SJStatus="verify"|"outside-scope"|"no-new-station-permit"|"electrical-permit"|"additional-review"|"source-review";
export type SJOutcome={status:SJStatus;heading:string;summary:string;electricalPermit:"required"|"not-indicated"|"verify";mechanicalPermit:"possibly-required"|"verify"|"not-indicated";panelPermit:"separate-if-proposed"|"not-indicated"|"verify";onlinePath:"likely-online"|"agency-confirm"|"none";nextSteps:string[];sourceKeys:SJKey[];noAffiliate:true};
const dateOK=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+"T00:00:00Z"))&&new Date(s+"T00:00:00Z").toISOString().slice(0,10)===s;
export function sjEvidenceCurrent(asOf:string):boolean{
 if(!dateOK(asOf)||!dateOK(SJ_EV_REVIEWED))return false;
 const days=(Date.parse(asOf+"T00:00:00Z")-Date.parse(SJ_EV_REVIEWED+"T00:00:00Z"))/86400000;
 return days>=0&&days<=SJ_EV_MAX_DAYS;
}
function outcome(status:SJStatus,heading:string,summary:string,electricalPermit:SJOutcome["electricalPermit"],mechanicalPermit:SJOutcome["mechanicalPermit"],panelPermit:SJOutcome["panelPermit"],onlinePath:SJOutcome["onlinePath"],nextSteps:string[],sourceKeys:SJKey[]=["city","electrical"]):SJOutcome{
 return {status,heading,summary,electricalPermit,mechanicalPermit,panelPermit,onlinePath,nextSteps,sourceKeys,noAffiliate:true};
}
export function screenSanJoseEV(input:SJInput,asOf:string):SJOutcome{
 if(!input||typeof input!=="object"||
    !["city-verified","elsewhere","unsure"].includes(input.location)||
    !["single-duplex","multi-assigned","multi-common","other","unsure"].includes(input.property)||
    !["level1-existing","level1-new-outlet","level2","unsure"].includes(input.charge)||
    !["not-proposed","proposed","unsure"].includes(input.panel)||
    !["requires-mechanical","confirmed-not-required","unsure"].includes(input.ventilation))
  return outcome("verify","Check the property and project details","One or more answers are invalid or missing; no permit determination is offered.","verify","verify","verify","none",["Confirm your actual permit jurisdiction and equipment scope."]);
 if(!sjEvidenceCurrent(asOf))
  return outcome("source-review","City rules require fresh review","The human-reviewed rule snapshot is older than 30 days. Consult current San José requirements; no permit classification is shown.","verify","verify","verify","none",["Review the current City EV permit page before doing any electrical work."],["city","electrical","online"]);
 if(input.location!=="city-verified")
  return outcome("outside-scope","Confirm actual San José city jurisdiction","A San José mailing address or nearby ZIP code does not establish permit jurisdiction. Rules below only cover verified city properties.","verify","verify","verify","none",["Confirm your property is inside San José's building permit jurisdiction.","If it is outside the city, use your actual local authority's rules."],["city"]);
 if(input.property==="unsure"||input.property==="other"||input.charge==="unsure")
  return outcome("verify","Confirm property type and charging equipment","Online permit eligibility depends on building category, parking arrangements and whether work installs a new outlet or Level 2 equipment.","verify","verify","verify","agency-confirm",["Identify your property classification and exact equipment installation scope."],["city","online"]);
 if(input.property==="multi-common")
  return outcome("additional-review","Shared or common multifamily parking needs a separate permit pathway","San José's simple online EV path is limited to multifamily charging in assigned spaces; common areas may require the commercial/plan-review process.","verify","verify","verify","agency-confirm",["Use San José's multifamily/commercial EV permit guidance before selecting an installer or filing method.","Confirm HOA/property manager authorization and electrical infrastructure with an appropriate professional."],["city","online"]);
 const notes:string[]=[];
 const level1Existing=input.charge==="level1-existing";
 const electrical=level1Existing?"not-indicated":"required";
 const vent=input.charge==="level2"&&input.ventilation==="requires-mechanical"?"possibly-required":
            input.charge==="level2"&&input.ventilation==="unsure"?"verify":"not-indicated";
 const panel=input.panel==="proposed"?"separate-if-proposed":input.panel==="unsure"?"verify":"not-indicated";
 notes.push(level1Existing?
   "Existing Level 1 charging using an existing suitable 120V outlet, with no new electrical work, generally does not require a new charging-station permit under the City's guidance.":
   "San José requires an electrical permit for a newly installed 120V outlet or Level 2 charging equipment.");
 if(input.charge==="level2")notes.push(input.ventilation==="requires-mechanical"?
   "The manufacturer requires mechanical ventilation: ask the City about the additional mechanical permit.":
   input.ventilation==="unsure"?"Confirm whether the charging-equipment manufacturer specifies mechanical ventilation before filing.":"Confirmed no manufacturer ventilation requirement reported; verify against the actual model and City guidance.");
 if(input.panel==="proposed")notes.push("A separate electrical service-panel change requires its own permit review. A larger panel is NOT automatically necessary for Level 2 charging.");
 if(input.panel==="unsure")notes.push("Have a qualified electrician calculate actual available load and discuss managed charging; do not assume a panel upgrade is required.");
 notes.push(input.property==="multi-assigned"?
   "For multifamily assigned parking, the City's online route may be available; verify your assigned-space and other permit qualifications in SJPermits.":
   "For single-family/duplex homes, San José directs qualifying EV projects to its online SJPermits wizard.");
 notes.push("Use a qualified electrician for load, wiring, equipment, panel and inspection decisions; this tool does not perform a service/load calculation.");
 return outcome(level1Existing&&panel==="not-proposed"?"no-new-station-permit":"electrical-permit",
  level1Existing?"Existing Level 1 charging: no new station work identified":"Electrical permit guidance for your planned installation",
  "City-specific planning summary only, based on your reported property type and work. Permit issuance and approvals are decided by San José.",
  electrical,vent,panel,"likely-online",notes,["city","electrical","panel","online","energy"]);
}
export function sanJoseEVChecklist(result:SJOutcome):string {
 return ["San José EV charging project — independent planning checklist",result.heading,result.summary,...result.nextSteps,"Official sources:",...result.sourceKeys.map(k=>SJ_EV_SOURCES[k].url),"Not a permit, load calculation, rebate award or contractor referral."].join("\n");
}