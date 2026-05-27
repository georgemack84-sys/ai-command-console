import { describe, expect, it } from "vitest";

import { classifySafeActionRisk } from "@/services/safe-action-catalog";

describe("safeActionRiskClassifier", () => {
  it("classifies known action categories into fixed risk classes", () => {
    expect(classifySafeActionRisk("observe")).toBe("read_only");
    expect(classifySafeActionRisk("recommend")).toBe("advisory");
    expect(classifySafeActionRisk("simulate")).toBe("simulation_only");
    expect(classifySafeActionRisk("escalate")).toBe("operator_escalation");
    expect(classifySafeActionRisk("pause_request")).toBe("operator_escalation");
    expect(classifySafeActionRisk("prepare_handoff")).toBe("handoff_preparation");
  });

  it("fails closed for unknown categories", () => {
    expect(classifySafeActionRisk("invented")).toBe("forbidden");
  });
});
