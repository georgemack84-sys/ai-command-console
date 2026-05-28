import { describe, expect, it } from "vitest";

import { collectRecoveryDecisionEvidence } from "@/services/decision/recoveryDecisionEvidence";

describe("collectRecoveryDecisionEvidence", () => {
  it("preserves forecast lineage and immutable evidence references", () => {
    const result = collectRecoveryDecisionEvidence({
      dashboard: {
        auditHistory: [{ id: "audit_1" }],
        continuityConvergence: { evidence: ["conv_1"] },
      },
      forecasting: {
        summary: {
          simulations: [{
            forecastLineage: ["lineage_1"],
            evidenceSources: ["audit_1"],
          }],
        },
      },
    } as never);

    expect(result.forecastLineageIds).toContain("lineage_1");
    expect(result.evidenceSources).toContain("audit_1");
  });
});
