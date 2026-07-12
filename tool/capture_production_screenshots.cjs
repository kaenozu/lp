const fs = require('node:fs/promises');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const targetUrl = process.env.TARGET_URL;
const chromePath = process.env.CHROME_PATH;
const outputDir = process.env.AUDIT_BROWSER_DIR || 'production-audit/browser';

if (!targetUrl) {
  throw new Error('TARGET_URL is required');
}
if (!chromePath) {
  throw new Error('CHROME_PATH is required');
}

const viewports = [
  { name: 'mobile', width: 390, height: 844, expectedColumns: 1 },
  { name: 'tablet', width: 820, height: 1180, expectedColumns: 2 },
  { name: 'desktop', width: 1440, height: 1200, expectedColumns: 3 },
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function durationToMilliseconds(value) {
  const first = String(value).split(',')[0].trim();
  if (first.endsWith('ms')) {
    return Number.parseFloat(first.slice(0, -2));
  }
  if (first.endsWith('s')) {
    return Number.parseFloat(first.slice(0, -1)) * 1000;
  }
  return Number.NaN;
}

async function waitForRenderedScreens(page) {
  await page.waitForFunction(
    () => document.querySelectorAll('.real-app-screen').length === 4,
    { timeout: 30000 },
  );
  await page.$eval('.screenshot-grid', (grid) => {
    grid.scrollIntoView({ block: 'center', inline: 'nearest' });
  });
  await page.waitForFunction(
    () => {
      const images = Array.from(document.querySelectorAll('.real-app-screen'));
      return images.length === 4 && images.every((image) => image.complete && image.naturalWidth > 0);
    },
    { timeout: 30000 },
  );
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function openRenderedPage(browser, viewport) {
  const page = await browser.newPage();
  await page.setViewport({
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
  });
  await page.goto(targetUrl, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });
  await waitForRenderedScreens(page);
  return page;
}

async function collectLayout(page) {
  return page.evaluate(() => {
    const grid = document.querySelector('.screenshot-grid');
    const items = Array.from(document.querySelectorAll('.screenshot-grid .screenshot-item'));
    if (!grid) {
      throw new Error('screenshot grid was not found');
    }

    const gridStyle = getComputedStyle(grid);
    const rectangles = items.map((item) => {
      const rect = item.getBoundingClientRect();
      return {
        x: Math.round(rect.x * 100) / 100,
        y: Math.round(rect.y * 100) / 100,
        width: Math.round(rect.width * 100) / 100,
        height: Math.round(rect.height * 100) / 100,
      };
    });

    const rowCounts = [];
    for (const rectangle of rectangles) {
      const existingRow = rowCounts.find((row) => Math.abs(row.y - rectangle.y) <= 2);
      if (existingRow) {
        existingRow.count += 1;
      } else {
        rowCounts.push({ y: rectangle.y, count: 1 });
      }
    }

    return {
      computedGridTemplateColumns: gridStyle.gridTemplateColumns,
      computedColumnCount: gridStyle.gridTemplateColumns.split(/\s+/).filter(Boolean).length,
      geometricColumnCount: Math.max(0, ...rowCounts.map((row) => row.count)),
      rowCounts,
      rectangles,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyFontFamily: getComputedStyle(document.body).fontFamily,
      notoJapaneseAvailable: document.fonts.check('16px "Noto Sans CJK JP"', '日本語の表示確認'),
    };
  });
}

function validateLayout(layout, viewport) {
  assert(layout.rectangles.length === 3, `${viewport.name}: expected 3 screenshot items`);
  assert(
    layout.computedColumnCount === viewport.expectedColumns,
    `${viewport.name}: computed ${layout.computedColumnCount} columns, expected ${viewport.expectedColumns}`,
  );
  assert(
    layout.geometricColumnCount === viewport.expectedColumns,
    `${viewport.name}: measured ${layout.geometricColumnCount} columns, expected ${viewport.expectedColumns}`,
  );
  assert(
    layout.documentScrollWidth <= layout.documentClientWidth + 1,
    `${viewport.name}: horizontal overflow ${layout.documentScrollWidth}px > ${layout.documentClientWidth}px`,
  );
}

async function captureResponsiveEvidence(browser) {
  const summary = {};

  for (const viewport of viewports) {
    const page = await openRenderedPage(browser, viewport);
    try {
      const imageAttributes = await page.$$eval('.real-app-screen', (images) => images.map((image) => ({
        loading: image.loading,
        fetchPriority: image.fetchPriority,
        width: image.naturalWidth,
        height: image.naturalHeight,
        alt: image.alt,
      })));

      assert(imageAttributes.length === 4, `${viewport.name}: expected 4 rendered screenshots`);
      assert(
        imageAttributes.filter((image) => image.loading === 'eager').length === 1,
        `${viewport.name}: expected exactly one eager image`,
      );
      assert(
        imageAttributes.filter((image) => image.loading === 'lazy').length === 3,
        `${viewport.name}: expected exactly three lazy images`,
      );
      assert(
        imageAttributes.filter((image) => image.fetchPriority === 'high').length === 1,
        `${viewport.name}: expected exactly one high-priority image`,
      );
      assert(
        imageAttributes.every((image) => image.width === 360 && image.height === 640),
        `${viewport.name}: rendered screenshot dimensions are incorrect`,
      );
      assert(
        imageAttributes.every((image) => image.alt.trim().length > 0),
        `${viewport.name}: every screenshot must have alt text`,
      );

      await page.screenshot({
        path: path.join(outputDir, `${viewport.name}-top.png`),
        type: 'png',
      });

      const grid = await page.$('.screenshot-grid');
      assert(grid, `${viewport.name}: screenshot grid handle was not found`);
      await grid.screenshot({
        path: path.join(outputDir, `${viewport.name}-screens.png`),
        type: 'png',
      });

      const layout = await collectLayout(page);
      summary[viewport.name] = {
        viewport,
        imageAttributes,
        layout,
      };
      await fs.writeFile(
        path.join(outputDir, `${viewport.name}-layout.json`),
        `${JSON.stringify(summary[viewport.name], null, 2)}\n`,
        'utf8',
      );
      validateLayout(layout, viewport);

      if (viewport.name === 'mobile') {
        await fs.writeFile(
          path.join(outputDir, 'javascript-enabled.html'),
          await page.content(),
          'utf8',
        );
      }
    } finally {
      await page.close();
    }
  }

  await fs.writeFile(
    path.join(outputDir, 'responsive-layout-summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
    'utf8',
  );
}

async function auditKeyboardFocus(browser) {
  const page = await openRenderedPage(browser, viewports[2]);
  try {
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });

    const focusTrail = [];
    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.press('Tab');
      focusTrail.push(await page.evaluate(() => {
        const active = document.activeElement;
        if (!(active instanceof HTMLElement)) {
          return null;
        }
        const style = getComputedStyle(active);
        return {
          tag: active.tagName,
          text: active.textContent.trim().replace(/\s+/g, ' ').slice(0, 120),
          href: active instanceof HTMLAnchorElement ? active.getAttribute('href') : null,
          focusVisible: active.matches(':focus-visible'),
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          outlineColor: style.outlineColor,
        };
      }));
    }

    const usable = focusTrail.filter(Boolean);
    assert(usable.length >= 5, `keyboard: only ${usable.length} focusable elements were reached`);
    assert(
      usable.some((entry) => entry.focusVisible && entry.outlineStyle !== 'none' && Number.parseFloat(entry.outlineWidth) > 0),
      'keyboard: no visible focus outline was detected',
    );
    assert(
      usable.some((entry) => entry.href === '#features') && usable.some((entry) => entry.href === '#usage'),
      'keyboard: primary navigation links were not reached',
    );

    await fs.writeFile(
      path.join(outputDir, 'keyboard-focus.json'),
      `${JSON.stringify(focusTrail, null, 2)}\n`,
      'utf8',
    );
    await page.screenshot({
      path: path.join(outputDir, 'keyboard-focus.png'),
      type: 'png',
    });
  } finally {
    await page.close();
  }
}

