const fs = require('node:fs/promises');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const targetUrl = process.env.TARGET_URL;
const chromePath = process.env.CHROME_PATH;
const outputDir = process.env.ACCESSIBILITY_AUDIT_DIR || 'production-audit/accessibility';

if (!targetUrl) throw new Error('TARGET_URL is required');
if (!chromePath) throw new Error('CHROME_PATH is required');

const directIndexUrl = new URL('index.html', targetUrl).href;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function protocolValue(property) {
  return property && typeof property === 'object' ? property.value : undefined;
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

async function openRenderedPage(browser, url, viewport = { width: 1280, height: 1000, deviceScaleFactor: 1 }) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  assert(response && response.status() < 400, `${url}: navigation failed`);
  await waitForRenderedScreens(page);
  return page;
}

async function auditDirectIndexAccess(browser) {
  const page = await openRenderedPage(browser, directIndexUrl, {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
  });
  try {
    const result = await page.evaluate((requestedUrl) => ({
      requestedUrl,
      finalUrl: window.location.href,
      pathname: window.location.pathname,
      realScreens: document.querySelectorAll('.real-app-screen').length,
      phoneMocks: document.querySelectorAll('.phone-mock').length,
    }), directIndexUrl);

    await fs.writeFile(
      path.join(outputDir, 'index-html-access.json'),
      `${JSON.stringify(result, null, 2)}\n`,
      'utf8',
    );
    await page.screenshot({
      path: path.join(outputDir, 'index-html-access.png'),
      type: 'png',
    });

    assert(result.realScreens === 4, `index.html: expected 4 real screens, got ${result.realScreens}`);
    assert(result.phoneMocks === 0, `index.html: expected 0 phone mocks, got ${result.phoneMocks}`);
  } finally {
    await page.close();
  }
}

async function auditDocumentSemantics(browser) {
  const page = await openRenderedPage(browser, targetUrl);
  try {
    const dom = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((heading) => ({
        level: Number(heading.tagName.slice(1)),
        text: (heading.textContent || '').trim().replace(/\s+/g, ' '),
      }));
      const navigation = Array.from(document.querySelectorAll('nav')).map((nav) => ({
        label: nav.getAttribute('aria-label') || '',
        linkCount: nav.querySelectorAll('a[href]').length,
      }));
      const images = Array.from(document.querySelectorAll('img.real-app-screen')).map((image) => ({
        alt: image.alt,
        width: image.naturalWidth,
        height: image.naturalHeight,
      }));
      const links = Array.from(document.querySelectorAll('a[href]')).map((link) => ({
        href: link.getAttribute('href'),
        name: (link.getAttribute('aria-label') || link.textContent || '').trim().replace(/\s+/g, ' '),
      }));
      return {
        language: document.documentElement.lang,
        title: document.title,
        headings,
        landmarks: {
          header: document.querySelectorAll('header').length,
          main: document.querySelectorAll('main').length,
          footer: document.querySelectorAll('footer').length,
          navigation,
        },
        images,
        links,
      };
    });

    const client = await page.createCDPSession();
    await client.send('Accessibility.enable');
    const { nodes } = await client.send('Accessibility.getFullAXTree');
    const visibleNodes = nodes.filter((node) => !node.ignored);
    const axImages = visibleNodes
      .filter((node) => protocolValue(node.role) === 'image')
      .map((node) => ({ role: protocolValue(node.role), name: protocolValue(node.name) || '' }));
    const axLandmarks = visibleNodes
      .filter((node) => ['banner', 'main', 'contentinfo', 'navigation'].includes(protocolValue(node.role)))
      .map((node) => ({ role: protocolValue(node.role), name: protocolValue(node.name) || '' }));
    const axHeadings = visibleNodes
      .filter((node) => protocolValue(node.role) === 'heading')
      .map((node) => ({
        role: protocolValue(node.role),
        name: protocolValue(node.name) || '',
        level: node.properties?.find((property) => property.name === 'level')?.value?.value,
      }));

    const result = {
      dom,
      accessibilityTree: {
        images: axImages,
        landmarks: axLandmarks,
        headings: axHeadings,
      },
    };
    await fs.writeFile(
      path.join(outputDir, 'accessibility-semantics.json'),
      `${JSON.stringify(result, null, 2)}\n`,
      'utf8',
    );

    assert(dom.language === 'ja', `expected document language ja, got ${dom.language}`);
    assert(dom.title.trim().length > 0, 'document title is empty');
    assert(dom.headings.filter((heading) => heading.level === 1).length === 1, 'expected exactly one h1');
    assert(dom.headings[0]?.level === 1, 'the first heading is not h1');
    for (let index = 1; index < dom.headings.length; index += 1) {
      assert(
        dom.headings[index].level <= dom.headings[index - 1].level + 1,
        `heading level skips from h${dom.headings[index - 1].level} to h${dom.headings[index].level}`,
      );
    }

    assert(dom.landmarks.header === 1, `expected one header, got ${dom.landmarks.header}`);
    assert(dom.landmarks.main === 1, `expected one main, got ${dom.landmarks.main}`);
    assert(dom.landmarks.footer === 1, `expected one footer, got ${dom.landmarks.footer}`);
    assert(dom.landmarks.navigation.length === 2, `expected two navigation landmarks, got ${dom.landmarks.navigation.length}`);
    assert(dom.landmarks.navigation.every((nav) => nav.label.trim().length > 0), 'navigation landmark label is empty');
    assert(new Set(dom.landmarks.navigation.map((nav) => nav.label)).size === 2, 'navigation landmark labels are not unique');
    assert(dom.links.every((link) => link.name.length > 0), 'a link has no accessible text');

    assert(dom.images.length === 4, `expected 4 DOM images, got ${dom.images.length}`);
    assert(dom.images.every((image) => image.alt.trim().length > 0), 'a screenshot alt text is empty');
    assert(dom.images.every((image) => image.width === 360 && image.height === 640), 'a screenshot has incorrect dimensions');
    assert(axImages.length >= 4, `expected at least 4 accessibility image nodes, got ${axImages.length}`);
    for (const image of dom.images) {
      assert(axImages.some((node) => node.name === image.alt), `alt text is absent from accessibility tree: ${image.alt}`);
    }

    for (const requiredRole of ['banner', 'main', 'contentinfo']) {
      assert(axLandmarks.some((landmark) => landmark.role === requiredRole), `accessibility tree lacks ${requiredRole}`);
    }
    const axNavigation = axLandmarks.filter((landmark) => landmark.role === 'navigation');
    assert(axNavigation.length >= 2, `expected at least two navigation nodes, got ${axNavigation.length}`);
    assert(axNavigation.every((landmark) => landmark.name.trim().length > 0), 'accessibility navigation name is empty');
    assert(axHeadings.some((heading) => heading.level === 1 && heading.name.length > 0), 'accessibility tree lacks a named level-1 heading');
  } finally {
    await page.close();
  }
}

