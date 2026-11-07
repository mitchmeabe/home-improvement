/**
 * Portable 120V AC power-station purchase screen, United States.
 * Sources reviewed 2026-11-07; no real-time product, safety listing, recall or price lookup.
 * No residential hardwiring, solar input, medical/life-safety, high-voltage or gas generator sizing.
 */
export const REVIEWED="2026-11-07";
export const SOURCE_TTL_DAYS=45;
export const SOURCES={
 units:"https://www.eia.gov/energyexplained/electricity/measuring-electricity.php",
 ul:"https://shopulstandards.com/ProductDetail.aspx?UniqueKey=49072",
 stationary:"https://www.ul.com/thecodeauthority/knowledgecenter/qa-portable-power-packs",
 testing:"https://www.ul.com/services/portable-power-pack-testing",
 recalls:"https://www.cpsc.gov/Recalls",
 recallExample:"https://www.cpsc.gov/Recalls/2026/Goal-Zero-Recalls-YETI-3000X-Power-Stations-Due-to-Serious-Risk-of-Injury-from-Fire-and-Burn-Hazards",
 anker:"https://www.ankersolix.com/become-an-affiliate",
 jackery:"https://www.jackery.com/pages/affiliate-program"
} as const;
export type Answer="yes"|"no"|"unknown";
export type Evidence="verified"|"estimated"|"unknown";
export type LoadId="a"|"b"|"c"|"d"|"e"|"f";
export type OfferId="a"|"b";
export type Status="source-review"|"unsafe-scope"|"needs-inputs"|"planning-only"|"verified-plan";
export type OfferStatus="blocked"|"missing-evidence"|"below-requirement"|"conditional-capacity-screen";
export type BatteryUse="cord-and-plug-120v"|"house-wiring"|"unknown";
export interface Load{
 id:LoadId;
 label:string;
 runWatts:number|null;
 startWatts:number|null;
 activeHoursPerDay:number|null;
 evidence:Evidence; // verified wattage AND active-hour duty pattern and startup demand
 motor:Answer;
}
export interface Visit{
 use:BatteryUse;
 medicalOrLifeSafety:Answer;
 highHeatOr240v:Answer;
 rechargeAssumed:Answer; // must be NO for this no-recharge screen
 targetHours:8|12|24|36|48|72;
 reservePercent:0|15|25|40;
 loads:Load[];
}
export interface Offer{
 id:OfferId;
 model:string;
 usableACWh:number|null; // manufacturer or independently documented *delivered* 120V AC energy
 runningACWatts:number|null;
 surgeACWatts:number|null;
 exact120vOutputsVerified:Answer;
 portableListingVerified:Answer; // appropriate safety certification under correct use
 manufacturerProofReviewed:Answer;
 modelRecallChecked:Answer;
 warrantyAndReturnTermsReviewed:Answer;
 useLocationReviewed:Answer;
 completePrice:number|null;
 otherMandatoryCharges:number|null; // includes all fees, tax, shipping not in base
}
export const emptyLoad=(id:LoadId):Load=>({
 id,label:"",runWatts:null,startWatts:null,activeHoursPerDay:null,evidence:"unknown",motor:"unknown"
});
export const START_VISIT:Visit={
 use:"unknown",medicalOrLifeSafety:"unknown",highHeatOr240v:"unknown",
 rechargeAssumed:"unknown",targetHours:24,reservePercent:25,
 loads:[emptyLoad("a")]
};
export const emptyOffer=(id:OfferId):Offer=>({
 id,model:"",usableACWh:null,runningACWatts:null,surgeACWatts:null,
 exact120vOutputsVerified:"unknown",portableListingVerified:"unknown",
 manufacturerProofReviewed:"unknown",modelRecallChecked:"unknown",
 warrantyAndReturnTermsReviewed:"unknown",useLocationReviewed:"unknown",
 completePrice:null,otherMandatoryCharges:null
});
export interface LoadPlan{
 status:Status;headline:string;issues:string[];
 outputEnergyWh:number|null;
 plannedEnergyWh:number|null;
 combinedRunningWatts:number|null;
 simultaneousPeakWatts:number|null;
}
export interface OfferReview{
 id:OfferId;status:OfferStatus;issues:string[];
 reportedAllInUSD:number|null;
 capacityWhDifference:number|null;
 noCertification:true;
}
export interface Decision{
 plan:LoadPlan;offers:[OfferReview,OfferReview];
 compareAllowed:boolean;lowerOffer:OfferId|null;priceDifferenceUSD:number|null;
 reviewedOn:string;noElectricalApproval:true;noBooking:true;noAffiliate:true;
}
const finite=(x:unknown,max:number,allowZero=false):x is number=>
 typeof x==="number"&&Number.isFinite(x)&&x>=0&&x<=max&&(allowZero||x>0);
