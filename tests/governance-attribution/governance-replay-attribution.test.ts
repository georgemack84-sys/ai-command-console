import { describe, expect, it } from "vitest";

import { reconstructGovernanceReplayAttribution } from "@/services/governance-attribution";
import { buildGovernanceFixture } from "./helpers";

describe("governance replay attribution", () => {
  it("reconstructs governance state deterministically", () => {
    const { attributionInput, attribution, lineageRoot, provenanceEvents, evidenceBundle } = buildGovernanceFixture();

    const replay = reconstructGovernanceReplayAttribution({
      attributionInput,
      expectedGovernanceHash: attribution.governanceHash!,
      expectedLineage: lineageRoot,
      provenanceEvents,
      evidenceBundle,
    });

    expect(replay.valid).toBe(true);
  });

  it("rejects forged governance replay substitution", () => {
    const { attributionInput, lineageRoot, provenanceEvents, evidenceBundle } = buildGovernanceFixture();

    const replay = reconstructGovernanceReplayAttribution({
      attributionInput,
      expectedGovernanceHash: "forged-hash",
      expectedLineage: lineageRoot,
      provenanceEvents,
      evidenceBundle,
    });

    expect(replay.valid).toBe(false);
    expect(replay.failures.some((failure) => failure.code === "TOOL_GOVERNANCE_HASH_MISMATCH")).toBe(true);
  });
});
