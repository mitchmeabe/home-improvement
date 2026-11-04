import {test,expect} from "@playwright/test";

test("unified homepage keeps both state planners",async({page})=>{
 await page.goto("/");
 await expect(page.getByRole("heading",{name:/Compare the real project before accepting/i})).toBeVisible();
 await expect(page.locator('a[href="/massachusetts/heat-pumps"]').first()).toBeVisible();
 await expect(page.locator("#oregon-project")).toBeVisible();
 await expect(page.locator("#oregon-quotes")).toBeVisible();
});

test("Massachusetts not-in-state is not supported by the rebate screener",async({page})=>{
 await page.goto("/massachusetts/heat-pumps");
 await page.locator("#ma-in-state").selectOption("no");
 await expect(page.getByText("Reported eligibility barrier").first()).toBeVisible();
});

test("Massachusetts advanced eligibility is optional until user can verify",async({page})=>{
 await page.goto("/massachusetts/heat-pumps");
 const form=page.locator(".ma-progressive").first();
 await expect(form).not.toHaveAttribute("open");
 await form.locator("summary").click();
 await expect(form).toHaveAttribute("open","");
 await expect(page.locator("#ma-sponsor")).toBeVisible();
});

test("comparable Massachusetts bids show a reported total price difference",async({page})=>{
 await page.goto("/massachusetts/heat-pumps");
 await page.locator("#ma-a-price").fill("16000");
 await page.locator("#ma-b-price").fill("22000");
 await page.locator("#ma-a-scope").selectOption("reuse-existing-ducts");
 await page.locator("#ma-b-scope").selectOption("reuse-existing-ducts");
 await page.locator("#ma-a-basis").selectOption("before-rebate");
 await page.locator("#ma-b-basis").selectOption("before-rebate");
 await expect(page.getByText(/Difference between comparable reported price totals/i)).toBeVisible();
 const pending=page.waitForEvent("download");
 await page.getByRole("button",{name:/Download report/i}).click();
 expect((await pending).suggestedFilename()).toBe("massachusetts-quote-review-plan.txt");
});

test("different ductwork scopes suppress lowest-price winner",async({page})=>{
 await page.goto("/massachusetts/heat-pumps");
 await page.locator("#ma-a-price").fill("26000");
 await page.locator("#ma-b-price").fill("45000");
 await page.locator("#ma-a-scope").selectOption("reuse-existing-ducts");
 await page.locator("#ma-b-scope").selectOption("replace-or-build-ducts");
 await page.locator("#ma-a-basis").selectOption("before-rebate");
 await page.locator("#ma-b-basis").selectOption("before-rebate");
 await expect(page.getByText(/Comparing new ductwork to duct reuse/i)).toBeVisible();
 await expect(page.getByText(/Difference between comparable reported price totals/i)).toHaveCount(0);
});

test("Oregon HP3 source and quote reports remain accessible",async({page})=>{
 await page.goto("/");
 await expect(page.locator("#oregon-quotes")).toBeVisible();
 await expect(page.getByText(/Oregon HP3/).first()).toBeVisible();
 const pending=page.waitForEvent("download");
 await page.getByRole("button",{name:/Download report/i}).click();
 expect((await pending).suggestedFilename()).toBe("oregon-heat-pump-quotes-plan.txt");
 await page.goto("/privacy");
 await expect(page.getByRole("heading",{name:/Privacy and data use/})).toBeVisible();
});

test("key routes are mobile-width compatible",async({page})=>{
 test.skip(!test.info().project.name.startsWith("mobile"),"mobile-only");
 for(const route of ["/","/massachusetts/heat-pumps"]){
  await page.goto(route);
  const {scrollWidth,viewport}=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  expect(scrollWidth,route+" horizontal overflow").toBeLessThanOrEqual(viewport+4);
 }
});
