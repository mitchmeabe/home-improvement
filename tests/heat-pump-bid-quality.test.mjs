import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {emptyQuote} from "../src/lib/heat-pump-quotes.ts";
import {
 BID_QUALITY_SOURCES,BID_QUALITY_REVIEWED,INITIAL_HEAT_PLAN,blankHeatBidQuality,
 heatBidSourcesFresh,evaluateHeatPumpBidQuality,heatPumpBidRequest,heatPumpBidQualityReport,
} from "../src/lib/heat-pump-bid-quality.ts";
const project={goal:"whole-home",replaceExisting:"yes",existingDucts:"yes"};
const quote=(id,change={})=>({...emptyQuote(id),
 installedPrice:id==="a"?13500:17000,
 priceBasis:"before-discounts",scope:"reuse-existing-ducts",
 commissioningIncluded:"yes",modelAndRatingsDocumented:"yes",...change});
const evidence=(id,change={})=>({...blankHeatBidQuality(id),
 loadMethod:"manual-j",loadReportProvided:"yes",
 manufacturerPerformanceAtDesign:"yes",matchedEquipmentModels:"yes",
 roomsOrZonesDocumented:"yes",backup:"new-auxiliary",ductReview:"documented",
 commissioningReport:"yes",ownerControlsHandover:"yes",
 designOutdoorTempF:20,documentedHeatLoadBtu:42000,
 manufacturerCapacityBtuAtDesign:44000,zonesServed:8,...change});
