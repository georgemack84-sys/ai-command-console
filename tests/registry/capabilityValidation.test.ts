import { describe, expect, it } from "vitest";

import { validateRegistryDocument, validateRegistryEntry, REGISTRY_ERROR_CODES } from "@/services/registry/registryValidator";
import { cloneFixture } from "./helpers";

describe("capabilityValidation", () => {
  it("accepts valid capability declarations", () => {
    const fixture = cloneFixture();
    const entry = fixture.document.tools.find((candidate) => candidate.toolId === "filesystem.write");
    if (!entry) throw new Error("filesystem.write fixture missing");

    expect(validateRegistryEntry(entry).valid).toBe(true);
  });

  it("fails when runtime capabilities are missing", () => {
    const fixture = cloneFixture();
    const entry = fixture.document.tools[0];
    entry.runtimeCapabilities = [] as never;

    const result = validateRegistryEntry(entry);
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.REGISTRY_DOCUMENT_INVALID);
  });

  it("fails when capability metadata does not match declarations", () => {
    const fixture = cloneFixture();
    const entry = fixture.document.tools[0];
    entry.capabilityMetadata.write = {
      scope: ["filesystem"],
      rollbackSupported: false,
      destructive: false,
    };

    const result = validateRegistryDocument(fixture);
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.TOOL_CAPABILITY_VIOLATION);
  });

  it("blocks autonomous contracts without approval", () => {
    const fixture = cloneFixture();
    const entry = fixture.document.tools.find((candidate) => candidate.toolId === "restart_service");
    if (!entry) throw new Error("restart_service fixture missing");
    entry.runtimeCapabilities = ["execute", "autonomous"] as typeof entry.runtimeCapabilities;
    entry.approvalRequired = false;
    entry.capabilityMetadata = {
      execute: { allowedCommands: ["restart-service"], shellAccess: false },
      autonomous: {
        runtimeBounds: { maxConcurrentOperations: 1, maxRuntimeSeconds: 30 },
        escalationPath: "operator",
        killSwitchCompatible: true,
        auditPolicy: "strict",
      },
    };

    const result = validateRegistryDocument(fixture);
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.CAPABILITY_APPROVAL_REQUIRED);
  });
});
