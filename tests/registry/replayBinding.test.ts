import { describe, expect, it } from "vitest";

import { validateReplayToolBinding, REGISTRY_ERROR_CODES } from "@/services/registry/registryValidator";
import { cloneFixture } from "./helpers";

describe("replayBinding", () => {
  it("accepts valid replay bindings", () => {
    const fixture = cloneFixture();
    const entry = fixture.document.tools.find((candidate) => candidate.toolId === "filesystem.write");
    if (!entry) throw new Error("filesystem.write fixture missing");

    const result = validateReplayToolBinding({
      binding: {
        toolId: entry.toolId,
        toolVersion: entry.version,
        registryHash: entry.registryHash,
        capabilityHash: entry.capabilityHash,
        canonicalToolId: entry.canonicalId,
      },
      entries: fixture.document.tools,
    });

    expect(result.valid).toBe(true);
  });

  it("fails when replay version is missing", () => {
    const fixture = cloneFixture();
    const result = validateReplayToolBinding({
      binding: {
        toolId: "filesystem.write",
        toolVersion: "" as never,
        registryHash: "abc",
        capabilityHash: "def",
      },
      entries: fixture.document.tools,
    });

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.REPLAY_BINDING_FAILURE);
  });

  it("fails when registry hash drifts", () => {
    const fixture = cloneFixture();
    const entry = fixture.document.tools.find((candidate) => candidate.toolId === "filesystem.write");
    if (!entry) throw new Error("filesystem.write fixture missing");

    const result = validateReplayToolBinding({
      binding: {
        toolId: entry.toolId,
        toolVersion: entry.version,
        registryHash: "0".repeat(64),
        capabilityHash: entry.capabilityHash,
        canonicalToolId: entry.canonicalId,
      },
      entries: fixture.document.tools,
    });

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.REGISTRY_HASH_MISMATCH);
  });

  it("rejects unpublished or revoked targets", () => {
    const fixture = cloneFixture();
    const entry = fixture.document.tools[0];
    entry.status = "revoked";

    const result = validateReplayToolBinding({
      binding: {
        toolId: entry.toolId,
        toolVersion: entry.version,
        registryHash: entry.registryHash,
        capabilityHash: entry.capabilityHash,
        canonicalToolId: entry.canonicalId,
      },
      entries: fixture.document.tools,
    });

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.UNPUBLISHED_EXECUTION_TARGET);
  });

  it("fails when capability hash drifts", () => {
    const fixture = cloneFixture();
    const entry = fixture.document.tools.find((candidate) => candidate.toolId === "filesystem.write");
    if (!entry) throw new Error("filesystem.write fixture missing");

    const result = validateReplayToolBinding({
      binding: {
        toolId: entry.toolId,
        toolVersion: entry.version,
        registryHash: entry.registryHash,
        capabilityHash: "1".repeat(64),
        canonicalToolId: entry.canonicalId,
      },
      entries: fixture.document.tools,
    });

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.CAPABILITY_REPLAY_MISMATCH);
  });
});
