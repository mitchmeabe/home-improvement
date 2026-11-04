"use client";
import {useMemo,useState} from "react";
import {parseProposalText,type ProposalKey,type ProposalCandidate} from "../lib/proposal-text-import";
import "./proposal-text-import.css";

export type ProposalPatch=Partial<Record<ProposalKey,ProposalCandidate["value"]>>;
const labels:Record<ProposalKey,string>={
 price:"Installed total",rebate:"Stated rebate",coolingCapacityBtu:"AHRI cooling capacity",
 scope:"Installation scope",priceBasis:"Before/after rebate status"
};

/** The pasted or selected .txt file never leaves the current browser session. */
export function ProposalTextImporter({quoteLabel,onApply,allowedKeys}:{
 quoteLabel:string;onApply:(patch:ProposalPatch)=>void;allowedKeys:readonly ProposalKey[];
}){
 const [text,setText]=useState("");
 const [selected,setSelected]=useState<Partial<Record<ProposalKey,boolean>>>({});
 const [message,setMessage]=useState("");
 const review=useMemo(()=>parseProposalText(text),[text]);
 const available=review.candidates.filter(c=>allowedKeys.includes(c.key));
 const checked=available.filter(c=>selected[c.key]);
 const apply=()=>{
   if(!checked.length)return;
   const patch:ProposalPatch={};
   for(const c of checked)patch[c.key]=c.value;
   onApply(patch);
   setMessage("Applied "+checked.length+" confirmed field(s) to "+quoteLabel+". Recheck the comparison below.");
 };
 const load=async(file:File|undefined)=>{
   if(!file)return;
   if(!file.name.toLowerCase().endsWith(".txt")||file.size>60000){
     setMessage("Only plain .txt files smaller than 60 KB are supported. PDFs and scans are not imported.");
     return;
   }
   setText((await file.text()).slice(0,25001));
   setSelected({});
   setMessage("Text loaded in this browser only. Review the extracted fields.");
 };
 return <details className="proposal-import">
   <summary>Paste or load redacted proposal text for {quoteLabel} (optional)</summary>
   <div className="proposal-import-body">
     <p>Paste text from a proposal or select a <strong>.txt</strong> file. Remove addresses, names, account numbers, phone numbers and signatures first. No server upload, AI processing, browser storage or analytics of proposal contents. PDFs and scans are not supported yet.</p>
     <label htmlFor={"proposal-text-"+quoteLabel}>Redacted contractor proposal text</label>
     <textarea id={"proposal-text-"+quoteLabel} rows={5} value={text}
       placeholder="Total installed price: $18,500&#10;Reuse existing ducts&#10;AHRI cooling capacity: 36,000 BTU/h"
       onChange={e=>{setText(e.target.value);setSelected({});setMessage("");}}/>
     <label className="proposal-file">Or load plain text (.txt)
       <input type="file" accept=".txt,text/plain" onChange={e=>void load(e.target.files?.[0])}/>
     </label>
     {review.warnings.map((w,i)=><p className="proposal-warning" key={i}>{w}</p>)}
     {available.length>0?<fieldset>
       <legend>Review extracted candidates — select only what the written proposal proves</legend>
       {available.map(c=><label className="proposal-choice" key={c.key}>
         <input type="checkbox" checked={!!selected[c.key]} onChange={e=>setSelected(s=>({...s,[c.key]:e.target.checked}))}/>
         <span><strong>{labels[c.key]}: {String(c.value)}</strong><small>Found: {c.evidence}</small></span>
       </label>)}
     </fieldset>:text.length>0&&<p>No unambiguous supported fields were detected. Enter details manually.</p>}
     {review.mentions.length>0&&<div className="proposal-mentions">
       <strong>Topics mentioned, not confirmed as included</strong>
       <ul>{review.mentions.map(m=><li key={m.label}>{m.label}: <em>{m.evidence}</em></li>)}</ul>
     </div>}
     <button type="button" disabled={checked.length===0} onClick={apply}>Apply {checked.length} confirmed field(s) to {quoteLabel}</button>
     {message&&<p role="status">{message}</p>}
   </div>
 </details>;
}
