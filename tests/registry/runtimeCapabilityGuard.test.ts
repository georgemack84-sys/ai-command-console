import { describe, expect, it } from "vitest";

import { assertCapabilityAllowed, buildCapabilityAuditEvent } from "@/services/registry/runtimeCapabilityGuard";
import { getCanonicalRegistryDocument } from "@/services/registry/toolRegistry";

describe("runtimeCapabilityGuard", () => {
  it("blocks undeclared runtime write", () => {
    const entry = getCanonicalRegistryDocument().tools.find((candidate) => candidate.toolId === "read_file");
    if (!entry) throw new Error("read_file fixture missing");

    const result = assertCapabilityAllowed({
      toolId: entry.toolId,
      toolVersion: entry.version,
      registryHash: entry.registryHash,
      capabilityHash: entry.capabilityHash,
      requestedCapability: "write",
      requestedScope: "filesystem",
    });

    expect(result.allowed).toBe(false);
    expect(result.code).toBe("TOOL_CAPABILITY_VIOLATION");
  });

  it("blocks undeclared runtime network", () => {
    const entry = getCanonicalRegistryDocument().tools.find((candidate) => candidate.toolId === "filesystem.write");
    if (!entry) throw new Error("filesystem.write fixture missing");

    const result = assertCapabilityAllowed({
      toolId: entry.toolId,
      toolVersion: entry.version,
      registryHash: entry.registryHash,
      capabilityHash: entry.capabilityHash,
      requestedCapability: "network",
      requestedScope: "localhost",
    });

    expect(result.allowed).toBe(false);
    expect(result.code).toBe("TOOL_CAPABILITY_VIOLATION");
  });

  it("blocks privileged escalation unless declared", () => {
    const entry = getCanonicalRegistryDocument().tools.find((candidate) => candidate.toolId === "filesystem.write");
    if (!entry) throw new Error("filesystem.write fixture missing");

    const result = assertCapabilityAllowed({
      toolId: entry.toolId,
      toolVersion: entry.version,
      registryHash: entry.registryHash,
      capabilityHash: entry.capabilityHash,
      requestedCapability: "privileged",
      requestedScope: "filesystem",
    });

    expect(result.allowed).toBe(false);
    expect(result.code).toBe("TOOL_CAPABILITY_VIOLATION");
  });

  it("blocks trust-zone mismatches when restrictions are declared", () => {
    const entry = getCanonicalRegistryDocument().tools.find((candidate) => candidate.toolId === "filesystem.write");
    if (!entry) throw new Error("filesystem.write fixture missing");

    const result = assertCapabilityAllowed({
      toolId: entry.toolId,
      toolVersion: entry.version,
      registryHash: entry.registryHash,
      capabilityHash: entry.capabilityHash,
      requestedCapability: "write",
      requestedScope: "filesystem",
      trustZone: "CRITICAL",
    });

    expect(result.allowed).toBe(false);
    expect(result.code).toBe("CAPABILITY_TRUST_DENIED");
  });

  it("emits deterministic audit events", () => {
    const entry = getCanonicalRegistryDocument().tools.find((candidate) => candidate.toolId === "filesystem.write");
    if (!entry) throw new Error("filesystem.write fixture missing");
    const assertion = {
      toolId: entry.toolId,
      toolVersion: entry.version,
      registryHash: entry.registryHash,
      capabilityHash: entry.capabilityHash,
      requestedCapability: "write" as const,
      requestedScope: "filesystem",
    };

    const first = buildCapabilityAuditEvent({
      assertion,
      result: assertCapabilityAllowed(assertion),
    });
    const second = buildCapabilityAuditEvent({
      assertion: { ...assertion },
      result: assertCapabilityAllowed({ ...assertion }),
    });

    expect(first).toEqual(second);
  });
});
