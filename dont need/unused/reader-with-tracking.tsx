'use client'

import { incrementBookView } from '@/lib/actions/book-tracking'
import { useEffect } from 'react'
import { ProfessionalReader } from './professional-reader'

interface ReaderWithTrackingProps {
    book: {
        id?: string
        _id?: string
        content: string[]
        title: string
        slug: string
    }
}

export function ReaderWithTracking({ book }: ReaderWithTrackingProps) {
    useEffect(() => {
        // Track view when reader opens
        async function trackView() {
            try {
                const bookId = book.id || book._id
                if (bookId) {
                    await incrementBookView(bookId)
                }
            } catch (error) {
                console.error('Error tracking book view:', error)
            }
        }

        trackView()
    }, [book.id, book._id])

    return <ProfessionalReader book={book} />
}
