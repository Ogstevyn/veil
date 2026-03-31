'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VeilLogo } from '@/components/VeilLogo'
import { computeWalletAddress, hexToUint8Array } from '@veil/utils'
import { rpc as SorobanRpc, xdr } from '@stellar/stellar-sdk'

const CONFIG = {
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  factoryAddress: process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ID ?? '',
}

type Step = 'idle' | 'authenticating' | 'done' | 'error'

export default function RecoverPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleRecover() {
    setError(null)
    setStep('authenticating')
    try {
      // ── Step 1: get stored passkey metadata ──────────────────────────────
      const keyId        = localStorage.getItem('invisible_wallet_key_id')
      const publicKeyHex = localStorage.getItem('invisible_wallet_public_key')

      if (!keyId || !publicKeyHex) {
        throw new Error(
          'No passkey data found on this device. Recovery is only possible on the device where you originally registered, or through guardian recovery.'
        )
      }

      // ── Step 2: prompt WebAuthn assertion to verify identity ─────────────
      const b64 = keyId.replace(/-/g, '+').replace(/_/g, '/')
      const binary = atob(b64)
      const idBuffer = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) idBuffer[i] = binary.charCodeAt(i)

      const challenge = crypto.getRandomValues(new Uint8Array(32))
      await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ id: idBuffer, type: 'public-key' }],
          userVerification: 'required',
        },
      })

      // ── Step 3: derive wallet address from stored public key ─────────────
      let walletAddress = localStorage.getItem('invisible_wallet_address')

      if (!walletAddress) {
        // Address was cleared — recompute from stored public key
        const pubKeyBytes = hexToUint8Array(publicKeyHex)
        walletAddress = computeWalletAddress(CONFIG.factoryAddress, pubKeyBytes, CONFIG.networkPassphrase)
        // Verify it actually exists on-chain
        const server = new SorobanRpc.Server(CONFIG.rpcUrl)
        await server.getContractData(
          walletAddress,
          xdr.ScVal.scvLedgerKeyContractInstance(),
          SorobanRpc.Durability.Persistent
        )
        // Restore to localStorage
        localStorage.setItem('invisible_wallet_address', walletAddress)
      }

      // ── Step 4: restore session ──────────────────────────────────────────
      sessionStorage.setItem('invisible_wallet_address', walletAddress)

      setStep('done')
      setTimeout(() => router.push('/dashboard'), 800)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      // NotAllowedError = user cancelled or biometric failed
      if (msg.includes('NotAllowedError') || msg.includes('not allowed')) {
        setError('Biometric verification was cancelled or failed. Please try again.')
      } else {
        setError(msg)
      }
      setStep('error')
    }
  }

  return (
    <div className="wallet-shell" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem 1.25rem', minHeight: '100dvh' }}>
      <div style={{ maxWidth: 400, width: '100%' }}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
          <VeilLogo size={48} />
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'Lora, Georgia, serif', fontWeight: 600, fontStyle: 'italic', fontSize: '1.75rem' }}>
              Recover wallet
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'rgba(246,247,248,0.4)', marginTop: '0.375rem' }}>
              Authenticate with your existing passkey
            </p>
          </div>
        </div>

        {step === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button className="btn-gold" onClick={handleRecover}>
              Use passkey to recover
            </button>
            <button className="btn-ghost" onClick={() => router.push('/')}>
              Back
            </button>
          </div>
        )}

        {step === 'authenticating' && (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div className="spinner spinner-light" />
            </div>
            <p style={{ fontWeight: 500 }}>Waiting for passkey...</p>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(246,247,248,0.4)', marginTop: '0.5rem' }}>
              Approve the prompt on your device
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="card" style={{ textAlign: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: '0 auto 0.75rem' }}>
              <circle cx="20" cy="20" r="19" stroke="var(--teal)" strokeWidth="1.5" />
              <path d="M13 20.5l5 5 9-9" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p style={{ fontWeight: 500 }}>Wallet recovered</p>
          </div>
        )}

        {step === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Recovery failed</p>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(246,247,248,0.4)', lineHeight: 1.6 }}>{error}</p>
            </div>
            <button className="btn-ghost" onClick={() => setStep('idle')}>
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
