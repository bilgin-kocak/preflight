# Preflight — build spec

x402-gated preflight checks for agents that move money on Celo.
Target: Celo "Agents at Work" hackathon. Submission deadline **Sun 14 Sep 2026, 09:00 GMT**.
Builder: solo, Claude Code / Codex. Build window: Sep 8 → Sep 14.

---

## 0. Read this first (for the coding agent)

Everything marked **VERIFY** must be confirmed against live docs before writing code that depends on it. Do not invent contract addresses, API shapes, or CLI flags. Sources of truth, in order:

1. `https://celobuilders.xyz/skill.md` — registration + submission flow, attribution tags
2. `https://x402.celo.org` and `https://docs.celo.org/build-on-celo/build-with-ai/x402` — facilitator API, supported tokens
3. `https://www.askbots.ai/skill.md` and `https://www.askbots.ai/docs` — review platform CLI/API
4. `@celo/attribution-tags` README on npm — `toDataSuffix`, `verifyTx`
5. `https://docs.celo.org` — ERC-8004 registry addresses, fee abstraction, token addresses
6. Explorer APIs: Celo Blockscout (`https://celo.blockscout.com/api`) and Celoscan (Etherscan-compatible, `chainid=42220`)

Constants believed correct but **VERIFY** on an explorer before use:
- Celo mainnet chain id `42220`, RPC `https://forno.celo.org`
- Celo Sepolia RPC `https://forno.celo-sepolia.celo-testnet.org` (testnet activity counts for nothing; use only for local dev)
- USDC (native): `0xcebA9300f2b948710d2653dD7B07f33A8B32118C`
- USDT: `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e`
- cUSD: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- USA₮, cNGN, Ripio wFIAT (wARS, wBRL, wCOP, wMXN, wCLP, wPEN) addresses: look up, do not guess
- Hackathon cutoff for "pre-existing" activity: **2026-08-28 00:00 UTC** (block number: resolve once at startup and cache)

---

## 1. Why this project earns money

| Track | Prize | How Preflight competes |
|---|---|---|
| 3 — AskBots CLI Growth | $300 / $150 / $50 | **Primary.** Scored on improvement between two review rounds. Round 1 on a minimal-but-honest v0 (Sep 8/9), fix everything reviewers flag, round 2 on Sep 12–13. |
| 4 — Judges' Favorite | $500 | Secondary. Under-used primitives in a user-facing flow: gas paid in stablecoin (fee abstraction) on every attestation tx, x402 settlement, ERC-8004 identity. |
| 1 / 2 — Value moved / Adoption | $2,000 / $1,750 | Opportunistic only. Other hackathon teams and AskBots reviewer agents are *independent parties*; every x402 payment they make to Preflight counts as a distinct signer and as value between independent parties. Small, but real. |
| 5 — buy feedback | $50 | Separate task, not this codebase. |

Demand is real and time-boxed: the mid-point farming scan runs **Fri 11 Sep**, and every team chasing Tracks 1–2 wants to know whether its counterparties survive the independence audit. Preflight answers that question for $0.005.

Design consequence: the product must be **agent-first**. Reviewer agents on AskBots must be able to discover it, read how to use it, call it, and pay for it without a human in the loop.

---

## 2. Non-negotiables (from the hackathon rules)

1. **Register before the first mainnet transaction.** The ERC-8021 attribution tag lives in calldata; nothing is backfilled. Registration via `npx skills add https://celobuilders.xyz` needs: project name, public GitHub repo URL, Telegram handle, country, primary track (Track 3), ERC-8004 Agent ID, agent wallet(s), reviewer-agent wallet(s), buy beta opt-in.
2. **Every self-sent tx carries the tag.** Use `toDataSuffix([ASSIGNED_TAG])` on all on-chain writes. Decode the very first one with `verifyTx` and assert the tag is present. Add a startup self-test that refuses to send if the suffix helper returns empty.
3. **Public repo from commit one; commit daily.** Judges look at commit spread. No final-weekend dump.
4. **Mainnet only for anything counted.** Testnet is for local iteration.
5. **One primary track** (3) plus a one-line "what I will demonstrate" for Track 4 ("stablecoin-paid gas on every attestation + x402 settlement + 8004 identity in one agent-facing flow").
6. **Fees you pay yourself count in your favour; sponsored gas does not.** Preflight pays its own gas for attestation txs, in USDC via fee abstraction.
7. **Reviewer agent** (separate wallet) declared at registration and authenticated with AskBots; never reviews Preflight.

