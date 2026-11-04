/**
 * Browser-only text-layer PDF import. No server API, network upload, OCR,
 * thumbnail rendering, personal-data persistence or model processing.
 *
 * Input: at most 5 MB, 12 pages. Max 25k extracted characters. Rejection
 * leaves the existing comparison unchanged. Scanned/image-only files need
 * manual transcription; text extraction is not an eligibility determination.
 */
export const MAX_PDF_BYTES=5*1024*1024;
export const MAX_PDF_PAGES=12;
export const MAX_PDF_CHARS=25000;
export interface ExtractedProposalPdf {text:string;pages:number;characters:number;truncated:boolean}
export function validatePdfHeader(bytes:Uint8Array):void{
 if(bytes.byteLength<8||bytes.byteLength>MAX_PDF_BYTES)
   throw new Error("PDF must be between 8 bytes and 5 MB.");
 const magic=String.fromCharCode(...bytes.slice(0,5));
 if(magic!=="%PDF-")throw new Error("The file is not a valid PDF header.");
}
/** PDF.js is dynamically imported after a user chooses a file. */
export async function extractProposalPdf(file:File):Promise<ExtractedProposalPdf>{
 if(!file.name.toLowerCase().endsWith(".pdf")||file.size>MAX_PDF_BYTES||file.size<8)
   throw new Error("Choose a PDF smaller than 5 MB.");
 const bytes=new Uint8Array(await file.arrayBuffer());
 validatePdfHeader(bytes);
 const pdfjs=await import("pdfjs-dist");
 // Bundled same-origin worker; never load a CDN or send customer PDF bytes.
 pdfjs.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/build/pdf.worker.min.mjs",import.meta.url).toString();
 const task=pdfjs.getDocument({data:bytes,useSystemFonts:false,stopAtErrors:true});
 let document:Awaited<typeof task.promise>|null=null;
 try{
  document=await task.promise;
  if(document.numPages<1||document.numPages>MAX_PDF_PAGES)
   throw new Error("PDF has too many pages; use up to 12 pages.");
  const sections:string[]=[];
  let used=0;
  let truncated=false;
  for(let pageIndex=1;pageIndex<=document.numPages;pageIndex++){
   const page=await document.getPage(pageIndex);
   const content=await page.getTextContent();
   const words:{value:string;x:number;y:number}[]=[];
   for(const item of content.items){
    if(!("str" in item)||!item.str.trim())continue;
    words.push({value:item.str.trim(),x:item.transform[4],y:item.transform[5]});
   }
   // Keep distinct rows distinct. Many PDF generators split one line into
   // positioned fragments; joining all fragments as one paragraph can cause
   // a deposit or rebate label to be falsely associated with another amount.
   words.sort((a,b)=>b.y-a.y||a.x-b.x);
   const rows:{y:number;parts:string[]}[]=[];
   for(const item of words){
    const row=rows.find(r=>Math.abs(r.y-item.y)<2.5);
    if(row)row.parts.push(item.value);
    else rows.push({y:item.y,parts:[item.value]});
   }
   const pageText=rows.map(r=>r.parts.join(" ")).join("\n");
   if(!pageText.trim())continue;
   const section="[Page "+pageIndex+"]\n"+pageText+"\n";
   if(used+section.length>MAX_PDF_CHARS){
    truncated=true;
    sections.push(section.slice(0,Math.max(0,MAX_PDF_CHARS-used)));
    break;
   }
   sections.push(section);
   used+=section.length;
  }
  const text=sections.join("").trim();
  if(text.length<15)throw new Error("No readable text layer. Scanned PDFs require manual transcription.");
  return {text,pages:document.numPages,characters:text.length,truncated};
 }finally{
  await task.destroy();
 }
}
