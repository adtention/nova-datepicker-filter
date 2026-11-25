// Builds the standalone test page for the Playwright tests: npm run test:browser.
// Unlike the package build, Vue is bundled in, because there is no Nova to provide it.
let mix = require('laravel-mix')

mix
  .setPublicPath('tests/Browser/harness/build')
  .js('tests/Browser/harness/main.js', 'js')
  .vue({ version: 3 })
  .options({ manifest: false })
  .disableNotifications()
