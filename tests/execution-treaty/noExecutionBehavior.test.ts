import { describe, expect, it } from "vitest";
import { detectExecutionTreatyBoundaryViolations } from "@/services/execution-treaty";
import { loadExecutionTreatySources } from "./helpers";

describe("no execution behavior", () => {
  it("contains no runtime execution imports or calls", () => {
    const result = detectExecutionTreatyBoundaryViolations({
      sourceTexts: loadExecutionTreatySources(),
      executionStarted: false,
      dispatchPerformed: false,
    });

    expect(result.valid).toBe(true);
  });
});
