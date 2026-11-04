"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {downloadTextReport} from "../../../lib/download-report";
import {PortlandAddressJurisdictionCheck} from "../../../components/portland-address-jurisdiction-check";
import type {GISResult} from "../../../lib/portland-jurisdiction-gis";
import {initialDossierInput,resolveProjectDossier,DOSSIER_REVIEWED_ON,DOSSIER_SOURCES,
 type DossierInput,type DossierFinding} from "../../../lib/oregon-project-dossier";
import "./oregon-requirements.css";

type Option=readonly [string,string];
function Choice({id,label,value,options,change}:{id:string;label:string;value:string;options:readonly Option[];change:(v:string)=>void}){
 return <label htmlFor={id}>{label}<select id={id} value={value} onChange={e=>change(e.target.value)}>
 {options.map(([v,t])=><option key={v} value={v} disabled={v.endsWith("-gis-record")}>{t}</option>)}</select></label>;
}
const labels:Record<DossierFinding["status"],string>={
 required:"Required",verify:"Confirm","historical-limit":"Historical limitation","not-applicable":"Out of scope"
};
export default function OregonProjectDossier(){
 const [input,setInput]=useState<DossierInput>(initialDossierInput);
 const [message,setMessage]=useState("");
 const set=<K extends keyof DossierInput>(key:K,value:DossierInput[K])=>{
  setInput(old=>key==="place"?{...old,place:value as DossierInput["place"],officialJurisdiction:null}:{...old,[key]:value});setMessage("");
 };
 const outcome=useMemo(()=>{
  try{return {data:resolveProjectDossier(input),error:""};}
  catch(e){return {data:null,error:e instanceof Error?e.message:"Invalid project input"};}
 },[input]);
 const data=outcome.data;
 const acceptGIS=(record:GISResult)=>{
  setInput(old=>{
   if(record.status==="portland"&&record.evidence?.scope==="portland")
    return {...old,place:"portland-gis-record",officialJurisdiction:record.evidence};
   if(record.status==="other-oregon"&&record.evidence?.scope==="other-oregon")
    return {...old,place:"other-oregon-gis-record",officialJurisdiction:record.evidence};
   if(record.status==="outside-oregon")
    return {...old,place:"outside-oregon",officialJurisdiction:null};
   return {...old,place:"portland-unverified",officialJurisdiction:null};
  });
  setMessage("");
 };
 const invalidateGIS=()=>setInput(old=>({...old,place:"portland-unverified",officialJurisdiction:null}));
 const copy=async()=>{if(!data)return;
  try{await navigator.clipboard.writeText(data.plainText);setMessage("Dossier copied. No application or inquiry submitted.");}
  catch{setMessage("Clipboard unavailable; use the download option.");}
 };
 const C=<K extends keyof DossierInput>(key:K,id:string,label:string,options:readonly Option[])=>
  <Choice id={id} label={label} options={options} value={String(input[key])}
   change={v=>set(key,v as DossierInput[K])}/>;
 return <main className="or-dossier">
  <nav aria-label="Breadcrumb"><Link href="/">Home</Link> / <Link href="/projects">Projects</Link> / Oregon requirements dossier</nav>
  <header><p className="or-dossier-kicker">Property + project requirements</p>
   <h1>Know what your project needs before accepting a quote.</h1>
   <p>Combine reported property conditions with official Portland permit guidance, Oregon incentive rules, and a written evidence checklist. The report identifies documents, unresolved facts, and contractor questions instead of promising a rebate.</p>
   <p className="or-dossier-private">No account, income, payment information or file upload is required. An optional street-address check is sent directly from your browser to official PortlandMaps GIS only when you click Check; we do not store it or include it in your exported dossier.</p>
  </header>
  <div className="or-dossier-columns">
   <section className="or-dossier-form" aria-label="Project facts">
    <h2>1. Project and property</h2>
    {C("project","od-project","Project type",[
     ["space-heat-pump","Space-heating heat pump / mini-split"],
     ["heat-pump-water-heater","Heat-pump water heater"],
     ["electrical-panel","Electrical panel or service work"]
    ])}
    <PortlandAddressJurisdictionCheck onAccepted={acceptGIS} onInvalidated={invalidateGIS}/>
    <p className="or-dossier-hint">You can also confirm the parcel's Jurisdiction field manually in <a target="_blank" rel="noreferrer" href={DOSSIER_SOURCES.property}>PortlandMaps</a>. A Portland mailing address is not proof of city jurisdiction. A city GIS match does not establish the property's building class or permit approval.</p>
    {C("place","od-place","Reported jurisdiction",[
     ["portland-unverified","Portland address, city jurisdiction not checked"],
     ["portland-reported","Portland jurisdiction shown in property records (self-reported)"],
     ["portland-gis-record","Portland — exact City GIS address-point match (read-only)"],
     ["other-oregon-gis-record","Outside Portland — City GIS address-point match (read-only)"],
     ["other-oregon","Elsewhere in Oregon"],
     ["outside-oregon","Outside Oregon"],
     ["unknown","Not sure"]
    ])}
    {C("house","od-house","Dwelling type",[
     ["unknown","Not checked"],["one-two-family","One- or two-family home"],
     ["townhouse-adu","Townhouse or ADU"],["other","Multifamily / commercial / other"]
    ])}
    {C("property","od-property","Property use",[
     ["existing-owner-occupied","Existing owner-occupied home"],
     ["existing-rental","Existing rental"],["new-construction","New residential construction"],
     ["vacation-or-commercial","Vacation / transient / commercial"],["other","Unknown / other"]
    ])}
    {C("electricUtility","od-utility","Electric utility (from bill)",[
     ["unknown","Not checked"],["pge","Portland General Electric"],
     ["pacific-power","Pacific Power"],["other","Other"]
    ])}
    {C("installRoute","od-route","Purchase / installation route",[
     ["unknown","Not established"],["contractor","Contractor / distributor"],
     ["do-it-yourself","DIY / retail purchase"]
    ])}
    {C("electricScope","od-scope","Electrical work included",[
     ["unknown","Not confirmed"],["none-reported","No known changes"],
     ["new-circuit","New or modified circuit"],["panel-replacement","Panel / service replacement"],
     ["both","Panel / service plus new circuits"]
    ])}
    {input.project==="space-heat-pump"&&<fieldset><legend>Space-heat-pump equipment</legend>
     {C("heatingEquipment","od-heat","Equipment class",[
      ["heat-pump","Central / ducted heat pump"],["mini-split","Mini-split"]
     ])}
     <div className="or-dossier-twocol">
      <label htmlFor="od-hspf">Published HSPF2<input id="od-hspf" type="number" min="0" step=".1"
       placeholder="Not known" value={input.hspf2??""}
       onChange={e=>set("hspf2",e.target.value===""?null:Number(e.target.value))}/></label>
      <label htmlFor="od-seer">Published SEER2<input id="od-seer" type="number" min="0" step=".1"
       placeholder="Not known" value={input.seer2??""}
       onChange={e=>set("seer2",e.target.value===""?null:Number(e.target.value))}/></label>
     </div>
    </fieldset>}
    {input.project==="heat-pump-water-heater"&&<fieldset><legend>Water-heater scope</legend>
     {C("waterHeaterReplacement","od-replace","Replacing a water heater?",[
      ["unknown","Unclear"],["yes","Yes"],["no","No / new addition"]
     ])}
     {C("existingWaterHeaterFuel","od-fuel","Existing water heater fuel",[
      ["unknown","Unknown"],["electric","Electric"],["gas","Gas"],["other","Other"]
     ])}
     {C("ventilationChange","od-vent","New duct / ventilation?",[
      ["unknown","Not checked"],["yes","Yes"],["no","No"]
     ])}
    </fieldset>}
    <label htmlFor="od-date">Planned installation date (optional)
     <input id="od-date" type="date" value={input.plannedInstallationDate}
      onChange={e=>set("plannedInstallationDate",e.target.value)}/></label>
    <p className="or-dossier-muted">Rules reviewed {DOSSIER_REVIEWED_ON}. Published program funding and offers are dated snapshots, not live availability.</p>
   </section>
   <section className="or-dossier-result" aria-label="Project requirements result" aria-live="polite">
    <h2>2. Your project dossier</h2>
    {outcome.error&&<p role="alert" className="or-dossier-error">{outcome.error}</p>}
    {data&&<>
     <div className="or-dossier-overview">
      <strong>{data.project==="space-heat-pump"?"Space heating":data.project==="heat-pump-water-heater"?"Water heating":"Electrical panel / service"}</strong>
      <p>{data.jurisdiction==="official-portland-address"?
       "The official City address-point layer reports Portland for an exact active property match. Confirm the actual parcel before filing.":
       data.jurisdiction==="official-non-portland-address"?
       "Official city address-point data reports a non-Portland jurisdiction. Check that local permitting authority.":
       data.jurisdiction==="user-reported-portland"?
       "Portland jurisdiction is reported by you; not authenticated by this site.":
       data.jurisdiction==="outside-portland"?
       "Portland permit authority does not apply from the entered location.":
       "Actual permit authority is not established."}</p>
      <small>{data.counts.required} conditional permits · {data.counts.verify} verification findings · {data.counts.historicalLimit} historical funding restrictions</small>
     </div>
     <h3>Recommended order of work</h3>
     <ol className="or-dossier-steps">{data.nextActions.map(x=><li key={x}>{x}</li>)}</ol>
     {(["jurisdiction","permit","equipment","incentive"] as const).map(group=>{
      const found=data.findings.filter(x=>x.group===group);
      if(!found.length)return null;
      return <section className="or-dossier-section" key={group}>
       <h3>{group==="jurisdiction"?"Property jurisdiction":group==="permit"?"Trade permits and inspections":group==="equipment"?"Equipment and electrical scope":"Incentive pathways"}</h3>
       {found.map(f=><article className="or-dossier-finding" key={f.id}>
        <div><strong>{f.title}</strong><span className={"or-dossier-status "+f.status}>{labels[f.status]}</span></div>
        <p>{f.detail}</p>
        <p className="or-dossier-muted"><a href={f.sourceUrl} target="_blank" rel="noreferrer">Official / published source</a> · Reviewed/snapshot: {f.sourceDate} · {f.basis==="dated-program-snapshot"?"Historical":f.basis==="official-address-record"?"Official address-point evidence":f.basis==="pending-fact"?"Unverified fact":"Published conditional rule"}</p>
       </article>)}
      </section>;
     })}
     <section className="or-dossier-section"><h3>Evidence and documents to collect</h3>
      {data.documents.map(d=><article className="or-dossier-document" key={d.id}>
       <strong>{d.title}</strong><p>From: {d.owner} · {d.when}</p>
       <a href={d.sourceUrl} target="_blank" rel="noreferrer">Source</a>
      </article>)}
     </section>
     <details className="or-dossier-outstanding" open><summary>Unresolved facts ({data.blockers.length})</summary>
      <ul>{data.blockers.map(x=><li key={x}>{x}</li>)}</ul>
     </details>
     <details><summary>Contractor questions ({data.questions.length})</summary>
      <ol>{data.questions.map(x=><li key={x}>{x}</li>)}</ol>
     </details>
     <div className="or-dossier-actions">
      <button type="button" onClick={copy}>Copy full dossier</button>
      <button type="button" onClick={()=>{downloadTextReport("oregon-project-requirements",data.plainText);setMessage("Dossier downloaded locally.");}}>Download dossier (.txt)</button>
     </div>
     {message&&<p role="status">{message}</p>}
     <p className="or-dossier-muted"><strong>Not independently established:</strong> full parcel boundaries/building classification, utility accounts, issued permits, live incentive funds, equipment certification, contractor approval, price, completed inspections or rebate award. A City address-point match is not a legal permit determination.</p>
    </>}
   </section>
  </div>
  <aside className="or-dossier-more"><strong>Also compare actual quotes:</strong>
   <Link href="/#oregon-project">Oregon space heat pumps</Link>
   <Link href="/oregon/heat-pump-water-heaters">Oregon water-heater proposals</Link>
  </aside>
 </main>;
}
