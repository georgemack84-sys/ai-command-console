import { describe, expect, it } from "vitest";

import { buildIntentCoordinationGovernanceRecord } from "@/services/intent-coordination-governance-core";
import { buildIntentCoordinationGovernanceFixture } from "./helpers";

describe("intent coordination governance core", () => {
  it("builds a derived-only coordination governance record", () => {
    const { record } = buildIntentCoordinationGovernanceFixture();
    expect(record.derivedOnly).toBe(true);
    expect(record.topology.derivedOnly).toBe(true);
    expect(record.governanceSchema.executionAuthority).toBe(false);
    expect(record.validation.replayValid).toBe(true);
    expect(record.errors).toEqual([]);
  });

  it("preserves deterministic output for identical input", () => {
    const { input } = buildIntentCoordinationGovernanceFixture();
    const left = buildIntentCoordinationGovernanceRecord(input);
    const right = buildIntentCoordinationGovernanceRecord(input);
    expect(left.coordinationHash).toBe(right.coordinationHash);
    expect(left.topology.topologyHash).toBe(right.topology.topologyHash);
    expect(left.replayBinding).toEqual(right.replayBinding);
  });
});
