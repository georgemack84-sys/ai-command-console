export type ConstitutionalReplayDriftClassification =
  | "VALIDATOR_DRIFT"
  | "GOVERNANCE_DRIFT"
  | "DEPENDENCY_DRIFT"
  | "EVIDENCE_DRIFT"
  | "LINEAGE_DRIFT"
  | "TOPOLOGY_DRIFT"
  | "ISOLATION_DRIFT";

export type ConstitutionalReplayDriftRecord = Readonly<{
  driftId: string;
  replayAttackId: string;
  classification: ConstitutionalReplayDriftClassification;
  detected: boolean;
  rationale: string;
  advisoryOnly: true;
  deterministicHash: string;
}>;
