import {test,expect,type Page} from "@playwright/test";

async function baseline(page:Page){
 await page.clock.install({time:new Date("2026-11-06T18:00:00Z")});
 await page.goto("/");
 await page.getByLabel("Total installed quote ($)").nth(0).fill("13800");
 await page.getByLabel("Total installed quote ($)").nth(1).fill("16400");
 await page.getByLabel("Is this total before or after incentives?").nth(0).selectOption("before-discounts");
 await page.getByLabel("Is this total before or after incentives?").nth(1).selectOption("before-discounts");
 await page.getByLabel("Quote A installation scope").selectOption("reuse-existing-ducts");
 await page.getByLabel("Quote B installation scope").selectOption("reuse-existing-ducts");
 await page.locator("#hp-bid-goal").selectOption("whole-home");
 await page.locator("#hp-bid-replacement").selectOption("yes");
 await page.locator("#hp-bid-ducts").selectOption("yes");
}
async function completeEvidence(page:Page,id:"a"|"b"){
 const sel=async(key:string,value:string)=>page.locator("#hp-bid-"+id+"-"+key).selectOption(value);
 await sel("loadMethod","manual-j");
 for(const key of ["loadReportProvided","manufacturerPerformanceAtDesign","matchedEquipmentModels",
  "roomsOrZonesDocumented","commissioningReport","ownerControlsHandover"]){
  await sel(key,"yes");
 }
 await sel("backup","new-auxiliary");await sel("ductReview","documented");
 await page.locator("#hp-bid-"+id+"-designOutdoorTempF").fill("20");
 await page.locator("#hp-bid-"+id+"-documentedHeatLoadBtu").fill("42000");
 await page.locator("#hp-bid-"+id+"-manufacturerCapacityBtuAtDesign").fill(id==="a"?"45000":"46000");
 await page.locator("#hp-bid-"+id+"-zonesServed").fill("8");
}
test("homeowner can download a shared bid specification and complete quality evidence review for two quotes",async({page})=>{
 await baseline(page);
 const studio=page.locator("#heat-pump-design-review");
 await expect(studio.getByRole("heading",{name:/Check the design evidence before comparing installation prices/})).toBeVisible();
 const pendingReq=page.waitForEvent("download");
 await studio.getByRole("button",{name:"Download request (.txt)"}).click();
 expect((await pendingReq).suggestedFilename()).toBe("oregon-heat-pump-bid-request-plan.txt");
 await completeEvidence(page,"a");await completeEvidence(page,"b");
 const assessment=studio.getByRole("region",{name:"Heat pump design and scope assessment"});
 await expect(assessment).toContainText("Written proposal evidence appears sufficiently complete for professional review");
 await expect(studio.getByText("9 / 9 core evidence items documented, self-reported")).toHaveCount(2);
 await expect(assessment).toContainText(/not an equipment-sizing approval/i);
 const pending=page.waitForEvent("download");
 await studio.getByRole("button",{name:"Download review (.txt)"}).click();
 expect((await pending).suggestedFilename()).toBe("oregon-heat-pump-design-evidence-plan.txt");
});
test("different heating coverage or backup strategy blocks apparent apples-to-apples finding",async({page})=>{
 await baseline(page);
 await completeEvidence(page,"a");await completeEvidence(page,"b");
 const studio=page.locator("#heat-pump-design-review");
 await page.locator("#hp-bid-b-zonesServed").fill("5");
 const assessment=studio.getByRole("region",{name:"Heat pump design and scope assessment"});
 await expect(assessment).toContainText("These proposals describe different heating projects");
 await expect(assessment).toContainText("Number of rooms/zones served");
 await page.locator("#hp-bid-b-zonesServed").fill("8");
 await page.locator("#hp-bid-b-backup").selectOption("retain-existing");
 await expect(assessment).toContainText("Heating/backup strategy");
});
test("square footage rule of thumb is not accepted as a proper documented load calculation",async({page})=>{
 await baseline(page);
 const studio=page.locator("#heat-pump-design-review");
 await page.locator("#hp-bid-a-loadMethod").selectOption("square-foot-only");
 const assessment=studio.getByRole("region",{name:"Heat pump design and scope assessment"});
 await expect(assessment).toContainText("square-foot rules of thumb");
 await expect(assessment).not.toContainText("Written proposal evidence appears sufficiently complete");
});
test("third contractor quote receives independent quality inputs and can be removed",async({page})=>{
 await baseline(page);
 await page.getByRole("button",{name:"Add third quote"}).click();
 const studio=page.locator("#heat-pump-design-review");
 await expect(studio.getByRole("article",{name:"Quote C heat pump design evidence"})).toBeVisible();
 await page.locator("#hp-bid-c-loadMethod").selectOption("manual-j");
 await page.getByRole("button",{name:"Remove third quote"}).click();
 await expect(studio.getByRole("article",{name:"Quote C heat pump design evidence"})).toHaveCount(0);
});
test("standalone homeowner design guide explains heat loads, matched capacity, ductless exceptions and stays private",async({page})=>{
 await page.goto("/projects/heat-pump-bid-quality");
 await expect(page.getByRole("heading",{name:/Compare heat pump installation quotes by design, not just price/})).toBeVisible();
 await expect(page.getByText(/ACCA Manual J/).first()).toBeVisible();
 await expect(page.getByRole("link",{name:/Open the heat-pump bid comparison tool/})).toBeVisible();
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
});
