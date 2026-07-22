import type { GovernanceRiskResult } from "@/types/governance-aware-risk-adaptation";
import type { RiskActualizationResult } from "@/types/risk-actualization-analyzer";
import type { RiskAdaptationDashboardResult } from "@/types/risk-adaptation-dashboards";
import type { RiskAdaptationFoundationResult } from "@/types/risk-adaptation-engine-foundation";
import type { RiskAdaptationLedgerResult } from "@/types/risk-adaptation-ledger";
import type { RiskAdaptationSimulationResult } from "@/types/risk-adaptation-simulation";
import type { RiskDriftResult } from "@/types/risk-drift-detector";
import type { RiskPatternResult } from "@/types/risk-pattern-intelligence";
import type { RiskSeverityRecalibrationResult } from "@/types/risk-severity-recalibrator";

export type RiskAdaptationCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type RiskAdaptationCertificationValidationState = "CERTIFIED" | "FAILED" | "PENDING_REPLAY" | "REJECTED";
export type RiskAdaptationCertificationArea = "DETERMINISM" | "EVIDENCE" | "GOVERNANCE" | "CONSTITUTIONAL" | "SIMULATION" | "LEDGER" | "DASHBOARD" | "REPLAY" | "TENANT_ISOLATION" | "PRODUCTION_READINESS";

export type RiskAdaptationCertificationFailure =
  | "COMPONENT_CERTIFICATION_MISSING"
  | "NONDETERMINISTIC_RECOMMENDATION_GENERATION"
  | "UNSUPPORTED_RECALIBRATION_PROPOSAL"
  | "SUPPORTING_EVIDENCE_MISSING"
  | "RISK_SCORING_INCONSISTENT"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "HISTORICAL_RECORD_MODIFICATION_DETECTED"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "CONSTITUTIONAL_VIOLATION_DETECTED"
  | "UNAUTHORIZED_AUTHORITY_ESCALATION"
  | "OPERATOR_APPROVAL_MISSING"
  | "HIGH_IMPACT_SIMULATION_MISSING"
  | "AUTOMATIC_PRODUCTION_MUTATION_DETECTED"
  | "UNAUTHORIZED_PRODUCTION_CONFIGURATION_CHANGE"
  | "LEDGER_INTEGRITY_FAILURE"
  | "HASH_VERIFICATION_FAILURE"
  | "REPLAY_LINEAGE_GAP"
  | "CERTIFICATION_LINEAGE_GAP"
  | "ROLLBACK_LINEAGE_GAP"
  | "CROSS_TENANT_DATA_LEAKAGE"
  | "AUDIT_TRAIL_INCOMPLETE"
  | "EXPLAINABILITY_DEFICIENCY"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "ADVISORY_ONLY_VIOLATION"
  | "AUTONOMOUS_LEARNING_DETECTED"
  | "FAIL_OPEN_BEHAVIOR";

export type RiskAdaptationCertificationScenario =
  | "BASELINE"
  | "CONDITIONAL"
  | "MISSING_COMPONENT"
  | "NONDETERMINISTIC"
  | "UNSUPPORTED_RECALIBRATION"
  | "MISSING_EVIDENCE"
  | "SCORING_INCONSISTENCY"
  | "REPLAY_DIVERGENCE"
  | "HISTORICAL_MUTATION"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_ESCALATION"
  | "MISSING_OPERATOR_APPROVAL"
  | "MISSING_SIMULATION"
  | "PRODUCTION_MUTATION"
  | "CONFIGURATION_CHANGE"
  | "LEDGER_FAILURE"
  | "HASH_MISMATCH"
  | "REPLAY_GAP"
  | "CERTIFICATION_GAP"
  | "ROLLBACK_GAP"
  | "CROSS_TENANT"
  | "AUDIT_GAP"
  | "EXPLAINABILITY_GAP"
  | "INTEGRITY_FAILURE"
  | "ADVISORY_VIOLATION"
  | "AUTONOMOUS_LEARNING"
  | "FAIL_OPEN";

