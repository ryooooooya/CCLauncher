import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";

if (existsSync(".env.test")) process.loadEnvFile(".env.test");
export default defineConfig({
  testDir: "./tests",
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.SECURITY_BASE_URL || "http://127.0.0.1:3000",
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
  webServer: {
    command: "pnpm start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
