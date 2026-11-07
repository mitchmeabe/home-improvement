import {test,expect,type Page} from "@playwright/test";
async function go(page:Page,date="2026-11-07T12:00:00Z"){
 await page.clock.install({time:new Date(date)});await page.goto("/");
}
async function base(page:Page){
 await go(page);
 await page.locator("#w-source").selectOption("domestic");
 await page.locator("#w-purpose").selectOption("routine");
 await page.locator("#w-role").selectOption("owner");
 await page.locator("#w-concern").selectOption("no");
 await page.locator("#w-area").selectOption("clear-reviewed");
}
async function sale(page:Page){
 await base(page);
 await page.locator("#w-purpose").selectOption("sale");
 await page.locator("#w-role").selectOption("seller");
 await page.locator("#w-offer").selectOption("yes");
}
async function quote(page:Page,id:"a"|"b",price:string){
 for(const a of ["coliform","nitrate","arsenic"]){
  const field=page.locator("#q-"+id+"-"+a);
  if(await field.count())await field.selectOption("yes");
 }
 for(const key of ["activeAccreditationForTests","acceptsPrivateSamples","instructionsAndContainers",
  "holdingTimeArranged","resultsAndTurnaroundConfirmed"]){
  await page.locator("#q-"+id+"-"+key).selectOption("yes");
 }
 const e=page.locator("#q-"+id+"-ecoli");if(await e.count())await e.selectOption("yes");
 const saleField=page.locator("#q-"+id+"-sale");if(await saleField.count())await saleField.selectOption("yes");
 await page.locator("#q-"+id+"-method").selectOption("dropoff");
 await page.locator("#q-"+id+"-mandatoryPrice").fill(price);
 await page.locator("#q-"+id+"-sampleCollectionAndDeliveryFee").fill("10");
 await page.locator("#q-"+id+"-otherMandatoryCharges").fill("0");
}
test("private pilot starts unknown with no upsell or invented lab offers",async({page})=>{
 await go(page);
 await expect(page).toHaveTitle(/WellOrder/);
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
 await expect(page.getByRole("heading",{name:/Don't buy the wrong/})).toBeVisible();
 await expect(page.locator("#w-source")).toHaveValue("unknown");
 await expect(page.getByRole("region",{name:"Well test purchase decision"})).toContainText("Confirm well type");
 await expect(page.getByRole("heading",{name:/Compare two written laboratory quotes/})).toHaveCount(0);
});
test("routine domestic well with no tests creates voluntary three-test request with zero assumed quotes",async({page})=>{
 await base(page);
 await page.getByRole("button",{name:/I've never tested these three/}).click();
 await expect(page.getByRole("region",{name:"Well test purchase decision"})).toContainText("Build a targeted routine private-well lab request");
 await expect(page.locator(".analyte-chip")).toHaveCount(3);
 await expect(page.getByRole("heading",{name:/Compare two written laboratory quotes/})).toBeVisible();
 await expect(page.locator(".comparison")).toContainText("No comparable lab-price winner");
 await expect(page.locator("#q-a-mandatoryPrice")).toHaveValue("");
});
test("sale with accepted offer and no past results distinguishes mandatory three-test seller order",async({page})=>{
 await sale(page);
 await page.getByRole("button",{name:/I've never tested these three/}).click();
 await expect(page.getByRole("region",{name:"Well test purchase decision"})).toContainText("missing real-estate well-water tests");
 await expect(page.getByRole("region",{name:"Well test purchase decision"})).toContainText("90 days");
 await expect(page.locator("#q-a-sale")).toBeVisible();
 await expect(page.locator(".analyte-chip")).toHaveCount(3);
});
test("property buyer is not default legal testing purchaser and need not order duplicate kit",async({page})=>{
 await sale(page);
 await page.locator("#w-role").selectOption("buyer");
 await expect(page.getByRole("region",{name:"Well test purchase decision"})).toContainText("places required sale testing on the seller");
 await expect(page.getByRole("heading",{name:/Compare two written laboratory quotes/})).toHaveCount(0);
});
test("seller's three recent, accredited and sampling-compliant tests suppress repeat purchase",async({page})=>{
 await sale(page);
 for(const a of ["coliform","nitrate","arsenic"]){
  await page.locator("#w-"+a+"-kind").selectOption("dated");
  await page.locator("#w-"+a+"-date").fill("2026-05-10");
 }
 await page.locator("#w-prior-accreditation").selectOption("yes");
 await page.locator("#w-prior-collection").selectOption("yes");
 await expect(page.getByRole("region",{name:"Well test purchase decision"})).toContainText("No duplicate laboratory purchase indicated");
 await expect(page.getByRole("heading",{name:/Compare two written laboratory quotes/})).toHaveCount(0);
});
test("area not reviewed or hazard concern prevents a supposedly complete real-estate order",async({page})=>{
 await sale(page);
 await page.getByRole("button",{name:/I've never tested these three/}).click();
 await page.locator("#w-area").selectOption("not-reviewed");
 await expect(page.getByRole("region",{name:"Well test purchase decision"})).toContainText("extra tests");
 await expect(page.locator(".quote-grid")).toHaveCount(0);
 await page.locator("#w-area").selectOption("clear-reviewed");
 await page.locator("#w-concern").selectOption("yes");
 await expect(page.getByRole("region",{name:"Well test purchase decision"})).toContainText("situation-specific");
 await expect(page.locator(".quote-grid")).toHaveCount(0);
});
test("a complete pair of like-for-like sale quotes shows only actual self-reported fee difference",async({page})=>{
 await sale(page);
 await page.getByRole("button",{name:/I've never tested these three/}).click();
 await quote(page,"a","80");
 await quote(page,"b","95");
 await expect(page.locator(".comparison")).toContainText("Conditional difference: $15.00");
 await expect(page.locator(".comparison")).toContainText("Proposal A is lower");
 await page.locator("#q-b-method").selectOption("mail");
 await expect(page.locator(".comparison")).toContainText("No comparable lab-price winner");
 await page.locator("#q-b-method").selectOption("dropoff");
 await page.locator("#q-b-activeAccreditationForTests").selectOption("unknown");
 await expect(page.locator(".comparison")).toContainText("No comparable lab-price winner");
});
test("missing mandatory shipping fee and sample holding time prevent price ranking",async({page})=>{
 await sale(page);
 await page.getByRole("button",{name:/I've never tested these three/}).click();
 await quote(page,"a","80");
 await quote(page,"b","95");
 await page.locator("#q-b-sampleCollectionAndDeliveryFee").fill("");
 await expect(page.locator(".comparison")).toContainText("No comparable lab-price winner");
 await page.locator("#q-b-sampleCollectionAndDeliveryFee").fill("0");
 await page.locator("#q-b-holdingTimeArranged").selectOption("no");
 await expect(page.locator(".comparison")).toContainText("No comparable lab-price winner");
});
test("local text report downloads, without collecting an address or lab booking",async({page})=>{
 await base(page);
 await page.getByRole("button",{name:/I've never tested these three/}).click();
 const action=page.waitForEvent("download");
 await page.getByRole("button",{name:"Download full audit (.txt)"}).click();
 expect((await action).suggestedFilename()).toBe("oregon-well-test-lab-audit.txt");
 await expect(page.getByRole("status")).toContainText("No information was submitted");
});
test("routine fresh results from last year avoid repeat buying and stale sources suppress recommendations",async({page})=>{
 await base(page);
 for(const a of ["coliform","nitrate","arsenic"]){
  await page.locator("#w-"+a+"-kind").selectOption("dated");
  await page.locator("#w-"+a+"-date").fill("2026-05-10");
 }
 await expect(page.getByRole("region",{name:"Well test purchase decision"})).toContainText("no repeat core tests are due");
 await go(page,"2026-12-08T12:00:00Z");
 await expect(page.getByRole("region",{name:"Well test purchase decision"})).toContainText("source review is overdue");
 await expect(page.locator(".quote-grid")).toHaveCount(0);
});
test("non-domestic sources never enter ordinary domestic-well sample purchasing",async({page})=>{
 await base(page);
 for(const source of ["municipal","spring","irrigation","new-well"]){
  await page.locator("#w-source").selectOption(source);
  await expect(page.getByRole("region",{name:"Well test purchase decision"})).toContainText("Different water source");
  await expect(page.locator(".quote-grid")).toHaveCount(0);
 }
});
