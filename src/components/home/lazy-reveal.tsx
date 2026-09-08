import { type ReactNode } from 'react'


interface LazyRevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function LazyReveal({ children, className }: LazyRevealProps) {
  return <div className={className}>{children}</div>
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
  return <div className={className}>{children}</div>
}

