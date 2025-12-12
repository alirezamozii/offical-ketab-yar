import { getAllBooks } from '@/lib/sanity.queries'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Sync books from Sanity to Supabase (LEGACY - Not needed with new admin panel)
 * 
 * NOTE: With the new admin panel system, Sanity is the primary database.
 * This route is kept for backward compatibility but may not be needed.
 * 
 * The new system works like this:
 * - Admin Panel → Sanity (primary storage)
 * - Public pages read directly from Sanity
 * - No Supabase books table needed
 */
export async function POST() {
    try {
        const supabase = await createClient()

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Fetch all books from Sanity
        const sanityBooks = await getAllBooks()

        let synced = 0
        let errors = 0

        // Sync each book to Supabase (if you still need this)
        for (const book of sanityBooks) {
            try {
                // Check if book exists
                const { data: existing } = await supabase
                    .from('books')
                    .select('id')
                    .eq('sanity_id', book._id)
                    .single()

                const bookData = {
                    sanity_id: book._id,
                    title: book.title,
                    subtitle: book.titleFa || null, // Use Farsi title as subtitle
                    author: book.author || 'Unknown',
                    author_id: null, // No separate author table in new system
                    description: book.summary || null,
                    slug: book.slug?.current || book.slug,
                    language: 'english', // Default
                    level: book.level || 'intermediate',
                    is_premium: !book.featured, // Featured books are free
                    free_preview_pages: 20, // Default preview pages
                    cover_url: book.coverImage?.asset?.url || null,
                    status: book.status || 'published',
                    publication_year: null, // Not in new schema
                }

                if (existing) {
                    // Update existing book
                    await supabase
                        .from('books')
                        .update(bookData)
                        .eq('id', existing.id)
                } else {
                    // Insert new book
                    await supabase
                        .from('books')
                        .insert(bookData)
                }

                synced++
            } catch (error) {
                console.error(`Failed to sync book ${book._id}:`, error)
                errors++
            }
        }

        return NextResponse.json({
            success: true,
            synced,
            errors,
            total: sanityBooks.length,
            message: 'Note: This sync route is legacy. New system uses Sanity as primary database.',
        })
    } catch (error) {
        console.error('Sync error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
