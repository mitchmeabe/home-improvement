import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const x=JSON.parse(fs.readFileSync("docs/markets/massachusetts-sources.json","utf8"));
test("Massachusetts sources are Mass Save program documents with review timestamps",()=>{
 assert.ok(x.primary.length>=3);
 assert.equal(new Set(x.primary.map(s=>s.id)).size,x.primary.length);
 for(const s of x.primary){assert.equal(new URL(s.url).hostname,"www.masssave.com");assert.match(s.checked,/^\d{4}-\d{2}-\d{2}$/)}
});
