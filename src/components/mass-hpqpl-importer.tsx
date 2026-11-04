"use client";
import {useRef,useState} from "react";
import {normalizeHPQPLWorkbook,HPQPL_PAGE,HPQPL_XLSX,
 type HPQPLCatalog,type HPQPLCell} from "../lib/mass-hpqpl";
import "./mass-hpqpl-importer.css";

/** Parses the public HPQPL workbook on the visitor's device; nothing uploaded. */
export function MassHPQPLImporter({catalog,onChange}:{catalog:HPQPLCatalog|null;onChange:(v:HPQPLCatalog|null)=>void}){
 const [message,setMessage]=useState("");
 const [working,setWorking]=useState(false);
 const generation=useRef(0);
 const load=async(file:File|undefined)=>{
  if(!file)return;
  const token=++generation.current;
  onChange(null);
  if(!file.name.toLowerCase().endsWith(".xlsx")||file.size<100||file.size>20*1024*1024){
   setMessage("Choose the downloaded .xlsx workbook (100 bytes to 20 MB).");return;
  }
  setWorking(true);setMessage("Reading workbook locally; no file is uploaded.");
  try{
   const {default:readExcelFile}=await import("read-excel-file/browser");
   const sheets=await readExcelFile(file);
   if(token!==generation.current)return;
   const normalized=normalizeHPQPLWorkbook(
    sheets.map(s=>({sheet:s.sheet,data:s.data as HPQPLCell[][]})),
    {fileName:file.name,importedAt:new Date().toISOString().slice(0,10)}
   );
   onChange(normalized);
   setMessage("Loaded "+normalized.rows.length.toLocaleString("en-US")+" candidate system rows across "+normalized.sheetsRead+" recognized sheet(s). No rebate award or source authenticity established.");
  }catch(e){
   if(token===generation.current){
     onChange(null);
     setMessage(e instanceof Error?e.message:"Unable to interpret the selected workbook.");
   }
  }finally{if(token===generation.current)setWorking(false);}
 };
 return <section className="ma-hpqpl" aria-label="Mass Save equipment workbook matcher">
   <h3>Check exact equipment against a Mass Save product-list snapshot</h3>
   <p>Download the <a href={HPQPL_PAGE} target="_blank" rel="noreferrer">official product-list page</a>,
     choose <a href={HPQPL_XLSX} target="_blank" rel="noreferrer">Download the spreadsheet (.xlsx)</a>,
     then select that file here. We compare each quote's AHRI reference and paired model numbers against its rows.
     The workbook is processed locally; no quote, model IDs, or file contents are uploaded.</p>
   <label htmlFor="ma-hpqpl-file">Mass Save HPQPL workbook (.xlsx)</label>
   <input id="ma-hpqpl-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
     disabled={working} onChange={e=>void load(e.target.files?.[0])}/>
   {catalog&&<div className="ma-hpqpl-summary"><strong>Snapshot loaded: {catalog.rows.length.toLocaleString("en-US")} system rows</strong>
    <p>Imported {catalog.importedAt}; {catalog.sheetsRead} recognized sheet(s). Filename is user-supplied, not proof the workbook came from Mass Save or is current.</p>
    {catalog.warnings.length>0&&<details><summary>Coverage limitations ({catalog.warnings.length})</summary>
      <ul>{catalog.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul></details>}
    <button type="button" onClick={()=>{generation.current++;onChange(null);setMessage("Workbook cleared from the current page.");}}>Clear workbook</button>
   </div>}
   {working&&<p role="status">Processing the workbook on this device…</p>}
   {message&&!working&&<p role="status">{message}</p>}
   <p className="ma-hpqpl-caution">A row match is evidence from a downloaded list, not an authenticated live lookup, AHRI certification, program approval or guaranteed rebate. Partial/wildcard/multi-zone combinations require manual review. Always confirm the current Mass Save listing before signing.</p>
 </section>;
}