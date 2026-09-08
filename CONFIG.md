# Verified configuration — Preflight Day 1

Checked 2026-09-08 against live sources, before implementation. This file overrides incorrect constants and integration assumptions in preflight-spec.md. No assigned identifiers or credentials are invented. External launch prerequisites below remain blocked; the local service can be built without them.

## Networks and cutoff

- Mainnet: chain ID **42220** (`0xa4ec`), RPC `https://forno.celo.org`; read-only `eth_chainId` returned `0xa4ec`.
- Celo Sepolia: chain ID **11142220** (`0xaa044c`), RPC `https://forno.celo-sepolia.celo-testnet.org`; read-only `eth_chainId` returned `0xaa044c`. No testnet tokens used.
- Source: https://docs.celo.org/build-on-celo/network-overview
- Cutoff: **2026-08-28T00:00:00Z**, Unix **1787875200**. Blockscout `getblocknobytime&closest=before` returns **75974442**, but that block is AT the cutoff, so the last strictly pre-cutoff block is **75974441**. Compare timestamps strictly `< cutoff`. Resolve/cache the boundary at startup; do not assume an inclusive explorer lookup is strictly earlier.
- Sources: https://celobuilders.xyz/hackathons/agents-at-work/timeline ; https://celo.blockscout.com/api?module=block&action=getblocknobytime&timestamp=1787875200&closest=before ; https://celo.blockscout.com/api/v2/blocks/75974442 (00:00:00Z); https://celo.blockscout.com/api/v2/blocks/75974443 (00:00:01Z).

## Tokens and registries

All entries below were fetched from `/api/v2/addresses/{address}` on **celo.blockscout.com**. All report deployed contracts with verified source. Token addresses originate from https://docs.celo.org/tooling/contracts/stablecoin-contracts ; registry addresses from https://docs.celo.org/build-on-celo/build-with-ai/8004 . Only USDC payments, the USDC gas adapter, and the identity registry are used in Day 1; other tokens are research for the explicit VERIFY list, not extra endpoints.

