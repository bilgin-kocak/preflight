# Preflight

Celo counterparty signals for agents before they move money. Built for the Agents at Work hackathon, primary track: AskBots CLI Growth.

**Day 1 implementation.** Free wallet-history preview and a 0.005 USDC check behind x402 v2. Reports expose evidence coverage and return `ambiguous` when funding history or project context is incomplete. These are preflight signals, not an audit or a guarantee of hackathon eligibility.

- [Agent instructions](skill.md)
- [Verified integrations and addresses](CONFIG.md)
- [Launch steps and blockers](docs/launch.md)
- [Build spec](preflight-spec.md)

## Run locally

Requires Node 22+ and npm. SQLite is stored in `data/preflight.sqlite`.

```sh
npm ci
cp .env.example .env
npm run dev
```

```sh
curl http://localhost:3000/health
curl http://localhost:3000/v1/preview/counterparty \
  -H 'Content-Type: application/json' \
  -d '{"address":"0x23Ca5C88009B94aA554dC37beE88517C92f7c07a"}'
```

With default configuration, payments are disabled and the paid route returns an actionable 503. After registration, configure `AGENT_ADDRESS`, `ATTRIBUTION_TAG`, `X402_API_KEY`, a public HTTPS `PUBLIC_BASE_URL`, and `PAYMENTS_ENABLED=true`. The web deployment needs no private key.

## Day 1 routes

| Route | Access |
| --- | --- |
| `GET /health` | Free; provider/RPC health, cache size, last settlement |
| `GET /skill.md` | Free; request and payment instructions |
| `GET /.well-known/agent.json` | ERC-8004 registration document; no invented identity ID |
| `POST /v1/preview/counterparty` | 20 requests/IP/UTC day, no funder or verdict |
| `POST /v1/counterparty` | 5000 native Celo USDC atomic units via x402 v2 |

Send `address`, optional `project_wallets`, `dominant_funders`, and `cutoff`. A likely-independent result requires complete first-funder evidence and explicit project/dominant-funder context. The cutoff defaults to 28 August 2026 00:00 UTC, strictly exclusive for pre-existing activity.

## Payment and transaction policy

The official `@x402/hono` middleware verifies payment, computes the report, then settles before releasing it. Failed checks do not settle. SQLite reserves the payer/asset/network/nonce before settlement; duplicates cannot settle or serve twice. Pending reservations remain pending after a timeout or restart and require manual reconciliation. Day 1 does not recover a paid response lost after settlement.

All self-sent writes go through a nonempty assigned attribution suffix and the verified **USDC fee adapter**. `feeCurrency` must be `0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B`, not the USDC token contract. Identity registration defaults to a dry-run, caps estimated gas at 0.10 USDC, stores its transaction hash before broadcast, checks successful receipt, and calls `verifyTx`. It refuses to proceed without the assigned tag. No mainnet transaction has been sent for this project yet.

The live facilitator's published base fee is $0.004 plus 0.3%, leaving little margin at $0.005. Pricing follows the spec; revenue and prizes depend on real independent usage and judging.

## Verification

```sh
npm run check       # strict typecheck, tests, production build
npm run smoke:live  # read-only Celo RPC and Blockscout check; no signing
```

Tests cover payment signatures, failed settlement, concurrent replay, provider outage without payment, preview redaction/quota, evidence uncertainty, cutoff boundaries and transaction guards. A live smoke observed the known wallet's first activity on 8 March 2024. Cold latency depends on upstream rate limits; results cache for one hour.

## Deploy

Dockerfile and `railway.json` are included. Use one replica and a persistent volume at `/data`; SQLite contains payment replay records and quotas and must survive redeploys. Railway's edge supplies `X-Real-IP`; only set `TRUST_RAILWAY_PROXY=true` there. The Docker image runs as the non-root `node` user. See [launch steps](docs/launch.md) for volume permissions and pending external setup.

Day 2+ features are intentionally absent: signed reports, batch, contract checks, tags endpoint, attestations, MCP, CLI and OpenAPI. The service is an API, with a JSON discovery response at `/`.
