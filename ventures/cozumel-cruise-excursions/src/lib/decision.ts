/** Independent Cozumel shore-excursion *window screening*, NOT real-time availability or ship-return protection.
 * User enters ship-clock values after independently verifying their ship, terminal, all-aboard and offer details.
 * No operator ranking, payments, referral, merchant listing, location data, or booking claims.
 */
export const COZUMEL_REVIEWED="2026-11-06";
export const COZUMEL_REVIEW_DAYS=45;
export const COZUMEL_SOURCES={
 royalAllAboard:"https://www.royalcaribbean.com/faq/questions/do-i-need-to-book-a-shore-excursion",
 royalProtection:"https://www.royalcaribbean.com/int/en/faq/questions/will-the-ship-wait-for-guests-on-a-shore-excursion",
 carnivalIndependent:"https://help.carnival.com/app/answers/detail/a_id/2866/~/shore-excursion-faqs",
 portTerminals:"https://www.visitcozumel.com.mx/meet/",
 timeWarning:"https://thisiscozumel.com/tourist-info/91-transport?start=9",
 viatorPartner:"https://partnerresources.viator.com/",
} as const;
export type Pier="puerta-maya"|"international"|"punta-langosta"|"unknown";
export type YesNo="yes"|"no"|"unknown";
export type Activity="beach"|"island-tour"|"snorkeling"|"mainland-ferry"|"other"|"unknown";
export type BookingChannel="cruise-line"|"independent"|"unknown";
export type Currency="USD"|"other"|"unknown";
export type QuoteId="a"|"b";
export interface Visit{
 pier:Pier; pierVerified:YesNo;
 allAboardShipMinute:number|null;
 earliestAshoreShipMinute:number|null;
 allAboardVerified:YesNo;
 timesConvertedToShipClock:YesNo;
 partySize:number;
 preferredReturnReserveMinutes:30|45|60|90|120;
}
export interface Offer{
 id:QuoteId;
 label:string;
 activity:Activity;
 sellerType:BookingChannel;
 dateSpecificTourConfirmed:YesNo;
 meetingAtCorrectPier:YesNo;
 offerTimesOnShipClock:YesNo;
 tourStartShipMinute:number|null;
 tourDurationMinutes:number|null;
 pierToMeetingMinutes:number|null;
 checkInMinutes:number|null;
 finishToPierMinutes:number|null;
 ageAndAccessibilityTermsChecked:YesNo;
 missedPortCancellationReviewed:YesNo;
 currency:Currency;
 pricePerPerson:number|null;
 mandatoryAdditionalTotal:number|null;
}
export const emptyOffer=(id:QuoteId):Offer=>({
 id,label:"",activity:"unknown",sellerType:"unknown",
 dateSpecificTourConfirmed:"unknown",meetingAtCorrectPier:"unknown",
 offerTimesOnShipClock:"unknown",tourStartShipMinute:null,tourDurationMinutes:null,
 pierToMeetingMinutes:null,checkInMinutes:null,finishToPierMinutes:null,
 ageAndAccessibilityTermsChecked:"unknown",missedPortCancellationReviewed:"unknown",
 currency:"unknown",pricePerPerson:null,mandatoryAdditionalTotal:null
});
export const START_VISIT:Visit={
 pier:"unknown",pierVerified:"unknown",allAboardShipMinute:null,
 earliestAshoreShipMinute:null,allAboardVerified:"unknown",
 timesConvertedToShipClock:"unknown",partySize:2,preferredReturnReserveMinutes:60
};
export const STATUS=["needs-ship-details","needs-offer-details","schedule-conflict",
 "conditional-window","manual-ferry-review","source-review"] as const;
