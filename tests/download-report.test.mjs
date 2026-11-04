import test from "node:test";import assert from "node:assert/strict";
import {safeReportFilename,downloadTextReport} from "../src/lib/download-report.ts";
test("reports export only predictable, no-PII file names",()=>{
 assert.equal(safeReportFilename("texas-course-gap"),"texas-course-gap-plan.txt");
 assert.equal(safeReportFilename("massachusetts-quote-review"),"massachusetts-quote-review-plan.txt");
 for(const bad of ["../private","foo.xlsx","a b","A/B","", "x".repeat(90)])assert.throws(()=>safeReportFilename(bad),RangeError);
});
test("empty reports rejected before creating browser objects",()=>{
 assert.throws(()=>downloadTextReport("texas-course-gap","  "),RangeError);
});
