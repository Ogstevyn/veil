'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { KeyIcon, AlertTriangleIcon, LayersIcon } from './Icons'

const PROBLEMS = [
  {
    Icon: KeyIcon,
    stat: '57%',
    statLabel: 'abandon at seed phrase step',
    title: 'Seed Phrases Are a UX Disaster',
    desc: 'Over half of potential crypto users drop off when asked to write down 24 random words. One typo, one lost paper, and funds are gone forever.',
    accentColor: '#E5484D',
  },
  {
    Icon: AlertTriangleIcon,
    stat: '$4B',
    statLabel: 'lost to key mismanagement in 2023',
    title: 'Private Keys Are Catastrophic',
    desc: 'A single compromised .env file, a screenshot in iCloud, a clipboard paste — and everything is gone. Private keys were designed for machines, not humans.',
    accentColor: '#FFB224',
  },
  {
    Icon: LayersIcon,
    stat: '12+',
    statLabel: 'steps in a typical DeFi transaction',
    title: 'Web3 UX Is Fundamentally Broken',
    desc: 'Install extension, backup seed, fund gas, approve token, sign transaction, wait. This is not a product — it is an obstacle course.',
    accentColor: '#05A2C2',
  },
]

export default function Problem() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.fromTo('.problem-headline',
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: '.problem-headline', start: 'top 85%' } }
      )
      gsap.fromTo('.problem-card',
        { opacity: 0, y: 48 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out',
          scrollTrigger: { trigger: '.problem-cards', start: 'top 78%' } }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="problem" className="section-pad">
      <div className="max-w-6xl mx-auto">

        {/* Headline */}
        <div className="problem-headline text-center mb-16">
          <p className="text-xs uppercase tracking-[0.22em] text-[#05A2C2] font-medium mb-4">
            The Problem
          </p>
          <h2 className="text-display-sm md:text-display font-bold text-white mb-5">
            Crypto has a billion-user problem
          </h2>
          <p className="text-[#8f8f8f] text-lg max-w-xl mx-auto leading-relaxed">
            The technology is ready. The UX is not. Seed phrases, private keys,
            and complex flows have kept crypto inaccessible for over a decade.
          </p>
        </div>

        {/* Cards */}
        <div className="problem-cards grid md:grid-cols-3 gap-5">
          {PROBLEMS.map(({ Icon, stat, statLabel, title, desc, accentColor }) => (
            <motion.div
              key={title}
              className="problem-card card p-7"
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-md flex items-center justify-center mb-5"
                style={{ background: `${accentColor}14`, color: accentColor }}
              >
                <Icon size={20} />
              </div>

              {/* Stat */}
              <div className="font-bold text-3xl mb-1" style={{ color: accentColor }}>
                {stat}
              </div>
              <div className="text-[11px] text-[#555] uppercase tracking-wide mb-5">
                {statLabel}
              </div>

              <h3 className="text-[15px] font-semibold text-white mb-3">{title}</h3>
              <p className="text-[#8f8f8f] text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
