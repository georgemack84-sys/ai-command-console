import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  reporter: 'line',
  use: { baseURL: 'http://127.0.0.1:3100' },
  webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER
    ? undefined
    : {
        command:
          'node ./node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3100',
        env: {
          ...process.env,
          NEXT_PUBLIC_APP_NAME: 'Proprium',
          NEXT_PUBLIC_APP_VERSION: 'browser',
          NEXT_PUBLIC_API_BASE_URL: 'http://localhost:8080',
          NEXT_PUBLIC_ENVIRONMENT: 'test',
        },
        url: 'http://127.0.0.1:3100',
        timeout: 120000,
        reuseExistingServer: false,
        gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
      },
});
