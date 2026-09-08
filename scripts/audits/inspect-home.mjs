import puppeteer from 'puppeteer-core'
import { mkdir, writeFile } from 'node:fs/promises'

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 412, height: 823, isMobile: true, hasTouch: true, deviceScaleFactor: 1.75 })
  const events = []
  page.on('console', m => { if (m.type() === 'error') events.push({ error: m.text() }) })
  page.on('pageerror', e => events.push({ error: String(e) }))
  const cdp = await page.createCDPSession()
  await cdp.send('Network.enable')
  cdp.on('Network.requestWillBeSent', e => { if (e.type === 'Document') events.push({ url: e.request.url, redirect: e.redirectResponse, initiator: e.initiator }) })
  await page.evaluateOnNewDocument(() => {
    window.__lcp = []
    new PerformanceObserver(list => list.getEntries().forEach(e => window.__lcp.push({ time: e.startTime, tag: e.element?.outerHTML.slice(0,200) }))).observe({ type: 'largest-contentful-paint', buffered: true })
  })
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' })
  const data = await page.evaluate(() => ({
    lcp: window.__lcp,
    navigation: performance.getEntriesByType('navigation').map(e=>e.toJSON()),
    fonts: [...document.fonts].filter(f=>f.status==='loaded').map(f=>({family:f.family,status:f.status})),
    main: document.querySelector('main')?.innerText.slice(0,350),
    scriptBytes: performance.getEntriesByType('resource').filter(e=>e.initiatorType==='script').reduce((n,e)=>n+e.transferSize,0),
    overflow: document.documentElement.scrollWidth > innerWidth,
  }))
  await mkdir('artifacts/browser', { recursive: true })
  await page.screenshot({path:'artifacts/browser/mobile.png'})
  await writeFile('artifacts/browser/inspection.json',JSON.stringify({events,...data},null,2))
  console.log(JSON.stringify({events,...data},null,2))
} finally { await browser.close() }
