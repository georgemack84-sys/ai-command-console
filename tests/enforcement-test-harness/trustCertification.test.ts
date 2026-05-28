import { describe, expect, it } from "vitest";
import { certifyEnforcementTrust, ENFORCEMENT_HARNESS_ERROR_CODES } from "@/services/enforcement-test-harness";
import { certifyAllHarnesses, runAllAttackHarnesses } from "./helpers";

describe("trust certification", () => {
  it("passes only when all adversarial scenarios fail closed", () => {
    const certification = certifyAllHarnesses();

    expect(certification.certified).toBe(true);
    expect(certification.failedScenarioIds).toHaveLength(0);
  });

  it("blocks certification when any scenario does not match its expected outcome", () => {
    const results = runAllAttackHarnesses();
    const tampered = [
      {
        ...results[0]!,
        actualOutcome: "DENIED" as const,
      },
      ...results.slice(1),
    ];

    const certification = certifyEnforcementTrust({ results: tampered });

    expect(certification.certified).toBe(false);
    expect(certification.errorCode).toBe(ENFORCEMENT_HARNESS_ERROR_CODES.CERTIFICATION_BLOCKED);
  });
});
