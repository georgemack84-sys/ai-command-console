import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

export function certifyPolicyLineage(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  const complete =
    input.constitutionalReadinessResult.lineage.entries.length > 0
    && input.constitutionalReplayResult.lineage.entries.length > 0
    && input.constitutionalTelemetryResult.lineage.entries.length > 0
    && input.constitutionalRuntimeSimulationResult.lineage.entries.length > 0;
  if (complete) {
    return Object.freeze([]);
  }
  return Object.freeze([{
    code: "CONSTITUTIONAL_CERTIFICATION_LINEAGE_GAP",
    message: "Certification lineage could not be completed from upstream evidence.",
    path: "lineage",
  }]);
}
