'use client'

/**
 * ZarinPal Checkout Button
 * Agent 4: Initiate payment with ZarinPal
 */

import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ZarinPalCheckoutButtonProps {
    planType: 'monthly' | 'quarterly' | 'annual'
    children: React.ReactNode
    className?: string
}

export function ZarinPalCheckoutButton({
    planType,
    children,
    className
}: ZarinPalCheckoutButtonProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleCheckout = async () => {
        setIsLoading(true)

        try {
            const response = await fetch('/api/zarinpal/create-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ planType }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'خطا در ایجاد درخواست پرداخت')
            }

            if (data.paymentUrl) {
                // Redirect to ZarinPal payment page
                window.location.href = data.paymentUrl
            } else {
                throw new Error('آدرس پرداخت دریافت نشد')
            }
        } catch (error) {
            console.error('Checkout error:', error)
            toast.error(error instanceof Error ? error.message : 'خطا در ایجاد درخواست پرداخت')
            setIsLoading(false)
        }
    }

    return (
        <Button
            onClick={handleCheckout}
            disabled={isLoading}
            className={className}
        >
            {isLoading ? (
                <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال انتقال به درگاه پرداخت...
                </>
            ) : (
                children
            )}
        </Button>
    )
}