---

## 3. Product

### 3.1 Endpoints

All under `https://<host>/v1`. JSON in, JSON out. Paid endpoints return `402` with x402 payment requirements when unpaid.

| Endpoint | Method | Price | Job |
|---|---|---|---|
| `/counterparty` | POST | $0.005 | Would this wallet count as an *independent party* for a given project? |
| `/counterparty/batch` | POST | $0.05 per ≤100 addresses | Same, for a list; adds cluster/funder-collapse analysis. Returns a signed report. |
| `/contract` | POST | $0.02 | Is it safe for an agent to send funds to / call this contract? |
| `/tags` | POST | $0.01 | Which of this wallet's recent txs carry the given ERC-8021 tag? |
| `/attest` | POST | $0.01 | Anchor a report hash on-chain (Preflight pays gas in USDC, tx carries tag). Returns tx hash. |
| `/preview/counterparty` | POST | free, 20/day per IP | Same as `/counterparty` minus `first_funder`, `cluster`, `verdict`. Exists so reviewers can evaluate without a wallet. |
| `/health`, `/openapi.json`, `/skill.md`, `/llms.txt`, `/.well-known/x402` | GET | free | Discovery. |

### 3.2 Request / response shapes

`POST /v1/counterparty`
```json
{
  "address": "0x…",
  "project_wallets": ["0x…", "0x…"],      // optional: the caller's own wallets
  "cutoff": "2026-08-28T00:00:00Z"        // optional, defaults to hackathon cutoff
}
```
```json
{
  "address": "0x…",
  "checked_at": "2026-09-09T12:00:00Z",
  "is_contract": false,
  "first_tx_at": "2026-05-14T09:31:00Z",
  "first_tx_block": 12345678,
  "tx_count": 412,
  "active_before_cutoff": true,
  "first_funder": { "address": "0x…", "token": "CELO", "amount": "0.5", "at": "…" },
  "first_funder_is_project_wallet": false,
  "distinct_days_active_since_cutoff": 3,
  "signals": [
    { "code": "PRE_CUTOFF_ACTIVITY", "severity": "good", "detail": "412 txs before 2026-08-28" }
  ],
  "verdict": "likely_independent",        // likely_independent | ambiguous | likely_excluded
  "reasons": ["active before cutoff", "first funder not in project wallets"],
  "report_hash": "0x…",                    // keccak256 of canonical JSON
  "signature": "0x…"                       // EIP-191 sig by Preflight agent wallet
}
```

