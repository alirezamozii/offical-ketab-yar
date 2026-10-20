/**
 * Intelligent bilingual sentence splitter and aligner.
 *
 * Designed for Keyab Yar reader UI to break down long paragraphs into small,
 * easily digestible sentence units ("کوچیک موچیک") and match English and Persian
 * sentences one-to-one based on punctuation (periods, question marks, etc.).
 *
 * Features:
 * - Robust abbreviation protection for English (Mr., Dr., etc.)
 * - Number protection (e.g. 3.14)
 * - Support for Persian full stops (.), Arabic full stop (۔), Persian question mark (؟), etc.
 * - Dynamic programming alignment when sentence counts differ slightly (e.g. 1-to-2 or 2-to-1)
 * - Safe fallbacks so no text is ever dropped or lost.
 */

export interface MatchedSentencePair {
  id: string
  primary: string
  secondary: string
  paragraphIndex?: number
  isFirstInParagraph?: boolean
}

// Common abbreviations in English that should not trigger sentence splits
const EN_ABBREVIATIONS = new Set([
  'mr',
  'mrs',
  'ms',
  'dr',
  'prof',
  'sr',
  'jr',
  'vs',
  'etc',
  'eg',
  'ie',
  'inc',
  'ltd',
  'co',
  'corp',
  'st',
  'vol',
  'no',
  'pp',
  'gen',
  'col',
  'capt',
  'lt',
  'sgt',
  'rev',
  'hon',
  'ave',
  'blvd',
  'dept',
  'est',
])

/**
 * Splits a text into clean sentences based on punctuation, preserving punctuation
 * and quotes with each sentence.
 */
