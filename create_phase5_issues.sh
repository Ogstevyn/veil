#!/usr/bin/env bash
# Creates Phase 5 Wave issues on github.com/Miracle656/veil
# Prerequisites: gh CLI installed and authenticated (gh auth login)

REPO="Miracle656/veil"
LABEL="Stellar Wave"

echo "Ensuring Wave label exists..."
gh label create "$LABEL" --color "FDDA24" --description "Drips Wave program issue" --repo "$REPO" 2>/dev/null || true

echo ""
echo "Creating Issue 1 — On-chain nonce and replay protection (High, 200pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(contracts): add on-chain nonce to __check_auth to prevent signature replay attacks" \
  --label "$LABEL" \
  --body "## Context

Veil's \`invisible_wallet\` contract verifies WebAuthn P-256 signatures inside \`__check_auth\`. Currently there is no mechanism to prevent a valid, previously-submitted WebAuthn assertion from being replayed. An attacker who captures a signed transaction could resubmit the same \`(authData, clientDataJSON, signature)\` tuple in a future transaction.

## Problem

Without a nonce, the contract is vulnerable to replay attacks at the Soroban auth layer. Any previously observed valid signature can be submitted again to authorise a different transaction — a critical security gap before mainnet exposure.

## What needs to be done

1. Add a \`nonce: u64\` field to the wallet's instance storage (initialised to \`0\` on \`init\`).
2. Update the \`WebAuthnSignature\` type (in \`auth.rs\`) to include a \`nonce: u64\` field alongside \`public_key\`, \`auth_data\`, \`client_data_json\`, and \`signature\`.
3. In \`__check_auth\`:
   - Read the current nonce from storage.
   - Assert the submitted nonce equals the stored nonce. If not, return \`WalletError::NonceMismatch\`.
   - After all other checks pass, increment the stored nonce by 1.
4. Add a \`WalletError::NonceMismatch\` variant.
5. Expose a \`get_nonce() -> u64\` read-only contract function so the SDK can fetch the current nonce before building a transaction.

## Key files

- \`contracts/invisible_wallet/src/auth.rs\` — \`__check_auth\`, \`WebAuthnSignature\` struct
- \`contracts/invisible_wallet/src/storage.rs\` — add nonce storage key and helpers
- \`contracts/invisible_wallet/src/lib.rs\` — add \`get_nonce()\` entry point, \`WalletError::NonceMismatch\`

## Implementation notes

- Use \`env.storage().instance().get/set\` for the nonce — same storage tier as the signer key
- The nonce must be incremented *after* all signature and domain checks pass, and *before* the function returns \`Ok(())\` — order matters
- The SDK will need to call \`get_nonce()\` before assembling \`SorobanAuthorizationEntry\` so the correct nonce is embedded in the signed payload
- \`u64\` gives ~18 quintillion operations per wallet — no overflow risk in practice

## Complexity: High — 200 Points

## Done when

- [ ] \`nonce: u64\` initialised to \`0\` in \`init\`
- [ ] \`__check_auth\` rejects wrong nonce with \`WalletError::NonceMismatch\`
- [ ] \`__check_auth\` increments nonce on every successful auth
- [ ] \`get_nonce()\` entry point returns the current nonce
- [ ] Three new unit tests: nonce accepted on first use, nonce replay rejected, nonce increments correctly
- [ ] Contract compiles with \`cargo build --target wasm32-unknown-unknown --release\`"

echo ""
echo "Creating Issue 2 — Multi-signer support (High, 200pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(contracts): add multi-signer support — register additional P-256 keys per wallet" \
  --label "$LABEL" \
  --body "## Context

Veil wallets currently support exactly one P-256 signer key, set at deployment time. A user who wants to access their wallet from a second device (e.g. phone + laptop) has no way to add a second passkey — they would need to deploy a separate wallet entirely.

## Problem

Single-signer wallets are a UX liability: losing the registered device means permanent loss of wallet access. Supporting multiple signers is the foundation for both multi-device access and the guardian recovery flow (Phase 5 Issue #3).

## What needs to be done

1. Replace the single signer key in storage with a \`Map<u32, BytesN<65>>\` — a signer index → public key map. The initial signer from \`init\` becomes index \`0\`.
2. Add a contract entry point \`add_signer(new_public_key: BytesN<65>) -> u32\` that:
   - Can only be called via a valid \`__check_auth\` (i.e. an existing signer must authorise adding a new one)
   - Stores the new key under the next available index
   - Returns the new signer's index
3. Add a contract entry point \`remove_signer(index: u32)\` that:
   - Can only be called via \`__check_auth\`
   - Rejects removal if it would leave the wallet with zero signers (\`WalletError::CannotRemoveLastSigner\`)
   - Removes the entry at the given index
4. Update \`__check_auth\` to accept any registered signer key — iterate the map and verify against each, succeeding on the first match.
5. Add \`WalletError::CannotRemoveLastSigner\` and \`WalletError::SignerNotFound\` variants.

## Key files

- \`contracts/invisible_wallet/src/storage.rs\` — replace signer storage with a \`Map\`-based structure
- \`contracts/invisible_wallet/src/auth.rs\` — update \`__check_auth\` to iterate all registered keys
- \`contracts/invisible_wallet/src/lib.rs\` — add \`add_signer\` and \`remove_signer\` entry points

## Implementation notes

- Use \`soroban_sdk::Map<u32, BytesN<65>>\` stored in instance storage under a \`DataKey::Signers\` key
- Soroban \`Map\` is ordered — use the current map length as the next index
- \`__check_auth\` should short-circuit on the first matching key — do not iterate past a match
- Existing wallets deployed before this change will need a migration path — document this in the PR

## Complexity: High — 200 Points

## Done when

- [ ] Signer storage uses a \`Map<u32, BytesN<65>>\`; existing \`init\` signer is at index \`0\`
- [ ] \`add_signer\` stores a new key and returns its index (requires auth)
- [ ] \`remove_signer\` removes a key by index, rejects if it would empty the map (requires auth)
- [ ] \`__check_auth\` succeeds when any registered signer key is used
- [ ] Unit tests: add signer, remove signer, reject last-signer removal, multi-key auth
- [ ] Contract compiles with \`cargo build --target wasm32-unknown-unknown --release\`"

echo ""
echo "Creating Issue 3 — Guardian recovery mechanism (High, 200pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(contracts): implement guardian recovery to replace a lost signer key" \
  --label "$LABEL" \
  --body "## Context

If a Veil wallet user loses their only registered device, they permanently lose access to their wallet — there is no recovery mechanism. Guardian recovery allows a pre-designated Stellar account (the guardian) to initiate a signer key replacement, giving users a path back without seed phrases.

## Problem

Wallets with no recovery path are a hard blocker for real-world adoption. Users need a trustless way to recover access that does not reintroduce seed phrases or custodial risk.

## What needs to be done

1. Add a \`guardian: Option<Address>\` field to wallet instance storage, set during \`init\` (can be \`None\` if the user opts out of recovery).
2. Add a \`set_guardian(guardian: Address)\` entry point — callable only via \`__check_auth\` (existing signer must authorise the change).
3. Add an \`initiate_recovery(new_public_key: BytesN<65>)\` entry point, callable only by the stored guardian address (enforced via \`env.require_auth(&guardian)\`):
   - Records the \`new_public_key\` and a \`recovery_unlock_time = env.ledger().timestamp() + RECOVERY_DELAY_SECONDS\` in storage
   - Emits a \`recovery_initiated\` contract event
4. Add a \`complete_recovery()\` entry point, callable by anyone:
   - Checks \`env.ledger().timestamp() >= recovery_unlock_time\`
   - Replaces the signer map with only the \`new_public_key\` (clearing all existing signers)
   - Clears the pending recovery state
5. Add \`WalletError::NoGuardianSet\`, \`WalletError::RecoveryNotPending\`, \`WalletError::RecoveryTimelockActive\` variants.

## Key files

- \`contracts/invisible_wallet/src/storage.rs\` — add \`Guardian\`, \`PendingRecovery\` storage keys
- \`contracts/invisible_wallet/src/lib.rs\` — add \`set_guardian\`, \`initiate_recovery\`, \`complete_recovery\` entry points
- \`contracts/invisible_wallet/src/auth.rs\` — no changes needed (guardian auth uses Stellar native auth, not WebAuthn)

## Implementation notes

- \`RECOVERY_DELAY_SECONDS\` should be a constant, e.g. \`259200\` (3 days) — gives the user time to cancel if the guardian acts maliciously
- Guardian auth uses standard Stellar \`env.require_auth()\` — the guardian is a Stellar account, not a WebAuthn credential
- \`complete_recovery\` is permissionless (anyone can trigger it after the timelock) — only the pending key gets installed, so there is no trust requirement
- Consider adding a \`cancel_recovery()\` callable by the current signer to abort a pending recovery

## Complexity: High — 200 Points

## Done when

- [ ] \`guardian\` field stored in wallet instance; settable via \`set_guardian\` (requires auth)
- [ ] \`initiate_recovery\` records pending key + unlock time; enforces guardian auth
- [ ] \`complete_recovery\` installs new key after timelock; fails before timelock expires
- [ ] \`WalletError::RecoveryTimelockActive\` returned if \`complete_recovery\` called too early
- [ ] Unit tests: full recovery flow, timelock enforcement, no-guardian rejection, cancellation
- [ ] Contract compiles with \`cargo build --target wasm32-unknown-unknown --release\`"

echo ""
echo "Creating Issue 4 — SDK: nonce fetching and multi-signer methods (Medium, 150pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(sdk): expose getNonce(), addSigner(), and removeSigner() in useInvisibleWallet hook" \
  --label "$LABEL" \
  --body "## Context

Phase 5 adds nonce tracking and multi-signer support to the \`invisible_wallet\` contract (Issues #1 and #2). The SDK hook (\`useInvisibleWallet\`) needs to expose these new contract entry points so frontend applications can use them without writing raw Stellar SDK calls.

## Problem

The Phase 5 contract changes are not accessible from the SDK. Developers building on Veil would have to hand-roll contract invocations for nonce fetching and signer management — which defeats the purpose of the SDK abstraction.

## What needs to be done

Add three new methods to the \`useInvisibleWallet\` hook in \`sdk/src/useInvisibleWallet.ts\`:

1. **\`getNonce() -> Promise<bigint>\`**
   - Calls the contract's \`get_nonce()\` view function via \`server.simulateTransaction\`
   - Returns the current nonce as a \`bigint\`
   - Used by the sign flow to embed the correct nonce in \`SorobanAuthorizationEntry\` before calling \`signAuthEntry\`

2. **\`addSigner(signerKeypair: Keypair, newPublicKeyBytes: Uint8Array) -> Promise<{ signerIndex: number }>\`**
   - Builds and submits a contract invocation of \`add_signer(new_public_key)\`
   - \`signerKeypair\` pays the transaction fee (same pattern as \`deploy()\`)
   - Returns the new signer's index

3. **\`removeSigner(signerKeypair: Keypair, signerIndex: number) -> Promise<void>\`**
   - Builds and submits a contract invocation of \`remove_signer(index)\`
   - Uses the same transaction pattern as \`addSigner\`

Update the \`InvisibleWallet\` type to include all three methods and update the hook's return value.

## Key files

- \`sdk/src/useInvisibleWallet.ts\` — hook implementation, \`InvisibleWallet\` type
- \`sdk/src/utils.ts\` — add any XDR encoding helpers needed for the new calls

## Implementation notes

- Follow the same \`simulateTransaction\` → \`submit\` → \`poll\` pattern already used in \`deploy()\`
- \`getNonce()\` should be a simulation-only call (read-only) — use \`server.simulateTransaction\` and decode the result, do not submit
- TypeScript types for the new parameters should be consistent with existing SDK conventions

## Complexity: Medium — 150 Points

## Done when

- [ ] \`getNonce()\` returns current nonce from on-chain via simulation
- [ ] \`addSigner()\` submits \`add_signer\` transaction and returns the new signer index
- [ ] \`removeSigner()\` submits \`remove_signer\` transaction
- [ ] \`InvisibleWallet\` type updated with all three method signatures and JSDoc
- [ ] TypeScript compiles cleanly (\`tsc --noEmit\`)"

echo ""
echo "Creating Issue 5 — SDK: guardian recovery flow (Medium, 150pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(sdk): expose setGuardian(), initiateRecovery(), and completeRecovery() in useInvisibleWallet hook" \
  --label "$LABEL" \
  --body "## Context

Phase 5 Issue #3 adds guardian recovery to the \`invisible_wallet\` contract. The SDK needs matching methods so frontend applications and scripts can drive the recovery flow without writing raw contract calls.

## Problem

The guardian recovery contract entry points (\`set_guardian\`, \`initiate_recovery\`, \`complete_recovery\`) are not accessible from the SDK. Without SDK support the recovery flow is unusable for any real application.

## What needs to be done

Add three new methods to the \`useInvisibleWallet\` hook:

1. **\`setGuardian(signerKeypair: Keypair, guardianAddress: string) -> Promise<void>\`**
   - Submits a \`set_guardian(guardian)\` transaction
   - \`signerKeypair\` pays fees; the call must be authorised by the current WebAuthn signer (via \`signAuthEntry\`)
   - \`guardianAddress\` is a Stellar strkey account address (\`G...\`)

2. **\`initiateRecovery(guardianKeypair: Keypair, newPublicKeyBytes: Uint8Array) -> Promise<{ unlockTime: number }>\`**
   - Submits an \`initiate_recovery(new_public_key)\` transaction signed by the guardian keypair
   - Returns the \`unlockTime\` timestamp so the UI can display a countdown
   - \`guardianKeypair\` is the Stellar keypair of the designated guardian account

3. **\`completeRecovery(payerKeypair: Keypair) -> Promise<void>\`**
   - Submits \`complete_recovery()\` — permissionless, any keypair can pay fees
   - Should fail gracefully with a clear error if the timelock has not yet expired

Update the \`InvisibleWallet\` type with all three methods.

## Key files

- \`sdk/src/useInvisibleWallet.ts\` — hook implementation, \`InvisibleWallet\` type
- \`sdk/src/utils.ts\` — XDR helpers for encoding \`BytesN<65>\` public keys if not already present

## Implementation notes

- \`setGuardian\` requires a WebAuthn auth entry — the flow is: call \`signAuthEntry\`, attach the signature, then submit
- \`initiateRecovery\` uses standard Stellar account signing (not WebAuthn) — the guardian signs with their Stellar keypair via the standard \`Transaction.sign()\` method
- \`completeRecovery\` is a simple contract invocation with no special auth — just fee-payer signature
- Return typed errors for \`RecoveryTimelockActive\`, \`NoGuardianSet\`, \`RecoveryNotPending\` so the UI can handle each case distinctly

## Complexity: Medium — 150 Points

## Done when

- [ ] \`setGuardian()\` submits transaction and handles WebAuthn auth attachment
- [ ] \`initiateRecovery()\` submits guardian-signed transaction and returns unlock timestamp
- [ ] \`completeRecovery()\` submits and returns clear error if timelock not expired
- [ ] \`InvisibleWallet\` type updated with all three signatures and JSDoc
- [ ] TypeScript compiles cleanly (\`tsc --noEmit\`)"

echo ""
echo "All 5 Phase 5 issues created. Total points available: 900"
echo "View issues at: https://github.com/Miracle656/veil/issues"
