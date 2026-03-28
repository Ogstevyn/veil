# Phase 3 — Wave Issue Drafts

Wave cycle: 7 days · Complexity labels: Trivial (100pts) / Medium (150pts) / High (200pts)

---

## Issue 1 — Implement Soroban Factory Contract

**Complexity:** High (200pts)
**Label:** `Stellar Wave`

**Title:** `feat(contracts): implement factory contract for deterministic wallet deployment`

**Body:**
```
## Context

Veil is a WebAuthn/FIDO2 passkey smart wallet on Stellar Soroban. Each user gets their own deployed instance of the `invisible_wallet` contract — a custom account contract that verifies P-256 ECDSA signatures on-chain without exposing any private key.

Phase 3 introduces a factory contract that handles deployment of wallet instances. Currently wallets must be deployed manually — the factory automates this and makes deployment permissionless.

## Problem

There is no on-chain mechanism to deploy wallet instances. Users cannot get a wallet without manual intervention, which blocks any real onboarding flow.

## What needs to be done

Implement a new Soroban contract at `contracts/factory/` that:

- Exposes a `deploy(public_key: BytesN<65>)` entry point
- Derives a deterministic contract address from the deployer's public key using a salt (e.g. SHA-256 of the raw P-256 public key bytes)
- Deploys the `invisible_wallet` contract Wasm via `env.deployer().with_address(...)`
- Initializes the deployed wallet with the provided public key as the registered signer
- Reverts with a clear error if the wallet for that key already exists

## Key files

- `contracts/invisible_wallet/src/lib.rs` — existing wallet contract, entry points, `__check_auth`
- `contracts/invisible_wallet/src/storage.rs` — signer storage patterns to replicate
- `contracts/invisible_wallet/src/auth.rs` — P-256 verification reference

## Implementation notes

- Use `soroban_sdk::deployer` — do NOT use `create_contract` directly
- Salt must be deterministic and derived solely from the public key so the address is predictable off-chain before deployment
- Keep the factory contract stateless except for tracking deployed addresses (optional — deployer handles dedup via address collision)
- Follow the same `WalletError` enum pattern from `lib.rs` for error variants

## Done when

- [ ] `contracts/factory/src/lib.rs` exists with `deploy()` implemented
- [ ] Calling `deploy()` twice with the same key returns an error (no duplicate wallets)
- [ ] The deployed wallet contract is initialized with the correct signer
- [ ] Contract compiles with `cargo build --target wasm32-unknown-unknown --release`
```

---

## Issue 2 — Deterministic Wallet Address Derivation (Off-chain)

**Complexity:** Medium (150pts)
**Label:** `Stellar Wave`

**Title:** `feat(sdk): add off-chain deterministic wallet address computation`

**Body:**
```
## Context

Veil deploys a unique Soroban contract instance per user (their passkey wallet). The factory contract uses the user's P-256 public key as a salt to derive the wallet's contract address deterministically.

## Problem

Users and the frontend currently have no way to know a wallet's contract address before it is deployed. This blocks UX patterns like showing the user their address on registration, pre-funding wallets, or checking if a wallet already exists.

## What needs to be done

Add a utility function to the SDK that computes the expected contract address given:
- The factory contract ID
- The user's raw P-256 public key (`Uint8Array`, 65 bytes uncompressed)

This must mirror exactly the salt derivation used in the factory contract (Issue #1).

## Key files

- `sdk/src/utils.ts` — existing crypto utilities (SHA-256, base64url, DER→raw)
- `sdk/src/useInvisibleWallet.ts` — React hook where the result will be surfaced

## Implementation notes

- Soroban deterministic address derivation follows: `contractAddress = SHA-256(networkId || deployer || salt)` — match the exact byte layout the factory contract uses
- Export the function as `computeWalletAddress(factoryId: string, publicKeyBytes: Uint8Array): string`
- Return the address as a Stellar strkey (`C...` format) using `@stellar/stellar-sdk`'s `StrKey`
- Expose `walletAddress` as a field returned by the `register()` flow in `useInvisibleWallet`

## Done when

- [ ] `computeWalletAddress()` exported from `sdk/src/utils.ts`
- [ ] Output matches the on-chain address after deployment (verified manually on testnet or via unit test)
- [ ] `register()` in the hook returns `walletAddress` alongside the existing fields
- [ ] TypeScript compiles cleanly (`tsc --noEmit`)
```

---

## Issue 3 — Unit Tests for Factory Contract

**Complexity:** Medium (150pts)
**Label:** `Stellar Wave`

**Title:** `test(contracts): add unit tests for factory contract`

