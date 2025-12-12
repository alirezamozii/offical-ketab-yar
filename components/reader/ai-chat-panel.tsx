"use client"

import { Button } from '@/components/ui/button'
import { ChatMessage, useAIChat } from '@/hooks/use-ai-chat'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Maximize2, Minimize2, Send, Sparkles, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface AIChatPanelProps {
    bookTitle: string
    bookAuthor?: string
    currentPage: number
    currentPageText: string
    previousPages?: string[]
    selectedText?: string
    theme?: 'light' | 'sepia' | 'dark'
    onClose: () => void
    isMobile?: boolean
}

export function AIChatPanel({
    bookTitle,
    bookAuthor,
    currentPage,
    currentPageText,
    previousPages,
    selectedText,
    theme = 'sepia',
    onClose,
    isMobile = false
}: AIChatPanelProps) {
    const [input, setInput] = useState('')
    const [isFullscreen, setIsFullscreen] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const { messages, isLoading, sendMessage, clearChat } = useAIChat({
        bookContext: {
            title: bookTitle,
            author: bookAuthor,
            currentPage,
            currentPageText,
            previousPages,
            selectedText
        }
    })

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isLoading])

    // Auto-focus input on mount
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100)
    }, [])

    const handleSend = () => {
        if (input.trim() && !isLoading) {
            sendMessage(input)
            setInput('')
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const quickActions = [
        { label: 'توضیح بده', prompt: 'این بخش رو توضیح بده' },
        { label: 'خلاصه کن', prompt: 'این صفحه رو خلاصه کن' },
        { label: 'ترجمه کن', prompt: 'این متن رو ترجمه کن' },
    ]

    // Mobile: Bottom sheet
    if (isMobile) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className={cn(
                        "fixed inset-x-0 bottom-0 z-[200] flex flex-col rounded-t-3xl shadow-2xl border-t-2",
                        theme === 'light' && "bg-gradient-to-br from-gold-50 to-amber-50 border-gold-200",
                        theme === 'sepia' && "bg-gradient-to-br from-amber-100 to-amber-50 border-amber-300",
                        theme === 'dark' && "bg-gradient-to-br from-[#0f0e0c] to-[#1a1612] border-gold-700"
                    )}
                    style={{ height: isFullscreen ? '90vh' : '75vh', maxHeight: '90vh' }}
                >
                    {/* Handle bar */}
                    <div className="flex items-center justify-center py-3">
                        <div className={cn(
                            "w-12 h-1.5 rounded-full",
                            theme === 'dark' ? 'bg-gold-700' : 'bg-gold-300'
                        )} />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 pb-3 border-b">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-gold-600" />
                            <h2 className="text-lg font-bold">دستیار هوشمند</h2>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsFullscreen(!isFullscreen)}
                            >
                                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </Button>
                            {messages.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={clearChat}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={onClose}>
                                <ChevronDown className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                        {messages.length === 0 && !selectedText && (
                            <WelcomeScreen
                                bookTitle={bookTitle}
                                currentPage={currentPage}
                                quickActions={quickActions}
                                onQuickAction={(prompt) => {
                                    setInput(prompt)
                                    inputRef.current?.focus()
                                }}
                            />
                        )}

                        {selectedText && messages.length === 0 && (
                            <SelectedTextCard text={selectedText} theme={theme} />
                        )}

                        {messages.map((message) => (
                            <MessageBubble key={message.id} message={message} theme={theme} />
                        ))}

                        {isLoading && <ThinkingAnimation theme={theme} />}
                    </div>

                    {/* Input */}
                    <div className={cn(
                        "p-4 border-t",
                        theme === 'dark' ? 'border-gold-700' : 'border-gold-200'
                    )}>
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="سوال بپرسید..."
                                disabled={isLoading}
                                className={cn(
                                    "flex-1 px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all",
                                    theme === 'dark'
                                        ? "border-gold-700 bg-[#1a1612] text-[#e8e6e3]"
                                        : "border-gold-300 bg-white",
                                    isLoading && "opacity-50 cursor-not-allowed"
                                )}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                size="lg"
                                className="bg-gold-600 hover:bg-gold-700 text-white rounded-xl px-6"
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        )
    }

    // Desktop: Side panel (from LEFT side)
    return (
        <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
                "fixed inset-y-0 left-0 w-96 md:w-[450px] border-r-2 shadow-2xl z-[200] flex flex-col",
                theme === 'light' && "bg-gradient-to-br from-gold-50 to-amber-50 border-gold-200",
                theme === 'sepia' && "bg-gradient-to-br from-amber-100 to-amber-50 border-amber-300",
                theme === 'dark' && "bg-gradient-to-br from-[#0f0e0c] to-[#1a1612] border-gold-700"
            )}
        >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-gold-600" />
                    <h2 className="text-xl font-bold">دستیار هوشمند</h2>
                </div>
                <div className="flex items-center gap-1">
                    {messages.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearChat}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !selectedText && (
                    <WelcomeScreen
                        bookTitle={bookTitle}
                        currentPage={currentPage}
                        quickActions={quickActions}
                        onQuickAction={(prompt) => {
                            setInput(prompt)
                            inputRef.current?.focus()
                        }}
                    />
                )}

                {selectedText && messages.length === 0 && (
                    <SelectedTextCard text={selectedText} theme={theme} />
                )}

                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} theme={theme} />
                ))}

                {isLoading && <ThinkingAnimation theme={theme} />}
            </div>

            {/* Input */}
            <div className={cn(
                "p-4 border-t",
                theme === 'dark' ? 'border-gold-700' : 'border-gold-200'
            )}>
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="سوال بپرسید..."
                        disabled={isLoading}
                        className={cn(
                            "flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all",
                            theme === 'dark'
                                ? "border-gold-700 bg-[#1a1612] text-[#e8e6e3]"
                                : "border-gold-300 bg-white",
                            isLoading && "opacity-50 cursor-not-allowed"
                        )}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        size="lg"
                        className="bg-gold-600 hover:bg-gold-700 text-white"
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </motion.div>
    )
}

