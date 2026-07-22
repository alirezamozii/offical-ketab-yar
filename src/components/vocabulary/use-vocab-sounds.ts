'use client'

/**
 * useVocabSounds — subtle Web Audio API sound effects for the vocab
 * mini-games (correct / wrong / game-over / streak-up).
 *
 * Design notes:
 *  • Effects are synthesised at runtime — no audio files, no network.
 *  • Honours a user-controlled "sound enabled" preference stored under
 *    `ky_vocab_sound_enabled` (default ON).
 *  • Lazily creates the AudioContext on first play (browsers require a
 *    user gesture before audio can start).
 *  • No-ops gracefully when AudioContext is unavailable (SSR, old
 *    browsers, or autoplay-policy block).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { STORAGE_KEYS } from '@/lib/storage-keys'

const SOUND_KEY = STORAGE_KEYS.vocabSoundEnabled

type SoundName = 'correct' | 'wrong' | 'timeout' | 'streak' | 'gameover' | 'tick'

function loadEnabled(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const raw = localStorage.getItem(SOUND_KEY)
    if (raw == null) return true // default ON
    return raw === '1'
  } catch {
    return true
  }
}

function saveEnabled(v: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, v ? '1' : '0')
  } catch {}
}

export interface UseVocabSoundsReturn {
  enabled: boolean
  setEnabled: (v: boolean) => void
  toggle: () => void
  play: (name: SoundName) => void
}

export function useVocabSounds(): UseVocabSoundsReturn {
  const [enabled, setEnabledState] = useState(true)
  const ctxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    setEnabledState(loadEnabled())
  }, [])

  /** Lazily create (or resume) the AudioContext. */
  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null
    if (!('AudioContext' in window || 'webkitAudioContext' in window)) {
      return null
    }
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      try {
        ctxRef.current = new Ctor()
      } catch {
        return null
      }
    }
    // Browsers may suspend the context until a user gesture; try to
    // resume on every call (no-op if already running).
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {})
    }
    return ctxRef.current
  }, [])

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v)
    saveEnabled(v)
  }, [])

  const toggle = useCallback(() => {
    setEnabledState((prev) => {
      const next = !prev
      saveEnabled(next)
      return next
    })
  }, [])

  const play = useCallback(
    (name: SoundName) => {
      if (!enabled) return
      const ctx = getCtx()
      if (!ctx) return

      // Helper: schedule a single sine/triangle tone.
      const tone = (
        freq: number,
        startOffset: number,
        duration: number,
        type: OscillatorType = 'sine',
        gainPeak = 0.08,
      ) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = type
        osc.frequency.value = freq
        const startAt = ctx.currentTime + startOffset
        const endAt = startAt + duration
        gain.gain.setValueAtTime(0, startAt)
        gain.gain.linearRampToValueAtTime(gainPeak, startAt + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, endAt)
        osc.connect(gain).connect(ctx.destination)
        osc.start(startAt)
        osc.stop(endAt + 0.02)
      }

      switch (name) {
        case 'correct':
          // Bright two-note up-chime (C5 → E5).
          tone(523.25, 0, 0.12, 'sine', 0.06)
          tone(659.25, 0.08, 0.18, 'sine', 0.06)
          break
        case 'wrong':
          // Soft descending low buzz.
          tone(220.0, 0, 0.18, 'triangle', 0.07)
          tone(174.61, 0.1, 0.22, 'triangle', 0.06)
          break
        case 'timeout':
          // Single low note.
          tone(196.0, 0, 0.25, 'sine', 0.06)
          break
        case 'streak':
          // Quick ascending arpeggio.
          tone(523.25, 0, 0.08, 'sine', 0.05)
          tone(659.25, 0.06, 0.08, 'sine', 0.05)
          tone(783.99, 0.12, 0.16, 'sine', 0.06)
          break
        case 'gameover':
          // Long descending fanfare.
          tone(659.25, 0, 0.16, 'triangle', 0.06)
          tone(523.25, 0.14, 0.16, 'triangle', 0.06)
          tone(392.0, 0.28, 0.32, 'triangle', 0.07)
          break
        case 'tick':
          // Very short high click (for last-few-seconds countdown).
          tone(880.0, 0, 0.04, 'square', 0.03)
          break
      }
    },
    [enabled, getCtx],
  )

  return { enabled, setEnabled, toggle, play }
}
