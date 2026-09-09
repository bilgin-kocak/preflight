# Preflight: 90-second demonstration

This is a ready-to-record script, not a completed video. Use the live free API and saved evidence from the verified mainnet purchase. Do not make another payment merely to record the demo or imply an attestation endpoint exists.

## Preparation

Use a terminal without environment-printing shell startup hooks. Do not show `.env`, `.secrets`, account dashboards, session tokens, or private keys. The commands below require no secret values. Record the public API output and explorer pages only.

Open these pages:

- Agent identity: https://8004scan.io/agents/celo/9826
- Official-tagged review deposit with USDC gas: https://celo.blockscout.com/tx/0x9655f6901bd8a1237a82fe136595e64741cff1ee1b15280790f71f5733919376
- Verified controlled API settlement: https://celo.blockscout.com/tx/0x1d8fde59197391d59615cad0ab9d7e460dd605d836bb72c43e49675d7cfe6e1c
- Saved API response and receipt: [mainnet-payment-smoke.json](evidence/mainnet-payment-smoke.json)
- Source: https://github.com/bilgin-kocak/preflight

## Recording sequence

| Time | Action | Narration |
| --- | --- | --- |
| 0–12s | Show identity and repository | “Preflight gives Celo agents wallet-history context before interacting with a counterparty. It exposes missing evidence instead of promising a safety or eligibility verdict.” |
| 12–35s | Run health and free preview below | “The live preview needs no wallet. Here are the observed activity and coverage fields. An old incoming transfer is not proof of a human user, and incomplete history stays uncertain.” |
| 35–60s | Show the saved mainnet challenge, HTTP 200 report, settlement on Blockscout and replay result; label **CONTROLLED TEST** | “The official x402 client paid 0.005 USDC on Celo. The API returned this report after settlement and recorded the receipt. Reusing the authorization returned 409. This proves the live flow, not independent adoption.” |
| 60–78s | Show real review deposit on Blockscout | “This transaction is real: 1.10 USDT funded ten AskBots reviews. It carries our official attribution tag, and its gas was paid in USDC. This is review funding, not API revenue.” |
| 78–90s | Show baseline summary and the two pilot invitations | “The baseline completed. Reviewers mainly saw the docs, so we deployed runnable examples and verified live payments. Two teams have been invited to test the API; external responses and the second review round are next.” |

Commands:

```sh
curl --fail-with-body -sS https://preflight-production-9071.up.railway.app/health
curl --fail-with-body -sS https://preflight-production-9071.up.railway.app/v1/preview/counterparty \
  -H 'Content-Type: application/json' \
  -d '{"address":"0x23Ca5C88009B94aA554dC37beE88517C92f7c07a"}'
```

The preview is limited to 20 requests/IP/UTC day. Reuse the dated captured evidence for practice; do not repeatedly consume the public quota.

## Final submission version

Use the saved 402 → successful report and settlement receipt evidence; never display the private signed authorization. Keep the real transaction hash and distinguish a controlled smoke payment from independent customer adoption. Add the uploaded recording URL as `videoUrl` only after the recording exists. The optional `npm run payment:rehearse` walkthrough remains a local simulation and must be labeled as such if shown.

The spec's attestation segment is outside the authorized Day 1 implementation. The real USDC-gas funding transaction demonstrates fee abstraction without claiming an attestation feature.
