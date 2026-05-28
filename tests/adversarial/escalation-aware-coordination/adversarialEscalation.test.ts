import { describe, expect, it } from "vitest";

import { buildEscalationAwareCoordinationFixture } from "@/tests/integration/escalation-aware-coordination/helpers";

describe("adversarial escalation-aware coordination", () => {
  it("rejects escalation-triggered execution and orchestration markers", () => {
    const fixture = buildEscalationAwareCoordinationFixture({
      metadata: Object.freeze({ execute: true, selfResolve: true }),
    });
    expect(fixture.result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "ESCALATION_COORDINATION_EXECUTION_FORBIDDEN",
      "ESCALATION_COORDINATION_ORCHESTRATION_FORBIDDEN",
    ]));
  });

  it("rejects recursive escalation loops and containment bypass", () => {
    const fixture = buildEscalationAwareCoordinationFixture({
      metadata: Object.freeze({ recursive: true, continueWorkflow: true }),
    });
    expect(fixture.result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "ESCALATION_COORDINATION_RECURSIVE_ESCALATION",
      "ESCALATION_COORDINATION_ORCHESTRATION_FORBIDDEN",
    ]));
  });

  it("rejects replay mutation and synthetic continuity", () => {
    const fixture = buildEscalationAwareCoordinationFixture({
      metadata: Object.freeze({ replayMutation: true, repairReplay: true }),
    });
    expect(fixture.result.errors.map((error) => error.code)).toContain("ESCALATION_COORDINATION_SYNTHETIC_CONTINUITY");
  });
});
