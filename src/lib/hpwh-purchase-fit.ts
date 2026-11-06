/**
 * Oregon HPWH buyer's installation fit and model-equivalence decision.
 * All model specifications and room dimensions are user-supplied, not verified.
 * Never approves a water heater, circuit, permit, rebate, safe hot-water capacity,
 * room ventilation, or professional installation. No consumer data transmitted.
 */
import {evaluate,type Input,type Quote,type Result} from "./oregon-heat-pump-water-heater.ts";

export const HPWH_FIT_REVIEWED="2026-11-06";
export const HPWH_FIT_SOURCES={
  energyStarDesign:{
    title:"ENERGY STAR — Heat Pump Water Heater Design Considerations",
    url:"https://www.energystar.gov/partner-resources/residential_new/educational_resources/sup_program_guidance/heat_pump_water_heater_guide/design_considerations"
  },
  energyStarInstall:{
    title:"ENERGY STAR — Heat Pump Water Heater Installation Best Practices",
    url:"https://www.energystar.gov/partner-resources/residential_new/educational_resources/sup_program_guidance/heat_pump_water_heater_guide/installation_best_practices"
  },
  doe:{
    title:"U.S. DOE Building America — Heat Pump Water Heaters for Single-Family Homes",
    url:"https://basc.pnnl.gov/resource-guides/heat-pump-water-heaters-single-family-homes"
  },
  energyStarBuying:{
    title:"ENERGY STAR — Super-Efficient Water Heater Buying and Installation",
    url:"https://www.energystar.gov/products/energy_star_home_upgrade/super_efficient_water_heater"
  },
} as const;

export type FitAnswer="yes"|"no"|"unknown";
export type SiteLocation="garage"|"basement"|"closet"|"utility-room"|"other"|"unknown";
export type Ambient="typically-above-38"|"often-below-38"|"unknown";
export type ExistingPower="usable-240"|"usable-120"|"no-known-circuit"|"unknown";
export type Drain="nearby-gravity"|"pump-needed"|"no-path"|"unknown";
export type HotWaterDemand="typical"|"high-demand"|"unknown";
export interface HPWHSite {
  location:SiteLocation;
  lengthFt:number|null;
  widthFt:number|null;
  heightFt:number|null;
  temperature:Ambient;
  power:ExistingPower;
  drain:Drain;
  demand:HotWaterDemand;
}
export const newHPWHSite=():HPWHSite=>({
 location:"unknown",lengthFt:null,widthFt:null,heightFt:null,
 temperature:"unknown",power:"unknown",drain:"unknown",demand:"unknown"
});
export type Voltage="120"|"240"|"other"|"unknown";
export type AirPlan="open-room"|"manufacturer-approved-vent"|"unknown";
export interface HPWHModelReview {
  id:Quote["id"];
  model:string;
  manufacturerMinimumAirFt3:number|null;
  airPlan:AirPlan;
  ventPlanDocumented:FitAnswer;
  firstHourGallons:number|null;
  uef:number|null;
  voltage:Voltage;
  circuitPlanDocumented:FitAnswer;
  condensateSolutionIncluded:FitAnswer;
  modelOperatingTemperatureChecked:FitAnswer;
  serviceClearanceDocumented:FitAnswer;
  noiseAndCoolingDiscussed:FitAnswer;
  commissioningAndHandoverIncluded:FitAnswer;
}
export const newHPWHModelReview=(id:Quote["id"]):HPWHModelReview=>({
 id,model:"",manufacturerMinimumAirFt3:null,airPlan:"unknown",
 ventPlanDocumented:"unknown",firstHourGallons:null,uef:null,
 voltage:"unknown",circuitPlanDocumented:"unknown",
 condensateSolutionIncluded:"unknown",modelOperatingTemperatureChecked:"unknown",
 serviceClearanceDocumented:"unknown",noiseAndCoolingDiscussed:"unknown",
 commissioningAndHandoverIncluded:"unknown"
});
export interface HPWHModelFinding{
 id:Quote["id"];
 kind:"needs-revision"|"needs-information"|"documented-for-professional-review";
  issues:string[];
  documented:number;
  totalChecks:number;
  airVolumeAssessment:string;
}
export interface HPWHFitAssessment{
 status:"source-review"|"site-review"|"material-differences"|"missing-model-evidence"|"ready-for-professional-review";
 title:string;
 summary:string;
 measuredRoomVolumeFt3:number|null;
 findings:HPWHModelFinding[];
 differences:string[];
 projectQuestions:string[];
 safeToCompareAsQuoted:boolean;
 priceComparisonExplanation:string;
 notProductApproval:true;
 noRebateAssumption:true;
}
function dateAge(asOf:string):number|null{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(asOf))return null;
 const t=Date.parse(asOf+"T00:00:00Z"),base=Date.parse(HPWH_FIT_REVIEWED+"T00:00:00Z");
 if(!Number.isFinite(t)||new Date(t).toISOString().slice(0,10)!==asOf)return null;
 return Math.floor((t-base)/86400000);
}
export function hpwhFitSourceFresh(date:string):boolean{
 const age=dateAge(date);return age!==null&&age>=0&&age<=60;
}
const oneOf=(x:unknown,options:readonly string[])=>typeof x==="string"&&options.includes(x);
const numeric=(x:number|null,min:number,max:number)=>
 x===null||(typeof x==="number"&&Number.isFinite(x)&&x>=min&&x<=max);
