import { defineConfig } from '@playwright/test';

// The container has Chromium pre-installed at /opt/pw-browsers/chromium.
// Playwright must not download its own copy (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1).
const executablePath = process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    launchOptions: { executablePath, args: ['--js-flags=--expose-gc', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: 'npm run preview',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
