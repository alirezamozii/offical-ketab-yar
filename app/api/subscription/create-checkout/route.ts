// API route for creating ZarinPal payment
// Agent 4: Payment API endpoint for Iranian market

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json(
                { error: 'لطفاً ابتدا وارد حساب کاربری خود شوید' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { planId } = body

        if (!planId || !['monthly', 'quarterly', 'annual'].includes(planId)) {
            return NextResponse.json(
                { error: 'پلن انتخابی نامعتبر است' },
                { status: 400 }
            )
        }

        // Create ZarinPal payment request
        const payment = await requestPayment({
            userId: user.id,
            planId,
            successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/verify`,
            cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?cancelled=true`,
        })

        // Store payment info temporarily (for verification later)
        await supabase.from('payment_sessions').insert({
            user_id: user.id,
            authority: payment.authority,
            plan_id: planId,
            status: 'pending',
            created_at: new Date().toISOString(),
        })

        return NextResponse.json({
            authority: payment.authority,
            url: payment.url,
        })
    } catch (error) {
        console.error('Error creating payment:', error)
        return NextResponse.json(
            { error: 'خطا در ایجاد درخواست پرداخت. لطفاً دوباره تلاش کنید.' },
            { status: 500 }
        )
    }
}
