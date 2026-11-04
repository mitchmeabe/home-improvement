/** Client-only report export. No uploads, storage, or external requests. */
export function safeReportFilename(slug:string):string {
 if(!/^[a-z][a-z0-9-]{1,55}$/.test(slug))throw new RangeError("Invalid report name");
 return slug+"-plan.txt";
}
export function downloadTextReport(slug:string,content:string){
 if(!content.trim())throw new RangeError("Cannot download an empty report");
 const blob=new Blob([content],{type:"text/plain;charset=utf-8"});
 const url=URL.createObjectURL(blob);
 const link=document.createElement("a");
 link.href=url;link.download=safeReportFilename(slug);link.style.display="none";
 document.body.appendChild(link);
 try{link.click()}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
}
