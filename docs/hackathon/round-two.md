# AskBots linked round two — September 19, 2026

Deadline: **September 21, 2026, 09:00 UTC / 12:00 Istanbul**. The existing linked draft was funded and activated on September 19. AskBots now reports **completed**, with **10 responses** and a raw standard overall average of **6.7/10**, compared with **2.8/10** in the baseline: **+3.9 points**. These raw figures clear the stated count and score thresholds; official eligibility is not confirmed.

## Results and outstanding qualification

| Measure | Baseline | Linked round two |
| --- | --- | --- |
| Recorded reviews | 10 | 10 |
| Successful reviewer payouts | 10 | 8 |
| Overall mean | 2.8/10 | 6.7/10 |
| Usefulness mean | 2.7/10 | 6.4/10 |

- [Baseline project](https://www.askbots.ai/p/k17ck4pafdpv9zts8svazajt6s8e3ncq)
- [Linked second-round project](https://www.askbots.ai/p/k1787pz1tkcfkbm218d25fa46h8ehbex)
- [Aggregate evidence, hashes and limitations](evidence/round-two-summary.json)

All ten responses are included. The original baseline export is unchanged, all five question definitions match, `previousRoundId` points to the baseline, and both team-wallet exclusions remain in place. No new baseline or replacement round was created.

**Two reviewer payouts are marked failed by AskBots.** The platform reports 10 responses, `paidCount=8`, and status `completed`. The eight paid responses alone average 6.625/10, but they are not a ten-review sample. There is no documented builder retry control in the inspected documentation/dashboard. Do not fund another round or send direct reviewer payments as a workaround; AskBots must reconcile failed payouts and the organizers must confirm how these recorded reviews count.

**Review quality remains a judging question.** The responses repeatedly cite the September 9 snapshot with `payments_enabled=false` and HTTP 503. They do not establish current endpoint execution and use similar wording. Before activation, the maintainer's eight live checks all passed, including health with `payments_enabled=true` and the unsigned paid route returning HTTP 402. This discrepancy is preserved, not silently corrected inside reviewers' answers. The 6.7 mean is a raw feedback result, not proof of ten independent integrations, official eligibility or a prize.

The actionable feedback is to make incomplete-history and lower-bound warnings more prominent beside preview fields. This observation is distinct from the stale payment-state claims. Existing source and deployment evidence remain linked below.

## Funding evidence

The registered agent wallet funded exactly **1.10 USDT** for ten review slots. Both self-sent transactions carried `celo_80fe04c6accd` and used the verified USDC fee adapter. Their combined gas cost was approximately **0.008670 USDC**.

- [USDT approval](https://celo.blockscout.com/tx/0xe04090c30b26d205edc238c1230c5c6d939d8bd1658e96818101d13dda05ecd1)
- [Escrow deposit](https://celo.blockscout.com/tx/0x5af951ac1d1933ee8a9538ca9830da5ea49adb8175c5ce2fa8be08589583ef46)

The script stopped during immediate verification after each broadcast. Both receipts were independently reconciled, including exact sender, destination, calldata, zero native value, tag and USDC fee currency; the deposit's exact `ProjectCreated` event and escrow budget were verified. Neither transaction was duplicated. The official funding endpoint subsequently confirmed activation.

## Preserve a comparable baseline

The public AskBots query rechecked on September 16 reports the baseline project `k17ck4pafdpv9zts8svazajt6s8e3ncq` as `completed`, with budget 10, paidCount 10 and responsesReceived 10. Its five questions are `discovery`, `evidence`, `payment`, `usefulness`, and `askbots_overall`. Preserve their IDs, wording and scales. [Saved baseline](baseline.md).

The standard overall question is “Overall, how well does this property do what it sets out to do?” The preserved mean is 2.8/10. Current Growth Track rules require ten reviews in **both** rounds and an overall round-two mean of at least 5.0/10 before the improvement gap counts. These are organizer criteria, not instructions to reviewers to give a particular score. Quality filtering and the official score remain the organizers' decision.

The original reviews mostly lacked executed API evidence and had similar wording. Their paid/completed status does not establish judging eligibility. The previously authorized clarification was sent to the Celo Builders help endpoint on September 16; it returned general rules, not a human eligibility determination. Organizer confirmation is outstanding. Do not delete, replace, edit or selectively omit the original reviews or present a fresh baseline as the original.

## Preserved runbook

The workflow below was used for the existing round. It is retained for audit, not an instruction to create or fund another round.

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

## Improvement evidence captured September 16

Deployment `233da935-f1df-40d7-8a6c-f550521932b9` succeeded from `7a3d9ec`. All 39 local tests, type checking and the production build passed; independent code review found no remaining blocker. The standalone command then passed all eight live HTTP checks. [Captured before/after evidence](evidence/onboarding-2026-09-16.json) preserves responses and timing, with instruction text represented by its hash and length.

The earlier capture passed six checks and lacked the newly required field-level error details in two HTTP 400 responses; those checks now pass. This is maintainer verification of a changed API contract, not an AskBots rating increase or proof of independent adoption. Timing samples have different cache conditions and do not establish a performance improvement. That September 16 preparation did not send a payment; the September 19 funding is recorded above.

## Official sources rechecked September 19

- [Official timeline](https://celobuilders.xyz/hackathons/agents-at-work/timeline)
- [Track rules, review dates and score floor](https://celobuilders.xyz/hackathons/agents-at-work/tracks)
- [Submission fields and public project-link guidance](https://celobuilders.xyz/hackathons/agents-at-work/submission-fields)
- [AskBots builder documentation](https://www.askbots.ai/docs)
- [Public dashboard implementation](https://www.askbots.ai/_next/static/immutable/chunks/1jl5ywwpcc18v.js): clone, previous-round link, unchanged property/questions, and budget control
- [Published CLI 0.4.0](https://www.npmjs.com/package/askbots/v/0.4.0): round-chain safeguards in `dist/index.js` and `dist/fund.js`

Public documentation still contains bare-host credential examples. The user's stricter rule remains in force: reviewer API keys only go to `https://www.askbots.ai/api/*`; no credential-bearing redirects.
