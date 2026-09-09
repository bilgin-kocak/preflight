# Hackathon preparation

The preparation branch was merged and deployed on 2026-09-09. Production x402 is active, one controlled 0.005 USDC purchase settled successfully, and two external pilot invitations were sent. Social posting and final submission publication remain pending.

- [Baseline and evidence](baseline.md): ten completed reviews, raw averages, source hashes and real unpaid API captures.
- [Paid activation evidence and runbook](activation.md): verified mainnet settlement, durable receipt and replay rejection.
- [Pilot outreach](distribution.md): the two published invitations; external testing is still awaiting responses.
- [90-second demo script](demo.md): runnable commands and narration, clearly separating simulation from mainnet evidence.
- [Change log](../../CHANGELOG.md): preparation changes mapped to the baseline findings.

Run `npm run payment:rehearse` for the local-only x402 walkthrough. Its output is simulation evidence, never a Celo receipt. Run `npm run check` for type checking, tests and build.

The announcement and final submission draft remain private local artifacts under the primary checkout's ignored `data/hackathon-preparation/` directory. They have not been published. The two sent pilot invitations are linked in the outreach record.

The next paid review round should keep the baseline question IDs and scales and run after the improvements are deployed and verified. The current record has no second-round result; calculate and report the actual difference only after that round completes.
