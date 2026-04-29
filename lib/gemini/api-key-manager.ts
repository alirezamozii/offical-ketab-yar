import { createClient } from '@/lib/supabase/server'

interface APIKey {
    id: string
    key: string
    is_active: boolean
    usage_count: number
    last_used_at: string | null
    error_count: number
    created_at: string
}

/**
 * API Key Manager - Handles multiple Gemini API keys with rotation and fallback
 */
class APIKeyManager {
    private fallbackKey: string
    private cachedKeys: APIKey[] = []
    private lastFetch: number = 0
    private cacheDuration = 60000 // 1 minute cache

    constructor() {
        // Fallback key from environment
        this.fallbackKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''
    }

    /**
     * Get all active API keys from Supabase
     */
    private async fetchKeysFromDatabase(): Promise<APIKey[]> {
        try {
            const supabase = await createClient()

            const { data, error } = await supabase
                .from('gemini_api_keys')
                .select('*')
                .eq('is_active', true)
                .order('usage_count', { ascending: true }) // Least used first
                .order('error_count', { ascending: true }) // Least errors first

            if (error) {
                console.error('Error fetching API keys:', error)
                return []
            }

            return data || []
        } catch (error) {
            console.error('Failed to fetch API keys:', error)
            return []
        }
    }

    /**
     * Get API keys with caching
     */
    private async getKeys(): Promise<APIKey[]> {
        const now = Date.now()

        // Return cached keys if still valid
        if (this.cachedKeys.length > 0 && now - this.lastFetch < this.cacheDuration) {
            return this.cachedKeys
        }

        // Fetch fresh keys
        this.cachedKeys = await this.fetchKeysFromDatabase()
        this.lastFetch = now

        return this.cachedKeys
    }

    /**
     * Get a random API key from available keys
     */
    async getRandomKey(): Promise<string> {
        const keys = await this.getKeys()

        // If no keys in database, use fallback
        if (keys.length === 0) {
            return this.fallbackKey
        }

        // Get random key from available keys
        const randomIndex = Math.floor(Math.random() * keys.length)
        return keys[randomIndex].key
    }

    /**
     * Get next API key with rotation (least used first)
     */
    async getNextKey(): Promise<{ key: string; keyId?: string }> {
        const keys = await this.getKeys()

        // If no keys in database, use fallback
        if (keys.length === 0) {
            return { key: this.fallbackKey }
        }

        // Return least used key
        const nextKey = keys[0]
        return { key: nextKey.key, keyId: nextKey.id }
    }

    /**
     * Try multiple keys until one works
     */
    async getWorkingKey(
        testFn: (key: string) => Promise<boolean>
    ): Promise<{ key: string; keyId?: string } | null> {
        const keys = await this.getKeys()

        // Try database keys first
        for (const apiKey of keys) {
            try {
                const works = await testFn(apiKey.key)
                if (works) {
                    return { key: apiKey.key, keyId: apiKey.id }
                }
            } catch (err) {
                // Mark error and continue to next key
                console.error('API key test failed:', err)
                await this.markKeyError(apiKey.id)
                continue
            }
        }

        // Try fallback key
        if (this.fallbackKey) {
            try {
                const works = await testFn(this.fallbackKey)
                if (works) {
                    return { key: this.fallbackKey }
                }
            } catch (error) {
                console.error('Fallback key also failed:', error)
            }
        }

        return null
    }

    /**
     * Mark key as used (increment usage count)
     */
    async markKeyUsed(keyId: string): Promise<void> {
        try {
            const supabase = await createClient()

            await supabase
                .from('gemini_api_keys')
                .update({
                    usage_count: supabase.rpc('increment', { row_id: keyId }),
                    last_used_at: new Date().toISOString()
                })
                .eq('id', keyId)

            // Invalidate cache
            this.lastFetch = 0
        } catch (error) {
            console.error('Failed to mark key as used:', error)
        }
    }

    /**
     * Mark key as having an error
     */
    async markKeyError(keyId: string): Promise<void> {
        try {
            const supabase = await createClient()

            const { data } = await supabase
                .from('gemini_api_keys')
                .select('error_count')
                .eq('id', keyId)
                .single()

            const newErrorCount = (data?.error_count || 0) + 1

            // Deactivate key if too many errors (>10)
            const updates: Record<string, unknown> = {
                error_count: newErrorCount
            }

            if (newErrorCount > 10) {
                updates.is_active = false
            }

            await supabase
                .from('gemini_api_keys')
                .update(updates)
                .eq('id', keyId)

            // Invalidate cache
            this.lastFetch = 0
        } catch (error) {
            console.error('Failed to mark key error:', error)
        }
    }

    /**
     * Reset error count for a key
     */
    async resetKeyErrors(keyId: string): Promise<void> {
        try {
            const supabase = await createClient()

            await supabase
                .from('gemini_api_keys')
                .update({
                    error_count: 0,
                    is_active: true
                })
                .eq('id', keyId)

            // Invalidate cache
            this.lastFetch = 0
        } catch (error) {
            console.error('Failed to reset key errors:', error)
        }
    }

    /**
     * Get fallback key
     */
    getFallbackKey(): string {
        return this.fallbackKey
    }
}

// Singleton instance
let apiKeyManager: APIKeyManager | null = null

export function getAPIKeyManager(): APIKeyManager {
    if (!apiKeyManager) {
        apiKeyManager = new APIKeyManager()
    }
    return apiKeyManager
}
