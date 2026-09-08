'use client'

import { useCallback, useRef } from 'react'

/**
 * Magnetic — shared magnetic-hover wrapper.
 *
 * The contained element drifts a few pixels toward the cursor while it is
 * hovered, and springs back on leave. Skipped entirely for reduced-motion
 * users and on coarse pointers (touch devices).
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
  const ref = useRef<HTMLDivElement>(null)
  const rectRef = useRef<DOMRect | null>(null)

  const onEnter = useCallback(() => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (ref.current) {
      rectRef.current = ref.current.getBoundingClientRect()
    }
  }, [])

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current
      if (!el) return
      let r = rectRef.current
      if (!r) {
        if (typeof window === 'undefined') return
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
        r = el.getBoundingClientRect()
        rectRef.current = r
      }
      const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
      const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
      el.style.transform = `translate(${nx * strength}px, ${ny * strength}px)`
    },
    [strength],
  )

  const onLeave = useCallback(() => {
    rectRef.current = null
    if (ref.current) {
      ref.current.style.transform = 'translate(0px, 0px)'
    }
  }, [])

  return (
    <div
      ref={ref}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out ${className ?? ''}`}
    >
      {children}
    </div>
  )
}

