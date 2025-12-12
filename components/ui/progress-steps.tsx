'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface Step {
    number: number
    title: string
    description?: string
}

interface ProgressStepsProps {
    steps: Step[]
    currentStep: number
    className?: string
}

export function ProgressSteps({ steps, currentStep, className }: ProgressStepsProps) {
    return (
        <div className={cn('w-full', className)}>
            {/* Progress Bar */}
            <div className="relative">
                {/* Background Line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />

                {/* Active Progress Line */}
                <motion.div
                    className="absolute top-5 left-0 h-0.5 bg-gold"
                    initial={{ width: '0%' }}
                    animate={{
                        width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                    }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                />

                {/* Steps */}
                <div className="relative flex justify-between">
                    {steps.map((step) => {
                        const isCompleted = currentStep > step.number
                        const isCurrent = currentStep === step.number
                        const isUpcoming = currentStep < step.number

                        return (
                            <div key={step.number} className="flex flex-col items-center">
                                {/* Step Circle */}
                                <motion.div
                                    className={cn(
                                        'relative z-10 flex size-10 items-center justify-center rounded-full border-2 bg-background transition-colors',
                                        {
                                            'border-gold bg-gold text-white': isCompleted,
                                            'border-gold bg-background text-gold': isCurrent,
                                            'border-muted bg-background text-muted-foreground': isUpcoming,
                                        }
                                    )}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: step.number * 0.1 }}
                                >
                                    {isCompleted ? (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 200 }}
                                        >
                                            <Check className="size-5" />
                                        </motion.div>
                                    ) : (
                                        <span className="text-sm font-semibold">{step.number}</span>
                                    )}
                                </motion.div>

                                {/* Step Label */}
                                <div className="mt-2 text-center">
                                    <p
                                        className={cn('text-sm font-medium', {
                                            'text-gold': isCurrent,
                                            'text-foreground': isCompleted,
                                            'text-muted-foreground': isUpcoming,
                                        })}
                                    >
                                        {step.title}
                                    </p>
                                    {step.description && (
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {step.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
