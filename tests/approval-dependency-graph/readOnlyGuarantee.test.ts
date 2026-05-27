import { describe, expect, it } from "vitest";

import { assertApprovalDependencySourcesAreReadOnly, buildApprovalDependencyGraph } from "@/services/approval-dependency-graph";
import { buildApprovalDependencyFixture, loadApprovalDependencyGraphSources } from "./helpers";

describe("approval dependency read-only guarantees", () => {
  it("does not mutate source inputs", () => {
    const { input } = buildApprovalDependencyFixture();
    const before = JSON.stringify(input);
    buildApprovalDependencyGraph(input);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("does not import execution or orchestration behavior", () => {
    const sources = loadApprovalDependencyGraphSources();
    for (const source of sources) {
      if (source.path.endsWith("approvalDependencyGuards.ts")) {
        continue;
      }
      expect(assertApprovalDependencySourcesAreReadOnly(source.content)).toEqual([]);
    }
  });
});
