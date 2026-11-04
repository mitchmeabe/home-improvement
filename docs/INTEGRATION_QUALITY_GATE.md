# Integrated Product Quality Gate
Reviewed for November 2026 integration milestone.

## Included routes
- `/`: Oregon Portland permits, HP3 funding and 2–3 quote comparison
- `/massachusetts/heat-pumps`: Mass Save 2026 / announced 2027, scope-aware quote comparison
- `/privacy`: data use, limitations and analytics
- All paths remain SSO-protected and `noindex`; `robots.txt` disallows crawling pending authorization.

## Automation
CI runs unit and adversarial cases, source-review validation, TypeScript, Next production build, and desktop/mobile Chromium browser tests against the generated site. Browser checks exercise ordinary navigation, comparison calculations, unknown rebate behavior, scope incompatibility, local report download, keyboard focus, mobile width and non-indexing.

The source-registry and Mass Save market checks have explicit review ages; they do NOT prove live program funding, qualified equipment listing or rebate award and cannot automatically edit rules. Optional `npm run sources:probe` flags content/link drift for a human review.

## Key safeguards
- No false lowest-cost ranking across mismatched ductwork scope or before/after-discount price basis in either Oregon or Massachusetts.
- Detailed side-by-side coverage matrix (scope, permits, electrical work, equipment, warranties, rebate evidence).
- Conservative conditional rebate treatment and documented unknowns.
- Private browser-local text report; no uploaded bids, contractor names, addresses, or actual payment information.

## Residual blockers
- No signed original contractor proposals were obtained; anecdotes are labeled as homeowner-reported.
- No real-user testing, paid conversion or comparable sales funnel; no reliable business viability conclusion.
- Mass Save utility sponsor/approval and rebate funding not externally verified in this private pilot.
- Independent HVAC/regulatory review, browser accessibility manual testing and user authorization needed before public launch.
