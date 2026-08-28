import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = (ROOT / '.github' / 'workflows' / 'audit-production-accessibility.yml').read_text(encoding='utf-8')
SCRIPT = (ROOT / 'tool' / 'audit_production_accessibility.cjs').read_text(encoding='utf-8')


class ProductionAccessibilityAuditContractTests(unittest.TestCase):
    def test_workflow_runs_on_production_origin(self) -> None:
        self.assertIn('https://lp-5t7.pages.dev', WORKFLOW)
        self.assertIn('audit_production_accessibility.cjs', WORKFLOW)

    def test_script_checks_direct_access(self) -> None:
        self.assertIn('response.status()', SCRIPT)
        self.assertIn('direct-access.json', SCRIPT)

    def test_script_checks_semantic_structure(self) -> None:
        self.assertIn('semantic-contract.json', SCRIPT)
        self.assertIn("document.querySelector('main')", SCRIPT)
        self.assertIn("document.querySelector('h1')", SCRIPT)

    def test_two_hundred_percent_text_resize_is_csp_compatible(self) -> None:
        self.assertIn("font-size: 200% !important", SCRIPT)
        self.assertIn('document.styleSheets', SCRIPT)
        self.assertIn('writableStyleSheet.insertRule', SCRIPT)
        self.assertNotIn('page.addStyleTag', SCRIPT)
        self.assertIn('text-resize-200.json', SCRIPT)
        self.assertIn("result.rootFontSize === '32px'", SCRIPT)
        self.assertIn('200% text resize causes horizontal overflow', SCRIPT)
        self.assertIn('text is clipped at 200% resize', SCRIPT)

    def test_tooling_is_pinned(self) -> None:
        self.assertIn('puppeteer-core@25.3.0', WORKFLOW)
        self.assertIn('actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0', WORKFLOW)
        self.assertIn('actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a', WORKFLOW)


if __name__ == '__main__':
    unittest.main()
