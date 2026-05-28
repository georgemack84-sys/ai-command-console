import { describe, expect, it } from "vitest";

import { buildBoundedOrchestrationRecord } from "@/services/bounded-orchestration-framework";
import { buildBoundedOrchestrationFixture } from "@/tests/integration/bounded-orchestration-framework/helpers";

describe("bounded orchestration governance binding", () => {
  it("fails closed on governance mismatch", () => {
    const fixture = buildBoundedOrchestrationFixture();
    const record = buildBoundedOrchestrationRecord({
      ...fixture.orchestrationInput,
      routingResult: {
        ...fixture.routingResult,
        governanceSnapshotId: "governance-mismatch",
      },
    });

    expect(record.validation.failClosed).toBe(true);
    expect(record.validation.errors.map((error) => error.code)).toContain("ORCHESTRATION_BOUNDARY_GOVERNANCE_MISMATCH");
  });

  it("inherits containment freeze without elevation", () => {
    const fixture = buildBoundedOrchestrationFixture({
      metadata: Object.freeze({ tag: "steady-state" }),
    });
    const record = buildBoundedOrchestrationRecord({
      ...fixture.orchestrationInput,
      containmentValidation: {
        ...fixture.orchestrationInput.containmentValidation,
        containmentState: "frozen",
        failClosed: true,
      },
    });

    expect(record.ceiling).toBe("frozen");
    expect(record.orchestrationState).toBe("frozen");
  });
});
