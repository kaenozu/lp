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
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './production-audit/lighthouse/mobile',
      reportFilenamePattern: 'mobile-%%DATE%%.report.%%EXTENSION%%',
    },
  },
};
