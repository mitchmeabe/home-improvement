"use client";

import { useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import {
  QUOTE_QUESTIONS,
  reviewQuote,
  makeQuoteQuestions,
  type QuoteAnswers,
  type QuoteKey,
  type Evidence,
} from "../lib/quote-review";
import type { FundingStatus } from "../lib/heat-pump";

const options: { value: Evidence; label: string }[] = [
  { value: "unsure", label: "Not sure / need to check" },
  { value: "documented", label: "Clearly documented in the quote" },
  { value: "not-mentioned", label: "Not mentioned / missing" },
];

export function QuoteReview({ funding }: { funding: FundingStatus | undefined }) {
  const [answers, setAnswers] = useState<QuoteAnswers>({});
  const [hp3Interested, setHp3Interested] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [feedback, setFeedback] = useState<"" | "yes" | "no">("");
  const assessment = useMemo(() => reviewQuote(answers, hp3Interested), [answers, hp3Interested]);
  const warning = hp3Interested && funding === "fully-reserved";

  const copyQuestions = async () => {
    try {
      await navigator.clipboard.writeText(makeQuoteQuestions(assessment, warning));
      setCopyStatus("Questions copied to clipboard. No personal quote details were transmitted.");
      track("quote_questions_copied");
    } catch {
      setCopyStatus("Clipboard unavailable. You can still read the questions below.");
    }
  };
  return <section className="panel quote-panel" aria-labelledby="quote-head">
    <p className="eyebrow">Next step · assess a contractor quote</p>
    <h2 id="quote-head">Does your quote answer the important questions?</h2>
    <p className="muted">Use your written estimate to mark which details are documented. We do not upload, parse or retain your quote, and this is not a contractor or compliance certification.</p>
    <label className="check-row" htmlFor="seeking-hp3">
      <input id="seeking-hp3" type="checkbox" checked={hp3Interested} onChange={e => setHp3Interested(e.target.checked)}/>
      I want the quote checked for Oregon HP3 incentive questions too
    </label>
    {warning ? <p className="warning">Existing owner-occupied HP3 funding was fully reserved in ODOE’s October 1, 2026 table. Ask whether a pre-existing approved reservation applies to this project; do not count on a new incentive.</p> : null}
    <div className="quote-grid">
      {QUOTE_QUESTIONS.filter(q => q.scope === "general" || hp3Interested).map((q) => <div className="quote-question" key={q.id}>
        <label htmlFor={"quote-" + q.id}>{q.label}</label>
        <select id={"quote-" + q.id} value={answers[q.id] ?? "unsure"} onChange={e => setAnswers(old => ({ ...old, [q.id as QuoteKey]: e.target.value as Evidence }))}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>)}
    </div>
    <div className="quote-outcome" aria-live="polite">
      <strong>{assessment.toClarify.length}</strong>
      <div><b>items to clarify with the contractor</b><p>{assessment.documented} of {assessment.checked} questions marked documented by you. Even a complete checklist does not prove regulatory compliance or incentive eligibility.</p></div>
    </div>
    <h3>Questions to ask before signing</h3>
    {assessment.toClarify.length ? <ol className="questions">{assessment.toClarify.map(q => <li key={q.id}>{q.ask}</li>)}</ol> : <p className="notice">You marked every visible item as documented. Independently verify permit, inspection, contractor approval and any incentive with the responsible authorities.</p>}
    <div className="action-row">
      <button className="action-primary" type="button" onClick={copyQuestions}>Copy questions for the contractor</button>
      <a className="action-secondary" href="https://www.oregon.gov/energy/incentives/Pages/HP3.aspx" target="_blank" rel="noreferrer" onClick={() => track("hp3_contractor_directory_click")}>View ODOE-approved contractors ↗</a>
    </div>
    {copyStatus ? <p className="small" role="status">{copyStatus}</p> : null}
    <div className="feedback-row"><span>Would you use this to compare another contractor quote?</span>
      <button type="button" aria-pressed={feedback === "yes"} onClick={() => { setFeedback("yes"); track("quote_compare_interest_yes"); }}>Yes</button>
      <button type="button" aria-pressed={feedback === "no"} onClick={() => { setFeedback("no"); track("quote_compare_interest_no"); }}>No</button>
      {feedback && <span role="status">Response noted in anonymous site events when Analytics is enabled.</span>}
    </div>
  </section>;
}
