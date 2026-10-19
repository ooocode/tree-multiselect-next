import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
    browser: {
      enabled: true,
      provider: playwright({ launchOptions: { channel: 'chrome' } }),
      headless: true,
      instances: [{ browser: 'chromium' }]
    }
  }
});
