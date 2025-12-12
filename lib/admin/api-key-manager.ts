/**
 * API KEY MANAGER
 * Handles automatic API key rotation for Gemini and other services
 */

import { createClient } from '@/lib/supabase/server'

export interface ApiKey {
    id: string
    name: string
    key_value: string
    service: string
    is_active: boolean
    usage_count: number
    error_count: number
    last_used_at: string | null
    last_error_at: string | null
}

/**
 * Get next available API key (auto-rotation)
 * Prioritizes: active keys → lowest errors → lowest usage → least recently used
 */
export async function getNextApiKey(service: string = 'gemini'): Promise<ApiKey | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .rpc('get_next_api_key', { service_name: service })
        .single()

    if (error || !data) {
        console.error('Error getting API key:', error)
        return null
    }

    return {
        id: data.id,
        key_value: data.key_value,
        name: '',
        service,
        is_active: true,
        usage_count: 0,
        error_count: 0,
        last_used_at: null,
        last_error_at: null,
    }
}

/**
 * Record API key usage (success or failure)
 */
export async function recordApiKeyUsage(keyId: string, success: boolean = true): Promise<void> {
    const supabase = await createClient()

    await supabase.rpc('record_api_key_usage', {
        key_id: keyId,
        success,
    })
}

/**
 * Get all API keys (admin only)
 */
export async function getAllApiKeys(service?: string): Promise<ApiKey[]> {
    const supabase = await createClient()

    let query = supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false })

    if (service) {
        query = query.eq('service', service)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching API keys:', error)
        return []
    }

    return data || []
}

/**
 * Add new API key
 */
export async function addApiKey(
    name: string,
    keyValue: string,
    service: string = 'gemini'
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('api_keys')
        .insert({
            name,
            key_value: keyValue,
            service,
            is_active: true,
        })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Update API key (enable/disable)
 */
export async function updateApiKey(
    keyId: string,
    updates: Partial<Pick<ApiKey, 'name' | 'is_active'>>
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('api_keys')
        .update(updates)
        .eq('id', keyId)

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Delete API key
 */
export async function deleteApiKey(keyId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Test API key (verify it works)
 */
export async function testApiKey(keyValue: string, service: string = 'gemini'): Promise<boolean> {
    if (service === 'gemini') {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${keyValue}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: 'test' }] }],
                    }),
                }
            )
            return response.ok
        } catch {
            return false
        }
    }

    return false
}
