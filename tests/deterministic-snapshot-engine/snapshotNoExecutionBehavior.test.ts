import { describe, expect, it } from "vitest";
import { detectSnapshotMutationViolations, loadDeterministicSnapshotSources } from "./helpers";

describe("snapshot no execution behavior", () => {
  it("imports no execution, scheduler, worker, queue, shell, or mutating modules", () => {
    const result = detectSnapshotMutationViolations({
      sourceTexts: loadDeterministicSnapshotSources(),
    });

    expect(result.valid).toBe(true);
  });
});
