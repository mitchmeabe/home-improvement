# Private pilot plan

## Audience and objective
Test 8–12 actual Portland-area homeowners or HVAC contractors considering a heat pump. Use voluntary outreach; do not send unsolicited blasts or collect addresses/income in the prototype.

## Tasks
1. Select property/jurisdiction and wiring scope.
2. Compare the checklist with a real planned project or a redacted contractor quote.
3. Inspect the linked municipal and ODOE pages; identify any missing requirements.
4. Confirm with an approved contractor whether a reservation exists and whether current HP3 funds are available.
5. Ask whether a quote-checking tool or a shortlist of verified local contractors would make the next decision easier.

## Evidence to collect (manual and pseudonymous)
Participant ID, project type, completed flow, disagreements with official guidance, missing fields, whether they requested a quote, willingness to use a referral, source of acquisition, and follow-up costs. Don't collect sensitive household or address information.

## Instrumentation
- `@vercel/analytics` pageview and privacy-safe custom events: `quote_questions_copied`, `hp3_contractor_directory_click`, `quote_compare_interest_yes/no`.
- The owner must enable Web Analytics in the Vercel project dashboard. No household, address, quote details, or equipment identifiers sent to analytics.
- Directory clicks and interest signals are **not** verified sales or paying contractor leads.

## Stop / go
Do not expand geography until accuracy is acceptable and at least one acquisition channel consistently produces actual project researchers. No pretense of live HP3 availability without a refresh system. This is a pilot plan, not completed user testing.
