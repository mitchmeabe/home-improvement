import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {initialInput,newQuote} from "../src/lib/oregon-heat-pump-water-heater.ts";
import {
 HPWH_FIT_REVIEWED,HPWH_FIT_SOURCES,newHPWHSite,newHPWHModelReview,
 hpwhFitSourceFresh,assessHPWHFit,hpwhEqualBidRequest,hpwhFitReport
} from "../src/lib/hpwh-purchase-fit.ts";

const site={
 location:"utility-room",lengthFt:10,widthFt:10,heightFt:8,
 temperature:"typically-above-38",power:"usable-240",drain:"nearby-gravity",demand:"typical"
};
const quotes=["a","b"].map((id,i)=>({...newQuote(id),
 installedTotal:i===0?3300:3700,scope:"same-location",tankGallons:65,
 priceBasis:"before-incentives",plumbingIncluded:"yes",electricalIncluded:"yes",
 condensateIncluded:"yes",airflowDocumented:"yes",warrantyWritten:"yes"}));
const models=["a","b"].map(id=>({...newHPWHModelReview(id),
 model:"Sample HPWH XYZ-65",manufacturerMinimumAirFt3:700,airPlan:"open-room",
 firstHourGallons:79,uef:3.9,voltage:"240",circuitPlanDocumented:"yes",
 condensateSolutionIncluded:"yes",modelOperatingTemperatureChecked:"yes",
 serviceClearanceDocumented:"yes",noiseAndCoolingDiscussed:"yes",
 commissioningAndHandoverIncluded:"yes"
}));
const project={...initialInput(),place:"portland-verified",house:"one-two-family",
 dwelling:"existing-owner",utility:"pge",installation:"contractor",
 currentFuel:"electric",replacement:"yes",newWiring:"no",newVentilation:"no",quotes};
