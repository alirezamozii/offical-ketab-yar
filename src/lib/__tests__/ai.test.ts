/**
 * AI helper tests.
 *
 * The `src/lib/ai/index.ts` module exposes `aiChat`, `aiDictionary`, `aiSummarize`,
 * and `aiTranslate`. Internally these all funnel model output through the
 * private `extractJSON` defensive parser, which:
 *   - strips ```json / ``` markdown fences,
 *   - finds the first `{` and matching last `}`,
 *   - JSON.parses only the slice between them,
 *   - returns null on failure.
 *
 * We exercise these branches by mocking `z-ai-web-dev-sdk` so the public
 * `aiTranslate` and `aiDictionary` helpers see attacker-style model outputs:
 *   - hallucinated preamble + JSON
 *   - pure JSON
 *   - nested JSON
 *   - malformed JSON (returns null, helper falls back gracefully)
 *
 * All assertions exercise real behaviour — no filler.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mock the z-ai-web-dev-sdk so no network is involved ─────────────────────
//
// We mock the default export's `.create()` static method to return an object
// whose `chat.completions.create` resolves to `{ choices: [{ message: { content } }] }`.
// Each test sets the `content` to a specific model output and asserts how the
// helper parses it.

const mockCreate = vi.fn()
const mockChatCompletionsCreate = vi.fn()

vi.mock('z-ai-web-dev-sdk', () => {
  return {
    default: class ZAIMock {
      static async create() {
        mockCreate()
        return {
          chat: {
            completions: {
              create: mockChatCompletionsCreate,
            },
          },
        }
      }
    },
  }
})

beforeEach(() => {
  mockCreate.mockReset()
  mockChatCompletionsCreate.mockReset()
  // Force the module to re-import so the cached ZAI client is dropped —
  // otherwise the mock above wouldn't take effect for the second test.
  vi.resetModules()
})

describe('aiTranslate — extractJSON branches', () => {
  it('parses pure JSON returned by the model', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [{ message: { content: '{"translation":"سلام","notes":""}' } }],
    })
    const { aiTranslate } = await import('@/lib/ai/index')
    const r = await aiTranslate('hello')
    expect(r.translation).toBe('سلام')
    expect(r.notes).toBe('')
  })

  it('parses JSON wrapped in ```json fences', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content:
              'Here is the JSON:\n```json\n{"translation":"درود","notes":"formal"}\n```',
          },
        },
      ],
    })
    const { aiTranslate } = await import('@/lib/ai/index')
    const r = await aiTranslate('hello')
    expect(r.translation).toBe('درود')
    expect(r.notes).toBe('formal')
  })

  it('parses JSON with hallucinated preamble + postscript (defensive slice)', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content:
              'Sure! Here you go: {"translation":"خداحافظ","notes":"casual"}\nLet me know if you need anything else.',
          },
        },
      ],
    })
    const { aiTranslate } = await import('@/lib/ai/index')
    const r = await aiTranslate('bye')
    expect(r.translation).toBe('خداحافظ')
    expect(r.notes).toBe('casual')
  })

  it('parses nested JSON objects correctly', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content:
              '{"translation":"hi","notes":"","meta":{"source":"greeting","level":"A1"}}',
          },
        },
      ],
    })
    const { aiTranslate } = await import('@/lib/ai/index')
    const r = await aiTranslate('hi')
    expect(r.translation).toBe('hi')
    // aiTranslate only surfaces translation + notes; the nested `meta` is
    // silently dropped (not asserted on, but we confirm no crash).
    expect(r.notes).toBe('')
  })

  it('falls back to using the whole text as translation when JSON is malformed', async () => {
    // The model returned prose with a stray `{` but no valid JSON. extractJSON
    // returns null, and aiTranslate treats the entire text as the translation.
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [
        { message: { content: 'This is not JSON, just prose with a { stray brace.' } },
      ],
    })
    const { aiTranslate } = await import('@/lib/ai/index')
    const r = await aiTranslate('hello')
    expect(r.translation).toBe('This is not JSON, just prose with a { stray brace.')
    expect(r.notes).toBe('')
  })

  it('returns empty translation when the upstream call fails', async () => {
    mockChatCompletionsCreate.mockRejectedValue(new Error('upstream-down'))
    const { aiTranslate } = await import('@/lib/ai/index')
    const r = await aiTranslate('hello')
    expect(r.translation).toBe('')
    expect(r.notes).toBe('')
  })

  it('returns empty translation when the input is empty', async () => {
    const { aiTranslate } = await import('@/lib/ai/index')
    const r = await aiTranslate('   ')
    expect(r.translation).toBe('')
    expect(r.notes).toBe('')
    expect(mockChatCompletionsCreate).not.toHaveBeenCalled()
  })
})

describe('aiDictionary — extractJSON + coercion', () => {
  it('parses valid JSON and coerces types on the DictionaryResult', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              word: 'happy',
              phonetic: '/ˈhæpi/',
              partOfSpeech: 'adjective',
              definition: 'feeling or showing pleasure',
              translation: 'خوشحال',
              example: 'She was happy with the gift.',
              synonyms: ['glad', 'joyful', 'cheerful'],
              antonyms: ['sad', 'unhappy'],
              difficultyLevel: 'A2',
              frequencyBand: 'common',
              relatedWords: ['happiness', 'happily', 'unhappy'],
              etymology: 'Old Norse happ- "luck"',
            }),
          },
        },
      ],
    })
    const { aiDictionary } = await import('@/lib/ai/index')
    const r = await aiDictionary('happy', 'She is happy.')
    expect(r).not.toBeNull()
    expect(r!.word).toBe('happy')
    expect(r!.translation).toBe('خوشحال')
    expect(r!.difficultyLevel).toBe('A2')
    expect(r!.frequencyBand).toBe('common')
    expect(r!.synonyms).toEqual(['glad', 'joyful', 'cheerful'])
  })

  it('falls back to "B1" / "uncommon" when CEFR / band values are invalid', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              word: 'foobar',
              phonetic: '',
              partOfSpeech: '',
              definition: '',
              translation: '',
              example: '',
              synonyms: [],
              antonyms: [],
              difficultyLevel: 'X9', // invalid → default B1
              frequencyBand: 'rare-ish', // invalid → default uncommon
              relatedWords: [],
              etymology: '',
            }),
          },
        },
      ],
    })
    const { aiDictionary } = await import('@/lib/ai/index')
    const r = await aiDictionary('foobar')
    expect(r!.difficultyLevel).toBe('B1')
    expect(r!.frequencyBand).toBe('uncommon')
  })

  it('returns null when the model output has no JSON at all', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [{ message: { content: 'Sorry, I have no entry for that.' } }],
    })
    const { aiDictionary } = await import('@/lib/ai/index')
    const r = await aiDictionary('xyznotaword')
    expect(r).toBeNull()
  })

  it('tolerates comma-separated synonyms string (defensive coercion)', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              word: 'big',
              phonetic: '',
              partOfSpeech: 'adj',
              definition: 'large',
              translation: 'بزرگ',
              example: 'a big house',
              synonyms: 'large, huge, massive', // string instead of array
              antonyms: '',
              difficultyLevel: 'A1',
              frequencyBand: 'common',
              relatedWords: '',
              etymology: '',
            }),
          },
        },
      ],
    })
    const { aiDictionary } = await import('@/lib/ai/index')
    const r = await aiDictionary('big')
    expect(r!.synonyms).toEqual(['large', 'huge', 'massive'])
  })
})

describe('aiSummarize', () => {
  it('returns the model output verbatim on success', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [{ message: { content: 'خلاصه‌ی کوتاه.' } }],
    })
    const { aiSummarize } = await import('@/lib/ai/index')
    const r = await aiSummarize('Some long English passage.')
    expect(r).toBe('خلاصه‌ی کوتاه.')
  })

  it('returns "" for empty input without calling the SDK', async () => {
    const { aiSummarize } = await import('@/lib/ai/index')
    const r = await aiSummarize('   ')
    expect(r).toBe('')
    expect(mockChatCompletionsCreate).not.toHaveBeenCalled()
  })

  it('returns "" when the upstream call rejects', async () => {
    mockChatCompletionsCreate.mockRejectedValue(new Error('500'))
    const { aiSummarize } = await import('@/lib/ai/index')
    const r = await aiSummarize('long text')
    expect(r).toBe('')
  })
})
