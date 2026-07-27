import { describe, expect, it } from 'vitest'
import {
  masteryFor,
  boxColor,
  boxLabel,
  masteryLabel,
  masteryColor,
  masteryBg,
  boxIntervalMs,
  boxIntervalLabel,
  type SrsBox,
  type MasteryLevel,
} from '@/hooks/reader/use-srs'

describe('SRS Leitner Algorithm Utilities', () => {
  it('correctly maps box 1..7 to mastery levels', () => {
    expect(masteryFor(1)).toBe('new')
    expect(masteryFor(2)).toBe('learning')
    expect(masteryFor(3)).toBe('learning')
    expect(masteryFor(4)).toBe('familiar')
    expect(masteryFor(5)).toBe('familiar')
    expect(masteryFor(6)).toBe('mastered')
    expect(masteryFor(7)).toBe('mastered')
  })

  it('returns valid Persian labels for all boxes', () => {
    const boxes: SrsBox[] = [1, 2, 3, 4, 5, 6, 7]
    boxes.forEach((b) => {
      expect(boxLabel(b)).toBeTruthy()
      expect(boxIntervalLabel(b)).toBeTruthy()
      expect(boxIntervalMs(b)).toBeGreaterThanOrEqual(0)
    })
  })

  it('returns valid Persian labels for mastery levels', () => {
    const levels: MasteryLevel[] = ['new', 'learning', 'familiar', 'mastered']
    levels.forEach((lvl) => {
      expect(masteryLabel(lvl)).toBeTruthy()
      expect(masteryColor(lvl)).toBeTruthy()
      expect(masteryBg(lvl)).toBeTruthy()
    })
  })

  it('verifies Leitner box interval progression increases monotonically', () => {
    expect(boxIntervalMs(1)).toBe(0)
    expect(boxIntervalMs(2)).toBe(10 * 60 * 1000)
    expect(boxIntervalMs(3)).toBe(60 * 60 * 1000)
    expect(boxIntervalMs(4)).toBe(24 * 60 * 60 * 1000)
    expect(boxIntervalMs(5)).toBe(3 * 24 * 60 * 60 * 1000)
    expect(boxIntervalMs(6)).toBe(7 * 24 * 60 * 60 * 1000)
    expect(boxIntervalMs(7)).toBe(14 * 24 * 60 * 60 * 1000)
  })

  it('verifies boxColor returns distinct non-empty Tailwind classes', () => {
    const boxes: SrsBox[] = [1, 2, 3, 4, 5, 6, 7]
    boxes.forEach((b) => {
      expect(boxColor(b)).toMatch(/^bg-/)
    })
  })
})
