#!/usr/bin/env bash
# Creates Veil Wallet contribution issues — batch 2 (issues 6–12)
# Prerequisites: gh CLI installed and authenticated (gh auth login)

REPO="Miracle656/veil"
LABEL="Stellar Wave"

echo "Ensuring Wave label exists..."
gh label create "$LABEL" --color "FDDA24" --description "Drips Wave program issue" --repo "$REPO" 2>/dev/null || true

echo ""
echo "Creating Issue 6 — WebAuthn-signed transactions via signAuthEntry (High, 200pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(wallet): sign send transactions with the user's passkey via signAuthEntry" \
  --label "$LABEL" \
  --body "## Context

The Veil wallet's send flow (\`app/send/page.tsx\`) currently signs transactions with a plain Stellar ed25519 keypair stored in \`sessionStorage\`. This defeats the entire purpose of Veil — the wallet's unique value is that all signing is done with the user's WebAuthn passkey (P-256 biometric credential), verified on-chain inside \`__check_auth\`.

## Problem

Using a plain Stellar keypair for signing means the wallet is not actually using WebAuthn at all. Any attacker with access to \`sessionStorage\` can drain the wallet. The current implementation is a placeholder — the real flow must go through \`signAuthEntry()\` in the Veil SDK.

## What needs to be done

The send flow must be rewritten to use Soroban's custom account auth model:

1. Build a Stellar \`Transaction\` that invokes the wallet contract's \`execute()\` entry point (which calls \`env.current_contract_address().require_auth()\` internally) rather than using \`Operation.payment()\` directly.
2. Simulate the transaction to get the \`SorobanAuthorizationEntry\` that needs to be signed.
3. Call \`wallet.signAuthEntry(authEntry)\` — this triggers the WebAuthn prompt and returns a signed \`WebAuthnSignature\`.
4. Attach the signature to the transaction and submit.

Refer to the SDK's \`signAuthEntry()\` method in \`sdk/src/useInvisibleWallet.ts\` for the signing interface.

## Key files

- \`frontend/wallet/app/send/page.tsx\` — \`handleSend()\` function
- \`sdk/src/useInvisibleWallet.ts\` — \`signAuthEntry()\` method to call
- \`contracts/invisible_wallet/src/lib.rs\` — \`execute()\` entry point that wraps contract-auth payments

## Implementation notes

- The fee-payer keypair (a random Stellar keypair stored in session) still pays the base fee — this is separate from the WebAuthn authorization
- The flow is: build tx → simulate → extract \`SorobanAuthorizationEntry\` → \`signAuthEntry(entry)\` → attach signature → submit
- The WebAuthn prompt will appear when \`signAuthEntry\` is called — this is expected and is the UX moment that makes Veil special
- If the wallet contract does not yet have an \`execute()\` wrapper for payments, the contributor should add a minimal one to \`lib.rs\` as part of this PR

## Complexity: High — 200 Points

## Done when

- [ ] \`handleSend()\` uses \`signAuthEntry()\` instead of \`Keypair.sign()\`
- [ ] WebAuthn prompt appears when user confirms a send
- [ ] Transaction is submitted and confirmed on testnet
- [ ] No plain private key involved in signing the payment authorization
- [ ] \`tsc --noEmit\` passes with no new errors"

echo ""
echo "Creating Issue 7 — Lock screen and session timeout (Medium, 150pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(wallet): add lock screen with passkey re-authentication after inactivity" \
  --label "$LABEL" \
  --body "## Context

The Veil wallet stores the session (wallet address and fee-payer key) in \`sessionStorage\`. Once the wallet is open, it stays open indefinitely — even if the user leaves their phone unattended. A passkey wallet with no lock screen is a security risk in practice.

## Problem

There is no automatic lock after inactivity. Any person who picks up the user's unlocked device can access the wallet UI and initiate transactions.

## What needs to be done

1. Add an inactivity timer that fires after **5 minutes** of no user interaction (no clicks, scrolls, or keypresses).
2. When the timer fires, clear \`sessionStorage\` and redirect to a **lock screen** at \`/lock\`.
3. The lock screen (\`app/lock/page.tsx\`) should:
   - Show the Veil logo and a brief message (\"Wallet locked\")
   - Show a \"Unlock with passkey\" button
   - Call \`wallet.login()\` when tapped — this triggers a WebAuthn assertion
   - On success, restore the session and redirect to \`/dashboard\`
4. Track last-activity timestamp in a \`useRef\` and reset it on \`window\` events (\`mousemove\`, \`keydown\`, \`touchstart\`, \`click\`).
5. Use a \`useEffect\` in the dashboard layout to run the inactivity check.

## Key files

- \`frontend/wallet/app/dashboard/page.tsx\` — add inactivity timer
- \`frontend/wallet/app/lock/page.tsx\` — new lock screen page
- \`sdk/src/useInvisibleWallet.ts\` — \`login()\` used for re-authentication

## Implementation notes

- The 5-minute timeout should be a named constant \`LOCK_TIMEOUT_MS = 5 * 60 * 1000\` at the top of the file
- Use \`useRef\` for the timer ID and last-activity timestamp — do not store in state (avoids re-renders)
- The lock screen does not need to show the wallet address — it should be minimal (logo, lock icon, unlock button)
- \`login()\` returns the wallet address — verify it matches the stored address before restoring the session to prevent account-switching attacks

## Complexity: Medium — 150 Points

## Done when

- [ ] Wallet locks after 5 minutes of inactivity
- [ ] Lock screen shows Veil logo and unlock button
- [ ] \`login()\` called on unlock — WebAuthn prompt appears
- [ ] Session restored and dashboard shown after successful unlock
- [ ] Any interaction (click, scroll, keypress) resets the inactivity timer
- [ ] \`tsc --noEmit\` passes with no new errors"

echo ""
echo "Creating Issue 8 — Signer list view in settings (Trivial, 100pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(wallet): display list of registered signers in settings page" \
  --label "$LABEL" \
  --body "## Context

The Veil wallet settings page (\`app/settings/page.tsx\`) lets users add and remove signers, but there is no way to see which signers are currently registered. A user adding a second device has no confirmation that it was successfully registered.

## Problem

After adding a signer, the user sees a success message but cannot verify the signer list. There is no UI to inspect or manage existing signers by index.

## What needs to be done

1. Add a \`getSigners()\` call on the settings page overview section using the Stellar SDK to read the \`Signers\` storage key from the contract via \`server.getContractData()\` or a simulation of a view function.
2. Display the signers as a list on the overview screen:
   - Index (e.g. #0, #1)
   - Truncated public key (\`0x04ABCD...1234\` — first 6 and last 4 bytes of the 65-byte key, hex-encoded)
   - \"This device\" badge next to the key that matches the currently registered public key
   - A \"Remove\" button for any signer that is not the last one (call \`wallet.removeSigner()\`)
3. The list should refresh after adding or removing a signer.

## Key files

- \`frontend/wallet/app/settings/page.tsx\` — overview section
- \`sdk/src/useInvisibleWallet.ts\` — \`addSigner()\`, \`removeSigner()\` already implemented
- \`contracts/invisible_wallet/src/storage.rs\` — \`DataKey::Signers\` — the \`Map<u32, BytesN<65>>\` to read

## Implementation notes

- Use \`server.getContractData(contractId, xdr.ScVal)\` to read the \`Signers\` map directly — no contract method call needed
- Alternatively, add a \`get_signers() -> Map<u32, BytesN<65>>\` read-only entry point to the contract and simulate it
- The \"This device\" detection works by comparing stored signer keys against the public key returned by the last \`register()\` or \`login()\` call (store it in \`sessionStorage\` during onboarding)
- Removing the last signer should be disabled in the UI (greyed-out button) — the contract will also reject it, but fail early in the UI

## Complexity: Trivial — 100 Points

## Done when

- [ ] Signer list visible on settings overview
- [ ] Each signer shows index and truncated public key
- [ ] \"This device\" badge shown for the current device's key
- [ ] Remove button present for each signer (disabled for last signer)
- [ ] List refreshes after add/remove
- [ ] \`tsc --noEmit\` passes with no new errors"

echo ""
echo "Creating Issue 9 — Address book / contacts (Medium, 150pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(wallet): add address book so users can save and reuse named Stellar contacts" \
  --label "$LABEL" \
  --body "## Context

The Veil wallet send screen requires users to manually type or paste a 56-character Stellar address every time they send funds. There is no way to save a frequently-used address with a human-readable name.

## Problem

Sending to the same address repeatedly is error-prone and tedious. Without saved contacts, users must copy-paste addresses from external sources every time — a poor UX that creates risk of address-swap attacks.

## What needs to be done

1. Create a contacts store using \`localStorage\` (persists across sessions, no backend needed):
\`\`\`ts
interface Contact {
  id: string       // uuid or Date.now() string
  name: string     // e.g. \"Alice\", \"My cold wallet\"
  address: string  // Stellar G... address
}
\`\`\`

2. Add a \`/contacts\` page (\`app/contacts/page.tsx\`) that:
   - Lists all saved contacts (name + truncated address)
   - Has an \"Add contact\" form (name + address fields)
   - Has a delete button on each contact row

3. Update the send screen (\`app/send/page.tsx\`) to show a contacts picker:
   - A \"Choose from contacts\" link below the recipient input
   - Opens a modal/sheet listing saved contacts
   - Tapping a contact fills the recipient field and closes the modal

4. Add a \"Save as contact\" shortcut on the transaction detail sheet (Issue #4) so users can save the counterparty of any past transaction.

## Key files

- \`frontend/wallet/app/contacts/page.tsx\` — new contacts management page
- \`frontend/wallet/app/send/page.tsx\` — contacts picker integration
- \`frontend/wallet/components/\` — create \`ContactPicker.tsx\` and \`useContacts.ts\` hook

## Implementation notes

- \`localStorage\` is the right store here — no server, no sync, no passkey required
- \`useContacts\` hook should expose \`contacts\`, \`addContact()\`, \`removeContact(id)\` with \`useState\` + \`localStorage\` sync
- Validate the address is a valid G... Stellar strkey before saving — use \`StrKey.isValidEd25519PublicKey()\` from \`stellar-sdk\`
- Add a link to contacts from the Settings overview screen

## Complexity: Medium — 150 Points

## Done when

- [ ] \`/contacts\` page lists, adds, and deletes contacts
- [ ] Send screen has a contacts picker that auto-fills recipient
- [ ] Addresses validated before saving
- [ ] Contacts persist across page refreshes via \`localStorage\`
- [ ] Link to contacts page in settings overview
- [ ] \`tsc --noEmit\` passes with no new errors"

echo ""
echo "Creating Issue 10 — Stellar DEX swap (High, 200pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(wallet): add token swap screen using Stellar DEX path payments" \
  --label "$LABEL" \
  --body "## Context

The Veil wallet currently only supports sending tokens. The Stellar network has a built-in decentralised exchange (SDEX) that allows swapping any asset for any other asset via path payments. Adding a swap screen would make Veil a fully self-contained wallet — no need for a separate DEX app.

## Problem

Users who hold XLM but want USDC (or vice versa) must leave the wallet and use an external DEX. This breaks the self-contained wallet UX and is a gap compared to other mobile wallets.

## What needs to be done

1. Add a \`/swap\` page (\`app/swap/page.tsx\`) with:
   - \"You pay\" asset selector + amount input
   - \"You receive\" asset selector (read-only amount — populated from path-find)
   - \"Swap\" confirm button

2. Use Horizon's path-find endpoint to get the best rate:
   \`GET https://horizon-testnet.stellar.org/paths/strict-send?source_asset_type=native&source_amount={amount}&destination_assets={dest_asset}\`

3. Build and submit a \`pathPaymentStrictSend\` operation using \`stellar-sdk\`:
\`\`\`ts
Operation.pathPaymentStrictSend({
  sendAsset: sourceAsset,
  sendAmount: amount,
  destination: walletAddress, // swap to self
  destAsset: destAsset,
  destMin: minReceived,       // apply 0.5% slippage tolerance
  path: pathFromHorizon,
})
\`\`\`

4. Sign the transaction using the fee-payer keypair (same as send flow — WebAuthn signing will be addressed in Issue #6).

5. Show a preview of the rate (e.g. \"1 XLM ≈ 0.097 USDC\") before the user confirms.

## Key files

- \`frontend/wallet/app/swap/page.tsx\` — new swap page
- \`frontend/wallet/app/dashboard/page.tsx\` — add Swap button to action row

## Implementation notes

- Only show assets the wallet actually holds in the \"You pay\" selector — read from the same balance data used in the Assets tab
- Apply a 0.5% slippage tolerance to \`destMin\`: \`destMin = estimatedReceive * 0.995\`
- Re-fetch the path-find estimate when the amount input changes (debounce 500ms)
- On testnet, USDC is available as \`USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5\`
- Add a \"Swap\" icon button to the dashboard action row alongside Send and Receive

## Complexity: High — 200 Points

## Done when

- [ ] \`/swap\` page with asset selectors and amount inputs
- [ ] Path-find called to estimate received amount
- [ ] Rate preview shown before confirm
- [ ] \`pathPaymentStrictSend\` transaction built, signed, and submitted
- [ ] Swap button added to dashboard action row
- [ ] Slippage tolerance applied
- [ ] \`tsc --noEmit\` passes with no new errors"

echo ""
echo "Creating Issue 11 — Progressive Web App (PWA) support (Medium, 150pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(wallet): add PWA manifest and service worker so Veil wallet is installable on mobile" \
  --label "$LABEL" \
  --body "## Context

The Veil wallet is built with Next.js and is designed for mobile-first use. However, it currently runs only as a browser tab — it cannot be installed to the home screen on iOS or Android. Adding PWA support would make Veil feel like a native app and is standard for any production wallet.

## Problem

Without a web app manifest and service worker, users cannot install Veil to their home screen. The wallet has no app icon, no splash screen, and no offline fallback — it feels like a website, not a wallet.

## What needs to be done

1. Add a \`public/manifest.json\`:
\`\`\`json
{
  \"name\": \"Veil Wallet\",
  \"short_name\": \"Veil\",
  \"description\": \"Passkey-powered Stellar wallet\",
  \"start_url\": \"/\",
  \"display\": \"standalone\",
  \"background_color\": \"#0F0F0F\",
  \"theme_color\": \"#FDDA24\",
  \"icons\": [...]
}
\`\`\`

2. Add app icons at \`public/icons/\`: 192×192 and 512×512 PNG versions of the Veil fingerprint logo in gold on near-black background.

3. Add \`<link rel=\"manifest\">\` and \`<meta name=\"theme-color\">\` to \`app/layout.tsx\`.

4. Add a basic service worker using Next.js's \`next-pwa\` package (\`npm install next-pwa\`) that:
   - Caches static assets for offline use
   - Shows a minimal offline fallback page (\`/offline\`) when the network is unavailable

5. Add an \"Add to home screen\" banner on the dashboard that appears when \`window.BeforeInstallPromptEvent\` fires (Android) or shows instructions for iOS (Safari share → Add to Home Screen).

## Key files

- \`frontend/wallet/public/manifest.json\` — new file
- \`frontend/wallet/public/icons/\` — new directory with icon PNGs
- \`frontend/wallet/app/layout.tsx\` — add manifest link and meta tags
- \`frontend/wallet/next.config.js\` — wrap with \`next-pwa\`
- \`frontend/wallet/app/offline/page.tsx\` — new offline fallback page

## Implementation notes

- Icons must be PNG — SVG is not supported in web app manifests for iOS
- \`next-pwa\` wraps \`next.config.js\`: \`const withPWA = require('next-pwa')({ dest: 'public' })\`
- The install banner should be dismissible and not shown again for 7 days (store dismiss timestamp in \`localStorage\`)
- iOS does not support the install prompt API — show a static instruction card instead when \`navigator.userAgent\` includes \`iPhone\` or \`iPad\`

## Complexity: Medium — 150 Points

## Done when

- [ ] \`manifest.json\` present with correct brand colours and icons
- [ ] 192×192 and 512×512 icons provided
- [ ] Wallet installable to home screen on Android Chrome
- [ ] iOS add-to-home-screen instructions shown on Safari
- [ ] Service worker caches static assets
- [ ] Offline fallback page renders when network is unavailable
- [ ] \`tsc --noEmit\` passes with no new errors"

echo ""
echo "Creating Issue 12 — First-time onboarding tutorial overlay (Trivial, 100pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(wallet): add first-time user onboarding tutorial that explains passkey wallets" \
  --label "$LABEL" \
  --body "## Context

New users who land on the Veil wallet for the first time may not understand what a passkey wallet is, why there's no seed phrase, or what \"deploying\" a wallet means. Without any explanation, the onboarding screen (just two buttons: Create wallet / Recover) can be confusing.

## Problem

There is no educational moment that explains the core concept: your fingerprint/Face ID IS your key. Users who are unfamiliar with passkey wallets may abandon onboarding because they don't understand what's happening.

## What needs to be done

1. Add a 3-step tutorial overlay that appears the **first time** a user opens the wallet (detected via \`localStorage.getItem('veil_seen_tutorial')\`).

2. The 3 steps should be:
   - **Step 1 — No seed phrase.** \"Veil uses your device's biometrics as your key. No seed phrase, no private key file — just your fingerprint or Face ID.\"
   - **Step 2 — Your passkey, your wallet.** \"When you create a wallet, your device registers a passkey. The cryptographic public key is stored on-chain. Only your device can sign.\"
   - **Step 3 — Ready to start.** \"Tap Create wallet to register your passkey and deploy your wallet on Stellar. It takes about 10 seconds.\"

3. Each step shows:
   - A relevant SVG icon (fingerprint / lock / rocket — no emojis)
   - A short heading in Lora Italic
   - Body text in Inter
   - Step indicator dots (e.g. ● ○ ○)
   - Next / Get started buttons

4. After the tutorial, set \`localStorage.setItem('veil_seen_tutorial', '1')\` so it never shows again.

5. Add a \"Skip\" link on step 1 for returning users who dismissed storage (e.g. private browsing).

## Key files

- \`frontend/wallet/app/page.tsx\` — onboarding page, check for tutorial flag
- \`frontend/wallet/components/OnboardingTutorial.tsx\` — new component

## Implementation notes

- The tutorial overlay should be \`position: fixed; inset: 0\` — full screen, not a small modal
- Use Framer Motion (\`motion.div\` with \`AnimatePresence\`) for step-to-step transitions — already a dependency in \`package.json\`
- The overlay should sit above everything with \`z-index: 100\`
- All icons must be inline SVG — no emoji, consistent with the rest of the design system
- Keep copy short — users are trying to create a wallet, not read an essay

## Complexity: Trivial — 100 Points

## Done when

- [ ] Tutorial shown on first visit only
- [ ] 3 steps with correct copy, icons, and step indicators
- [ ] Framer Motion transitions between steps
- [ ] \"Skip\" link works on step 1
- [ ] \`localStorage\` flag set after completion — tutorial never shows again
- [ ] \`tsc --noEmit\` passes with no new errors"

echo ""
echo "All 7 additional Veil Wallet issues created."
echo "Total wallet issues: 12 | Total points: 1,350"
echo "View issues at: https://github.com/Miracle656/veil/issues"
