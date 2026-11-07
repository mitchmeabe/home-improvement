# Heat-Pump Installation Bid Quality & Scope Decision Studio

**Protected product increment — November 6, 2026.** No public release, contractor referral, document upload, energy savings guarantee, government program award, or engineering approval.

## Buyer decision and why the existing quote parser was not enough

The current Home Improvement portal already compares two/three Oregon heat-pump contractor quotes by as-stated cost, ductwork scope, permit/inspection inclusion, rebates, and basic written coverage. It supports local-only PDF/text import with manual confirmation, and must not claim independently verified quote authenticity.

The consequential unsolved problem is that **a $13,000 quote and a $17,000 quote may be different heating designs even when both say “heat pump”**. Missing evidence about heating/cooling load, manufacturer performance at the winter design temperature, conditioned zones, backup heat, ducts or startup commissioning can be more important than the apparent price gap.

## New fully implemented customer flow

1. In the existing Oregon heat pump quote comparison on the homepage, users enter 2 or 3 as-quoted installed totals, before/after discounts and ductwork scope (unchanged).
2. They define the **heating outcome**: whole-home, selected rooms, or supplemental heat; report whether the existing system is being replaced and whether ducts exist.
3. They copy/download a common contractor-neutral request for proposals containing heating/cooling load calculations, equipment/ratings, winter heating capacity, duct/head coverage, backup system, permits, commissioning and warranty questions.
4. For **each existing quote** (no duplicate manual price form), users review written evidence: Manual J or equivalent calculation, supplied load report, matched indoor/outdoor equipment, cold-weather manufacturer capacity, room/zone coverage, duct or ductless exceptions, backup/auxiliary heat, commissioning report and controls handover. Optional design figures (temperature, professional-calculated load BTU/h, manufacturer rating BTU/h, number of rooms/zones) are treated as **reported**, not a sizing determination.
5. A separate pure engine identifies incomplete evidence and inconsistencies (different ducts, price basis, backup strategy, number of rooms/zones or winter design temperature), withholds an affirmative "aligned for review" state on missing evidence, and explicitly **never endorses a contractor**.
6. Users copy/download an actionable contractor correction report, showing source-backed questions, per-bid missing information, and differences. Everything remains in browser memory; action analytics carry only static event names and no answers, names, quote values, models, load/capacity or geographic detail.
7. New source-backed reading page: `/projects/heat-pump-bid-quality`, linked from the Home Improvement homepage.

## Authoritative design/installation sources

- [DOE Building America — Heat Pump Replacement](https://basc.pnnl.gov/home-improvement-expert/checklists/heat-pump-replacement): an appropriate room-by-room ACCA Manual J load calculation, Manual S equipment selection using load, duct airflow/sizing review and quality installation practices. The source does not establish the design of a specific homeowner system.
- [DOE Building America — Heat Pump Quality Installation and Commissioning](https://basc.pnnl.gov/resource-guides/heat-pump-quality-installation-and-commissioning): equipment installation, refrigerant test/charge, controls, airflow/static pressure and measured performance verification as applicable, plus proper documentation.
- [ENERGY STAR — Air-Source Heat Pumps](https://www.energystar.gov/products/air_source_heat_pumps): sizing depends on house-specific loads, cold-climate equipment performance and professional design; generic tonnage labels do not suffice. **Do not copy the page's potentially outdated tax-credit language into incentives decisions.**
- [ACCA — Manual S residential equipment selection](https://www.acca.org/standards/technical-manuals/manual-s): matched residential heating/cooling equipment selection uses design loads and manufacturer performance data, not just advertised nominal tonnage.

The two US DOE Building America sources are added to `docs/SOURCE_REGISTRY.json`, dated November 6 with 60-day review expiry; the ACCA and ENERGY STAR sources are independent technical guidance rather than program eligibility sources. Existing Portland PPD and ODOE HP3 rules remain in their separate pure engines and are not changed.

## Guardrails and limitations

- **No automatic sizing adequacy judgment.** A quoted 28,000 BTU/h manufacturer output versus 42,000 BTU/h house heat load is an issue to ask a designer about, not proof of inadequacy: professional assumptions, design temperatures, operating range, backup heat and distribution matter. No calculated required tonnage, COP, annual savings or HSPF2/SEER2 eligibility.
- **Written evidence presence is not its correctness.** "Nine of nine" means the homeowner reported the requested documentation, not that the HVAC equipment or contractor is certified.
- **Mixed vs ducted vs ductless:** the base quote's declared installation scope is reused. A ductless project can say duct verification is inapplicable; it must still document indoor head/room coverage, lines and commissioning. A ducted project must provide duct/airflow assessment.
- **Backup and project intent:** whole-home vs room-specific, keeping existing heat vs replacing it and backup decisions must be reconciled between proposals; do not claim automatic "apples-to-apples" if they differ.
- **Discounts:** use the existing quote engine for pricing and HP3 snapshots; proposed or unawarded rebates are not used to declare a winning contractor.
- **Regulatory/geographic:** this new subsystem provides national-level HVAC documentation questions, **not** statewide permit determinations. Local Portland permitting and Oregon HP3 program logic stay untouched. It does not offer service outside the app's existing supported flow.
- **Privacy:** no PDFs transmitted, stored or analyzed externally; this new component uses already-entered in-browser proposal data only. Reports are generated locally. No leads, direct messaging, contact fields, quote uploads, monetized outbound links or activated affiliate commission.

## Acceptance / validation

- Source-reviewed pure decision engine and contract tests cover two/three proposals, all nine evidence fields, real differences, ductless exception, design-temperature/zone mismatches, invalid numerical inputs, 60-day source expiry, and owner replacement conflicts.
- Playwright covers a complete pair of proposals including downloadable request and review, scope divergence, third quote add/remove and guide noindex.
- Vercel SSO protects all deployment environments; global `robots: {index:false}` and `robots Disallow: /` must remain unchanged; no production release or promotion.
- **Draft feature PR** based on the protected `integration/protected-home-ev-acquisition-20261106` branch / PR #26, not directly on main. The independent San José EV quote product PR #27 is neither altered nor merged.

## Commercial hypothesis (unmeasured)

Buying-intent information needs: “heat pump quote comparison sizing Manual J”, “heat pump bids different tonnage”, “what must HVAC heat pump quote include”, “heat pump installation commissioning checklist”. A purchase-oriented referral could eventually arise from a vetted quality installer only after specific market testing, signed commercial agreements and transparent disclosures. A useful tool that occasionally advises against buying new equipment is preferable to a fabricated vendor ranking. **No lead conversion or revenue has been demonstrated.**
