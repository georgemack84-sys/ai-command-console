import type { ReplayComparisonView, ReplayDriftType, ReplayDriftView, ReplayIntegrityView, ReplayLineageView } from "@/types/replay-reconstruction-engine";

export function classifyReplayDrift(input: {
  lineage: ReplayLineageView;
  integrity: ReplayIntegrityView;
  comparison: ReplayComparisonView;
}): ReplayDriftView {
  const driftTypes: ReplayDriftType[] = [];
  const changedFields = [...input.comparison.changedPaths];

  if (!input.integrity.treatyIntegrityValid || !input.integrity.replayHashValid) {
    driftTypes.push("INTEGRITY_DRIFT");
  }
  if (changedFields.some((path) => /governance|policySnapshotHash|approvalChainHash/i.test(path))) {
    driftTypes.push("POLICY_DRIFT", "GOVERNANCE_DRIFT");
  }
  if (changedFields.some((path) => /registrySnapshotHash/i.test(path))) {
    driftTypes.push("REGISTRY_DRIFT");
  }
  if (changedFields.some((path) => /toolBinding|toolContracts/i.test(path))) {
    driftTypes.push("CONTRACT_DRIFT");
  }
  if (changedFields.some((path) => /dependenc/i.test(path))) {
    driftTypes.push("DEPENDENCY_DRIFT");
  }
  if (changedFields.some((path) => /steps|dependencyOrder/i.test(path))) {
    driftTypes.push("ORDERING_DRIFT");
  }
  if (!input.lineage.validatorBindings.every((binding) => binding.status === "passed")) {
    driftTypes.push("VALIDATOR_DRIFT");
  }
  if (changedFields.some((path) => /runtime/i.test(path))) {
    driftTypes.push("RUNTIME_DRIFT");
  }
  if (!input.lineage.valid || input.comparison.errors.includes("PLAN_DIFF_UNKNOWN_DRIFT")) {
    driftTypes.push("UNKNOWN_DRIFT");
  }

  const unique = [...new Set(driftTypes)];
  const replayValid = unique.length === 0;

  return Object.freeze({
    driftDetected: unique.length > 0,
    driftTypes: Object.freeze(unique),
    changedFields: Object.freeze(changedFields),
    replayValid,
    failClosed: unique.includes("UNKNOWN_DRIFT") || !input.integrity.valid,
  });
}
