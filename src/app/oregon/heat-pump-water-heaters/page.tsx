"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {downloadTextReport} from "../../../lib/download-report";
import {HPWH_REVIEWED,HPWH_OFFER_PUBLISHED,HPWH_SOURCES,initialInput,newQuote,evaluate,report,
 type Input,type Quote,type Answer,type OregonPlace,type HouseType,type Dwelling,type ElectricCompany,type InstallRoute,type HeaterFuel,
 type PriceBasis,type QuoteScope} from "../../../lib/oregon-heat-pump-water-heater";
import {HPWHPurchaseFitStudio} from "../../../components/hpwh-purchase-fit";
import {newHPWHSite,newHPWHModelReview,assessHPWHFit,type HPWHSite,type HPWHModelReview} from "../../../lib/hpwh-purchase-fit";
import "./water-heaters.css";
const answerChoices=[["unknown","Not sure"],["yes","Yes"],["no","No"]] as const;
const price=(v:number|null)=>v===null?"Not entered":v.toLocaleString("en-US",{style:"currency",currency:"USD"});
const parse=(s:string)=>s.trim()===""?null:Number(s);
export default function WaterHeaterPlanner(){
 const [input,setInput]=useState<Input>(initialInput);
 const [message,setMessage]=useState("");
 const [fitSite,setFitSite]=useState<HPWHSite>(newHPWHSite);
 const [fitModels,setFitModels]=useState<Record<Quote["id"],HPWHModelReview>>({a:newHPWHModelReview("a"),b:newHPWHModelReview("b"),c:newHPWHModelReview("c")});
 const fit=useMemo(()=>{
  try{return {result:assessHPWHFit(input,fitSite,input.quotes.map(q=>fitModels[q.id]),new Date().toISOString().slice(0,10)),error:""}}
  catch(e){return {result:null,error:e instanceof Error?e.message:"Check the model and room values entered."}}
 },[input,fitSite,fitModels]);
 const updateSite=<K extends keyof HPWHSite>(key:K,value:HPWHSite[K])=>setFitSite(old=>({...old,[key]:value}));
 const updateFitModel=(id:Quote["id"],patch:Partial<HPWHModelReview>)=>setFitModels(old=>({...old,[id]:{...old[id],...patch}}));
 const out=useMemo(()=>{try{return {result:evaluate(input),error:""}}catch(e){
  return {result:null,error:e instanceof Error?e.message:"Check the values entered."};
 }},[input]);
 const set=<K extends keyof Input>(key:K,value:Input[K])=>setInput(old=>({...old,[key]:value}));
 const update=(id:Quote["id"],patch:Partial<Quote>)=>setInput(old=>({...old,quotes:old.quotes.map(q=>q.id===id?{...q,...patch}:q)}));
 const field=(id:string,label:string,key:"replacement"|"newWiring"|"newVentilation")=>
  <label htmlFor={id}>{label}<select id={id} value={input[key]} onChange={e=>set(key,e.target.value as Answer)}>
   {answerChoices.map(([value,title])=><option key={value} value={value}>{title}</option>)}
  </select></label>;
 const qField=(id:Quote["id"],label:string,key:"plumbingIncluded"|"electricalIncluded"|"condensateIncluded"|"airflowDocumented"|"warrantyWritten")=>
  <label htmlFor={"hw-"+id+"-"+key}>{label}<select id={"hw-"+id+"-"+key} value={input.quotes.find(q=>q.id===id)?.[key]||"unknown"}
   onChange={e=>update(id,{[key]:e.target.value as Answer})}>
    {answerChoices.map(([value,title])=><option key={value} value={value}>{title}</option>)}
  </select></label>;
 const copy=async()=>{if(!out.result)return;try{await navigator.clipboard.writeText(report(out.result));setMessage("Checklist copied.")}
  catch{setMessage("Clipboard unavailable. Download the text report instead.")}};
 return <main className="hpwh">
  <nav aria-label="Home improvement navigation"><Link href="/">Home Improvement</Link><Link href="/massachusetts/heat-pumps">Massachusetts heat pumps</Link></nav>
  <header className="hpwh-hero"><p className="hpwh-kicker">OREGON · HEAT-PUMP WATER HEATERS</p>
   <h1>Compare the installation, not just the water-heater price.</h1>
   <p>Identify relevant Portland permits, check the applicable 2026 Energy Trust purchasing route, and compare two or three itemized heat-pump water heater quotes.</p>
   <p className="hpwh-muted">Reviewed {HPWH_REVIEWED}. Not a space-heating heat pump, HP3 calculation, approved rebate, permit issuance or contractor endorsement. Inputs stay in browser memory.</p>
  </header>
  <p className="hpwh-jump"><a href="#hpwh-results">See permit and incentive results <span aria-hidden="true">↓</span></a></p>
  <section className="hpwh-card hpwh-static">
   <h2>Before choosing a heat-pump water heater</h2>
   <p>Replacing a water heater can involve a plumbing permit, changes to electrical circuits, condensate disposal, and air-clearance or ventilation constraints. A lower appliance price can exclude significant installation work. Portland's permit rules require actual city jurisdiction—not merely a Portland mailing address. <a href={HPWH_SOURCES.jurisdiction} target="_blank" rel="noreferrer">Check city jurisdiction ↗</a></p>
   <p>Energy Trust's <a href={HPWH_SOURCES.utility} target="_blank" rel="noreferrer">May {HPWH_OFFER_PUBLISHED.slice(8)}, 2026 notice</a> described $1,200 through participating professional distributors and $1,000 via qualifying in-store DIY purchases. Those dated figures are not current award guarantees; this tool never subtracts them from any quoted total.</p>
  </section>
  <section className="hpwh-card"><h2>1. Identify the property and project</h2>
   <div className="hpwh-fields">
    <label htmlFor="hw-place">Where is the property and what is its permit jurisdiction?
      <select id="hw-place" value={input.place} onChange={e=>set("place",e.target.value as OregonPlace)}>
       <option value="portland-unverified">Portland mailing address / city status not verified</option>
       <option value="portland-verified">Portland city jurisdiction independently checked</option>
       <option value="other-oregon">Elsewhere in Oregon</option><option value="outside-oregon">Outside Oregon</option>
       <option value="unknown">State or jurisdiction not checked</option>
      </select></label>
    <label htmlFor="hw-house">Building type
     <select id="hw-house" value={input.house} onChange={e=>set("house",e.target.value as HouseType)}>
      <option value="unknown">Not sure</option><option value="one-two-family">One- or two-family dwelling</option>
      <option value="other">Larger multifamily / other building</option>
     </select></label>
    <label htmlFor="hw-dwelling">Property / occupancy situation
     <select id="hw-dwelling" value={input.dwelling} onChange={e=>set("dwelling",e.target.value as Dwelling)}>
      <option value="unknown">Not sure</option><option value="existing-owner">Existing home I own and occupy</option>
      <option value="existing-rental">Existing rental</option><option value="new-construction">New construction</option>
      <option value="other">Commercial or other</option>
     </select></label>
    <label htmlFor="hw-utility">Electricity utility on your bill
     <select id="hw-utility" value={input.utility} onChange={e=>set("utility",e.target.value as ElectricCompany)}>
      <option value="unknown">Not checked</option><option value="pge">Portland General Electric</option>
      <option value="pacific-power">Pacific Power</option><option value="other">Other utility</option>
     </select></label>
    <details className="hpwh-advanced">
      <summary><strong>Add installation details</strong> · optional questions for more precise guidance</summary>
      <div className="hpwh-advanced-fields">
    <label htmlFor="hw-install">How is the water heater purchased/installed?
     <select id="hw-install" value={input.installation} onChange={e=>set("installation",e.target.value as InstallRoute)}>
      <option value="unknown">Not decided</option><option value="contractor">Contractor / professional installation</option>
      <option value="do-it-yourself">Self-install / retail purchase</option>
     </select></label>
    <label htmlFor="hw-fuel">Fuel of the existing water heater
     <select id="hw-fuel" value={input.currentFuel} onChange={e=>set("currentFuel",e.target.value as HeaterFuel)}>
      <option value="unknown">Not sure</option><option value="electric">Electric</option>
      <option value="gas">Gas</option><option value="other">Other</option>
     </select></label>
    {field("hw-replacement","Replacing an existing water heater?","replacement")}
    {field("hw-wiring","New or altered hard-wired electrical work?","newWiring")}
    {field("hw-ventilation","New or changed ventilation or ducting?","newVentilation")}
      </div>
    </details>
   </div>
  </section>
  <section className="hpwh-card"><h2>2. Compare contractor or installation quotes</h2>
   <details className="hpwh-quote-step"><summary><strong>Have contractor proposals?</strong> Open the optional two- or three-quote comparison</summary>
   <p className="hpwh-muted">Enter comparable installed totals, not appliance-only prices. Mark whether any incentive is already deducted. No automatic published rebate subtraction.</p>
   <div className="hpwh-quote-grid">{input.quotes.map(q=><article className="hpwh-quote" key={q.id}>
    <h3>Quote {q.id.toUpperCase()}</h3>
    <label htmlFor={"hw-"+q.id+"-total"}>Total installed cost ($)
     <input id={"hw-"+q.id+"-total"} type="number" min="0" step="0.01" value={q.installedTotal??""} placeholder="Not entered"
      onChange={e=>update(q.id,{installedTotal:parse(e.target.value)})}/></label>
    <label htmlFor={"hw-"+q.id+"-basis"}>Does the quoted total include incentives?
     <select id={"hw-"+q.id+"-basis"} value={q.priceBasis} onChange={e=>update(q.id,{priceBasis:e.target.value as PriceBasis})}>
      <option value="unknown">Not stated</option><option value="before-incentives">Before incentives</option>
      <option value="after-incentives">After incentives</option>
     </select></label>
    <label htmlFor={"hw-"+q.id+"-scope"}>Installation scope
     <select id={"hw-"+q.id+"-scope"} value={q.scope} onChange={e=>update(q.id,{scope:e.target.value as QuoteScope})}>
      <option value="unknown">Unknown</option><option value="same-location">Replace in same location</option>
      <option value="relocated">Relocate existing system</option><option value="new-system">New installation</option>
     </select></label>
    <label htmlFor={"hw-"+q.id+"-tank"}>Tank capacity (gallons)
     <input id={"hw-"+q.id+"-tank"} type="number" min="20" max="300" step="1" value={q.tankGallons??""} placeholder="Unknown"
       onChange={e=>update(q.id,{tankGallons:parse(e.target.value)})}/></label>
    <label htmlFor={"hw-"+q.id+"-rebate"}>Seller-proposed incentive ($; not verified)
     <input id={"hw-"+q.id+"-rebate"} type="number" min="0" step="0.01" value={q.proposedIncentive??""} placeholder="None confirmed"
       onChange={e=>update(q.id,{proposedIncentive:parse(e.target.value)})}/></label>
    <details className="hpwh-details"><summary>Review what's included in this quote</summary>
     {qField(q.id,"Plumbing work and permit included?","plumbingIncluded")}
     {qField(q.id,"Electrical work/circuit included?","electricalIncluded")}
     {qField(q.id,"Condensate disposal included?","condensateIncluded")}
     {qField(q.id,"Ventilation and clearances documented?","airflowDocumented")}
     {qField(q.id,"Labor and equipment warranties in writing?","warrantyWritten")}
    </details>
   </article>)}</div>
   <div className="hpwh-buttons">{input.quotes.length<3?
    <button type="button" onClick={()=>setInput(old=>({...old,quotes:[...old.quotes,newQuote("c")]}))}>Add third quote</button>:
    <button type="button" onClick={()=>setInput(old=>({...old,quotes:old.quotes.slice(0,2)}))}>Remove third quote</button>}</div>
   </details>
  </section>
  <HPWHPurchaseFitStudio input={input} site={fitSite} models={input.quotes.map(q=>fitModels[q.id])} assessment={fit.result} onSite={updateSite} onModel={updateFitModel}/>
  {fit.error&&<p role="alert" className="hpwh-warning">{fit.error}</p>}
  <section className="hpwh-card hpwh-results" id="hpwh-results" aria-label="Heat pump water heater project results">
   <h2>4. Permit, incentive and bid findings</h2>
   {out.error?<p role="alert" className="hpwh-warning">{out.error}</p>:out.result&&<>
    <aside className="hpwh-next-action" aria-labelledby="hpwh-start-heading">
      <h3 id="hpwh-start-heading">Your first next action</h3>
      <p><strong>{out.result.permits[0]?.title||"Confirm project jurisdiction"}</strong> — {out.result.permits[0]?.detail||"Identify the local permitting authority."}</p>
      <p><strong>Program check:</strong> {out.result.programs[0]?.title||"Confirm the applicable incentive route"}.
      Published discounts are not automatically awarded or deducted from contractor quotes.</p>
      <p><strong>Quote status:</strong> {out.result.comparison.comparable?
        fit.result?.safeToCompareAsQuoted?
         "The reported site, model and written installation scopes align for a provisional as-quoted price comparison; a professional must still verify." :
         "Broad quote totals match, but site fit and model equivalence are not established. Finish step 3 before interpreting the lower price." :
        "No reliable price comparison yet. Confirm matching scopes, inclusions, tank size and discount basis."}</p>
    </aside>
    <h3>Permit responsibilities</h3>
    {out.result.permits.map(x=><article className="hpwh-finding" key={x.id}>
      <strong>{x.title} — {x.status==="required"?"Required for this reported scenario":x.status==="check"?"Verify":"Not applicable"}</strong>
      <p>{x.detail} <a href={HPWH_SOURCES[x.source]} target="_blank" rel="noreferrer">Official source ↗</a></p></article>)}
    <h3>Published incentive paths (not approvals)</h3>
    {out.result.programs.map(x=><article className="hpwh-finding" key={x.id}>
      <strong>{x.title} — {x.status==="not-applicable"?"Excluded by stated program scope":"Check current terms"}</strong>
      <p>{x.detail} <a href={HPWH_SOURCES[x.source]} target="_blank" rel="noreferrer">Program source ↗</a></p></article>)}
    {input.quotes.some(q=>q.installedTotal!==null)?<>
    <h3>Installed-price comparison</h3>
    <p className={out.result.comparison.comparable?"hpwh-good":"hpwh-warning"}>{out.result.comparison.reason}</p>
    {out.result.comparison.comparable&&fit.result?.safeToCompareAsQuoted&&<p><strong>Lowest equivalent-scope reported total: quote {out.result.comparison.lowerTotalQuote?.toUpperCase()}</strong>; spread across quoted totals: {price(out.result.comparison.difference)}. This is not an equipment certification, contractor endorsement or confirmed final price.</p>}
    {out.result.comparison.comparable&&!fit.result?.safeToCompareAsQuoted&&<p className="hpwh-warning"><strong>Do not rank the quotes yet:</strong> The entered totals share only a broad basis, but the more detailed model, site and installation review has not established that both proposals describe equivalent purchases. Resolve the questions in step 3 first.</p>}
    {out.result.comparison.quotes.map(x=><details className="hpwh-quote-review" key={x.quote.id}>
      <summary>Quote {x.quote.id.toUpperCase()} — {price(x.quote.installedTotal)} · {x.warnings.length} items to verify</summary>
      <ul>{x.warnings.map(w=><li key={w}>{w}</li>)}</ul>
    </details>)}
    </>:<p className="hpwh-muted hpwh-no-quotes">No contractor quotes entered yet. You can use the permit and program questions without entering any prices.</p>}
    {out.result.notes.map(n=><p className="hpwh-muted" key={n}>{n}</p>)}
    <h3>Questions to ask before signing</h3><ol>{out.result.questions.map(q=><li key={q}>{q}</li>)}</ol>
    <div className="hpwh-buttons"><button type="button" onClick={copy}>Copy questions and findings</button>
     <button type="button" onClick={()=>downloadTextReport("oregon-water-heater-comparison",report(out.result!))}>Download (.txt)</button></div>
    {message&&<p role="status">{message}</p>}
   </>}
  </section>
  <footer><strong>Source limits:</strong> <a href={HPWH_SOURCES.plumbing} target="_blank" rel="noreferrer">Portland plumbing</a> · <a href={HPWH_SOURCES.electrical} target="_blank" rel="noreferrer">electrical</a> · <a href={HPWH_SOURCES.utility} target="_blank" rel="noreferrer">Energy Trust dated offer</a>. Neither pricing nor incentive approval is independently validated. No address, utility account or personal income is requested.</footer>
 </main>;
}
