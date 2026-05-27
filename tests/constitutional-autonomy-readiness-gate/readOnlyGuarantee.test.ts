import { describe, expect, it } from "vitest";
import { assertReadinessSourcesAreReadOnly } from "@/services/constitutional-autonomy-readiness-gate";
import { loadReadinessGateSources } from "./helpers";

describe("constitutional autonomy readiness read-only guarantee", () => {
  it("contains no runtime control capabilities", () => {
    const violations = loadReadinessGateSources().flatMap((source) =>
      assertReadinessSourcesAreReadOnly(source.content).map((message) => `${source.path}: ${message}`));

    expect(violations).toEqual([]);
  });
});
