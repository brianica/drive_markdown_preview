# Vendored libraries

Third-party code is copied in unmodified (no remote code is ever loaded) so users can audit exactly what ships.

| File | Package | Version | SHA-256 |
|------|---------|---------|---------|
| `marked.min.js` | [marked](https://github.com/markedjs/marked) (MIT) | 12.0.2 | `15fabce5b65898b32b03f5ed25e9f891a729ad4c0d6d877110a7744aa847a894` |
| `purify.min.js` | [DOMPurify](https://github.com/cure53/DOMPurify) (Apache-2.0 / MPL-2.0) | 3.1.6 | `c0845096a7c4a6741f362ac506c94c1c7d27dc603bcc1bf64a587f76f2dbe3a1` |

## Verify

```sh
sha256sum vendor/*.min.js
mkdir /tmp/v && cd /tmp/v && npm pack marked@12.0.2 dompurify@3.1.6
# marked.min.js is at package/marked.min.js, purify.min.js at package/dist/purify.min.js inside the tarballs
```
Licenses: `marked.LICENSE`, `dompurify.LICENSE`.
