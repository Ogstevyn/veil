// Dark code block with Stellar brand syntax colouring.
// Keywords → Lilac, Strings → Gold, Comments → Warm Grey,
// Functions/identifiers → Teal, Default → Off-White.

export default function CodeBlock() {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.08]">
      {/* Title bar */}
      <div className="bg-[#1a1a1a] px-5 py-3 flex items-center gap-2 border-b border-white/[0.06]">
        <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
        <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
        <span className="w-3 h-3 rounded-full bg-[#28C840]" />
        <span className="ml-3 font-mono text-xs text-warm-grey/60">wallet.ts</span>
      </div>

      {/* Code body */}
      <div className="bg-near-black px-6 py-6 font-mono text-[13.5px] leading-7 overflow-x-auto">
        {/* import { useInvisibleWallet } from '@veil/sdk' */}
        <div>
          <span className="text-lilac">import </span>
          <span className="text-off-white">{'{ '}</span>
          <span className="text-teal">useInvisibleWallet</span>
          <span className="text-off-white">{' } '}</span>
          <span className="text-lilac">from </span>
          <span className="text-gold">&apos;@veil/sdk&apos;</span>
        </div>

        <div className="h-5" />

        {/* const { register, sign, login } = useInvisibleWallet() */}
        <div>
          <span className="text-lilac">const </span>
          <span className="text-off-white">{'{ '}</span>
          <span className="text-teal">register</span>
          <span className="text-off-white">, </span>
          <span className="text-teal">sign</span>
          <span className="text-off-white">, </span>
          <span className="text-teal">login</span>
          <span className="text-off-white">{' } = '}</span>
          <span className="text-teal">useInvisibleWallet</span>
          <span className="text-off-white">()</span>
        </div>

        <div className="h-5" />

        {/* // Register a new passkey wallet */}
        <div><span className="text-warm-grey/70">// Register a new passkey wallet</span></div>

        {/* await register('alice') */}
        <div>
          <span className="text-lilac">await </span>
          <span className="text-teal">register</span>
          <span className="text-off-white">(</span>
          <span className="text-gold">&apos;alice&apos;</span>
          <span className="text-off-white">)</span>
        </div>

        <div className="h-5" />

        {/* // Sign a Soroban auth entry with biometrics */}
        <div><span className="text-warm-grey/70">// Sign a Soroban auth entry with biometrics</span></div>

        {/* await sign(authEntryPayload) */}
        <div>
          <span className="text-lilac">await </span>
          <span className="text-teal">sign</span>
          <span className="text-off-white">(authEntryPayload)</span>
        </div>
      </div>
    </div>
  )
}
