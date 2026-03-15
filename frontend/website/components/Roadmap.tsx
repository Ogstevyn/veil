'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { CheckIcon, CircleDotIcon, ClockIcon } from './Icons'

const PHASES = [
  {
    phase: 'Phase 1',
    title: 'Contract Foundation',
    status: 'done',
    items: [
      'WalletError enum & error propagation',
      'Soroban custom account contract scaffold',
      '6 passing unit tests',
      'P-256 ECDSA integration via p256 crate',
    ],
  },
  {
    phase: 'Phase 2',
    title: 'Full WebAuthn Pipeline',
    status: 'done',
    items: [
      'DER → raw signature conversion',
      'Real P-256 public key extraction',
      'SHA-256 message hash computation',
      'Challenge binding verification',
    ],
  },
  {
    phase: 'Phase 3',
    title: 'Factory Deployment',
    status: 'active',
    items: [
      'Factory contract implementation',
      'Deterministic wallet address derivation',
      'SDK factory integration',
      'One-call wallet creation',
    ],
  },
  {
    phase: 'Phase 4',
    title: 'Testnet Integration',
    status: 'upcoming',
    items: [
      'Futurenet / Testnet deployment',
      'End-to-end demo application',
      'Integration test suite',
      'Deployment documentation',
    ],
  },
  {
    phase: 'Phase 5',
    title: 'Guardian & Multi-Signer',
    status: 'upcoming',
    items: [
      'Guardian-based account recovery',
      'M-of-N multi-signer threshold',
      'Nonce-based replay protection',
      'Hardware key support (YubiKey)',
    ],
  },
]

type Status = 'done' | 'active' | 'upcoming'

const STATUS: Record<Status, { dot: string; label: string; text: string; Icon: typeof CheckIcon }> = {
  done:     { dot: '#30A46C', label: 'text-[#30A46C] border-[#30A46C30] bg-[#30A46C0D]', text: 'Complete',    Icon: CheckIcon },
  active:   { dot: '#05A2C2', label: 'text-[#05A2C2] border-[#05A2C230] bg-[#05A2C20D]', text: 'In Progress', Icon: CircleDotIcon },
  upcoming: { dot: '#333',    label: 'text-[#555]    border-[#1E1E1E]  bg-[#0C0C0C]',    text: 'Upcoming',    Icon: ClockIcon },
}

export default function Roadmap() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.fromTo('.roadmap-headline',
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: '.roadmap-headline', start: 'top 85%' } }
      )
      gsap.fromTo('.roadmap-phase',
        { opacity: 0, x: -28 },
        { opacity: 1, x: 0, duration: 0.65, stagger: 0.13, ease: 'power3.out',
          scrollTrigger: { trigger: '.roadmap-list', start: 'top 75%' } }
      )
      gsap.fromTo('.roadmap-progress',
        { scaleY: 0, transformOrigin: 'top' },
        { scaleY: 1, duration: 1.6, ease: 'power2.inOut',
          scrollTrigger: { trigger: '.roadmap-list', start: 'top 70%' } }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="roadmap" className="section-pad">
      <div className="max-w-2xl mx-auto">

        {/* Headline */}
        <div className="roadmap-headline text-center mb-16">
          <p className="text-xs uppercase tracking-[0.22em] text-[#05A2C2] font-medium mb-4">
            Roadmap
          </p>
          <h2 className="text-display-sm md:text-display font-bold text-white mb-5">
            The path to production
          </h2>
          <p className="text-[#8f8f8f] text-lg max-w-md mx-auto leading-relaxed">
            Open-source and community-driven. Each phase ships independently
            tested, production-ready code.
          </p>
        </div>

        {/* Timeline */}
        <div className="roadmap-list relative pl-9">

          {/* Background line */}
          <div className="absolute left-3 top-2 bottom-2 w-px bg-[#1E1E1E]">
            <div
              className="roadmap-progress w-full bg-gradient-to-b from-[#30A46C] via-[#05A2C2] to-[#1E1E1E]"
              style={{ height: '42%' }}
            />
          </div>

          <div className="flex flex-col gap-8">
            {PHASES.map((phase) => {
              const s = STATUS[phase.status as Status]
              return (
                <div key={phase.phase} className="roadmap-phase relative">

                  {/* Dot */}
                  <div
                    className="absolute -left-[1.42rem] top-1.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center"
                    style={{ background: '#000', borderColor: s.dot + '55' }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                  </div>

                  {/* Card */}
                  <motion.div
                    whileHover={{ x: 3, transition: { duration: 0.18 } }}
                    className="card p-5"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="text-[11px] text-[#555] font-mono block mb-0.5">{phase.phase}</span>
                        <h3 className="text-[15px] font-semibold text-white">{phase.title}</h3>
                      </div>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-sm border flex items-center gap-1.5 ${s.label}`}>
                        <s.Icon size={11} />
                        {s.text}
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {phase.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm">
                          <span
                            className="mt-0.5 flex-shrink-0"
                            style={{ color: phase.status === 'done' ? '#30A46C' : phase.status === 'active' ? '#05A2C2' : '#333' }}
                          >
                            {phase.status === 'done'
                              ? <CheckIcon size={13} />
                              : <span className="text-[#333] text-lg leading-none">·</span>
                            }
                          </span>
                          <span className={phase.status === 'done' ? 'text-[#8f8f8f]' : 'text-[#555]'}>
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </section>
  )
}
