import { describe, expect, it } from "vitest";

import { enforceApprovalSafety } from "@/services/planning/execution-safety/approval-enforcement-engine";

import { buildExecutionSafetyFixture } from "./helpers";

describe("approval enforcement engine", () => {
  it("produces approval requirements from execution truth governance envelope", () => {
    const fixture = buildExecutionSafetyFixture();
    fixture.executionTruthPackage.governanceEnvelope.requiredApprovals = ["production", "rollback"];

    const approvals = enforceApprovalSafety(fixture.executionTruthPackage);
    expect(approvals).toHaveLength(2);
    expect(approvals.every((approval) => approval.required)).toBe(true);
  });
});
