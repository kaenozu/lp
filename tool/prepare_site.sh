#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root_dir"

rm -rf _site
mkdir -p _site
cp index.html robots.txt sitemap.xml _headers _site/
cp -R assets apps _site/
python3 tool/inject_search_console_verification.py _site/index.html

test -f _site/index.html
test -f _site/robots.txt
test -f _site/sitemap.xml
test -f _site/_headers
test -d _site/assets
test -d _site/apps
