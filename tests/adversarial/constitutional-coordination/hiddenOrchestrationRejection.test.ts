import { describe, expect, it } from "vitest";

import { buildConstitutionalCoordinationFixture } from "@/tests/integration/constitutional-coordination/helpers";

describe("constitutional coordination hidden orchestration rejection", () => {
  it("fails closed on workflow synthesis markers", () => {
    const fixture = buildConstitutionalCoordinationFixture({
      metadata: { workflowPlan: "dispatch-step" },
    });
    expect(fixture.record.errors.length).toBeGreaterThan(0);
  });
});
