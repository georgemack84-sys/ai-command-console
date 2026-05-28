import { describe, expect, it } from "vitest";

import { buildSurvivabilityProtocols } from "@/services/containment/survivabilityProtocols";

describe("survivability protocols", () => {
  it("returns deterministic protocol guidance", () => {
    const result = buildSurvivabilityProtocols({
      recommendedAction: "ISOLATE",
      containmentRequired: true,
      emergencyStabilizationRequired: false,
      operatorInterventionRequired: true,
    });

    expect(result.protocols).toEqual(["preserve_audit_lineage", "freeze_unsafe_coordination", "operator_review_required", "isolate_failing_domains"]);
  });
});
