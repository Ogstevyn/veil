'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ── Inactivity lock constant ──────────────────────────────────────────────────
// After this many milliseconds of no user interaction the wallet is locked and
// sessionStorage is cleared. Set to 5 minutes per the security spec.
const LOCK_TIMEOUT_MS = 5 * 60 * 1000

// Events that count as user activity and reset the inactivity timer
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'touchstart', 'click', 'scroll'] as const

// ── useInactivityLock ─────────────────────────────────────────────────────────
function useInactivityLock() {
  const router          = useRouter()
  const timerRef        = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const lock = useCallback(() => {
    // Clear the session — user must re-authenticate via passkey
    sessionStorage.clear()
    router.replace('/lock')
  }, [router])

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(lock, LOCK_TIMEOUT_MS)
  }, [lock])

  useEffect(() => {
    // Start the timer immediately on mount
    resetTimer()

    // Attach activity listeners — each resets the countdown
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true }),
    )

    return () => {
      // Clean up on unmount
      if (timerRef.current) clearTimeout(timerRef.current)
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetTimer),
      )
    }
  }, [resetTimer])
}

// ── Dashboard page ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  // Activate inactivity lock for the entire dashboard session
  useInactivityLock()

  // Read the wallet address stored by register() / login()
  const walletAddress =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('invisible_wallet_address')
      : null

  return (
    <div className="wallet-shell">

      {/* ── Header — .wallet-nav from globals.css ── */}
      <header className="wallet-nav">
        {/* Wordmark — Anton ALL CAPS per Stellar brand manual */}
        <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: '1.25rem', letterSpacing: '0.08em', color: 'var(--gold)', userSelect: 'none' }}>
          VEIL
        </span>
        {/* Wallet address chip — Inconsolata font per brand */}
        {walletAddress && (
          <span className="address-chip">
            {walletAddress.slice(0, 6)}…{walletAddress.slice(-6)}
          </span>
        )}
      </header>

      {/* ── Main content — .wallet-main from globals.css ── */}
      <main className="wallet-main" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          {/* Heading — Lora SemiBold Italic per brand */}
          <h1 style={{ fontFamily: 'Lora, Georgia, serif', fontWeight: 600, fontStyle: 'italic', fontSize: '1.75rem', color: 'var(--off-white)', marginBottom: '0.25rem' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'rgba(246,247,248,0.5)' }}>
            Your wallet locks automatically after 5 minutes of inactivity.
          </p>
        </div>

        {/* Placeholder — replace with real wallet UI */}
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'rgba(246,247,248,0.4)' }}>
            Wallet content goes here.
          </p>
        </div>

      </main>
    </div>
  )
}
