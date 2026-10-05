#!/usr/bin/env bash
# Builds dist/drive-markdown-preview.zip containing only what the extension ships.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p dist
rm -f dist/drive-markdown-preview.zip
zip -X -r dist/drive-markdown-preview.zip manifest.json src vendor icons
echo "Built dist/drive-markdown-preview.zip"
