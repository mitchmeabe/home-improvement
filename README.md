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