export type RiskAdaptationCertificationTest = Readonly<{
  test_id: string;
  area: RiskAdaptationCertificationArea;
  description: string;
  expected: "PASS";
  actual: RiskAdaptationCertificationOutcome;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type RiskAdaptationCertificationEvidencePackage = Readonly<{
  evidence_package_id: string;
  certification_summary: string;
  test_execution_refs: readonly string[];
  determinism_report_ref: string;
  governance_report_ref: string;
  constitutional_report_ref: string;
  simulation_report_ref: string;
  replay_report_ref: string;
  ledger_integrity_report_ref: string;
  dashboard_validation_report_ref: string;
  tenant_isolation_ref: string;
  audit_trail_ref: string;
  production_readiness_ref: string;
  certification_lineage_refs: readonly string[];
  integrity_hashes: readonly string[];
  immutable: true;
  replayable: true;
  integrity_hash: string;
}>;

export type RiskAdaptationCertificationRecord = Readonly<{
  certification_id: string;
  tenant_id: string;
  certification_scope: "PHASE_10_7_RISK_ADAPTATION";
  outcome: RiskAdaptationCertificationOutcome;
  certified_components: readonly string[];
  validation_areas: readonly RiskAdaptationCertificationArea[];
  failures: readonly RiskAdaptationCertificationFailure[];
  certification_tests: readonly RiskAdaptationCertificationTest[];
  evidence_package_ref: string;
  governance_approved: boolean;
  constitutional_compliant: boolean;
  simulation_validated: boolean;
  replay_validated: boolean;
  ledger_integrity_verified: boolean;
  dashboard_validated: boolean;
  operator_authority_preserved: boolean;
  advisory_only_enforced: boolean;
  production_safe: boolean;
  tenant_isolated: boolean;
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
  created_at: string;
}>;

export type RiskAdaptationCertificationValidation = Readonly<{
  validation_id: string;
  state: RiskAdaptationCertificationValidationState;
  certified: boolean;
  outcome: RiskAdaptationCertificationOutcome;
  failures: readonly RiskAdaptationCertificationFailure[];
  determinism_validated: boolean;
  evidence_complete: boolean;
  governance_compliant: boolean;
  constitutional_compliant: boolean;
  simulation_validated: boolean;
  ledger_validated: boolean;
  dashboard_validated: boolean;
  replay_complete: boolean;
  tenant_isolated: boolean;
  audit_ready: boolean;
  explainability_complete: boolean;
  advisory_only: boolean;
  production_safe: boolean;
  no_autonomous_learning: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type RiskAdaptationCertificationApiSurface = Readonly<{
  api_id: string;
  certify: "POST /risk-adaptation-certification-gate/certify";
  retrieve_record: "POST /risk-adaptation-certification-gate/record";
  retrieve_tests: "POST /risk-adaptation-certification-gate/tests";
  retrieve_evidence: "POST /risk-adaptation-certification-gate/evidence";
  retrieve_validation: "POST /risk-adaptation-certification-gate/validation";
  replay_certification: "POST /risk-adaptation-certification-gate/replay";
  retrieve_contract: "GET /risk-adaptation-certification-gate/contract";
  update_supported: false;
  delete_supported: false;
  production_mutation_supported: false;
  autonomous_learning_supported: false;
  governance_bypass_supported: false;
  integrity_hash: string;
}>;

export type RiskAdaptationCertificationInput = Readonly<{
  scenario?: RiskAdaptationCertificationScenario;
  foundation_result?: RiskAdaptationFoundationResult;
  actualization_result?: RiskActualizationResult;
  drift_result?: RiskDriftResult;
  severity_result?: RiskSeverityRecalibrationResult;
  pattern_result?: RiskPatternResult;
  ledger_result?: RiskAdaptationLedgerResult;
  governance_result?: GovernanceRiskResult;
  simulation_result?: RiskAdaptationSimulationResult;
  dashboard_result?: RiskAdaptationDashboardResult;
}>;

export type RiskAdaptationCertificationResult = Readonly<{
  risk_adaptation_certification_gate_version: "risk-adaptation-certification-gate/v1";
  api_surface: RiskAdaptationCertificationApiSurface;
  record: RiskAdaptationCertificationRecord;
  evidence_package: RiskAdaptationCertificationEvidencePackage;
  validation: RiskAdaptationCertificationValidation;
  deterministic: true;
  replayable: true;
  evidence_backed: boolean;
  governance_compliant: boolean;
  constitutional_compliant: boolean;
  advisory_only: true;
  production_safe: boolean;
  tenant_isolated: boolean;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RiskAdaptationCertificationFoundation = Readonly<{
  risk_adaptation_certification_gate_version: "risk-adaptation-certification-gate/v1";
  api_surface: RiskAdaptationCertificationApiSurface;
  result: RiskAdaptationCertificationResult;
}>;
