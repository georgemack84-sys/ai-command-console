import { describe, expect, it } from "vitest";

import { determineExecutionEscalationLevel } from "@/services/planning/execution-safety/execution-escalation-engine";
import { enforceRollbackSafety } from "@/services/planning/execution-safety/rollback-enforcement-engine";

import { buildExecutionSafetyFixture } from "./helpers";

describe("execution escalation engine", () => {
  it("elevates irreversible rollback exposure", () => {
    const fixture = buildExecutionSafetyFixture();
    fixture.executionTruthPackage.riskProfile.stepSignals[0] = {
      ...fixture.executionTruthPackage.riskProfile.stepSignals[0]!,
      destructive: true,
      rollbackCapability: "none",
    };

    const rollback = enforceRollbackSafety(fixture.executionTruthPackage);
    const level = determineExecutionEscalationLevel(fixture.executionTruthPackage, rollback);
    expect(["MEDIUM", "HIGH", "CRITICAL"]).toContain(level);
  });
});
