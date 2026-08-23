import { describe, expect, it } from "vitest";

import {
  CANONICAL_INFORMATION_CATEGORIES,
  CANONICAL_TAXONOMY_VERSION,
  LEGACY_PHASE_0_TAXONOMY_MAPPING,
  TAXONOMY_PROCESSING_STATUSES,
} from "@/types/learning-constitution";
import { KNOWLEDGE_CLASSIFICATIONS } from "@/types/learning-constitution/constitutionalVocabulary";

describe("canonical taxonomy v1 freeze", () => {
  it("freezes exactly the 18 canonical category identifiers", () => {
    expect(CANONICAL_TAXONOMY_VERSION).toBe("1.0.0");
    expect(CANONICAL_INFORMATION_CATEGORIES).toHaveLength(18);
    expect(new Set(CANONICAL_INFORMATION_CATEGORIES).size).toBe(18);
    expect(CANONICAL_INFORMATION_CATEGORIES).toEqual([
      "CONVERSATION", "QUESTION", "BRAINSTORM", "IDEA", "SUGGESTION", "FACT", "CONCEPT", "PREFERENCE", "INSTRUCTION",
      "RULE", "PRINCIPLE", "PROCEDURE", "EXAMPLE", "DECISION", "CORRECTION", "EXCEPTION", "GOAL", "FEEDBACK",
    ]);
  });

  it("keeps processing states outside the canonical category registry", () => {
    expect(TAXONOMY_PROCESSING_STATUSES).toContain("AMBIGUOUS");
    for (const status of TAXONOMY_PROCESSING_STATUSES) {
      expect(CANONICAL_INFORMATION_CATEGORIES).not.toContain(status);
    }
  });

  it("maps every legacy Phase 0 classification explicitly without collapsing scope or authority", () => {
    expect(Object.keys(LEGACY_PHASE_0_TAXONOMY_MAPPING).sort()).toEqual([...KNOWLEDGE_CLASSIFICATIONS].sort());
    expect(LEGACY_PHASE_0_TAXONOMY_MAPPING.PROJECT_DECISION).toMatchObject({ canonicalCategory: "DECISION", preservesRequiredScope: true });
    expect(LEGACY_PHASE_0_TAXONOMY_MAPPING.AUTHORITATIVE_RULE).toMatchObject({ canonicalCategory: "RULE", preservesSeparateAuthorityValidation: true });
    expect(LEGACY_PHASE_0_TAXONOMY_MAPPING.PROCEDURE.preservesSeparateAuthorityValidation).toBe(true);
  });
});
