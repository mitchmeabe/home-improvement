import test from "node:test";import assert from "node:assert/strict";import {spawnSync} from "node:child_process";import fs from "node:fs";
test("Mass Save rule snapshot and references are consistent, offline",()=>{
 const r=spawnSync(process.execPath,["scripts/market-data-check.mjs"],{encoding:"utf8"});
 assert.equal(r.status,0,r.stdout+"\n"+r.stderr);
});
test("public homeowner anecdotes are never presented as signed contractor proposals",()=>{
 const x=JSON.parse(fs.readFileSync("tests/fixtures/ma-public-quote-scenarios.json","utf8"));
 assert.ok(x.scenarios.length>=2);
 assert.ok(x.scenarios.every(y=>y.actualSignedDocuments===false));
});
