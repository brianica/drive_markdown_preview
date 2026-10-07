// Shows why the extension is or isn't active on the current tab.
const $ = (id) => document.getElementById(id);
$('options').onclick = () => chrome.runtime.openOptionsPage();

function show(rows) {
  const dl = $('info');
  dl.replaceChildren();
  for (const [k, v] of rows) {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = String(v);
    dl.append(dt, dd);
  }
  dl.hidden = false;
}

async function status(tabId) {
  return chrome.tabs.sendMessage(tabId, { type: 'dmp-status' });
}

(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !/^https:\/\/drive\.google\.com\//.test(tab.url || '')) {
    $('msg').textContent = 'Open a Markdown (.md) file in Google Drive to use this extension.';
    return;
  }
  let s;
  try {
    s = await status(tab.id);
  } catch (e) {
    $('msg').textContent = 'The extension is not running in this tab yet. Reload the Drive tab (the tab was probably open before the extension was installed or updated).';
    return;
  }
  $('msg').textContent = s.mounted ? 'Preview is active on this file.'
    : s.fileId ? 'This tab is a Drive file page, but the file name does not look like Markdown.'
    : 'This is not a single-file Drive page. Open the .md file itself (double-click it).';
  show([['File name', s.name || '(none found)'], ['File id', s.fileId || '(none)'],
        ['Tab title', s.title], ['Last download', s.lastFetch]]);
  if (s.fileId && !s.mounted) {
    $('force').hidden = false;
    $('force').onclick = async () => {
      await chrome.tabs.sendMessage(tab.id, { type: 'dmp-force' });
      window.close();
    };
  }
})();
