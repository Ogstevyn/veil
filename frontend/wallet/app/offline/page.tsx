'use client'

export default function OfflinePage() {
  return (
    <div className="wallet-shell">
      <main className="wallet-main" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', gap: '1rem' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--warm-grey)' }}>
          <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h1 style={{ fontFamily: 'Lora, Georgia, serif', fontWeight: 600, fontStyle: 'italic', fontSize: '1.5rem', color: 'var(--off-white)' }}>
          You&apos;re offline
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'rgba(246,247,248,0.5)', maxWidth: '18rem', lineHeight: 1.6 }}>
          Check your connection and try again. Your wallet data is safe.
        </p>
      </main>
    </div>
  )
}
