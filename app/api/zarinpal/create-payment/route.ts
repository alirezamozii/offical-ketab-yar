import { createClient } from '@/lib/supabase/server'
import { requestPayment, ZARINPAL_PLANS } from '@/lib/zarinpal/zarinpal-client'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Create ZarinPal Payment Request
 * Agent 4: Handle subscription payment with ZarinPal
 */
export async function POST(request: NextRequest) {
    try {
        const { planType } = await request.json()

        if (!planType || !ZARINPAL_PLANS[planType as keyof typeof ZARINPAL_PLANS]) {
            return NextResponse.json(
                { error: 'نوع اشتراک نامعتبر است' },
                { status: 400 }
            )
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'لطفاً ابتدا وارد شوید' },
                { status: 401 }
            )
        }

        // Get user profile for email/mobile
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()

        // Create payment session in database
        const plan = ZARINPAL_PLANS[planType as keyof typeof ZARINPAL_PLANS]
        const { data: paymentSession, error: sessionError } = await supabase
            .from('payment_sessions')
            .insert({
                user_id: user.id,
                plan_id: planType,
                plan_type: planType,  // For compatibility
                amount: plan.amount,
                status: 'pending',
            })
            .select()
            .single()

        if (sessionError) {
            throw sessionError
        }

        // Request payment from ZarinPal
        const payment = await requestPayment(
            user.id,
            planType,
            user.email,
            profile?.full_name
        )

        if (!payment.success) {
            throw new Error('Failed to create payment request')
        }

        // Update payment session with authority
        await supabase
            .from('payment_sessions')
            .update({ authority: payment.authority })
            .eq('id', paymentSession.id)

        return NextResponse.json({
            success: true,
            paymentUrl: payment.paymentUrl,
            authority: payment.authority,
        })
    } catch (error) {
        console.error('ZarinPal payment error:', error)
        return NextResponse.json(
            { error: 'خطا در ایجاد درخواست پرداخت' },
            { status: 500 }
        )
    }
}
