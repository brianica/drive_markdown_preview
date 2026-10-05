const box = document.getElementById('remote');
chrome.storage.sync.get({ allowRemoteImages: false }).then((s) => { box.checked = !!s.allowRemoteImages; });
box.addEventListener('change', () => chrome.storage.sync.set({ allowRemoteImages: box.checked }));
