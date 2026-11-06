"use client";

import {useMemo,useState} from "react";
import {track} from "@vercel/analytics";
import type {QuoteItem} from "../lib/heat-pump-quotes";
import {downloadTextReport} from "../lib/download-report";
import {
 BID_QUALITY_REVIEWED,BID_QUALITY_SOURCES,
 INITIAL_HEAT_PLAN,blankHeatBidQuality,evaluateHeatPumpBidQuality,
 heatPumpBidRequest,heatPumpBidQualityReport,
 type HeatPlan,type HeatGoal,type HeatBidQuality,type Evidence,type DesignMethod,
 type Backup,type DuctCheck
} from "../lib/heat-pump-bid-quality";
import "./heat-pump-bid-quality.css";

type BidKey=keyof HeatBidQuality;
const evidence=[
 {value:"unsure",label:"Not documented"},
 {value:"yes",label:"Yes, included in writing"},
 {value:"no",label:"No, not provided"},
] as const;
const methods:ReadonlyArray<{value:DesignMethod;label:string}>=[
 {value:"unsure",label:"Not documented"},
 {value:"manual-j",label:"ACCA Manual J"},
 {value:"equivalent-documented",label:"Other documented professional load calculation"},
 {value:"square-foot-only",label:"House square footage / tonnage rule of thumb only"},
];
const strategies:ReadonlyArray<{value:Backup;label:string}>=[
 {value:"unsure",label:"No written strategy"},
 {value:"retain-existing",label:"Retain existing heating as backup"},
 {value:"new-auxiliary",label:"Install new auxiliary/backup heat"},
 {value:"heat-pump-alone",label:"Heat pump without proposed auxiliary heat"},
];
const ducts:ReadonlyArray<{value:DuctCheck;label:string}>=[
 {value:"unsure",label:"Unknown"},
 {value:"documented",label:"Duct sizing/condition and airflow assessed"},
 {value:"not-applicable-ductless",label:"No ducts used (ductless project only)"},
 {value:"not-documented",label:"No documented assessment"},
];
const fields:ReadonlyArray<{key:BidKey;label:string;info:string}>=[
 {key:"loadReportProvided",label:"Written load calculation supplied?",info:"Ask for the contractor's heating/cooling loads, not a website-estimated tonnage."},
 {key:"manufacturerPerformanceAtDesign",label:"Manufacturer heating capacity at local design temperature supplied?",info:"Nominal cooling tonnage does not establish winter heating performance."},
 {key:"matchedEquipmentModels",label:"Exact indoor and outdoor model pairing listed?",info:"Have contractors identify every relevant air handler, head and outdoor unit."},
 {key:"roomsOrZonesDocumented",label:"Rooms/zones served clearly documented?",info:"Whole-house and one-room projects are not equivalent."},
 {key:"commissioningReport",label:"Written commissioning results promised?",info:"Refrigerant checks, controls and airflow verification as applicable."},
 {key:"ownerControlsHandover",label:"Owner controls and maintenance handover included?",info:"Written instructions, thermostat programming and service contacts."},
];
const format=(n:number|null)=>(n===null?"Not supplied":n.toLocaleString("en-US"));
export function HeatPumpBidQualityStudio({quotes}:{quotes:readonly QuoteItem[]}){
 const [goal,setGoal]=useState<HeatPlan>({...INITIAL_HEAT_PLAN});
 const [quality,setQuality]=useState<Record<"a"|"b"|"c",HeatBidQuality>>({
  a:blankHeatBidQuality("a"),b:blankHeatBidQuality("b"),c:blankHeatBidQuality("c"),
 });
 const [note,setNote]=useState("");
 const [started,setStarted]=useState(false);
 const active=useMemo(()=>quotes.map(q=>quality[q.id]),[quotes,quality]);
 const request=useMemo(()=>heatPumpBidRequest(goal),[goal]);
 const calculated=useMemo(()=>{
  try{return {data:evaluateHeatPumpBidQuality(goal,quotes,active,new Date().toISOString().slice(0,10)),error:""}}
  catch(e){return {data:null,error:e instanceof Error?e.message:"Unsupported proposal information"}}
 },[goal,quotes,active]);
 const summary=useMemo(()=>calculated.data?heatPumpBidQualityReport(goal,quotes,active,calculated.data):null,
  [goal,quotes,active,calculated.data]);
 function changedGoal<K extends keyof HeatPlan>(key:K,value:HeatPlan[K]){
  setGoal(prev=>({...prev,[key]:value}));setNote("");
  if(!started){setStarted(true);track("hp_bid_quality_started");}
 }
 function changedBid<K extends keyof HeatBidQuality>(id:QuoteItem["id"],key:K,value:HeatBidQuality[K]){
  setQuality(prev=>({...prev,[id]:{...prev[id],[key]:value}}));
  setNote("");
  if(!started){setStarted(true);track("hp_bid_quality_started");}
 }
 function number(id:QuoteItem["id"],key:"designOutdoorTempF"|"documentedHeatLoadBtu"|"manufacturerCapacityBtuAtDesign"|"zonesServed",value:string){
  const n=value===""?null:Number(value);
  changedBid(id,key,n);
 }
 async function copy(which:"request"|"report"){
  const content=which==="request"?request:summary;
  if(!content)return;
  try{await navigator.clipboard.writeText(content);
   setNote(which==="request"?"Common bid request copied.":"Quality and scope questions copied.");
   track(which==="request"?"hp_bid_request_copied":"hp_bid_quality_report_copied");
  }catch{setNote("Clipboard unavailable. Use the local download option.");}
 }
 function download(which:"request"|"report"){
  const content=which==="request"?request:summary;
  if(!content)return;
  downloadTextReport(which==="request"?"oregon-heat-pump-bid-request":"oregon-heat-pump-design-evidence",content);
  setNote(which==="request"?"Bid request downloaded locally.":"Bid-evidence review downloaded locally.");
  track(which==="request"?"hp_bid_request_downloaded":"hp_bid_quality_report_downloaded");
 }
 function renderEvidence(q:QuoteItem,field:(typeof fields)[number]){
  const key=field.key as keyof Pick<HeatBidQuality,
  "loadReportProvided"|"manufacturerPerformanceAtDesign"|"matchedEquipmentModels"|
  "roomsOrZonesDocumented"|"commissioningReport"|"ownerControlsHandover">;
  const id="hp-bid-"+q.id+"-"+key;
  return <label key={key} htmlFor={id} className="hp-bid-field">{field.label}
   <small>{field.info}</small>
   <select id={id} value={quality[q.id][key] as Evidence} onChange={e=>changedBid(q.id,key,e.target.value as Evidence)}>
    {evidence.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
   </select>
  </label>;
 }
 return <section className="panel hp-bid-quality" aria-labelledby="hp-bid-title" id="heat-pump-design-review">
  <div className="hp-bid-intro">
   <span className="hp-bid-kicker">STEP THREE · THE DESIGN BEHIND THE BID</span>
   <h2 id="hp-bid-title">Check the design evidence before comparing installation prices.</h2>
   <p>Two installers can quote similar tonnage and very different performance. Ask for the heating load, matched indoor/outdoor equipment, actual winter capacity, room coverage, duct/backup strategy and commissioning commitments. This checks <strong>whether evidence was provided</strong>, not whether the design is correct.</p>
  </div>
  <div className="hp-bid-layout">
   <section className="hp-bid-setup" aria-label="Home heat-pump project goals">
    <h3>01 · Define the heating project</h3>
    <label htmlFor="hp-bid-goal" className="hp-bid-field">What should this system accomplish?
     <select id="hp-bid-goal" value={goal.goal} onChange={e=>changedGoal("goal",e.target.value as HeatGoal)}>
      <option value="unsure">Not decided yet</option>
      <option value="whole-home">Whole-home heating and cooling</option>
      <option value="specific-rooms">Specified rooms or zones</option>
      <option value="supplemental">Supplement existing heating</option>
     </select>
    </label>
    <label htmlFor="hp-bid-replacement" className="hp-bid-field">Will the existing heating/cooling be replaced?
     <select id="hp-bid-replacement" value={goal.replaceExisting} onChange={e=>changedGoal("replaceExisting",e.target.value as HeatPlan["replaceExisting"])}>
      <option value="unsure">Not decided</option><option value="yes">Replace existing heating</option><option value="no">Keep existing heating</option>
     </select>
    </label>
    <label htmlFor="hp-bid-ducts" className="hp-bid-field">Do you have existing supply/return ducts?
     <select id="hp-bid-ducts" value={goal.existingDucts} onChange={e=>changedGoal("existingDucts",e.target.value as HeatPlan["existingDucts"])}>
      <option value="unsure">Not sure</option><option value="yes">Yes, existing ductwork</option><option value="no">No existing ducts / ductless</option>
     </select>
    </label>
    <h3>02 · Request the same written specification</h3>
    <p>Use this contractor-neutral checklist to request site-specific sizing, cold-weather capacity, duct or room coverage, commissioning, permits, and exclusions before accepting a final bid.</p>
    <div className="hp-bid-buttons">
     <button type="button" onClick={()=>void copy("request")}>Copy identical bid request</button>
     <button type="button" className="hp-bid-outline" onClick={()=>download("request")}>Download request (.txt)</button>
    </div>
    <details className="hp-bid-preview"><summary>Preview request sent to each contractor</summary><pre>{request}</pre></details>
   </section>
   <section className="hp-bid-evidence" aria-label="Heat pump contractor design evidence">
    <h3>03 · Review the actual evidence in each proposal</h3>
    <p>These are your reports of the written proposals—not independent measurements. Each quote's total and duct scope are inherited from the comparison above.</p>
    <div className="hp-bid-cards">
     {quotes.map(q=>{const b=quality[q.id];const f=calculated.data?.findings.find(x=>x.id===q.id);
      return <article className="hp-bid-card" key={q.id} aria-label={"Quote "+q.id.toUpperCase()+" heat pump design evidence"}>
       <header><div><span>PROPOSAL {q.id.toUpperCase()}</span><strong>{q.scope==="unknown"?"Scope not confirmed":q.scope.replaceAll("-"," ")}</strong></div>
        <small>{q.installedPrice===null?"Price unknown":q.installedPrice.toLocaleString("en-US",{style:"currency",currency:"USD"})}</small></header>
       <label className="hp-bid-field" htmlFor={"hp-bid-"+q.id+"-loadMethod"}>Heating/cooling load method
        <select id={"hp-bid-"+q.id+"-loadMethod"} value={b.loadMethod} onChange={e=>changedBid(q.id,"loadMethod",e.target.value as DesignMethod)}>
         {methods.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
       </label>
       {fields.map(field=>renderEvidence(q,field))}
       <label htmlFor={"hp-bid-"+q.id+"-backup"} className="hp-bid-field">Heating backup or auxiliary plan
        <select id={"hp-bid-"+q.id+"-backup"} value={b.backup} onChange={e=>changedBid(q.id,"backup",e.target.value as Backup)}>
         {strategies.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
       </label>
       <label htmlFor={"hp-bid-"+q.id+"-ductReview"} className="hp-bid-field">Duct/airflow documentation
        <select id={"hp-bid-"+q.id+"-ductReview"} value={b.ductReview} onChange={e=>changedBid(q.id,"ductReview",e.target.value as DuctCheck)}>
         {ducts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
       </label>
       <div className="hp-bid-technical">
        <p>Contractor-provided design figures — optional, <strong>not website-calculated</strong></p>
        <label htmlFor={"hp-bid-"+q.id+"-designOutdoorTempF"}>Winter design temp (°F)
         <input id={"hp-bid-"+q.id+"-designOutdoorTempF"} type="number" min="-60" max="120" step="1" value={b.designOutdoorTempF??""} onChange={e=>number(q.id,"designOutdoorTempF",e.target.value)} placeholder="Not provided"/>
        </label>
        <label htmlFor={"hp-bid-"+q.id+"-documentedHeatLoadBtu"}>Calculated heating load (BTU/h)
         <input id={"hp-bid-"+q.id+"-documentedHeatLoadBtu"} type="number" min="1" max="500000" step="1" value={b.documentedHeatLoadBtu??""} onChange={e=>number(q.id,"documentedHeatLoadBtu",e.target.value)} placeholder="Not provided"/>
        </label>
        <label htmlFor={"hp-bid-"+q.id+"-manufacturerCapacityBtuAtDesign"}>Manufacturer heating capacity at design temp (BTU/h)
         <input id={"hp-bid-"+q.id+"-manufacturerCapacityBtuAtDesign"} type="number" min="1" max="500000" step="1" value={b.manufacturerCapacityBtuAtDesign??""} onChange={e=>number(q.id,"manufacturerCapacityBtuAtDesign",e.target.value)} placeholder="Not provided"/>
        </label>
        <label htmlFor={"hp-bid-"+q.id+"-zonesServed"}>Number of conditioned rooms/zones
         <input id={"hp-bid-"+q.id+"-zonesServed"} type="number" min="1" max="32" step="1" value={b.zonesServed??""} onChange={e=>number(q.id,"zonesServed",e.target.value)} placeholder="Not provided"/>
        </label>
       </div>
       {f&&<p className="hp-bid-count">{f.documented} / {f.required} core evidence items documented, self-reported</p>}
      </article>;})}
    </div>
   </section>
  </div>
  {calculated.error&&<p role="alert" className="hp-bid-error">{calculated.error}</p>}
  {calculated.data&&<section className="hp-bid-outcome" aria-live="polite" aria-label="Heat pump design and scope assessment">
   <span className="hp-bid-kicker">{calculated.data.status==="ready-for-professional-review"?"DOCUMENTATION ALIGNED FOR REVIEW":"CLARIFY BEFORE CONTRACTING"}</span>
   <h3>{calculated.data.heading}</h3><p>{calculated.data.explanation}</p>
   {calculated.data.differences.length>0&&<div className="hp-bid-differences"><h4>Different work, scope or design assumptions</h4><ul>{calculated.data.differences.map(s=><li key={s}>{s}</li>)}</ul></div>}
   <div className="hp-bid-findings">{calculated.data.findings.map(f=><article key={f.id}>
    <h4>Proposal {f.id.toUpperCase()} — request these corrections</h4>
    {f.questions.length?<ol>{f.questions.map(x=><li key={x}>{x}</li>)}</ol>:<p>Core evidence categories have been reported complete. A licensed professional must still verify the design and actual installation.</p>}
    {f.notes.map(x=><p className="hp-bid-note" key={x}>{x}</p>)}
   </article>)}</div>
   <p className="hp-bid-important">A documented figure does not prove the system is adequately sized. Do not compute a tonnage recommendation from your entered load/capacity alone: manufacturer performance, local design temperature, backup heat, duct delivery and controls require professional review. No contractor is endorsed or contacted.</p>
   <div className="hp-bid-buttons">
    <button type="button" onClick={()=>void copy("report")}>Copy comparison and follow-ups</button>
    <button type="button" className="hp-bid-outline" onClick={()=>download("report")}>Download review (.txt)</button>
   </div>
  </section>}
  <aside className="hp-bid-official"><h3>Why these questions matter</h3>
   <p>ENERGY STAR recommends professional heat-loss/heat-gain sizing. ACCA Manual S ties equipment selection to home loads and manufacturer data; DOE's Building America guidance describes written duct checks and actual commissioning tests. These are design and quality references—not a permit or incentive determination.</p>
   <ul>{Object.values(BID_QUALITY_SOURCES).map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" onClick={()=>track("hp_bid_quality_official_outbound")}>{s.label} ↗</a></li>)}</ul>
   <p>Source review {BID_QUALITY_REVIEWED}. Any Oregon HP3 incentives and Portland electrical/mechanical permits still require verification through the separate local planner above; no incentive is calculated here.</p>
  </aside>
  {note&&<p role="status" className="hp-bid-notice">{note}</p>}
  <p className="hp-bid-private">Privacy: entries exist only in browser memory. Reports are generated locally. Aggregate analytics counts only actions, never proposal amounts, models, load calculations, selected attributes or contractor names.</p>
 </section>;
}
