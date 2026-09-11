import { writeFileSync } from "node:fs";

export function checkReport(report) {
  if (
    report?.schemaVersion !== 1 ||
    !Array.isArray(report.states) ||
    report.states.length === 0 ||
    report.states.some((state) => state !== "passed") ||
    report.success !== true
  )
    throw new Error(
      "Required tests must execute: no empty, skipped, todo or failed tests.",
    );
}
export function recordReport(states, success) {
  const report = { schemaVersion: 1, states, success };
  if (process.env.CCLAUNCHER_TEST_REPORT)
    writeFileSync(process.env.CCLAUNCHER_TEST_REPORT, JSON.stringify(report), {
      flag: "wx",
      mode: 0o600,
    });
  try {
    checkReport(report);
    return true;
  } catch (error) {
    console.error(error.message);
    return false;
  }
}
