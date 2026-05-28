import type { CorrelationReplayBinding, CorrelationResult } from "@/types/intent-correlation-engine";
import { hashCorrelationValue } from "./correlationHasher";

export function buildCorrelationReplayView(input: {
  result: CorrelationResult;
  replayBinding: CorrelationReplayBinding;
}) {
  return Object.freeze({
    replayViewId: hashCorrelationValue("intent-correlation-replay-view-id", {
      resultHash: input.result.resultHash,
      replayBindingId: input.replayBinding.replayBindingId,
    }),
    status: input.result.status,
    relationshipIds: Object.freeze(input.result.relationships.map((relationship) => relationship.correlationId).sort()),
    clusterIds: Object.freeze(input.result.clusters.map((cluster) => cluster.clusterId).sort()),
    replayBindingId: input.replayBinding.replayBindingId,
    governanceSnapshotHash: input.replayBinding.governanceSnapshotHash,
    readinessCertificationHash: input.replayBinding.readinessCertificationHash,
  });
}
