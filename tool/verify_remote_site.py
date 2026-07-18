from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = json.loads((ROOT / "tool/site_manifest.json").read_text(encoding="utf-8"))


class HeadParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.title = ""
        self._in_title = False
        self.links: list[dict[str, str]] = []
        self.meta: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key: value or "" for key, value in attrs}
        if tag == "title":
            self._in_title = True
        elif tag == "link":
            self.links.append(values)
        elif tag == "meta":
            self.meta.append(values)

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data


def fetch(url: str, attempts: int = 20) -> tuple[bytes, str]:
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "lp-production-verifier/1.0"})
            with urllib.request.urlopen(request, timeout=20) as response:
                if response.status >= 400:
                    raise RuntimeError(f"HTTP {response.status}: {url}")
                return response.read(), response.headers.get("Content-Type", "")
        except (urllib.error.URLError, TimeoutError, RuntimeError) as error:
            last_error = error
            if attempt < attempts:
                time.sleep(3)
    raise RuntimeError(f"failed to fetch {url}: {last_error}")


def local_html_path(site: Path, path: str) -> Path:
    if path == "/":
        return site / "index.html"
    stripped = path.strip("/")
    if path.endswith("/"):
        return site / stripped / "index.html"
    return site / f"{stripped}.html"


def signature(parser: HeadParser) -> dict[str, object]:
    canonical = [item.get("href", "") for item in parser.links if item.get("rel") == "canonical"]
    values: dict[str, list[str]] = {}
    for key, attribute in (("og:url", "property"), ("og:image", "property"), ("twitter:image", "name")):
        values[key] = [item.get("content", "") for item in parser.meta if item.get(attribute) == key]
    return {"title": parser.title.strip(), "canonical": canonical, **values}


def parse_html(data: bytes) -> HeadParser:
    parser = HeadParser()
    parser.feed(data.decode("utf-8"))
    return parser


def sitemap_paths(site: Path) -> list[str]:
    tree = ET.parse(site / "sitemap.xml")
    namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    paths: list[str] = []
    for node in tree.findall("sm:url/sm:loc", namespace):
        paths.append(urlsplit(node.text or "").path or "/")
    return paths


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: verify_remote_site.py BASE_URL SITE_ROOT")
    base_url = sys.argv[1].rstrip("/")
    site = Path(sys.argv[2]).resolve()

    for path in sitemap_paths(site):
        data, content_type = fetch(f"{base_url}{path}")
        if "text/html" not in content_type:
            raise AssertionError(f"unexpected Content-Type for {path}: {content_type}")
        local = parse_html(local_html_path(site, path).read_bytes())
        remote = parse_html(data)
        if signature(remote) != signature(local):
            raise AssertionError(f"metadata mismatch for {path}: remote={signature(remote)}, local={signature(local)}")
        print(f"verified page: {path}")

    assets = [f"/assets/brand/{name}" for name in MANIFEST["brand_assets"]]
    for app in MANIFEST["apps"]:
        assets.extend(
            f"/assets/apps/{app['slug']}/screenshots/{name}"
            for name in app["screenshots"]
        )
    assets.extend(["/assets/styles.css", "/assets/app.js"])

    for path in assets:
        data, _ = fetch(f"{base_url}{path}", attempts=5)
        if not data:
            raise AssertionError(f"empty asset: {path}")
        print(f"verified asset: {path} ({len(data)} bytes)")


if __name__ == "__main__":
    main()
