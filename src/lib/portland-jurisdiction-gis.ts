/**
 * Direct, read-only browser query to the City of Portland's publicly accessible
 * PortlandMaps Active Address Points layer, with explicit jurisdiction.
 *
 * The resident's address is transmitted by the browser to the CITY on an
 * intentional button click, never to this app's backend. No cookies, analytics
 * payload, address persistence, owner fields or geolocation.
 *
 * A strict active address-point match informs which city's jurisdiction to
 * investigate. It does NOT independently establish parcel zoning, building
 * class, actual permit issuance, annexation timing or incentive entitlement.
 */
export const PORTLAND_GIS_LAYER=
 "https://www.portlandmaps.com/arcgis/rest/services/Public/CGIS_MJ_Address_Taxlot/MapServer/0";
export const PORTLAND_GIS_QUERY=PORTLAND_GIS_LAYER+"/query";
export const PORTLAND_GIS_GUIDE="https://www.portland.gov/phb/rental-services/helpdesk/portland-maps";
export const PORTLAND_MAPS="https://www.portlandmaps.com/";
export const PORTLAND_GIS_FIELDS=[
 "ADDRESS_FULL","ADDRESS_NUMBER","STREET_NAME","STREET_PREFIX_DIRECTION",
 "STREET_TYPE_CODE","UNIT","ZIP_CODE","JURISDICTION_NAME",
 "STATE_ABBREVIATION","STATUS","PROPERTY_ID"
] as const;
export interface StreetAddress{
 houseNumber:number;direction:string;streetName:string;streetType:string;
 unit:string|null;zip:string|null;
}
export type GISStatus=
 "portland"|"other-oregon"|"outside-oregon"|"ambiguous"|"not-found"|"unavailable";
export interface OfficialJurisdictionEvidence {
 source:"portlandmaps-active-address-points";
 scope:"portland"|"other-oregon";
 checkedOn:string;
 match:"exact-active-address";
}
export interface GISResult{
 status:GISStatus;
 reason:string;
 jurisdiction:string|null;checkedOn:string;
 matchedRecords:number;
 evidence:OfficialJurisdictionEvidence|null;
 // Optional link explicitly opened by the user. Not saved or copied into dossier.
 propertyUrl:string|null;
 sourceUrl:typeof PORTLAND_GIS_LAYER;
}
const streetTypes:Record<string,string>={
 ST:"ST",STREET:"ST",AVE:"AVE",AVENUE:"AVE",BLVD:"BLVD",BOULEVARD:"BLVD",
 RD:"RD",ROAD:"RD",DR:"DR",DRIVE:"DR",CT:"CT",COURT:"CT",
 PL:"PL",PLACE:"PL",LN:"LN",LANE:"LN",WAY:"WAY",PKWY:"PKWY",PARKWAY:"PKWY",
 TER:"TER",TERRACE:"TER",CIR:"CIR",CIRCLE:"CIR",HWY:"HWY",HIGHWAY:"HWY",
 LOOP:"LOOP",TRL:"TRL",TRAIL:"TRL"
};
const upper=(s:unknown)=>typeof s==="string"?s.trim().toUpperCase():"";
const validDay=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&
 Number.isFinite(Date.parse(value+"T00:00:00Z"))&&
 new Date(value+"T00:00:00Z").toISOString().slice(0,10)===value;
const unsupported=(text:string)=>{
 throw new RangeError("Enter a street address such as 1120 SW 5th Ave, without a city, state or ZIP. An optional unit and ZIP can be entered separately. "+text);
};
/**
 * Restrict to local, numbered street addresses. Do not fuzzy-match unsupported
 * spellings or house numbers because a nearby address can have a different
 * permit jurisdiction. The City source uses uppercased STREET_NAME and code.
 */
