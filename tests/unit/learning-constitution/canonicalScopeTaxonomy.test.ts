import { describe, expect, it } from "vitest";

import {
  CANONICAL_SCOPE_DEFINITIONS,
  CANONICAL_SCOPE_DIMENSIONS,
  CANONICAL_SCOPE_TAXONOMY_VERSION,
  LEGACY_SCOPE_TAXONOMY_MAPPING,
  SCOPE_APPLICABILITY_STATUSES,
  isCanonicalScopeDimension,
} from "@/types/learning-constitution";
import { KNOWLEDGE_SCOPES } from "@/types/learning-constitution/constitutionalVocabulary";

describe("canonical scope taxonomy", () => {
  it("freezes the Phase 2 scope dimensions and keeps applicability state separate", () => {
    expect(CANONICAL_SCOPE_TAXONOMY_VERSION).toBe("1.0.0");
    expect(CANONICAL_SCOPE_DIMENSIONS).toEqual(["SESSION", "CONVERSATION", "USER", "PROJECT", "WORKSPACE", "AGENT", "ORGANIZATION", "SYSTEM"]);
    expect(SCOPE_APPLICABILITY_STATUSES).toContain("UNRESOLVED");
    expect(CANONICAL_SCOPE_DIMENSIONS).not.toContain("UNRESOLVED");
  });

  it("defines every canonical scope as an applicability boundary, never an authority grant", () => {
    expect(Object.keys(CANONICAL_SCOPE_DEFINITIONS).sort()).toEqual([...CANONICAL_SCOPE_DIMENSIONS].sort());
    expect(Object.values(CANONICAL_SCOPE_DEFINITIONS).every((definition) => definition.mustNotImply.length > 0)).toBe(true);
    expect(CANONICAL_SCOPE_DEFINITIONS.SYSTEM).toMatchObject({ requiresIdentifier: false });
    expect(CANONICAL_SCOPE_DEFINITIONS.PROJECT).toMatchObject({ requiresIdentifier: true });
  });

  it("maps legacy scopes explicitly and refuses silent domain or global widening", () => {
    expect(Object.keys(LEGACY_SCOPE_TAXONOMY_MAPPING).sort()).toEqual([...KNOWLEDGE_SCOPES].sort());
    expect(LEGACY_SCOPE_TAXONOMY_MAPPING.DOMAIN).toMatchObject({ status: "REQUIRES_REVIEW" });
    expect(LEGACY_SCOPE_TAXONOMY_MAPPING.DOMAIN).not.toHaveProperty("canonicalDimension");
    expect(LEGACY_SCOPE_TAXONOMY_MAPPING.GLOBAL).toMatchObject({ status: "REQUIRES_REVIEW", canonicalDimension: "SYSTEM" });
    expect(isCanonicalScopeDimension("PROJECT")).toBe(true);
    expect(isCanonicalScopeDimension("GLOBAL")).toBe(false);
  });
});
