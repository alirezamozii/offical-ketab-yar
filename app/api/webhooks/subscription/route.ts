import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

/**
 * ZarinPal doesn't use webhooks like Stripe
 * Payment verification happens in the verify endpoint
 * This file is kept for future webhook integrations
 */

export async function POST(req: Request) {
  try {
    const headersList = await headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
      console.error('[Webhook Error] Missing Stripe signature')
      return new NextResponse("Missing signature", { status: 400 })
    }

    const body = await req.text()

    // TODO: Verify Stripe signature (Agent 2 - Security)
    // const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
    // let event: Stripe.Event
    // try {
    //   event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    // } catch (err) {
    //   console.error('[Webhook Error] Signature verification failed:', err)
    //   return new NextResponse('Invalid signature', { status: 400 })
    // }

    // For now, parse JSON (INSECURE - replace with above)
    const event = JSON.parse(body)
    const supabase = await createClient()

    // Log webhook received (Agent 2 - Audit)
    console.log('[Webhook Received]', {
      type: event.type,
      id: event.id,
      timestamp: new Date().toISOString(),
    })

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object

        const { error } = await supabase
          .from("subscriptions")
          .upsert({
            id: subscription.id,
            userId: subscription.metadata.userId,
            planId: subscription.metadata.planId,
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: new Date().toISOString(),
          })

        if (error) throw error
        console.log('[Webhook Success] Subscription updated:', subscription.id)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object

        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            cancelAtPeriodEnd: false,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", subscription.id)

        if (error) throw error
        console.log('[Webhook Success] Subscription canceled:', subscription.id)
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object
        console.log('[Webhook] Payment succeeded:', invoice.id)
        // TODO: Send receipt email
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object
        console.log('[Webhook] Payment failed:', invoice.id)
        // TODO: Notify user
        break
      }

      default:
        console.log('[Webhook] Unhandled event:', event.type)
    }

    return new NextResponse(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('[Webhook Error]', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    return new NextResponse(
      JSON.stringify({ error: "Webhook processing failed" }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
} 
