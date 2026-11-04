import test from "node:test";import assert from "node:assert/strict";
import {findExplicitScopeDifferences} from "../src/lib/scope-coverage.ts";
const make=(id,answer)=>({id,fields:[
 {id:"electrical",label:"Electrical upgrade included",value:answer},
 {id:"disposal",label:"Old equipment disposal included",value:"unsure"},
]});
test("explicit yes/no disagreement identifies a material difference",()=>{
 assert.deepEqual(findExplicitScopeDifferences([make("a","yes"),make("b","no")]),["Electrical upgrade included"]);
});
test("unknown is not falsely classified as a concrete difference",()=>{
 assert.deepEqual(findExplicitScopeDifferences([make("a","yes"),make("b","unsure")]),[]);
 assert.deepEqual(findExplicitScopeDifferences([make("a","unsure"),make("b","no")]),[]);
});
test("multiple cost-bearing dimensions compared without guessing",()=>{
 const a=make("a","yes"),b=make("b","no");
 a.fields[1].value="no";b.fields[1].value="yes";
 assert.deepEqual(findExplicitScopeDifferences([a,b]),["Electrical upgrade included","Old equipment disposal included"]);
});
test("duplicates, mismatches or invalid inputs rejected",()=>{
 assert.throws(()=>findExplicitScopeDifferences([make("a","yes")]),RangeError);
 assert.throws(()=>findExplicitScopeDifferences([make("a","yes"),make("a","no")]),RangeError);
 assert.throws(()=>findExplicitScopeDifferences([make("a","yes"),{id:"b",fields:[]}]),RangeError);
});
