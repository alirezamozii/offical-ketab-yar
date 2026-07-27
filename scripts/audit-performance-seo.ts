import { performance } from 'perf_hooks'

const BASE_URL = 'http://localhost:3000'

const ROUTES = [
  '/',
  '/library',
  '/books/call-of-the-wild',
  '/books/read/call-of-the-wild',
  '/vocabulary',
  '/stats',
  '/goals',
  '/authors',
  '/quotes',
  '/blog',
  '/support',
  '/api/health/ready'
]

interface AuditResult {
  route: string
  status: number
  ttfbMs: number
  totalTimeMs: number
  contentLengthBytes: number
  hasTitle: boolean
  titleText: string
  hasMetaDescription: boolean
  metaDescriptionText: string
  hasOpenGraph: boolean
  hasViewport: boolean
  hasH1: boolean
  h1Count: number
  hasJsonLd: boolean
  imagesWithoutAlt: number
  totalImages: number
  performanceRating: 'FAST' | 'MODERATE' | 'SLOW'
}

async function auditRoute(route: string): Promise<AuditResult> {
  const url = `${BASE_URL}${route}`
  const startTime = performance.now()
  let ttfbMs = 0
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'KetabYar-Performance-Auditor/1.0',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    })
    
    ttfbMs = performance.now() - startTime
    const text = await res.text()
    const totalTimeMs = performance.now() - startTime

    // Extract HTML tags
    const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const metaDescMatch = text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                          text.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)
    const ogMatch = text.match(/<meta[^>]*property=["']og:title["']/i)
    const viewportMatch = text.match(/<meta[^>]*name=["']viewport["']/i)
    const h1Matches = text.match(/<h1[\s>]/gi) || []
    const jsonLdMatches = text.match(/<script[^>]*type=["']application\/ld\+json["']/gi) || []
    
    // Image alt audit
    const imgTags = text.match(/<img[^>]*>/gi) || []
    let imagesWithoutAlt = 0
    imgTags.forEach(img => {
      if (!img.includes('alt=')) {
        imagesWithoutAlt++
      }
    })

    let performanceRating: 'FAST' | 'MODERATE' | 'SLOW' = 'FAST'
    if (ttfbMs > 500) performanceRating = 'SLOW'
    else if (ttfbMs > 200) performanceRating = 'MODERATE'

    return {
      route,
      status: res.status,
      ttfbMs: Math.round(ttfbMs),
      totalTimeMs: Math.round(totalTimeMs),
      contentLengthBytes: Buffer.byteLength(text, 'utf8'),
      hasTitle: !!titleMatch,
      titleText: titleMatch ? titleMatch[1].trim() : '',
      hasMetaDescription: !!metaDescMatch,
      metaDescriptionText: metaDescMatch ? metaDescMatch[1].trim() : '',
      hasOpenGraph: !!ogMatch,
      hasViewport: !!viewportMatch,
      hasH1: h1Matches.length > 0,
      h1Count: h1Matches.length,
      hasJsonLd: jsonLdMatches.length > 0,
      imagesWithoutAlt,
      totalImages: imgTags.length,
      performanceRating
    }
  } catch (err: any) {
    return {
      route,
      status: 0,
      ttfbMs: 0,
      totalTimeMs: Math.round(performance.now() - startTime),
      contentLengthBytes: 0,
      hasTitle: false,
      titleText: '',
      hasMetaDescription: false,
      metaDescriptionText: '',
      hasOpenGraph: false,
      hasViewport: false,
      hasH1: false,
      h1Count: 0,
      hasJsonLd: false,
      imagesWithoutAlt: 0,
      totalImages: 0,
      performanceRating: 'SLOW'
    }
  }
}

async function runAudit() {
  console.log('🚀 Starting Ketab-Yar Full Performance, Speed & SEO Audit...\n')
  const results: AuditResult[] = []

  for (const route of ROUTES) {
    const result = await auditRoute(route)
    results.push(result)
    console.log(`[${result.status === 200 ? 'OK' : 'ERR'}] ${route.padEnd(30)} TTFB: ${result.ttfbMs}ms | Size: ${(result.contentLengthBytes / 1024).toFixed(1)}KB | SEO Title: ${result.hasTitle ? 'YES' : 'NO'} | H1s: ${result.h1Count}`)
  }

  console.log('\n======================================================')
  console.log('SUMMARY AUDIT REPORT')
  console.log('======================================================')
  
  const slowRoutes = results.filter(r => r.ttfbMs > 200)
  const missingTitles = results.filter(r => !r.hasTitle && r.status === 200)
  const missingMetaDesc = results.filter(r => !r.hasMetaDescription && r.status === 200)
  const missingH1 = results.filter(r => !r.hasH1 && r.status === 200 && r.route !== '/api/health/ready')
  const multipleH1 = results.filter(r => r.h1Count > 1)
  const missingOg = results.filter(r => !r.hasOpenGraph && r.status === 200 && r.route !== '/api/health/ready')

  console.log(`Total Routes Tested: ${results.length}`)
  console.log(`Passed (Status 200): ${results.filter(r => r.status === 200).length}`)
  console.log(`Slow Routes (>200ms TTFB): ${slowRoutes.length}`)
  console.log(`Routes Missing Title: ${missingTitles.length}`)
  console.log(`Routes Missing Meta Description: ${missingMetaDesc.length}`)
  console.log(`Routes Missing <h1> Tag: ${missingH1.length}`)
  console.log(`Routes with Multiple <h1> Tags: ${multipleH1.length}`)
  console.log(`Routes Missing OpenGraph Tags: ${missingOg.length}`)

  console.log('\n--- DETAILED ISSUES ---')
  if (slowRoutes.length) {
    console.log('\n⚠️ Slow Routes (>200ms TTFB):')
    slowRoutes.forEach(r => console.log(`  - ${r.route}: ${r.ttfbMs}ms TTFB`))
  }
  if (missingMetaDesc.length) {
    console.log('\n⚠️ Routes Missing Meta Description:')
    missingMetaDesc.forEach(r => console.log(`  - ${r.route}`))
  }
  if (missingH1.length) {
    console.log('\n⚠️ Routes Missing H1 tag:')
    missingH1.forEach(r => console.log(`  - ${r.route}`))
  }
  if (multipleH1.length) {
    console.log('\n⚠️ Routes with Multiple H1 tags:')
    multipleH1.forEach(r => console.log(`  - ${r.route} (${r.h1Count} H1 tags)`))
  }

  process.exit(0)
}

runAudit()
