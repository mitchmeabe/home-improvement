/**
 * Strict, read-only matching against rows from a homeowner-supplied Mass Save
 * HPQPL workbook. A local listing is evidence, not authentic-source verification,
 * current program eligibility, an AHRI certificate, or a rebate award.
 */
export const HPQPL_PAGE="https://www.masssave.com/heat-pump-qualified-list";
export const HPQPL_XLSX="https://www.masssave.com/-/media/Files/PDFs/Mass-Save-Heat-Pump-QPL.xlsx";
export type HPQPLCell=string|number|boolean|Date|null|undefined;
export interface HPQPLRow {
 ahri:string;outdoor:string;indoor:string;rebateType:string;
 residential:"yes"|"no"|"unknown";coolingBtu:number|null;refrigerant:string;
 sheet:string;line:number;wildcard:boolean;
}
export interface HPQPLCatalog {
 rows:HPQPLRow[];sheetsRead:number;sourceRows:number;warnings:string[];
 importedAt:string;fileName:string; // local upload label, NOT proof of provenance
}
export type HPQPLStatus="no-data"|"incomplete-input"|"listed-residential"|
 "listed-commercial"|"listing-scope-unknown"|"multiple-listings"|
 "unresolved-indoor"|"identity-conflict"|"not-found";
export interface HPQPLMatch {
 status:HPQPLStatus;reason:string;rows:HPQPLRow[];
 coolingBtu:number|null;
}
export const normalizeHPQPLId=(x:string)=>x.trim().toUpperCase().replace(/\s+/g,"");
const normHead=(x:string)=>x.toLowerCase().replace(/[^a-z0-9]/g,"");
const asText=(x:HPQPLCell)=>x==null?"":x instanceof Date?x.toISOString():String(x).trim();
const number=(x:HPQPLCell)=> {
 const s=asText(x).replace(/,/g,"");const n=Number(s);
 return s!==""&&Number.isFinite(n)&&n>0&&n<10000000?n:null;
};
type Keys="ahri"|"outdoor"|"indoor"|"rebate"|"cooling"|"tonnage"|"refrigerant";
const signatures:Record<Keys,(h:string)=>boolean>={
 ahri:h=>h.includes("ahri")&&(h.includes("reference")||h.includes("certified")||h==="ahri"),
 outdoor:h=>/outdoor.*model|odu.*model/.test(h),
 indoor:h=>/indoor.*model|idu.*model/.test(h),
 rebate:h=>h.includes("rebate")&&(h.includes("type")||h.includes("eligib")),
 cooling:h=>h.includes("coolingcapacity")&&(/95f|afull|btuh|full|rated/.test(h)),
 tonnage:h=>h==="tonnage"||h==="tons",
 refrigerant:h=>h.includes("refrigerant")||h.includes("refridgerant")
};
const keys=Object.keys(signatures) as Keys[];
function columnIndices(row:readonly HPQPLCell[]):Partial<Record<Keys,number>>{
 const norm=row.map(v=>normHead(asText(v)));
 const found:Partial<Record<Keys,number>>={};
 for(const k of keys){const n=norm.findIndex(s=>signatures[k](s));if(n>=0)found[k]=n;}
 return found;
}
export function normalizeHPQPLWorkbook(
 sheets:readonly {sheet:string;data:readonly (readonly HPQPLCell[])[]}[],
 meta:{fileName:string;importedAt:string}
):HPQPLCatalog {
 if(!sheets.length||sheets.length>30)throw new Error("Unsupported workbook sheet count.");
 const rows:HPQPLRow[]=[],warnings:string[]=[];
 let sourceRows=0,sheetsRead=0;
 for(const sheet of sheets){
   if(sheet.data.length>250000)throw new Error("Workbook sheet exceeds the supported row limit.");
   const scan=sheet.data.slice(0,30).map((r,i)=>({i,columns:columnIndices(r)}));
   const header=scan.find(x=>x.columns.ahri!==undefined&&x.columns.outdoor!==undefined);
   if(!header){warnings.push("Skipped "+sheet.sheet+": AHRI/outdoor model columns were not identified.");continue;}
   sheetsRead++;
   const c=header.columns;
   if(c.indoor===undefined)warnings.push(sheet.sheet+" lacks an identifiable indoor-model column: its rows cannot establish exact paired systems.");
   if(c.rebate===undefined)warnings.push(sheet.sheet+" lacks an identifiable rebate-type column: residential eligibility cannot be inferred.");
   for(let i=header.i+1;i<sheet.data.length;i++){
     const r=sheet.data[i];sourceRows++;
     const get=(k:Keys)=>c[k]===undefined?"":asText(r[c[k]!]);
     const ahri=get("ahri"),outdoor=get("outdoor"),indoor=get("indoor");
     if(!ahri||!outdoor)continue;
     const rebateType=get("rebate"),lower=rebateType.toLowerCase();
     const residential=lower.includes("residential")?"yes":
       (lower.includes("commercial")||lower.includes("commerical"))?"no":"unknown";
     const cooling=number(c.cooling===undefined?null:r[c.cooling]);
     const tons=number(c.tonnage===undefined?null:r[c.tonnage]);
     rows.push({
       ahri:normalizeHPQPLId(ahri),outdoor:normalizeHPQPLId(outdoor),
       indoor:normalizeHPQPLId(indoor),rebateType,residential,
       coolingBtu:cooling??(tons!==null?Math.round(tons*12000):null),
       refrigerant:get("refrigerant"),sheet:sheet.sheet,line:i+1,
       wildcard:/[*?]/.test(outdoor+indoor)
     });
   }
 }
 if(!sheetsRead||!rows.length)throw new Error("No usable AHRI/outdoor-model entries found. Confirm this is the Mass Save HPQPL export.");
 return {rows,sheetsRead,sourceRows,warnings,importedAt:meta.importedAt,fileName:meta.fileName};
}
const result=(status:HPQPLStatus,reason:string,rows:HPQPLRow[]=[],coolingBtu:number|null=null):
 HPQPLMatch=>({status,reason,rows,coolingBtu});
