'use client'

import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import { type ReactNode } from 'react'

interface LazyRevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

/**
 * Fade-in-up wrapper for below-the-fold sections.
 * Animates once when scrolled into view.
 *
 * Honours `prefers-reduced-motion: reduce` — when the user has reduced motion
 * enabled, the children render immediately with no transform / opacity
 * transition (audit 02 §5 fix). This matches the gating pattern used in
 * 82+ other components across the codebase.
 */
export function LazyReveal({ children, delay = 0, className }: LazyRevealProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Stagger container — children should be <LazyRevealItem>.
 */
export function LazyRevealGroup({
  children,
  className,
  stagger = 0.08,
}: {
  children: ReactNode
  className?: string
  stagger?: number
}) {
  const shouldReduceMotion = useReducedMotion()

  // Reduced-motion: render as a plain div — children (LazyRevealItem) will
  // also short-circuit and render without their entrance animation.
  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function LazyRevealItem({
  children,
  className,
  ...rest
}: HTMLMotionProps<'div'> & { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return (
      <div className={className} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
