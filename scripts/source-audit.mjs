#!/usr/bin/env node
/**
 * Source REVIEW tooling. It does not change laws, prices, forms or app logic.
 * npm run sources:check => offline inventory/date validation
 * npm run sources:probe => optional network probing and text drift flags
 * Probing entire HTML is imperfect; manual legal review is mandatory.
 */
import fs from "node:fs";
import {createHash} from "node:crypto";
const path="docs/SOURCE_REGISTRY.json";
const {sources}=JSON.parse(fs.readFileSync(path,"utf8"));
const online=process.argv.includes("--online");
const seen=new Set();
let issues=0;
for(const source of sources){
 if(seen.has(source.id)) {console.error("DUPLICATE "+source.id);issues++;continue}
 seen.add(source.id);
 const u=(()=>{try{return new URL(source.url)}catch{return null}})();
 if(!u || u.protocol!=="https:" || !u.hostname.endsWith(".gov")) {console.error("INVALID URL "+source.id);issues++;continue}
 const date=Date.parse(source.lastReviewed+"T00:00:00Z");
 const age=Math.floor((Date.now()-date)/86400000);
 if(!Number.isFinite(date)||date>Date.now()+86400000) {console.error("INVALID review date "+source.id);issues++;continue}
 if(age>source.maxAgeDays) {console.error("STALE "+source.id+" "+age+" days old; needs source owner review");issues++}
 else console.log("REVIEW SNAPSHOT",source.id,source.lastReviewed,age+"d old");
 if(!online)continue;
 try{
  const response=await fetch(source.url,{signal:AbortSignal.timeout(12000),redirect:"follow",headers:{"User-Agent":"HomeImprovementSourceAudit/0.1 (human review; no automatic update)"}});
  if(!response.ok)throw Error("HTTP "+response.status);
  const bytes=new Uint8Array(await response.arrayBuffer());
  const hash=createHash("sha256").update(bytes).digest("hex").slice(0,20);
  const type=response.headers.get("content-type")||"unknown";
  const body=type.includes("pdf")?"":new TextDecoder("utf-8").decode(bytes);
  const missing=(source.expectedText||[]).filter(term=>!body.toLowerCase().includes(term.toLowerCase()));
  console.log("REMOTE",source.id,"status="+response.status,"bytes="+bytes.length,"sha256-prefix="+hash,"contentType="+type);
  if(missing.length){console.error("CONTENT REVIEW FLAG",source.id,"missing phrases",missing.join(" / "));issues++}
 }catch(err){console.error("REMOTE REVIEW NEEDED",source.id,String(err));issues++}
}
console.log("Sources:",sources.length,"review flags:",issues,"mode:",online?"online":"offline");
if(issues>0)process.exitCode=1;
