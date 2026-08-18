import { motion, AnimatePresence } from 'framer-motion'
import { Zap, AlertCircle, ArrowRight, Sparkles, Check, Camera, Link2, Loader2, Cpu, Shield, Smartphone } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'

interface HeroProps {
  onAnalyze: (url: string) => void
  isLoading: boolean
  error: string | null
}

const INSTAGRAM_REEL_REGEX = /instagram\.com\/(reel|p|tv)\/[A-Za-z0-9_-]+/

type ValidationState = 'idle' | 'valid' | 'invalid' | 'checking'

export default function Hero({ onAnalyze, isLoading, error }: HeroProps) {
  const [url, setUrl] = useState('')
  const [validationState, setValidationState] = useState<ValidationState>('idle')
  const [validationError, setValidationError] = useState<string | null>(null)

  // Debounced live validation
  useEffect(() => {
    if (!url.trim()) {
      setValidationState('idle')
      setValidationError(null)
      return
    }

    setValidationState('checking')
    const timer = setTimeout(() => {
      if (INSTAGRAM_REEL_REGEX.test(url.trim())) {
        setValidationState('valid')
        setValidationError(null)
      } else {
        setValidationState('invalid')
        setValidationError('Please enter a valid Instagram reel URL (e.g. instagram.com/reel/...)')
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [url])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return

    if (!INSTAGRAM_REEL_REGEX.test(trimmed)) {
      setValidationState('invalid')
      setValidationError('Please enter a valid Instagram reel URL (e.g. instagram.com/reel/...)')
      return
    }

    setValidationError(null)
    onAnalyze(trimmed)
  }

  const displayError = validationError || error
  const canSubmit = validationState === 'valid' && !isLoading

  // Input border color based on state
  const inputBorder = useMemo(() => {
    if (validationState === 'valid') return 'rgba(16,185,129,0.4)'
    if (validationState === 'invalid') return 'rgba(239,68,68,0.4)'
    return undefined
  }, [validationState])

  // Input glow based on state
  const inputGlow = useMemo(() => {
    if (validationState === 'valid') return '0 0 0 3px rgba(16,185,129,0.1), 0 0 20px rgba(16,185,129,0.08)'
    if (validationState === 'invalid') return '0 0 0 3px rgba(239,68,68,0.1)'
    return undefined
  }, [validationState])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-24 sm:py-20 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.07] blur-[120px]" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.05] blur-[100px]" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03] blur-[140px]" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }} />
        <div className="absolute inset-0 grid-bg opacity-30" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto w-full text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 glass neon-border"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm font-medium tracking-widest uppercase" style={{ color: 'var(--accent-blue)' }}>AI-Powered Reel Intelligence</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-4 select-none"
          style={{ lineHeight: 0.95 }}
        >
          <span className="shimmer-text">YORNAM</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-xl md:text-2xl font-light mb-4 tracking-wide"
          style={{ color: 'var(--text-secondary)' }}
        >
          Predict Your Reel Before Posting
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-base mb-12 sm:mb-14 max-w-xl mx-auto"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Drop your reel URL and our AI engine dissects every frame — hook, caption, retention, virality — before you hit publish.
        </motion.p>

        {/* Input form */}
        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
        >
          <div className="flex-1 relative">
            {/* Left icon — Instagram or link */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <AnimatePresence mode="wait">
                {validationState === 'valid' ? (
                  <motion.div
                    key="ig"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Camera size={18} style={{ color: '#10b981' }} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="link"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Link2 size={18} style={{ color: 'var(--text-quaternary)' }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste your Instagram Reel URL here..."
              className="w-full pl-12 pr-12 py-4 rounded-xl text-base outline-none transition-all duration-300 input-premium min-h-[56px]"
              style={{
                color: 'var(--text-primary)',
                borderColor: inputBorder,
                boxShadow: inputGlow,
              }}
              disabled={isLoading}
              aria-label="Instagram Reel URL"
            />

            {/* Right icon — status indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <AnimatePresence mode="wait">
                {validationState === 'checking' && (
                  <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-quaternary)' }} />
                  </motion.div>
                )}
                {validationState === 'valid' && (
                  <motion.div key="valid" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <Check size={12} style={{ color: '#10b981' }} />
                    </div>
                  </motion.div>
                )}
                {validationState === 'invalid' && url.trim() && (
                  <motion.div key="invalid" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <AlertCircle size={18} style={{ color: 'var(--accent-red)' }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={!canSubmit}
            whileHover={canSubmit ? { scale: 1.02 } : undefined}
            whileTap={canSubmit ? { scale: 0.97 } : undefined}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer btn-premium min-h-[56px]"
            style={{
              minWidth: '160px',
              boxShadow: canSubmit ? '0 0 30px rgba(59,130,246,0.3), 0 0 60px rgba(59,130,246,0.1)' : undefined,
            }}
          >
            <Zap size={18} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Analyzing...' : 'Analyze Reel'}
            {!isLoading && <ArrowRight size={16} />}
          </motion.button>
        </motion.form>

        {/* Success state */}
        <AnimatePresence>
          {validationState === 'valid' && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-2 mt-4 text-sm"
              style={{ color: '#10b981' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
              >
                <Check size={12} style={{ color: '#10b981' }} />
              </motion.div>
              <span>Reel detected successfully</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        <AnimatePresence>
          {displayError && validationState !== 'valid' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center justify-center gap-2 mt-4 text-sm"
              style={{ color: 'var(--accent-red)' }}
            >
              <AlertCircle size={16} />
              <span>{displayError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex items-center justify-center gap-3 sm:gap-4 mt-14 sm:mt-16 flex-wrap"
        >
          {[
            { label: 'AI-Powered Analysis', icon: Cpu },
            { label: 'Real-Time Processing', icon: Zap },
            { label: 'Secure & Private', icon: Shield },
            { label: 'Mobile Optimized', icon: Smartphone },
          ].map((badge) => {
            const Icon = badge.icon
            return (
              <div key={badge.label} className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'var(--bg-badge)', border: '1px solid var(--border-primary)' }}>
                <Icon size={14} style={{ color: 'var(--accent-blue)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{badge.label}</span>
              </div>
            )
          })}
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="flex items-center justify-center gap-3 mt-8 flex-wrap"
        >
          {['Hook Analysis', 'Retention Prediction', 'Viral Probability', 'Hashtag Suggestions'].map((feat) => (
            <div key={feat} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-secondary)', color: 'var(--text-tertiary)' }}>
              <Sparkles size={10} style={{ color: 'var(--accent-blue)' }} />
              {feat}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
