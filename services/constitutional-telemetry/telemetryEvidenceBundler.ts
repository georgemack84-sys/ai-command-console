import type {
  ConstitutionalTelemetryEvidence,
  ConstitutionalTelemetryInput,
} from "./telemetryStateTypes";
import { hashConstitutionalTelemetryValue } from "./telemetryHashingEngine";

export function bundleConstitutionalTelemetryEvidence(input: {
  telemetryInput: ConstitutionalTelemetryInput;
  reasons: readonly string[];
}): ConstitutionalTelemetryEvidence {
  const replay = input.telemetryInput.constitutionalReplayResult;
  const supremacy = input.telemetryInput.humanSupremacyResult;
  const escalation = input.telemetryInput.escalationDeterminismResult;
  const emergence = input.telemetryInput.antiEmergenceResult;
  const runtime = input.telemetryInput.runtimeAdmissibilityResult;
  const evidenceRefs = Object.freeze([
    replay.evidence.evidenceId,
    supremacy.evidence.evidenceId,
    escalation.evidence.evidenceId,
    emergence.evidence.evidenceId,
    runtime.evidence.evidenceId,
    replay.lineage.lineageHash,
    supremacy.lineage.lineageHash,
    escalation.lineage.lineageHash,
    emergence.lineage.lineageHash,
    runtime.lineage.lineageHash,
  ].sort());
  const reasons = Object.freeze([...input.reasons].sort());
  return Object.freeze({
    evidenceId: hashConstitutionalTelemetryValue("constitutional-telemetry-evidence-id", input.telemetryInput.telemetryId),
    telemetryId: input.telemetryInput.telemetryId,
    replayEvidenceId: replay.evidence.evidenceId,
    runtimeEvidenceId: runtime.evidence.evidenceId,
    supremacyEvidenceId: supremacy.evidence.evidenceId,
    escalationEvidenceId: escalation.evidence.evidenceId,
    emergenceEvidenceId: emergence.evidence.evidenceId,
    evidenceRefs,
    reasons,
    evidenceHash: hashConstitutionalTelemetryValue("constitutional-telemetry-evidence", {
      telemetryId: input.telemetryInput.telemetryId,
      evidenceRefs,
      reasons,
    }),
  });
}
