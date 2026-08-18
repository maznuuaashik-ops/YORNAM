import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Sparkles, Shield, Cpu, ArrowUpRight } from 'lucide-react'

const features = [
  {
    icon: Cpu,
    title: 'Neural Analysis Engine',
    description: 'Multi-layer AI analysis covering hook strength, retention curves, engagement prediction, and viral probability — all generated in real time for every reel.',
    color: '#3b82f6',
    stat: '11',
    statLabel: 'Analysis layers',
  },
  {
    icon: Sparkles,
    title: 'Real-Time Intelligence',
    description: 'Every report is generated on demand. No stale templates — each analysis is computed fresh from your reel unique fingerprint.',
    color: '#22d3ee',
    stat: 'Live',
    statLabel: 'On-demand',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'We only store your analysis results so you can track them in your dashboard. Your reel content is never downloaded or archived.',
    color: '#22c55e',
    stat: 'Secure',
    statLabel: 'By design',
  },
]

export default function Features() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-16 sm:py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs font-medium tracking-widest uppercase"
            style={{ background: 'var(--bg-badge)', border: '1px solid var(--border-primary)', color: 'var(--accent-blue)' }}
          >
            Why YORNAM
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Built Different From the Ground Up
          </h2>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-tertiary)' }}>
            Enterprise-grade AI, creator-friendly design.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="glass-card rounded-2xl p-6 sm:p-7 text-center"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: `${f.color}12`, border: `1px solid ${f.color}25`, boxShadow: `0 0 20px ${f.color}10` }}
                >
                  <Icon size={24} style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                  {f.title}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
                  {f.description}
                </p>
                <div
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: `${f.color}08`, border: `1px solid ${f.color}15` }}
                >
                  <span className="text-lg font-bold" style={{ color: f.color }}>{f.stat}</span>
                  <span className="text-xs" style={{ color: 'var(--text-quaternary)' }}>{f.statLabel}</span>
                  <ArrowUpRight size={12} style={{ color: f.color }} />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
