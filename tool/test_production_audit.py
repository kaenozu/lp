from __future__ import annotations

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / '.github/workflows/audit-production.yml'
PR_BROWSER_WORKFLOW = ROOT / '.github/workflows/validate-production-browser.yml'
CAPTURE_SCRIPT = ROOT / 'tool/capture_production_screenshots.cjs'
MOBILE_CONFIG = ROOT / 'lighthouserc.mobile.cjs'
DESKTOP_CONFIG = ROOT / 'lighthouserc.desktop.cjs'
APP_JS = ROOT / 'assets/app.js'
STYLES = ROOT / 'assets/styles.css'
SCREENSHOT_STYLES = ROOT / 'assets/app-screenshots.css'


class ProductionAuditTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.workflow = WORKFLOW.read_text(encoding='utf-8')
        cls.pr_browser_workflow = PR_BROWSER_WORKFLOW.read_text(encoding='utf-8')
        cls.capture_script = CAPTURE_SCRIPT.read_text(encoding='utf-8')
        cls.mobile_config = MOBILE_CONFIG.read_text(encoding='utf-8')
        cls.desktop_config = DESKTOP_CONFIG.read_text(encoding='utf-8')
        cls.app_js = APP_JS.read_text(encoding='utf-8')
        cls.styles = STYLES.read_text(encoding='utf-8')
        cls.screenshot_styles = SCREENSHOT_STYLES.read_text(encoding='utf-8')

    def test_audit_runs_after_production_deploy(self) -> None:
        self.assertIn('workflows: ["Deploy to Cloudflare Pages"]', self.workflow)
        self.assertIn('types: [completed]', self.workflow)
        self.assertIn("github.event.workflow_run.conclusion == 'success'", self.workflow)
        self.assertIn('workflow_dispatch:', self.workflow)
        self.assertIn('schedule:', self.workflow)

    def test_browser_runtime_is_exercised_on_relevant_pull_requests(self) -> None:
        self.assertIn('pull_request:', self.pr_browser_workflow)
        self.assertIn('tool/capture_production_screenshots.cjs', self.pr_browser_workflow)
        self.assertIn('github.event.pull_request.head.sha', self.pr_browser_workflow)
        self.assertIn('node tool/capture_production_screenshots.cjs', self.pr_browser_workflow)
        self.assertIn('production-browser-pr-audit-', self.pr_browser_workflow)

    def test_browser_and_lighthouse_tooling_are_pinned(self) -> None:
        for workflow in (self.workflow, self.pr_browser_workflow):
            self.assertIn('puppeteer-core@25.3.0', workflow)
            self.assertIn('fonts-noto-cjk', workflow)
            self.assertIn('fc-match :lang=ja', workflow)
            self.assertIn(
                'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
                workflow,
            )
            self.assertIn(
                'actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0',
                workflow,
            )
        self.assertIn('@lhci/cli@0.15.1', self.workflow)

    def test_reports_are_kept_in_actions_not_public_storage(self) -> None:
        self.assertIn("target: 'filesystem'", self.mobile_config)
        self.assertIn("target: 'filesystem'", self.desktop_config)
        self.assertNotIn('temporary-public-storage', self.mobile_config)
        self.assertNotIn('temporary-public-storage', self.desktop_config)
        self.assertIn("outputDir: './production-audit/lighthouse/mobile'", self.mobile_config)
        self.assertIn("outputDir: './production-audit/lighthouse/desktop'", self.desktop_config)
        self.assertIn("preset: 'desktop'", self.desktop_config)

    def test_responsive_layout_is_measured_at_three_widths(self) -> None:
        for name, width, columns in (
            ('mobile', 390, 1),
            ('tablet', 820, 2),
            ('desktop', 1440, 3),
        ):
            self.assertIn(
                f"{{ name: '{name}', width: {width}",
                self.capture_script,
            )
            self.assertIn(f'expectedColumns: {columns}', self.capture_script)
            self.assertIn('`${viewport.name}-screens.png`', self.capture_script)
            self.assertIn('`${viewport.name}-layout.json`', self.capture_script)

        self.assertIn('computedGridTemplateColumns', self.capture_script)
        self.assertIn('rowCounts', self.capture_script)
        self.assertIn('Math.max(0, ...rowCounts.map((row) => row.count))', self.capture_script)
        self.assertIn('documentClientWidth', self.capture_script)
        self.assertIn('horizontal overflow', self.capture_script)
        self.assertIn('grid.screenshot', self.capture_script)
        self.assertIn('validateLayout(layout, viewport)', self.capture_script)
        self.assertIn('grid-template-columns: repeat(3, 1fr)', self.screenshot_styles)

    def test_layout_evidence_is_written_before_assertions(self) -> None:
        write_position = self.capture_script.index('`${viewport.name}-layout.json`')
        validate_position = self.capture_script.index('validateLayout(layout, viewport)')
        self.assertLess(write_position, validate_position)

    def test_rendered_image_loading_contract_is_checked(self) -> None:
        self.assertIn("document.querySelectorAll('.real-app-screen')", self.capture_script)
        self.assertIn("image.loading === 'eager'", self.capture_script)
        self.assertIn("image.loading === 'lazy'", self.capture_script)
        self.assertIn("image.fetchPriority === 'high'", self.capture_script)
        self.assertIn('image.width === 360 && image.height === 640', self.capture_script)
        self.assertIn('image.alt.trim().length > 0', self.capture_script)
        self.assertIn("grid.scrollIntoView({ block: 'center'", self.capture_script)

    def test_fallback_focus_and_motion_evidence_are_collected(self) -> None:
        self.assertIn('javascript-disabled.html', self.workflow)
        self.assertIn('test -s "$output_dir/javascript-disabled.html"', self.workflow)
        self.assertIn("pathname === '/assets/app-screenshots.css'", self.capture_script)
        self.assertIn('screenshot-css-failure-screens.png', self.capture_script)
        self.assertIn("page.keyboard.press('Tab')", self.capture_script)
        self.assertIn("active.matches(':focus-visible')", self.capture_script)
        self.assertIn('keyboard-focus.json', self.capture_script)
        self.assertIn('prefers-reduced-motion', self.capture_script)
        self.assertIn('reduced-motion.json', self.capture_script)

    def test_statuses_are_recorded_against_deployed_sha(self) -> None:
        self.assertIn('github.event.workflow_run.head_sha || github.sha', self.workflow)
        self.assertIn('production-browser-verification', self.workflow)
        self.assertIn('lighthouse-production', self.workflow)
        self.assertIn(
            'Responsive layout, focus, motion and fallbacks verified',
            self.workflow,
        )

    def test_css_and_javascript_fallback_contract_is_preserved(self) -> None:
        self.assertIn('screenshotStyles.addEventListener("load", showRealScreenshots', self.app_js)
        self.assertIn('image.loading = isHero ? "eager" : "lazy"', self.app_js)
        self.assertIn('image.setAttribute("fetchpriority", "high")', self.app_js)
        self.assertIn('a:focus-visible', self.styles)
        self.assertIn('@media (prefers-reduced-motion: reduce)', self.styles)


if __name__ == '__main__':
    unittest.main()
