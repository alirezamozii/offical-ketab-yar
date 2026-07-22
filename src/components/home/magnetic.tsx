'use client'

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion'
import { useRef } from 'react'

/**
 * Magnetic — shared magnetic-hover wrapper.
 *
 * The contained element drifts a few pixels toward the cursor while it is
 * hovered, and springs back on leave. Skipped entirely for reduced-motion
 * users and on coarse pointers (touch).
 *
 * Used by:
 *   - CTA section's "ورود به کتابخانه" button
 *   - Hero section's "شروع رایگان" + "کتاب تصادفی" buttons
 *
 * Extracted into its own file so both sections share the same component
 * (per user feedback: "ایnarو به دکمه های اکشن باتن اول هم اضقاه کن").
 */
export function Magnetic({
  children,
  strength = 14,
  className,
}: {
  children: React.ReactNode
  strength?: number
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 250, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 250, damping: 18, mass: 0.4 })

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduceMotion || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
    const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
    x.set(nx * strength)
    y.set(ny * strength)
  }
  function onLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={reduceMotion ? undefined : { x: sx, y: sy }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
