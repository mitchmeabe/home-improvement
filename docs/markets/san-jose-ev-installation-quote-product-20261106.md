# San José EV charger — installation specification and electrician-quote comparison
**Protected product increment · November 6, 2026 · not public**

## Customer job
A homeowner is considering a new 120 V charging outlet or a faster Level 2 EV charger and has two electrical contractor proposals. They want to know whether the city requires permitting, whether a new service panel is truly justified, and whether apparent price differences simply reflect missing work or incentives. The site must **never** pretend to perform electrical design, load calculations or permit issuance.

## New user-facing journey
1. Complete the existing five-question San José jurisdiction, property and work-screening planner.
2. See three evidence-backed strategies: suitably inspected existing Level 1 charging, new Level 1 outlet, or Level 2 with electrician-reviewed dedicated/managed charging.
3. For a supported case involving new electrical work, copy or download a personalized **request for quotation**. It asks every electrician about the same equipment specification, electrical load review, managed-charging and panel-alternative evidence, permit and inspection responsibility, excluded work, written warranties and the true price basis.
4. Enter two written quotes (installed total; before/after-incentives basis; Level 1/Level 2/panel/managed charging work; included labor/equipment/permits/inspection/trenching/mechanical permit; load evidence, charger model and warranties).
5. Receive an **as-quoted** price gap only if both price bases, the complete included-work lists, and the chosen technical/permit scope match. Otherwise the tool explicitly withholds the cheaper-quote conclusion and enumerates missing or contradictory items.
6. Copy or download the full local report, including official sources and a contractor-specific correction checklist. No upload, account, lead request or contact details.

## Source anchors
- City of San José, residential EV charging station permit rules (updated March 18, 2026): https://www.sanjoseca.gov/businesses/development-services-permit-center/start-your-project/electric-vehicle-charging-stations
- City of San José, electrical permits: https://www.sanjoseca.gov/businesses/development-services-permit-center/start-your-project/electrical-projects
- City of San José, panel upgrades: https://www.sanjoseca.gov/businesses/development-services-permit-center/start-your-project/single-family-duplex-properties/electrical-service-panel-upgrades
- City of San José, online permits and assigned multifamily parking: https://www.sanjoseca.gov/business/development-services-permit-center/online-permits-at-sjpermits-org/building-online-permits
- U.S. DOE Alternative Fuels Data Center, residential charging: https://afdc.energy.gov/fuels/electricity-charging-home

The existing dated source registry and 30-day city-screening fail-closed behavior remain authoritative. The new quote module **does not make new determinations** about electrical permit necessity; it consumes the existing source-backed screener's result.

## Buyer protection and necessary exclusions
- The most valuable initial recommendation can be **no new installation** if a suitable existing Level 1 setup satisfies the user. Always distinguish charging needs from vendor promotion.
- A 100 A service rating by itself cannot justify buying a panel upgrade. A licensed electrician must document service loads, charger load, applicable code and any supported load-management alternative. This tool never computes capacity or wiring.
- Unknown or stale city jurisdiction, commercial/shared-parking properties, and existing-outlet-only situations do not expose the electrician quote-comparison flow.
- A city electrical permit, inspection, mechanical ventilation and panel work are **different priced scope items**. Two bids cannot be ranked when inclusion is missing, unknown, contradictory, or when one proposes significantly different work.
- Proposed rebates or discounts are **never deducted or predicted**. Before/after incentive bases must match and no quote is represented as an actual final invoice.
- A matching scope creates only a **price comparison**, not a recommended or approved electrician.
- Quote data and homeowner project selections live in browser component state. Export happens only via an explicit copy/download action. No homeowner addresses, project amounts, inputs or equipment IDs are attached to analytics. Events consist of coarse starts/copy/download actions without payloads.

## Commercial product hypothesis — still unverified
Search journeys worth evaluating after explicit launch authorization:
- `San Jose EV charger installation quotes what should be included`
- `San Jose EV charger panel upgrade necessary`
- `San Jose electrical permit EV charger Level 2`
- `compare EV charger installation quotes permits inspection`

A plausible eventual transaction would be a **qualified electrician installation referral**, but no partner, fee schedule, traffic or conversion is known. The existing acquisition experiment in `docs/experiments/san-jose-ev-charger-acquisition-20261106.md` remains a *hypothesis*, not a running campaign. Do not add affiliate codes or lead capture based only on this document.

## Validation and launch
Unit: `npm test`; protected build: `npm run build` includes type/source/market/evidence and Playwright test discovery; browser: `npm run test:e2e` in Chromium. The case tests include matching bids, asymmetric pricing basis, omitted permit/inspection, mismatched panel work, managed charging, uncertain manufacturer ventilation, source expiry, invalid totals, downloaded text artifacts and the no-quote boundary.

**Integration:** this feature is built on the protected draft `integration/protected-home-ev-acquisition-20261106` (PR #26). Keep it as a dependent draft PR; do not merge either branch or remove site-wide SSO/noindex without a new owner decision.
