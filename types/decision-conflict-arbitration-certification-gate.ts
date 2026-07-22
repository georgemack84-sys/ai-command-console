import type { ArbitrationRulesEngineResult } from "@/types/decision-arbitration-rules-engine";
import type { ArbitrationObservabilityAnalyticsResult } from "@/types/decision-arbitration-observability-analytics";
import type { ConflictClassificationEngineResult } from "@/types/decision-conflict-classification-engine";
import type { ConflictDetectionContractFoundation } from "@/types/decision-conflict-detection-contract";
import type { ConflictDetectionEngineResult } from "@/types/decision-conflict-detection-engine";
import type { ConflictLedgerResult } from "@/types/decision-conflict-ledger";
import type { EnforcementResult } from "@/types/decision-constitutional-governance-enforcement";
import type { EscalationWorkflowResult } from "@/types/decision-conflict-escalation-workflow";
import type { TradeoffExplanationGeneratorResult } from "@/types/decision-tradeoff-explanation-generator";

export type ConflictArbitrationCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type ConflictArbitrationCertificationFailureReason =
  | "CONFLICT_CONTRACT_INVALID"
  | "DETECTION_NONDETERMINISTIC"
  | "CLASSIFICATION_NONREPRODUCIBLE"
  | "ARBITRATION_NONDETERMINISTIC"
  | "TRADEOFF_EXPLANATION_INCOMPLETE"
  | "ESCALATION_NONDETERMINISTIC"
  | "LEDGER_INTEGRITY_FAILURE"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_BOUNDARY_VIOLATION"
  | "TENANT_ISOLATION_FAILURE"
  | "HIDDEN_ARBITRATION"
  | "UNDOCUMENTED_OVERRIDE"
  | "SILENT_CONFLICT_RESOLUTION"
  | "REPLAY_DIVERGENCE"
  | "INTEGRITY_HASH_MISMATCH"
  | "ADVISORY_ONLY_BOUNDARY_VIOLATION"
  | "OBSERVABILITY_DEFICIENCY"
  | "PRODUCTION_READINESS_BLOCKED"
  | "UNAUTHORIZED_CERTIFICATION_ACCESS";

export type ConflictArbitrationCertificationReportType =
  | "Certification Report"
  | "Arbitration Validation Report"
  | "Replay Validation Report"
  | "Governance Compliance Report"
  | "Constitutional Compliance Report"
  | "Conflict Ledger Validation Report"
  | "Production Readiness Report";

export type ConflictArbitrationCertificationTest = Readonly<{
  test_id: string;
  phase: "9.6.1" | "9.6.2" | "9.6.3" | "9.6.4" | "9.6.5" | "9.6.6" | "9.6.7" | "9.6.8" | "9.6.9" | "9.6.10";
  description: string;
  expected: "PASS" | "FAIL";
  actual: "PASS" | "FAIL";
  critical: boolean;
  failure_reason?: ConflictArbitrationCertificationFailureReason;
  evidence_refs: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type ConflictArbitrationCertificationReport = Readonly<{
  report_id: string;
  report_type: ConflictArbitrationCertificationReportType;
  outcome: ConflictArbitrationCertificationOutcome;
  findings: readonly ConflictArbitrationCertificationFailureReason[];
  supporting_tests: readonly string[];
  evidence_refs: readonly string[];
  metrics: Readonly<Record<string, number>>;
  replay_ref: string;
  integrity_hash: string;
}>;

export type ConflictArbitrationCertificationLedgerRecord = Readonly<{
  ledger_id: string;
  certification_id: string;
  outcome: ConflictArbitrationCertificationOutcome;
  report_refs: readonly string[];
  test_refs: readonly string[];
  production_ready: boolean;
  phase_advancement_authorized: boolean;
  replay_ref: string;
  lineage_ref: string;
  ledger_timestamp: string;
  integrity_hash: string;
}>;

export type ConflictArbitrationCertificationObservability = Readonly<{
  certification_execution_duration: number;
  tests_executed: number;
  tests_passed: number;
  tests_failed: number;
  replay_validation_success_rate: number;
  governance_compliance_rate: number;
  constitutional_compliance_rate: number;
  integrity_verification_rate: number;
  production_readiness_score: number;
  certification_outcome_history: Readonly<Record<ConflictArbitrationCertificationOutcome, number>>;
}>;

export type ConflictArbitrationCertificationInput = Readonly<{
  conflict_contract?: ConflictDetectionContractFoundation;
  detection_result?: ConflictDetectionEngineResult;
  classification_result?: ConflictClassificationEngineResult;
  arbitration_result?: ArbitrationRulesEngineResult;
  tradeoff_result?: TradeoffExplanationGeneratorResult;
  escalation_result?: EscalationWorkflowResult;
  ledger_result?: ConflictLedgerResult;
  enforcement_result?: EnforcementResult;
  analytics_result?: ArbitrationObservabilityAnalyticsResult;
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type ConflictArbitrationCertificationValidation = Readonly<{
  validation_state: "VALID" | "REJECTED";
  fail_closed: boolean;
  failures: readonly ConflictArbitrationCertificationFailureReason[];
  checks: Readonly<{
    deterministic: boolean;
    replay_valid: boolean;
    governance_enforced: boolean;
    constitutional_enforced: boolean;
    authority_valid: boolean;
    tenant_isolated: boolean;
    ledger_integrity_valid: boolean;
    explainability_complete: boolean;
    observability_complete: boolean;
    advisory_only: boolean;
    production_ready: boolean;
  }>;
}>;

export type ConflictArbitrationCertificationResult = Readonly<{
  certification_id: string;
  certification_outcome: ConflictArbitrationCertificationOutcome;
  production_ready: boolean;
  phase_advancement_authorized: boolean;
  fail_closed: boolean;
  tests: readonly ConflictArbitrationCertificationTest[];
  reports: readonly ConflictArbitrationCertificationReport[];
  certification_ledger: readonly ConflictArbitrationCertificationLedgerRecord[];
  observability: ConflictArbitrationCertificationObservability;
  validation: ConflictArbitrationCertificationValidation;
  replay_hash: string;
  failures: readonly ConflictArbitrationCertificationFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type ConflictArbitrationCertificationReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  certification_ref: string;
  test_refs: readonly string[];
  report_refs: readonly string[];
  ledger_refs: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly ConflictArbitrationCertificationFailureReason[];
  integrity_hash: string;
}>;

export type ConflictArbitrationCertificationFoundation = Readonly<{
  certification_version: "decision-conflict-arbitration-certification-gate/v1";
  report_types: readonly ConflictArbitrationCertificationReportType[];
  result: ConflictArbitrationCertificationResult;
  replay: ConflictArbitrationCertificationReplay;
}>;
