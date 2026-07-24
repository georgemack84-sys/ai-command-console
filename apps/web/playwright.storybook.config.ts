import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/storybook',
  use: { baseURL: 'http://127.0.0.1:6006' },
  webServer: {
    command: 'node scripts/serve-static.mjs storybook-static 6006',
    url: 'http://127.0.0.1:6006/iframe.html',
    timeout: 30_000,
    reuseExistingServer: false,
  },
});
