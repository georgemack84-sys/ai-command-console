import { describe, expect, it } from "vitest";

import { deriveCanonicalToolId, deriveRegistryHash, validateCanonicalIdentity } from "@/services/registry/registryIdentity";
import { REGISTRY_ERROR_CODES } from "@/services/registry/registryValidator";
import { cloneFixture } from "./helpers";

describe("toolIdentity", () => {
  it("generates deterministic canonical ids", () => {
    expect(deriveCanonicalToolId("filesystem.write", "1.0.0")).toBe("filesystem.write@1.0.0");
  });

  it("rejects canonical id mismatch", () => {
    const fixture = cloneFixture();
    const entry = fixture.document.tools.find((candidate) => candidate.toolId === "filesystem.write");
    if (!entry) throw new Error("filesystem.write fixture missing");
    entry.canonicalId = "filesystem.write@9.9.9";

    const result = validateCanonicalIdentity(entry);

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.INVALID_CANONICAL_ID);
  });

  it("rejects invalid semver and floating versions", () => {
    const fixture = cloneFixture();
    const entry = fixture.document.tools[0];
    entry.version = "latest";
    entry.canonicalId = "read_file@latest";

    const result = validateCanonicalIdentity(entry);

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.INVALID_TOOL_VERSION);
  });

  it("produces stable registry hashes for identical definitions", () => {
    const fixture = cloneFixture();
    const entry = fixture.document.tools[0];
    const clone = JSON.parse(JSON.stringify(entry));

    expect(deriveRegistryHash(entry)).toBe(deriveRegistryHash(clone));
  });

  it("changes registry hash when immutable capability meaning changes", () => {
    const fixture = cloneFixture();
    const entry = fixture.document.tools.find((candidate) => candidate.toolId === "filesystem.write");
    if (!entry) throw new Error("filesystem.write fixture missing");
    const clone = JSON.parse(JSON.stringify(entry));
    clone.policyRef = "policies/other.policy.json";

    expect(deriveRegistryHash(entry)).not.toBe(deriveRegistryHash(clone));
  });

  it("ignores publication timestamps when hashing executable identity", () => {
    const fixture = cloneFixture();
    const entry = fixture.document.tools[0];
    const clone = JSON.parse(JSON.stringify(entry));
    clone.publishedAt = "2030-01-01T00:00:00.000Z";

    expect(deriveRegistryHash(entry)).toBe(deriveRegistryHash(clone));
  });
});