async function auditTwoHundredPercentTextResize(browser) {
  const page = await openRenderedPage(browser, targetUrl, {
    width: 720,
    height: 900,
    deviceScaleFactor: 1,
  });
  try {
    await page.addStyleTag({ content: ':root { font-size: 200% !important; }' });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

    const result = await page.evaluate(() => {
      const keySelectors = ['h1', '.hero__lead', '.hero__actions', '#features', '#usage', '#faq', '.screenshot-grid'];
      const keyElements = keySelectors.map((selector) => {
        const element = document.querySelector(selector);
        if (!element) return { selector, exists: false };
        const rect = element.getBoundingClientRect();
        return {
          selector,
          exists: true,
          width: rect.width,
          height: rect.height,
          display: getComputedStyle(element).display,
          visibility: getComputedStyle(element).visibility,
        };
      });
      const clippedText = Array.from(document.querySelectorAll('body *')).flatMap((element) => {
        const directText = Array.from(element.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent || '')
          .join('')
          .trim();
        if (!directText) return [];
        const style = getComputedStyle(element);
        const clipsX = ['hidden', 'clip'].includes(style.overflowX) && element.scrollWidth > element.clientWidth + 1;
        const clipsY = ['hidden', 'clip'].includes(style.overflowY) && element.scrollHeight > element.clientHeight + 1;
        return clipsX || clipsY
          ? [{ tag: element.tagName, text: directText.replace(/\s+/g, ' ').slice(0, 160), overflowX: style.overflowX, overflowY: style.overflowY }]
          : [];
      });
      return {
        viewportWidth: window.innerWidth,
        documentClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        rootFontSize: getComputedStyle(document.documentElement).fontSize,
        keyElements,
        clippedText,
      };
    });

    await fs.writeFile(
      path.join(outputDir, 'text-resize-200.json'),
      `${JSON.stringify(result, null, 2)}\n`,
      'utf8',
    );
    await page.screenshot({
      path: path.join(outputDir, 'text-resize-200.png'),
      type: 'png',
      fullPage: true,
    });

    assert(result.rootFontSize === '32px', `expected 32px root font size, got ${result.rootFontSize}`);
    assert(
      result.documentScrollWidth <= result.documentClientWidth + 1,
      `200% text resize causes horizontal overflow: ${result.documentScrollWidth}px > ${result.documentClientWidth}px`,
    );
    assert(result.keyElements.every((element) => element.exists), 'a key section is missing at 200% text resize');
    assert(
      result.keyElements.every((element) => element.width > 0 && element.height > 0 && element.display !== 'none' && element.visibility !== 'hidden'),
      'a key section is not visible at 200% text resize',
    );
    assert(result.clippedText.length === 0, `text is clipped at 200% resize: ${JSON.stringify(result.clippedText)}`);
  } finally {
    await page.close();
  }
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  });
  try {
    await auditDirectIndexAccess(browser);
    await auditDocumentSemantics(browser);
    await auditTwoHundredPercentTextResize(browser);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
