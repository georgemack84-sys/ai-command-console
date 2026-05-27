import { describe, expect, it } from "vitest";

import { checkSchemaGovernance } from "@/services/planning/schema/schema-governance";
import { getCurrentCanonicalSchema, getSchemaByVersion } from "@/services/planning/schema/schema-registry";

describe("schema governance", () => {
  it("unapproved schema is rejected", () => {
    const rejected = checkSchemaGovernance("1.0.1", "mismatch");
    expect(rejected.valid).toBe(false);
  });

  it("approved schema passes governance check", () => {
    const current = getCurrentCanonicalSchema();
    const result = checkSchemaGovernance(current.version, current.hash);
    expect(result.valid).toBe(true);
  });

  it("mutated schema hash is rejected", () => {
    const current = getCurrentCanonicalSchema();
    const result = checkSchemaGovernance(current.version, `${current.hash}-mutated`);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "PHASE42A_SCHEMA_HASH_MISMATCH")).toBe(true);
  });

  it("schema approval metadata is required", () => {
    const deprecated = getSchemaByVersion("1.0.1");
    expect(deprecated?.approval).toBeDefined();
  });
});

