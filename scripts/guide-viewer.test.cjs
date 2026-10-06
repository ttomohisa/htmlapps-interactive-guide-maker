'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { createApp } = require('./guide-harness.cjs');
const { createViewer } = require('./guide-viewer-harness.cjs');
const filename = path.resolve(process.argv[2] || path.join(__dirname, '..', 'src/index.template.html'));
const cases = [], test = (name, fn) => cases.push({ name, fn });
const labels = { en: ['Expand all details', 'Collapse all details'], ja: ['すべての詳細を開く', 'すべての詳細を閉じる'] };
async function setup(language, count = 2) {
  const app = createApp(filename, { language }); await app.settle();
  const blocks = [{ id: 'plain', type: 'paragraph', text: 'visible-alpha' },
    ...Array.from({ length: count }, (_, i) => ({ id: 'detail-' + i, type: 'details', summary: 'Summary-' + i, text: 'hidden-omega-' + i })),
    { id: 'check', type: 'checklist', items: [{ id: 'item', text: 'Keep this check' }] },
    { id: 'tabs', type: 'tabs', activeTabId: 'first', panes: [
      { id: 'first', label: 'First', blocks: [{ id: 'nested-a', type: 'paragraph', text: 'first-content' }] },
      { id: 'second', label: 'Second', blocks: [{ id: 'nested-b', type: 'paragraph', text: 'nested-beta' }] },
    ] }];
  app.run(`state.document.title='Synthetic guide';state.document.blocks=${JSON.stringify(blocks)};renderAll();`);
  return { app, viewer: createViewer(app) };
}
function assertControl(viewer, language, allOpen) {
  const button = viewer.el('detailsButton'); assert.ok(button, 'bulk Details button exists');
  assert.equal(button.type, 'button'); assert.equal(button.textContent, labels[language][allOpen ? 1 : 0]);
  assert.equal(button.getAttribute('aria-expanded'), String(allOpen));
}
for (const language of ['en', 'ja']) {
  for (const query of ['hidden-omega-0', 'Summary-0']) test(`${language}: closed Details ${query} opens before search scroll`, async () => {
    const { viewer } = await setup(language); const [target, unrelated] = viewer.details();
    assert.equal(target.open, false); const results = viewer.search(query); assert.equal(results.length, 1); results[0].click();
    assert.equal(target.open, true); assert.equal(unrelated.open, false);
    assert.equal(viewer.scrolls.at(-1).id, target.id); assert.equal(viewer.scrolls.at(-1).open, true);
    assert.equal(viewer.el('searchResults').hidden, true); assert.ok(target.classList.contains('viewer-highlight'));
  });
  for (const count of [0, 1, 2, 12]) test(`${language}: show bulk Details control only for at least two (${count})`, async () => {
    const { app, viewer } = await setup(language, count);
    assert.equal(Boolean(viewer.el('detailsButton')), count >= 2);
    assert.equal(viewer.details().length, count); assert.ok(viewer.details().every(el => !el.open));
    if (count >= 2) assertControl(viewer, language, false);
    assert.equal(app.el('detailsButton'), null, 'editor/mobile preview must not gain the viewer control');
  });
  test(`${language}: repeated bulk clicks derive live state without scrolling or changing focus/source/checklists/Tabs`, async () => {
    const { app, viewer } = await setup(language, 12), button = viewer.el('detailsButton'); assert.ok(button);
    const source = app.run('serialize()'), stored = [...app.storage], payload = viewer.el('interactive-guide-source').textContent;
    const check = viewer.document.querySelector('input[type="checkbox"]'); check.checked = true;
    const second = viewer.document.querySelector('[data-pane-id="second"]');
    button.focus();
    for (const open of [true, false, true, false]) {
      button.click(); assert.ok(viewer.details().every(el => el.open === open)); assertControl(viewer, language, open);
      assert.equal(app.document.activeElement, button); assert.equal(viewer.scrolls.length, 0);
      assert.equal(check.checked, true); assert.equal(second.hidden, true);
    }
    viewer.flushToggles(); assertControl(viewer, language, false);
    assert.equal(app.run('serialize()'), source); assert.deepEqual([...app.storage], stored); assert.equal(viewer.el('interactive-guide-source').textContent, payload);
    button.click(); assert.ok(createViewer(app, viewer.html).details().every(el => !el.open), 'reopening starts closed');
  });
  test(`${language}: mixed state and individual native toggles keep the bulk label synchronized`, async () => {
    const { viewer } = await setup(language), details = viewer.details();
    details[0].querySelector('summary').click(); viewer.flushToggles(); assertControl(viewer, language, false);
    details[1].querySelector('summary').click(); viewer.flushToggles(); assertControl(viewer, language, true);
    details[0].querySelector('summary').click(); viewer.flushToggles(); assertControl(viewer, language, false);
    viewer.el('detailsButton').click(); assert.ok(details.every(el => el.open)); assertControl(viewer, language, true);
  });
  test(`${language}: search synchronizes bulk control immediately and works again after collapse`, async () => {
    const { viewer } = await setup(language); viewer.details()[1].open = true; viewer.flushToggles();
    viewer.search('hidden-omega-0')[0].click(); assertControl(viewer, language, true);
    viewer.el('detailsButton').click(); assert.ok(viewer.details().every(el => !el.open));
    viewer.search('hidden-omega-0')[0].click(); assertControl(viewer, language, false);
    assert.equal(viewer.details()[0].open, true); assert.equal(viewer.details()[1].open, false);
    viewer.flushToggles(); assertControl(viewer, language, false);
  });
  test(`${language}: already-open, ordinary, no-match and blank searches preserve unrelated Details`, async () => {
    const { viewer } = await setup(language); viewer.details().forEach(el => { el.open = true; });
    viewer.search('hidden-omega-0')[0].click(); assert.ok(viewer.details().every(el => el.open));
    viewer.details()[0].open = false; viewer.search('visible-alpha')[0].click();
    assert.equal(viewer.scrolls.at(-1).id, 'guide-block-1'); assert.equal(viewer.details()[0].open, false); assert.equal(viewer.details()[1].open, true);
    const scrollCount = viewer.scrolls.length;
    assert.equal(viewer.search('not-present').length, 0); assert.equal(viewer.document.querySelector('.search-empty').textContent, language === 'ja' ? '該当する内容がありません' : 'No matching content');
    viewer.search('   '); assert.equal(viewer.el('searchResults').hidden, true); assert.equal(viewer.scrolls.length, scrollCount);
  });
  test(`${language}: nested Tabs search retains activation and does not change Details`, async () => {
    const { viewer } = await setup(language); const second = viewer.document.querySelector('[data-pane-id="second"]'); assert.equal(second.hidden, true);
    const results = viewer.search('nested-beta'); results.find(el => el.querySelector('strong').textContent === 'Second').click();
    assert.equal(second.hidden, false); assert.equal(viewer.scrolls.at(-1).id, 'tabs-5-1-0'); assert.ok(viewer.details().every(el => !el.open));
  });
  test(`${language}: Export Preview and Save share Details behavior and exact schema-one source`, async () => {
    const { app } = await setup(language); const expected = app.run('JSON.stringify(buildEditableSourcePayload())');
    app.el('exportButton').click(); app.frame(1); app.el('previewExportButton').click(); app.el('downloadExportButton').click();
    const preview = await app.previews.at(-1).blob.text(), saved = await app.downloads.at(-1).blob.text(); assert.equal(preview, saved);
    for (const html of [preview, saved]) {
      const viewer = createViewer(app, html); assertControl(viewer, language, false); viewer.search('hidden-omega-0')[0].click(); assert.equal(viewer.details()[0].open, true);
      const payload = Buffer.from(viewer.el('interactive-guide-source').textContent, 'base64').toString('utf8'); assert.equal(payload, expected); assert.equal(JSON.parse(payload).schemaVersion, 1);
      assert.match(html, /connect-src 'none'/); assert.match(html, /@media print\{\.topbar,\.viewer-tools/);
      viewer.el('printButton').click(); assert.equal(viewer.printCount, 1);
    }
  });
  test(`${language}: Details text stays escaped and unsafe links stay inert through round trip`, async () => {
    const { app } = await setup(language);
    const hostile = '<img src=x onerror="alert(1)"> & <script>alert(1)</script>';
    app.run(`state.document.blocks[1].summary=${JSON.stringify(hostile)};state.document.blocks[1].text='[bad](javascript:alert(1))';`);
    const viewer = createViewer(app), details = viewer.details()[0]; assert.equal(details.querySelector('img'), null); assert.equal(details.querySelector('script'), null); assert.equal(details.querySelector('a'), null);
    const restored = app.run('parseEditableGuideHtml(generateStandaloneGuideHtml())'); assert.equal(restored.schemaVersion, 1); assert.equal(restored.document.blocks[1].summary, hostile);
    viewer.search('<img')[0].click(); assert.equal(details.open, true);
  });
}
(async () => {
  let failures = 0;
  for (const { name, fn } of cases) { try { await fn(); console.log('ok - ' + name); } catch (error) { failures++; console.error('not ok - ' + name + '\n' + error.stack); } }
  console.log(`${cases.length - failures}/${cases.length} generated-viewer tests passed: ${filename}`);
  if (failures) process.exitCode = 1;
})();
