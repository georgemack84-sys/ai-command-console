import { describe, expect, it } from "vitest";
import { NuruPriorityService } from "@/src/server/services/nuru-priority-service";

describe("Nuru priority engine", () => {
  it("ranks important owner architecture with a detected contradiction above low-authority duplicates", () => {
    const high = NuruPriorityService.score({ artifactType: "Architecture Decision", novelty: "HIGH", projectRelevant: true, sourceAuthority: "OWNER", conflictDetected: true, relationshipCount: 4, duplicateLikely: false, ageDays: 0, humanPriority: 0 });
    const low = NuruPriorityService.score({ artifactType: "Knowledge Note", novelty: "LOW", projectRelevant: false, sourceAuthority: "LOW", conflictDetected: false, relationshipCount: 0, duplicateLikely: true, ageDays: 500, humanPriority: 0 });
    expect(high.score).toBeGreaterThan(low.score); expect(high.factors).toEqual(expect.arrayContaining([expect.objectContaining({ label: "Architecture decision", points: 30 }), expect.objectContaining({ label: "Owner directive", points: 25 })]));
  });
});
