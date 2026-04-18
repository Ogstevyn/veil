'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useInactivityLock } from '@/hooks/useInactivityLock'

const LANGUAGES = [
  'English', 'Spanish', 'French', 'Portuguese', 'Chinese', 'Japanese',
  'Korean', 'Arabic', 'Hindi', 'Russian', 'German', 'Turkish', 'Yoruba', 'Igbo', 'Swahili',
]

const PERSONAS = [
  { value: '', label: 'Default', desc: 'Friendly and professional' },
  { value: 'concise and direct', label: 'Concise', desc: 'Short answers, no fluff' },
  { value: 'friendly and casual', label: 'Casual', desc: 'Relaxed, conversational tone' },
  { value: 'detailed and educational', label: 'Teacher', desc: 'Explains concepts along the way' },
  { value: 'witty and fun', label: 'Fun', desc: 'Light-hearted with personality' },
]

function loadProfile(): { name: string; language: string; persona: string } {
  if (typeof window === 'undefined') return { name: '', language: 'English', persona: '' }
  try {
    const raw = localStorage.getItem('veil_user_profile')
    const parsed = raw ? JSON.parse(raw) : {}
    return {
      name: parsed.name ?? '',
      language: parsed.language ?? 'English',
      persona: parsed.persona ?? '',
    }
  } catch { return { name: '', language: 'English', persona: '' } }
}

export default function ProfileSettingsPage() {
  const router = useRouter()
  useInactivityLock()

  const [profile, setProfile] = useState(loadProfile)
  const [saved, setSaved] = useState(false)

  const save = () => {
    localStorage.setItem('veil_user_profile', JSON.stringify(profile))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const reset = () => {
    localStorage.removeItem('veil_user_profile')
    setProfile({ name: '', language: 'English', persona: '' })
  }

  return (
    <div className="wallet-shell">
      <header className="wallet-nav">
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--warm-grey)', display: 'flex' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Profile</span>
        <div style={{ width: '28px' }} />
      </header>

      <main className="wallet-main" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Name */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="var(--gold)" strokeWidth="2"/>
            </svg>
            <span style={{ fontSize: '0.75rem', fontFamily: 'Anton, Impact, sans-serif', letterSpacing: '0.08em', color: 'var(--warm-grey)' }}>YOUR NAME</span>
          </div>
          <input
            className="input-field"
            type="text"
            placeholder="How should the agent address you?"
            value={profile.name}
            onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
            autoComplete="off"
          />
          <p style={{ fontSize: '0.75rem', color: 'rgba(214,210,196,0.5)', marginTop: '0.375rem' }}>
            The agent will greet you by name
          </p>
        </div>

        {/* Language */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="var(--teal)" strokeWidth="2"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="var(--teal)" strokeWidth="2"/>
            </svg>
            <span style={{ fontSize: '0.75rem', fontFamily: 'Anton, Impact, sans-serif', letterSpacing: '0.08em', color: 'var(--warm-grey)' }}>LANGUAGE</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {LANGUAGES.map(lang => (
              <button
                key={lang}
                onClick={() => setProfile(p => ({ ...p, language: lang }))}
                style={{
                  padding: '0.5rem 0.875rem',
                  borderRadius: '2rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: profile.language === lang ? '1.5px solid var(--gold)' : '1px solid var(--border-dim)',
                  background: profile.language === lang ? 'rgba(253,218,36,0.1)' : 'var(--surface-md)',
                  color: profile.language === lang ? 'var(--gold)' : 'var(--off-white)',
                  transition: 'all 120ms',
                }}
              >
                {lang}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(214,210,196,0.5)', marginTop: '0.625rem' }}>
            The agent will respond in your preferred language
          </p>
        </div>

        {/* Persona */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '0.75rem', fontFamily: 'Anton, Impact, sans-serif', letterSpacing: '0.08em', color: 'var(--warm-grey)' }}>AGENT PERSONALITY</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {PERSONAS.map(p => (
              <button
                key={p.value}
                onClick={() => setProfile(prev => ({ ...prev, persona: p.value }))}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem 1rem', borderRadius: '0.75rem',
                  cursor: 'pointer',
                  border: profile.persona === p.value ? '1.5px solid var(--gold)' : '1px solid var(--border-dim)',
                  background: profile.persona === p.value ? 'rgba(253,218,36,0.06)' : 'transparent',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: profile.persona === p.value ? 'var(--gold)' : 'var(--off-white)' }}>
                    {p.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--warm-grey)', marginTop: '0.125rem' }}>
                    {p.desc}
                  </div>
                </div>
                {profile.persona === p.value && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        <button onClick={save} className="btn-gold">
          {saved ? 'Saved!' : 'Save Profile'}
        </button>

        <button onClick={reset} className="btn-ghost" style={{ color: 'var(--warm-grey)' }}>
          Reset to Defaults
        </button>
      </main>
    </div>
  )
}
