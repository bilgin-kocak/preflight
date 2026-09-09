# Day 1 launch runbook

Public source: https://github.com/bilgin-kocak/preflight .
Live Railway domain: https://preflight-production-9071.up.railway.app (verified 2026-09-08; free preview active, payments disabled).

## Completed locally

- Verified all explicit VERIFY items and every listed mainnet token/registry on Blockscout; see CONFIG.md for source URLs and contradictions.
- Hono service, providers, conservative checks, SQLite cache/quota/payment ledger, official x402 v2 payment gate.
- Separate agent and reviewer wallets, generated locally. `.secrets/wallets.env` has mode 0600 in a mode-0700 directory. It is ignored by Git, Docker and Railway upload. Do not paste its contents anywhere.
- Agent public address: `0x7a1f16230c5F3fD3b50C435fa93035eE789eE789`.
- Reviewer public address: `0x001bEB8140ce3372646d3197c92F3055694e1E13`.
- No wallet funding, registration, mainnet writes, payments, reviews or earnings claimed.
- AskBots CLI dry-run succeeded: `ok=true`, `dryRun=true`, `executed=false`, 10 reviews costing 1.10 USDT.

## Registration prerequisites

2026-09-09: Celo Builders Google sign-in and credential claim completed. The account had no existing submission. Saving an unpublished draft with the real project details, `askbots-growth` primary and `judges-favorite` additional returned HTTP 400: `erc8004Url (ERC-8004 Agent ID URL) is required`. No hackathon draft or attribution tag was created. Authentication, request and response records are saved only under ignored `.secrets/`; do not repeat account setup or publish those files.

1. Builder contact details and Celo Builders Google sign-in are complete. Country is optional. The public repo exists. Primary track is `askbots-growth`; `judges-favorite` is the additional target. The prepared rationale describes a planned agent-facing flow combining Celo identity, x402 payments and USDC gas, and explicitly states that the mainnet demonstration is pending.
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

The facilitator API key was created on 2026-09-09 using the agent wallet's off-chain ownership signature, with no transaction or payment. The response granted 20 mainnet and 1000 testnet settlement credits. The key is saved in ignored `.secrets/x402-key.json` and `.env` files with mode 0600, and configured as `X402_API_KEY` in Railway. Do not print or commit those files. Key creation does not require an existing ERC-8004 identity.

Paid activation still requires the registered `AGENT_ADDRESS`, assigned `ATTRIBUTION_TAG`, HTTPS `PUBLIC_BASE_URL` and `PAYMENTS_ENABLED=true`. Payments remain disabled. Keep the durable SQLite volume across deployments. `/health` exposes activation status, never secrets.

Configuration redeployment `ed4000f6-d881-4f09-96cf-c3c3ac38b325` succeeded on 2026-09-09. Public `/health` returned `status=ok` and `payments_enabled=false`. The facilitator account confirmed that the key exists. Read-only wallet checks still show 0 CELO, 0 USDC and 0 USDT.

`ETHERSCAN_API_KEY` is optional fallback access, not a requirement for the primary provider. Obtain a V2 key with Celo access through Etherscan; do not assume a legacy Celoscan key works.

## Railway

Dedicated project: `4443da49-4b0f-461e-9fcb-109ac24e8f30`, service `bfe2917c-eff9-4f69-b8f0-e9e7546c4d90`, volume `f3432bc4-4025-48ec-ba58-9edcd22777c0` mounted `/data`.

```sh
railway up --service preflight --detach
```

Deploy only one replica. Set `DATABASE_PATH=/data/preflight.sqlite`, `PORT=3000`, and `TRUST_RAILWAY_PROXY=true` for Railway's documented edge-supplied X-Real-IP. Do not enable that trust setting on a directly exposed Node server.

Railway documents root-owned volume mounts and suggests `RAILWAY_RUN_UID=0` for non-root-image permission errors. The first deployment failed with `SQLITE_CANTOPEN`. After explicit user approval on 2026-09-08, `RAILWAY_RUN_UID=0` was applied to this dedicated production service. The Dockerfile still defaults to the non-root `node` user; Railway overrides the runtime UID to root so SQLite can use the persistent `/data` volume. Keep that volume across deployments; do not switch payment state to ephemeral storage.

Deployment `08ea13ac-e569-426a-8647-6224843b74fd` succeeded from commit `b5d7f9c`. Public `/health`, `/skill.md`, and `/.well-known/agent.json` returned HTTP 200. A real `/v1/preview/counterparty` request returned HTTP 200 in about 2.1 seconds; this single measurement does not establish p95 latency. `/v1/counterparty` correctly returned HTTP 503 with `PAYMENTS_UNAVAILABLE`. Identity registration remains pending, and no payment or mainnet transaction was sent.

Sources: https://docs.railway.com/volumes ; https://docs.railway.com/networking/public-networking/specs-and-limits .

## AskBots round 1

2026-09-09: Created the separate AskBots CLI builder account using the published 0.2.0 registration implementation and the user's supplied identity. Its generated password and session credentials are stored privately under `.secrets/`, not in Git or Railway. Created unfunded draft `k17ck4pafdpv9zts8svazajt6s8e3ncq` using the CLI's project functions: https://www.askbots.ai/dashboard/k17ck4pafdpv9zts8svazajt6s8e3ncq . The draft requests 10 reviews and excludes both team wallets. It is not funded or active, and no reviews are claimed. Keep both review rounds under this same builder account; a Google-linked AskBots dashboard may be a different account.

The reviewer API key restriction remains `https://www.askbots.ai/api/*`. The CLI's distinct builder session token uses AskBots' own Convex backend for project creation and reads, as returned by `/api/chain` and implemented by the CLI. No reviewer API key or wallet private key is sent to that backend.

Once the public service is reachable, prepare the actual URL and exclude both team wallets:

```sh
PUBLIC_BASE_URL=https://preflight-production-9071.up.railway.app npm run review:prepare
npx askbots@0.2.0 submit --file data/askbots-round-1.json --json
```

That is a dry-run cost preview: 10 reviews cost 1.10 USDT. It does not create, fund or request reviews. Use the same builder account and funding wallet as hackathon registration. Stock `--execute` performs untagged USDT approval/escrow transactions using CELO gas; it is prohibited by this project's tag/USDC-gas policy. A compliant funding flow must be verified before requesting reviews. Do not claim round 1 happened until AskBots confirms a funded project. Never have the reviewer wallet review Preflight.

## Evidence for the next day

Keep real settlement rows in SQLite's `payments` table. Pending rows may have an uncertain on-chain outcome; reconcile before any fresh authorization. Do not delete the database during deployment. Record AskBots findings and the subsequent fixes when real reviews arrive; there are none to invent now.

## Verification recorded on 2026-09-08

- Full check: 29 tests, strict TypeScript check and production build pass.
- Independent code review identified and fixed uncertain same-block funder ordering, incomplete-history negative claims and potential credential-bearing RPC error logging.
- Read-only live smoke passed with v2 fallback: known wallet activity at 2024-03-08 22:36:17 UTC; degraded cold request about 4.3 seconds. The sub-3-second p95 target is not yet established.
- No API keys or private keys were committed. Local wallet directory/file permissions checked as 0700/0600.
