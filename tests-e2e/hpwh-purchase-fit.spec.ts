import {test,expect,type Page} from "@playwright/test";

const route="/oregon/heat-pump-water-heaters";
async function open(page:Page){
 await page.clock.install({time:new Date("2026-11-06T19:00:00Z")});
 await page.goto(route);
}
async function completeSite(page:Page){
 await page.locator("#hpwh-fit-location").selectOption("utility-room");
 await page.locator("#hpwh-fit-ambient").selectOption("typically-above-38");
 await page.locator("#hpwh-fit-power").selectOption("usable-240");
 await page.locator("#hpwh-fit-drain").selectOption("nearby-gravity");
 await page.locator("#hpwh-fit-demand").selectOption("typical");
 await page.locator("#hpwh-fit-lengthFt").fill("10");
 await page.locator("#hpwh-fit-widthFt").fill("10");
 await page.locator("#hpwh-fit-heightFt").fill("8");
}
async function completeModel(page:Page,id:"a"|"b"){
 await page.locator("#hpwh-fit-"+id+"-model").fill("SAMPLE-65-HPWH");
 await page.locator("#hpwh-fit-"+id+"-firstHourGallons").fill("79");
 await page.locator("#hpwh-fit-"+id+"-uef").fill("3.9");
 await page.locator("#hpwh-fit-"+id+"-manufacturerMinimumAirFt3").fill("700");
 await page.locator("#hpwh-fit-"+id+"-airPlan").selectOption("open-room");
 await page.locator("#hpwh-fit-"+id+"-voltage").selectOption("240");
 for(const key of ["circuitPlanDocumented","condensateSolutionIncluded","modelOperatingTemperatureChecked",
  "serviceClearanceDocumented","noiseAndCoolingDiscussed","commissioningAndHandoverIncluded"])
  await page.locator("#hpwh-fit-"+id+"-"+key).selectOption("yes");
}
test("site-first HPWH purchase guide and identical quote request are usable without submitting personal data",async({page})=>{
 await open(page);
 const studio=page.locator("#hpwh-installation-fit");
 await expect(studio.getByRole("heading",{name:/Check space, water demand and model requirements before you buy/})).toBeVisible();
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
 const download=page.waitForEvent("download");
 await studio.getByRole("button",{name:"Download bid sheet (.txt)"}).click();
 expect((await download).suggestedFilename()).toBe("oregon-hpwh-installation-bid-plan.txt");
 await expect(studio.getByText(/remain in browser memory/)).toBeVisible();
});
test("undersized enclosed room triggers manufacturer air-volume review without an automatic approval",async({page})=>{
 await open(page);
 await page.locator("#hpwh-fit-lengthFt").fill("5");
 await page.locator("#hpwh-fit-widthFt").fill("5");
 await page.locator("#hpwh-fit-heightFt").fill("8");
 await page.locator("#hpwh-fit-a-manufacturerMinimumAirFt3").fill("700");
 await page.locator("#hpwh-fit-a-airPlan").selectOption("open-room");
 const studio=page.locator("#hpwh-installation-fit");
 await expect(studio.locator(".hpwh-fit-volume")).toContainText("200 cubic feet");
 await expect(studio).toContainText("below the user-reported model minimum");
 await expect(studio).toContainText(/Obtain a written approved intake\/exhaust or louver/i);
});
test("same genuine quoted models and all model/site evidence allow only an as-quoted provisional comparison",async({page})=>{
 await open(page);
 await page.locator(".hpwh-quote-step > summary").click();
 for(const [id,price] of [["a","3500"],["b","3700"]] as const){
  await page.locator("#hw-"+id+"-total").fill(price);
  await page.locator("#hw-"+id+"-basis").selectOption("before-incentives");
  await page.locator("#hw-"+id+"-scope").selectOption("same-location");
  await page.locator("#hw-"+id+"-tank").fill("65");
  await page.locator(".hpwh-quote").filter({has:page.locator("#hw-"+id+"-total")}).locator(".hpwh-details > summary").click();
  for(const key of ["plumbingIncluded","electricalIncluded","condensateIncluded","airflowDocumented","warrantyWritten"])
   await page.locator("#hw-"+id+"-"+key).selectOption("yes");
 }
 await completeSite(page);
 await completeModel(page,"a");
 await completeModel(page,"b");
 const studio=page.locator("#hpwh-installation-fit");
 await expect(studio.getByRole("heading",{name:/Written model and site evidence appears aligned/})).toBeVisible();
 await expect(studio).toContainText("no technical approval");
 await expect(page.getByText(/Lowest equivalent-scope reported total: quote A/)).toBeVisible();
 const download=page.waitForEvent("download");
 await studio.getByRole("button",{name:"Download full review (.txt)"}).click();
 expect((await download).suggestedFilename()).toBe("oregon-hpwh-fit-and-quote-plan.txt");
 await page.locator("#hpwh-fit-b-model").fill("DIFFERENT-HEATER");
 await expect(studio).toContainText("Your quotes propose different water-heater products");
 await expect(page.getByText(/Do not rank the quotes yet/)).toBeVisible();
});
test("even matching broad price quotes cannot be ranked until model/site fit is supplied",async({page})=>{
 await open(page);
 await page.locator(".hpwh-quote-step > summary").click();
 for(const [id,price] of [["a","3200"],["b","3500"]] as const){
  await page.locator("#hw-"+id+"-total").fill(price);
  await page.locator("#hw-"+id+"-basis").selectOption("before-incentives");
  await page.locator("#hw-"+id+"-scope").selectOption("same-location");
  await page.locator("#hw-"+id+"-tank").fill("65");
  await page.locator(".hpwh-quote").filter({has:page.locator("#hw-"+id+"-total")}).locator(".hpwh-details > summary").click();
  for(const key of ["plumbingIncluded","electricalIncluded","condensateIncluded"])
   await page.locator("#hw-"+id+"-"+key).selectOption("yes");
 }
 await expect(page.getByText(/Do not rank the quotes yet/)).toBeVisible();
 await expect(page.getByText(/Lowest equivalent-scope reported total/)).toHaveCount(0);
});
test("HPWH purchasing guide is source-backed, linked and protected from indexing",async({page})=>{
 await page.goto(route+"/buying-guide");
 await expect(page.getByRole("heading",{name:/Will this heat-pump water heater actually fit your home/})).toBeVisible();
 await expect(page.getByText(/First Hour Rating/).first()).toBeVisible();
 await expect(page.getByRole("link",{name:/Open the personalized room and quote-fit decision tool/})).toBeVisible();
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
});
