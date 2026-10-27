'use strict';
// Native JA/EN Help and header regression; the app stays fully local.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const evidence = path.resolve('test-results/help-copy');

// Check rendered geometry, including clipping by an ancestor (isVisible alone misses it).
async function auditHeader(page, label) {
  const badge = page.locator('header #versionBadge');
  assert.equal(await badge.textContent(), 'v' + require('../app.config.json').version, label + ': current header version');
  assert.equal(await badge.isVisible(), true, label + ': version visible');
  const clipped = await badge.evaluate(el => {
    const r = el.getBoundingClientRect(), problems = [];
    if (r.width <= 0 || r.height <= 0 || r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1) problems.push('outside viewport');
    if (el.scrollWidth > el.clientWidth + 1) problems.push('version text clipped');
    for (let p = el.parentElement; p; p = p.parentElement) {
      const s = getComputedStyle(p), b = p.getBoundingClientRect();
      if (/hidden|clip|auto|scroll/.test(s.overflowX) && (r.left < b.left - 1 || r.right > b.right + 1)) problems.push('ancestor clips x: ' + p.className);
      if (/hidden|clip|auto|scroll/.test(s.overflowY) && (r.top < b.top - 1 || r.bottom > b.bottom + 1)) problems.push('ancestor clips y: ' + p.className);
    }
    return problems;
  });
  assert.deepEqual(clipped, [], label + ': complete header version remains readable');
  const help = page.locator('#helpButton svg');
  assert.equal(await help.isVisible(), true, label + ': Help icon visible');
  assert.ok(await help.evaluate(svg => {
    const paths = [...svg.querySelectorAll('path')], shape = paths.map(p => p.getAttribute('d')).join(' ');
    return /[aAcC]/.test(shape) && paths.some(p => /[hH]\.01/.test(p.getAttribute('d')) && getComputedStyle(p).strokeLinecap === 'round') && svg.getBBox().width > 0;
  }), label + ': question-mark curve and painted dot, not information icon');
  const shield = page.locator('.local-badge svg');
  if (await shield.count()) {
    assert.ok(await shield.evaluate(svg => [...svg.querySelectorAll('path')].some(p => /^M12 3 5 6/.test(p.getAttribute('d')))), label + ': local-processing shield');
  }
}

async function main() {
  fs.mkdirSync(evidence, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const file of ['dist/index.html', 'dist/index.self-extract.html', 'interactive-guide-maker.html']) {
      for (const language of ['ja', 'en']) {
        for (const [width, height] of [[1360, 900], [320, 568], [360, 640], [390, 844]]) {
          const label = `${file} ${language} ${width}x${height}`;
          const context = await browser.newContext({ viewport: { width, height }, locale: language, reducedMotion: 'reduce' });
          const page = await context.newPage(), errors = [], requests = [];
          page.on('pageerror', error => errors.push(error.message));
          page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
          page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
          try {
            await page.goto(pathToFileURL(path.resolve(file)).href);
            await page.locator('#helpButton').waitFor();
            // init() loads IndexedDB before applying the initial language and rendering blocks.
            await page.waitForFunction(() => document.querySelector('#blockList')?.childElementCount > 0);
            if (await page.locator('html').getAttribute('lang') !== language) await page.locator('#languageButton').click();
            await page.waitForFunction(lang => document.documentElement.lang === lang, language);
            await auditHeader(page, label);
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label + ': no page overflow');
            if (file === 'dist/index.html') await page.screenshot({ path: path.join(evidence, `${language}-${width}-main.png`) });
            const dialog = page.locator('#helpDialog');
            await page.locator('#helpButton').click();
            assert.equal(await dialog.isVisible(), true, label + ': Help opens');
            assert.equal(await page.locator('#helpTitle').textContent(), language === 'ja' ? '使い方と注意事項' : 'How to use & notes');
            const text = await dialog.innerText();
            assert.doesNotMatch(text, /(?:EN\s*\/\s*JA|JA\s*[\/／]\s*EN|ヘッダーのEN|Use EN in the header)/, label + ': redundant switching instructions absent');
            assert.match(await dialog.locator('[data-i18n="helpStep3"]').innerText(), language === 'ja' ? /自動保存.*元に戻す/ : /saved on this device automatically.*Undo/i, label + ': useful save guidance retained');
            assert.match(await dialog.locator('[data-i18n="helpNoteDrag"]').innerText(), language === 'ja' ? /上へ.*下へ/ : /Move up.*Move down/i, label + ': accessible reorder guidance retained');
            const body = dialog.locator('.dialog-body');
            await body.evaluate(el => { el.scrollTop = el.scrollHeight; });
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            assert.ok(await body.evaluate(el => el.scrollWidth <= el.clientWidth + 1), label + ': no Help overflow');
            const end = await dialog.locator('[data-i18n="helpOffline"]').evaluate(el => {
              const range = document.createRange(); range.selectNodeContents(el);
              const rects = [...range.getClientRects()], r = rects[rects.length - 1];
              let top = 0, bottom = innerHeight;
              for (let p = el.parentElement; p; p = p.parentElement) {
                if (/hidden|clip|auto|scroll/.test(getComputedStyle(p).overflowY)) { const b = p.getBoundingClientRect(); top = Math.max(top, b.top); bottom = Math.min(bottom, b.bottom); }
              }
              return { top: r.top, bottom: r.bottom, clipTop: top, clipBottom: bottom };
            });
            assert.ok(end.top >= end.clipTop - 1 && end.bottom <= end.clipBottom + 1, label + ': final Help text reachable ' + JSON.stringify(end));
            if (file === 'dist/index.html') await page.screenshot({ path: path.join(evidence, `${language}-${width}-help.png`) });
            await page.keyboard.press('Escape');
            assert.equal(await dialog.isVisible(), false, label + ': Escape closes');
            await page.locator('#helpButton').click();
            await page.locator('#closeHelpButton').click();
            assert.equal(await dialog.isVisible(), false, label + ': Close button works');
            await page.locator('#helpButton').click();
            const box = await dialog.boundingBox();
            const point = [[1, 1], [width - 1, 1], [1, height - 1], [width - 1, height - 1]].find(([x, y]) => x < box.x || x > box.x + box.width || y < box.y || y > box.y + box.height);
            assert.ok(point, label + ': genuine backdrop available');
            await page.mouse.click(...point);
            assert.equal(await dialog.isVisible(), false, label + ': backdrop closes');
            assert.deepEqual(errors, [], label + ': no console errors');
            assert.deepEqual(requests, [], label + ': no external requests');
            console.log('PASS ' + label);
          } catch (error) {
            await page.screenshot({ path: path.join(evidence, 'failure.png') }).catch(() => {});
            throw new Error(label + ': ' + error.message, { cause: error });
          } finally { await context.close(); }
        }
      }
    }
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
