'use client'

import { useEffect, useRef, useState } from 'react'

function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
}

function toPersian(n: number): string {
  return n.toLocaleString('fa-IR')
}

export function CountUp({ to, duration = 1500 }: { to: number; duration?: number }) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  
  useEffect(() => {
    let startTimestamp: number | null = null
    let animationFrame: number
    let observer: IntersectionObserver

    const startAnimation = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const currentVal = Math.floor(easeOutExpo(progress) * to)
      
      setValue(currentVal)
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(startAnimation)
      } else {
        setValue(to)
      }
    }

    if (ref.current) {
      observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          startTimestamp = null
          animationFrame = requestAnimationFrame(startAnimation)
          observer.disconnect()
        }
      }, { threshold: 0.1 })
      
      observer.observe(ref.current)
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
      if (observer) observer.disconnect()
    }
  }, [to, duration])

  return (
    <span ref={ref} aria-live="polite">
      {toPersian(value)}
    </span>
  )
}
