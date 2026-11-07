import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
 START_VISIT,emptyOffer,screenCozumel,sourceCurrent,reportCozumel,COZUMEL_SOURCES,
 COZUMEL_REVIEWED,COZUMEL_REVIEW_DAYS
} from "../src/lib/decision.ts";
const visit=()=>({...START_VISIT,pier:"international",pierVerified:"yes",
 allAboardShipMinute:1020,earliestAshoreShipMinute:480,
 allAboardVerified:"yes",timesConvertedToShipClock:"yes",partySize:2,
 preferredReturnReserveMinutes:60});
const offer=(id,more={})=>({...emptyOffer(id),label:id==="a"?"Island snorkel":"Island beach",
 activity:"snorkeling",sellerType:"independent",dateSpecificTourConfirmed:"yes",
 meetingAtCorrectPier:"yes",offerTimesOnShipClock:"yes",
 tourStartShipMinute:540,tourDurationMinutes:240,pierToMeetingMinutes:20,
 checkInMinutes:10,finishToPierMinutes:45,ageAndAccessibilityTermsChecked:"yes",
 missedPortCancellationReviewed:"yes",currency:"USD",pricePerPerson:89.5,
 mandatoryAdditionalTotal:15,...more});
const screen=(v=visit(),a=offer("a"),b=offer("b"),asOf="2026-11-06")=>screenCozumel(v,[a,b],asOf);
test("fully documented offers only achieve conditional-window, not booking or ship safety approval",()=>{
 const x=screen();assert.equal(x.status,"ready-for-review");
 for(const r of x.offers){
  assert.equal(r.status,"conditional-window");assert.equal(r.noAffiliate,true);
  assert.equal(r.noBookingGuarantee,true);
  assert.equal(r.estimatedPierReturnShipMinute,825);
  assert.equal(r.earliestPossibleMeetingMinute,510);
  assert.equal(r.latestConservativePierReturnMinute,960);
  assert.equal(r.slackMinutes,135);
  assert.equal(r.totalGroupPriceUSD,194);
  assert.match(r.issues.join(" "),/NOT real-time booking availability/);
 }
 assert.equal(x.noBookingGuarantee,true);assert.equal(x.noAffiliate,true);
});
test("ship's verified ALL ABOARD is the boundary, never scheduled sail-away minus guessed 30 minutes",()=>{
 const x=screen({...visit(),allAboardShipMinute:null,allAboardVerified:"unknown"});
 assert.equal(x.status,"ship-details-needed");
 assert.equal(x.offers[0].status,"needs-ship-details");
 assert.match(x.checks.join(" "),/not scheduled ship departure/i);
});
test("unknown or unconfirmed pier cannot be inferred from cruise line brand",()=>{
 for(const pier of ["unknown","puerta-maya","international","punta-langosta"]){
  const ok=screen({...visit(),pier,pierVerified:"unknown"});
  assert.equal(ok.status,"ship-details-needed");
  assert.equal(ok.offers[0].estimatedPierReturnShipMinute,null);
 }
 assert.equal(screen({...visit(),pier:"puerta-maya"}).offers[0].status,"conditional-window");
});
test("ship vs Cozumel local clock mismatch blocks result instead of guessing offsets",()=>{
 for(const v of ["unknown","no"]){
  const x=screen({...visit(),timesConvertedToShipClock:v});
  assert.equal(x.status,"ship-details-needed");
  assert.equal(x.offers[0].status,"needs-ship-details");
 }
 const y=screen(visit(),offer("a",{offerTimesOnShipClock:"no"}));
 assert.equal(y.offers[0].status,"needs-offer-details");
 assert.match(y.offers[0].issues.join(" "),/same verified SHIP clock/);
});
test("arrival time at meeting point must be achievable after shore access, transfers and check-in",()=>{
 const q=offer("a",{pierToMeetingMinutes:90});const r=screen(visit(),q).offers[0];
 assert.equal(r.status,"schedule-conflict");assert.match(r.issues.join(" "),/starts before/);
 assert.equal(r.earliestPossibleMeetingMinute,580);
 assert.equal(r.estimatedPierReturnShipMinute,825);
});
test("time exactly at user-selected reserve limit is provisional; one minute over conflicts",()=>{
 const v=visit();
 const equal=offer("a",{tourStartShipMinute:660,tourDurationMinutes:240,finishToPierMinutes:60});
 const x=screen(v,equal).offers[0];assert.equal(x.status,"conditional-window");
 assert.equal(x.estimatedPierReturnShipMinute,960);assert.equal(x.slackMinutes,0);
 const later=screen(v,{...equal,finishToPierMinutes:61}).offers[0];
 assert.equal(later.status,"schedule-conflict");assert.equal(later.slackMinutes,-1);
 assert.match(later.issues.join(" "),/later than your chosen/);
});
test("a 120-minute personal return reserve tightens the window without claiming ship rule",()=>{
 const v={...visit(),preferredReturnReserveMinutes:120};
 const q=offer("a",{tourStartShipMinute:750,tourDurationMinutes:180,finishToPierMinutes:30});
 assert.equal(screen(visit(),q).offers[0].status,"conditional-window");
 const x=screen(v,q).offers[0];
 assert.equal(x.status,"schedule-conflict");
 assert.equal(x.latestConservativePierReturnMinute,900);
});
test("independent mainland ferry tours require manual schedule assessment even when arithmetic fits",()=>{
 const x=screen(visit(),offer("a",{activity:"mainland-ferry"})).offers[0];
 assert.equal(x.status,"manual-ferry-review");
 assert.equal(x.totalGroupPriceUSD,194);
 assert.equal(x.noBookingGuarantee,true);
 assert.match(x.issues.join(" "),/ferry timetables/);
});
test("seller's written date and time, correct terminal, cancellation, age/boarding all must be confirmed",()=>{
 const keys=["dateSpecificTourConfirmed","meetingAtCorrectPier","offerTimesOnShipClock",
 "ageAndAccessibilityTermsChecked","missedPortCancellationReviewed"];
 for(const k of keys)for(const ans of ["unknown","no"]){
  const x=screen(visit(),offer("a",{[k]:ans})).offers[0];
  assert.equal(x.status,"needs-offer-details",k+" "+ans);
 }
 for(const val of ["unknown","cruise-line","independent"]){
  const x=screen(visit(),offer("a",{sellerType:val})).offers[0];
  assert.equal(x.status,val==="unknown"?"needs-offer-details":"conditional-window");
  assert.equal(x.noBookingGuarantee,true);
 }
});
test("no false bookability from incomplete start, duration, pickup, checkin or return",()=>{
 for(const k of ["tourStartShipMinute","tourDurationMinutes","pierToMeetingMinutes",
 "checkInMinutes","finishToPierMinutes"]){
  const x=screen(visit(),offer("a",{[k]:null})).offers[0];
  assert.equal(x.status,"needs-offer-details",k);
  assert.equal(x.estimatedPierReturnShipMinute,null);
 }
});
test("no auto currency conversion or zero assumption for missing mandatory fees",()=>{
 for(const patch of [
  {currency:"other"},{currency:"unknown"},{pricePerPerson:null},{mandatoryAdditionalTotal:null}
 ]){
  const x=screen(visit(),offer("a",patch)).offers[0];
  assert.equal(x.status,"needs-offer-details");
  assert.equal(x.totalGroupPriceUSD,null);
 }
 assert.equal(screen({...visit(),partySize:3},offer("a")).offers[0].totalGroupPriceUSD,283.5);
 const free=screen(visit(),offer("a",{pricePerPerson:0,mandatoryAdditionalTotal:0})).offers[0];
 assert.equal(free.totalGroupPriceUSD,0);
});
test("numeric whole-cent validity is strict and no price overflow/NaN can be ranked",()=>{
 for(const bad of [NaN,Infinity,-1,79.999,1000000.01]){
  const x=screen(visit(),offer("a",{pricePerPerson:bad})).offers[0];
  assert.equal(x.status,"needs-offer-details");assert.equal(x.totalGroupPriceUSD,null);
 }
 for(const good of [0.01,19.29,79.99,199.95,999999.99]){
  const x=screen({...visit(),partySize:1},offer("a",{pricePerPerson:good,mandatoryAdditionalTotal:0})).offers[0];
  assert.equal(x.status,"conditional-window",String(good));assert.equal(x.totalGroupPriceUSD,good);
 }
});
test("invalid party size, clock values and crossing midnight fail closed",()=>{
 for(const party of [0,13,NaN,1.5]){
  const x=screen({...visit(),partySize:party});
  assert.equal(x.status,"ship-details-needed");assert.equal(x.offers[0].totalGroupPriceUSD,null);
 }
 for(const time of [-1,1440,NaN,1.1]){
  assert.equal(screen({...visit(),allAboardShipMinute:time}).status,"ship-details-needed");
 }
 const over=screen(visit(),offer("a",{tourStartShipMinute:1380,tourDurationMinutes:120}));
 assert.equal(over.offers[0].status,"needs-offer-details");
 assert.match(over.offers[0].issues.join(" "),/cross midnight/);
});
test("source data expiry, invalid dates and backdating suppress all time-screen results",()=>{
 assert.equal(COZUMEL_REVIEWED,"2026-11-06");assert.equal(COZUMEL_REVIEW_DAYS,45);
 assert.equal(sourceCurrent("2026-12-21"),true);
 for(const date of ["2026-12-22","2026-11-05","2026-02-30","invalid"]){
  const x=screen(visit(),offer("a"),offer("b"),date);
  assert.equal(x.status,"source-review");
  assert.ok(x.offers.every(r=>r.estimatedPierReturnShipMinute===null));
 }
});
test("invalid shapes fail closed and never throw from optional second quote",()=>{
 for(const v of [null,[],{},undefined]) {
  const x=screenCozumel(v,[offer("a"),offer("b")],"2026-11-06");
  assert.equal(x.status,"ship-details-needed");
 }
 for(const quotes of [[],[offer("a")],null,[offer("b"),offer("a")]]){
  const x=screenCozumel(visit(),quotes,"2026-11-06");
  assert.ok(x.offers.every(q=>q.status!=="conditional-window"));
 }
});
test("full report preserves original clocks and official policies with no invented booking or protected status",()=>{
 const v=visit(),offers=[offer("a"),offer("b")];
 const x=screenCozumel(v,offers,"2026-11-06");
 const r=reportCozumel(x,v,offers);
 assert.match(r,/17:00/);assert.match(r,/13:45/);
 assert.match(r,/not real-time booking|no affiliation|no ticket availability/i);
 assert.match(r,/royalcaribbean.com/);assert.match(r,/carnival.com/);
 assert.match(r,/cozumel/);
});
test("cross-product itinerary and offer uncertainties never create guaranteed safe or bookable labels",()=>{
 let count=0;
 for(const pier of ["puerta-maya","international","punta-langosta","unknown"])
 for(const clock of ["yes","no","unknown"])
 for(const meeting of ["yes","no","unknown"])
 for(const channel of ["independent","cruise-line","unknown"])
 for(const activity of ["beach","snorkeling","mainland-ferry","other"]){
  const o=screen({...visit(),pier,timesConvertedToShipClock:clock},offer("a",{meetingAtCorrectPier:meeting,sellerType:channel,activity})).offers[0];
  assert.equal(o.noBookingGuarantee,true);assert.equal(o.noAffiliate,true);
  assert.ok(!JSON.stringify(o).includes("guaranteed-bookable"));
  if(pier==="unknown"||clock!=="yes")assert.equal(o.status,"needs-ship-details");
  if(activity==="mainland-ferry"&&pier!=="unknown"&&clock==="yes"&&meeting==="yes"&&channel!=="unknown")
   assert.equal(o.status,"manual-ferry-review");
  count++;
 }
 assert.equal(count,432);
});
test("only cited sources linked; no merchant checkout, affiliate codes, tracking or user data transmission",()=>{
 for(const u of Object.values(COZUMEL_SOURCES))assert.match(u,/^https:\/\//);
 const ui=fs.readFileSync("src/ShoreApp.tsx","utf8");
 const engine=fs.readFileSync("src/lib/decision.ts","utf8");
 const html=fs.readFileSync("index.html","utf8"),robots=fs.readFileSync("public/robots.txt","utf8");
 assert.match(html,/noindex,nofollow/);assert.match(robots,/Disallow: \/$/m);
 assert.doesNotMatch(ui+engine,/\bfetch\(|\bsendBeacon\(|localStorage|sessionStorage|affiliate_id|utm_|track\(|stripe\\.com|createCheckout|checkout-session/i);
 assert.match(ui,/No.*affiliate|No.*commercial/i);
});
