'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import { BookmarkPlus, Check, Loader2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

interface VocabularySelectorProps {
    bookId: string
    pageNumber: number
}

export function VocabularySelector({ bookId, pageNumber }: VocabularySelectorProps) {
    const { user } = useAuth()
    const supabase = createClient()
    const [selectedText, setSelectedText] = useState('')
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
    const [note, setNote] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    // Handle text selection
    const handleSelection = useCallback(() => {
        const selection = window.getSelection()
        const text = selection?.toString().trim()

        if (text && text.length > 0 && text.length < 100) {
            const range = selection?.getRangeAt(0)
            const rect = range?.getBoundingClientRect()

            if (rect) {
                setSelectedText(text)
                setPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10,
                })
                setNote('')
                setSaved(false)
            }
        } else {
            setSelectedText('')
            setPosition(null)
        }
    }, [])

    // Save word to vocabulary
    const saveWord = async () => {
        if (!user || !selectedText) {
            toast.error('Please sign in to save words')
            return
        }

        setSaving(true)

        try {
            // Check vocabulary limit for free users
            const { data: profile } = await supabase
                .from('profiles')
                .select('subscription_tier')
                .eq('id', user.id)
                .single()

            if (profile?.subscription_tier === 'free') {
                const { count } = await supabase
                    .from('vocabulary')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)

                if (count && count >= 20) {
                    toast.error('Free users can save up to 20 words. Upgrade to Premium for unlimited!')
                    setSaving(false)
                    return
                }
            }

            // Get context (surrounding text)
            const selection = window.getSelection()
            const context = selection?.anchorNode?.textContent?.substring(0, 200) || ''

            // Save to database
            await supabase.from('vocabulary').insert({
                user_id: user.id,
                word: selectedText,
                meaning: '', // Will be filled by user later
                definition: '', // Can be fetched from dictionary API
                context: context,
                book_id: bookId,
                page_number: pageNumber,
                level: 'learning',
                status: 'active',
                next_review_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            })

            setSaved(true)
            toast.success('Word saved to your vocabulary!')

            // Clear selection after 2 seconds
            setTimeout(() => {
                setSelectedText('')
                setPosition(null)
                setSaved(false)
            }, 2000)
        } catch (error) {
            console.error('Failed to save word:', error)
            toast.error('Failed to save word')
        } finally {
            setSaving(false)
        }
    }

    // Close popup
    const close = () => {
        setSelectedText('')
        setPosition(null)
        setNote('')
        setSaved(false)
    }

    return (
        <>
            {/* Invisible overlay to capture selection */}
            <div
                onMouseUp={handleSelection}
                onTouchEnd={handleSelection}
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 1 }}
            />

            {/* Vocabulary popup */}
            <AnimatePresence>
                {selectedText && position && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed',
                            left: position.x,
                            top: position.y,
                            transform: 'translate(-50%, -100%)',
                            zIndex: 50,
                        }}
                    >
                        <Card className="w-64 shadow-lg border-2 border-gold-500/30">
                            <CardContent className="p-4 space-y-3">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Selected word:</p>
                                    <p className="font-semibold text-lg">{selectedText}</p>
                                </div>

                                {!saved ? (
                                    <>
                                        <Textarea
                                            placeholder="Add a note (optional)..."
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            className="min-h-[60px] text-sm"
                                        />

                                        <div className="flex gap-2">
                                            <Button
                                                onClick={saveWord}
                                                disabled={saving}
                                                className="flex-1"
                                                variant="bronze"
                                                size="sm"
                                            >
                                                {saving ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <BookmarkPlus className="h-4 w-4 mr-2" />
                                                        Save Word
                                                    </>
                                                )}
                                            </Button>
                                            <Button onClick={close} variant="outline" size="sm">
                                                Cancel
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 text-green-600 py-2">
                                        <Check className="h-5 w-5" />
                                        <span className="font-semibold">Saved!</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
