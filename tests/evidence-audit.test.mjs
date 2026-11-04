import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {auditEvidence} from "../scripts/evidence-audit.mjs";
const base=JSON.parse(fs.readFileSync("docs/EVIDENCE_REGISTER.json","utf8"));
const sources=JSON.parse(fs.readFileSync("docs/SOURCE_REGISTRY.json","utf8"));
const evaluate=(reg=base,on="2026-11-04")=>auditEvidence(reg,sources,on);
const patched=(patch)=>({...base,claims:[{...base.claims[0],...patch},...base.claims.slice(1)]});
test("program evidence remains a review queue, never an awarded rebate",()=>{
 const result=evaluate();
 assert.deepEqual(result.errors,[]);
 assert.ok(result.reviewQueue.some(x=>x.id==="masssave-2026-schedule"));
 assert.ok(result.reviewQueue.some(x=>x.id==="masssave-2027-terms"));
});
test("program-published status must refer to an incentive not a law",()=>{
 const out=evaluate(patched({kind:"rule"}));
 assert.ok(out.errors.some(x=>/restricted to incentive/.test(x)));
});
test("current-claim setting cannot activate the announced future 2027 schedule",()=>{
 const reg={...base,claims:base.claims.map(x=>x.id==="masssave-2027-terms"?{...x,activeClaim:true}:x)};
 assert.ok(evaluate(reg).errors.some(x=>/inactive or unverified/.test(x)));
});
test("no published incentive can automatically be deducted or treated as an award",()=>{
 assert.ok(evaluate(patched({autoRebateApplied:true})).errors.some(x=>/confirmed award/.test(x)));
});
test("official government funding source ID and URL must match exactly",()=>{
 const reg={...base,claims:base.claims.map(x=>x.id==="oregon-hp3-funding"?{...x,sourceUrl:"https://www.oregon.gov/energy/incentives/Pages/other.aspx"}:x)};
 assert.ok(evaluate(reg).errors.some(x=>/disagree/.test(x)));
});
test("duplicate, malformed and stale evidence is flagged",()=>{
 const reg={...base,claims:[...base.claims,base.claims[0]]};
 assert.ok(evaluate(reg).errors.some(x=>/duplicate evidence ID/.test(x)));
 const withBadDate=patched({lastChecked:"2026-02-30"});
 assert.ok(evaluate(withBadDate).errors.some(x=>/invalid checked date/.test(x)));
 assert.ok(evaluate(base,"2027-03-01").reviewQueue.some(x=>x.reasons.includes("review overdue")));
});
test("official-only designation is rejected for nongovernment program pages",()=>{
 const out=evaluate(patched({status:"reviewed-official"}));
 assert.ok(out.errors.some(x=>/\.gov official source/.test(x)));
});
