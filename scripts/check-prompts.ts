import {
  buildEpubBatchAiPrompt,
  SHARED_TRANSLATION_MASTERCLASS_CHARTER,
  BOOK_CONTENT_PAGES_PROMPT,
  FULL_BOOK_BUNDLE_PROMPT,
} from '../src/payload/prompts/ai-prompts'

const p = buildEpubBatchAiPrompt([{ pageNumber: 1, english: 'Test.' }], {
  bookTitle: 'X',
  level: 'B1',
  genres: ['Classic'],
})
console.log('epub chars:', p.length)
console.log('epub self-check:', p.includes('پروتکل خود-بررسی'))
console.log('epub verbatim:', p.includes('Verbatim English Rule'))
console.log('epub length rule:', p.includes('Length Proportionality'))
console.log('charter self-check:', SHARED_TRANSLATION_MASTERCLASS_CHARTER.includes('پروتکل خود-بررسی'))
console.log('book-content rules:', BOOK_CONTENT_PAGES_PROMPT.systemPrompt.includes('غیرقابل‌مذاکره'))
console.log('full-bundle rules:', FULL_BOOK_BUNDLE_PROMPT.systemPrompt.includes('پروتکل خود-بررسی'))
console.log('short mode parity:', buildEpubBatchAiPrompt([{ pageNumber: 1, english: 'A.' }], { includeRules: false }).includes('1:1 paragraph parity'))
