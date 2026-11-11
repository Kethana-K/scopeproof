# ScopeProof — submission copy for review

Status: draft. No Devpost entry has been submitted. Do not remove the verification caveat until actual sandbox checkout is tested. Source repository: https://github.com/Kethana-K/scopeproof . Required final link still pending: public YouTube demonstration.

## Project name

ScopeProof

## Elevator pitch

AI helps freelancers turn unclear requests into reviewable scopes. PayPal sandbox payments stay tied to the exact work and amount that a person approved.

## Inspiration

Small service businesses often begin a project with a short message: “Build a website, add some posts, and do it quickly.” That message can conceal disagreement about quantities, revisions and extra work. ScopeProof explores whether a clearer agreement at checkout can make that handoff easier to inspect.

The target audience is independent web, design, content and automation providers. The prototype uses a synthetic coaching-centre brief; it does not claim existing customers or measured business outcomes.

## What it does

ScopeProof classifies clauses from an English brief using a local machine-learning model. It exposes the source wording, influential terms and model scores rather than asking the user to trust an unexplained generated agreement. Low-confidence or negated clauses need review. Open-ended wording and urgent deadlines are flagged.

The user edits the deliverables, enters prices, sets a revision limit and writes acceptance criteria. A saved quote becomes a versioned snapshot with a SHA-256 fingerprint. Approval must reference that exact fingerprint before checkout can start.

The PayPal sandbox adapter creates an order with the server-calculated total and the scope fingerprint. After buyer approval, the server verifies the completed capture, order ID, amount, currency and scope metadata. A return URL cannot mark the scope paid. A later request creates a separate change order while preserving the original agreement. An exportable evidence record collects the scope and payment events.

## How we built it

The application uses Node.js 24, built-in SQLite, plain JavaScript, HTML and CSS. There are no runtime npm dependencies. PayPal Orders v2 supplies server-side create, inspect and capture operations; the adapter uses OAuth and stable request IDs. Webhook verification is implemented through PayPal's verification endpoint.

The AI component is a TF-IDF and logistic regression classifier trained on 80 original synthetic examples. Training uses Python and scikit-learn. The exported model runs in JavaScript on the application server without an external model provider. It is a narrow classifier, not an autonomous agent. Deterministic risk flags and payment invariants are separately documented.

AI assistance was used for project ideation, implementation, synthetic training examples, tests and documentation. The source, model and limitations are included for inspection.

## Challenges

The central engineering challenge was preserving the relationship between reviewed work and payment. The server owns the amount; quote approval cannot be reused for a changed scope; capture responses must match the saved record; retries should not duplicate application events. Another challenge was keeping a small model honest: scores are shown as model evidence, and uncertain wording stays subject to human review.

## What is working and what is not yet verified

Local inference, scope creation, review, approval, change-order preservation and the evidence workflow are implemented. The automated domain and API tests pass with controlled payment fixtures. The browser scope flow has been exercised.

**The real PayPal sandbox network flow has not yet been verified because application credentials were unavailable during preparation.** This must be completed before presenting a working payment demo. Webhook delivery and a public deployment are also unverified. This draft is not ready for final submission while those required payment and video checks remain outstanding.

## What we learned

The safest place for AI in this prototype is assistance before a transaction. It can help categorize the request and expose uncertainty while the person chooses what the agreement means. The payment record should refer to a reviewed, server-owned snapshot, not to text that a model can silently rewrite after consent.

## Next steps

Complete a real sandbox checkout and publish an honest demonstration. Then test with consenting freelancers, evaluate multilingual and ambiguous briefs, add separate client and freelancer identities, and support recovery, refunds and other payment lifecycle events. The current approval action occurs in one browser workspace; it is not a verified client signature, escrow or dispute guarantee.

## Built with

Node.js 24; JavaScript; HTML; CSS; SQLite; Python; scikit-learn; TF-IDF; logistic regression; PayPal Orders v2 sandbox; PayPal REST OAuth; PayPal webhook verification API.

## Positioning for the five judging criteria

| Criterion | What the demonstration should establish |
| --- | --- |
| Technical implementation | A genuine sandbox create/approve/capture flow, immutable scope metadata, amount validation and meaningful local inference |
| Design | One coherent brief → review → approval → payment workflow, with clear uncertainty and failure states |
| Potential impact | A specific freelance workflow problem; distinguish the hypothesis from unmeasured outcomes |
| Innovation | Explain the scope-to-payment relationship and preserved change orders; do not claim a world-first invention |
| Presentation | Show the actual happy path and one useful failure boundary within 2:40 |

This project is not positioned for an autonomous-agent prize. Do not add sponsor names to the submission unless their tools are actually integrated and their prize conditions are met.
