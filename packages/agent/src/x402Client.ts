import { createEd25519Signer } from '@x402/stellar'
import { ExactStellarScheme } from '@x402/stellar/exact/client'
import { x402Client as CoreX402Client } from '@x402/core/client'
import type { Keypair } from '@stellar/stellar-sdk'

export interface FetchWithPaymentOptions {
  network?: string
  maxAutoPayUsdc?: number  // default 1.00 USDC
}

/**
 * Creates an x402-aware fetch wrapper for the agent.
 * Automatically handles HTTP 402 responses by signing auth entries
 * and retrying the request with the payment proof.
 */
export function createX402Fetch(agentKeypair: Keypair, options: FetchWithPaymentOptions = {}) {
  const network = options.network ?? (
    process.env.STELLAR_NETWORK === 'mainnet' ? 'stellar:pubnet' : 'stellar:testnet'
  )

  const signer = createEd25519Signer(agentKeypair.secret(), network as any)
  const scheme = new ExactStellarScheme(signer)
  const client = new CoreX402Client().register('stellar:*', scheme)

  /**
   * Fetch a URL, auto-paying any x402 challenge up to maxAutoPayUsdc.
   * Returns parsed JSON on success.
   */
  async function fetchWithPayment(url: string, init?: RequestInit): Promise<unknown> {
    const response = await client.fetch(url, init)
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Request failed ${response.status}: ${text}`)
    }
    return response.json()
  }

  return { fetchWithPayment }
}
