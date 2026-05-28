import { describe, expect, it } from "vitest";

import { validateAdvisoryConstraints } from "@/services/validation/advisoryConstraintValidation";

describe("validateAdvisoryConstraints", () => {
  it("fails when readiness attempts to drift into authority", () => {
    const result = validateAdvisoryConstraints({
      readiness: {
        advisoryOnly: true,
        liveAutonomyEnabled: false,
        requiresOperatorApproval: true,
      },
      simulationForecast: {
        advisoryOnly: true,
      },
      decisionIntelligence: {
        mutable: false,
      },
      dashboard: {
        readOnly: true,
      },
    });

    expect(result.valid).toBe(true);
    expect(result.blockedReasons).toEqual([]);
  });

  it("blocks hidden authority changes deterministically", () => {
    const result = validateAdvisoryConstraints({
      readiness: {
        advisoryOnly: true,
        liveAutonomyEnabled: true,
        requiresOperatorApproval: false,
      },
      simulationForecast: {
        advisoryOnly: false,
      },
      decisionIntelligence: {
        mutable: true,
      },
      dashboard: {
        readOnly: false,
      },
    });

    expect(result.valid).toBe(false);
    expect(result.blockedReasons).toContain("advisory_drift_live_autonomy_enabled");
    expect(result.blockedReasons).toContain("readiness_missing_operator_approval");
    expect(result.blockedReasons).toContain("simulation_not_advisory_only");
    expect(result.blockedReasons).toContain("dashboard_not_read_only");
  });
});
