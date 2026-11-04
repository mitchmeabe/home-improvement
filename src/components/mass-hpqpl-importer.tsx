"use client";
import {useRef,useState} from "react";
import {normalizeHPQPLWorkbook,parseHPQPLDate,HPQPL_PAGE,HPQPL_XLSX,
 type HPQPLCatalog,type HPQPLCell} from "../lib/mass-hpqpl";
import "./mass-hpqpl-importer.css";

/** Real Mass Save workbook (observed 2026-11-04) is 32,691,017 bytes.
 * Reading ONE selected sheet avoids eagerly materializing all 10 tabs, whose
 * main ASHP tab alone includes over 204,000 parsed rows.
 */
const HPQPL_SHEETS=[
 "Air Source Heat Pump","High Velocity ASHPs","Residential Air to Water HPs",
 "Commercial Air Source VRF","Commercial Ground Water HP","Commercial Ground Loop HP",
 "Residential GSHP"
] as const;
type HPQPLSheet=typeof HPQPL_SHEETS[number];
const MAX_HPQPL_BYTES=64*1024*1024;
/** Parses a user-supplied official-format workbook locally; no file uploaded. */
export function MassHPQPLImporter({catalog,onChange}:{catalog:HPQPLCatalog|null;onChange:(v:HPQPLCatalog|null)=>void}){
 const [message,setMessage]=useState("");
 const [working,setWorking]=useState(false);
 const [sheet,setSheet]=useState<HPQPLSheet>("Air Source Heat Pump");
 const currentFile=useRef<File|null>(null);
 const generation=useRef(0);
 const load=async(file:File|undefined,requestedSheet:HPQPLSheet=sheet)=>{
  if(!file)return;
  const token=++generation.current;
  onChange(null);
  if(!file.name.toLowerCase().endsWith(".xlsx")||file.size<100||file.size>MAX_HPQPL_BYTES){
   currentFile.current=null;
   setMessage("Choose the downloaded Mass Save .xlsx workbook (100 bytes to 64 MiB).");return;
  }
  currentFile.current=file;
  setWorking(true);setMessage("Reading workbook locally; no file is uploaded.");
  try{
   const {readSheet}=await import("read-excel-file/browser");
   let sourceDataUpdatedOn:string|null=null;
   try{
    const readme=await readSheet(file,"Read Me");
    for(const row of readme){
     const index=row.findIndex(cell=>typeof cell==="string"&&cell.trim().toLowerCase()==="data updated");
     if(index>=0){sourceDataUpdatedOn=parseHPQPLDate(row[index+1] as HPQPLCell);break;}
    }
   }catch{/* Older/different exports may lack the Read Me tab. */}
   // The upstream XLSX has a 205,863-row ASHP sheet. Loading all sheets at
   // once unnecessarily exhausts browser memory; use one explicit tab.
   const rows=await readSheet(file,requestedSheet);
   if(token!==generation.current)return;
   const normalized=normalizeHPQPLWorkbook(
    [{sheet:requestedSheet,data:rows as HPQPLCell[][]}],
    {fileName:file.name,importedAt:new Date().toISOString().slice(0,10),sourceDataUpdatedOn}
   );
   onChange(normalized);
   setMessage("Loaded "+normalized.rows.length.toLocaleString("en-US")+" candidate system rows from "+requestedSheet+". No rebate award or source authenticity established.");
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
   <label htmlFor="ma-hpqpl-sheet">Equipment category in the official workbook</label>
   <select id="ma-hpqpl-sheet" value={sheet} disabled={working} onChange={e=>{
     const next=e.target.value as HPQPLSheet;
     setSheet(next);
     if(currentFile.current)void load(currentFile.current,next);
     else {generation.current++;onChange(null);}
   }}>{HPQPL_SHEETS.map(s=><option value={s} key={s}>{s}</option>)}</select>
   <p>For performance and accurate category-specific results, this loads one workbook tab at a time. Switch category to recheck a different system type; the selected file remains on your device.</p>
   <label htmlFor="ma-hpqpl-file">Mass Save HPQPL workbook (.xlsx; up to 64 MiB)</label>
   <input id="ma-hpqpl-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
     disabled={working} onChange={e=>void load(e.target.files?.[0])}/>
   {catalog&&<div className="ma-hpqpl-summary"><strong>Snapshot loaded: {catalog.rows.length.toLocaleString("en-US")} system rows</strong>
    <p>Workbook tab: {sheet}. Reported workbook data updated: {catalog.sourceDataUpdatedOn??"not found"}; imported {catalog.importedAt}. Filename is user-supplied, not proof the file came from Mass Save or is current.</p>
    {catalog.warnings.length>0&&<details><summary>Coverage limitations ({catalog.warnings.length})</summary>
      <ul>{catalog.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul></details>}
    <button type="button" onClick={()=>{generation.current++;currentFile.current=null;onChange(null);setMessage("Workbook cleared from the current page.");}}>Clear workbook</button>
   </div>}
   {working&&<p role="status">Processing the workbook on this device…</p>}
   {message&&!working&&<p role="status">{message}</p>}
   <p className="ma-hpqpl-caution">A match applies only to the selected equipment tab. The dated worksheet and any "Date No Longer Eligible" entry must be reviewed; a row match is evidence from a downloaded list, not an authenticated live lookup, AHRI certification, program approval or guaranteed rebate. Partial/wildcard/multi-zone combinations require manual review. Always confirm the current Mass Save listing before signing.</p>
 </section>;
}