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
 await expect(page.getByRole("table",{name:/Massachusetts contractor proposal coverage comparison/})).toBeVisible();
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

test("Oregon quote engine withholds ranking across materially different ductwork scopes",async({page})=>{
 await page.goto("/");
 await page.getByLabel("Total installed quote ($)").nth(0).fill("15000");
 await page.getByLabel("Total installed quote ($)").nth(1).fill("23000");
 await page.getByLabel("Is this total before or after incentives?").nth(0).selectOption("before-discounts");
 await page.getByLabel("Is this total before or after incentives?").nth(1).selectOption("before-discounts");
 await page.getByLabel("Quote A installation scope").selectOption("reuse-existing-ducts");
 await page.getByLabel("Quote B installation scope").selectOption("new-ductwork");
 await expect(page.locator(".hp-q-summary")).toContainText("No valid lowest-price ranking");
 await expect(page.getByRole("table",{name:/Oregon heat pump quote completeness comparison/})).toBeVisible();
});

test("both project routes remain non-indexable and robots are private",async({page})=>{
 for(const route of ["/","/massachusetts/heat-pumps"]){
   await page.goto(route);
   await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
 }
 const r=await page.goto("/robots.txt");
 expect(r?.ok()).toBeTruthy();
 await expect(page.locator("body")).toContainText("Disallow: /");
});

test("keyboard can reach the Massachusetts project details and quote entry",async({page})=>{
 await page.goto("/massachusetts/heat-pumps");
 await page.locator("#ma-year").focus();
 await expect(page.locator("#ma-year")).toBeFocused();
 await page.keyboard.press("Tab");
 await expect(page.locator("#ma-route")).toBeFocused();
});

test("Oregon does not credit a reported above-cap HP3 incentive",async({page})=>{
 await page.goto("/");
 await page.getByLabel("Total installed quote ($)").first().fill("15000");
 await page.getByLabel("Quote A installation scope").selectOption("reuse-existing-ducts");
 await page.getByLabel("Quote B installation scope").selectOption("reuse-existing-ducts");
 await page.getByLabel("Is this total before or after incentives?").first().selectOption("before-discounts");
 const details=page.locator(".hp-q-advanced").first();
 await details.locator("summary").click();
 await page.getByLabel("HP3 amount proposed ($)").first().fill("3000");
 await expect(page.getByText(/proposed HP3 discount exceeds the official/i).first()).toBeVisible();
 await expect(page.getByRole("region",{name:/Quote A priority contractor questions/i})).toBeVisible();
});

test("Massachusetts recognizes explicitly different commissioning scope and withholds ranking",async({page})=>{
 await page.goto("/massachusetts/heat-pumps");
 await page.locator("#ma-a-price").fill("22000");
 await page.locator("#ma-b-price").fill("26000");
 await page.locator("#ma-a-scope").selectOption("reuse-existing-ducts");
 await page.locator("#ma-b-scope").selectOption("reuse-existing-ducts");
 await page.locator("#ma-a-basis").selectOption("before-rebate");
 await page.locator("#ma-b-basis").selectOption("before-rebate");
 await page.locator(".ma-bid-details summary").first().click();
 await page.locator(".ma-bid-details summary").nth(1).click();
 await page.locator("#ma-a-commissioningIncluded").selectOption("yes");
 await page.locator("#ma-b-commissioningIncluded").selectOption("no");
 await expect(page.getByRole("region",{name:"Material contractor scope differences"})).toContainText("Startup commissioning included");
 await expect(page.getByText(/Difference between comparable reported price totals/i)).toHaveCount(0);
});
test("Oregon quote comparison exposes excluded work independently of broad scope labels",async({page})=>{
 await page.goto("/");
 await page.getByLabel("Total installed quote ($)").nth(0).fill("15000");
 await page.getByLabel("Total installed quote ($)").nth(1).fill("20000");
 await page.getByLabel("Quote A installation scope").selectOption("reuse-existing-ducts");
 await page.getByLabel("Quote B installation scope").selectOption("reuse-existing-ducts");
 await page.getByLabel("Is this total before or after incentives?").nth(0).selectOption("before-discounts");
 await page.getByLabel("Is this total before or after incentives?").nth(1).selectOption("before-discounts");
 const details=page.locator(".hp-q-advanced");
 await details.nth(0).locator("summary").click();
 await details.nth(1).locator("summary").click();
 await page.getByLabel("Startup commissioning and documented performance checks included?").nth(0).selectOption("yes");
 await page.getByLabel("Startup commissioning and documented performance checks included?").nth(1).selectOption("no");
 await expect(page.getByRole("region",{name:"Material Oregon bid scope differences"})).toContainText("Startup commissioning included");
 await expect(page.getByText(/Difference between comparable as-quoted totals/i)).toHaveCount(0);
});

