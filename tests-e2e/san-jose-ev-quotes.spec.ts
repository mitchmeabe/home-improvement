import {test,expect} from "@playwright/test";
const work={
 equipmentIncluded:"yes",wiringIncluded:"yes",electricalPermitIncluded:"yes",
 inspectionIncluded:"yes",panelWorkIncluded:"no",trenchingIncluded:"no",mechanicalPermitIncluded:"no",
 loadReviewDocumented:"yes",managedChargingDocumented:"no",
 panelRationaleDocumented:"no",equipmentModelDocumented:"yes",warrantyWritten:"yes",
};
async function eligible(page){
 await page.clock.install({time:new Date("2026-11-06T12:00:00Z")});
 await page.goto("/california/san-jose-ev-charger");
 await page.locator("#sj-location").selectOption("city-verified");
 await page.locator("#sj-property").selectOption("single-duplex");
 await page.locator("#sj-charge").selectOption("level2");
 await page.locator("#sj-panel").selectOption("not-proposed");
 await page.locator("#sj-ventilation").selectOption("confirmed-not-required");
}
async function fillQuote(page,id,price){
 await page.locator("#sjev-quote-"+id+"-amount").fill(String(price));
 await page.locator("#sjev-quote-"+id+"-basis").selectOption("before-incentives");
 await page.locator("#sjev-quote-"+id+"-scope").selectOption("level2-dedicated");
 await page.getByRole("region",{name:id==="a"?"Proposal A":"Proposal B"}).getByRole("button",{name:/Review included work/}).click();
 for(const [name,v] of Object.entries(work)){
  await page.locator("#sjev-quote-"+id+"-"+name).selectOption(v);
 }
}
test("end-to-end: compare genuinely matching Level 2 quotes and download the homeowner report",async({page})=>{
 await eligible(page);
 await expect(page.getByRole("heading",{name:/Send the same installation specification/i})).toBeVisible();
 const pendingRequest=page.waitForEvent("download");
 await page.getByRole("button",{name:"Download bid request (.txt)"}).click();
 expect((await pendingRequest).suggestedFilename()).toBe("san-jose-ev-electrician-bid-request.txt");
 await fillQuote(page,"a",2350);
 await fillQuote(page,"b",3100);
 const result=page.getByRole("region",{name:"EV charger proposal comparison"});
 await expect(result.getByRole("heading",{name:/Reported installation scopes appear comparable/i})).toBeVisible();
 await expect(result).toContainText("$750.00");
 await expect(result).toContainText("Quote A");
 const pending=page.waitForEvent("download");
 await page.getByRole("button",{name:"Download comparison (.txt)"}).click();
 expect((await pending).suggestedFilename()).toBe("san-jose-ev-quote-comparison.txt");
 await expect(page.getByText(/remain in browser memory/i)).toBeVisible();
});
test("material scope difference suppresses the apparent cheapest quote",async({page})=>{
 await eligible(page);
 await fillQuote(page,"a",2000);
 await fillQuote(page,"b",3000);
 await page.locator("#sjev-quote-b-equipmentIncluded").selectOption("no");
 const result=page.getByRole("region",{name:"EV charger proposal comparison"});
 await expect(result).toContainText("Quotes describe different work");
 await expect(result).not.toContainText("Difference between two reported as-quoted totals");
});
test("quote worksheet is withheld for existing-outlet-only and unverified jurisdiction",async({page})=>{
 await eligible(page);
 await page.locator("#sj-charge").selectOption("level1-existing");
 await expect(page.getByRole("heading",{name:/Finish your jurisdiction and work-scope review first/})).toBeVisible();
 await expect(page.getByRole("heading",{name:/Compare two electrician proposals/})).toHaveCount(0);
 await page.locator("#sj-charge").selectOption("level2");
 await page.locator("#sj-location").selectOption("unsure");
 await expect(page.getByRole("button",{name:"Download bid request (.txt)"})).toHaveCount(0);
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
});
