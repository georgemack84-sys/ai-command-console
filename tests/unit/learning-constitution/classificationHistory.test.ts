import { describe, expect, it } from "vitest";

import {
  ConservativeCanonicalSemanticUnitClassifier,
  applyManualClassificationOverride,
  appendClassificationReclassification,
  assessClassificationRepetition,
  replayClassificationHistory,
  validateCategoryRelationshipExpectations,
} from "@/services/learning-constitution";
import type { ClassificationHistory, SemanticUnit } from "@/types/learning-constitution";

const unit: SemanticUnit = { semanticUnitId: "unit-1", source: { observationId: "observation-1", sourceId: "source-1", sourceType: "OPERATOR_STATEMENT", originatingActorId: "user-1", observedAt: "2026-08-21T00:00:00.000Z" }, sourceOrder: 0, textSpan: { start: 0, end: 20 }, content: "A queue could help.", containment: "ROOT" };
const initial = new ConservativeCanonicalSemanticUnitClassifier().classify(unit);
const history: ClassificationHistory = { semanticUnitId: "unit-1", entries: [{ semanticUnitId: "unit-1", revision: 1, recordedAt: "2026-08-21T00:00:00.000Z", changeKind: "INITIAL", reason: "initial classification", result: initial }], persistenceEffect: "NONE", authorityEffect: "UNCHANGED" };

describe("classification relationships and history", () => {
  it("requires category-specific relationships without giving relationships effects", () => {
    expect(() => validateCategoryRelationshipExpectations("CORRECTION", [])).toThrow();
    expect(() => validateCategoryRelationshipExpectations("CORRECTION", [{ relationshipId: "r1", fromSemanticUnitId: "correction", toSemanticUnitId: "fact", type: "CORRECTS", status: "PROPOSED", persistenceEffect: "NONE", authorityEffect: "UNCHANGED" }])).not.toThrow();
    expect(() => validateCategoryRelationshipExpectations("EXAMPLE", [{ relationshipId: "r2", fromSemanticUnitId: "example", toSemanticUnitId: "rule", type: "EXCEPTS", status: "RECORDED", persistenceEffect: "NONE", authorityEffect: "UNCHANGED" }])).toThrow();
  });

  it("preserves immutable classification history and distinguishes reclassification from correction", () => {
    const reclassified = appendClassificationReclassification(history, { ...initial, category: "SUGGESTION", reasonCodes: [...initial.reasonCodes, "CONTEXT_RESOLVED"] }, "2026-08-21T00:01:00.000Z", "context resolved");
    expect(history.entries).toHaveLength(1);
    expect(reclassified.entries).toMatchObject([{ changeKind: "INITIAL" }, { changeKind: "RECLASSIFICATION", result: { category: "SUGGESTION" } }]);
    expect(replayClassificationHistory(reclassified).category).toBe("SUGGESTION");
  });

  it("records review metadata for a manual override without granting authority", () => {
    const overridden = applyManualClassificationOverride(history, { reviewerId: "reviewer-1", reason: "Explicit decision context was missed.", recordedAt: "2026-08-21T00:02:00.000Z", newCategory: "DECISION" });
    expect(overridden).toMatchObject({ override: { previousCategory: "IDEA", newCategory: "DECISION", reviewerId: "reviewer-1" }, history: { entries: [{ changeKind: "INITIAL" }, { changeKind: "MANUAL_OVERRIDE", result: { category: "DECISION", classificationBasis: "MANUAL_OVERRIDE" } }] }, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false });
  });

  it("never escalates authority from repeated classification", () => {
    expect(assessClassificationRepetition("SUGGESTION", 100)).toEqual({ category: "SUGGESTION", occurrences: 100, disposition: "NO_ESCALATION", authorityEffect: "UNCHANGED" });
  });
});
