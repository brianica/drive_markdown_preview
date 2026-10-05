// Pure helpers for recognising a Markdown file in Google Drive. Loaded as a
// content script (global DMP_detect) and required directly by the tests.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DMP_detect = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const MD_EXT = /\.(md|markdown|mdown|mkd)$/i;
  const ID = /^[\w-]{10,}$/;

  function fileIdFromUrl(href) {
    let url;
    try { url = new URL(href); } catch (e) { return null; }
    if (url.hostname !== 'drive.google.com') return null;
    const m = url.pathname.match(/^\/file\/(?:u\/\d+\/)?d\/([\w-]+)/);
    if (m && ID.test(m[1])) return m[1];
    if (/^\/(open|uc)$/.test(url.pathname)) {
      const id = url.searchParams.get('id');
      if (id && ID.test(id)) return id;
    }
    return null;
  }

  // Drive titles the tab "<name> - Google Drive".
  function fileNameFromTitle(title) {
    return String(title || '').replace(/\s+-\s+Google Drive$/i, '').trim();
  }

  function isMarkdownTitle(title) {
    return MD_EXT.test(fileNameFromTitle(title));
  }

  return { fileIdFromUrl, fileNameFromTitle, isMarkdownTitle };
});
