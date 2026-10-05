// Viewer UI (extension page). Receives the file text from the content script,
// renders it into a sandboxed iframe, and offers Raw / Edit / Copy / Download.
// Edits never leave the browser.
(() => {
  const PARENT_ORIGIN = 'https://drive.google.com';
  const $ = (id) => document.getElementById(id);
  const renderer = DMP_render.createRenderer({ marked: window.marked, DOMPurify: window.DOMPurify, document });

  let original = '';
  let filename = 'file.md';
  let allowRemoteImages = false;
  let timer = null;

  const editor = $('editor');
  const toParent = (msg) => parent.postMessage(msg, PARENT_ORIGIN);

  function renderPreview() {
    $('preview').srcdoc = renderer.buildPreviewDoc(editor.value, { allowRemoteImages });
  }

  function setMode(mode) {
    $('panes').dataset.mode = mode;
    for (const m of ['preview', 'raw', 'edit']) $('btn-' + m).classList.toggle('active', m === mode);
    if (mode === 'raw') $('raw').textContent = editor.value;
  }

  function setDirty() {
    const dirty = editor.value !== original;
    $('status').textContent = dirty ? 'Edited locally (not saved to Drive)' : '';
    toParent({ type: 'dirty', dirty });
  }

  function showError(message) {
    const esc = message.replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');
    $('preview').srcdoc = '<!doctype html><meta charset="utf-8"><body style="font:15px sans-serif;padding:24px;color-scheme:light dark">' +
      "<h3>Couldn't load this file</h3><p>" + esc + '</p></body>';
    $('status').textContent = 'Load failed';
  }

  $('btn-preview').onclick = () => setMode('preview');
  $('btn-raw').onclick = () => setMode('raw');
  $('btn-edit').onclick = () => { setMode('edit'); editor.focus(); };
  $('btn-close').onclick = () => toParent({ type: 'close' });

  $('btn-copy').onclick = async () => {
    try { await navigator.clipboard.writeText(editor.value); }
    catch (e) { editor.select(); document.execCommand('copy'); }
    $('status').textContent = 'Copied';
  };

  $('btn-download').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([editor.value], { type: 'text/markdown;charset=utf-8' }));
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  editor.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(renderPreview, 150);
    setDirty();
  });

  window.addEventListener('message', (e) => {
    if (e.source !== parent || e.origin !== PARENT_ORIGIN) return;
    const msg = e.data || {};
    if (msg.filename) filename = msg.filename;
    if (msg.type === 'content') {
      original = editor.value = String(msg.text);
      renderPreview();
      if ($('panes').dataset.mode === 'raw') $('raw').textContent = original;
    } else if (msg.type === 'error') {
      showError(String(msg.message));
    }
  });

  chrome.storage.sync.get({ allowRemoteImages: false }).then((s) => {
    allowRemoteImages = !!s.allowRemoteImages;
  }).finally(() => toParent({ type: 'ready' }));
})();
