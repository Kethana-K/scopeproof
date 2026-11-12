# HackerSquad entry preparation — 12 November 2026

## Verified event facts

Official rules: https://hackersquad.io/events/hackersquad-online-hackathon-1k-in-prizes/resources?tab=rules

Submission guide: https://hackersquad.io/events/hackersquad-online-hackathon-1k-in-prizes/resources?tab=submission

Registration: https://luma.com/hackersquad-online-hackathon

- Fully remote. Solo or up to four members. Every person needs individual host approval and must personally accept the Official Rules.
- At least 18 or the local age of majority, whichever is greater. Kethana's supplied birthday is consistent with the age threshold; final eligibility, identity and payment verification are the organizer's responsibility.
- No purchase or entry payment required.
- Build period: 7 November 2026 at 11:00 IST to 16 November 2026 at 13:29 IST. The official deadline is 15 November at 23:59 PST / 16 November at 07:59 UTC.
- Placement prizes per entry: $500 / $250 / $100. Results scheduled 23 November, subject to verification. No first-place guarantee.
- Some general event pages label the event Completed. The event-specific guide and Luma page display the November 16 end/deadline, and Request to Join was available when inspected. Host approval is still required; these observations do not prove acceptance.
- Public Git repository, exact commit SHA, English written materials, runnable app or setup instructions, disclosures, and a demo no longer than three minutes are required.
- **The demo must be recorded and submitted using HackerSquad's own recording platform. An external YouTube, Loom or Drive video does not replace it.**
- A draft is not a submitted entry. Verify a final Submitted status and playable in-platform recording.

## Why this project fits (our assessment, not a judge prediction)

| Published criterion | Weight | Evidence prepared | Remaining improvement |
|---|---:|---|---|
| Working functionality and technical execution | 30% | Runnable offline file; 19 behavioral tests; browser workflow verified | Independent walkthrough; physical mobile QA |
| Usefulness and impact | 25% | Specific freelance scope-change workflow; evidence and reply in one flow | Consented user trials; measured outcomes, if any |
| Originality and thoughtful AI | 25% | Explainable local inference plus source retrieval, explicit constraints and mandatory human decisions | Broader evaluation; do not overstate novelty or model ability |
| Demo clarity and UX | 20% | One concise scenario; citations; explicit limitations; script below | Record inside HackerSquad and verify playback |

## Ready-to-paste draft

**Name:** ScopeProof ChangeLens

**One-line description:** An offline AI-assisted review workbench that compares client change requests with the recorded scope and helps freelancers explain each human-reviewed decision.

**Problem and intended users:** Freelancers and small agencies receive extra requests through informal messages. It is easy to lose track of the original deliverables, quantity limits and exclusions. We want to help them review those changes before making a new commitment.

**What it does:** ChangeLens runs a small trained service classifier in the browser, retrieves related original clauses, and applies explicit checks for quantities, exclusions and ambiguous timing. The reviewer sees both source texts, chooses Included, Additional work or Clarify, and writes a reason. Only then can they generate a reply draft and download an evidence record. Changing an input or decision invalidates the previous export. Nothing is automatically accepted or sent.

**AI contribution:** TF-IDF and multinomial logistic regression, trained on 80 synthetic English examples in the earlier ScopeProof prototype. We evaluate the exported weights locally. Lexical retrieval and explicit rules support evidence review. The reply is templated from human decisions; it is not an LLM output. Model scores are uncalibrated.

**New contribution:** Implemented the standalone browser workflow, paired-document matching, quantity-change review, human decision gate, draft invalidation, evidence export and 19 tests on November 12. Reused the prior classifier with provenance disclosed.

**Validation:** Automated behavioral tests and a real Chrome walkthrough of comparison, review, reply preparation and JSON download. These are implementation checks, not a real-world accuracy benchmark or proof of time savings.

**Limits:** Small English-only classifier; lexical matching can miss paraphrases; complex quantities and contract context need a person. No client authentication, signed acceptance, automatic messaging or billing. No customer, revenue or dispute-reduction result is claimed.

**Contributor:** Kethana Koppala, with material AI assistance for research, code, tests, synthetic samples and documentation.

**Repository / commit:** Use the exact public branch and full commit returned after source publication. Do not invent a SHA or use a private Site URL as the only way for judges to run the app.

## Before competitive submission

- [ ] Submit the prepared Luma registration after consent; receive host approval.
- [ ] Personally accept the event's identified Official Rules in the designated acceptance form.
- [ ] Review code and explain the classifier, matching and rules in your own words.
- [ ] Run at least three consented or synthetic non-demo scenarios and record failures honestly.
- [ ] Freeze the exact code commit and use that same version in the recording.
- [ ] Record at most three minutes inside HackerSquad, save it and verify playback.
- [ ] Include the public branch URL, full commit SHA, all contributors and prior-work/AI disclosures.
- [ ] Submit for judging and verify the final status before 16 November 13:29 IST. Aim for November 15 evening to leave upload time.

No messages, social posts, referrals or emails to the organizer have been sent as part of this preparation.
