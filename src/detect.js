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

  function isMarkdownName(name) {
    return MD_EXT.test(String(name || '').trim());
  }

  // The tab title is the primary source; Drive pages also carry the name in
  // og:title, used as a fallback. Prefers whichever candidate looks like Markdown.
  function fileNameFromPage(doc) {
    const og = doc.querySelector && doc.querySelector('meta[property="og:title"]');
    const candidates = [fileNameFromTitle(doc.title), og && og.getAttribute('content')]
      .map((n) => fileNameFromTitle(n)).filter(Boolean);
    return candidates.find(isMarkdownName) || candidates[0] || '';
  }

  return { fileIdFromUrl, fileNameFromTitle, isMarkdownTitle, isMarkdownName, fileNameFromPage };
});
