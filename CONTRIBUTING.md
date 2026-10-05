# Contributing

1. `npm install && npm test` must pass.
2. Keep permissions minimal; any new host or permission needs a justification in the PR and an update to README/PRIVACY.
3. Rendering changes need a test in `test/sanitize.test.js`, especially anything touching sanitization.
4. CI: copy `docs/ci.yml.example` to `.github/workflows/ci.yml` (needs a token with workflow scope).
5. To update a vendored library, replace the file from the official npm tarball and update the version and SHA-256 in `vendor/README.md`.
