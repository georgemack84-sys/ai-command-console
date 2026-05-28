import { describe, expect, it } from "vitest";

import { buildReplayAuditReadiness } from "@/services/planning/replay-audit";
import { buildReplayAuditFixture } from "./helpers";

describe("compatibility truth validator", () => {
  it("rejects missing executionTruthHash", () => {
    const fixture = buildReplayAuditFixture();
    (fixture.executionCompatibilityContract as { executionTruthHash: string }).executionTruthHash = "";
    const result = buildReplayAuditReadiness(fixture);
    expect(result.verdict).toBe("REPLAY_AUDIT_BLOCKED");
    expect(result.failures.some((failure) => failure.code === "PHASE4_2H_MISSING_EXECUTION_TRUTH_HASH")).toBe(true);
  });

  it("rejects missing executionCompatibilityHash", () => {
    const fixture = buildReplayAuditFixture();
    (fixture.executionCompatibilityContract as { executionCompatibilityHash: string }).executionCompatibilityHash = "";
    const result = buildReplayAuditReadiness(fixture);
    expect(result.failures.some((failure) => failure.code === "PHASE4_2H_MISSING_EXECUTION_COMPATIBILITY_HASH")).toBe(true);
  });

  it("rejects missing compatibility snapshot", () => {
    const fixture = buildReplayAuditFixture();
    // @ts-expect-error test mutation
    fixture.executionCompatibilityContract.compatibilitySnapshot = undefined;
    const result = buildReplayAuditReadiness(fixture);
    expect(result.failures.some((failure) => failure.code === "PHASE4_2H_MISSING_COMPATIBILITY_SNAPSHOT")).toBe(true);
  });

  it("rejects compatibility hash drift", () => {
    const fixture = buildReplayAuditFixture();
    const result = buildReplayAuditReadiness({
      ...fixture,
      expectedExecutionCompatibilityHash: `${fixture.executionCompatibilityContract.executionCompatibilityHash}-drift`,
    });
    expect(result.failures.some((failure) => failure.code === "PHASE4_2H_COMPATIBILITY_HASH_DRIFT")).toBe(true);
  });
});
