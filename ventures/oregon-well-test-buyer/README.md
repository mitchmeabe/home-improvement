# WellOrder — Oregon Private-Well Laboratory Purchasing Pilot

**Status:** research-only, protected, unmerged and noncommercial; reviewed November 7, 2026.

A standalone Vite + React + TypeScript buyer tool that determines which **domestic private-well water analyses** to discuss with an accredited laboratory and whether existing results may avoid repeat purchases. It can audit two written, visitor-supplied lab quotes for coverage, accreditation and sampling comparability. It does **not** submit orders, collect an address, recommend a treatment system, interpret water chemistry, certify safe water or file with Oregon Health Authority.

The application is deliberately **isolated** in `home-improvement/ventures/oregon-well-test-buyer` due to the absence of a GitHub repository-creation tool. It has its own manifest, lockfile, tests, Vercel project root and explicit release gates. The live Home Improvement site's source code and routes are unchanged.

### Modes

- **Oregon real-estate seller:** identify the three statutory tests (total coliform, nitrate, arsenic), accepted-offer context, reuse of adequately documented results collected within one year, accredited methods, sampling rules and separate filing/reporting obligations. The buyer is *not* automatically the mandatory purchaser.
- **Routine existing household well:** OHA's annual nitrate + coliform/E. coli recommendations and approximately three-to-five-year arsenic interval. The default is **unknown previous results**, *not* “never tested”. Known fresh reports can lead to **no repeat order**.
- **Safety or special cases:** known contamination, flooding, equipment failure, potential designated area of concern, new-well construction, municipal supply or springs are either held for specific guidance or excluded from the narrow domestic-well offer. Local extra tests cannot be decided without an OHA/county review.
- **Two written lab quotes:** applicant-supplied analyte scope, current ORELAP accreditation for each test, E. coli, containers, hold times, transportation route, price and mandatory fees. If two quotes differ in scope, sampling method or essential documentation, the interface will **not rank them**.

### Development

```bash
npm ci
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

To preview locally, run `npm run dev` and open `http://127.0.0.1:3183`. The app uses no backend and persists no user entries. Each deployment must be protected by **Vercel Authentication/SSO for all deployments**; HTML contains noindex/nofollow/noarchive and robots.txt disallows crawling.

See `docs/EVIDENCE_AND_COMMERCIAL_GATES.md`. **No public launch, partnership claim or offer to purchase is authorized.**
