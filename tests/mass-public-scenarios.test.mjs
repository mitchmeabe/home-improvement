import test from "node:test";import assert from "node:assert/strict";
import fs from "node:fs";
import {EMPTY_MASS_INPUT,compareMassQuotes,newMassQuote} from "../src/lib/mass-save.ts";
const fixtures=JSON.parse(fs.readFileSync("tests/fixtures/ma-public-quote-scenarios.json","utf8"));
const {installerInNetwork,equipmentOnQualifiedList,newEquipment,coolingCapacityBtu,...base}=EMPTY_MASS_INPUT;
test("real homeowner report: mixed ductwork scope is not ranked as equivalent",()=>{
 const s=fixtures.scenarios.find(s=>s.id==="ma-2026-oil-ranch");
 const q=s.quotes.slice(0,3).map(v=>({...newMassQuote(v.id),price:v.reportedPrice,scope:v.scope,priceBasis:v.basis}));
 const result=compareMassQuotes({...base,inMassachusetts:"yes",propertyUnits:"one-four",year:"2026",route:"whole",heatingFuel:"oil"},q);
 assert.equal(s.actualSignedDocuments,false);
 assert.equal(result.comparativeWinner,null);
 assert.equal(result.comparablePriceGap,null);
 for(const e of result.quotes){assert.equal(e.conditionalPostRebate,null);assert.ok(e.risks.length>0)}
});
test("2026 homeowner single-quote and internally inconsistent report cannot be called validated transactions",()=>{
 for(const s of fixtures.scenarios){
  assert.match(s.source,/^https:\/\/www\.reddit\.com\//);
  assert.equal(s.actualSignedDocuments,false);
 }
 const solo=fixtures.scenarios.find(s=>s.id==="ma-2026-six-heads");
 assert.throws(()=>compareMassQuotes(base,[{...newMassQuote("a"),price:solo.quotes[0].reportedPrice}]),RangeError);
});
test("independently documented quote evidence is still required before claiming real-proposal acceptance",()=>{
 assert.equal(fixtures.scenarios.some(s=>s.actualSignedDocuments),false);
});
