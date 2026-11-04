# Oregon project requirements dossier — implementation and authority review

**Private-pilot milestone:** November 4, 2026. **Route:** `/projects/oregon-requirements`. **Parent:** consolidated Home Improvement PR #15. New branch targets #15, not `main`.

## Product capability
A homeowner can now specify **project scope + reported property jurisdiction + building type + occupancy + electric utility + installation route + circuits/panel work + optional installation date** and obtain an integrated, source-linked report of conditional permit findings, historical incentive routes, required documents, unresolved facts, ordered next actions and precise contractor questions.

Covers **three non-interchangeable work categories**: Oregon space-heating heat pumps and mini-splits, heat-pump WATER heaters, and residential electrical panel/service changes. The water-heater path must never inherit HP3 space-heat-pump incentives; standalone panel work must never inherit any assumed heat-pump rebate. User inputs are browser-local and not automatically sent to PortlandMaps, a utility, an agency or a provider.

The dossier **composes existing production logic** (`resolveOregonProject`, `evaluateHeatPump`, `evaluate` from Oregon water heaters) instead of creating competing funding/rule engines. A small additive layer handles standalone panel permits, panel-included change orders, official-source documents and cross-project exclusions. The detailed quote comparison tools remain intact and linked.

## Verifiable government-source facts

| Fact | Official source | Evidence handling |
|---|---|---|
| Portland heat pumps and mini-splits require residential mechanical permits for covered one/two-family, townhouses and ADUs | https://www.portland.gov/ppd/residential-permitting/residential-mechanical-permits | Conditional published city rule; property city jurisdiction and dwelling classification must first be identified |
| Portland says most mechanical projects also need electrical permits; new or changed hard-wired circuits require them | https://www.portland.gov/ppd/residential-permitting/residential-electrical-permits | Only explicitly claimed circuit changes produce the required finding; unknown scopes stay unresolved |
| Portland requires permits for residential service panel replacement; replacement service/meter/feeder and added circuits have additional inspections/scope requirements | https://www.portland.gov/ppd/residential-permitting/residential-electrical-permits/lights-outlets-switches-reconnection | Explicit panel/service work creates a conditional panel permit finding, not approval or a fee quote |
| Portland residential plumbing permits include water-heater replacement, including supported townhouse/ADU classifications | https://www.portland.gov/ppd/residential-permitting/residential-plumbing-permits | Only after user-reported Portland jurisdiction + supported residence + replacement |
| A Portland mailing address does not by itself establish the property's actual city permit jurisdiction | https://www.portlandmaps.com/ and https://www.portland.gov/ppd/property-addressing | The app does not geocode or query property records; reported parcel jurisdiction is *unverified by the app* |
| ODOE HP3 is for Oregon residential **space-heat pumps**, must use approved contractors, is passed through as an upfront reduction, and carries numeric HSPF2/SEER2 equipment minimums | https://www.oregon.gov/energy/incentives/Pages/HP3.aspx | Reuses existing 2026 engine; numbers are numeric screening only, not model certification, current funding, or a guaranteed incentive |
| ODOE existing owner-occupied HP3 category was fully reserved in its **2026-10-01** dated table, while rental/new construction categories showed funds | https://www.oregon.gov/energy/incentives/Pages/HP3.aspx | Display explicitly as a historical funding limitation, NEVER a live availability answer. Current program policy/reservations must be rechecked |
| Energy Trust's May 2026 published midstream HPWH offer contains different purchasing/install routes | https://insider.energytrust.org/home-retrofit-incentive-updates/ | Historical seller/program publication; no inferred active discounts, awards or utility account verification |
| Owner-occupant DIY electrical rules are restricted and exclude specified types of property, including ADUs | https://www.portland.gov/ppd/residential-permitting/residential-electrical-permits | Conservative manual license-status review when installation is DIY with rental/ADU or unsupported ownership |

## Decisions produced (examples)
- **Portland mailing address unverified:** never emits a Portland-*required* permit, even when a user says a panel is changing. It asks for official parcel jurisdiction first.
- **User-reported Portland, one-family, space heat pump:** mechanical permit is required under the published conditional city rule. New circuit/panel scopes add electrical findings. Outdoor-unit placement and utility program are separately flagged.
- **Space heat pump + owner-occupied + HP3:** October 1 funding status explicitly marked *historical*, never represented as live availability. DIY route does not produce an HP3 incentive path: requires ODOE-approved contractor.
- **Water-heater replacement:** plumbing and applicable electrical work are reconciled, plus a distinct Energy Trust historical offer inquiry. No HP3 in this project path.
- **Panel-only upgrade:** published Portland electrical permit/service inspection rules and load calculation/utility coordination/price documentation. No heat-pump incentive amounts.
- **Outside-Portland or unsupported multifamily/commercial:** does not assert Portland-specific permit requirements. Other local agency rules are **not** inferred.
- **Unknown equipment/circuit or utility:** unresolved facts are explicit blockers, not assumed favorable selections.

## Exportable decision document
The report is a deterministic, client-side text file with each finding's **conditional status, official source URL, recorded review/snapshot date, basis** and separate owner/contractor document requests. A buyer can hand it to contractors to clarify scope, get itemized quotes, request permits and inspections, and retain completion evidence.

The dossier does not request a street address, bill, income, identification number, credentials, utility account, photo, PDF or transcript. No server upload, integration, persistent storage, public indexing, referral relationship or financial checkout.

## Tests and boundaries
- Added **25** focused Node regression tests in the repository's existing test runner; tests protect jurisdiction mismatches, use-class boundaries, all three project types, utility uncertainty, no out-of-state Oregon rebates, the dated HP3 funding limitation, no DIY HP3, panel permits, site document provenance and invalid inputs. No new validation scripts/CI infrastructure.
- Existing global `robots.index=false`, noindex and protected Vercel preview remain unchanged.
- Actual parcel lookups, utility account proof, live permit records, agency current funding and contractor license validation are **not** implemented. Avoid wording such as “the property is verified” or “the rebate is approved.”
- This is a reusable **project dossier layer**, not automatic permit or incentive adjudication. Its market depth is explicitly limited to the existing Oregon/Portland published rules; Oregon cities and counties beyond Portland require an authority lookup first.

## Recommended next evidence milestone
If user research validates the need, add source-authenticated property/parcel jurisdiction for a limited geographic market without retaining addresses, plus contractor quote fields that reconcile requested permit/document evidence directly against specific bid inclusions. Do not expand widely into undocumented city rules.

## Consolidation review notes
The resolver de-duplicates general electrical permit findings from the original space/HPWH tools when panel or additional circuits are explicitly included. It preserves a single appropriate city permit finding instead of repeating permit tasks. Installation dates **before or after** the 2026-11-04 source review trigger a historical/future applicability warning; no historical date inherits retroactively asserted eligibility. Panel-only work outside Oregon cannot inherit an Oregon utility rebate. All of these boundaries have explicit Node regression cases.
