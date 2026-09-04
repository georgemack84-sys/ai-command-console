import type {
  CanonicalInformationCategory,
  ClassificationHistory,
  ClassificationHistoryEntry,
  ClassificationRelationType,
  ClassificationUnitRelationship,
  ManualClassificationOverrideRequest,
  ManualClassificationOverrideResult,
} from "../../types/learning-constitution";

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const requiredRelationships: Readonly<Partial<Record<CanonicalInformationCategory, readonly ClassificationRelationType[]>>> = {
  CORRECTION: ["CORRECTS", "SUPERSEDES"],
  EXCEPTION: ["EXCEPTS"],
};

const permittedRelationships: Readonly<Partial<Record<CanonicalInformationCategory, readonly ClassificationRelationType[]>>> = {
  EXAMPLE: ["ILLUSTRATES"],
  DECISION: ["SUPERSEDES", "SELECTED_FROM"],
  FEEDBACK: ["RESPONDS_TO"],
};

export const validateCategoryRelationshipExpectations = (
  category: CanonicalInformationCategory,
  relationships: readonly ClassificationUnitRelationship[],
): void => {
  const types = relationships.map((relationship) => relationship.type);
  const required = requiredRelationships[category] ?? [];
  if (required.length > 0 && !required.some((type) => types.includes(type))) {
    throw new Error(`category ${category} requires a relationship of type: ${required.join(" or ")}`);
  }
  const permitted = permittedRelationships[category];
  if (permitted && types.some((type) => !permitted.includes(type))) {
    throw new Error(`category ${category} has an unsupported relationship type`);
  }
  for (const relationship of relationships) {
    if (!isNonEmptyString(relationship.relationshipId) || !isNonEmptyString(relationship.fromSemanticUnitId) ||
      !isNonEmptyString(relationship.toSemanticUnitId) || relationship.fromSemanticUnitId === relationship.toSemanticUnitId ||
      !["PROPOSED", "RECORDED"].includes(relationship.status) || relationship.persistenceEffect !== "NONE" || relationship.authorityEffect !== "UNCHANGED") {
      throw new Error("classification relationship is invalid or effect-bearing");
    }
  }
};

export const validateClassificationHistory = (history: ClassificationHistory): ClassificationHistory => {
  if (!isNonEmptyString(history.semanticUnitId) || history.entries.length === 0 || history.persistenceEffect !== "NONE" || history.authorityEffect !== "UNCHANGED") {
    throw new Error("classification history is invalid");
  }
  history.entries.forEach((entry, index) => {
    if (entry.semanticUnitId !== history.semanticUnitId || entry.result.semanticUnitId !== history.semanticUnitId ||
      entry.revision !== index + 1 || !isNonEmptyString(entry.recordedAt) || !isNonEmptyString(entry.reason) ||
      (index === 0 ? entry.changeKind !== "INITIAL" : entry.changeKind === "INITIAL")) {
      throw new Error("classification history is not an immutable contiguous event sequence");
    }
  });
  return history;
};

export const replayClassificationHistory = (history: ClassificationHistory): ClassificationHistoryEntry["result"] =>
  validateClassificationHistory(history).entries.at(-1)!.result;

export const appendClassificationReclassification = (
  history: ClassificationHistory,
  result: ClassificationHistoryEntry["result"],
  recordedAt: string,
  reason: string,
): ClassificationHistory => {
  const valid = validateClassificationHistory(history);
  if (result.semanticUnitId !== valid.semanticUnitId || !isNonEmptyString(recordedAt) || !isNonEmptyString(reason)) throw new Error("reclassification event is invalid");
  return {
    ...valid,
    entries: [...valid.entries, { semanticUnitId: valid.semanticUnitId, revision: valid.entries.length + 1, recordedAt, changeKind: "RECLASSIFICATION", reason, result }],
  };
};

export const applyManualClassificationOverride = (
  history: ClassificationHistory,
  request: ManualClassificationOverrideRequest,
): ManualClassificationOverrideResult => {
  const previous = replayClassificationHistory(history);
  if (!previous.category || !isNonEmptyString(request.reviewerId) || !isNonEmptyString(request.reason) || !isNonEmptyString(request.recordedAt) || previous.category === request.newCategory) {
    throw new Error("manual classification override is invalid");
  }
  const result = {
    ...previous, category: request.newCategory, status: "CLASSIFIED" as const, classificationBasis: "MANUAL_OVERRIDE" as const,
    candidates: [], reasonCodes: [...previous.reasonCodes, "MANUAL_CLASSIFICATION_OVERRIDE"],
    evidence: [...previous.evidence, { code: "MANUAL_CLASSIFICATION_OVERRIDE", matchedText: request.reviewerId }],
  };
  const updated = appendClassificationReclassification(history, result, request.recordedAt, request.reason);
  const overrideHistory: ClassificationHistory = { ...updated, entries: updated.entries.map((entry, index) => index === updated.entries.length - 1 ? { ...entry, changeKind: "MANUAL_OVERRIDE" } : entry) };
  return {
    override: { previousCategory: previous.category, newCategory: request.newCategory, reviewerId: request.reviewerId, reason: request.reason, recordedAt: request.recordedAt },
    history: overrideHistory, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
  };
};

export const assessClassificationRepetition = (
  category: CanonicalInformationCategory,
  occurrences: number,
): Readonly<{ category: CanonicalInformationCategory; occurrences: number; disposition: "NO_ESCALATION"; authorityEffect: "UNCHANGED" }> => {
  if (!Number.isInteger(occurrences) || occurrences < 1) throw new Error("classification repetition count is invalid");
  return { category, occurrences, disposition: "NO_ESCALATION", authorityEffect: "UNCHANGED" };
};
