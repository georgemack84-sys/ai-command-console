import { describe, expect, it } from "vitest";

import { reconstructReplayHistory } from "../../../services/replay/replayReconstructionEngine";

describe("replay reconstruction engine", () => {
  it("prefers ledger ordering over timestamps when reconstructing replay state", () => {
    const result = reconstructReplayHistory({
      executionId: "exec-1",
      ledgerEvents: [
        {
          sequence: 2,
          createdAt: "2026-05-08T12:00:02.000Z",
          eventType: "execution.completed",
          eventPayload: { checkpointState: "completed" },
        },
        {
          sequence: 1,
          createdAt: "2026-05-08T12:00:03.000Z",
          eventType: "execution.started",
          eventPayload: { checkpointState: "running" },
        },
      ],
      auditEvents: [
        { type: "RECOVERY_APPROVED" },
      ],
      continuitySnapshots: [
        { snapshotId: "snapshot-1", runtimeState: "HEALTHY", timestamp: "2026-05-08T12:00:04.000Z" },
      ],
    });

    expect(result.deterministic).toBe(true);
    expect(result.replaySequence).toEqual(["execution.started", "execution.completed"]);
    expect(result.reconstructedStates).toEqual(["running", "completed"]);
  });

  it("fails closed when critical replay evidence is missing", () => {
    const result = reconstructReplayHistory({
      executionId: "exec-1",
      ledgerEvents: [],
      auditEvents: [],
      continuitySnapshots: [],
    });

    expect(result.deterministic).toBe(false);
    expect(result.missingEvidence).toContain("ledger:missing");
    expect(result.reconstructionConfidence).toBeLessThan(0.5);
  });
});
