import { describe, expect, it } from "vitest";
import { validateZeroTrustExecutorReadiness } from "@/services/execution-treaty";
import { buildExecutorConstraints } from "@/services/execution-treaty";

describe("zero trust executor constraints", () => {
  it("enforces no-execution constraints", () => {
    const result = validateZeroTrustExecutorReadiness({
      constraints: buildExecutorConstraints(),
      executionStarted: false,
      dispatchPerformed: false,
    });

    expect(result.valid).toBe(true);
  });
});
