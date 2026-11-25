// Browser tests for the filter component; see tests/Browser. Run with: npm run test:browser
// They use the Chrome already installed on the machine, so no browser download is needed.
const { defineConfig } = require('@playwright/test')

module.exports = defineConfig({
  testDir: 'tests/Browser',
  fullyParallel: true,
  reporter: 'list',
  use: {
    channel: 'chrome',
    headless: true,
    viewport: { width: 1280, height: 800 },
    trace: 'retain-on-failure',
  },
})
