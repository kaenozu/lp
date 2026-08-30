from __future__ import annotations

import json
from html.parser import HTMLParser
from pathlib import Path
import unittest
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = json.loads((ROOT / "tool/site_manifest.json").read_text(encoding="utf-8"))
APP_NAMES = {app["slug"]: app["display_name"] for app in MANIFEST["apps"]}
IDENTITY_PAGES = ("privacy.html", "terms.html", "contact.html")


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.hrefs: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "a":
            return
        for name, value in attrs:
            if name == "href" and value:
                self.hrefs.append(value)


def links_from(path: Path) -> list[str]:
    parser = LinkParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser.hrefs


class AppIdentityLinksTest(unittest.TestCase):
    def test_legal_and_contact_pages_do_not_cross_app_slugs(self) -> None:
        for slug in APP_NAMES:
            app_dir = ROOT / "apps" / slug
            for filename in IDENTITY_PAGES:
                page = app_dir / filename
                if not page.exists():
                    continue
                with self.subTest(slug=slug, page=filename):
                    for href in links_from(page):
                        parsed = urlparse(href)
                        if parsed.scheme in {"mailto", "tel", "http", "https"}:
                            continue
                        path = unquote(parsed.path)
                        if not path.startswith("/apps/"):
                            continue
                        self.assertTrue(
                            path == f"/apps/{slug}" or path.startswith(f"/apps/{slug}/"),
                            f"{page.relative_to(ROOT)} crosses app boundary: {href}",
                        )

    def test_contact_and_terms_pages_use_manifest_identity(self) -> None:
        for slug, display_name in APP_NAMES.items():
            for filename in ("contact.html", "terms.html"):
                page = ROOT / "apps" / slug / filename
                if not page.exists():
                    continue
                html = page.read_text(encoding="utf-8")
                with self.subTest(slug=slug, page=filename):
                    self.assertIn(display_name, html)
                    for other_slug, other_name in APP_NAMES.items():
                        if other_slug == slug:
                            continue
                        self.assertNotIn(
                            f'href="/apps/{other_slug}/',
                            html,
                            f"{page.relative_to(ROOT)} links to {other_name}",
                        )


if __name__ == "__main__":
    unittest.main()
