'use client'

import { useEffect, useRef } from 'react'
import { toPersianDigits } from '@/lib/typography'

function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
}

export function CountUp({ to, duration = 1400 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const node = ref.current
    if (!node) return

    let rafId: number | null = null
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect()
          let startTimestamp: number | null = null

          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp
            const progress = Math.min((timestamp - startTimestamp) / duration, 1)
            const currentVal = Math.floor(easeOutExpo(progress) * to)
            if (node) {
              node.textContent = toPersianDigits(currentVal)
            }

            if (progress < 1) {
              rafId = requestAnimationFrame(step)
            } else if (node) {
              node.textContent = toPersianDigits(to)
            }
          }

          rafId = requestAnimationFrame(step)
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(node)
    return () => {
      observer.disconnect()
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [to, duration])

  return (
    <span ref={ref} aria-live="polite" className="tabular-nums">
      {toPersianDigits(to)}
    </span>
  )
}

