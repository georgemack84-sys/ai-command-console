import { describe, expect, it } from "vitest";

import { resolveGovernanceAttribution } from "@/services/governance-attribution";
import { buildGovernanceFixture } from "./helpers";

describe("governance attribution resolver", () => {
  it("fails closed when governance metadata is missing", () => {
    const { attributionInput } = buildGovernanceFixture();
    const entry = JSON.parse(JSON.stringify(attributionInput.entry));
    delete entry.governanceMetadata;

    const result = resolveGovernanceAttribution({
      ...attributionInput,
      entry,
    });

    expect(result.valid).toBe(false);
    expect(result.failures[0]?.code).toBe("TOOL_GOVERNANCE_METADATA_MISSING");
  });

  it("cannot expand runtime authority through weaker governance", () => {
    const { attributionInput } = buildGovernanceFixture();
    const entry = JSON.parse(JSON.stringify(attributionInput.entry));
    entry.runtimeCapabilities = ["privileged"];
    entry.governanceMetadata.approvalLevel = "none";

    const result = resolveGovernanceAttribution({
      ...attributionInput,
      entry,
    });

    expect(result.valid).toBe(false);
    expect(result.failures.some((failure) => failure.code === "GOVERNANCE_CANNOT_EXPAND_RUNTIME_AUTHORITY")).toBe(true);
  });
});
