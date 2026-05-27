import { describe, expect, it } from "vitest";

import {
  assertCoordinationGovernanceSourcesAreReadOnly,
  buildIntentCoordinationGovernanceRecord,
} from "@/services/intent-coordination-governance-core";
import { buildIntentCoordinationGovernanceFixture, loadIntentCoordinationGovernanceSources } from "./helpers";

describe("intent coordination read-only guarantees", () => {
  it("does not mutate source inputs", () => {
    const { input } = buildIntentCoordinationGovernanceFixture();
    const before = JSON.stringify(input);
    buildIntentCoordinationGovernanceRecord(input);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("does not import execution or orchestration behavior", () => {
    const violations = loadIntentCoordinationGovernanceSources().flatMap((source) =>
      source.path.endsWith("coordinationGuards.ts")
        ? []
        : assertCoordinationGovernanceSourcesAreReadOnly(source.content).map((message) => `${source.path}: ${message}`));

    expect(violations).toEqual([]);
  });
});
