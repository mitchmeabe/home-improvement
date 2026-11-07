"use client";
import {useMemo,useState} from "react";
import {downloadTextReport} from "../lib/download-report";
import type {SJInput,SJOutcome} from "../lib/san-jose-ev";
import {
 INITIAL_SJ_PANEL_INPUT,emptySJPanelOffer,evaluateSJPanelAlternatives,
 sanJosePanelRequest,sanJosePanelReport,SJ_PANEL_SOURCES,SJ_PANEL_REVIEWED,
 type SJPanelInput,type SJPanelOffer,type SJPanelOfferId,type SJPanelYesNo,
 type SJPanelAmps,type SJPanelAssessment,type SJPanelPriceBasis,type SJPanelUtilityBasis
} from "../lib/san-jose-ev-panel-alternatives";
import "./san-jose-ev-panel-alternatives.css";
const currency=(n:number|null)=>n===null?"Unknown":n.toLocaleString("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2});
const yesNo:[SJPanelYesNo,string][]=[
 ["unsure","Not documented / unknown"],["yes","Yes — confirmed in writing"],["no","No — not established"]
];
const checklist=[
 ["writtenLoadAssessment","A qualified electrician documented service/load assessment"],
 ["contractorLicenseChecked","I checked the active appropriate CSLB contractor license and coverage details"],
 ["existingPanelDefect","An independent panel defect or safety problem exists"],
 ["sameChargingOutcome","Both designs meet the same written charging power and usability target"],
 ["managedEquipmentReviewed","The electrician documented compatible listed managed-charging equipment"],
 ["utilityCoordinationReviewed","PG&E/service-change requirements and costs were reviewed"]
] as const;
const offerChecklist=[
 ["permitIncluded","Required City electrical permit and fee included"],
 ["inspectionIncluded","City inspection and closeout included"],
 ["equipmentModelDocumented","Exact charger/equipment model and listing documented"],
 ["technicalScopeDocumented","Detailed electrical/charger/panel work scope documented"],
 ["warrantyWritten","Equipment and labor warranty and exclusions in writing"]
] as const;
export function SanJoseEVPanelAlternatives({project,permit}:{project:SJInput;permit:SJOutcome}){
 const [inputs,setInputs]=useState<SJPanelInput>({...INITIAL_SJ_PANEL_INPUT,
  offers:[emptySJPanelOffer("managed"),emptySJPanelOffer("upgrade")]});
 const [asOf]=useState(()=>new Date().toISOString().slice(0,10));
 const [feedback,setFeedback]=useState("");
 const out=useMemo(()=>evaluateSJPanelAlternatives(project,permit,inputs,asOf),[project,permit,inputs,asOf]);
 if(out.status==="outside-scope")return null;
 const edit=<K extends keyof SJPanelInput>(key:K,value:SJPanelInput[K])=>{
  setInputs(x=>({...x,[key]:value}));setFeedback("");
 };
 const offerEdit=(id:SJPanelOfferId,patch:Partial<SJPanelOffer>)=>{
  setInputs(x=>({...x,offers:x.offers.map(q=>q.id===id?{...q,...patch}:q) as [SJPanelOffer,SJPanelOffer]}));setFeedback("");
 };
 const toNum=(v:string)=>v.trim()===""?null:Number(v);
 function download(which:"request"|"review"){
  const contents=which==="request"?sanJosePanelRequest(out):sanJosePanelReport(out,inputs);
  downloadTextReport(which==="request"?"san-jose-ev-panel-alternatives-request":"san-jose-ev-panel-alternatives-review",contents);
  setFeedback("Report downloaded locally. No information was submitted.");
 }
 async function copy(){
  try{await navigator.clipboard.writeText(sanJosePanelRequest(out));setFeedback("Question sheet copied. No information was submitted.");}
  catch{setFeedback("Clipboard unavailable. Download the question sheet instead.");}
 }
 return <section className="sjev-card sjpanel" aria-labelledby="sjpanel-title">
  <p className="sjev-next-kicker">DECISION 05 · IS A PANEL UPGRADE REALLY NECESSARY?</p>
  <h2 id="sjpanel-title">Review managed charging versus a proposed panel upgrade</h2>
  <p>If a contractor recommends replacing your electrical panel to install Level 2 charging, ask for two documented alternatives. <strong>Only a qualified professional can establish whether either approach is safe and code-compliant.</strong> This site does not calculate service capacity.</p>
  <div className="sjpanel-fields">
   <label htmlFor="sjpanel-rating">Existing main-panel service rating
    <select id="sjpanel-rating" value={inputs.panelAmps} onChange={e=>edit("panelAmps",e.target.value as SJPanelAmps)}>
     <option value="unsure">Unknown / not verified</option>
     <option value="125-or-less">125 A or less — City EV load-calculation requirement applies</option>
     <option value="over-125">More than 125 A — electrician capacity review still necessary</option>
    </select>
   </label>
   <label htmlFor="sjpanel-assessment">Licensed electrician's written technical conclusion
    <select id="sjpanel-assessment" value={inputs.electricianAssessment} onChange={e=>edit("electricianAssessment",e.target.value as SJPanelAssessment)}>
     <option value="not-determined">No written decision yet</option>
     <option value="both-feasible">Both options technically feasible for this charging target</option>
     <option value="panel-required">Panel replacement is independently required</option>
     <option value="managed-not-viable">Managed charging not suitable for this project</option>
    </select>
   </label>
   {checklist.map(([key,label])=><label htmlFor={"sjpanel-"+key} key={key}>{label}
    <select id={"sjpanel-"+key} value={inputs[key]} onChange={e=>edit(key,e.target.value as SJPanelYesNo)}>
     {key==="existingPanelDefect"?<>
      <option value="unsure">Not independently checked</option>
      <option value="no">No independent safety/condition defect documented</option>
      <option value="yes">Yes — a separate panel defect or required work exists</option>
     </>:yesNo.map(([v,label])=><option value={v} key={v}>{label}</option>)}
    </select>
   </label>)}
  </div>
  <div className="sjpanel-status" role="region" aria-label="Panel upgrade decision audit" aria-live="polite">
   <strong>{out.headline}</strong>
   <p>Decision state: {out.status.replaceAll("-"," ")}</p>
   {out.notes.map((x,i)=><p key={i}>{x}</p>)}
   {out.requiredEvidence.length>0&&<><h3>Questions to resolve with the electrician and utility</h3>
    <ul>{out.requiredEvidence.map((x,i)=><li key={i}>{x}</li>)}</ul></>}
  </div>
  {out.status!=="source-review"&&out.status!=="panel-work-review"&&<div className="sjpanel-quotes" aria-label="Two alternative installation quotes">
   {inputs.offers.map(q=><fieldset key={q.id} className="sjpanel-quote">
    <legend>{q.id==="managed"?"Option A · Managed charging, no panel replacement":"Option B · Panel/service upgrade with charging"}</legend>
    <p>Enter the written quoted price for this <em>different electrical design</em>. You are not certifying that it is a viable substitute.</p>
    <label htmlFor={"sjpanel-"+q.id+"-amount"}>Installed proposal total ($)
     <input id={"sjpanel-"+q.id+"-amount"} type="number" min="0" max="1000000" step="0.01"
      value={q.amount??""} placeholder="Unknown" onChange={e=>offerEdit(q.id,{amount:toNum(e.target.value)})}/>
    </label>
    <label htmlFor={"sjpanel-"+q.id+"-basis"}>Price basis
     <select id={"sjpanel-"+q.id+"-basis"} value={q.priceBasis} onChange={e=>offerEdit(q.id,{priceBasis:e.target.value as SJPanelPriceBasis})}>
      <option value="unsure">Unknown</option><option value="before-incentives">Before incentives and rebates</option>
      <option value="after-incentives">After stated incentives (must independently verify)</option>
     </select>
    </label>
    <label htmlFor={"sjpanel-"+q.id+"-utility"}>Utility service fees or modifications in this installed price
     <select id={"sjpanel-"+q.id+"-utility"} value={q.utilityBasis} onChange={e=>offerEdit(q.id,{utilityBasis:e.target.value as SJPanelUtilityBasis})}>
      <option value="unsure">Unclear — no comparison</option><option value="included">Included in installed total</option>
      <option value="separate">Quoted separately</option>
     </select>
    </label>
    {q.utilityBasis==="separate"&&<label htmlFor={"sjpanel-"+q.id+"-utility-fee"}>Additional written utility charge ($), enter confirmed 0 if none
     <input id={"sjpanel-"+q.id+"-utility-fee"} type="number" min="0" max="1000000" step="0.01"
      value={q.additionalUtilityCost??""} placeholder="Unknown" onChange={e=>offerEdit(q.id,{additionalUtilityCost:toNum(e.target.value)})}/>
    </label>}
    <label htmlFor={"sjpanel-"+q.id+"-ongoing"}>First-year recurring/monitoring/management charges beyond installed quote ($)
     <input id={"sjpanel-"+q.id+"-ongoing"} type="number" min="0" max="1000000" step="0.01"
      value={q.firstYearOngoingCost??""} placeholder="Unknown, not assumed zero" onChange={e=>offerEdit(q.id,{firstYearOngoingCost:toNum(e.target.value)})}/>
    </label>
    {offerChecklist.map(([field,label])=><label key={field} htmlFor={"sjpanel-"+q.id+"-"+field}>{label}
     <select id={"sjpanel-"+q.id+"-"+field} value={q[field]} onChange={e=>offerEdit(q.id,{[field]:e.target.value as SJPanelYesNo})}>
      {yesNo.map(([v,l])=><option key={v} value={v}>{l}</option>)}
     </select>
    </label>)}
    <div className="sjpanel-quote-result">
     <strong>Known first-year total: {currency(out.firstYearTotals[q.id])}</strong>
     {(out.offerIssues[q.id]).map((issue,i)=><p key={i}>{issue}</p>)}
    </div>
   </fieldset>)}
  </div>}
  {out.status==="compare"&&<div className="sjpanel-difference" role="status">
   <strong>Conditional first-year quoted difference: {currency(out.priceDifference)}</strong>
   <p>{out.lowerQuote?("The "+(out.lowerQuote==="managed"?"managed-charging":"panel-upgrade")+" proposal has the lower self-reported first-year amount."):"The entered totals are equal."} This is <strong>not verified savings, a safety approval, or an installer recommendation</strong>.</p>
  </div>}
  <div className="sjev-next-actions">
   <button type="button" onClick={()=>void copy()}>Copy neutral electrician questions</button>
   <button type="button" className="sjev-secondary" onClick={()=>download("request")}>Download request (.txt)</button>
   <button type="button" className="sjev-secondary" onClick={()=>download("review")}>Download decision audit (.txt)</button>
  </div>
  {feedback&&<p role="status">{feedback}</p>}
  <p className="sjpanel-links">Official guidance: <a href={SJ_PANEL_SOURCES.city} target="_blank" rel="noopener noreferrer">San José charging permits</a> · <a href={SJ_PANEL_SOURCES.panel} target="_blank" rel="noopener noreferrer">Panel permits</a> · <a href={SJ_PANEL_SOURCES.utility} target="_blank" rel="noopener noreferrer">PG&E residential service changes</a> · <a href={SJ_PANEL_SOURCES.contractor} target="_blank" rel="noopener noreferrer">CSLB hire checks</a> · <a href={SJ_PANEL_SOURCES.licensing} target="_blank" rel="noopener noreferrer">Verify contractor license</a></p>
  <p className="sjev-private-note">Reviewed {SJ_PANEL_REVIEWED}. Buyer inputs and proposal prices remain in browser memory and are never sent to an insurer, electrician or affiliate. No lead submission or public release.</p>
 </section>;
}
