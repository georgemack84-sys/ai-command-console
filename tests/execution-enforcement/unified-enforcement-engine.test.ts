import { describe, expect, it } from "vitest";

import { buildExecutionEnforcementAudit, evaluateUnifiedExecutionEnforcement } from "@/services/execution-enforcement";
import { buildEnforcementFixture } from "./helpers";

describe("unified enforcement engine", () => {
  it("allows valid derived authority envelopes", () => {
    const result = evaluateUnifiedExecutionEnforcement(buildEnforcementFixture());
    expect(result.decision.allowed).toBe(true);
    expect(result.envelope?.registryHash).toBe(buildEnforcementFixture().registryHash);
    expect(result.envelope?.capabilityHash).toBe(buildEnforcementFixture().capabilityHash);
  });

  it("denies missing capabilityHash", () => {
    const result = evaluateUnifiedExecutionEnforcement(buildEnforcementFixture({
      capabilityHash: "",
    }));
    expect(result.decision.allowed).toBe(false);
    expect(result.decision.violations.some((violation) => violation.reasonCode === "EXECUTION_PROVENANCE_INVALID")).toBe(true);
  });

  it("returns simulation-only when governance requires it", () => {
    const result = evaluateUnifiedExecutionEnforcement(buildEnforcementFixture({
      governanceMetadata: {
        ...buildEnforcementFixture().governanceMetadata,
        simulationOnly: true,
      },
    }));
    expect(result.decision.decision).toBe("SIMULATION_ONLY");
  });

  it("emits deterministic audit records", () => {
    const decision = evaluateUnifiedExecutionEnforcement(buildEnforcementFixture()).decision;
    expect(buildExecutionEnforcementAudit(decision)).toEqual(buildExecutionEnforcementAudit(decision));
  });
});
