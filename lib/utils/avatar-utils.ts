/**
 * Avatar Utilities
 * Helper functions for avatar management
 */

export type AvatarType = 'preset' | 'google' | 'custom' | 'initials'

export interface AvatarData {
    type: AvatarType
    presetId?: number
    customUrl?: string
    initials?: string
}

/**
 * Get avatar URL based on avatar data
 */
export function getAvatarUrl(avatar: AvatarData): string | null {
    switch (avatar.type) {
        case 'preset':
            return `/avatars/preset-${avatar.presetId || 1}.svg`
        case 'google':
        case 'custom':
            return avatar.customUrl || null
        case 'initials':
            return null // Will be generated client-side
        default:
            return '/avatars/preset-1.svg'
    }
}

/**
 * Generate initials from name
 */
export function generateInitials(name: string): string {
    if (!name || name.trim() === '') return '??'

    const parts = name.trim().split(/\s+/)

    if (parts.length === 1) {
        // Single name: take first 2 characters
        return parts[0].substring(0, 2).toUpperCase()
    }

    // Multiple names: take first character of first and last name
    const firstInitial = parts[0].charAt(0)
    const lastInitial = parts[parts.length - 1].charAt(0)

    return (firstInitial + lastInitial).toUpperCase()
}

/**
 * Generate initials from Persian name
 */
export function generatePersianInitials(name: string): string {
    if (!name || name.trim() === '') return '؟؟'

    const parts = name.trim().split(/\s+/)

    if (parts.length === 1) {
        // Single name: take first 2 characters
        return parts[0].substring(0, 2)
    }

    // Multiple names: take first character of first and last name
    const firstInitial = parts[0].charAt(0)
    const lastInitial = parts[parts.length - 1].charAt(0)

    return firstInitial + lastInitial
}

/**
 * Check if string contains Persian characters
 */
export function hasPersianCharacters(text: string): boolean {
    const persianRegex = /[\u0600-\u06FF]/
    return persianRegex.test(text)
}

/**
 * Generate color for initials avatar based on name
 */
export function getInitialsColor(name: string): string {
    const colors = [
        '#667eea', // Purple
        '#f093fb', // Pink
        '#4facfe', // Blue
        '#43e97b', // Green
        '#fa709a', // Rose
        '#D4AF37', // Gold
        '#764ba2', // Deep Purple
        '#f5576c', // Red
        '#00f2fe', // Cyan
        '#38f9d7', // Teal
    ]

    // Generate consistent color based on name
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }

    const index = Math.abs(hash) % colors.length
    return colors[index]
}

/**
 * Validate avatar preset ID
 */
export function isValidPresetId(id: number): boolean {
    return id >= 1 && id <= 6
}

/**
 * Get all preset avatar IDs
 */
export function getPresetAvatarIds(): number[] {
    return [1, 2, 3, 4, 5, 6]
}

/**
 * Get preset avatar description
 */
export function getPresetAvatarDescription(id: number): string {
    const descriptions: Record<number, string> = {
        1: 'آبی بنفش',
        2: 'صورتی قرمز',
        3: 'آبی فیروزه‌ای',
        4: 'سبز آبی',
        5: 'صورتی زرد',
        6: 'طلایی',
    }
    return descriptions[id] || 'نامشخص'
}

/**
 * Validate image URL
 */
export function isValidImageUrl(url: string): boolean {
    try {
        const urlObj = new URL(url)
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
        return false
    }
}

/**
 * Extract Google profile photo URL from OAuth data
 */
export function extractGooglePhotoUrl(userData: any): string | null {
    // Try different possible locations for Google photo
    if (userData?.user_metadata?.avatar_url) {
        return userData.user_metadata.avatar_url
    }
    if (userData?.user_metadata?.picture) {
        return userData.user_metadata.picture
    }
    if (userData?.identities?.[0]?.identity_data?.avatar_url) {
        return userData.identities[0].identity_data.avatar_url
    }
    if (userData?.identities?.[0]?.identity_data?.picture) {
        return userData.identities[0].identity_data.picture
    }
    return null
}

/**
 * Create avatar data object
 */
export function createAvatarData(
    type: AvatarType,
    options?: {
        presetId?: number
        customUrl?: string
        name?: string
    }
): AvatarData {
    const avatar: AvatarData = { type }

    if (type === 'preset' && options?.presetId) {
        avatar.presetId = options.presetId
    }

    if ((type === 'google' || type === 'custom') && options?.customUrl) {
        avatar.customUrl = options.customUrl
    }

    if (type === 'initials' && options?.name) {
        avatar.initials = hasPersianCharacters(options.name)
            ? generatePersianInitials(options.name)
            : generateInitials(options.name)
    }

    return avatar
}

/**
 * Get default avatar for new user
 */
export function getDefaultAvatar(name?: string): AvatarData {
    if (name) {
        return createAvatarData('initials', { name })
    }
    return createAvatarData('preset', { presetId: 1 })
}
