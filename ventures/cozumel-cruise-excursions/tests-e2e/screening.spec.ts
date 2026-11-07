import {test,expect,type Page} from "@playwright/test";
async function ship(page:Page){
 await page.clock.install({time:new Date("2026-11-06T12:00:00Z")});
 await page.goto("/");
 await page.locator("#visit-pier").selectOption("international");
 await page.locator("#visit-pierVerified").selectOption("yes");
 await page.locator("#visit-allAboard").fill("17:00");
 await page.locator("#visit-allAboardVerified").selectOption("yes");
 await page.locator("#visit-ashore").fill("08:00");
 await page.locator("#visit-clockVerified").selectOption("yes");
 await page.locator("#visit-reserve").selectOption("60");
}
async function offer(page:Page,id:"a"|"b",options:Record<string,string>={}){
 await page.locator("#offer-"+id+"-label").fill("Cozumel island snorkel");
 await page.locator("#offer-"+id+"-activity").selectOption(options.activity||"snorkeling");
 await page.locator("#offer-"+id+"-channel").selectOption("independent");
 await page.locator("#offer-"+id+"-start").fill(options.start||"09:00");
 await page.locator("#offer-"+id+"-duration").fill(options.duration||"240");
 await page.locator("#offer-"+id+"-outbound").fill(options.outbound||"20");
 await page.locator("#offer-"+id+"-checkin").fill("10");
 await page.locator("#offer-"+id+"-return").fill(options.return||"45");
 if(id==="b")await page.locator(".offer-card").nth(1).locator(".offer-evidence summary").click();
 for(const key of ["dateSpecificTourConfirmed","meetingAtCorrectPier","offerTimesOnShipClock","ageAndAccessibilityTermsChecked","missedPortCancellationReviewed"])
  await page.locator("#offer-"+id+"-"+key).selectOption("yes");
 await page.locator("#offer-"+id+"-currency").selectOption("USD");
 await page.locator("#offer-"+id+"-perperson").fill("89.50");
 await page.locator("#offer-"+id+"-fees").fill("15");
}
test("private independent Cozumel app opens with no booking products or invented departure values",async({page})=>{
 await page.clock.install({time:new Date("2026-11-06T12:00:00Z")});
 await page.goto("/");
 await expect(page).toHaveTitle(/Cozumel Shore Window/);
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
 await expect(page.getByRole("heading",{name:/Can you take that shore excursion/})).toBeVisible();
 await expect(page.locator("#visit-pier")).toHaveValue("unknown");
 await expect(page.getByRole("region",{name:"Option A assessment"})).toContainText("Confirm the ship facts");
 await expect(page.locator("a[href*='affiliate_id']")).toHaveCount(0);
 await expect(page.getByText(/do not have live ship schedules/)).toBeVisible();
});
test("user-confirmed pier, ship all-aboard and same-clock offer produce only conditional timing fit",async({page})=>{
 await ship(page);await offer(page,"a");
 const card=page.getByRole("region",{name:"Option A assessment"});
 await expect(card).toContainText("supplied same-day timing fits your chosen reserve");
 await expect(card).toContainText("13:45");
 await expect(card).toContainText("16:00");
 await expect(card).toContainText("135 min");
 await expect(card).toContainText("$194.00");
 await expect(card).toContainText("NOT real-time booking availability");
 await expect(page.getByText(/1.*\/ 2/)).toBeVisible();
});
test("late excursion return is rejected even when group price is cheap",async({page})=>{
 await ship(page);await offer(page,"a",{start:"13:00",duration:"180",return:"30"});
 const result=page.getByRole("region",{name:"Option A assessment"});
 await expect(result).toContainText("conflicts with the usable port window");
 await expect(result).toContainText("later than your chosen");
 await expect(page.getByText(/0.*\/ 2/)).toBeVisible();
});
test("unverified ship/local clock never produces a presumptive suitable excursion",async({page})=>{
 await ship(page);await offer(page,"a");
 await page.locator("#visit-clockVerified").selectOption("unknown");
 await expect(page.getByRole("region",{name:"Option A assessment"})).toContainText("Confirm the ship facts");
 await expect(page.getByText(/Cozumel local time may differ/)).toBeVisible();
 await page.locator("#visit-clockVerified").selectOption("yes");
 await page.locator("#offer-a-offerTimesOnShipClock").selectOption("unknown");
 await expect(page.getByRole("region",{name:"Option A assessment"})).toContainText("Verify the written excursion details");
});
test("mainland ferry trips are never approved by arithmetic alone",async({page})=>{
 await ship(page);await offer(page,"a",{activity:"mainland-ferry"});
 await expect(page.getByRole("region",{name:"Option A assessment"})).toContainText("Mainland ferry and ground connections require manual review");
 await expect(page.getByRole("region",{name:"Option A assessment"})).toContainText("ferry timetables");
});
test("wrong berth or operator pickup suppresses tour compatibility despite enough minutes",async({page})=>{
 await ship(page);await offer(page,"a");
 await page.locator("#offer-a-meetingAtCorrectPier").selectOption("no");
 await expect(page.getByRole("region",{name:"Option A assessment"})).toContainText("precise meeting point");
 await page.locator("#offer-a-meetingAtCorrectPier").selectOption("yes");
 await page.locator("#visit-pierVerified").selectOption("no");
 await expect(page.getByRole("region",{name:"Option A assessment"})).toContainText("Confirm the ship facts");
});
test("two independently verified on-island tours, and local report download",async({page})=>{
 await ship(page);await offer(page,"a");await offer(page,"b");
 await expect(page.getByRole("region",{name:"Option A assessment"})).toContainText("Tentative");
 await expect(page.getByRole("region",{name:"Option B assessment"})).toContainText("supplied same-day timing fits");
 const event=page.waitForEvent("download");
 await page.getByRole("button",{name:"Download independent checklist (.txt)"}).click();
 expect((await event).suggestedFilename()).toBe("cozumel-excursion-window-audit.txt");
 await expect(page.getByRole("status")).toContainText("Report generated locally");
});
