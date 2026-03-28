#!/usr/bin/env bash
# Creates Phase 4 Wave issues on github.com/Miracle656/veil
# Prerequisites: gh CLI installed and authenticated (gh auth login)

REPO="Miracle656/veil"
LABEL="Stellar Wave"

echo "Ensuring Wave label exists..."
gh label create "$LABEL" --color "FDDA24" --description "Drips Wave program issue" --repo "$REPO" 2>/dev/null || true

echo ""
echo "Creating Issue 1 — RP ID and origin verification in __check_auth (High, 200pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(contracts): enforce RP ID and origin binding in __check_auth" \
  --label "$LABEL" \
  --body "## Context

Veil's \`invisible_wallet\` contract verifies P-256 ECDSA signatures on-chain inside \`__check_auth\`. Currently it checks that the signature is valid over \`authData || SHA256(clientDataJSON)\` — but it does not verify *which domain* the assertion was made for.

WebAuthn binds every assertion to a specific relying party (RP) via two fields:
- \`rpIdHash\` — first 32 bytes of \`authenticatorData\`. Must equal \`SHA256(rpId)\` (e.g. \`SHA256(\"veil.app\")\`)
- \`origin\` — embedded in \`clientDataJSON\` as \`\"origin\":\"https://veil.app\"\`. Must match the expected deployment origin.

Without these checks, a signature generated on one domain could replay against a wallet deployed on a different domain.

## Problem

The contract skips domain-binding verification, which is a meaningful security gap before testnet exposure. Any valid P-256 assertion — regardless of which website produced it — passes \`__check_auth\`.

## What needs to be done

1. Add \`rp_id: String\` and \`origin: String\` fields to the wallet's initialisation storage (alongside the existing signer public key).
2. In \`__check_auth\`, after signature verification:
   - Compute \`SHA256(rp_id)\` and assert it equals \`authenticatorData[0..32]\`
   - Locate \`\"origin\":\"\` in the raw \`clientDataJSON\` bytes and assert the extracted value equals the stored \`origin\`
3. Update \`register_signer\` (or the init entry point) to accept and persist \`rp_id\` and \`origin\`.
4. Add a \`WalletError::RpIdMismatch\` and \`WalletError::OriginMismatch\` variant for clear failure modes.

## Key files

- \`contracts/invisible_wallet/src/auth.rs\` — \`__check_auth\` implementation; add the two assertions here
- \`contracts/invisible_wallet/src/storage.rs\` — add \`rp_id\` and \`origin\` to the signer record
- \`contracts/invisible_wallet/src/lib.rs\` — update init entry point to accept the new fields

## Implementation notes

- Soroban runs in a \`no_std\` environment — no \`serde_json\`. Parse \`clientDataJSON\` with a simple byte-slice search for \`\"origin\":\"\`. Do not pull in a full JSON parser.
- \`rpIdHash\` extraction is straightforward: \`&auth_data[0..32]\`
- Both checks should happen *after* signature verification to avoid leaking timing information on failure
- The \`rp_id\` for local dev is \`\"localhost\"\`, for production it will be the deployed domain — keep it configurable at init time, not hardcoded

## Complexity: High — 200 Points

## Done when

- [ ] \`rp_id\` and \`origin\` are stored at wallet initialisation
- [ ] \`__check_auth\` rejects assertions with a wrong \`rpIdHash\` with \`WalletError::RpIdMismatch\`
- [ ] \`__check_auth\` rejects assertions with a wrong \`origin\` with \`WalletError::OriginMismatch\`
- [ ] Existing unit tests still pass (\`cargo test\`)
- [ ] Two new unit tests added: one for \`RpIdMismatch\`, one for \`OriginMismatch\`
- [ ] Contract compiles with \`cargo build --target wasm32-unknown-unknown --release\`"

echo ""
echo "Creating Issue 2 — End-to-end testnet demo app (High, 200pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(demo): build minimal end-to-end testnet demo for passkey wallet registration and deployment" \
  --label "$LABEL" \
  --body "## Context

Veil now has a working SDK (\`useInvisibleWallet\`) with \`register()\`, \`deploy()\`, and \`signAuthEntry()\`. The factory contract (Phase 3) handles on-chain wallet deployment. What's missing is a runnable demo that wires all of this together against Stellar testnet — proving the full flow works end-to-end.

## Problem

There is no way for a contributor or reviewer to run Veil locally and see it work. The SDK is complete but untested in a real browser against real testnet infrastructure. This is the most important validation step before Phase 5.

## What needs to be done

Build a minimal standalone demo app at \`demo/\` using Next.js (App Router) or plain Vite + React that:

1. **Register** — calls \`register(username)\` via the hook, shows the computed wallet address
2. **Deploy** — calls \`deploy(signerKeypair)\` to submit the factory transaction, shows the deployed contract address and a Stellar Expert link
3. **Sign** — calls \`signAuthEntry(payload)\` with a hardcoded 32-byte test payload and displays the raw \`WebAuthnSignature\` fields (for verification)
4. Reads \`NEXT_PUBLIC_FACTORY_ADDRESS\`, \`NEXT_PUBLIC_RPC_URL\`, and \`NEXT_PUBLIC_NETWORK_PASSPHRASE\` from \`.env.local\`

The UI does not need to be polished — clarity over aesthetics. Each step should show a loading state, a success state, and a clear error message on failure.

## Key files

- \`sdk/src/useInvisibleWallet.ts\` — the hook to integrate
- \`sdk/src/utils.ts\` — \`computeWalletAddress\` for address display
- \`.env.example\` (from Issue #5 in this phase) — environment variable reference

## Implementation notes

- Use \`stellar-sdk\` \`Keypair.random()\` for the fee-payer keypair in \`deploy()\` and fund it via Friendbot (\`https://friendbot.stellar.org?addr=...\`)
- Show the Stellar Expert testnet link: \`https://stellar.expert/explorer/testnet/contract/<address>\`
- The demo should run with \`npm run dev\` after filling in \`.env.local\` — no global installs beyond \`node\` and \`npm\`
- Keep it self-contained in \`demo/\` — do not modify \`frontend/website\` or \`frontend/docs\`

## Complexity: High — 200 Points

## Done when

- [ ] \`demo/\` directory exists with a working Next.js or Vite app
- [ ] All three flows (register, deploy, sign) are reachable from the UI
- [ ] App reads config from \`.env.local\` (not hardcoded values)
- [ ] \`README.md\` inside \`demo/\` explains setup steps (Friendbot funding, env vars, \`npm run dev\`)
- [ ] A short screen recording or screenshot is included in the PR showing the deploy step succeeding on testnet"

echo ""
echo "Creating Issue 3 — SDK login() on-chain verification (Medium, 150pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(sdk): upgrade login() to verify wallet deployment on-chain before restoring session" \
  --label "$LABEL" \
  --body "## Context

\`useInvisibleWallet\`'s \`login()\` method currently restores a wallet session purely from \`localStorage\`. It reads the stored contract address and sets it as the active wallet — without confirming the wallet actually exists on Stellar testnet.

## Problem

If a user registers and computes their address but never completes deployment (e.g. the \`deploy()\` call fails or is skipped), \`login()\` will silently restore a session pointing at a non-existent contract. Any subsequent \`signAuthEntry\` call would fail at the RPC layer with a cryptic error, not a clear \"wallet not deployed\" message.

## What needs to be done

Update \`login()\` in \`sdk/src/useInvisibleWallet.ts\` to:

1. Read the stored address from \`localStorage\` (as it does now)
2. Call \`server.getContractData(address, xdr.ScVal.scvLedgerKeyContractInstance(), SorobanRpc.Durability.Persistent)\` to check if the contract instance exists on-chain
3. If the contract exists → restore the session normally (set \`address\` state)
4. If the contract does not exist → set a descriptive error: \`\"Wallet not yet deployed. Call deploy() to create it on-chain.\"\` and do not set \`address\`
5. Expose a new \`isDeployed: boolean\` field on the hook's return value that reflects this status

\`login()\` should consume \`rpcUrl\` and \`networkPassphrase\` from the hook's \`WalletConfig\` (already available via destructuring).

## Key files

- \`sdk/src/useInvisibleWallet.ts\` — \`login()\` implementation, \`InvisibleWallet\` type, hook return value
- The \`deploy()\` method in the same file — reuse the same \`getContractData\` call pattern already used for the \"already deployed\" guard

## Implementation notes

- The \`getContractData\` call is already implemented in \`deploy()\` — replicate the pattern
- Do not break the existing \`login()\` behaviour when the wallet is deployed — the happy path must stay identical
- \`isPending\` should be set during the on-chain check so the UI can show a loading state

## Complexity: Medium — 150 Points

## Done when

- [ ] \`login()\` verifies the wallet exists on-chain before restoring session
- [ ] Undeployed wallet → clear error message, \`address\` stays \`null\`
- [ ] Deployed wallet → session restored, \`address\` set correctly
- [ ] \`isDeployed: boolean\` exposed on the hook return value
- [ ] TypeScript compiles cleanly (\`tsc --noEmit\`)
- [ ] JSDoc on \`login()\` and \`isDeployed\` updated to reflect new behaviour"

echo ""
echo "Creating Issue 4 — Testnet smoke test script (Medium, 150pts)..."
gh issue create \
  --repo "$REPO" \
  --title "test(integration): add Node.js testnet smoke test for register → deploy → signAuthEntry" \
  --label "$LABEL" \
  --body "## Context

Veil's SDK has unit-level TypeScript types but no automated test that runs the full registration and deployment flow against real Stellar testnet infrastructure. The only way to verify the SDK works end-to-end today is to manually run the demo app.

## Problem

Without an automated smoke test, regressions in the factory integration or the \`deploy()\` polling logic will only be caught by hand. This slows down PR review and makes it harder for contributors to verify their changes actually work.

## What needs to be done

Add a Node.js script at \`scripts/smoke_test.ts\` (run with \`ts-node\`) that:

1. Generates a random \`Keypair\` for the fee-payer and funds it via Stellar Friendbot
2. Calls \`computeWalletAddress(factoryId, mockPublicKey)\` to get the expected address
3. Submits a factory \`deploy\` transaction directly using the Stellar SDK (replicating the \`deploy()\` hook logic without a browser)
4. Polls until the transaction confirms
5. Calls \`server.getContractData(walletAddress, ...)\` to assert the contract now exists on-chain
6. Prints a pass/fail summary with the deployed address and transaction hash

The script does not need to test WebAuthn credential creation (that requires a browser). Use a hardcoded 65-byte mock P-256 public key as the signer.

## Key files

- \`sdk/src/utils.ts\` — \`computeWalletAddress()\` to import directly
- \`sdk/src/useInvisibleWallet.ts\` — \`deploy()\` logic to replicate outside the React hook
- \`scripts/deploy_factory.sh\` — produces the factory contract ID this script reads

## Implementation notes

- Read \`FACTORY_ADDRESS\`, \`RPC_URL\`, and \`NETWORK_PASSPHRASE\` from environment variables (or \`.env.testnet\` written by \`deploy_factory.sh\`)
- Use a hardcoded valid-format 65-byte P-256 public key (\`0x04\` prefix followed by 64 zero bytes) — the factory only checks byte length, not cryptographic validity at this stage
- Exit with code 0 on success, non-zero on failure — makes it usable in CI later
- Add a comment block at the top of the file explaining prerequisites and how to run it

## Complexity: Medium — 150 Points

## Done when

- [ ] \`scripts/smoke_test.ts\` exists and runs with \`npx ts-node scripts/smoke_test.ts\`
- [ ] Script self-funds via Friendbot without manual steps
- [ ] Script asserts the wallet contract exists on-chain after deployment
- [ ] Exits 0 on success, non-zero on failure
- [ ] Reads all config from env vars — no hardcoded contract IDs or RPC URLs"

echo ""
echo "Creating Issue 5 — .env.example and testnet setup guide (Trivial, 100pts)..."
gh issue create \
  --repo "$REPO" \
  --title "tooling: add .env.example and testnet environment setup guide" \
  --label "$LABEL" \
  --body "## Context

Veil's SDK and demo app require several environment variables: the deployed factory contract address, an RPC URL, and the network passphrase. Contributors have no reference for what these should look like or where to get them.

## Problem

Every contributor who wants to run the demo or smoke test has to figure out the required environment variables by reading the source code. There is no \`.env.example\`, no setup guide, and no documented path from fresh clone to running against testnet.

## What needs to be done

1. Add \`.env.example\` at the repo root:

\`\`\`
# Stellar network (used by the demo app — Next.js public vars)
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_FACTORY_ADDRESS=         # output of scripts/deploy_factory.sh

# Used by scripts (Node.js — no NEXT_PUBLIC_ prefix)
RPC_URL=https://soroban-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015
FACTORY_ADDRESS=                     # same value as above
\`\`\`

2. Add \`TESTNET_SETUP.md\` at the repo root covering:
   - How to install the Stellar CLI
   - How to create and fund a testnet account via Friendbot
   - How to run \`scripts/deploy_factory.sh\` to get a factory address
   - How to copy \`.env.example\` → \`.env.local\` and fill in the values
   - How to run \`scripts/smoke_test.ts\` to verify everything works

3. Add \`.env.local\` and \`.env.testnet\` to \`.gitignore\` if not already present.

## Key files

- \`scripts/deploy_factory.sh\` — produces the \`FACTORY_ADDRESS\` value
- \`scripts/smoke_test.ts\` — consumes the env vars
- \`demo/\` — the demo app will also consume them

## Complexity: Trivial — 100 Points

## Done when

- [ ] \`.env.example\` exists at repo root with all required variables and inline comments
- [ ] \`TESTNET_SETUP.md\` exists with clear step-by-step instructions a new contributor can follow
- [ ] \`.env.local\` and \`.env.testnet\` listed in \`.gitignore\`
- [ ] A contributor following the guide from a fresh clone can reach the smoke test successfully"

echo ""
echo "All 5 Phase 4 issues created. Total points available: 800"
echo "View issues at: https://github.com/Miracle656/veil/issues"