const known=(x:string)=>x!=="unknown"&&x.length>0;
export function assessHPWHFit(input:Input,site:HPWHSite,models:readonly HPWHModelReview[],asOf:string):HPWHFitAssessment{
 // Reuse the upstream project's strict scope, permit and price input validation.
 const original:Result=evaluate(input);
 if(!site||!oneOf(site.location,["garage","basement","closet","utility-room","other","unknown"])||
   !oneOf(site.temperature,["typically-above-38","often-below-38","unknown"])||
   !oneOf(site.power,["usable-240","usable-120","no-known-circuit","unknown"])||
   !oneOf(site.drain,["nearby-gravity","pump-needed","no-path","unknown"])||
   !oneOf(site.demand,["typical","high-demand","unknown"])||
   !numeric(site.lengthFt,.1,150)||!numeric(site.widthFt,.1,150)||!numeric(site.heightFt,.1,30)||
   (site.lengthFt!==null&&site.widthFt!==null&&site.heightFt!==null&&
    site.lengthFt*site.widthFt*site.heightFt>1000000))
  throw new RangeError("Invalid reported installation site or measured room dimensions.");
 if(models.length!==input.quotes.length||new Set(models.map(x=>x.id)).size!==models.length||
    !input.quotes.every(q=>models.some(x=>x.id===q.id)))
  throw new RangeError("Give each existing quote exactly one matching model review.");
 for(const m of models){
  if(!["a","b","c"].includes(m.id)||m.model.length>100||
   !numeric(m.manufacturerMinimumAirFt3,1,10000)||
   !numeric(m.firstHourGallons,1,300)||
   !numeric(m.uef,.5,8)||
   !oneOf(m.airPlan,["open-room","manufacturer-approved-vent","unknown"])||
   !oneOf(m.voltage,["120","240","other","unknown"])||
   ![m.ventPlanDocumented,m.circuitPlanDocumented,m.condensateSolutionIncluded,
     m.modelOperatingTemperatureChecked,m.serviceClearanceDocumented,
     m.noiseAndCoolingDiscussed,m.commissioningAndHandoverIncluded]
     .every(x=>oneOf(x,["yes","no","unknown"])))
   throw new RangeError("Invalid HPWH model specification or documentation status.");
 }
 const cubicFeet=site.lengthFt!==null&&site.widthFt!==null&&site.heightFt!==null?
  Math.round(site.lengthFt*site.widthFt*site.heightFt*100)/100:null;
 const projectQuestions=[
  "Obtain exact manufacturer and model; compare its EnergyGuide first-hour rating (FHR), uniform energy factor (UEF), voltage and dimensions to real household demand. Tank gallons alone are not an FHR check.",
  "Measure the actual air volume available to the heat pump. Ask the installer for the model-specific minimum air volume, service clearances and an explicitly manufacturer-allowed alternative for closets or small spaces.",
  "Confirm whether the site gets cold (especially a garage/basement). Ask for exact model operating-temperature limits and any seasonal, ducting or resistance-backup implications; no model is certified by this tool.",
  "Have the electrician verify outlet type, dedicated circuit, breaker, wire, and any required panel work for the exact 120 V or 240 V HPWH. A same-voltage label alone does not prove a circuit is suitable.",
  "Document a safe gravity condensate drain or a pump and discharge route; also review leak pan, relief valve discharge, seismic restraint and water piping under applicable codes.",
  "Confirm location noise, cooled exhaust, door/louver plan, accessibility for filter/service, and how normal or peak hot-water demand will be met.",
  "Insist on written permit and final-inspection responsibility, plumbing/electrical changes, gas-line capping/removal when relevant, old tank disposal, warranty and commissioning/handover.",
  "Compare identical documented equipment and installation work, with matching before/after-incentive price bases. Published utility discounts are not guaranteed or deducted in this worksheet.",
 ];
 const findings:HPWHModelFinding[]=input.quotes.map(q=>{
  const m=models.find(x=>x.id===q.id)!;
  const issues:string[]=[];
  let confirmed=0;
  const requireCheck=(passed:boolean,message:string)=>{
   if(passed)confirmed++;
   else issues.push(message);
  };
  requireCheck(m.model.trim().length>=2,"Ask for the exact manufacturer and complete model identifier, not a generic 'heat pump water heater' label.");
  requireCheck(m.firstHourGallons!==null,"Ask for the model's published First Hour Rating (FHR), not just its storage tank gallons.");
  requireCheck(m.uef!==null,"Ask for the model's published Uniform Energy Factor (UEF); do not infer utility savings from it.");
  let airResult="Airflow not established. Manufacturer-specific requirements control.";
  if(m.manufacturerMinimumAirFt3===null){
   issues.push("Get the exact model's minimum unconfined air volume or its approved duct/louver installation requirements.");
  }else if(m.airPlan==="manufacturer-approved-vent"&&m.ventPlanDocumented==="yes"){
   airResult="A manufacturer-approved ventilation alternative is reported in writing; installer and code authority must still verify it.";
   confirmed++;
  }else if(m.airPlan==="open-room"&&cubicFeet!==null&&cubicFeet>=m.manufacturerMinimumAirFt3){
   airResult="Measured room volume "+cubicFeet+" ft³ meets the user-reported model minimum "+m.manufacturerMinimumAirFt3+" ft³. This is NOT an airflow or installation approval.";
   confirmed++;
  }else if(m.airPlan==="open-room"&&cubicFeet!==null&&cubicFeet<m.manufacturerMinimumAirFt3){
   airResult="Measured room volume "+cubicFeet+" ft³ is below the user-reported model minimum "+m.manufacturerMinimumAirFt3+" ft³.";
   issues.push("Room is smaller than the entered manufacturer air-volume minimum. Obtain a written approved intake/exhaust or louver solution, or reconsider the model/site.");
  }else{
   issues.push("Confirm measured free air volume and the manufacturer's permitted open-room or duct/louver design. A small closet cannot be assumed suitable.");
  }
  if(m.airPlan==="manufacturer-approved-vent"&&m.ventPlanDocumented!=="yes")
   issues.push("Manufacturer-approved duct/louver approach is claimed but not documented in writing.");
  requireCheck(m.voltage!=="unknown"&&m.voltage!=="other",
   "Ask the installer to state the exact model's required 120 V or 240 V connection.");
  const voltage=site.power==="usable-240"?"240":site.power==="usable-120"?"120":null;
  if(m.voltage==="120"||m.voltage==="240"){
   if(voltage&&voltage!==m.voltage&&input.newWiring!=="yes")
    issues.push("Reported available "+voltage+" V power differs from the proposed "+m.voltage+" V model. An electrician must document any new circuit or compatible alternative.");
   if(site.power==="no-known-circuit"&&input.newWiring!=="yes")
    issues.push("No suitable existing circuit is reported; new wiring and permit responsibilities are not documented.");
  }
  requireCheck(m.circuitPlanDocumented==="yes"&&q.electricalIncluded==="yes",
   "Ask for written electrician-verified circuit, wiring and permit responsibility included in this installed price. Voltage alone is insufficient.");
  const condensate=site.drain==="nearby-gravity"||site.drain==="pump-needed";
  requireCheck(m.condensateSolutionIncluded==="yes"&&q.condensateIncluded==="yes"&&condensate,
   site.drain==="no-path"?
    "No condensate disposal route is identified. Ask for an approved gravity drain or costed condensate pump and discharge solution.":
    site.drain==="pump-needed"?
    "Get the complete condensate pump and safe discharge route written into the installed price.":
    "Confirm a suitable condensate drain or pump and include its complete costed work in the bid.");
  requireCheck(m.serviceClearanceDocumented==="yes"&&q.airflowDocumented==="yes",
   "Ask for manufacturer installation/service clearance dimensions, intake/exhaust paths and a location fit check.");
  requireCheck(m.modelOperatingTemperatureChecked==="yes"&&site.temperature!=="unknown",
   "Confirm the manufacturer's minimum operating conditions for the actual installation space and any cold-weather performance implications.");
  if(site.temperature==="often-below-38")
   issues.push("You reported temperatures frequently below 38°F. The general ENERGY STAR best-practice threshold is not a product ban; ask the installer to show the actual model's cold-location operating plan.");
  requireCheck(m.noiseAndCoolingDiscussed==="yes"&&site.location!=="unknown",
   "Ask how fan/compressor noise and the cooled exhaust air affect adjacent living spaces.");
  requireCheck(m.commissioningAndHandoverIncluded==="yes",
   "Request commissioning/controls walkthrough, filter access and written equipment/labor warranties.");
  if(site.demand==="high-demand"&&m.firstHourGallons!==null)
   issues.push("You reported concentrated hot-water demand: compare the model's FHR against household peak use with the plumber. A larger tank alone is not a sizing determination.");
  if(site.demand==="unknown")issues.push("Clarify peak simultaneous showers/baths and hot-water demand before selecting capacity.");
  if(q.warrantyWritten!=="yes")
   issues.push("The base quote does not confirm written labor and equipment warranties.");
  const blocking=issues.some(x=>/Room is smaller than the entered manufacturer|No condensate disposal route|differs from the proposed|No suitable existing circuit|frequently below 38°F/.test(x));
  return {id:q.id,kind:blocking?"needs-revision":issues.length?"needs-information":"documented-for-professional-review",
   issues,documented:confirmed,totalChecks:11,airVolumeAssessment:airResult};
 });
 const differences:string[]=[];
 const compare=(label:string,fn:(q:Quote,m:HPWHModelReview)=>string|null)=>{
  const items=input.quotes.map(q=>fn(q,models.find(x=>x.id===q.id)!));
  if(items.every(x=>x!==null)&&new Set(items).size>1)
   differences.push(label+": "+input.quotes.map((q,i)=>"Quote "+q.id.toUpperCase()+" "+items[i]).join("; ")+".");
 };
 compare("Exact water-heater model",(_,m)=>m.model.trim()?m.model.trim().toUpperCase():null);
 compare("Reported First Hour Rating",(_,m)=>m.firstHourGallons===null?null:m.firstHourGallons+" gallons");
 compare("Uniform Energy Factor",(_,m)=>m.uef===null?null:String(m.uef));
 compare("Electrical connection",(_,m)=>known(m.voltage)?m.voltage+" V":null);
 compare("Ventilation strategy",(_,m)=>known(m.airPlan)?m.airPlan:null);
 const knownPrice=original.comparison.comparable;
 const complete=findings.every(f=>f.kind==="documented-for-professional-review");
 const projectReady=site.demand!=="unknown"&&site.temperature!=="unknown"&&site.location!=="unknown"&&
  site.power!=="unknown"&&site.drain!=="unknown";
 const fresh=hpwhFitSourceFresh(asOf);
 const status:HPWHFitAssessment["status"]=
  !fresh?"source-review":differences.length?"material-differences":
  !projectReady?"site-review":
  !complete?"missing-model-evidence":"ready-for-professional-review";
 const safeToCompareAsQuoted=fresh&&projectReady&&complete&&differences.length===0&&knownPrice;
 const title={
  "source-review":"Refresh HPWH source evidence before using this decision",
  "site-review":"Verify the installation location and household demand",
  "material-differences":"Your quotes propose different water-heater products or installation approaches",
  "missing-model-evidence":"Resolve manufacturer specifications and work omissions before choosing",
  "ready-for-professional-review":"Written model and site evidence appears aligned for installer review"
 }[status];
 const summary=safeToCompareAsQuoted?
  "Reported models and installation terms appear aligned for an as-quoted price comparison. This does not verify manufacturer instructions, installation safety, hot-water adequacy, rebate approval or contractor quality.":
  "Do not treat the cheapest broad-scope installed total as an equivalent product or the best contractor. Resolve the site, manufacturer and installation-scope questions with qualified professionals.";
 return {status,title,summary,measuredRoomVolumeFt3:cubicFeet,findings,differences,projectQuestions,
  safeToCompareAsQuoted,
  priceComparisonExplanation:safeToCompareAsQuoted?
   "The existing project's as-quoted price gap can be read as a provisional like-scope price comparison only; incentives are not subtracted and no technical approval is implied.":
   "The broad installed-price ranking above is NOT an apples-to-apples equipment or site-fit conclusion. Withhold a purchase decision until the mismatches and undocumented facts are resolved.",
  notProductApproval:true,noRebateAssumption:true
 };
}
export function hpwhEqualBidRequest(site:HPWHSite):string{
 return ["HEAT-PUMP WATER HEATER — IDENTICAL WRITTEN BID REQUEST",
  "Independent purchaser questions, not an engineering design, permit or contractor referral.",
  "Installation site: "+site.location+"; typical temperature: "+site.temperature,
  "Available circuit reported: "+site.power+"; condensate option: "+site.drain+"; demand: "+site.demand,
  "Room dimensions (feet): "+[site.lengthFt,site.widthFt,site.heightFt].map(x=>x===null?"unknown":x).join(" × "),
  "ASK EACH CONTRACTOR FOR:",
  "1. Exact make and model; EnergyGuide First Hour Rating, UEF and tank size. Explain household peak-hour demand adequacy without assuming gallons alone suffice.",
  "2. Manufacturer-required free air volume, actual room measurements and either a documented unconfined installation or the manufacturer's approved vent/louver approach.",
  "3. Manufacturer operating-temperature range for the garage/closet/basement; describe cold-weather controls, resistance backup and effects on surrounding air.",
  "4. Written service clearances, unit physical fit, intake/exhaust clearance, filter access, fan/compressor noise and cooled-air consequences.",
  "5. Electrician-verified voltage, circuit, breaker, wiring/panel changes, safe electrical connections and permit responsibility, all itemized.",
  "6. Safe condensate route and any pump, leak pan, water piping/relief-valve work, seismic restraint and applicable inspection closeout.",
  "7. Confirm removal/capping of prior gas equipment if applicable, removal of old tank, startup commissioning and controls handover.",
  "8. Price included labor, equipment, accessories, electrical/plumbing/ventilation and permits, exclusions, warranty, taxes and change-order conditions.",
  "9. Identify before/after incentive basis without assuming a program award or subtracting a discount twice.",
  "OFFICIAL SOURCES:",
  ...Object.values(HPWH_FIT_SOURCES).map(s=>s.title+": "+s.url),
  "No model is automatically deemed suitable and no quote is transmitted to a contractor."
 ].join("\n");
}
export function hpwhFitReport(input:Input,site:HPWHSite,models:readonly HPWHModelReview[],result:HPWHFitAssessment):string{
 return [hpwhEqualBidRequest(site),"","SITE + MODEL FIT ASSESSMENT",
  "Status: "+result.title,result.summary,
  "Reported measured room volume: "+(result.measuredRoomVolumeFt3===null?"unknown":result.measuredRoomVolumeFt3+" ft³"),
  "Full equipment/installation comparison: "+result.priceComparisonExplanation,
  ...input.quotes.flatMap(q=>{
   const m=models.find(x=>x.id===q.id)!,f=result.findings.find(x=>x.id===q.id)!;
   return ["QUOTE "+q.id.toUpperCase()+" — "+(q.installedTotal===null?"price unreported":"$"+q.installedTotal.toFixed(2))+
    "; basis "+q.priceBasis+"; scope "+q.scope,
    "Exact model: "+(m.model||"not documented")+"; tank "+(q.tankGallons??"unknown")+
    " gallons; FHR "+(m.firstHourGallons??"unknown")+" gallons; UEF "+(m.uef??"unknown"),
    "Air volume requirement: "+(m.manufacturerMinimumAirFt3??"unknown")+" ft³; "+
     "vent plan "+m.airPlan+"; manufacturer approval documented "+m.ventPlanDocumented,
    "Power: "+m.voltage+"; circuit plan "+m.circuitPlanDocumented+
    "; condensate solution "+m.condensateSolutionIncluded,
    "Fit evidence: "+f.documented+"/"+f.totalChecks+" (self-reported)",
    "Air: "+f.airVolumeAssessment,...f.issues.map(x=>"FOLLOW UP: "+x)];
  }),
  "MATERIAL DIFFERENCES:",...(result.differences.length?result.differences:["No explicit differences identified from known values; missing data still needs verification."]),
  "No product or installer approval, rebate award, energy savings, construction design or permit was generated."
 ].join("\n");
}
