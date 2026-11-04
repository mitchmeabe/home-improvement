import test from "node:test";
import assert from "node:assert/strict";
import {
 PORTLAND_GIS_QUERY,PORTLAND_GIS_FIELDS,PORTLAND_GIS_LAYER,
 parsePortlandStreetAddress,buildPortlandGISQuery,interpretPortlandGISResponse,
 lookupPortlandJurisdiction
} from "../src/lib/portland-jurisdiction-gis.ts";
import {initialDossierInput,resolveProjectDossier} from "../src/lib/oregon-project-dossier.ts";

const date="2026-11-04";
const office=parsePortlandStreetAddress("1120 SW 5th Ave");
const city=(overrides={})=>({
 ADDRESS_FULL:"1120 SW 5TH AVE",ADDRESS_NUMBER:1120,
 STREET_NAME:"5TH",STREET_TYPE_CODE:"AVE",STREET_PREFIX_DIRECTION:"SW",
 ZIP_CODE:"97204",UNIT:null,JURISDICTION_NAME:"PORTLAND",
 STATE_ABBREVIATION:"OR",STATUS:"Active",PROPERTY_ID:"R246103",...overrides
});
const gresham=(overrides={})=>({
 ADDRESS_FULL:"1333 NW EASTMAN PKWY",ADDRESS_NUMBER:1333,
 STREET_NAME:"EASTMAN",STREET_TYPE_CODE:"PKWY",STREET_PREFIX_DIRECTION:"NW",
 ZIP_CODE:"97030",UNIT:null,JURISDICTION_NAME:"GRESHAM",
 STATE_ABBREVIATION:"OR",STATUS:"Active",PROPERTY_ID:null,...overrides
});
const json=(...records)=>({features:records.map(attributes=>({attributes}))});
const decide=(raw,parts=office)=>interpretPortlandGISResponse(raw,parts,date);

