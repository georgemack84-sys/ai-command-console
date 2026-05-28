import { describe, expect, it } from "vitest";

import { reconcileRuntimeTruth } from "../../services/recoveryVerification/truthReconciliationEngine";

describe("truth reconciliation engine", () => {
  it("detects mismatched runtime truth", () => {
    const result = reconcileRuntimeTruth({
      bundle: {
        timeline: { meta: { matchesReadModel: false } },
        readModel: { execution: { status: "completed" } },
      },
      executionState: {
        execution: { status: "failed" },
      },
      continuityState: { runtimeState: "FAILED" },
    });

    expect(result.runtimeIntegrity).toBe(false);
    expect(result.disputes).toEqual(
      expect.arrayContaining(["timeline:disputed", "execution:status_mismatch", "continuity:unsafe_runtime_state"]),
    );
  });
});
