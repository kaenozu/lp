const targetUrl = process.env.LHCI_TARGET_URL;
const appSlug = process.env.LHCI_APP_SLUG;

if (!targetUrl) {
  throw new Error('LHCI_TARGET_URL is required');
}
if (!appSlug || !/^[a-z0-9-]+$/.test(appSlug)) {
  throw new Error('LHCI_APP_SLUG is required and must be a slug');
}

module.exports = {
  ci: {
    collect: {
      url: [targetUrl],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: `./production-audit/lighthouse/${appSlug}/desktop`,
      reportFilenamePattern: 'desktop-%%DATE%%.report.%%EXTENSION%%',
    },
  },
};
