/**
 * Oregon project dossier. COMPOSE existing work-specific rule engines instead
 * of creating independent permit / incentive logic. Published city rules are
 * attached only to a user-reported Portland jurisdiction and supported housing.
 *
 * Not a parcel lookup, live rebate reservation, permit issuance or eligibility
 * certification. Inputs are never persisted or sent to a government service.
 */
import {resolveOregonProject,LOCAL_REVIEWED_ON,LOCAL_SOURCES,
 type LocalFinding,type ElectricUtility,type BuildingKind} from "./oregon-location-matcher.ts";
import {evaluateHeatPump,FUNDING_SNAPSHOT_AS_OF,type Property,
 type Equipment} from "./heat-pump.ts";
import {evaluate as evaluateWaterHeater,newQuote,HPWH_SOURCES,HPWH_OFFER_PUBLISHED,
 type HouseType} from "./oregon-heat-pump-water-heater.ts";

export const DOSSIER_REVIEWED_ON="2026-11-04";
export const DOSSIER_SOURCES={
 property:"https://www.portlandmaps.com/",
 propertyGuidance:"https://www.portland.gov/ppd/property-addressing",
 plumbing:"https://www.portland.gov/ppd/residential-permitting/residential-plumbing-permits",
 mechanical:"https://www.portland.gov/ppd/residential-permitting/residential-mechanical-permits",
 electrical:"https://www.portland.gov/ppd/residential-permitting/residential-electrical-permits",
 panel:"https://www.portland.gov/ppd/residential-permitting/residential-electrical-permits/lights-outlets-switches-reconnection",
 hp3:"https://www.oregon.gov/energy/incentives/Pages/HP3.aspx",
 waterHeaterOffer:"https://insider.energytrust.org/home-retrofit-incentive-updates/",
 energyTrust:"https://form.energytrust.org/"
} as const;
export type ProjectKind="space-heat-pump"|"heat-pump-water-heater"|"electrical-panel";
export type ProjectPlace="portland-reported"|"portland-unverified"|"other-oregon"|"outside-oregon"|"unknown";
export type ProjectHouse="one-two-family"|"townhouse-adu"|"other"|"unknown";
export type ElectricScope="panel-replacement"|"new-circuit"|"both"|"none-reported"|"unknown";
export type YesNoUnknown="yes"|"no"|"unknown";
export interface DossierInput{
 project:ProjectKind;
 place:ProjectPlace;
 house:ProjectHouse;
 property:Property;
 electricUtility:ElectricUtility;
 installRoute:"contractor"|"do-it-yourself"|"unknown";
 electricScope:ElectricScope;
 existingWaterHeaterFuel:"electric"|"gas"|"other"|"unknown";
 waterHeaterReplacement:YesNoUnknown;
 ventilationChange:YesNoUnknown;
 heatingEquipment:Equipment;
 hspf2:number|null;
 seer2:number|null;
 plannedInstallationDate:string;
}
export const initialDossierInput=():DossierInput=>({
 project:"space-heat-pump",place:"portland-unverified",house:"unknown",
 property:"existing-owner-occupied",electricUtility:"unknown",installRoute:"unknown",
 electricScope:"unknown",existingWaterHeaterFuel:"unknown",
 waterHeaterReplacement:"unknown",ventilationChange:"unknown",
 heatingEquipment:"heat-pump",hspf2:null,seer2:null,plannedInstallationDate:""
});
export type FindingGroup="jurisdiction"|"permit"|"incentive"|"equipment";
export type FindingStatus="required"|"verify"|"not-applicable"|"historical-limit";
export interface DossierFinding {
 id:string;group:FindingGroup;status:FindingStatus;title:string;detail:string;
 sourceUrl:string;sourceDate:string;basis:"official-conditional-rule"|"dated-program-snapshot"|"pending-fact";
}
export interface DocumentRequest{
 id:string;title:string;owner:"property owner"|"contractor"|"both";
 when:string;sourceUrl:string;
}
export interface DossierResult{
 project:ProjectKind;
 reviewedOn:string;plannedDate:string|null;
 jurisdiction:"user-reported-portland"|"not-established"|"outside-portland";
 findings:DossierFinding[];documents:DocumentRequest[];
 blockers:string[];nextActions:string[];questions:string[];
 counts:{required:number;verify:number;historicalLimit:number};
 canTreatAsPermitApproval:false;canClaimRebate:false;confirmedUtilityAccount:false;
 plainText:string;
}
const choice=<T extends string>(v:T,allowed:readonly string[])=>allowed.includes(v);
const validDate=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+"T00:00:00Z"))&&
 new Date(v+"T00:00:00Z").toISOString().slice(0,10)===v;
