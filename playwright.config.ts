import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
/** Uji server lain (mis. `wrangler dev` atau preview deploy Cloudflare) tanpa menyalakan vite preview. */
const externalBaseUrl = process.env.E2E_BASE_URL
const FAKE_QR_VIDEO = 'e2e/.fixtures/qr-singa.y4m'

/** Pakai Chromium yang sudah terpasang di sistem bila ada (mis. container tanpa unduhan browser). */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH

const phoneLandscape = {
  ...devices['Pixel 7'],
  viewport: { width: 844, height: 390 },
  screen: { width: 844, height: 390 },
  serviceWorkers: 'block' as const,
  launchOptions: executablePath ? { executablePath } : {},
}

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: externalBaseUrl ?? `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'phone-landscape',
      testIgnore: /scanner\.spec\.ts/,
      use: phoneLandscape,
    },
    {
      name: 'scanner',
      testMatch: /scanner\.spec\.ts/,
      use: {
        ...phoneLandscape,
        permissions: ['camera'],
        launchOptions: {
          ...phoneLandscape.launchOptions,
          args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            `--use-file-for-fake-video-capture=${FAKE_QR_VIDEO}`,
          ],
        },
      },
    },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
        port: PORT,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
