import { describe, expect, it } from "vitest";

import { validateRegistryDocument, validateRegistryEntry, REGISTRY_ERROR_CODES } from "@/services/registry/registryValidator";
import { cloneFixture } from "./helpers";

describe("registryValidation", () => {
  it("validates registry entries against schema", () => {
    const entry = cloneFixture().document.tools[0];
    expect(validateRegistryEntry(entry).valid).toBe(true);
  });

  it("validates the canonical registry document end to end", () => {
    const fixture = cloneFixture();
    const result = validateRegistryDocument(fixture);
    expect(result.valid).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("fails when schema refs are missing", () => {
    const fixture = cloneFixture();
    fixture.document.tools[0].inputSchemaRef = "";

    const result = validateRegistryDocument(fixture);

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.REGISTRY_INPUT_SCHEMA_REF_MISSING);
  });

  it("fails when policy refs are missing", () => {
    const fixture = cloneFixture();
    fixture.document.tools[0].policyRef = "";

    const result = validateRegistryDocument(fixture);

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.REGISTRY_POLICY_REF_MISSING);
  });

  it("fails on duplicate tool versions", () => {
    const fixture = cloneFixture();
    fixture.document.tools.push({ ...fixture.document.tools[0] });

    const result = validateRegistryDocument(fixture);

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.REGISTRY_DUPLICATE_TOOL_VERSION);
  });

  it("fails on runtime override attempts", () => {
    const fixture = cloneFixture() as ReturnType<typeof cloneFixture> & {
      document: Record<string, unknown>;
    };
    fixture.document.runtimeOverrides = { enabledTools: ["filesystem.write"] };

    const result = validateRegistryDocument(fixture);

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.REGISTRY_RUNTIME_OVERRIDE_FORBIDDEN);
  });

  it("fails when replay support lacks deterministic metadata", () => {
    const fixture = cloneFixture();
    fixture.document.tools[0].deterministicReplayMetadata = undefined;

    const result = validateRegistryDocument(fixture);

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.REGISTRY_REPLAY_DETERMINISM_REQUIRED);
  });

  it("fails when rollback support lacks rollback metadata", () => {
    const fixture = cloneFixture();
    const target = fixture.document.tools.find((entry) => entry.toolId === "filesystem.write");
    if (!target) throw new Error("filesystem.write fixture missing");
    target.rollbackMetadata = undefined;

    const result = validateRegistryDocument(fixture);

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.REGISTRY_ROLLBACK_POLICY_REQUIRED);
  });

  it("fails when high-risk approval is disabled", () => {
    const fixture = cloneFixture();
    const target = fixture.document.tools.find((entry) => entry.toolId === "filesystem.write");
    if (!target) throw new Error("filesystem.write fixture missing");
    target.approvalRequired = false;

    const result = validateRegistryDocument(fixture);

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.REGISTRY_HIGH_RISK_APPROVAL_REQUIRED);
  });

  it("fails when critical-risk approval is disabled", () => {
    const fixture = cloneFixture();
    const target = fixture.document.tools.find((entry) => entry.toolId === "restart_service");
    if (!target) throw new Error("restart_service fixture missing");
    target.approvalRequired = false;

    const result = validateRegistryDocument(fixture);

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.REGISTRY_CRITICAL_RISK_APPROVAL_REQUIRED);
  });

  it("fails when unbounded execution policy is declared", () => {
    const fixture = cloneFixture();
    fixture.policiesByRef["policies/filesystem.write.policy.json"].boundedExecution.maxOperations = 0;

    const result = validateRegistryDocument(fixture);

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.REGISTRY_UNBOUNDED_EXECUTION_FORBIDDEN);
  });

  it("fails when adapters attempt governance overrides", () => {
    const fixture = cloneFixture() as ReturnType<typeof cloneFixture> & {
      adaptersByRef: Record<string, Record<string, unknown>>;
    };
    fixture.adaptersByRef["adapters/filesystem.write.adapter.json"].riskLevel = "low";

    const result = validateRegistryDocument(fixture);

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.REGISTRY_ADAPTER_OVERRIDE_FORBIDDEN);
  });

  it("validates the published lineage manifests", () => {
    const fixture = cloneFixture();

    const result = validateRegistryDocument(fixture);

    expect(result.valid).toBe(true);
  });
});