const hasElectricalWork=(v:ElectricScope)=>v==="both"||v==="new-circuit"||v==="panel-replacement";
const hasPanel=(v:ElectricScope)=>v==="both"||v==="panel-replacement";
const status=(x:LocalFinding["status"]):FindingStatus=>x==="required"?"required":x==="not-applicable"?"not-applicable":"verify";
const belongsToOregon=(p:ProjectPlace)=>p==="portland-reported"||p==="portland-unverified"||p==="other-oregon";
const unique=(items:string[])=>[...new Set(items)];
const names:Record<ProjectKind,string>={
 "space-heat-pump":"Space-heating heat pump",
 "heat-pump-water-heater":"Heat-pump water heater",
 "electrical-panel":"Electrical service / panel"
};
export function resolveProjectDossier(input:DossierInput):DossierResult{
 if(!choice(input.project,["space-heat-pump","heat-pump-water-heater","electrical-panel"])||
  !choice(input.place,["portland-reported","portland-unverified","other-oregon","outside-oregon","unknown"])||
  !choice(input.house,["one-two-family","townhouse-adu","other","unknown"])||
  !choice(input.property,["existing-owner-occupied","existing-rental","new-construction","vacation-or-commercial","other"])||
  !choice(input.electricUtility,["pge","pacific-power","other","unknown"])||
  !choice(input.installRoute,["contractor","do-it-yourself","unknown"])||
  !choice(input.electricScope,["panel-replacement","new-circuit","both","none-reported","unknown"])||
  !choice(input.existingWaterHeaterFuel,["electric","gas","other","unknown"])||
  ![input.waterHeaterReplacement,input.ventilationChange].every(v=>choice(v,["yes","no","unknown"]))||
  !choice(input.heatingEquipment,["heat-pump","mini-split"])||
  [input.hspf2,input.seer2].some(v=>v!==null&&(!Number.isFinite(v)||v<=0||v>100))||
  (input.plannedInstallationDate!==""&&!validDate(input.plannedInstallationDate)))
   throw new RangeError("Unsupported Oregon project dossier input.");
 const findings:DossierFinding[]=[];
 const docs:DocumentRequest[]=[];
 const blockers:string[]=[];
 const questions:string[]=[];
 const add=(group:FindingGroup,id:string,title:string,level:FindingStatus,
   detail:string,sourceUrl:string,sourceDate=DOSSIER_REVIEWED_ON,
   basis:DossierFinding["basis"]="official-conditional-rule")=>{
  const next={id,group,title,status:level,detail,sourceUrl,sourceDate,basis};
  const index=findings.findIndex(f=>f.id===id);
  if(index>=0)findings[index]=next;
  else findings.push(next);
 };
 const doc=(id:string,title:string,owner:DocumentRequest["owner"],when:string,sourceUrl:string)=>{
  if(!docs.some(x=>x.id===id))docs.push({id,title,owner,when,sourceUrl});
 };
 const portland=input.place==="portland-reported";
 const housing=input.house==="one-two-family"||input.house==="townhouse-adu";
 const cityResidential=portland&&housing;
 const oregon=belongsToOregon(input.place);
 const authority:DossierResult["jurisdiction"]=portland?"user-reported-portland":
  input.place==="other-oregon"||input.place==="outside-oregon"?"outside-portland":"not-established";
 if(!portland){
  add("jurisdiction","parcel-jurisdiction","Identify the actual property permit authority","verify",
   input.place==="portland-unverified"?
    "A Portland mailing address or ZIP code is not proof of city jurisdiction. Find the parcel in PortlandMaps and check its Jurisdiction field before applying city rules.":
    input.place==="other-oregon"?"The property is outside Portland according to the entered location. Ask its own city or county for applicable trade permits.":
    input.place==="outside-oregon"?"Oregon and Portland permits cannot establish this out-of-state property's requirements.":
    "State and actual permit jurisdiction are unknown. Verify the property in official mapping or local permitting records.",
   DOSSIER_SOURCES.propertyGuidance,DOSSIER_REVIEWED_ON,"pending-fact");
  blockers.push("Actual parcel permit jurisdiction is not established by this application.");
 }else if(!housing){
  add("jurisdiction","building-class","Confirm building permit classification","verify",
   "You reported Portland jurisdiction, but the one/two-family/townhouse/ADU guidance cannot be applied automatically to an unknown, multifamily or commercial building.",
   DOSSIER_SOURCES.propertyGuidance,DOSSIER_REVIEWED_ON,"pending-fact");
  blockers.push("Residential one/two-family, townhouse or ADU permit pathway is not established.");
 }else{
  add("jurisdiction","parcel-jurisdiction","Portland residential permit pathway (user-reported)","verify",
   "Based on your statement that PortlandMaps shows Portland jurisdiction and your building type. This tool did NOT query or authenticate your parcel; recheck the official map and property classification.",
   DOSSIER_SOURCES.property,DOSSIER_REVIEWED_ON,"pending-fact");
 }
 doc("parcel","Property jurisdiction and dwelling classification","property owner",
  "Before contracting or filing permits; record the official parcel result without entering an address here.",DOSSIER_SOURCES.property);
 doc("bid","Itemized contractor proposal and written responsibilities","both",
  "Before signing; clarify equipment, scope, materials, permits, electrical work and any advertised incentives.",DOSSIER_SOURCES.electrical);
 // Reuse the existing, separately audited space heat-pump source rules.
 if(input.project==="space-heat-pump"){
  const loc=resolveOregonProject({
   location:input.place==="outside-oregon"?"outside-oregon":
    input.place==="unknown"?"unknown":
    input.place==="other-oregon"?"other-oregon":"portland",
   jurisdiction:portland?"portland-confirmed":input.place==="other-oregon"?"not-portland":"unverified",
   building:input.house==="one-two-family"?"one-two-family":
    input.house==="townhouse-adu"?"townhouse-adu":"multifamily-other" as BuildingKind,
   electricUtility:input.electricUtility,property:input.property,
   equipment:input.heatingEquipment,
   wiring:hasElectricalWork(input.electricScope)?"new-hardwired-work":
    input.electricScope==="none-reported"?"no-known-work":"unsure"
  });
  for(const f of loc.locationFindings){
   if(f.id==="authority"||f.id==="site"&&!(cityResidential))continue;
   add("permit","space-"+f.id,f.title,status(f.status),f.detail,f.sourceUrl,LOCAL_REVIEWED_ON);
  }
  for(const f of loc.programs)add("incentive","space-"+f.id,f.title,
   f.id==="hp3"&&input.installRoute==="do-it-yourself"?"not-applicable":
    f.id==="hp3"&&input.property==="existing-owner-occupied"&&oregon?"historical-limit":status(f.status),
   f.id==="hp3"&&input.installRoute==="do-it-yourself"?
    "HP3 is delivered through an ODOE-approved contractor, not a DIY installation. Change the route to an approved contractor before pursuing program funding. "+f.detail:f.detail,f.sourceUrl,f.id==="hp3"?FUNDING_SNAPSHOT_AS_OF:LOCAL_REVIEWED_ON,
   f.id==="hp3"?"dated-program-snapshot":"pending-fact");
  const hp=evaluateHeatPump({
   location:loc.effectiveLocation,property:input.property,
   equipment:input.heatingEquipment,wiring:hasElectricalWork(input.electricScope)?"new-hardwired-work":"unsure",
   ...(input.hspf2!==null?{hspf2:input.hspf2}:{}),
   ...(input.seer2!==null?{seer2:input.seer2}:{})
  });
  add("equipment","hp3-efficiency","General HP3 equipment efficiency (not approval)",
   hp.efficiency==="below-threshold"?"verify":"verify",hp.efficiencyExplanation,
   DOSSIER_SOURCES.hp3,FUNDING_SNAPSHOT_AS_OF,"dated-program-snapshot");
  if(input.installRoute==="do-it-yourself")
   blockers.push("HP3 is not an incentive for DIY installation; an ODOE-approved contractor must install and apply.");
  if(hp.efficiency==="below-threshold")
   blockers.push("Entered equipment ratings are below a general HP3 numeric threshold; clarify system class and current program policy.");
  if(input.hspf2===null||input.seer2===null)
   blockers.push("Equipment model and published SEER2/HSPF2 ratings have not both been entered.");
  doc("mechanical","Mechanical permit number and final inspection","contractor",
   "Portland if confirmed and residential; otherwise confirm corresponding local authority.",DOSSIER_SOURCES.mechanical);
  doc("equipment","Exact indoor/outdoor model schedule and published ratings","contractor",
   "Before accepting a quote; match specifications to the program and installed system.",DOSSIER_SOURCES.hp3);
  doc("hp3","Current HP3 contractor approval, eligible category and incentive statement","contractor",
   "Before promising savings; homeowner-owned funding was fully reserved in ODOE's Oct. 1 snapshot.",DOSSIER_SOURCES.hp3);
  doc("invoice","Signed final project invoice and any upfront incentive reduction","both",
   "At project completion; retain the invoice and relevant completion documents.",DOSSIER_SOURCES.hp3);
  questions.push(...loc.questions);
  blockers.push("HP3 funding and any utility incentive are not live-confirmed by the application.");
 }else if(input.project==="heat-pump-water-heater"){
  const r=evaluateWaterHeater({
   place:input.place==="portland-reported"?"portland-verified":
    input.place==="portland-unverified"?"portland-unverified":
    input.place==="other-oregon"?"other-oregon":
    input.place==="outside-oregon"?"outside-oregon":"unknown",
   house:input.house==="one-two-family"?"one-two-family":"other" as HouseType,
   dwelling:input.property==="existing-owner-occupied"?"existing-owner":
    input.property==="existing-rental"?"existing-rental":
    input.property==="new-construction"?"new-construction":
    input.property==="vacation-or-commercial"?"other":"unknown",
   utility:input.electricUtility,installation:input.installRoute,
   currentFuel:input.existingWaterHeaterFuel,
   replacement:input.waterHeaterReplacement,
   newWiring:hasElectricalWork(input.electricScope)?"yes":
    input.electricScope==="none-reported"?"no":"unknown",
   newVentilation:input.ventilationChange,
   quotes:[newQuote("a"),newQuote("b")]
  });
  for(const f of r.permits){
   if(f.id==="jurisdiction")continue;
   add("permit","water-"+f.id,f.title,status(f.status),f.detail,HPWH_SOURCES[f.source],DOSSIER_REVIEWED_ON);
  }
  if(portland&&input.house==="townhouse-adu"){
   add("permit","water-plumbing","Portland residential plumbing permit",
    input.waterHeaterReplacement==="yes"?"required":"verify",
    "Portland's published residential plumbing guidance covers townhouses and ADUs and lists water-heater replacement as permit work; confirm the actual water-heater and piping scope.",
    DOSSIER_SOURCES.plumbing);
   add("permit","water-electrical","Electrical installation and circuit","verify",
    "Portland's residential electrical guidance covers townhouse and ADU work. Verify what new circuits, wiring or connections are required for the specific installation.",
    DOSSIER_SOURCES.electrical);
  }
  for(const f of r.programs)add("incentive","water-"+f.id,f.title,status(f.status),f.detail,
   HPWH_SOURCES[f.source],f.source==="utility"?HPWH_OFFER_PUBLISHED:DOSSIER_REVIEWED_ON,
   "dated-program-snapshot");
  if(input.electricUtility==="unknown")
   blockers.push("The serving electric utility is unknown; a utility incentive cannot be matched.");
  if(input.installRoute==="unknown")
   blockers.push("The contractor/distributor versus in-store purchasing route is unknown.");
  doc("plumbing","Plumbing permit, inspection and water heater piping scope","contractor",
   "Before installation and at final inspection; confirm the correct authority.",DOSSIER_SOURCES.plumbing);
  doc("equipment","Exact heat-pump water heater model, tank capacity and installation clearance","contractor",
   "Before signing; verify electrical circuit, condensate, noise and airflow.",DOSSIER_SOURCES.waterHeaterOffer);
  doc("water-incentive","Current transaction-level Energy Trust incentive proof","both",
   "Before trusting any discounted bid; published May 2026 offers are not awards.",DOSSIER_SOURCES.waterHeaterOffer);
  doc("invoice","Final itemized invoice and retained incentive / warranty paperwork","both",
   "At purchase and final inspection.",DOSSIER_SOURCES.waterHeaterOffer);
  questions.push(...r.questions);
  blockers.push("Published 2026 heat-pump water heater discounts are not verified as current or assigned to this purchase.");
 }else{
  add("equipment","electrical-load","Panel/service sizing and utility coordination","verify",
   "Request an electrician's written load calculation and existing/new panel ampacity; clarify panel-versus-service upgrade, utility coordination, meter and outage scope. This site does not size a service.",
   DOSSIER_SOURCES.panel,DOSSIER_REVIEWED_ON,"pending-fact");
  add("incentive","panel-incentive","Panel upgrade incentive screening","verify",
   "No general Oregon rebate is calculated for panel-only work in this pilot. If a contractor proposes incentives, obtain the exact sponsoring program, eligibility rules and preapproval; do not assume heat-pump rebates apply.",
   DOSSIER_SOURCES.energyTrust,DOSSIER_REVIEWED_ON,"pending-fact");
  doc("load","Electrical load study, panel schedule and scope of work","contractor",
   "Before choosing panel amperage or signing a contract.",DOSSIER_SOURCES.panel);
  doc("utility","Utility meter/service coordination and outage plan","both",
   "Before any service modification or reconnection.",DOSSIER_SOURCES.panel);
  questions.push("Is the project a breaker-panel replacement, a service/meter upgrade, or new subpanel? Are new circuits separately priced?");
  questions.push("Will the utility disconnect/reconnect service, and are meter, mast, grounding, permits and inspections included?");
 }
 // Shared electrical work is additive to mechanical or plumbing permits.
 const panelWork=input.project==="electrical-panel"||hasPanel(input.electricScope);
 const newCircuit=input.electricScope==="new-circuit"||input.electricScope==="both";
 if(cityResidential&&(panelWork||newCircuit)){
  add("permit","electrical-trade",
   panelWork?"Portland service / panel electrical permit":"Portland new-circuit electrical permit",
   "required",
   panelWork?
    "Portland requires a permit to replace a service panel and provides service/feeder inspection guidance. Ask the electrician whether the quoted work includes the panel, utility service, meter, branch circuits and final inspection.":
    "Portland requires an electrical permit for added or altered hard-wired circuits. Confirm how the new circuit connects to this project's equipment and who closes the permit.",
   panelWork?DOSSIER_SOURCES.panel:DOSSIER_SOURCES.electrical);
 }else if(panelWork||newCircuit||input.project==="electrical-panel"){
  add("permit","electrical-trade","Verify local electrical permit and inspections","verify",
   "Panel/service work or a new circuit is reported, but this tool cannot apply Portland's permit requirements without a confirmed supported city/building route. Contact the actual authority.",
   DOSSIER_SOURCES.electrical,DOSSIER_REVIEWED_ON,"pending-fact");
 }else if(input.electricScope==="unknown"){
  add("permit","electrical-trade","Identify electrical installation work","verify",
   "Whether a circuit, panel, service or meter modification is necessary has not been determined. Request a written installer/electrician scope before selecting permit types.",
   DOSSIER_SOURCES.electrical,DOSSIER_REVIEWED_ON,"pending-fact");
  blockers.push("Electrical circuit and panel/service work are not yet defined.");
 }
 if(panelWork||newCircuit||input.project==="electrical-panel"){
  doc("electrical","Electrical permit and service/final inspections","contractor",
   "Before electrical work; obtain permit numbers and passed inspection records.",DOSSIER_SOURCES.electrical);
  doc("scope","Itemized wiring, panel, service and circuit change order","contractor",
   "Before accepting equipment installation or service upgrade scope.",DOSSIER_SOURCES.panel);
  questions.push("Who obtains the electrical permit and closes the final/service inspection? Are utility charges and any new branch circuits included?");
 }
 if(input.installRoute==="do-it-yourself"&&
  (input.property!=="existing-owner-occupied"||input.house==="townhouse-adu")){
  blockers.push("DIY electrical-work rights are not assumed for a rental, sale, ADU or other restricted property. Verify Oregon license and owner-occupancy rules.");
  add("permit","licensed-work","Trade licensing / homeowner-work restriction","verify",
   "Portland's homeowner electrical exception is limited to a recorded owner who lives in the property. Rental, future-sale and ADU work needs further licensed-contractor review.",
   DOSSIER_SOURCES.electrical,DOSSIER_REVIEWED_ON,"pending-fact");
 }
 if(input.plannedInstallationDate){
  if(input.plannedInstallationDate>DOSSIER_REVIEWED_ON)
   blockers.push("The planned installation date is later than the last source review; recheck applicable permit rules and incentive terms at that date.");
  doc("timeline","Installation date, permit inspections and program deadlines","both",
   "Confirm requirements effective for the actual installation/submission dates.",DOSSIER_SOURCES.hp3);
 }
 if(!oregon&&input.place==="outside-oregon"){
  for(const f of findings.filter(x=>x.group==="incentive"&&x.id!=="panel-incentive")){
   f.status="not-applicable";
   f.detail="The entered property is outside Oregon; Oregon incentive pathways do not establish eligibility for this location.";
  }
 }
 if(input.electricUtility==="pge"||input.electricUtility==="pacific-power")
  blockers.push("Electric utility is selected by the visitor, not authenticated against a utility account.");
 const nextActions=unique([
  !cityResidential?"Check the parcel jurisdiction, building class and actual city/county trade permit authority.":
   "Save the official parcel Jurisdiction record and confirm permit applications with Portland.",
  ...(panelWork||newCircuit||input.project==="electrical-panel"?
   ["Have a licensed electrician identify every panel, service and circuit change and document permit/inspection responsibility."]:[]),
  "Request a written itemized proposal identifying all equipment, permit fees, inspections, electrical scope and exclusions.",
  input.project==="space-heat-pump"?
   "Confirm current HP3 funding category, model ratings and any stacking restrictions with an ODOE-approved contractor.":
   input.project==="heat-pump-water-heater"?
   "Confirm the actual distributor/retail Energy Trust offer, exact model and whether a discount is already in the bid.":
   "Ask the utility and licensed electrician for service/meter coordination and any specific panel-incentive program.",
  "Retain model specifications, issued/closed permits, completed inspections, signed final invoice and warranty terms."
 ]);
 const counts={
  required:findings.filter(f=>f.status==="required").length,
  verify:findings.filter(f=>f.status==="verify").length,
  historicalLimit:findings.filter(f=>f.status==="historical-limit").length
 };
 const lines=[
  "OREGON PROPERTY / PROJECT REQUIREMENTS DOSSIER — "+DOSSIER_REVIEWED_ON,
  "INDEPENDENT RESEARCH ONLY. No government parcel or utility account was queried. No permit, rebate, or equipment eligibility is approved.",
  "Project: "+names[input.project],
  "Property location: "+input.place+" (visitor statement); housing: "+input.house+"; property category: "+input.property,
  "Electric utility: "+input.electricUtility+" (visitor statement); installation: "+input.installRoute,
  "Electrical work: "+input.electricScope+"; planned date: "+(input.plannedInstallationDate||"not entered"),
  ...(input.project==="space-heat-pump"?["Equipment: "+input.heatingEquipment+
   "; HSPF2: "+(input.hspf2??"unknown")+"; SEER2: "+(input.seer2??"unknown")]:[]),
  ...(input.project==="heat-pump-water-heater"?["Water heater replacement: "+input.waterHeaterReplacement+
   "; existing fuel: "+input.existingWaterHeaterFuel+"; venting: "+input.ventilationChange]:[]),
  "",
  "OFFICIAL RULE / PROGRAM FINDINGS",
  ...findings.map(f=>"["+f.status.toUpperCase()+"] "+f.title+" — "+f.detail+
   "\n  Source reviewed/snapshot: "+f.sourceDate+" | "+f.sourceUrl+
   " | "+f.basis),
  "",
  "EVIDENCE AND DOCUMENT REQUESTS",
  ...docs.map((d,i)=>String(i+1)+". "+d.title+" — owner: "+d.owner+
   "; when: "+d.when+" | "+d.sourceUrl),
  "",
  "UNRESOLVED FACTS",
  ...(blockers.length?unique(blockers).map(s=>"- "+s):["- Government permit jurisdiction, program participation and final eligibility remain subject to independent verification."]),
  "",
  "NEXT ACTIONS",
  ...nextActions.map((s,i)=>String(i+1)+". "+s),
  "",
  "CONTRACTOR QUESTIONS",
  ...unique(questions).map((s,i)=>String(i+1)+". "+s),
  "",
  "NO government parcel verification. NO utility account verification. NO issued permit, rebate award, or purchase recommendation."
 ];
 return {project:input.project,reviewedOn:DOSSIER_REVIEWED_ON,
  plannedDate:input.plannedInstallationDate||null,jurisdiction:authority,
  findings,documents:docs,blockers:unique(blockers),nextActions,
  questions:unique(questions),counts,
  canTreatAsPermitApproval:false,canClaimRebate:false,confirmedUtilityAccount:false,
  plainText:lines.join("\n")};
}
