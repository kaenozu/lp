from __future__ import annotations

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / '.github/workflows/audit-production.yml'
MOBILE_CONFIG = ROOT / 'lighthouserc.mobile.cjs'
DESKTOP_CONFIG = ROOT / 'lighthouserc.desktop.cjs'
APP_HTML = ROOT / 'apps/ashita-motsumono/index.html'
APP_JS = ROOT / 'assets/app.js'
STYLES = ROOT / 'assets/styles.css'


class ProductionAuditTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.workflow = WORKFLOW.read_text(encoding='utf-8')
        cls.mobile_config = MOBILE_CONFIG.read_text(encoding='utf-8')
        cls.desktop_config = DESKTOP_CONFIG.read_text(encoding='utf-8')
        cls.app_html = APP_HTML.read_text(encoding='utf-8')
        cls.app_js = APP_JS.read_text(encoding='utf-8')
        cls.styles = STYLES.read_text(encoding='utf-8')

    def test_audit_runs_after_production_deploy(self) -> None:
        self.assertIn('workflows: ["Deploy to Cloudflare Pages"]', self.workflow)
        self.assertIn('types: [completed]', self.workflow)
        self.assertIn("github.event.workflow_run.conclusion == 'success'", self.workflow)
        self.assertIn('workflow_dispatch:', self.workflow)
        self.assertIn('schedule:', self.workflow)

    def test_lighthouse_cli_and_artifact_actions_are_pinned(self) -> None:
        self.assertIn('@lhci/cli@0.15.1', self.workflow)
        self.assertIn(
            'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
            self.workflow,
        )
        self.assertIn(
            'actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0',
            self.workflow,
        )

    def test_reports_are_kept_in_actions_not_public_storage(self) -> None:
        self.assertIn("target: 'filesystem'", self.mobile_config)
        self.assertIn("target: 'filesystem'", self.desktop_config)
        self.assertNotIn('temporary-public-storage', self.mobile_config)
        self.assertNotIn('temporary-public-storage', self.desktop_config)
        self.assertIn("outputDir: './production-audit/lighthouse/mobile'", self.mobile_config)
        self.assertIn("outputDir: './production-audit/lighthouse/desktop'", self.desktop_config)
        self.assertIn("preset: 'desktop'", self.desktop_config)

    def test_browser_evidence_covers_responsive_and_fallback_states(self) -> None:
        for evidence in (
            'mobile-top',
            'mobile-screens',
            'tablet-screens',
            'desktop-top',
            'desktop-screens',
            'javascript-enabled.html',
            'javascript-disabled.html',
        ):
            self.assertIn(evidence, self.workflow)
        self.assertIn('curl \\', self.workflow)
        self.assertIn('test -s "$output_dir/javascript-disabled.html"', self.workflow)
        self.assertIn('loading="eager"', self.workflow)
        self.assertIn('loading="lazy"', self.workflow)
        self.assertIn('fetchpriority="high"', self.workflow)
        self.assertIn('#:~:text=画面イメージ', self.workflow)
        self.assertIn('<h2 class="section__title">画面イメージ</h2>', self.app_html)

    def test_statuses_are_recorded_against_deployed_sha(self) -> None:
        self.assertIn('github.event.workflow_run.head_sha || github.sha', self.workflow)
        self.assertIn('production-browser-verification', self.workflow)
        self.assertIn('lighthouse-production', self.workflow)

    def test_css_and_javascript_fallback_contract_is_preserved(self) -> None:
        self.assertIn('screenshotStyles.addEventListener("load", showRealScreenshots', self.app_js)
        self.assertIn('image.loading = isHero ? "eager" : "lazy"', self.app_js)
        self.assertIn('image.setAttribute("fetchpriority", "high")', self.app_js)
        self.assertIn('a:focus-visible', self.styles)
        self.assertIn('@media (prefers-reduced-motion: reduce)', self.styles)


if __name__ == '__main__':
    unittest.main()
