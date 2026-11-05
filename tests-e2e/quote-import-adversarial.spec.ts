import {test,expect} from "@playwright/test";

/**
 * End-user acceptance for the fail-closed proposal importer.
 * Pasted or selected proposal content must remain in the browser until
 * the user explicitly confirms supported fields. No real documents or PII.
 */
const ma="/massachusetts/heat-pumps";
const first=(page:import("@playwright/test").Page)=>page.locator(".ma-bid").first();
const openImport=async(page:import("@playwright/test").Page)=>{
 const importer=first(page).locator(".proposal-import");
 await importer.locator("summary").click();
 return importer;
};

test("ambiguous second line blocks the installed price instead of silently accepting the first",async({page})=>{
 await page.goto(ma);
 const importer=await openImport(page);
 await importer.locator("textarea").fill([
  "Total installed price: $18,500",
  "Total project cost: $18,500 plus optional electrical work $2,500",
  "Deposit: $2,000"
 ].join("\n"));
 await expect(importer).toContainText("Installed-price labels were found");
 await expect(importer.getByRole("checkbox",{name:/Installed total/})).toHaveCount(0);
 await expect(page.locator("#ma-a-price")).toHaveValue("");
 await expect(importer.getByRole("button",{name:/Apply 0 confirmed field/})).toBeDisabled();
});

test("opposing before- and after-rebate quotes never auto-fill either basis or price",async({page})=>{
 await page.goto(ma);
 const importer=await openImport(page);
 await importer.locator("textarea").fill([
  "Total price before rebate: $20,000",
  "Contract price after rebate: $18,000"
 ].join("\n"));
 await expect(importer).toContainText("Conflicting before/after-rebate price labels");
 await expect(importer.getByRole("checkbox",{name:/Installed total/})).toHaveCount(0);
 await expect(importer.getByRole("checkbox",{name:/Before\/after rebate status/})).toHaveCount(0);
 await expect(page.locator("#ma-a-price")).toHaveValue("");
 await expect(page.locator("#ma-a-basis")).toHaveValue("unsure");
});

test("clean local text proposal never applies a value until the visitor checks it",async({page})=>{
 const privateMarker="LocalDocumentOnly_TEST_MARKER_20261104";
 const outbound:string[]=[];
 page.on("request",request=>{
  if(request.method()!=="GET"&&request.postData()?.includes(privateMarker))outbound.push(request.url());
 });
 await page.goto(ma);
 const importer=await openImport(page);
 const txt=["Total installed price: $18,500","Reuse existing ducts",privateMarker].join("\n");
 await importer.locator('input[type="file"]').setInputFiles({
  name:"anonymized-contractor-example.txt",mimeType:"text/plain",buffer:Buffer.from(txt)
 });
 await expect(importer).toContainText("Plain text loaded in this browser only");
 await expect(page.locator("#ma-a-price")).toHaveValue("");
 await importer.getByRole("checkbox",{name:/Installed total/}).check();
 await expect(page.locator("#ma-a-price")).toHaveValue("");
 await importer.getByRole("button",{name:/Apply 1 confirmed field/}).click();
 await expect(page.locator("#ma-a-price")).toHaveValue("18500");
 expect(outbound).toEqual([]);
});

test("reviewing a second proposal invalidates prior candidate checks and blocks stale application",async({page})=>{
 await page.goto(ma);
 const importer=await openImport(page);
 await importer.locator("textarea").fill("Total installed price: $18,500");
 await importer.getByRole("checkbox",{name:/Installed total/}).check();
 await importer.locator("textarea").fill("Total installed price: $22,000");
 await expect(importer.getByRole("checkbox",{name:/Installed total/})).not.toBeChecked();
 await expect(importer.getByRole("button",{name:/Apply 0 confirmed field/})).toBeDisabled();
 await expect(page.locator("#ma-a-price")).toHaveValue("");
});

test("real public proposal pricing structure requires manual gross-versus-net confirmation",async({page})=>{
 await page.goto(ma);
 const importer=await openImport(page);
 await importer.locator("textarea").fill([
  "Total Cost: $9,204.50",
  "Rebates Available: $500.00",
  "Final Cost: $8,704.50"
 ].join("\n"));
 await expect(importer).toContainText("Final/net cost is listed separately");
 await expect(importer).toContainText("A rebate is described as available or conditional");
 await expect(importer.getByRole("checkbox",{name:/Installed total/})).toHaveCount(0);
 await expect(importer.getByRole("checkbox",{name:/rebate amount/i})).toHaveCount(0);
 await expect(page.locator("#ma-a-price")).toHaveValue("");
 await expect(importer.getByRole("button",{name:/Apply 0 confirmed field/})).toBeDisabled();
});

test("simple Total Cost is only a candidate until explicit human confirmation",async({page})=>{
 await page.goto(ma);
 const importer=await openImport(page);
 await importer.locator("textarea").fill("Total Cost: $9,204.50");
 await expect(importer.getByRole("checkbox",{name:/Installed total/})).toHaveCount(1);
 await expect(page.locator("#ma-a-price")).toHaveValue("");
 await importer.getByRole("checkbox",{name:/Installed total/}).check();
 await expect(page.locator("#ma-a-price")).toHaveValue("");
 await importer.getByRole("button",{name:/Apply 1 confirmed field/}).click();
 await expect(page.locator("#ma-a-price")).toHaveValue("9204.5");
});

test("Massachusetts contract total imports without mistaking installment payments for the price",async({page})=>{
 await page.goto(ma);
 const importer=await openImport(page);
 await importer.locator("textarea").fill([
  "Total Contract Price and Payment Schedule",
  "Total Contract Price: $18,900.00",
  "Deposit: $6,000.00",
  "Final payment: $6,900.00"
 ].join("\n"));
 await expect(importer.getByRole("checkbox",{name:/Installed total/})).toHaveCount(1);
 await expect(page.locator("#ma-a-price")).toHaveValue("");
 await importer.getByRole("checkbox",{name:/Installed total/}).check();
 await importer.getByRole("button",{name:/Apply 1 confirmed field/}).click();
 await expect(page.locator("#ma-a-price")).toHaveValue("18900");
});
test("blank Massachusetts contract total with payment schedule never imports a deposit as contract price",async({page})=>{
 await page.goto(ma);
 const importer=await openImport(page);
 await importer.locator("textarea").fill([
  "Total Contract Price and Payment Schedule",
  "$18,900.00",
  "Deposit: $6,000.00",
  "Final payment: $12,900.00"
 ].join("\n"));
 await expect(importer.getByRole("checkbox",{name:/Installed total/})).toHaveCount(0);
 await expect(importer.getByRole("button",{name:/Apply 0 confirmed field/})).toBeDisabled();
 await expect(page.locator("#ma-a-price")).toHaveValue("");
});
