'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const CommandPalette = dynamic(
  () => import('./command-palette').then(m => m.CommandPalette),
  { ssr: false },
)

/** Keep the shortcut ready; download the search dialog when it is opened. */
export function CommandPaletteLoader() {
  const [requested, setRequested] = useState(false)
  useEffect(() => {
    if (requested) return
    const open = () => setRequested(true)
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        open()
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('ky:cmdk-open', open)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('ky:cmdk-open', open)
    }
  }, [requested])
  return requested ? <CommandPalette initiallyOpen /> : null
}
