import { describe, expect, it } from "vitest";
import {
  AUTHORITY_MODEL_VERSION,
  KNOWLEDGE_DIMENSION_INVARIANTS,
  createUnassessedAuthority,
  validateKnowledgeDimensionSet,
} from "../../../services/learning-constitution";
import type { KnowledgeDimensionSet } from "../../../types/learning-constitution";

const dimensions = (overrides: Partial<KnowledgeDimensionSet> = {}): KnowledgeDimensionSet => ({
  classification: "FACT",
  scope: "PROJECT:AXIOM",
  authority: createUnassessedAuthority(),
  confidence: { score: 0.72 },
  evidence: { evidenceIds: ["user-statement-1"] },
  provenance: { observationId: "observation-1", sourceId: "source-1" },
  durability: { requested: "DURABLE_CANDIDATE" },
  validation: { status: "NOT_EVALUATED" },
  actionPermission: { granted: false },
  ...overrides,
});

describe("Phase 6 authority model", () => {
  it("introduces the separation invariants without prematurely assigning authority", () => {
    expect(AUTHORITY_MODEL_VERSION).toBe("6.1");
    expect(KNOWLEDGE_DIMENSION_INVARIANTS).toEqual(expect.arrayContaining([
      "AUTHORITY_NOT_CONFIDENCE",
      "AUTHORITY_NOT_EVIDENCE",
      "LEARNING_NOT_ACTION_PERMISSION",
    ]));
    expect(createUnassessedAuthority()).toEqual({ status: "UNASSESSED" });
  });

  it("keeps high confidence and extensive evidence from establishing authority", () => {
    const highlyEvidenced = dimensions({ confidence: { score: 1 }, evidence: { evidenceIds: ["primary-1", "primary-2", "corroboration-1"] } });

    expect(() => validateKnowledgeDimensionSet(highlyEvidenced)).not.toThrow();
    expect(highlyEvidenced.authority).toEqual({ status: "UNASSESSED" });
  });

  it("rejects invalid confidence, generic trust scores, and execution permission", () => {
    expect(() => validateKnowledgeDimensionSet(dimensions({ confidence: { score: 1.01 } }))).toThrow(/confidence/);
    expect(() => validateKnowledgeDimensionSet({ ...dimensions(), trustScore: 0.99 } as KnowledgeDimensionSet)).toThrow(/trust scores/);
    expect(() => validateKnowledgeDimensionSet({ ...dimensions(), actionPermission: { granted: true } } as unknown as KnowledgeDimensionSet)).toThrow(/execution permission/);
  });
});
