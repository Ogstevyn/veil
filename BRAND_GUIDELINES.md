# Veil Brand Guidelines

All UI contributions to the Veil wallet app must follow the Stellar Brand Manual 2025 design system. This document is the single source of truth for contributors.

---

## Color Palette

Use CSS variables defined in `frontend/wallet/app/globals.css`. Never hardcode hex values in component files.

| Token | CSS Variable | Hex | Usage |
|---|---|---|---|
| Gold | `var(--gold)` | `#FDDA24` | Primary accent, CTAs, wordmark, active states |
| Near-Black | `var(--near-black)` | `#0F0F0F` | Page background (set on `body` — do not repeat on page divs) |
| Off-White | `var(--off-white)` | `#F6F7F8` | Body text, primary content |
| Lilac | `var(--lilac)` | `#B7ACE8` | Secondary highlights |
| Teal | `var(--teal)` | `#00A7B5` | Success states, confirmations |
| Warm Grey | `var(--warm-grey)` | `#D6D2C4` | Muted labels |
| Navy | `var(--navy)` | `#002E5D` | Deep contrast backgrounds |

**Surface tokens** (semi-transparent overlays — use these for cards and containers):

| Token | CSS Variable | Value |
|---|---|---|
| Surface | `var(--surface)` | `rgba(255,255,255,0.03)` |
| Surface medium | `var(--surface-md)` | `rgba(255,255,255,0.06)` |
| Border dim | `var(--border-dim)` | `rgba(255,255,255,0.08)` |

---

## Typography

Four fonts are loaded globally. Do not import additional fonts.

| Role | Font | CSS | Example usage |
|---|---|---|---|
| Headings | Lora SemiBold Italic | `fontFamily: 'Lora, Georgia, serif'` + `fontWeight: 600` + `fontStyle: 'italic'` | Page titles, card headings, confirmation messages |
| Accent labels (≤6 words) | Anton ALL CAPS | `fontFamily: 'Anton, Impact, sans-serif'` + `letterSpacing: '0.08em'` + uppercase text | Wordmark "VEIL", section labels, badges |
| Body / UI | Inter | Default — set on `body`, no override needed | Paragraphs, button labels, descriptions |
| Code / addresses | Inconsolata | `fontFamily: 'Inconsolata, monospace'` | Wallet addresses, contract IDs, transaction hashes |

### Examples

```tsx
// Page heading
<h1 style={{ fontFamily: 'Lora, Georgia, serif', fontWeight: 600, fontStyle: 'italic', fontSize: '1.75rem', color: 'var(--off-white)' }}>
  Dashboard
</h1>

// Wordmark
<span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: '1.25rem', letterSpacing: '0.08em', color: 'var(--gold)' }}>
  VEIL
</span>

// Wallet address — use the .address-chip class
<span className="address-chip">
  {address.slice(0, 6)}…{address.slice(-6)}
</span>
```

---

## Gold Highlight

Use the `.hl` CSS class to highlight inline text. This renders as a translucent gold marker underlay — **not** `text-decoration` or a background color.

```tsx
<p>Your <span className="hl">passkey is your wallet</span>.</p>
```

---

## Layout Classes

Use the pre-built layout classes from `globals.css` instead of reimplementing with raw Tailwind.

```tsx
// Full-page shell
<div className="wallet-shell">

  // Sticky top nav bar
  <header className="wallet-nav">
    <span style={{ fontFamily: 'Anton, Impact, sans-serif', ... }}>VEIL</span>
    <span className="address-chip">G3AB…XK91</span>
  </header>

  // Centered, max-width content area
  <main className="wallet-main">
    {/* page content */}
  </main>

</div>
```

Do **not** add `bg-[...]` to the root page div — the body background is already `var(--near-black)`.

---

## Component Classes

Use the design system classes from `globals.css`. Do not replicate their styles inline.

### Buttons

```tsx
// Primary CTA
<button className="btn-gold" onClick={...}>
  Create wallet
</button>

// Secondary / ghost
<button className="btn-ghost" onClick={...}>
  Recover existing wallet
</button>
```

- Both classes handle hover, active scale, disabled opacity, and full-width layout automatically.
- Button labels use Inter (the default). Do not apply Anton to button text.

### Cards

```tsx
// Standard card (dark surface + border)
<div className="card">...</div>

// Slightly lighter card
<div className="card-md">...</div>
```

### Inputs

```tsx
<input className="input-field" placeholder="Amount" />

// Monospace input (addresses, hashes)
<input className="input-field mono" placeholder="G..." />
```

### Status Badges

```tsx
<span className="badge-success">Confirmed</span>
<span className="badge-pending">Pending</span>
```

### Loading Spinner

```tsx
// On dark background
<div className="spinner spinner-light" />

// On gold button background
<div className="spinner" />
```

### Biometric Pulse (onboarding / lock screens)

```tsx
<div style={{ position: 'relative' }} className="biometric-pulse">
  <VeilLogo size={64} />
</div>
```

---

## Icons

Use [Lucide React](https://lucide.dev) SVG icons. Never use emoji in UI.

```tsx
import { Fingerprint, LockKeyhole, ArrowRight } from 'lucide-react'

<Fingerprint size={20} strokeWidth={1.5} />
```

Set `strokeWidth={1.5}` on all icons for consistent visual weight.

---

## Common Mistakes to Avoid

| Wrong | Right |
|---|---|
| `bg-[#0A0A0A]` on page root | Remove — body sets `#0F0F0F` |
| `bg-[#0F0F0F]` on page root | Remove — body sets it already |
| `font-serif font-semibold italic` (Tailwind) | `style={{ fontFamily: 'Lora, Georgia, serif', fontWeight: 600, fontStyle: 'italic' }}` |
| `font-mono` for addresses | `className="address-chip"` |
| Inline Tailwind card styles | `className="card"` or `className="card-md"` |
| Inline Tailwind button styles | `className="btn-gold"` or `className="btn-ghost"` |
| Hardcoded `#FDDA24` | `var(--gold)` |
| Hardcoded `#F6F7F8` | `var(--off-white)` |
| `text-underline` for emphasis | `className="hl"` (gold marker highlight) |
| Emoji characters | Lucide React SVG icons |

---

## Quick Reference Card

```
Background:   var(--near-black)  #0F0F0F
Primary:      var(--gold)        #FDDA24
Text:         var(--off-white)   #F6F7F8
Success:      var(--teal)        #00A7B5
Headings:     Lora SemiBold Italic
Wordmark:     Anton ALL CAPS  letterSpacing: 0.08em
Body:         Inter (default)
Code/Address: Inconsolata  →  .address-chip
Buttons:      .btn-gold / .btn-ghost
Cards:        .card / .card-md
Layout:       .wallet-shell > .wallet-nav + .wallet-main
```