test("street input parses numbered civic addresses without choosing mailing-city jurisdiction",()=>{
 assert.deepEqual(office,{houseNumber:1120,direction:"SW",streetName:"5TH",streetType:"AVE",unit:null,zip:null});
 assert.deepEqual(parsePortlandStreetAddress("1333 NW Eastman Parkway","","97030"),{
  houseNumber:1333,direction:"NW",streetName:"EASTMAN",streetType:"PKWY",unit:null,zip:"97030"
 });
 assert.equal(parsePortlandStreetAddress("1120 SW 5th Avenue","200","97204").unit,"200");
 assert.equal(parsePortlandStreetAddress("2200 Main St").direction,"");
});
test("invalid, partial or injection-like addresses fail closed before network access",()=>{
 for(const s of ["Portland OR 97204","1120 SW 5th","1120 SW 5th Ave' OR 1=1--",
  "1120 SW 5th Ave, Portland, OR 97204","SW 5th Ave","0 SW 5th Ave",
  "1120 SW 5th Ave #200", "1120 SW 5th Ave; DROP TABLE"]){
  assert.throws(()=>parsePortlandStreetAddress(s),RangeError,s);
 }
 assert.throws(()=>parsePortlandStreetAddress("1120 SW 5th Ave","123'OR1=1"),RangeError);
 assert.throws(()=>parsePortlandStreetAddress("1120 SW 5th Ave","","97%04"),RangeError);
});
test("City ArcGIS query uses constrained exact fields; excludes owner details, credentials and geometry",()=>{
 const url=new URL(buildPortlandGISQuery(office));
 assert.equal(url.origin,"https://www.portlandmaps.com");
 assert.equal(url.pathname,new URL(PORTLAND_GIS_QUERY).pathname);
 const where=url.searchParams.get("where");
 assert.match(where,/ADDRESS_NUMBER = 1120/);
 assert.match(where,/STREET_NAME = '5TH'/);
 assert.match(where,/STREET_TYPE_CODE = 'AVE'/);
 assert.match(where,/STREET_PREFIX_DIRECTION = 'SW'/);
 assert.match(where,/STATUS = 'Active'/);
 assert.doesNotMatch(where,/LIKE|OR 1|UPPER/);
 assert.equal(url.searchParams.get("returnGeometry"),"false");
 assert.equal(url.searchParams.get("resultRecordCount"),"101");
 assert.equal(url.searchParams.get("outFields"),PORTLAND_GIS_FIELDS.join(","));
 assert.ok(!url.searchParams.has("api_key"));
 assert.ok(!url.searchParams.get("outFields").includes("OWNER"));
});
test("street without direction does not accidentally require database NULL rather than blank field",()=>{
 const url=new URL(buildPortlandGISQuery(parsePortlandStreetAddress("2200 Main St")));
 assert.ok(!url.searchParams.get("where").includes("STREET_PREFIX_DIRECTION"));
});
test("authentic three-row City of Portland office address resolves one parcel with exact active City GIS evidence",()=>{
 const r=decide(json(
  city({UNIT:"200",ADDRESS_FULL:"1120 SW 5TH AVE #200"}),
  city(),
  city({UNIT:"1204",ADDRESS_FULL:"1120 SW 5TH AVE #1204"})
 ));
 assert.equal(r.status,"portland");
 assert.equal(r.jurisdiction,"PORTLAND");
 assert.equal(r.evidence?.source,"portlandmaps-active-address-points");
 assert.equal(r.evidence?.match,"exact-active-address");
 assert.equal(r.evidence?.scope,"portland");
 assert.equal(r.matchedRecords,3);
 assert.equal(r.propertyUrl,"https://www.portlandmaps.com/detail/property/R246103_did/");
 assert.equal(r.sourceUrl,PORTLAND_GIS_LAYER);
 assert.ok(!JSON.stringify(r).includes("1120"));
 assert.ok(!JSON.stringify(r).includes("5TH"));
});
test("exact unit requirements never adopt a different unit's property record",()=>{
 const unit=parsePortlandStreetAddress("1120 SW 5th Ave","300");
 const missing=decide(json(city({UNIT:"200"})),unit);
 assert.equal(missing.status,"not-found");
 assert.equal(missing.evidence,null);
 const exact=decide(json(city({UNIT:"300"})),unit);
 assert.equal(exact.status,"portland");
});
test("official Gresham city hall is outside Portland even though inside the Portland metro address service",()=>{
 const p=parsePortlandStreetAddress("1333 NW Eastman Pkwy");
 const r=decide(json(gresham()),p);
 assert.equal(r.status,"other-oregon");
 assert.equal(r.jurisdiction,"GRESHAM");
 assert.equal(r.evidence?.scope,"other-oregon");
 assert.equal(r.propertyUrl,null);
});
test("mailing city is never interpreted as legal jurisdiction and 25TH is not 5TH",()=>{
 const r=decide(json(city({STREET_NAME:"25TH",JURISDICTION_NAME:"GRESHAM"})));
 assert.equal(r.status,"not-found");
 assert.equal(r.evidence,null);
 const wrongType=decide(json(city({STREET_TYPE_CODE:"ST"})));
 assert.equal(wrongType.status,"not-found");
});
test("agency record with conflicting city or multiple parcel IDs stays ambiguous",()=>{
 const a=decide(json(city(),city({PROPERTY_ID:"R654321"})));
 const b=decide(json(city(),city({JURISDICTION_NAME:"TROUTDALE"})));
 assert.equal(a.status,"ambiguous");
 assert.equal(b.status,"ambiguous");
 assert.equal(a.evidence,null);
 assert.equal(b.evidence,null);
});
test("Portland classification requires identifiable single parcel; non-Portland record may lack property ID",()=>{
 assert.equal(decide(json(city({PROPERTY_ID:null}))).status,"ambiguous");
 assert.equal(decide(json(gresham()),parsePortlandStreetAddress("1333 NW Eastman Pkwy")).status,"other-oregon");
});
test("no records, truncated results, non-active rows and API errors never count as official approval",()=>{
 assert.equal(decide(json()).status,"not-found");
 assert.equal(decide(json(city({STATUS:"Retired"}))).status,"not-found");
 assert.equal(decide({error:{code:429,message:"rate limit"}}).status,"unavailable");
 assert.equal(decide({features:Array(101).fill({attributes:city()})}).status,"ambiguous");
 assert.equal(decide({features:[{attributes:city()}],exceededTransferLimit:true}).status,"ambiguous");
 assert.equal(decide("not json").status,"unavailable");
});
test("Oregon jurisdiction cannot be assigned to a Washington address point",()=>{
 const r=decide(json(city({STATE_ABBREVIATION:"WA"})));
 assert.equal(r.status,"outside-oregon");
 assert.equal(r.evidence,null);
});
test("client lookup sends no cookie, referrer or application-backed request and performs a single official fetch",async()=>{
 let called=0;
 const fake=async(url,options)=>{
  called++;
  assert.equal(new URL(url).host,"www.portlandmaps.com");
  assert.equal(options.method,"GET");
  assert.equal(options.credentials,"omit");
  assert.equal(options.cache,"no-store");
  assert.equal(options.referrerPolicy,"no-referrer");
  assert.equal(options.mode,"cors");
  return {ok:true,json:async()=>json(city())};
 };
 const r=await lookupPortlandJurisdiction("1120 SW 5th Ave","","",undefined,fake,date);
 assert.equal(called,1);
 assert.equal(r.status,"portland");
});
test("network error or ArcGIS 429 cannot silently promote an inferred Portland jurisdiction",async()=>{
 const err=await lookupPortlandJurisdiction("1120 SW 5th Ave","","",undefined,
  async()=>{throw new Error("network blocked")},date);
 const limited=await lookupPortlandJurisdiction("1120 SW 5th Ave","","",undefined,
  async()=>({ok:false,status:429}),date);
 assert.equal(err.status,"unavailable");
 assert.equal(limited.status,"unavailable");
 assert.equal(err.evidence,null);
});
test("exact official record can inform the existing heat-pump dossier without leaking an address",()=>{
 const r=decide(json(city()));
 const d=resolveProjectDossier({
  ...initialDossierInput(),place:"portland-gis-record",
  officialJurisdiction:r.evidence,house:"one-two-family"
 });
 assert.equal(d.jurisdiction,"official-portland-address");
 assert.equal(d.findings.find(f=>f.id==="space-mechanical")?.status,"required");
 assert.equal(d.findings.find(f=>f.id==="parcel-jurisdiction")?.basis,"official-address-record");
 assert.match(d.plainText,/exact government GIS address point/);
 assert.doesNotMatch(d.plainText,/1120 SW 5TH|R246103/);
 assert.equal(d.canTreatAsPermitApproval,false);
 assert.equal(d.canClaimRebate,false);
});
test("exact out-of-Portland evidence prevents Portland permit requirements",()=>{
 const r=decide(json(gresham()),parsePortlandStreetAddress("1333 NW Eastman Pkwy"));
 const d=resolveProjectDossier({
  ...initialDossierInput(),place:"other-oregon-gis-record",
  officialJurisdiction:r.evidence,house:"one-two-family",electricScope:"panel-replacement"
 });
 assert.equal(d.jurisdiction,"official-non-portland-address");
 assert.equal(d.findings.find(f=>f.id==="electrical-trade")?.status,"verify");
 assert.equal(d.counts.required,0);
});
test("dossier refuses stale or mismatched official evidence rather than accepting a typed provenance string",()=>{
 const r=decide(json(city()));
 const base=initialDossierInput();
 assert.throws(()=>resolveProjectDossier({...base,place:"portland-gis-record",officialJurisdiction:null}),RangeError);
 assert.throws(()=>resolveProjectDossier({...base,place:"portland-gis-record",
  officialJurisdiction:{...r.evidence,scope:"other-oregon"}}),RangeError);
 assert.throws(()=>resolveProjectDossier({...base,place:"other-oregon",
  officialJurisdiction:r.evidence}),RangeError);
});

test("City ADDRESS_NUMBER_CHAR may repeat the full house number but not introduce an unmatched suffix",()=>{
 assert.equal(decide(json(city({ADDRESS_NUMBER_CHAR:"1120"}))).status,"portland");
 assert.equal(decide(json(city({ADDRESS_NUMBER_CHAR:"1120A"}))).status,"not-found");
 assert.equal(decide(json(city({ADDRESS_NUMBER_CHAR:"A"}))).status,"not-found");
 assert.equal(decide(json(city({STREET_POST_DIRECTION:"E"}))).status,"not-found");
});
test("missing Oregon/Washington state data cannot be interpreted as outside Oregon",()=>{
 const r=decide(json(city({STATE_ABBREVIATION:null})));
 assert.equal(r.status,"ambiguous");
 assert.equal(r.evidence,null);
});
