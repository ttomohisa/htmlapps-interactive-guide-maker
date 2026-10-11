'use strict';
// Source/decoded-release CSS contracts and real application behavior, not a layout engine.
// Native viewport geometry, wheel/touch behavior and focus trapping remain browser QA gates.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { createApp, loadHtml } = require('./guide-harness.cjs');
const root = path.join(__dirname, '..');
const filename = path.resolve(process.argv[2] || path.join(root, 'src/index.template.html'));
const html = loadHtml(filename);
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selectors, body]) => ({
  selectors: selectors.trim().split(',').map(value => value.trim()),
  declarations: Object.fromEntries(body.split(';').map(value => value.trim()).filter(Boolean).map(value => {
    const colon = value.indexOf(':'); return [value.slice(0, colon).trim(), value.slice(colon + 1).trim()];
  }))
}));
const declarations = selector => Object.assign({}, ...rules.filter(rule => rule.selectors.includes(selector)).map(rule => rule.declarations));
const property = (selector, name, expected) => assert.equal(declarations(selector)[name], expected, `${selector}: ${name}`);

test('only modal dialogs lock both root and body scrolling', () => {
  for (const selector of ['html:has(dialog:modal)', 'body:has(dialog:modal)']) {
    property(selector, 'overflow', 'hidden');
    property(selector, 'overscroll-behavior', 'none');
  }
  assert.equal(rules.some(rule => rule.selectors.some(selector => /^(?:html|body):has\(dialog\[open\]\)$/.test(selector))), false, 'nonmodal show() must not acquire the page lock');
});

test('confirmation has a safe-area-aware viewport budget and an open-only flex shell', () => {
  property('.app-confirm-dialog[open]', 'display', 'flex');
  property('.app-confirm-dialog[open]', 'flex-direction', 'column');
  const bounds = rules.filter(rule => rule.selectors.includes('.app-confirm-dialog')).map(rule => rule.declarations['max-height']).filter(Boolean);
  assert.ok(bounds.length >= 2, 'desktop and mobile confirmation bounds');
  for (const bound of bounds) assert.match(bound, /100dvh.*safe-area-inset-top/);
  property('.app-confirm-dialog', 'overflow', 'hidden');
  assert.equal(declarations('.app-confirm-dialog').display, undefined, 'closed confirmation stays native-hidden');
});

test('confirmation reserves the header and scrolls its message and action buttons together', () => {
  property('.app-confirm-header', 'flex', '0 0 auto');
  property('.app-confirm-body', 'flex', '1 1 auto');
  property('.app-confirm-body', 'min-height', '0');
  property('.app-confirm-body', 'overflow', 'auto');
  property('.app-confirm-body', 'overscroll-behavior', 'contain');
  assert.match(declarations('.app-confirm-body').padding, /safe-area-inset-bottom/);
  const body = html.match(/<div class="app-confirm-body">([\s\S]*?)<\/dialog>/)[1];
  for (const id of ['appConfirmMessage', 'appConfirmCancel', 'appConfirmOk']) assert.ok(body.includes(`id="${id}"`));
});

test('mobile block sheet allocates the remaining height to its own scroller', () => {
  property('.mobile-block-sheet[open]', 'display', 'flex');
  property('.mobile-block-sheet[open]', 'flex-direction', 'column');
  assert.match(declarations('.mobile-block-sheet')['max-height'] || '', /100dvh.*safe-area-inset-top/);
  property('.mobile-block-sheet-head', 'flex', '0 0 auto');
  property('.mobile-block-sheet-body', 'flex', '1 1 auto');
  property('.mobile-block-sheet-body', 'min-height', '0');
  property('.mobile-block-sheet-body', 'overflow', 'auto');
  property('.mobile-block-sheet-body', 'overscroll-behavior', 'contain');
  assert.match(declarations('.mobile-block-sheet-body').padding, /safe-area-inset-bottom/);
  assert.equal(declarations('.mobile-block-sheet').display, undefined, 'closed picker stays native-hidden');
});

