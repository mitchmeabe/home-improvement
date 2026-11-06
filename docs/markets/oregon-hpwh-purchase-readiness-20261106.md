# Oregon HPWH — Site Fit, Manufacturer Model Evidence and Safe Quote Purchase Decision

**Protected product increment · November 6, 2026 · no public launch, partner, filing or approved purchase.**

## Why this is a meaningful purchasing decision

The existing Oregon heat-pump water heater (HPWH) tool already handles Portland one/two-family plumbing/electrical permit questions, the dated Energy Trust Home Retrofit midstream discount announcement, and broad comparisons between two or three quotes. That is insufficient when two appliance quotes use different **First Hour Ratings**, different electric circuits, or different manufacturer ventilation requirements. A lower reported installed price can mask an incompatible or incomplete installation.

The new product covers **site-model compatibility and comparable equipment** without changing any state program or permitting rules. It remains within the same existing Oregon HPWH product family.

## Fully implemented buyer workflow

1. Report a prospective site (garage, basement, utility room, closet, other), measured room dimensions, typical cold-weather temperature, available 120/240 V connection, condensate drain path, and normal versus concentrated hot-water demand.
2. Get transparent *enclosed volume arithmetic*, clearly not an air-flow, code or manufacturer approval. **450–700 ft³ are examples, not universal minima.** Each model requires its own documented requirement; an undersized room triggers a manufacturer-approved vent/louver redesign question, not a blanket no-go.
3. Download/copy a **common written bid specification** requesting model identity, EnergyGuide First Hour Rating (FHR), Uniform Energy Factor (UEF), minimum free-air volume, model-approved ducting, cold-location conditions, electrician-verified circuit, condensate, service clearance, permitting, commissioning and warranties.
4. For each of the **existing 2 or 3 quotes** enter manufacturer model, FHR, UEF, model air-volume minimum, ventilation approach, voltage, and seven written installation evidence answers. Tank size and total price continue coming from the original quote form—no redundant price entry.
5. Pure decision engine distinguishes unmeasured site, model/documentation gaps, **actual mismatched products**, and projects reported sufficiently documented **for professional review only**. Never predicts hot-water adequacy or auto-selects a tank capacity, outlet/circuit or manufacturer. A cooler-than-~38°F garage is a manufacturer operating-range review, not an arbitrary automatic exclusion.
6. **Critical safety integration:** the original tool's lowest-price display is suppressed unless the detailed site/model audit confirms reported alignment *and* its original broad work, tank capacity, incentive basis and cost-inclusion checks pass. It does not advertise a cheapest equivalent contractor solely because both quotes have a 65-gallon tank.
7. Download or copy a full individualized model/room and quote comparison with reasons each installer must clarify; all inputs remain in current browser memory, with only fixed action names in aggregate analytics.
8. New separate source-backed buyer guide at `/oregon/heat-pump-water-heaters/buying-guide`, linked from the main planner.

## Newly verified primary technical guidance (November 6, 2026)

- ENERGY STAR HPWH Design Considerations: https://www.energystar.gov/partner-resources/residential_new/educational_resources/sup_program_guidance/heat_pump_water_heater_guide/design_considerations — examples of model free-air needs, closet louver/duct approaches, FHR and tank size, cooled exhaust and fan sound.
- ENERGY STAR HPWH Installation Best Practices: https://www.energystar.gov/partner-resources/residential_new/educational_resources/sup_program_guidance/heat_pump_water_heater_guide/installation_best_practices — condensate, location and service clearances, owner controls and relief-valve considerations.
- U.S. DOE Building America Single-Family HPWH Overview: https://basc.pnnl.gov/resource-guides/heat-pump-water-heaters-single-family-homes — the **First Hour Rating** is more predictive than tank label alone; different 120 V/240 V variants affect the electrical plan; room volume/thermal-resource and condensate paths vary with model.
- ENERGY STAR Super-Efficient Water Heater homeowner guidance: https://www.energystar.gov/products/energy_star_home_upgrade/super_efficient_water_heater — typical air requirements, manufacturer-specific variations, space temperature and residential buying tradeoffs.

These four sources were added to the manually reviewed `docs/SOURCE_REGISTRY.json` with 60-day expiry. Existing Portland PPD one/two-family permit rules and the Energy Trust May 12, 2026 midstream offer remain **separate**. No 2026 tax-credit assumptions or invented current financial awards.

## Design and safety boundaries

- The model's exact installation manual and qualified installer take precedence over examples. A measured room larger than a reported minimum **does not certify** air distribution or safe installation.
- First Hour Rating and UEF are reported source data. No demand algorithm, required tank recommendation, energy-bill estimate or efficiency-savings guarantee. Confirm peak demand and local code with a qualified plumber.
- An existing 120/240 V label never proves a dedicated circuit is appropriate. Require electrician circuit/breaker/wire/permit confirmation.
- A condensate drain or pumped line, cold garage, service clearances, noise near living spaces, gas line retirement and water safety require professional review.
- An approved louver/duct strategy can provide a legitimate **alternative path** for a small room; don't rule out those projects without checking actual manufacturer specifications.
- If model, FHR, UEF, voltage, vent plan or included work differ, **no equivalent-price conclusion**. The tool never ranks the better water heater or contractor.
- No contractor names, address, utility ID, household income, serial number, uploaded proposals, account or checkout. Copy/download only by direct user action; events do not contain answers or prices.

## Validation and commercial state

- Pure unit tests cover identical models, same-tank-but-different-model exclusion, FHR/UEF mismatches, too-small room, approved vent option, cold-garage review, electrical conflict, drain pump/no path, high demand, three quotes, invalid data, source expiry and strict original-price ranking interaction.
- Playwright acceptance covers pre-purchase bid request and local download, manufacturer minimum versus room size, fully documented equal equipment permitting a provisional spread, differing models withdrawing cheapest-quote language, and the guide's global noindex.
- Build must pass existing Node/TypeScript/source/evidence/market checks and actual browser suite. Maintain Vercel all-environments SSO, root robots noindex and Disallow.
- Feature PR is deliberately **draft**, based on the protected Home Improvement integration PR #26, not merged into `main` or the independent San José EV PR #27 or Oregon space-heating quality PR #28.

## Unvalidated commercial hypothesis

Possible future acquisition questions: “heat pump water heater closet size venting”, “can I install a heat pump water heater in garage Oregon”, “120v versus 240v heat pump water heater”, “heat pump water heater first hour rating comparison”, and “what should a water heater installation quote include”. An eventual quality-installer referral would need independently vetted partners and paid demand; do not assume such arrangements or activate lead collection based on this prototype.
