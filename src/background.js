// Fetches the raw text of a Drive file using the user's existing Drive session.
// This is the only network access the extension performs, and only to Google.
const MAX_BYTES = 5 * 1024 * 1024;
const FILE_ID = /^[\w-]{10,}$/;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !sender.url || !sender.url.startsWith('https://drive.google.com/')) return;
  if (!msg || msg.type !== 'fetch-file' || !FILE_ID.test(msg.fileId)) return;

  fetchFile(msg.fileId).then(sendResponse, (e) => sendResponse({ ok: false, error: 'Network error: ' + String(e.message || e) }));
  return true; // async response
});

async function fetchFile(fileId) {
  const url = 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(fileId);
  const res = await fetch(url, { credentials: 'include', redirect: 'follow' });
  if (!res.ok) return { ok: false, error: 'Drive returned HTTP ' + res.status };
  const type = res.headers.get('content-type') || '';
  if (type.includes('text/html')) {
    const host = new URL(res.url).hostname;
    return { ok: false, error: host === 'drive.google.com' || host === 'drive.usercontent.google.com'
      ? 'Drive returned a web page instead of the file (you may lack download permission, or downloads are disabled for this file).'
      : 'Redirected to ' + host + ' - are you signed in to Google?' };
  }
  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) return { ok: false, error: 'File is larger than 5 MB.' };
  return { ok: true, text: new TextDecoder('utf-8').decode(buf) };
}
