const targetUrl = process.env.LHCI_TARGET_URL;

if (!targetUrl) {
  throw new Error('LHCI_TARGET_URL is required');
}

module.exports = {
  ci: {
    collect: {
      url: [targetUrl],
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './production-audit/lighthouse/desktop',
      reportFilenamePattern: 'desktop-%%DATE%%.report.%%EXTENSION%%',
    },
  },
};
