import { describe, expect, it } from "vitest";

import { buildGovernanceEnvelope, scoreRiskDeterministically } from "@/services/planning/execution-truth";
import type { SequentialDependencyValidationResult } from "@/services/planning/dependencies";

describe("governance envelope builder", () => {
  it("fails closed on forbidden production mutation without idempotency", () => {
    const profile = scoreRiskDeterministically([
      {
        stepId: "mutate-prod",
        destructive: true,
        externalSideEffect: true,
        idempotent: false,
        targetEnvironment: "production",
        rollbackCapability: "none",
        autonomySensitivity: "critical",
        terminalBranch: false,
        failureBranch: false,
        rollbackBranch: false,
        source: "normalized_step_inputs",
      },
    ]);
    const dependencyValidation = {
      ok: true,
      planId: "plan-1",
      dependencyGraphFingerprint: "fingerprint",
      errors: [],
      warnings: [],
    } as SequentialDependencyValidationResult;

    const envelope = buildGovernanceEnvelope(profile, dependencyValidation);
    expect(envelope.allowed).toBe(false);
    expect(envelope.blockedReasons.length).toBeGreaterThan(0);
  });
});
