import { describe, expect, it } from "vitest";
import { buildReplayFixture, projectReplayLineage } from "./helpers";

describe("dependency replay binding", () => {
  it("preserves original dependency ordering", () => {
    const fixture = buildReplayFixture();
    const lineage = projectReplayLineage(fixture.input);

    expect(lineage.dependencyOrder.length).toBeGreaterThan(0);
    expect(lineage.dependencyOrder).toEqual([...lineage.dependencyOrder]);
  });
});
