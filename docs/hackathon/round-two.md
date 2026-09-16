# AskBots round-two preparation — September 16, 2026

Deadline: **September 21, 2026, 09:00 UTC / 12:00 Istanbul**. Run round two on **September 19–20** and allow time for at least ten completed reviews before the deadline. This is preparation; no second-round project has been created or funded by this work.

## Preserve a comparable baseline

The public AskBots query rechecked on September 16 reports the baseline project `k17ck4pafdpv9zts8svazajt6s8e3ncq` as `completed`, with budget 10, paidCount 10 and responsesReceived 10. Its five questions are `discovery`, `evidence`, `payment`, `usefulness`, and `askbots_overall`. Preserve their IDs, wording and scales. [Saved baseline](baseline.md).

The standard overall question is “Overall, how well does this property do what it sets out to do?” The preserved mean is 2.8/10. Current Growth Track rules require ten reviews in **both** rounds and an overall round-two mean of at least 5.0/10 before the improvement gap counts. These are organizer criteria, not instructions to reviewers to give a particular score. Quality filtering and the official score remain the organizers' decision.

The original reviews mostly lacked executed API evidence and had similar wording. Their paid/completed status does not establish judging eligibility. A private clarification request is prepared but unsent; organizer confirmation is outstanding. Do not delete, replace, edit or selectively omit the original reviews or present a fresh baseline as the original.

## Use the linked next-round workflow

1. Sign in to the existing builder account and open the [baseline dashboard](https://www.askbots.ai/dashboard/k17ck4pafdpv9zts8svazajt6s8e3ncq).
2. Check whether a next round already exists. If so, open it rather than creating another.
3. Use **Run another round**, with budget **10**. The current UI calls `projects.cloneForNextRound({projectId, budget})` and creates a new draft with the same property and questions. Its `previousRoundId` links back to the baseline. Verify that link and all five questions before funding.
4. Keep the property URL pointing to the live `/skill.md`; the improved evaluation brief is linked there. Do not rename and submit an unrelated project with the stock CLI to simulate another round.
5. Separately verify the existing agent wallet, chain, escrow and current quote. The current published price is 0.11 USDT per review: 10 reviews are 1.10 USDT, plus any self-paid gas. Use only the project's tagged funding path with the verified USDC fee adapter; do not substitute the stock CLI's gas policy.
6. After explicitly authorized funding and activation, preserve the new ID, `previousRoundId`, funding receipt, complete response export and per-question aggregates. Wait for actual completed reviews; do not substitute the unsigned evaluation script for external reviews.
7. Use the public `/p/<id>` project link in the Celo Builders draft. The baseline public link is [here](https://www.askbots.ai/p/k17ck4pafdpv9zts8svazajt6s8e3ncq). Preserve both round IDs and their link in the final evidence. The available public instructions do not explicitly settle whether the final submission field should point to the baseline or newest linked round; include this in the organizer clarification rather than guessing.

The dashboard and official CLI 0.4.0 establish the round-chain mechanism. This does not prove our baseline has cleared organizer review. The stock CLI can create an unrelated project when renamed; it has no documented next-round command in its current help.

## Changes to evaluate

- A standalone Node command captures eight unsigned API checks, actual responses, timing and the payment offer with no wallet or dependency installation.
- Invalid requests identify the exact field or nested array element to repair, before payment verification.
- Degraded health responses retain provider/RPC diagnostic fields instead of losing them to generic error normalization.
- The live skill explains two practical workflows and distinguishes old activity from the newly clarified 60-day token-activity eligibility rule.
- The review brief asks for executed observations and independent judgment without changing the baseline questions or suggesting a favorable score.

## Sources checked September 16

Deployment `233da935-f1df-40d7-8a6c-f550521932b9` succeeded from `7a3d9ec`. All 39 local tests, type checking and the production build passed; independent code review found no remaining blocker. The standalone command then passed all eight live HTTP checks. [Captured before/after evidence](evidence/onboarding-2026-09-16.json) preserves responses and timing, with instruction text represented by its hash and length.

The earlier capture passed six checks and lacked the newly required field-level error details in two HTTP 400 responses; those checks now pass. This is maintainer verification of a changed API contract, not an AskBots rating increase or proof of independent adoption. Timing samples have different cache conditions and do not establish a performance improvement. No new payment or round-two funding was sent.

- [Official timeline](https://celobuilders.xyz/hackathons/agents-at-work/timeline)
- [Track rules, review dates and score floor](https://celobuilders.xyz/hackathons/agents-at-work/tracks)
- [Submission fields and public project-link guidance](https://celobuilders.xyz/hackathons/agents-at-work/submission-fields)
- [AskBots builder documentation](https://www.askbots.ai/docs)
- [Public dashboard implementation](https://www.askbots.ai/_next/static/immutable/chunks/1jl5ywwpcc18v.js): clone, previous-round link, unchanged property/questions, and budget control
- [Published CLI 0.4.0](https://www.npmjs.com/package/askbots/v/0.4.0): round-chain safeguards in `dist/index.js` and `dist/fund.js`

Public documentation still contains bare-host credential examples. The user's stricter rule remains in force: reviewer API keys only go to `https://www.askbots.ai/api/*`; no credential-bearing redirects.
