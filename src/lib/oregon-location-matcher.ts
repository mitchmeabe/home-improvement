/**
 * Narrow Oregon location + utility + heat-pump project resolver.
 * Effective date of agency/source review: 2026-11-04.
 * No geocoding, inferred utility from ZIP, address storage, funding promises,
 * live permitting status, or autonomous regulation changes.
 */
import {evaluateHeatPump,FUNDING_SNAPSHOT_AS_OF,type ProjectInput,type Location,type Property} from "./heat-pump.ts";
export const LOCAL_REVIEWED_ON="2026-11-04";
export const LOCAL_SOURCES={
 jurisdiction:"https://www.portland.gov/ppd/property-addressing",
 portlandMaps:"https://www.portlandmaps.com/",
 mechanical:"https://www.portland.gov/ppd/residential-permitting/residential-mechanical-permits",
 electrical:"https://www.portland.gov/ppd/residential-permitting/do-you-need-permit/residential-permits",
 setbacks:"https://www.portland.gov/ppd/residential-permitting/residential-mechanical-permits",
 hp3:"https://www.oregon.gov/energy/incentives/Pages/HP3.aspx",
 energyTrust:"https://form.energytrust.org/",
 pge:"https://portlandgeneral.com/save-money/save-money-home/heating-cooling/high-efficiency-heat-pumps",
 pacific:"https://www.pacificpower.net/savings-energy-choices/oregon.html",
} as const;
export type JurisdictionEvidence="unverified"|"portland-confirmed"|"not-portland";
export type BuildingKind="one-two-family"|"townhouse-adu"|"multifamily-other"|"unknown";
export type ElectricUtility="pge"|"pacific-power"|"other"|"unknown";
export interface LocalProjectInput {
 location:Location;
 jurisdiction:JurisdictionEvidence;
 building:BuildingKind;
 electricUtility:ElectricUtility;
 property:Property;
 wiring:ProjectInput["wiring"];
 equipment:ProjectInput["equipment"];
 hspf2?:number;seer2?:number;
}
export type LocalStatus="required"|"check"|"not-applicable";
export interface LocalFinding {
 id:string;title:string;status:LocalStatus;
 detail:string;sourceUrl:string;
}
export interface LocalProjectResult {
 permitAuthority:"portland-confirmed"|"not-established"|"outside-portland";
 effectiveLocation:Location;
 locationFindings:LocalFinding[];
 programs:LocalFinding[];
 questions:string[];
}
export function resolveOregonProject(input:LocalProjectInput):LocalProjectResult{
 const isOregon=input.location!=="outside-oregon";
 const citySelected=input.location==="portland";
 const confirmed=citySelected&&input.jurisdiction==="portland-confirmed";
 const outsidePortland=input.location==="other-oregon"||citySelected&&input.jurisdiction==="not-portland";
 const effectiveLocation:Location=confirmed?"portland":outsidePortland?"other-oregon":
   input.location==="outside-oregon"?"outside-oregon":"unknown";
 const structureOk=input.building==="one-two-family"||input.building==="townhouse-adu";
 const permitAuthority=confirmed?"portland-confirmed":outsidePortland?"outside-portland":"not-established";
 const locationFindings:LocalFinding[]=[];
 const programs:LocalFinding[]=[];
 const questions:string[]=[];
 const add=(a:LocalFinding[],id:string,title:string,status:LocalStatus,detail:string,sourceUrl:string)=>
   a.push({id,title,status,detail,sourceUrl});
 if(confirmed&&structureOk){
   add(locationFindings,"mechanical","Portland residential mechanical permit","required",
     "City guidance lists heat pumps and mini-splits as work requiring mechanical permits. Ask who applies, pays fees and schedules final inspection.",LOCAL_SOURCES.mechanical);
   add(locationFindings,"electrical","Electrical permit for installation",
     input.wiring==="new-hardwired-work"?"required":"check",
     input.wiring==="new-hardwired-work"?
       "New or altered hard-wired electrical systems require a permit; review permit scope with Portland.":
       "Most mechanical projects also need electrical permits; verify the exact circuit and wiring scope.",LOCAL_SOURCES.electrical);
   add(locationFindings,"site","Outdoor-unit zoning and setbacks","check",
     "Portland lists outdoor equipment setback rules and site-specific restrictions. Verify placement, property history and historic protections before signing.",LOCAL_SOURCES.setbacks);
   questions.push("Does the proposal include mechanical and any electrical permit fees, inspections, and outdoor unit site constraints?");
 }else{
   add(locationFindings,"authority","Identify correct permit authority","check",
     input.location==="outside-oregon"?
       "Portland rules do not apply outside Oregon. Contact the local building authority.":
     input.jurisdiction==="not-portland"||input.location==="other-oregon"?
       "A Portland mailing address does not confer Portland jurisdiction. Locate the actual city's or county's permit authority.":
       "Check the Jurisdiction field for your property in PortlandMaps. An address or ZIP code alone is not proof of city limits.",LOCAL_SOURCES.jurisdiction);
   if(confirmed&&!structureOk)
     questions.push("Is this a one/two-family dwelling, townhouse or ADU? Other buildings require a different permit path.");
   else questions.push("Which jurisdiction issues mechanical and electrical permits for the actual property?");
 }
 if(isOregon){
   const statewide=evaluateHeatPump({
     location:effectiveLocation,property:input.property,equipment:input.equipment,
     wiring:input.wiring,hspf2:input.hspf2,seer2:input.seer2
   });
   const hp3State:LocalStatus=statewide.funding==="not-applicable"?"not-applicable":"check";
   add(programs,"hp3","Oregon Heat Pump Purchase Program (HP3)",hp3State,
    (input.property==="existing-owner-occupied"?
      "Existing owner-occupied funding was fully reserved in the October 1, 2026 ODOE table. Previously approved reservations may differ. ":
      input.property==="existing-rental"||input.property==="new-construction"?
      "Rental/new-construction funds were listed as of October 1, 2026; no current availability is established. ":
      "")+
    "ODOE's "+FUNDING_SNAPSHOT_AS_OF+" funding snapshot is not a live reservation or eligibility decision. Confirm approved contractor, installation, category, efficiency and stacking with ODOE.",LOCAL_SOURCES.hp3);
   questions.push("Does an ODOE-approved contractor confirm a current HP3 reservation or application path and actual upfront reduction?");
   if(input.electricUtility==="pge"||input.electricUtility==="pacific-power"){
     const ordinaryHome=input.building==="one-two-family"&&input.property==="existing-owner-occupied";
     add(programs,"eto","Energy Trust of Oregon residential heat-pump incentives","check",
       "PGE or Pacific Power is among Energy Trust's participating electric utilities. "+
       (ordinaryHome?"Your reported residence may fit the single-family inquiry path. ":"Other building/ownership conditions require separate program checks. ")+
       "Electric service alone does not establish an incentive: verify primary heating fuel, equipment models, program availability, installer and application timing. No amount is estimated.",LOCAL_SOURCES.energyTrust);
     questions.push("Which Energy Trust program and exact model/contractor conditions apply, and may it combine with HP3?");
     if(input.electricUtility==="pge")add(programs,"utility","Portland General Electric heat-pump guidance","check",
       "Review PGE's current promotions and utility-specific installation conditions; 2026 limited-time promotions may already be expired.",LOCAL_SOURCES.pge);
   }else{
     add(programs,"eto","Utility-specific incentives not matched","check",
       "Choose the actual electric utility from the bill. Energy Trust also has gas-utility and property-specific pathways not determined from this selection.",LOCAL_SOURCES.energyTrust);
     questions.push("Which electric and gas utilities serve the property, and is a rebate program accepting new applications?");
   }
 }else{
   add(programs,"oregon","Oregon incentive applicability","not-applicable",
     "Oregon's HP3 and Energy Trust programs are not an incentive route for an out-of-state property.",LOCAL_SOURCES.hp3);
 }
 return {permitAuthority,effectiveLocation,locationFindings,programs,questions};
}
