# San José EV Level 2: panel upgrade vs managed-charging option audit

**Dated 2026-11-06.** This is an independent, protected, non-commercial Home Improvement product increment on top of browser-QA draft PR #31. No production release, contractor lead collection, network requests or partner commissions.

## User problem and value

A homeowner who wants Level 2 charging receives a recommendation to replace the main electrical panel. The existing San José EV product can identify permit pathways and compare identical electrician bids, but **two materially different technical designs cannot be ranked as interchangeable quotes**. This increment instead helps the homeowner investigate whether a separately documented managed-charging system would meet the same charging goal without service-panel replacement, and collects all the facts needed to *conditionally* compare first-year costs.

The product **never designs a circuit**, computes load capacity, establishes code compliance, chooses an insurer/contractor or tells the homeowner that the panel is safe. An electric panel with an unrelated fire/safety/condition issue may need replacement **regardless of EV charging**; a cheaper quote does not resolve that condition.

### Official regulatory and buyer evidence

| Source | Usable facts / application | Verification boundary |
|---|---|---|
| [City San José residential EV charging permits](https://www.sanjoseca.gov/businesses/development-services-permit-center/start-your-project/electric-vehicle-charging-stations) (updated 2026-03-18, manually reviewed 2026-11-06) | Level 2 needs electrical permit and inspection; continuous EV load is included in electrical design; for panels rated **125 A or less**, required load calculations must reflect 125% EV load; separate mechanical permit may be needed if actual equipment requires ventilation. | **Not** a blanket 125-A panel replacement rule or a calculator for allowable amperage |
| [City San José panel upgrades](https://www.sanjoseca.gov/businesses/development-services-permit-center/start-your-project/single-family-duplex-properties/electrical-service-panel-upgrades) (updated 2026-04-15) | Main-panel replacement has separate City permit route; service entrance work and PG&E requirements may apply. | City permit does not equal PG&E service-change authorization |
| [City electrical projects](https://www.sanjoseca.gov/businesses/development-services-permit-center/start-your-project/electrical-projects) | Electrical permits and inspections protect safety; local compliance remains contractor/inspector responsibility. | No site-approved permit |
| [PG&E residential project resources](https://www.pge.com/en/account/service-requests/building-and-renovation/residential-project-resources.html) | Utility change-of-service, meter changes, panel/utility load increase can require PG&E review; charges and responsibility are situation-specific. | PG&E is a utility, **not a permitting authority**; no invented cost or default zero |
| [California CSLB hiring guidance](https://www.cslb.ca.gov/Consumers/Hire_A_Contractor/Finding_the_Right_Contractor.aspx) | Check active contractor license, bond, workers' comp/insurance where applicable and multiple identical written bids. | A user selection of "checked" is **not independent online CSLB verification** |
| [CSLB official instant license check](https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx) | Consumer-facing independent contractor search | No license number, company name or other personal data submitted to this application |

PG&E's `.com` consumer site is documented here and linked in UI, but excluded from the `.gov`-only source registry by design. The source registry adds 3 government records; all regulatory decision rules are manually snapshotted, re-review due after 30 days. No data pulled automatically from utility or permit APIs.

### Screens, rules and no-sale branches

The new component sits on `/california/san-jose-ev-charger`. It displays only if the **existing City screener** reports an eligible Level 2 electrical permit project at a verified San José single-family/duplex property with a proposed or unresolved panel change. The existing route, pre-existing like-for-like quote compare and existing Level 1 no-new-work outcome remain intact.

Visitor answers: verified panel amperage category; licensed electrician's written service/load assessment; whether a separate pre-existing panel hazard requires work; whether both designs are professionally determined viable; documented CSLB verification; matching desired charging goal; properly listed managed-charging equipment documented; utility coordination confirmed.

Two visitor-entered proposals (A, managed charging without panel replacement; B, panel/service upgrade with charging) track actual installed quote totals, **before/after incentive price basis**, utility costs *already included* versus extra separate charges, first-year monitoring/ongoing charges, permit/inspection inclusion, exact charger model, wiring and work scope, warranties. Amounts are local-only and validated for whole cents; blanks remain unknown. No rebate eligibility or savings is invented.

**The only "compare" case** requires all of: official city sources in date, documented load assessment and panel rating, verified qualified contractor, no unrelated existing panel defect, two viable alternatives confirmed in writing, identical charging outcome, listed managed system reviewed, utility coordination reviewed, complete written city permit/inspection/work/equipment/warranty scope, matched pre/post-incentive price bases, utility charges known, and first-year recurring charges known. The displayed first-year **price difference** is not a reduction in utility bills, actual financial savings or a recommended electrician. Future-year service costs, electricity prices, panel repairs, new incentives and rebate awards remain unknown. Any deficiency yields `needs-assessment`, `panel-work-review`, `outside-scope` or `source-review` and suppresses comparisons.

### Commercial falsification and next gates

This product sits in a distinct Home Improvement / residential electrical hiring market rather than the Arizona professional licensing products. It can produce a neutral electrician question sheet and reveal missing facts before an expensive job. However, **no measurable search demand, real quote conversions, partner acceptance, authorized paid referral fee or qualified lead exists**. User-entered quotes are not a buyer referral.

- Protected from public indexing by existing Vercel SSO, global noindex and robots disallow.
- No contractor network, advertised quote prices, lead submissions, payments, affiliate links, incentive estimates or partner outreach.
- The new tests cover missing load evidence, faulty panel, technical viability, mismatched service goals, bid completeness, utility fees counted once, recurring charges, cents, rebate basis and source-age failure. Browser acceptance tests are authored, but **test discovery alone is not Chromium execution**.
- Before commercialization: independently confirm City/CEC rules with an electrical expert, validate seller/buyer demand, establish allowed referral economics and program permissions, inspect user accessibility and mobile usability, execute desktop/mobile browser tests, and obtain explicit owner authorization to index or contact a contractor.

**Recommended next experiment after technical acceptance:** validate whether people searching for Level 2 installation in San José have sufficiently high intent specifically around a panel upgrade and whether independent electricians will pay for precisely scoped leads; do not assume referrals are monetizable merely because the tool is useful.
