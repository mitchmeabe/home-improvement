import test from "node:test";
import assert from "node:assert/strict";
import {initialInput,newQuote,evaluate,report} from "../src/lib/oregon-heat-pump-water-heater.ts";
const run=(patch={})=>evaluate({...initialInput(),...patch});
test("Portland mailing address is not permit authority",()=>{
 const r=run({house:"one-two-family",replacement:"yes"});
 assert.equal(r.permits[0].status,"check");
 assert.equal(r.permits.some(x=>x.status==="required"),false);
});
test("Portland verified one-family replacement requires plumbing and new hardwire permit",()=>{
 const r=run({place:"portland-verified",house:"one-two-family",replacement:"yes",newWiring:"yes"});
 assert.equal(r.permits.find(x=>x.id==="plumbing").status,"required");
 assert.equal(r.permits.find(x=>x.id==="electrical").status,"required");
 assert.equal(r.permits.find(x=>x.id==="ventilation").status,"check");
});
test("unsupported building type cannot inherit one-family determinations",()=>{
 const r=run({place:"portland-verified",house:"other",replacement:"yes"});
 assert.equal(r.permits.length,1);
 assert.equal(r.permits[0].status,"check");
});
test("2026 energy trust pro and retail offers remain unapproved and uncounted",()=>{
 const p={place:"portland-verified",house:"one-two-family",dwelling:"existing-owner",utility:"pge"};
 const pro=run({...p,installation:"contractor"});
 const diy=run({...p,installation:"do-it-yourself"});
 assert.equal(pro.programs[0].status,"check");
 assert.match(pro.programs[0].detail,/\$1,200/);
 assert.match(diy.programs[0].detail,/\$1,000/);
 assert.equal(pro.comparison.lowerTotalQuote,null);
});
test("new construction excludes 2026 home retrofit midstream despite same utility",()=>{
 const r=run({place:"portland-verified",house:"one-two-family",dwelling:"new-construction",utility:"pge",installation:"contractor"});
 assert.equal(r.programs[0].status,"not-applicable");
});
test("missing amounts, bases, tank sizes or scope prevent numerical comparison",()=>{
 const a={...newQuote("a"),installedTotal:3500,priceBasis:"before-incentives",scope:"same-location",tankGallons:65};
 const b={...newQuote("b"),installedTotal:3000,priceBasis:"after-incentives",scope:"same-location",tankGallons:65};
 const r=run({quotes:[a,b]});
 assert.equal(r.comparison.comparable,false);
 assert.equal(r.comparison.lowerTotalQuote,null);
});
test("same scope and price basis compare totals without treating seller incentive as award",()=>{
 const a={...newQuote("a"),installedTotal:4100,priceBasis:"before-incentives",scope:"same-location",tankGallons:65,proposedIncentive:1200};
 const b={...newQuote("b"),installedTotal:3600,priceBasis:"before-incentives",scope:"same-location",tankGallons:65};
 const r=run({quotes:[a,b]});
 assert.equal(r.comparison.comparable,true);
 assert.equal(r.comparison.difference,500);
 assert.equal(r.comparison.lowerTotalQuote,"b");
 assert.ok(r.comparison.quotes[0].warnings.some(x=>/No discount is subtracted/.test(x)));
});
test("invalid price, tank, duplicate IDs or unsupported flags are rejected",()=>{
 assert.throws(()=>run({quotes:[{...newQuote("a"),installedTotal:-1},newQuote("b")]}),RangeError);
 assert.throws(()=>run({quotes:[{...newQuote("a"),tankGallons:500},newQuote("b")]}),RangeError);
 assert.throws(()=>run({quotes:[newQuote("a"),newQuote("a")]}),RangeError);
 assert.throws(()=>run({newWiring:"maybe"}),RangeError);
});
test("export includes sources and avoids funding clearance",()=>{
 const s=report(run());
 assert.match(s,/portland.gov/);
 assert.match(s,/no permits, funding, rebates or contractor guarantees/i);
});
