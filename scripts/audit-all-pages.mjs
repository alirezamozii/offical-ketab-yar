import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import { launch } from 'chrome-launcher'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3005'
const outputDir = path.resolve(process.argv[2] || 'artifacts/lighthouse/all-pages')
const runs = Number(process.argv[3] || 1)
const targetPreset = process.argv[4] || 'all' // 'mobile', 'desktop', or 'all'
const filterPage = process.argv[5] || null
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const ALL_PAGES = [
  { name: 'home', path: '/' },
  { name: 'library', path: '/library' },
  { name: 'book-detail', path: '/books/alice-in-wonderland' },
  { name: 'reader', path: '/books/read/alice-in-wonderland' },
  { name: 'authors', path: '/authors' },
  { name: 'quotes', path: '/quotes' },
  { name: 'leaderboard', path: '/leaderboard' },
  { name: 'blog', path: '/blog' },
  { name: 'vocabulary', path: '/vocabulary' },
  { name: 'help', path: '/help' },
  { name: 'terms', path: '/terms' },
]

const PAGES = filterPage ? ALL_PAGES.filter((p) => p.name === filterPage || p.path === filterPage) : ALL_PAGES

await mkdir(outputDir, { recursive: true })

const presets = targetPreset === 'all' ? ['mobile', 'desktop'] : [targetPreset]
const allSummaries = []

for (const page of PAGES) {
  const pageUrl = `${baseUrl}${page.path}`
  const pageDir = path.join(outputDir, page.name)
  await mkdir(pageDir, { recursive: true })

  for (const preset of presets) {
    for (let run = 1; run <= runs; run++) {
      console.log(`[Lighthouse] Auditing ${page.name} (${page.path}) on ${preset} (run ${run}/${runs})...`)
      let chrome
      try {
        chrome = await launch({
          chromePath,
          chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
        })

        const result = await lighthouse(
          pageUrl,
          {
            port: chrome.port,
            output: ['html', 'json'],
            logLevel: 'error',
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          },
          preset === 'desktop' ? desktopConfig : undefined,
        )

        const baseName = `${preset}-${run}`
        await writeFile(path.join(pageDir, `${baseName}.html`), result.report[0])
        await writeFile(path.join(pageDir, `${baseName}.json`), result.report[1])

        const { lhr } = result
        const scores = Object.fromEntries(
          Object.entries(lhr.categories).map(([k, v]) => [k, Math.round((v.score ?? 0) * 100)]),
        )
        const metrics = Object.fromEntries(
          [
            'first-contentful-paint',
            'largest-contentful-paint',
            'total-blocking-time',
            'cumulative-layout-shift',
            'speed-index',
          ].map((k) => [k, lhr.audits[k]?.numericValue ?? 0]),
        )

        const summary = {
          page: page.name,
          path: page.path,
          preset,
          run,
          scores,
          metrics,
        }

        allSummaries.push(summary)
        console.log(
          `  -> Scores: Perf: ${scores.performance} | A11y: ${scores.accessibility} | BP: ${scores['best-practices']} | SEO: ${scores.seo} | LCP: ${Math.round(metrics['largest-contentful-paint'])}ms | TBT: ${Math.round(metrics['total-blocking-time'])}ms | CLS: ${metrics['cumulative-layout-shift'].toFixed(3)}`,
        )
      } catch (err) {
        console.error(`  -> Failed to audit ${page.name} (${preset}):`, err.message)
        allSummaries.push({
          page: page.name,
          path: page.path,
          preset,
          run,
          error: err.message,
        })
      } finally {
        if (chrome) {
          try {
            await chrome.kill()
          } catch {
            // Windows profile cleanup deferred
          }
        }
      }
    }
  }
}

await writeFile(path.join(outputDir, 'summary.json'), JSON.stringify(allSummaries, null, 2))
console.log('\n--- ALL AUDITS COMPLETE ---')
console.log(`Saved summaries to ${path.join(outputDir, 'summary.json')}\n`)

console.log('| Page | Preset | Run | Perf | A11y | BP | SEO | LCP | TBT | CLS |')
console.log('|---|---|---|---|---|---|---|---|---|---|')
for (const s of allSummaries) {
  if (s.error) {
    console.log(`| ${s.page} | ${s.preset} | ${s.run} | ERR | ERR | ERR | ERR | - | - | - |`)
  } else {
    console.log(
      `| ${s.page} | ${s.preset} | ${s.run} | ${s.scores.performance} | ${s.scores.accessibility} | ${s.scores['best-practices']} | ${s.scores.seo} | ${Math.round(s.metrics['largest-contentful-paint'])}ms | ${Math.round(s.metrics['total-blocking-time'])}ms | ${s.metrics['cumulative-layout-shift'].toFixed(3)} |`,
    )
  }
}
