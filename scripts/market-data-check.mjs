#!/usr/bin/env node
/** Offline Mass Save source/schedule review. Never fetches or edits live rules. */
import fs from "node:fs";
const errors=[],warnings=[],today=Date.now();
const age=(date,id,max=60)=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||"")){errors.push(id+": missing review date");return;}
 const t=Date.parse(date+"T00:00:00Z"),days=Math.floor((today-t)/86400000);
 if(!Number.isFinite(t)||days< -1)errors.push(id+": bad future date");
 else if(days>max)errors.push(id+": review stale "+days+" days");
 else if(days>Math.floor(max*.7))warnings.push(id+": due for review soon "+days+" days");
};
const path="docs/markets/massachusetts-sources.json";
const data=JSON.parse(fs.readFileSync(path,"utf8"));age(data.reviewed,"Mass Save market sources",60);
const seen=new Set();
for(const x of data.primary){
 if(seen.has(x.id))errors.push("Duplicate source "+x.id);seen.add(x.id);
 try{const u=new URL(x.url);if(u.protocol!=="https:"||u.hostname!=="www.masssave.com")throw Error("bad domain");}
 catch{errors.push("Nonofficial URL "+x.id)}
 age(x.checked,x.id,60);
}
const lib=fs.readFileSync("src/lib/mass-save.ts","utf8");
age(lib.match(/MASS_REVIEWED_ON\s*=\s*"([0-9-]+)"/)?.[1],"Mass Save rule snapshot",60);
for(const amount of ["2650","1125","8500","2350","1000","7500"]){
 if(!lib.includes(amount))errors.push("Schedule field missing: "+amount);
}
const proposals=JSON.parse(fs.readFileSync("tests/fixtures/ma-public-quote-scenarios.json","utf8"));
if(!proposals.scenarios?.length)errors.push("Public quote fixtures missing");
if(proposals.scenarios?.some(x=>x.actualSignedDocuments===true))errors.push("Public anecdotes incorrectly certified as signed documents");
for(const msg of warnings)console.warn("REVIEW WARNING:",msg);
for(const msg of errors)console.error("REVIEW ERROR:",msg);
console.log("Mass Save source integrity:",data.primary.length,"program references; no automatic regulatory edits;",errors.length,"errors");
if(errors.length)process.exitCode=1;
