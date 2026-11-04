# Massachusetts market evidence / stop-go status
Reviewed 2026-11-03.

**Engineering validation:** regression tests use two to three actual homeowner-reported dollar amounts and installation scopes from 2026 public forums. No signed installer proposals or independent equipment approval records have been examined. Do not claim "genuine quote validation" or verified rebate outcome.

**Competitive warning:** Mass Save's [current FAQ](https://www.masssave.com/frequently-asked-questions) advertises decarbonization specialist review for multiple bids. [Abode municipal utility programs](https://abodeenergy.com/homeowners/select-your-mlp/tmlp/heat-pumps/) can compare up to five contractor proposals without cost to the owner. [MA-PACE](https://mapace.org/) offers contractor-referred price comparisons funded by partners. An automated quote calculator alone is a weak acquisition moat.

**Hypothesis to test:** Zero-login, immediate, self-service price-basis and scope normalization may help homeowners identify missing contractor documentation *before* requesting expert review. It does not determine technical correctness. If free incumbent support solves the problem more completely, do not expand blindly.

**Telemetry (instrumented, not measured):**
- `mass_multiple_quotes_yes/no`: buyer says they do or do not already possess multiple proposals.
- `mass_quote_report_copied`: user copies contractor questions.
- `mass_official_quote_help_click`: visitor chooses existing free specialist guidance.
- `mass_quote_helpful_yes/no`: subjective response.
- `mass_save_program_click`: source validation.

Events contain no personal location, contractor, equipment ID, raw cost or rebate application. No sessions, traffic counts or conversion rates are available in this audit, and the pilot is SSO-protected/noindex.

**Next acceptance:** recruit at least eight to twelve real homeowners with two or more redacted signed contractor bids, verify written permitting/warranty/load/AHRI claims with a licensed expert, record discrepant classifications, and stop or reposition if users prefer free experts. Public availability and data-handling consent would require separate owner authorization.

**Evidence:** [one Massachusetts oil-ranch multi-quote case](https://www.reddit.com/r/massachusetts/comments/1uz992i/heat_pump_upgrade_good_dealidea/) and [other fixtures](../../tests/fixtures/ma-public-quote-scenarios.json); [Mass Save 2026 schedule](https://www.masssave.com/en/residential/rebates-offers-services/heating-and-cooling/heat-pumps/air-source-heat-pumps).