async function auditReducedMotion(browser) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'reduce' },
    ]);
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    await waitForRenderedScreens(page);

    const result = await page.evaluate(() => {
      const hero = document.querySelector('.hero__title');
      if (!hero) {
        throw new Error('hero title was not found');
      }
      return {
        heroAnimationDuration: getComputedStyle(hero).animationDuration,
        htmlScrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      };
    });
    const duration = durationToMilliseconds(result.heroAnimationDuration);
    assert(Number.isFinite(duration) && duration <= 0.02, `reduced motion duration is ${result.heroAnimationDuration}`);
    assert(result.htmlScrollBehavior === 'auto', `reduced motion scroll behavior is ${result.htmlScrollBehavior}`);

    await fs.writeFile(
      path.join(outputDir, 'reduced-motion.json'),
      `${JSON.stringify(result, null, 2)}\n`,
      'utf8',
    );
  } finally {
    await page.close();
  }
}

async function auditScreenshotCssFailure(browser) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      let pathname = '';
      try {
        pathname = new URL(request.url()).pathname;
      } catch (_error) {
        pathname = '';
      }
      if (pathname === '/assets/app-screenshots.css') {
        request.abort('failed');
      } else {
        request.continue();
      }
    });

    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1000)));

    const result = await page.evaluate(() => ({
      phoneMocks: document.querySelectorAll('.phone-mock').length,
      realScreens: document.querySelectorAll('.real-app-screen').length,
    }));
    assert(result.phoneMocks === 4, `CSS failure: expected 4 phone mocks, got ${result.phoneMocks}`);
    assert(result.realScreens === 0, `CSS failure: expected 0 real screens, got ${result.realScreens}`);

    await fs.writeFile(
      path.join(outputDir, 'screenshot-css-failure.html'),
      await page.content(),
      'utf8',
    );
    await fs.writeFile(
      path.join(outputDir, 'screenshot-css-failure.json'),
      `${JSON.stringify(result, null, 2)}\n`,
      'utf8',
    );
    await page.screenshot({
      path: path.join(outputDir, 'screenshot-css-failure-top.png'),
      type: 'png',
    });
    const grid = await page.$('.screenshot-grid');
    assert(grid, 'CSS failure: screenshot grid was not found');
    await grid.screenshot({
      path: path.join(outputDir, 'screenshot-css-failure-screens.png'),
      type: 'png',
    });
  } finally {
    await page.close();
  }
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none',
    ],
  });

  try {
    await captureResponsiveEvidence(browser);
    await auditKeyboardFocus(browser);
    await auditReducedMotion(browser);
    await auditScreenshotCssFailure(browser);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
