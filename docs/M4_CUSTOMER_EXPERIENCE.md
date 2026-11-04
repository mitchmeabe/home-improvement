# Milestone 4 — Home Improvement visitor experience

Branch stacked on independent M3 Oregon heat-pump water-heater PR #10, not on main; M2 Oregon jurisdiction PR #9 remains separately reviewable.

Implemented:
- Consistent root navigation on all pages with keyboard skip-to-content, tool finder, privacy and home.
- Two-question `/projects` finder, filtering by region and equipment goal, precise supported/unsupported descriptions and easy empty-state reset. Oregon water-heater vs Oregon space-heat pump vs Massachusetts equipment remain distinct.
- Homepage prominent chooser call-to-action, preserved project-specific links, and accessible one-H1 hierarchy.
- Focus-visible affordances, reduced motion, responsive navigation and no print clutter.
- Tests for filters, wrong-state exclusions, keyboard skip, smartphone layout and working destination links.
- No personal project inputs in analytics, browser storage, cookies, network requests, or external quote handling.

After M2 merge, verify the Oregon main-page upgrade still inherits global navigation and add the enhanced permit guidance to directory card text as needed. Further work: manual homeowner tests, accessible screen-reader walkthrough and search-intent validation. The site remains protected/noindex until explicit authorization.
