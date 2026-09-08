# Preflight — Celo counterparty signals (Day 1)

Preflight checks public Celo activity and funding evidence before an agent interacts with a wallet. It returns heuristic signals and, on the paid route, a context-dependent independence verdict. It is not a security audit, a guarantee of independence, or an organizer's eligibility decision. Incomplete indexing, missing project context and unidentified contracts produce `ambiguous`.

Base URL: `{{BASE_URL}}`. Celo mainnet only (`eip155:42220`). Read `/health` first: `payments_enabled=false` means the free preview is available but paid requests return 503. No account or wallet is needed for preview. Do not send private keys to this API.

| Method | Path | Price | Result |
| --- | --- | --- | --- |
| GET | `/health` | Free | Provider/RPC status, cache size, last settlement, payment activation |
| GET | `/skill.md` | Free | This documentation |
| POST | `/v1/preview/counterparty` | Free, 20/IP/UTC day | Activity signals without funder or verdict |
| POST | `/v1/counterparty` | 0.005 USDC (5000 atomic units) | Activity, observed first funder, coverage and verdict |

## Preview

```sh
curl -sS '{{BASE_URL}}/v1/preview/counterparty' \
  -H 'Content-Type: application/json' \
  -d '{"address":"0x23Ca5C88009B94aA554dC37beE88517C92f7c07a"}'
```

JSON fields: `address` (required nonzero 20-byte EVM address), `project_wallets` (optional array of up to 100 project-controlled addresses), `dominant_funders` (optional array of up to 100 addresses), `cutoff` (optional past ISO-8601 timestamp; default `2026-08-28T00:00:00Z`). Send `dominant_funders: []` only if you know there is no dominant funder to exclude; omission explicitly means unknown. Unknown fields are rejected. Body limit 16 KiB.

No project wallets or no dominant-funder context means an ambiguous paid verdict. A caller declaring empty context cannot establish independence. Declared wallets are not independently verified, and undisclosed common control may remain undetected. Known own addresses are excluded even with incomplete explorer coverage. First-funder exclusions require complete evidence.

## Pay with x402 v2

1. POST the same body to `/v1/counterparty`.
2. Unpaid response is HTTP 402 with base64 JSON in `PAYMENT-REQUIRED`. Check that the offered network is `eip155:42220`, the asset is Celo native USDC `0xcebA9300f2b948710d2653dD7B07f33A8B32118C`, and the amount is `5000`. Use the advertised payTo; never copy an example wallet as the recipient.
3. Use an x402 v2 client to sign the EIP-3009 payment off-chain and retry with `PAYMENT-SIGNATURE`. Domain: `USDC`, version `2`, chainId `42220`. The facilitator submits the payment and pays its gas.
4. A successful response includes the report and `PAYMENT-RESPONSE` settlement receipt. USDC goes directly from buyer to registered payTo.

Example with official packages (`npm install @x402/core @x402/evm @x402/fetch viem`), running locally with your key in an environment variable:

```ts
import { x402Client } from '@x402/core/client';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { wrapFetchWithPayment } from '@x402/fetch';
import { privateKeyToAccount } from 'viem/accounts';
const client = new x402Client();
registerExactEvmScheme(client, {
  signer: privateKeyToAccount(process.env.PAYER_PRIVATE_KEY as `0x${string}`),
  networks: ['eip155:42220'],
});
const paidFetch = wrapFetchWithPayment(fetch, client);
const response = await paidFetch('{{BASE_URL}}/v1/counterparty', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address: '0x23Ca5C88009B94aA554dC37beE88517C92f7c07a' }),
});
console.log(response.status, await response.json());
```

Never retry a possibly settled authorization blindly. Preflight stores nonce reservations before settlement; the same payer/asset/network/nonce cannot settle or serve twice, including concurrent requests and restarts. HTTP 409 means it was already attempted. If a settlement times out, it stays pending for manual reconciliation. Check the USDC authorization/transaction before signing a new payment. There is no automatic refund or paid-result recovery in Day 1.

## Evidence and errors

`first_tx_at` is the earliest successful activity observed across normal transactions, token transfers and internal transfers; it may be an incoming transfer rather than a signed transaction. `active_before_cutoff` is true only for observed timestamps strictly before cutoff. Funding ignores zero-value, failed, self and mint-origin transfers; token identity labels come from explorer metadata and are not an allowlist. The history cap is 500 records per stream. If legacy oldest-history access fails, the service falls back to Blockscout v2 observations and marks full-history/first-funder coverage incomplete. Recent days may be a lower bound. Read `coverage` before interpreting a result. Data is cached for one hour; `observed_at` shows its age. The immutable-facts cache accepts only complete history evidence.

Errors are `{ "error": { "code": "...", "message": "...", "hint": "..." } }`.

| Status | Meaning / action |
| --- | --- |
| 400 | Invalid JSON, address/context/cutoff or payment; fix the request using `hint` |
| 402 | Payment needed, invalid, or unconfirmed; read protocol headers and reconcile any attempted settlement |
| 404 | Unknown route; use the table above |
| 409 | Authorization already attempted; reconcile before any new payment |
| 413 | Body too large; stay under 16 KiB |
| 429 | Preview quota exhausted; `Retry-After` gives seconds until midnight UTC |
| 503 | Explorer/RPC unavailable or payments not activated; inspect `/health` and retry later |

Day 1 does not expose batch, contract, tags, attest, signing, MCP, CLI or OpenAPI. Reports are unsigned. Contact and issues: https://github.com/bilgin-kocak/preflight/issues .
