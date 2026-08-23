import { describe, expect, it } from "vitest";
import {
  CATEGORY_DECISION_TREES,
  CATEGORY_DEFAULT_MATRIX,
  CATEGORY_INVARIANTS,
  assessUserConfirmationTrigger,
  semanticRiskForMisclassification,
  validateOrthogonalDimensions,
} from "../../../services/learning-constitution";
import type { CanonicalClassificationResult, InformationUnitOrthogonalDimensions } from "../../../types/learning-constitution";

const classification = (category: CanonicalClassificationResult["category"], candidates: CanonicalClassificationResult["candidates"] = []): CanonicalClassificationResult => ({
  semanticUnitId: "unit-1", taxonomyVersion: "1.0.0", classifierId: "test", classifierVersion: "1", classificationBasis: "EXPLICIT", semanticModifiers: [], status: "CLASSIFIED", ...(category ? { category } : {}), candidates, confidence: 0.9, reasonCodes: [], evidence: [], persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
});

describe("orthogonal semantics", () => {
  it("defines a conservative default and invariant for every frozen category", () => {
    expect(CATEGORY_DEFAULT_MATRIX).toHaveLength(18);
    expect(CATEGORY_DEFAULT_MATRIX.every((entry) => entry.defaultDurability === "NONE" && entry.defaultAuthority === "NONE")).toBe(true);
    expect(CATEGORY_INVARIANTS).toHaveLength(18);
    expect(CATEGORY_DECISION_TREES.every((tree) => tree.guidanceOnly)).toBe(true);
  });

  it("keeps domain-like dimensions out of authority and persistence effects", () => {
    const dimensions: InformationUnitOrthogonalDimensions = {
      category: "FEEDBACK", sourceType: "OPERATOR_STATEMENT", scope: { status: "UNRESOLVED" }, authority: "NONE", durability: "NONE", validation: "NOT_EVALUATED", confidence: 0.8, status: "CLASSIFIED", temporality: [], learningIntent: "UNSPECIFIED", sentiment: "NEGATIVE", classificationBasis: "EXPLICIT", sourceReliability: "NOT_EVALUATED", truthValidation: "NOT_EVALUATED", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
    };
    expect(() => validateOrthogonalDimensions(dimensions)).not.toThrow();
    expect(() => validateOrthogonalDimensions({ ...dimensions, authority: "APPROVED" })).toThrow(/must not create/);
  });

  it("uses the risk matrix and confirmation only for meaningful ambiguity", () => {
    expect(semanticRiskForMisclassification("EXAMPLE", "RULE")).toBe("CRITICAL");
    expect(assessUserConfirmationTrigger(classification(undefined, [{ category: "EXAMPLE", confidence: 0.5 }, { category: "RULE", confidence: 0.5 }])).reasonCode).toBe("HIGH_IMPACT_AMBIGUITY");
    expect(assessUserConfirmationTrigger(classification("DECISION")).reasonCode).toBe("SCOPE_DEPENDENT_CLASSIFICATION");
    expect(assessUserConfirmationTrigger(classification("FACT")).requiresConfirmation).toBe(false);
  });
});