function screen({sitePatch={},quotePatch={},modelPatch={},inputPatch={},asOf="2026-11-06"}={}){
 const q=quotes.map(x=>({...x,...(quotePatch[x.id]||{})}));
 const m=models.map(x=>({...x,...(modelPatch[x.id]||{})}));
 return assessHPWHFit({...project,...inputPatch,quotes:q},{...site,...sitePatch},m,asOf);
}
test("different HPWH equipment is not automatically equivalent to a cheaper quote",()=>{
 const r=screen({modelPatch:{b:{model:"Other Model 65B"}}});
 assert.equal(r.status,"material-differences");
 assert.equal(r.safeToCompareAsQuoted,false);
 assert.match(r.differences.join(" "),/Exact water-heater model/);
 assert.equal(r.noRebateAssumption,true);
 assert.equal(r.notProductApproval,true);
});
test("fully documented identical models and installation terms permit ONLY provisional as-quoted comparison",()=>{
 const r=screen();
 assert.equal(r.status,"ready-for-professional-review");
 assert.equal(r.measuredRoomVolumeFt3,800);
 assert.equal(r.safeToCompareAsQuoted,true);
 assert.ok(r.findings.every(x=>x.documented===11&&x.issues.length===0));
 assert.match(r.summary,/NOT|does not verify/);
 assert.match(r.priceComparisonExplanation,/no technical approval/);
});
test("room dimensions calculate measured enclosed air volume without certifying model clearance",()=>{
 const r=screen({sitePatch:{lengthFt:5,widthFt:5,heightFt:8}});
 assert.equal(r.measuredRoomVolumeFt3,200);
 assert.equal(r.safeToCompareAsQuoted,false);
 assert.ok(r.findings.every(f=>f.kind==="needs-revision"));
 assert.match(r.findings[0].airVolumeAssessment,/below the user-reported model minimum/);
 assert.match(r.findings[0].issues.join(" "),/approved intake\/exhaust or louver/);
});
test("documented model-approved duct/louver alternative is permitted as an installer-review path, not a guarantee",()=>{
 const r=screen({sitePatch:{lengthFt:5,widthFt:5,heightFt:8},
 modelPatch:{a:{airPlan:"manufacturer-approved-vent",ventPlanDocumented:"yes"},
             b:{airPlan:"manufacturer-approved-vent",ventPlanDocumented:"yes"}}});
 assert.equal(r.status,"ready-for-professional-review");
 assert.equal(r.safeToCompareAsQuoted,true);
 assert.match(r.findings[0].airVolumeAssessment,/must still verify/);
 const unknown=screen({sitePatch:{lengthFt:5,widthFt:5,heightFt:8},
 modelPatch:{a:{airPlan:"manufacturer-approved-vent",ventPlanDocumented:"unknown"},
             b:{airPlan:"manufacturer-approved-vent",ventPlanDocumented:"unknown"}}});
 assert.equal(unknown.safeToCompareAsQuoted,false);
 assert.match(unknown.findings[0].issues.join(" "),/not documented in writing/);
});
test("missing manufacturer minimum air volume blocks supposed installation fit even for a large room",()=>{
 const r=screen({modelPatch:{a:{manufacturerMinimumAirFt3:null}}});
 assert.equal(r.safeToCompareAsQuoted,false);
 assert.match(r.findings[0].issues.join(" "),/minimum unconfined air volume/);
});
test("measured site dimensions must be complete before supporting volume assessment",()=>{
 const r=screen({sitePatch:{heightFt:null}});
 assert.equal(r.measuredRoomVolumeFt3,null);
 assert.equal(r.safeToCompareAsQuoted,false);
});
test("first-hour rating is essential and different FHRs mean not equivalent hot-water delivery",()=>{
 const absent=screen({modelPatch:{a:{firstHourGallons:null}}});
 assert.equal(absent.safeToCompareAsQuoted,false);
 assert.match(absent.findings[0].issues.join(" "),/First Hour Rating/);
 const different=screen({modelPatch:{b:{firstHourGallons:58}}});
 assert.equal(different.status,"material-differences");
 assert.match(different.differences.join(" "),/First Hour Rating/);
});
test("UEF mismatch disclosed, never turned into claimed annual electricity savings",()=>{
 const r=screen({modelPatch:{b:{uef:3.2}}});
 assert.match(r.differences.join(" "),/Uniform Energy Factor/);
 const exported=hpwhFitReport(project,site,models,screen());
 assert.match(exported,/UEF 3.9/);
 assert.doesNotMatch(exported,/saves \$\d+ per year|approved annual savings/);
});
test("garage temperature below general guidance demands a model-specific qualified assessment",()=>{
 const r=screen({sitePatch:{location:"garage",temperature:"often-below-38"}});
 assert.equal(r.safeToCompareAsQuoted,false);
 assert.ok(r.findings.every(x=>x.issues.some(y=>/temperatures frequently below 38°F/.test(y))));
 assert.match(r.summary,/Do not treat the cheapest/);
});
test("different power/voltage without new electrical work must not be treated as confirmed",()=>{
 const r=screen({sitePatch:{power:"usable-120"}});
 assert.equal(r.safeToCompareAsQuoted,false);
 assert.ok(r.findings.some(x=>x.issues.some(z=>/differs from the proposed 240 V/.test(z))));
 const withPermittedNewWork=screen({
  sitePatch:{power:"usable-120"},inputPatch:{newWiring:"yes"}
 });
 assert.equal(withPermittedNewWork.safeToCompareAsQuoted,true);
 assert.match(hpwhEqualBidRequest(site),/Electrician-verified voltage/);
});
test("existing gas or no electrical circuit requires costed wiring before comparable installation",()=>{
 const r=screen({sitePatch:{power:"no-known-circuit"},inputPatch:{currentFuel:"gas",newWiring:"unknown"}});
 assert.equal(r.safeToCompareAsQuoted,false);
 assert.match(r.findings[0].issues.join(" "),/No suitable existing circuit/);
});
test("condensate pump must be scoped and no confirmed drain needs plumbing redesign",()=>{
 const noDrain=screen({sitePatch:{drain:"no-path"}});
 assert.equal(noDrain.safeToCompareAsQuoted,false);
 assert.match(noDrain.findings[0].issues.join(" "),/No condensate disposal route/);
 const needsPump=screen({sitePatch:{drain:"pump-needed"},modelPatch:{a:{condensateSolutionIncluded:"no"}}});
 assert.equal(needsPump.safeToCompareAsQuoted,false);
 assert.match(needsPump.findings[0].issues.join(" "),/condensate pump/);
});
test("unknown homeowner water demand and concentrated peak uses are never sized from gallons",()=>{
 const unknown=screen({sitePatch:{demand:"unknown"}});
 assert.equal(unknown.status,"site-review");
 assert.equal(unknown.safeToCompareAsQuoted,false);
 const peak=screen({sitePatch:{demand:"high-demand"}});
 assert.equal(peak.safeToCompareAsQuoted,false);
 assert.match(peak.findings[0].issues.join(" "),/FHR against household peak use/);
});
test("base quote matching scopes/discounts required independently of model match",()=>{
 const wrongPrice=screen({quotePatch:{a:{priceBasis:"after-incentives"}}});
 assert.equal(wrongPrice.safeToCompareAsQuoted,false);
 const missingWork=screen({quotePatch:{b:{electricalIncluded:"unknown"}}});
 assert.equal(missingWork.safeToCompareAsQuoted,false);
 assert.match(missingWork.findings[1].issues.join(" "),/circuit, wiring and permit/);
});
test("three quotes retain identities and all models must be checked; wrong or duplicate IDs fail closed",()=>{
 const c={...quotes[0],id:"c",installedTotal:4100};
 const cm={...models[0],id:"c"};
 const all=assessHPWHFit({...project,quotes:[...quotes,c]},site,[...models,cm],"2026-11-06");
 assert.equal(all.findings.length,3);
 assert.equal(all.safeToCompareAsQuoted,true);
 assert.deepEqual(all.findings.map(x=>x.id),["a","b","c"]);
 assert.throws(()=>assessHPWHFit(project,site,[models[0],models[0]],"2026-11-06"),RangeError);
 assert.throws(()=>assessHPWHFit(project,site,[models[0]],"2026-11-06"),RangeError);
});
test("invalid measurements, manufacturer values, and corrupted inputs cannot create false clearance",()=>{
 for(const patch of [{lengthFt:0},{widthFt:Infinity},{heightFt:31},{lengthFt:-2},{drain:"magic"}]){
  assert.throws(()=>screen({sitePatch:patch}),RangeError);
 }
 for(const patch of [{manufacturerMinimumAirFt3:-1},{firstHourGallons:999},{uef:NaN},{voltage:"gas"}]){
  assert.throws(()=>screen({modelPatch:{a:patch}}),RangeError);
 }
});
test("technical references expire and never imply a product is safe after source window",()=>{
 assert.equal(HPWH_FIT_REVIEWED,"2026-11-06");
 assert.equal(hpwhFitSourceFresh("2026-11-06"),true);
 assert.equal(hpwhFitSourceFresh("2027-01-05"),true);
 for(const bad of ["2026-11-05","2027-01-06","bad","2026-02-30"]){
  assert.equal(hpwhFitSourceFresh(bad),false);
  const r=screen({asOf:bad});assert.equal(r.status,"source-review");
  assert.equal(r.safeToCompareAsQuoted,false);
 }
});
test("request and buyer report preserve scope, references, measurements and unknown source boundaries",()=>{
 const req=hpwhEqualBidRequest(site);
 assert.match(req,/First Hour Rating/);
 assert.match(req,/condensate/i);
 assert.match(req,/not an engineering design/);
 assert.match(req,/energystar.gov/);
 const r=hpwhFitReport(project,site,models,screen());
 assert.match(r,/room volume: 800 ft³/);
 assert.match(r,/QUOTE A/);assert.match(r,/QUOTE B/);
 assert.match(r,/No product or installer approval/);
 assert.ok(Object.values(HPWH_FIT_SOURCES).every(x=>new URL(x.url).protocol==="https:"));
});
test("integration retains source privacy and noindex, and price ranking is gated on model-fit audit",()=>{
 const page=fs.readFileSync("src/app/oregon/heat-pump-water-heaters/page.tsx","utf8");
 assert.match(page,/HPWHPurchaseFitStudio/);
 assert.match(page,/safeToCompareAsQuoted/);
 assert.match(page,/Do not rank the quotes yet/);
 const ui=fs.readFileSync("src/components/hpwh-purchase-fit.tsx","utf8");
 assert.doesNotMatch(ui,/track\(\s*[^,]+\s*,\s*\{/);
 assert.match(fs.readFileSync("src/app/layout.tsx","utf8"),/index:\s*false/);
 assert.match(fs.readFileSync("src/app/robots.ts","utf8"),/disallow/);
});
