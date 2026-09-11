import { recordReport } from "./test-report.mjs";

export default class RequiredTestsReporter {
  onTestRunEnd(modules, errors, reason) {
    const states = modules.flatMap((module) =>
      [...module.children.allTests()].map((test) => test.result().state),
    );
    if (!recordReport(states, reason === "passed" && errors.length === 0))
      process.exitCode = 1;
  }
}
