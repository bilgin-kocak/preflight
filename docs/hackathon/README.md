# Hackathon preparation

The preparation branch was merged and deployed on 2026-09-09. Production x402 is active, one controlled 0.005 USDC purchase settled successfully, and two external pilot invitations were sent. Social posting and final submission publication remain pending.

- [Baseline and evidence](baseline.md): ten completed reviews, raw averages, source hashes and real unpaid API captures.
- [Paid activation evidence and runbook](activation.md): verified mainnet settlement, durable receipt and replay rejection.
- [Pilot outreach](distribution.md): the two published invitations; external testing is still awaiting responses.
- [90-second demo script](demo.md): runnable commands and narration, clearly separating simulation from mainnet evidence.
- [Change log](../../CHANGELOG.md): preparation changes mapped to the baseline findings.
- [Linked round-two results](round-two.md): ten recorded reviews on September 19, raw overall mean 6.7/10 versus 2.8/10, with payout and review-quality limitations disclosed.
- [Reviewer brief](reviewer-brief.md): free executable checks, practical workflows and independent feedback instructions.

Run `npm run payment:rehearse` for the local-only x402 walkthrough. Its output is simulation evidence, never a Celo receipt. Run `npm run check` for type checking, tests and build.

The announcement and final submission draft remain private local artifacts under the primary checkout's ignored `data/hackathon-preparation/` directory. They have not been published. The two sent pilot invitations are linked in the outreach record.

The linked second round reports completed with ten responses and a raw +3.9-point overall change. Two reviewer payouts failed, and the reviews repeatedly reference an old payment-state snapshot. The recorded count and raw score clear the published thresholds, but organizer eligibility remains unconfirmed. See the complete [aggregate evidence](evidence/round-two-summary.json); the original baseline and all second-round reviews are preserved.
