import type { ConstitutionalTelemetryInput, TelemetryEvidence } from "@/types/adversarial-telemetry";
import { hashTelemetryValue } from "./telemetryHashEngine";

export function buildTelemetryEvidence(input: {
  telemetryInput: ConstitutionalTelemetryInput;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
}): TelemetryEvidence {
  const source = input.telemetryInput.constitutionalAuditEpisodeResult;
  const base = Object.freeze({
    telemetryId: input.telemetryInput.telemetryId,
    governanceLineageId: source.lineage.ledgerId,
    replayLineageId: source.hashes.replayHash,
    escalationLineageId: source.evidence.escalationLineageId,
    approvalLineageId: source.evidence.approvalLineageId,
    evidenceRefs: Object.freeze([...input.evidenceRefs].sort()),
    reasons: Object.freeze([...input.reasons].sort()),
  });
  return Object.freeze({
    evidenceId: hashTelemetryValue("telemetry-evidence-id", base),
    telemetryId: input.telemetryInput.telemetryId,
    governanceLineageId: base.governanceLineageId,
    replayLineageId: base.replayLineageId,
    escalationLineageId: base.escalationLineageId,
    approvalLineageId: base.approvalLineageId,
    evidenceRefs: base.evidenceRefs,
    evidenceHash: hashTelemetryValue("telemetry-evidence", base),
    immutable: true as const,
  });
}
