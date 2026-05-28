import { describe, expect, it } from "vitest";
import { verifyFailureSnapshotIntegrity } from "@/services/enforcement-test-harness";
import { evaluateEnforcementFixture } from "./helpers";

describe("failure snapshot verification", () => {
  it("detects tampered failure snapshots", () => {
    const result = evaluateEnforcementFixture({ freezeBypassAttempted: true });
    const tampered = {
      ...result,
      snapshot: {
        ...result.snapshot,
        snapshotHash: "sha256:tampered",
      },
    };

    const verification = verifyFailureSnapshotIntegrity(tampered);

    expect(verification.valid).toBe(false);
    expect(verification.errorCode).toBe("FAILURE_SNAPSHOT_TAMPERED");
  });
});
