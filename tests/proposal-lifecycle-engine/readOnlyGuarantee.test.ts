import { describe, expect, it } from "vitest";

import { assertProposalLifecycleSourcesAreReadOnly, buildProposalLifecycleRecord } from "@/services/proposal-lifecycle-engine";
import { buildProposalFixture, loadProposalLifecycleSources } from "./helpers";

describe("proposal lifecycle read-only guarantees", () => {
  it("does not mutate source inputs", () => {
    const { input } = buildProposalFixture();
    const before = JSON.stringify(input);
    buildProposalLifecycleRecord(input);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("does not import execution or orchestration behavior", () => {
    const sources = loadProposalLifecycleSources();
    for (const source of sources) {
      if (source.path.endsWith("proposalLifecycleGuards.ts")) {
        continue;
      }
      expect(assertProposalLifecycleSourcesAreReadOnly(source.content)).toEqual([]);
    }
  });
});