const cents=(x:unknown):x is number=>
 finite(x,100000,true)&&Math.abs((x as number)*100-Math.round((x as number)*100))<1e-5;
const numberOf=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
const answer=(x:unknown):x is Answer=>x==="yes"||x==="no"||x==="unknown";
const dateValid=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&
 Number.isFinite(Date.parse(s+"T00:00:00Z"))&&new Date(Date.parse(s+"T00:00:00Z")).toISOString().slice(0,10)===s;
export function sourceCurrent(asOf:string):boolean{
 if(!dateValid(asOf)||!dateValid(REVIEWED))return false;
 const delta=(Date.parse(asOf+"T00:00:00Z")-Date.parse(REVIEWED+"T00:00:00Z"))/86400000;
 return delta>=0&&delta<=SOURCE_TTL_DAYS;
}
const loadValid=(x:unknown,id:LoadId):x is Load=>{
 if(!x||typeof x!=="object"||Array.isArray(x))return false;
 const l=x as Load;
 return l.id===id&&typeof l.label==="string"&&l.label.length<=80&&
 ["verified","estimated","unknown"].includes(l.evidence)&&answer(l.motor)&&
 (l.runWatts===null||finite(l.runWatts,8000))&&
 (l.startWatts===null||finite(l.startWatts,20000))&&
 (l.activeHoursPerDay===null||finite(l.activeHoursPerDay,24));
};
const offerValid=(x:unknown,id:OfferId):x is Offer=>{
 if(!x||typeof x!=="object"||Array.isArray(x))return false;
 const q=x as Offer;
 return q.id===id&&typeof q.model==="string"&&q.model.length<=110&&
 [q.usableACWh,q.runningACWatts,q.surgeACWatts].every(n=>n===null||finite(n,100000))&&
 [q.exact120vOutputsVerified,q.portableListingVerified,q.manufacturerProofReviewed,
 q.modelRecallChecked,q.warrantyAndReturnTermsReviewed,q.useLocationReviewed].every(answer)&&
 [q.completePrice,q.otherMandatoryCharges].every(n=>n===null||cents(n));
};
const noOffer=(id:OfferId):OfferReview=>({id,status:"blocked",issues:[],reportedAllInUSD:null,
 capacityWhDifference:null,noCertification:true});
