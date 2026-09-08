# Day 1 launch runbook

Public source: https://github.com/bilgin-kocak/preflight .
Configured Railway domain: https://preflight-production-9071.up.railway.app (verify deployment health before treating it as live).

## Completed locally

- Verified all explicit VERIFY items and every listed mainnet token/registry on Blockscout; see CONFIG.md for source URLs and contradictions.
- Hono service, providers, conservative checks, SQLite cache/quota/payment ledger, official x402 v2 payment gate.
- Separate agent and reviewer wallets, generated locally. `.secrets/wallets.env` has mode 0600 in a mode-0700 directory. It is ignored by Git, Docker and Railway upload. Do not paste its contents anywhere.
- Agent public address: `0x7a1f16230c5F3fD3b50C435fa93035eE789eE789`.
- Reviewer public address: `0x001bEB8140ce3372646d3197c92F3055694e1E13`.
- No wallet funding, registration, mainnet writes, payments, reviews or earnings claimed.

## Registration prerequisites

1. Supply your personal Telegram handle and complete Celo Builders Google sign-in. Country is optional. The public repo exists. Primary track is `askbots-growth`; additional `judges-favorite` rationale: “stablecoin-paid gas on every attestation + x402 settlement + 8004 identity in one agent-facing flow” (later-day demonstration, not yet implemented).
2. Resolve the live registration form's circular prerequisite: `erc8004Url` is required before the assigned attribution tag is returned. Use a valid existing identity if appropriate or obtain an organizer-approved flow. Do not submit a fake ID or send an untagged registration transaction. The platform's Q&A did not resolve this.
3. Save the draft using the fetched Celo Builders skill and put its exact returned tag into `ATTRIBUTION_TAG`. Declare both wallets. No self-derived tag counts. Do not publish the final hackathon submission now (outside Day 1).
4. Fund the agent with the requested approximately $15 of native USDC on Celo from a source you choose. No funding source has been authorized or used. Keep CELO balance zero. USDT is separately needed for AskBots review funding.

## Identity registration

The service hosts `/.well-known/agent.json`; until registration it honestly lists no registered identity. Set `AGENT_URI` to that public URL. Never add wallet keys to Railway variables: the identity script runs locally.

```sh
# Reads local .env and .secrets/wallets.env; defaults to unsigned dry-run
npm run register:identity
# Only after a real assigned tag and funded wallet exist:
npm run register:identity -- --execute
```

The sole broadcast path verifies chain 42220, zero CELO, a nonempty issued tag, adapter feeCurrency, simulation, and estimated gas <=0.10 USDC. It saves a prepared hash before broadcast; a repeated invocation refuses automatic resending. After confirmation it checks receipt success, feeCurrency and `verifyTx`, extracts the `Registered` event and prints the 8004scan link. Save `ERC8004_AGENT_ID` in the server environment only after success. A timed-out/failed registration must be reconciled on the explorer; do not delete its state record merely to retry.

## Activate payments

Connect the registered agent wallet at https://x402.celo.org and create a facilitator API key with an off-chain signature. Store the one-time key securely as `X402_API_KEY` in Railway. Paid activation additionally requires the registered `AGENT_ADDRESS`, assigned `ATTRIBUTION_TAG`, HTTPS `PUBLIC_BASE_URL` and `PAYMENTS_ENABLED=true`. Keep the durable SQLite volume across deployments. `/health` exposes activation status, never secrets.

`ETHERSCAN_API_KEY` is optional fallback access, not a requirement for the primary provider. Obtain a V2 key with Celo access through Etherscan; do not assume a legacy Celoscan key works.

## Railway

Dedicated project: `4443da49-4b0f-461e-9fcb-109ac24e8f30`, service `bfe2917c-eff9-4f69-b8f0-e9e7546c4d90`, volume `f3432bc4-4025-48ec-ba58-9edcd22777c0` mounted `/data`.

```sh
railway up --service preflight --detach
```

Deploy only one replica. Set `DATABASE_PATH=/data/preflight.sqlite`, `PORT=3000`, and `TRUST_RAILWAY_PROXY=true` for Railway's documented edge-supplied X-Real-IP. Do not enable that trust setting on a directly exposed Node server.

Railway documents root-owned volume mounts and suggests `RAILWAY_RUN_UID=0` for non-root-image permission errors. Automatic approval review rejected that root override; it has not been applied. Keep the image non-root. If the volume is not writable, deployment remains blocked until its permissions or an explicitly approved runtime policy are resolved. Do not silently switch payment state to ephemeral storage.

Sources: https://docs.railway.com/volumes ; https://docs.railway.com/networking/public-networking/specs-and-limits .

## AskBots round 1

Once the public service is reachable, prepare the actual URL and exclude both team wallets:

```sh
PUBLIC_BASE_URL=https://preflight-production-9071.up.railway.app npm run review:prepare
npx askbots@0.2.0 submit --file data/askbots-round-1.json --json
```

That is a dry-run cost preview: 10 reviews cost 1.10 USDT. It does not create, fund or request reviews. Use the same builder account and funding wallet as hackathon registration. Stock `--execute` performs untagged USDT approval/escrow transactions using CELO gas; it is prohibited by this project's tag/USDC-gas policy. A compliant funding flow must be verified before requesting reviews. Do not claim round 1 happened until AskBots confirms a funded project. Never have the reviewer wallet review Preflight.

## Evidence for the next day

Keep real settlement rows in SQLite's `payments` table. Pending rows may have an uncertain on-chain outcome; reconcile before any fresh authorization. Do not delete the database during deployment. Record AskBots findings and the subsequent fixes when real reviews arrive; there are none to invent now.
