import type { CoordinationReplayAuditArtifact, CoordinationReplayInput } from "@/types/coordination-replay";
import { hashCoordinationReplayValue } from "./replayHashEngine";

export function buildReplayEvidence(input: {
  replayInput: CoordinationReplayInput;
  errors: readonly string[];
}): CoordinationReplayAuditArtifact {
  const routing = input.replayInput.routingResult;
  const artifactBase = Object.freeze({
    auditId: hashCoordinationReplayValue("audit-id", {
      replayId: input.replayInput.replayId,
      coordinationId: input.replayInput.coordinationRecord.coordinationId,
    }),
    replayId: input.replayInput.replayId,
    whyAllowed: routing.allowed ? Object.freeze([
      "Governance snapshot remained historical-only.",
      "Routing lineage remained explicit and static.",
      "Orchestration reconstruction stayed bounded and replay-safe.",
    ]) : Object.freeze([]),
    whyBlocked: Object.freeze([
      ...routing.blockedReasons,
      ...input.errors,
    ].sort()),
    governanceSnapshotId: input.replayInput.coordinationRecord.governanceSnapshotId,
    replaySnapshotId: input.replayInput.coordinationRecord.replaySnapshotId,
    escalationSnapshotId: input.replayInput.coordinationRecord.escalationSnapshotId,
    containmentState: input.replayInput.orchestrationRecord.containment.inheritedState,
    routeTarget: routing.target,
  });
  return Object.freeze({
    ...artifactBase,
    evidenceHash: hashCoordinationReplayValue("audit-artifact", artifactBase),
  });
}
