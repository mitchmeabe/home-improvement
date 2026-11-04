# Massachusetts Mass Save air-source heat-pump planning pilot
Reviewed **2026-11-03**. User-entered planning, not qualified utility enrollment, payment, approval, energy savings or rebate guarantee.

## Official program sources

- [Mass Save air-source heat pumps](https://www.masssave.com/en/residential/rebates-offers-services/heating-and-cooling/heat-pumps/air-source-heat-pumps): 2026 installed equipment whole-home $2,650/ton maximum $8,500; partial-home $1,125/ton maximum $8,500; Basic $250/ton max $2,500. AHRI cooling capacity (BTU/h) / 12,000 determines tonnage. 2026 install deadline December 31; application and complete documentation must be received **February 28, 2027**. Serial-number/nameplate photos required beginning October 1, 2026.
- Same program page **announces** for installations starting January 1, 2027: whole-home $2,350/ton maximum $7,500; partial-home $1,000/ton maximum $7,500. **No 2027 basic amount or final 2027 terms claimed.** 2027 scenario not treated as verified entitlement.
- [Mass Save Heat Pump Qualified Products List](https://www.masssave.com/heat-pump-qualified-list): systems must qualify as matched systems and meet ENERGY STAR Cold Climate requirements. R-410A products generally removed from list for new residential/light commercial systems as of Jan 1, 2026, with exceptions; don't infer by brand.
- [Income-based enhanced offers](https://www.masssave.com/residential/rebates-offers-services/income-based-offers/save-with-enhanced-incentives): separate verification, prior fuel, weatherization and program conditions; **not computed**.

## Decision branches
- Utility sponsor: electric sponsor for oil/propane/electric-resistance or Basic; gas sponsor for natural gas whole/partial. Unknown accounts require verification.
- Heat Pump Installer Network contractor must participate. Exact system must appear on qualified product list; equipment must be new.
- Whole-home: sole source of heating/cooling, full-time winter occupancy, qualifying weatherization (special multifamily nuance) and signed Whole-Home Verification Form.
- Partial-home: full-time winter occupancy and qualified integrated controls/switchover settings when fossil heat remains, or documented complete disconnection for displaced zones.
- Basic: equipment not displacing the qualifying original heating source, e.g. replacing an existing heat pump or adding AC. Amount and utility participation distinct.
- A bonus for weatherization and sizing may be available for qualified partial-home applicants, but the pilot **does not calculate bonuses** or automatically stack other rebates, financing or federal tax credits.
- Permits depend on Massachusetts municipality; the site asks each contractor to document them but does not infer local approval.

## Bid comparison model
Two-to-three bids, individual price and price basis (before/after rebate), AHRI tonnage, and contractor/program evidence. Compare as-quoted totals only if both have same basis; never compare before/after as directly equivalent. Published rate × user-supplied tonnage is only **schedule arithmetic**.
A conditional post-rebate *illustration* requires 2026 self-reported prerequisites, network equipment status and explicit written rebate confirmation from user; it is **not proof Mass Save awarded the amount**. Avoid subtracting rebates twice when contractor already quotes an after-rebate amount. Rates cap at official maxima and cannot exceed install cost.

## Release gate
- Independent review of sponsor/fuel compatibility, winter occupation, weatherization, system qualification, partial controls, rebate forms and 2027 changes.
- Real installer proposals tested with permission and personal details removed.
- Live published rate/terms refresh before public launch. No real referral partner or user conversion data established.

## Real-world quote evaluation and competitor evidence — November 2026

**Traceable homeowner quote reports, not authenticated contractor proposals:**

1. [July 17, 2026 Massachusetts oil-heated ranch quote thread](https://www.reddit.com/r/massachusetts/comments/1uz992i/heat_pump_upgrade_good_dealidea/): approximately $26,000 pre-rebate Bryant 3-ton **reuse/insulate ducts**, $45,000 Mitsubishi 3-ton **build new ducts**, and $22,000 ducted / $32,000 ductless alternatives from a third firm. The differences in scope make a lowest-price recommendation misleading. A three-bid scenario using the cited $26k/$45k/$32k values is in `tests/fixtures/ma-public-quote-scenarios.json` and asserts **no comparable winner**.
2. [January 30, 2026 Massachusetts 6-head/2-condensor quote report](https://www.reddit.com/r/massachusetts/comments/1qrmhn4/ma_heat_pump_quotes/): homeowner reported approximately $45k before rebate with insufficient verified AHRI/permit data. **Only one quoted offer**, so not enough for a two-bid comparison. Fixture verifies refusal to rank a single quote.
3. [September 23, 2026 Massachusetts Bryant replacement quote report](https://www.reddit.com/r/hvacadvice/comments/1woa8zm/ma_is_24k_reasonable_for_a_bryant_multizone/): reported $24,300 before $750 potential rebate, but also $24,500 final. The report contains inconsistent arithmetic and a distinct replacement scenario. The software flags unknown rebate documentation and excludes it until verified.

No original PDFs, contractor identities, signed payment records, homeowner permission or completed rebate approvals were obtained. These are anonymized public posts, not a professional technical review or validation with a representative sample of Massachusetts homeowners. Do not claim we 'tested against actual signed contractor proposals.'

**Incumbent alternatives:** [Mass Save FAQ](https://www.masssave.com/frequently-asked-questions) explicitly offers consultation for reviewing multiple residential heat-pump quotes. Certain municipal-light-plant programs have a [free Abode comparison service](https://abodeenergy.com/homeowners/select-your-mlp/tmlp/heat-pumps/) (up to five quotes). That removes any assumption that this is a new or unserved service. Our possible product advantage is self-service speed and predictable source-backed checks, NOT exclusive access or a promise to beat free experts.

**Release validation still missing:** At least 8–12 consented local homeowners sharing redacted original proposals with an HVAC specialist, line-item scope/price mapping, permitting confirmation, equipment AHRI checks and waiver review. The prototype does not store or accept documents. A real-document harness would need explicit permission and proper handling.

## Contractor scope equivalence — November 3, 2026

Beyond installation category (reuse ducts, new ducts, ductless, mixed), each quote now records whether the following work is explicitly included (yes), excluded (no), or not established (unsure): startup/commissioning with performance check, duct/airflow or leakage testing as applicable, and existing heating equipment removal/disposal. The tool *does not decide* whether each task is legally mandatory for every installation.

**Source basis:** [ENERGY STAR heat-pump guidance](https://www.energystar.gov/products/energy_star_home_upgrade/clean_heating_cooling) recommends appropriate ACCA Manual J sizing and quality installation standards; [DOE Energy Skilled HVAC programs](https://bsesc.energy.gov/recognition/hvac-programs) describe refrigerant/airflow verification, commissioning and duct-leakage work. The [ENERGY STAR contractor bid checklist](https://www.energystar.gov/ia/products/heat_cool/HVAC_QI_bidsheet.pdf) discusses proper matching, charging/airflow checks, duct sealing and written commissioning. Applicability, permit scope and required documentation remain technical review subjects, not assumed certifications.

**Price-ranking safeguard:** If one contractor explicitly includes a named cost-bearing scope category and another explicitly excludes it, the nominal lowest-price suggestion is withheld and the difference is named in the matrix and downloaded text report. A yes-versus-unknown difference is **unresolved**, not fabricated as an exclusion; otherwise-comparable totals can still show their nominal gap with uncertainty warnings. These are scope disclosures, not automatic proof that either quote is better or code compliant.

This functionality has isolated pure unit tests, representative Massachusetts and Oregon quote engines tests, and desktop/mobile browser acceptance; no uploaded original contracts, commercial partners or homeowner activity.
