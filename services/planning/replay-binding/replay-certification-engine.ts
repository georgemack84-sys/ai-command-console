import { createReplayBindingFailure } from "./replay-binding-errors";
import type {
  ImmutableReplayBinding,
  ReplayBindingBuildInput,
  ReplayBindingFailure,
  ReplayCertification,
} from "./replay-binding-types";

function collectEvidenceFailures(input: ReplayBindingBuildInput): ReplayBindingFailure[] {
  const failures: ReplayBindingFailure[] = [];
  const replayAudit = input.admissionInput.versionedReplayArtifact.replayAuditResult;
  const artifacts = replayAudit.artifacts;

  if (replayAudit.verdict !== "REPLAY_AUDIT_READY" || !artifacts) {
    failures.push(createReplayBindingFailure(
      "FORENSIC_REPLAY_INCOMPLETE",
      "Replay audit artifacts are required for replay certification.",
      "versionedReplayArtifact.replayAuditResult",
    ));
    return failures;
  }

  if (!replayAudit.replayProofHash || !replayAudit.auditArtifactHash || !replayAudit.evidenceReferenceHash) {
    failures.push(createReplayBindingFailure(
      "FORENSIC_REPLAY_INCOMPLETE",
      "Replay proof, audit artifact, and evidence reference hashes are required.",
      "versionedReplayArtifact.replayAuditResult",
    ));
  }

  if (artifacts.replayProof.verdict !== "REPLAY_COMPATIBLE" || !artifacts.replayProof.structuralEquality) {
    failures.push(createReplayBindingFailure(
      "REPLAY_RECONSTRUCTION_UNSTABLE",
      "Replay proof does not certify deterministic reconstruction.",
      "versionedReplayArtifact.replayAuditResult.artifacts.replayProof",
    ));
  }

  if (
    replayAudit.executionTruthHash !== input.admissionReadiness.context.lineage.executionTruthHash
    || replayAudit.executionCompatibilityHash !== input.admissionReadiness.context.lineage.executionCompatibilityHash
    || replayAudit.replaySnapshotHash !== input.admissionReadiness.context.lineage.replaySnapshotHash
  ) {
    failures.push(createReplayBindingFailure(
      "IMMUTABLE_LINEAGE_VIOLATION",
      "Replay audit hashes do not match admitted lineage anchors.",
      "versionedReplayArtifact.replayAuditResult",
    ));
  }

  if (
    input.expectedDerivedSimulationHash
    && input.admissionReadiness.context.lineage.derivedSimulationHash
    && input.expectedDerivedSimulationHash !== input.admissionReadiness.context.lineage.derivedSimulationHash
  ) {
    failures.push(createReplayBindingFailure(
      "DERIVED_EVIDENCE_MISMATCH",
      "Derived simulation hash does not match expected replay binding evidence.",
      "expectedDerivedSimulationHash",
    ));
  }

  return failures;
}

export function certifyReplayReadiness(input: {
  buildInput: ReplayBindingBuildInput;
  binding: ImmutableReplayBinding;
  runtimeValid: boolean;
  trustZoneValid: boolean;
  preexistingFailures?: readonly ReplayBindingFailure[];
}): {
  certification: ReplayCertification;
  failures: readonly ReplayBindingFailure[];
} {
  const evidenceFailures = collectEvidenceFailures(input.buildInput);
  const failures = [
    ...(input.preexistingFailures ?? []),
    ...evidenceFailures,
  ];
  const decision = input.buildInput.admissionReadiness.result.decision;
  const revoked = decision === "REVOKED" || decision === "DENIED" || decision === "QUARANTINED";
  const quarantined = decision === "QUARANTINED" || failures.some((failure) => failure.code === "TRUST_ZONE_REPLAY_MISMATCH");

  const certification: ReplayCertification = {
    certificationId: `rc-${input.binding.bindingId}`,
    replayDeterministic: evidenceFailures.every((failure) => failure.code !== "REPLAY_RECONSTRUCTION_UNSTABLE"),
    replayComplete: evidenceFailures.every((failure) => failure.code !== "FORENSIC_REPLAY_INCOMPLETE"),
    replayReconstructable: evidenceFailures.every((failure) => failure.code !== "REPLAY_EVIDENCE_CORRUPTED" && failure.code !== "REPLAY_RECONSTRUCTION_UNSTABLE"),
    runtimeBindingValid: input.runtimeValid,
    trustZoneValidated: input.trustZoneValid,
    certificationStatus: revoked
      ? "REVOKED"
      : quarantined
        ? "QUARANTINED"
        : failures.length > 0 || !input.runtimeValid || !input.trustZoneValid
          ? "FAILED"
          : "CERTIFIED",
    createdAt: input.binding.createdAt,
  };

  return {
    certification,
    failures,
  };
}
