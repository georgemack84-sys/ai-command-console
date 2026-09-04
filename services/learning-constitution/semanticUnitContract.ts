import {
  SEMANTIC_SEGMENTATION_STATUSES,
  SEMANTIC_UNIT_CONTAINMENTS,
  type SemanticSegmentationResult,
  type SemanticUnit,
} from "../../types/learning-constitution/semanticUnit";

export const SEMANTIC_UNIT_CONTRACT_VALIDATOR_ID = "semantic-unit-contract-v1";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const spansOverlap = (left: SemanticUnit, right: SemanticUnit): boolean =>
  left.textSpan.start < right.textSpan.end && right.textSpan.start < left.textSpan.end;

const containsSpan = (parent: SemanticUnit, child: SemanticUnit): boolean =>
  parent.textSpan.start <= child.textSpan.start && parent.textSpan.end >= child.textSpan.end;

const hasSameSource = (left: SemanticUnit["source"], right: SemanticUnit["source"]): boolean =>
  left.observationId === right.observationId && left.sourceId === right.sourceId &&
  left.sourceType === right.sourceType && left.originatingActorId === right.originatingActorId &&
  left.observedAt === right.observedAt && left.correlationId === right.correlationId;

/**
 * Validates an already-produced segmentation result. It intentionally does not
 * decide where to split text or what any unit means.
 */
export const validateSemanticSegmentationResult = (
  result: SemanticSegmentationResult,
): SemanticSegmentationResult => {
  if (!SEMANTIC_SEGMENTATION_STATUSES.includes(result.status) ||
    !Array.isArray(result.reasonCodes) || !result.reasonCodes.every(isNonEmptyString) ||
    result.persistenceEffect !== "NONE" || result.authorityEffect !== "UNCHANGED" ||
    result.executionPermissionGranted !== false) {
    throw new Error("semantic segmentation result metadata is invalid");
  }
  if (!isNonEmptyString(result.context.sourceMessageId) || !isNonEmptyString(result.context.speakerId) ||
    !Array.isArray(result.context.precedingContextReferences) || !Array.isArray(result.context.followingContextReferences) ||
    !result.context.precedingContextReferences.every(isNonEmptyString) || !result.context.followingContextReferences.every(isNonEmptyString)) {
    throw new Error("semantic segmentation context is invalid");
  }
  if (result.status === "UNRESOLVED" && result.units.length > 0) {
    throw new Error("unresolved semantic segmentation cannot contain units");
  }

  const unitsById = new Map<string, SemanticUnit>();
  const sourceOrders = new Set<number>();
  for (const unit of result.units) {
    if (!isNonEmptyString(unit.semanticUnitId) || unitsById.has(unit.semanticUnitId) ||
      !Number.isInteger(unit.sourceOrder) || unit.sourceOrder < 0 || sourceOrders.has(unit.sourceOrder) ||
      !hasSameSource(unit.source, result.source) ||
      !SEMANTIC_UNIT_CONTAINMENTS.includes(unit.containment) || !isNonEmptyString(unit.content) ||
      !Number.isInteger(unit.textSpan.start) || !Number.isInteger(unit.textSpan.end) ||
      unit.textSpan.start < 0 || unit.textSpan.start >= unit.textSpan.end ||
      unit.textSpan.end > result.sourceContent.length ||
      result.sourceContent.slice(unit.textSpan.start, unit.textSpan.end) !== unit.content) {
      throw new Error("semantic unit structure is invalid");
    }
    if (unit.containment === "ROOT" ? unit.parentSemanticUnitId !== undefined : !isNonEmptyString(unit.parentSemanticUnitId)) {
      throw new Error("semantic unit containment parent is invalid");
    }
    unitsById.set(unit.semanticUnitId, unit);
    sourceOrders.add(unit.sourceOrder);
  }
  if ([...sourceOrders].some((order) => order >= result.units.length)) {
    throw new Error("semantic unit source order must be contiguous");
  }

  for (const unit of result.units) {
    if (!unit.parentSemanticUnitId) continue;
    const parent = unitsById.get(unit.parentSemanticUnitId);
    if (!parent || parent.semanticUnitId === unit.semanticUnitId || !containsSpan(parent, unit)) {
      throw new Error("semantic unit parent is unavailable or does not contain its child");
    }
    const ancestors = new Set<string>([unit.semanticUnitId]);
    let ancestor: SemanticUnit | undefined = parent;
    while (ancestor) {
      if (ancestors.has(ancestor.semanticUnitId)) throw new Error("semantic unit containment cannot form a cycle");
      ancestors.add(ancestor.semanticUnitId);
      ancestor = ancestor.parentSemanticUnitId ? unitsById.get(ancestor.parentSemanticUnitId) : undefined;
    }
  }
  for (let index = 0; index < result.units.length; index += 1) {
    for (let comparison = index + 1; comparison < result.units.length; comparison += 1) {
      const left = result.units[index];
      const right = result.units[comparison];
      if (left.parentSemanticUnitId === right.parentSemanticUnitId && spansOverlap(left, right)) {
        throw new Error("sibling semantic units cannot overlap");
      }
    }
  }
  return result;
};
