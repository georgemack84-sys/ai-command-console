import { describe, expect, it } from "vitest";
import { assertEscalationSourcesAreReadOnly } from "@/services/constitutional-escalation-layer";
import { loadConstitutionalEscalationSources } from "./helpers";

describe("constitutional escalation read-only guarantee", () => {
  it("contains no runtime or orchestration capabilities", () => {
    const violations = loadConstitutionalEscalationSources().flatMap((source) =>
      assertEscalationSourcesAreReadOnly(source.content).map((message) => `${source.path}: ${message}`));

    expect(violations).toEqual([]);
  });
});
