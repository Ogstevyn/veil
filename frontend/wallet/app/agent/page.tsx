'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, RefreshCw } from 'lucide-react'
import { useInactivityLock } from '@/hooks/useInactivityLock'

interface Message {
  role: 'user' | 'agent'
  content: string
  pendingTxXdr?: string
  pendingTxSummary?: string
}

const SUGGESTIONS = [
  "What's my balance?",
  'Swap 100 XLM to USDC',
  'Show recent transfers',
  'Best XLM/USDC rate?',
]

export default function AgentPage() {
  const router = useRouter()
  useInactivityLock()

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'agent',
      content:
        "Hey! I'm your Veil agent. I can check prices, show your transfer history, and execute swaps — all with your approval. What would you like to do?",
    },
  ])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [pendingTxXdr, setPendingTxXdr] = useState<string | null>(null)
  const [pendingTxSummary, setPendingTxSummary] = useState<string | null>(null)
  const [approving, setApproving] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Wallet address + signer from session
  const walletAddress =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('veil_wallet_address') ?? ''
      : ''

  // Connect WebSocket
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_AGENT_WS_URL ?? 'ws://localhost:3001'
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => console.log('[agent] WS connected')
    ws.onclose = () => console.log('[agent] WS disconnected')

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'thinking') {
        setIsThinking(true)
        return
      }

      if (data.type === 'response') {
        setIsThinking(false)
        const msg: Message = { role: 'agent', content: data.message }
        if (data.pendingTxXdr) {
          msg.pendingTxXdr = data.pendingTxXdr
          msg.pendingTxSummary = data.pendingTxSummary
          setPendingTxXdr(data.pendingTxXdr)
          setPendingTxSummary(data.pendingTxSummary ?? null)
        }
        setMessages((prev) => [...prev, msg])
        return
      }

      if (data.type === 'error') {
        setIsThinking(false)
        setMessages((prev) => [
          ...prev,
          { role: 'agent', content: `Error: ${data.message}` },
        ])
      }
    }

    return () => ws.close()
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const sendMessage = useCallback(() => {
    const text = input.trim()
    if (!text || isThinking || !wsRef.current) return

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')

    wsRef.current.send(
      JSON.stringify({ type: 'chat', walletAddress, message: text }),
    )
  }, [input, isThinking, walletAddress])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const approveTransaction = async () => {
    if (!pendingTxXdr) return
    setApproving(true)
    try {
      // Trigger passkey signing via the browser WebAuthn API
      // The wallet uses the stored credential to sign the auth entry
      const signerSecret = sessionStorage.getItem('veil_signer_secret')
        ?? localStorage.getItem('veil_signer_secret')

      if (!signerSecret) {
        setMessages((prev) => [
          ...prev,
          { role: 'agent', content: 'Signing key not found. Please return to the dashboard first.' },
        ])
        return
      }

      // Import Stellar SDK dynamically to avoid SSR issues
      const { Keypair, TransactionBuilder, Networks, rpc: SorobanRpc } = await import('@stellar/stellar-sdk')
      const { Transaction } = await import('@stellar/stellar-sdk')

      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://soroban-testnet.stellar.org'
      const networkPassphrase = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015'
      const feePayerSecret = localStorage.getItem('veil_fee_payer_secret') ?? signerSecret
      const feePayer = Keypair.fromSecret(feePayerSecret)
      const server = new SorobanRpc.Server(rpcUrl)

      // Rebuild and submit the transaction using the fee-payer keypair
      const tx = TransactionBuilder.fromXDR(pendingTxXdr, networkPassphrase)
      tx.sign(feePayer)

      const result = await server.sendTransaction(tx)

      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          content: `Transaction submitted! Hash: \`${result.hash}\`\n\nIt will settle in ~5 seconds.`,
        },
      ])
      setPendingTxXdr(null)
      setPendingTxSummary(null)
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'agent', content: `Transaction failed: ${(err as Error).message}` },
      ])
    } finally {
      setApproving(false)
    }
  }

  const clearHistory = () => {
    if (!walletAddress || !wsRef.current) return
    wsRef.current.send(JSON.stringify({ type: 'clear_history', walletAddress }))
    setMessages([
      {
        role: 'agent',
        content: 'History cleared. How can I help you?',
      },
    ])
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-zinc-800 transition"
        >
          <ArrowLeft size={18} className="text-zinc-400" />
        </button>
        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold">
          V
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">Veil Agent</div>
          <div className="text-xs text-zinc-500">
            Powered by Claude · x402 payments enabled
          </div>
        </div>
        <button
          onClick={clearHistory}
          className="p-1.5 rounded-lg hover:bg-zinc-800 transition"
          title="Clear history"
        >
          <RefreshCw size={16} className="text-zinc-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-violet-600 text-white rounded-br-sm'
                  : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>

              {/* Transaction approval card */}
              {msg.pendingTxXdr && (
                <div className="mt-3 p-3 bg-zinc-700 rounded-xl border border-violet-500/50">
                  <div className="text-xs text-zinc-400 mb-1 font-medium uppercase tracking-wide">
                    Transaction Ready
                  </div>
                  {msg.pendingTxSummary && (
                    <div className="text-xs text-zinc-300 mb-3">{msg.pendingTxSummary}</div>
                  )}
                  <button
                    onClick={approveTransaction}
                    disabled={approving}
                    className="w-full py-2 bg-violet-600 rounded-lg text-sm font-semibold hover:bg-violet-500 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {approving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      '🔐 Approve & Submit'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 px-4 py-2.5 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-6 pt-3 border-t border-zinc-800">
        {/* Suggestion chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setInput(s)
                inputRef.current?.focus()
              }}
              className="shrink-0 text-xs px-3 py-1.5 bg-zinc-800 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="flex gap-2 items-end">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything…"
            disabled={isThinking}
            className="flex-1 bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-violet-500 placeholder-zinc-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isThinking}
            className="p-3 bg-violet-600 rounded-xl hover:bg-violet-500 disabled:opacity-40 transition shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
