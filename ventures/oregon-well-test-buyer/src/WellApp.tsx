import {useMemo,useState} from "react";
import {ANALYTES,ANALYTE_NAMES,REVIEWED_ON,SOURCES,START_SITUATION,emptyQuote,screenWell,makeWellRequest,makeWellComparison,
 type Situation,type LabQuote,type QuoteId,type Analyte,type Answer,type TestRecord} from "./lib/well.ts";

const yesNo:[Answer,string][]=[["unknown","Not checked"],["yes","Yes, verified"],["no","No"]];
const statusName:Record<string,string>={
 "source-review":"Official source review due","needs-context":"More facts needed",
 "not-covered":"Different water source","urgent-review":"Specialist guidance needed",
 "buyer-not-duty":"Buyer: request seller records","needs-records":"Check existing results",
 "no-repeat":"Avoid duplicate testing","order-plan":"Test-order worksheet"
};
const money=(n:number|null)=>n===null?"Not confirmed":n.toLocaleString("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2});
const statusExplain={
 coliform:"OHA: annual coliform/E. coli for routine well checks",
 nitrate:"OHA: annual nitrate for routine well checks",
 arsenic:"OHA: arsenic about every 3–5 years"
};
const quoteFlags=[
 ["activeAccreditationForTests","Current ORELAP accreditation for each requested analyte and method"],
 ["acceptsPrivateSamples","Lab explicitly accepts private domestic-well samples"],
 ["instructionsAndContainers","Correct bottles, handling and collection instructions provided"],
 ["holdingTimeArranged","Lab-specific holding times and transport are feasible"],
 ["resultsAndTurnaroundConfirmed","Results format and analysis turnaround confirmed"]
] as const;
const dataFields=[
 ["mandatoryPrice","Written analytical tests subtotal ($)"],
 ["sampleCollectionAndDeliveryFee","Sampling, pickup, delivery or shipping charge ($)"],
 ["otherMandatoryCharges","Other mandatory charges ($)"]
] as const;
function AnswerSelect({id,value,onChange}:{id:string;value:Answer;onChange:(a:Answer)=>void}){
 return <select id={id} value={value} onChange={e=>onChange(e.target.value as Answer)}>
  {yesNo.map(([a,label])=><option key={a} value={a}>{label}</option>)}
 </select>;
}
function PriceInput({id,value,onChange}:{id:string;value:number|null;onChange:(n:number|null)=>void}){
 return <input type="number" min="0" max="100000" step="0.01" inputMode="decimal" id={id} value={value??""}
  placeholder="Unknown" onChange={e=>onChange(e.target.value.trim()===""?null:Number(e.target.value))}/>;
}
export function WellApp(){
 const [situation,setSituation]=useState<Situation>({
  ...START_SITUATION,records:{coliform:{kind:"unknown",sampledOn:""},nitrate:{kind:"unknown",sampledOn:""},arsenic:{kind:"unknown",sampledOn:""}}
 });
 const [quotes,setQuotes]=useState<[LabQuote,LabQuote]>([emptyQuote("a"),emptyQuote("b")]);
 const [asOf]=useState(()=>new Date().toISOString().slice(0,10));
 const [notice,setNotice]=useState("");
 const result=useMemo(()=>screenWell(situation,quotes,asOf),[situation,quotes,asOf]);
 const set=<K extends keyof Situation>(key:K,value:Situation[K])=>{
  setSituation(prev=>({...prev,[key]:value}));setNotice("");
 };
 const setRecord=(a:Analyte,patch:Partial<TestRecord>)=>{
  setSituation(prev=>({...prev,records:{...prev.records,[a]:{...prev.records[a],...patch}}}));setNotice("");
 };
 const setAllNever=()=>{setSituation(prev=>({...prev,records:{
  coliform:{kind:"never",sampledOn:""},nitrate:{kind:"never",sampledOn:""},arsenic:{kind:"never",sampledOn:""}
 }}));setNotice("");};
 const editQuote=(id:QuoteId,patch:Partial<LabQuote>)=>{
  setQuotes(prev=>prev.map(q=>q.id===id?{...q,...patch}:q) as [LabQuote,LabQuote]);setNotice("");
 };
 const editTest=(id:QuoteId,k:Analyte,v:Answer)=>{
  setQuotes(prev=>prev.map(q=>q.id===id?{...q,offeredTests:{...q.offeredTests,[k]:v}}:q) as [LabQuote,LabQuote]);setNotice("");
 };
 const report=()=>result.status==="order-plan"?makeWellComparison(result,quotes):makeWellRequest(result);
 async function copy(){
  try{await navigator.clipboard.writeText(report());setNotice("Your checklist was copied locally.");}
  catch{setNotice("Clipboard unavailable. Download your checklist instead.");}
 }
 function download(){
  const text=report(),blob=new Blob([text],{type:"text/plain;charset=utf-8"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");
  a.href=url;a.download="oregon-well-test-lab-audit.txt";document.body.appendChild(a);
  try{a.click()}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),700);}
  setNotice("Your audit was downloaded. No information was submitted.");
 }
 return <main className="shell">
  <nav className="navigation"><a className="brand" href="/" aria-label="WellOrder home"><span className="brand-mark">◎</span>Well<span>Order</span></a><span className="nav-note">OREGON / PRIVATE PILOT</span></nav>
  <header className="hero">
   <div><p className="eyebrow">KNOW WHAT TO TEST · BEFORE YOU PAY</p>
    <h1>Don't buy the wrong <em>well-water test.</em></h1>
    <p>For Oregon domestic wells, find out which analyses to request, when earlier results may suffice, and whether two laboratory quotes really cover the same job.</p>
    <div className="hero-chips"><span>No sponsored labs</span><span>No invented prices</span><span>Keep your information local</span></div>
   </div>
   <div className="hero-art" aria-hidden="true"><div className="well-ripple ripple-1"></div><div className="well-ripple ripple-2"></div><div className="well-ripple ripple-3"></div><div className="water-vial"><div className="vial-neck"></div><div className="vial-water"></div><span>H₂O</span></div><div className="hero-art-caption">TEST THE WATER<br/><b>NOT YOUR LUCK</b></div></div>
  </header>
  <aside className="safety-note"><strong>This is a purchase worksheet, not a drinking-water safety test.</strong> No result here says water is safe. If a flood, illness, known contamination or a well malfunction is involved, get situation-specific guidance from local environmental health or OHA before relying on a standard test package.</aside>
  <section className="panel" aria-labelledby="context-title">
   <div className="heading"><span className="step">01</span><div><p className="eyebrow">YOUR HOUSEHOLD OR TRANSACTION</p><h2 id="context-title">What is the well test for?</h2></div></div>
   <div className="form-grid">
    <label htmlFor="w-source">Water supply
     <select id="w-source" value={situation.source} onChange={e=>set("source",e.target.value as Situation["source"])}>
      <option value="unknown">Select the water source</option>
      <option value="domestic">Existing Oregon private domestic groundwater well</option>
      <option value="municipal">Municipal / public drinking water</option>
      <option value="spring">Spring water (not a domestic drilled/dug well)</option>
      <option value="irrigation">Irrigation-only well</option>
      <option value="new-well">New well construction / first commissioning</option>
     </select></label>
    <label htmlFor="w-purpose">Why are you considering testing?
     <select id="w-purpose" value={situation.purpose} onChange={e=>set("purpose",e.target.value as Situation["purpose"])}>
      <option value="unknown">Select the reason</option><option value="routine">Routine household testing</option>
      <option value="sale">Selling / buying real estate with a domestic well</option>
      <option value="problem">Flood, contamination or another water-quality concern</option>
     </select></label>
    <label htmlFor="w-role">Your situation
     <select id="w-role" value={situation.role} onChange={e=>set("role",e.target.value as Situation["role"])}>
      <option value="unknown">Not specified</option><option value="owner">Well owner (ordinary household maintenance)</option>
      <option value="seller">Property seller</option><option value="buyer">Prospective property buyer</option>
     </select></label>
    {situation.purpose==="sale"&&<label htmlFor="w-offer">Has the seller accepted an offer?
     <select id="w-offer" value={situation.offerAccepted} onChange={e=>set("offerAccepted",e.target.value as Answer)}>
      <option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No, planning ahead</option>
     </select><small>Under ORS 448.271, the required seller testing is tied to accepting an offer.</small>
    </label>}
    <label htmlFor="w-concern">Any recent flood, well failure or known contamination concern?
     <select id="w-concern" value={situation.urgentConcern} onChange={e=>set("urgentConcern",e.target.value as Answer)}>
      <option value="unknown">Not sure</option><option value="no">No known unusual event</option><option value="yes">Yes — get tailored advice first</option>
     </select></label>
    <label htmlFor="w-area">Additional local-area contaminants checked with OHA / county?
     <select id="w-area" value={situation.areaReview} onChange={e=>set("areaReview",e.target.value as Situation["areaReview"])}>
      <option value="not-reviewed">Not reviewed — do not assume base tests are complete</option>
      <option value="clear-reviewed">Reviewed; no extra area-specific tests identified</option>
      <option value="concern">Known area of concern / may require other tests</option>
     </select><small>No address, county, health history or laboratory report is uploaded.</small></label>
   </div>
  </section>
  <section className="panel" aria-labelledby="records-title">
   <div className="heading"><span className="step">02</span><div><p className="eyebrow">AVOID DUPLICATE PURCHASES</p><h2 id="records-title">What have you already tested?</h2></div></div>
   <div className="record-intro"><p>Use lab collection dates, not the date you opened the result. Unknown is not treated as “never tested.”</p><button type="button" className="subtle-button" onClick={setAllNever}>I've never tested these three</button></div>
   <div className="records">{ANALYTES.map(a=><div className="record" key={a}>
    <div className="record-name"><strong>{ANALYTE_NAMES[a]}</strong><small>{statusExplain[a]}</small></div>
    <label htmlFor={"w-"+a+"-kind"}>Previous result
     <select id={"w-"+a+"-kind"} value={situation.records[a].kind}
      onChange={e=>setRecord(a,{kind:e.target.value as TestRecord["kind"],sampledOn:""})}>
      <option value="unknown">I need to find my result</option><option value="never">Not previously tested</option>
      <option value="dated">I have a dated lab report</option>
     </select></label>
    {situation.records[a].kind==="dated"&&<label htmlFor={"w-"+a+"-date"}>Collection date
     <input id={"w-"+a+"-date"} type="date" max={asOf} value={situation.records[a].sampledOn}
      onChange={e=>setRecord(a,{sampledOn:e.target.value})}/></label>}
   </div>)}</div>
   {situation.purpose==="sale"&&<div className="verification">
    <h3>For an Oregon property sale, confirm legal reuse conditions</h3>
    <div className="form-grid">
     <label htmlFor="w-prior-accreditation">Were prior results analyzed by an appropriately accredited lab?
      <AnswerSelect id="w-prior-accreditation" value={situation.priorLabAccreditationConfirmed} onChange={v=>set("priorLabAccreditationConfirmed",v)}/></label>
     <label htmlFor="w-prior-collection">Did the earlier samples meet Oregon real-estate sampling rules?
      <AnswerSelect id="w-prior-collection" value={situation.priorSaleSamplingCompliant} onChange={v=>set("priorSaleSamplingCompliant",v)}/></label>
    </div></div>}
  </section>
  <section className="panel result-panel" aria-labelledby="decision-title">
   <div className="heading"><span className="step">03</span><div><p className="eyebrow">WHAT TO BUY · OR NOT BUY</p><h2 id="decision-title">Your evidence-based decision</h2></div></div>
   <div className={"decision decision-"+result.status} aria-live="polite" role="region" aria-label="Well test purchase decision">
    <span className="result-pill">{statusName[result.status]}</span>
    <h3>{result.title}</h3><p>{result.description}</p>
    {result.tests.length>0&&<div className="test-recs"><span>Tests to discuss with an accredited lab</span>
     <div>{result.tests.map(t=><span key={t} className="analyte-chip">{ANALYTE_NAMES[t]}</span>)}</div>
    </div>}
    {result.possibleAddOns.length>0&&<div className="extra-notes"><b>Optional or local follow-up</b>{result.possibleAddOns.map((x,i)=><p key={i}>{x}</p>)}</div>}
    {result.notes.length>0&&<ul>{result.notes.map((x,i)=><li key={i}>{x}</li>)}</ul>}
   </div>
   <div className="official-links"><a href={SOURCES.routine} target="_blank" rel="noopener noreferrer">OHA routine testing guidance</a><a href={SOURCES.transactions} target="_blank" rel="noopener noreferrer">OHA real estate rules</a><a href={SOURCES.labs} target="_blank" rel="noopener noreferrer">Search accredited labs</a></div>
  </section>
  {result.status==="order-plan"&&<section className="panel" aria-labelledby="quotes-title">
   <div className="heading"><span className="step">04</span><div><p className="eyebrow">PRICE IS NOT ENOUGH</p><h2 id="quotes-title">Compare two written laboratory quotes</h2></div></div>
   <p className="section-explain">Enter the fees you received directly from two labs. Accreditation must be verified <strong>for each requested analyte</strong>, along with suitable sampling supplies and holding times. No labs are recommended or booked.</p>
   <div className="quote-grid">{quotes.map((q,i)=><fieldset className="quote" key={q.id}>
    <legend>Proposal {q.id.toUpperCase()}</legend>
    <label htmlFor={"q-"+q.id+"-label"}>Your reference label (optional)
     <input id={"q-"+q.id+"-label"} value={q.label} maxLength={90} placeholder="Your first or second written quote" onChange={e=>editQuote(q.id,{label:e.target.value})}/>
    </label>
    {result.tests.map(k=><label key={k} htmlFor={"q-"+q.id+"-"+k}>Includes {ANALYTE_NAMES[k]}?
     <AnswerSelect id={"q-"+q.id+"-"+k} value={q.offeredTests[k]} onChange={v=>editTest(q.id,k,v)}/></label>)}
    {result.tests.includes("coliform")&&situation.purpose==="routine"&&<label htmlFor={"q-"+q.id+"-ecoli"}>Reports E. coli alongside total coliform?
     <AnswerSelect id={"q-"+q.id+"-ecoli"} value={q.eColiWithColiform} onChange={v=>editQuote(q.id,{eColiWithColiform:v})}/></label>}
    {quoteFlags.map(([k,title])=><label key={k} htmlFor={"q-"+q.id+"-"+k}>{title}
     <AnswerSelect id={"q-"+q.id+"-"+k} value={q[k]} onChange={v=>editQuote(q.id,{[k]:v})}/></label>)}
    {situation.purpose==="sale"&&<label htmlFor={"q-"+q.id+"-sale"}>Collection meets OAR 333-061-0335 for the sale?
     <AnswerSelect id={"q-"+q.id+"-sale"} value={q.saleSamplingRulesConfirmed} onChange={v=>editQuote(q.id,{saleSamplingRulesConfirmed:v})}/></label>}
    <label htmlFor={"q-"+q.id+"-method"}>Collection and delivery method
     <select id={"q-"+q.id+"-method"} value={q.collectionMode}
      onChange={e=>editQuote(q.id,{collectionMode:e.target.value as LabQuote["collectionMode"]})}>
      <option value="unknown">Not confirmed</option><option value="dropoff">Owner collects, delivers to lab</option>
      <option value="mail">Owner collects and ships</option><option value="professional">Professional collection service</option>
     </select></label>
    {dataFields.map(([k,title])=><label key={k} htmlFor={"q-"+q.id+"-"+k}>{title}
     <PriceInput id={"q-"+q.id+"-"+k} value={q[k]} onChange={v=>editQuote(q.id,{[k]:v})}/></label>)}
    <div className="quote-status"><strong>{result.quoteReviews[i].status.replaceAll("-"," ")}</strong>
     <p>Written total (when complete): <b>{money(result.quoteReviews[i].total)}</b></p>
     <ul>{result.quoteReviews[i].issues.map((x,i)=><li key={i}>{x}</li>)}</ul>
    </div>
   </fieldset>)}</div>
   <div className="comparison" aria-live="polite">
    {result.comparisonAllowed?<><strong>Conditional difference: {money(result.costDifference)}</strong>
     <p>{result.lowerQuote?"Proposal "+result.lowerQuote.toUpperCase()+" is lower by "+money(result.costDifference)+".":"The reported totals are equal."} This compares self-reported written costs only; it does not verify the lab or order a sample.</p></>
     :<><strong>No comparable lab-price winner yet.</strong><p>Both offers must have the requested analytes, compatible sampling arrangements, confirmed accreditation, handling details and every required charge.</p></>}
   </div>
  </section>}
  <section className="panel export-panel" aria-labelledby="export-title">
   <div><p className="eyebrow">TAKE THE NEXT STEP OFFLINE</p><h2 id="export-title">A neutral checklist, not a sales pitch.</h2>
    <p>Bring a specific request to an ORELAP-accredited laboratory. The lab, not this site, supplies containers, methods, live prices and collection directions.</p></div>
   <div className="actions"><button type="button" onClick={()=>void copy()}>Copy lab request</button><button type="button" className="secondary" onClick={download}>Download full audit (.txt)</button></div>
   {notice&&<p className="notice" role="status">{notice}</p>}
  </section>
  <footer className="footer"><div><div className="brand small"><span className="brand-mark">◎</span>Well<span>Order</span></div>
   <p>Source review: {REVIEWED_ON}. Rules and recommendations must be rechecked regularly. All estimates use homeowner-entered information; no lab results, street addresses or medical history are collected.</p>
   <p className="footer-links"><a href={SOURCES.accreditation} target="_blank" rel="noopener noreferrer">Oregon drinking-water laboratories</a> · <a href={SOURCES.epa} target="_blank" rel="noopener noreferrer">EPA private-well testing</a> · <a href={SOURCES.transactions} target="_blank" rel="noopener noreferrer">Oregon property-sale rules</a></p>
  </div><div className="privacy"><strong>PRIVATE RESEARCH PILOT</strong><p>No lead submission, accredited-lab endorsement, completed order, paid referral, commission, treatment recommendation or OHA reporting. Buyer input stays in this browser session. Testing alone cannot establish drinking-water safety.</p></div></footer>
 </main>;
}
