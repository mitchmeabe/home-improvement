"use client";
import {useEffect,useRef,useState} from "react";
import {
 lookupPortlandJurisdiction,PORTLAND_GIS_LAYER,PORTLAND_GIS_GUIDE,PORTLAND_MAPS,
 type GISResult,type OfficialJurisdictionEvidence
} from "../lib/portland-jurisdiction-gis";
import "./portland-address-jurisdiction-check.css";
export function PortlandAddressJurisdictionCheck({
 onAccepted,onInvalidated,activeEvidence
}:{
 onAccepted:(result:GISResult)=>void;onInvalidated:()=>void;
 activeEvidence:OfficialJurisdictionEvidence|null;
}){
 const [street,setStreet]=useState("");
 const [unit,setUnit]=useState("");
 const [zip,setZip]=useState("");
 const [result,setResult]=useState<GISResult|null>(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const visibleResult=result?.evidence&&result.evidence!==activeEvidence?null:result;
 const controller=useRef<AbortController|null>(null);
 const generation=useRef(0);
 useEffect(()=>()=>{controller.current?.abort();generation.current++;},[]);
 const invalidate=()=>{
  generation.current++;
  controller.current?.abort();
  controller.current=null;
  setBusy(false);
  setResult(null);
  setMessage("");
  onInvalidated();
 };
 const clear=()=>{
  invalidate();setStreet("");setUnit("");setZip("");
  setMessage("Address input and any prior jurisdiction match cleared from this page.");
 };
 const verify=async()=>{
  controller.current?.abort();
  const token=++generation.current;
  const ctrl=new AbortController();
  controller.current=ctrl;
  onInvalidated();
  setResult(null);
  setBusy(true);
  setMessage("Checking active city GIS address points; the address is sent directly to the City of Portland.");
  try{
   const next=await lookupPortlandJurisdiction(street,unit,zip,ctrl.signal);
   if(token!==generation.current)return;
   setResult(next);
   if(next.evidence)onAccepted(next);
   else if(next.status==="outside-oregon")onAccepted(next);
   setMessage(next.reason);
   if(next.evidence||next.status==="outside-oregon"){
    // The original address is no longer needed once its classification is known.
    setStreet("");setUnit("");setZip("");
   }
  }catch(e){
   if(token!==generation.current)return;
   setMessage(e instanceof Error?e.message:"Unable to read this address. Use the official PortlandMaps search instead.");
  }finally{
   if(token===generation.current){setBusy(false);controller.current=null;}
  }
 };
 return <section className="city-jurisdiction" aria-labelledby="city-jurisdiction-heading">
  <h3 id="city-jurisdiction-heading">Look up actual city jurisdiction (optional)</h3>
  <p>Enter a numbered street address, then click Check. We query Portland's official active-address records rather than assuming a Portland mailing city is within Portland city limits. This lookup does not prove the dwelling classification or issue a permit.</p>
  <div className="city-jurisdiction-grid">
   <label htmlFor="city-address">Street address
    <input id="city-address" type="text" autoComplete="off" spellCheck={false}
     placeholder="1120 SW 5th Ave" maxLength={120} value={street}
     onChange={e=>{invalidate();setStreet(e.target.value);}}/></label>
   <label htmlFor="city-unit">Unit (optional)
    <input id="city-unit" type="text" autoComplete="off" spellCheck={false}
     placeholder="200" maxLength={12} value={unit}
     onChange={e=>{invalidate();setUnit(e.target.value);}}/></label>
   <label htmlFor="city-zip">ZIP (optional)
    <input id="city-zip" type="text" inputMode="numeric" autoComplete="off"
     placeholder="97204" maxLength={5} value={zip}
     onChange={e=>{invalidate();setZip(e.target.value);}}/></label>
  </div>
  <p className="city-jurisdiction-privacy">
   <strong>Privacy:</strong> This runs only when you click Check. House number, street and optional unit/ZIP are sent <strong>directly from your browser to PortlandMaps GIS</strong>, not through this site's server; the City may log the request. Our site does not save your address or put it into the exported dossier. The address is cleared after a successful match.
  </p>
  <div className="city-jurisdiction-actions">
   <button type="button" disabled={busy||!street.trim()} onClick={()=>void verify()}>
    {busy?"Checking official records…":"Check City GIS jurisdiction"}</button>
   <button type="button" className="city-jurisdiction-secondary" onClick={clear}>Clear address and result</button>
   <a href={PORTLAND_MAPS} target="_blank" rel="noreferrer">Check the parcel manually</a>
  </div>
  {message&&(!result?.evidence||visibleResult)&&<p className="city-jurisdiction-message" role={visibleResult?.evidence?"status":"alert"}>{message}</p>}
  {visibleResult?.evidence&&<div className="city-jurisdiction-success" role="status">
   <strong>Official address-point result: {visibleResult.jurisdiction}</strong>
   <p>{visibleResult.matchedRecords} active matching address record{visibleResult.matchedRecords===1?"":"s"}, lookup dated {visibleResult.checkedOn}. The dossier now uses this GIS-supported jurisdiction rather than a manually selected mailing city. Confirm the exact parcel on PortlandMaps before filing permits.</p>
   <p><a href={PORTLAND_GIS_LAYER} target="_blank" rel="noreferrer">Open City source layer</a>
    {visibleResult.propertyUrl&&<> · <a href={visibleResult.propertyUrl} target="_blank" rel="noreferrer">Inspect matching property record</a></>}</p>
  </div>}
  {(visibleResult&&!visibleResult.evidence)&&<div className="city-jurisdiction-unresolved">
   <strong>{visibleResult.status==="outside-oregon"?"Address outside Oregon":visibleResult.status==="ambiguous"?"Multiple or conflicting records":visibleResult.status==="not-found"?"No exact address-point match":"GIS lookup not available"}</strong>
   <p>This result does not independently confirm Portland jurisdiction. Review the address and official property page rather than selecting a nearby match.</p>
  </div>}
  <p className="city-jurisdiction-foot"><a href={PORTLAND_GIS_GUIDE} target="_blank" rel="noreferrer">City instructions for interpreting Jurisdiction</a>. We do not use an unverified geocoder, census ZIP mapping, location permission, or utility-account inference.</p>
 </section>;
}
