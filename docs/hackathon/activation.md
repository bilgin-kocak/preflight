# Paid activation checklist

Production payments were activated and verified on 2026-09-09. Source revision `62925e1` deployed successfully as Railway release `8e991c8e-2012-4eb0-96a9-331f033b105a`; it fixes the HTTPS resource URL in challenges behind the Railway proxy.

## Verified mainnet result

- The unpaid route returned HTTP 402 with the configured HTTPS resource, Celo mainnet, native USDC, amount `5000`, and registered payTo.
- One controlled payer request returned HTTP 200 and a report after [settlement](https://celo.blockscout.com/tx/0x1d8fde59197391d59615cad0ab9d7e460dd605d836bb72c43e49675d7cfe6e1c). The exact 0.005 USDC transfer and consumed authorization were verified on chain.
- A read-only query of production SQLite confirmed the matching `settled` row. Health reports settlement at `2026-09-09T17:56:55.269Z`.
- Replaying the identical authorization returned HTTP 409 `PAYMENT_REPLAY`.
- The [payer funding transaction](https://celo.blockscout.com/tx/0xb05004f786701ac11bf1e381296471307b4f5c0825d0fc29d0501a62cf3179fd) carried `celo_80fe04c6accd` and used the verified USDC fee adapter. Its gas charge was approximately 0.002838 USDC.

[Captured mainnet evidence](evidence/mainnet-payment-smoke.json) includes the report, challenge, receipt fields, ledger row and health. The payer is a declared team-controlled wallet: this proves the payment flow, not independent customer adoption or ranking revenue. The report remained `ambiguous` because funding coverage and dominant-funder context were incomplete.

## Local rehearsal

This command rehearses the protocol without accessing a real wallet:

```sh
npm run payment:rehearse
```

This exercises real local HTTP servers, the official x402 client and HTTP facilitator adapter, a genuine ephemeral EIP-712 signature, simulated settlement, and a persistent SQLite replay check across restart. Output `data/payment-rehearsal.json` explicitly labels the result as a simulation. It is not evidence of a Celo payment.

The [saved rehearsal](evidence/payment-rehearsal.json) passed valid payment, tampered-signature rejection, restart replay rejection and failed-settlement report withholding, with zero external requests. The older [readiness snapshot](evidence/activation-readiness.json) preserves the pre-activation state; it is superseded by the mainnet capture above.

## Checks before changing Railway

1. Preserve baseline review data and deployed responses; confirm all ten paid reviews completed.
2. Run the complete tests/typecheck/build, inspect the preparation branch, and decide which changes to deploy. Keep one replica and the existing `/data` volume.
3. Verify the existing Celo facilitator's `/supported` still offers x402 v2 `exact` on `eip155:42220`, and privately confirm the configured key/credits. Never print keys or copy a wallet private key to Railway.
4. Check registered `AGENT_ADDRESS`, `ERC8004_AGENT_ID=9826`, `ATTRIBUTION_TAG=celo_80fe04c6accd`, HTTPS public URL and USDC price `5000`. Set `PAYMENTS_ENABLED=true` only for the intended activation deployment.
5. Read live health, agent metadata and unpaid paid-route response. Expect `payments_enabled=true`, `x402Support=true`, and HTTP 402 with correct network, USDC, amount and registered recipient. Invalid input must still fail before payment.
6. Make one authorized mainnet smoke purchase from a controlled payer with no automatic retry. Enforce exact price/network/token/payTo before signing. Archive settlement receipt and corresponding SQLite row. This check is complete; reuse the evidence rather than purchasing again for demonstration.
7. Check that the exact authorization is rejected on replay. For any uncertain settlement, reconcile the chain and durable payment record before making another payment.

If activation fails, restore `PAYMENTS_ENABLED=false` and keep SQLite intact. Do not clear pending payment rows. A successful rehearsal alone does not justify claiming successful mainnet settlement.

## Scope and evidence

Self-sent transactions still require the official attribution suffix and USDC fee adapter. x402 settlement is submitted by the facilitator and attributed to the registered payTo wallet under organizer rules; it is a different path from our tagged self-sent funding transactions. Controlled smoke purchases are testing, not independent users or revenue evidence for ranking.

Production activation, the controlled paid purchase and two external pilot invitations are complete. External responses, video publication and final submission publication remain pending. No background deployment or automatic publishing is configured by these documents.
