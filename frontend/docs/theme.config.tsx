import { DocsThemeConfig } from 'nextra-theme-docs'
import React from 'react'

// Stellar Brand Manual 2025
// Gold #FDDA24 → HSL h≈51°, s≈98%
// Near-Black #0F0F0F, Off-White #F6F7F8
// Fonts: Lora (headings), Inter (body), Anton (accent labels)

const Logo = () => (
  <span
    style={{
      fontFamily: "'Lora', Georgia, serif",
      fontWeight: 600,
      fontStyle: 'italic',
      fontSize: '1.15rem',
      color: '#FDDA24',
      letterSpacing: '-0.01em',
    }}
  >
    Veil
  </span>
)

const config: DocsThemeConfig = {
  logo: <Logo />,

  project: {
    link: 'https://github.com/stellar/invisible-wallet',
  },

  docsRepositoryBase:
    'https://github.com/stellar/invisible-wallet/tree/main/frontend/docs',

  footer: {
    text: (
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#D6D2C4' }}>
        © {new Date().getFullYear()} Veil — Powered by Stellar Soroban · WebAuthn / FIDO2 · MIT
      </span>
    ),
  },

  // Gold as primary accent (hue 51, sat 98)
  primaryHue: 51,
  primarySaturation: 98,

  useNextSeoProps() {
    return { titleTemplate: '%s – Veil Docs' }
  },

  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta
        name="description"
        content="Veil — Passkey-powered Stellar smart wallet. SDK reference, contract API, and architecture docs."
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400;1,600&family=Inter:wght@400;500&family=Anton&display=swap"
        rel="stylesheet"
      />
    </>
  ),

  sidebar: {
    defaultMenuCollapseLevel: 1,
    titleComponent({ title }) {
      return (
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>
          {title}
        </span>
      )
    },
  },

  toc: {
    backToTop: true,
  },

  editLink: {
    text: 'Edit this page on GitHub',
  },

  feedback: {
    content: 'Question? Give us feedback',
    labels: 'feedback',
  },

  banner: {
    key: 'phase-3-v2',
    text: (
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem' }}>
        Phase 3 (Factory Contract) is open for contributors —{' '}
        <a
          href="https://github.com/stellar/invisible-wallet/issues"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'underline', color: '#FDDA24' }}
        >
          see open issues
        </a>
      </span>
    ),
  },
}

export default config
