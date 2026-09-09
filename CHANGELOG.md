# Changelog

## 2026-09-09 — paid activation and pilot outreach

- Deployed the preparation branch, enabled production x402, and fixed payment challenges to advertise the configured public HTTPS resource behind Railway's proxy.
- Verified one controlled 0.005 USDC mainnet purchase, its exact transfer, consumed authorization and durable SQLite receipt. The same authorization is rejected with HTTP 409. Saved evidence distinguishes this test from independent adoption.
- Sent tailored free API pilot invitations to Celo MCP and CeloBank Agent; responses and external usage remain pending.

## 2026-09-09 — baseline-driven preparation (deployed)

- Preserved the completed ten-review AskBots baseline with source hashes, per-question aggregates and explicit limitations. Raw means: usefulness 2.7/10, overall 2.8/10; these are not official judging scores.
- Added runnable health, free-preview and unsigned paid-route examples to `skill.md`, plus a dated real response and coverage interpretation. This addresses the reviews' evidence/onboarding gap without claiming a demonstrated API defect.
- Added `npm run payment:rehearse`: official x402 client and HTTP adapter over loopback, ephemeral signatures, simulated settlement, persistent replay checks after restart, and withheld reports on failure. No real wallet or funds are used.
- Prepared activation and 90-second demo runbooks. Private announcement/submission drafts and pilot research are stored outside Git.

These changes are deployed. No second-round score or improvement delta is available yet.

## 2026-09-09 — Day 1 launch

- Registered ERC-8004 agent 9826; saved the official hackathon tag and Track 3/4 draft.
- Funded ten AskBots baseline reviews with 1.10 USDT through tagged transactions using USDC gas. The baseline subsequently completed.
- Kept the production free preview active and the paid API disabled pending paid-flow activation and live settlement verification.