export function splitSentences(text: string, lang: 'english' | 'farsi'): string[] {
  if (!text || !text.trim()) return []

  const raw = text.trim()

  // Pre-process: protect decimal numbers like 3.14 -> 3<NUMDOT>14
  const numProtected = raw.replace(/(\d+)\.(\d+)/g, '$1__NUMDOT__$2')

  // Protect common abbreviations in English
  let protectedText = numProtected
  if (lang === 'english') {
    protectedText = protectedText.replace(
      /\b([A-Za-z]{1,4})\./g,
      (match, abbr) => {
        if (EN_ABBREVIATIONS.has(abbr.toLowerCase())) {
          return `${abbr}__ABBRDOT__`
        }
        return match
      },
    )
  }

  // Regex to split on sentence terminators:
  // Terminators: . ! ? \u06D4 (Arabic full stop) \u061F (Arabic question mark)
  // Followed by optional quotes/brackets: " ' ” ’ » ) ]
  // Followed by whitespace or end of string.
  const sentenceRegex =
    /([^.!?\u06D4\u061F\r\n]+(?:[.!?\u06D4\u061F]+['"”’»\])]*|\n+|$))/gu

  const matches = protectedText.match(sentenceRegex)
  if (!matches) {
    return [raw]
  }

  const restore = (str: string) =>
    str
      .replace(/__NUMDOT__/g, '.')
      .replace(/__ABBRDOT__/g, '.')
      .trim()

  const sentences = matches
    .map(restore)
    .filter((s) => s.length > 0)

  // Merge attribution fragments back into their sentence: dialogue like
  // `"What?" he said.` would otherwise split into `"What?"` + `he said.`
  // A fragment whose first real word starts lowercase is a continuation,
  // never a genuine sentence start.
  const merged: string[] = []
  for (const s of sentences) {
    const firstChar = s.replace(/^[\s'"“”‘’»«)\]]+/, '')[0]
    if (merged.length > 0 && firstChar && /[a-z]/.test(firstChar)) {
      merged[merged.length - 1] += ' ' + s
    } else {
      merged.push(s)
    }
  }

  return merged.length > 0 ? merged : [raw]
}

/**
 * Align primary and secondary sentences into matched bilingual pairs.
 * Uses Dynamic Programming to handle slight differences in sentence counts (e.g. 1-to-2 or 2-to-1).
 */
export function alignBilingualSentences(
  primaryText: string,
  secondaryText: string,
  primaryLang: 'english' | 'farsi',
): MatchedSentencePair[] {
  const secondaryLang = primaryLang === 'english' ? 'farsi' : 'english'

  // If one of the texts is empty, return simple single pair or fallback
  if (!primaryText.trim()) {
    if (!secondaryText.trim()) return []
    return [
      {
        id: 'p-0',
        primary: '',
        secondary: secondaryText.trim(),
      },
    ]
  }

  if (!secondaryText.trim()) {
    const primarySentences = splitSentences(primaryText, primaryLang)
    return primarySentences.map((s, i) => ({
      id: `p-${i}`,
      primary: s,
      secondary: '',
    }))
  }

  // Check if both texts have matching paragraphs separated by double newlines (\n\n)
  const primaryParas = primaryText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const secondaryParas = secondaryText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

  if (primaryParas.length > 1 && primaryParas.length === secondaryParas.length) {
    const pairs: MatchedSentencePair[] = []
    let globalIndex = 0
    for (let pIdx = 0; pIdx < primaryParas.length; pIdx++) {
      const pPairs = alignSingleBlock(
        primaryParas[pIdx],
        secondaryParas[pIdx],
        primaryLang,
        secondaryLang,
        globalIndex,
      )
      pPairs.forEach((pair, sIdx) => {
        pair.paragraphIndex = pIdx
        pair.isFirstInParagraph = sIdx === 0
      })
      pairs.push(...pPairs)
      globalIndex += pPairs.length
    }
    return pairs
  }

  const singlePairs = alignSingleBlock(
    primaryText,
    secondaryText,
    primaryLang,
    secondaryLang,
    0,
  )
  singlePairs.forEach((pair, sIdx) => {
    pair.paragraphIndex = 0
    pair.isFirstInParagraph = sIdx === 0
  })
  return singlePairs
}

function alignSingleBlock(
  primaryText: string,
  secondaryText: string,
  primaryLang: 'english' | 'farsi',
  secondaryLang: 'english' | 'farsi',
  startIndex: number,
): MatchedSentencePair[] {
  const primaryList = splitSentences(primaryText, primaryLang)
  const secondaryList = splitSentences(secondaryText, secondaryLang)

  const n = primaryList.length
  const m = secondaryList.length

  // Case 1: Exact sentence count match
  if (n === m) {
    return primaryList.map((p, i) => ({
      id: `pair-${startIndex + i}`,
      primary: p,
      secondary: secondaryList[i],
    }))
  }

  // Case 2: One side is single sentence or counts are very small
  if (n === 1) {
    return [
      {
        id: `pair-${startIndex}`,
        primary: primaryList[0],
        secondary: secondaryList.join(' '),
      },
    ]
  }

  if (m === 1) {
    // Distribute or give all to first
    return primaryList.map((p, i) => ({
      id: `pair-${startIndex + i}`,
      primary: p,
      secondary: i === 0 ? secondaryList[0] : '',
    }))
  }

  // Case 3: DP alignment (Length & Position based cost)
  const cost = (s1: string, s2: string) => {
    const l1 = s1 ? s1.length : 0
    const l2 = s2 ? s2.length : 0
    if (l1 === 0 && l2 === 0) return 0
    if (l1 === 0 || l2 === 0) return 100
    const diff = Math.abs(l1 - l2)
    return diff / Math.max(l1, l2)
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(Infinity),
  )
  const backtrack: Array<Array<{ prevI: number; prevJ: number } | null>> =
    Array.from({ length: n + 1 }, () => Array(m + 1).fill(null))

  dp[0][0] = 0

  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      if (dp[i][j] === Infinity) continue

      // 1:1 match
      if (i < n && j < m) {
        const c = dp[i][j] + cost(primaryList[i], secondaryList[j])
        if (c < dp[i + 1][j + 1]) {
          dp[i + 1][j + 1] = c
          backtrack[i + 1][j + 1] = { prevI: i, prevJ: j }
        }
      }

      // 1:2 match (1 primary maps to 2 secondary)
      if (i < n && j + 1 < m) {
        const combinedSec = secondaryList[j] + ' ' + secondaryList[j + 1]
        const c = dp[i][j] + cost(primaryList[i], combinedSec) + 0.1
        if (c < dp[i + 1][j + 2]) {
          dp[i + 1][j + 2] = c
          backtrack[i + 1][j + 2] = { prevI: i, prevJ: j }
        }
      }

      // 2:1 match (2 primary map to 1 secondary)
      if (i + 1 < n && j < m) {
        const combinedPri = primaryList[i] + ' ' + primaryList[i + 1]
        const c = dp[i][j] + cost(combinedPri, secondaryList[j]) + 0.1
        if (c < dp[i + 2][j + 1]) {
          dp[i + 2][j + 1] = c
          backtrack[i + 2][j + 1] = { prevI: i, prevJ: j }
        }
      }
    }
  }

  // Backtrack to build the pairs
  let currI = n
  let currJ = m
  const pairs: Array<{ primary: string; secondary: string }> = []

  while (currI > 0 || currJ > 0) {
    const step = backtrack[currI][currJ]
    if (!step) {
      if (currI > 0 && currJ > 0) {
        pairs.unshift({
          primary: primaryList[currI - 1],
          secondary: secondaryList[currJ - 1],
        })
        currI--
        currJ--
      } else if (currI > 0) {
        pairs.unshift({
          primary: primaryList[currI - 1],
          secondary: '',
        })
        currI--
      } else {
        if (pairs.length > 0) {
          pairs[0].secondary = secondaryList[currJ - 1] + ' ' + pairs[0].secondary
        } else {
          pairs.unshift({
            primary: '',
            secondary: secondaryList[currJ - 1],
          })
        }
        currJ--
      }
      continue
    }

    const { prevI, prevJ } = step
    const priChunk = primaryList.slice(prevI, currI).join(' ')
    const secChunk = secondaryList.slice(prevJ, currJ).join(' ')
    pairs.unshift({ primary: priChunk, secondary: secChunk })

    currI = prevI
    currJ = prevJ
  }

  return pairs.map((pair, idx) => ({
    id: `pair-${startIndex + idx}`,
    primary: pair.primary,
    secondary: pair.secondary,
  }))
}
