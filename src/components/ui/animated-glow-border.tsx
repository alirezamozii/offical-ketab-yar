import { cn } from '@/lib/utils'

interface AnimatedGlowBorderProps {
  color?: string
  thickness?: number
  className?: string
}

/**
 * Animated glow border that traces around a button smoothly.
 * Uses GPU-accelerated conic-gradient and CSS masking for zero lag and perfect crispness.
 * Must be placed inside a container with `position: relative` and a defined `border-radius`.
 */
export function AnimatedGlowBorder({ 
  color = 'rgba(255, 255, 255, 0.8)', 
  thickness = 2,
  className 
}: AnimatedGlowBorderProps) {
  return (
    <div 
      className={cn(
        "pointer-events-none absolute inset-0 z-10 rounded-[inherit] overflow-hidden", 
        "opacity-0 animate-[glow-visibility_8s_ease-in-out_infinite]",
        className
      )}
      style={{
        padding: `${thickness}px`,
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
      }}
    >
      <div 
        className="absolute left-1/2 top-1/2 h-[300%] w-[300%] -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite]"
        style={{
          background: `conic-gradient(from 0deg, transparent 50%, ${color} 100%)`
        }}
      />
    </div>
  )
}
