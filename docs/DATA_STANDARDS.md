# Provenance and update requirements

Each production rule should track: `rule_id`, `authority`, `jurisdiction`, `project_type`, `property_type`, `conditions`, `source_url`, `source_excerpt`, `effective_on`, `retrieved_at`, `last_verified`, `status`, `exceptions`, and `superseded_by`.

Manually researched 2026-11-03:

1. [Portland residential mechanical permits](https://www.portland.gov/ppd/residential-permitting/residential-mechanical-permits): heat pumps and mini-splits are common projects requiring mechanical permits; electrical permits apply to most mechanical-equipment projects.
2. [Portland residential permits](https://www.portland.gov/ppd/residential-permitting/do-you-need-permit/residential-permits): additional hard-wired electrical work is permit-regulated; scope depends on work performed.
3. [Oregon HP3](https://www.oregon.gov/energy/incentives/Pages/HP3.aspx): $2,000 nominal HP3 incentive when available and approved, general HSPF2 >= 8.1 and SEER2 >= 16 requirements for applicable heat pumps, existing-owner-occupied funding fully reserved, and other categories require current inventory verification.

HP3 explicitly has special efficiency rules for packaged terminal heat pumps (PTHPs), and many other restrictions. This prototype does NOT evaluate PTHPs or assert full equipment eligibility. Contractor approval, residence status, competing incentives, program application rules, active funding, and other eligibility requirements require verification.

Do not display the $2,000 nominal award as a guaranteed savings amount. Program funding changes rapidly; before public release, add a reliable update/review mechanism and mark any stale funding status for verification.
