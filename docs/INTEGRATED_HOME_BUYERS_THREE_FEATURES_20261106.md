# Home Improvement — Three Protected Buyer Features Consolidation Handoff

**Review date:** November 6, 2026  
**Status:** Private integration candidate only. No merge to `main`, public search indexing, affiliate tracking, contractor matching, bid transmission, payment, or production release.

## Goal
Complete roadmap item #2: independently consolidate the existing Home Improvement feature PRs **#27–#29** into one private, reviewable Next.js app while preserving their original PRs and the initial protected project integration, PR #26.

## Exact Git history and integration

Base protected PR #26: `integration/protected-home-ev-acquisition-20261106` at `23c5e95c15c1d487ccca916a0b94a70655b4eca8`. The new branch is `integration/combined-home-improvement-buyers-protected-20261106`.

All three feature PR HEADs remain intact and are added with **two-parent Git merge commits**, rather than copying a subset of files without their history.

| Original protected draft | Original immutable feature HEAD | Integration merge commit | Product |
|---|---|---|---|
| #27 | `12244e3d58904c039261be68c4fd7caf325ec8a7` | `d6d7ea4c3f848a2d7760ab77c40084a314444837` | San José EV charger installer quote, capacity/load management and permit scope comparison |
| #28 | `074c71411368aa32e5666db7bca008397bfe43b9` | `58b5cf8af8c596c9d72ca7c319d30841ba7b6e60` | Oregon heat-pump space-heating bid design/quality evidence, comparable equipment and contractor follow-ups |
| #29 | `85724da75ae4033a14d49598fcb35379085d206e` | `0443b99a38f5de272e533e41010ba5a5b4d1eeec` | Oregon heat-pump water heater model FHR, installation room, electrical and condensate buying checks |

The original source PRs (#27–#29), base PR #26, and `main` remain unchanged.

### Real conflict inspection and resolution
Compared the exact three original feature commits against immutable PR #26 base. **Only `docs/SOURCE_REGISTRY.json` overlaps** (#28 and #29). Individual product screens, engines, unit tests and routes are disjoint.

At the two relevant Git merges, the source ledger was reconstructed as an append-only semantic union:
- 11 original official-source records, untouched and in original order.
- 2 U.S. DOE / professional HVAC design and commissioning records from PR #28.
- 4 ENERGY STAR / DOE water heater airflow, installation and home-buying records from PR #29.
- **17 total, 17 distinct source IDs**. The original registry version, review metadata, policy and each original entry remain unchanged. No last-writer-wins source loss.

The combined diff against PR #26 immediately after merges: **26 changed files**, 20 additions and 6 modifications.

## User-visible private review

- New `/pilot-review` page links all three concrete decision journeys, two detailed technical buyer guides and the original draft PRs, with explicit warnings about professional review and unverified funding. It is not a launch page.
- Added `/pilot-review` to the existing private site navigation for easy owner review.
- Surfaced the San José EV charger quote tool on the homepage beside the existing Massachusetts and Oregon projects. PR #28 already added the space-heat-pump design guide homepage entry; PR #29's water heater entry was extended to disclose the new First Hour Rating and site-fit decision.
- Updated `src/lib/project-directory.ts` descriptions for the three feature areas, retaining **four** distinct supported geographic / product journeys (Oregon space-heating heat pump, Oregon HPWH, Massachusetts air-source heat pump, San José EV charger). No extra jurisdictions or equipment categories were invented.

## Independent integration regression

New tests:
- `tests/consolidated-homeowner-buyers.test.mjs` imports all three pure decision engines together; verifies source union and original official records, fail-closed unknown-case outputs, review destinations, project filter isolation and noindex/analytics protections.
- `tests-e2e/consolidated-homeowner-buyers.spec.ts` provides an actual Chromium acceptance contract for the three-card review hub, source guide link counts, project filter San José/HPWH separation, homepage buyer discoverability, four end-user route pages, and global noindex.

Original tests from all three branches remain present. Protected Vercel build runs:
`npm test && npm run typecheck && npm run sources:check && npm run markets:check && npm run evidence:check && npm run test:e2e:list && next build`.

**Critical distinction:** Playwright test listing is discovery, not full execution. Home Improvement has a GitHub Actions browser pipeline that has run successfully on prior PRs; verify final exact SHA's GitHub Actions execution and test totals before claiming green browser acceptance.

## Protections verified

On November 6, 2026, the Vercel project `home-improvement-pilot` was inspected through the authenticated project metadata: `ssoProtection.enabled=true`, `deploymentType="all"`. The root `src/app/layout.tsx` still sets `robots: {index:false,follow:false}`; `src/app/robots.ts` still returns `Disallow: /`.

Existing product-specific policy remains:
- San José EV permits are limited to actual City jurisdiction, not a ZIP-code assumption; electrical load and load-management plans require a qualified electrician.
- Oregon space heat-pump bid design evidence is not independent Manual J / Manual S sizing or approval; HP3 funding and incentive eligibility not inferred or double deducted.
- Oregon HPWH First Hour Rating and manufacturer room-air requirements must be verified from the specific model's installation manual; no model, electricity circuit, condensate route, permit, safe hot-water capacity or rebate amount is automatically approved.
- No exact property addresses, uploaded personal documents or bank details are needed; no household/project/bid answers sent in analytics. Copy/download happen on local user action.
- Any dated rule snapshot still expires through its unchanged existing engine's checks; merging does not refresh commercial data or verify seller programs.

## Next roadmap task

Roadmap item #3: **Independent cross-site end-to-end QA and CI reliability**. Includes real browser acceptance for Professional Licenses and Home Improvement, addressing GitHub Actions' pre-job failure in Professional Licenses, validating user journeys and protections, and documenting any remaining blockers. Do not turn either site's private pilot public, merge into `main` or activate referrals without explicit owner instruction.
