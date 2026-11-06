# San José residential EV charging permit and electrician-scope planner

**City-specific source review:** 2026-11-06. **Status:** protected, noindex, unmerged development-only prototype. No business acquisition, public release, affiliate application, installer lead, utility connection, rebate award, or permit filing is authorized.

## Official source-backed decisions
- [City of San José EV Charging Stations](https://www.sanjoseca.gov/businesses/development-services-permit-center/start-your-project/electric-vehicle-charging-stations), updated March 18, 2026: existing standard Level 1 charging normally needs no new station permit; **installing a new 120V receptacle requires an electrical permit**. **Level 2 requires an electrical permit** and mechanical permitting may also be required if the product manufacturer specifies ventilation.
- [City electrical projects](https://www.sanjoseca.gov/businesses/development-services-permit-center/start-your-project/electrical-projects): electrical safety and actual code review are handled by the City; some applications are online.
- [City online building permits](https://www.sanjoseca.gov/business/development-services-permit-center/online-permits-at-sjpermits-org/building-online-permits): single-family/duplex EV charger and qualifying multifamily **assigned-parking** cases can use the online path; common multifamily parking requires further agency guidance.
- [City electrical service panel upgrades](https://www.sanjoseca.gov/businesses/development-services-permit-center/start-your-project/single-family-duplex-properties/electrical-service-panel-upgrades): a proposed panel change requires a separate electrical permit. The decision engine never claims a panel upgrade is necessary.
- [US Department of Energy](https://afdc.energy.gov/fuels/electricity-charging-home): Level 1 may suffice for many overnight charging needs; Level 2 and service availability require suitable electrical evaluation.

## Explicit exclusions and safety
No load calculation, electrical engineering, city-boundary lookup by ZIP code, permit issuance, guarantee of no inspection, product compatibility certification, contractor referral, utility funding claim, price, or federal tax-credit claim. User must confirm actual San José city jurisdiction and property/parking type. Multifamily common areas, commercial buildings, uncertain service work and unsupported locations receive a verification-first result.

Five questions are browser-only. A text checklist links official sources; no address, account, license ID, utility data or other personal identifiers are requested or sent. Human source review is required within 30 days; stale rules fail closed.

## Engineering / release gate
Keep existing SSO for all preview and production environments and global noindex, with route-level noindex. The home project's directory must not mix San José municipal permits into Oregon/Massachusetts workflows. Deterministic tests cover supported permit paths and 540 combinations. No merged branch or public deploy without a **separate explicit owner direction**.
