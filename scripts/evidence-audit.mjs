#!/usr/bin/env node
/**
 * Offline, non-mutating evidence admission and freshness audit.
 * This audit tracks which inputs MAY support a published conclusion.
 * Passing is NOT proof of current regulator approval, seller checkout,
 * confirmed rebates, or validated external program status.
 */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const kinds=new Set(["rule","course-approval","price","incentive"]);
const statuses=new Set(["reviewed-official","publisher-observed","program-published","needs-review"]);
const dateValid=(v)=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&
 !Number.isNaN(new Date(v+"T00:00:00Z").getTime())&&new Date(v+"T00:00:00Z").toISOString().slice(0,10)===v;
const isoTime=(v)=>Date.parse(v+"T00:00:00Z");
const gov=(v)=>{try{return new URL(v).hostname.toLowerCase().endsWith(".gov")}catch{return false}};
const secure=(v)=>{try{return new URL(v).protocol==="https:"}catch{return false}};
const nonempty=(v)=>typeof v==="string"&&v.trim().length>0;
export function auditEvidence(register,sources,asOf="2026-11-04"){
 const errors=[],reviewQueue=[];
 if(!dateValid(asOf))return {errors:["Invalid audit date"],reviewQueue};
 if(!register||register.version!==1||!Array.isArray(register.claims))
  return {errors:["Unsupported evidence register schema"],reviewQueue};
 if(!sources||!Array.isArray(sources.sources))
  return {errors:["Missing government-source registry"],reviewQueue};
 const ids=new Set();
 for(const claim of register.claims){
  const id=nonempty(claim.id)?claim.id:"<missing>";
  const complain=(message)=>errors.push(id+": "+message);
  if(ids.has(id))complain("duplicate evidence ID");
  ids.add(id);
  if(!nonempty(claim.market)||!nonempty(claim.title)||!nonempty(claim.reviewNote))
    complain("market, title, and reviewNote are required");
  if(!kinds.has(claim.kind))complain("invalid kind");
  if(!statuses.has(claim.status))complain("invalid status");
  if(!secure(claim.sourceUrl))complain("sourceUrl must be HTTPS");
  if(!dateValid(claim.lastChecked))complain("invalid checked date");
  if(!Number.isInteger(claim.reviewAfterDays)||claim.reviewAfterDays<1||claim.reviewAfterDays>365)
    complain("reviewAfterDays must be 1–365");
  if(claim.sourceId!==undefined&&claim.sourceId!==null){
   const source=sources.sources.find(s=>s.id===claim.sourceId);
   if(!source)complain("unknown source registry ID");
   else if(source.url!==claim.sourceUrl)complain("source ID and official URL disagree");
  }
  if(claim.effectiveFrom!==undefined&&!dateValid(claim.effectiveFrom))complain("invalid effectiveFrom");
  if(claim.effectiveThrough!==undefined&&!dateValid(claim.effectiveThrough))complain("invalid effectiveThrough");
  if(dateValid(claim.effectiveFrom)&&dateValid(claim.effectiveThrough)&&
    claim.effectiveFrom>claim.effectiveThrough)complain("effective period reversed");
  if(claim.status==="reviewed-official"&&!gov(claim.sourceUrl))
    complain("reviewed-official requires a .gov official source");
  if(claim.status==="reviewed-official"&&claim.kind==="price")
    complain("publisher price cannot be regulator-verified");
  if(claim.status==="publisher-observed"&&claim.kind!=="price")
    complain("publisher-observed is restricted to price entries");
  if(claim.status==="program-published"&&claim.kind!=="incentive")
    complain("program-published is restricted to incentive entries");
  if(claim.kind==="course-approval"&&claim.status==="reviewed-official"){
   const approval=claim.approval||{};
   if(!gov(approval.regulatorRecordUrl)||!nonempty(approval.providerName)||
      !nonempty(approval.courseNumber)||!nonempty(approval.deliveryMode)||
      !dateValid(approval.checkedAt))
    complain("approved course requires exact regulator listing, provider, course number, modality and checked date");
   if(dateValid(approval.checkedAt)&&approval.checkedAt>asOf)
    complain("course approval check is in the future");
  }
  if(claim.kind==="price"&&claim.status==="publisher-observed"){
   const offer=claim.offer||{};
   if(!secure(offer.productUrl)||!nonempty(offer.merchant)||
     typeof offer.priceUSD!=="number"||!Number.isFinite(offer.priceUSD)||offer.priceUSD<0||
     !dateValid(offer.observedAt))complain("observed price requires exact HTTPS product URL, merchant, numeric price, and observation date");
  }
  if(claim.autoPurchaseReady===true)
    complain("never automatically authorize a course purchase from inventory evidence");
  if(claim.autoRebateApplied===true)
    complain("never automatically apply a published incentive as a confirmed award");
  const age=dateValid(claim.lastChecked)?Math.floor((isoTime(asOf)-isoTime(claim.lastChecked))/86400000):null;
  if(age!==null&&age<0)complain("checked date is in the future");
  const stale=age!==null&&Number.isInteger(claim.reviewAfterDays)&&age>claim.reviewAfterDays;
  if(stale&&claim.status==="reviewed-official")complain("reviewed official evidence is stale");
  const future=dateValid(claim.effectiveFrom)&&asOf<claim.effectiveFrom;
  const expired=dateValid(claim.effectiveThrough)&&asOf>claim.effectiveThrough;
  if(claim.activeClaim===true&&(future||expired||claim.status==="needs-review"))
    complain("cannot display inactive or unverified claim as current");
  const reasons=[];
  if(stale)reasons.push("review overdue");
  if(claim.status==="needs-review")reasons.push("independent verification missing");
  if(claim.status==="publisher-observed")reasons.push("seller evidence is not official course approval");
  if(claim.status==="program-published")reasons.push("published program information is not an awarded benefit");
  if(future)reasons.push("future-effective rule or schedule");
  if(expired)reasons.push("past effective period");
  if(reasons.length)reviewQueue.push({id,market:claim.market,reasons,sourceUrl:claim.sourceUrl});
 }
 return {errors,reviewQueue};
}
const thisFile=fileURLToPath(import.meta.url);
if(process.argv[1]&&path.resolve(process.argv[1])===thisFile){
 const register=JSON.parse(fs.readFileSync("docs/EVIDENCE_REGISTER.json","utf8"));
 const sources=JSON.parse(fs.readFileSync("docs/SOURCE_REGISTRY.json","utf8"));
 const outcome=auditEvidence(register,sources,new Date().toISOString().slice(0,10));
 for(const item of outcome.reviewQueue)console.log("REVIEW QUEUE",item.market,item.id,item.reasons.join("; "),item.sourceUrl);
 for(const issue of outcome.errors)console.error("EVIDENCE ERROR",issue);
 console.log("Evidence:",register.claims.length,"review queue:",outcome.reviewQueue.length,"structural errors:",outcome.errors.length);
 if(outcome.errors.length)process.exitCode=1;
}
