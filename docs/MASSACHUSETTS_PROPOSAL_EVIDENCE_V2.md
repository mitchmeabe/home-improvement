# Massachusetts proposal intelligence V2 — 2026-11-04

Private/noindex proof of concept, not Mass Save, an AHRI certification portal, or a rebate approval.

## Verified source findings
- Mass Save air source: https://www.masssave.com/en/residential/rebates-offers-services/heating-and-cooling/heat-pumps/air-source-heat-pumps — 2026 whole/partial/basic schedule, 2027 **announced** whole and partial rates, 2026 equipment must be installed by Dec 31 and complete rebate documents received by Feb 28 2027. After October 1 2026 rebate applications require serial numbers plus legible outdoor nameplate photographs. No serials are collected on this website.
- Official Heat Pump Qualified Product List: https://www.masssave.com/heat-pump-qualified-list — starting Jan 1 2026 standard new residential split systems with refrigerant GWP >700 (including R-410A) removed; check narrow large VRF and self-contained exceptions individually. Indoor and outdoor models, equipment class, and AHRI certificate must match exactly; branded marketing materials and a contractor's "yes" do not prove approved qualification.
- 2027 other eligibility, submission dates, basic amounts and product catalog must be reverified before claims about qualification.

## Implemented
- Dates with validation and 2026/2027 mismatch barriers; optional planned submission chronology and 2026 receipt deadline.
- Conservative browser-only extraction of **explicitly labeled** AHRI reference, indoor and outdoor unit model codes from pasted/.txt/text-layer PDF proposals. All candidates require user review and checkbox application. Ambiguous/conflicting IDs are withheld.
- Per-proposal equipment configuration and refrigerant GWP class, with standard 2026 split-system high-GWP exclusion and conservatively flagged temporary exceptions; no live model lookup.
- Post-rebate scenario is withheld when date is unknown/contradictory, system missing exact identity, official list status unconfirmed or high-GWP product has an applicable block/exception. Original quoted totals remain, separately comparable only under existing scope and price-basis rules.
- Downloaded report includes the evidence audit and official URLs. No home address, income, utility account, serial numbers, uploaded PDFs, or contractor identities are transmitted or stored.
- Unit, regression, desktop/mobile Playwright tests. Existing 2026/2027 schedule remains independent and source-dated.

## Remaining before release
1. Real consenting redacted homeowner proposal acceptance fixtures, including different PDF layouts and line wrapping.
2. Actual official HPQPL match and current installation-specific rebate terms from an authoritative fresh catalog, including AHRI certificate, exact paired system, delivery date, and installer participation.
3. Site-specific account and utility information stays outside the browser workflow; direct Mass Save verification required.
4. Independent legal/program review for exceptions, multi-unit, income qualification, financing and bonus stacking.

No new Oregon work, user accounts, partner referrals, or site indexing.
