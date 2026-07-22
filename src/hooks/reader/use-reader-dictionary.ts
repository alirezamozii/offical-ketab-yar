'use client'

/**
 * use-reader-dictionary — owns the dictionary popup visibility + the
 * currently-looked-up word.
 *
 * Split out of the god-hook so the dictionary panel can subscribe to
 * just this slice via `useReaderDictionary()` (the slice context in
 * `reader-context.tsx`) instead of re-rendering on every scroll tick.
 *
 * `openWithWord(word)` is the helper the text-selection menu calls — it
 * sets the word AND opens the popup in one shot.
 */

import { useCallback, useState } from 'react'

export function useReaderDictionary() {
  const [showDictionary, setShowDictionary] = useState(false)
  const [dictionaryWord, setDictionaryWord] = useState('')

  const openWithWord = useCallback((word: string) => {
    const clean = word
      .trim()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()""'']/g, '')
    if (clean) {
      setDictionaryWord(clean)
      setShowDictionary(true)
    }
  }, [])

  const closeDictionary = useCallback(() => {
    setShowDictionary(false)
  }, [])

  return {
    showDictionary,
    setShowDictionary,
    dictionaryWord,
    setDictionaryWord,
    openWithWord,
    closeDictionary,
  }
}
