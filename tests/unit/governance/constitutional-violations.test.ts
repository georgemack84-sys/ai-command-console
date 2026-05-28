import { describe, expect, it } from "vitest";

import { detectConstitutionalViolations } from "@/services/governance/constitutionalViolations";

describe("detectConstitutionalViolations", () => {
  it("detects disputed truth, validation failure, and immutable evidence risk", () => {
    const result = detectConstitutionalViolations({
      constitutionalViolations: ["immutable_evidence_protected"],
      validationBlockedReasons: ["validation_freeze_required"],
      disputedTruth: true,
      containmentFailed: true,
    });

    expect(result).toContain("disputed_truth_detected");
    expect(result).toContain("validation_freeze_required");
    expect(result).toContain("containment_verification_failed");
  });
});
