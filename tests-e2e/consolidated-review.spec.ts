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
 awa¶»§q«^