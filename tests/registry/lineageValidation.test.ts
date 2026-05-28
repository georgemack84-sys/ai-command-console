import { describe, expect, it } from "vitest";

import { deriveCapabilityHash } from "@/services/registry/capabilityHash";
import { deriveRegistryHash } from "@/services/registry/registryIdentity";
import { validateRegistryDocument, REGISTRY_ERROR_CODES } from "@/services/registry/registryValidator";
import { cloneFixture } from "./helpers";

describe("lineageValidation", () => {
  it("fails when latestVersion does not exist", () => {
    const fixture = cloneFixture();
    fixture.lineages.lineages[0].latestVersion = "9.9.9";

    const result = validateRegistryDocument(fixture);

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.LINEAGE_CORRUPTION);
  });

  it("fails when lineage versions are duplicated", () => {
    const fixture = cloneFixture();
    fixture.lineages.lineages[0].versions.push("1.0.0");

    const result = validateRegistryDocument(fixture);

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.LINEAGE_CORRUPTION);
  });

  it("fails when published version hash no longer matches lineage record", () => {
    const fixture = cloneFixture();
    fixture.lineages.lineages[0].versionRecords[0].registryHash = "1".repeat(64);

    const result = validateRegistryDocument(fixture);

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.IMMUTABLE_VERSION_MUTATION);
  });

  it("allows new versions when lineage is extended explicitly", () => {
    const fixture = cloneFixture();
    const base = fixture.document.tools.find((entry) => entry.toolId === "filesystem.write");
    if (!base) throw new Error("filesystem.write fixture missing");
    const next = JSON.parse(JSON.stringify(base));
    next.version = "1.1.0";
    next.canonicalId = "filesystem.write@1.1.0";
    next.outputSchemaRef = "schemas/filesystem.write.output.v1_1_0.json";
    next.capabilityHash = deriveCapabilityHash(next);
    next.registryHash = deriveRegistryHash(next);
    next.publishedAt = "2026-05-15T00:00:00.000Z";

    fixture.document.tools.push(next);
    fixture.lineages.lineages.find((lineage) => lineage.lineageId === "filesystem.write")!.versions.push("1.1.0");
    fixture.lineages.lineages.find((lineage) => lineage.lineageId === "filesystem.write")!.latestVersion = "1.1.0";
    fixture.lineages.lineages.find((lineage) => lineage.lineageId === "filesystem.write")!.versionRecords.push({
      version: "1.1.0",
      canonicalId: "filesystem.write@1.1.0",
      registryHash: next.registryHash,
      capabilityHash: next.capabilityHash,
      status: "published",
      publishedAt: "2026-05-15T00:00:00.000Z",
    });
    fixture.policiesByRef["policies/filesystem.write.policy.json"] = fixture.policiesByRef["policies/filesystem.write.policy.json"];
    fixture.adaptersByRef["adapters/filesystem.write.adapter.json"] = fixture.adaptersByRef["adapters/filesystem.write.adapter.json"];

    const result = validateRegistryDocument(fixture);

    expect(result.valid).toBe(true);
  });

  it("fails when capability lineage escalates across published versions", () => {
    const fixture = cloneFixture();
    const base = fixture.document.tools.find((entry) => entry.toolId === "filesystem.write");
    if (!base) throw new Error("filesystem.write fixture missing");
    const next = JSON.parse(JSON.stringify(base));
    next.version = "1.1.0";
    next.canonicalId = "filesystem.write@1.1.0";
    next.runtimeCapabilities = ["write", "execute"];
    next.capabilityMetadata.execute = { allowedCommands: ["apply-write"], shellAccess: false };
    next.capabilityHash = deriveCapabilityHash(next);
    next.registryHash = deriveRegistryHash(next);
    next.publishedAt = "2026-05-15T00:00:00.000Z";

    fixture.document.tools.push(next);
    fixture.lineages.lineages.find((lineage) => lineage.lineageId === "filesystem.write")!.versions.push("1.1.0");
    fixture.lineages.lineages.find((lineage) => lineage.lineageId === "filesystem.write")!.latestVersion = "1.1.0";
    fixture.lineages.lineages.find((lineage) => lineage.lineageId === "filesystem.write")!.versionRecords.push({
      version: "1.1.0",
      canonicalId: "filesystem.write@1.1.0",
      registryHash: next.registryHash,
      capabilityHash: next.capabilityHash,
      status: "published",
      publishedAt: "2026-05-15T00:00:00.000Z",
    });

    const result = validateRegistryDocument(fixture);
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.CAPABILITY_ESCALATION_BLOCKED);
  });
});
