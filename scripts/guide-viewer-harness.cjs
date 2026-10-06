'use strict';
// Run the actual emitted standalone viewer. DOM doubles do not replace browser QA.
const vm = require('node:vm');
function createViewer(app, html = app.run('generateStandaloneGuideHtml()')) {
  const parsed = new app.globals.DOMParser().parseFromString(html, 'text/html');
  const body = parsed.querySelector('body'), root = body.parentElement;
  const document = new app.document.constructor();
  Object.assign(document, { documentElement: root, body, head: parsed.querySelector('head'),
    querySelector: selector => root.querySelector(selector), querySelectorAll: selector => root.querySelectorAll(selector),
    getElementById: id => parsed.getElementById(id), createElement: app.document.createElement, execCommand: () => true, closest: () => null });
  root.parentElement = document; // Deliver bubbled clicks to viewer delegation.
  const scrolls = [], pendingToggles = new Set();
  app.globals.Element.prototype.appendChild = function(element) { this.append(element); return element; };
  app.globals.Element.prototype.scrollIntoView = function(options) { scrolls.push({ id: this.id, open: this.open, options }); };
  // Native Details queues/coalesces toggle events after changing its open property.
  document.querySelectorAll('details').forEach(details => {
    let open = details.open;
    Object.defineProperty(details, 'open', { get: () => open, set(value) {
      if (open !== Boolean(value)) { open = Boolean(value); pendingToggles.add(details); }
    } });
    details.querySelector('summary').addEventListener('click', () => { details.open = !details.open; });
  });
  let printCount = 0;
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  vm.runInNewContext(scripts.at(-1)[1], { document, window: { print() { printCount++; } }, navigator: {},
    CSS: app.globals.CSS, TextDecoder, Uint8Array, atob: app.globals.atob, setTimeout: () => 0 });
  return { html, document, scrolls, get printCount() { return printCount; },
    el: id => document.getElementById(id), details: () => document.querySelectorAll('details.guide-details'),
    flushToggles() { const queued = [...pendingToggles]; pendingToggles.clear(); queued.forEach(details => details.dispatch('toggle')); },
    search(value) { const search = document.getElementById('guideSearch'); search.value = value; search.dispatch('input'); return document.querySelectorAll('.search-result'); },
  };
}
module.exports = { createViewer };
