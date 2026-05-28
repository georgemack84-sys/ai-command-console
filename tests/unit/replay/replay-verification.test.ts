import { describe, expect, it } from "vitest";

import { verifyReplay } from "../../../services/replay/replayVerificationEngine";

describe("replay verification engine", () => {
  it("verifies deterministic replay with complete evidence", () => {
    const result = verifyReplay({
      executionId: "exec-1",
      ledgerEvents: [
        { sequence: 1, eventType: "execution.started", eventPayload: { checkpointState: "running", outputHash: "hash-1" } },
        { sequence: 2, eventType: "execution.completed", eventPayload: { checkpointState: "completed", outputHash: "hash-2" } },
      ],
      historicalState: {
        runtimeState: "completed",
        outputHash: "hash-2",
      },
      auditEvents: [{ type: "RECOVERY_APPROVED" }],
      continuitySnapshots: [{ snapshotId: "snapshot-1", runtimeState: "HEALTHY", timestamp: "2026-05-08T12:00:04.000Z" }],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.verified).toBe(true);
      expect(result.data.divergences).toHaveLength(0);
    }
  });

  it("blocks replay verification when evidence is incomplete", () => {
    const result = verifyReplay({
      executionId: "exec-1",
      ledgerEvents: [],
      historicalState: null,
      auditEvents: [],
      continuitySnapshots: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("REPLAY_EVIDENCE_INCOMPLETE");
    }
  });
});
