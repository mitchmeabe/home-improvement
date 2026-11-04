"use client";
import {useMemo,useState} from "react";
import {track} from "@vercel/analytics";
import {downloadTextReport} from "../lib/download-report";
import type {Location,Property} from "../lib/heat-pump";
import {
 emptyQuote,compareHeatPumpQuotes,quoteComparisonQuestions,QUOTE_REVIEWED_ON,QUOTE_SOURCES,
 type QuoteItem,type Answer,type PriceBasis,type QuoteScope,
} from "../lib/heat-pump-quotes";
import {ProposalTextImporter,type ProposalPatch} from "./proposal-text-import";
import "./heat-pump-quote-comparison.css";
const yn=[{value:"unsure",label:"Not documented"},{value:"yes",label:"Confirmed in writing"},{value:"no",label:"No"}] as const;
const m=(n:number|null)=>n===null?"—":n.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2});
const n=(s:string)=>s.trim()===""?null:Number(s);
type MoneyKey="installedPrice"|"otherDiscount"|"hp3ProposedDiscount"|"annualOperatingCost";
type AnswerKey="otherDiscountConfirmed"|"hp3ApprovedContractor"|"hp3FundingConfirmed"|"hp3UpfrontReduction"|"modelAndRatingsDocumented"|"mechanicalPermitIncluded"|"electricalScopeIncluded"|"finalInspectionIncluded"|"warrantyInWriting"|"commissioningIncluded"|"ductAirflowTestingIncluded"|"oldSystemRemovalIncluded";
function PriceInput({label,value,onChange,help}: {label:string;value:number|null;onChange:(x:number|null)=>void;help?:string}){
 return <label className="hp-q-field">{label}{help&&<small>{help}</small>}<input type="number" min="0" step="0.01" inputMode="decimal" value={value??""} placeholder="Unknown" onChange={e=>onChange(n(e.target.value))}/></label>;
}
export function HeatPumpQuoteComparison({location,property,hspf2,seer2}:{
 location:Location;property:Property;hspf2:number|null;seer2:number|null;
}){
 const [quotes,setQuotes]=useState<QuoteItem[]>([emptyQuote("a"),emptyQuote("b")]);
 const [message,setMessage]=useState("");
 const update=<K extends keyof QuoteItem>(id:QuoteItem["id"],key:K,value:QuoteItem[K])=>
   setQuotes(old=>old.map(q=>q.id===id?{...q,[key]:value}:q));
 const applyImported=(id:QuoteItem["id"],patch:ProposalPatch)=>{
   setQuotes(old=>old.map(q=>q.id!==id?q:{
     ...q,
     ...(typeof patch.price==="number"?{installedPrice:patch.price}:{}),
     ...(patch.scope?{scope:patch.scope as QuoteScope}:{})
   }));
 };
 const compared=useMemo(()=>{
   try{return {data:compareHeatPumpQuotes({location,property,hspf2,seer2,quotes}),error:null}}
   catch(e){return {data:null,error:e instanceof Error?e.message:"Invalid amount"}}
 },[location,property,hspf2,seer2,quotes]);
 async function copy(){
  if(!compared.data)return;
  try{await navigator.clipboard.writeText(quoteComparisonQuestions(compared.data));track("heat_pump_quote_comparison_copied");setMessage("Questions and comparison copied.");}
  catch{setMessage("Clipboard unavailable. The comparison is visible below.")}
 }
 function ynSelect(q:QuoteItem,key:AnswerKey,label:string){
  return <label className="hp-q-field" key={key}>{label}<select value={q[key]} onChange={e=>update(q.id,key,e.target.value as Answer)}>{yn.map(a=><option value={a.value} key={a.value}>{a.label}</option>)}</select></label>;
 }
 function cost(q:QuoteItem,key:MoneyKey,label:string,help?:string) {
  return <PriceInput key={key} label={label} help={help} value={q[key]} onChange={v=>update(q.id,key,v)}/>;
 }
 return <section className="panel hp-q-panel" id="compare-quotes">
  <p className="eyebrow">Compare contractor bids · next step</p>
  <h2>Which heat-pump quote is really more complete?</h2>
  <p className="muted">Enter two or three bids as written. This estimates price differences and flags missing scope; it does <strong>not</strong> validate a contractor, guarantee incentives, or estimate energy bills without your own operating-cost figures. Your quote information remains in this browser session.</p>
  <p className="hp-q-callout"><strong>Oregon HP3:</strong> {compared.data?.propertyWarning||"Use the state program page to verify current funding."} <a href={QUOTE_SOURCES.hp3} target="_blank" rel="noreferrer">Check Oregon's live program page ↗</a></p>
  <div className="hp-q-cards">{quotes.map(q=><div className="hp-q-card" key={q.id}>
    <div className="hp-q-card-head"><h3>Quote {q.id.toUpperCase()}</h3><small>No contractor identity collected</small></div>
    <div className="hp-q-fields">
      {cost(q,"installedPrice","Total installed quote ($)","As printed in the contractor's proposal.")}
      <label className="hp-q-field">Is this total before or after incentives?
       <select value={q.priceBasis} onChange={e=>update(q.id,"priceBasis",e.target.value as PriceBasis)}>
        <option value="unsure">I don't know</option><option value="before-discounts">Before discounts</option><option value="after-discounts">After discounts</option>
       </select>
      </label>
      <label className="hp-q-field">Broad installation scope
       <select aria-label={"Quote "+q.id.toUpperCase()+" installation scope"} value={q.scope} onChange={e=>update(q.id,"scope",e.target.value as QuoteScope)}>
        <option value="unknown">Not documented</option><option value="reuse-existing-ducts">Ducted — reuse existing ducts</option>
        <option value="new-ductwork">Ducted — new or substantially rebuilt ducts</option>
        <option value="ductless">Ductless mini-splits</option><option value="mixed">Mixed ducted and ductless</option>
       </select>
      </label>
      <details className="hp-q-advanced">
       <summary>Review discounts, rebates, permits and warranties</summary>
       <div className="hp-q-fields">

      {cost(q,"otherDiscount","Other written discount ($)","Only count as applied if explicitly confirmed in writing.")}
      {ynSelect(q,"otherDiscountConfirmed","Other discount confirmed?")}
      {cost(q,"hp3ProposedDiscount","HP3 amount proposed ($)","Enter only what the contractor actually quotes; no automatic $2,000 assumption.")}
      {ynSelect(q,"hp3ApprovedContractor","HP3-approved contractor confirmed?")}
      {ynSelect(q,"hp3FundingConfirmed","Live funding or existing reservation confirmed?")}
      {ynSelect(q,"hp3UpfrontReduction","HP3 upfront price reduction documented?")}
      {ynSelect(q,"modelAndRatingsDocumented","Exact equipment models and ratings documented?")}
      {ynSelect(q,"mechanicalPermitIncluded","Mechanical permit and fee included?")}
      {ynSelect(q,"electricalScopeIncluded","Electrical scope/permit and any panel upgrade covered?")}
      {ynSelect(q,"finalInspectionIncluded","Final inspection responsibility documented?")}
      {ynSelect(q,"warrantyInWriting","Equipment and labor warranties in writing?")}
      {ynSelect(q,"commissioningIncluded","Startup commissioning and documented performance checks included?")}
      {ynSelect(q,"ductAirflowTestingIncluded","Duct sealing / airflow or leakage testing included where applicable?")}
      {ynSelect(q,"oldSystemRemovalIncluded","Old heating equipment removal and disposal included?")}
      {cost(q,"annualOperatingCost","Optional estimated annual operating cost ($)","Only your own estimate; used for a simple ten-year arithmetic scenario.")}
       </div>
      </details>
    </div>
  </div>)}</div>
  <div className="action-row">{quotes.length<3?<button type="button" className="action-secondary" onClick={()=>setQuotes(old=>[...old,emptyQuote("c")])}>Add third quote</button>:<button type="button" className="action-secondary" onClick={()=>setQuotes(old=>old.slice(0,2))}>Remove third quote</button>}</div>
  {compared.error&&<p role="alert" className="warning">{compared.error}</p>}
  {compared.data&&<div className="hp-q-analysis" aria-live="polite">
    <h3>Side-by-side quote analysis</h3>
    {compared.data.scopeDifferences.length>0&&<section className="hp-q-scope-warning" aria-label="Material Oregon bid scope differences">
      <h4>Confirmed differences in included work — price ranking withheld</h4>
      <p>These items were marked included in at least one quote and excluded in another. Ask contractors to issue comparable, itemized proposals.</p>
      <ul>{compared.data.scopeDifferences.map(label=><li key={label}>{label}</li>)}</ul>
    </section>}
    <div className="hp-q-table-scroll"><table className="hp-q-table" aria-label="Oregon heat pump quote completeness comparison">
      <caption>Side-by-side coverage. All answers are self-reported; a checked item is not verified by this website.</caption>
      <thead><tr><th scope="col">Comparison</th>{quotes.map(q=><th scope="col" key={q.id}>Quote {q.id.toUpperCase()}</th>)}</tr></thead>
      <tbody>{[
        {label:"Installation scope",values:quotes.map(q=>q.scope==="reuse-existing-ducts"?"Reusing ducts":q.scope==="new-ductwork"?"New ductwork":q.scope==="ductless"?"Ductless":q.scope==="mixed"?"Mixed":"Unknown")},
        {label:"As-quoted price",values:quotes.map(q=>m(q.installedPrice))},
        {label:"Price basis",values:quotes.map(q=>q.priceBasis)},
        {label:"Conditional arithmetic",values:compared.data.evaluations.map(e=>m(e.arithmeticNet))},
        {label:"Equipment models documented",values:quotes.map(q=>q.modelAndRatingsDocumented)},
        {label:"Mechanical permit included",values:quotes.map(q=>q.mechanicalPermitIncluded)},
        {label:"Electrical scope included",values:quotes.map(q=>q.electricalScopeIncluded)},
        {label:"Final inspection included",values:quotes.map(q=>q.finalInspectionIncluded)},
        {label:"Written warranty",values:quotes.map(q=>q.warrantyInWriting)},
        {label:"Startup commissioning included",values:quotes.map(q=>q.commissioningIncluded)},
        {label:"Duct/airflow testing included",values:quotes.map(q=>q.ductAirflowTestingIncluded)},
        {label:"Old equipment disposal included",values:quotes.map(q=>q.oldSystemRemovalIncluded)},
       ].map(row=><tr key={row.label}><th scope="row">{row.label}</th>{row.values.map((value,i)=><td key={quotes[i].id}>{value}</td>)}</tr>)}</tbody>
     </table></div>
    <div className="hp-q-results">{compared.data.evaluations.map(e=><article key={e.id}>
      <p className="eyebrow">QUOTE {e.id.toUpperCase()}</p>
      <div><small>Stated installed quote</small><strong>{m(e.installedPrice)}</strong></div>
      <div><small>Conditional price arithmetic (not used for bid ranking)</small><strong>{m(e.arithmeticNet)}</strong></div>
      <p className="small">{e.netDescription}</p>
      <p className="small"><strong>{e.completeFields} of {e.totalFields}</strong> basic scope items confirmed in writing (self-reported).</p>
      <p className="small">10-year installation + operating-cost scenario: <strong>{m(e.tenYearScenario)}</strong> {e.tenYearScenario===null?"(requires your annual-cost estimate)":""}</p>
      {e.warnings.length>0&&<section className="hp-q-priorities" aria-label={"Quote "+e.id.toUpperCase()+" priority contractor questions"}>
        <h4>Ask the contractor first</h4>
        <ol>{e.warnings.slice(0,3).map((w,i)=><li key={i}>{w}</li>)}</ol>
      </section>}
      <details><summary>All questions and risks ({e.warnings.length})</summary><ul>{e.warnings.map((x,i)=><li key={i}>{x}</li>)}</ul></details>
    </article>)}</div>
    {compared.data.priceDifference!==null&&<div className="hp-q-summary"><b>Difference between comparable as-quoted totals: {m(compared.data.priceDifference)}</b><p>{compared.data.comparisonReason} Quote {compared.data.lowestComparableQuote?.toUpperCase()} has the lowest reported as-quoted total, not necessarily the best or cheapest complete project. Conditional rebate estimates are excluded from this comparison.</p></div>}
    {compared.data.priceDifference===null&&<p className="hp-q-summary">{compared.data.comparisonReason}</p>}
    <p className="small">These are examples of arithmetic, not savings guarantees. HP3 has a published $2,000 program ceiling, strict funding/contractor/efficiency conditions, and restrictions on stacking with some federal incentives; an approved reservation is not required for all eligible applications, but funding is never guaranteed. Verify the specific program application and final invoice.</p>
  </div>}
  <div className="action-row"><button type="button" className="action-primary" disabled={!compared.data} onClick={copy}>Copy comparison questions</button>
   <button type="button" className="action-secondary" disabled={!compared.data} onClick={()=>{if(compared.data){downloadTextReport("oregon-heat-pump-quotes",quoteComparisonQuestions(compared.data));track("heat_pump_quote_report_downloaded")}}}>Download report (.txt)</button>
   <a href={QUOTE_SOURCES.mechanical} className="action-secondary" target="_blank" rel="noreferrer" onClick={()=>track("heat_pump_mechanical_permit_click")}>Portland mechanical permits ↗</a>
   <a href={QUOTE_SOURCES.electrical} className="action-secondary" target="_blank" rel="noreferrer" onClick={()=>track("heat_pump_electrical_permit_click")}>Portland electrical permits ↗</a>
  </div>
  {message&&<p className="small" role="status">{message}</p>}
  <p className="small">Official-source snapshot reviewed {QUOTE_REVIEWED_ON}; HP3 funding table dated October 1, 2026. The comparison does not collect or transmit addresses, contractor names, quotes as documents, payment details or exact field values. Contact agencies to confirm any legal or funding determination.</p>
 </section>
}
