# Product brief

**Customer:** Oregon homeowner or rental-property owner exploring a residential heat pump.

**First job:** identify which Portland permits need attention; see whether the state HP3 incentive is worth investigating; avoid proceeding on an outdated assumption of funding; understand documented efficiency thresholds.

**Scope:** residential heat pump or mini-split, Portland municipal permit guidance, Oregon HP3 snapshot. The form also accepts other Oregon or outside-Oregon locations but never extends Portland permit conclusions to them.

**Not in MVP:** address/geocoding, other utility rebates, tax credit stacking, equipment model verification, contractor licensing eligibility, financing, official permits, live reservations or lead marketplace.

**Business hypothesis:** convert high-intent project researchers into qualified contractor quote requests in future. No commercial referral agreement or verified customer demand exists yet.

**Gate:** validate with city/agency and several real property cases before public release; test whether users take an actionable next step; only then expand jurisdictions and offers.

## Milestone 2 quote comparison

The existing project form now feeds a two-to-three bid quote comparison. Buyer-reported price bases, proposed discounts, financing/scope notes and annual operating-cost figures are NOT independently verified. It does not infer utility-specific rebates, tax incentives, official HP3 availability, bill savings or whether a contractor is actually approved. Conditional math can be shown when the customer confirms ALL HP3 conditions, but never states incentive approval. The Portland-specific permit limits remain in place outside Portland.

A source ledger (`docs/SOURCE_REGISTRY.json`) and opt-in network probe (`npm run sources:probe`) flag stale/changed sources without automatically altering government rule logic. The site stays private/noindex until an independent accuracy review.
