# Contractor referral discovery — November 3, 2026

## Evidence
- [Oregon HP3 government program](https://www.oregon.gov/energy/incentives/Pages/HP3.aspx) recommends obtaining at least 3 quotes from ODOE-approved contractors. It links current approved contractor lists (PDF/XLSX).
- [ODOE HP3 portal](https://odoe.powerappsportals.us/en-US/hp3/) confirms all existing owner-occupied funding is reserved and says new applications without existing reservations for that category are no longer accepted. Rental/new construction applications without reservations still accepted at time of review (funding remains subject to changes).
- [Portland mechanical permits](https://www.portland.gov/ppd/residential-permitting/residential-mechanical-permits) requires heat-pump permit and final inspection, with many installations also needing electrical permit.
- **No contractor referral commercial terms have been verified**, and the site has no approved/paid referral network.

## Commercial validation route
1. Measure anonymized `quote_questions_copied`, `hp3_contractor_directory_click` and `quote_compare_interest_yes/no` as leading interest signals.
2. Enable Vercel Web Analytics through each project dashboard; installing `@vercel/analytics` alone does not enable reports.
3. Recruit 8–12 consented Portland-area homeowners/contractors with actual quotes and have them inspect the checklist. No homeowner names, addresses or quotes stored.
4. Ask 3–5 companies from the current *official ODOE directory* whether they would accept a qualified-intent referral on transparent, compliant terms. Confirm that the installer remains ODOE-approved and currently serves the project area before any business listing.
5. Only then implement lead intake with appropriate consent, deduplication, accurate disclosures, and a privacy policy; never sell prospect contact information without consent.

## Revenue decision
Evaluate cost of reaching a homeowner with a real project, quote-checklist use, opt-in referrals and paid accepted-lead rate. No claim of a viable referral business is yet supported.
