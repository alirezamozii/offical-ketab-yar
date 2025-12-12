'use client'

import * as React from "react"

import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 will-change-transform active:scale-[0.96] relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md",
        outline:
          "border-2 border-input bg-background hover:bg-beige-100 dark:hover:bg-primary/5 hover:text-primary hover:border-primary/50 hover:shadow-md hover:shadow-primary/10",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        ghost: "hover:bg-beige-100 dark:hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        bronze: "bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 shadow-lg hover:shadow-xl shadow-gold-500/30 dark:shadow-gold-500/20 hover:shadow-gold-600/40 dark:hover:shadow-gold-600/25 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
        premium: "bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 text-white hover:from-gold-500 hover:via-gold-600 hover:to-gold-700 shadow-xl hover:shadow-2xl shadow-gold-500/40 dark:shadow-gold-500/30 hover:shadow-gold-600/50 dark:hover:shadow-gold-600/40 font-semibold before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-1000 after:absolute after:inset-0 after:rounded-md after:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]",
        glow: "bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 text-white hover:from-gold-500 hover:via-gold-600 hover:to-gold-700 shadow-[0_0_20px_rgba(184,149,106,0.4),0_0_40px_rgba(184,149,106,0.2)] hover:shadow-[0_0_30px_rgba(184,149,106,0.6),0_0_60px_rgba(184,149,106,0.3),0_0_80px_rgba(184,149,106,0.1)] font-bold animate-pulse-glow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-14 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    // Add haptic feedback on click (Agent 3 - Psychology)
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Trigger haptic feedback
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          // Light haptic for normal buttons, medium for premium
          const pattern = variant === 'premium' || variant === 'gold' ? 20 : 10
          navigator.vibrate(pattern)
        } catch {
          // Silently fail
        }
      }

      // Call original onClick
      onClick?.(e)
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

