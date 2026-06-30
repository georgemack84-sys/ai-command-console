import type { ExecutionReconstructionPackage } from "@/types/autonomous-execution-reconstruction";
import type { PlanningDecisionReconstructionPackage } from "@/types/planning-decision-reconstruction";
import type { ReplayContractPackage } from "@/types/replay-contract";
import type { SupervisionInterventionReplayPackage } from "@/types/supervision-intervention-replay";

export type ReplayCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ReplayCertificationArea = "CONTRACT" | "SCHEMA" | "EXECUTION" | "PLANNING" | "DECISION" | "DELEGATION" | "ORCHESTRATION" | "SUPERVISION" | "INTERVENTION" | "ROLLBACK" | "PAUSE" | "OUTCOME" | "CONFIDENCE" | "ORDERING" | "CHECKPOINT" | "GOVERNANCE" | "INTEGRITY" | "LINEAGE" | "TENANT" | "AUTHORITY" | "CONSTITUTIONAL" | "EXPLAINABILITY" | "CERTIFICATION_SUITE";

export type ReplayCertificationFailure =
  | "REPLAY_CONTRACT_INVALID"
  | "REPLAY_SCHEMA_INVALID"
  | "REPLAY_CONTRACT_MISSING"
  | "EXECUTION_REPLAY_NOT_REPRODUCIBLE"
  | "EXECUTION_MISMATCH"
  | "PLANNING_REPLAY_NOT_REPRODUCIBLE"
  | "PLANNING_MISMATCH"
  | "DECISION_REPLAY_NOT_REPRODUCIBLE"
  | "DECISION_MISMATCH"
  | "DELEGATION_REPLAY_NOT_REPRODUCIBLE"
  | "DELEGATION_MISMATCH"
  | "ORCHESTRATION_REPLAY_NOT_REPRODUCIBLE"
  | "ORCHESTRATION_MISMATCH"
  | "SUPERVISION_REPLAY_NOT_REPRODUCIBLE"
  | "SUPERVISION_MISMATCH"
  | "INTERVENTION_REPLAY_NOT_REPRODUCIBLE"
  | "INTERVENTION_MISMATCH"
  | "ROLLBACK_REPLAY_NOT_REPRODUCIBLE"
  | "ROLLBACK_MISMATCH"
  | "PAUSE_REPLAY_NOT_REPRODUCIBLE"
  | "PAUSE_MISMATCH"
  | "OUTCOME_REPLAY_NOT_REPRODUCIBLE"
  | "OUTCOME_MISMATCH"
  | "CONFIDENCE_REPLAY_NOT_REPRODUCIBLE"
  | "CONFIDENCE_MISMATCH"
  | "EXECUTION_ORDERING_NONDETERMINISTIC"
  | "CHECKPOINT_REPLAY_NONDETERMINISTIC"
  | "CHECKPOINT_MISMATCH"
  | "GOVERNANCE_EVIDENCE_MISSING"
  | "EVIDENCE_MISMATCH"
  | "INTEGRITY_HASH_VERIFICATION_FAILED"
  | "REPLAY_LINEAGE_INCOMPLETE"
  | "TENANT_ISOLATION_VIOLATION"
  | "AUTHORITY_ESCALATION_DETECTED"
  | "CONSTITUTIONAL_COMPLIANCE_BROKEN"
  | "REPLAY_NOT_EXPLAINABLE"
  | "MINOR_REPLAY_METADATA_GAP";

export type ReplayCertificationScenario = "BASELINE" | ReplayCertificationFailure;

export type ReplayCertificationCheck = Readonly<{
  check_id: string;
  area: ReplayCertificationArea;
  test_name: string;
  expected: "PASS" | "FAIL";
  actual: "PASS" | "FAIL";
  passed: boolean;
  critical: boolean;
  failure_reason: ReplayCertificationFailure | null;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_refs: readonly string[];
  explanation: string;
  check_hash: string;
}>;

export type ReplayCertificationResult = Readonly<{
  result_id: string;
  certification_state: ReplayCertificationState;
  tests_passed: number;
  tests_failed: number;
  critical_failure_count: number;
  warning_count: number;
  failed_tests: readonly ReplayCertificationFailure[];
  readiness_status: "PRODUCTION_READY" | "BLOCKED_PENDING_FULL_PASS" | "CERTIFICATION_DENIED";
  result_hash: string;
}>;

