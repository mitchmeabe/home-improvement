import test from "node:test";
import assert from "node:assert/strict";
import {parseProposalText} from "../src/lib/proposal-text-import.ts";
const field=(r,k)=>r.candidates.find(x=>x.key===k)?.value;
test("extracts explicitly labeled numbers but never claims approvals",()=>{
 const x=parseProposalText("Total installed price: $18,500\nProposed rebate: $2,000\nAHRI cooling capacity: 36,000 BTU/h\nReuse existing ducts\nPermit not included");
 assert.equal(field(x,"price"),18500);
 assert.equal(field(x,"rebate"),2000);
 assert.equal(field(x,"coolingCapacityBtu"),36000);
 assert.equal(field(x,"scope"),"reuse-existing-ducts");
 assert.equal(x.mentions.length,1);
 assert.equal(x.candidates.some(c=>c.key==="permits"),false);
});
test("unrelated currency is ignored and conflicting totals are withheld",()=>{
 const x=parseProposalText("Deposit $2,000\nPhone 555-1000\nTotal installed price: $18,500\nTotal project cost: $20,500");
 assert.equal(field(x,"price"),undefined);
 assert.ok(x.warnings.some(w=>/price labels/.test(w)));
});
test("no rebate or scope inference from a negative exclusion",()=>{
 const x=parseProposalText("Total price: $21,200\nNo new ductwork included\nRebate may be available");
 assert.equal(field(x,"price"),21200);
 assert.equal(field(x,"scope"),undefined);
 assert.equal(field(x,"rebate"),undefined);
});
test("conflicting scope is withheld",()=>{
 const x=parseProposalText("Reuse existing ducts\nDuctless mini-split system");
 assert.equal(field(x,"scope"),undefined);
 assert.ok(x.warnings.some(w=>/Conflicting/.test(w)));
});
test("price basis extracted only when explicit; no imagined qualification",()=>{
 const x=parseProposalText("Contract price after rebates: $16,500");
 assert.equal(field(x,"priceBasis"),"after-rebate");
 assert.equal(field(x,"price"),16500);
 assert.equal(field(x,"rebate"),undefined);
});
test("oversized proposal rejected without extraction",()=>{
 const x=parseProposalText("Total price: $500\n"+"x".repeat(25000));
 assert.equal(x.candidates.length,0);
 assert.equal(x.warnings.length,1);
});
