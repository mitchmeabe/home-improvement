import test from "node:test";
import assert from "node:assert/strict";
import {emptyQuote,compareHeatPumpQuotes,quoteComparisonQuestions} from "../src/lib/heat-pump-quotes.ts";
const a={...emptyQuote("a"),installedPrice:15000,priceBasis:"before-discounts"};
const b={...emptyQuote("b"),installedPrice:17000,priceBasis:"before-discounts"};
const base={location:"portland",property:"existing-owner-occupied",hspf2:8.5,seer2:17,quotes:[a,b]};
const screen=(x={})=>compareHeatPumpQuotes({...base,...x});
test("owner occupied fully reserved never assumes HP3 discount",()=>{
 const q={...a,hp3ProposedDiscount:2000,hp3ApprovedContractor:"yes",hp3FundingConfirmed:"yes",hp3UpfrontReduction:"yes",modelAndRatingsDocumented:"yes"};
 const r=screen({quotes:[q,b]});
 assert.equal(r.evaluations[0].arithmeticNet,15000);
 assert.match(r.propertyWarning,/fully reserved/);
});
test("confirmed other discount only deducted when documented",()=>{
 let r=screen({quotes:[{...a,otherDiscount:700,otherDiscountConfirmed:"unsure"},b]});
 assert.equal(r.evaluations[0].arithmeticNet,15000);
 r=screen({quotes:[{...a,otherDiscount:700,otherDiscountConfirmed:"yes"},b]});
 assert.equal(r.evaluations[0].arithmeticNet,14300);
});
test("after-discount prices never double subtract",()=>{
 const q={...a,installedPrice:13000,priceBasis:"after-discounts",hp3ProposedDiscount:2000,otherDiscount:500,otherDiscountConfirmed:"yes"};
 assert.equal(screen({quotes:[q,b]}).evaluations[0].arithmeticNet,13000);
});
test("rental with all user-confirmed prerequisites may show conditional arithmetic only",()=>{
 const q={...a,hp3ProposedDiscount:2000,hp3ApprovedContractor:"yes",hp3FundingConfirmed:"yes",hp3UpfrontReduction:"yes",modelAndRatingsDocumented:"yes"};
 const r=screen({property:"existing-rental",quotes:[q,b]});
 assert.equal(r.evaluations[0].arithmeticNet,13000);
 assert.match(r.evaluations[0].netDescription,/not an awarded rebate/);
});
test("missing efficiency or contractor approval never credits HP3",()=>{
 const q={...a,hp3ProposedDiscount:2000,hp3ApprovedContractor:"unsure",hp3FundingConfirmed:"yes",hp3UpfrontReduction:"yes",modelAndRatingsDocumented:"yes"};
 assert.equal(screen({property:"existing-rental",quotes:[q,b]}).evaluations[0].arithmeticNet,15000);
 assert.equal(screen({property:"existing-rental",hspf2:null,quotes:[{...q,hp3ApprovedContractor:"yes"},b]}).evaluations[0].arithmeticNet,15000);
});
test("unknown price basis prevents false comparison",()=>{
 const r=screen({quotes:[{...a,priceBasis:"unsure"},b]});
 assert.equal(r.evaluations[0].arithmeticNet,null);assert.equal(r.lowestComparableQuote,null);
});
test("two or three quotes only, no duplicated identifiers",()=>{
 assert.throws(()=>screen({quotes:[a]}),RangeError);
 assert.throws(()=>screen({quotes:[a,a]}),RangeError);
 const c={...emptyQuote("c"),installedPrice:14500,priceBasis:"after-discounts"};
 assert.equal(screen({quotes:[a,b,c]}).evaluations.length,3);
});
test("different confirmed quotes yield correctly computed price gap",()=>{
 const r=screen();
 assert.equal(r.lowestComparableQuote,"a");
 assert.equal(r.priceDifference,2000);
});
test("10-year illustrative total uses user-input operating cost only",()=>{
 const r=screen({quotes:[{...a,annualOperatingCost:800},b]});
 assert.equal(r.evaluations[0].tenYearScenario,23000);
 assert.equal(r.evaluations[1].tenYearScenario,null);
});
test("negative or invalid costs and energy ratings rejected",()=>{
 assert.throws(()=>screen({quotes:[{...a,installedPrice:-1},b]}),RangeError);
 assert.throws(()=>screen({seer2:NaN}),RangeError);
 assert.throws(()=>screen({quotes:[{...a,hp3ProposedDiscount:Infinity},b]}),RangeError);
});
test("missing permit and warranty flags and copyable source plan",()=>{
 const r=screen();assert.ok(r.evaluations[0].warnings.some(x=>/mechanical permit/.test(x)));
 const x=quoteComparisonQuestions(r);assert.match(x,/oregon.gov\/energy/);
 assert.match(x,/fully reserved/);
});
