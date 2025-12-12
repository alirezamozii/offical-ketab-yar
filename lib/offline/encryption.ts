/**
 * KETAB-YAR: Content Encryption
 * 
 * Encrypts book content for secure offline storage
 * Uses Web Crypto API (SubtleCrypto)
 */

/**
 * Generate encryption key from user ID
 * This ensures each user has a unique key
 */
async function generateKey(userId: string): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(userId + '-ketab-yar-secret'),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    )

    return await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode('ketab-yar-salt'),
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    )
}

/**
 * Encrypt book content
 */
export async function encryptContent(
    content: string,
    userId: string
): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
    const key = await generateKey(userId)
    const encoder = new TextEncoder()
    const data = encoder.encode(content)

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
    )

    return { encrypted, iv }
}

/**
 * Decrypt book content
 */
export async function decryptContent(
    encrypted: ArrayBuffer,
    iv: Uint8Array,
    userId: string
): Promise<string> {
    const key = await generateKey(userId)

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
}

/**
 * Generate SHA-256 hash for content integrity check
 */
export async function generateContentHash(content: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify content integrity
 */
export async function verifyContentHash(
    content: string,
    expectedHash: string
): Promise<boolean> {
    const actualHash = await generateContentHash(content)
    return actualHash === expectedHash
}
