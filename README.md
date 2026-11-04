# Home Improvement — first vertical slice

A narrow source-backed planning tool for residential heat-pump projects. The first implemented workflow covers Portland mechanical/electrical permit guidance and Oregon's Heat Pump Purchase Program (HP3) as a **reviewed snapshot**, not live funding or an eligibility award.

## Run locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000. Check with `npm test`, `npm run typecheck`, `npm run build`.

## What works

- Residential heat-pump / mini-split project questionnaire.
- Portland mechanical permit and electrical permit guidance.
- HP3 funding-status flag for existing owner-occupied homes, which the Oregon Department of Energy currently lists as fully reserved for new applications.
- General HP3 efficiency-threshold check with explicit exclusions and no eligibility guarantees.
- Official government sources and deterministic test fixtures.

**Not built:** an address-based jurisdiction resolver, contractor matching, permit filing, actual state program applications, live funding checks, incentive stacking, municipal coverage outside Portland, or accurate cost projections.

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
