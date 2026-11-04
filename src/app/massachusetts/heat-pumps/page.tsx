"use client";

import {useMemo,useState} from "react";
import Link from "next/link";
import {track} from "@vercel/analytics";
import {
 MASS_REVIEWED_ON,MASS_SOURCES,EMPTY_MASS_INPUT,newMassQuote,compareMassQuotes,massCopyPlan,
 type MassInput,type MassQuote,type Answer,type HeatingFuel,type MassYear,type MassRoute,type PriceBasis,
} from "../../../lib/mass-save";
import "./massachusetts.css";
const answerOptions=[
 {value:"unsure",label:"I need to verify"},
 {value:"yes",label:"Yes — confirmed"},
 {value:"no",label:"No"},
] as const;
type Common=Omit<MassInput,"installerInNetwork"|"equipmentOnQualifiedList"|"newEquipment"|"coolingCapacityBtu">;
type CommonAnswerKey="residentialSponsorConfirmed"|"winterOccupied"|"hasOldHeatPump"|"displacesPrimaryHeating"|"wholeWeatherization"|"wholeFormSigned"|"fossilHeatingRemains"|"partialIntegratedControls"|"removedFuelEvidence";
type BidAnswerKey="installerInNetwork"|"equipmentOnQualifiedList"|"newEquipment"|"rebateDocumentation"|"permitsAndElectrical"|"loadCalculationProvided"|"scopeAndEquipmentIdentified"|"warrantyInWriting";
const currency=(value:number|null)=>value===null?"Not established":value.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2});
const number=(str:string)=>str.trim()===""?null:Number(str);

