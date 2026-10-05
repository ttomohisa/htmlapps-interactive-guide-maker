'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { createApp } = require('./guide-harness.cjs');
const filename = path.resolve(process.argv[2] || path.join(__dirname, '..', 'src/index.template.html'));
const cases = [];
const test = (name, fn) => cases.push({ name, fn });
const snapshot = app => app.run('serialize()');
const history = app => app.run('JSON.stringify([historyPast, historyFuture])');
const field = app => app.document.querySelector('textarea.block-textarea');
const key = (app, value, modifier = 'ctrlKey', extra = {}) => app.document.dispatch('keydown', { key: value, [modifier]: true, target: app.document.activeElement, ...extra });
async function setup(language = 'en', options = {}) {
  const app = createApp(filename, { language, ...options });
  await app.settle();
  app.el('startBlankButton').click(); await app.settle();
  app.input(app.el('documentTitle'), 'Guide QA');
  app.el('addParagraphButton').click(); app.frame(1);
  app.input(field(app), 'Alpha instructions'); app.run('flushHistory()');
  app.flushTimers(); await app.settle();
  return app;
}
function openExport(app) { app.el('exportButton').click(); app.frame(2); }
function editFilename(app, value = 'qa-guide-edited') { app.input(app.el('exportFilenameBase'), value); }
async function payload(blob) {
  const html = await blob.text();
  const source = html.match(/<script type="application\/json" id="interactive-guide-source" data-encoding="base64">([^<]+)<\/script>/);
  assert.ok(source, 'download must include editable source');
  return { html, data: JSON.parse(Buffer.from(source[1], 'base64').toString('utf8')) };
}
const dialogs = {
  exportDialog: app => openExport(app),
  helpDialog: app => app.el('helpButton').click(),
  settingsDialog: app => app.el('settingsButton').click(),
  mobileBlockSheet: app => app.el('mobileAddBlockButton').click(),
  appConfirmDialog: app => app.run("AppConfirm.ask({ title: 'Replace guide?', message: 'Synthetic test' })"),
};
for (const language of ['ja', 'en']) {
  for (const [dialogId, open] of Object.entries(dialogs)) {
    for (const modifier of ['ctrlKey', 'metaKey']) {
      for (const [shortcut, extra] of [['z', {}], ['z', { shiftKey: true }], ['y', {}]]) {
        test(`${language}: ${dialogId} owns ${modifier}+${extra.shiftKey ? 'Shift+' : ''}${shortcut}`, async () => {
          const app = await setup(language);
          if (shortcut === 'y' || extra.shiftKey) { app.el('undoButton').click(); app.flushTimers(); await app.settle(); }
          open(app); app.frame(3);
          if (dialogId === 'exportDialog') editFilename(app);
          const before = snapshot(app), beforeHistory = history(app), beforeStorage = [...app.storage];
          const event = key(app, shortcut, modifier, extra);
          assert.equal(snapshot(app), before, 'dialog keyboard input must not alter guide');
          assert.equal(history(app), beforeHistory, 'guide history must stay unchanged');
          assert.equal(event.defaultPrevented, false, 'leave native input Undo/Redo available');
          app.flushTimers(); await app.settle();
          assert.deepEqual([...app.storage], beforeStorage, 'dialog history shortcut must not autosave a changed guide');
        });
      }
      test(`${language}: ${dialogId} suppresses ${modifier}+S without opening another modal`, async () => {
        const app = await setup(language); open(app); app.frame(3);
        if (dialogId === 'exportDialog') { editFilename(app); app.el('exportFilenameBase').setSelectionRange(2, 4); }
        const before = snapshot(app), shown = app.el(dialogId).showCount;
        assert.equal(key(app, 's', modifier).defaultPrevented, true);
        assert.equal(snapshot(app), before);
        assert.equal(app.el(dialogId).showCount, shown, 'do not reopen/reset the active dialog');
        assert.equal(app.el('exportDialog').open, dialogId === 'exportDialog');
        if (dialogId === 'exportDialog') {
          assert.equal(app.el('exportFilenameBase').value, 'qa-guide-edited');
          assert.equal(app.el('exportFilenameBase').selectionStart, 2);
        }
      });
    }
    test(`${language}: ${dialogId} Escape stays with native dialog cancellation`, async () => {
      const app = await setup(language); open(app); app.frame(3); const before = snapshot(app);
      const event = app.document.dispatch('keydown', { key: 'Escape', target: app.document.activeElement });
      assert.equal(event.defaultPrevented, false);
      const dialog = app.el(dialogId), cancel = dialog.dispatch('cancel');
      if (!cancel.defaultPrevented) dialog.close();
      assert.equal(dialog.open, false); assert.equal(snapshot(app), before);
    });
  }
  test(`${language}: ordinary editor Undo/Redo and autosave still work after dialog closes`, async () => {
    const app = await setup(language); openExport(app); app.el('exportCancelButton').click();
    field(app).focus(); key(app, 'z'); assert.equal(app.run('state.document.blocks[0].text'), '');
    app.flushTimers(); await app.settle();
    const stored = JSON.parse(app.storage.get('interactive-guide-maker:draft:v1'));
    assert.equal(stored.document.blocks[0].text, '');
    key(app, 'z', 'metaKey', { shiftKey: true });
    assert.equal(app.run('state.document.blocks[0].text'), 'Alpha instructions');
    app.flushTimers(); await app.settle();
    const restored = createApp(filename, { storage: [...app.storage], language }); await restored.settle();
    assert.equal(restored.run('state.document.blocks[0].text'), 'Alpha instructions');
  });
  test(`${language}: repeated cancel/close/reopen preserves an edited filename and changed title`, async () => {
    const app = await setup(language); openExport(app); editFilename(app);
    for (const closeId of ['exportCancelButton', 'closeExportButton', 'exportCancelButton']) {
      app.el(closeId).click(); app.input(app.el('documentTitle'), 'Updated guide'); openExport(app);
      assert.equal(app.el('exportFilenameBase').value, 'qa-guide-edited');
    }
    app.el('previewExportButton').click(); app.el('downloadExportButton').click();
    assert.equal(app.el('exportFilenameBase').value, 'qa-guide-edited');
    assert.equal(app.downloads.at(-1).name, 'qa-guide-edited.html');
  });
  test(`${language}: untouched default name follows title changes`, async () => {
    const app = await setup(language); openExport(app); assert.equal(app.el('exportFilenameBase').value, 'Guide-QA');
    app.el('closeExportButton').click(); app.input(app.el('documentTitle'), 'Updated guide'); openExport(app);
    assert.equal(app.el('exportFilenameBase').value, 'Updated-guide');
  });
  test(`${language}: preview/save regenerate current content and identical editable source`, async () => {
    const app = await setup(language); openExport(app); editFilename(app);
    // A pending application update may complete after the dialog's initial snapshot.
    app.input(field(app), 'Beta current content');
    app.el('previewExportButton').click();
    const preview = await payload(app.previews.at(-1).blob);
    assert.equal(preview.data.document.blocks[0].text, 'Beta current content');
    app.input(field(app), 'Gamma latest content');
    app.el('downloadExportButton').click();
    const saved = await payload(app.downloads.at(-1).blob);
    assert.equal(saved.data.document.blocks[0].text, 'Gamma latest content');
    assert.ok(saved.html.includes('<p>Gamma latest content</p>'));
    assert.equal(app.downloads.at(-1).name, 'qa-guide-edited.html');
    assert.equal(app.el('exportSizeValue').textContent, app.run(`formatBytes(${app.downloads.at(-1).blob.size})`));
  });
  test(`${language}: cancelling replacement keeps name; confirmed new guide resets it`, async () => {
    const app = await setup(language); openExport(app); editFilename(app); app.el('closeExportButton').click();
    app.el('startBlankButton').click(); await app.settle(); app.el('appConfirmCancel').click(); await app.settle();
    openExport(app); assert.equal(app.el('exportFilenameBase').value, 'qa-guide-edited'); app.el('closeExportButton').click();
    app.el('startBlankButton').click(); await app.settle(); app.el('appConfirmOk').click(); await app.settle();
    openExport(app); assert.equal(app.el('exportFilenameBase').value, 'guide');
  });
}
for (const language of ['ja', 'en']) {
  test(`${language}: reimporting the same document ID resets its old edited filename`, async () => {
    const app = await setup(language); openExport(app); editFilename(app); app.el('downloadExportButton').click();
    const html = await app.downloads.at(-1).blob.text(); app.el('closeExportButton').click();
    app.globals.importFile = new File([html], 'reopened.html', { type: 'text/html' });
    const promise = app.run('importGuideHtmlFile(importFile)'); await app.settle();
    app.el('appConfirmOk').click(); await promise;
    openExport(app); assert.equal(app.el('exportFilenameBase').value, 'Guide-QA');
    assert.equal(app.run('state.document.blocks[0].text'), 'Alpha instructions');
  });
  test(`${language}: cancelled import and rejected HTML preserve the current name and guide`, async () => {
    const app = await setup(language); openExport(app); editFilename(app); app.el('downloadExportButton').click();
    const html = await app.downloads.at(-1).blob.text(), before = snapshot(app); app.el('closeExportButton').click();
    app.globals.importFile = new File([html], 'reopened.html');
    const pending = app.run('importGuideHtmlFile(importFile)'); await app.settle(); app.el('appConfirmCancel').click(); await pending;
    app.globals.importFile = new File(['<html>Invalid</html>'], 'invalid.html'); await app.run('importGuideHtmlFile(importFile)');
    openExport(app); assert.equal(app.el('exportFilenameBase').value, 'qa-guide-edited'); assert.equal(snapshot(app), before);
  });
  test(`${language}: all confirmed starter templates reset a deliberately edited name`, async () => {
    for (const kind of ['operation', 'inspection', 'troubleshooting']) {
      const app = await setup(language); openExport(app); editFilename(app); app.el('closeExportButton').click();
      const pending = app.run(`replaceWithStarter('${kind}')`); await app.settle(); app.el('appConfirmOk').click(); await pending;
      openExport(app); assert.equal(app.el('exportFilenameBase').value, app.run('suggestedFileBase()'));
      assert.notEqual(app.el('exportFilenameBase').value, 'qa-guide-edited');
      assert.ok(app.run('state.document.blocks.length') > 0);
    }
  });
  test(`${language}: noopener null return is not reported as a failed preview`, async () => {
    const app = await setup(language); openExport(app); editFilename(app); const before = snapshot(app), calls = [];
    app.window.open = (...args) => { calls.push(args); return null; };
    app.el('previewExportButton').click();
    assert.equal(calls.length, 1); assert.equal(calls[0][1], '_blank'); assert.equal(calls[0][2], 'noopener');
    assert.equal(app.el('appToastMessage').textContent, app.run("t('exportPreviewHint')"));
    assert.equal(snapshot(app), before); assert.equal(app.el('exportFilenameBase').value, 'qa-guide-edited');
  });
  test(`${language}: failed generation cannot download or preview a previous snapshot`, async () => {
    const app = await setup(language); openExport(app); editFilename(app); app.el('previewExportButton').click();
    const previewCount = app.previews.length, downloadCount = app.downloads.length;
    const errors = []; app.globals.console = { ...console, error: error => errors.push(error) };
    app.run("generateStandaloneGuideHtml = () => { throw new Error('Synthetic generation failure'); }");
    app.el('downloadExportButton').click(); app.el('previewExportButton').click();
    assert.equal(app.previews.length, previewCount); assert.equal(app.downloads.length, downloadCount);
    assert.equal(errors.length, 2); assert.equal(app.el('exportFilenameBase').value, 'qa-guide-edited');
  });
  test(`${language}: mobile sheet keyboard cannot undo, and selecting a block still works`, async () => {
    const app = await setup(language, { mobile: true }); app.el('mobileAddBlockButton').click();
    const before = snapshot(app); key(app, 'z'); assert.equal(snapshot(app), before);
    app.document.querySelector('.mobile-block-choice[data-type="paragraph"]').click();
    assert.equal(app.el('mobileBlockSheet').open, false); assert.equal(app.run('state.document.blocks.length'), 2);
  });
}
for (const [input, expected] of [['named.html','named.html'],['named.HTML.html','named.html'],['a/b\\c:\u0000?*.html','a-b-c-.html'],['   ','interactive-guide-maker.html'],['...','interactive-guide-maker.html']]) {
  test(`filename ${JSON.stringify(input)} saves safely with exactly one extension`, async () => {
    const app = await setup(); openExport(app); editFilename(app, input); app.el('downloadExportButton').click();
    assert.equal(app.downloads.at(-1).name, expected);
    assert.equal(app.el('exportFilenameBase').value, input, 'do not rewrite a live filename field');
  });
}
test('handled and composing key events do not trigger editor shortcuts', async () => {
  const app = await setup(); const before = snapshot(app);
  key(app, 'z', 'ctrlKey', { defaultPrevented: true }); assert.equal(snapshot(app), before);
  key(app, 'z', 'ctrlKey', { isComposing: true }); assert.equal(snapshot(app), before);
});
(async () => {
  let failures = 0;
  for (const { name, fn } of cases) {
    try { await fn(); console.log(`ok - ${name}`); }
    catch (error) { failures++; console.error(`not ok - ${name}\n${error.stack}`); }
  }
  console.log(`${cases.length - failures}/${cases.length} behavior tests passed: ${filename}`);
  if (failures) process.exitCode = 1;
})();
