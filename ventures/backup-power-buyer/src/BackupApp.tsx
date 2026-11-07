import {useMemo,useState} from "react";
import {REVIEWED,SOURCES,START_VISIT,emptyLoad,emptyOffer,evaluate,requestText,
 type Answer,type Evidence,type Load,type LoadId,type Offer,type OfferId,type Visit} from "./lib/screen.ts";

const ids:LoadId[]=["a","b","c","d","e","f"];
const yn:[Answer,string][]=[
 ["unknown","Not verified"],["yes","Yes — checked directly"],["no","No"]
];
const money=(n:number|null)=>n===null?"Unconfirmed":n.toLocaleString("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2});
const number=(n:number|null)=>n===null?"—":n.toLocaleString("en-US",{maximumFractionDigits:2});
const parse=(v:string)=>v.trim()===""?null:Number(v);
const checkedFields=[
 ["manufacturerProofReviewed","Manufacturer's exact-model AC usable Wh, running W and surge W are documented"],
 ["exact120vOutputsVerified","Appropriate 120 V AC outlets and supported load type confirmed"],
 ["portableListingVerified","Relevant safety listing verified for portable use (not assumed home-wiring approval)"],
 ["modelRecallChecked","Exact model checked against CPSC recalls and manufacturer notices"],
 ["warrantyAndReturnTermsReviewed","Warranty and return conditions reviewed"],
 ["useLocationReviewed","Manufacturer's indoor/outdoor, temperature and clearance rules reviewed"]
] as const;

function AnswerSelect({id,value,onChange}:{id:string;value:Answer;onChange:(x:Answer)=>void}){
 return <select id={id} value={value} onChange={e=>onChange(e.target.value as Answer)}>
  {yn.map(([v,t])=><option value={v} key={v}>{t}</option>)}
 </select>;
}
function Quantity({id,value,onChange,unit,max=100000,step="0.01"}:{
 id:string;value:number|null;onChange:(n:number|null)=>void;
 unit?:string;max?:number;step?:string
}){
 return <div className="field-input">
  <input id={id} type="number" inputMode="decimal" min="0" max={max} step={step} placeholder="Unknown"
   value={value??""} onChange={e=>onChange(parse(e.target.value))}/>
  {unit&&<span aria-hidden="true">{unit}</span>}
 </div>;
}

export function BackupApp(){
 const [visit,setVisit]=useState<Visit>({...START_VISIT,loads:[emptyLoad("a")]});
 const [offers,setOffers]=useState<[Offer,Offer]>([emptyOffer("a"),emptyOffer("b")]);
 const [today]=useState(()=>new Date().toISOString().slice(0,10));
 const [message,setMessage]=useState("");
 const decision=useMemo(()=>evaluate(visit,offers,today),[visit,offers,today]);
 const plan=decision.plan;
 const editVisit=<K extends keyof Visit>(key:K,value:Visit[K])=>{
  setVisit(x=>({...x,[key]:value}));setMessage("");
 };
 const editLoad=(id:LoadId,patch:Partial<Load>)=>{
  setVisit(x=>({...x,loads:x.loads.map(l=>l.id===id?{...l,...patch}:l)}));setMessage("");
 };
 const addLoad=()=>setVisit(x=>({...x,loads:x.loads.length>=6?x.loads:[...x.loads,emptyLoad(ids[x.loads.length])]}));
 const removeLoad=(id:LoadId)=>setVisit(x=>({...x,loads:
  x.loads.filter(q=>q.id!==id).map((l,i)=>({...l,id:ids[i]}))}));
 const editOffer=(id:OfferId,patch:Partial<Offer>)=>{
  setOffers(x=>x.map(q=>q.id===id?{...q,...patch}:q) as [Offer,Offer]);setMessage("");
 };
 const report=()=>requestText(decision,visit,offers);
 async function copy(){
  try{await navigator.clipboard.writeText(report());setMessage("Buyer checklist copied locally; no information was sent.");}
  catch{setMessage("Clipboard unavailable. Download the buyer checklist instead.");}
 }
 function download(){
  const data=new Blob([report()],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(data);
  const link=document.createElement("a");
  link.href=url;link.download="backup-bench-station-buying-checklist.txt";document.body.appendChild(link);
  try{link.click();}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),700);}
  setMessage("Checklist downloaded locally. No purchase or referral was submitted.");
 }
 const showOffers=plan.status==="verified-plan"||plan.status==="planning-only";
 const supported=plan.status==="verified-plan";
 return <main className="shell">
  <nav className="nav"><a href="/" className="logo" aria-label="Backup Bench home"><span className="logo-icon">▣</span>BACKUP<span>BENCH</span></a>
   <div className="nav-right">UNITED STATES <b>·</b> PRIVATE SHOPPING PILOT</div>
  </nav>

  <header className="hero">
   <div className="hero-copy">
    <p className="eyebrow">A PORTABLE POWER STATION SHOULD FIT YOUR LOADS</p>
    <h1>Know the power you need.<br/><em>Skip the wrong battery.</em></h1>
    <p>Calculate your own outage energy, running load and worst-case starting demand. Then check two written power-station offers against documented specifications and real all-in prices.</p>
    <div className="hero-tags"><span>No guessed appliance watts</span><span>No sponsored rankings</span><span>No unsupported “run times”</span></div>
   </div>
   <div className="hero-art" aria-hidden="true">
    <div className="ring-outer"></div><div className="ring-middle"></div>
    <div className="power-device"><div className="handle"></div><div className="device-screen"><small>ENERGY</small><strong>Wh</strong><span>120V AC</span></div><div className="outlets">○ ○ ○</div></div>
    <div className="float-label">MATCH THE SPECS<br/><strong>BEFORE THE PRICE</strong></div>
   </div>
  </header>
  <aside className="safety"><strong>Important safety boundary.</strong> This tool covers only separate, ordinary cord-and-plug 120 V AC appliances. It is <b>not</b> for medical/life-safety equipment, 240 V circuits, electric heaters, cooking equipment, home wiring or transfer switches. UL 2743 portable-power-pack certification is not permission to wire a portable station into your house. <a href={SOURCES.stationary} target="_blank" rel="noopener noreferrer">UL explains the distinction</a>.</aside>

  <section className="panel" aria-labelledby="scope-title">
   <div className="section-head"><span className="number">01</span><div><p className="eyebrow">DEFINE THE SCOPE</p><h2 id="scope-title">A portable, no-recharge outage plan</h2></div></div>
   <div className="form-grid">
    <label htmlFor="bp-use">How will the station supply your equipment?
     <select id="bp-use" value={visit.use} onChange={e=>editVisit("use",e.target.value as Visit["use"])}>
      <option value="unknown">Not confirmed</option>
      <option value="cord-and-plug-120v">Appliances plug directly into its 120 V AC outlets</option>
      <option value="house-wiring">Hardwired to home's panel / transfer switch (outside this tool)</option>
     </select>
    </label>
    <label htmlFor="bp-medical">Does this include medical or life-safety equipment?
     <AnswerSelect id="bp-medical" value={visit.medicalOrLifeSafety} onChange={v=>editVisit("medicalOrLifeSafety",v)}/>
    </label>
    <label htmlFor="bp-heat">Any 240 V, space-heating, cooling or cooking loads?
     <AnswerSelect id="bp-heat" value={visit.highHeatOr240v} onChange={v=>editVisit("highHeatOr240v",v)}/>
    </label>
    <label htmlFor="bp-recharge">Does your plan depend on charging the station during the outage?
     <AnswerSelect id="bp-recharge" value={visit.rechargeAssumed} onChange={v=>editVisit("rechargeAssumed",v)}/>
     <small>If yes, this no-recharge model cannot estimate that system reliably.</small>
    </label>
    <label htmlFor="bp-hours">How long should the station last WITHOUT recharging?
     <select id="bp-hours" value={visit.targetHours} onChange={e=>editVisit("targetHours",Number(e.target.value) as Visit["targetHours"])}>
      {[8,12,24,36,48,72].map(n=><option value={n} key={n}>{n} hours</option>)}
     </select>
    </label>
    <label htmlFor="bp-reserve">Extra planning reserve (chosen by you)
     <select id="bp-reserve" value={visit.reservePercent} onChange={e=>editVisit("reservePercent",Number(e.target.value) as Visit["reservePercent"])}>
      {[0,15,25,40].map(n=><option key={n} value={n}>{n}% planning reserve</option>)}
     </select>
     <small>Not a guaranteed inverter-efficiency figure.</small>
    </label>
   </div>
  </section>

  <section className="panel" aria-labelledby="loads-title">
   <div className="section-head"><span className="number">02</span><div><p className="eyebrow">USE YOUR OWN LABELS & MEASUREMENTS</p><h2 id="loads-title">Which appliances will be plugged in?</h2></div></div>
   <p className="explain">Enter the actual running and highest startup watts from a trusted manual or measurement. For fridges, active hours per day means <em>compressor-on hours</em>, not 24 just because the unit stays plugged in. Do not infer compressor surge from the energy label.</p>
   <div className="load-list">{visit.loads.map((l,i)=><article className="load-card" key={l.id}>
    <div className="load-top"><span className="load-number">LOAD {String(i+1).padStart(2,"0")}</span>
     {visit.loads.length>1&&<button type="button" className="remove" onClick={()=>removeLoad(l.id)} aria-label={"Remove load "+(i+1)}>Remove</button>}
    </div>
    <div className="load-fields">
     <label htmlFor={"load-"+l.id+"-label"}>Appliance label
      <input id={"load-"+l.id+"-label"} maxLength={80} type="text" value={l.label} placeholder="e.g. router, refrigerator, LED lamps"
       onChange={e=>editLoad(l.id,{label:e.target.value})}/>
     </label>
     <label htmlFor={"load-"+l.id+"-running"}>Running load (W)
      <Quantity id={"load-"+l.id+"-running"} value={l.runWatts} onChange={n=>editLoad(l.id,{runWatts:n})} unit="W" max={8000}/>
     </label>
     <label htmlFor={"load-"+l.id+"-peak"}>Largest startup/peak draw (W)
      <Quantity id={"load-"+l.id+"-peak"} value={l.startWatts} onChange={n=>editLoad(l.id,{startWatts:n})} unit="W" max={20000}/>
     </label>
     <label htmlFor={"load-"+l.id+"-duty"}>Hours actually drawing power per 24 h
      <Quantity id={"load-"+l.id+"-duty"} value={l.activeHoursPerDay}
       onChange={n=>editLoad(l.id,{activeHoursPerDay:n})} unit="h" max={24}/>
     </label>
     <label htmlFor={"load-"+l.id+"-motor"}>Contains motor/compressor?
      <AnswerSelect id={"load-"+l.id+"-motor"} value={l.motor} onChange={v=>editLoad(l.id,{motor:v})}/>
     </label>
     <label htmlFor={"load-"+l.id+"-evidence"}>Quality of BOTH watt and on-hours inputs
      <select id={"load-"+l.id+"-evidence"} value={l.evidence} onChange={e=>editLoad(l.id,{evidence:e.target.value as Evidence})}>
       <option value="unknown">Not yet verified</option>
       <option value="estimated">Estimates — illustrative calculation only</option>
       <option value="verified">Verified by measurement or applicable exact-model documentation</option>
      </select>
     </label>
    </div>
   </article>)}</div>
   {visit.loads.length<6&&<button type="button" className="add-button" onClick={addLoad}>+ Add another appliance</button>}
   <p className="helper">All equipment is assumed connected simultaneously. Sum-of-peaks is a conservative stress screen, not a guarantee that a device starts or runs.</p>
  </section>

  <section className="panel result" aria-labelledby="plan-title">
   <div className="section-head"><span className="number">03</span><div><p className="eyebrow">CALCULATE · DON'T PROMISE</p><h2 id="plan-title">Your conditional energy requirement</h2></div></div>
   <div className={"plan-status plan-"+plan.status} role="region" aria-label="Outage power plan" aria-live="polite">
    <span className="status-pill">{plan.status.replaceAll("-"," ")}</span><h3>{plan.headline}</h3>
    {plan.plannedEnergyWh!==null&&<div className="metrics">
     <div className="metric primary"><span>Planning energy at AC outlets incl reserve</span><strong>{number(plan.plannedEnergyWh)}</strong><small>Wh</small></div>
     <div className="metric"><span>Energy before reserve</span><strong>{number(plan.outputEnergyWh)}</strong><small>Wh</small></div>
     <div className="metric"><span>Combined running power</span><strong>{number(plan.combinedRunningWatts)}</strong><small>W</small></div>
     <div className="metric"><span>Sum of all reported startup peaks</span><strong>{number(plan.simultaneousPeakWatts)}</strong><small>W</small></div>
    </div>}
    <ul>{plan.issues.map((x,i)=><li key={i}>{x}</li>)}</ul>
   </div>
  </section>

  {showOffers&&<section className="panel" aria-labelledby="offers-title">
   <div className="section-head"><span className="number">04</span><div><p className="eyebrow">TWO REAL WRITTEN PRODUCT OFFERS</p><h2 id="offers-title">Is the station actually compatible?</h2></div></div>
   <p className="explain">Compare independently obtained exact-model documentation. <b>Battery nameplate Wh is not delivered AC Wh</b>. The manufacturer's output ratings, independent safety listing, recall status and total charges must all be checked before this pilot shows a conditional price difference.</p>
   {!supported&&<p className="offer-warning">These load inputs are still estimates. You can collect offer details, but product screening is locked until every load is verified.</p>}
   <div className="offers">{offers.map((q,i)=>{
    const out=decision.offers[i];
    return <fieldset className="offer" key={q.id}>
     <legend>OFFER {q.id.toUpperCase()}</legend>
     <label htmlFor={"offer-"+q.id+"-model"}>Exact brand and model (not a category)
      <input id={"offer-"+q.id+"-model"} value={q.model} onChange={e=>editOffer(q.id,{model:e.target.value})} maxLength={110}
       placeholder="Copy exact model from the maker's spec sheet"/>
     </label>
     <div className="offer-numbers">
      <label htmlFor={"offer-"+q.id+"-usable"}>Documented usable output at AC outlets
       <Quantity id={"offer-"+q.id+"-usable"} value={q.usableACWh} onChange={v=>editOffer(q.id,{usableACWh:v})} unit="Wh"/>
      </label>
      <label htmlFor={"offer-"+q.id+"-running"}>Continuous AC inverter output
       <Quantity id={"offer-"+q.id+"-running"} value={q.runningACWatts} onChange={v=>editOffer(q.id,{runningACWatts:v})} unit="W"/>
      </label>
      <label htmlFor={"offer-"+q.id+"-surge"}>AC inverter surge/starting output
       <Quantity id={"offer-"+q.id+"-surge"} value={q.surgeACWatts} onChange={v=>editOffer(q.id,{surgeACWatts:v})} unit="W"/>
      </label>
     </div>
     <details className="offer-checks" open={i===0}>
      <summary>Product documentation and safety checks</summary>
      <div className="check-list">{checkedFields.map(([key,label])=><label key={key} htmlFor={"offer-"+q.id+"-"+key}>{label}
       <AnswerSelect id={"offer-"+q.id+"-"+key} value={q[key]} onChange={v=>editOffer(q.id,{[key]:v})}/>
      </label>)}</div>
     </details>
     <div className="offer-price">
      <label htmlFor={"offer-"+q.id+"-price"}>Written product price ($)
       <Quantity id={"offer-"+q.id+"-price"} value={q.completePrice} onChange={v=>editOffer(q.id,{completePrice:v})} unit="$"/>
      </label>
      <label htmlFor={"offer-"+q.id+"-extras"}>Mandatory shipping, tax, accessories/fees ($)
       <Quantity id={"offer-"+q.id+"-extras"} value={q.otherMandatoryCharges} onChange={v=>editOffer(q.id,{otherMandatoryCharges:v})} unit="$"/>
      </label>
     </div>
     <div className={"offer-result offer-"+out.status} aria-label={"Offer "+q.id.toUpperCase()+" review"} role="region" aria-live="polite">
      <strong>{out.status.replaceAll("-"," ")}</strong>
      <p>Self-reported all-in amount: <b>{money(out.reportedAllInUSD)}</b></p>
      {out.capacityWhDifference!==null&&<p>AC usable Wh minus required: <b>{number(out.capacityWhDifference)} Wh</b></p>}
      {out.issues.length>0&&<ul>{out.issues.map((x,j)=><li key={j}>{x}</li>)}</ul>}
     </div>
    </fieldset>;
   })}</div>
   <div className="comparison" aria-live="polite">
    {decision.compareAllowed?<><h3>Conditional comparable price difference: {money(decision.priceDifferenceUSD)}</h3>
     <p>{decision.lowerOffer?"Offer "+decision.lowerOffer.toUpperCase()+" is the lower written total.":"Both entered totals are equal."} Both passed only the reported AC numeric and documentation screen. No safety certificate, actual runtime assurance or product endorsement is issued.</p></>:
    <><h3>No defensible price winner yet</h3><p>Both products must have verified exact-model delivered AC energy, continuous and surge ratings, portable safety/recall documentation and complete all-in costs—and exceed the reported requirements—before price is comparable.</p></>}
   </div>
  </section>}

  <section className="export-panel" aria-labelledby="export-title"><div><p className="eyebrow">TAKE A FACTUAL CHECKLIST TO THE SELLER</p>
   <h2 id="export-title">A purchase worksheet, not a sponsored ranking.</h2>
   <p>Request the exact-model specification sheet, certification evidence, recall check and written out-the-door amount. Keep your appliance figures in this browser tab.</p>
  </div><div className="export-actions"><button type="button" onClick={()=>void copy()}>Copy buyer checklist</button>
   <button type="button" className="outline" onClick={download}>Download report (.txt)</button></div>
  {message&&<p role="status" className="message">{message}</p>}</section>

  <footer className="footer"><div><p className="eyebrow">PRIMARY SOURCE GUIDANCE</p>
   <h3>Understand power, energy and safety limits</h3>
   <ul><li><a href={SOURCES.units} target="_blank" rel="noopener noreferrer">U.S. EIA · watts vs watt-hours</a></li>
    <li><a href={SOURCES.ul} target="_blank" rel="noopener noreferrer">UL 2743 · portable power pack standard</a></li>
    <li><a href={SOURCES.stationary} target="_blank" rel="noopener noreferrer">UL · why portable listings do not certify home ESS installations</a></li>
    <li><a href={SOURCES.recalls} target="_blank" rel="noopener noreferrer">CPSC · verify active model recall notices</a></li>
   </ul></div>
   <div><p className="eyebrow">PRIVATE · NONCOMMERCIAL PILOT</p>
    <p>Sources reviewed {REVIEWED}. No checkout, direct retailer links, approved partnerships, affiliate tracking, personal information collection, station certification or guaranteed runtime. The calculations are based exclusively on user-entered assumptions and reported specs; this product does not contact sellers or validate their claims.</p>
    <p>UL 2743 applies to portable power packs, not hardwired residential backup installations. Always verify allowed use and recalls directly.</p>
   </div></footer>
 </main>;
}
