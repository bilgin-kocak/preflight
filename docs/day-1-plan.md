# Preflight Day 1 implementation plan

Goal: a deployable agent-facing Hono API for free and USDC-paid Celo counterparty checks, with conservative evidence and guarded writes.
Spec: ../preflight-spec.md section 9 Day 1, corrected by ../CONFIG.md.
Architecture: Hono routes validate input before payment; providers normalize bounded explorer history; SQLite stores cached observations, quota and durable payment state. Official x402 v2 middleware verifies and settles through Celo. The web process never holds a private key. A separate explicit identity-registration script is the only self-sent transaction path.

## Constraints

Node 22, TypeScript, Hono, viem/Celo, better-sqlite3 and Vitest. Paid request costs 5000 USDC atomic units. Preview 20/day/IP. Every self-sent mainnet transaction requires an issued nonempty tag and USDC adapter feeCurrency. No secrets committed. Only Day 1 routes; no batch, tags check, contract check, attestations, MCP, CLI, report signing or Day 2+ features.

## Steps and acceptance

- [x] Verify live APIs, addresses, SDK signatures, rules and contradictions in CONFIG.md before code.
- [x] Foundation: package/TypeScript setup; src/config.ts, chain.ts, cache.ts. Tests first for missing tag, incorrect feeCurrency, preserving calldata; cache TTL, quota and atomic replay reservation. Run tests, typecheck, commit.
- [x] Providers/check: src/providers/{types,http,history,blockscout,celoscan,index}.ts and src/checks/counterparty.ts. Tests first for incomplete explorer indexes, pagination caps, incoming normal/internal/token funding, project/dominant-funder exclusions, strict cutoff, missing context. Never infer first-ever from latest 500. Cache base observations, never project-dependent verdicts. Run tests, typecheck, commit.
- [x] HTTP/payment: src/{app,x402,index}.ts. Official @x402/hono; validate before gate; reserve nonce atomically before settlement; bind to payer, network, asset and nonce; log successful receipts. Test genuine signed payment with local fake facilitator, no response on invalid settlement, sequential/concurrent replay, provider outage without charge, redacted preview, spoofed forwarded IP, health/discovery/error JSON. Commit.
- [x] Local delivery: README.md, skill.md, Dockerfile, Railway persistent-volume configuration, .env.example, scripts/register-identity.ts and scripts/prepare-review.ts, docs/launch.md. Build/test; read-only mainnet provider smoke; local HTTP smoke; AskBots dry-run; public repository push. Deploy if account permits; verify public endpoints. Record actual blockers without claiming paid launch.

## External prerequisites

Builder connection, identity, official attribution tag and facilitator credentials are configured. AskBots funding still needs a compliant tag/USDC gas path and USDT. Payments remain disabled until activation. Separate agent and reviewer wallet keys remain local and excluded from commits. The user-authorized bootstrap identity transaction used a nonempty Preflight tag and USDC gas; future transactions use the assigned tag. See launch.md for confirmed evidence.

## Actual launch status

- [x] Public repository created and small commits pushed.
- [x] AskBots round-1 dry-run validated: 10 reviews, 1.10 USDT, executed=false.
- [x] Railway project/service/domain/volume created; Docker image built.
- [x] Public deployment: free preview live; user-approved RAILWAY_RUN_UID=0 resolved volume permissions.
- [x] Hackathon draft registered for Tracks 3/4; assigned tag celo_80fe04c6accd saved.
- [x] User funded 4.95 USDC; facilitator key configured; ERC-8004 identity 9826 registered with USDC gas.
- [x] First AskBots round funded for 10 reviews and activated; official-tag/USDC-gas transactions verified.
- [ ] Completed baseline feedback, paid API activation, review-driven improvements and second review round remain pending.