// Sub-components
function WelcomeScreen({
    bookTitle,
    currentPage,
    quickActions,
    onQuickAction
}: {
    bookTitle: string
    currentPage: number
    quickActions: Array<{ label: string; prompt: string }>
    onQuickAction: (prompt: string) => void
}) {
    return (
        <div className="text-center py-8 space-y-6">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
            >
                <Sparkles className="h-16 w-16 mx-auto text-gold-600 mb-4" />
            </motion.div>
            <div>
                <h3 className="text-lg font-bold mb-2">سلام! 👋</h3>
                <p className="text-sm text-muted-foreground">
                    من دستیار هوشمند کتاب <span className="font-semibold">{bookTitle}</span> هستم
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    صفحه {currentPage}
                </p>
            </div>

            <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">اقدامات سریع:</p>
                {quickActions.map((action, i) => (
                    <motion.button
                        key={action.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        onClick={() => onQuickAction(action.prompt)}
                        className="w-full px-4 py-2 text-sm rounded-lg border-2 border-gold-300 hover:bg-gold-100 dark:hover:bg-gold-900/30 transition-all"
                    >
                        {action.label}
                    </motion.button>
                ))}
            </div>
        </div>
    )
}

function SelectedTextCard({ text, theme }: { text: string; theme: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "p-3 rounded-lg border-2",
                theme === 'dark' ? 'bg-gold-900/20 border-gold-700' : 'bg-gold-100 border-gold-300'
            )}
        >
            <p className="text-xs font-medium mb-1 text-gold-600">متن انتخابی:</p>
            <p className="text-sm">{text}</p>
        </motion.div>
    )
}

function MessageBubble({ message, theme }: { message: ChatMessage; theme: string }) {
    const isUser = message.role === 'user'

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex", isUser ? "justify-end" : "justify-start")}
        >
            <div
                className={cn(
                    "max-w-[85%] px-4 py-3 rounded-2xl",
                    isUser
                        ? "bg-gold-600 text-white rounded-br-sm"
                        : theme === 'dark'
                            ? "bg-[#1a1612] border-2 border-gold-700 rounded-bl-sm"
                            : "bg-white border-2 border-gold-300 rounded-bl-sm"
                )}
            >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
            </div>
        </motion.div>
    )
}

function ThinkingAnimation({ theme }: { theme: string }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
        >
            <div
                className={cn(
                    "px-6 py-4 rounded-2xl rounded-bl-sm flex items-center gap-1",
                    theme === 'dark'
                        ? "bg-[#1a1612] border-2 border-gold-700"
                        : "bg-white border-2 border-gold-300"
                )}
            >
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 bg-gold-600 rounded-full"
                        animate={{
                            y: [0, -8, 0],
                        }}
                        transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>
        </motion.div>
    )
}