export type Status=typeof STATUS[number];
export interface OfferAssessment{
 id:QuoteId;status:Status;headline:string;issues:string[];
 estimatedPierReturnShipMinute:number|null;
 latestConservativePierReturnMinute:number|null;
 earliestPossibleMeetingMinute:number|null;
 slackMinutes:number|null;
 totalGroupPriceUSD:number|null;
 noBookingGuarantee:true;noAffiliate:true;
}
export interface Decision{
 status:"ready-for-review"|"ship-details-needed"|"source-review";
 headline:string;checks:string[];offers:[OfferAssessment,OfferAssessment];
 reviewedOn:string;noBookingGuarantee:true;noAffiliate:true;
}
const validDay=(s:string)=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
 const epoch=Date.parse(s+"T00:00:00Z");
 return Number.isFinite(epoch)&&new Date(epoch).toISOString().slice(0,10)===s;
};
export function sourceCurrent(asOf:string):boolean {
 if(!validDay(asOf)||!validDay(COZUMEL_REVIEWED))return false;
 const d=(Date.parse(asOf+"T00:00:00Z")-Date.parse(COZUMEL_REVIEWED+"T00:00:00Z"))/86400000;
 return d>=0&&d<=COZUMEL_REVIEW_DAYS;
}
const yesNo=(x:unknown):x is YesNo=>x==="yes"||x==="no"||x==="unknown";
const time=(x:unknown):x is number=>typeof x==="number"&&Number.isInteger(x)&&x>=0&&x<=1439;
const mins=(x:unknown):x is number=>typeof x==="number"&&Number.isInteger(x)&&x>=0&&x<=1200;
const amount=(x:unknown):x is number=>typeof x==="number"&&Number.isFinite(x)&&x>=0&&x<=1000000&&
 Math.abs(Math.round(x*100)-x*100)<1e-6;
