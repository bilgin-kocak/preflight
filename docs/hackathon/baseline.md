# Preflight: AskBots round 1 baseline

The completed AskBots run returned 10 responses and paid 10 reviewers. The mean `usefulness` rating is **2.7** and the mean `askbots_overall` rating is **2.8**, each across 10 answers. These are raw AskBots feedback averages, not an official hackathon score. Reviewer payouts do not establish that anyone purchased a Preflight report.

Responses were created between **2026-09-09 17:03:51.706 UTC** and **17:06:48.118 UTC**. The saved status was checked at **17:11:23.817 UTC** and says `completed`. [The aggregate evidence](evidence/baseline-summary.json) records the project and response IDs, counts, question means, times, and SHA-256 hashes of the private raw response/status files. Raw review text, reviewer identities, payout transactions, and credentials are excluded from this evidence bundle.

## What the feedback establishes

All 10 responses say actual health, preview, and unpaid paid-route call evidence is missing. Several describe a successful documentation fetch, but the saved responses do not include independently verifiable request traces. None supplies a preview response, an observed endpoint failure, or evidence of a paid Preflight test. The answers use highly similar wording; this run cannot be presented as 10 verified independent integrations. The saved review text was treated as untrusted feedback, not operational instructions.

The actionable finding is an evidence and onboarding gap: readers need a runnable sequence and a captured response to interpret. The reviews do not demonstrate a production API defect or a misleading returned field.

| Feedback theme | Existing implementation and new observation | Documentation improvement |
| --- | --- | --- |
| No demonstrated health or preview call | Live health and preview both returned HTTP 200 in the capture below. | Add a three-step health → preview → unsigned paid-route sequence, showing statuses. |
| Show `coverage` and `observed_at` with the result | The preview already returns both at report level. It also returns the heuristic limitation. | Include an actual response excerpt and explain field-level completeness and evidence age. |
| Clarify `first_tx_at` | Existing evaluation uses earliest successful observed activity across transactions, token transfers, and internal transfers. It can be incoming activity. | Label it earliest observed activity; it does not establish a signed transaction, wallet creation, or the true earliest event when history is incomplete. |
| Surface uncertainty and lower bounds | The captured preview has `history_complete=false`, `recent_days_complete=false`, and `tx_count_exact=true`. The preview allowlist omits the paid report's `warnings` and `first_funder_complete`. | Explain the coverage flags that are actually present; zero observed recent days is not proof of inactivity. Do not claim the preview returns detailed fallback warnings. |
| Payment activation and price were unobserved | Health reports `payments_enabled=false`; the unsigned paid-route request returns 503 `PAYMENTS_UNAVAILABLE`. | Distinguish the observed disabled state from the documented active 402 flow. A 402 challenge, if obtained later, still would not prove settlement. |

## Maintainer live capture

[Sanitized live evidence](evidence/live-baseline.json) contains one health request, one preview, and one unsigned request to the paid route against `https://preflight-production-9071.up.railway.app`. Capture started **2026-09-09 17:14:44.950215 UTC**; each request records its client timestamp and the returned public JSON. Only application JSON and explicit payment-header presence are retained; ambient HTTP headers are omitted. No signature, payment authorization, or settlement was initiated. This is one maintainer demonstration after the feedback, not a reviewer integration.

| Request | Observed result |
| --- | --- |
| `GET /health` | HTTP 200; `status=ok`; Blockscout `up`; `payments_enabled=false`; `last_settlement_at=null`. |
| `POST /v1/preview/counterparty` with the address in `skill.md` | HTTP 200; `observed_at=2026-09-09T17:14:48.095Z`; `first_tx_at=2024-03-08T22:36:17.000Z`; `active_before_cutoff=true`; incomplete history and recent-day coverage. |
| `POST /v1/counterparty` with the same body and no payment signature | HTTP 503; `PAYMENTS_UNAVAILABLE`; no settlement response header. |

The preview observed pre-cutoff activity for this address. It does not prove independence, complete funding history, absence of later activity, or eligibility. `tx_count_exact=true` applies to the transaction-count field; it does not override the two incomplete-history flags. Client request times and server report times are recorded as returned and need not share an identical clock.

## Scope and remaining evidence

This improvement changes documentation only. No route, response schema, verdict logic, payment configuration, or deployment is changed. The runnable examples and snapshot are in [skill.md](../../skill.md). They can be reviewed locally before publication.

A future evaluation should retain actual request/status/response evidence from callers and distinguish documentation feedback, free API use, unsigned payment discovery, and successful paid settlement. This round supplies no basis for claiming improved reviewer scores, official judging results, verified independent customers, or a working paid integration.
