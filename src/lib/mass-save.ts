/**
 * Mass Save 2026 published and 2027 announced air-source heat-pump schedules.
 * Manual research snapshot: 2026-11-03. This is not an eligibility decision,
 * reservation, or live incentive balance.
 */
export const MASS_REVIEWED_ON = "2026-11-03";
export const MASS_SOURCES = {
  air: {label:"Mass Save — Air Source Heat Pumps: rebates, installation deadlines, requirements",
    url:"https://www.masssave.com/en/residential/rebates-offers-services/heating-and-cooling/heat-pumps/air-source-heat-pumps"},
  products:{label:"Mass Save — Heat Pump Qualified Products List",url:"https://www.masssave.com/heat-pump-qualified-list"},
  enhanced:{label:"Mass Save — enhanced income-based incentives and verification",
    url:"https://www.masssave.com/residential/rebates-offers-services/income-based-offers/save-with-enhanced-incentives"},
} as const;
export type Answer = "yes"|"no"|"unsure";
export type MassYear = "2026"|"2027"|"unknown";
export type MassRoute = "whole"|"partial"|"basic"|"unsure";
export type HeatingFuel = "oil"|"propane"|"electric-resistance"|"natural-gas"|"existing-heat-pump"|"other"|"unsure";
export interface MassInput {
  year:MassYear;
  route:MassRoute;
  inMassachusetts:Answer;
  residentialAccount:Answer;
  propertyUnits:"one-four"|"five-plus"|"unsure";
  heatingFuel:HeatingFuel;
  residentialSponsorConfirmed:Answer;
  winterOccupied:Answer;
  hasOldHeatPump:Answer;
  displacesPrimaryHeating:Answer;
  wholeWeatherization:Answer;
  wholeFormSigned:Answer;
  fossilHeatingRemains:Answer;
  partialIntegratedControls:Answer;
  removedFuelEvidence:Answer;
  // Each proposed contractor/quote supplies these individually.
  installerInNetwork:Answer;
  equipmentOnQualifiedList:Answer;
  newEquipment:Answer;
  coolingCapacityBtu:number|null;
}
export const EMPTY_MASS_INPUT:MassInput={
  year:"unknown",route:"unsure",heatingFuel:"unsure",
  inMassachusetts:"unsure",residentialAccount:"unsure",propertyUnits:"unsure",
  residentialSponsorConfirmed:"unsure",
  winterOccupied:"unsure",hasOldHeatPump:"unsure",displacesPrimaryHeating:"unsure",
  wholeWeatherization:"unsure",wholeFormSigned:"unsure",fossilHeatingRemains:"unsure",
  partialIntegratedControls:"unsure",removedFuelEvidence:"unsure",
  installerInNetwork:"unsure",equipmentOnQualifiedList:"unsure",newEquipment:"unsure",
  coolingCapacityBtu:null,
};
export interface Condition {
  id:string;
  label:string;
  status:"reported-met"|"not-met"|"verify";
  explanation:string;
}
export interface MassResult {
  status:"not-supported"|"needs-verification"|"requirements-reported"|"schedule-only";
  conditions:Condition[];
  scheduleRatePerTon:number|null;
  scheduleCap:number|null;
  theoreticalScheduleAmount:number|null;
  installationYear:MassYear;
  allConditionsSelfReported:boolean;
  applicationDeadline:string|null;
  warnings:string[];
}
export function readMassSchedule(year:MassYear,route:MassRoute){
  if(year==="2026"){
    if(route==="whole")return {rate:2650,cap:8500};
    if(route==="partial")return {rate:1125,cap:8500};
    if(route==="basic")return {rate:250,cap:2500};
  }
  if(year==="2027"){
    if(route==="whole")return {rate:2350,cap:7500};
    if(route==="partial")return {rate:1000,cap:7500};
    // No 2027 basic schedule claimed from published change notice.
  }
  return null;
}
function checkedCapacity(n:number|null){
  if(n!==null&&(!Number.isFinite(n)||n<=0||n>300000))throw new RangeError("Cooling capacity must be positive, finite and at most 300,000 BTU/h, or unknown.");
}
export function evaluateMassSave(input:MassInput):MassResult {
  checkedCapacity(input.coolingCapacityBtu);
  const conditions:Condition[]=[];
  const add=(id:string,label:string,v:Answer,explanation:string)=>{
    conditions.push({id,label,status:v==="yes"?"reported-met":v==="no"?"not-met":"verify",explanation});
  };
  const requireNo=(id:string,label:string,v:Answer,explanation:string)=>{
    conditions.push({id,label,status:v==="no"?"reported-met":v==="yes"?"not-met":"verify",explanation});
  };
  const warnings:string[]=[];
  const s=readMassSchedule(input.year,input.route);
  add("ma-location","Property is in Massachusetts",input.inMassachusetts,
    "This screen covers Massachusetts residences only; other state programs have different rules.");
  add("residential","Account is residential",input.residentialAccount,
    "Mass Save standard residential rebates require a qualifying residential utility account.");
  if(input.propertyUnits!=="one-four"){
    conditions.push({id:"property-units",label:"Building size confirmed in supported pilot",
      status:"verify",
      explanation:input.propertyUnits==="five-plus"
        ?"Some 5+ unit buildings have special weatherization/program rules; get Mass Save review rather than applying this single-home screen as an approval."
        :"Confirm the unit count and applicable building program before relying on the rules."});
  }
  const theoreticalScheduleAmount=s&&input.coolingCapacityBtu!==null?
    Math.min(s.cap,Math.round(input.coolingCapacityBtu/12000*s.rate*100)/100):null;

  if(input.year==="unknown")warnings.push("Installation year is unknown; no fixed rebate amount can be calculated.");
  if(input.year==="2027")warnings.push("2027 whole/partial amounts are announced schedule changes, not verification of 2027 qualification, deadlines or funding; confirm current 2027 program terms.");
  if(input.year==="2026")warnings.push("2026 Mass Save applications and documents must be received by February 28, 2027. Equipment must be installed in 2026.");
  if(!s)warnings.push("No current published schedule amount was established for this year and rebate type. Do not use a 2026 amount for 2027 basic.");
  if(input.heatingFuel==="unsure")warnings.push("Confirm the existing heating fuel and which utility is the Mass Save sponsor; not every Massachusetts utility is a sponsor.");

  add("sponsor","Residential utility participates in Mass Save",input.residentialSponsorConfirmed,
   "For oil, propane or electric resistance, verify an eligible electric sponsor; for natural gas, verify the gas sponsor. Basic rebates require an eligible residential electric sponsor.");
  add("network","Installer belongs to Mass Save Heat Pump Installer Network",input.installerInNetwork,
   "Ask for proof of current network participation; a contractor's claim is not independently verified here.");
  add("equipment","Exact equipment system appears on the qualified products list",input.equipmentOnQualifiedList,
   "Verify the exact matched indoor/outdoor system or AHRI reference on the Mass Save list, not just the brand.");
  add("new","Equipment is new",input.newEquipment,"All standard rebate types use eligible new equipment.");
  if(input.route!=="basic"){
    if(["other","unsure","existing-heat-pump"].includes(input.heatingFuel)){
      conditions.push({id:"fuel",label:"Qualifying displaced heating fuel",
        status:input.heatingFuel==="unsure"?"verify":"not-met",
        explanation:"Whole-home and partial-home standard rebates displace qualifying oil, propane, electric resistance or natural-gas heat; existing heat-pump replacement generally falls under Basic."});
    }else conditions.push({id:"fuel",label:"Qualifying displaced heating fuel",status:"reported-met",
      explanation:"Fuel appears among the standard program categories; confirm account and exact replacement work with Mass Save."});
    requireNo("old-heat-pump","Not replacing an existing heat pump",input.hasOldHeatPump,
      "Replacement of an existing heat pump is normally outside whole/partial rebate categories; Basic may apply.");
    add("winter","Home occupied full-time during winter",input.winterOccupied,
      "Whole/partial rebate requires full-time winter occupancy.");
  }
  if(input.route==="whole"){
    add("displacement","Heat pumps will serve as sole heating and cooling system",input.displacesPrimaryHeating,
      "A whole-home installation must replace the prior heating system, not remain its supplement.");
    add("weather","Home sufficiently weatherized under Mass Save criteria",input.wholeWeatherization,
      "Confirm home built since 2000, assessment showing less than $1,000 recommended, or completion of prescribed weatherization; special multifamily rules can apply.");
    add("whole-form","Whole-home verification form will be signed",input.wholeFormSigned,
      "Official verification form is required; a verbal promise isn't proof.");
  }
  if(input.route==="partial"){
    if(input.fossilHeatingRemains==="yes"){
      add("controls","Qualified integrated controls documented",input.partialIntegratedControls,
       "An integrated control must meet the required switchover temperature when fossil backup remains in heated zones.");
    }else if(input.fossilHeatingRemains==="no"){
      add("disconnect","Removed fuel heating documented on the invoice",input.removedFuelEvidence,
       "If heating equipment is removed or disconnected from the entire affected zone, document it to establish the integrated-control exception.");
    }else {
      conditions.push({id:"backup",label:"Backup heating / integrated controls",status:"verify",
        explanation:"Clarify whether oil, gas or propane heating remains in the affected zones; this determines integrated-control requirements."});
    }
  }
  if(input.route==="basic"){
    requireNo("displacement","Basic rebate is not displacing primary heating",input.displacesPrimaryHeating,
      "Basic covers e.g. replacing an existing heat pump or adding cooling, not a qualifying whole/partial primary-heat replacement.");
  }
  if(input.route==="unsure")conditions.push({id:"route",label:"Rebate category",status:"verify",explanation:"Select whole-home, partial-home, or basic."});
  const hasFails=conditions.some(x=>x.status==="not-met");
  const hasUnknown=conditions.some(x=>x.status==="verify");
  return {
    status:hasFails?"not-supported":input.year==="2027"?"schedule-only":hasUnknown||!s?"needs-verification":"requirements-reported",
    conditions,scheduleRatePerTon:s?.rate??null,scheduleCap:s?.cap??null,
    theoreticalScheduleAmount,installationYear:input.year,
    allConditionsSelfReported:!hasFails&&!hasUnknown&&s!==null&&input.year==="2026",
    applicationDeadline:input.year==="2026"?"2027-02-28":null,warnings,
  };
}

