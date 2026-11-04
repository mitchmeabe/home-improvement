/**
 * Quote-completeness comparison, not a claim that an installation complies
 * with applicable permits, efficiency certifications or manufacturer rules.
 * Unknown never becomes "yes". Only an explicit yes-vs-no disagreement
 * prevents nominal bid-cost ranking for a named cost-bearing scope item.
 */
export type ScopeAnswer="yes"|"no"|"unsure";
export type ScopeField={id:string;label:string;value:ScopeAnswer};
export type ScopeSnapshot={id:string;fields:readonly ScopeField[]};
export function findExplicitScopeDifferences(quotes:readonly ScopeSnapshot[]):string[]{
 if(quotes.length<2||quotes.length>3||new Set(quotes.map(q=>q.id)).size!==quotes.length)
   throw new RangeError("Compare two or three unique bids");
 const expected=quotes[0].fields.map(x=>x.id);
 if(new Set(expected).size!==expected.length)throw new RangeError("Duplicate evidence field");
 for(const q of quotes){
  if(q.fields.length!==expected.length||q.fields.some((x,i)=>x.id!==expected[i]||
       !["yes","no","unsure"].includes(x.value)))
    throw new RangeError("Scope categories differ or answer invalid");
 }
 const out:string[]=[];
 for(let i=0;i<expected.length;i++){
   const yes=quotes.some(q=>q.fields[i].value==="yes");
   const no=quotes.some(q=>q.fields[i].value==="no");
   if(yes&&no)out.push(quotes[0].fields[i].label);
 }
 return out;
}
