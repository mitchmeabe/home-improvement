import {defineConfig,devices} from "@playwright/test";
export default defineConfig({testDir:"./tests-e2e",fullyParallel:true,forbidOnly:!!process.env.CI,
 retries:process.env.CI?1:0,reporter:"list",use:{baseURL:"http://127.0.0.1:3173",trace:"retain-on-failure"},
 projects:[{name:"desktop-chromium",use:{...devices["Desktop Chrome"]}},{name:"mobile-chromium",use:{...devices["Pixel 7"]}}],
 webServer:{command:"npm run dev",url:"http://127.0.0.1:3173",timeout:120000,reuseExistingServer:!process.env.CI}});
