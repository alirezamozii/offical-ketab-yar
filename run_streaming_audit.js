import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import * as fs from 'fs';

const pages = [
  { name: 'Landing Page', url: 'http://localhost:3000/' },
  { name: 'Library', url: 'http://localhost:3000/library' },
  { name: 'Dashboard', url: 'http://localhost:3000/dashboard' },
  { name: 'Bilingual Reader', url: 'http://localhost:3000/books/read/alice-in-wonderland' },
  { name: 'Authors Directory', url: 'http://localhost:3000/authors' },
  { name: 'Vocabulary Hub', url: 'http://localhost:3000/vocabulary' },
  { name: 'Reading Stats', url: 'http://localhost:3000/stats' },
  { name: 'Achievements', url: 'http://localhost:3000/achievements' },
];

async function auditSinglePage(chrome, page) {
  console.log(`\n==================================================`);
  console.log(`🚀 STARTING AUDIT FOR: ${page.name} (${page.url})`);
  console.log(`==================================================\n`);

  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'seo'],
    port: chrome.port,
    emulatedFormFactor: 'mobile',
    throttling: {
      cpuSlowdownMultiplier: 20,
      rttMs: 150,
      throughputKbps: 1638.4,
      requestLatencyMs: 150,
      downloadThroughputKbps: 1638.4,
      uploadThroughputKbps: 1638.4,
    },
  };

  try {
    const runnerResult = await lighthouse(page.url, options);
    const audits = runnerResult.lhr.audits;
    const perfScore = Math.round(runnerResult.lhr.categories.performance.score * 100);
    const seoScore = Math.round(runnerResult.lhr.categories.seo.score * 100);

    const summary = {
      page: page.name,
      url: page.url,
      perfScore,
      seoScore,
      cls: audits['cumulative-layout-shift']?.displayValue || 'N/A',
      lcp: audits['largest-contentful-paint']?.displayValue || 'N/A',
      fcp: audits['first-contentful-paint']?.displayValue || 'N/A',
      tbt: audits['total-blocking-time']?.displayValue || 'N/A',
      unusedJs: audits['unused-javascript']?.displayValue || 'N/A',
      unusedCss: audits['unused-css-rules']?.displayValue || 'N/A',
    };

    console.log(`\n📊 AUDIT RESULTS FOR ${page.name}:`);
    console.log(`--------------------------------------------------`);
    console.log(`Performance Score: ${perfScore} / 100`);
    console.log(`SEO Score:         ${seoScore} / 100`);
    console.log(`CLS (Layout Shift): ${summary.cls}`);
    console.log(`LCP (Largest Paint):${summary.lcp}`);
    console.log(`FCP (First Paint):  ${summary.fcp}`);
    console.log(`TBT (Blocking Time):${summary.tbt}`);
    console.log(`Unused JS:         ${summary.unusedJs}`);
    console.log(`Unused CSS:        ${summary.unusedCss}`);
    console.log(`--------------------------------------------------\n`);

    fs.appendFileSync('live_audit_stream.jsonl', JSON.stringify(summary) + '\n');
  } catch (err) {
    console.error(`❌ ERROR auditing ${page.name}:`, err.message);
  }
}

async function main() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  for (const page of pages) {
    await auditSinglePage(chrome, page);
  }
  await chrome.kill();
}

main();
