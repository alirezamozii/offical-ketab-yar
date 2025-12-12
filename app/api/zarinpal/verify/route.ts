import { createClient } from '@/lib/supabase/server'
import { verifyPayment } from '@/lib/zarinpal/zarinpal-client'
import { NextRequest, NextResponse } from 'next/server'

/**
 * ZarinPal Payment Verification
 * Agent 4: Verify payment and activate subscription
 */
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
        const { data: paymentSession, error: sessionError } = await supabase
            .from('payment_sessions')
            .select('*')
            .eq('authority', authority)
            .single()

        if (sessionError || !paymentSession) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/subscription?error=session_not_found`
            )
        }

        // Check if already verified
        if (paymentSession.status === 'completed') {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?ref_id=${paymentSession.ref_id}`
            )
        }

        // Verify payment with ZarinPal
        const verification = await verifyPayment(authority, paymentSession.amount)

        if (!verification.success) {
            // Update payment session as failed
            await supabase
                .from('payment_sessions')
                .update({
                    status: 'failed',
                    error_message: verification.error,
                })
                .eq('id', paymentSession.id)

            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/subscription?error=verification_failed`
            )
        }

        // Activate subscription using database function
        const { data: activated, error: activateError } = await supabase
            .rpc('activate_subscription', {
                p_user_id: paymentSession.user_id,
                p_plan_type: paymentSession.plan_type,
                p_payment_ref_id: verification.refId,
            })

        if (activateError || !activated) {
            console.error('Failed to activate subscription:', activateError)
            throw new Error('Failed to activate subscription')
        }

        // Update payment session as completed
        await supabase
            .from('payment_sessions')
            .update({
                status: 'completed',
                ref_id: verification.refId,
                card_pan: verification.cardPan,
                verified_at: new Date().toISOString(),
            })
            .eq('id', paymentSession.id)

        // Redirect to success page
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?ref_id=${verification.refId}`
        )
    } catch (error) {
        console.error('Payment verification error:', error)
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/subscription?error=server_error`
        )
    }
}
