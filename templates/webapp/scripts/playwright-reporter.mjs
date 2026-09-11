import { recordReport } from "./test-report.mjs";

export default class RequiredTestsReporter {
  onBegin(_config, suite) {
    this.suite = suite;
  }
  onEnd(result) {
    const tests = this.suite?.allTests() || [];
    const states = tests.map((test) =>
      test.expectedStatus === "passed" &&
      test.results.length > 0 &&
      test.results.every((attempt) => attempt.status === "passed")
        ? "passed"
        : "not-passed",
    );
    if (!recordReport(states, result.status === "passed"))
      return { status: "failed" };
  }
}
