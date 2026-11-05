# Home Improvement proposal-browser acceptance — November 4, 2026

**Review branch:** `qa/quote-browser-acceptance-20261104` stacked on the unmerged parser/QA draft PR #20.
**Protection:** SSO on, noindex on, no user uploads, no external outreach and no release.

## Purpose

The newly repaired pure proposal-text parser now fails closed on conflicting installed totals, rebate amounts and before/after basis statements. This extension adds browser-level acceptance specs to establish that the actual Massachusetts quote form and manual import controls preserve those limitations during user interaction.

`tests-e2e/quote-import-adversarial.spec.ts` adds four scenarios:
1. A second total line with optional electrical cost suppresses the otherwise clean $18,500 extraction; no checkbox or enabled Apply action.
2. Conflicting $20,000 before-rebate versus $18,000 after-rebate lines suppress both price and automatic basis.
3. A local fake `.txt` proposal displays candidates but **does not change the quote until the user checks one field and applies it**. A unique privacy marker is asserted absent from outbound POST request bodies.
4. Replacing the pasted text invalidates previously checked candidates and cannot apply a stale amount.

Existing Playwright tests already cover local text-layer PDF parsing, disguised PDF rejection, contractor scope mismatches, Portland GIS mocked responses, navigation, and 390px/mobile views.

## QA method and limits

- Vercel prebuild now requires `npm test`, `npm run typecheck`, source/market/evidence checks and `npm run test:e2e:list`. That last command verifies browser-test discovery and import syntax **without running a browser**.
- The site has 3 Playwright spec files (original 2 + new adversarial import) across desktop and Pixel 7 device profiles. Each case is enumerated in both projects.
- **Updated November 5, 2026 — complete browser acceptance PASSED:** In an isolated, source-pinned Vercel sandbox, the corrected test-branch commit `5811040dbea5bb01daa1175a081fdae4dc287a90` passed the production Next.js build and the entire browser suite: **69 tests passed, one intentionally skipped mobile-only case in the desktop profile, zero failures, exit code 0, approximately 92 seconds**. Test coverage included Massachusetts contractor quote entry and text-based PDF import, conflicting rebate and quote totals, explicit manual confirmation, privacy non-transmission, mocked Portland GIS resolution and boundary checks, keyboard access, narrow layouts and mobile. `test-results/.last-run.json` reported `status: passed`, `failedTests: []`. 
- The earlier sandbox failure was a **runner configuration problem, now diagnosed**: the Chromium package required explicit `FONTCONFIG_PATH=/tmp/fonts`, `FONTCONFIG_FILE=/tmp/fonts/fonts.conf`, and `LD_LIBRARY_PATH=/tmp/sparticuz-libs/lib` after unpacking its bundled fonts/NSS libraries. Its serverless `--single-process`/`--no-zygote` flags had to be excluded for repeated Playwright contexts. The successful private run used Playwright **1.56.0** and Chromium **141**, desktop and Pixel 7 profiles. The runner package and config were installed only inside the ephemeral sandbox, not committed or deployed.
- No application browser binaries, custom sandbox configs, package-lock changes or secrets were committed as part of the fallback.

To complete an actual acceptance run with a proper Playwright-managed Chromium runtime:
```sh
npm install
npm run build
npx playwright install chromium
npm run test:e2e
```
The Playwright configuration starts the built local application on port 3101. Run both desktop and mobile projects. No Vercel production publication, bypass secret, GitHub Actions or user documents are needed.

**Additional release blockers:** professional review of real redacted contractor bids, equipment/rebate source validation, accessibility and performance acceptance, privacy/security review, user demand and approved commercial partner evidence. Passing `test:e2e:list` is an acceptance prerequisite, not a substitute for an actual browser run.
