'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { FingerprintIcon, PenIcon, CheckCircleIcon } from './Icons'

const STEPS = [
  {
    number: '01',
    Icon: FingerprintIcon,
    title: 'Register with Biometrics',
    desc: 'Your device creates a P-256 key pair using WebAuthn. Face ID, fingerprint, or Windows Hello generates the key — the private key never leaves your hardware. Ever.',
    code: 'navigator.credentials.create() → P-256 keypair',
    color: '#05A2C2',
  },
  {
    number: '02',
    Icon: PenIcon,
    title: 'Authorize with Your Touch',
    desc: 'To sign a transaction, tap your fingerprint. WebAuthn uses the exact Soroban authorization payload as the challenge, cryptographically binding your signature to the transaction.',
    code: 'signaturePayload → WebAuthn challenge → ECDSA sign',
    color: '#41CBA7',
  },
  {
    number: '03',
    Icon: CheckCircleIcon,
    title: 'On-Chain Verification',
    desc: 'The Soroban contract verifies the full cryptographic proof: challenge binding, SHA-256 message hash, P-256 ECDSA signature — all on-chain. No servers. No oracles.',
    code: 'SHA256(authData || SHA256(clientDataJSON)) → verify',
    color: '#FFFFFF',
  },
]

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const lineRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.fromTo('.hiw-headline',
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: '.hiw-headline', start: 'top 85%' } }
      )

      gsap.fromTo(lineRef.current,
        { scaleY: 0, transformOrigin: 'top' },
        { scaleY: 1, duration: 1.3, ease: 'power2.inOut',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 60%' } }
      )

      gsap.fromTo('.hiw-step',
        { opacity: 0, x: -40 },
        { opacity: 1, x: 0, duration: 0.7, stagger: 0.22, ease: 'power3.out',
          scrollTrigger: { trigger: '.hiw-steps', start: 'top 75%' } }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="how-it-works" className="section-pad">
      <div className="max-w-4xl mx-auto">

        {/* Headline */}
        <div className="hiw-headline text-center mb-20">
          <p className="text-xs uppercase tracking-[0.22em] text-[#05A2C2] font-medium mb-4">
            How It Works
          </p>
          <h2 className="text-display-sm md:text-display font-bold text-white mb-5">
            Three steps. Zero friction.
          </h2>
          <p className="text-[#8f8f8f] text-lg max-w-lg mx-auto leading-relaxed">
            The same passkey flow you already use for banking — powering a
            fully self-custodied Stellar wallet.
          </p>
        </div>

        {/* Steps */}
        <div className="hiw-steps relative pl-10 md:pl-14">

          {/* Timeline line */}
          <div className="absolute left-3.5 md:left-5 top-4 bottom-4 w-px bg-[#1E1E1E]">
            <div
              ref={lineRef}
              className="w-full h-full"
              style={{ background: 'linear-gradient(to bottom, #05A2C2, #41CBA7, #FFFFFF22)' }}
            />
          </div>

          <div className="flex flex-col gap-12">
            {STEPS.map((step, i) => (
              <div key={step.number} className="hiw-step flex gap-6 md:gap-8 items-start">

                {/* Node */}
                <div className="absolute left-0 md:left-1.5 flex-shrink-0 z-10 top-auto" style={{ marginTop: '0px' }}>
                  <motion.div
                    whileInView={{ scale: [0.7, 1.1, 1] }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.18 }}
                    className="w-7 h-7 rounded-full flex items-center justify-center -ml-3.5 md:-ml-3"
                    style={{
                      background: step.color === '#FFFFFF' ? '#1E1E1E' : `${step.color}20`,
                      border: `1px solid ${step.color}44`,
                      color: step.color,
                    }}
                  >
                    <step.Icon size={13} />
                  </motion.div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="text-[11px] font-mono font-bold tracking-widest"
                      style={{ color: step.color }}
                    >
                      {step.number}
                    </span>
                    <h3 className="text-[17px] font-semibold text-white">{step.title}</h3>
                  </div>
                  <p className="text-[#8f8f8f] text-sm leading-relaxed mb-4">{step.desc}</p>
                  <code
                    className="inline-block text-xs px-3 py-1.5 rounded-md font-mono"
                    style={{
                      background: `${step.color}0D`,
                      border: `1px solid ${step.color}20`,
                      color: step.color === '#FFFFFF' ? '#8f8f8f' : step.color,
                    }}
                  >
                    {step.code}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
