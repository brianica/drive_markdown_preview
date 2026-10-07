# Drive Markdown Preview

A Chrome extension that shows Markdown (`.md`) files in Google Drive as a rendered preview instead of plain text.

- **Preview** (default): GitHub-style rendering with tables, task lists and code blocks; follows light/dark mode.
- **Raw**: the original text, one click away.
- **Edit**: edit with a live preview. Edits stay in your browser; use **Copy** or **Download .md** and re-upload to Drive to save.
- **Drive view**: hides the overlay and shows Drive's own viewer (a "Markdown preview" button brings it back).

## Install (developer mode)

1. `git clone` this repo.
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and choose the repo folder.
3. Open a `.md` file in Google Drive.

## Privacy and safety

- Only requests Google Drive hosts (`drive.google.com`, `drive.usercontent.google.com`) plus `storage` for one setting. No analytics, no third-party servers, no remote code.
- The file is downloaded with your existing Drive session, rendered locally, and never sent anywhere. See [PRIVACY.md](PRIVACY.md).
- Markdown is sanitized with DOMPurify and shown in a script-less sandboxed iframe with its own strict CSP, so a malicious file can't run code in your Drive session.
- Remote images are blocked by default (they can leak when you open a file); enable them in the extension options.
- Third-party libraries are vendored and pinned with checksums: [vendor/README.md](vendor/README.md). Report vulnerabilities per [SECURITY.md](SECURITY.md).

## Develop

```sh
npm install
npm test          # detection + XSS/sanitization tests
npm run package   # builds dist/drive-markdown-preview.zip
```

## Troubleshooting

1. After installing or updating, **reload the Drive tab** (tabs opened earlier don't get the extension).
2. Open the `.md` file itself (double-click it) so the URL looks like `drive.google.com/file/d/.../view`.
3. Click the extension's toolbar icon: it shows the detected file name/id, whether the preview is active, and the last download result. **Preview this file anyway** forces it for files that don't end in `.md`.
4. Open DevTools (F12) on the Drive tab and look for `[DMP]` console lines; check `chrome://extensions` -> Errors too.

## Limitations

Drive's page structure and download endpoint are undocumented and may change. Files over 5 MB are not previewed. Chrome (Manifest V3) only for now.

## License

MIT
