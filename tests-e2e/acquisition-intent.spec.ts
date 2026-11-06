import {test,expect} from "@playwright/test";
test("San Jose new electrical work shows optional non-referral quote intent, existing Level 1 does not",async({page})=>{
 await page.clock.install({time:new Date("2026-11-06T12:00:00Z")});
 await page.goto("/california/san-jose-ev-charger");
 await page.locator("#sj-location").selectOption("city-verified");
 await page.locator("#sj-property").selectOption("single-duplex");
 await page.locator("#sj-charge").selectOption("level2");
 await page.locator("#sj-panel").selectOption("not-proposed");
 await page.locator("#sj-ventilation").selectOption("confirmed-not-required");
 const button=page.getByRole("button",{name:"I plan to compare electrician quotes"});
 await expect(button).toBeVisible();await button.click();await expect(button).toBeDisabled();
 await expect(page.getByRole("status")).toContainText("No project details or referral request");
 await page.locator("#sj-charge").selectOption("level1-existing");
 await expect(button).toHaveCount(0);
});
