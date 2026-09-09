# Day 1 launch runbook

Public source: https://github.com/bilgin-kocak/preflight .
Live Railway domain: https://preflight-production-9071.up.railway.app (verified 2026-09-08; free preview active, payments disabled).

## Completed locally

- Verified all explicit VERIFY items and every listed mainnet token/registry on Blockscout; see CONFIG.md for source URLs and contradictions.
- Hono service, providers, conservative checks, SQLite cache/quota/payment ledger, official x402 v2 payment gate.
- Separate agent and reviewer wallets, generated locally. `.secrets/wallets.env` has mode 0600 in a mode-0700 directory. It is ignored by Git, Docker and Railway upload. Do not paste its contents anywhere.
- Agent public address: `0x7a1f16230c5F3fD3b50C435fa93035eE789eE789`.
- Reviewer public address: `0x001bEB8140ce3372646d3197c92F3055694e1E13`.
- User funded 4.95 USDC; identity registration succeeded. No paid API settlements, paid reviews or earnings claimed.
- AskBots CLI dry-run succeeded: `ok=true`, `dryRun=true`, `executed=false`, 10 reviews costing 1.10 USDT.

## Registration completed on 2026-09-09

- ERC-8004 agent: [9826](https://8004scan.io/agents/celo/9826).
- Successful [identity transaction](https://celo.blockscout.com/tx/0x4cac2be5ced21315025027f6d09762a7f4fa63c595eaaf8449046b6a7a746c8d), block 77070483. Registry ownership and token URI were independently read back.
- The first transaction carried user-authorized bootstrap tag `celo_5ffb0641430f`, verified with `verifyTx`, and used the USDC fee adapter. It cost **0.005207 USDC**, leaving **4.944793 USDC** and **0 CELO** immediately afterward.
- Hackathon draft `426158aa-1643-48f1-b21a-855b9478363c` saved successfully and read back with `askbots-growth` primary and `judges-favorite` additional. Both team wallets and the AskBots draft URL are recorded.
- Official `ATTRIBUTION_TAG=celo_80fe04c6accd`, returned by Celo Builders. This must be used for every future self-sent write. The bootstrap transaction does not count under the assigned hackathon tag and cannot be retagged.
- Local configuration contains the assigned tag and `ERC8004_AGENT_ID=9826`; the same public values are configured on Railway. Keys stay local/private. Final hackathon publication and the required real X post are pending.
- Railway configuration deployment `8e9dcc00-ec86-424a-bbd3-f772d23ef10d` succeeded. Live `/health` returned 200; `/.well-known/agent.json` returned identity 9826 with `registration_pending=false`. Payments remain disabled.
- The explicit CIP-64 preparation fix passed all 29 tests, typecheck and production build before signing; the live prepared maximum fee was about 0.00631 USDC, below the unchanged 0.10 USDC cap.

The initial draft save failed because the form requires an ERC-8004 URL before issuing a tag. The user authorized the custom-tag identity transaction to resolve that prerequisite. No fake identity or untagged transaction was used. Private connection and draft records remain under ignored `.secrets/`; do not repeat registration.

## Identity registration

The service hosts `/.well-known/agent.json`, configured with confirmed identity 9826. `AGENT_URI` points to that public URL. Registration is complete: do not execute it again. Never add wallet keys to Railway variables: the identity script runs locally.

```sh
# Reads local .env and .secrets/wallets.env; defaults to unsigned dry-run
npm run register:identity
# Registration already completed; do not repeat --execute.
```

The sole broadcast path explicitly prepares CIP-64 and verifies chain 42220, zero CELO, a nonempty attribution suffix, adapter feeCurrency, simulation, and estimated gas <=0.10 USDC. The local configured tag is now the platform-assigned tag. It saves a prepared hash before broadcast; a repeated invocation refuses automatic resending. After confirmation it checks receipt success, feeCurrency and `verifyTx`, extracts the `Registered` event and prints the 8004scan link. Save `ERC8004_AGENT_ID` in the server environment only after success. A timed-out/failed registration must be reconciled on the explorer; do not delete its state record merely to retry.

## Activate payments

The facilitator API key was created on 2026-09-09 using the agent wallet's off-chain ownership signature, with no transaction or payment. The response granted 20 mainnet and 1000 testnet settlement credits. The key is saved in ignored `.secrets/x402-key.json` and `.env` files with mode 0600, and configured as `X402_API_KEY` in Railway. Do not print or commit those files. Key creation does not require an existing ERC-8004 identity.

Paid activation still requires the registered `AGENT_ADDRESS`, assigned `ATTRIBUTION_TAG`, HTTPS `PUBLIC_BASE_URL` and `PAYMENTS_ENABLED=true`. Payments remain disabled. Keep the durable SQLite volume across deployments. `/health` exposes activation status, never secrets.

Configuration redeployment `ed4000f6-d881-4f09-96cf-c3c3ac38b325` succeeded on 2026-09-09. Public `/health` returned `status=ok` and `payments_enabled=false`. The facilitator account confirmed that the key exists. That pre-funding check showed zero balances; current registration balances are recorded above.

`ETHERSCAN_API_KEY` is optional fallback access, not a requirement for the primary provider. Obtain a V2 key with Celo access through Etherscan; do not assume a legacy Celoscan key works.

## Railway

Dedicated project: `4443da49-4b0f-461e-9fcb-109ac24e8f30`, service `bfe2917c-eff9-4f69-b8f0-e9e7546c4d90`, volume `f3432bc4-4025-48ec-ba58-9edcd22777c0` mounted `/data`.

```sh
railway up --service preflight --detach
```

Deploy only one replica. Set `DATABASE_PATH=/data/preflight.sqlite`, `PORT=3000`, and `TRUST_RAILWAY_PROXY=true` for Railway's documented edge-supplied X-Real-IP. Do not enable that trust setting on a directly exposed Node server.

Railway documents root-owned volume mounts and suggests `RAILWAY_RUN_UID=0` for non-root-image permission errors. The first deployment failed with `SQLITE_CANTOPEN`. After explicit user approval on 2026-09-08, `RAILWAY_RUN_UID=0` was applied to this dedicated production service. The Dockerfile still defaults to the non-root `node` user; Railway overrides the runtime UID to root so SQLite can use the persistent `/data` volume. Keep that volume across deployments; do not switch payment state to ephemeral storage.

Deployment `08ea13ac-e569-426a-8647-6224843b74fd` succeeded from commit `b5d7f9c`. Public `/health`, `/skill.md`, and `/.well-known/agent.json` returned HTTP 200. A real `/v1/preview/counterparty` request returned HTTP 200 in about 2.1 seconds; this single measurement does not establish p95 latency. `/v1/counterparty` correctly returned HTTP 503 with `PAYMENTS_UNAVAILABLE`. At that initial deployment, identity registration was pending. It subsequently completed as recorded above; no paid API settlement has occurred.

Sources: https://docs.railway.com/volumes ; https://docs.railway.com/networking/public-networking/specs-and-limits .

## AskBots round 1

2026-09-09: Created the separate AskBots CLI builder account using the published 0.2.0 registration implementation and the user's supplied identity. Its generated password and session credentials are stored privately under `.secrets/`, not in Git or Railway. Created unfunded draft `k17ck4pafdpv9zts8svazajt6s8e3ncq` using the CLI's project functions: https://www.askbots.ai/dashboard/k17ck4pafdpv9zts8svazajt6s8e3ncq . The draft requests 10 reviews and excludes both team wallets. It is not funded or active, and no reviews are claimed. Keep both review rounds under this same builder account; a Google-linked AskBots dashboard may be a different account.

The reviewer API key restriction remains `https://www.askbots.ai/api/*`. The CLI's distinct builder session token uses AskBots' own Convex backend for project creation and reads, as returned by `/api/chain` and implemented by the CLI. No reviewer API key or wallet private key is sent to that backend.

Once the public service is reachable, prepare the actual URL and exclude both team wallets:

```sh
PUBLIC_BASE_URL=https://preflight-production-9071.up.railway.app npm run review:prepare
npx askbots@0.2.0 submit --file data/askbots-round-1.json --json
```

That is a dry-run cost preview: 10 reviews cost 1.10 USDT. It does not create, fund or request reviews. Use the same builder account and funding wallet as hackathon registration. Stock `--execute` performs untagged USDT approval/escrow transactions using CELO gas; it is prohibited by this project's tag/USDC-gas policy. Never have the reviewer wallet review Preflight.

The local `review:fund` command funds an existing project with exactly 10 review slots (1.10 USDT). Before executing, authenticate to AskBots and confirm ownership, draft status, budget, URL and excluded team wallets; read the Celo Builders draft to match the assigned tag and funding wallet. Recheck the live escrow address, verified implementation and pricing. Then preview:

```sh
ASKBOTS_PROJECT_ID=k17ck4pafdpv9zts8svazajt6s8e3ncq npm run review:fund
```

Only add `-- --execute` for an authorized, not-yet-funded project. The command checks the on-chain project is absent, verifies current escrow token/pricing, approves exactly 1.10 USDT and creates the project. Both transactions use CIP-64, the official tag from `.env`, and the USDC adapter, with a 0.10 USDC maximum gas budget each. It estimates gas units before filling token-denominated fees to avoid Forno's fee-validation issue.

Each signed hash is saved exclusively in ignored `data/askbots-<id>-approve.json` / `-fund.json` before broadcast. Existing records are only reconciled by receipt, never automatically resent. If a project already exists on chain, use its saved transaction to finish platform activation; do not create another project or delete records. After deposit, use the official CLI's `confirmFunding` implementation to send that hash to `https://www.askbots.ai/api/projects/<id>/fund` with the existing builder session. Verify the platform is active before claiming reviews were requested. Funding confirmation is idempotent and does not send another transaction.

## Evidence for the next day

Keep real settlement rows in SQLite's `payments` table. Pending rows may have an uncertain on-chain outcome; reconcile before any fresh authorization. Do not delete the database during deployment. Record AskBots findings and the subsequent fixes when real reviews arrive; there are none to invent now.

## Verification recorded on 2026-09-08

- Full check: 29 tests, strict TypeScript check and production build pass.
- Independent code review identified and fixed uncertain same-block funder ordering, incomplete-history negative claims and potential credential-bearing RPC error logging.
- Read-only live smoke passed with v2 fallback: known wallet activity at 2024-03-08 22:36:17 UTC; degraded cold request about 4.3 seconds. The sub-3-second p95 target is not yet established.
- No API keys or private keys were committed. Local wallet directory/file permissions checked as 0700/0600.
