# Verification and entry checklist

Prepared November 11, 2026. This is a work record, not a claim of hackathon acceptance.

## Current status

| Item | State |
| --- | --- |
| App starts on Node 24 | Checked |
| Local model exported and included | Checked |
| 36 automated tests | Passed with controlled fixtures |
| Browser: sample → suggestions → scope → approval → separate change order | Checked |
| Mobile device and assistive technology testing | Pending |
| Actual PayPal OAuth/create/approve/capture | Pending: sandbox credentials unavailable |
| Registered webhook real delivery | Pending |
| Public source repository | Published: https://github.com/Kethana-K/scopeproof |
| Public YouTube demo | Pending |
| Devpost registration and final entry | Pending |

## Mandatory next proof: a real sandbox checkout

1. Configure a sandbox REST app as described in README. Do not use live credentials.
2. Save a small scope with a known total and review its fingerprint.
3. Before approval, verify that checkout is disabled.
4. Approve the exact scope, then enter sandbox checkout.
5. Cancel one checkout and confirm it does not become paid.
6. Open checkout again, approve as a separate sandbox buyer, return and capture.
7. Confirm the UI total and currency match the sandbox dashboard capture.
8. Reload and repeat capture; the quote must retain the same capture reference and one verification event.
9. Export the evidence record. Compare its `scopeHash`, amount, currency and order ID to the returned order. Do not publish buyer-identifying records.
10. Add a change order. Confirm the original fingerprint, items, approval and capture remain unchanged.

Record the date and non-secret result below after completing it:

```text
Sandbox test date: PENDING
Expected total/currency: PENDING
Create/approve/capture: PENDING
Cancel/retry behavior: PENDING
Original scope preserved after change: PENDING
Verifier: PENDING
```

The automated suite also checks invalid prices, invalid currencies, wrong scope approvals, wrong capture amounts, cross-workspace access, forged client success and failed webhook verification. These are fixture-backed checks, not PayPal acceptance certification.

## Publish the source

The public repository is https://github.com/Kethana-K/scopeproof . It contains the project files including `LICENSE`, `.env.example`, `ml/model.json`, tests and documentation. Never upload `.env`, `data/`, browser cookies, sandbox passwords or personal contact details. Open the public repository while signed out and verify that README and the detected MIT license are visible. Follow the setup instructions from a fresh checkout.

## Finish the demonstration and entry

Record the actual working application using `DEMO_SCRIPT.md`, keeping it below 3:00. Publish on YouTube and verify it is public and playable. Review `DEVPOST_DRAFT.md`, replace pending links and status only with verified facts, and submit through the official event page after reviewing its terms and participant eligibility.

The official deadline currently shown is **November 12, 2026, 12:00 PST**, which is **November 13, 2026, 01:30 IST**. Entry is free. A meaningful AI implementation, functioning PayPal sandbox integration, runnable build, public open-source repository and public YouTube demo are required. Official sources: https://paypalaihackathon.devpost.com/ and https://paypalaihackathon.devpost.com/rules . Check these again before entry for updates.

## Evidence over promises

Aim to show one complete workflow. Do not call the project “production-ready,” imply real customer results, or promise a first prize. The project can remain useful as an agency portfolio demonstration even if it does not win.
