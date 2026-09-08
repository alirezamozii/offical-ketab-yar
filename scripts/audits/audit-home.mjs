import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import { launch } from 'chrome-launcher'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

// Lighthouse defaults: mobile Slow 4G and simulated CPU throttling, fresh
// browser storage, no extensions, and no app-specific bypass flags.
const url = process.argv[2] || 'http://localhost:3000/'
const output = path.resolve(process.argv[3] || 'artifacts/lighthouse')
const runs = Number(process.argv[4] || 3)
await mkdir(output, { recursive: true })
const summaries = []
for (const preset of ['mobile', 'desktop']) {
  for (let run = 1; run <= runs; run++) {
    const chrome = await launch({
      chromePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      chromeFlags: ['--headless=new'],
    })
    try {
      const result = await lighthouse(url, {
        port: chrome.port,
        output: ['html', 'json'],
        logLevel: 'error',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      }, preset === 'desktop' ? desktopConfig : undefined)
      const name = `${preset}-${run}`
      await writeFile(path.join(output, `${name}.html`), result.report[0])
      await writeFile(path.join(output, `${name}.json`), result.report[1])
      const { lhr } = result
      const summary = {
        preset, run, url: lhr.finalDisplayedUrl, date: lhr.fetchTime,
        scores: Object.fromEntries(Object.entries(lhr.categories).map(([k, v]) => [k, Math.round(v.score * 100)])),
        metrics: Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'].map(k => [k, lhr.audits[k].numericValue])),
        warnings: lhr.runWarnings,
      }
      summaries.push(summary)
      console.log(JSON.stringify(summary))
    } finally {
      // Windows can briefly retain a lock on a terminated Chrome profile.
      // Preserve the finished report and let later runs use a fresh profile.
      try { await chrome.kill() } catch (error) {
        if (error.code !== 'EBUSY' && error.code !== 'EPERM') throw error
        console.warn(`Chrome profile cleanup deferred: ${error.code}`)
      }
    }
  }
}
await writeFile(path.join(output, 'summary.json'), JSON.stringify(summaries, null, 2))
