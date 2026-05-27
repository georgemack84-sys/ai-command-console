import { describe, expect, it } from "vitest";

import { attributeGovernanceDrift, buildGovernanceLineageChild } from "@/services/governance-attribution";
import { buildGovernanceFixture } from "./helpers";

describe("governance drift attributor", () => {
  it("detects governance drift without lineage continuity", () => {
    const { attributionInput, attribution, lineageRoot, provenanceEvents } = buildGovernanceFixture();
    const drifted = {
      ...attributionInput,
      replayContainmentHash: "drifted-replay",
    };

    const result = attributeGovernanceDrift({
      attributionInput: drifted,
      previousGovernanceHash: attribution.governanceHash!,
      lineageNodes: [lineageRoot],
      provenanceEvents,
    });

    expect(result.driftDetected).toBe(true);
    expect(result.failures.some((failure) => failure.code === "TOOL_GOVERNANCE_DRIFT_DETECTED")).toBe(true);
  });

  it("accepts changed governance with appended lineage continuity", () => {
    const { attributionInput, attribution, lineageRoot, provenanceEvents, entry } = buildGovernanceFixture();
    const drifted = {
      ...attributionInput,
      replayContainmentHash: "drifted-replay",
    };
    const child = buildGovernanceLineageChild({
      parent: lineageRoot,
      governanceHash: attribution.governanceHash!,
      toolId: entry.toolId,
      toolVersion: entry.version,
    });

    const result = attributeGovernanceDrift({
      attributionInput: drifted,
      previousGovernanceHash: attribution.governanceHash!,
      lineageNodes: [lineageRoot, child],
      provenanceEvents,
    });

    expect(result.failures.some((failure) => failure.code === "TOOL_GOVERNANCE_DRIFT_DETECTED")).toBe(false);
  });
});
