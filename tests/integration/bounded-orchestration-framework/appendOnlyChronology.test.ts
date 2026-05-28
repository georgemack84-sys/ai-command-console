import { describe, expect, it } from "vitest";

import { buildBoundedOrchestrationFixture } from "./helpers";

describe("bounded orchestration chronology", () => {
  it("preserves append-only lineage", () => {
    const first = buildBoundedOrchestrationFixture();
    const second = buildBoundedOrchestrationFixture({
      existingLineage: first.record.lineage,
    });
    expect(first.record.lineage.entries.length).toBe(1);
    expect(second.record.lineage.entries.length).toBe(2);
  });
});
