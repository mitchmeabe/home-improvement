/**
 * Self-reported contractor quote comparison. No external quote verification.
 * Rebate eligibility/funding is NEVER inferred from the official snapshot.
 * No user details stored or transmitted.
 */
import type { Location, Property } from "./heat-pump.ts";
export const QUOTE_REVIEWED_ON="2026-11-03";
export const QUOTE_SOURCES={
  mechanical:"https://www.portland.gov/ppd/residential-permitting/residential-mechanical-permits",
  electrical:"https://www.portland.gov/ppd/residential-permitting/residential-electrical-permits",
  hp3:"https://www.oregon.gov/energy/incentives/Pages/HP3.aspx",
} as const;
export type Answer="yes"|"no"|"unsure";
export type PriceBasis="before-discounts"|"after-discounts"|"unsure";
export interface QuoteItem {
  id:"a"|"b"|"c";
  installedPrice:number|null;
  priceBasis:PriceBasis;
  otherDiscount:number|null;
  otherDiscountConfirmed:Answer;
  hp3ProposedDiscount:number|null;
  hp3ApprovedContractor:Answer;
  hp3FundingConfirmed:Answer;
  hp3UpfrontReduction:Answer;
  modelAndRatingsDocumented:Answer;
  mechanicalPermitIncluded:Answer;
  electricalScopeIncluded:Answer;
  finalInspectionIncluded:Answer;
  warrantyInWriting:Answer;
  annualOperatingCost:number|null;
}
export interface QuoteCompareInput {
  location:Location;property:Property;hspf2:number|null;seer2:number|null;
  quotes:QuoteItem[];
}
export interface QuoteEvaluation {
  id:QuoteItem["id"];
  installedPrice:number|null;
  arithmeticNet:number|null;
  netDescription:string;
  tenYearScenario:number|null;
  warnings:string[];
  completeFields:number;
  totalFields:number;
  qualifiesForNoRebateGuarantee:boolean;
}
export interface QuoteComparison {
  evaluations:QuoteEvaluation[];
  lowestComparableQuote:QuoteItem["id"]|null;
  priceDifference:number|null;
  comparisonReason:string;
  propertyWarning:string;
}
export function emptyQuote(id:QuoteItem["id"]):QuoteItem{
 return {
  id,installedPrice:null,priceBasis:"unsure",otherDiscount:null,otherDiscountConfirmed:"unsure",
  hp3ProposedDiscount:null,hp3ApprovedContractor:"unsure",hp3FundingConfirmed:"unsure",hp3UpfrontReduction:"unsure",
  modelAndRatingsDocumented:"unsure",mechanicalPermitIncluded:"unsure",electricalScopeIncluded:"unsure",
  finalInspectionIncluded:"unsure",warrantyInWriting:"unsure",annualOperatingCost:null,
 };
}
function amount(v:number|null,name:string){
 if(v!==null&&(!Number.isFinite(v)||v<0))throw new RangeError(name+" must be a finite, nonnegative amount or unknown.");
}
function rating(v:number|null,name:string){
 if(v!==null&&(!Number.isFinite(v)||v<=0))throw new RangeError(name+" must be a positive number or unknown.");
}
function hp3Category(location:Location,property:Property):"blocked"|"reserved"|"verify"{
 if(location==="outside-oregon"||property==="vacation-or-commercial")return "blocked";
 if(property==="existing-owner-occupied")return "reserved";
 return "verify";
}
export function compareHeatPumpQuotes(input:QuoteCompareInput):QuoteComparison{
 if(input.quotes.length<2||input.quotes.length>3)throw new RangeError("Compare two or three quotes.");
 if(new Set(input.quotes.map(x=>x.id)).size!==input.quotes.length)throw new RangeError("Duplicate quote ID.");
 rating(input.hspf2,"HSPF2");rating(input.seer2,"SEER2");
 const hp3=hp3Category(input.location,input.property);
 const numericRatingsOk=input.hspf2!==null&&input.seer2!==null&&input.hspf2>=8.1&&input.seer2>=16;
 const evaluations=input.quotes.map(q=>{
  for(const k of ["installedPrice","otherDiscount","hp3ProposedDiscount","annualOperatingCost"] as const)amount(q[k],k);
  const warnings:string[]=[];
  let net:number|null=null;
  if(q.installedPrice===null){warnings.push("Enter the installed price from the quote.");}
  if(q.priceBasis==="unsure")warnings.push("Ask whether the price already includes rebates or incentives.");
  if(q.installedPrice!==null&&q.priceBasis==="after-discounts") {
   net=q.installedPrice;
   warnings.push("The price was marked AFTER discounts; no discounts are subtracted again.");
  }
  if(q.installedPrice!==null&&q.priceBasis==="before-discounts"){
    net=q.installedPrice;
    if(q.otherDiscount!==null&&q.otherDiscount>0){
      if(q.otherDiscountConfirmed==="yes")net-=q.otherDiscount;
      else warnings.push("Other proposed discount is not documented/confirmed and was excluded.");
    }
    if(q.hp3ProposedDiscount!==null&&q.hp3ProposedDiscount>0){
      const canCount=hp3==="verify"&&numericRatingsOk&&q.hp3ApprovedContractor==="yes"&&q.hp3FundingConfirmed==="yes"&&q.hp3UpfrontReduction==="yes"&&q.modelAndRatingsDocumented==="yes";
      if(canCount)net-=q.hp3ProposedDiscount;
      else warnings.push("HP3 proposed discount NOT included: official funding, equipment ratings, approved contractor, upfront reduction and property category must all be confirmed.");
    }
    if(net<0){warnings.push("Proposed confirmed discounts exceed the quoted price; correct the figures.");net=null;}
  }
  if(hp3==="reserved")warnings.push("ODOE reported $0 unreserved HP3 funds for existing owner-occupied homes on October 1, 2026; only a genuine existing reservation might differ.");
  if(hp3==="blocked")warnings.push("This property/location falls outside the described HP3 program.");
  if(!numericRatingsOk)warnings.push("Equipment's general HP3 HSPF2 ≥8.1 and SEER2 ≥16 thresholds are not both documented as met; equipment may use exceptions requiring agency review.");
  if(q.mechanicalPermitIncluded!=="yes")warnings.push("Confirm mechanical permit responsibility and fee.");
  if(q.electricalScopeIncluded!=="yes")warnings.push("Confirm electrical scope, required permits and any panel upgrade.");
  if(q.finalInspectionIncluded!=="yes")warnings.push("Confirm final inspection scheduling and closeout.");
  if(q.warrantyInWriting!=="yes")warnings.push("Get equipment and labor warranty terms in writing.");
  if(q.modelAndRatingsDocumented!=="yes")warnings.push("Request exact outdoor/indoor model IDs and efficiency documentation.");
  const checks=[q.modelAndRatingsDocumented,q.mechanicalPermitIncluded,q.electricalScopeIncluded,q.finalInspectionIncluded,q.warrantyInWriting];
  const complete=checks.filter(x=>x==="yes").length;
  const tenYearScenario=net!==null&&q.annualOperatingCost!==null?Math.round((net+q.annualOperatingCost*10)*100)/100:null;
  return {
    id:q.id,installedPrice:q.installedPrice,arithmeticNet:net,
    netDescription:q.priceBasis==="after-discounts"?"Quote amount marked after discounts (not verified)":q.priceBasis==="before-discounts"?"Only explicitly confirmed user-entered discounts deducted (not an awarded rebate)":"Cannot calculate a net without knowing price basis",
    tenYearScenario,warnings,completeFields:complete,totalFields:5,
    qualifiesForNoRebateGuarantee:true,
  } satisfies QuoteEvaluation;
 });
 const valid=evaluations.filter(x=>x.arithmeticNet!==null);
 const lowest=valid.length===input.quotes.length&&input.quotes.every(x=>x.priceBasis!=="unsure")?
    [...valid].sort((a,b)=>a.arithmeticNet!-b.arithmeticNet!):[];
 const difference=lowest.length>=2?Math.round((Math.max(...lowest.map(x=>x.arithmeticNet!))-Math.min(...lowest.map(x=>x.arithmeticNet!)))*100)/100:null;
 return {
  evaluations,lowestComparableQuote:lowest[0]?.id??null,priceDifference:difference,
  comparisonReason:lowest.length>0?"Quote arithmetic only; differences in equipment, scope, warranties, eligibility, financing and undisclosed work can outweigh price.":"Enter all quote prices and whether each is before or after discounts to calculate a qualified comparison.",
  propertyWarning:hp3==="reserved"?"ODOE funding table Oct 1, 2026: existing owner-occupied HP3 funds fully reserved; do not count a new $2,000 rebate.":hp3==="blocked"?"This property type or location does not meet the described HP3 program scope.":"HP3 availability is not checked live; approved contractor, category, equipment and funding must all be verified."
 };
}
export function quoteComparisonQuestions(report:QuoteComparison):string{
 return ["HEAT PUMP QUOTE COMPARISON — QUESTIONS FOR INSTALLERS",
 "Self-reported planning, not verification of bids, permits, incentives or annual savings.",
 "Agency funding note: "+report.propertyWarning,
 ...report.evaluations.flatMap(e=>[
  "QUOTE "+e.id.toUpperCase()+": "+(e.arithmeticNet===null?"Comparable net unavailable":"conditional comparison $"+e.arithmeticNet.toFixed(2)),
  ...e.warnings.map(w=>"- "+w),
 ]),
 "Portland permits: "+QUOTE_SOURCES.mechanical+" ; "+QUOTE_SOURCES.electrical,
 "Oregon HP3: "+QUOTE_SOURCES.hp3,
 "Do not rely on any rebate until confirmed in writing and reflected in the contractor's quote."
 ].join("\n");
}
