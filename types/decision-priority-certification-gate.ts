import type { PriorityLedgerResult } from "@/types/decision-priority-ledger";

export type PriorityCertificationStatus = "PASS" | "FAIL";
export type PriorityCertificationResult = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type PriorityCertificationFailureReason =
  | "PRIORITY_CONTRACT_INVALID"
  | "SCORING_NONDETERMINISTIC"
  | "RANKING_NONDETERMINISTIC"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "CONSTITUTIONAL_ENFORCEMENT_FAILED"
  | "EXPLAINABILITY_INCOMPLETE"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "LEDGER_INTEGRITY_FAILED"
  | "REPLAY_DIVERGENCE"
  | "TENANT_ISOLATION_FAILED"
  | "OPERATOR_VISIBILITY_FAILED"
  | "ADVISORY_ONLY_VIOLATION"
  | "FAIL_OPEN_DETECTED"
  | "HIDDEN_WEIGHTING_LOGIC_DETECTED"
  | "UNAUTHORIZED_EXECUTION_AUTHORITY"
  | "CERTIFICATION_REPLAY_MISMATCH";

export type DecisionPriorityCertificationInput = Readonly<{
  ledger_result?: PriorityLedgerResult;
  documentation_deficiency_refs?: readonly string[];
  visualization_deficiency_refs?: readonly string[];
  hidden_weighting_refs?: readonly string[];
  unauthorized_execution_refs?: readonly string[];
  fail_open_refs?: readonly string[];
  operator_visibility_complete?: boolean;
  advisory_only?: boolean;
  expected_replay_hash?: string;
}>;

export type PriorityCertificationReport = Readonly<{
  report_id: string;
  report_name: string;
  status: PriorityCertificationStatus;
  summary: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type DecisionPriorityCertification = Readonly<{
  certification_id: string;
  certification_timestamp: string;
  priority_contract_status: PriorityCertificationStatus;
  scoring_status: PriorityCertificationStatus;
  ranking_status: PriorityCertificationStatus;
  governance_status: PriorityCertificationStatus;
  constitutional_status: PriorityCertificationStatus;
  explainability_status: PriorityCertificationStatus;
  ledger_status: PriorityCertificationStatus;
  replay_status: PriorityCertificationStatus;
  tenant_isolation_status: PriorityCertificationStatus;
  advisory_status: PriorityCertificationStatus;
  certification_result: PriorityCertificationResult;
  certification_reports: readonly PriorityCertificationReport[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  certified_by: "decision-priority-certification-gate";
  certification_version: "decision-priority-certification-gate/v1";
  integrity_hash: string;
}>;

export type DecisionPriorityCertificationReplayRecord = Readonly<{
  replay_id: string;
  expected_hash: string;
  reconstructed_hash: string;
  replay_valid: boolean;
  certification_result: PriorityCertificationResult;
  failures: readonly PriorityCertificationFailureReason[];
  integrity_hash: string;
}>;

export type DecisionPriorityCertificationGateResult = Readonly<{
  gate_status: PriorityCertificationResult;
  certificationStatus: PriorityCertificationResult;
  progression_allowed: boolean;
  failures: readonly PriorityCertificationFailureReason[];
  conditional_deficiencies: readonly string[];
  certification: DecisionPriorityCertification;
  replay_record: DecisionPriorityCertificationReplayRecord;
  deterministic: true;
  advisoryOnly: true;
  failClosed: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DecisionPriorityCertificationObservability = Readonly<{
  evaluations: number;
  pass_count: number;
  conditional_pass_count: number;
  fail_count: number;
  replay_failures: number;
  ledger_failures: number;
  tenant_failures: number;
  advisory_failures: number;
}>;