export function matchHPQPL(
 catalog:HPQPLCatalog|null,
 input:{ahriReference:string;outdoorModel:string;indoorModel:string}
):HPQPLMatch{
 if(!catalog)return result("no-data","No workbook has been loaded. A contractor's checkbox is not an official listing.");
 const ahri=normalizeHPQPLId(input.ahriReference),outdoor=normalizeHPQPLId(input.outdoorModel),indoor=normalizeHPQPLId(input.indoorModel);
 if(!ahri||!outdoor||!indoor)return result("incomplete-input","Enter the AHRI reference and the exact outdoor and indoor model designation.");
 const candidates=catalog.rows.filter(r=>r.ahri===ahri);
 if(!candidates.length)return result("not-found","This AHRI number was not found in the imported snapshot. Absence does not prove nonqualification.");
 const sameOutdoor=candidates.filter(r=>r.outdoor===outdoor);
 if(!sameOutdoor.length)return result("identity-conflict","The AHRI reference exists, but its listed outdoor model differs. Recheck the proposal.",candidates.slice(0,5));
 const exact=sameOutdoor.filter(r=>r.indoor===indoor&&!r.wildcard);
 if(!exact.length)return result("unresolved-indoor",
  "The AHRI/outdoor combination was found, but the exact indoor configuration was not independently matched. Multi-zone or wildcard entries need direct confirmation.",sameOutdoor.slice(0,5));
 const uniqueness=new Set(exact.map(r=>[r.residential,r.coolingBtu,r.refrigerant].join("|")));
 if(uniqueness.size!==1||exact.some(r=>r.wildcard))
  return result("multiple-listings","Matching rows disagree on rebate scope, capacity or refrigerant; confirm the actual system in Mass Save's live list.",exact.slice(0,8));
 const row=exact[0];
 if(row.residential==="no")return result("listed-commercial","Exact model pairing is listed for commercial use, not documented for residential rebates.",exact.slice(0,5));
 if(row.residential==="unknown")return result("listing-scope-unknown","Exact model pairing was found, but residential rebate applicability is not established in this workbook.",exact.slice(0,5));
 return result("listed-residential","Exact AHRI/outdoor/indoor pairing appears as residential-listed in the locally supplied snapshot. Verify that the current official list still contains it.",exact.slice(0,5),row.coolingBtu);
}
export function hpqplMatchReport(id:string,m:HPQPLMatch,catalog:HPQPLCatalog|null){
 return [
 "QUOTE "+id+" — HPQPL snapshot status: "+m.status,
 m.reason,
 ...(m.rows.length?m.rows.map(r=>"  "+r.sheet+" row "+r.line+": AHRI "+r.ahri+", outdoor "+r.outdoor+", indoor "+(r.indoor||"not provided")+
  ", rebate type "+(r.rebateType||"unknown")+", cooling "+(r.coolingBtu===null?"unknown":r.coolingBtu+" BTU/h")+
  (r.refrigerant?", refrigerant "+r.refrigerant:"")):["  No matched row"]),
 catalog?"Snapshot imported locally: "+catalog.importedAt+"; file name: "+catalog.fileName+" (provenance not independently authenticated)":"No snapshot loaded.",
 "Confirm current status on "+HPQPL_PAGE
 ].join("\n");
}