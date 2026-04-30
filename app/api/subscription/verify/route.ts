// API route for verifying ZarinPal payment
// Agent 4: Payment verification endpoint

import { upgradeSubscription } from '@/lib/subscription/subscription-manager'
import { createClient } from '@/lib/supabase/server'
import { getPlanPrice, verifyPayment } from '@/lib/zarinpal/zarinpal-client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const authority = searchParams.get('Authority')
        const status = searchParams.get('Status')

        if (!authority) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/subscription?error=missing_authority`
            )
        }

        // Check if payment was cancelled
        if (status !== 'OK') {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/subscription?cancelled=true`
            )
        }

        const supabase = await createClient()

        // Get payment session from database
        const { data: paymentSession } = await supabase
            .from('payment_sessions')
            .select('*')
            .eq('authority', authority)
            .single()

        if (!paymentSession) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/subscription?error=session_not_found`
            )
        }

        // Verify payment with ZarinPal
        const amount = getPlanPrice(paymentSession.plan_id)
        const verification = await verifyPayment(authority, amount)

        if (!verification.success) {
            // Update payment session status
            await supabase
                .from('payment_sessions')
                .update({ status: 'failed' } as any)
                .eq('authority', authority)

            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/subscription?error=verification_failed`
            )
        }

        // Payment verified successfully - upgrade subscription
        const upgraded = await upgradeSubscription(
            paymentSession.user_id,
            paymentSession.plan_id,
            verification.refId
        )

        if (!upgraded) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/subscription?error=upgrade_failed`
            )
        }

        // Update payment session status
        await supabase
            .from('payment_sessions')
            .update({
                status: 'completed',
                ref_id: verification.refId,
                verified_at: new Date( as any).toISOString(),
            })
            .eq('authority', authority)

        // Redirect to success page
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?ref_id=${verification.refId}`
        )
    } catch (error) {
        console.error('Error verifying payment:', error)
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/subscription?error=server_error`
        )
    }
}
