import type { LifecycleTopology } from "@/types/mission-graph";
import type { LifecycleComputation } from "@/types/lifecycle";
import { hashMissionGraphValue } from "./graphHasher";

export function buildLifecycleTopology(input: {
  proposalId: string;
  lifecycle: LifecycleComputation;
  createdAt: string;
}): readonly LifecycleTopology[] {
  return Object.freeze([
    Object.freeze({
      topologyId: hashMissionGraphValue("mission-graph-lifecycle-topology", {
        proposalId: input.proposalId,
        transitionId: input.lifecycle.record.transitionId,
      }),
      proposalId: input.proposalId,
      states: Object.freeze(input.lifecycle.lineage.entries.map((entry) => entry.toState)),
      transitionIds: Object.freeze(input.lifecycle.lineage.entries.map((entry) => entry.transitionId)),
      boundedVisibilityOnly: true as const,
      createdAt: input.createdAt,
      topologyHash: hashMissionGraphValue("mission-graph-lifecycle-topology-hash", {
        proposalId: input.proposalId,
        lineage: input.lifecycle.lineage.entries,
      }),
    }),
  ]);
}
