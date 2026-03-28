#!/usr/bin/env bash
# Creates Veil Wallet contribution issues on github.com/Miracle656/veil
# Prerequisites: gh CLI installed and authenticated (gh auth login)

REPO="Miracle656/veil"
LABEL="Stellar Wave"

echo "Ensuring Wave label exists..."
gh label create "$LABEL" --color "FDDA24" --description "Drips Wave program issue" --repo "$REPO" 2>/dev/null || true

echo ""
echo "Creating Issue 1 — QR code display for receive address (Trivial, 100pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(wallet): display wallet address as QR code on receive screen" \
  --label "$LABEL" \
  --body "## Context

The Veil wallet app (\`frontend/wallet/\`) has a receive flow that currently copies the wallet address to the clipboard. Users who want to receive funds from a mobile device or another person in person have no way to share their address visually.

## Problem

Without a QR code, receiving funds requires manually copying and pasting a 56-character Stellar address — a poor UX on mobile and impossible face-to-face.

## What needs to be done

1. Install the \`qrcode\` package: \`npm install qrcode @types/qrcode\`
2. In \`app/dashboard/page.tsx\`, update the **Receive** button to open a modal instead of just copying to clipboard.
3. The modal should:
   - Render a QR code of the wallet address using \`qrcode\` (or \`qrcode.react\`)
   - Display the full address in \`Inconsolata\` monospace below the QR code
   - Include a \"Copy address\" button
   - Follow the existing brand design system (near-black background, gold accents, \`card\` class)
4. The modal should be dismissible by clicking outside or pressing Escape.

## Key files

- \`frontend/wallet/app/dashboard/page.tsx\` — Receive button and page layout
- \`frontend/wallet/app/globals.css\` — modal/overlay styles if needed
- \`frontend/wallet/components/\` — create a \`QrModal.tsx\` component

## Implementation notes

- Use \`qrcode.react\` (\`<QRCodeSVG>\`) for a dependency-light SVG QR — no canvas needed
- QR code foreground: \`#FDDA24\` (gold), background: \`#0F0F0F\` (near-black)
- The modal overlay should be \`position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px)\`
- No emojis — use SVG icons only (consistent with the rest of the codebase)

## Complexity: Trivial — 100 Points

## Done when

- [ ] Receive button opens a modal with a scannable QR code of the wallet address
- [ ] QR code uses gold/near-black brand colours
- [ ] Copy address button works inside the modal
- [ ] Modal is dismissible
- [ ] \`tsc --noEmit\` passes with no new errors"

echo ""
echo "Creating Issue 2 — QR code scanner for send recipient (Medium, 150pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(wallet): add QR code scanner to auto-fill recipient address on send screen" \
  --label "$LABEL" \
  --body "## Context

The Veil wallet send screen (\`app/send/page.tsx\`) requires manually typing a 56-character Stellar address into the recipient field. On mobile, users commonly share addresses as QR codes — scanning is the expected UX.

## Problem

Without a QR scanner, sending funds on mobile requires error-prone manual address entry. This is a critical UX gap for a mobile-first passkey wallet.

## What needs to be done

1. Add a scan icon button to the right of the recipient address input on \`app/send/page.tsx\`.
2. Clicking the button opens a camera view using the browser's \`BarcodeDetector\` API (or a library like \`html5-qrcode\`).
3. When a valid Stellar \`G...\` address is detected:
   - Close the scanner
   - Populate the recipient input field with the scanned address
4. Handle permission denial gracefully — show a clear error message if camera access is denied.
5. Scanner should only be shown on devices where camera is available (\`navigator.mediaDevices?.getUserMedia\`).

## Key files

- \`frontend/wallet/app/send/page.tsx\` — recipient input field
- \`frontend/wallet/components/\` — create a \`QrScanner.tsx\` component

## Implementation notes

- Use \`html5-qrcode\` (\`npm install html5-qrcode\`) — it handles cross-browser camera access cleanly
- Validate the scanned result starts with \`G\` and is 56 characters before auto-filling — reject non-Stellar QR codes
- The scanner UI should overlay the page (full-screen modal), not replace the send form
- Fallback gracefully on desktop where no camera is available — hide the scan button entirely using \`navigator.mediaDevices\` feature detection
- Follow the existing brand design system for the scanner modal

## Complexity: Medium — 150 Points

## Done when

- [ ] Scan button appears next to recipient input on send screen
- [ ] Camera opens when scan button is tapped on mobile
- [ ] Valid Stellar address auto-fills the recipient field on scan
- [ ] Invalid QR codes (non-Stellar) are rejected with a clear message
- [ ] Camera permission denial is handled gracefully
- [ ] Button hidden on devices with no camera
- [ ] \`tsc --noEmit\` passes with no new errors"

echo ""
echo "Creating Issue 3 — Stellar asset support (High, 200pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(wallet): display and send non-XLM Stellar assets (SAC tokens and custom assets)" \
  --label "$LABEL" \
  --body "## Context

The Veil wallet currently only shows and sends XLM (native Stellar lumens). The Stellar network supports many other assets — including USDC, tokens deployed as Stellar Asset Contracts (SAC), and custom issued assets. A wallet that only handles XLM is not production-ready.

## Problem

Users cannot see or send non-XLM tokens in their wallet. This limits Veil's utility to a single asset and makes it unsuitable as a primary wallet.

## What needs to be done

1. **Asset list** — Update \`app/dashboard/page.tsx\` to fetch all balances from the Horizon account endpoint (already available at \`data.balances\`), not just the native XLM balance. Display each asset with:
   - Asset code (e.g. \`USDC\`, \`yXLM\`)
   - Issuer address (truncated: \`GABCD...1234\`)
   - Balance formatted to 4 decimal places
   - A generic token icon (SVG) when no logo is available

2. **Send any asset** — Update \`app/send/page.tsx\` to include an asset selector dropdown. The dropdown should list all assets in the wallet. \`Operation.payment()\` already supports any \`Asset\` — update the call to use the selected asset.

3. **Asset type** — Add a TypeScript type:
\`\`\`ts
interface WalletAsset {
  code: string        // e.g. 'XLM', 'USDC'
  issuer: string | null  // null for native XLM
  balance: string
  assetType: 'native' | 'credit_alphanum4' | 'credit_alphanum12'
}
\`\`\`

## Key files

- \`frontend/wallet/app/dashboard/page.tsx\` — \`fetchBalance()\` and Assets tab
- \`frontend/wallet/app/send/page.tsx\` — asset selector and \`Operation.payment()\` call

## Implementation notes

- The Horizon \`/accounts/{id}\` response already returns all balances — no extra API calls needed
- For the asset selector, a simple \`<select>\` styled with the existing input styles is fine — no need for a custom dropdown component
- \`Asset.native()\` for XLM; \`new Asset(code, issuer)\` for everything else
- Do not add a token price feed — out of scope. Balance display only.

## Complexity: High — 200 Points

## Done when

- [ ] All asset balances displayed in Assets tab (not just XLM)
- [ ] Each non-native asset shows code + truncated issuer
- [ ] Send screen has an asset selector populated from the wallet's holdings
- [ ] \`Operation.payment()\` uses the selected asset
- [ ] \`WalletAsset\` type defined and used throughout
- [ ] \`tsc --noEmit\` passes with no new errors"

echo ""
echo "Creating Issue 4 — Transaction detail view (Trivial, 100pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(wallet): tap a transaction in Activity tab to view full details" \
  --label "$LABEL" \
  --body "## Context

The Veil wallet Activity tab shows a list of recent transactions. Each row shows the type, counterparty (truncated), and amount. However, users have no way to see the full transaction hash, full addresses, memo text, or a link to the Stellar Explorer.

## Problem

Without a detail view, users cannot verify a specific transaction, get the full tx hash for support purposes, or open the transaction in Stellar Expert.

## What needs to be done

1. Make each transaction row in \`app/dashboard/page.tsx\` tappable.
2. Tapping a row opens a bottom sheet or modal showing:
   - Transaction type (Send / Receive) with the appropriate icon
   - Full sender and recipient addresses (copyable, \`Inconsolata\` monospace)
   - Amount and asset
   - Memo (if present)
   - Timestamp (formatted: e.g. \"Mar 27, 2026 at 14:32\")
   - Transaction hash (truncated with copy button)
   - \"View on Stellar Expert\" link → \`https://stellar.expert/explorer/testnet/tx/{hash}\`
3. The detail view should slide up from the bottom on mobile (CSS transition) or appear as a centred modal on desktop.

## Key files

- \`frontend/wallet/app/dashboard/page.tsx\` — transaction list in Activity tab
- \`frontend/wallet/components/\` — create a \`TxDetailSheet.tsx\` component

## Implementation notes

- The Horizon payments endpoint already returns all required fields — no additional API calls needed
- Use a bottom sheet pattern: \`position: fixed; bottom: 0; left: 0; right: 0\` with a slide-up CSS transition
- \"View on Stellar Expert\" should open in a new tab (\`target=\"_blank\" rel=\"noopener\"\`)
- Copy buttons should use \`navigator.clipboard.writeText()\` — same pattern as the address chip in the nav
- No emojis — SVG icons only

## Complexity: Trivial — 100 Points

## Done when

- [ ] Tapping a transaction row opens a detail sheet/modal
- [ ] Full addresses, amount, asset, timestamp visible
- [ ] Memo shown when present
- [ ] Transaction hash copyable
- [ ] \"View on Stellar Expert\" link opens explorer
- [ ] Detail sheet dismissible (tap outside or close button)
- [ ] \`tsc --noEmit\` passes with no new errors"

echo ""
echo "Creating Issue 5 — Testnet faucet button (Trivial, 100pts)..."
gh issue create \
  --repo "$REPO" \
  --title "feat(wallet): add one-tap Friendbot faucet button for zero-balance testnet wallets" \
  --label "$LABEL" \
  --body "## Context

New Veil wallets deployed on Stellar Testnet start with zero XLM. Before a user can do anything — send, sign, or interact with contracts — they need testnet XLM. Currently there is no way to fund a wallet from inside the app; the user must manually visit the Stellar Friendbot URL.

## Problem

New users hit a wall immediately after creating their wallet: zero balance, no obvious next step, no way to get testnet funds from within the app. This kills the onboarding experience during demos and testing.

## What needs to be done

1. In \`app/dashboard/page.tsx\`, detect when the wallet balance is \`0\` (or the account does not exist on Horizon yet).
2. When balance is zero, show a \"Fund with testnet XLM\" button below the balance display.
3. Clicking it calls:
   \`https://friendbot.stellar.org/?addr={walletAddress}\`
4. While the request is in flight, show the existing spinner component.
5. On success, re-fetch the balance and hide the faucet button.
6. On error, show a brief error message.
7. The button should only appear when \`NEXT_PUBLIC_NETWORK=testnet\` — hide it entirely on mainnet.

## Key files

- \`frontend/wallet/app/dashboard/page.tsx\` — balance display and faucet button
- \`frontend/wallet/.env.example\` — \`NEXT_PUBLIC_NETWORK\` is already documented here

## Implementation notes

- Friendbot endpoint: \`https://friendbot.stellar.org/?addr=\${address}\` — simple GET request, no auth needed
- A 404 from Horizon's \`/accounts/{id}\` means the account doesn't exist yet (unfunded) — treat this the same as zero balance for the faucet button condition
- The button should use the \`btn-ghost\` class (not \`btn-gold\`) so it looks secondary to the main actions
- This feature must be gated on \`process.env.NEXT_PUBLIC_NETWORK === 'testnet'\` — do not show on mainnet

## Complexity: Trivial — 100 Points

## Done when

- [ ] Faucet button appears when balance is 0 or account does not exist
- [ ] Button hidden when balance > 0
- [ ] Button hidden when \`NEXT_PUBLIC_NETWORK !== 'testnet'\`
- [ ] Friendbot called on click; spinner shown while in flight
- [ ] Balance refreshes automatically after successful funding
- [ ] Errors handled gracefully
- [ ] \`tsc --noEmit\` passes with no new errors"

echo ""
echo "All 5 Veil Wallet issues created. Total points available: 650"
echo "View issues at: https://github.com/Miracle656/veil/issues"
