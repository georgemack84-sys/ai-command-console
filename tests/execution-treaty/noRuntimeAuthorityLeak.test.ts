import { describe, expect, it } from "vitest";
import { detectExecutionTreatyBoundaryViolations, validateZeroTrustExecutorReadiness } from "@/services/execution-treaty";
import { buildExecutorConstraints } from "@/services/execution-treaty";

describe("no runtime authority leak", () => {
  it("fails closed if runtime authority or execution state leaks into the treaty", () => {
    const sourceResult = detectExecutionTreatyBoundaryViolations({
      sourceTexts: [{
        path: "tampered.ts",
        content: "import worker from 'queue-worker';\nspawn('cmd');",
      }],
      executionStarted: true,
      dispatchPerformed: false,
    });
    const constraintResult = validateZeroTrustExecutorReadiness({
      constraints: {
        ...buildExecutorConstraints(),
        mayExecute: false,
      },
      executionStarted: true,
      dispatchPerformed: false,
    });

    expect(sourceResult.valid).toBe(false);
    expect(sourceResult.failures.some((failure) => failure.code === "HANDOFF_RUNTIME_AUTHORITY_DETECTED" || failure.code === "HANDOFF_EXECUTION_BEHAVIOR_DETECTED")).toBe(true);
    expect(constraintResult.valid).toBe(false);
  });
});
