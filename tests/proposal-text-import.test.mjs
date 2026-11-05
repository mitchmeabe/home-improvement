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

test("multiple amounts on the same labeled line are withheld, not taken as total",()=>{
 const ambiguous=parseProposalText("Deposit $2,000; total installed price: $18,500");
 assert.equal(field(ambiguous,"price"),undefined);
 assert.ok(ambiguous.warnings.some(w=>/single reliable/.test(w)));
 const other=parseProposalText("Total price: $22,000, optional electrical work $3,500");
 assert.equal(field(other,"price"),undefined);
 const clean=parseProposalText("Total installed price: $18,500");
 assert.equal(field(clean,"price"),18500);
});

test("labeled proposal AHRI and indoor/outdoor identifiers require manual confirmation",()=>{
 const x=parseProposalText("AHRI #: 123456789\nOutdoor unit model: AOU36RLXFZ\nIndoor unit model: ASU36RLXFZ");
 assert.equal(field(x,"ahriReference"),"123456789");
 assert.equal(field(x,"outdoorModel"),"AOU36RLXFZ");
 assert.equal(field(x,"indoorModel"),"ASU36RLXFZ");
 assert.equal(x.candidates.some(c=>c.key==="equipmentOnQualifiedList"),false);
});
test("conflicting AHRI references withheld and marketing model mentions ignored",()=>{
 const x=parseProposalText("AHRI #: 123456789\nAHRI #: 987654321\nPremium AOU36RLXFZ system\nIndoor model excluded");
 assert.equal(field(x,"ahriReference"),undefined);
 assert.equal(field(x,"outdoorModel"),undefined);
 assert.equal(field(x,"indoorModel"),undefined);
 assert.ok(x.warnings.some(w=>/Conflicting AHRI/.test(w)));
});

test("one ambiguous labeled total prevents false certainty from a second clean total",()=>{
 const x=parseProposalText([
  "Total installed price: $18,500",
  "Total project cost: $18,500 plus optional electrical work $2,500",
  "Deposit: $2,000"
 ].join("\n"));
 assert.equal(field(x,"price"),undefined);
 assert.match(x.warnings.join(" "),/Installed-price labels/);
});

test("one disclaimed total makes a repeated clean price unsafe to import",()=>{
 const x=parseProposalText([
  "Total installed price: $18,500",
  "Total estimate: $18,500 (example only)",
 ].join("\n"));
 assert.equal(field(x,"price"),undefined);
 assert.match(x.warnings.join(" "),/Enter the total manually/);
});

test("ambiguous rebate label cannot be silently discarded when another rebate amount is printed",()=>{
 const x=parseProposalText([
  "Mass Save rebate: $8,500",
  "Proposed rebate amount: $8,500 plus an additional $1,000 incentive"
 ].join("\n"));
 assert.equal(field(x,"rebate"),undefined);
 assert.match(x.warnings.join(" "),/unambiguous proposed amount/);
});

test("multiple consistent labeled totals are safe to propose for human confirmation",()=>{
 const x=parseProposalText([
  "Total installed price: $18,500",
  "Total project cost: $18,500",
  "Mass Save rebate: $2,000",
  "Rebate amount: $2,000"
 ].join("\n"));
 assert.equal(field(x,"price"),18500);
 assert.equal(field(x,"rebate"),2000);
 assert.equal(x.warnings.length,0);
});

test("mixed before- and after-rebate labels never become an inferred price basis",()=>{
 const x=parseProposalText([
  "Total price before rebate: $20,000",
  "Contract price after rebate: $18,000",
 ].join("\n"));
 assert.equal(field(x,"price"),undefined);
 assert.equal(field(x,"priceBasis"),undefined);
 assert.match(x.warnings.join(" "),/Conflicting before\/after/);
});

test("same-line before-and-after descriptions with one amount cannot establish a basis",()=>{
 const x=parseProposalText("Total price before rebate and after incentives: $18,000");
 assert.equal(field(x,"priceBasis"),undefined);
 assert.match(x.warnings.join(" "),/Conflicting before\/after/);
});

