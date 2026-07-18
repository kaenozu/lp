from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from tool.check_production_headers import REQUIRED_HEADERS, validate as validate_headers
from tool.inject_search_console_verification import inject
from tool.validate_site import ROOT, validate_manifest, validate_release_presentation, validate_store_url


class ReleaseManifestTest(unittest.TestCase):
    def test_current_manifest_and_portal_are_consistent(self) -> None:
        validate_manifest()
        validate_release_presentation(ROOT)

    def test_google_play_url_requires_package_id(self) -> None:
        with self.assertRaises(AssertionError):
            validate_store_url(
                "https://play.google.com/store/apps/details",
                "google_play",
                "example",
            )

    def test_valid_store_urls_are_accepted(self) -> None:
        self.assertEqual(
            validate_store_url(
                "https://play.google.com/store/apps/details?id=com.example.app",
                "google_play",
                "example",
            ),
            "https://play.google.com/store/apps/details?id=com.example.app",
        )
        self.assertEqual(
            validate_store_url(
                "https://apps.apple.com/jp/app/example/id1234567890",
                "app_store",
                "example",
            ),
            "https://apps.apple.com/jp/app/example/id1234567890",
        )


class SearchConsoleInjectionTest(unittest.TestCase):
    def test_injects_exactly_one_verification_tag(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "index.html"
            path.write_text("<html><head><title>x</title></head><body></body></html>", encoding="utf-8")
            self.assertTrue(inject(path, "verification_token_123"))
            text = path.read_text(encoding="utf-8")
            self.assertEqual(text.count('name="google-site-verification"'), 1)
            self.assertIn('content="verification_token_123"', text)

    def test_empty_token_removes_stale_verification_tag(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "index.html"
            path.write_text(
                '<html><head><meta name="google-site-verification" content="stale_token"></head><body></body></html>',
                encoding="utf-8",
            )
            self.assertFalse(inject(path, ""))
            self.assertNotIn("google-site-verification", path.read_text(encoding="utf-8"))

    def test_rejects_unsafe_token(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "index.html"
            path.write_text("<html><head></head><body></body></html>", encoding="utf-8")
            with self.assertRaises(ValueError):
                inject(path, 'bad"token')


class ProductionHeaderTest(unittest.TestCase):
    def test_expected_headers_are_accepted_case_insensitively(self) -> None:
        headers = {
            name: "; ".join(fragments).upper()
            for name, fragments in REQUIRED_HEADERS.items()
        }
        validate_headers(headers)

    def test_missing_header_fails(self) -> None:
        with self.assertRaises(AssertionError):
            validate_headers({})


if __name__ == "__main__":
    unittest.main()
