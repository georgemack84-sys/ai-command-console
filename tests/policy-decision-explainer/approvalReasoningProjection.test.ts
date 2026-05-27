import { describe, expect, it } from "vitest";
import { buildPolicyDecisionFixture, projectApprovalReasoning } from "./helpers";

describe("approval reasoning projection", () => {
  it("shows approvals required, received, and missing", () => {
    const fixture = buildPolicyDecisionFixture();

    const projected = projectApprovalReasoning({
      traceView: fixture.traceFixture.view,
      treaty: fixture.traceFixture.validationFixture.context.treaty,
    });

    expect(projected.reasoning.approvalsRequired.length).toBe(1);
    expect(projected.reasoning.approvalLineage.length).toBeGreaterThan(0);
  });
});
