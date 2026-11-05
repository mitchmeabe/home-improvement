# Home Improvement — cumulative quote-import QA review

**Prepared:** November 5, 2026. **Review-only, unmerged, private.**

## Integration boundary

This branch follows the exact tip of draft PR #23 and targets `main`
(`c131148c37c73d3d9ef15f00c370481dc7239f6e`).

Review history: `#20 → #21 → #22 → #23`.
GitHub comparison confirmed **26 commits ahead, zero behind**, the same main
merge base, and **8 files** in the combined diff. The older PRs remain open as
review history. This is a cumulative comparison, not a merge/squash of them.

## Real-world-inspired importer corrections

- All installed-price labeled lines must be individually unambiguous and
  mutually consistent. A misleading optional electrical line, disclaimed
  price, duplicate total or conflicting before/after basis must not quietly
  resolve to the cleanest amount.
- A historically public **2015** Maine heat-pump quote showed separate gross
  cost, a conditional rebate and lower final cost, sometimes as table headings
  disconnected from numeric PDF text. Minimal **privacy-scrubbed** structural
  tests now force manual gross/net confirmation and prevent double deduction.
  Neither original homeowner identifiers nor original PDF bytes were committed.
- Massachusetts official **blank sample contract** language names a
  `Total Contract Price and Payment Schedule` heading. Importing a single
  explicitly labeled contract total requires a human confirmation; deposits
  and payment installments are distinct. An unlabeled line below that exact
  heading does not become an installed quote total.
- Permits, warranties and deposits are topics **mentioned**, never evidence
  of signed acceptance, final price, incentive funding or regulatory compliance.
- Personal text stays locally in the browser and cannot be silently auto-applied.
  No OCR, uploads, server-side quote storage, contacts or new PII collection.
- Added adversarial parsing and Playwright tests to preserve these boundaries.

## Acceptance

The full PR #23 ancestor source ran **78 Playwright cases** in desktop/mobile
Chromium: **77 passed, 1 intentionally skipped on desktop, 0 failed**.
Its protected Vercel prebuild ran unit, type, source, market and evidence checks
plus browser-test discovery, followed by Next.js compilation. The consolidated
branch adds this review document only; test discovery is not falsely labeled a
complete browser run.

All previews remain behind Vercel SSO, `live:false`,
`noindex,nofollow`. No GitHub Actions, launch, production promotion, email,
partner enrollment, homeowner upload, affiliate links or merges are authorized.

## Acceptance still missing before release

At least several **recent, genuinely redacted Massachusetts contractor
proposals** in their original file formats, with expert-reviewed field-level
expected outputs; separate scanned-PDF/manual-entry accessibility review;
professional equipment, permits and rebate assessment; user experience and
privacy/security acceptance; validated actual consumer demand; and owner's
explicit launch decision.

The historical Maine example and the Massachusetts blank contract sample are
**not substitutes for actual recent signed proposal validation**. No funds,
rebate eligibility, quote legality or installation claims have been verified.

## November 5 dependency and documentation hardening
- Added a committed npm lockfile, pinning `@playwright/test` at 1.64.1 and overriding transitive `postcss` to the tested 8.5.32 version without a Next.js major-version migration.
- The lockfile is kept in npm's standard readable format for dependency-diff review; no formatting override is needed.
- Exact branch source passed 196/196 Node tests, TypeScript, source/market/evidence checks and production build; desktop/mobile Playwright acceptance passed 77 tests, one intentional skip, zero failures. Clean `npm ci` reproduced the build and production-dependency npm audit returned zero advisories.
- Updated the original first-scope architecture and README language to acknowledge implemented Portland GIS lookups and Massachusetts PDF/quote analysis. No decision-rule or PDF-parser behavior was changed.
- Genuinely redacted recent contractor bids, independent professional review and real-user acceptance remain prerequisites for a public launch. SSO/noindex and draft/unmerged status remain mandatory.
