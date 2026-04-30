'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Mail, MessageCircle, Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function SupportClient() {
    const [message, setMessage] = useState('')
    const [email, setEmail] = useState('')
    const [subject, setSubject] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (message.length < 20) {
            toast.error('لطفاً پیام خود را با جزئیات بیشتری بنویسید (حداقل 20 کاراکتر)')
            return
        }

        setIsSubmitting(true)

        try {
            // TODO: ارسال به Supabase
            // const { error } = await supabase.from('support_messages').insert({
            //   email,
            //   subject,
            //   message,
            //   created_at: new Date( as any).toISOString()
            // })
            // if (error) throw error

            await new Promise(resolve => setTimeout(resolve, 1500))

            toast.success('پیام شما با موفقیت ارسال شد! معمولاً ظرف 2-4 ساعت پاسخ می‌دهیم.', {
                duration: 5000,
            })
            setMessage('')
            setSubject('')
        } catch (error) {
            toast.error('خطا در ارسال پیام. لطفاً دوباره تلاش کنید.')
            console.error('Support form error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background py-20">
            <div className="container mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gold-600 to-gold-400 mb-6">
                        <MessageCircle className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 bg-clip-text text-transparent">
                        پشتیبانی کتاب‌یار
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        ما اینجا هستیم تا به شما کمک کنیم. پیام خود را ارسال کنید و در اسرع وقت پاسخ خواهیم داد.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2"
                    >
                        <Card className="p-8">
                            <h2 className="text-2xl font-bold mb-6">ارسال پیام</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <Label htmlFor="email">ایمیل</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        required
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="subject">موضوع</Label>
                                    <Input
                                        id="subject"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="موضوع پیام خود را وارد کنید"
                                        required
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label htmlFor="message">پیام</Label>
                                        <span className="text-xs text-muted-foreground">
                                            {message.length} / 1000 کاراکتر
                                        </span>
                                    </div>
                                    <Textarea
                                        id="message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="پیام خود را اینجا بنویسید..."
                                        required
                                        maxLength={1000}
                                        rows={8}
                                        className="mt-2"
                                    />
                                    {message.length < 20 && message.length > 0 && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            لطفاً پیام خود را با جزئیات بیشتری بنویسید (حداقل 20 کاراکتر)
                                        </p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400"
                                    size="lg"
                                >
                                    {isSubmitting ? (
                                        'در حال ارسال...'
                                    ) : (
                                        <>
                                            <Send className="ml-2 h-4 w-4" />
                                            ارسال پیام
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Card>
                    </motion.div>

                    {/* Info Cards */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-6"
                    >
                        <Card className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                                    <Clock className="h-6 w-6 text-gold-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold mb-2">زمان پاسخگویی</h3>
                                    <p className="text-sm text-muted-foreground">
                                        معمولاً ظرف 2-4 ساعت پاسخ می‌دهیم
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold mb-2">پشتیبانی 24/7</h3>
                                    <p className="text-sm text-muted-foreground">
                                        تیم ما همیشه آماده کمک به شماست
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <Mail className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold mb-2">ایمیل مستقیم</h3>
                                    <p className="text-sm text-muted-foreground">
                                        support@ketabyar.com
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
