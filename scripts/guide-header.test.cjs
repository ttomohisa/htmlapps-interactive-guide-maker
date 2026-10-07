'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { createApp, loadHtml } = require('./guide-harness.cjs');
const root = path.join(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'app.config.json'), 'utf8'));
const filename = path.resolve(process.argv[2] || path.join(root, 'src/index.template.html'));

for (const language of ['ja', 'en']) {
  test(`${language}: repeated language clicks show EN/JA and preserve the guide`, async () => {
    const app = createApp(filename, { language }); await app.settle();
    app.el('startBlankButton').click(); await app.settle();
    app.input(app.el('documentTitle'), 'Header regression');
    const before = app.run('serialize()');
    for (let count = 0; count < 4; count++) {
      const current = app.document.documentElement.lang;
      assert.equal(app.el('languageButton').textContent, current === 'ja' ? 'EN' : 'JA');
      assert.equal(app.el('versionBadge').textContent, `v${config.version}`);
      app.el('languageButton').click();
      assert.equal(app.document.documentElement.lang, current === 'ja' ? 'en' : 'ja');
      assert.equal(app.storage.get(`${config.slug}:language`), app.document.documentElement.lang);
      assert.equal(app.run('serialize()'), before);
    }
  });
  test(`${language}: language target has a localized accessible name and matching tooltip`, async () => {
    const app = createApp(filename, { language }); await app.settle();
    for (let count = 0; count < 3; count++) {
      const expected = app.document.documentElement.lang === 'ja' ? '英語に切り替え' : 'Switch to Japanese';
      assert.equal(app.el('languageButton').getAttribute('aria-label'), expected);
      assert.equal(app.el('languageButton').title, expected);
      app.el('languageButton').click();
    }
  });
  test(`${language}: Help open and close retain localized labels and tooltips`, async () => {
    const app = createApp(filename, { language }); await app.settle();
    for (let count = 0; count < 3; count++) {
      const japanese = app.document.documentElement.lang === 'ja';
      for (const [id, expected] of [['helpButton', japanese ? '使い方と注意事項' : 'How to use & notes'], ['closeHelpButton', japanese ? '閉じる' : 'Close']]) {
        assert.equal(app.el(id).getAttribute('aria-label'), expected);
        assert.equal(app.el(id).title, expected);
      }
      app.el('helpButton').click(); assert.equal(app.el('helpDialog').open, true);
      app.el('closeHelpButton').click(); assert.equal(app.el('helpDialog').open, false);
      app.el('helpButton').click(); app.el('helpDialog').dispatch('click', { clientX: -1, clientY: -1 });
      assert.equal(app.el('helpDialog').open, false);
      app.el('languageButton').click();
    }
  });
}
test('header fallback and embedded release metadata agree with canonical config', async () => {
  const html = loadHtml(filename);
  assert.match(config.version, /^\d+\.\d+\.\d+$/);
  assert.equal(html.match(/id="versionBadge">([^<]+)/)[1], `v${config.version}`);
  const app = createApp(filename); await app.settle();
  assert.equal(app.run('APP_CONFIG.version'), config.version);
  assert.equal(app.el('versionBadge').textContent, `v${config.version}`);
  if (!filename.endsWith('index.template.html')) assert.equal(app.run('BUILD_MANIFEST.app.version'), config.version);
});
