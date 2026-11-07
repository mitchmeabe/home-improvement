import {test,expect,type Page} from "@playwright/test";
async function setUp(page:Page,change:Record<string,string>={}){
 await page.clock.install({time:new Date("2026-11-06T12:00:00Z")});
 await page.goto("/california/san-jose-ev-charger");
 const v={location:"city-verified",property:"single-duplex",charge:"level2",panel:"proposed",
  ventilation:"confirmed-not-required",...change};
 for(const [k,a] of Object.entries(v))await page.locator("#sj-"+k).selectOption(a);
}
async function fillOffer(page:Page,id:"managed"|"upgrade",amount:number){
 await page.locator("#sjpanel-"+id+"-amount").fill(String(amount));
 await page.locator("#sjpanel-"+id+"-basis").selectOption("before-incentives");
 await page.locator("#sjpanel-"+id+"-utility").selectOption("included");
 await page.locator("#sjpanel-"+id+"-ongoing").fill("0");
 for(const f of ["permitIncluded","inspectionIncluded","equipmentModelDocumented","technicalScopeDocumented","warrantyWritten"])
  await page.locator("#sjpanel-"+id+"-"+f).selectOption("yes");
}
async function evidence(page:Page){
 await page.locator("#sjpanel-rating").selectOption("125-or-less");
 await page.locator("#sjpanel-assessment").selectOption("both-feasible");
 for(const f of ["writtenLoadAssessment","contractorLicenseChecked","sameChargingOutcome","managedEquipmentReviewed","utilityCoordinationReviewed"])
  await page.locator("#sjpanel-"+f).selectOption("yes");
 await page.locator("#sjpanel-existingPanelDefect").selectOption("no");
}
test("shows panel alternative only for screened San José single-family Level 2 projects with proposed or unresolved panel",async({page})=>{
 await page.goto("/california/san-jose-ev-charger");
 await expect(page.getByRole("heading",{name:/Review managed charging versus a proposed panel upgrade/i})).toHaveCount(0);
 await setUp(page);
 await expect(page.getByRole("heading",{name:/Review managed charging versus a proposed panel upgrade/i})).toBeVisible();
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
 await expect(page.getByRole("button",{name:"Download request (.txt)"})).toBeVisible();
});
test("unknown load and unresolved panel safety issues must withhold any financial recommendation",async({page})=>{
 await setUp(page);
 await page.locator("#sjpanel-rating").selectOption("125-or-less");
 await fillOffer(page,"managed",1700);
 await fillOffer(page,"upgrade",6700);
 const result=page.getByRole("region",{name:"Panel upgrade decision audit"});
 await expect(result).toContainText("Do not choose a panel upgrade or managed alternative from price alone");
 await expect(page.getByText(/Conditional first-year quoted difference/)).toHaveCount(0);
 await expect(result).toContainText("125 A or less");
});
test("fully documented technical alternatives report quoted first-year delta without calling it savings",async({page})=>{
 await setUp(page);await evidence(page);
 await fillOffer(page,"managed",1600);await fillOffer(page,"upgrade",6800);
 await expect(page.locator(".sjpanel-difference")).toContainText("$5,200.00");
 await expect(page.locator(".sjpanel-difference")).toContainText("not verified savings");
 const dl=page.waitForEvent("download");
 await page.getByRole("button",{name:"Download decision audit (.txt)"}).click();
 expect((await dl).suggestedFilename()).toBe("san-jose-ev-panel-alternatives-review-plan.txt");
});
test("electrician-required upgrade and independent panel defect invalidate lower managed quote",async({page})=>{
 await setUp(page);await evidence(page);
 await fillOffer(page,"managed",1600);await fillOffer(page,"upgrade",6800);
 await page.locator("#sjpanel-assessment").selectOption("panel-required");
 await expect(page.getByRole("region",{name:"Panel upgrade decision audit"})).toContainText("Panel or utility upgrades need independent professional review");
 await expect(page.locator(".sjpanel-difference")).toHaveCount(0);
 await page.locator("#sjpanel-assessment").selectOption("both-feasible");
 await page.locator("#sjpanel-existingPanelDefect").selectOption("yes");
 await expect(page.locator(".sjpanel-difference")).toHaveCount(0);
});
test("utility costs, ongoing terms or mismatched rebate basis prevent fabricated cost savings",async({page})=>{
 await setUp(page);await evidence(page);
 await fillOffer(page,"managed",1600);await fillOffer(page,"upgrade",6800);
 await page.locator("#sjpanel-managed-basis").selectOption("after-incentives");
 await expect(page.locator(".sjpanel-difference")).toHaveCount(0);
 await page.locator("#sjpanel-managed-basis").selectOption("before-incentives");
 await page.locator("#sjpanel-upgrade-utility").selectOption("separate");
 await expect(page.locator(".sjpanel-difference")).toHaveCount(0);
 await page.locator("#sjpanel-upgrade-utility-fee").fill("500");
 await expect(page.locator(".sjpanel-difference")).toContainText("$5,700.00");
 await page.locator("#sjpanel-managed-ongoing").fill("");
 await expect(page.locator(".sjpanel-difference")).toHaveCount(0);
});
test("out-of-city, multi-unit, Level 1 or no panel plan cannot access this panel-shopping audit",async({page})=>{
 for(const opt of ([
  {location:"unsure"},{location:"elsewhere"},{charge:"level1-existing"},
  {property:"multi-common"},{property:"multi-assigned"},{panel:"not-proposed"}
 ] as Record<string,string>[])){
  await setUp(page,opt);
  await expect(page.getByRole("heading",{name:/Review managed charging versus a proposed panel upgrade/i})).toHaveCount(0);
 }
});
