import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const urls = [
  'http://localhost:3000/dashboard',
  'http://localhost:3000/authors',
];

async function run() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  for (const url of urls) {
    console.log(`Auditing ${url}...`);
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance', 'seo'],
      port: chrome.port,
      emulatedFormFactor: 'mobile',
      throttling: {
        cpuSlowdownMultiplier: 20,
        rttMs: 150,
        throughputKbps: 1638.4, // Slow 3G
        requestLatencyMs: 150,
        downloadThroughputKbps: 1638.4,
        uploadThroughputKbps: 1638.4,
      },
    };
    
    const runnerResult = await lighthouse(url, options);
    
    console.log(`\nResults for ${url}:`);
    console.log(`Performance Score: ${runnerResult.lhr.categories.performance.score * 100}`);
    console.log(`SEO Score: ${runnerResult.lhr.categories.seo.score * 100}`);
    console.log(`CLS: ${runnerResult.lhr.audits['cumulative-layout-shift'].displayValue}`);
    console.log(`LCP: ${runnerResult.lhr.audits['largest-contentful-paint'].displayValue}`);
    console.log('--------------------------------------------------\n');
  }

  await chrome.kill();
}

run();