test("Massachusetts optional proposal text applies only reviewer-selected values",async({page})=>{
 await page.goto("/massachusetts/heat-pumps");
 const importer=page.locator(".ma-bid").first().locator(".proposal-import");
 await importer.locator("summary").click();
 await importer.locator("textarea").fill("Total installed price: $18,500\nReuse existing ducts\nPermit not included");
 await expect(page.locator("#ma-a-price")).toHaveValue("");
 await importer.getByRole("checkbox",{name:/Installed total/}).check();
 await importer.getByRole("button",{name:/Apply 1 confirmed field/}).click();
 await expect(page.locator("#ma-a-price")).toHaveValue("18500");
 await expect(page.locator("#ma-a-scope")).toHaveValue("unknown");
});

function tinyOnePagePdf(){
 const content="BT /F1 12 Tf 50 710 Td (Total installed price: $18,500) Tj ET";
 const objects=[
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  "<< /Length "+Buffer.byteLength(content)+" >>\nstream\n"+content+"\nendstream"
 ];
 let pdf="%PDF-1.4\n";
 const offsets=[0];
 for(const [i,body] of objects.entries()){
  offsets.push(Buffer.byteLength(pdf));
  pdf+=(i+1)+" 0 obj\n"+body+"\nendobj\n";
 }
 const xref=Buffer.byteLength(pdf);
 pdf+="xref\n0 "+(objects.length+1)+"\n0000000000 65535 f \n";
 for(const offset of offsets.slice(1))pdf+=String(offset).padStart(10,"0")+" 00000 n \n";
 pdf+="trailer\n<< /Size "+(objects.length+1)+" /Root 1 0 R >>\nstartxref\n"+xref+"\n%%EOF";
 return Buffer.from(pdf);
}
test("Massachusetts PDF import extracts text locally but requires manual review before quote updates",async({page})=>{
 await page.goto("/massachusetts/heat-pumps");
 const importer=page.locator(".ma-bid").first().locator(".proposal-import");
 await importer.locator("summary").click();
 await importer.locator('input[type="file"]').setInputFiles({
  name:"sample.pdf",mimeType:"application/pdf",buffer:tinyOnePagePdf()
 });
 await expect(importer.getByText(/Read 1 PDF page/)).toBeVisible();
 await expect(page.locator("#ma-a-price")).toHaveValue("");
 await importer.getByRole("checkbox",{name:/Installed total/}).check();
 await importer.getByRole("button",{name:/Apply 1 confirmed field/}).click();
 await expect(page.locator("#ma-a-price")).toHaveValue("18500");
});
test("PDF magic validation rejects disguised text files without modifying quote",async({page})=>{
 await page.goto("/massachusetts/heat-pumps");
 const importer=page.locator(".ma-bid").first().locator(".proposal-import");
 await importer.locator("summary").click();
 await importer.locator('input[type="file"]').setInputFiles({
  name:"invalid.pdf",mimeType:"application/pdf",buffer:Buffer.from("not an actual PDF")
 });
 await expect(importer.getByText(/valid PDF header/)).toBeVisible();
 await expect(page.locator("#ma-a-price")).toHaveValue("");
});

test("Oregon HPWH compares matched bids without awarding incentive or unverified permits",async({page})=>{
 await page.goto("/oregon/heat-pump-water-heaters");
 await expect(page.getByRole("heading",{name:/Compare the installation, not just/i})).toBeVisible();
 const result=page.getByRole("region",{name:"Heat pump water heater project results"});
 await expect(result).toContainText("Determine the responsible permitting authority");
 await page.locator("#hw-place").selectOption("portland-verified");
 await page.locator("#hw-house").selectOption("one-two-family");
 await page.locator("#hw-replacement").selectOption("yes");
 await expect(result).toContainText("Required for this reported scenario");
 await page.locator("#hw-dwelling").selectOption("existing-owner");
 await page.locator("#hw-utility").selectOption("pge");
 await page.locator("#hw-install").selectOption("contractor");
 await expect(result).toContainText("$1,200");
 await page.locator("#hw-a-total").fill("4200");
 await page.locator("#hw-b-total").fill("3600");
 for(const id of ["a","b"]){
  await page.locator("#hw-"+id+"-basis").selectOption("before-incentives");
  await page.locator("#hw-"+id+"-scope").selectOption("same-location");
  await page.locator("#hw-"+id+"-tank").fill("65");
  const details=page.locator(".hpwh-quote").filter({has:page.getByRole("heading",{name:"Quote "+id.toUpperCase()})});
  await details.locator("summary").click();
  for(const key of ["plumbingIncluded","electricalIncluded","condensateIncluded"]){
   await page.locator("#hw-"+id+"-"+key).selectOption("yes");
  }
 }
 await expect(result).toContainText("Lowest listed total: quote B");
 await expect(result).toContainText("$600");
 await page.locator("#hw-b-basis").selectOption("after-incentives");
 await expect(result).toContainText("Quotes differ in scope");
});
