import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for OMS E2E.
 *
 * v1 scope:
 * - 受注→入金→出荷 の critical path 単体
 * - dev server (npm run dev) を webServer で自動起動
 * - chromium のみ（CI 統合と他ブラウザは v2 で）
 *
 * 初回セットアップ:
 *   npx playwright install chromium
 *
 * 実行:
 *   npm run e2e
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // in-memory stores を共有するので逐次実行
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "ja-JP",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
