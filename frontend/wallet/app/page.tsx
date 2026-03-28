'use client'

import { Fingerprint } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="wallet-shell">
      <nav className="wallet-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Fingerprint color="var(--gold)" size={24} />
          <span style={{ fontFamily: 'Anton', fontSize: '1.25rem', letterSpacing: '0.05em' }}>VEIL</span>
        </div>
      </nav>

      <main className="wallet-main">
        <section style={{ marginBottom: '2rem' }}>
          <span style={{ color: 'var(--warm-grey)', fontSize: '0.875rem' }}>Available Balance</span>
          <div className="amount-display">0.00 <span style={{ fontSize: '1.5rem', verticalAlign: 'middle' }}>XLM</span></div>
        </section>

        <div className="card-md" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <p style={{ color: 'var(--warm-grey)', marginBottom: '1.5rem' }}>Your wallet is ready.</p>
          <button className="btn-gold">Receive Assets</button>
        </div>
      </main>
    </div>
  )
}