/**
 * UI Enhancement Utilities for Light Mode
 * Provides better contrast, spacing, and visual hierarchy
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Enhanced card classes for better light mode visibility
 */
export const cardVariants = {
    default: cn(
        'bg-white border-2 border-gray-200',
        'shadow-sm hover:shadow-md',
        'transition-all duration-200',
        'dark:bg-card dark:border-border'
    ),
    elevated: cn(
        'bg-white border-2 border-gray-200',
        'shadow-md hover:shadow-lg',
        'transition-all duration-200',
        'dark:bg-card dark:border-border'
    ),
    interactive: cn(
        'bg-white border-2 border-gray-200',
        'shadow-sm hover:shadow-lg hover:border-[#D4AF37]/40',
        'hover:-translate-y-1',
        'transition-all duration-250',
        'cursor-pointer',
        'dark:bg-card dark:border-border dark:hover:border-primary/40'
    ),
}

/**
 * Enhanced button classes for better contrast
 */
export const buttonVariants = {
    primary: cn(
        'bg-gradient-to-r from-[#D4AF37] to-[#C9A961]',
        'text-white font-semibold',
        'border-2 border-[#D4AF37]',
        'shadow-md hover:shadow-lg',
        'hover:from-[#C9A961] hover:to-[#B8956A]',
        'hover:-translate-y-0.5',
        'active:translate-y-0',
        'transition-all duration-200'
    ),
    secondary: cn(
        'bg-white text-gray-900 font-semibold',
        'border-2 border-gray-300',
        'shadow-sm hover:shadow-md',
        'hover:border-[#D4AF37]/50 hover:bg-gray-50',
        'hover:-translate-y-0.5',
        'active:translate-y-0',
        'transition-all duration-200',
        'dark:bg-secondary dark:text-secondary-foreground dark:border-border'
    ),
    outline: cn(
        'bg-transparent text-gray-900 font-semibold',
        'border-2 border-gray-300',
        'hover:bg-gray-100 hover:border-gray-400',
        'hover:-translate-y-0.5',
        'active:translate-y-0',
        'transition-all duration-200',
        'dark:text-foreground dark:border-border dark:hover:bg-accent'
    ),
    ghost: cn(
        'bg-transparent text-gray-700 font-medium',
        'hover:bg-gray-100 hover:text-gray-900',
        'transition-all duration-200',
        'dark:text-foreground dark:hover:bg-accent'
    ),
}

/**
 * Enhanced badge classes for better visibility
 */
export const badgeVariants = {
    default: cn(
        'bg-gray-100 text-gray-800 font-semibold',
        'border border-gray-300',
        'px-3 py-1 rounded-full text-sm',
        'dark:bg-secondary dark:text-secondary-foreground dark:border-border'
    ),
    primary: cn(
        'bg-[#D4AF37]/10 text-[#B8956A] font-semibold',
        'border border-[#D4AF37]/30',
        'px-3 py-1 rounded-full text-sm',
        'dark:bg-primary/10 dark:text-primary dark:border-primary/30'
    ),
    success: cn(
        'bg-green-50 text-green-700 font-semibold',
        'border border-green-200',
        'px-3 py-1 rounded-full text-sm',
        'dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
    ),
}

/**
 * Enhanced section spacing for better visual separation
 */
export const sectionVariants = {
    default: cn('py-8 md:py-12'),
    compact: cn('py-6 md:py-8'),
    spacious: cn('py-12 md:py-16 lg:py-20'),
    separated: cn(
        'py-8 md:py-12',
        'border-b-2 border-gray-200',
        'last:border-b-0',
        'dark:border-border'
    ),
}

/**
 * Enhanced text contrast classes
 */
export const textVariants = {
    heading: cn(
        'text-gray-900 font-bold',
        'dark:text-foreground'
    ),
    body: cn(
        'text-gray-700 leading-relaxed',
        'dark:text-foreground'
    ),
    muted: cn(
        'text-gray-500',
        'dark:text-muted-foreground'
    ),
    accent: cn(
        'text-[#B8956A] font-semibold',
        'dark:text-primary'
    ),
}

/**
 * Enhanced hover states for interactive elements
 */
export const hoverVariants = {
    lift: cn(
        'transition-all duration-200',
        'hover:-translate-y-1 hover:shadow-lg'
    ),
    scale: cn(
        'transition-all duration-200',
        'hover:scale-105'
    ),
    glow: cn(
        'transition-all duration-200',
        'hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]'
    ),
    subtle: cn(
        'transition-all duration-200',
        'hover:bg-gray-50',
        'dark:hover:bg-accent'
    ),
}

/**
 * Grid spacing utilities for better layout
 */
export const gridVariants = {
    tight: cn('gap-4'),
    normal: cn('gap-6 md:gap-8'),
    spacious: cn('gap-8 md:gap-12'),
}

/**
 * Container utilities with better padding
 */
export const containerVariants = {
    default: cn('container mx-auto px-4 md:px-6 lg:px-8'),
    narrow: cn('container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl'),
    wide: cn('container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl'),
}