export type ReplayQualityMetrics = Readonly<{
  replay_completeness: number;
  replay_determinism: number;
  reconstruction_accuracy: number;
  replay_consistency: number;
  governance_preservation: number;
  constitutional_preservation: number;
  integrity_verification: number;
  lineage_completeness: number;
  explainability_completeness: number;
  replay_confidence: number;
  overall_score: number;
}>;

export type ReplayCertificationEvidence = Readonly<{
  certification_id: string;
  phase: "8G.5";
  replay_id: string;
  mission_id: string;
  tenant_id: string;
  contract_version: string;
  schema_version: string;
  determinism_score: number;
  integrity_score: number;
  governance_score: number;
  lineage_score: number;
  explainability_score: number;
  overall_score: number;
  certification_state: ReplayCertificationState;
  executed_tests: readonly string[];
  failed_tests: readonly ReplayCertificationFailure[];
  warnings: readonly ReplayCertificationFailure[];
  timestamp: string;
  truth_reference: string;
  lineage_reference: string;
  evidence_hashes: readonly string[];
  replay_references: readonly string[];
  integrity_references: readonly string[];
  evidence_hash: string;
}>;

export type ReplayCertificationAuditReport = Readonly<{
  audit_id: string;
  certification_id: string;
  test_results: readonly ReplayCertificationCheck[];
  evidence_manifest: ReplayCertificationEvidence;
  integrity_verification: "VALID" | "INVALID";
  deterministic_replay_verification: "VALID" | "INVALID";
  audit_hash: string;
}>;

export type ReplayCertificationReadiness = Readonly<{
  readiness_id: string;
  certification_id: string;
  readiness_status: "PRODUCTION_READY" | "BLOCKED_PENDING_FULL_PASS" | "CERTIFICATION_DENIED";
  downstream_autonomy_unlocked: boolean;
  blocking_issues: readonly ReplayCertificationFailure[];
  recommended_actions: readonly string[];
  readiness_hash: string;
}>;

export type ReplayCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  certification_id: string;
  decision: ReplayCertificationState;
  evidence_hash: string;
  result_hash: string;
  audit_hash: string;
  replay_references: readonly string[];
  append_only: true;
  ledger_hash: string;
}>;

export type ReplayCertificationReport = Readonly<{
  certification_id: string;
  certification_version: "replay-certification-gate/v8G.5";
  phase: "8G.5";
  generated_at: string;
  replay_framework_version: "autonomy-replay/v8G";
  source_replay_contract: ReplayContractPackage;
  execution_reconstruction: ExecutionReconstructionPackage;
  planning_decision_reconstruction: PlanningDecisionReconstructionPackage;
  supervision_intervention_replay: SupervisionInterventionReplayPackage;
  certification_checks: readonly ReplayCertificationCheck[];
  quality_metrics: ReplayQualityMetrics;
  certification_result: ReplayCertificationResult;
  certification_evidence: ReplayCertificationEvidence;
  audit_report: ReplayCertificationAuditReport;
  readiness: ReplayCertificationReadiness;
  ledger_entry: ReplayCertificationLedgerEntry;
  deterministic: boolean;
  reproducible: boolean;
  complete: boolean;
  explainable: boolean;
  immutable: boolean;
  governance_compliant: boolean;
  constitutionally_compliant: boolean;
  cryptographically_verifiable: boolean;
  tenant_isolated: boolean;
  independently_auditable: boolean;
  downstream_autonomy_unlocked: boolean;
  digital_signature: string;
  integrity_hash: string;
}>;

export type ReplayCertificationGateInput = Readonly<{
  scenario?: ReplayCertificationScenario;
  replayContractPackage?: ReplayContractPackage;
  executionReconstructionPackage?: ExecutionReconstructionPackage;
  planningDecisionReconstructionPackage?: PlanningDecisionReconstructionPackage;
  supervisionInterventionReplayPackage?: SupervisionInterventionReplayPackage;
}>;

export type ReplayCertificationVisibilitySurface = Readonly<{
  certification_id: string;
  certification_state: ReplayCertificationState;
  readiness_status: "PRODUCTION_READY" | "BLOCKED_PENDING_FULL_PASS" | "CERTIFICATION_DENIED";
  downstream_autonomy_unlocked: boolean;
  overall_score: number;
  tests_failed: number;
  critical_failure_count: number;
  blocking_issues: readonly ReplayCertificationFailure[];
  integrity_status: "VALID" | "INVALID";
  integrity_hash: string;
}>;
