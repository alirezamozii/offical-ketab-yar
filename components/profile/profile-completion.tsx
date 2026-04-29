'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { Circle } from 'lucide-react'
import Link from 'next/link'

interface ProfileCompletionProps {
    percentage: number
    profile: {
        username?: string
        full_name?: string
        avatar_url?: string
        bio?: string
        website?: string
        level?: string
    }
}

function ProfileCompletion({ percentage, profile }: ProfileCompletionProps) {
    const tasks = [
        { label: 'نام کاربری', completed: !!profile.username },
        { label: 'نام کامل', completed: !!profile.full_name },
        { label: 'تصویر پروفایل', completed: !!profile.avatar_url },
        { label: 'بیوگرافی', completed: !!profile.bio },
        { label: 'وبسایت', completed: !!profile.website },
        { label: 'سطح زبان', completed: !!profile.level },
    ]

    const incompleteTasks = tasks.filter(t => !t.completed)

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <Card className="border-gold/20 bg-gold/5">
                <CardContent className="p-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">تکمیل پروفایل</p>
                            <span className="text-sm font-bold text-gold">{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <div className="space-y-1">
                            {incompleteTasks.slice(0, 3).map((task, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Circle className="size-3" />
                                    <span>{task.label}</span>
                                </div>
                            ))}
                        </div>
                        <Button asChild size="sm" variant="outline" className="w-full">
                            <Link href="/profile?tab=settings">
                                تکمیل پروفایل
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
