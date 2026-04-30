import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Friendship = Database['public']['Tables']['friendships']['Row']
type FriendshipInsert = Database['public']['Tables']['friendships']['Insert']

export interface Friend {
    friend_id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
    xp: number
    level: number
    current_streak: number
    books_read: number
    friendship_date: string
}

export interface FriendRequest {
    request_id: string
    requester_id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
    xp: number
    level: number
    current_streak: number
    requested_at: string
}

/**
 * Send a friend request
 */
export async function sendFriendRequest(userId: string, friendId: string) {
    const supabase = createClient()

    // Check if friendship already exists
    const { data: existing } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
        .single()

    if (existing) {
        throw new Error('درخواست دوستی قبلاً ارسال شده است')
    }

    const { data, error } = await supabase
        .from('friendships')
        .insert({
            user_id: userId,
            friend_id: friendId,
            status: 'pending'
        } as any)
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(requestId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('friendships')
        .update({
            status: 'accepted',
            responded_at: new Date( as any).toISOString()
        })
        .eq('id', requestId)
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * Reject a friend request
 */
export async function rejectFriendRequest(requestId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('friendships')
        .update({
            status: 'rejected',
            responded_at: new Date( as any).toISOString()
        })
        .eq('id', requestId)
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * Remove a friend (delete friendship)
 */
export async function removeFriend(userId: string, friendId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)

    if (error) throw error
}

/**
 * Get user's friends with stats
 */
export async function getFriends(userId: string): Promise<Friend[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .rpc('get_friends', { p_user_id: userId })

    if (error) throw error
    return data || []
}

/**
 * Get pending friend requests
 */
export async function getFriendRequests(userId: string): Promise<FriendRequest[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .rpc('get_friend_requests', { p_user_id: userId })

    if (error) throw error
    return data || []
}

/**
 * Search users by username or name
 */
export async function searchUsers(query: string, currentUserId: string, limit = 20) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, xp, gamification_level, current_streak')
        .neq('id', currentUserId)
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(limit)

    if (error) throw error
    return data || []
}

/**
 * Check friendship status between two users
 */
async function checkFriendshipStatus(userId: string, friendId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
        .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
}

/**
 * Block a user
 */
async function blockUser(userId: string, friendId: string) {
    const supabase = createClient()

    // First, check if friendship exists
    const existing = await checkFriendshipStatus(userId, friendId)

    if (existing) {
        // Update existing friendship to blocked
        const { error } = await supabase
            .from('friendships')
            .update({ status: 'blocked' } as any)
            .eq('id', existing.id)

        if (error) throw error
    } else {
        // Create new blocked relationship
        const { error } = await supabase
            .from('friendships')
            .insert({
                user_id: userId,
                friend_id: friendId,
                status: 'blocked'
            } as any)

        if (error) throw error
    }
}

/**
 * Unblock a user
 */
async function unblockUser(userId: string, friendId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
        .eq('status', 'blocked')

    if (error) throw error
}
