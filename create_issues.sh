#!/usr/bin/env bash
# Creates Phase 3 Wave issues on github.com/Miracle656/veil
# Prerequisites: gh CLI installed and authenticated (gh auth login)

REPO="Miracle656/veil"
LABEL="Stellar Wave"

echo "Creating Wave label if it doesn't exist..."
gh label create "$LABEL" --color "FDDA24" --description "Drips Wave program issue" --repo "$REPO" 2>/dev/null || true

echo ""
echo "Creating Issue 1 — Factory contract implementation (High, 200pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(contracts): implement factory contract for deterministic wallet deployment" \
  --label "$LABEL" \
  --body "## Context

Veil is a WebAuthn/FIDO2 passkey smart wallet on Stellar Soroban. Each user gets their own deployed instance of the \`invisible_wallet\` contract — a custom account contract that verifies P-256 ECDSA signatures on-chain without exposing any private key.

Phase 3 introduces a factory contract that handles deployment of wallet instances. Currently wallets must be deployed manually — the factory automates this and makes deployment permissionless.

## Problem

There is no on-chain mechanism to deploy wallet instances. Users cannot get a wallet without manual intervention, which blocks any real onboarding flow.

## What needs to be done

Implement a new Soroban contract at \`contracts/factory/\` that:

- Exposes a \`deploy(public_key: BytesN<65>)\` entry point
- Derives a deterministic contract address from the deployer's public key using a salt (e.g. SHA-256 of the raw P-256 public key bytes)
- Deploys the \`invisible_wallet\` contract Wasm via \`env.deployer().with_address(...)\`
- Initializes the deployed wallet with the provided public key as the registered signer
- Reverts with a clear error if the wallet for that key already exists

## Key files

- \`contracts/invisible_wallet/src/lib.rs\` — existing wallet contract, entry points, \`__check_auth\`
- \`contracts/invisible_wallet/src/storage.rs\` — signer storage patterns to replicate
- \`contracts/invisible_wallet/src/auth.rs\` — P-256 verification reference

## Implementation notes

- Use \`soroban_sdk::deployer\` — do NOT use \`create_contract\` directly
- Salt must be deterministic and derived solely from the public key so the address is predictable off-chain before deployment
- Keep the factory contract stateless except for tracking deployed addresses (optional — deployer handles dedup via address collision)
- Follow the same \`WalletError\` enum pattern from \`lib.rs\` for error variants

## Complexity: High — 200 Points

## Done when

- [ ] \`contracts/factory/src/lib.rs\` exists with \`deploy()\` implemented
- [ ] Calling \`deploy()\` twice with the same key returns an error (no duplicate wallets)
- [ ] The deployed wallet contract is initialized with the correct signer
- [ ] Contract compiles with \`cargo build --target wasm32-unknown-unknown --release\`"

echo ""
echo "Creating Issue 2 — Off-chain address derivation (Medium, 150pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(sdk): add off-chain deterministic wallet address computation" \
  --label "$LABEL" \
  --body "## Context

Veil deploys a unique Soroban contract instance per user (their passkey wallet). The factory contract uses the user's P-256 public key as a salt to derive the wallet's contract address deterministically.

## Problem

Users and the frontend currently have no way to know a wallet's contract address before it is deployed. This blocks UX patterns like showing the user their address on registration, pre-funding wallets, or checking if a wallet already exists.

## What needs to be done

Add a utility function to the SDK that computes the expected contract address given:
- The factory contract ID
- The user's raw P-256 public key (\`Uint8Array\`, 65 bytes uncompressed)

This must mirror exactly the salt derivation used in the factory contract.

## Key files

- \`sdk/src/utils.ts\` — existing crypto utilities (SHA-256, base64url, DER→raw)
- \`sdk/src/useInvisibleWallet.ts\` — React hook where the result will be surfaced

## Implementation notes

- Export the function as \`computeWalletAddress(factoryId: string, publicKeyBytes: Uint8Array): string\`
- Return the address as a Stellar strkey (\`C...\` format) using \`@stellar/stellar-sdk\`'s \`StrKey\`
- Expose \`walletAddress\` as a field returned by the \`register()\` flow in \`useInvisibleWallet\`

## Complexity: Medium — 150 Points

## Done when

- [ ] \`computeWalletAddress()\` exported from \`sdk/src/utils.ts\`
- [ ] Output matches the on-chain address after deployment (verified manually on testnet or via unit test)
- [ ] \`register()\` in the hook returns \`walletAddress\` alongside the existing fields
- [ ] TypeScript compiles cleanly (\`tsc --noEmit\`)"

echo ""
echo "Creating Issue 3 — Factory unit tests (Medium, 150pts)..."
gh issue create \
  --repo "$REPO" \
  --title "test(contracts): add unit tests for factory contract" \
  --label "$LABEL" \
  --body "## Context

The invisible_wallet contract (Phase 1) has 6 unit tests covering auth and storage. The new factory contract (Phase 3) needs equivalent coverage before it can be considered stable enough for testnet deployment.

## Problem

No tests exist yet for the factory contract. Without them, edge cases (duplicate deployment, bad key format, initialization failure) will only surface on testnet where debugging is slower.

## What needs to be done

Add a Soroban test module inside \`contracts/factory/src/lib.rs\` (or \`tests/\`) that covers:

1. **Happy path** — \`deploy()\` with a valid 65-byte P-256 public key succeeds and returns a contract address
2. **Duplicate prevention** — calling \`deploy()\` twice with the same key returns an error
3. **Bad input** — calling \`deploy()\` with a key of wrong length returns an error
4. **Address determinism** — two independent calls with the same key produce the same expected address
5. **Wallet initialized** — after deployment, the wallet contract recognizes the public key as a valid signer

## Key files

- \`contracts/invisible_wallet/src/lib.rs\` — see existing test module for patterns
- \`contracts/factory/src/lib.rs\` — factory implementation (from Issue #1)

## Implementation notes

- Use \`soroban_sdk::testutils\` — do not write integration tests that require a running node
- Mirror the test structure from \`invisible_wallet\` tests for consistency

## Complexity: Medium — 150 Points

## Done when

- [ ] All 5 test cases above are implemented and pass via \`cargo test\`
- [ ] \`cargo test\` output shows 0 failures
- [ ] No \`#[allow(unused)]\` hacks — all test helpers are actually exercised"

echo ""
echo "Creating Issue 4 — SDK deploy() hook method (Medium, 150pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(sdk): add deploy() method to useInvisibleWallet hook" \
  --label "$LABEL" \
  --body "## Context

\`useInvisibleWallet\` is a React hook (\`sdk/src/useInvisibleWallet.ts\`) that currently exposes \`register()\`, \`signAuthEntry()\`, and \`login()\`. Registration creates a WebAuthn credential and extracts the P-256 public key — but does not deploy the on-chain wallet contract.

## Problem

After \`register()\`, the user has a passkey but no deployed wallet. There is no SDK method to trigger factory deployment, leaving the caller to wire it up manually against the Stellar RPC.

## What needs to be done

Add a \`deploy(factoryContractId: string)\` async method to the hook that:

1. Reads the P-256 public key from the last \`register()\` result (or accepts it as a parameter)
2. Builds and submits a Soroban transaction calling \`factory.deploy(publicKey)\`
3. Returns the deployed wallet contract address
4. Emits loading/error state consistent with the existing hook pattern

## Key files

- \`sdk/src/useInvisibleWallet.ts\` — add \`deploy()\` alongside \`register()\`, \`login()\`
- \`sdk/src/utils.ts\` — use \`computeWalletAddress()\` (from Issue #2) to predict address pre-submission

## Implementation notes

- Accept \`rpcUrl\` and \`networkPassphrase\` as hook config — do not hardcode testnet values
- Handle the case where the wallet is already deployed gracefully
- Keep the hook framework-agnostic — no Next.js or Vite imports

## Complexity: Medium — 150 Points

## Done when

- [ ] \`deploy(factoryContractId)\` method exists on the hook's return value
- [ ] Method submits the factory transaction and resolves with the wallet address
- [ ] Loading and error states are exposed
- [ ] TypeScript compiles cleanly
- [ ] JSDoc comment on the method explains params and return value"

echo ""
echo "Creating Issue 5 — Factory deployer script (Trivial, 100pts)..."
gh issue create \
  --repo "$REPO" \
  --title "tooling: add Stellar CLI script to deploy factory contract to testnet" \
  --label "$LABEL" \
  --body "## Context

Veil's factory contract needs to be deployed to Stellar testnet once before any wallet can be created. This is currently a manual multi-step process requiring knowledge of Stellar CLI flags and Wasm upload steps.

## Problem

There is no documented or scripted path to deploy the factory. New contributors or testers have to figure out the deployment sequence themselves, which is a barrier to running the project end-to-end.

## What needs to be done

Add a shell script at \`scripts/deploy_factory.sh\` that:

1. Builds the factory contract Wasm (\`cargo build --target wasm32-unknown-unknown --release\`)
2. Uploads the Wasm to testnet via \`stellar contract upload\`
3. Deploys the factory contract via \`stellar contract deploy\`
4. Prints the deployed factory contract ID to stdout
5. Optionally writes it to a \`.env.testnet\` file for SDK consumption

## Implementation notes

- Target Stellar testnet — use \`--network testnet\` flag
- Use \`stellar keys\` for the deployer identity — do not hardcode private keys
- Script should be idempotent: if the Wasm hash already exists on-chain, skip re-upload
- Add a comment block at the top explaining prerequisites

## Complexity: Trivial — 100 Points

## Done when

- [ ] \`scripts/deploy_factory.sh\` exists and is executable
- [ ] Running the script produces a valid contract ID in stdout
- [ ] Contract ID output is clearly labeled
- [ ] Script does not hardcode any private keys or mnemonics"

echo ""
echo "All 5 issues created. Total points available: 750"
echo "View issues at: https://github.com/Miracle656/veil/issues"
