"use client";

import {useMemo,useState} from "react";
import {track} from "@vercel/analytics";
import {downloadTextReport} from "../lib/download-report";
import type {Input,Quote} from "../lib/oregon-heat-pump-water-heater";
import {
 HPWH_FIT_SOURCES,HPWH_FIT_REVIEWED,assessHPWHFit,hpwhEqualBidRequest,hpwhFitReport,
 type HPWHSite,type HPWHModelReview,type HPWHFitAssessment,
 type SiteLocation,type ExistingPower,type Ambient,type Drain,type HotWaterDemand,
 type AirPlan,type FitAnswer,type Voltage
} from "../lib/hpwh-purchase-fit";
import "./hpwh-purchase-fit.css";

const yesNo=[["unknown","Not verified"],["yes","Yes — documented in writing"],["no","No / not included"]] as const;
const volume=(n:number|null)=>n===null?"not measured":n.toLocaleString("en-US",{maximumFractionDigits:1})+" cubic feet";
const money=(n:number|null)=>n===null?"no total":"$"+n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
type FitNumber="manufacturerMinimumAirFt3"|"firstHourGallons"|"uef";
type Documented="ventPlanDocumented"|"circuitPlanDocumented"|"condensateSolutionIncluded"|"modelOperatingTemperatureChecked"|"serviceClearanceDocumented"|"noiseAndCoolingDiscussed"|"commissioningAndHandoverIncluded";

