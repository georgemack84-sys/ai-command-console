import { describe, expect, it } from "vitest";
import { buildStepTraceFixture, projectValidationView } from "./helpers";

describe("validation projection", () => {
  it("shows all validator outcomes and failure reasons", () => {
    const fixture = buildStepTraceFixture();
    const projected = projectValidationView(fixture.validationFixture.output);

    expect(projected.items).toHaveLength(9);
    expect(projected.items.map((item) => item.validator)).toEqual([
      "schema",
      "dependency",
      "capability",
      "governance",
      "replay",
      "rollback",
      "runtime",
      "isolation",
      "integrity",
    ]);
  });
});
