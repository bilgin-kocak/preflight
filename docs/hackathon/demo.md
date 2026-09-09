# Preflight: 90-second demonstration

This is a ready-to-record script, not a completed video. Use the live free API, a clearly labeled local payment simulation, and verified Celo transactions. Do not imply that a simulated receipt is a mainnet payment or that an attestation endpoint exists.

## Preparation

Use a terminal without environment-printing shell startup hooks. Do not show `.env`, `.secrets`, account dashboards, session tokens, or private keys. The commands below require no secret values. Record the public API output and explorer pages only.

Open these pages:

- Agent identity: https://8004scan.io/agents/celo/9826
- Official-tagged review deposit with USDC gas: https://celo.blockscout.com/tx/0x9655f6901bd8a1237a82fe136595e64741cff1ee1b15280790f71f5733919376
- Source: https://github.com/bilgin-kocak/preflight

## Recording sequence

| Time | Action | Narration |
| --- | --- | --- |
| 0–12s | Show identity and repository | “Preflight gives Celo agents wallet-history context before interacting with a counterparty. It exposes missing evidence instead of promising a safety or eligibility verdict.” |
| 12–35s | Run health and free preview below | “The live preview needs no wallet. Here are the observed activity and coverage fields. An old incoming transfer is not proof of a human user, and incomplete history stays uncertain.” |
| 35–60s | Run local rehearsal, prominently label it **LOCAL SIMULATION — NO FUNDS MOVED** | “The paid flow is prepared locally: the official x402 client receives a 402 challenge, signs an authorization, and receives a report only after simulated settlement. Replays remain blocked after a restart. Production payments are still disabled.” |
| 60–78s | Show real review deposit on Blockscout | “This transaction is real: 1.10 USDT funded ten AskBots reviews. It carries our official attribution tag, and its gas was paid in USDC. This is review funding, not API revenue.” |
| 78–90s | Show baseline summary and improvement checklist | “The baseline completed. Reviewers mainly saw the docs, so our improvements focus on runnable calls and explicit examples. Next we validate live payments and measure the second review round.” |

Commands:

```sh
curl --fail-with-body -sS https://preflight-production-9071.up.railway.app/health
curl --fail-with-body -sS https://preflight-production-9071.up.railway.app/v1/preview/counterparty \
  -H 'Content-Type: application/json' \
  -d '{"address":"0x23Ca5C88009B94aA554dC37beE88517C92f7c07a"}'
npm run payment:rehearse
```

The preview is limited to 20 requests/IP/UTC day. Reuse the dated captured evidence for practice; do not repeatedly consume the public quota.

## Final submission version

After a separately verified live payment, replace the simulation segment with the actual 402 → USDC authorization → successful report and settlement receipt. Keep the real transaction hash and distinguish a controlled smoke payment from independent customer adoption. Do not record a payment twice just to improve the video. Add the uploaded recording URL as `videoUrl` only after the recording exists.

The spec's attestation segment is outside the authorized Day 1 implementation. The real USDC-gas funding transaction demonstrates fee abstraction without claiming an attestation feature.
