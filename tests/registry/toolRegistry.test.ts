import { describe, expect, it } from "vitest";

import { getCanonicalRegistryDocument, getRegistryEntryByCanonicalId, getToolRegistry, getToolRegistryVersion } from "@/services/registry/toolRegistry";

describe("toolRegistry", () => {
  it("exposes deterministic registry entries", () => {
    const registry = getToolRegistry();
    expect(getToolRegistryVersion()).toBe("4.3E");
    expect(registry.some((entry) => entry.toolId === "read_file")).toBe(true);
    expect(registry.some((entry) => entry.toolId === "restart_service" && entry.enabled === false)).toBe(true);
    expect(registry.some((entry) => entry.toolId === "filesystem.write" && entry.approvalRequired === true)).toBe(true);
  });

  it("loads the canonical registry document from disk", () => {
    const document = getCanonicalRegistryDocument();
    expect(document.registryVersion).toBe("4.3E");
    expect(document.tools.some((entry) => entry.toolId === "filesystem.write")).toBe(true);
  });

  it("derives immutable canonical tool identities", () => {
    const entry = getRegistryEntryByCanonicalId("filesystem.write@1.0.0");
    expect(entry?.canonicalId).toBe("filesystem.write@1.0.0");
    expect(entry?.lineageId).toBe("filesystem.write");
    expect(entry?.registryHash).toMatch(/^[a-f0-9]{64}$/);
    expect(entry?.capabilityHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
