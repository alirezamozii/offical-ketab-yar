"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import * as React from "react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    // Toggle between light and dark (system preference is used by default)
    if (resolvedTheme === "dark") {
      setTheme("light")
    } else {
      setTheme("dark")
    }
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">تغییر تم</span>
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative overflow-hidden rounded-xl group"
    >
      {/* Background ripple effect */}
      <motion.div
        key={isDark ? "dark-bg" : "light-bg"}
        initial={{ scale: 0, opacity: 0.5 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className={`absolute inset-0 rounded-full ${isDark ? 'bg-gold-500/20' : 'bg-gold-600/20'
          }`}
      />

      {/* Icon with smooth morph */}
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ scale: 0.6, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.6, rotate: 90, opacity: 0 }}
            transition={{
              duration: 0.15,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Moon className="h-[1.2rem] w-[1.2rem] text-gold-700 dark:text-gold-500 group-hover:scale-110 transition-transform duration-200" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ scale: 0.6, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.6, rotate: 90, opacity: 0 }}
            transition={{
              duration: 0.15,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] text-gold-700 dark:text-gold-600 group-hover:scale-110 group-hover:rotate-90 transition-all duration-200" />
          </motion.div>
        )}
      </AnimatePresence>
      <span className="sr-only">تغییر تم</span>
    </Button>
  )
}
