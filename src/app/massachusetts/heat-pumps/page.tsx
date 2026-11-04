"use client";

import {useMemo,useState} from "react";
import Link from "next/link";
import {track} from "@vercel/analytics";
import {downloadTextReport} from "../../../lib/download-report";
import {
 MASS_REVIEWED_ON,MASS_SOURCES,EMPTY_MASS_INPUT,newMassQuote,compareMassQuotes,massCopyPlan,
 type MassInput,type MassQuote,type Answer,type HeatingFuel,type MassYear,type MassRoute,type PriceBasis,type ProposalScope,
} from "../../../lib/mass-save";
import {auditMassachusettsProposals,blankEquipment,massAuditReport,MASS_AUDIT_REVIEWED,MA_AUDIT_SOURCES,
 type EquipmentEvidence,type TimelineEvidence,type RefrigerantClass,type SystemClass} from "../../../lib/massachusetts-proposal-audit";
import {ProposalTextImporter,type ProposalPatch} from "../../../components/proposal-text-import";
import {MassHPQPLImporter} from "../../../components/mass-hpqpl-importer";
import {matchHPQPL,hpqplMatchReport,type HPQPLCatalog,type HPQPLMatch} from "../../../lib/mass-hpqpl";
import "./massachusetts.css";
const answerOptions=[
 {value:"unsure",label:"I need to verify"},
 {value:"yes",label:"Yes — confirmed"},
 {value:"no",label:"No"},
] as const;
type Common=Omit<MassInput,"installerInNetwork"|"equipmentOnQualifiedList"|"newEquipment"|"coolingCapacityBtu">;
type CommonAnswerKey="inMassachusetts"|"residentialAccount"|"residentialSponsorConfirmed"|"winterOccupied"|"hasOldHeatPump"|"displacesPrimaryHeating"|"wholeWeatherization"|"wholeFormSigned"|"fossilHeatingRemains"|"partialIntegratedControls"|"removedFuelEvidence";
type BidAnswerKey="installerInNetwork"|"equipmentOnQualifiedList"|"newEquipment"|"rebateDocumentation"|"permitsAndElectrical"|"loadCalculationProvided"|"scopeAndEquipmentIdentified"|"warrantyInWriting"|"commissioningIncluded"|"ductAirflowTestingIncluded"|"oldSystemRemovalIncluded";
const currency=(value:number|null)=>value===null?"Not established":value.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2});
const number=(str:string)=>str.trim()===""?null:Number(str);
const scopeNames:Record<ProposalScope,string>={
 "unknown":"Not documented",
 "reuse-existing-ducts":"Existing ducts reused",
 "replace-or-build-ducts":"New / substantially replaced ductwork",
 "ductless":"Ductless mini-split",
 "mixed":"Mixed ducted and ductless",
};
const statusName=(s:Answer)=>s==="yes"?"Reported yes":s==="no"?"Reported no":"Not documented";

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
  inMassachusetts:initial.inMassachusetts,residentialAccount:initial.residentialAccount,propertyUnits:initial.propertyUnits,
  residentialSponsorConfirmed:initial.residentialSponsorConfirmed,winterOccupied:initial.winterOccupied,
  hasOldHeatPump:initial.hasOldHeatPump,displacesPrimaryHeating:initial.displacesPrimaryHeating,
  wholeWeatherization:initial.wholeWeatherization,wholeFormSigned:initial.wholeFormSigned,
  fossilHeatingRemains:initial.fossilHeatingRemains,partialIntegratedControls:initial.partialIntegratedControls,
  removedFuelEvidence:initial.removedFuelEvidence,
 });
 const [quotes,setQuotes]=useState<MassQuote[]>([newMassQuote("a"),newMassQuote("b")]);
 const [timeline,setTimeline]=useState<TimelineEvidence>({installationDate:"",submissionDate:""});
 const [equipment,setEquipment]=useState<Partial<Record<MassQuote["id"],EquipmentEvidence>>>({});
 const [hpqpl,setHpqpl]=useState<HPQPLCatalog|null>(null);
 const evidenceFor=(id:MassQuote["id"])=>equipment[id]??blankEquipment();
 const updateEquipment=<K extends keyof EquipmentEvidence>(id:MassQuote["id"],key:K,value:EquipmentEvidence[K])=>
  setEquipment(old=>({...old,[id]:{...blankEquipment(),...old[id],[key]:value}}));
 const [copyMessage,setCopyMessage]=useState("");
 const [feedback,setFeedback]=useState<null|boolean>(null);
 const [hasQuotes,setHasQuotes]=useState<null|boolean>(null);
 const set=<K extends keyof Common>(k:K,value:Common[K])=>setCommon(old=>({...old,[k]:value}));
 const updateBid=<K extends keyof MassQuote>(id:MassQuote["id"],key:K,value:MassQuote[K])=>
  setQuotes(old=>old.map(q=>q.id===id?{...q,[key]:value}:q));
 const applyImported=(id:MassQuote["id"],patch:ProposalPatch)=>{
   setQuotes(old=>old.map(q=>q.id!==id?q:{
     ...q,
     ...(typeof patch.price==="number"?{price:patch.price}:{}),
     ...(typeof patch.rebate==="number"?{proposedRebate:patch.rebate}:{}),
     ...(typeof patch.coolingCapacityBtu==="number"?{coolingCapacityBtu:patch.coolingCapacityBtu}:{}),
     ...(patch.scope?{scope:patch.scope==="new-ductwork"?"replace-or-build-ducts":patch.scope as ProposalScope}:{}),
     ...(patch.priceBasis?{priceBasis:patch.priceBasis as PriceBasis}:{})
   }));
   if(typeof patch.ahriReference==="string"||typeof patch.outdoorModel==="string"||typeof patch.indoorModel==="string")
    setEquipment(old=>({...old,[id]:{...blankEquipment(),...old[id],
      ...(typeof patch.ahriReference==="string"?{ahriReference:patch.ahriReference}:{}),
      ...(typeof patch.outdoorModel==="string"?{outdoorModel:patch.outdoorModel}:{}),
      ...(typeof patch.indoorModel==="string"?{indoorModel:patch.indoorModel}:{})
    }}));
 };
 const hpqplMatches=useMemo(()=>Object.fromEntries(quotes.map(q=>[q.id,matchHPQPL(hpqpl,equipment[q.id]??blankEquipment())])) as Partial<Record<MassQuote["id"],HPQPLMatch>>,[quotes,hpqpl,equipment]);
 const comparison=useMemo(()=>{
  try{
   const audit=auditMassachusettsProposals(common,quotes,equipment,timeline,hpqpl?hpqplMatches:undefined);
   return {result:audit.comparison,audit,error:""};
  }catch(err){return {result:null,audit:null,error:err instanceof Error?err.message:"Invalid quote"}}
 },[common,quotes,equipment,timeline,hpqpl,hpqplMatches]);
 const customerReport=()=>comparison.result&&comparison.audit?
    massCopyPlan(comparison.result)+"\n\n"+massAuditReport(comparison.audit,equipment,timeline)+"\n\n"+quotes.map(q=>hpqplMatchReport(q.id.toUpperCase(),hpqplMatches[q.id]!,hpqpl)).join("\n\n"):"";
 const copy=async()=>{
  if(!comparison.result)return;
  try{await navigator.clipboard.writeText(customerReport());track("mass_quote_report_copied");setCopyMessage("Comparison copied; no quote files or address were uploaded.");}
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
    {commonChoice("inMassachusetts","ma-in-state","Is this property in Massachusetts?")}
    {commonChoice("residentialAccount","ma-residential","Is this a residential utility account?")}
    <Choice id="ma-units" label="Building size" value={common.propertyUnits} options={[{value:"unsure",label:"Not sure"},{value:"one-four",label:"1–4 residential units"},{value:"five-plus",label:"5+ units — special program review needed"}]} onChange={v=>set("propertyUnits",v as Common["propertyUnits"])}/>
    <Choice id="ma-year" label="Expected installation year" value={common.year} options={[{value:"unknown",label:"Not yet known"},{value:"2026",label:"2026 — published program"},{value:"2027",label:"2027 — announced changes only"}]} onChange={v=>set("year",v as MassYear)}/>
     <div className="ma-field"><label htmlFor="ma-install-date">Planned or actual equipment installation date</label>
      <p>Use the installation schedule, not the date the proposal was signed.</p>
      <input id="ma-install-date" type="date" value={timeline.installationDate}
       onChange={e=>setTimeline(old=>({...old,installationDate:e.target.value}))}/></div>
     <div className="ma-field"><label htmlFor="ma-submit-date">Planned rebate submission date (optional)</label>
      <p>2026 installations have a published February 28, 2027 document receipt deadline.</p>
      <input id="ma-submit-date" type="date" value={timeline.submissionDate}
       onChange={e=>setTimeline(old=>({...old,submissionDate:e.target.value}))}/></div>
    <Choice id="ma-route" label="How will the heat pump be used?" value={common.route} options={[{value:"unsure",label:"Not yet decided"},{value:"whole",label:"Whole-home — sole heating and cooling"},{value:"partial",label:"Partial-home — supplemental heating"},{value:"basic",label:"Basic — replacement heat pump / new cooling / addition"}]} onChange={v=>set("route",v as MassRoute)}/>
    <Choice id="ma-fuel" label="What heats the home today?" value={common.heatingFuel} options={[{value:"unsure",label:"Need to confirm"},{value:"oil",label:"Heating oil"},{value:"propane",label:"Propane"},{value:"electric-resistance",label:"Electric resistance / baseboards"},{value:"natural-gas",label:"Natural gas"},{value:"existing-heat-pump",label:"Existing heat pump"},{value:"other",label:"Another fuel / other"}]} onChange={v=>set("heatingFuel",v as HeatingFuel)}/>
   </div>
   <details className="ma-progressive">
    <summary>Check additional Mass Save eligibility conditions (when you have documents)</summary>
    <p className="ma-muted">Unanswered questions remain unverified, not automatically eligible.</p>
    <div className="ma-form-grid">
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
   </details>
   <p className="ma-note">Income-qualified and turnkey programs can offer larger support but require separate income verification, weatherization and program review. This calculator intentionally does not estimate household income eligibility. <a href={MASS_SOURCES.enhanced.url} target="_blank" rel="noreferrer">Check enhanced incentives ↗</a></p>
  </section>
  <section className="ma-card" id="ma-bids">
   <div className="ma-head"><span className="ma-step">2</span><h2>Compare contractor proposals</h2></div>
   <p className="ma-muted">Enter quoted amounts and written evidence, not contractor names or customer addresses. Different equipment systems can have different AHRI capacities and rebate schedule examples.</p>
   <div className="ma-bids">{quotes.map(q=><article className="ma-bid" key={q.id}>
    <div className="ma-bid-top"><h3>Quote {q.id.toUpperCase()}</h3><span>Independent proposal</span></div>
    <div className="ma-bid-fields">
     <Money id={"ma-"+q.id+"-price"} label="Installed quoted price ($)" value={q.price} onChange={v=>updateBid(q.id,"price",v)}/>
     <Choice id={"ma-"+q.id+"-scope"} label="Scope of this proposal" value={q.scope} options={[
       {value:"unknown",label:"Not documented"},{value:"reuse-existing-ducts",label:"Ducted, reuse existing ducts"},
       {value:"replace-or-build-ducts",label:"Ducted, new or substantially rebuilt ducts"},
       {value:"ductless",label:"Ductless mini-splits"},{value:"mixed",label:"Mixed ducted + ductless"}]}
       onChange={v=>updateBid(q.id,"scope",v as ProposalScope)}/>
     <Choice id={"ma-"+q.id+"-basis"} label="Does this price already include a rebate?" value={q.priceBasis} options={[{value:"unsure",label:"Don't know"},{value:"before-rebate",label:"Before rebate"},{value:"after-rebate",label:"After rebate"}]} onChange={v=>updateBid(q.id,"priceBasis",v as PriceBasis)}/>
     <Money id={"ma-"+q.id+"-rebate"} label="Rebate amount claimed by contractor ($)" value={q.proposedRebate} onChange={v=>updateBid(q.id,"proposedRebate",v)}/>
     <Money id={"ma-"+q.id+"-capacity"} label="AHRI cooling capacity (BTU/h)" hint="E.g., 36,000 BTU/h = 3 tons. Not the heating capacity or marketing model size." value={q.coolingCapacityBtu} onChange={v=>updateBid(q.id,"coolingCapacityBtu",v)}/>
    </div>
     <ProposalTextImporter quoteLabel={"quote-"+q.id} allowedKeys={["price","rebate","coolingCapacityBtu","scope","priceBasis","ahriReference","outdoorModel","indoorModel"]}
       onApply={patch=>applyImported(q.id,patch)}/>
    <details className="ma-progressive ma-bid-details">
     <summary>Review rebate evidence, permits, equipment and warranties</summary>
     <p className="ma-muted">Enter exact paired equipment identifiers from the contractor proposal or AHRI certificate. This does not independently verify product approval; serial numbers are not collected.</p>
     <div className="ma-bid-fields">
      {([
       ["ahriReference","AHRI certificate / reference number"],
       ["outdoorModel","Outdoor unit model number"],
       ["indoorModel","Indoor unit model number"]
      ] as const).map(([key,label])=><div className="ma-field" key={key}>
       <label htmlFor={"ma-"+q.id+"-"+key}>{label}</label>
       <input type="text" id={"ma-"+q.id+"-"+key} maxLength={80}
        value={evidenceFor(q.id)[key]} placeholder="Exact model or certificate ID"
        onChange={e=>updateEquipment(q.id,key,e.target.value)}/>
      </div>)}
      <Choice id={"ma-"+q.id+"-refrigerant"} label="Proposed refrigerant GWP category"
       value={evidenceFor(q.id).refrigerant} options={[
        {value:"unsure",label:"Not verified"},{value:"at-most-700",label:"GWP at most 700 (self-reported)"},
        {value:"r410a",label:"R-410A / high GWP"},{value:"other-over-700",label:"Other GWP above 700"}]}
       onChange={v=>updateEquipment(q.id,"refrigerant",v as RefrigerantClass)}/>
      <Choice id={"ma-"+q.id+"-system"} label="Equipment configuration"
       value={evidenceFor(q.id).systemClass} options={[
        {value:"unsure",label:"Not verified"},{value:"split",label:"Indoor/outdoor split system"},
        {value:"vrf",label:"Variable refrigerant flow (VRF)"},
        {value:"self-contained",label:"Factory-charged packaged product"}]}
       onChange={v=>updateEquipment(q.id,"systemClass",v as SystemClass)}/>
     {bidChoice(q,"rebateDocumentation","Written rebate confirmation exists?")}
     {bidChoice(q,"installerInNetwork","Installer appears in Mass Save Heat Pump Installer Network?")}
     {bidChoice(q,"equipmentOnQualifiedList","Exact paired system appears on Mass Save qualified list?")}
     {bidChoice(q,"newEquipment","New equipment confirmed?")}
     {bidChoice(q,"permitsAndElectrical","Permits and electrical changes itemized?")}
     {bidChoice(q,"loadCalculationProvided","Manual J heat-load/sizing documentation provided?")}
     {bidChoice(q,"scopeAndEquipmentIdentified","Equipment model IDs and scope documented?")}
     {bidChoice(q,"warrantyInWriting","Equipment/workmanship warranties in writing?")}
     {bidChoice(q,"commissioningIncluded","Startup commissioning and written performance check included?")}
     {bidChoice(q,"ductAirflowTestingIncluded","Airflow or duct leakage testing included (where applicable)?")}
     {bidChoice(q,"oldSystemRemovalIncluded","Existing heating equipment removal and disposal included?")}
     </div>
    </details>
   </article>)}</div>
   <div className="ma-buttons">{quotes.length<3?<button type="button" onClick={()=>setQuotes(x=>[...x,newMassQuote("c")])}>Add third quote</button>:
    <button type="button" onClick={()=>setQuotes(x=>x.slice(0,2))}>Remove third quote</button>}
    <a href={MASS_SOURCES.products.url} target="_blank" rel="noreferrer" onClick={()=>track("mass_qualified_products_click")}>Check qualified heat pumps ↗</a></div>
  </section>
  <section className="ma-card" id="ma-results" aria-live="polite">
   <div className="ma-head"><span className="ma-step">3</span><h2>Results, cost comparison and questions</h2></div>
   {comparison.error?<p role="alert" className="ma-warning">{comparison.error}</p>:comparison.result&&<>
    <div className="ma-quick-next" aria-label="Massachusetts immediate decision summary">
      <h3>Your priority next action</h3>
      <p><strong>{comparison.result.scopeDifferences.length>0?
        "Ask the contractors to resolve material scope differences.":
        comparison.result.comparablePriceGap===null?
        "Confirm the bids use the same scope and before/after-rebate basis.":
        "Verify written program conditions and the complete contract before choosing."}</strong></p>
      <p>There are {comparison.result.quotes.length} reported proposals. These figures are not approved Mass Save awards; a lower entered price never certifies equipment, contractor or program eligibility.</p>
      <a href="#ma-bids">Return to proposal inputs <span aria-hidden="true">↑</span></a>
    </div>
    {comparison.audit&&<section className="ma-proposal-audit" aria-label="Massachusetts installation and equipment verification">
 <h3>Installation date and exact equipment checks</h3>
 <p><strong>Reported period:</strong> {comparison.audit.timeline.status==="2026"?"2026 published incentive schedule":
 comparison.audit.timeline.status==="2027-announced"?"2027 announced whole/partial rates only":
 comparison.audit.timeline.status==="unsupported"?"Outside supported rate periods":"Not established"}.
 Source reviewed {MASS_AUDIT_REVIEWED}; these findings are not official product approval or funding.</p>
 {comparison.audit.timeline.problems.map(x=><p className="ma-warning" key={x}>{x}</p>)}
 <MassHPQPLImporter catalog={hpqpl} onChange={setHpqpl}/>
 <div className="ma-equipment-grid">{comparison.audit.quotes.map(f=><article key={f.id}>
  <h4>Quote {f.id.toUpperCase()} — {f.readiness==="blocked"?"Reported system barrier":
   f.readiness==="reported-ready"?"Conditions self-reported":"System verification pending"}</h4>
  <p>AHRI: {equipment[f.id]?.ahriReference||"not entered"}; outdoor: {equipment[f.id]?.outdoorModel||"not entered"}; indoor: {equipment[f.id]?.indoorModel||"not entered"}.</p>
  <div className="ma-hpqpl-match"><strong>Workbook match: {hpqplMatches[f.id]?.status??"no-data"}</strong>
    <p>{hpqplMatches[f.id]?.reason}</p>
    {hpqplMatches[f.id]?.rows.map(r=><p key={r.sheet+"-"+r.line}>Sheet {r.sheet}, row {r.line}; {r.rebateType||"rebate category unknown"}; cooling {r.coolingBtu===null?"not established":r.coolingBtu.toLocaleString("en-US")+" BTU/h"}.</p>)}
   </div>
  <ul>{f.risks.map(x=><li key={x}>{x}</li>)}</ul>
 </article>)}</div>
 <h4>Required documents and next questions</h4>
 <ul>{comparison.audit.timeline.documents.map(x=><li key={x}>{x}</li>)}</ul>
 <details><summary>Priority contractor follow-ups</summary>
  <ol>{comparison.audit.priorityQuestions.map((x,i)=><li key={i}>{x}</li>)}</ol></details>
 <p><a href={MA_AUDIT_SOURCES.equipment} target="_blank" rel="noreferrer">Check the paired system in Mass Save's qualified-products list ↗</a></p>
</section>}
{comparison.result.scopeDifferences.length>0&&<section className="ma-scope-warning" aria-label="Material contractor scope differences">
      <h3>These bids do not cover identical documented work</h3>
      <p>The following items are explicitly marked included in at least one bid and excluded in another. Resolve them before ranking prices:</p>
      <ul>{comparison.result.scopeDifferences.map(label=><li key={label}>{label}</li>)}</ul>
    </section>}
    <div className="ma-matrix-scroll"><table className="ma-matrix" aria-label="Massachusetts contractor proposal coverage comparison">
     <caption>Side-by-side scope and documentation — all information is self-reported, not certified.</caption>
     <thead><tr><th scope="col">Comparison item</th>{comparison.result.quotes.map(e=><th scope="col" key={e.quote.id}>Quote {e.quote.id.toUpperCase()}</th>)}</tr></thead>
     <tbody>{[
       {label:"Proposed installation scope",values:comparison.result.quotes.map(e=>scopeNames[e.quote.scope])},
       {label:"AHRI reference (self-reported)",values:comparison.result.quotes.map(e=>equipment[e.quote.id]?.ahriReference||"Not entered")},
       {label:"Indoor/outdoor model IDs",values:comparison.result.quotes.map(e=>
        (equipment[e.quote.id]?.indoorModel||"Not entered")+" / "+(equipment[e.quote.id]?.outdoorModel||"Not entered"))},
       {label:"HPQPL workbook match",values:comparison.result.quotes.map(e=>hpqplMatches[e.quote.id]?.status??"no-data")},
       {label:"Equipment evidence status",values:comparison.result.quotes.map(e=>{
        const f=comparison.audit?.quotes.find(x=>x.id===e.quote.id);
        return f?.readiness==="blocked"?"Reported equipment barrier":f?.readiness==="reported-ready"?
          "Reported only — official check needed":"Identity/list verification needed";
       })},
       {label:"As-quoted total",values:comparison.result.quotes.map(e=>currency(e.statedPrice))},
       {label:"Rebate already in quoted total?",values:comparison.result.quotes.map(e=>e.quote.priceBasis==="before-rebate"?"No — before rebate":e.quote.priceBasis==="after-rebate"?"Yes — after rebate":"Unknown")},
       {label:"Equipment models and scope",values:comparison.result.quotes.map(e=>statusName(e.quote.scopeAndEquipmentIdentified))},
       {label:"Heat-load sizing / Manual J",values:comparison.result.quotes.map(e=>statusName(e.quote.loadCalculationProvided))},
       {label:"Permits and electrical scope",values:comparison.result.quotes.map(e=>statusName(e.quote.permitsAndElectrical))},
       {label:"Installer network",values:comparison.result.quotes.map(e=>statusName(e.quote.installerInNetwork))},
       {label:"Qualified heat-pump system",values:comparison.result.quotes.map(e=>statusName(e.quote.equipmentOnQualifiedList))},
       {label:"Equipment & labor warranty",values:comparison.result.quotes.map(e=>statusName(e.quote.warrantyInWriting))},
       {label:"Written rebate confirmation",values:comparison.result.quotes.map(e=>statusName(e.quote.rebateDocumentation))},
       {label:"Startup commissioning included",values:comparison.result.quotes.map(e=>statusName(e.quote.commissioningIncluded))},
       {label:"Duct/airflow testing included",values:comparison.result.quotes.map(e=>statusName(e.quote.ductAirflowTestingIncluded))},
       {label:"Old equipment removal included",values:comparison.result.quotes.map(e=>statusName(e.quote.oldSystemRemovalIncluded))},
       {label:"Conditional after-rebate illustration",values:comparison.result.quotes.map(e=>currency(e.conditionalPostRebate))},
     ].map(row=><tr key={row.label}><th scope="row">{row.label}</th>{row.values.map((value,i)=><td key={comparison.result!.quotes[i].quote.id}>{value}</td>)}</tr>)}</tbody>
    </table></div>
    <div className="ma-results">{comparison.result.quotes.map(e=><article className="ma-result" key={e.quote.id}>
     <p className="ma-eyebrow">QUOTE {e.quote.id.toUpperCase()}</p>
     <span className={"ma-status "+e.program.status}>{e.program.status==="requirements-reported"?"Prerequisites self-reported":e.program.status==="schedule-only"?"2027 amounts only":e.program.status==="not-supported"?"Reported eligibility barrier":"Verification needed"}</span>
     <div className="ma-price"><small>As-quoted installation amount</small><strong>{currency(e.statedPrice)}</strong></div>
     <div className="ma-price"><small>Published schedule arithmetic (not an award)</small><strong>{currency(e.program.theoreticalScheduleAmount)}</strong></div>
     <div className="ma-price"><small>Conditional post-rebate illustration, only with written confirmation</small><strong>{currency(e.conditionalPostRebate)}</strong></div>
     <p className="ma-muted">Project documentation: {e.itemsDocumented} of 7 items marked confirmed in writing.</p>
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
     <button type="button" onClick={()=>{if(comparison.result){downloadTextReport("massachusetts-quote-review",customerReport());track("mass_quote_report_downloaded")}}}>Download report (.txt)</button>
     <a href={MASS_SOURCES.air.url} target="_blank" rel="noreferrer" onClick={()=>track("mass_save_program_click")}>Official Mass Save rebate rules ↗</a>
    </div>
    {copyMessage&&<p role="status" className="ma-muted">{copyMessage}</p>}
   </>}
  </section>
  <section className="ma-card ma-feedback"><h2>Do you already have multiple contractor quotes?</h2>
   <p className="ma-muted">This is an anonymous buyer-intent question, not a quote upload or sales lead. It records only your answer.</p>
   <div className="ma-buttons">
    <button type="button" aria-pressed={hasQuotes===true} onClick={()=>{setHasQuotes(true);track("mass_multiple_quotes_yes")}}>Yes, two or more</button>
    <button type="button" aria-pressed={hasQuotes===false} onClick={()=>{setHasQuotes(false);track("mass_multiple_quotes_no")}}>Not yet</button>
    {hasQuotes!==null&&<span role="status">Thanks for answering.</span>}
   </div>
   <h3>Independent review is also available</h3>
   <p className="ma-muted">Mass Save says residential customers can book a decarbonization consultation to review multiple heat-pump bids. Certain municipal-light-plant programs also offer free human quote comparisons. Our self-service calculations are not a substitute for an expert evaluation.</p>
   <div className="ma-buttons"><a href="https://www.masssave.com/frequently-asked-questions" target="_blank" rel="noreferrer" onClick={()=>track("mass_official_quote_help_click")}>Official Mass Save quote-review guidance ↗</a></div>
   <h2>Did this help you compare proposals?</h2><p className="ma-muted">We count only yes/no feedback, not your quote amounts or personal information.</p>
    <div className="ma-buttons"><button type="button" aria-pressed={feedback===true} onClick={()=>{setFeedback(true);track("mass_quote_helpful_yes")}}>Yes</button><button type="button" aria-pressed={feedback===false} onClick={()=>{setFeedback(false);track("mass_quote_helpful_no")}}>No</button>{feedback!==null&&<span role="status">Thank you.</span>}</div>
  </section>
  <section className="ma-sources"><h2>Official source references</h2><p>Reviewed {MASS_REVIEWED_ON}. Rules and program funding can change; compare source publication dates before relying on money.</p>
   <ul>{Object.entries(MASS_SOURCES).map(([id,s])=><li key={id}><a href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a></li>)}</ul>
  </section>
  <footer className="ma-footer">Independent research prototype · Not affiliated with Mass Save or utility sponsors · No affiliate relationship or contractor referral fees · No addresses, contractor names, proposals or other private data collected · No guaranteed rebates or energy savings.</footer>
 </main>;
}