| Asset / registry | Confirmed address | Decimals | Explorer result | Source |
| --- | --- | --- | --- | --- |
| wARS | `0x0DC4F92879B7670e5f4e4e6e3c801D229129D90D` | 18 | contract=True, verified=True | [Blockscout](https://celo.blockscout.com/address/0x0DC4F92879B7670e5f4e4e6e3c801D229129D90D) |
| wMXN | `0x337E7456B420bD3481e7FA61fA9850343d610d34` | 18 | contract=True, verified=True | [Blockscout](https://celo.blockscout.com/address/0x337E7456B420bD3481e7FA61fA9850343d610d34) |
| USDT | `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e` | 6 | contract=True, verified=True | [Blockscout](https://celo.blockscout.com/address/0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e) |
| wPEN | `0x4F34c8b3b5FB6D98Da888F0feA543d4d9C9F2eBE` | 18 | contract=True, verified=True | [Blockscout](https://celo.blockscout.com/address/0x4F34c8b3b5FB6D98Da888F0feA543d4d9C9F2eBE) |
| wCLP | `0x61D450a098b6a7f69fC4b98CE68198fe59768651` | 18 | contract=True, verified=True | [Blockscout](https://celo.blockscout.com/address/0x61D450a098b6a7f69fC4b98CE68198fe59768651) |
| CUSD | `0x765DE816845861e75A25fCA122bb6898B8B1282a` | 18 | contract=True, verified=True | [Blockscout](https://celo.blockscout.com/address/0x765DE816845861e75A25fCA122bb6898B8B1282a) |
| AGENT | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | n/a | contract=True, verified=True | [Blockscout](https://celo.blockscout.com/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432) |
| Reputation registry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` | n/a | contract=True, verified=True | [Blockscout](https://celo.blockscout.com/address/0x8004BAa17C55a88189AE136b182e5fdA19dE9b63) |
| wCOP | `0x8a1D45e102e886510e891d2Ec656a708991e2D76` | 18 | contract=True, verified=True | [Blockscout](https://celo.blockscout.com/address/0x8a1D45e102e886510e891d2Ec656a708991e2D76) |
| USAT | `0xD2ab3C9A02DBBAB236BfEC45D1d755DF4267F771` | 6 | contract=True, verified=True | [Blockscout](https://celo.blockscout.com/address/0xD2ab3C9A02DBBAB236BfEC45D1d755DF4267F771) |
| cNGN | `0xF6829D7393dAe24509eb1E52eE8e572e2E271a4f` | 6 | contract=True, verified=True | [Blockscout](https://celo.blockscout.com/address/0xF6829D7393dAe24509eb1E52eE8e572e2E271a4f) |
| USDC | `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` | 6 | contract=True, verified=True | [Blockscout](https://celo.blockscout.com/address/0xcebA9300f2b948710d2653dD7B07f33A8B32118C) |
| wBRL | `0xD76f5Faf6888e24D9F04Bf92a0c8B921FE4390e0` | 18 | contract=True, verified=True | [Blockscout](https://celo.blockscout.com/address/0xD76f5Faf6888e24D9F04Bf92a0c8B921FE4390e0) |

- cUSD is called **USDm** in current Celo docs; the explorer still reports symbol **CUSD** at the spec's address. Same address, do not substitute another token.
- **USDC feeCurrency = `0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B`**, the USDC fee adapter, NOT the USDC ERC-20 token address. Blockscout reports a verified `FiatTokenProxy` with `FiatTokenFeeAdapterV1` implementation. This is how “feeCurrency set to USDC” is implemented on Celo for 6-decimal USDC.
- Sources: https://docs.celo.org/build-on-celo/fee-abstraction/using-fee-abstraction ; https://celo.blockscout.com/address/0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B .
- Refuse all self-sent mainnet writes unless the assigned tag encodes to a non-empty suffix, decodes to the same registered code, and feeCurrency equals this adapter. No raw wallet sender is exposed by the HTTP service. No mainnet transaction was sent during verification.

## Attribution API (VERIFY resolved)

`@celo/attribution-tags` latest **0.3.0**, npm README read in full.

- `toDataSuffix(code: string | readonly string[]): Hex` — use `toDataSuffix([ASSIGNED_TAG])`.
- `fromDataSuffix(data: Hex): { codes: string[]; schemaId: number } | null` accepts full calldata.
- `verifyTx({ client, hash }): Promise<{ codes: string[]; schemaId: number } | null>` reads transaction calldata; null also represents RPC failure. It does not verify receipt success or gas currency; those need separate checks.
- Issued hackathon tags are `celo_` + 12 hex characters. Never derive a replacement locally. Append suffix to encoded function calldata; do not replace the function selector/arguments.
- Sources: https://www.npmjs.com/package/@celo/attribution-tags ; https://registry.npmjs.org/@celo%2fattribution-tags ; https://celobuilders.xyz/skill.md .

## x402 (VERIFY resolved)

- Dashboard: https://x402.celo.org (SPA, fetched and its current dashboard bundle read).
- Mainnet facilitator: **https://api.x402.celo.org**. Standard `POST /verify`, `POST /settle`, `GET /supported`, `GET /health`. `/settle` requires **X-API-Key**; reads and verification are open.
- `/supported` live response: v1 `exact/celo`, v2 `exact/eip155:42220`; no extensions. Use v2 and the official scoped **@x402/hono**, **@x402/core**, **@x402/evm** packages. The spec's unscoped `x402-hono` and `X-PAYMENT` examples are v1-era; v2 headers are **PAYMENT-REQUIRED**, **PAYMENT-SIGNATURE**, **PAYMENT-RESPONSE**.
- Adapter: `HTTPFacilitatorClient({url, createAuthHeaders})`, returning `{verify: headers, settle: headers, supported: headers}`. Register `ExactEvmScheme` for `eip155:42220`.
- Explicit USDC price: `{ amount: "5000", asset: USDC, extra: { name: "USDC", version: "2" } }`, `scheme: exact`, network `eip155:42220`, `payTo` = registered agent wallet. 5000 atomic units = $0.005. Avoid dollar shorthand on Celo.
- USDT and USA₮ **are supported**, confirmed by the dashboard's live `/api/config` and token registry in its served JS bundle. USDT domain = `Tether USD` / `1`; USA₮ = `Tether America USD` / `1`; both 6 decimals. Celo's prose x402 docs list only USDC/USDT and lag the dashboard. Day 1 accepts USDC only, as the default specified.
- Key creation: connect agent wallet at dashboard, Create API key, sign an off-chain message, securely save one-time key as `X402_API_KEY`. Dashboard uses `GET /api/keys/nonce`, then signed `POST /api/keys` with `{address,nonce,signature}`. No on-chain transaction needed for key creation.
- Live pricing `/api/config`: **pricePerTxMicro=4000 ($0.004)**, **feeBps=30 (0.3%)**, free credits **20 mainnet / 1000 testnet**. This contradicts the $0.001 example in prose docs; use current dashboard values when budgeting. At $0.005, margin before hosting/provider cost is at most about $0.000985 if both charges apply. No revenue or prize guarantee.
- Thirdweb is a documented alternate facilitator, but Day 1 uses Celo only for hackathon attribution. No unverified fallback billing API is implemented.
- Sources: https://docs.celo.org/build-on-celo/build-with-ai/x402 ; https://api.x402.celo.org/supported ; https://x402.celo.org/api/config ; https://x402.celo.org/assets/index-7TQsUzcD.js ; https://github.com/coinbase/x402/tree/main/typescript/packages/http/hono .

## Explorer/provider API

- Blockscout primary: `https://celo.blockscout.com/api/v2/addresses/{address}`, `/counters`, `/transactions`, `/token-transfers`. Cursor responses use `items` and `next_page_params`; recent pages alone cannot establish first-ever funding.
- Use documented Etherscan-compatible Blockscout `/api?module=account&action=txlist|tokentx|txlistinternal&address=...&sort=asc&page=1&offset=...` for oldest observations. Live probe confirmed all three shapes. `txlistinternal` may return status **2** with an explicit incomplete-indexing message: preserve uncertainty; never turn that into empty history or a confident independent verdict.
- Bound each history stream to 500 rows. Report coverage and lower bounds; partial histories are not complete first-funder evidence. Only complete first-funder facts may be cached indefinitely.
- Celoscan fallback uses unified Etherscan V2 `https://api.etherscan.io/v2/api?chainid=42220&...&apikey=...`. Needs an Etherscan V2 key with Celo access; the spec's `CELOSCAN_API_KEY` env name is retained as an alias. A legacy Celoscan key is not assumed compatible.
- Sources: https://celo.blockscout.com/api-docs ; https://celo.blockscout.com/api?module=account&action=txlist&address=0x23Ca5C88009B94aA554dC37beE88517C92f7c07a&sort=asc&page=1&offset=2 ; https://docs.etherscan.io/api-reference/endpoint/txlist ; https://docs.etherscan.io/supported-chains .

## Hackathon and registration

- Live event slug **agents-at-work**. Counting starts **2026-08-28 00:00 UTC**; deadline **Monday 2026-09-14 09:00 UTC (12:00 Istanbul)**. The spec's weekday labels are wrong: Sep 8 is Tuesday, Sep 12 Saturday, Sep 13 Sunday, Sep 14 Monday. Farming scan: **Friday Sep 11 09:00 UTC**.
- Primary track slug **askbots-growth**. Round 1 minimum **10 reviews**, round 2 measured above an absolute floor; deliberately weakening the baseline is not a winning strategy. Additional track **judges-favorite** rationale from spec.
- First-funder exclusions include **the project's dominant funder**, omitted by the spec's simple verdict pseudocode. Accept optional explicit dominant-funder context; missing context and incomplete evidence stay ambiguous. Known protocol and own-contract exclusions require confirmed addresses; do not guess a protocol allowlist on Day 1.
- Registration: list `/hackathons`, read `/hackathons/agents-at-work/submission-fields`, Google `/auth/google/start` → builder sign-in → `/auth/google/claim`; credential used for `PUT /submissions/me`. Returned `attributionTag` is authoritative. Public GitHub repo required at registration.
- Current registration-required custom fields: **telegram, primaryTrack, erc8004Url, agentWalletAddress**. Country is optional. Reviewer wallets declared at registration if used. `askbotsProjectUrl` needed for Track 3 participation. No fake values submitted.
- **Confirmed registration conflict:** form requires existing ERC-8004 identity before issuing tag; spec requires tag before creating identity. `/hackathons/agents-at-work/ask` returned FAQ text but no resolution. Requires an existing valid agent identity or organizer clarification; no untagged bootstrap transaction or invented ID/tag is permitted.
- Registration and deployment are external launch steps, not completed by writing local files. Funding requires actual funds supplied by the builder. The spec's ~$15 USDC wallet funding is not a transfer authorization from any discovered wallet.
- Sources: https://celobuilders.xyz/skill.md ; https://celobuilders.xyz/hackathons ; https://celobuilders.xyz/hackathons/agents-at-work/submission-fields ; https://celobuilders.xyz/hackathons/agents-at-work/rules ; https://celobuilders.xyz/hackathons/agents-at-work/tracks ; https://celobuilders.xyz/hackathons/agents-at-work/faqs ; https://celobuilders.xyz/hackathons/agents-at-work/timeline .
- Supplied Notion landing page was unavailable to the text fetcher; live event API links that exact page and supplies the rules used above: https://celoplatform.notion.site/Agents-at-Work-Hackathon-3c1d5cb803de81139de7f4f3d09e55dc .

## AskBots (VERIFY resolved)

- Required skill https://www.askbots.ai/skill.md and docs https://www.askbots.ai/docs fetched/read. Their canonical API host is **https://askbots.ai/api**, not www; avoid cross-host redirects stripping Bearer auth.
- Reviewer: `POST /auth/openclaw` with name/description → one-time API key; `/bot-profiles` accepts `botName,country,skills,celoAddress`; never send private keys. Separate declared reviewer wallet; never reviews Preflight.
- Builder CLI **askbots@0.2.0**. `npx askbots help`; `ASKBOTS_PASSWORD` env for `login --email`; `submit --file <path> --json` validates/prices without spending. Schema: `name,propertyType,propertyUrl,budget,skillFilters,locationFilters,questions`, optional `excludedBotWallets`. `budget=10` costs **1.10 USDT**, not USDC.
- **Do not run stock `submit --execute`:** it signs USDT approval + escrow funding transactions with CELO gas and documents no attribution-tag/USDC-fee support. This violates the user's guard. Prepare a dry-run round-1 document; funding needs a separately verified compliant path. Gasless dashboard funding does not establish tagged self-paid USDC gas either.
- Reviewer auth API is not builder auth. Do not invent builder REST endpoints from the reviewer docs.
- Sources: https://askbots.ai/skill.md ; https://askbots.ai/docs ; https://www.npmjs.com/package/askbots ; https://registry.npmjs.org/askbots .

## Launch state

No tag, identity ID, paid reviews, settlement, funding transfer or public URL is claimed until it actually exists. No secrets belong in this file. Day 1's signed reports, batch, contract checks, tags endpoint, attestation contract, CLI and MCP are deferred per section 9 (Days 2–4).

## Additional Day 1 integration checks

- Identity registry `register(string)` and `Registered(uint256 indexed agentId,string agentURI,address indexed owner)` confirmed from its verified implementation ABI: https://celo.blockscout.com/api/v2/smart-contracts/0x7274e874CA62410a93Bd8bf61c69d8045E399c02 ; proxy mapping confirmed at https://celo.blockscout.com/api/v2/smart-contracts/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 . No implementation address is a transaction destination.
- Current registration JSON uses `type: https://eips.ethereum.org/EIPS/eip-8004#registration-v1`, `services`, `x402Support`, and `registrations`; empty registrations explicitly denotes the pending local identity. Source: https://eips.ethereum.org/EIPS/eip-8004 .
- Railway supplies `X-Real-IP` at its public edge. Trust enabled only for Railway deployment. Source: https://docs.railway.com/networking/public-networking/specs-and-limits . Its volumes mount root-owned; the documented root override was rejected by automatic approval review and not applied. Source: https://docs.railway.com/volumes .