**Body:**
```
## Context

The invisible_wallet contract (Phase 1) has 6 unit tests covering auth and storage. The new factory contract (Phase 3) needs equivalent coverage before it can be considered stable enough for testnet deployment.

## Problem

No tests exist yet for the factory contract. Without them, edge cases (duplicate deployment, bad key format, initialization failure) will only surface on testnet where debugging is slower.

## What needs to be done

Add a Soroban test module inside `contracts/factory/src/lib.rs` (or `tests/`) that covers:

1. **Happy path** — `deploy()` with a valid 65-byte P-256 public key succeeds and returns a contract address
2. **Duplicate prevention** — calling `deploy()` twice with the same key returns an error
3. **Bad input** — calling `deploy()` with a key of wrong length (e.g. 64 bytes, 0 bytes) returns an error
4. **Address determinism** — two independent calls to `deploy()` with the same key produce the same address (even if the second fails, the expected address must match)
5. **Wallet initialized** — after deployment, the wallet contract recognizes the public key as a valid signer

## Key files

- `contracts/invisible_wallet/src/lib.rs` — see existing test module for patterns (`#[cfg(test)]`, `Env::default()`, `register_contract`)
- `contracts/factory/src/lib.rs` — factory implementation (from Issue #1)

## Implementation notes

- Use `soroban_sdk::testutils` — do not write integration tests that require a running node
- Mock the `invisible_wallet` Wasm in tests using `register_contract_wasm` or the test environment's deployer
- Mirror the test structure from `invisible_wallet` tests for consistency

## Done when

- [ ] All 5 test cases above are implemented and pass via `cargo test`
- [ ] `cargo test` output shows 0 failures
- [ ] No `#[allow(unused)]` hacks — all test helpers are actually exercised
```

---

## Issue 4 — Integrate Factory Deployment into SDK Hook

**Complexity:** Medium (150pts)
**Label:** `Stellar Wave`

**Title:** `feat(sdk): add deploy() method to useInvisibleWallet hook`

**Body:**
```
## Context

`useInvisibleWallet` is a React hook (`sdk/src/useInvisibleWallet.ts`) that currently exposes `register()`, `signAuthEntry()`, and `login()`. Registration creates a WebAuthn credential and extracts the P-256 public key — but does not deploy the on-chain wallet contract.

## Problem

After `register()`, the user has a passkey but no deployed wallet. There is no SDK method to trigger factory deployment, leaving the caller to wire it up manually against the Stellar RPC — which is error-prone and leaks protocol details into application code.

## What needs to be done

Add a `deploy(factoryContractId: string)` async method to the hook that:

1. Reads the P-256 public key from the last `register()` result (or accepts it as a parameter)
2. Builds and submits a Soroban transaction calling `factory.deploy(publicKey)`
3. Returns the deployed wallet contract address
4. Emits a loading/error state consistent with the existing hook pattern

## Key files

- `sdk/src/useInvisibleWallet.ts` — add `deploy()` alongside `register()`, `login()`
- `sdk/src/utils.ts` — use `computeWalletAddress()` (from Issue #2) to predict address pre-submission
- Stellar SDK: use `SorobanRpc.Server`, `TransactionBuilder`, `contract.call()` pattern

## Implementation notes

- Accept `rpcUrl` and `networkPassphrase` as hook config (or top-level params) — do not hardcode testnet values
- Handle the case where the wallet is already deployed (factory returns error → catch and return existing address)
- Keep the hook framework-agnostic — no Next.js or Vite imports

## Done when

- [ ] `deploy(factoryContractId)` method exists on the hook's return value
- [ ] Method submits the factory transaction and resolves with the wallet address
- [ ] Loading and error states are exposed
- [ ] TypeScript compiles cleanly
- [ ] JSDoc comment on the method explains params and return value
```

---

## Issue 5 — Factory Contract Deployer Script

**Complexity:** Trivial (100pts)
**Label:** `Stellar Wave`

**Title:** `tooling: add Stellar CLI script to deploy factory contract to testnet`

**Body:**
```
## Context

Veil's factory contract needs to be deployed to Stellar testnet once before any wallet can be created. This is currently a manual multi-step process requiring knowledge of Stellar CLI flags and Wasm upload steps.

## Problem

There is no documented or scripted path to deploy the factory. New contributors or testers have to figure out the deployment sequence themselves, which is a barrier to running the project end-to-end.

## What needs to be done

Add a shell script at `scripts/deploy_factory.sh` that:

1. Builds the factory contract Wasm (`cargo build --target wasm32-unknown-unknown --release`)
2. Uploads the Wasm to testnet via `stellar contract upload`
3. Deploys the factory contract via `stellar contract deploy`
4. Prints the deployed factory contract ID to stdout
5. Optionally writes it to a `.env.testnet` file for SDK consumption

## Implementation notes

- Target Stellar testnet (Futurenet if testnet is unavailable) — use `--network testnet` flag
- Use `stellar keys` for the deployer identity — do not hardcode private keys
- Script should be idempotent: if the Wasm hash already exists on-chain, skip re-upload
- Add a `README` section or comment block at the top of the script explaining prerequisites (`stellar` CLI, funded testnet account)

## Done when

- [ ] `scripts/deploy_factory.sh` exists and is executable
- [ ] Running the script on a clean machine (with `stellar` CLI installed and a funded account) produces a valid contract ID
- [ ] Contract ID output is clearly labeled in stdout
- [ ] Script does not hardcode any private keys or mnemonics
```