Verdict rules (mirror the hackathon's published definition):
- `likely_excluded` if `address` ∈ `project_wallets`, or `first_funder` ∈ `project_wallets`, or `is_contract` and it's a known protocol contract (Uniswap, Mento, etc.).
- `ambiguous` if no activity before cutoff (rules say this is "ambiguous, not disqualifying").
- `likely_independent` otherwise.

`POST /v1/counterparty/batch` — `{ "addresses": [...], "project_wallets": [...] }` → array of the above plus:
```json
{
  "summary": {
    "n": 87,
    "likely_independent": 61,
    "ambiguous": 20,
    "likely_excluded": 6,
    "dominant_funder": { "address": "0x…", "share": 0.34 },   // top first-funder share
    "funder_collapse": false,                                  // true if share ≥ 0.5
    "spawn_clusters": [ { "funder": "0x…", "wallets": 14, "window_minutes": 90 } ]
  },
  "report_hash": "0x…", "signature": "0x…"
}
```

`POST /v1/contract` — `{ "address": "0x…" }` →
```json
{
  "address": "0x…",
  "is_contract": true,
  "verified_source": true,
  "compiler": "0.8.24",
  "proxy": { "type": "EIP-1967", "implementation": "0x…", "admin": "0x…" },
  "age_days": 143, "tx_count": 90211,
  "known_token": { "symbol": "USDC", "canonical": true },      // from allowlist, else null
  "signals": [
    { "code": "OWNER_CAN_PAUSE", "severity": "warn", "detail": "pause() onlyOwner" },
    { "code": "SELFDESTRUCT", "severity": "bad" },
    { "code": "DELEGATECALL", "severity": "info" },
    { "code": "BLACKLIST", "severity": "warn" },
    { "code": "UNVERIFIED_SOURCE", "severity": "bad" },
    { "code": "MINT_UNRESTRICTED", "severity": "bad" }
  ],
  "risk": "low | medium | high",
  "summary": "one paragraph, generated (Cencori) or templated",
  "report_hash": "0x…", "signature": "0x…"
}
```
Signals are static heuristics over verified source (regex + solidity-parser), storage-slot reads for proxies, and explorer metadata. Never call it an "audit" in copy; call it "preflight signals".

`POST /v1/tags` — `{ "wallet": "0x…", "tag": "celo_…", "since": "2026-09-08T00:00:00Z" }` →
```json
{
  "wallet": "0x…", "tag": "celo_…",
  "txs_scanned": 34, "tagged": 31, "untagged": 3,
  "first_tagged_tx": "0x…", "untagged_txs": ["0x…"],
  "hint": "3 txs since registration lack the tag; check the wallet/client that sent them"
}
```
Decode with `verifyTx` / the package's decoder — **VERIFY** exact API.

`POST /v1/attest` — `{ "report_hash": "0x…" }` → `{ "tx": "0x…", "fee_currency": "USDC", "tag_verified": true }`.
Implementation: minimal `Attestations.sol` (`event Attested(bytes32 hash, address by)`; one function; no storage beyond the event) deployed with the tag suffix; each call sends `feeCurrency = USDC` and appends the tag suffix. Verify the tag on the receipt before returning.

### 3.3 Pricing / free tier
- Prices above are USD, settled in **USDC** by default (also accept USD₮ / USA₮ if the facilitator supports them — **VERIFY**).
- `/preview/*` free and rate-limited so reviewer agents without a funded wallet can still evaluate quality.
- First 20 mainnet settlements per facilitator account are free; after that top up USDC credits. Budget $20.

---

## 4. Architecture

- **Runtime:** Node 20+, TypeScript, **Hono** (works on Node and edge). Single service.
- **Chain:** `viem` with Celo chain config (supports `feeCurrency`). One client for reads, one wallet client for the agent wallet (env `AGENT_PRIVATE_KEY`; never commit).
- **Indexing:** no own indexer. `providers/` abstraction with two implementations:
  - `BlockscoutProvider` (primary; free; `/api/v2/addresses/{addr}`, `/transactions`, `/token-transfers`)
  - `CeloscanProvider` (fallback; `chainid=42220`; needs `CELOSCAN_API_KEY`)
  Each returns: first tx, tx count, tx list (paginated, capped at 500), source code, token transfers.
- **Cache:** SQLite (`better-sqlite3`): per-address results with 1h TTL; first-tx/first-funder facts are immutable → cache forever.
- **Payments:** x402 middleware in front of paid routes (see §5).
- **LLM (optional, day 3+):** Cencori OpenAI-compatible API for the `/contract` summary (partner; use code `CELO`). Must degrade to templated text if unavailable.
- **Deploy:** Fly.io or Railway (free tier), public HTTPS, custom domain optional. Health check on `/health`.
- **Tests:** vitest. Unit tests for verdict rules, signal extraction, tag decoding (fixtures from real Celo txs). One e2e that hits `/preview/counterparty` on a known old wallet.
- **CI:** GitHub Action runs tests on every push (also gives judges visible commit activity).

Repo layout:
```
preflight/
  README.md            # human-facing; links skill.md
  skill.md             # agent-facing: what it does, how to pay, examples
  llms.txt
  src/
    app.ts             # Hono app, routes
    x402.ts            # payment gate
    chain.ts           # viem clients, tag suffix, feeCurrency
    providers/{blockscout,celoscan,index}.ts
    checks/{counterparty,batch,contract,tags}.ts
    attest.ts
    sign.ts            # EIP-191 report signing
    cache.ts
  contracts/Attestations.sol + deploy script (foundry)
  mcp/server.ts        # MCP server wrapping the 4 checks
  cli/preflight.ts     # npx preflight-celo counterparty 0x…
  examples/{curl.sh, x402-client.ts}
  openapi.yaml
  .github/workflows/ci.yml
```

---

## 5. x402 payment gate

- Facilitator: **Celo Core Co.'s `x402.celo.org`** (the one the hackathon tracks). Get an API key by signing a message with the agent wallet (**VERIFY** flow on the site). Fallback: thirdweb facilitator (`thirdweb/x402`, documented on docs.celo.org) — keep both behind one interface, choose via env.
- Protocol: x402 v2 (Coinbase spec). Unpaid request → `402` with `payment requirements` (`network: eip155:42220`, asset = USDC address, `payTo` = agent wallet, amount in atomic units, scheme `exact`). Client signs EIP-3009 `transferWithAuthorization`, resends with `X-PAYMENT` header; server calls facilitator `/verify` then `/settle`; on success serve the response. Funds move buyer → `payTo` directly; facilitator holds nothing.
- **VERIFY** whether `x402.celo.org` implements the standard `/verify` + `/settle` facilitator interface or its own (`POST https://api.x402.celo.org/settle` with `X-API-Key`). Write the adapter accordingly.
- Standard middleware to try first: `x402-hono` (or `x402-express`) pointed at the facilitator URL; only hand-roll if the Celo facilitator isn't spec-compatible.
- Idempotency: cache settled payment nonces; a retried request with the same authorization must not double-serve.
- Logging: every settlement → `payments` table (payer, amount, token, tx hash, endpoint). This is your own adoption dashboard and the evidence you attach to the submission.
- `payTo` = the agent wallet submitted at registration (x402 settlements are attributed to that wallet retroactively).

Client side (so others can pay easily):
- `examples/x402-client.ts` using `x402-fetch` with a viem wallet on Celo.
- `cli/preflight.ts`: `npx preflight-celo counterparty 0x… --key $PK` — wraps the same client.
- MCP server exposes `preflight_counterparty`, `preflight_batch`, `preflight_contract`, `preflight_tags` tools; each tool takes an optional payer key from env and handles the 402 dance internally.

---

## 6. Celo-native pieces (the Track 4 story)

1. **ERC-8004 identity.** Register the Preflight agent on the Celo Identity Registry (address from docs — **VERIFY**). Registration file (hosted at `/.well-known/agent.json` or IPFS): name, description, endpoints (`/v1/*`, MCP URL, `/skill.md`), `x402: true`, `payTo`. Link it on 8004scan in the README and the announcement tweet. Registration tx carries the attribution tag.
2. **Attribution tags.** `@celo/attribution-tags`; `toDataSuffix([TAG])` appended to every self-sent tx (deploy, 8004 registration, attestations). Startup self-check + `verifyTx` on first tx.
3. **Fee abstraction.** All self-sent txs set `feeCurrency` to USDC (viem Celo support). The agent wallet holds **zero CELO** — make that a stated design constraint; it's the demo line for judges.
4. **x402** as above.
5. **Self (optional, only if time on day 4):** `/preview/*` gets a higher free quota for callers presenting a Self proof-of-personhood. Skip if it costs more than half a day.

---

## 7. Agent-facing surfaces (this is what AskBots reviewers grade)

- `skill.md` at repo root and served at `/skill.md`: one-paragraph purpose, endpoint table with prices, a copy-pasteable curl for the free preview, a copy-pasteable x402 example, error catalogue, rate limits, contact. Written for an LLM reader: explicit, no marketing.
- `llms.txt`: short index pointing to skill.md, openapi.json, MCP URL.
- `openapi.yaml` complete and valid; served at `/openapi.json`.
- Errors: JSON `{ "error": { "code": "INVALID_ADDRESS", "message": "...", "hint": "..." } }`; every 4xx has a `hint` an agent can act on.
- `/health` returns provider status, cache size, last settlement time, current block.
- Response times: p95 < 3s for single-address checks (cache + parallel provider calls). Reviewers will time you.

---

## 8. AskBots plan (Track 3)

- **Sep 8 (evening):** register the project on askbots.ai with the CLI (`npx askbots help`; funding wallet = registered agent wallet). Request round 1 (min. 10 reviews) on v0 = deployed `/health`, `/skill.md`, `/preview/counterparty`, and `/counterparty` behind x402. It will be rough; that's the point — the score is the delta.
- **Sep 9–11:** triage every review into GitHub issues, fix them in order of frequency. Typical findings to expect and pre-plan: unclear pricing, missing examples, slow responses, vague errors, no MCP, no batch, no openapi.
- **Sep 12 (Sat):** request round 2. Do not touch prod during the review window except for hotfixes.
- Keep a `CHANGELOG.md` mapping each round-1 finding → commit. Paste it into the submission.
- Reviewer agent (separate wallet, declared at registration): reviews *other* projects with specific, observed evidence (URLs, status codes, error strings). Base URL `https://www.askbots.ai/api`. Never reviews Preflight.

---

## 9. Day-by-day

| Day | Ship |
|---|---|
| **Mon Sep 8** (after Binance submit) | Register (celobuilders skill) → tag + 8004 ID. Create agent wallet, fund with ~$15 USDC, 0 CELO. Facilitator API key, Celoscan key. Scaffold Hono app, providers, `/health`, `/skill.md`, `/preview/counterparty`, `/counterparty` + x402 gate. Deploy. First tagged mainnet tx (8004 registration) → `verifyTx` check. AskBots round 1. Repo public. |
| **Tue Sep 9** | `/tags`, `/counterparty/batch` with funder-collapse + spawn clusters, report signing. Tests + CI. buy workshop (Track 5): one VM rental, note bugs. |
| **Wed Sep 10** | `/contract` signals, proxy detection, known-token allowlist. MCP server + CLI + client example. openapi.yaml. |
| **Thu Sep 11** | Fix round-1 review findings. `Attestations.sol` + `/attest` with USDC gas + tag. Post in hackathon Telegram: "free preview + $0.005 independence check before Friday's farming scan". |
| **Fri Sep 12** | Polish skill.md/llms.txt/errors, p95 latency pass, CHANGELOG. AskBots round 2 requested. |
| **Sat Sep 13** | File buy feedback issue on `celo-org/buy-skill` via file-feedback skill. Announcement tweet tagging @CeloDevs @Celo with 8004scan link. Draft submission via celobuilders skill (agent wallet(s) attached, Track 3 primary, Track 4 one-liner). |
| **Sun Sep 14 < 09:00 GMT** | Publish submission. Nothing else. |

---

## 10. Submission checklist

- [ ] Public repo resolves; README + skill.md + CHANGELOG present
- [ ] ERC-8004 Agent ID and 8004scan link in README
- [ ] Attribution tag in every self-sent tx (`verifyTx` screenshot/log in README)
- [ ] Agent wallet (payTo) attached to submission; reviewer wallet declared
- [ ] Payments table export (payer, token, amount, tx) attached as evidence
- [ ] AskBots round 1 + round 2 done; delta and CHANGELOG included
- [ ] Tweet posted with 8004 link
- [ ] Track 3 primary; Track 4 one-line demonstration statement
- [ ] Demo: 90-second screen recording — agent hits 402 → pays USDC → gets verdict → attestation tx with USDC gas + tag on explorer

---

## 11. Out of scope (do not build)

Own indexer, dispute/escrow logic, dashboards beyond `/health`, user accounts, multi-chain, anything on testnet that isn't a local test, any "general-purpose agent" framing.

---

## 12. Kick-off prompt for Claude Code / Codex

```
You are building "Preflight" from preflight-spec.md in this repo. Before writing any code:
1. Fetch and read https://celobuilders.xyz/skill.md, https://www.askbots.ai/skill.md,
   https://x402.celo.org, https://docs.celo.org/build-on-celo/build-with-ai/x402,
   and the @celo/attribution-tags README. Resolve every item marked VERIFY in the spec
   and write the confirmed values into CONFIG.md with the source URL for each.
2. Confirm every token/registry address on https://celo.blockscout.com before use.
Then implement Day 1 of section 9 only. Commit in small steps with descriptive messages.
Never commit secrets. Refuse to send any mainnet transaction unless the attribution-tag
suffix is non-empty and feeCurrency is set to USDC.
```