test("actual public heat-pump proposal layout is ambiguous when price labels and values occupy separate rows",()=>{
 // Structural reconstruction of a 2015 municipal-public heating proposal,
 // WITHOUT customer, home address, contact details or original PDF bytes.
 const x=parseProposalText([
  "Heating System Proposal",
  "COST",
  "Total Cost:",
  "Rebates Available:",
  "Final Cost:",
  "$9,204.50",
  "$500.00",
  "$8,704.50",
  "Estimated Annual Savings: $618.89",
  "Commissioning by trained refrigeration technicians",
  "Warranty on parts and labor"
 ].join("\n"));
 assert.equal(field(x,"price"),undefined);
 assert.equal(field(x,"rebate"),undefined);
 assert.equal(field(x,"priceBasis"),undefined);
 assert.match(x.warnings.join(" "),/Final\/net cost/);
 assert.match(x.warnings.join(" "),/rebate is described as available or conditional/i);
 assert.ok(x.mentions.some(x=>x.label==="Commissioning"));
 assert.ok(x.mentions.some(x=>x.label==="Warranty"));
});
test("gross cost, potential rebate and net final cost must not be conflated",()=>{
 const x=parseProposalText([
  "Total Cost: $9,204.50",
  "Rebates Available: $500.00",
  "Final Cost: $8,704.50"
 ].join("\n"));
 assert.equal(field(x,"price"),undefined);
 assert.equal(field(x,"rebate"),undefined);
 assert.equal(field(x,"priceBasis"),undefined);
 assert.match(x.warnings.join(" "),/Confirm which amount includes incentives/);
});
test("gross total cost alone can be extracted for manual confirmation, without an inferred rebate basis",()=>{
 const x=parseProposalText("Total Cost: $9,204.50");
 assert.equal(field(x,"price"),9204.5);
 assert.equal(field(x,"priceBasis"),undefined);
 assert.equal(field(x,"rebate"),undefined);
});
test("gross cost with separately available contingent rebate retains cost but never deducts potential incentive",()=>{
 const x=parseProposalText([
  "Total Cost: $9,204.50",
  "Rebates Available: $500.00"
 ].join("\n"));
 assert.equal(field(x,"price"),9204.5);
 assert.equal(field(x,"rebate"),undefined);
 assert.match(x.warnings.join(" "),/Verify funding/);
});
test("final cost alone and unrelated annual heating costs cannot become an installed bid total",()=>{
 const net=parseProposalText("Final Cost: $8,704.50");
 assert.equal(field(net,"price"),undefined);
 assert.match(net.warnings.join(" "),/Final\/net cost/);
 const annual=parseProposalText("Annual Total Cost: $2,281.11");
 assert.equal(field(annual,"price"),undefined);
 assert.match(annual.warnings.join(" "),/Enter the total manually/);
});
test("distinct explicit approval-free Mass Save rebate stays a human-reviewed candidate",()=>{
 const x=parseProposalText("Total installed price: $18,500\nProposed rebate amount: $2,000");
 assert.equal(field(x,"price"),18500);
 assert.equal(field(x,"rebate"),2000);
 assert.equal(field(x,"priceBasis"),undefined);
});

test("Massachusetts state sample contract total is distinct from deposit and installment schedule",()=>{
 const x=parseProposalText([
  "Total Contract Price: $18,900.00",
  "Down payment upon signature: $6,000.00",
  "Payment upon equipment delivery: $6,000.00",
  "Final payment at completion: $6,900.00",
  "Permits secured by the contractor",
  "Warranty: parts and labor"
 ].join("\n"));
 assert.equal(field(x,"price"),18900);
 assert.equal(field(x,"rebate"),undefined);
 assert.equal(field(x,"priceBasis"),undefined);
 assert.equal(x.warnings.length,0);
 assert.ok(x.mentions.some(m=>m.label==="Permits / inspections"));
 assert.ok(x.mentions.some(m=>m.label==="Deposit / payment schedule"));
 assert.ok(x.mentions.some(m=>m.label==="Warranty"));
});
test("official Massachusetts contract payment-schedule heading alone is never a price",()=>{
 const heading=parseProposalText("Total Contract Price and Payment Schedule\n$18,900.00\nDeposit $6,000.00");
 assert.equal(field(heading,"price"),undefined);
 assert.equal(heading.warnings.length,0);
 const withSeparateLabeledTotal=parseProposalText([
  "Total Contract Price and Payment Schedule",
  "Total Contract Price: $18,900.00",
  "Deposit $6,000.00"
 ].join("\n"));
 assert.equal(field(withSeparateLabeledTotal,"price"),18900);
 assert.equal(withSeparateLabeledTotal.warnings.length,0);
});
test("a total contract price line containing a second amount is not an unambiguous contract total",()=>{
 const x=parseProposalText("Total Contract Price $18,900 plus a deposit of $6,000");
 assert.equal(field(x,"price"),undefined);
 assert.match(x.warnings.join(" "),/Enter the total manually/);
});
test("two inconsistent contract totals fail closed instead of accepting first",()=>{
 const x=parseProposalText("Total Contract Price: $18,900\nTotal Installed Cost: $19,400");
 assert.equal(field(x,"price"),undefined);
 assert.match(x.warnings.join(" "),/Enter the total manually/);
});
test("Massachusetts contract total plus lower after-rebate figure requires a manual price basis",()=>{
 const x=parseProposalText("Total Contract Price: $18,900\nNet Project Cost: $10,400");
 assert.equal(field(x,"price"),undefined);
 assert.equal(field(x,"priceBasis"),undefined);
 assert.match(x.warnings.join(" "),/Final\/net cost/);
});
