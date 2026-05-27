import { describe, expect, it } from "vitest";
import { appendReadinessLineage } from "@/services/constitutional-autonomy-readiness-gate";

describe("appendReadinessLineage", () => {
  it("preserves append-only lineage", () => {
    const first = appendReadinessLineage({
      certificationId: "cert-1",
      readinessHash: "hash-1",
      replayHash: "replay-1",
      lineageHash: "lineage-1",
      createdAt: "2026-05-16T19:00:00.000Z",
    });
    const second = appendReadinessLineage({
      existing: first,
      certificationId: "cert-2",
      readinessHash: "hash-2",
      replayHash: "replay-2",
      lineageHash: "lineage-2",
      createdAt: "2026-05-16T19:01:00.000Z",
    });

    expect(second.entries).toHaveLength(2);
    expect(second.entries[0]).toEqual(first.entries[0]);
  });
});
