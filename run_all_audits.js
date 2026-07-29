import fs from 'fs';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const urls = [
  'http://localhost:3000/',
  'http://localhost:3000/library',
  'http://localhost:3000/library/genres',
  'http://localhost:3000/collections',
  'http://localhost:3000/books/alice-in-wonderland',
  'http://localhost:3000/books/read/alice-in-wonderland',
  'http://localhost:3000/discover',
  'http://localhost:3000/dashboard',
  'http://localhost:3000/stats',
  'http://localhost:3000/goals',
  'http://localhost:3000/achievements',
  'http://localhost:3000/leaderboard',
  'http://localhost:3000/vocabulary',
  'http://localhost:3000/vocabulary/game',
  'http://localhost:3000/vocabulary/listen',
  'http://localhost:3000/vocabulary/match',
  'http://localhost:3000/vocabulary/practice',
  'http://localhost:3000/vocabulary/sentence',
  'http://localhost:3000/vocabulary/spell',
  'http://localhost:3000/authors',
  'http://localhost:3000/authors/jane-austen',
  'http://localhost:3000/quotes',
  'http://localhost:3000/search',
  'http://localhost:3000/blog',
  'http://localhost:3000/blog/welcome',
  'http://localhost:3000/auth/signin',
  'http://localhost:3000/onboarding',
  'http://localhost:3000/profile',
  'http://localhost:3000/settings',
  'http://localhost:3000/help',
  'http://localhost:3000/support',
  'http://localhost:3000/about',
  'http://localhost:3000/offline',
  'http://localhost:3000/privacy',
  'http://localhost:3000/terms',
  'http://localhost:3000/cookies',
  'http://localhost:3000/dmca'
];

async function runAudits() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const results = [];

  for (const url of urls) {
    console.log(`Auditing ${url}...`);
    try {
      const options = {
        logLevel: 'info',
        output: 'json',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        port: chrome.port,
      };

      // Custom config for 20x CPU throttling and slow 3G
      const customConfig = {
        extends: 'lighthouse:default',
        settings: {
          formFactor: 'mobile',
          throttling: {
            rttMs: 150,
            throughputKbps: 1.6 * 1024,
            requestLatencyMs: 150 * 3.75,
            downloadThroughputKbps: 1.6 * 1024 * 0.9,
            uploadThroughputKbps: 750 * 0.9,
            cpuSlowdownMultiplier: 20, // 20x Slower CPU as requested
          },
          screenEmulation: {
            mobile: true,
            width: 360,
            height: 640,
            deviceScaleFactor: 2.625,
            disabled: false,
          },
        }
      };

      const runnerResult = await lighthouse(url, options, customConfig);
      
      const scores = {
        url,
        performance: Math.round(runnerResult.lhr.categories.performance.score * 100),
        accessibility: Math.round(runnerResult.lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(runnerResult.lhr.categories['best-practices'].score * 100),
        seo: Math.round(runnerResult.lhr.categories.seo.score * 100),
        fcp: runnerResult.lhr.audits['first-contentful-paint'].displayValue,
        lcp: runnerResult.lhr.audits['largest-contentful-paint'].displayValue,
        cls: runnerResult.lhr.audits['cumulative-layout-shift'].displayValue,
      };
      
      console.log(`Scores for ${url}:`, scores);
      results.push(scores);
    } catch (e) {
      console.error(`Failed to audit ${url}`, e);
      results.push({ url, error: e.message });
    }
  }

  await chrome.kill();
  fs.writeFileSync('audit_results.json', JSON.stringify(results, null, 2));
  console.log('Finished all audits! Saved to audit_results.json');
}

runAudits();
