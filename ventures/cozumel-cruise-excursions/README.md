# Shore Window — Cozumel Cruise Excursion Compatibility Pilot

A **standalone** Vite/React purchasing-decision app, staged inside `home-improvement/ventures/` solely because a dedicated GitHub repository cannot currently be provisioned through the existing integration. It has its own dependency manifest, tests, Vercel root directory and release controls; it does **not** import any Home Improvement source code.

**State:** private precommercial experiment, 2026-11-06. No validated real-time excursion inventory, no booking, no affiliation, no cruise-line authorization, no verified partner earnings.

## What it does

In a one-port Cozumel pilot, visitors supply:
- **Actual verified terminal** (Puerta Maya, SSA International, Punta Langosta) and all-aboard time as shown onboard; never infer pier from cruise brand.
- Earliest realistic ship-time arrival ashore, explicit ship/local clock verification, selected discretionary return reserve, party size.
- Two **user-supplied** operator offers, including true tour date, meeting location, tour clock, start, full tour duration, transit, check-in, return transit, ages/accessibility terms, missed-port cancellation policy and USD price with all mandatory fees.

Pure `src/lib/decision.ts` reports **needs-ship-details**, **needs-offer-details**, **schedule-conflict**, **manual-ferry-review**, or **conditional-window**. A conditional fit is **not** a bookability statement, ship-return promise, departure certainty or travel-agent endorsement. Mainland ferry bookings always need manual ferry and road coordination even when minutes appear to fit. User data never leaves their local tab (except any action they explicitly take outside the app with a downloaded text file). No analytics, lead collection, payments or affiliate links.

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

The Vercel project should point to **rootDirectory `ventures/cozumel-cruise-excursions`**, build `npm run build`, output `dist`, and enforce **SSO protection for all deployments**. Indexing disabled twice: HTML `noindex,nofollow,noarchive` and `public/robots.txt` `Disallow: /`. Testing on a preview with Vercel protection is not proof of public use.

## Non-goals

No live tour or itinerary scraper, no airline/bus/ferry arrival prediction, no guaranteed ships, no invented available tour slots, no claims that a particular meeting point or pickup applies to the traveler, no ship-clock timezone auto-correction, no model-generated transfer times, no medical questions, no official tour-partner booking guarantees, no direct booking or commissions. Children/accessibility are a **confirmation requirement**, not collected age or disability details.

Read `docs/EVIDENCE_AND_BUSINESS_GATES.md` for primary sources, affiliate constraints, test hypotheses and release blockers.
