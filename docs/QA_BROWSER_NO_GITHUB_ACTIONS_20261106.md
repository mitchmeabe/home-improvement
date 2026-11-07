# Home Improvement — Independent Full-Browser QA (No GitHub Actions)

**Review:** November 6, 2026. Protected consolidated draft PR #30 baseline at exact SHA `fa9e17d522e1b2fc6416b31f3f4ab442eef116d4`. This corrective branch is separate and deliberately unmerged.

## Alternative independent execution

- A temporary private Vercel Sandbox replicated application/source/test files from the immutable Git blob tree for the Home Improvement QA branch.
- Installed the locked npm dependencies, Playwright Chromium and the required browser libraries; compiled Next.js production code; served it locally at `127.0.0.1:3101`.
- **No GitHub Actions jobs or billing controls were used.** No deployment-protection changes, live customer data, external quote submissions or partner connections.
- Ran the original 116-case Playwright matrix on desktop Chromium and Pixel 7 mobile with two workers, zero retries. The 8-case cross-market smoke suite was also run separately.
- Verified the protected Vercel preview itself responds HTTP 200 and remains `noindex,nofollow`; both consolidated projects retain `robots.txt: Disallow: /` and Vercel SSO protection for all environments.

## Exact results

| Gate | Result |
|---|---|
| Node pure unit suite | **268 passed, 0 failed** |
| Next.js production build | **Passed** |
| Cross-market Chromium smoke | **8 passed, 0 failed** |
| Complete browser matrix | **115 passed, 1 skipped, 0 failed** |
| Chromium device types | Desktop and Pixel 7 mobile |
| Vercel preview prebuild | Unit, TypeScript, source, market and evidence checks passed; production build ready |
| Search indexing | Blocked by global metadata and robots |
| GitHub Actions | **Not used** |

A first browser attempt failed uniformly because `--with-deps` installed Chromium under the sandbox administrator's cache, inaccessible to the normal test user. Chromium was installed as the normal user; the subsequent real smoke and full test runs passed. Those environment-only failures did not indicate application defects.

## Genuine purchasing defect fixed

The San José charger-electrician quote engine used `Math.round(price * 100) === price * 100` to validate cents. Ordinary two-decimal numbers such as **$79.99** can be represented imperfectly by IEEE-754 arithmetic and thus be rejected as invalid, blocking the buyer's otherwise valid comparable-quote decision.

- Replaced exact floating-point cent equality with a tight cent-integer tolerance.
- Preserved strict positivity, maximum installed price `$1,000,000`, finite-number checks and rejection of fractional pennies.
- Added a pure regression for **$0.01, $19.29, $79.99, $199.95, $1,450.29 and $999,999.99**. All are accepted as comparable when equivalent quotes match. `$79.999` remains rejected.
- No change to engineering assumptions, charger/panel scope, incentive status, city permits, contractor endorsement, lead collection, payment, or price ranking policy.

## Unchanged release guardrails

The San José EV charger, Oregon space-heating heat pump design, Oregon HPWH manufacturer/room fit and existing Massachusetts route all remain source-backed and private. No jurisdiction was added. User inputs still stay in browser memory; analytics contain no quote amount, customer location, equipment model or personal details. Source freshness and no-rebate-guarantee gates remain intact.

**Disposition:** QA corrective PR is ready as a **draft** against the protected consolidated Home Improvement PR #30 branch. Do not merge into PR #30, the original protected integration PR #26 or `main` and do not index, promote, contact installers or monetize without separate owner approval.
