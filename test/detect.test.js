const test = require('node:test');
const assert = require('node:assert');
const { fileIdFromUrl, fileNameFromTitle, isMarkdownTitle } = require('../src/detect.js');

test('extracts file ids from Drive URLs', () => {
  assert.strictEqual(fileIdFromUrl('https://drive.google.com/file/d/1AbC_dEf-GhIjKlMn/view?usp=sharing'), '1AbC_dEf-GhIjKlMn');
  assert.strictEqual(fileIdFromUrl('https://drive.google.com/file/u/1/d/1AbC_dEf-GhIjKlMn/view'), '1AbC_dEf-GhIjKlMn');
  assert.strictEqual(fileIdFromUrl('https://drive.google.com/open?id=1AbC_dEf-GhIjKlMn'), '1AbC_dEf-GhIjKlMn');
});

test('rejects other hosts and non-file pages', () => {
  assert.strictEqual(fileIdFromUrl('https://evil.example/file/d/1AbC_dEf-GhIjKlMn/view'), null);
  assert.strictEqual(fileIdFromUrl('https://drive.google.com/drive/my-drive'), null);
  assert.strictEqual(fileIdFromUrl('not a url'), null);
});

test('recognises markdown titles', () => {
  assert.strictEqual(fileNameFromTitle('notes.md - Google Drive'), 'notes.md');
  assert.ok(isMarkdownTitle('README.md - Google Drive'));
  assert.ok(isMarkdownTitle('doc.MARKDOWN - Google Drive'));
  assert.ok(!isMarkdownTitle('image.png - Google Drive'));
  assert.ok(!isMarkdownTitle('md - Google Drive'));
  assert.ok(!isMarkdownTitle('Google Drive'));
});

test('fileNameFromPage prefers a markdown-looking candidate and falls back to og:title', () => {
  const { fileNameFromPage, isMarkdownName } = require('../src/detect.js');
  const doc = (title, og) => ({ title, querySelector: () => (og == null ? null : { getAttribute: () => og }) });
  assert.strictEqual(fileNameFromPage(doc('notes.md - Google Drive')), 'notes.md');
  assert.strictEqual(fileNameFromPage(doc('notes.md')), 'notes.md');
  assert.strictEqual(fileNameFromPage(doc('Google Drive', 'plan.md')), 'plan.md');
  assert.strictEqual(fileNameFromPage(doc('img.png - Google Drive', 'img.png')), 'img.png');
  assert.strictEqual(fileNameFromPage(doc('')), '');
  assert.ok(isMarkdownName('a.md') && !isMarkdownName('a.txt') && !isMarkdownName(null));
});
