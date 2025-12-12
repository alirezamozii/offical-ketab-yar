/**
 * Crypto Manager
 * Agent 2 (Performance): Secure offline book storage with encryption
 * 
 * Features:
 * - SubtleCrypto API for encryption/decryption
 * - Derived keys from user ID + book ID
 * - No keys stored in IndexedDB (derived on-demand)
 * - Prevents content theft even with root access
 */

/**
 * Generate encryption key from user ID and book ID
 * This key is NEVER stored - always derived on demand
 */
async function deriveKey(userId: string, bookId: string): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const keyMaterial = encoder.encode(`${userId}:${bookId}:ketab-yar-secret`)

    // Import key material
    const importedKey = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    )

    // Derive AES-GCM key
    const derivedKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode('ketab-yar-salt-v1'),
            iterations: 100000,
            hash: 'SHA-256',
        },
        importedKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    )

    return derivedKey
}

/**
 * Encrypt book content
 * Returns encrypted data + IV (initialization vector)
 */
export async function encryptBookContent(
    content: string,
    userId: string,
    bookId: string
): Promise<{ encryptedData: ArrayBuffer; iv: Uint8Array }> {
    try {
        const encoder = new TextEncoder()
        const data = encoder.encode(content)

        // Generate random IV
        const iv = crypto.getRandomValues(new Uint8Array(12))

        // Derive encryption key
        const key = await deriveKey(userId, bookId)

        // Encrypt
        const encryptedData = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        )

        return { encryptedData, iv }
    } catch (error) {
        console.error('❌ Encryption failed:', error)
        throw new Error('Failed to encrypt book content')
    }
}

/**
 * Decrypt book content
 * Requires the same userId and bookId used for encryption
 */
export async function decryptBookContent(
    encryptedData: ArrayBuffer,
    iv: Uint8Array,
    userId: string,
    bookId: string
): Promise<string> {
    try {
        // Derive decryption key (same as encryption key)
        const key = await deriveKey(userId, bookId)

        // Decrypt
        const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encryptedData
        )

        // Convert back to string
        const decoder = new TextDecoder()
        return decoder.decode(decryptedData)
    } catch (error) {
        console.error('❌ Decryption failed:', error)
        throw new Error('Failed to decrypt book content')
    }
}

/**
 * Check if SubtleCrypto is available
 */
export function isCryptoAvailable(): boolean {
    return typeof crypto !== 'undefined' &&
        typeof crypto.subtle !== 'undefined' &&
        typeof crypto.subtle.encrypt === 'function'
}

/**
 * Generate encryption key ID for reference
 * This is NOT the actual key, just an identifier
 */
export function generateKeyId(userId: string, bookId: string): string {
    return `key_${userId.substring(0, 8)}_${bookId.substring(0, 8)}`
}
