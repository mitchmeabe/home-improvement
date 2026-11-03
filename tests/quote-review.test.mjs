import test from "node:test";
import assert from "node:assert/strict";
import { reviewQuote, makeQuoteQuestions, QUOTE_QUESTIONS } from "../src/lib/quote-review.ts";

test("general quote has six questions by default", () => {
  const r = reviewQuote({}, false);
  assert.equal(r.checked, 6);
  assert.equal(r.toClarify.length, 6);
});
test("HP3 questions only apply when explicitly requested", () => {
  const r = reviewQuote({}, true);
  assert.equal(r.checked, 9);
  assert.equal(r.toClarify.length, 9);
});
test("documented only removes the specific question from outstanding items", () => {
  const r = reviewQuote({ equipmentModel: "documented", finalInspection: "not-mentioned" }, false);
  assert.equal(r.documented, 1);
  assert.equal(r.toClarify.length, 5);
  assert.ok(r.toClarify.some(q => q.id === "finalInspection"));
  assert.ok(!r.toClarify.some(q => q.id === "equipmentModel"));
});
test("all self-reported documented does not claim approval", () => {
  const answers = Object.fromEntries(QUOTE_QUESTIONS.map(q => [q.id, "documented"]));
  const r = reviewQuote(answers, true);
  assert.equal(r.toClarify.length, 0);
  assert.equal(r.documented, 9);
});
test("question summary includes historical funding warning when appropriate", () => {
  const s = makeQuoteQuestions(reviewQuote({}, true), true);
  assert.match(s, /historical|fully reserved/i);
  assert.match(s, /oregon.gov/);
  assert.doesNotMatch(s, /approved for incentive/i);
});
test("questions are non-empty and cite official government sources", () => {
  for (const q of QUOTE_QUESTIONS) {
    assert.ok(q.ask.length > 20);
    assert.match(q.source, /^https:\/\/www\.(portland|oregon)\.gov\//);
  }
});
