/**
 * Deliberately conservative extract-from-text helper for redacted contractor
 * proposals. No OCR, AI model, server request, or persistent storage.
 * A line containing a term is NOT proof that a service or rebate is included.
 * Ambiguous or contradictory values are withheld entirely.
 */
export type ProposalScope="reuse-existing-ducts"|"new-ductwork"|"ductless"|"mixed";
export type ProposalBasis="before-rebate"|"after-rebate";
export type ProposalKey="price"|"rebate"|"coolingCapacityBtu"|"scope"|"priceBasis";
export interface ProposalCandidate {
 key:ProposalKey;label:string;value:number|ProposalScope|ProposalBasis;evidence:string;
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
 const priceLabels=/\b(?:total installed (?:price|cost)|installed (?:price|total)|total project (?:price|cost)|contract (?:price|total)|project total|total estimate|total price)\b/i;
 const rebateLabels=/\b(?:mass save rebate|hp3 rebate|proposed rebate|rebate amount|rebate credit)\b/i;
 const findPrice=(labels:RegExp)=>(line:string)=>{
   if(!labels.test(line)||/\b(?:not included|excluded|example only|illustration|optional|estimate range|starting at)\b/i.test(line))return null;
   return toMoney(line);
 };
 const price=fromLines(lines,"total",findPrice(priceLabels));
 if(price)candidates.push({key:"price",label:"Installed quoted total",value:price.value,evidence:price.evidence});
 else if(lines.some(x=>priceLabels.test(x)))warnings.push("Installed-price labels were found but no single reliable $ amount could be extracted. Enter the total manually.");
 const rebate=fromLines(lines,"rebate",findPrice(rebateLabels));
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
 const basis=fromLines(lines,"price basis",line=>{
   if(/\b(?:total|quoted price|contract price)\b.{0,28}\b(?:before|excluding) (?:all )?(?:rebates?|incentives?)\b/i.test(line))return "before-rebate" as const;
   if(/\b(?:total|quoted price|contract price)\b.{0,28}\b(?:after|including) (?:all )?(?:rebates?|incentives?)\b/i.test(line))return "after-rebate" as const;
   return null;
 });
 if(basis)candidates.push({key:"priceBasis",label:"Stated total price basis",value:basis.value,evidence:basis.evidence});
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
