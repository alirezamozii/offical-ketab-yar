'use client'

import { useState } from 'react'
import { Banana, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EasterEggHeart() {
  const [morphed, setMorphed] = useState(false)
  return (
    <button
      type="button"
      onClick={() => setMorphed((v) => !v)}
      aria-label={morphed ? 'بازگشت به قلب' : 'ساخته شده با عشق — کلیک کنید'}
      title={morphed ? 'موز' : 'عشق'}
      className="group relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-300 hover:scale-110 active:scale-95 tap-target"
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-0 rounded-full blur-md transition-all duration-300 ease-in-out',
          morphed
            ? 'bg-yellow-400/50 opacity-80 scale-110'
            : 'bg-red-500/40 opacity-60 scale-100',
        )}
      />
      <span
        className={cn(
          'relative inline-flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none',
          morphed
            ? 'opacity-100 scale-100 rotate-0'
            : 'absolute opacity-0 scale-50 -rotate-90 pointer-events-none',
        )}
      >
        <Banana className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
      </span>
      <span
        className={cn(
          'relative inline-flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none',
          !morphed
            ? 'opacity-100 scale-100 rotate-0'
            : 'absolute opacity-0 scale-50 rotate-90 pointer-events-none',
        )}
      >
        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
      </span>
    </button>
  )
}
