from __future__ import annotations

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / '.github/workflows/audit-production-accessibility.yml'
SCRIPT = ROOT / 'tool/audit_production_accessibility.cjs'


class ProductionAccessibilityAuditTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.workflow = WORKFLOW.read_text(encoding='utf-8')
        cls.script = SCRIPT.read_text(encoding='utf-8')

    def test_workflow_runs_after_deploy_and_on_pull_requests(self) -> None:
        self.assertIn('workflows: ["Deploy to Cloudflare Pages"]', self.workflow)
        self.assertIn('types: [completed]', self.workflow)
        self.assertIn('pull_request:', self.workflow)
        self.assertIn('workflow_dispatch:', self.workflow)
        self.assertIn("github.event.workflow_run.conclusion == 'success'", self.workflow)

    def test_tooling_and_actions_are_pinned(self) -> None:
        self.assertIn('puppeteer-core@25.3.0', self.workflow)
        self.assertIn('fonts-noto-cjk', self.workflow)
        self.assertIn(
            'actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0',
            self.workflow,
        )
        self.assertIn(
            'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
            self.workflow,
        )

    def test_direct_index_access_is_audited(self) -> None:
        self.assertIn("new URL('index.html', targetUrl)", self.script)
        self.assertIn('index-html-access.json', self.script)
        self.assertIn('index-html-access.png', self.script)
        self.assertIn('result.realScreens === 4', self.script)
        self.assertIn('result.phoneMocks === 0', self.script)

    def test_document_and_accessibility_tree_semantics_are_audited(self) -> None:
        self.assertIn("document.querySelectorAll('h1, h2, h3, h4, h5, h6')", self.script)
        self.assertIn("document.querySelectorAll('nav')", self.script)
        self.assertIn("client.send('Accessibility.getFullAXTree')", self.script)
        self.assertIn("protocolValue(node.role) === 'image'", self.script)
        self.assertIn("['banner', 'main', 'contentinfo', 'navigation']", self.script)
        self.assertIn('accessibility-semantics.json', self.script)
        self.assertIn('expected exactly one h1', self.script)
        self.assertIn('navigation landmark labels are not unique', self.script)
        self.assertIn('alt text is absent from accessibility tree', self.script)

    def test_two_hundred_percent_text_resize_is_audited(self) -> None:
        self.assertIn("font-size: 200% !important", self.script)
        self.assertIn('text-resize-200.json', self.script)
        self.assertIn('text-resize-200.png', self.script)
        self.assertIn("result.rootFontSize === '32px'", self.script)
        self.assertIn('200% text resize causes horizontal overflow', self.script)
        self.assertIn('text is clipped at 200% resize', self.script)

    def test_status_and_private_artifact_are_recorded(self) -> None:
        self.assertIn('production-accessibility-audit', self.workflow)
        self.assertIn('retention-days: 30', self.workflow)
        self.assertIn('production-accessibility-semantics', self.workflow)
        self.assertIn('Index access, semantics, AX names and 200% text resize verified', self.workflow)


if __name__ == '__main__':
    unittest.main()
