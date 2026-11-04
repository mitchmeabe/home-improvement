import test from "node:test";
import assert from "node:assert/strict";
import {resolveOregonProject} from "../src/lib/oregon-location-matcher.ts";
const make=(p={})=>resolveOregonProject({
 location:"portland",jurisdiction:"unverified",building:"one-two-family",
 electricUtility:"unknown",property:"existing-owner-occupied",
 wiring:"unsure",equipment:"heat-pump",...p
});
test("mailing Portland alone cannot trigger city-specific permit requirements",()=>{
 const x=make();assert.equal(x.permitAuthority,"not-established");
 assert.equal(x.effectiveLocation,"other-oregon");
 assert.equal(x.locationFindings[0].status,"check");
 assert.ok(x.locationFindings[0].detail.includes("Jurisdiction"));
});
test("PortlandMaps-confirmed residential project generates mechanical and conditionally electrical flags",()=>{
 const x=make({jurisdiction:"portland-confirmed",wiring:"new-hardwired-work"});
 assert.equal(x.permitAuthority,"portland-confirmed");
 assert.equal(x.effectiveLocation,"portland");
 assert.equal(x.locationFindings.find(y=>y.id==="mechanical").status,"required");
 assert.equal(x.locationFindings.find(y=>y.id==="electrical").status,"required");
 const noWiring=make({jurisdiction:"portland-confirmed",wiring:"no-known-work"});
 assert.equal(noWiring.locationFindings.find(y=>y.id==="electrical").status,"check");
});
test("multifamily or unknown building type stays in verification route",()=>{
 const x=make({jurisdiction:"portland-confirmed",building:"multifamily-other"});
 assert.equal(x.locationFindings[0].status,"check");
 assert.equal(x.locationFindings.some(y=>y.status==="required"),false);
});
test("confirmed outside Portland never inherits Portland trade-permit assertions",()=>{
 const x=make({jurisdiction:"not-portland",electricUtility:"pge"});
 assert.equal(x.permitAuthority,"outside-portland");
 assert.equal(x.effectiveLocation,"other-oregon");
 assert.equal(x.locationFindings.some(y=>y.status==="required"),false);
 assert.ok(x.programs.some(y=>y.id==="eto"&&y.status==="check"));
});
test("utility inquiry is not a numerical rebate award or eligibility clearance",()=>{
 const pge=make({jurisdiction:"portland-confirmed",electricUtility:"pge"});
 assert.ok(pge.programs.some(y=>y.id==="eto"));
 assert.ok(pge.programs.every(y=>y.status!=="required"));
 assert.ok(pge.programs.find(y=>y.id==="hp3").detail.includes("fully reserved"));
 const other=make({electricUtility:"other"});
 assert.ok(other.programs.find(y=>y.id==="eto").title.includes("not matched"));
});
test("out-of-state input yields no Oregon incentive path",()=>{
 const x=make({location:"outside-oregon",jurisdiction:"portland-confirmed",electricUtility:"pge"});
 assert.equal(x.effectiveLocation,"outside-oregon");
 assert.equal(x.programs.length,1);
 assert.equal(x.programs[0].status,"not-applicable");
});
test("Oregon non-Portland retains statewide HP3 review but no municipal determination",()=>{
 const x=make({location:"other-oregon",property:"existing-rental",electricUtility:"pacific-power"});
 assert.equal(x.permitAuthority,"outside-portland");
 assert.ok(x.programs.some(y=>y.id==="hp3"));
 assert.ok(x.programs.some(y=>y.id==="eto"));
 assert.equal(x.locationFindings.some(y=>y.status==="required"),false);
});

test("unsure state never becomes a confirmed Oregon incentive route",()=>{
 const x=make({location:"unknown",electricUtility:"pge"});
 assert.equal(x.effectiveLocation,"unknown");
 assert.equal(x.programs.length,1);
 assert.equal(x.programs[0].status,"check");
 assert.equal(x.programs.some(y=>y.id==="eto"),false);
});
test("city jurisdiction does not authorize one-family rules for unsupported larger buildings",()=>{
 const x=make({jurisdiction:"portland-confirmed",building:"multifamily-other"});
 assert.equal(x.effectiveLocation,"other-oregon");
 assert.equal(x.locationFindings.some(y=>y.status==="required"),false);
});
