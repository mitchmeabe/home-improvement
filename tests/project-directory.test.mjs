import test from "node:test";
import assert from "node:assert/strict";
import {PROJECT_WORKFLOWS,filterProjectWorkflows} from "../src/lib/project-directory.ts";
test("each supported project has distinct exact workflow and limitation labels",()=>{
 assert.equal(new Set(PROJECT_WORKFLOWS.map(w=>w.id)).size,PROJECT_WORKFLOWS.length);
 assert.equal(new Set(PROJECT_WORKFLOWS.map(w=>w.href)).size,PROJECT_WORKFLOWS.length);
 for(const p of PROJECT_WORKFLOWS){
  assert.match(p.href,/^\/(?:#|[a-z])/);
  assert.ok(p.useWhen.length>25&&p.confirm.length>25&&p.notFor.length>20);
 }
});
test("water-heater incentives cannot be selected for Massachusetts or a space-heating heat pump",()=>{
 assert.deepEqual(filterProjectWorkflows("water-heater","or").map(w=>w.id),["or-water"]);
 assert.equal(filterProjectWorkflows("water-heater","ma").length,0);
 assert.deepEqual(filterProjectWorkflows("space-heat-pump","ma").map(w=>w.id),["ma-space"]);
 assert.deepEqual(filterProjectWorkflows("space-heat-pump","or").map(w=>w.id),["or-space"]);
 assert.equal(filterProjectWorkflows("all","all").length,3);
});
test("invalid category or region is rejected without substituting another state",()=>{
 assert.throws(()=>filterProjectWorkflows("insulation","ma"),RangeError);
 assert.throws(()=>filterProjectWorkflows("water-heater","tx"),RangeError);
});
