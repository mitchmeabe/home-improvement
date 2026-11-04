# Home Improvement consolidated integration review — PRs #15, #16 and #17

**Reviewed:** November 4, 2026. **Integration target:** `main`, in a NEW draft PR. **Do not merge automatically.** App remains a Vercel-protected, noindex research pilot.

## Exact integration and ownership

- The upstream ancestry is clean: `main` → PR #15 (`integration/massachusetts-hpqpl-real-workbook-20261104`) → PR #16 (`feat/oregon-property-project-requirements-dossier-20261104`) → PR #17 (`feat/portland-official-jurisdiction-lookup-20261104`).
- Original #15 already consolidated older #13–14, so those must not be merged independently.
- Baseline `main` as inspected on Nov. 4: `1b143e61532e25ad64e2646a601863c305706df1`.
- Original #17 immutable tip `ff7369a970d51b378cafc209bb07f5443ebd2fb7` was **48 commits ahead, 0 behind**, and changed 31 files relative to this baseline. No merge conflicts.
- This review adds permanent end-to-end acceptance tests and this review file on the consolidated integration branch; no new infrastructure, React rule engine, authentication or unrelated product features.
- After opening this one consolidated PR, close #15–17 **without merging** and retain all original branches and discussions. Do not modify `main` until the user explicitly authorizes a merge.

## Product architecture validated

1. **Massachusetts:** Mass Save staged 2026 and announced 2027 incentives, scope-aware quote comparison, optional locally parsed proposal/PDF text and genuine Mass Save HPQPL list matching; does not promote a published list entry or proposed rebate into a government award.
2. **Oregon:** space heat-pump, heat-pump water-heater and electrical-panel project types share a property/project dossier composed from existing specialized engines, rather than unrelated competing rebate rules. The dossier has conditional permit findings, historical program information, evidence/document requests, questions and a browser-local export.
3. **Official Portland jurisdiction:** explicit user-initiated direct-to-City ArcGIS address-point lookup. Exact active records can distinguish Portland from Gresham/other Oregon; uncertain records remain unresolved. GIS address data is not sent to the app's server or written into the report. City may log the direct lookup; this is disclosed in the privacy page. Property/dwelling classification and real permit authority still require human confirmation.

### Source and date boundaries

- Portland published mechanical/electrical/plumbing permits apply only for supported building classes and applicable city jurisdiction.
- Oregon HP3 **October 1, 2026** funding is dated: owner-occupied new allocations were fully reserved at that snapshot; the app never claims live allocations or an awarded grant.
- Mass Save HPQPL workbook downloaded directly from Mass Save on **November 4, 2026**, **32,691,017 bytes**, SHA-256 `fc18759d904e4195c2ecd41fe2fd48b25aafc6f527b6d8f51cbc964a86ada23c`, internal data update **September 27, 2026**. Its standard ASHP tab normalizes **204,558** system rows, with 1,307 parsed no-longer-eligible dates. A row match still cannot authenticate source provenance or award a rebate.
- The Portland GIS implementation has previously been checked against genuine public civic addresses, Portland and Gresham, but the permanent browser test uses deterministic mocked GIS HTTP responses. Do not call that live integration browser acceptance.

## Actual Nov. 4 verification, independently repeated

| Gate | Evidence / outcome |
|---|---|
| Complete Node unit/regression suite | **179/179 passed** in isolated local reconstruction of the exact combined #17 head; no failing tests |
| Source registry | `node scripts/source-audit.mjs` — 7 source review records, **0 flags** |
| Massachusetts market integrity | `node scripts/market-data-check.mjs` — 3 official program references, **0 errors** |
| Evidence audit | `node scripts/evidence-audit.mjs` — **0 structural errors** and **6 visible manual review-queue entries**; entries are *not* approved funding |
| Next.js production build | `npm run build` — **passed**, 7 static routes including `/projects/oregon-requirements` |
| Existing + new Playwright desktop/mobile tests | **61 passed, 1 intentionally skipped, 0 failed**; new `tests-e2e/consolidated-review.spec.ts` covers six complete journeys on each of desktop/mobile Chromium |
| Real workbook, real desktop Chromium | User-file upload of the **original 32.7 MB Mass Save XLSX** succeeded; **204,558** ASHP rows, internal 2026-09-27 data date, switch to **6** High Velocity rows, and Clear workbook worked; ~17.3 s overall (main import ~12.5 s) |
| Real workbook, mobile-emulated Chromium | Same original workbook, both supported tabs and Clear passed; ~16.8 s overall (main import ~12.2 s). **Desktop-class host with mobile emulation is not a low-RAM physical phone.** |
| New GitHub Actions / CI setup | **None added.** Existing repo workflows and source-approval checks are not modified. |

The real-workbook Playwright probe used a temporary local-only acceptance script and downloaded real binary **in an isolated test environment**; neither binary nor optional external-file-dependent test is committed. Its evidence is recorded here. Browser suite and build were performed against a locally reconstructed source checkout and do **not** bypass the SSO-protected Vercel preview.

## Integration review conclusions

- **No substantive cross-PR merge conflict or new source-code defect was reproduced** in the reviewed integration. The most consequential uncovered gap was that the permanent existing Playwright suite did not exercise the new Oregon project dossier or optional City GIS flow.
- Added six stable cross-feature browser tests, executed against **both** the desktop and mobile Chromium projects, covering: unknown vs self-reported city, exact active Portland record, exact Gresham non-Portland result, conflicting parcel IDs, invalidation after address edits or manual override, municipal address disclosure, address-free exported dossier, keyboard interaction and 390px overflow checks.
- Existing Massachusetts conditional rebate, quote comparability, PDF review and Oregon water-heater/space-heat-pump flows passed the same combined browser run.
- Real browser loading the authentic HPQPL workbook is now independently established **on a desktop-class runtime**. The app still materializes ~204k rows and may be memory-bound on older phones, so no universal low-memory performance claim is authorized.

## Release blockers / not proven by passing tests

- **Actual authenticated Vercel preview browser test is outstanding.** Browser tests used local built server and deterministic GIS intercepts; no SSO bypass or share link was created.
- **Low-end physical mobile memory and accessibility** still need manual acceptance; emulation is not an actual device. Real 32.7 MB spreadsheet is expensive.
- **External program decisions:** no government-issued or accepted permits, inspections, utility account verification, HP3 funding reservation, Mass Save rebate approval, AHRI live certified-equipment lookup or specific property parcel adjudication.
- **Business viability:** no authenticated contractor partners, checkout/lead attribution, user research or paid conversions validated. No public release.
- Evidence audit has **six outstanding human-review items** for programs/rates/eligibility. These do not fail structural tests but must not be described as independently verified awards.
- Official rule source statements are conditional, not live legal advice. Data and funding can change.
- `main` stays unchanged. The consolidated PR should remain **draft** pending explicit user approval and private pilot acceptance.

## Verification reproducibility

From a Git checkout of the final consolidated PR head:

```sh
npm install --no-audit --no-fund
npm test
npm run sources:check
npm run markets:check
npm run evidence:check
npm run typecheck
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

Tests that require optional external authentic XLSX must supply the original file locally, avoid storing user uploads and should not be made required CI fixtures.
