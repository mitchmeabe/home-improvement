"use client";
import {useMemo,useRef,useState} from "react";
import {parseProposalText,type ProposalKey,type ProposalCandidate} from "../lib/proposal-text-import";
import {extractProposalPdf,MAX_PDF_BYTES} from "../lib/proposal-pdf-client";
import "./proposal-text-import.css";

export type ProposalPatch=Partial<Record<ProposalKey,ProposalCandidate["value"]>>;
const labels:Record<ProposalKey,string>={
 price:"Installed total",rebate:"Stated rebate",coolingCapacityBtu:"AHRI cooling capacity",
 scope:"Installation scope",priceBasis:"Before/after rebate status",
 ahriReference:"AHRI reference (not approval)",outdoorModel:"Outdoor unit model",indoorModel:"Indoor unit model"
};

/** The pasted or selected .txt file never leaves the current browser session. */
export function ProposalTextImporter({quoteLabel,onApply,allowedKeys}:{
 quoteLabel:string;onApply:(patch:ProposalPatch)=>void;allowedKeys:readonly ProposalKey[];
}){
 const [text,setText]=useState("");
 const [loading,setLoading]=useState(false);
 const requestRef=useRef(0);
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
   const token=++requestRef.current;
   setSelected({});
   setLoading(false);
   const ext=file.name.toLowerCase();
   const pdf=ext.endsWith(".pdf");
   if((!pdf&&!ext.endsWith(".txt"))||(pdf&&(file.size<8||file.size>MAX_PDF_BYTES))||(!pdf&&file.size>60000)){
     setMessage("Choose a plain .txt file (under 60 KB) or a text-based PDF (under 5 MB and up to 12 pages).");
     return;
   }
   setLoading(true);
   setMessage("Reading in this browser. Proposal data is not uploaded.");
   try{
     if(pdf){
       const out=await extractProposalPdf(file);
       if(requestRef.current!==token)return;
       setText(out.text);
       setMessage("Read "+out.pages+" PDF page(s) and "+out.characters+" text characters locally."+
         (out.truncated?" Only the first 25,000 characters were extracted; verify missing pages or details.":"")+
         " Select only the candidates that the document actually supports.");
     }else{
       const out=(await file.text()).slice(0,25001);
       if(requestRef.current!==token)return;
       setText(out);
       setMessage("Plain text loaded in this browser only. Review the extracted fields.");
     }
   }catch(error){
     if(requestRef.current===token){
       setText("");
       setSelected({});
       setMessage(error instanceof Error&&
         (/too many pages|No readable text layer|PDF must|valid PDF header|Choose a PDF/.test(error.message))
         ?error.message:"Unable to extract this PDF locally. Try copying text manually or use a simple .txt export.");
     }
   }finally{if(requestRef.current===token)setLoading(false)}
 };
 return <details className="proposal-import">
   <summary>Paste or load redacted proposal text for {quoteLabel} (optional)</summary>
   <div className="proposal-import-body">
     <p>Paste redacted text, select a plain <strong>.txt</strong> file, or import a <strong>text-based PDF</strong> (5 MB / 12 pages max). PDF extraction runs locally in this browser using a bundled text parser; no upload, AI processing, OCR, storage or content analytics. Files may contain private information, so use only documents you are comfortable opening on this device. Scanned/image-only PDFs are not supported.</p>
     <label htmlFor={"proposal-text-"+quoteLabel}>Redacted contractor proposal text</label>
     <textarea id={"proposal-text-"+quoteLabel} rows={5} value={text}
       placeholder="Total installed price: $18,500&#10;Reuse existing ducts&#10;AHRI cooling capacity: 36,000 BTU/h"
       onChange={e=>{requestRef.current++;setLoading(false);setText(e.target.value);setSelected({});setMessage("");}}/>
     <label className="proposal-file">Or load text-based PDF / plain text (.pdf, .txt)
       <input type="file" accept=".pdf,application/pdf,.txt,text/plain" onChange={e=>void load(e.target.files?.[0])}/>
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
     <button type="button" disabled={checked.length===0||loading} onClick={apply}>Apply {checked.length} confirmed field(s) to {quoteLabel}</button>
     {loading&&<p role="status">Extracting PDF text on your device…</p>}
     {message&&!loading&&<p role="status">{message}</p>}
   </div>
 </details>;
}
