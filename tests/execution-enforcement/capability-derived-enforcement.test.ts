import { describe, expect, it } from "vitest";

import { getCanonicalRegistryDocument } from "@/services/registry/toolRegistry";
import {
  deriveExecutionTrustZone,
  deriveCapabilitySandbox,
  deriveCapabilityBoundaries,
  hashContainmentBoundary,
  hashSandboxProfile,
} from "@/services/execution-enforcement";

describe("capability-derived enforcement", () => {
  it("derives sandbox, trust, and boundaries deterministically", () => {
    const entry = getCanonicalRegistryDocument().tools.find((candidate) => candidate.toolId === "filesystem.write");
    if (!entry) throw new Error("filesystem.write fixture missing");

    expect(deriveExecutionTrustZone(entry)).toEqual(deriveExecutionTrustZone(entry));
    expect(deriveCapabilitySandbox(entry)).toEqual(deriveCapabilitySandbox(entry));
    expect(deriveCapabilityBoundaries(entry, "tenant-a")).toEqual(deriveCapabilityBoundaries(entry, "tenant-a"));
  });

  it("capability ordering does not alter derived hashes", () => {
    const entry = getCanonicalRegistryDocument().tools.find((candidate) => candidate.toolId === "restart_service");
    if (!entry) throw new Error("restart_service fixture missing");
    const clone = JSON.parse(JSON.stringify(entry));
    clone.runtimeCapabilities = [...clone.runtimeCapabilities].reverse();

    const trustA = deriveExecutionTrustZone(entry);
    const trustB = deriveExecutionTrustZone(clone);
    const sandboxA = deriveCapabilitySandbox(entry);
    const sandboxB = deriveCapabilitySandbox(clone);
    const boundariesA = deriveCapabilityBoundaries(entry, "tenant-a");
    const boundariesB = deriveCapabilityBoundaries(clone, "tenant-a");

    expect(hashSandboxProfile(sandboxA.sandboxProfile!)).toBe(hashSandboxProfile(sandboxB.sandboxProfile!));
    expect(hashContainmentBoundary(trustA.trustZone!, boundariesA.boundaries!))
      .toBe(hashContainmentBoundary(trustB.trustZone!, boundariesB.boundaries!));
  });
});
