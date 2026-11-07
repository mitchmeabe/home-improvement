import {test,expect} from "@playwright/test";

test("private three-feature review hub links each buyer workflow, source guide and original PR",async({page})=>{
 await page.goto("/pilot-review");
 await expect(page.getByRole("heading",{name:/Three homeowner purchasing decisions, one protected review build/})).toBeVisible();
 await expect(page.locator("article.project-finder-card")).toHaveCount(3);
 await expect(page.getByRole("link",{name:/Open interactive purchasing tool/})).toHaveCount(3);
 await expect(page.getByRole("link",{name:/Read source-backed buying guide/})).toHaveCount(2);
 await expect(page.getByRole("link",{name:/Review original draft PR/})).toHaveCount(3);
 await expect(page.getByText(/there is no contractor matching, lead collection/)).toBeVisible();
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
});
test("project finder routes San José EV and Oregon HPWH without mixing Massachusetts project incentives",async({page})=>{
 await page.goto("/projects");
 await page.locator("#pf-project").selectOption("ev-charger");
 await page.locator("#pf-region").selectOption("ca");
 await expect(page.locator(".project-finder-card")).toHaveCount(1);
 await expect(page.getByRole("link",{name:/Open project planner/})).toHaveAttribute("href","/california/san-jose-ev-charger");
 await page.locator("#pf-project").selectOption("water-heater");
 await page.locator("#pf-region").selectOption("ma");
 await expect(page.locator(".project-finder-card")).toHaveCount(0);
 await page.locator("#pf-region").selectOption("or");
 await expect(page.getByRole("link",{name:/Open project planner/})).toHaveAttribute("href","/oregon/heat-pump-water-heaters");
});
test("homepage surfaces every new purchasing extension and still blocks search indexing",async({page})=>{
 await page.goto("/");
 for(const href of [
  "/california/san-jose-ev-charger",
  "/projects/heat-pump-bid-quality",
  "/oregon/heat-pump-water-heaters"
 ])await expect(page.locator('.improvement-directory a[href="'+href+'"]')).toBeVisible();
 await expect(page.locator("#heat-pump-design-review")).toHaveCount(1);
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
 await expect(page.getByRole("navigation",{name:"Main site navigation"}).getByRole("link",{name:"Private feature review"})).toBeVisible();
});
test("combined EV charger, HVAC quality and HPWH model-review routes have real forms, noindex and no checkout",async({page})=>{
 const routes=[
  {url:"/california/san-jose-ev-charger",form:".sjev"},
  {url:"/projects/heat-pump-bid-quality",form:".project-finder"},
  {url:"/oregon/heat-pump-water-heaters",form:"#hpwh-installation-fit"},
  {url:"/oregon/heat-pump-water-heaters/buying-guide",form:".hpwh"}
 ];
 for(const p of routes){
  await page.goto(p.url);
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.locator(p.form)).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
  await expect(page.locator("#primary-content")).toBeVisible();
 }
});
