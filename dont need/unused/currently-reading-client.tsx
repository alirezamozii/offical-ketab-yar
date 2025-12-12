'use client'

import { BookCard } from '@/components/books/book-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'

interface CurrentlyReadingProps {
    userId: string
}

export default function CurrentlyReading({ userId }: CurrentlyReadingProps) {
    const supabase = createClient()

    const { data: currentlyReading, isLoading } = useQuery({
        queryKey: ['currently-reading', userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_library')
                .select(`
          *,
          books (
            id,
            title,
            slug,
            cover_image_url,
            authors (name)
          )
        `)
                .eq('user_id', userId)
                .eq('status', 'reading')
                .order('updated_at', { ascending: false })
                .limit(3)

            if (error) throw error
            return data
        },
        enabled: !!userId,
    })

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="size-5" />
                        در حال خواندن
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-80" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!currentlyReading || currentlyReading.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="size-5" />
                        در حال خواندن
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                        شما در حال حاضر کتابی در حال خواندن ندارید
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="size-5" />
                        در حال خواندن
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {currentlyReading.map((item, index: number) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <BookCard
                                    book={item.books}
                                    progress={item.progress_percentage}
                                    showProgress
                                />
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
