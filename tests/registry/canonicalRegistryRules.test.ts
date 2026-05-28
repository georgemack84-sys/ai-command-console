import { describe, expect, it } from "vitest";

import { validateRegistryDocument, REGISTRY_ERROR_CODES } from "@/services/registry/registryValidator";
import { cloneFixture } from "./helpers";

describe("canonicalRegistryRules", () => {
  it("fails on unknown enum values", () => {
    const fixture = cloneFixture();
    fixture.document.tools[0].executionMode = "wild-west" as never;

    const result = validateRegistryDocument(fixture);

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.REGISTRY_DOCUMENT_INVALID);
  });

  it("fails when policy files are absent", () => {
    const fixture = cloneFixture();
    delete fixture.policiesByRef["policies/read_file.policy.json"];

    const result = validateRegistryDocument(fixture);

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.REGISTRY_FILE_MISSING);
  });

  it("fails when adapter files are absent", () => {
    const fixture = cloneFixture();
    delete fixture.adaptersByRef["adapters/read_file.adapter.json"];

    const result = validateRegistryDocument(fixture);

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(REGISTRY_ERROR_CODES.REGISTRY_FILE_MISSING);
  });
});
