import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Playlist = Database['public']['Tables']['book_playlists']['Row']
type PlaylistInsert = Database['public']['Tables']['book_playlists']['Insert']
type PlaylistUpdate = Database['public']['Tables']['book_playlists']['Update']

export interface PlaylistWithBooks extends Playlist {
    books: Array<{
        id: string
        book_id: string
        position: number
        note: string | null
        added_at: string
        book: {
            id: string
            title: string
            author: string
            cover_url: string | null
            slug: string
        }
    }>
    creator: {
        id: string
        username: string | null
        full_name: string | null
        avatar_url: string | null
    }
    is_following?: boolean
}

/**
 * Create a new playlist
 */
export async function createPlaylist(data: {
    user_id: string
    name: string
    description?: string
    cover_image_url?: string
    is_public?: boolean
}) {
    const supabase = createClient()

    const { data: playlist, error } = await supabase
        .from('book_playlists')
        .insert(data)
        .select()
        .single()

    if (error) throw error
    return playlist
}

/**
 * Update a playlist
 */
export async function updatePlaylist(id: string, data: PlaylistUpdate) {
    const supabase = createClient()

    const { data: playlist, error } = await supabase
        .from('book_playlists')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return playlist
}

/**
 * Delete a playlist
 */
export async function deletePlaylist(id: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('book_playlists')
        .delete()
        .eq('id', id)

    if (error) throw error
}

/**
 * Add a book to playlist
 */
export async function addBookToPlaylist(playlistId: string, bookId: string, note?: string) {
    const supabase = createClient()

    // Get current max position
    const { data: maxPos } = await supabase
        .from('playlist_books')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1)
        .single()

    const position = (maxPos?.position ?? -1) + 1

    const { data, error } = await supabase
        .from('playlist_books')
        .insert({
            playlist_id: playlistId,
            book_id: bookId,
            position,
            note
        })
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * Remove a book from playlist
 */
export async function removeBookFromPlaylist(playlistId: string, bookId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('playlist_books')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('book_id', bookId)

    if (error) throw error
}

/**
 * Reorder books in playlist
 */
export async function reorderPlaylistBooks(playlistId: string, bookIds: string[]) {
    const supabase = createClient()

    // Update positions for all books
    const updates = bookIds.map((bookId, index) => ({
        playlist_id: playlistId,
        book_id: bookId,
        position: index
    }))

    // Delete all existing books
    await supabase
        .from('playlist_books')
        .delete()
        .eq('playlist_id', playlistId)

    // Insert with new positions
    const { error } = await supabase
        .from('playlist_books')
        .insert(updates)

    if (error) throw error
}

/**
 * Follow a playlist
 */
export async function followPlaylist(playlistId: string, userId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('playlist_followers')
        .insert({
            playlist_id: playlistId,
            user_id: userId
        })
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * Unfollow a playlist
 */
export async function unfollowPlaylist(playlistId: string, userId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('playlist_followers')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('user_id', userId)

    if (error) throw error
}

/**
 * Get a single playlist with books
 */
export async function getPlaylist(id: string, userId?: string): Promise<PlaylistWithBooks | null> {
    const supabase = createClient()

    const { data: playlist, error } = await supabase
        .from('book_playlists')
        .select(`
      *,
      books:playlist_books(
        id,
        book_id,
        position,
        note,
        added_at,
        book:books(id, title, author, cover_url, slug)
      ),
      creator:profiles!user_id(id, username, full_name, avatar_url)
    `)
        .eq('id', id)
        .single()

    if (error) throw error
    if (!playlist) return null

    // Check if user is following
    if (userId) {
        const { data: following } = await supabase
            .from('playlist_followers')
            .select('id')
            .eq('playlist_id', id)
            .eq('user_id', userId)
            .single()

        playlist.is_following = !!following
    }

    // Sort books by position
    if (playlist.books) {
        playlist.books.sort((a, b) => a.position - b.position)
    }

    return playlist as PlaylistWithBooks
}

/**
 * Get user's playlists
 */
export async function getUserPlaylists(userId: string): Promise<PlaylistWithBooks[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('book_playlists')
        .select(`
      *,
      books:playlist_books(
        id,
        book_id,
        position,
        note,
        added_at,
        book:books(id, title, author, cover_url, slug)
      ),
      creator:profiles!user_id(id, username, full_name, avatar_url)
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as PlaylistWithBooks[]
}

/**
 * Get playlists user is following
 */
export async function getFollowedPlaylists(userId: string): Promise<PlaylistWithBooks[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('playlist_followers')
        .select(`
      playlist:book_playlists(
        *,
        books:playlist_books(
          id,
          book_id,
          position,
          note,
          added_at,
          book:books(id, title, author, cover_url, slug)
        ),
        creator:profiles!user_id(id, username, full_name, avatar_url)
      )
    `)
        .eq('user_id', userId)

    if (error) throw error

    return (data?.map(d => ({
        ...d.playlist,
        is_following: true
    })) || []) as PlaylistWithBooks[]
}

/**
 * Get public playlists (discover)
 */
export async function getPublicPlaylists(limit = 50, userId?: string): Promise<PlaylistWithBooks[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('book_playlists')
        .select(`
      *,
      books:playlist_books(
        id,
        book_id,
        position,
        note,
        added_at,
        book:books(id, title, author, cover_url, slug)
      ),
      creator:profiles!user_id(id, username, full_name, avatar_url)
    `)
        .eq('is_public', true)
        .order('follower_count', { ascending: false })
        .limit(limit)

    if (error) throw error

    const playlists = (data || []) as PlaylistWithBooks[]

    // Check which ones user is following
    if (userId) {
        const { data: following } = await supabase
            .from('playlist_followers')
            .select('playlist_id')
            .eq('user_id', userId)

        const followingIds = new Set(following?.map(f => f.playlist_id) || [])
        playlists.forEach(p => {
            p.is_following = followingIds.has(p.id)
        })
    }

    return playlists
}

/**
 * Search public playlists
 */
export async function searchPlaylists(query: string, limit = 20): Promise<PlaylistWithBooks[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('book_playlists')
        .select(`
      *,
      books:playlist_books(
        id,
        book_id,
        position,
        note,
        added_at,
        book:books(id, title, author, cover_url, slug)
      ),
      creator:profiles!user_id(id, username, full_name, avatar_url)
    `)
        .eq('is_public', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(limit)

    if (error) throw error
    return (data || []) as PlaylistWithBooks[]
}

/**
 * Increment playlist view count
 */
export async function incrementPlaylistViews(playlistId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('book_playlists')
        .update({ view_count: supabase.rpc('increment', { x: 1 }) as any })
        .eq('id', playlistId)

    if (error) console.error('Failed to increment views:', error)
}
