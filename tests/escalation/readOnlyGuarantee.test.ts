import { describe, expect, it } from "vitest";
import { assertEscalationSourcesAreReadOnly } from "@/services/escalation/escalationBoundaryEnforcer";
import { loadEscalationSources } from "./helpers";

describe("escalation read-only guarantee", () => {
  it("contains no runtime control capabilities", () => {
    const violations = loadEscalationSources().flatMap((source) =>
      source.path.endsWith("escalationBoundaryEnforcer.ts")
        ? []
        : assertEscalationSourcesAreReadOnly(source.content).map((message) => `${source.path}: ${message}`));
    expect(violations).toEqual([]);
  });
});
