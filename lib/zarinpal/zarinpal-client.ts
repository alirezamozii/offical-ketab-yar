/**
 * ZarinPal Client Configuration
 * Agent 4: Payment processing with ZarinPal (Iranian Gateway)
 */

// ZarinPal pricing plans
export const ZARINPAL_PLANS = {
    monthly: {
        amount: 99000, // 99,000 Toman
        duration: 30, // days
        name: 'اشتراک ماهانه',
        description: 'دسترسی یک ماهه به تمام امکانات پرمیوم',
    },
    quarterly: {
        amount: 249000, // 249,000 Toman (15% discount)
        duration: 90, // days
        name: 'اشتراک سه‌ماهه',
        description: 'دسترسی سه ماهه به تمام امکانات پرمیوم - 15% تخفیف',
    },
    annual: {
        amount: 890000, // 890,000 Toman (25% discount)
        duration: 365, // days
        name: 'اشتراک سالانه',
        description: 'دسترسی یک ساله به تمام امکانات پرمیوم - 25% تخفیف',
    },
}

/**
 * Request payment from ZarinPal
 */
export async function requestPayment(
    userId: string,
    planType: keyof typeof ZARINPAL_PLANS,
    email?: string,
    mobile?: string
) {
    const plan = ZARINPAL_PLANS[planType]
    const merchantId = process.env.ZARINPAL_MERCHANT_ID || ''

    if (!merchantId) {
        throw new Error('ZarinPal Merchant ID not configured')
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/zarinpal/verify`

    try {
        const response = await fetch('https://api.zarinpal.com/pg/v4/payment/request.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                merchant_id: merchantId,
                amount: plan.amount * 10, // ZarinPal uses Rials (1 Toman = 10 Rials)
                callback_url: callbackUrl,
                description: plan.description,
                metadata: {
                    user_id: userId,
                    plan_type: planType,
                    email: email || '',
                    mobile: mobile || '',
                },
            }),
        })

        const data = await response.json()

        if (data.data && data.data.code === 100) {
            return {
                success: true,
                authority: data.data.authority,
                paymentUrl: `https://www.zarinpal.com/pg/StartPay/${data.data.authority}`,
            }
        } else {
            throw new Error(data.errors?.message || 'Payment request failed')
        }
    } catch (error) {
        console.error('ZarinPal request error:', error)
        throw error
    }
}

/**
 * Verify payment with ZarinPal
 */
export async function verifyPayment(authority: string, amount: number) {
    const merchantId = process.env.ZARINPAL_MERCHANT_ID || ''

    try {
        const response = await fetch('https://api.zarinpal.com/pg/v4/payment/verify.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                merchant_id: merchantId,
                amount: amount * 10, // Convert Toman to Rial
                authority: authority,
            }),
        })

        const data = await response.json()

        if (data.data && data.data.code === 100) {
            return {
                success: true,
                refId: data.data.ref_id,
                cardPan: data.data.card_pan,
                cardHash: data.data.card_hash,
            }
        } else if (data.data && data.data.code === 101) {
            // Already verified
            return {
                success: true,
                refId: data.data.ref_id,
                alreadyVerified: true,
            }
        } else {
            return {
                success: false,
                error: data.errors?.message || 'Verification failed',
            }
        }
    } catch (error) {
        console.error('ZarinPal verify error:', error)
        return {
            success: false,
            error: 'Verification request failed',
        }
    }
}

/**
 * Get plan price
 */
export function getPlanPrice(planType: keyof typeof ZARINPAL_PLANS): number {
    return ZARINPAL_PLANS[planType].amount
}

/**
 * Get plan duration in days
 */
function getPlanDuration(planType: keyof typeof ZARINPAL_PLANS): number {
    return ZARINPAL_PLANS[planType].duration
}

/**
 * Calculate subscription expiry date
 */
function calculateExpiryDate(planType: keyof typeof ZARINPAL_PLANS): Date {
    const duration = getPlanDuration(planType)
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + duration)
    return expiryDate
}
