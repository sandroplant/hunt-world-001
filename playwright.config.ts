import { defineConfig } from '@playwright/test';

// The container has Chromium pre-installed at /opt/pw-browsers/chromium.
// Playwright must not download its own copy (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1).
const executablePath = process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium';

// Two builds are served: the dev build (debug hooks, used to set tests up) on 4173 and the playtest build
// (no hooks at all) on 4174. Tests named *.playtest.spec.ts run against the playtest build with real input only.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    headless: true,
    launchOptions: { executablePath, args: ['--js-flags=--expose-gc', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  projects: [
    { name: 'playtest', testMatch: /\.playtest\.spec\.ts$/, use: { baseURL: 'http://127.0.0.1:4174' } },
    { name: 'dev', testIgnore: /\.playtest\.spec\.ts$/, use: { baseURL: 'http://127.0.0.1:4173' } },
  ],
  webServer: [
    { command: 'npm run preview', url: 'http://127.0.0.1:4173', reuseExistingServer: true, timeout: 60_000 },
    { command: 'npm run preview:playtest', url: 'http://127.0.0.1:4174', reuseExistingServer: true, timeout: 60_000 },
  ],
});
