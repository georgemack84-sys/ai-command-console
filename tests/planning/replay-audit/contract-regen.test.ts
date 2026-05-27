import { describe, expect, it } from "vitest";

import { buildReplayAuditReadiness } from "@/services/planning/replay-audit";
import { buildReplayAuditFixture } from "./helpers";

describe("contract regeneration detection", () => {
  it("rejects approval contract rehydration", () => {
    const fixture = buildReplayAuditFixture();
    delete fixture.executionCompatibilityContract.compatibilitySnapshot.scopeBoundaries["step-read"];
    const result = buildReplayAuditReadiness(fixture);
    expect(result.failures.some((failure) => failure.code === "PHASE4_2H_APPROVAL_CONTRACT_REHYDRATION_DETECTED")).toBe(true);
  });

  it("rejects rollback contract regeneration", () => {
    const fixture = buildReplayAuditFixture();
    fixture.executionCompatibilityContract.rollbackContracts.push({
      stepId: "step-read",
      required: false,
      checkpointRequired: false,
      compensationRequired: false,
      rollbackOrder: 99,
    });
    const result = buildReplayAuditReadiness(fixture);
    expect(result.failures.some((failure) => failure.code === "PHASE4_2H_ROLLBACK_CONTRACT_REGENERATION_DETECTED")).toBe(true);
  });
});
