'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'

export default function ReceivePage() {
  const router = useRouter()
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('invisible_wallet_address')
    if (!stored) { router.replace('/lock'); return }
    setWalletAddress(stored)
  }, [router])

  const handleCopy = async () => {
    if (!walletAddress) return
    await navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="wallet-shell">
      <header className="wallet-nav">
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--off-white)', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <span style={{
          fontFamily: 'Anton, Impact, sans-serif',
          fontSize: '1.25rem', letterSpacing: '0.08em',
          color: 'var(--gold)', userSelect: 'none',
        }}>
          VEIL
        </span>
      </header>

      <main className="wallet-main" style={{ paddingTop: '3rem', paddingBottom: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <h1 style={{
            fontFamily: 'Lora, Georgia, serif', fontWeight: 600, fontStyle: 'italic',
            fontSize: '1.75rem', color: 'var(--off-white)', marginBottom: '0.375rem',
          }}>
            Receive
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'rgba(246,247,248,0.5)' }}>
            Share your address to receive XLM or any Stellar asset.
          </p>
        </div>

        {walletAddress ? (
          <>
            {/* QR code */}
            <div style={{
              background: '#ffffff',
              borderRadius: '1rem',
              padding: '1.25rem',
              marginBottom: '2rem',
              boxShadow: '0 0 0 1px var(--border-dim)',
            }}>
              <QRCodeSVG
                value={walletAddress}
                size={220}
                bgColor="#ffffff"
                fgColor="#0F0F0F"
                level="M"
              />
            </div>

            {/* Address display */}
            <div className="card" style={{ width: '100%', marginBottom: '1.25rem', textAlign: 'center', padding: '1rem 1.25rem' }}>
              <p style={{ fontSize: '0.6875rem', fontFamily: 'Anton, Impact, sans-serif', letterSpacing: '0.08em', color: 'var(--warm-grey)', marginBottom: '0.625rem' }}>
                WALLET ADDRESS
              </p>
              <p style={{
                fontFamily: 'Inconsolata, monospace',
                fontSize: '0.8125rem',
                color: 'var(--off-white)',
                wordBreak: 'break-all',
                lineHeight: 1.6,
              }}>
                {walletAddress}
              </p>
            </div>

            {/* Copy button */}
            <button
              className="btn-gold"
              onClick={handleCopy}
              style={{ maxWidth: '20rem' }}
            >
              {copied ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Copy Address
                </>
              )}
            </button>
          </>
        ) : (
          <div className="spinner spinner-light" style={{ width: '2rem', height: '2rem', marginTop: '4rem' }} />
        )}

      </main>
    </div>
  )
}
