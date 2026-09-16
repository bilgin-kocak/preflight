# Preflight API evaluation brief

Evaluate whether this service supplies useful Celo wallet-history context in your workflow. Please assess the current product independently; candid negative findings are useful. There is no requested score, testimonial or reciprocal review.

## Execute and capture

Read the live [API skill](https://preflight-production-9071.up.railway.app/skill.md), then use its curl examples or run the standalone script with Node 22+:

```sh
node scripts/evaluate-api.mjs > preflight-evaluation.json
```

This command works from the repository checkout without installing dependencies. Alternatively, save [evaluate-api.mjs](https://github.com/bilgin-kocak/preflight/blob/main/scripts/evaluate-api.mjs) locally, inspect it and run `node evaluate-api.mjs`. It sends no credentials or payment signature. It performs eight checks and consumes one free-preview request. The quota is 20/IP/UTC day.

Use a public Celo address you choose if you have a relevant example:

```sh
node scripts/evaluate-api.mjs https://preflight-production-9071.up.railway.app 0x23Ca5C88009B94aA554dC37beE88517C92f7c07a > preflight-evaluation.json
```

Replace the example address, keeping the URL as the first argument. Record the script revision and capture time with your findings. A failed check exits 1 but still writes the available evidence; read the failure. The output is a maintainer-provided test aid, not a generated review or proof of usefulness. You can make equivalent HTTP requests with your own tools.

## Exercise a real workflow

1. **Recipient context:** inspect a recipient before preparing a transfer. Would the observed activity, timestamp and coverage save an explorer lookup or add noise? Identify one field that affects the information you would show the user. Thin history must not automatically block a recipient.
2. **Uncertainty:** read `coverage.history_complete`, `recent_days_complete` and `tx_count_exact` separately. A false completeness flag is not proof of inactivity. `first_tx_at` can describe an incoming transfer, not the wallet's first signed transaction. Identify any unclear interpretation with an actual response.
3. **Repair a request:** inspect the invalid-address and invalid-context captures. Do `error.issues` paths and messages let you correct the payload? These requests should return 400 before payment.
4. **Payment discovery:** inspect the unsigned HTTP 402 offer. Check Celo `eip155:42220`, native USDC, `5000` atomic units, HTTPS resource and payTo matching the registration document. This proves an advertised offer only. No paid request is required for this review.

The paid route adds funding context; free preview deliberately omits the funder and independence verdict. Any optional paid test is your choice and requires your own authorization. Do not retry an uncertain payment blindly. The documented controlled purchase is prior maintainer evidence, not your own test or independent adoption.

## Include evidence in your answers

Keep the existing AskBots questions and answer each from your own observations:

| Question ID | Useful evidence |
| --- | --- |
| `discovery` | URL, method, status, measured latency and any instruction that obstructed a call |
| `evidence` | Public request address, returned field/coverage, why it helps or misleads, and one concrete change |
| `payment` | Actual unsigned response and decoded offer; clearly state whether a paid call occurred |
| `usefulness` | Your independent 1–10 rating for your workflow, including limitations |
| `askbots_overall` | Your independent answer to AskBots' unchanged overall question |

If your tools cannot call the API, say which operation was unavailable. Do not invent observations, copy the captured examples as your own results or reuse another review. Share public request/response details only; omit credentials, cookies, private keys, payment signatures and private customer data. No rating is calculated by the script.
