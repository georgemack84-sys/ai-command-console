import { describe, expect, it } from "vitest";

import { buildGovernanceLineageChild, validateGovernanceLineage } from "@/services/governance-attribution";
import { buildGovernanceFixture } from "./helpers";

describe("governance lineage graph", () => {
  it("is append-only with valid parent continuity", () => {
    const { attribution, lineageRoot, entry } = buildGovernanceFixture();
    const child = buildGovernanceLineageChild({
      parent: lineageRoot,
      governanceHash: attribution.governanceHash!,
      toolId: entry.toolId,
      toolVersion: entry.version,
    });

    expect(validateGovernanceLineage([lineageRoot, child])).toEqual([]);
  });

  it("fails closed on lineage tampering", () => {
    const { attribution, lineageRoot, entry } = buildGovernanceFixture();
    const child = buildGovernanceLineageChild({
      parent: lineageRoot,
      governanceHash: attribution.governanceHash!,
      toolId: entry.toolId,
      toolVersion: entry.version,
    });
    const tampered = {
      ...child,
      parentHash: "forged-parent",
    };

    expect(validateGovernanceLineage([lineageRoot, tampered])[0]?.code).toBe("TOOL_GOVERNANCE_LINEAGE_INVALID");
  });
});
