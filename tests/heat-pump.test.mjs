import test from "node:test";
import assert from "node:assert/strict";
import { evaluateHeatPump, SOURCES } from "../src/lib/heat-pump.ts";

const input = {
  location: "portland",
  property: "existing-owner-occupied",
  equipment: "heat-pump",
  wiring: "unsure",
};
const calc = (overrides = {}) => evaluateHeatPump({ ...input, ...overrides });

test("Portland residential heat pump has required mechanical permit", () => {
  assert.equal(calc().permits[0].status, "required");
});
test("new hard-wired electrical work requires electrical permit", () => {
  assert.equal(calc({ wiring: "new-hardwired-work" }).permits[1].status, "required");
});
test("no known new wiring still requires electrical verification", () => {
  assert.equal(calc({ wiring: "no-known-work" }).permits[1].status, "check");
});
test("outside Portland does not inherit Portland permit determination", () => {
  const result = calc({ location: "other-oregon" });
  assert.equal(result.permits[0].status, "check");
  assert.equal(result.permits.length, 1);
});
test("out of state cannot use Oregon HP3", () => {
  assert.equal(calc({ location: "outside-oregon" }).funding, "not-applicable");
});
test("existing owner-occupied funding listed fully reserved for new applications", () => {
  assert.equal(calc().funding, "fully-reserved");
});
test("rentals and new construction require live funding check", () => {
  assert.equal(calc({ property: "existing-rental" }).funding, "verify-live");
  assert.equal(calc({ property: "new-construction" }).funding, "verify-live");
});
test("vacation and commercial properties are outside program scope", () => {
  assert.equal(calc({ property: "vacation-or-commercial" }).funding, "not-applicable");
});
test("general efficiency numeric thresholds, not full eligibility", () => {
  assert.equal(calc({ hspf2: 8.1, seer2: 16 }).efficiency, "meets-numeric-thresholds-only");
  assert.equal(calc({ hspf2: 8, seer2: 16 }).efficiency, "below-threshold");
  assert.equal(calc({ hspf2: 8.1 }).efficiency, "unknown");
});
test("invalid numeric ratings fail explicitly", () => {
  assert.throws(() => calc({ hspf2: -1 }), RangeError);
  assert.throws(() => calc({ seer2: Infinity }), RangeError);
});
test("official provenance links are present", () => {
  assert.equal(SOURCES.length, 3);
  for (const source of SOURCES) assert.match(source.url, /^https:\/\/(www\.portland\.gov|www\.oregon\.gov)\//);
});
