import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";

if (existsSync(".env.test")) process.loadEnvFile(".env.test");
const baseURL = process.env.SECURITY_BASE_URL || "http://127.0.0.1:3000";
const origin = new URL(baseURL);
if (
  !["127.0.0.1", "localhost"].includes(origin.hostname) ||
  !["http:", "https:"].includes(origin.protocol)
)
  throw new Error("Tests require a local application");
const nextServer = {
  command: "pnpm start",
  url: "http://127.0.0.1:3000",
  reuseExistingServer: false,
  timeout: 120000,
};
export default defineConfig({
  testDir: "./tests",
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["./scripts/playwright-reporter.mjs"]],
  use: {
    baseURL,
    ignoreHTTPSErrors: origin.protocol === "https:",
    trace: "off",
  },
  projects: [
    { name: "api", testMatch: "**/security/*.spec.ts" },
    {
      name: "chromium",
      testMatch: "**/e2e/*.spec.ts",
      use: { browserName: "chromium" },
    },
  ],
  webServer:
    origin.protocol === "https:"
      ? [
          nextServer,
          {
            command: "node scripts/https-proxy.mjs",
            url: baseURL,
            ignoreHTTPSErrors: true,
            reuseExistingServer: false,
          },
        ]
      : nextServer,
});
