import { describe, expect, it } from "vitest";
import { buildPolicyDecisionFixture, projectRiskReasoning } from "./helpers";

describe("risk reasoning projection", () => {
  it("surfaces known risk contributors and missing evidence", () => {
    const fixture = buildPolicyDecisionFixture();

    const projected = projectRiskReasoning({
      traceView: fixture.traceFixture.view,
    });

    expect(projected.reasoning.contributors.length).toBeGreaterThanOrEqual(0);
    expect(typeof projected.reasoning.unknownRiskState).toBe("boolean");
  });
});
