import test from "node:test";
import assert from "node:assert/strict";
import {initialDossierInput,resolveProjectDossier,DOSSIER_SOURCES,
 DOSSIER_REVIEWED_ON} from "../src/lib/oregon-project-dossier.ts";
const base=initialDossierInput();
const run=(patch={})=>resolveProjectDossier({...base,...patch});
const find=(r,id)=>r.findings.find(f=>f.id===id);

test("unknown mailing address never establishes Portland permit authority or required trade permits",()=>{
 const r=run();
 assert.equal(r.jurisdiction,"not-established");
 assert.equal(r.canTreatAsPermitApproval,false);
 assert.equal(r.canClaimRebate,false);
 assert.equal(r.confirmedUtilityAccount,false);
 assert.equal(r.counts.required,0);
 assert.ok(r.blockers.some(x=>/jurisdiction/i.test(x)));
 assert.equal(find(r,"parcel-jurisdiction")?.status,"verify");
 assert.match(r.plainText,/NO government parcel verification/);
});
test("reported Portland one-family space heat pump invokes existing mechanical rules",()=>{
 const r=run({place:"portland-reported",house:"one-two-family",
  electricScope:"unknown",electricUtility:"unknown"});
 assert.equal(r.jurisdiction,"user-reported-portland");
 assert.equal(find(r,"space-mechanical")?.status,"required");
 assert.equal(find(r,"space-electrical")?.status,"verify");
 assert.equal(find(r,"space-hp3")?.status,"historical-limit");
 assert.ok(r.documents.some(d=>d.id==="mechanical"));
 assert.ok(r.documents.some(d=>d.id==="hp3"));
 assert.equal(find(r,"water-professional"),undefined);
 assert.equal(r.canClaimRebate,false);
});
test("exact published 2026 HP3 equipment thresholds are numeric only, not a rebate",()=>{
 const r=run({place:"portland-reported",house:"one-two-family",
  hspf2:8.2,seer2:16.1,electricUtility:"pge"});
 assert.match(find(r,"hp3-efficiency")?.detail,/numeric/i);
 assert.match(find(r,"hp3-efficiency")?.detail,/does not establish eligibility/i);
 assert.equal(find(r,"space-hp3")?.sourceDate,"2026-10-01");
 assert.ok(r.blockers.some(x=>/funding/i.test(x)));
});
test("historical HP3 owner funding is never promoted to active reservations",()=>{
 const owner=run({property:"existing-owner-occupied",place:"portland-reported",house:"one-two-family"});
 const rental=run({property:"existing-rental",place:"portland-reported",house:"one-two-family"});
 assert.equal(find(owner,"space-hp3")?.status,"historical-limit");
 assert.equal(find(rental,"space-hp3")?.status,"verify");
 assert.match(find(owner,"space-hp3")?.detail,/reserved|snapshot/i);
 assert.equal(owner.canClaimRebate,false);
 assert.equal(rental.canClaimRebate,false);
});
test("Portland mailing address without jurisdiction record is not a permit approval",()=>{
 const r=run({place:"portland-unverified",house:"one-two-family",electricScope:"new-circuit"});
 assert.notEqual(find(r,"space-mechanical")?.status,"required");
 assert.equal(find(r,"electrical-trade")?.status,"verify");
 assert.equal(r.counts.required,0);
 assert.match(find(r,"parcel-jurisdiction")?.detail,/mailing address/i);
});
test("Portland jurisdiction with unsupported building type does not inherit one-family permits",()=>{
 const r=run({place:"portland-reported",house:"other",electricScope:"panel-replacement"});
 assert.equal(find(r,"space-mechanical"),undefined);
 assert.equal(find(r,"electrical-trade")?.status,"verify");
 assert.ok(r.blockers.some(x=>/residential/i.test(x)));
});
test("reported Oregon property outside Portland receives no Portland permit determinations",()=>{
 const r=run({place:"other-oregon",house:"one-two-family",electricScope:"both"});
 assert.equal(r.jurisdiction,"outside-portland");
 assert.equal(find(r,"electrical-trade")?.status,"verify");
 assert.equal(r.counts.required,0);
 assert.equal(find(r,"space-mechanical"),undefined);
});
test("out-of-state property receives no Oregon incentive recommendation",()=>{
 const r=run({place:"outside-oregon",house:"one-two-family",electricUtility:"pge"});
 const program=r.findings.filter(f=>f.group==="incentive");
 assert.ok(program.length>0);
 assert.ok(program.every(f=>f.status==="not-applicable"));
 assert.equal(r.counts.required,0);
});
test("water-heater replacement in Portland gets plumbing and altered-circuit permits",()=>{
 const r=run({project:"heat-pump-water-heater",place:"portland-reported",
  house:"one-two-family",electricScope:"new-circuit",waterHeaterReplacement:"yes",
  installRoute:"contractor",electricUtility:"pge"});
 assert.equal(find(r,"water-plumbing")?.status,"required");
 assert.equal(find(r,"water-electrical")?.status,"required");
 assert.equal(find(r,"electrical-trade"),undefined); // Existing HPWH permit is reused; no duplicate.
 assert.ok(r.documents.some(d=>d.id==="plumbing"));
 assert.ok(r.documents.some(d=>d.id==="water-incentive"));
 assert.equal(find(r,"space-hp3"),undefined);
 assert.ok(r.findings.some(f=>f.id==="water-professional"&&f.basis==="dated-program-snapshot"));
 assert.equal(r.canClaimRebate,false);
});
test("Portland townhouse or ADU heat-pump water heater uses confirmed Portland plumbing source",()=>{
 const r=run({project:"heat-pump-water-heater",place:"portland-reported",
  house:"townhouse-adu",waterHeaterReplacement:"yes"});
 assert.equal(find(r,"water-plumbing")?.status,"required");
 assert.equal(find(r,"water-plumbing")?.sourceUrl,DOSSIER_SOURCES.plumbing);
});
test("water-heater utility missing and DIY route keep exact incentive unresolved",()=>{
 const r=run({project:"heat-pump-water-heater",place:"other-oregon",
  house:"one-two-family",installRoute:"do-it-yourself",property:"existing-owner-occupied"});
 assert.ok(r.blockers.some(x=>/electric utility/i.test(x)));
 assert.equal(find(r,"water-utility-review")?.status,"verify");
 assert.equal(find(r,"space-hp3"),undefined);
});
test("new residential construction is explicitly excluded from published Home Retrofit offer",()=>{
 const r=run({project:"heat-pump-water-heater",place:"portland-reported",
  house:"one-two-family",property:"new-construction",electricUtility:"pge"});
 assert.equal(find(r,"water-new-build")?.status,"not-applicable");
 assert.equal(r.canClaimRebate,false);
});
test("standalone Portland panel project requires electrical permit and document handoff",()=>{
 const r=run({project:"electrical-panel",place:"portland-reported",
  house:"one-two-family",electricScope:"panel-replacement"});
 assert.equal(find(r,"electrical-trade")?.status,"required");
 assert.ok(r.documents.some(d=>d.id==="load"));
 assert.ok(r.documents.some(d=>d.id==="utility"));
 assert.ok(r.documents.some(d=>d.id==="electrical"));
 assert.equal(find(r,"space-hp3"),undefined);
 assert.equal(find(r,"water-professional"),undefined);
 assert.equal(r.canClaimRebate,false);
});
test("standalone panel work elsewhere requires local permit confirmation, not Portland clearance",()=>{
 const r=run({project:"electrical-panel",place:"other-oregon",
  house:"one-two-family",electricScope:"panel-replacement"});
 assert.equal(find(r,"electrical-trade")?.status,"verify");
 assert.equal(r.counts.required,0);
 assert.match(r.plainText,/actual city\/county/i);
});
test("DIY reported rental never inherits owner-occupant electrical exception",()=>{
 const r=run({project:"electrical-panel",place:"portland-reported",
  house:"one-two-family",property:"existing-rental",installRoute:"do-it-yourself"});
 assert.ok(r.blockers.some(x=>/DIY .*rights/i.test(x)));
 assert.equal(find(r,"licensed-work")?.status,"verify");
});
test("planned installation after evidence review triggers source recency warning",()=>{
 const r=run({plannedInstallationDate:"2027-04-01"});
 assert.equal(r.plannedDate,"2027-04-01");
 assert.ok(r.blockers.some(x=>/later than the last source review/i.test(x)));
 assert.ok(r.documents.some(d=>d.id==="timeline"));
});
test("dossier preserves a source URL and evidence date for every actionable finding",()=>{
 const r=run({place:"portland-reported",house:"one-two-family",
  electricScope:"both",electricUtility:"pge"});
 for(const f of r.findings){
  assert.equal(new URL(f.sourceUrl).protocol,"https:");
  assert.match(f.sourceDate,/^\d{4}-\d{2}-\d{2}$/);
  assert.ok(f.detail.length>25);
 }
 for(const d of r.documents)assert.ok(new URL(d.sourceUrl));
 assert.equal(DOSSIER_REVIEWED_ON,"2026-11-04");
 assert.equal(new Set(r.documents.map(d=>d.id)).size,r.documents.length);
 assert.equal(r.counts.required,r.findings.filter(f=>f.status==="required").length);
});
test("dossier text includes provenance, permit and documentation requirements",()=>{
 const r=run({place:"portland-reported",house:"one-two-family",electricScope:"both"});
 assert.match(r.plainText,/OFFICIAL RULE \/ PROGRAM FINDINGS/);
 assert.match(r.plainText,/EVIDENCE AND DOCUMENT REQUESTS/);
 assert.match(r.plainText,/NO issued permit/);
 assert.match(r.plainText,/https:\/\/www\.portland\.gov/);
 assert.ok(r.plainText.includes("NEXT ACTIONS"));
});
test("invalid dates, ratings, project type or utility inputs are rejected",()=>{
 assert.throws(()=>run({plannedInstallationDate:"2026-02-31"}),RangeError);
 assert.throws(()=>run({plannedInstallationDate:"yesterday"}),RangeError);
 assert.throws(()=>run({hspf2:NaN}),RangeError);
 assert.throws(()=>run({seer2:-1}),RangeError);
 assert.throws(()=>run({electricUtility:"generic-power"}),RangeError);
 assert.throws(()=>run({project:"solar-array"}),RangeError);
});

