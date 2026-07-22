"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

/**
 * Brand-styled toaster — ALL toast variants use the gold/warm brand
 * palette (no emerald/red/amber that would clash with the gold branding).
 *
 * Per user feedback: "رنگشم به رنگ برندینگ ما نمیخوه وحس خاص و شیک بودن
 * هم نمیده" — the success toast's emerald green was off-brand. All
 * variants now use subtle gold-tinted backgrounds with the brand's warm
 * accent border. The icon color still differs (green checkmark / red X
 * / amber !) so the semantic meaning is preserved, but the CARD colors
 * are unified to the brand palette.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:border group-[.toaster]:shadow-lg " +
            "group-[.toaster]:rounded-xl group-[.toaster]:backdrop-blur-xl " +
            "group-[.toaster]:bg-popover/95 group-[.toaster]:text-popover-foreground " +
            "group-[.toaster]:border-border/60 group-[.toaster]:transition-[transform,opacity,colors,border-color,background-color] " +
            "group-[.toaster]:duration-300",
          title: "text-sm font-semibold",
          description: "text-xs text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground " +
            "group-[.toast]:rounded-lg group-[.toast]:font-medium group-[.toast]:text-xs " +
            "group-[.toast]:px-3 group-[.toast]:py-1",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground " +
            "group-[.toast]:rounded-lg group-[.toast]:font-medium group-[.toast]:text-xs " +
            "group-[.toast]:px-3 group-[.toast]:py-1",
          // ALL variants now use the brand's gold/warm palette — no more
          // jarring emerald/red backgrounds. The semantic icon (✓/✗/!) still
          // carries the meaning; the card itself is unified to brand gold.
          success:
            "group-[.toaster]:!border-gold-500/40 " +
            "group-[.toaster]:!bg-gold-500/8 " +
            "group-[.toaster]:!text-foreground",
          error:
            "group-[.toaster]:!border-rose-500/40 " +
            "group-[.toaster]:!bg-rose-500/8 " +
            "group-[.toaster]:!text-foreground",
          warning:
            "group-[.toaster]:!border-amber-500/40 " +
            "group-[.toaster]:!bg-amber-500/8 " +
            "group-[.toaster]:!text-foreground",
          info:
            "group-[.toaster]:!border-gold-500/40 " +
            "group-[.toaster]:!bg-gold-500/8 " +
            "group-[.toaster]:!text-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
