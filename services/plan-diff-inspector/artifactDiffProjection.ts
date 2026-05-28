import type { ArtifactDiffEntry, ArtifactDiffView, PlanDriftClass, PlanArtifactDiffType } from "@/types/plan-diff-inspector";
import {
  canonicalizeInspectionValue,
  collectHashLikeFields,
  collectReferenceLikeFields,
  hashPlanDiffInspectionValue,
  isPlainObject,
  valueTypeOf,
} from "./inspectionHasher";

function classifyFieldDiff(path: string, baseValue: unknown, targetValue: unknown): PlanArtifactDiffType {
  if (/hash/i.test(path)) {
    return "HASH_CHANGED";
  }
  if (/(ref|reference|id)$/i.test(path)) {
    return "REFERENCE_CHANGED";
  }
  if (valueTypeOf(baseValue) !== valueTypeOf(targetValue)) {
    return "TYPE_CHANGED";
  }
  return "CHANGED";
}

function pushDiff(
  diffs: ArtifactDiffEntry[],
  path: string,
  diffType: PlanArtifactDiffType,
  baseValue: unknown,
  targetValue: unknown,
) {
  diffs.push(Object.freeze({
    path,
    diffType,
    baseType: valueTypeOf(baseValue),
    targetType: valueTypeOf(targetValue),
    baseValueHash: baseValue === undefined ? undefined : hashPlanDiffInspectionValue(`${path}:base`, baseValue),
    targetValueHash: targetValue === undefined ? undefined : hashPlanDiffInspectionValue(`${path}:target`, targetValue),
  }));
}

function recursivelyDiff(baseValue: unknown, targetValue: unknown, path: string, diffs: ArtifactDiffEntry[]) {
  const canonicalBase = canonicalizeInspectionValue(baseValue);
  const canonicalTarget = canonicalizeInspectionValue(targetValue);
  if (hashPlanDiffInspectionValue(`${path}:value`, canonicalBase) === hashPlanDiffInspectionValue(`${path}:value`, canonicalTarget)) {
    return;
  }

  const baseType = valueTypeOf(baseValue);
  const targetType = valueTypeOf(targetValue);
  if (baseType !== targetType) {
    pushDiff(diffs, path, "TYPE_CHANGED", baseValue, targetValue);
    return;
  }

  if (Array.isArray(baseValue) && Array.isArray(targetValue)) {
    const baseElementHashes = baseValue.map((item) => hashPlanDiffInspectionValue(`${path}:element`, canonicalizeInspectionValue(item)));
    const targetElementHashes = targetValue.map((item) => hashPlanDiffInspectionValue(`${path}:element`, canonicalizeInspectionValue(item)));
    const baseSorted = [...baseElementHashes].sort((left, right) => left.localeCompare(right));
    const targetSorted = [...targetElementHashes].sort((left, right) => left.localeCompare(right));
    const reorderedOnly = baseValue.length === targetValue.length
      && baseSorted.length === targetSorted.length
      && baseSorted.every((item, index) => item === targetSorted[index]);

    if (reorderedOnly) {
      pushDiff(diffs, path, "REORDERED", baseValue, targetValue);
      return;
    }

    const maxLength = Math.max(baseValue.length, targetValue.length);
    for (let index = 0; index < maxLength; index += 1) {
      const nextPath = `${path}[${index}]`;
      if (index >= baseValue.length) {
        pushDiff(diffs, nextPath, "ADDED", undefined, targetValue[index]);
      } else if (index >= targetValue.length) {
        pushDiff(diffs, nextPath, "REMOVED", baseValue[index], undefined);
      } else {
        recursivelyDiff(baseValue[index], targetValue[index], nextPath, diffs);
      }
    }
    return;
  }

  if (isPlainObject(baseValue) && isPlainObject(targetValue)) {
    const keys = [...new Set([...Object.keys(baseValue), ...Object.keys(targetValue)])].sort((left, right) => left.localeCompare(right));
    for (const key of keys) {
      const nextPath = path ? `${path}.${key}` : key;
      if (!(key in baseValue)) {
        pushDiff(diffs, nextPath, "ADDED", undefined, targetValue[key]);
      } else if (!(key in targetValue)) {
        pushDiff(diffs, nextPath, "REMOVED", baseValue[key], undefined);
      } else {
        recursivelyDiff(baseValue[key], targetValue[key], nextPath, diffs);
      }
    }
    return;
  }

  pushDiff(diffs, path, classifyFieldDiff(path, baseValue, targetValue), baseValue, targetValue);
}

function determineArtifactDriftClass(diffs: readonly ArtifactDiffEntry[]): PlanDriftClass {
  if (diffs.length === 0) {
    return "NO_DRIFT";
  }
  if (diffs.every((diff) => diff.diffType === "REORDERED")) {
    return "NON_SEMANTIC_DRIFT";
  }
  if (diffs.some((diff) => /(governance|policy|riskTier|trustZone|approval)/i.test(diff.path))) {
    return "GOVERNANCE_DRIFT";
  }
  if (diffs.some((diff) => /(replay|step|toolBinding|inputHash)/i.test(diff.path))) {
    return "REPLAY_DRIFT";
  }
  if (diffs.some((diff) => /(registry)/i.test(diff.path))) {
    return "REGISTRY_DRIFT";
  }
  if (diffs.some((diff) => /(evidence)/i.test(diff.path))) {
    return "EVIDENCE_DRIFT";
  }
  return "SEMANTIC_DRIFT";
}

export function projectArtifactDiff(input: {
  baseArtifact: unknown;
  targetArtifact: unknown;
}): ArtifactDiffView {
  const diffs: ArtifactDiffEntry[] = [];
  recursivelyDiff(input.baseArtifact, input.targetArtifact, "", diffs);

  const hashFieldDiffs = collectHashLikeFields(input.baseArtifact)
    .map((entry) => entry.path)
    .filter((path) => collectHashLikeFields(input.targetArtifact).some((targetEntry) => targetEntry.path === path));
  const refFieldDiffs = collectReferenceLikeFields(input.baseArtifact)
    .map((entry) => entry.path)
    .filter((path) => collectReferenceLikeFields(input.targetArtifact).some((targetEntry) => targetEntry.path === path));

  const normalizedDiffs = Object.freeze(
    [...diffs]
      .map((diff) => {
        if (hashFieldDiffs.includes(diff.path) && diff.diffType === "CHANGED") {
          return Object.freeze({ ...diff, diffType: "HASH_CHANGED" as const });
        }
        if (refFieldDiffs.includes(diff.path) && diff.diffType === "CHANGED") {
          return Object.freeze({ ...diff, diffType: "REFERENCE_CHANGED" as const });
        }
        return diff;
      })
      .sort((left, right) => left.path.localeCompare(right.path) || left.diffType.localeCompare(right.diffType)),
  );

  return Object.freeze({
    baseArtifactHash: hashPlanDiffInspectionValue("artifact-diff-base", input.baseArtifact),
    targetArtifactHash: hashPlanDiffInspectionValue("artifact-diff-target", input.targetArtifact),
    changedPaths: Object.freeze(normalizedDiffs.map((diff) => diff.path)),
    diffs: normalizedDiffs,
    visibleDiffCount: normalizedDiffs.length,
    driftClass: determineArtifactDriftClass(normalizedDiffs),
  });
}
