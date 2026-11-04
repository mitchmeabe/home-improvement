import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const data=JSON.parse(fs.readFileSync("docs/SOURCE_REGISTRY.json","utf8"));
test("program ledger cites official sources and review timestamps",()=>{
 assert.ok(data.sources.length>=4);
 const ids=data.sources.map(s=>s.id);
 assert.equal(ids.length,new Set(ids).size);
 for(const s of data.sources){
  assert.match(new URL(s.url).hostname,/\.gov$/);
  assert.match(s.lastReviewed,/^\d{4}-\d{2}-\d{2}$/);
  assert.ok(s.maxAgeDays>0&&s.maxAgeDays<=120);
 }
});
