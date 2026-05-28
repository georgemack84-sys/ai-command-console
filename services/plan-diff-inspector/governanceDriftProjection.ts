import type { GovernanceDriftView } from "@/types/plan-diff-inspector";
import { canonicalizeInspectionValue, collectNamedArrayValues, collectNamedStringValues, hashPlanDiffInspectionValue, isPlainObject } from "./inspectionHasher";

function getComparableValue(value: unknown, matcher: (path: string, key: string, fieldValue: string) => boolean): string | undefined {
  return collectNamedStringValues(value, matcher)[0]?.value;
}

function getComparableArray(value: unknown, matcher: (path: string, key: string, fieldValue: readonly unknown[]) => boolean): readonly unknown[] | undefined {
  return collectNamedArrayValues(value, matcher)[0]?.values;
}

export function projectGovernanceDrift(input: {
  baseArtifact: unknown;
  targetArtifact: unknown;
}): GovernanceDriftView {
  const riskTierBase = getComparableValue(input.baseArtifact, (_path, key) => key === "riskTier");
  const riskTierTarget = getComparableValue(input.targetArtifact, (_path, key) => key === "riskTier");
  const trustZoneBase = getComparableValue(input.baseArtifact, (_path, key) => key === "trustZone");
  const trustZoneTarget = getComparableValue(input.targetArtifact, (_path, key) => key === "trustZone");
  const policySnapshotBase = getComparableValue(input.baseArtifact, (_path, key) => key === "policySnapshotHash" || key === "governanceSnapshotHash");
  const policySnapshotTarget = getComparableValue(input.targetArtifact, (_path, key) => key === "policySnapshotHash" || key === "governanceSnapshotHash");
  const rollbackBase = isPlainObject(input.baseArtifact) ? canonicalizeInspectionValue((input.baseArtifact as Record<string, unknown>).rollbackContract) : undefined;
  const rollbackTarget = isPlainObject(input.targetArtifact) ? canonicalizeInspectionValue((input.targetArtifact as Record<string, unknown>).rollbackContract) : undefined;
  const approvalsBase = getComparableArray(input.baseArtifact, (_path, key) => key === "approvalRequirements");
  const approvalsTarget = getComparableArray(input.targetArtifact, (_path, key) => key === "approvalRequirements");
  const capabilityBase = getComparableArray(input.baseArtifact, (_path, key) => key === "capabilityClassification");
  const capabilityTarget = getComparableArray(input.targetArtifact, (_path, key) => key === "capabilityClassification");
  const sideEffectBase = getComparableArray(input.baseArtifact, (_path, key) => key === "sideEffectClassification");
  const sideEffectTarget = getComparableArray(input.targetArtifact, (_path, key) => key === "sideEffectClassification");
  const isolationBase = getComparableArray(input.baseArtifact, (_path, key) => key === "isolationRequirements");
  const isolationTarget = getComparableArray(input.targetArtifact, (_path, key) => key === "isolationRequirements");

  const changedFields = [
    riskTierBase !== riskTierTarget ? "riskTier" : undefined,
    trustZoneBase !== trustZoneTarget ? "trustZone" : undefined,
    hashPlanDiffInspectionValue("governance-approval-base", approvalsBase) !== hashPlanDiffInspectionValue("governance-approval-target", approvalsTarget) ? "approvalRequirements" : undefined,
    hashPlanDiffInspectionValue("governance-rollback-base", rollbackBase) !== hashPlanDiffInspectionValue("governance-rollback-target", rollbackTarget) ? "rollbackContract" : undefined,
    policySnapshotBase !== policySnapshotTarget ? "policySnapshotHash" : undefined,
    hashPlanDiffInspectionValue("governance-capability-base", capabilityBase) !== hashPlanDiffInspectionValue("governance-capability-target", capabilityTarget) ? "capabilityClassification" : undefined,
    hashPlanDiffInspectionValue("governance-side-effect-base", sideEffectBase) !== hashPlanDiffInspectionValue("governance-side-effect-target", sideEffectTarget) ? "sideEffectClassification" : undefined,
    hashPlanDiffInspectionValue("governance-isolation-base", isolationBase) !== hashPlanDiffInspectionValue("governance-isolation-target", isolationTarget) ? "isolationRequirements" : undefined,
  ].filter((value): value is string => Boolean(value));

  const unknownGovernanceDrift = [
    riskTierBase, riskTierTarget, trustZoneBase, trustZoneTarget, policySnapshotBase, policySnapshotTarget,
  ].every((value) => value === undefined);

  return Object.freeze({
    driftClass: unknownGovernanceDrift
      ? "UNKNOWN_DRIFT"
      : changedFields.length > 0
        ? "GOVERNANCE_DRIFT"
        : "NO_DRIFT",
    changedFields: Object.freeze(changedFields),
    riskTierChanged: changedFields.includes("riskTier"),
    trustZoneChanged: changedFields.includes("trustZone"),
    approvalRequirementsChanged: changedFields.includes("approvalRequirements"),
    rollbackContractChanged: changedFields.includes("rollbackContract"),
    policySnapshotHashChanged: changedFields.includes("policySnapshotHash"),
    capabilityClassificationChanged: changedFields.includes("capabilityClassification"),
    sideEffectClassificationChanged: changedFields.includes("sideEffectClassification"),
    isolationRequirementsChanged: changedFields.includes("isolationRequirements"),
    unknownGovernanceDrift,
  });
}
