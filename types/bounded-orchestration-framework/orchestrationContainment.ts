export type BoundedOrchestrationContainmentState =
  | "safe"
  | "restricted"
  | "frozen"
  | "fail_closed";

export type BoundedOrchestrationCeiling =
  | "strict"
  | "restricted"
  | "frozen";
