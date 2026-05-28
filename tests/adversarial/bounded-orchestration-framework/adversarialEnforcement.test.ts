import { describe, expect, it } from "vitest";

import { buildBoundedOrchestrationFixture } from "@/tests/integration/bounded-orchestration-framework/helpers";

describe("bounded orchestration adversarial enforcement", () => {
  it("rejects recursive orchestration injection", () => {
    const fixture = buildBoundedOrchestrationFixture({
      metadata: Object.freeze({ mode: "delegationLoop recursive orchestrationChild" }),
    });
    expect(fixture.record.validation.errors.map((error) => error.code)).toContain("ORCHESTRATION_BOUNDARY_RECURSIVE_DELEGATION");
  });

  it("rejects hidden workflow spawning and dynamic orchestration generation", () => {
    const fixture = buildBoundedOrchestrationFixture({
      metadata: Object.freeze({ mode: "generated_workflow dynamicOrchestration" }),
    });
    expect(fixture.record.validation.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "ORCHESTRATION_BOUNDARY_HIDDEN_ORCHESTRATION",
      "ORCHESTRATION_BOUNDARY_DYNAMIC_GENERATION",
    ]));
  });

  it("rejects runtime mutation and containment bypass attempts", () => {
    const fixture = buildBoundedOrchestrationFixture({
      metadata: Object.freeze({ mode: "mutateRuntime bypassGovernance" }),
    });
    expect(fixture.record.validation.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "ORCHESTRATION_BOUNDARY_RUNTIME_MUTATION",
      "ORCHESTRATION_BOUNDARY_GOVERNANCE_MISMATCH",
    ]));
  });

  it("rejects orchestration continuation attempts", () => {
    const fixture = buildBoundedOrchestrationFixture({
      metadata: Object.freeze({ mode: "continue workflow retry" }),
    });
    expect(fixture.record.validation.failClosed).toBe(true);
    expect(fixture.record.validation.errors.map((error) => error.code)).toContain("ORCHESTRATION_BOUNDARY_HIDDEN_ORCHESTRATION");
  });
});
