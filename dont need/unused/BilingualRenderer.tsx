'use client'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/stores/useLanguageStore'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { TextSelectionMenu } from './text-selection-menu'

interface BilingualRendererProps {
    paragraph: {
        _type: 'bilingualParagraph'
        _key: string
        english: PortableTextBlock[]
        farsi: PortableTextBlock[]
        alignment?: 'left' | 'center' | 'right' | 'justify'
        pageBreakAfter?: boolean
    }
    index: number
    bookId?: string
    onVisible?: (index: number) => void
}

export function BilingualRenderer({ paragraph, index, bookId, onVisible }: BilingualRendererProps) {
    const { mode } = useLanguageStore()
    const paragraphRef = useRef<HTMLDivElement>(null)
    const hasBeenVisibleRef = useRef(false)
    const [selectionMenu, setSelectionMenu] = useState<{
        show: boolean
        position: { x: number; y: number }
        text: string
    }>({ show: false, position: { x: 0, y: 0 }, text: '' })

    const supabase = createClient()

    // Track when paragraph becomes visible (for gamification)
    useEffect(() => {
        if (!paragraphRef.current || hasBeenVisibleRef.current) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasBeenVisibleRef.current) {
                        hasBeenVisibleRef.current = true
                        onVisible?.(index)
                    }
                })
            },
            { threshold: 0.5 } // Trigger when 50% visible
        )

        observer.observe(paragraphRef.current)

        return () => observer.disconnect()
    }, [index, onVisible])

    // Handle text selection (Agent 3 - Psychology: Smart vocabulary building)
    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection()
            const selectedText = selection?.toString().trim()

            if (!selectedText || selectedText.length === 0) {
                setSelectionMenu({ show: false, position: { x: 0, y: 0 }, text: '' })
                return
            }

            // Check if multiple words selected
            const words = selectedText.split(/\s+/)
            const isMultipleWords = words.length > 1

            // Smart word completion: Expand partial word selection to full word
            let completeWord = selectedText

            if (!isMultipleWords) {
                // Get the full text content
                const fullText = paragraphRef.current?.innerText || ''
                const selectionStart = fullText.indexOf(selectedText)

                if (selectionStart !== -1) {
                    // Find word boundaries
                    let wordStart = selectionStart
                    let wordEnd = selectionStart + selectedText.length

                    // Expand backwards to word start
                    while (wordStart > 0 && /[\w\u0600-\u06FF]/.test(fullText[wordStart - 1])) {
                        wordStart--
                    }

                    // Expand forwards to word end
                    while (wordEnd < fullText.length && /[\w\u0600-\u06FF]/.test(fullText[wordEnd])) {
                        wordEnd++
                    }

                    completeWord = fullText.slice(wordStart, wordEnd).trim()
                }

                // Remove punctuation from start and end
                completeWord = completeWord.replace(/^[^\w\u0600-\u06FF]+|[^\w\u0600-\u06FF]+$/g, '')
            }

            // Only show menu if it's a valid single word (2-50 chars, no spaces)
            const isValidWord = !isMultipleWords &&
                completeWord.length >= 2 &&
                completeWord.length <= 50 &&
                !/\s/.test(completeWord)

            if (isValidWord) {
                const range = selection?.getRangeAt(0)
                const rect = range?.getBoundingClientRect()

                if (rect) {
                    setSelectionMenu({
                        show: true,
                        position: {
                            x: rect.left + rect.width / 2,
                            y: rect.top - 10,
                        },
                        text: completeWord,
                    })
                }
            } else {
                // For multiple words or invalid selections, show menu WITHOUT vocabulary button
                if (isMultipleWords) {
                    const range = selection?.getRangeAt(0)
                    const rect = range?.getBoundingClientRect()

                    if (rect) {
                        setSelectionMenu({
                            show: true,
                            position: {
                                x: rect.left + rect.width / 2,
                                y: rect.top - 10,
                            },
                            text: '', // Empty text = hide vocabulary button
                        })
                    }
                } else {
                    setSelectionMenu({ show: false, position: { x: 0, y: 0 }, text: '' })
                }
            }
        }

        document.addEventListener('mouseup', handleSelection)
        document.addEventListener('touchend', handleSelection)

        return () => {
            document.removeEventListener('mouseup', handleSelection)
            document.removeEventListener('touchend', handleSelection)
        }
    }, [])

    // Add to vocabulary (Agent 2 - Performance: Optimized Supabase insert)
    const handleAddToVocabulary = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error('🔒 برای ذخیره کلمه باید وارد شوید', {
                    style: {
                        background: '#FEF3C7',
                        color: '#92400E',
                        border: '2px solid #D4AF37',
                        fontFamily: 'Vazirmatn, sans-serif',
                        direction: 'rtl',
                    },
                })
                return
            }

            // Get context (current paragraph text)
            const context = paragraphRef.current?.innerText.slice(0, 200) || ''

            const { error } = await supabase
                .from('user_words')
                .insert({
                    user_id: user.id,
                    word: selectionMenu.text,
                    context,
                    book_id: bookId,
                })

            if (error) {
                if (error.code === '23505') {
                    toast('📚 این کلمه قبلاً در واژگان شماست', {
                        style: {
                            background: '#DBEAFE',
                            color: '#1E40AF',
                            border: '2px solid #3B82F6',
                            fontFamily: 'Vazirmatn, sans-serif',
                            direction: 'rtl',
                        },
                    })
                } else {
                    throw error
                }
            } else {
                toast(`✨ "${selectionMenu.text}" به واژگان اضافه شد`, {
                    style: {
                        background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                        color: '#92400E',
                        border: '2px solid #D4AF37',
                        fontFamily: 'Vazirmatn, sans-serif',
                        fontWeight: '600',
                        direction: 'rtl',
                        boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
                    },
                })
            }
        } catch (error) {
            console.error('Error adding to vocabulary:', error)
            toast.error('❌ خطا در ذخیره کلمه', {
                style: {
                    background: '#FEE2E2',
                    color: '#991B1B',
                    border: '2px solid #EF4444',
                    fontFamily: 'Vazirmatn, sans-serif',
                    direction: 'rtl',
                },
            })
        } finally {
            setSelectionMenu({ show: false, position: { x: 0, y: 0 }, text: '' })
        }
    }

    const handleHighlight = (color: string) => {
        // TODO: Implement highlight functionality
        const colorEmoji = color === 'yellow' ? '💛' : color === 'orange' ? '🧡' : '✨'
        toast(`${colorEmoji} هایلایت ${color} (به زودی)`, {
            style: {
                background: '#F3F4F6',
                color: '#374151',
                border: '2px solid #D1D5DB',
                fontFamily: 'Vazirmatn, sans-serif',
                direction: 'rtl',
            },
        })
        setSelectionMenu({ show: false, position: { x: 0, y: 0 }, text: '' })
    }

    const handleAIChat = () => {
        // TODO: Open AI chat with selected text
        toast('🤖 چت با AI (به زودی)', {
            style: {
                background: 'linear-gradient(135deg, #E9D5FF 0%, #DDD6FE 100%)',
                color: '#6B21A8',
                border: '2px solid #A855F7',
                fontFamily: 'Vazirmatn, sans-serif',
                direction: 'rtl',
            },
        })
        setSelectionMenu({ show: false, position: { x: 0, y: 0 }, text: '' })
    }

    // Get alignment class
    const alignmentClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
        justify: 'text-justify',
    }[paragraph.alignment || 'justify']

    // Portable Text components for rich formatting
    const portableTextComponents: PortableTextComponents = {
        block: {
            // Normal paragraph
            normal: ({ children }) => (
                <p className={cn('mb-4 leading-relaxed', alignmentClass)}>{children}</p>
            ),
            // Headings
            h1: ({ children }) => (
                <h1 className={cn('text-4xl font-bold mb-6 mt-8', alignmentClass)}>{children}</h1>
            ),
            h2: ({ children }) => (
                <h2 className={cn('text-3xl font-bold mb-5 mt-7', alignmentClass)}>{children}</h2>
            ),
            h3: ({ children }) => (
                <h3 className={cn('text-2xl font-bold mb-4 mt-6', alignmentClass)}>{children}</h3>
            ),
            // Blockquote
            blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gold-500 pl-4 italic my-6 text-muted-foreground">
                    {children}
                </blockquote>
            ),
        },
        list: {
            bullet: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
            number: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
        },
        listItem: {
            bullet: ({ children }) => <li className="ml-4">{children}</li>,
            number: ({ children }) => <li className="ml-4">{children}</li>,
        },
        marks: {
            // Text decorations
            strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            underline: ({ children }) => <span className="underline">{children}</span>,
            'strike-through': ({ children }) => <span className="line-through">{children}</span>,
            // Links
            link: ({ children, value }) => {
                const target = value?.blank ? '_blank' : undefined
                return (
                    <a
                        href={value?.href}
                        target={target}
                        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
                        className="text-gold-600 hover:text-gold-700 underline transition-colors"
                    >
                        {children}
                    </a>
                )
            },
        },
    }

    return (
        <>
            {/* Text Selection Menu (Agent 3 - Psychology) */}
            <AnimatePresence>
                {selectionMenu.show && (
                    <TextSelectionMenu
                        position={selectionMenu.position}
                        theme="light"
                        onHighlight={handleHighlight}
                        onAddToVocabulary={selectionMenu.text ? handleAddToVocabulary : undefined}
                        onAIChat={handleAIChat}
                        onClose={() => setSelectionMenu({ show: false, position: { x: 0, y: 0 }, text: '' })}
                    />
                )}
            </AnimatePresence>

            <motion.div
                ref={paragraphRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                className={cn('paragraph-container mb-6', paragraph.pageBreakAfter && 'page-break-after')}
            >
                {/* English Only */}
                {mode === 'EN' && (
                    <div dir="ltr" className="text-base md:text-lg">
                        <PortableText value={paragraph.english} components={portableTextComponents} />
                    </div>
                )}

                {/* Persian Only */}
                {mode === 'FA' && (
                    <div dir="rtl" className="text-base md:text-lg font-vazirmatn">
                        <PortableText value={paragraph.farsi} components={portableTextComponents} />
                    </div>
                )}

                {/* English Primary + Persian Secondary */}
                {mode === 'EN_FA' && (
                    <div className="space-y-3">
                        {/* English - Large */}
                        <div dir="ltr" className="text-base md:text-lg">
                            <PortableText value={paragraph.english} components={portableTextComponents} />
                        </div>
                        {/* Persian - Small */}
                        <div dir="rtl" className="text-sm text-muted-foreground font-vazirmatn border-r-2 border-gold-500/30 pr-4">
                            <PortableText value={paragraph.farsi} components={portableTextComponents} />
                        </div>
                    </div>
                )}

                {/* Persian Primary + English Secondary */}
                {mode === 'FA_EN' && (
                    <div className="space-y-3">
                        {/* Persian - Large */}
                        <div dir="rtl" className="text-base md:text-lg font-vazirmatn">
                            <PortableText value={paragraph.farsi} components={portableTextComponents} />
                        </div>
                        {/* English - Small */}
                        <div dir="ltr" className="text-sm text-muted-foreground border-l-2 border-gold-500/30 pl-4">
                            <PortableText value={paragraph.english} components={portableTextComponents} />
                        </div>
                    </div>
                )}
            </motion.div>
        </>
    )
}
