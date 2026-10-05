// Fetches the raw text of a Drive file using the user's existing Drive session.
// This is the only network access the extension performs, and only to Google.
const MAX_BYTES = 5 * 1024 * 1024;
const FILE_ID = /^[\w-]{10,}$/;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !sender.url || !sender.url.startsWith('https://drive.google.com/')) return;
  if (!msg || msg.type !== 'fetch-file' || !FILE_ID.test(msg.fileId)) return;

  fetchFile(msg.fileId).then(sendResponse, (e) => sendResponse({ ok: false, error: String(e.message || e) }));
  return true; // async response
});

async function fetchFile(fileId) {
  const url = 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(fileId);
  const res = await fetch(url, { credentials: 'include', redirect: 'follow' });
  if (!res.ok) return { ok: false, error: 'Drive returned HTTP ' + res.status };
  const type = res.headers.get('content-type') || '';
  if (type.includes('text/html')) return { ok: false, error: 'Could not download this file (sign in, or you may lack download permission).' };
  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) return { ok: false, error: 'File is larger than 5 MB.' };
  return { ok: true, text: new TextDecoder('utf-8').decode(buf) };
}
