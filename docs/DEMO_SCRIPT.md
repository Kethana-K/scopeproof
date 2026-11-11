# ScopeProof — 2:40 working-demo plan

Record this only after a real sandbox checkout succeeds. The payment segment below is a recording plan, not evidence that it has happened. Keep the published video under three minutes and public on YouTube. Use your own narration and application footage; no music is needed. Never show credentials, the `.env` file or a real customer's brief.

## Before recording

- Prepare one fresh browser workspace with a synthetic sample brief.
- Sign in to the separate sandbox buyer account before recording so credentials do not appear.
- Verify the server is configured for sandbox and the return origin matches the browser.
- Keep the source repo and passing test output ready in another window.
- Use a clean browser window and hide unrelated tabs and notifications.
- Do not splice an API fixture or UI mock into the real payment scene. Trimming loading pauses is fine if it does not misrepresent what works.

## Shot plan and narration

| Time | Actual screen action | English narration |
| --- | --- | --- |
| 0:00–0:15 | Show the ScopeProof home screen and synthetic request. | “A freelancer gets a message: build a website, add social posts, and finish everything tomorrow. Before we send a payment link, what exactly are we agreeing to deliver? This is ScopeProof.” |
| 0:15–0:40 | Analyze the sample. Point to source wording, evidence and the excluded vague clause. | “A small local machine-learning model groups the requested services. Here are the original words, the recognized evidence and a model score. The vague deadline needs review. The model suggests; it does not set a price or authorize payment.” |
| 0:40–1:05 | Edit title, prices and criteria; create the scope. | “I choose the deliverables and prices, set one revision round, and write the acceptance criteria. The server freezes this version and calculates its fingerprint. The payment will refer to this exact scope.” |
| 1:05–1:40 | Show disabled checkout before approval. Approve, open real sandbox checkout, approve as sandbox buyer, return and capture. | “Checkout starts only after explicit scope review. The order amount comes from the server, and the scope fingerprint travels in PayPal metadata. After the sandbox buyer approves, ScopeProof verifies the completed capture, currency, amount and fingerprint before showing a verified payment.” |
| 1:40–2:05 | Review a new request; analyze additional commerce/automation work and unlimited changes. | “Now the client asks for a subscription checkout and CRM integration. These are possible additions to the work. ScopeProof creates a separate change order with a new approval. The original scope and payment record stay intact.” |
| 2:05–2:25 | Show evidence trail and representative passing tests; never show secrets. | “The evidence record keeps the scope, approval and verified capture together. The tests check mismatched amounts, currencies, order IDs, duplicate capture requests and attempted checkout without approval.” |
| 2:25–2:40 | Return to product and close. | “This prototype records approval in one browser workspace; it does not yet verify a separate client identity. The next step is a small freelancer pilot. ScopeProof: agree the work, then get paid.” |

## Exact synthetic inputs

Initial brief:

> Build a responsive one-page website for our coaching centre with a contact form. Create eight Instagram posts with captions. We need everything tomorrow.

Title: `Coaching centre launch`

For testing, replace the illustrative prices with `1.00` each, yielding a `USD 2.00` sandbox total. Prices are arbitrary demo inputs, not market rates.

Acceptance criteria:

> One responsive page with a tested contact form and eight editable social posts with captions. Client provides final copy, logo and images. Delivery within five working days after receiving assets. One consolidated revision round. Hosting and recurring subscriptions excluded.

Change request:

> Add a PayPal subscription checkout for monthly memberships. Connect incoming enquiries to our CRM. We want unlimited changes.

Important distinction: the change request describes work the freelancer might build for their client. ScopeProof itself uses one-time sandbox Orders, not a subscriptions payment implementation.

## Do not say

- “This will prevent every payment dispute.”
- “Our AI is 100% accurate.”
- “We have paying customers” or quantified savings without real evidence.
- “The client signed” when the demo is a single browser workspace.
- “PayPal verified” while showing a mocked response.
- “We are guaranteed first place.”

Suggested YouTube title: `ScopeProof | Reviewable scopes + PayPal sandbox checkout | PayPal AI Hackathon 2026`

Suggested description: `ScopeProof is a hackathon prototype by Kethana Koppala, built with AI development assistance. It combines local service classification, explicit scope review, separate change orders and PayPal sandbox Orders. All footage uses synthetic requests and test funds. Source code and setup: https://github.com/Kethana-K/scopeproof. Limitations and verification status are documented in the repository.`
