// Markdown -> sanitized HTML. The renderer is built from injected `marked`,
// `DOMPurify` and `document` so the exact same code runs in the viewer page and
// in the Node tests (against the vendored libraries).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DMP_render = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const SAFE_LINK = /^(?:https?:|mailto:|#)/i;
  const DATA_IMAGE = /^data:image\/(?:png|jpe?g|gif|webp);/i;
  const HTTPS = /^https:\/\//i;

  const PREVIEW_CSS = `
:root { color-scheme: light dark; }
body { font: 16px/1.6 -apple-system, "Segoe UI", Roboto, sans-serif; max-width: 860px; margin: 0 auto; padding: 24px 32px 64px; color: #1f2328; background: #fff; word-wrap: break-word; }
h1, h2 { border-bottom: 1px solid #d0d7de; padding-bottom: .3em; }
h1, h2, h3, h4 { margin: 1.4em 0 .6em; line-height: 1.25; }
a { color: #0969da; }
code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 85%; }
code { background: #afb8c133; padding: .2em .4em; border-radius: 6px; }
pre { background: #f6f8fa; padding: 16px; overflow: auto; border-radius: 6px; line-height: 1.45; }
pre code { background: none; padding: 0; }
blockquote { margin: 0; padding: 0 1em; color: #59636e; border-left: .25em solid #d0d7de; }
table { border-collapse: collapse; display: block; overflow: auto; }
th, td { border: 1px solid #d0d7de; padding: 6px 13px; }
tr:nth-child(2n) { background: #f6f8fa; }
img { max-width: 100%; }
hr { border: 0; border-top: 1px solid #d0d7de; }
.blocked-image { color: #59636e; font-style: italic; }
@media (prefers-color-scheme: dark) {
  body { color: #e6edf3; background: #0d1117; }
  h1, h2, th, td, hr { border-color: #30363d; }
  a { color: #4493f8; }
  pre, tr:nth-child(2n) { background: #161b22; }
  blockquote { color: #9198a1; border-color: #30363d; }
  .blocked-image { color: #9198a1; }
}`;

  function createRenderer({ marked, DOMPurify, document }) {
    function toSafeHtml(md, opts) {
      const allowRemoteImages = !!(opts && opts.allowRemoteImages);
      const raw = marked.parse(String(md), { gfm: true, async: false });
      const body = DOMPurify.sanitize(raw, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ['style', 'form', 'button', 'textarea', 'select', 'option',
          'iframe', 'object', 'embed', 'link', 'meta', 'base', 'picture', 'source'],
        FORBID_ATTR: ['style', 'srcset'],
        RETURN_DOM: true
      });

      for (const a of body.querySelectorAll('a')) {
        const href = a.getAttribute('href') || '';
        if (SAFE_LINK.test(href)) {
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
        } else {
          a.removeAttribute('href');
        }
      }
      for (const img of body.querySelectorAll('img')) {
        const src = img.getAttribute('src') || '';
        if (DATA_IMAGE.test(src) || (allowRemoteImages && HTTPS.test(src))) {
          img.setAttribute('referrerpolicy', 'no-referrer');
          continue;
        }
        const note = document.createElement('span');
        note.className = 'blocked-image';
        note.textContent = '[image blocked' + (img.alt ? ': ' + img.alt : '') + ']';
        img.replaceWith(note);
      }
      return body.innerHTML;
    }

    // Full document for the sandboxed preview iframe (srcdoc). The meta CSP is
    // a second layer: no scripts, no network except (optionally) https images.
    function buildPreviewDoc(md, opts) {
      const allow = !!(opts && opts.allowRemoteImages);
      const csp = "default-src 'none'; style-src 'unsafe-inline'; img-src data:" + (allow ? ' https:' : '');
      return '<!doctype html><html><head><meta charset="utf-8">' +
        '<meta http-equiv="Content-Security-Policy" content="' + csp + '">' +
        '<style>' + PREVIEW_CSS + '</style></head><body>' +
        toSafeHtml(md, opts) + '</body></html>';
    }

    return { toSafeHtml, buildPreviewDoc };
  }

  return { createRenderer };
});
