import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { aiTranslate } from '@/lib/ai'
import { aiRateLimit } from '@/lib/rate-limit'
import { parseBody } from '@/lib/api-validate'
import { apiError } from '@/lib/api-error'

// ── Input validation ─────────────────────────────────────────────────────────
//
// Translation is called per-paragraph, so the per-request text size is
// naturally small. We still cap at 10 000 chars to prevent a malicious
// payload from blowing up the LLM token budget.
const MAX_TEXT_CHARS = 10_000

const TranslateSchema = z.object({
  text: z
    .string({ error: 'متن برای ترجمه وارد نشده است.' })
    .trim()
    .min(1, 'متن برای ترجمه وارد نشده است.')
    .max(MAX_TEXT_CHARS, `متن نمی‌تواند بیشتر از ${MAX_TEXT_CHARS} کاراکتر باشد.`),
})

export async function POST(req: NextRequest) {
  // ⏱ Rate limit — anonymous 40/min, authenticated 120/min (used per-paragraph).
  const blocked = await aiRateLimit(req, { anonLimit: 40, authLimit: 120, name: 'ai-translate' })
  if (blocked) return blocked

  const parsed = await parseBody(req, TranslateSchema)
  if (!parsed.ok) return parsed.response

  const { text } = parsed.data

  try {
    const { translation, notes } = await aiTranslate(text)

    if (!translation) {
      return NextResponse.json(
        {
          translation:
            'الان نمی‌توانم ترجمه کنم. لطفاً چند ثانیه بعد دوباره امتحان کن.',
          notes: '',
        },
        { status: 200 },
      )
    }

    return NextResponse.json({ translation, notes })
  } catch (err) {
    console.error('[/api/ai/translate] POST failed:', err)
    return apiError('ترجمه ناموفق بود. لطفاً دوباره تلاش کنید.', 500)
  }
}
