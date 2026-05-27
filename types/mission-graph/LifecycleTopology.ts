import type { BoundedIntentLifecycleState } from "@/types/lifecycle";

export type LifecycleTopology = Readonly<{
  topologyId: string;
  proposalId: string;
  states: readonly BoundedIntentLifecycleState[];
  transitionIds: readonly string[];
  boundedVisibilityOnly: true;
  createdAt: string;
  topologyHash: string;
}>;