test('working Help, Settings and Export geometry and existing shield artwork are preserved', () => {
  property('.dialog-body', 'max-height', 'calc(100dvh - 120px)');
  property('.dialog-body', 'overflow', 'auto');
  for (const selector of ['#helpDialog', '#settingsDialog', '#exportDialog']) {
    property(selector, 'overflow', 'hidden');
    assert.equal(declarations(`${selector}[open]`).display, undefined, `${selector} shell is not redesigned`);
  }
  assert.ok(html.includes('M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6z'));
  assert.ok(html.includes('m9 12 2 2 4-5'));
});

test('bilingual Help describes the bounded dialog body and background lock', async () => {
  assert.match(html, /APP:HELP:BEGIN[\s\S]*data-i18n="helpNoteDialogs"[\s\S]*APP:HELP:END/);
  for (const language of ['ja', 'en']) {
    const app = createApp(filename, { language }); await app.settle();
    const text = app.run('t("helpNoteDialogs")');
    assert.notEqual(text, 'helpNoteDialogs');
    assert.match(text, language === 'ja' ? /背景.*スクロール/ : /background.*scroll/i);
  }
});

test('canonical checker runs dialog regressions on source and every generated variant', () => {
  const checker = fs.readFileSync(path.join(root, 'scripts/check-repository.ps1'), 'utf8');
  assert.equal((checker.match(/scripts\\guide-dialog-layout\.test\.cjs/g) || []).length, 2);
  assert.match(checker, /foreach \(\$relative in @\("dist\\index.html", "dist\\index.self-extract.html", "interactive-guide-maker.html"\)\)/);
  assert.match(checker, /Guide source dialog layout checks failed/);
  assert.match(checker, /Guide dialog layout checks failed: \$relative/);
});

for (const language of ['ja', 'en']) {
  test(`${language}: confirmation cancellation resolves once, returns focus and can reopen`, async () => {
    const app = createApp(filename, { language }); await app.settle();
    const trigger = app.el('startBlankButton');
    for (const route of ['close', 'cancel', 'escape', 'backdrop']) {
      trigger.focus(); let resolutions = 0;
      const pending = app.window.AppConfirm.ask({ message: 'Synthetic confirmation' }).then(result => { resolutions++; return result; });
      app.frame(1);
      assert.equal(app.document.activeElement, app.el('appConfirmCancel'));
      if (route === 'close') app.el('appConfirmClose').click();
      if (route === 'cancel') app.el('appConfirmCancel').click();
      if (route === 'escape') assert.equal(app.el('appConfirmDialog').dispatch('cancel').defaultPrevented, true);
      if (route === 'backdrop') app.el('appConfirmDialog').dispatch('click', { clientX: -1, clientY: -1 });
      assert.equal(await pending, false);
      assert.equal(resolutions, 1);
      assert.equal(app.el('appConfirmDialog').open, false);
      assert.equal(app.document.activeElement, trigger);
    }
  });

  test(`${language}: mobile picker retains all eleven choices and closes after a selection`, async () => {
    const app = createApp(filename, { language, mobile: true }); await app.settle();
    app.el('startBlankButton').click(); await app.settle();
    app.el('mobileAddBlockButton').click();
    assert.equal(app.el('mobileBlockSheet').open, true);
    const choices = app.el('mobileBlockChoices').querySelectorAll('button');
    assert.equal(choices.length, 11);
    assert.equal(choices.at(-1).dataset.type, 'divider');
    choices.at(-1).click(); await app.settle();
    assert.equal(app.el('mobileBlockSheet').open, false);
    assert.equal(app.run('state.document.blocks.at(-1).type'), 'divider');
    app.el('mobileAddBlockButton').click(); app.el('closeMobileBlockSheet').click();
    assert.equal(app.el('mobileBlockSheet').open, false);
  });
}
