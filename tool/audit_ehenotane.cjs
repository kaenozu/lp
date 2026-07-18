const fs = require('node:fs/promises');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const targetUrl = process.env.TARGET_URL;
const chromePath = process.env.CHROME_PATH;
const outputDir = process.env.AUDIT_BROWSER_DIR || 'production-audit/browser/ehenotane';

if (!targetUrl) throw new Error('TARGET_URL is required');
if (!chromePath) throw new Error('CHROME_PATH is required');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function auditResponsiveLayout(browser) {
  const viewports = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 820, height: 1180 },
    { name: 'desktop', width: 1440, height: 1200 },
  ];
  const summary = {};

  for (const viewport of viewports) {
    const page = await browser.newPage();
    try {
      await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
      const response = await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      assert(response && response.status() < 400, `${viewport.name}: navigation failed`);
      await page.evaluate(() => document.fonts.ready.then(() => true));

      const result = await page.evaluate(() => ({
        language: document.documentElement.lang,
        h1Count: document.querySelectorAll('h1').length,
        choices: document.querySelectorAll('.quiz-card__choice').length,
        resultInitiallyHidden: document.querySelector('.quiz-card__result')?.hidden === true,
        documentClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
      }));

      assert(result.language === 'ja', `${viewport.name}: html language is not ja`);
      assert(result.h1Count === 1, `${viewport.name}: expected one h1`);
      assert(result.choices === 4, `${viewport.name}: expected four quiz choices`);
      assert(result.resultInitiallyHidden, `${viewport.name}: result must start hidden`);
      assert(
        result.documentScrollWidth <= result.documentClientWidth + 1,
        `${viewport.name}: horizontal overflow ${result.documentScrollWidth}px > ${result.documentClientWidth}px`,
      );

      summary[viewport.name] = result;
      await page.screenshot({ path: path.join(outputDir, `${viewport.name}.png`), type: 'png', fullPage: true });
    } finally {
      await page.close();
    }
  }

  await fs.writeFile(
    path.join(outputDir, 'responsive-summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
    'utf8',
  );
}

async function auditQuizInteraction(browser) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    const response = await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    assert(response && response.status() < 400, 'quiz: navigation failed');

    await page.click('.quiz-card__choice[data-index="0"]');
    await page.waitForFunction(() => document.querySelector('.quiz-card__result')?.hidden === false);

    const result = await page.evaluate(() => {
      const choices = Array.from(document.querySelectorAll('.quiz-card__choice'));
      const resultArea = document.querySelector('.quiz-card__result');
      return {
        disabledCount: choices.filter((choice) => choice.disabled).length,
        correctCount: choices.filter((choice) => choice.classList.contains('quiz-card__choice--correct')).length,
        incorrectCount: choices.filter((choice) => choice.classList.contains('quiz-card__choice--incorrect')).length,
        verdict: document.querySelector('#verdict')?.textContent?.trim() || '',
        answer: document.querySelector('#answerText')?.textContent?.trim() || '',
        resultFocused: document.activeElement === resultArea,
        resultHidden: resultArea?.hidden,
      };
    });

    assert(result.disabledCount === 4, `quiz: expected four disabled choices, got ${result.disabledCount}`);
    assert(result.correctCount === 1, `quiz: expected one correct choice, got ${result.correctCount}`);
    assert(result.incorrectCount === 1, `quiz: expected one incorrect choice, got ${result.incorrectCount}`);
    assert(result.verdict === '不正解', `quiz: unexpected verdict ${result.verdict}`);
    assert(result.answer.includes('7個'), `quiz: correct answer is missing: ${result.answer}`);
    assert(result.resultFocused, 'quiz: result area did not receive focus');
    assert(result.resultHidden === false, 'quiz: result remained hidden');

    await fs.writeFile(path.join(outputDir, 'quiz-interaction.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    await page.screenshot({ path: path.join(outputDir, 'quiz-interaction.png'), type: 'png', fullPage: true });
  } finally {
    await page.close();
  }
}

async function auditNoScriptFallback(browser) {
  const page = await browser.newPage();
  try {
    await page.setJavaScriptEnabled(false);
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    const response = await page.goto(targetUrl, { waitUntil: 'load', timeout: 60000 });
    assert(response && response.status() < 400, 'noscript: navigation failed');
    const result = await page.evaluate(() => ({
      message: document.querySelector('.quiz-card__noscript')?.textContent?.trim() || '',
      choices: document.querySelectorAll('.quiz-card__choice').length,
      resultHidden: document.querySelector('.quiz-card__result')?.hidden === true,
    }));
    assert(result.message.includes('JavaScript'), 'noscript: fallback message is missing');
    assert(result.choices === 4, 'noscript: quiz choices disappeared');
    assert(result.resultHidden, 'noscript: result should remain hidden');
    await fs.writeFile(path.join(outputDir, 'noscript.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    await page.screenshot({ path: path.join(outputDir, 'noscript.png'), type: 'png', fullPage: true });
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
    await auditResponsiveLayout(browser);
    await auditQuizInteraction(browser);
    await auditNoScriptFallback(browser);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
