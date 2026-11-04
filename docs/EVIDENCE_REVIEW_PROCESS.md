# Evidence quality — source-aware review gates (2026-11-04)

This is a **first part** of the shared data-quality work, not a live regulator approval or pricing service.

Two distinct inventories:
- `docs/SOURCE_REGISTRY.json` lists official government sources and review dates. `npm run sources:check` fails on stale official reviews; `sources:probe` is opt-in and never changes rules.
- `docs/EVIDENCE_REGISTER.json` lists individual claims in specific customer decisions: official rule, exact course approval, publisher-only checkout price, or program incentive. `npm run evidence:check` checks provenance, time applicability, status and a manual review queue.

`reviewed-official` is only valid for government source claims and exact course approvals with the actual regulator listing, provider, course number, delivery mode and date. It does **not** mean a user's credits are accepted or that a vendor offers checkout.

`publisher-observed` may document an exact dated individual SKU and observed amount, but never means regulator approved. `program-published` may describe a dated rate schedule, but never means the homeowner was awarded a rebate. `needs-review` is explicitly non-actionable.

A source change creates a human-review task. It never edits runtime eligibility, product status or prices. Runtime TX purchase gates remain stricter and independent; this is an auditable upstream inventory.

For a new claim: include the canonical source, explicit scope, evidence type, observation time, effective range if applicable, limitations, owner-review deadline, and any exact approval or offer evidence. Unknown stays unknown. Re-run `npm run evidence:check`, `sources:check`, all deterministic tests and browser checks. No user IDs, addresses, education records, incomes or uploaded quotes are recorded.
