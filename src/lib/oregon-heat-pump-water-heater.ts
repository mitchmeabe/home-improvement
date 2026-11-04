/**
 * Heat-pump WATER HEATER (not space-heating HP3).
 * Private source snapshot: 2026-11-04.
 * Only a confirmed Portland permit jurisdiction supports city permit conclusions.
 * Midstream program offers are dated publisher statements, not awards.
 */
export const HPWH_REVIEWED="2026-11-04";
export const HPWH_OFFER_PUBLISHED="2026-05-12";
export const HPWH_SOURCES={
 plumbing:"https://www.portland.gov/ppd/residential-permitting/residential-plumbing-permits",
 electrical:"https://www.portland.gov/ppd/residential-permitting/residential-electrical-permits",
 permits:"https://www.portland.gov/ppd/residential-permitting/do-you-need-permit/residential-permits",
 jurisdiction:"https://www.portland.gov/ppd/property-addressing",
 utility:"https://insider.energytrust.org/home-retrofit-incentive-updates/",
} as const;
export type OregonPlace="portland-verified"|"portland-unverified"|"other-oregon"|"outside-oregon"|"unknown";
export type HouseType="one-two-family"|"other"|"unknown";
export type Dwelling="existing-owner"|"existing-rental"|"new-construction"|"other"|"unknown";
export type ElectricCompany="pge"|"pacific-power"|"other"|"unknown";
export type InstallRoute="contractor"|"do-it-yourself"|"unknown";
export type HeaterFuel="electric"|"gas"|"other"|"unknown";
export type Answer="yes"|"no"|"unknown";
export type QuoteScope="same-location"|"relocated"|"new-system"|"unknown";
export type PriceBasis="before-incentives"|"after-incentives"|"unknown";
export interface Quote{
 id:"a"|"b"|"c";installedTotal:number|null;priceBasis:PriceBasis;scope:QuoteScope;
 tankGallons:number|null;proposedIncentive:number|null;
 plumbingIncluded:Answer;electricalIncluded:Answer;condensateIncluded:Answer;
 airflowDocumented:Answer;warrantyWritten:Answer;
}
export const newQuote=(id:Quote["id"]):Quote=>({
 id,installedTotal:null,priceBasis:"unknown",scope:"unknown",tankGallons:null,proposedIncentive:null,
 plumbingIncluded:"unknown",electricalIncluded:"unknown",condensateIncluded:"unknown",
 airflowDocumented:"unknown",warrantyWritten:"unknown"
});
export interface Input{
 place:OregonPlace;house:HouseType;dwelling:Dwelling;utility:ElectricCompany;
 installation:InstallRoute;currentFuel:HeaterFuel;replacement:Answer;
 newWiring:Answer;newVentilation:Answer;quotes:Quote[];
}
export const initialInput=():Input=>({
 place:"portland-unverified",house:"unknown",dwelling:"unknown",utility:"unknown",
 installation:"unknown",currentFuel:"unknown",replacement:"unknown",
 newWiring:"unknown",newVentilation:"unknown",quotes:[newQuote("a"),newQuote("b")]
});
export interface Finding{
 id:string;status:"required"|"check"|"not-applicable";title:string;detail:string;
 source:keyof typeof HPWH_SOURCES;
}
export interface QuoteFinding{quote:Quote;warnings:string[]}
export interface Comparison{
 comparable:boolean;reason:string;lowerTotalQuote:"a"|"b"|"c"|null;difference:number|null;
 quotes:QuoteFinding[];
}
export interface Result{
 permits:Finding[];programs:Finding[];questions:string[];
 comparison:Comparison;notes:string[];
}
const choice=(x:string,choices:readonly string[])=>choices.includes(x);
const amount=(n:number|null,max:number)=>n===null||Number.isFinite(n)&&n>=0&&n<=max;
export function evaluate(input:Input):Result{
 if(!choice(input.place,["portland-verified","portland-unverified","other-oregon","outside-oregon","unknown"])||
  !choice(input.house,["one-two-family","other","unknown"])||
  !choice(input.dwelling,["existing-owner","existing-rental","new-construction","other","unknown"])||
  !choice(input.utility,["pge","pacific-power","other","unknown"])||
  !choice(input.installation,["contractor","do-it-yourself","unknown"])||
  !choice(input.currentFuel,["electric","gas","other","unknown"])||
  ![input.replacement,input.newWiring,input.newVentilation].every(x=>choice(x,["yes","no","unknown"]))||
  input.quotes.length<2||input.quotes.length>3||
  new Set(input.quotes.map(q=>q.id)).size!==input.quotes.length||
  input.quotes.some(q=>!choice(q.id,["a","b","c"])||
    !choice(q.priceBasis,["before-incentives","after-incentives","unknown"])||
    !choice(q.scope,["same-location","relocated","new-system","unknown"])||
    ![q.plumbingIncluded,q.electricalIncluded,q.condensateIncluded,q.airflowDocumented,q.warrantyWritten].every(x=>choice(x,["yes","no","unknown"]))||
    !amount(q.installedTotal,1000000)||!amount(q.proposedIncentive,50000)||
    (q.tankGallons!==null&&(!Number.isSafeInteger(q.tankGallons)||q.tankGallons<20||q.tankGallons>300))))
  throw new RangeError("Invalid heat-pump water-heater planning input.");
 const permits:Finding[]=[],programs:Finding[]=[];
 const notes:string[]=["All quotes and home details are user-reported; program approval, actual permits and rebates have not been independently established."];
 const questions:string[]=[];
 const add=(target:Finding[],id:string,status:Finding["status"],title:string,detail:string,source:Finding["source"])=>
  target.push({id,status,title,detail,source});
 const portland=input.place==="portland-verified"&&input.house==="one-two-family";
 if(portland){
   add(permits,"plumbing",input.replacement==="yes"?"required":"check","Portland residential plumbing permit",
    input.replacement==="yes"?
     "Portland lists replacing a water heater as plumbing-permitted work. Ask who obtains and closes the permit.":
     "Confirm whether the work replaces a water heater or changes piping. Portland lists water-heater replacement as permitted plumbing work.","plumbing");
   add(permits,"electrical",input.newWiring==="yes"?"required":"check","Electrical changes and permit",
    input.newWiring==="yes"?"New or altered hard-wired electrical work requires a Portland electrical permit.":
     "The electrical connection may require new wiring or a circuit. Confirm requirements with the city and installer.","electrical");
   add(permits,"ventilation","check","Ventilation / condensate / placement",
    "A heat-pump water heater may change air movement, noise, clearance and condensate drainage. Verify any mechanical-permit implications and installation instructions; no mechanical permit decision is made here.","permits");
 }else{
   add(permits,"jurisdiction","check","Determine the responsible permitting authority",
    input.place==="portland-unverified"?
     "A Portland mailing address alone is insufficient. Confirm the property's actual city jurisdiction in PortlandMaps.":
     input.place==="portland-verified"?
     "City jurisdiction is reported, but this tool only covers one/two-family dwelling plumbing permit guidance. Check the different building classification.":
     "Portland permit rules cannot be applied to an unidentified city or out-of-city location. Contact the correct city or county agency.","jurisdiction");
 }
 questions.push("Who obtains the plumbing permit and arranges final inspection? What electrical upgrades and permits are included?");
 questions.push("Is the water-heater tank size, water/power connection, condensate drain, ventilation clearance and noise level appropriate for the installation space?");
 const inOregon=input.place==="portland-verified"||input.place==="portland-unverified"||input.place==="other-oregon";
 const participatingUtility=input.utility==="pge"||input.utility==="pacific-power";
 if(!inOregon){
   add(programs,"territory",input.place==="outside-oregon"?"not-applicable":"check","Oregon Energy Trust offer",
     "Oregon program applicability is not established for this property. Confirm the state and serving utilities.","utility");
 }else if(input.dwelling==="new-construction"){
   add(programs,"new-build","not-applicable","2026 Home Retrofit midstream offer",
    "Energy Trust's May 2026 midstream water-heater offer excludes new-construction applications; other programs require separate research.","utility");
 }else if(!participatingUtility||input.dwelling!=="existing-owner"){
   add(programs,"utility-review","check","Home Retrofit incentive screening",
    "Confirm electric utility, property category and the appropriate Energy Trust program. The published Home Retrofit retail/distributor offer is not automatically available to every rental or unknown account.","utility");
 }else if(input.installation==="contractor"){
   add(programs,"professional","check","Published contractor/distributor HPWH offer",
    "Energy Trust's May 12, 2026 announcement described a $1,200 project-price reduction for qualifying professional installations purchased through participating distributors. Verify the current model, distributor, contractor, funding and bid before relying on it.","utility");
 }else if(input.installation==="do-it-yourself"){
   add(programs,"retail","check","Published in-store retail HPWH offer",
    "Energy Trust's May 12, 2026 announcement described a $1,000 in-store retail discount, limited to two units; online and special-order purchases did not qualify. Verify current stock, program and technical installation rules.","utility");
 }else{
   add(programs,"route","check","Select the installation/purchasing route",
    "Professional/distributor and DIY/in-store midstream discounts had different 2026 terms; determine which route your exact purchase follows.","utility");
 }
 if(input.currentFuel!=="electric")notes.push("The current water-heater fuel and participating utility may change incentive treatment. Verify fuel-switch and program rules; this tool does not infer eligibility.");
 questions.push("Is any published incentive already included in the quote? Who receives it, and is there an actual current program/transaction confirmation?");
 const quotes=input.quotes.map(quote=>{
  const warnings:string[]=[];
  if(quote.installedTotal===null)warnings.push("Installed total not entered.");
  if(quote.priceBasis==="unknown")warnings.push("Clarify whether the total is before or after discounts; never subtract a quoted discount twice.");
  if(quote.scope==="unknown")warnings.push("Installation scope and relocation are unconfirmed.");
  if(quote.tankGallons===null)warnings.push("Request exact tank size and model designation.");
  if(quote.plumbingIncluded!=="yes")warnings.push("Confirm plumbing work, permit responsibility and final inspection.");
  if(quote.electricalIncluded!=="yes")warnings.push("Confirm wiring, circuit capacity and required electrical upgrades.");
  if(quote.condensateIncluded!=="yes")warnings.push("Clarify condensate disposal and drain work.");
  if(quote.airflowDocumented!=="yes")warnings.push("Confirm airflow/clearances and installation location.");
  if(quote.warrantyWritten!=="yes")warnings.push("Request equipment and labor warranty terms.");
  if(quote.proposedIncentive!==null&&quote.proposedIncentive>0)
   warnings.push("Proposed incentive is a seller claim, not confirmed program funding. No discount is subtracted from the installed total.");
  return {quote,warnings};
 });
 let comparable=false,reason="Totals cannot be compared without known and matching installation scope, tank size, and before/after-incentive basis.";
 let lowerTotalQuote:Quote["id"]|null=null,difference:number|null=null;
 if(quotes.every(x=>x.quote.installedTotal!==null&&x.quote.priceBasis!=="unknown"&&x.quote.scope!=="unknown"&&x.quote.tankGallons!==null)){
  const first=quotes[0].quote;
  comparable=quotes.every(x=>x.quote.priceBasis===first.priceBasis&&x.quote.scope===first.scope&&x.quote.tankGallons===first.tankGallons);
  if(comparable){
   const sorted=[...quotes].sort((a,b)=>a.quote.installedTotal!-b.quote.installedTotal!);
   lowerTotalQuote=sorted[0].quote.id;
   difference=sorted[sorted.length-1].quote.installedTotal!-sorted[0].quote.installedTotal!;
   reason="Only listed installed totals have a comparable broad basis and tank size. The lower total does not establish quality, eligibility, included work or best value.";
  }else reason="Quotes differ in scope, tank capacity or before/after-incentive basis. Ask for matching itemized bids before comparing.";
 }
 return {permits,programs,questions,comparison:{comparable,reason,lowerTotalQuote,difference,quotes},notes};
}
export function report(x:Result):string{
 return ["OREGON HEAT-PUMP WATER HEATER PLANNING · "+HPWH_REVIEWED,
  "Self-reported only; no permits, funding, rebates or contractor guarantees.",
  ...x.permits.map(y=>y.title+" ["+y.status+"]: "+y.detail+" "+HPWH_SOURCES[y.source]),
  ...x.programs.map(y=>y.title+" ["+y.status+"]: "+y.detail+" "+HPWH_SOURCES[y.source]),
  "Quote comparability: "+x.comparison.reason,
  ...x.comparison.quotes.map(y=>"Quote "+y.quote.id+": "+(y.quote.installedTotal===null?"unknown":y.quote.installedTotal)+
    "; warnings: "+y.warnings.join(" | ")),
  ...x.questions.map((q,i)=>(i+1)+". "+q),...x.notes
 ].join("\n");
}
