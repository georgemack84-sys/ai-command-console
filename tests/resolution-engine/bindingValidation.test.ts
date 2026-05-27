import { describe, expect, it } from "vitest";

import { resolveExecutionBinding } from "@/services/resolution-engine";
import { buildResolutionFixture } from "./helpers";

describe("binding validation", () => {
  it("fails closed when runtime authority hashes are missing", () => {
    const fixture = buildResolutionFixture();

    const result = resolveExecutionBinding({
      ...fixture,
      runtime: {
        ...fixture.runtime,
        envelope: {
          ...fixture.runtime.envelope,
          capabilityHash: "",
        },
      },
    });
    expect(result.ok).toBe(false);
    expect(result.failures.some((failure) => failure.code === "TOOL_RUNTIME_AUTHORITY_INVALID")).toBe(true);
  });

  it("fails closed when governance hashes are missing", () => {
    const fixture = buildResolutionFixture();

    const result = resolveExecutionBinding({
      ...fixture,
      governance: {
        ...fixture.governance,
        attribution: {
          ...fixture.governance.attribution,
          governanceHash: undefined,
        },
      },
    });
    expect(result.ok).toBe(false);
    expect(result.failures.some((failure) => failure.code === "TOOL_GOVERNANCE_COMPATIBILITY_INVALID")).toBe(true);
  });

  it("rejects registry hash mismatch", () => {
    const fixture = buildResolutionFixture();

    const result = resolveExecutionBinding({
      ...fixture,
      runtime: {
        ...fixture.runtime,
        envelope: {
          ...fixture.runtime.envelope,
          registryHash: "forged",
        },
      },
    });
    expect(result.ok).toBe(false);
    expect(result.failures.some((failure) => failure.code === "TOOL_REGISTRY_HASH_INVALID")).toBe(true);
  });
});
