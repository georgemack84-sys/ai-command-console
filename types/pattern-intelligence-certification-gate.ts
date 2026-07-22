import type { PatternContractResult } from "@/types/pattern-intelligence-contract";
import type { PatternCandidateBuilderResult } from "@/types/pattern-candidate-builder";
import type { PatternDetectionResult } from "@/types/pattern-detection-engine";
import type { PatternValidationEvidenceResult } from "@/types/pattern-validation-evidence-engine";
import type { PatternScoringResult } from "@/types/pattern-confidence-strategic-scoring";
import type { GovernanceEscalationResult } from "@/types/governance-escalation-pattern-intelligence";
import type { PatternLedgerResult } from "@/types/pattern-intelligence-ledger";
import type { PatternReplayResult } from "@/types/pattern-replay-explainability";
import type { PatternDashboardResult } from "@/types/operator-pattern-intelligence-dashboard";

export type PatternIntelligenceCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type PatternCertificationTestStatus = "PASS" | "FAIL";

export type PatternCertificationFailure =
  | "CONTRACT_VALIDATION_FAILED"
  | "CANDIDATE_GENERATION_FAILED"
  | "DETECTION_FAILED"
  | "VALIDATION_FAILED"
  | "SCORING_FAILED"
  | "GOVERNANCE_FAILED"
  | "LEDGER_FAILED"
  | "REPLAY_FAILED"
  | "DASHBOARD_FAILED"
  | "DETERMINISM_FAILED"
  | "EVIDENCE_INSUFFICIENT"
  | "REPLAY_DIVERGENCE"
  | "INTEGRITY_FAILURE"
  | "GOVERNANCE_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "TENANT_ISOLATION_BREACH"
  | "ADVISORY_ONLY_VIOLATION"
  | "LEDGER_MUTATION"
  | "EXPLAINABILITY_INCOMPLETE"
  | "OPERATOR_VISIBILITY_MISSING"
  | "PRODUCTION_READINESS_BLOCKED"
  | "CONDITIONAL_GAP_REMAINING"
  | "FAIL_OPEN_BEHAVIOR";

export type PatternCertificationScenario =
  | "BASELINE"
  | "CONDITIONAL_GAP"
  | "CONTRACT_FAILURE"
  | "CANDIDATE_FAILURE"
  | "DETECTION_FAILURE"
  | "VALIDATION_FAILURE"
  | "SCORING_FAILURE"
  | "GOVERNANCE_FAILURE"
  | "LEDGER_FAILURE"
  | "REPLAY_FAILURE"
  | "DASHBOARD_FAILURE"
  | "DETERMINISM_FAILURE"
  | "INSUFFICIENT_EVIDENCE"
  | "REPLAY_DIVERGENCE"
  | "HASH_MISMATCH"
  | "GOVERNANCE_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "CROSS_TENANT"
  | "ADVISORY_ONLY_VIOLATION"
  | "LEDGER_MUTATION"
  | "INCOMPLETE_EXPLAINABILITY"
  | "MISSING_OPERATOR_VISIBILITY"
  | "FAIL_OPEN";

export type PatternCertificationAreaResult = Readonly<{
  area_id: string;
  status: PatternCertificationTestStatus;
  summary: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  failures: readonly PatternCertificationFailure[];
  integrity_hash: string;
}>;

export type PatternIntelligenceCertificationRecord = Readonly<{
  certification_id: string;
  phase_id: "10.4";
  certification_timestamp: string;
  certification_version: "pattern-intelligence-certification-gate/v1";
  contract_validation_result: PatternCertificationTestStatus;
  candidate_generation_result: PatternCertificationTestStatus;
  detection_result: PatternCertificationTestStatus;
  validation_result: PatternCertificationTestStatus;
  scoring_result: PatternCertificationTestStatus;
  governance_result: PatternCertificationTestStatus;
  ledger_result: PatternCertificationTestStatus;
  replay_result: PatternCertificationTestStatus;
  dashboard_result: PatternCertificationTestStatus;
  constitutional_result: PatternCertificationTestStatus;
  governance_compliance_result: PatternCertificationTestStatus;
  tenant_isolation_result: PatternCertificationTestStatus;
  production_readiness_result: PatternCertificationTestStatus;
  certification_state: PatternIntelligenceCertificationState;
  failed_tests: readonly PatternCertificationFailure[];
  certification_summary: string;
  replay_refs: readonly string[];
  integrity_hash: string;
  adaptive_consumption_allowed: boolean;
  advisory_only: true;
  immutable: true;
}>;

export type PatternCertificationApiSurface = Readonly<{
  api_id: string;
  execute_certification: "POST /pattern-intelligence-certification-gate/certify";
  retrieve_status: "POST /pattern-intelligence-certification-gate/status";
  generate_report: "POST /pattern-intelligence-certification-gate/report";
  validate_determinism: "POST /pattern-intelligence-certification-gate/determinism";
  validate_replay: "POST /pattern-intelligence-certification-gate/replay";
  validate_governance: "POST /pattern-intelligence-certification-gate/governance";
  validate_integrity: "POST /pattern-intelligence-certification-gate/integrity";
  validate_tenant_isolation: "POST /pattern-intelligence-certification-gate/tenant";
  verify_production_readiness: "POST /pattern-intelligence-certification-gate/production";
  retrieve_contract: "GET /pattern-intelligence-certification-gate/contract";
  update_supported: false;
  delete_supported: false;
  adaptive_consumption_without_pass_supported: false;
  autonomous_action_supported: false;
  integrity_hash: string;
}>;

export type PatternCertificationInput = Readonly<{
  dashboard_result?: PatternDashboardResult;
  scenario?: PatternCertificationScenario;
}>;

export type PatternCertificationResult = Readonly<{
  pattern_intelligence_certification_gate_version: "pattern-intelligence-certification-gate/v1";
  contract_result: PatternContractResult;
  candidate_result: PatternCandidateBuilderResult;
  detection_result: PatternDetectionResult;
  validation_evidence_result: PatternValidationEvidenceResult;
  scoring_result: PatternScoringResult;
  governance_escalation_result: GovernanceEscalationResult;
  ledger_result: PatternLedgerResult;
  replay_explainability_result: PatternReplayResult;
  dashboard_result: PatternDashboardResult;
  api_surface: PatternCertificationApiSurface;
  certification_record: PatternIntelligenceCertificationRecord;
  determinism_report: PatternCertificationAreaResult;
  replay_report: PatternCertificationAreaResult;
  governance_report: PatternCertificationAreaResult;
  constitutional_report: PatternCertificationAreaResult;
  integrity_report: PatternCertificationAreaResult;
  tenant_isolation_report: PatternCertificationAreaResult;
  explainability_report: PatternCertificationAreaResult;
  production_readiness_report: PatternCertificationAreaResult;
  deterministic: true;
  replayable: true;
  evidence_based: boolean;
  governance_compliant: boolean;
  constitutionally_compliant: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  fail_closed: true;
  adaptive_consumption_allowed: boolean;
  autonomous_learning: false;
  autonomous_execution: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PatternCertificationFoundation = Readonly<{
  pattern_intelligence_certification_gate_version: "pattern-intelligence-certification-gate/v1";
  api_surface: PatternCertificationApiSurface;
  result: PatternCertificationResult;
}>;