const run=(changedQuotes={},changedEvidence={},changedProject=project,date="2026-11-06")=>{
 const q=[quote("a",changedQuotes.a),quote("b",changedQuotes.b)];
 const b=[evidence("a",changedEvidence.a),evidence("b",changedEvidence.b)];
 return evaluateHeatPumpBidQuality(changedProject,q,b,date);
};
test("fully matched written evidence qualifies only for further professional review, never a contractor approval",()=>{
 const r=run();assert.equal(r.status,"ready-for-professional-review");
 assert.equal(r.findings[0].documented,9);assert.equal(r.findings[1].documented,9);
 assert.equal(r.notEquipmentApproval,true);assert.equal(r.noContractorEndorsement,true);
 assert.match(r.explanation,/NOT an equipment-sizing approval/);
 assert.deepEqual(r.differences,[]);
});
test("basic question template is an actionable document and does not make design calculations or promise rebates",()=>{
 const s=heatPumpBidRequest(project);
 assert.match(s,/Manual J/);assert.match(s,/manufacturer heating capacity/);
 assert.match(s,/duct/i);assert.match(s,/commissioning/i);
 assert.match(s,/BEFORE vs AFTER discounts/);
 assert.doesNotMatch(s,/\$2,000 rebate available|qualified for a tax credit/i);
 assert.match(s,/energystar.gov/);
});
test("square footage sizing or missing professional load report withholds ready designation",()=>{
 const x=run({}, {a:{loadMethod:"square-foot-only",loadReportProvided:"no"}});
 assert.equal(x.status,"needs-evidence");
 assert.ok(x.findings[0].questions.some(s=>/square-foot rules of thumb/.test(s)));
 assert.ok(x.findings[0].questions.some(s=>/written load report/.test(s)));
 assert.equal(x.findings[0].documented,7);
});
test("winter design temp, heating load and manufacturer capacity are reported, not judged by arbitrary ratio",()=>{
 const under=run({}, {a:{manufacturerCapacityBtuAtDesign:28000},b:{manufacturerCapacityBtuAtDesign:48000}});
 assert.equal(under.status,"ready-for-professional-review");
 const report=heatPumpBidQualityReport(project,[quote("a"),quote("b")],
 [evidence("a",{manufacturerCapacityBtuAtDesign:28000}),evidence("b",{manufacturerCapacityBtuAtDesign:48000})],under);
 assert.match(report,/No adequacy finding/);
 assert.match(report,/28000 BTU\/h/);
 assert.doesNotMatch(report,/undersized|oversized|will heat your home/i);
});
test("material differences in scope, backup, zones, temperature and price basis are flagged instead of recommending cheapest quote",()=>{
 const cases=[
 [{b:{scope:"new-ductwork"}},{},/Ductwork and installation scope/],
 [{},{b:{backup:"retain-existing"}},/Heating\/backup strategy/],
 [{},{b:{zonesServed:5}},/Number of rooms\/zones served/],
 [{},{b:{designOutdoorTempF:10}},/Outdoor sizing design temperature/],
 [{b:{priceBasis:"after-discounts"}},{},/Before\/after-discount/]
 ];
 for(const [q,b,match] of cases){
  const x=run(q,b);
  assert.equal(x.status,"different-projects");
  assert.ok(x.differences.some(y=>match.test(y)),String(match));
 }
});
test("unknown project goal or unknown bid scope is never documented-for-decision",()=>{
 assert.equal(run({}, {},INITIAL_HEAT_PLAN).status,"need-project-definition");
 assert.equal(run({a:{scope:"unknown"}}).status,"needs-evidence");
 assert.equal(run({b:{installedPrice:null}}).status,"needs-evidence");
 assert.equal(run({a:{priceBasis:"unsure"}}).status,"needs-evidence");
});
test("whole-home proposals without written zone coverage are materially incomplete",()=>{
 const x=run({}, {a:{roomsOrZonesDocumented:"no"}});
 assert.equal(x.status,"different-projects");
 assert.ok(x.differences.some(s=>/whole-home project/.test(s)));
});
test("ductless installation asks for appropriate ductless exception instead of requiring duct leakage measurements",()=>{
 const qs={a:{scope:"ductless"},b:{scope:"ductless"}};
 assert.equal(run(qs,{a:{ductReview:"not-applicable-ductless"},b:{ductReview:"not-applicable-ductless"}}).status,"ready-for-professional-review");
 const bad=run(qs);
 assert.equal(bad.status,"needs-evidence");
 assert.ok(bad.findings.every(f=>f.questions.some(s=>/Ductless system/.test(s))));
});
test("contradictory existing quote commitment versus new quality answer produces explicit correction question",()=>{
 const x=run({a:{commissioningIncluded:"no",modelAndRatingsDocumented:"no"}});
 assert.equal(x.status,"needs-evidence");
 assert.ok(x.findings[0].questions.some(s=>/price scope excludes commissioning/.test(s)));
 assert.ok(x.findings[0].questions.some(s=>/base quote.*equipment documentation/.test(s)));
});
test("homeowner replacement intent contradicting a retained backup is a flagged project inconsistency",()=>{
 const x=run({}, {a:{backup:"retain-existing"},b:{backup:"retain-existing"}});
 assert.equal(x.status,"different-projects");
 assert.ok(x.differences.some(s=>/expects to replace existing heat/.test(s)));
});
test("source review has a real expiration date and never upgrades stale advice",()=>{
 assert.equal(heatBidSourcesFresh("2026-11-06"),true);
 assert.equal(heatBidSourcesFresh("2027-01-05"),true);
 for(const d of ["2027-01-06","2026-11-05","not-a-date","2026-11-31"]){
  assert.equal(heatBidSourcesFresh(d),false);
  const r=run({}, {},project,d);assert.equal(r.status,"review-sources");
 }
});
test("invalid or untrusted selection/temperature/BTU values fail closed with specific validation errors",()=>{
 const q=[quote("a"),quote("b")];const b=[evidence("a"),evidence("b")];
 for(const v of [Infinity,NaN,-150,20.5,1000]){
  assert.throws(()=>evaluateHeatPumpBidQuality(project,q,[{...b[0],designOutdoorTempF:v},b[1]],"2026-11-06"),RangeError);
 }
 for(const v of [-1,0,Infinity,1.5]){
  assert.throws(()=>evaluateHeatPumpBidQuality(project,q,[{...b[0],documentedHeatLoadBtu:v},b[1]],"2026-11-06"),RangeError);
 }
 assert.throws(()=>evaluateHeatPumpBidQuality(project,q,[evidence("a"),evidence("a")],"2026-11-06"),RangeError);
 assert.throws(()=>evaluateHeatPumpBidQuality(project,[quote("a"),quote("a")],b,"2026-11-06"),RangeError);
 assert.throws(()=>evaluateHeatPumpBidQuality({...project,goal:"unicorn"},q,b,"2026-11-06"),RangeError);
});
test("third bid can be added without changing earlier bid identity",()=>{
 const q=[quote("a"),quote("b"),quote("c",{installedPrice:21500})];
 const b=[evidence("a"),evidence("b"),evidence("c")];
 const x=evaluateHeatPumpBidQuality(project,q,b,"2026-11-06");
 assert.equal(x.findings.length,3);assert.equal(x.status,"ready-for-professional-review");
 assert.deepEqual(x.findings.map(f=>f.id),["a","b","c"]);
});
test("buyer reports include all contractors, unresolved questions and official reference links, no private data sends",()=>{
 const x=run({}, {b:{loadReportProvided:"unsure",designOutdoorTempF:null}});
 const q=[quote("a"),quote("b")],b=[evidence("a"),evidence("b",{loadReportProvided:"unsure",designOutdoorTempF:null})];
 const s=heatPumpBidQualityReport(project,q,b,x);
 assert.match(s,/QUOTE A:/);assert.match(s,/QUOTE B:/);
 assert.match(s,/ASK INSTALLER:/);
 assert.match(s,/basc.pnnl.gov/);
 assert.match(s,/No model.*independently verified/);
});
test("independent primary sources and site protection remain intact",()=>{
 assert.equal(BID_QUALITY_REVIEWED,"2026-11-06");
 for(const x of Object.values(BID_QUALITY_SOURCES)){assert.equal(new URL(x.url).protocol,"https:");}
 const cmp=fs.readFileSync("src/components/heat-pump-quote-comparison.tsx","utf8");
 assert.match(cmp,/HeatPumpBidQualityStudio/);
 const ui=fs.readFileSync("src/components/heat-pump-bid-quality.tsx","utf8");
 assert.doesNotMatch(ui,/track\(\s*[^,]+\s*,\s*\{/);
 assert.match(fs.readFileSync("src/app/layout.tsx","utf8"),/index:\s*false/);
 assert.match(fs.readFileSync("src/app/robots.ts","utf8"),/disallow/);
});
