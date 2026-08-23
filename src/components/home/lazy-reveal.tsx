import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface LazyRevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function LazyReveal({ children, delay = 0, className }: LazyRevealProps) {
  return (
    <div
      className={cn(
        'animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both transform-gpu',
        className
      )}
      style={delay ? { animationDelay: `${delay * 1000}ms` } : undefined}
    >
      {children}
    </div>
  )
}

export function LazyRevealGroup({
  children,
  className,
}: {
  children: ReactNode
  className?: string
  stagger?: number
}) {
  return <div className={className}>{children}</div>
}

export function LazyRevealItem({
  children,
  className,
}: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both transform-gpu', className)}>
      {children}
    </div>
  )
}

