import { describe, expect, it } from "vitest";

import { detectRuntimeAuthorityDrift, evaluateUnifiedExecutionEnforcement } from "@/services/execution-enforcement";
import { buildAuthorityLockForFixture, buildEnforcementFixture } from "./helpers";

describe("runtime authority drift", () => {
  it("denies capabilityHash drift", () => {
    const input = buildEnforcementFixture({
      capabilityHash: "0".repeat(64),
    });
    const result = evaluateUnifiedExecutionEnforcement(input);
    expect(result.decision.allowed).toBe(false);
    expect(result.decision.violations.some((violation) => violation.reasonCode === "EXECUTION_PROVENANCE_INVALID")).toBe(true);
  });

  it("detects sandbox and boundary drift against an existing lock", () => {
    const lock = buildAuthorityLockForFixture();
    const drift = detectRuntimeAuthorityDrift({
      envelope: {
        ...evaluateUnifiedExecutionEnforcement(buildEnforcementFixture()).envelope!,
        sandboxProfileHash: "1".repeat(64),
      },
      authorityLock: lock,
    });

    expect(drift.valid).toBe(false);
    expect(drift.violations.some((violation) => violation.reasonCode === "RUNTIME_AUTHORITY_DRIFT_DETECTED")).toBe(true);
  });
});
