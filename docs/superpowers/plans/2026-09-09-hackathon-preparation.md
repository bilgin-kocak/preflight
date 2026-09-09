# Hackathon preparation implementation plan

> For agentic workers: use the executing-plans workflow; independent baseline documentation and distribution research are delegated with disjoint file ownership.

**Goal:** Prepare a reproducible paid-flow rehearsal and accurate submission materials without deploying changes or contacting others.

**Architecture:** Keep production at its captured baseline. Use the existing app, official x402 client and HTTP facilitator adapter against a local simulated facilitator, ephemeral signing account and separate SQLite database. Archive review facts, improve discoverability on this branch, and draft distribution/submission/demo materials from verified evidence.

**Tech stack:** TypeScript, Hono, viem, x402 v2, Vitest, Markdown and JSON.

**Spec:** User-approved preparation list in this conversation; preflight-spec.md sections 9 Day 1 and 10, corrected by CONFIG.md. No Day 2+ routes or attestations.

## Constraints

- Branch `codex/hackathon-preparation`; production configuration and deployment stay unchanged.
- No real payment authorization, settlement, outreach, social publishing, or final submission publishing in this task.
- Credentials remain in ignored root files; run shell tools with `login:false` to avoid the environment-printing startup hook.
- Local payment receipts are synthetic and must never be presented as Celo settlement evidence.
- The 10-review baseline completed during preparation; preserve its raw source locally and a hash/aggregate on this branch. Raw averages are not an official organizer score.

## Tasks

- [x] Verify clean baseline: 32 tests, existing live health and AskBots status.
- [x] Preserve baseline facts and capture real unpaid API examples; improve skill.md on this branch.
- [x] Add local HTTP payment rehearsal: official client creates authorization, adapter verifies it, successful response has receipt, restart preserves replay refusal, failed settlement never releases a report.
- [x] Add regression tests for the rehearsal, execute it and save a clearly labeled result.
- [x] Draft X announcement, 90-second demo script and final submission payload with honest current capabilities and unresolved fields.
- [x] Identify potential independent users with primary sources and unsent pilot invitations.
- [x] Run full checks and independent review; preserve production and prepare branch delivery with clear remaining actions.

Verification: 33 tests/typecheck/build passed; the cleanup refinement passed typecheck and the focused payment test. Local rehearsal blocks external requests. Live health is healthy, paid mode disabled, and served skill hash matches the baseline. Delivery uses small commits on the preparation branch; private launch drafts stay outside Git.
