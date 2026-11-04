import test from "node:test";
import assert from "node:assert/strict";
import {
 HPQPL_XLSX,HPQPL_PAGE,parseHPQPLDate,normalizeHPQPLWorkbook,matchHPQPL,
 hpqplMatchReport
} from "../src/lib/mass-hpqpl.ts";

// Columns exactly transcribed from Mass Save's live September 27, 2026 workbook
// Air Source Heat Pump sheet, downloaded November 4, 2026 (SHA-256 listed in docs).
const header=[
 "AHRI Certified Reference Number","Date No Longer Eligible","Tonnage","Equipment Type",
 "Outdoor Unit Brand Name","AHRI Type","Outdoor Unit Model Number","Indoor Unit Brand Name",
 "Indoor Unit Type","Indoor Unit Model Number(s)","Furnace Model Number",
 "Cooling Capacity (AFull) - Single or High Stage (95F), btuh",
 "SEER2","HSPF2 (Region IV)","Heating Capacity (47F), btuh (Appendix M1)",
 "Heating Capacity at 5°F as calculated by M1","Heating Capacity Ratio @ 5°F",
 "Heating COP at 5°F as calculated by M1","EER (95F)",
 "EER2 (AFull) - Single or High Stage (95F)","IEER","COP at 47°F",
 "COP at 17°F","Dual Fuel","Refrigerant Type","Rebate Type"
];
// Sample model identifiers are from an actual public row (AHRI 218636276).
const row=(ahri,indoor,expiry=null,rebate="Residential & Commercial")=>[
 ahri,expiry,1.5,"Mini/Multi Split","TEST BRAND","AHRI TYPE","H18TT2",
 "TEST BRAND","Ducted",indoor,null,18000,20,10,21000,12000,.6,2,0,12,
 null,null,null,"No","R-32",rebate
];
const catalog=(records,meta={})=>normalizeHPQPLWorkbook([
 {sheet:"Air Source Heat Pump",data:[header,...records]}
],{fileName:"Mass-Save-Heat-Pump-QPL.xlsx",importedAt:"2026-11-04",
 sourceDataUpdatedOn:"2026-09-27",...meta});
const query=(ahri="218636276",indoor="H18TT2-I")=>({
 ahriReference:ahri,outdoorModel:"H18TT2",indoorModel:indoor
});
test("Mass Save links are exact official download and public lookup",()=>{
 assert.equal(HPQPL_PAGE,"https://www.masssave.com/heat-pump-qualified-list");
 assert.equal(HPQPL_XLSX,"https://www.masssave.com/-/media/Files/PDFs/Mass-Save-Heat-Pump-QPL.xlsx");
});
test("actual Read Me serial 46292 parses to publisher data update 2026-09-27",()=>{
 assert.equal(parseHPQPLDate(46292),"2026-09-27");
 assert.equal(parseHPQPLDate(new Date("2026-09-27T00:00:00.000Z")),"2026-09-27");
 assert.equal(parseHPQPLDate("2026-09-27"),"2026-09-27");
});
test("actual expiry string 1/1/2027 parses correctly; impossible dates never accepted",()=>{
 assert.equal(parseHPQPLDate("1/1/2027"),"2027-01-01");
 assert.equal(parseHPQPLDate("2027-01-01"),"2027-01-01");
 assert.equal(parseHPQPLDate("2/30/2027"),null);
 assert.equal(parseHPQPLDate("not provided"),null);
 assert.equal(parseHPQPLDate(null),null);
});
test("authentic 26-column header normalizes AHRI/model, rebate, capacity, refrigerant, and publisher date",()=>{
 const c=catalog([row(218636276,"H18TT2-I")]);
 assert.equal(c.rows.length,1);
 assert.equal(c.sheetsRead,1);
 assert.equal(c.sourceRows,1);
 assert.deepEqual(c.warnings,[]);
 assert.equal(c.sourceDataUpdatedOn,"2026-09-27");
 assert.equal(c.rows[0].ahri,"218636276");
 assert.equal(c.rows[0].outdoor,"H18TT2");
 assert.equal(c.rows[0].indoor,"H18TT2-I");
 assert.equal(c.rows[0].coolingBtu,18000);
 assert.equal(c.rows[0].residential,"yes");
 assert.equal(c.rows[0].refrigerant,"R-32");
});
test("actual residential example identifies precise certified pairing without asserting rebate award",()=>{
 const c=catalog([row(218636276,"H18TT2-I")]);
 const r=matchHPQPL(c,query(),"2026-11-04");
 assert.equal(r.status,"listed-residential");
 assert.equal(r.coolingBtu,18000);
 assert.match(r.reason,/snapshot|current official list/);
 assert.match(hpqplMatchReport("quote-a",r,c),/2026-09-27/);
});
test("no matching indoor pairing cannot claim an exact system",()=>{
 const c=catalog([row(218636276,"0")]);
 assert.equal(matchHPQPL(c,query(),"2026-11-04").status,"unresolved-indoor");
});
test("Date No Longer Eligible blocks a formerly-listed system on and after that day",()=>{
 const c=catalog([row(218636276,"H18TT2-I","1/1/2027")]);
 assert.equal(matchHPQPL(c,query(),"2026-12-31").status,"listed-residential");
 const r=matchHPQPL(c,query(),"2027-01-01");
 assert.equal(r.status,"listing-expired");
 assert.equal(r.coolingBtu,null);
 assert.match(hpqplMatchReport("quote-a",r,c),/no longer eligible from 2027-01-01/);
});
test("unknown nonempty expiry is fail-closed rather than treated as current",()=>{
 const c=catalog([row(218636276,"H18TT2-I","EXPIRED?")]);
 assert.equal(c.rows[0].dateEligibilityUnclear,true);
 assert.equal(matchHPQPL(c,query(),"2026-11-04").status,"listing-scope-unknown");
});
test("contradictory publisher expiration rows are ambiguous",()=>{
 const c=catalog([
  row(218636276,"H18TT2-I",null),
  row(218636276,"H18TT2-I","1/1/2027")
 ]);
 assert.equal(matchHPQPL(c,query(),"2026-11-04").status,"multiple-listings");
});
test("commercial-only row cannot substantiate a residential rebate",()=>{
 const c=catalog([row(218636276,"H18TT2-I",null,"Commercial Only")]);
 assert.equal(matchHPQPL(c,query(),"2026-11-04").status,"listed-commercial");
});
test("unrecognized sheet lacks proof and cannot generate imaginary matches",()=>{
 assert.throws(()=>normalizeHPQPLWorkbook([
  {sheet:"Read Me",data:[["Mass Save HPQPL"],["Notes only"]]}
 ],{fileName:"x.xlsx",importedAt:"2026-11-04"}),/No usable AHRI/);
});