export function parsePortlandStreetAddress(street:string,unit="",zip=""):StreetAddress{
 const raw=street.trim().replace(/\s+/g," ").toUpperCase();
 if(raw.length<7||raw.length>120||/[,;?{}"'\\/%]/.test(raw))return unsupported("");
 const m=/^(\d{1,6})\s+(?:(NE|NW|SE|SW|N|S|E|W)\s+)?([A-Z0-9 -]{1,60}?)\s+(STREET|AVENUE|BOULEVARD|PARKWAY|TERRACE|HIGHWAY|CIRCLE|DRIVE|TRAIL|COURT|PLACE|ROAD|LANE|BLVD|PKWY|AVE|TER|HWY|CIR|DR|TRL|CT|PL|RD|LN|ST|WAY|LOOP)$/i.exec(raw);
 if(!m)return unsupported("");
 const name=m[3].trim();
 if(!name||!/[A-Z]/.test(name)||name.includes("  "))return unsupported("");
 const houseNumber=Number(m[1]);
 if(!Number.isSafeInteger(houseNumber)||houseNumber<1)return unsupported("");
 const unitValue=unit.trim().toUpperCase().replace(/^#/,"");
 if(unitValue&&!/^[A-Z0-9-]{1,12}$/.test(unitValue))return unsupported("Invalid unit.");
 const zipValue=zip.trim();
 if(zipValue&&!/^\d{5}$/.test(zipValue))return unsupported("ZIP must be five digits.");
 return {houseNumber,direction:m[2]??"",streetName:name,
  streetType:streetTypes[m[4]]??m[4],unit:unitValue||null,zip:zipValue||null};
}
export function buildPortlandGISQuery(address:StreetAddress):string{
 // Values are validated before entering SQL, no arbitrary queries or wildcards.
 if(!Number.isInteger(address.houseNumber)||address.houseNumber<1||
  !/^[A-Z0-9 -]{1,60}$/.test(address.streetName)||
  !Object.values(streetTypes).includes(address.streetType)||
  (address.direction!==""&&!/^(N|S|E|W|NE|NW|SE|SW)$/.test(address.direction)))
  throw new RangeError("Invalid address components.");
 const where=[
  "ADDRESS_NUMBER = "+address.houseNumber,
  "STREET_NAME = '"+address.streetName+"'",
  "STREET_TYPE_CODE = '"+address.streetType+"'",
  "STREET_PREFIX_DIRECTION "+(address.direction?"= '"+address.direction+"'":"IS NULL"),
  "STATUS = 'Active'"
 ];
 if(address.zip)where.push("ZIP_CODE = '"+address.zip+"'");
 const url=new URL(PORTLAND_GIS_QUERY);
 url.searchParams.set("f","json");
 url.searchParams.set("where",where.join(" AND "));
 url.searchParams.set("outFields",PORTLAND_GIS_FIELDS.join(","));
 url.searchParams.set("returnGeometry","false");
 url.searchParams.set("resultRecordCount","101"); // 101 means an ambiguous/truncated large property
 return url.toString();
}
const unresolved=(status:GISStatus,reason:string,checkedOn:string,records=0):GISResult=>({
 status,reason,jurisdiction:null,checkedOn,matchedRecords:records,
 evidence:null,propertyUrl:null,sourceUrl:PORTLAND_GIS_LAYER
});
type GISAttributes={
 ADDRESS_FULL?:unknown;ADDRESS_NUMBER?:unknown;STREET_NAME?:unknown;
 STREET_TYPE_CODE?:unknown;STREET_PREFIX_DIRECTION?:unknown;UNIT?:unknown;
 ZIP_CODE?:unknown;JURISDICTION_NAME?:unknown;STATE_ABBREVIATION?:unknown;
 STATUS?:unknown;PROPERTY_ID?:unknown;
};
/** Takes untrusted server JSON and never reports success on partial matches. */
export function interpretPortlandGISResponse(
 response:unknown,address:StreetAddress,checkedOn:string
):GISResult{
 if(!validDay(checkedOn))throw new RangeError("Invalid lookup observation date.");
 if(!response||typeof response!=="object")return unresolved("unavailable","City GIS did not return a usable response.",checkedOn);
 const r=response as {features?:unknown;error?:unknown;exceededTransferLimit?:unknown};
 if(r.error||!Array.isArray(r.features))
  return unresolved("unavailable","City GIS reported an error or unusable query response. Do not infer jurisdiction.",checkedOn);
 if(r.exceededTransferLimit===true||r.features.length>100)
  return unresolved("ambiguous","The address search exceeded its safe result limit. Use PortlandMaps to select the exact property manually.",checkedOn,r.features.length);
 const valid:GISAttributes[]=[];
 for(const f of r.features){
  if(!f||typeof f!=="object")continue;
  const a=(f as {attributes?:unknown}).attributes;
  if(!a||typeof a!=="object")continue;
  const item=a as GISAttributes;
  if(item.ADDRESS_NUMBER!==address.houseNumber||
    upper(item.STREET_NAME)!==address.streetName||
    upper(item.STREET_TYPE_CODE)!==address.streetType||
    upper(item.STREET_PREFIX_DIRECTION)!==address.direction||
    upper(item.STATUS)!=="ACTIVE"||
    (address.zip&&upper(item.ZIP_CODE)!==address.zip)||
    (address.unit&&upper(item.UNIT)!==address.unit))continue;
  valid.push(item);
 }
 if(!valid.length)return unresolved("not-found","No exact, active official address-point record matched every entered component. This does NOT prove the property is outside Portland.",checkedOn);
 const jurisdictions=[...new Set(valid.map(a=>upper(a.JURISDICTION_NAME)))];
 const states=[...new Set(valid.map(a=>upper(a.STATE_ABBREVIATION)))];
 const propertyIds=[...new Set(valid.map(a=>upper(a.PROPERTY_ID)).filter(Boolean))];
 if(jurisdictions.some(j=>!j)||jurisdictions.length!==1||states.length!==1||
  (propertyIds.length>1)|| (valid.length>1&&propertyIds.length===0))
  return unresolved("ambiguous","The official address-point records disagree or represent multiple unresolved properties. Verify the parcel directly on PortlandMaps.",checkedOn,valid.length);
 const jurisdiction=jurisdictions[0],state=states[0];
 let status:GISStatus;
 if(state!=="OR")status="outside-oregon";
 else if(jurisdiction==="PORTLAND"){
  if(propertyIds.length!==1)return unresolved("ambiguous","This Portland address point does not resolve to one identifiable property. Inspect the exact parcel in PortlandMaps.",checkedOn,valid.length);
  status="portland";
 }else status="other-oregon";
 const evidence=status==="portland"||status==="other-oregon"?{
  source:"portlandmaps-active-address-points" as const,
  scope:status,
  checkedOn,
  match:"exact-active-address" as const
 }:null;
 const prop=propertyIds[0]||"";
 const propertyUrl=/^[A-Z]\d{6,9}$/.test(prop)?
  "https://www.portlandmaps.com/detail/property/"+prop+"_did/":null;
 return {
  status,reason:status==="portland"?
   "An exact ACTIVE city address-point record reports Portland jurisdiction. Confirm the linked parcel and permit office before filing.":
   status==="other-oregon"?
    "An exact ACTIVE official address-point record reports "+jurisdiction+", not Portland. Use that local permit authority.":
    "The exact city GIS address record is outside Oregon; Oregon-specific permits and incentives do not apply.",
  jurisdiction,checkedOn,matchedRecords:valid.length,evidence,propertyUrl,
  sourceUrl:PORTLAND_GIS_LAYER
 };
}
/**
 * Explicitly invoked by the visitor; never on typing or page load. Only
 * the municipal ArcGIS service receives the matched address components.
 * No application proxy, address storage, cookies or referrer.
 */
export async function lookupPortlandJurisdiction(
 street:string,unit:string,zip:string,signal?:AbortSignal,
 fetcher:typeof fetch=fetch,
 checkedOn=new Date().toISOString().slice(0,10)
):Promise<GISResult>{
 const address=parsePortlandStreetAddress(street,unit,zip);
 let response:Response;
 try{
  response=await fetcher(buildPortlandGISQuery(address),{
   method:"GET",credentials:"omit",mode:"cors",cache:"no-store",
   referrerPolicy:"no-referrer",signal
  });
  if(!response.ok)return unresolved("unavailable",
   "City GIS request failed ("+response.status+"). Open PortlandMaps to verify the parcel manually.",checkedOn);
  return interpretPortlandGISResponse(await response.json(),address,checkedOn);
 }catch(e){
  if(signal?.aborted)throw e;
  return unresolved("unavailable","The City GIS lookup could not be completed. This does not establish Portland or non-Portland jurisdiction.",checkedOn);
 }
}
