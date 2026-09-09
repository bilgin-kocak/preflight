# Paid activation checklist

Production remains payment-disabled during this preparation. This branch can rehearse the protocol without accessing a real wallet:

```sh
npm run payment:rehearse
```

This exercises real local HTTP servers, the official x402 client and HTTP facilitator adapter, a genuine ephemeral EIP-712 signature, simulated settlement, and a persistent SQLite replay check across restart. Output `data/payment-rehearsal.json` explicitly labels the result as a simulation. It is not evidence of a Celo payment.

The [saved rehearsal](evidence/payment-rehearsal.json) passed valid payment, tampered-signature rejection, restart replay rejection and failed-settlement report withholding, with zero external requests. The [readiness snapshot](evidence/activation-readiness.json) confirms the live skill still matches the baseline, production payments remain disabled, and the Celo facilitator advertises v2 exact support. Facilitator settlement was not invoked.

## Checks before changing Railway

1. Preserve baseline review data and deployed responses; confirm all ten paid reviews completed.
2. Run the complete tests/typecheck/build, inspect the preparation branch, and decide which changes to deploy. Keep one replica and the existing `/data` volume.
3. Verify the existing Celo facilitator's `/supported` still offers x402 v2 `exact` on `eip155:42220`, and privately confirm the configured key/credits. Never print keys or copy a wallet private key to Railway.
4. Check registered `AGENT_ADDRESS`, `ERC8004_AGENT_ID=9826`, `ATTRIBUTION_TAG=celo_80fe04c6accd`, HTTPS public URL and USDC price `5000`. Set `PAYMENTS_ENABLED=true` only for the intended activation deployment.
5. Read live health, agent metadata and unpaid paid-route response. Expect `payments_enabled=true`, `x402Support=true`, and HTTP 402 with correct network, USDC, amount and registered recipient. Invalid input must still fail before payment.
6. Make one separately authorized mainnet smoke purchase from a controlled payer with no automatic retry. Enforce exact price/network/token/payTo before signing. Archive settlement receipt and corresponding SQLite row. No real payer was configured, funded or used in this preparation.
7. Check that the exact authorization is rejected on replay. For any uncertain settlement, reconcile the chain and durable payment record before making another payment.

If activation fails, restore `PAYMENTS_ENABLED=false` and keep SQLite intact. Do not clear pending payment rows. A successful rehearsal alone does not justify claiming successful mainnet settlement.

## Scope and evidence

Self-sent transactions still require the official attribution suffix and USDC fee adapter. x402 settlement is submitted by the facilitator and attributed to the registered payTo wallet under organizer rules; it is a different path from our tagged self-sent funding transactions. Controlled smoke purchases are testing, not independent users or revenue evidence for ranking.

Production activation, external outreach, a real paid smoke purchase, video publication and final submission publication are subsequent actions. No background deployment or automatic publishing is configured by these documents.