const startDecision=(plan:LoadPlan):Decision=>({
 plan,offers:[noOffer("a"),noOffer("b")],compareAllowed:false,
 lowerOffer:null,priceDifferenceUSD:null,reviewedOn:REVIEWED,noElectricalApproval:true,
 noBooking:true,noAffiliate:true
});
function fail(status:Status,headline:string,...issues:string[]):LoadPlan{
 return {status,headline,issues,outputEnergyWh:null,plannedEnergyWh:null,
  combinedRunningWatts:null,simultaneousPeakWatts:null};
}
export function screenLoad(raw:unknown,asOf=REVIEWED):LoadPlan{
 if(!sourceCurrent(asOf))return fail("source-review","Source snapshot requires a new review",
  "The safety and purchase guidance was last checked on "+REVIEWED+". Recheck current UL and CPSC notices before screening products.");
 if(!raw||typeof raw!=="object"||Array.isArray(raw))
  return fail("needs-inputs","Enter a supported portable-power use case","The inputs are invalid or incomplete.");
 const x=raw as Visit;
 if(!["cord-and-plug-120v","house-wiring","unknown"].includes(x.use)||
 !answer(x.medicalOrLifeSafety)||!answer(x.highHeatOr240v)||!answer(x.rechargeAssumed)||
 ![8,12,24,36,48,72].includes(x.targetHours)||![0,15,25,40].includes(x.reservePercent)||
 !Array.isArray(x.loads)||x.loads.length<1||x.loads.length>6||
 x.loads.some((l,i)=>!loadValid(l,["a","b","c","d","e","f"][i] as LoadId)))
 return fail("needs-inputs","Correct invalid inputs before sizing a battery",
  "Supported: one to six loads, up to 8,000 W each, same-day duty-cycle hours and 8–72 hour outages.");
 if(x.use==="house-wiring"||x.medicalOrLifeSafety==="yes"||x.highHeatOr240v==="yes"||
 x.rechargeAssumed==="yes")
 return fail("unsafe-scope","This use requires a different, professionally reviewed solution",
  "This buyer worksheet is only for portable stations powering ordinary cord-and-plug 120 V AC devices; no home wiring, high heat/240 V, critical medical or life-safety loads, or assumed recharging.",
  "UL 2743 covers portable power packs; it does not certify a portable unit as a residential stationary energy storage system.");
 if(x.use!=="cord-and-plug-120v"||x.medicalOrLifeSafety!=="no"||
 x.highHeatOr240v!=="no"||x.rechargeAssumed!=="no")
 return fail("needs-inputs","Verify the use boundaries before calculating",
  "Explicitly confirm cord-and-plug-only 120 V loads; exclude medical, life-safety, high heat and 240 V uses. This screen assumes NO recharging during the outage.");
 const errors:string[]=[];
 let run=0,peak=0,dailyWh=0;
 let estimated=false;
 for(const [i,l] of x.loads.entries()){
  const label=l.label.trim()||"Load "+(i+1);
  if(l.runWatts===null||l.startWatts===null||l.activeHoursPerDay===null){
   errors.push("Enter measured or manufacturer-supported running W, startup peak W and active hours/day for "+label+".");
   continue;
  }
  if(l.startWatts<l.runWatts)errors.push(label+": startup peak must be at least running watts.");
  if(l.evidence!=="verified")estimated=true;
  if(l.motor!=="no"&&l.motor!=="yes")errors.push("Confirm motor/compressor status for "+label+".");
  if(l.label.trim()==="")errors.push("Give each load a short identifying label (avoid personal information).");
  run+=l.runWatts;peak+=l.startWatts;dailyWh+=l.runWatts*l.activeHoursPerDay;
 }
 if(errors.length)return fail("needs-inputs","Resolve load details before calculating",...errors);
 // Sum all reported peaks conservatively; assumes even simultaneous motor starts.
 const outputEnergyWh=numberOf(dailyWh*x.targetHours/24);
 const plannedEnergyWh=numberOf(outputEnergyWh*(1+x.reservePercent/100));
 const notes=[
  "AC outlet energy: Σ(running W × actual on-hours per day) × outage hours ÷ 24. Planned energy includes your chosen "+x.reservePercent+"% reserve; this margin is NOT a manufacturer efficiency claim.",
  "Required continuous watts is the sum of all running watts. Conservative simultaneous peak is the SUM of all user-supplied startup peaks. It is not an installation approval or guarantee that a device can start.",
  "Compare only against manufacturer-verified DELIVERED/USABLE energy at 120 V AC outlets, not nominal/nameplate battery Wh. AC conversion and temperature losses must already be reflected in the documented usable number.",
  "Refrigeration duty cycles, low temperatures and food-safety outcomes may differ materially from your entered assumptions. Do not assume refrigeration stays food-safe for the requested time."
 ];
 return {status:estimated?"planning-only":"verified-plan",
  headline:estimated?"Illustrative planning numbers — verify appliance readings first":"Documented input assumptions allow conditional product screening",
  issues:estimated?["One or more appliance load/duty entries were labeled an estimate or remain unverified. No power station can pass the product screen until you verify every load.",...notes]:notes,
  outputEnergyWh,plannedEnergyWh,combinedRunningWatts:numberOf(run),simultaneousPeakWatts:numberOf(peak)};
}
function screenOffer(q:Offer,plan:LoadPlan):OfferReview{
 const issues:string[]=[];
 if(!q.model.trim())issues.push("Enter the exact manufacturer and model, not a product series or catalog category.");
 const fields:[
  keyof Offer,string
 ][]=[
  ["manufacturerProofReviewed","Check exact-model published documentation for delivered AC Wh, continuous inverter W and startup-surge W."],
  ["exact120vOutputsVerified","Confirm sufficient appropriate 120 V AC outlets, connection, frequency and manufacturer allowed loads."],
  ["portableListingVerified","Independently verify relevant portable power-pack safety listing/certification (such as UL 2743); do not assume its logo certifies home wiring."],
  ["modelRecallChecked","Check the exact model against CPSC recalls and manufacturer notices before buying; this site does not check live recalls."],
  ["warrantyAndReturnTermsReviewed","Review written manufacturer warranty, returns and exclusions."],
  ["useLocationReviewed","Confirm indoor/temporary outdoor location rating, operating temperature, ventilation and placement instructions."]
 ];
 for(const [key,desc] of fields)if(q[key]!=="yes")issues.push(desc);
 for(const [key,desc] of [
  ["usableACWh","Document delivered/usable AC outlet capacity in Wh. Nominal battery Wh alone cannot qualify."],
  ["runningACWatts","Document exact station continuous AC inverter output in W."],
  ["surgeACWatts","Document exact station surge/starting AC output in W."]
 ] as [keyof Offer,string][])if(q[key]===null)issues.push(desc);
 if(q.surgeACWatts!==null&&q.runningACWatts!==null&&q.surgeACWatts<q.runningACWatts)
  issues.push("A product's listed surge watts cannot be below its listed continuous watts; verify specifications.");
 if(q.completePrice===null||q.otherMandatoryCharges===null)
  issues.push("Enter total product price plus all mandatory tax/shipping/accessory charges; zero requires written confirmation.");
 const total=q.completePrice!==null&&q.otherMandatoryCharges!==null?numberOf(q.completePrice+q.otherMandatoryCharges):null;
 if(issues.length)return {id:q.id,status:"missing-evidence",issues,reportedAllInUSD:total,
  capacityWhDifference:q.usableACWh===null?null:numberOf(q.usableACWh-plan.plannedEnergyWh!),noCertification:true};
 const deficit:string[]=[];
 if(q.usableACWh!<plan.plannedEnergyWh!)
  deficit.push("Delivered AC energy is below the reported planning requirement by "+numberOf(plan.plannedEnergyWh!-q.usableACWh!)+" Wh.");
 if(q.runningACWatts!<plan.combinedRunningWatts!)
  deficit.push("Continuous AC output is below the sum of your connected running loads.");
 if(q.surgeACWatts!<plan.simultaneousPeakWatts!)
  deficit.push("Surge output is below the conservative sum of reported startup peaks.");
 return {id:q.id,status:deficit.length?"below-requirement":"conditional-capacity-screen",
  issues:deficit.length?deficit:[
   "The entered specifications pass only a conservative arithmetic screen, not independent certification of electrical safety, reliability or real-world runtime.",
   "Manufacturer ratings may have conditions (temperature, outlet mode, load type, inverter behavior); confirm actual model and the written operating instructions."
  ],reportedAllInUSD:total,capacityWhDifference:numberOf(q.usableACWh!-plan.plannedEnergyWh!),
  noCertification:true};
}
export function evaluate(raw:unknown,offers:unknown,asOf=REVIEWED):Decision{
 const plan=screenLoad(raw,asOf),decision=startDecision(plan);
 if(plan.status!=="verified-plan"||!Array.isArray(offers)||offers.length!==2||
 !offerValid(offers[0],"a")||!offerValid(offers[1],"b"))
 return decision;
 const a=screenOffer(offers[0],plan),b=screenOffer(offers[1],plan);
 decision.offers=[a,b];
 if(a.status==="conditional-capacity-screen"&&b.status==="conditional-capacity-screen"&&
 a.reportedAllInUSD!==null&&b.reportedAllInUSD!==null){
  decision.compareAllowed=true;
  decision.priceDifferenceUSD=numberOf(Math.abs(a.reportedAllInUSD-b.reportedAllInUSD));
  decision.lowerOffer=a.reportedAllInUSD<b.reportedAllInUSD?"a":b.reportedAllInUSD<a.reportedAllInUSD?"b":null;
 }
 return decision;
}
export function requestText(d:Decision,v:Visit,q:[Offer,Offer]):string{
 const format=(n:number|null)=>n===null?"UNCONFIRMED":String(n);
 return [
  "BACKUP BENCH — PRIVATE PORTABLE 120V AC POWER BUYING AUDIT",
  "Source reviewed "+REVIEWED+"; not electrical engineering or real-time product verification.",
  "Use: "+v.use+", no home wiring, medical devices, 240 V, high heat or assumed recharging.",
  "Target: "+v.targetHours+" hours, reserve "+v.reservePercent+"% (buyer-chosen, not manufacturer efficiency).",
  ...v.loads.map(x=>"LOAD: "+x.label+" | running W "+format(x.runWatts)+
   " | max startup W "+format(x.startWatts)+" | active hours/day "+format(x.activeHoursPerDay)+
   " | evidence "+x.evidence+" | compressor/motor "+x.motor),
  "Decision: "+d.plan.status+" — "+d.plan.headline,
  "Energy delivered at AC outlets over period: "+format(d.plan.outputEnergyWh)+" Wh",
  "Planning Wh incl reserve: "+format(d.plan.plannedEnergyWh)+" Wh",
  "Combined running: "+format(d.plan.combinedRunningWatts)+" W",
  "Conservative summed startup peaks: "+format(d.plan.simultaneousPeakWatts)+" W",
  ...d.plan.issues.map(x=>"CHECK: "+x),
  ...q.flatMap((x,i)=>[
   "OPTION "+x.id.toUpperCase()+": "+x.model,
   "DOCUMENTED usable AC Wh "+format(x.usableACWh)+
   " | running inverter W "+format(x.runningACWatts)+
   " | surge inverter W "+format(x.surgeACWatts),
   "Quoted base USD "+format(x.completePrice)+" | mandatory extras USD "+format(x.otherMandatoryCharges),
   "Status: "+d.offers[i].status+", self-entered all-in total "+format(d.offers[i].reportedAllInUSD),
   ...d.offers[i].issues.map(y=>"VERIFY: "+y)
  ]),
  "Comparable buyer-supplied prices: "+d.compareAllowed+
  " | difference: "+format(d.priceDifferenceUSD)+" USD | lower reported quote: "+(d.lowerOffer??"none"),
  "Before buying: check UL listing scope, exact CPSC recall notices, outlet and temperature restrictions, and product manual. CPSC: "+SOURCES.recalls,
  "UL 2743 is a portable-power-pack standard, NOT a certificate for hardwiring into a house. "+SOURCES.stationary,
  "No real-time inventory, listed model verification, safety approval, affiliate links, provider promotion or actual runtime guarantee."
 ].join("\n");
}
