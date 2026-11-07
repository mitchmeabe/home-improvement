"use client";

import {useMemo,useState} from "react";
import {track} from "@vercel/analytics";
import type {SJInput,SJOutcome} from "../lib/san-jose-ev";
import {
 compareSanJoseEVQuotes,evInstallationRequest,evQuoteComparisonReport,newEVQuote,
 EV_WORK_FIELDS,EV_EVIDENCE_FIELDS,type EVQuote,type EVQuoteId,type EVScope,
 type EVPriceBasis,type EVAnswer
} from "../lib/san-jose-ev-quotes";
import "./san-jose-ev-quote-workspace.css";

const choices:readonly {value:EVScope;label:string}[]=[
 {value:"unsure",label:"Work scope not documented"},
 {value:"new-120v",label:"New 120 V outlet — Level 1"},
 {value:"level2-dedicated",label:"Level 2 — dedicated circuit, no panel work"},
 {value:"level2-managed",label:"Level 2 — managed charging option"},
 {value:"level2-panel-work",label:"Level 2 — includes proposed panel change"},
];
const yesNo:readonly {value:EVAnswer;label:string}[]=[
 {value:"unsure",label:"Unclear / not listed"},
 {value:"yes",label:"Yes — included/documented"},
 {value:"no",label:"No — excluded/not documented"},
];
const basisOptions:readonly {value:EVPriceBasis;label:string}[]=[
 {value:"unsure",label:"Not documented"},
 {value:"before-incentives",label:"Before any incentives or discounts"},
 {value:"after-incentives",label:"Already after quoted incentives/discounts"},
];
function currency(n:number){return n.toLocaleString("en-US",{style:"currency",currency:"USD"});}
function saveText(filename:string,content:string){
 const url=URL.createObjectURL(new Blob([content],{type:"text/plain;charset=utf-8"}));
 const a=document.createElement("a");a.href=url;a.download=filename;
 document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}
function quoteName(id:EVQuoteId){return id==="a"?"Proposal A":"Proposal B";}

