import type { HashComparisonView, HashIntegrityView } from "@/types/plan-diff-inspector";
import { collectHashLikeFields, hashPlanDiffInspectionValue, isHashString } from "./inspectionHasher";

function buildHashComparisonMaps(value: unknown): Map<string, string> {
  return new Map(collectHashLikeFields(value).map((entry) => [entry.path, entry.value]));
}

export function projectHashIntegrity(input: {
  baseArtifact: unknown;
  targetArtifact: unknown;
}): HashIntegrityView {
  const baseArtifactHash = hashPlanDiffInspectionValue("hash-integrity-base", input.baseArtifact);
  const targetArtifactHash = hashPlanDiffInspectionValue("hash-integrity-target", input.targetArtifact);
  const baseHashes = buildHashComparisonMaps(input.baseArtifact);
  const targetHashes = buildHashComparisonMaps(input.targetArtifact);
  const allPaths = [...new Set([...baseHashes.keys(), ...targetHashes.keys()])].sort((left, right) => left.localeCompare(right));

  const comparisons: HashComparisonView[] = allPaths.map((path) => {
    const baseHash = baseHashes.get(path);
    const targetHash = targetHashes.get(path);
    return Object.freeze({
      path,
      baseHash,
      targetHash,
      changed: baseHash !== targetHash,
      validBaseHash: baseHash ? isHashString(baseHash) : false,
      validTargetHash: targetHash ? isHashString(targetHash) : false,
    });
  });

  return Object.freeze({
    baseArtifactHash,
    targetArtifactHash,
    declaredHashes: Object.freeze(comparisons),
    changedHashPaths: Object.freeze(comparisons.filter((item) => item.changed).map((item) => item.path)),
    invalidHashPaths: Object.freeze(comparisons.filter((item) => !item.validBaseHash || !item.validTargetHash).map((item) => item.path)),
    hashMismatch: baseArtifactHash !== targetArtifactHash || comparisons.some((item) => item.changed || !item.validBaseHash || !item.validTargetHash),
  });
}
