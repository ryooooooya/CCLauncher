import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    passWithNoTests: false,
    allowOnly: false,
    reporters: ["default", "./scripts/vitest-reporter.mjs"],
  },
});
