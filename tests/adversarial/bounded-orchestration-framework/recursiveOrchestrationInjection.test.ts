import { describe, expect, it } from "vitest";

import { buildBoundedOrchestrationFixture } from "@/tests/integration/bounded-orchestration-framework/helpers";
import { appendRoutingLineage } from "@/services/approval-aware-coordination-router";

describe("recursive orchestration injection", () => {
  it("fails closed on recursive lineage reuse", () => {
    const seed = buildBoundedOrchestrationFixture();
    const duplicatedLineage = appendRoutingLineage({
      existing: seed.routingFixture.result.lineage,
      entry: seed.routingFixture.result.lineage.entries[0],
    });
    const fixture = buildBoundedOrchestrationFixture({
      routingResult: {
        ...seed.routingFixture.result,
        lineage: duplicatedLineage,
        errors: [...seed.routingFixture.result.errors, "routing:recursive-lineage"],
      },
    });
    expect(fixture.record.validation.failClosed).toBe(true);
  });
});
