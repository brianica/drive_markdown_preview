// Runs on drive.google.com. Detects when a Markdown file is open and overlays
// the extension's viewer iframe (src/viewer.html). Drive is a single-page app,
// so we re-check on title/URL changes.
(() => {
  const VIEWER_URL = chrome.runtime.getURL('src/viewer.html');
  const VIEWER_ORIGIN = new URL(VIEWER_URL).origin;
  const { fileIdFromUrl, fileNameFromPage, isMarkdownName } = DMP_detect;

  let current = null;          // { fileId, iframe, dirty }
  let dismissed = null;        // fileId the user switched back to Drive's view
  let pill = null;
  let forced = null;           // fileId the user forced a preview for (any extension)
  let lastFetch = 'not attempted';
  let lastLog = '';

  function log(msg) {
    if (msg === lastLog) return;
    lastLog = msg;
    console.log('[DMP] ' + msg);
  }

  function check() {
    const id = fileIdFromUrl(location.href);
    const name = fileNameFromPage(document);
    const want = id && (isMarkdownName(name) || forced === id) ? id : null;
    log(id ? 'file id ' + id + ', name "' + name + '", markdown=' + !!want : 'not a Drive file page (' + location.pathname + ')');
    if ((current && current.fileId) === want) return;
    if (current && current.dirty && !confirm('Discard unsaved edits in the Markdown preview?')) {
      history.back();
      return;
    }
    unmount();
    removePill();
    if (!want) { dismissed = null; return; }
    if (dismissed === want) showPill(want); else mount(want);
  }

  function mount(fileId) {
    const iframe = document.createElement('iframe');
    iframe.src = VIEWER_URL;
    iframe.title = 'Markdown preview';
    iframe.allow = 'clipboard-write';
    iframe.style.cssText = 'position:fixed;top:56px;left:0;right:0;bottom:0;width:100%;height:calc(100% - 56px);' +
      'border:0;z-index:2000;background:Canvas;color-scheme:light dark';
    document.body.appendChild(iframe);
    current = { fileId, iframe, dirty: false };
  }

  function unmount() {
    if (current) current.iframe.remove();
    current = null;
  }

  function showPill(fileId) {
    pill = document.createElement('button');
    pill.textContent = 'Markdown preview';
    pill.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2000;padding:8px 14px;border:0;' +
      'border-radius:20px;background:#1a73e8;color:#fff;font:500 14px sans-serif;cursor:pointer;box-shadow:0 2px 6px #0004';
    pill.addEventListener('click', () => { dismissed = null; removePill(); mount(fileId); });
    document.body.appendChild(pill);
  }

  function removePill() {
    if (pill) pill.remove();
    pill = null;
  }

  function post(msg) {
    if (current) current.iframe.contentWindow.postMessage(msg, VIEWER_ORIGIN);
  }

  async function sendFile() {
    const { fileId } = current;
    const filename = fileNameFromPage(document) || 'file.md';
    let res;
    try {
      res = await chrome.runtime.sendMessage({ type: 'fetch-file', fileId });
    } catch (e) {
      res = { ok: false, error: String(e.message || e) };
    }
    lastFetch = res && res.ok ? 'ok (' + res.text.length + ' chars)' : 'failed: ' + ((res && res.error) || 'unknown');
    log('fetch ' + lastFetch);
    if (!current || current.fileId !== fileId) return;
    post(res && res.ok ? { type: 'content', text: res.text, filename }
                       : { type: 'error', message: (res && res.error) || 'Unknown error', filename });
  }

  window.addEventListener('message', (e) => {
    // Only trust messages from our own viewer iframe.
    if (!current || e.source !== current.iframe.contentWindow || e.origin !== VIEWER_ORIGIN) return;
    const msg = e.data || {};
    if (msg.type === 'ready') sendFile();
    else if (msg.type === 'dirty') current.dirty = !!msg.dirty;
    else if (msg.type === 'close') { dismissed = current.fileId; current.dirty = false; const id = current.fileId; unmount(); showPill(id); }
  });

  window.addEventListener('beforeunload', (e) => {
    if (current && current.dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id || !msg) return;
    if (msg.type === 'dmp-status') {
      sendResponse({
        url: location.href, title: document.title, fileId: fileIdFromUrl(location.href),
        name: fileNameFromPage(document), mounted: !!current, forced: !!forced, lastFetch
      });
    } else if (msg.type === 'dmp-force') {
      const id = fileIdFromUrl(location.href);
      if (id) { forced = id; dismissed = null; check(); }
      sendResponse({ ok: !!id });
    }
  });

  new MutationObserver(check).observe(document.head, { childList: true, subtree: true, characterData: true });
  setInterval(check, 1000);
  check();
})();
