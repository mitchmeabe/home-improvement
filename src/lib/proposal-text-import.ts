/**
 * Deliberately conservative extract-from-text helper for redacted contractor
 * proposals. No OCR, AI model, server request, or persistent storage.
 * A line containing a term is NOT proof that a service or rebate is included.
 * Ambiguous or contradictory values are withheld entirely.
 */
export type ProposalScope="reuse-existing-ducts"|"new-ductwork"|"ductless"|"mixed";
export type ProposalBasis="before-rebate"|"after-rebate";
export type ProposalKey="price"|"rebate"|"coolingCapacityBtu"|"scope"|"priceBasis"|"ahriReference"|"outdoorModel"|"indoorModel";
export interface ProposalCandidate {
 key:ProposalKey;label:string;value:number|string;evidence:string;
}
export interface ProposalTextReview {
 candidates:ProposalCandidate[];
 warnings:string[];
 mentions:{label:string;evidence:string}[];
}
const toMoney=(line:string):number|null=>{
 // An amount cannot be associated reliably with the quoted total when a
 // line also carries a deposit, allowance, discount or alternate amount.
 // Withhold the candidate rather than silently selecting the first dollar.
 const amounts=[...line.matchAll(/\$\s*([\d,]+(?:\.\d{1,2})?)/g)];
 if(amounts.length!==1)return null;
 const value=Number(amounts[0][1].replaceAll(",",""));
 return Number.isFinite(value)&&value>=0&&value<=1000000?value:null;
};
function fromLines<T extends number|string>(
 lines:string[],name:string,matcher:(line:string)=>T|null
):{value:T;evidence:string}|null {
 const found=lines.map(line=>({value:matcher(line),evidence:line.trim().slice(0,180)}))
   .filter((x):x is {value:T;evidence:string}=>x.value!==null);
 if(!found.length)return null;
 if(new Set(found.map(x=>String(x.value))).size!==1)return null;
 return found[0];
}
export function parseProposalText(text:string):ProposalTextReview {
 if(text.length>25000)return {candidates:[],mentions:[],warnings:["Proposal text exceeds 25,000 characters. Shorten or redact it before reviewing."]};
 const lines=text.replaceAll("\r","").split("\n").map(x=>x.trim()).filter(Boolean);
 const candidates:ProposalCandidate[]=[];
 const warnings:string[]=[];
 const priceLabels=/\b(?:total installed (?:price|cost)|installed (?:price|total)|total project (?:price|cost)|contract (?:price|total)|project total|total estimate|total price|total cost)\b/i;
 const rebateLabels=/\b(?:mass save rebate|hp3 rebate|proposed rebate|rebate amount|rebate credit)\b/i;
 const findPrice=(labels:RegExp)=>(line:string)=>{
   if(!labels.test(line)||/\b(?:not included|excluded|example only|illustration|optional|estimate range|starting at)\b/i.test(line))return null;
   return toMoney(line);
 };
 // Withhold an amount if ANY line claiming this total is ambiguous.
 // Discarding an ambiguous labeled line could otherwise make a different
 // amount appear uniquely supported by the proposal.
 const labeledMoney=(labels:RegExp,name:string)=>{
   const relevant=lines.filter(line=>labels.test(line));
   if(!relevant.length)return null;
   const parse=findPrice(labels);
   if(relevant.some(line=>parse(line)===null))return null;
   return fromLines(relevant,name,parse);
 };
 // Genuine contractor quote layouts sometimes distinguish the full contract
 // cost, a *conditional* rebate, and a lower "final"/"net" figure. Never
 // silently promote one figure to a comparable installed price: the homeowner
 // must establish which amount already includes which incentive.
 const netOrFinalPrice=/\\b(?:final (?:installed |project )?(?:cost|price)|net (?:installed |project )?(?:cost|price)|after[- ]rebate total)\\b/i;
 const conditionalRebate=/\\b(?:rebates? available|potential (?:rebate|incentive)|rebate eligibility|subject to (?:rebate|incentive) approval)\\b/i;
 const hasNetOrFinal=lines.some(line=>netOrFinalPrice.test(line));
 const hasConditionalRebate=lines.some(line=>conditionalRebate.test(line));
 const price=!hasNetOrFinal?labeledMoney(priceLabels,"total"):null;
 if(price)candidates.push({key:"price",label:"Installed quoted total",value:price.value,evidence:price.evidence});
 else if(lines.some(x=>priceLabels.test(x))&&!hasNetOrFinal)
  warnings.push("Installed-price labels were found but no single reliable $ amount could be extracted. Enter the total manually.");
 if(hasNetOrFinal)
  warnings.push("Final/net cost is listed separately from gross installed price. Confirm which amount includes incentives and enter the comparable installed total and price basis manually.");
 if(hasConditionalRebate)
  warnings.push("A rebate is described as available or conditional, not confirmed or already received. Verify funding, approval and whether the quoted total already deducts it.");
 else if(lines.some(x=>priceLabels.test(x)))warnings.push("Installed-price labels were found but no single reliable $ amount could be extracted. Enter the total manually.");
 const rebate=labeledMoney(rebateLabels,"rebate");
 if(rebate)candidates.push({key:"rebate",label:"Contractor-stated rebate amount (not approved)",value:rebate.value,evidence:rebate.evidence});
 else if(lines.some(x=>rebateLabels.test(x)))warnings.push("Rebate text was found, but an unambiguous proposed amount was not established.");
 const capacity=fromLines(lines,"cooling capacity",line=>{
   const m=line.match(/\b(?:AHRI\s+)?cooling capacity\s*(?:\([^)]*\))?\s*[:=-]?\s*([\d,]+)\s*(?:BTU\/?h|BTUH|BTU\/?hr)\b/i);
   if(!m)return null;
   const value=Number(m[1].replaceAll(",",""));
   return Number.isFinite(value)&&value>0&&value<=300000?value:null;
 });
 if(capacity)candidates.push({key:"coolingCapacityBtu",label:"Stated AHRI cooling capacity (BTU/h)",value:capacity.value,evidence:capacity.evidence});
 const explicitScope=(line:string):ProposalScope|null=>{
   if(/\b(?:excluding|excluded|not included|without|no)\b/i.test(line))return null;
   if(/\bmixed (?:ducted|ductless)|ducted and ductless\b/i.test(line))return "mixed";
   if(/\b(?:new ductwork|replace (?:existing )?ductwork|duct replacement|new duct installation)\b/i.test(line))return "new-ductwork";
   if(/\b(?:reuse existing ducts|reuse existing ductwork|existing ducts reused)\b/i.test(line))return "reuse-existing-ducts";
   if(/\b(?:ductless mini[- ]split|ductless heat pump system)\b/i.test(line))return "ductless";
   return null;
 };
 const scope=fromLines(lines,"scope",explicitScope);
 if(scope)candidates.push({key:"scope",label:"Described installation scope",value:scope.value,evidence:scope.evidence});
 else if(lines.some(x=>explicitScope(x)!==null))warnings.push("Conflicting installation scopes were described. Select scope manually.");
 const beforeBasis=/\b(?:total|quoted price|contract price)\b.{0,28}\b(?:before|excluding) (?:all )?(?:rebates?|incentives?)\b/i;
 const afterBasis=/\b(?:total|quoted price|contract price)\b.{0,28}\b(?:after|including) (?:all )?(?:rebates?|incentives?)\b/i;
 const basisLines=lines.filter(line=>beforeBasis.test(line)||afterBasis.test(line));
 const basis=basisLines.some(line=>
   (beforeBasis.test(line)&&afterBasis.test(line))||
   (/\b(?:before|excluding) (?:all )?(?:rebates?|incentives?)\b/i.test(line)&&
    /\b(?:after|including) (?:all )?(?:rebates?|incentives?)\b/i.test(line)))
   ?null:fromLines(basisLines,"price basis",line=>{
     if(beforeBasis.test(line))return "before-rebate" as const;
     if(afterBasis.test(line))return "after-rebate" as const;
     return null;
   });
 if(basis)candidates.push({key:"priceBasis",label:"Stated total price basis",value:basis.value,evidence:basis.evidence});
 else if(basisLines.length)warnings.push("Conflicting before/after-rebate price labels found. Confirm the quoted total's basis manually.");
 // Only explicit labels supply candidate identifiers, never qualified-list approval.
 const identities=[
  {key:"ahriReference",label:"AHRI reference",re:/^\s*AHRI\s*(?:certified reference(?: number)?|reference(?: number)?|certificate(?: number)?|ID|#)\s*[:#=-]?\s*([A-Z0-9][A-Z0-9-]{4,39})\s*$/i},
  {key:"outdoorModel",label:"outdoor model",re:/^\s*(?:outdoor\s*(?:unit\s*)?|ODU\s*)model(?:\s*(?:number|no\.?|#))?\s*[:#=-]?\s*([A-Z0-9][A-Z0-9-]{4,39})\s*$/i},
  {key:"indoorModel",label:"indoor model",re:/^\s*(?:indoor\s*(?:unit\s*)?|IDU\s*)model(?:\s*(?:number|no\.?|#))?\s*[:#=-]?\s*([A-Z0-9][A-Z0-9-]{4,39})\s*$/i}
 ] as const;
 for(const item of identities){
  const matches=lines.filter(line=>!/\b(?:example|excluded|not included|not supplied|optional|pending)\b/i.test(line))
   .map(line=>({value:line.match(item.re)?.[1].toUpperCase()??null,evidence:line.slice(0,180)}))
   .filter((x):x is {value:string;evidence:string}=>x.value!==null);
  if(new Set(matches.map(x=>x.value)).size>1)
   warnings.push("Conflicting "+item.label+" identifiers found. Enter manually.");
  else if(matches.length)candidates.push({key:item.key,label:item.label+" (unverified)",value:matches[0].value,evidence:matches[0].evidence});
 }
 const prompts=[
  {label:"Permits / inspections",re:/\b(?:permit|inspection)\b/i},
  {label:"Warranty",re:/\b(?:warrant(?:y|ies)|labor coverage)\b/i},
  {label:"Manual J / load calculations",re:/\b(?:manual j|heat loss|load calculation)\b/i},
  {label:"Commissioning",re:/\b(?:commissioning|start[- ]up testing)\b/i},
  {label:"Old-system removal",re:/\b(?:remove existing (?:furnace|system)|disposal of old)\b/i},
 ];
 const mentions=prompts.flatMap(p=>{
   const line=lines.find(x=>p.re.test(x));
   return line?[{label:p.label,evidence:line.slice(0,180)}]:[];
 });
 return {candidates,warnings,mentions};
}
