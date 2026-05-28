import { describe, expect, it } from "vitest";

import { validateOrchestrationTopology } from "@/services/bounded-orchestration-framework";
import { buildBoundedOrchestrationFixture } from "@/tests/integration/bounded-orchestration-framework/helpers";

describe("orchestration graph explosion", () => {
  it("rejects bounded graph inflation", () => {
    const fixture = buildBoundedOrchestrationFixture();
    const result = validateOrchestrationTopology({
      coordinationRecord: fixture.constitutionalFixture.record,
      routingResult: {
        ...fixture.routingFixture.result,
        lineage: {
          ...fixture.routingFixture.result.lineage,
          entries: Object.freeze([
            ...fixture.routingFixture.result.lineage.entries,
            ...fixture.routingFixture.result.lineage.entries,
            ...fixture.routingFixture.result.lineage.entries,
            ...fixture.routingFixture.result.lineage.entries,
          ]),
        },
      },
    });
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
