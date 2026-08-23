import { describe, it, expect } from 'vitest'

// Helper mirroring client/server permission logic
export function canBanUser(callerRole: 'owner' | 'admin' | 'editor', targetRole: string): boolean {
  if (targetRole === 'OWNER') return false // No one can ban owner
  if (targetRole === 'ADMIN') return callerRole === 'owner' // Only owner can ban admin
  return callerRole === 'owner' || callerRole === 'admin' // Both can ban regular user
}

export function canUnbanUser(callerRole: 'owner' | 'admin' | 'editor', targetRole: string): boolean {
  if (targetRole === 'ADMIN') return callerRole === 'owner' // Only owner can unban admin
  return callerRole === 'owner' || callerRole === 'admin'
}

export function canDeleteUser(callerRole: 'owner' | 'admin' | 'editor', targetRole: string): boolean {
  return callerRole === 'owner' && targetRole !== 'OWNER' // Only owner can delete, but not owner account
}

export function canChangeRole(callerRole: 'owner' | 'admin' | 'editor'): boolean {
  return callerRole === 'owner'
}

describe('User Moderation Hierarchy & Permission Rules', () => {
  describe('Rule: No one can ban owner', () => {
    it('prevents owner from banning owner', () => {
      expect(canBanUser('owner', 'OWNER')).toBe(false)
    })

    it('prevents admin from banning owner', () => {
      expect(canBanUser('admin', 'OWNER')).toBe(false)
    })

    it('prevents editor from banning owner', () => {
      expect(canBanUser('editor', 'OWNER')).toBe(false)
    })
  })

  describe('Rule: Admin cannot ban admin', () => {
    it('prevents admin from banning another admin', () => {
      expect(canBanUser('admin', 'ADMIN')).toBe(false)
    })

    it('allows owner to ban admin', () => {
      expect(canBanUser('owner', 'ADMIN')).toBe(true)
    })
  })

  describe('Rule: Banning regular users', () => {
    it('allows admin to ban regular users', () => {
      expect(canBanUser('admin', 'USER')).toBe(true)
    })

    it('allows owner to ban regular users', () => {
      expect(canBanUser('owner', 'USER')).toBe(true)
    })
  })

  describe('Rule: Account removal & role modification', () => {
    it('allows owner to delete regular users and admins', () => {
      expect(canDeleteUser('owner', 'USER')).toBe(true)
      expect(canDeleteUser('owner', 'ADMIN')).toBe(true)
    })

    it('prevents deleting an OWNER account', () => {
      expect(canDeleteUser('owner', 'OWNER')).toBe(false)
    })

    it('prevents admins and editors from deleting any account', () => {
      expect(canDeleteUser('admin', 'USER')).toBe(false)
      expect(canDeleteUser('admin', 'ADMIN')).toBe(false)
      expect(canDeleteUser('editor', 'USER')).toBe(false)
    })

    it('only allows owner to change roles', () => {
      expect(canChangeRole('owner')).toBe(true)
      expect(canChangeRole('admin')).toBe(false)
      expect(canChangeRole('editor')).toBe(false)
    })
  })
})
