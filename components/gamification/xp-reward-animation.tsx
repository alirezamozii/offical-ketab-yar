'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

interface XPRewardAnimationProps {
  amount: number
  onComplete?: () => void
}

export function XPRewardAnimation({ amount, onComplete }: XPRewardAnimationProps) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Play sound effect using sound utility (Agent 3 - Psychology)
    if (typeof window !== 'undefined') {
      import('@/lib/utils/sound-effects').then(({ soundEffects }) => {
        soundEffects.xp()
      }).catch(() => {
        // Silently fail if sound system not available
      })
    }

    // Auto-hide after animation
    const timer = setTimeout(() => {
      setShow(false)
      onComplete?.()
    }, 1500)

    return () => clearTimeout(timer)
  }, [onComplete, amount])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [0, -30, -50, -80],
            scale: [0.5, 1.2, 1, 0.8]
          }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
        >
          <div className="flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-white px-6 py-3 rounded-full shadow-2xl">
            <Sparkles className="w-5 h-5" />
            <span className="text-2xl font-bold">+{amount} XP</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook for triggering XP animations
function useXPReward() {
  const [reward, setReward] = useState<number | null>(null)

  const showReward = (amount: number) => {
    setReward(amount)
  }

  const clearReward = () => {
    setReward(null)
  }

  return { reward, showReward, clearReward }
}
