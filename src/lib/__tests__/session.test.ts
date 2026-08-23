import { describe, it, expect } from 'vitest'
import { verifyGuestId, signGuestCookie, signIdWithFingerprint, getGuestDisplayName } from '../session'

describe('session helpers', () => {
  it('signs and verifies a guest id cookie', () => {
    const guestId = 'g_test123'
    const cookieVal = signGuestCookie(guestId)
    expect(cookieVal).toContain(guestId)
    const verified = verifyGuestId(cookieVal)
    expect(verified).toBe(guestId)
  })

  it('returns null for invalid/tampered cookie values', () => {
    expect(verifyGuestId(undefined)).toBeNull()
    expect(verifyGuestId('')).toBeNull()
    expect(verifyGuestId('g_test123.invalid_signature')).toBeNull()
    expect(verifyGuestId('malformedcookieval')).toBeNull()
  })

  it('signs id with fingerprint deterministically', () => {
    const sig1 = signIdWithFingerprint('g_abc', 'fp_123')
    const sig2 = signIdWithFingerprint('g_abc', 'fp_123')
    const sig3 = signIdWithFingerprint('g_abc', 'fp_456')

    expect(sig1).toBe(sig2)
    expect(sig1).not.toBe(sig3)
  })

  it('returns a valid Persian display name for guest id', () => {
    const name = getGuestDisplayName('g_abc123')
    expect(name).toMatch(/^کاربر_/)
    expect(getGuestDisplayName(null)).toBe('کاربر_۱')
  })
})
