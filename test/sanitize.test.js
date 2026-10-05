const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { createRenderer } = require('../src/render.js');

// Load the exact vendored libraries that ship in the extension.
const { window } = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only' });
for (const f of ['marked.min.js', 'purify.min.js']) {
  window.eval(fs.readFileSync(path.join(__dirname, '..', 'vendor', f), 'utf8'));
}
const r = createRenderer({ marked: window.marked, DOMPurify: window.DOMPurify, document: window.document });

function dom(md, opts) {
  const d = new JSDOM('<body></body>').window.document;
  d.body.innerHTML = r.toSafeHtml(md, opts);
  return d;
}

test('renders GFM: headings, tables, task lists, code', () => {
  const d = dom('# Hi\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] done\n\n```js\nlet x = 1;\n```');
  assert.ok(d.querySelector('h1'));
  assert.ok(d.querySelector('table td'));
  assert.ok(d.querySelector('input[type=checkbox]'));
  assert.ok(d.querySelector('pre code'));
});

test('strips script, event handlers, iframes, forms, styles', () => {
  const d = dom('<script>alert(1)</script><img src=x onerror=alert(1)><iframe src="https://x"></iframe>' +
    '<form action="https://x"><input name=a></form><style>*{display:none}</style><p style="color:red" onclick="x()">t</p>' +
    '<svg onload=alert(1)></svg><object data="x"></object>');
  assert.strictEqual(d.querySelectorAll('script, iframe, form, style, svg, object').length, 0);
  assert.ok(![...d.querySelectorAll('*')].some((el) => [...el.attributes].some((a) => /^on|^style$/.test(a.name))));
});

test('removes dangerous link schemes and hardens real links', () => {
  const d = dom('[a](javascript:alert(1)) [b](data:text/html,<script>1</script>) [c](vbscript:x) [ok](https://example.com) <a href="./rel.md">r</a>');
  const hrefs = [...d.querySelectorAll('a')].map((a) => a.getAttribute('href'));
  assert.ok(hrefs.every((h) => h === null || h === 'https://example.com'));
  const ok = d.querySelector('a[href^="https"]');
  assert.strictEqual(ok.getAttribute('target'), '_blank');
  assert.match(ok.getAttribute('rel'), /noopener/);
});

test('blocks remote images by default, allows https when enabled', () => {
  const md = '![logo](https://tracker.example/p.gif)';
  assert.strictEqual(dom(md).querySelectorAll('img').length, 0);
  assert.match(dom(md).body.textContent, /image blocked: logo/);
  assert.strictEqual(dom(md, { allowRemoteImages: true }).querySelectorAll('img').length, 1);
  assert.strictEqual(dom('![x](http://insecure.example/a.png)', { allowRemoteImages: true }).querySelectorAll('img').length, 0);
});

test('keeps inline raster data images, drops svg data images', () => {
  const png = 'data:image/png;base64,iVBORw0KGgo=';
  assert.strictEqual(dom('![p](' + png + ')').querySelectorAll('img').length, 1);
  assert.strictEqual(dom('<img src="data:image/svg+xml;base64,PHN2Zz4=">').querySelectorAll('img').length, 0);
});

test('preview document carries a restrictive CSP', () => {
  const strict = r.buildPreviewDoc('x');
  assert.match(strict, /default-src 'none'/);
  assert.doesNotMatch(strict, /img-src[^"]*https:/);
  assert.match(r.buildPreviewDoc('x', { allowRemoteImages: true }), /img-src data: https:/);
});
