# Validation

Run: `npm install`, `npm test`, `npm run typecheck`, `npm run build`.

Covered fixtures:
- Portland heat pump -> mechanical permit required
- Portland with new hard-wired circuit -> electrical permit required
- Portland without known new wiring -> verify electrical permit applicability
- Other Oregon -> no invented Portland permit determination
- Outside Oregon -> no HP3 eligibility
- Existing owner-occupied -> funding fully reserved for new applications (existing reservations may differ)
- Existing rentals and new construction -> availability must be checked live, not assumed
- Vacation/transient properties -> not covered by HP3
- Insufficient efficiency -> below general threshold, not automatic equipment approval
- Invalid input -> explicit error

Manual acceptance: inspect primary sources, verify document date, test with actual address/quote and city agency before production use. Do not state that funding inventory is live or accurate beyond the recorded snapshot.
