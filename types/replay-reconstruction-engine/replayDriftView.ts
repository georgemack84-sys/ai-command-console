export type ReplayDriftType =
  | "VALIDATOR_DRIFT"
  | "POLICY_DRIFT"
  | "REGISTRY_DRIFT"
  | "CONTRACT_DRIFT"
  | "GOVERNANCE_DRIFT"
  | "DEPENDENCY_DRIFT"
  | "ORDERING_DRIFT"
  | "RUNTIME_DRIFT"
  | "INTEGRITY_DRIFT"
  | "UNKNOWN_DRIFT";

export type ReplayDriftView = Readonly<{
  driftDetected: boolean;
  driftTypes: readonly ReplayDriftType[];
  changedFields: readonly string[];
  replayValid: boolean;
  failClosed: boolean;
}>;
