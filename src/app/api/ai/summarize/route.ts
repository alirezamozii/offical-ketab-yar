import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { aiSummarize } from '@/lib/ai'
import { aiRateLimit } from '@/lib/rate-limit'
import { parseBody } from '@/lib/api-validate'
import { apiError } from '@/lib/api-error'

// ── Input validation ─────────────────────────────────────────────────────────
//
// `text` is the book/page text the user wants summarised. We cap it at 10 000
// chars (≈ 1 500 words) to keep the upstream LLM call within token limits and
// to prevent a single request from running up cost. The original route had no
// cap at all — a malicious or buggy client could submit megabytes of text and
// wedge the LLM for minutes.
const MAX_TEXT_CHARS = 10_000
const MAX_TITLE_CHARS = 200

const SummarizeSchema = z.object({
  text: z
    .string({ error: 'متن برای خلاصه‌سازی وارد نشده است.' })
    .trim()
    .min(1, 'متن برای خلاصه‌سازی وارد نشده است.')
    .max(MAX_TEXT_CHARS, `متن نمی‌تواند بیشتر از ${MAX_TEXT_CHARS} کاراکتر باشد.`),
  bookTitle: z.string().trim().max(MAX_TITLE_CHARS).optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  // ⏱ Rate limit — anonymous 15/min, authenticated 40/min (heavier LLM call).
  const blocked = await aiRateLimit(req, { anonLimit: 15, authLimit: 40, name: 'ai-summarize' })
  if (blocked) return blocked

  const parsed = await parseBody(req, SummarizeSchema)
  if (!parsed.ok) return parsed.response

  const { text, bookTitle } = parsed.data

  try {
    const summary = await aiSummarize(text, bookTitle ?? '')

    if (!summary) {
      return NextResponse.json(
        {
          summary:
            'الان نمی‌توانم خلاصه بسازم. لطفاً چند ثانیه بعد دوباره امتحان کن.',
        },
        { status: 200 },
      )
    }

    return NextResponse.json({ summary })
  } catch (err) {
    console.error('[/api/ai/summarize] POST failed:', err)
    return apiError('خلاصه‌سازی ناموفق بود. لطفاً دوباره تلاش کنید.', 500)
  }
}
