import type { BoundedOrchestrationCeiling, BoundedOrchestrationContainmentState } from "./orchestrationContainment";

export type BoundedOrchestrationState =
  | "strict_bounded"
  | "restricted"
  | "frozen"
  | "invalid";

export type BoundedOrchestrationChronologyEntry = Readonly<{
  entryId: string;
  orchestrationId: string;
  coordinationId: string;
  containmentState: BoundedOrchestrationContainmentState;
  ceiling: BoundedOrchestrationCeiling;
  orchestrationState: BoundedOrchestrationState;
  topologyHash: string;
  createdAt: string;
}>;

export type BoundedOrchestrationChronology = Readonly<{
  chronologyId: string;
  entries: readonly BoundedOrchestrationChronologyEntry[];
  chronologyHash: string;
}>;