export function HPWHPurchaseFitStudio({input,site,models,assessment,onSite,onModel}:{
 input:Input;
 site:HPWHSite;
 models:readonly HPWHModelReview[];
 assessment:HPWHFitAssessment|null;
 onSite:<K extends keyof HPWHSite>(key:K,value:HPWHSite[K])=>void;
 onModel:(id:Quote["id"],patch:Partial<HPWHModelReview>)=>void;
}){
 const [message,setMessage]=useState("");
 const [started,setStarted]=useState(false);
 const request=useMemo(()=>hpwhEqualBidRequest(site),[site]);
 const review=useMemo(()=>assessment?hpwhFitReport(input,site,models,assessment):null,[input,site,models,assessment]);
 function changedSite<K extends keyof HPWHSite>(key:K,value:HPWHSite[K]){
  onSite(key,value);setMessage("");
  if(!started){setStarted(true);track("hpwh_fit_review_started");}
 }
 function changedModel(id:Quote["id"],patch:Partial<HPWHModelReview>){
  onModel(id,patch);setMessage("");
  if(!started){setStarted(true);track("hpwh_fit_review_started");}
 }
 const fieldNumber=(s:string)=>s===""?null:Number(s);
 async function copy(which:"request"|"review"){
  const data=which==="request"?request:review;
  if(!data)return;
  try{await navigator.clipboard.writeText(data);
   setMessage(which==="request"?"Consistent bid request copied.":"Model and site-fit report copied.");
   track(which==="request"?"hpwh_bid_request_copied":"hpwh_fit_review_copied");
  }catch{setMessage("Clipboard unavailable. Download the text file instead.");}
 }
 function download(which:"request"|"review"){
  const data=which==="request"?request:review;
  if(!data)return;
  downloadTextReport(which==="request"?"oregon-hpwh-installation-bid":"oregon-hpwh-fit-and-quote",data);
  setMessage(which==="request"?"Bid specification downloaded locally.":"Model and site review downloaded locally.");
  track(which==="request"?"hpwh_bid_request_downloaded":"hpwh_fit_review_downloaded");
 }
 const modelNumber=(q:Quote,key:FitNumber,label:string,help:string,min:number,max:number,step:string)=>{
  const m=models.find(x=>x.id===q.id)!;
  return <label className="hpwh-fit-field" htmlFor={"hpwh-fit-"+q.id+"-"+key} key={key}>{label}
   <small>{help}</small>
   <input id={"hpwh-fit-"+q.id+"-"+key} type="number" min={min} max={max} step={step} inputMode="decimal"
    value={m[key]??""} placeholder="Not documented"
    onChange={e=>changedModel(q.id,{[key]:fieldNumber(e.target.value)} as Partial<HPWHModelReview>)}/>
  </label>;
 };
 const modelDocument=(q:Quote,key:Documented,label:string)=>{
  const m=models.find(x=>x.id===q.id)!;
  return <label className="hpwh-fit-field" htmlFor={"hpwh-fit-"+q.id+"-"+key} key={key}>{label}
   <select id={"hpwh-fit-"+q.id+"-"+key} value={m[key]}
    onChange={e=>changedModel(q.id,{[key]:e.target.value as FitAnswer})}>
    {yesNo.map(([value,text])=><option value={value} key={value}>{text}</option>)}
   </select>
  </label>;
 };
 return <section className="hpwh-card hpwh-fit" id="hpwh-installation-fit" aria-labelledby="hpwh-fit-heading">
  <header className="hpwh-fit-intro">
   <p className="hpwh-fit-kicker">STEP 3 · A WATER HEATER THAT FITS THE ACTUAL HOUSE</p>
   <h2 id="hpwh-fit-heading">Check space, water demand and model requirements before you buy.</h2>
   <p>Tank gallons alone do not establish enough hot water. A quoted heat-pump water heater also needs manufacturer-specified air, power, condensate drainage, service access and operating temperature. Compare those facts across the same two or three quotes entered above.</p>
  </header>

  <div className="hpwh-fit-site-layout">
   <section className="hpwh-fit-site" aria-label="Water heater installation space and household requirements">
    <h3>01 · Describe the installation site</h3>
    <div className="hpwh-fit-field-grid">
     <label className="hpwh-fit-field" htmlFor="hpwh-fit-location">Proposed equipment location
      <select id="hpwh-fit-location" value={site.location} onChange={e=>changedSite("location",e.target.value as SiteLocation)}>
       <option value="unknown">Not settled</option><option value="garage">Garage</option>
       <option value="basement">Basement</option><option value="utility-room">Utility/laundry room</option>
       <option value="closet">Enclosed closet</option><option value="other">Another indoor location</option>
      </select>
     </label>
     <label className="hpwh-fit-field" htmlFor="hpwh-fit-ambient">Typical winter air temperature
      <select id="hpwh-fit-ambient" value={site.temperature} onChange={e=>changedSite("temperature",e.target.value as Ambient)}>
       <option value="unknown">Not checked</option>
       <option value="typically-above-38">Usually at or above about 38°F</option>
       <option value="often-below-38">Frequently below about 38°F</option>
      </select>
     </label>
     <label className="hpwh-fit-field" htmlFor="hpwh-fit-power">Existing electric supply
      <select id="hpwh-fit-power" value={site.power} onChange={e=>changedSite("power",e.target.value as ExistingPower)}>
       <option value="unknown">Electrician has not checked</option>
       <option value="usable-240">Reported 240 V supply (not proof of adequate circuit)</option>
       <option value="usable-120">Reported 120 V outlet (not proof of adequate circuit)</option>
       <option value="no-known-circuit">No known compatible circuit / gas-only location</option>
      </select>
     </label>
     <label className="hpwh-fit-field" htmlFor="hpwh-fit-drain">Where can condensate water go?
      <select id="hpwh-fit-drain" value={site.drain} onChange={e=>changedSite("drain",e.target.value as Drain)}>
       <option value="unknown">Need plumbing review</option>
       <option value="nearby-gravity">Potential gravity drain nearby</option>
       <option value="pump-needed">Condensate pump and discharge required</option>
       <option value="no-path">No confirmed drain or pump discharge path</option>
      </select>
     </label>
     <label className="hpwh-fit-field" htmlFor="hpwh-fit-demand">Household hot-water pattern
      <select id="hpwh-fit-demand" value={site.demand} onChange={e=>changedSite("demand",e.target.value as HotWaterDemand)}>
       <option value="unknown">Not discussed with plumber</option>
       <option value="typical">Typical, staggered household use</option>
       <option value="high-demand">High peak demand / simultaneous showers, baths or large draws</option>
      </select>
     </label>
    </div>
    <h4>Measure the enclosed installation room</h4>
    <p className="hpwh-fit-hint">Enter clear room dimensions in feet, not the tank's dimensions. A connected space or louver only counts when the manufacturer permits that design. This arithmetic is <strong>not</strong> an airflow approval.</p>
    <div className="hpwh-fit-dimensions">
     {([
      ["lengthFt","Length (ft)"],["widthFt","Width (ft)"],["heightFt","Height (ft)"]
     ] as const).map(([key,label])=><label key={key} className="hpwh-fit-field" htmlFor={"hpwh-fit-"+key}>{label}
      <input id={"hpwh-fit-"+key} type="number" min=".1" max={key==="heightFt"?30:150} step=".1"
       value={site[key]??""} placeholder="Unknown" onChange={e=>changedSite(key,fieldNumber(e.target.value))}/>
     </label>)}
    </div>
    <p className="hpwh-fit-volume"><span>Calculated enclosed room volume</span>
     <strong>{volume(assessment?.measuredRoomVolumeFt3??null)}</strong>
    </p>
    <p className="hpwh-fit-hint">Some manufacturers specify around 450–700 cubic feet for an unvented installation. <strong>The exact selected model and installation manual control</strong>; a louvered or ducted design must be verified rather than assumed from a generic threshold.</p>
   </section>
   <section className="hpwh-fit-request" aria-label="Shared water heater contractor quote request">
    <p className="hpwh-fit-kicker">02 · STANDARDIZE WHAT INSTALLERS QUOTE</p>
    <h3>Request the same job before comparing price.</h3>
    <p>The personalized bid sheet asks each installer to specify model, EnergyGuide first-hour capacity, actual ventilation approach, voltage/circuit scope, condensate disposal, noise, warranties and permits. It does not send a lead or contact a contractor.</p>
    <div className="hpwh-fit-actions">
     <button type="button" onClick={()=>void copy("request")}>Copy bid requirements</button>
     <button type="button" className="hpwh-fit-outline" onClick={()=>download("request")}>Download bid sheet (.txt)</button>
    </div>
    <details><summary>Preview full itemized bid request</summary><pre>{request}</pre></details>
    <h4>Do not treat these as automatic failures:</h4>
    <p>A smaller closet may support a manufacturer-approved louver/duct design. A different circuit may be installable with permitted work. A model used in a cooler garage may have an approved operating range. <strong>Each requires the actual model's documentation and an installer assessment.</strong></p>
    <p>Always confirm current local plumbing and electrical requirements and any Energy Trust purchase/incentive terms separately.</p>
   </section>
  </div>

  <section className="hpwh-fit-models" aria-label="Manufacturer specifications for compared water heaters">
   <h3>03 · Check each quoted water heater against the installation</h3>
   <p>Copy details only from an actual manufacturer manual, EnergyGuide, or written contractor specification. Leave uncertain fields blank. None of the entries is independently validated or sent to a manufacturer.</p>
   <div className="hpwh-fit-model-grid">
    {input.quotes.map(q=>{
     const m=models.find(x=>x.id===q.id)!;
     const finding=assessment?.findings.find(x=>x.id===q.id);
     return <article key={q.id} className="hpwh-fit-model" aria-label={"Quote "+q.id.toUpperCase()+" model fit"}>
      <div className="hpwh-fit-model-head">
       <div><span>PROPOSAL {q.id.toUpperCase()}</span><h4>{money(q.installedTotal)} · {q.tankGallons===null?"tank size unknown":q.tankGallons+"-gallon tank"}</h4></div>
       <small>{finding?finding.documented+" / "+finding.totalChecks+" specs evidenced":"Needs quote review"}</small>
      </div>
      <label className="hpwh-fit-field" htmlFor={"hpwh-fit-"+q.id+"-model"}>Exact brand and model code
       <input id={"hpwh-fit-"+q.id+"-model"} type="text" maxLength={100} value={m.model}
        placeholder="e.g. manufacturer + full model number"
        onChange={e=>changedModel(q.id,{model:e.target.value})}/>
      </label>
      <div className="hpwh-fit-numeric-grid">
       {modelNumber(q,"firstHourGallons","First Hour Rating (gallons)","Published hot-water delivery capacity, not tank size",1,300,"1")}
       {modelNumber(q,"uef","Uniform Energy Factor (UEF)","Published efficiency rating, not projected bill savings",.5,8,".01")}
       {modelNumber(q,"manufacturerMinimumAirFt3","Minimum unvented air volume (ft³)","Use this model's manual, not generic 700 ft³",1,10000,"1")}
      </div>
      <label className="hpwh-fit-field" htmlFor={"hpwh-fit-"+q.id+"-airPlan"}>Proposed air intake and exhaust
       <select id={"hpwh-fit-"+q.id+"-airPlan"} value={m.airPlan} onChange={e=>changedModel(q.id,{airPlan:e.target.value as AirPlan})}>
        <option value="unknown">Not described</option>
        <option value="open-room">Use the measured unvented room air</option>
        <option value="manufacturer-approved-vent">Written manufacturer-approved louver/duct/transfer solution</option>
       </select>
      </label>
      {m.airPlan==="manufacturer-approved-vent"&&modelDocument(q,"ventPlanDocumented","Is the exact model's vent/louver plan in writing?")}
      <label className="hpwh-fit-field" htmlFor={"hpwh-fit-"+q.id+"-voltage"}>Manufacturer-required voltage
       <select id={"hpwh-fit-"+q.id+"-voltage"} value={m.voltage} onChange={e=>changedModel(q.id,{voltage:e.target.value as Voltage})}>
        <option value="unknown">Not confirmed</option>
        <option value="120">120 V model</option><option value="240">240 V model</option>
        <option value="other">Other / specialist model (verify)</option>
       </select>
      </label>
      {modelDocument(q,"circuitPlanDocumented","Electrician's circuit, breaker and permit scope in writing?")}
      {modelDocument(q,"condensateSolutionIncluded","Condensate drain/pump solution explicitly included?")}
      {modelDocument(q,"modelOperatingTemperatureChecked","Model minimum operating temperature checked for this location?")}
      {modelDocument(q,"serviceClearanceDocumented","Actual service clearance and physical fit documented?")}
      {modelDocument(q,"noiseAndCoolingDiscussed","Noise and cooled exhaust effects considered?")}
      {modelDocument(q,"commissioningAndHandoverIncluded","Commissioning and owner handover included?")}
      {finding&&<div className={"hpwh-fit-air "+(finding.kind==="needs-revision"?"is-warning":"")}>
       <strong>Model/room check</strong><p>{finding.airVolumeAssessment}</p>
      </div>}
     </article>;
    })}
   </div>
  </section>
  {assessment&&<section className="hpwh-fit-findings" aria-label="HPWH site and product buying assessment" aria-live="polite">
   <p className="hpwh-fit-kicker">{assessment.safeToCompareAsQuoted?"REPORTED EQUIPMENT APPEARS ALIGNED":"DO NOT COMMIT ON PRICE ALONE"}</p>
   <h3>{assessment.title}</h3><p>{assessment.summary}</p>
   <p className="hpwh-fit-price-note">{assessment.priceComparisonExplanation}</p>
   {assessment.differences.length>0&&<div className="hpwh-fit-differences">
    <h4>Material product or installation differences</h4>
    <ul>{assessment.differences.map(s=><li key={s}>{s}</li>)}</ul>
   </div>}
   <div className="hpwh-fit-findings-grid">
    {assessment.findings.map(f=><article key={f.id}>
     <h4>Quote {f.id.toUpperCase()} — questions to resolve</h4>
     {f.issues.length?<ol>{f.issues.map((s,i)=><li key={i}>{s}</li>)}</ol>:<p>Required specification categories were reported complete. Have a professional verify the actual room, model, wiring and plumbing before purchasing.</p>}
    </article>)}
   </div>
   <div className="hpwh-fit-actions">
    <button type="button" onClick={()=>void copy("review")}>Copy specific follow-ups</button>
    <button type="button" className="hpwh-fit-outline" onClick={()=>download("review")}>Download full review (.txt)</button>
   </div>
  </section>}
  <aside className="hpwh-fit-sources">
   <h3>Primary manufacturer-installation and water-heating guidance</h3>
   <ul>{Object.values(HPWH_FIT_SOURCES).map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" onClick={()=>track("hpwh_fit_official_source_opened")}>{s.title}</a></li>)}</ul>
   <p>Reference review {HPWH_FIT_REVIEWED}. ENERGY STAR and DOE describe first-hour capacity, model-specific room air, condensate drainage, noise and electrical options. The actual appliance installation manual, local code and a qualified installer control technical suitability.</p>
  </aside>
  {message&&<p role="status" className="hpwh-fit-notice">{message}</p>}
  <p className="hpwh-fit-private">Your room dimensions, hot-water pattern and equipment identifiers remain in browser memory. Export and copy happen only when you choose. Analytics records anonymous actions without quote values, model IDs, measurements or household answers.</p>
 </section>;
}
