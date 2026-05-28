import { describe, expect, it } from "vitest";

import { resolveOverrideConflicts } from "@/services/human-override-contract";

describe("overrideConflictResolver", () => {
  it("detects concurrent ordering conflicts fail-closed", () => {
    const result = resolveOverrideConflicts(Object.freeze([
      Object.freeze({
        overrideId: "override-001",
        timestamp: "2026-05-16T16:00:00.000Z",
        operatorId: "operator-01",
        operatorRole: "role",
        overrideType: "freeze" as const,
        targetType: "proposal" as const,
        targetId: "proposal-001",
        reasonCode: "freeze",
        justification: "freeze",
        authoritySnapshotHash: "a",
        governanceSnapshotHash: "g",
        approvalGraphHash: "p",
        createdAt: "2026-05-16T16:00:00.000Z",
      }),
      Object.freeze({
        overrideId: "override-002",
        timestamp: "2026-05-16T16:00:00.000Z",
        operatorId: "operator-02",
        operatorRole: "role",
        overrideType: "resume" as const,
        targetType: "proposal" as const,
        targetId: "proposal-001",
        reasonCode: "resume",
        justification: "resume",
        authoritySnapshotHash: "a",
        governanceSnapshotHash: "g",
        approvalGraphHash: "p",
        createdAt: "2026-05-16T16:00:00.000Z",
      }),
    ]));
    expect(result.errors.map((error) => error.code)).toContain("OVERRIDE_ORDERING_CONFLICT");
  });
});