test("HP3 cannot be presented as a DIY installation incentive",()=>{
 const r=run({place:"portland-reported",house:"one-two-family",
  installRoute:"do-it-yourself",property:"existing-owner-occupied"});
 assert.equal(find(r,"space-hp3")?.status,"not-applicable");
 assert.match(find(r,"space-hp3")?.detail,/ODOE-approved contractor/);
 assert.ok(r.blockers.some(x=>/DIY installation/i.test(x)));
 assert.equal(r.canClaimRebate,false);
});
test("ADU DIY electrical project is not automatically allowed under owner-occupant exception",()=>{
 const r=run({project:"electrical-panel",place:"portland-reported",
  house:"townhouse-adu",installRoute:"do-it-yourself",property:"existing-owner-occupied"});
 assert.equal(find(r,"licensed-work")?.status,"verify");
 assert.ok(r.blockers.some(x=>/ADU/i.test(x)));
});

test("panel added to a heat-pump proposal replaces general circuit finding with one specific trade permit",()=>{
 const r=run({project:"space-heat-pump",place:"portland-reported",
  house:"one-two-family",electricScope:"both"});
 assert.equal(find(r,"electrical-trade")?.status,"required");
 assert.equal(find(r,"space-electrical"),undefined);
 assert.equal(r.findings.filter(x=>x.group==="permit"&&/electrical/i.test(x.title)).length,1);
 assert.ok(r.documents.some(d=>d.id==="electrical"));
});
test("unknown electrical scope shows one action, not two duplicate permit checks",()=>{
 const r=run({place:"portland-reported",house:"one-two-family",electricScope:"unknown"});
 assert.equal(find(r,"space-electrical")?.status,"verify");
 assert.equal(find(r,"electrical-trade"),undefined);
 assert.ok(r.blockers.some(x=>/Electrical circuit/i.test(x)));
});
