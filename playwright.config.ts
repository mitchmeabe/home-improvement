import {defineConfig,devices} from "@playwright/test";
const port=3101;
export default defineConfig({
 testDir:"./tests-e2e",
 fullyParallel:true,
 forbidOnly:!!process.env.CI,
 retries:process.env.CI?1:0,
 reporter:"list",
 use:{baseURL:"http://127.0.0.1:"+port,trace:"retain-on-failure",screenshot:"only-on-failure"},
 projects:[
  {name:"desktop-chromium",use:{...devices["Desktop Chrome"]}},
  {name:"mobile-chromium",use:{...devices["Pixel 7"]}},
 ],
 webServer:{command:"npm run start -- -p "+port+" -H 127.0.0.1",
  url:"http://127.0.0.1:"+port,
  reuseExistingServer:!process.env.CI,timeout:120000},
});
