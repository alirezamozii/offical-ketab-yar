'use client'

import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface AuthCardHeaderProps {
  icon: LucideIcon
  title: string
  description: React.ReactNode
}

export function AuthCardHeader({ icon: Icon, title, description }: AuthCardHeaderProps) {
  return (
    <CardHeader className="space-y-2 text-center pb-4">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mx-auto mb-1 flex size-14 md:size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 shadow-xl shadow-gold-500/30"
      >
        <Icon className="size-7 md:size-8 text-white" />
      </motion.div>
      <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
        {title}
      </CardTitle>
      <CardDescription className="text-sm md:text-base text-muted-foreground">
        {description}
      </CardDescription>
    </CardHeader>
  )
}
