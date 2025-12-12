import * as React from "react"

import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "gold" | "premium" | "interactive"
  hover?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", hover = false, ...props }, ref) => {
    const variants = {
      default: "bg-card text-card-foreground border shadow-sm",
      gold: "bg-gradient-to-br from-gold-50 to-gold-100 dark:from-gold-950 dark:to-gold-900 text-card-foreground border-gold-200 dark:border-gold-800 shadow-md",
      premium: "bg-gradient-to-br from-gold-100 via-gold-50 to-white dark:from-gold-900 dark:via-gold-950 dark:to-background text-card-foreground border-gold-300 dark:border-gold-700 shadow-lg",
      interactive: "bg-card text-card-foreground border shadow-sm cursor-pointer",
    }

    const hoverEffects = hover || variant === "interactive"
      ? "transition-all duration-200 ease-out hover:shadow-lg hover:-translate-y-1 hover:border-primary/40 will-change-transform"
      : ""

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg",
          variants[variant],
          hoverEffects,
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }

