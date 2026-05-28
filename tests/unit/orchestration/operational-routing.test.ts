import { describe, expect, it } from "vitest";

import { buildOperationalRoute } from "@/services/orchestration/operationalRouting";

describe("buildOperationalRoute", () => {
  it("preserves constitutional sequencing", () => {
    const result = buildOperationalRoute({
      requestType: "recovery.review",
      constitutionalState: "RESTRICTED",
      allowed: true,
    });

    expect(result.stages).toEqual([
      "validation_integrity_verification",
      "constitutional_validation",
      "governance_enforcement",
      "operational_risk_analysis",
      "approval_evaluation",
      "containment_verification",
      "governance_arbitration",
      "execution_authorization",
      "operational_supervision",
      "verification",
      "immutable_audit_append",
    ]);
  });
});
