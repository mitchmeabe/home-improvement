# Home Improvement independent quote-import quality review

**Review:** 2026-11-04  
**Baseline:** `main` commit `c131148c37c73d3d9ef15f00c370481dc7239f6e`  
**Scope:** local proposal-text/PDF extraction validation and protected-build QA. No program eligibility rule or incentive calculation changed.

## Reproducible parser defect

The existing text importer treated lines carrying a label like `Total installed price` independently. It discarded unusable labels (a total with two dollar amounts, `optional` or `example only`), then accepted a different clean line with that label, even though the *same proposal* presented an inconsistent or conditional total.

An adversarial example:
```
Total installed price: $18,500
Total project cost: $18,500 plus optional electrical work $2,500
```
Previously this could propose **$18,500** for the buyer to confirm. That would risk presenting a scope-conditional number as one unambiguous contract total.

The fix requires **every total-labeled line** to yield a consistent, safely extractable amount before any candidate can be proposed. The exact same rule applies to `Proposed rebate` and similar rebate lines. Also, statements that mix **before** and **after rebate/incentive** in one line or across contradictory total labels do not yield a price-basis candidate.

These are *candidate extraction* improvements only. They do not infer final cost, program eligibility, acceptance, verified financing, or contractor qualification.

## Realistic adversarial coverage added

Six new deterministic cases require:

1. Ambiguous optional-price second line blocks otherwise clean installed total.
2. Disclaimer `example only` blocks an otherwise clean competing total.
3. A rebate line with multiple money amounts blocks a cleaner duplicate rebate line.
4. Multiple *identical, unambiguous* total/rebate labels still produce candidate values.
5. Conflicting before- and after-rebate totals block both overall price and basis.
6. A single price label that mentions both before and after benefits blocks basis inference.

Prior proposal import and PDF text-layer tests remain active. The importer still requires explicit user selection for every proposed field, never auto-applies extracted figures, and performs no document upload.

## Build integrity defect

The repository originally had a `build` script but **no `prebuild` gate**: a Vercel READY deployment might only mean Next.js compiled, without demonstrating green unit, type, market/source or evidence checks.

Added a portable npm lifecycle gate:
```
prebuild = npm test && npm run typecheck &&
           npm run sources:check && npm run markets:check &&
           npm run evidence:check
```
No GitHub Actions dependency, schedule, network crawler, new Vercel settings or production publication. `npm run build` on a normal Git-based Vercel preview now runs the entire suite before `next build`.

**Observed prebuild:** protected Vercel deployment from commit `9486e5ad8227629bd6ec7a35a738726239d9a61b` reported **185 Node tests passed, 0 failed**, TypeScript compile success, 7 government/source checks with 0 review flags, Massachusetts program integrity checks passed, and 6 evidence claims with 0 structural errors. The evidence register still has 6 **review queue** entries, which are not approvals or test failures.

## Unresolved before release

- The code has not been tested against **8–12 real, redacted, signed installer proposals**, and the equipment/permit interpretation needs domain-expert review.
- User experience (first-time navigation, screen-reader/keyboard, PDF import on iOS Safari, slow-device performance) needs browser/manual acceptance beyond unit tests.
- Massachusetts Mass Save has existing no-cost specialist bid comparisons; usefulness/differentiation is unproven without real users. Actual qualified demand and affiliate economics are untested.
- Current sources are dated snapshots; a green source-integrity check **does not** prove live rebate funding or permit outcome.
- No public release, sensitive document upload, quote storage, seller relationship, external outreach, GitHub Actions, or automatic incentive awards are authorized by this change.

This feature branch is intentionally review-only and is **not merged** into `main`.
