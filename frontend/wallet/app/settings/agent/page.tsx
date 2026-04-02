'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bot, Zap, Shield, AlertTriangle } from 'lucide-react'
import { useInactivityLock } from '@/hooks/useInactivityLock'

const SERVICES = [
  {
    name: 'Oracle',
    description: 'Live SDEX + AMM price data',
    pricePerCall: '0.10 USDC',
  },
  {
    name: 'Wraith',
    description: 'Soroban transfer history',
    pricePerCall: '0.10 USDC',
  },
]

export default function AgentSettingsPage() {
  const router = useRouter()
  useInactivityLock()

  const [agentEnabled, setAgentEnabled] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('veil_agent_enabled') === 'true'
  })
  const [perTxLimit, setPerTxLimit] = useState(() => {
    if (typeof window === 'undefined') return '10'
    return localStorage.getItem('veil_agent_per_tx_limit') ?? '10'
  })
  const [dailyLimit, setDailyLimit] = useState(() => {
    if (typeof window === 'undefined') return '100'
    return localStorage.getItem('veil_agent_daily_limit') ?? '100'
  })
  const [saved, setSaved] = useState(false)

  const saveSettings = () => {
    localStorage.setItem('veil_agent_enabled', String(agentEnabled))
    localStorage.setItem('veil_agent_per_tx_limit', perTxLimit)
    localStorage.setItem('veil_agent_daily_limit', dailyLimit)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const revokeAgent = () => {
    localStorage.removeItem('veil_agent_enabled')
    localStorage.removeItem('veil_agent_per_tx_limit')
    localStorage.removeItem('veil_agent_daily_limit')
    setAgentEnabled(false)
    router.back()
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-zinc-800 transition"
        >
          <ArrowLeft size={18} className="text-zinc-400" />
        </button>
        <div>
          <h1 className="font-bold text-lg">Agent Settings</h1>
          <p className="text-xs text-zinc-500">Configure your AI agent's permissions</p>
        </div>
      </div>

      {/* Enable toggle */}
      <div className="bg-zinc-900 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 flex items-center justify-center">
              <Bot size={18} className="text-violet-400" />
            </div>
            <div>
              <div className="font-semibold text-sm">Veil Agent</div>
              <div className="text-xs text-zinc-500">Autonomous task execution</div>
            </div>
          </div>
          <button
            onClick={() => setAgentEnabled(!agentEnabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              agentEnabled ? 'bg-violet-600' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                agentEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Spending limits */}
      <div className="bg-zinc-900 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-amber-400" />
          <span className="font-semibold text-sm">Spending Limits</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 block mb-1.5">
              Per-transaction limit (XLM)
            </label>
            <input
              type="number"
              value={perTxLimit}
              onChange={(e) => setPerTxLimit(e.target.value)}
              min="1"
              max="10000"
              className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-violet-500"
            />
            <p className="text-xs text-zinc-600 mt-1">
              Agent can auto-execute transactions up to this amount
            </p>
          </div>

          <div>
            <label className="text-xs text-zinc-500 block mb-1.5">
              Daily spending limit (XLM)
            </label>
            <input
              type="number"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              min="1"
              max="100000"
              className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>
      </div>

      {/* Allowed services */}
      <div className="bg-zinc-900 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-green-400" />
          <span className="font-semibold text-sm">Allowed Services (x402)</span>
        </div>

        <div className="space-y-3">
          {SERVICES.map((svc) => (
            <div key={svc.name} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{svc.name}</div>
                <div className="text-xs text-zinc-500">{svc.description}</div>
              </div>
              <div className="text-xs text-zinc-400 text-right">
                <div>{svc.pricePerCall}</div>
                <div className="text-green-500">Enabled</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={saveSettings}
        className="w-full py-3 bg-violet-600 rounded-2xl font-semibold text-sm hover:bg-violet-500 transition mb-4"
      >
        {saved ? 'Saved!' : 'Save Settings'}
      </button>

      {/* Revoke */}
      <button
        onClick={revokeAgent}
        className="w-full py-3 bg-zinc-900 rounded-2xl text-sm text-red-400 hover:bg-zinc-800 transition flex items-center justify-center gap-2"
      >
        <AlertTriangle size={15} />
        Revoke Agent Access
      </button>
    </div>
  )
}