export type PriceBasis="before-rebate"|"after-rebate"|"unsure";
export type ProposalScope="reuse-existing-ducts"|"replace-or-build-ducts"|"ductless"|"mixed"|"unknown";
export interface MassQuote {
  id:"a"|"b"|"c";
  price:number|null;priceBasis:PriceBasis;
  scope:ProposalScope;
  proposedRebate:number|null;
  rebateDocumentation:Answer;
  installerInNetwork:Answer;
  equipmentOnQualifiedList:Answer;
  newEquipment:Answer;
  coolingCapacityBtu:number|null;
  permitsAndElectrical:Answer;
  loadCalculationProvided:Answer;
  scopeAndEquipmentIdentified:Answer;
  warrantyInWriting:Answer;
}
export function newMassQuote(id:MassQuote["id"]):MassQuote{
 return {id,price:null,priceBasis:"unsure",scope:"unknown",proposedRebate:null,rebateDocumentation:"unsure",
  installerInNetwork:"unsure",equipmentOnQualifiedList:"unsure",newEquipment:"unsure",
  coolingCapacityBtu:null,permitsAndElectrical:"unsure",loadCalculationProvided:"unsure",
  scopeAndEquipmentIdentified:"unsure",warrantyInWriting:"unsure"};
}
export interface QuoteEvaluation {
  quote:MassQuote;
  program:MassResult;
  statedPrice:number|null;
  conditionalPostRebate:number|null;
  risks:string[];
  itemsDocumented:number;
}
export interface MassBidComparison{
  quotes:QuoteEvaluation[];
  comparablePriceGap:number|null;
  comparativeWinner:MassQuote["id"]|null;
  comparisonExplanation:string;
}
export function compareMassQuotes(common:Omit<MassInput,"installerInNetwork"|"equipmentOnQualifiedList"|"newEquipment"|"coolingCapacityBtu">,quotes:MassQuote[]):MassBidComparison{
 if(quotes.length<2||quotes.length>3||new Set(quotes.map(q=>q.id)).size!==quotes.length)throw new RangeError("Enter 2–3 distinct quotes.");
 const evaluated=quotes.map(quote=>{
  for(const [key,num]of [["price",quote.price],["proposedRebate",quote.proposedRebate]]as const){
   if(num!==null&&(!Number.isFinite(num)||num<0))throw new RangeError("Invalid "+key);
  }
  const program=evaluateMassSave({...common,
   installerInNetwork:quote.installerInNetwork,
   equipmentOnQualifiedList:quote.equipmentOnQualifiedList,
   newEquipment:quote.newEquipment,
   coolingCapacityBtu:quote.coolingCapacityBtu});
  const risks:string[]=[];
  if(quote.price===null)risks.push("Quote's installed price not supplied.");
  if(quote.priceBasis==="unsure")risks.push("Confirm whether quote already includes a rebate. Do not subtract it twice.");
  if(quote.scope==="unknown")risks.push("Identify whether the bid reuses ducts, creates new ductwork, is ductless, or mixes scopes before a meaningful price comparison.");
  if(quote.permitsAndElectrical!=="yes")risks.push("Ask which permits and electrical upgrades are included; municipality-specific rules are not evaluated here.");
  if(quote.loadCalculationProvided!=="yes")risks.push("Request Manual J load calculation and AHRI cooling capacity.");
  if(quote.scopeAndEquipmentIdentified!=="yes")risks.push("Ask for matching indoor/outdoor model numbers, installation scope and refrigerant details.");
  if(quote.warrantyInWriting!=="yes")risks.push("Ask for equipment and workmanship warranties in writing.");
  if(quote.rebateDocumentation!=="yes")risks.push("No written rebate confirmation; no rebate deduction assumed.");
  if(program.status!=="requirements-reported")risks.push("Mass Save eligibility/funding not established. The published schedule is not an award.");
  const canShowScenario=quote.price!==null&&quote.priceBasis==="before-rebate"&&
   quote.rebateDocumentation==="yes"&&program.allConditionsSelfReported&&
   program.theoreticalScheduleAmount!==null&&quote.proposedRebate!==null&&
   quote.proposedRebate<=program.theoreticalScheduleAmount&&quote.proposedRebate<=quote.price;
  const postRebate=canShowScenario?Math.round((quote.price!-quote.proposedRebate!)*100)/100:null;
  if(quote.proposedRebate!==null&&program.theoreticalScheduleAmount!==null&&quote.proposedRebate>program.theoreticalScheduleAmount){
   risks.push("Proposed rebate exceeds standard published per-ton/cap formula; seek an explanation of any separate approved program.");
  }
  return {quote,program,statedPrice:quote.price,conditionalPostRebate:postRebate,
    risks,itemsDocumented:[quote.permitsAndElectrical,quote.loadCalculationProvided,quote.scopeAndEquipmentIdentified,quote.warrantyInWriting].filter(x=>x==="yes").length};
 });
 const comparable=evaluated.every(x=>x.statedPrice!==null)&&
   quotes.every(q=>q.priceBasis!=="unsure")&&quotes.every(q=>q.priceBasis===quotes[0].priceBasis)&&
   quotes.every(q=>q.scope!=="unknown")&&quotes.every(q=>q.scope===quotes[0].scope);
 const ordered=comparable?[...evaluated].sort((a,b)=>a.statedPrice!-b.statedPrice!):[];
 const min=ordered.length?ordered[0].statedPrice!:null;
 const max=ordered.length?ordered[ordered.length-1].statedPrice!:null;
 return {quotes:evaluated,comparablePriceGap:min!==null&&max!==null?Math.round((max-min)*100)/100:null,
  comparativeWinner:ordered[0]?.quote.id??null,
  comparisonExplanation:comparable?
    "Ranked only by self-reported quoted totals on the same before/after rebate basis and broad project scope. Different loads, equipment sizes, duct condition, labor and unlisted work can still make comparison misleading; this is not a best-contractor recommendation.":
    "Enter prices, the same before/after rebate basis, and the same broad installation scope for every bid. Comparing new ductwork to duct reuse or ductless systems on price alone is misleading."};
}
export function massCopyPlan(r:MassBidComparison):string{
 return ["MASSACHUSETTS HEAT-PUMP QUOTE REVIEW — "+MASS_REVIEWED_ON,
 "Independent, self-reported; NOT Mass Save preapproval or guaranteed incentive.",
 ...r.quotes.flatMap(x=>["QUOTE "+x.quote.id.toUpperCase()+" listed price: "+(x.statedPrice??"unknown"),
  "Published schedule arithmetic ONLY: "+(x.program.theoreticalScheduleAmount??"unknown"),
  "Conditional post-rebate scenario (not an award): "+(x.conditionalPostRebate??"not established"),
  ...x.risks.map(z=>"- "+z)]),
 "Agency rules and application: "+MASS_SOURCES.air.url,"Qualified equipment: "+MASS_SOURCES.products.url].join("\n");
}
