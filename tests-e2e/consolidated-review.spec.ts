import {test,expect} from "@playwright/test";
import {readFile} from "node:fs/promises";

const gis="**/CGIS_MJ_Address_Taxlot/MapServer/0/query?**";
const city={
 ADDRESS_FULL:"1120 SW 5TH AVE",ADDRESS_NUMBER:1120,
 ADDRESS_NUMBER_CHAR:"1120",STREET_NAME:"5TH",STREET_TYPE_CODE:"AVE",
 STREET_PREFIX_DIRECTION:"SW",STREET_POST_DIRECTION:" ",
 UNIT:null,ZIP_CODE:"97204",JURISDICTION_NAME:"PORTLAND",
 STATE_ABBREVIATION:"OR",STATUS:"Active",PROPERTY_ID:"R246103"
};
const neighbor={
 ADDRESS_FULL:"1333 NW EASTMAN PKWY",ADDRESS_NUMBER:1333,
 ADDRESS_NUMBER_CHAR:"1333",STREET_NAME:"EASTMAN",STREET_TYPE_CODE:"PKWY",
 STREET_PREFIX_DIRECTION:"NW",STREET_POST_DIRECTION:" ",
 UNIT:null,ZIP_CODE:"97030",JURISDICTION_NAME:"GRESHAM",
 STATE_ABBREVIATION:"OR",STATUS:"Active",PROPERTY_ID:null
};
const response=(...rows:Record<string,unknown>[])=>({
 status:200,contentType:"application/json",
 headers:{"access-control-allow-origin":"*"},
 body:JSON.stringify({features:rows.map(attributes=>({attributes}))})
});
const dossier="/projects/oregon-requirements";

test("unverified address cannot authorize Portland permits; manual selection remains explicitly conditional",async({page})=>{
 await page.goto(dossier);
 await expect(page.getByRole("heading",{name:/Know what your project needs/i})).toBeVisible();
 await expect(page.locator("#od-place")).toHaveValue("portland-unverified");
 await expect(page.locator(".or-dossier-overview")).toContainText("Actual permit authority is not established");
 await page.locator("#od-house").selectOption("one-two-family");
 await expect(page.locator(".or-dossier-status.required")).toHaveCount(0);
 await page.locator("#od-place").selectOption("portland-reported");
 await expect(page.locator(".or-dossier-overview")).toContainText("reported by you");
 await expect(page.getByText("Portland residential mechanical permit").first()).toBeVisible();
});

test("official Portland address lookup changes dossier and leaves address out of download",async({page})=>{
 let calls=0;
 await page.route(gis,route=>{
  calls++;
  expect(new URL(route.request().url()).searchParams.get("returnGeometry")).toBe("false");
  return route.fulfill(response(city,{...city,UNIT:"200"}));
 });
 await page.goto(dossier);
 expect(calls).toBe(0);
 await page.locator("#od-house").selectOption("one-two-family");
 await page.locator("#city-address").fill("1120 SW 5th Ave");
 await page.locator("#city-zip").fill("97204");
 expect(calls).toBe(0);
 await page.getByRole("button",{name:"Check City GIS jurisdiction"}).click();
 await expect(page.locator("#od-place")).toHaveValue("portland-gis-record");
 await expect(page.locator(".city-jurisdiction-success")).toContainText("PORTLAND");
 await expect(page.locator(".or-dossier-overview")).toContainText("official City address-point layer reports Portland");
 await expect(page.getByText("Portland residential mechanical permit").first()).toBeVisible();
 await expect(page.locator("#city-address")).toHaveValue("");
 expect(calls).toBe(1);
 const next=page.waitForEvent("download");
 await page.getByRole("button",{name:/Download dossier/}).click();
 const data=await readFile(await(await next).path(),"utf8");
 expect(data).toContain("exact government GIS address point checked");
 expect(data).not.toContain("1120");
 expect(data).not.toContain("R246103");
 await page.locator("#od-place").selectOption("portland-unverified");
 await expect(page.locator(".city-jurisdiction-success")).toHaveCount(0);
 await expect(page.locator(".or-dossier-status.required")).toHaveCount(0);
});

test("exact Gresham record cannot trigger Portland service-panel permit",async({page})=>{
 await page.route(gis,route=>route.fulfill(response(neighbor)));
 await page.goto(dossier);
 await page.locator("#od-project").selectOption("electrical-panel");
 await page.locator("#od-house").selectOption("one-two-family");
 await page.locator("#od-scope").selectOption("panel-replacement");
 await page.locator("#city-address").fill("1333 NW Eastman Pkwy");
 await page.locator("#city-zip").fill("97030");
 await page.getByRole("button",{name:"Check City GIS jurisdiction"}).click();
 await expect(page.locator("#od-place")).toHaveValue("other-oregon-gis-record");
 await expect(page.locator(".city-jurisdiction-success")).toContainText("GRESHAM");
 await expect(page.locator(".or-dossier-overview")).toContainText("non-Portland jurisdiction");
 await expect(page.locator(".or-dossier-status.required")).toHaveCount(0);
 await expect(page.getByText("Verify local electrical permit and inspections")).toBeVisible();
});

test("ambiguous records cannot establish City permits, and editing address clears previous evidence",async({page})=>{
 let calls=0;
 await page.route(gis,route=>route.fulfill(response(...(++calls===1?
  [city,{...city,PROPERTY_ID:"R654321"}]:[city]))));
 await page.goto(dossier);
 await page.locator("#od-house").selectOption("one-two-family");
 await page.locator("#city-address").fill("1120 SW 5th Ave");
 await page.getByRole("button",{name:"Check City GIS jurisdiction"}).click();
 await expect(page.locator(".city-jurisdiction-unresolved")).toContainText("Multiple or conflicting records");
 await expect(page.locator("#od-place")).toHaveValue("portland-unverified");
 await page.getByRole("button",{name:"Check City GIS jurisdiction"}).click();
 await expect(page.locator(".city-jurisdiction-success")).toContainText("PORTLAND");
 await page.locator("#city-address").fill("1130 SW 5th Ave");
 await expect(page.locator(".city-jurisdiction-success")).toHaveCount(0);
 await expect(page.locator("#od-place")).toHaveValue("portland-unverified");
 expect(calls).toBe(2);
});

test("privacy disclosure names the City as the third-party address recipient",async({page})=>{
 await page.goto("/privacy");
 await expect(page.getByText(/Optional City of Portland jurisdiction check/)).toBeVisible();
 await expect(page.getByText(/directly from your browser to the City of Portland/)).toBeVisible();
 await page.goto(dossier);
 await expect(page.getByText(/City may log the request/)).toBeVisible();
});

test("small phone layout has no horizontal overflow and lookup is keyboard accessible",async({page})=>{
 await page.setViewportSize({width:390,height:850});
 await page.goto(dossier);
 const input=page.locator("#city-address");
 await expect(input).toBeVisible();
 await input.focus();
 await expect(input).toBeFocused();
 await expect(page.getByRole("button",{name:"Check City GIS jurisdiction"})).toBeDisabled();
 const dims=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth}));
 expect(dims.scrollWidth).toBeLessThanOrEqual(dims.width+4);
});
