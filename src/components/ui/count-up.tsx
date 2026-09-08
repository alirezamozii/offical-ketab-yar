'use client'

import { useEffect, useRef, useState } from 'react'
import { toPersianDigits } from '@/lib/typography'

function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
}

export function CountUp({ to, duration = 1400 }: { to: number; duration?: number }) {
  const [value, setValue] = useState(to)
  const ref = useRef<HTMLSpanElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(to)
      return
    }

    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          setValue(0)
          let startTimestamp: number | null = null

          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp
            const progress = Math.min((timestamp - startTimestamp) / duration, 1)
            const currentVal = Math.floor(easeOutExpo(progress) * to)
            setValue(currentVal)

            if (progress < 1) {
              requestAnimationFrame(step)
            } else {
              setValue(to)
            }
          }

          requestAnimationFrame(step)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [to, duration, hasAnimated])

  return (
    <span ref={ref} aria-live="polite" className="tabular-nums">
      {toPersianDigits(value)}
    </span>
  )
}