export function SanJoseEVQuoteWorkspace({plan,permit}:{plan:SJInput;permit:SJOutcome}){
 const [quotes,setQuotes]=useState<[EVQuote,EVQuote]>([newEVQuote("a"),newEVQuote("b")]);
 const [started,setStarted]=useState(false);
 const [notice,setNotice]=useState("");
 const [showDetails,setShowDetails]=useState<EVQuoteId|null>(null);
 const eligible=permit.status==="electrical-permit";
 const evaluation=useMemo(()=>compareSanJoseEVQuotes(plan,permit,quotes),[plan,permit,quotes]);
 const request=useMemo(()=>evInstallationRequest(plan,permit),[plan,permit]);
 const report=useMemo(()=>evQuoteComparisonReport(plan,permit,quotes,evaluation),[plan,permit,quotes,evaluation]);

 function edit(id:EVQuoteId,patch:Partial<EVQuote>){
  if(!started){setStarted(true);track("sj_ev_quote_comparison_started");}
  setNotice("");
  setQuotes(current=>[
   id==="a"?{...current[0],...patch}:current[0],
   id==="b"?{...current[1],...patch}:current[1],
  ]);
 }
 async function copy(kind:"request"|"comparison"){
  const content=kind==="request"?request:report;
  try{
   await navigator.clipboard.writeText(content);
   setNotice(kind==="request"?"Electrician bid request copied.":"Two-proposal review copied.");
   track(kind==="request"?"sj_ev_request_copied":"sj_ev_comparison_copied");
  }catch{setNotice("Clipboard unavailable. Use the download option or select the text in the preview below.");}
 }
 function download(kind:"request"|"comparison"){
  saveText(kind==="request"?"san-jose-ev-electrician-bid-request.txt":"san-jose-ev-quote-comparison.txt",
   kind==="request"?request:report);
  setNotice(kind==="request"?"Bid request downloaded locally.":"Quote comparison downloaded locally.");
  track(kind==="request"?"sj_ev_request_downloaded":"sj_ev_comparison_downloaded");
 }

 return <div className="sjev-next">
  <section className="sjev-card" aria-labelledby="sjev-approaches-title">
   <p className="sjev-next-kicker">DECISION 02 · CHOOSE THE WORK BEFORE THE PRICE</p>
   <h2 id="sjev-approaches-title">Three sensible charging approaches to discuss</h2>
   <p>There is no universal best option. A suitable existing outlet may be sufficient for some drivers; Level 2 generally charges faster. Electrical capacity, circuit size and charger compatibility must be checked by a qualified electrician—not inferred from the panel's amp rating.</p>
   <div className="sjev-approach-grid">
    <article><span className="sjev-approach-label">01 · NO NEW WIRING</span><h3>Use a suitable existing 120 V outlet</h3><p>Confirm the vehicle and outlet are appropriate for charging. The City's guidance generally does not call for a new charging-station permit when no electrical work is performed.</p><small>May avoid installation work, but do not assume every existing receptacle is safe or suitable.</small></article>
    <article><span className="sjev-approach-label">02 · NEW OUTLET</span><h3>Install a dedicated 120 V charging outlet</h3><p>Price the electrical work and permit for a new outlet separately from purchasing a faster Level 2 station.</p><small>San José's guidance requires an electrical permit for a new 120 V outlet.</small></article>
    <article><span className="sjev-approach-label">03 · LEVEL 2</span><h3>Dedicated or managed Level 2 charging</h3><p>Ask whether suitable service capacity or a code-compliant load-management approach can be documented before agreeing to a panel replacement.</p><small>Level 2 requires an electrical permit and can introduce equipment, wiring and inspection costs.</small></article>
   </div>
  </section>

  {eligible?<>
   <section className="sjev-card sjev-request" aria-labelledby="sjev-request-title">
    <p className="sjev-next-kicker">DECISION 03 · GET COMPARABLE OFFERS</p>
    <h2 id="sjev-request-title">Send the same installation specification to every electrician</h2>
    <p>Your selected project has new electrical work. This checklist asks bidders to itemize charger hardware, route and wiring, load assessment, panel alternatives, city permits, inspection, any excluded work and written warranties. It is a question sheet—not a construction design or a referral request.</p>
    <div className="sjev-next-actions">
     <button type="button" onClick={()=>void copy("request")}>Copy electrician bid request</button>
     <button type="button" className="sjev-secondary" onClick={()=>download("request")}>Download bid request (.txt)</button>
    </div>
    <details className="sjev-request-preview"><summary>Preview the full request before sharing</summary><pre>{request}</pre></details>
   </section>

   <section className="sjev-card sjev-compare" aria-labelledby="sjev-compare-title">
    <p className="sjev-next-kicker">DECISION 04 · REVIEW WHAT EACH PRICE INCLUDES</p>
    <h2 id="sjev-compare-title">Compare two electrician proposals, not just two prices</h2>
    <p>Enter the written terms from two independent bids. Both totals must cover the same installation, permit and inspection work before a dollar difference is shown. The review does not subtract rebates, estimate charging capacity or choose a contractor.</p>
    <div className="sjev-proposals">
     {quotes.map(q=><section className="sjev-proposal" key={q.id} aria-label={quoteName(q.id)}>
      <header><span>QUOTE {q.id.toUpperCase()}</span><h3>{quoteName(q.id)}</h3></header>
      <label className="sjev-proposal-field" htmlFor={"sjev-quote-"+q.id+"-amount"}>Quoted installed total ($)
       <input id={"sjev-quote-"+q.id+"-amount"} type="number" min="0" max="1000000" step="0.01" inputMode="decimal"
        placeholder="e.g. 2400" value={q.amount??""} onChange={e=>edit(q.id,{amount:e.target.value===""?null:Number(e.target.value)})}/>
      </label>
      <label className="sjev-proposal-field" htmlFor={"sjev-quote-"+q.id+"-basis"}>What is included in that total?
       <select id={"sjev-quote-"+q.id+"-basis"} value={q.basis} onChange={e=>edit(q.id,{basis:e.target.value as EVPriceBasis})}>
        {basisOptions.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}
       </select>
      </label>
      <label className="sjev-proposal-field" htmlFor={"sjev-quote-"+q.id+"-scope"}>Exact proposed installation
       <select id={"sjev-quote-"+q.id+"-scope"} value={q.scope} onChange={e=>edit(q.id,{scope:e.target.value as EVScope})}>
        {choices.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}
       </select>
      </label>
      <button type="button" className="sjev-scope-toggle" aria-expanded={showDetails===q.id}
       aria-controls={"sjev-details-"+q.id} onClick={()=>setShowDetails(current=>current===q.id?null:q.id)}>
        {showDetails===q.id?"Hide included-work details":"Review included work and evidence"}
      </button>
      <div id={"sjev-details-"+q.id} hidden={showDetails!==q.id}>
       <h4>Are these actually included in the total?</h4>
       {EV_WORK_FIELDS.map(f=><label className="sjev-proposal-field" key={f.key} htmlFor={"sjev-quote-"+q.id+"-"+f.key}>{f.label}
        <select id={"sjev-quote-"+q.id+"-"+f.key} value={q[f.key]}
         onChange={e=>edit(q.id,{[f.key]:e.target.value} as Partial<EVQuote>)}>
         {yesNo.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}
        </select>
       </label>)}
       <h4>Is the evidence supplied in writing?</h4>
       {EV_EVIDENCE_FIELDS.map(f=><label className="sjev-proposal-field" key={f.key} htmlFor={"sjev-quote-"+q.id+"-"+f.key}>{f.label}
        <select id={"sjev-quote-"+q.id+"-"+f.key} value={q[f.key]}
         onChange={e=>edit(q.id,{[f.key]:e.target.value} as Partial<EVQuote>)}>
         {yesNo.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}
        </select>
       </label>)}
      </div>
     </section>)}
    </div>

    <div className={"sjev-comparison-result "+(evaluation.status==="comparable"?"sjev-comparable":"")} role="region" aria-label="EV charger proposal comparison" aria-live="polite">
     <span className="sjev-next-kicker">{evaluation.status==="comparable"?"SCOPE COMPARISON READY":evaluation.status==="scope-mismatch"?"MATERIAL DIFFERENCES FOUND":"VERIFY DETAILS FIRST"}</span>
     <h3>{evaluation.headline}</h3><p>{evaluation.explanation}</p>
     {evaluation.lowest!==null&&evaluation.quotedPriceGap!==null&&<div className="sjev-difference">
      <strong>{currency(evaluation.quotedPriceGap)}</strong><span>Difference between two reported as-quoted totals; lower reported amount: Quote {evaluation.lowest.toUpperCase()}. This does not identify the best installer or total cost after exclusions.</span>
     </div>}
     {evaluation.differences.length>0&&<><h4>Different work or price basis</h4><ul>{evaluation.differences.map(x=><li key={x}>{x}</li>)}</ul></>}
     {evaluation.issues.length>0&&<><h4>Questions to resolve before relying on price</h4><ul>{evaluation.issues.slice(0,9).map(x=><li key={x}>{x}</li>)}</ul>
      {evaluation.issues.length>9&&<p>{evaluation.issues.length-9} further checks remain. The downloaded review includes every outstanding item.</p>}</>}
     {quotes.some(q=>evaluation.perQuote[q.id].length>0)&&<><h4>Additional written evidence to request</h4><ul>
      {quotes.flatMap(q=>evaluation.perQuote[q.id].map(x=><li key={q.id+x}>Quote {q.id.toUpperCase()}: {x}</li>))}
     </ul></>}
    </div>

    <div className="sjev-next-actions">
     <button type="button" onClick={()=>void copy("comparison")}>Copy comparison and follow-ups</button>
     <button type="button" className="sjev-secondary" onClick={()=>download("comparison")}>Download comparison (.txt)</button>
    </div>
    <p className="sjev-private-note">Local-only draft: proposal values and decisions remain in browser memory. They are not uploaded, saved to an account, or attached to analytics. A copy or download happens only when you choose it.</p>
    {notice&&<p role="status" className="sjev-next-notice">{notice}</p>}
   </section>
  </>:<section className="sjev-card sjev-next-gated">
   <p className="sjev-next-kicker">QUOTE TOOL · NOT YET APPLICABLE</p>
   <h2>Finish your jurisdiction and work-scope review first</h2>
   <p>Quote comparison is available only for newly proposed residential electrical work that the city-specific planner can screen. Unknown jurisdiction, unsupported shared parking, existing-outlet-only situations or source-review expiry must not be treated as approved electrical projects.</p>
  </section>}
 </div>;
}
