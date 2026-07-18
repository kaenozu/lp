const fs = require('node:fs/promises');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const targetUrl = process.env.TARGET_URL;
const chromePath = process.env.CHROME_PATH;
const outputDir = process.env.AUDIT_BROWSER_DIR || 'production-audit/browser/ashita-motsumono';

if (!targetUrl) throw new Error('TARGET_URL is required');
if (!chromePath) throw new Error('CHROME_PATH is required');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  });

  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.setRequestInterception(true);
    let failedScreenshotRequest = false;
    page.on('request', (request) => {
      let pathname = '';
      try {
        pathname = new URL(request.url()).pathname;
      } catch (_error) {
        pathname = '';
      }
      if (pathname.endsWith('/review-extraction.webp')) {
        failedScreenshotRequest = true;
        request.abort('failed');
      } else {
        request.continue();
      }
    });

    const response = await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    assert(response && response.status() < 400, 'navigation failed');
    await page.waitForFunction(
      () => document.querySelectorAll('.real-app-screen').length === 3,
      { timeout: 30000 },
    );
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 500)));

    const result = await page.evaluate(() => ({
      phoneMocks: document.querySelectorAll('.phone-mock').length,
      realScreens: document.querySelectorAll('.real-app-screen').length,
      brokenImages: Array.from(document.images).filter((image) => image.complete && image.naturalWidth === 0).length,
      failedGridMockPresent: Boolean(document.querySelector('.screenshot-item:nth-child(2) .phone-mock')),
      heroIsRealScreen: Boolean(document.querySelector('.section--mock .real-app-screen')),
    }));

    assert(failedScreenshotRequest, 'the intended screenshot request was not intercepted');
    assert(result.phoneMocks === 1, `expected one retained mock, got ${result.phoneMocks}`);
    assert(result.realScreens === 3, `expected three loaded screenshots, got ${result.realScreens}`);
    assert(result.brokenImages === 0, `broken image elements remain: ${result.brokenImages}`);
    assert(result.failedGridMockPresent, 'the failed screenshot fallback mock was removed');
    assert(result.heroIsRealScreen, 'the unaffected hero screenshot was not displayed');

    await fs.writeFile(
      path.join(outputDir, 'screenshot-image-failure.json'),
      `${JSON.stringify(result, null, 2)}\n`,
      'utf8',
    );
    await page.screenshot({
      path: path.join(outputDir, 'screenshot-image-failure.png'),
      type: 'png',
      fullPage: true,
    });
  } finally {
    await page.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
