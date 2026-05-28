import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";
import type { AuditLedgerEvent } from "./replay-audit-types";

const EVENT_TYPES = [
  "plan.execution_truth.validated",
  "plan.execution_compatibility.validated",
  "plan.compatibility_snapshot.frozen",
  "plan.replay_snapshot.generated",
  "plan.replay_proof.generated",
  "plan.audit_artifact.generated",
] as const;

export function buildAuditLedgerEvents(input: {
  planId: string;
  planHash: string;
  executionTruthHash: string;
  executionCompatibilityHash: string;
  compatibilitySnapshotHash: string;
  replaySnapshotHash: string;
  replayProofHash: string;
  auditArtifactHash: string;
}): readonly AuditLedgerEvent[] {
  let previousEventHash: string | undefined;
  const payloads: Readonly<Record<string, unknown>>[] = [
    { executionTruthHash: input.executionTruthHash },
    { executionCompatibilityHash: input.executionCompatibilityHash },
    { compatibilitySnapshotHash: input.compatibilitySnapshotHash },
    { replaySnapshotHash: input.replaySnapshotHash },
    { replayProofHash: input.replayProofHash },
    { auditArtifactHash: input.auditArtifactHash },
  ];

  return EVENT_TYPES.map((eventType, index) => {
    const payload = payloads[index]!;
    const payloadHash = hashPayloadDeterministically(payload);
    const event = {
      eventVersion: "4.2H",
      eventType,
      planId: input.planId,
      planHash: input.planHash,
      previousEventHash,
      payloadHash,
      payload,
    };
    const eventHash = hashPayloadDeterministically(event);
    previousEventHash = eventHash;
    return {
      ...event,
      eventHash,
    };
  });
}
