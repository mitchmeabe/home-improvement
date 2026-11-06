# Home Improvement — protected quote and project-requirements pilot

The original Portland/Oregon heat-pump guidance remains alongside Oregon project requirements, an opt-in Portland address-point GIS lookup, and Massachusetts quote, PDF-text and equipment-list comparison. Government rules and rebate figures are dated snapshots, not live funding or permit determinations.

## Run locally

```bash
npm ci
npm run dev
```

Visit http://localhost:3000. Check with `npm test`, `npm run typecheck`, `npm run build`.

## What works

- Residential heat-pump / mini-split project questionnaire.
- Portland mechanical permit and electrical permit guidance.
- HP3 funding-status flag for existing owner-occupied homes, which the Oregon Department of Energy currently lists as fully reserved for new applications.
- General HP3 efficiency-threshold check with explicit exclusions and no eligibility guarantees.
- Official government sources and deterministic test fixtures.

**Not built:** a full parcel/permit determination service, contractor matching, permit filing, state-program applications, live funding checks, comprehensive municipal coverage, or independently modeled cost projections. The existing Portland ArcGIS address-point lookup provides only a conditional jurisdiction signal.

## Primary sources

- [Portland: residential mechanical permits](https://www.portland.gov/ppd/residential-permitting/residential-mechanical-permits)
- [Portland: residential permit guidance](https://www.portland.gov/ppd/residential-permitting/do-you-need-permit/residential-permits)
- [Oregon Department of Energy: Heat Pump Purchase Program](https://www.oregon.gov/energy/incentives/Pages/HP3.aspx)

Manually reviewed 2026-11-03. See [data standards](docs/DATA_STANDARDS.md).

## Expanded heat-pump quote evaluator

The homepage now includes a two-to-three installer quote comparison beside the existing Portland permits and Oregon HP3 planning calculator. Enter quote price basis, scope completeness and conditional discounts. No storage or contractor identity needed. The app refuses to assume rebates or energy savings without explicit user data and context. See [quote comparison rule audit](docs/QUOTE_COMPARISON_RULE_AUDIT.md).

The source ledger is in [docs/SOURCE_REGISTRY.json](docs/SOURCE_REGISTRY.json). Use `npm run sources:check` for review dates and source list validity or `npm run sources:probe` for a best-effort optional network check. Neither rewrites executable rules.


## Massachusetts heat-pump quote comparison (2026-11-03)

Protected pilot: `/massachusetts/heat-pumps`. Supports Mass Save 2026 air-source published rates and *announced* 2027 whole/partial reductions (NOT a 2027 approved incentive), with utility/fuel/weatherization/installer/equipment conditions and side-by-side proposal comparison. Conditional post-rebate arithmetic is not shown as an award or automatic saving. Route has no municipal-specific permit claims, price forecasts, personal-information collection or live rebate-approval claims.

See `docs/markets/massachusetts-heat-pumps.md` and tests `tests/mass-save.test.mjs`. Leave protected and noindex until specialist review. Oregon's separate planner remains unchanged.

## Massachusetts quote evidence and validation (2026-11-03)

The new Massachusetts quote tool now prevents price ranking when one bid reuses ducts and another includes new ductwork or ductless scope. Public homeowner-report fixtures and limitations are documented in `docs/markets/massachusetts-heat-pumps.md` and `tests/fixtures/ma-public-quote-scenarios.json`. The official Mass Save expert consultation remains linked, because similar free quote-review services already exist. **No actual signed proposals or customer interviews have been received.**

## Quote-scope audit — November 2026

The Oregon and Massachusetts heat-pump bid planners now check commissioning, duct/airflow testing and existing-system removal/disposal; Oregon additionally compares permits, electrical work and final inspection explicitly. The new pure scope-evidence comparison refuses to rank quotes when one explicitly includes costly work that another explicitly excludes. Unknown work stays unresolved. Differences appear in a side-by-side matrix, warning block and locally downloadable report. See docs/markets/massachusetts-heat-pumps.md for sources and limits.

## Draft-only San José home EV charger planning and acquisition experiment (2026-11-06)

Integrated private route `/california/san-jose-ev-charger` distinguishes existing Level 1 charging, new 120 V receptacles, Level 2 charging, assigned versus shared multifamily parking, manufacturer ventilation and separately proposed panel work. It uses dated City rules and makes **no electrical load calculation, permit approval, rebate award, contractor recommendation, or affiliate revenue claim**. A coarse optional quote-shopping-interest button never collects project data or contacts a contractor.

Source: draft EV PR #25 integrated with quote-parser QA PR #24 in this **unmerged draft integration**. See `docs/INTEGRATED_EV_QUOTE_REVIEW_20261106.md` and `docs/experiments/san-jose-ev-charger-acquisition-20261106.md`. **Protected SSO and global noindex remain active**; only future separately authorized public-release work may make any page indexable.