function Choice({id,label,hint,value,options,onChange}:{
 id:string;label:string;hint?:string;value:string;options:ReadonlyArray<{value:string;label:string}>;onChange:(v:string)=>void;
}){
 return <div className="ma-field"><label htmlFor={id}>{label}</label>{hint&&<p>{hint}</p>}
   <select id={id} value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
 </div>;
}
function Money({id,label,hint,value,onChange}:{
 id:string;label:string;hint?:string;value:number|null;onChange:(n:number|null)=>void;
}){
 return <div className="ma-field"><label htmlFor={id}>{label}</label>{hint&&<p>{hint}</p>}
   <input id={id} type="number" min="0" step="0.01" value={value??""} placeholder="Unknown" onChange={e=>onChange(number(e.target.value))}/>
 </div>;
}
export default function MassachusettsHeatPumpPage(){
 const initial=EMPTY_MASS_INPUT;
 const [common,setCommon]=useState<Common>({
  year:initial.year,route:initial.route,heatingFuel:initial.heatingFuel,
  residentialSponsorConfirmed:initial.residentialSponsorConfirmed,winterOccupied:initial.winterOccupied,
  hasOldHeatPump:initial.hasOldHeatPump,displacesPrimaryHeating:initial.displacesPrimaryHeating,
  wholeWeatherization:initial.wholeWeatherization,wholeFormSigned:initial.wholeFormSigned,
  fossilHeatingRemains:initial.fossilHeatingRemains,partialIntegratedControls:initial.partialIntegratedControls,
  removedFuelEvidence:initial.removedFuelEvidence,
 });
 const [quotes,setQuotes]=useState<MassQuote[]>([newMassQuote("a"),newMassQuote("b")]);
 const [copyMessage,setCopyMessage]=useState("");
 const [feedback,setFeedback]=useState<null|boolean>(null);
 const set=<K extends keyof Common>(k:K,value:Common[K])=>setCommon(old=>({...old,[k]:value}));
 const updateBid=<K extends keyof MassQuote>(id:MassQuote["id"],key:K,value:MassQuote[K])=>
  setQuotes(old=>old.map(q=>q.id===id?{...q,[key]:value}:q));
 const comparison=useMemo(()=>{
  try{return {result:compareMassQuotes(common,quotes),error:""}}
  catch(err){return {result:null,error:err instanceof Error?err.message:"Invalid quote"}}
 },[common,quotes]);
 const copy=async()=>{
  if(!comparison.result)return;
  try{await navigator.clipboard.writeText(massCopyPlan(comparison.result));track("mass_quote_report_copied");setCopyMessage("Comparison copied; no quote files or address were uploaded.");}
  catch{setCopyMessage("Clipboard not available. Review the information on this page.")}
 };
 const commonChoice=(key:CommonAnswerKey,id:string,label:string,hint?:string)=>
  <Choice key={key} id={id} label={label} hint={hint} value={common[key]} options={answerOptions} onChange={v=>set(key,v as Answer)}/>;
 const bidChoice=(q:MassQuote,key:BidAnswerKey,label:string)=>
  <Choice key={q.id+key} id={"ma-"+q.id+"-"+key} label={label} value={q[key]} options={answerOptions} onChange={v=>updateBid(q.id,key,v as Answer)}/>;
 return <main className="ma-wrap">
  <header className="ma-top"><Link href="/">← Home Improvement</Link><nav aria-label="Project workflow"><a href="#ma-situation">Eligibility</a><a href="#ma-bids">Compare proposals</a><a href="#ma-results">Review results</a></nav></header>
  <section className="ma-hero">
   <p className="ma-eyebrow">MASSACHUSETTS · AIR-SOURCE HEAT PUMPS</p>
   <h1>Understand the rebate before signing the quote.</h1>
   <p>Compare two or three heat-pump proposals, check reported Mass Save conditions, and see how installation year changes the published incentive schedule. No contractor referral or application is submitted here.</p>
   <div className="ma-tags"><span>2026 published amounts</span><span>2027 announced reductions</span><span>Qualified products & installer checks</span><span>Reviewed {MASS_REVIEWED_ON}</span></div>
  </section>
  <div className="ma-warning">Mass Save rebates are <strong>not guaranteed</strong>. Published formulas do not establish eligibility, funding, or final approval. We never apply an estimated rebate automatically to the quoted installation price. This pilot does not determine municipal permits or verify utility accounts.</div>
  <section className="ma-card" id="ma-situation">
   <div className="ma-head"><span className="ma-step">1</span><h2>Property, heating system and proposed installation</h2></div>
   <div className="ma-form-grid">
    <Choice id="ma-year" label="Expected installation year" value={common.year} options={[{value:"unknown",label:"Not yet known"},{value:"2026",label:"2026 — published program"},{value:"2027",label:"2027 — announced changes only"}]} onChange={v=>set("year",v as MassYear)}/>
    <Choice id="ma-route" label="How will the heat pump be used?" value={common.route} options={[{value:"unsure",label:"Not yet decided"},{value:"whole",label:"Whole-home — sole heating and cooling"},{value:"partial",label:"Partial-home — supplemental heating"},{value:"basic",label:"Basic — replacement heat pump / new cooling / addition"}]} onChange={v=>set("route",v as MassRoute)}/>
    <Choice id="ma-fuel" label="What heats the home today?" value={common.heatingFuel} options={[{value:"unsure",label:"Need to confirm"},{value:"oil",label:"Heating oil"},{value:"propane",label:"Propane"},{value:"electric-resistance",label:"Electric resistance / baseboards"},{value:"natural-gas",label:"Natural gas"},{value:"existing-heat-pump",label:"Existing heat pump"},{value:"other",label:"Another fuel / other"}]} onChange={v=>set("heatingFuel",v as HeatingFuel)}/>
    {commonChoice("residentialSponsorConfirmed","ma-sponsor","Eligible Mass Save utility account confirmed?","Check the Mass Save electric sponsor for oil/propane/electric and gas sponsor for natural gas; Basic requires participating electric sponsor.")}
    {commonChoice("displacesPrimaryHeating","ma-displaces","Will the heat pump replace/displace the existing primary heating?","Whole-home requires replacement; Basic applies to non-displacing installations.")}
    {commonChoice("hasOldHeatPump","ma-existing","Replacing an existing heat-pump system?","Replacing an existing heat pump is generally a Basic rebate scenario.")}
    {common.route!=="basic"&&<>{commonChoice("winterOccupied","ma-winter","Is the residence occupied full-time in winter?")}</>}
    {common.route==="whole"&&<>{commonChoice("wholeWeatherization","ma-weather","Whole-home weatherization requirements satisfied?","Document home age / Home Energy Assessment findings / completion of recommendations; multi-family exceptions require official confirmation.")}
      {commonChoice("wholeFormSigned","ma-form","Whole-home verification form prepared and signed?")}</>}
    {common.route==="partial"&&<>
      {commonChoice("fossilHeatingRemains","ma-remains","Will oil, propane or gas heat remain in the heat-pump zones?")}
      {common.fossilHeatingRemains==="yes"&&commonChoice("partialIntegratedControls","ma-integrated","Qualified integrated controls and settings documented?")}
      {common.fossilHeatingRemains==="no"&&commonChoice("removedFuelEvidence","ma-removed","Removed/disconnected fossil heat documented on invoice?")}
    </>}
   </div>
   <p className="ma-note">Income-qualified and turnkey programs can offer larger support but require separate income verification, weatherization and program review. This calculator intentionally does not estimate household income eligibility. <a href={MASS_SOURCES.enhanced.url} target="_blank" rel="noreferrer">Check enhanced incentives ↗</a></p>
  </section>
  <section className="ma-card" id="ma-bids">
   <div className="ma-head"><span className="ma-step">2</span><h2>Compare contractor proposals</h2></div>
   <p className="ma-muted">Enter quoted amounts and written evidence, not contractor names or customer addresses. Different equipment systems can have different AHRI capacities and rebate schedule examples.</p>
   <div className="ma-bids">{quotes.map(q=><article className="ma-bid" key={q.id}>
    <div className="ma-bid-top"><h3>Quote {q.id.toUpperCase()}</h3><span>Independent proposal</span></div>
    <div className="ma-bid-fields">
     <Money id={"ma-"+q.id+"-price"} label="Installed quoted price ($)" value={q.price} onChange={v=>updateBid(q.id,"price",v)}/>
     <Choice id={"ma-"+q.id+"-basis"} label="Does this price already include a rebate?" value={q.priceBasis} options={[{value:"unsure",label:"Don't know"},{value:"before-rebate",label:"Before rebate"},{value:"after-rebate",label:"After rebate"}]} onChange={v=>updateBid(q.id,"priceBasis",v as PriceBasis)}/>
     <Money id={"ma-"+q.id+"-rebate"} label="Rebate amount claimed by contractor ($)" value={q.proposedRebate} onChange={v=>updateBid(q.id,"proposedRebate",v)}/>
     <Money id={"ma-"+q.id+"-capacity"} label="AHRI cooling capacity (BTU/h)" hint="E.g., 36,000 BTU/h = 3 tons. Not the heating capacity or marketing model size." value={q.coolingCapacityBtu} onChange={v=>updateBid(q.id,"coolingCapacityBtu",v)}/>
     {bidChoice(q,"rebateDocumentation","Written rebate confirmation exists?")}
     {bidChoice(q,"installerInNetwork","Installer appears in Mass Save Heat Pump Installer Network?")}
     {bidChoice(q,"equipmentOnQualifiedList","Exact paired system appears on Mass Save qualified list?")}
     {bidChoice(q,"newEquipment","New equipment confirmed?")}
     {bidChoice(q,"permitsAndElectrical","Permits and electrical changes itemized?")}
     {bidChoice(q,"loadCalculationProvided","Manual J heat-load/sizing documentation provided?")}
     {bidChoice(q,"scopeAndEquipmentIdentified","Equipment model IDs and scope documented?")}
     {bidChoice(q,"warrantyInWriting","Equipment/workmanship warranties in writing?")}
    </div>
   </article>)}</div>
   <div className="ma-buttons">{quotes.length<3?<button type="button" onClick={()=>setQuotes(x=>[...x,newMassQuote("c")])}>Add third quote</button>:
    <button type="button" onClick={()=>setQuotes(x=>x.slice(0,2))}>Remove third quote</button>}
    <a href={MASS_SOURCES.products.url} target="_blank" rel="noreferrer" onClick={()=>track("mass_qualified_products_click")}>Check qualified heat pumps ↗</a></div>
  </section>
  <section className="ma-card" id="ma-results" aria-live="polite">
   <div className="ma-head"><span className="ma-step">3</span><h2>Results, cost comparison and questions</h2></div>
   {comparison.error?<p role="alert" className="ma-warning">{comparison.error}</p>:comparison.result&&<>
    <div className="ma-results">{comparison.result.quotes.map(e=><article className="ma-result" key={e.quote.id}>
     <p className="ma-eyebrow">QUOTE {e.quote.id.toUpperCase()}</p>
     <span className={"ma-status "+e.program.status}>{e.program.status==="requirements-reported"?"Prerequisites self-reported":e.program.status==="schedule-only"?"2027 amounts only":e.program.status==="not-supported"?"Reported eligibility barrier":"Verification needed"}</span>
     <div className="ma-price"><small>As-quoted installation amount</small><strong>{currency(e.statedPrice)}</strong></div>
     <div className="ma-price"><small>Published schedule arithmetic (not an award)</small><strong>{currency(e.program.theoreticalScheduleAmount)}</strong></div>
     <div className="ma-price"><small>Conditional post-rebate illustration, only with written confirmation</small><strong>{currency(e.conditionalPostRebate)}</strong></div>
     <p className="ma-muted">Project documentation: {e.itemsDocumented} of 4 items marked confirmed in writing.</p>
     <details><summary>Eligibility conditions ({e.program.conditions.length})</summary>
       <ul>{e.program.conditions.map(x=><li key={x.id}><b>{x.label}</b> — {x.status==="reported-met"?"User-reported met":x.status==="not-met"?"Not met":"Needs verification"}<p>{x.explanation}</p></li>)}</ul>
     </details>
     <details><summary>Contract and program questions ({e.risks.length+e.program.warnings.length})</summary>
      <ul>{[...e.risks,...e.program.warnings].map((x,i)=><li key={i}>{x}</li>)}</ul>
     </details>
    </article>)}</div>
    {comparison.result.comparablePriceGap!==null?<p className="ma-summary"><b>Difference between comparable reported price totals: {currency(comparison.result.comparablePriceGap)}</b> Quote {comparison.result.comparativeWinner?.toUpperCase()} has the lowest entered amount on the same rebate basis. {comparison.result.comparisonExplanation}</p>:
    <p className="ma-summary">{comparison.result.comparisonExplanation}</p>}
    <p className="ma-warning">For 2026, complete equipment installations must occur by December 31, 2026, with forms and supporting documents received by February 28, 2027. As of October 1, 2026, serial-number/nameplate photos are required. For 2027, only the announced whole-home and partial-home **rate and cap changes** are encoded. Obtain current 2027 terms and confirmation from the program before relying on any amount.</p>
    <div className="ma-buttons"><button type="button" className="ma-main-button" onClick={copy}>Copy my contractor questions</button>
     <a href={MASS_SOURCES.air.url} target="_blank" rel="noreferrer" onClick={()=>track("mass_save_program_click")}>Official Mass Save rebate rules ↗</a>
    </div>
    {copyMessage&&<p role="status" className="ma-muted">{copyMessage}</p>}
   </>}
  </section>
  <section className="ma-card ma-feedback"><h2>Did this help you compare proposals?</h2><p className="ma-muted">We count only yes/no feedback, not your quote amounts or personal information.</p>
    <div className="ma-buttons"><button type="button" aria-pressed={feedback===true} onClick={()=>{setFeedback(true);track("mass_quote_helpful_yes")}}>Yes</button><button type="button" aria-pressed={feedback===false} onClick={()=>{setFeedback(false);track("mass_quote_helpful_no")}}>No</button>{feedback!==null&&<span role="status">Thank you.</span>}</div>
  </section>
  <section className="ma-sources"><h2>Official source references</h2><p>Reviewed {MASS_REVIEWED_ON}. Rules and program funding can change; compare source publication dates before relying on money.</p>
   <ul>{Object.entries(MASS_SOURCES).map(([id,s])=><li key={id}><a href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a></li>)}</ul>
  </section>
  <footer className="ma-footer">Independent research prototype · Not affiliated with Mass Save or utility sponsors · No affiliate relationship or contractor referral fees · No addresses, contractor names, proposals or other private data collected · No guaranteed rebates or energy savings.</footer>
 </main>;
}