const fmt=(n:number)=>String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
const quoteInvalid=(q:unknown,id:QuoteId):boolean=>{
 if(!q||typeof q!=="object"||Array.isArray(q))return true;
 const a=q as Offer;
 return a.id!==id||typeof a.label!=="string"||a.label.length>80||
  !["beach","island-tour","snorkeling","mainland-ferry","other","unknown"].includes(a.activity)||
  !["cruise-line","independent","unknown"].includes(a.sellerType)||
  ![a.dateSpecificTourConfirmed,a.meetingAtCorrectPier,a.offerTimesOnShipClock,
   a.ageAndAccessibilityTermsChecked,a.missedPortCancellationReviewed].every(yesNo)||
  ![a.tourStartShipMinute,a.tourDurationMinutes,a.pierToMeetingMinutes,
    a.checkInMinutes,a.finishToPierMinutes].every(x=>x===null||(typeof x==="number"&&Number.isInteger(x)&&x>=0&&x<=1439))||
  !["USD","other","unknown"].includes(a.currency)||
  ![a.pricePerPerson,a.mandatoryAdditionalTotal].every(x=>x===null||amount(x));
};
function failure(id:QuoteId,status:Status,headline:string,issues:string[],total:number|null=null):OfferAssessment{
 return {id,status,headline,issues,estimatedPierReturnShipMinute:null,
 latestConservativePierReturnMinute:null,earliestPossibleMeetingMinute:null,
 slackMinutes:null,totalGroupPriceUSD:total,noBookingGuarantee:true,noAffiliate:true};
}
function evaluateOffer(v:Visit,raw:unknown,id:QuoteId,baseProblems:readonly string[]):OfferAssessment{
 if(quoteInvalid(raw,id))return failure(id,"needs-offer-details","The offer inputs are not valid",["Invalid price, duration, status or quote identity."]);
 const q=raw as Offer;
 let price:number|null=null;
 if(q.currency==="USD"&&Number.isInteger(v.partySize)&&v.partySize>=1&&v.partySize<=12&&q.pricePerPerson!==null&&q.mandatoryAdditionalTotal!==null)
  price=Math.round((q.pricePerPerson*v.partySize+q.mandatoryAdditionalTotal)*100)/100;
 if(baseProblems.length)return failure(id,"needs-ship-details","Confirm the ship facts before screening an excursion",[...baseProblems],price);
 const problems:string[]=[];
 if(q.activity==="unknown")problems.push("Choose the actual excursion activity and whether travel off the island is involved.");
 if(q.sellerType==="unknown")problems.push("Identify whether the booking is sold by your cruise line or independently. Only ship-sold tour protections may apply.");
 if(q.dateSpecificTourConfirmed!=="yes")problems.push("Confirm the seller actually runs this tour on the ship's particular port date and at the stated starting time; availability is not checked here.");
 if(q.meetingAtCorrectPier!=="yes")problems.push("Confirm the correct terminal and precise meeting point with the operator; terminal names and ship berths can change.");
 if(q.offerTimesOnShipClock!=="yes")problems.push("Translate the operator's local start/finish information into the same verified SHIP clock used for all aboard.");
 if(q.ageAndAccessibilityTermsChecked!=="yes")problems.push("Verify participant age limits, mobility/boarding requirements and safety restrictions directly with the operator.");
 if(q.missedPortCancellationReviewed!=="yes")problems.push("Read the dated cancellation/refund policy if your ship skips the port or arrives late.");
 if(q.currency!=="USD"||q.pricePerPerson===null||q.mandatoryAdditionalTotal===null)
  problems.push("Enter the full USD per-person price and all mandatory USD group fees to calculate a non-bookable group price.");
 const fields=[q.tourStartShipMinute,q.tourDurationMinutes,q.pierToMeetingMinutes,q.checkInMinutes,q.finishToPierMinutes];
 if(fields.some(x=>x===null))problems.push("Enter tour start, total tour duration, transfer times and operator check-in minutes; no travel-time assumptions are made.");
 if(q.tourDurationMinutes!==null && q.tourDurationMinutes<15)problems.push("A tour duration below 15 minutes needs direct confirmation.");
 // Allow same-day itinerary only; 0 minutes for on-pier transfer is permitted when explicitly entered.
 if(problems.length)return failure(id,q.activity==="mainland-ferry"?"manual-ferry-review":"needs-offer-details",
  "Verify the written excursion details before booking",problems,price);
 const start=q.tourStartShipMinute!,len=q.tourDurationMinutes!;
 const earliest=v.earliestAshoreShipMinute!+q.pierToMeetingMinutes!+q.checkInMinutes!;
 const returnAt=start+len+q.finishToPierMinutes!;
 const latest=v.allAboardShipMinute!-v.preferredReturnReserveMinutes;
 if(start+len>1439||returnAt>1439||earliest>1439||latest<0)
  return failure(id,"needs-offer-details","Same-day timing is not fully representable",[
   "The input appears to cross midnight or exceed the same-day port window; manual review is required."],price);
 if(q.activity==="mainland-ferry")
  return {...failure(id,"manual-ferry-review","Mainland ferry and ground connections require manual review",[
   "An independent mainland excursion requires date-specific ferry timetables, boarding windows, road connections, missed-ferry contingencies and operator written confirmation. Numeric time fit cannot establish return reliability."],price),
   estimatedPierReturnShipMinute:returnAt,latestConservativePierReturnMinute:latest,earliestPossibleMeetingMinute:earliest,
   slackMinutes:latest-returnAt};
 if(start<earliest||returnAt>latest||returnAt>=v.allAboardShipMinute!)
  return {...failure(id,"schedule-conflict","The entered tour conflicts with the usable port window",[
   ...(start<earliest?["The planned tour starts before your earliest realistic meeting arrival at "+fmt(earliest)+" ship time."]:[]),
   ...(returnAt>latest?["Estimated return to the ship's pier at "+fmt(returnAt)+" is later than your chosen pre-all-aboard reserve cutoff "+fmt(latest)+"."]:[]),
   "Do not book based on this schedule. Recheck the operator's revised dates, meeting point, timing and ship rules."],price),
   estimatedPierReturnShipMinute:returnAt,latestConservativePierReturnMinute:latest,earliestPossibleMeetingMinute:earliest,
   slackMinutes:latest-returnAt};
 return {id,status:"conditional-window",headline:"The supplied same-day timing fits your chosen reserve window",
  issues:["This is a provisional arithmetic screen, NOT real-time booking availability, ship-return safety clearance or a guaranteed transfer.","Ships can depart even if an independently booked tour is late. Reconfirm onboard all-aboard time, ship clock, exact berth and operator pickup before paying."],
  estimatedPierReturnShipMinute:returnAt,latestConservativePierReturnMinute:latest,
  earliestPossibleMeetingMinute:earliest,slackMinutes:latest-returnAt,totalGroupPriceUSD:price,
  noBookingGuarantee:true,noAffiliate:true};
}
export function screenCozumel(v:unknown,offers:unknown,asOf:string=COZUMEL_REVIEWED):Decision{
 const none:[OfferAssessment,OfferAssessment]=[
  failure("a","needs-ship-details","Enter confirmed ship facts",[]),
  failure("b","needs-ship-details","Enter confirmed ship facts",[])
 ];
 if(!sourceCurrent(asOf))return {status:"source-review",headline:"Source review is due",
  checks:["The port and cruise-policy source snapshot is stale or invalid. Confirm current cruise-line and operator rules before screening."],
  offers:none,reviewedOn:COZUMEL_REVIEWED,noBookingGuarantee:true,noAffiliate:true};
 if(!v||typeof v!=="object"||Array.isArray(v)||!Array.isArray(offers)||offers.length!==2)
  return {status:"ship-details-needed",headline:"Provide one verified port visit and two optional offer slots",
   checks:["Input shape is incomplete or invalid."],offers:none,reviewedOn:COZUMEL_REVIEWED,noBookingGuarantee:true,noAffiliate:true};
 const a=v as Visit;
 const problems:string[]=[];
 if(!["puerta-maya","international","punta-langosta","unknown"].includes(a.pier)||
  a.pier==="unknown"||a.pierVerified!=="yes")
  problems.push("Verify the exact Cozumel cruise terminal in the cruise line app or onboard daily program. Never infer it solely from the cruise brand.");
 if(a.allAboardVerified!=="yes"||!time(a.allAboardShipMinute))
  problems.push("Use the confirmed onboard ALL-ABOARD time, not scheduled ship departure time or an assumed 30-minute offset.");
 if(a.timesConvertedToShipClock!=="yes")
  problems.push("Confirm that every entered tour and port time uses the SAME ship clock; Cozumel local time may differ from ship time.");
 if(!time(a.earliestAshoreShipMinute))
  problems.push("Enter your earliest realistic time ashore in ship time, accounting for docking, clearance and disembarkation.");
 if(!Number.isInteger(a.partySize)||a.partySize<1||a.partySize>12)
  problems.push("Supported party sizes are 1 through 12.");
 if(![30,45,60,90,120].includes(a.preferredReturnReserveMinutes))
  problems.push("Choose a return reserve of 30, 45, 60, 90 or 120 minutes before your verified all-aboard.");
 if(time(a.earliestAshoreShipMinute)&&time(a.allAboardShipMinute)&&
   a.earliestAshoreShipMinute>=a.allAboardShipMinute)
  problems.push("The earliest time ashore must occur before all aboard on the same day.");
 const results:[OfferAssessment,OfferAssessment]=[
  evaluateOffer(a,offers[0],"a",problems),
  evaluateOffer(a,offers[1],"b",problems)
 ];
 return {status:problems.length?"ship-details-needed":"ready-for-review",
  headline:problems.length?"Confirm the cruise itinerary before considering tour purchases":"Review each excursion against this ship-day window",
  checks:problems.length?problems:[
   "All aboard is NOT the ship departure time. Royal Caribbean says all-aboard is generally about 30 minutes before departure, but requires onboard confirmation; your entered all-aboard controls.",
   "Cruise-line sold tours may have a delayed-return protection; independently booked tours do not inherit the cruise-line guarantee.",
   "Your discretionary return reserve is a planning threshold, NOT a guarantee. Weather, customs, missed ferries, traffic and itinerary changes can still defeat the schedule."
  ],offers:results,reviewedOn:COZUMEL_REVIEWED,noBookingGuarantee:true,noAffiliate:true};
}
export function reportCozumel(decision:Decision,visit:Visit,offers:[Offer,Offer]):string{
 const clock=(x:number|null)=>x===null?"not entered":fmt(x);
 return ["COZUMEL CRUISE SHORE EXCURSION — PRIVATE PURCHASE-SCREENING WORKSHEET",
  "Source snapshot "+decision.reviewedOn+"; no affiliation, bookability or on-time return guarantee.",
  "Pier: "+visit.pier+"; independently confirmed: "+visit.pierVerified,
  "All aboard (ship clock): "+clock(visit.allAboardShipMinute),
  "Earliest ashore (ship clock): "+clock(visit.earliestAshoreShipMinute),
  "User-selected return reserve before all aboard (minutes): "+visit.preferredReturnReserveMinutes,
  ...decision.checks.map(x=>"SHIP CHECK: "+x),
  ...offers.flatMap((q,i)=>[
   "OFFER "+q.id.toUpperCase()+" — "+q.label+" ("+q.activity+")",
   "Operator channel: "+q.sellerType+"; tour start: "+clock(q.tourStartShipMinute)+"; duration: "+(q.tourDurationMinutes??"unknown")+" minutes",
   "Meeting transfer, check-in, return transfer: "+[q.pierToMeetingMinutes,q.checkInMinutes,q.finishToPierMinutes].map(x=>x??"unknown").join("/")+" minutes",
   "Status: "+decision.offers[i].status+"; estimated pier return: "+clock(decision.offers[i].estimatedPierReturnShipMinute),
   "Group price in USD (self-reported): "+(decision.offers[i].totalGroupPriceUSD??"unknown"),
   ...decision.offers[i].issues.map(x=>"VERIFY: "+x)
  ]),
  "Independent tour bookings are not protected by cruise-line shore-excursion guarantees.",
  "Official lines and independent operator guidance:",...Object.values(COZUMEL_SOURCES),
  "No ticket availability, ship schedule, vessel berth, transportation timetable, price, insurance, cancellation protection or operator identity verified by this website."
 ].join("\n");
}
