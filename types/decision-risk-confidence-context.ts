import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionContext, DecisionContextDomain } from "@/types/decision-context-contract";
import type { EvidenceDependencyContextPackage } from "@/types/decision-evidence-dependency-context";
import type { MissionTenantContextPackage } from "@/types/decision-mission-tenant-context";
import type { AuthorityOperatorContextPackage } from "@/types/decision-authority-operator-context";

export type RiskSeverity = "Critical" | "High" | "Moderate" | "Low" | "Informational";
export type MitigationState = "AVAILABLE" | "COMPLETED" | "PENDING" | "FAILED" | "NOT_REQUIRED" | "UNKNOWN";
export type ConfidenceLevel = "Very High" | "High" | "Moderate" | "Low" | "Very Low";

export type RiskConfidenceResolutionState =
  | "PENDING"
  | "RISK_REGISTRY_RESOLVED"
  | "ACTIVE_RISKS_RESOLVED"
  | "RESIDUAL_RISKS_RESOLVED"
  | "EMERGING_RISKS_RESOLVED"
  | "MITIGATIONS_RESOLVED"
  | "SEVERITY_RESOLVED"
  | "EXPOSURE_ANALYZED"
  | "RISK_VALIDATED"
  | "CONFIDENCE_SOURCES_RESOLVED"
  | "CALIBRATION_APPLIED"
  | "UNCERTAINTY_ANALYZED"
  | "CONFIDENCE_VALIDATED"
  | "PASSED"
  | "FAILED_RISK"
  | "FAILED_CONFIDENCE"
  | "FAILED_ISOLATION"
  | "FAILED_INTEGRITY";

export type RiskConfidenceFailureReason =
  | "ACTIVE_RISKS_UNRESOLVED"
  | "RISK_EVIDENCE_UNAVAILABLE"
  | "SEVERITY_UNCALCULABLE"
  | "MITIGATION_STATUS_UNKNOWN"
  | "EXPOSURE_UNCALCULABLE"
  | "CONFIDENCE_SOURCES_INCOMPLETE"
  | "CALIBRATION_MODEL_UNAVAILABLE"
  | "UNCERTAINTY_ANALYSIS_INCOMPLETE"
  | "HISTORICAL_LINEAGE_MISSING"
  | "REPLAY_INCOMPATIBLE"
  | "CROSS_TENANT_RISK_REFERENCE"
  | "INTEGRITY_VERIFICATION_FAILED";

export type RiskRecord = Readonly<{
  risk_id: string;
  tenant_id: string;
  mission_id: string;
  risk_type: "MISSION" | "OPERATIONAL" | "RUNTIME" | "GOVERNANCE" | "CONSTITUTIONAL" | "SECURITY" | "DEPENDENCY" | "RECOVERY" | "FORECAST";
  risk_description: string;
  likelihood: number;
  impact: number;
  exposure: number;
  severity: RiskSeverity;
  evidence_refs: readonly string[];
  mitigation_ref: string;
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type MitigationStatusRecord = Readonly<{
  risk_id: string;
  mitigation_state: MitigationState;
  mitigation_effectiveness: number;
  recovery_linkage: string;
  integrity_hash: string;
}>;

export type RiskExplainability = Readonly<{
  supporting_evidence: readonly string[];
  risk_rationale: string;
  severity_reasoning: string;
  mitigation_rationale: string;
  governance_influence: readonly string[];
  constitutional_influence: readonly string[];
  validation_outcomes: readonly string[];
  replay_references: readonly string[];
  integrity_hash: string;
}>;

export type ConfidenceCalibration = Readonly<{
  calibration_model: "decision-confidence-calibration/v1";
  calibration_inputs: readonly string[];
  baseline_confidence: number;
  calibrated_confidence: number;
  adjustments: readonly string[];
  calibration_lineage: readonly string[];
  integrity_hash: string;
}>;

export type UncertaintyAnalysis = Readonly<{
  evidence_uncertainty: readonly string[];
  data_gaps: readonly string[];
  model_limitations: readonly string[];
  dependency_uncertainty: readonly string[];
  operational_variability: readonly string[];
  forecast_uncertainty: readonly string[];
  uncertainty_score: number;
  integrity_hash: string;
}>;

export type ConfidenceExplainability = Readonly<{
  confidence_calculation: string;
  calibration_adjustments: readonly string[];
  uncertainty_factors: readonly string[];
  governance_influence: readonly string[];
  constitutional_influence: readonly string[];
  validation_outcomes: readonly string[];
  replay_references: readonly string[];
  integrity_hash: string;
}>;

export type RiskContext = Readonly<{
  risk_context_id: string;
  decision_candidate_id: string;
  active_risks: readonly RiskRecord[];
  residual_risks: readonly RiskRecord[];
  emerging_risks: readonly RiskRecord[];
  mitigated_risks: readonly RiskRecord[];
  mitigation_status: readonly MitigationStatusRecord[];
  risk_severity: RiskSeverity;
  risk_exposure: number;
  operational_impact: string;
  risk_lineage: readonly string[];
  validation_state: RiskConfidenceResolutionState;
  explainability: RiskExplainability;
  integrity_hash: string;
}>;

export type ConfidenceContext = Readonly<{
  confidence_context_id: string;
  decision_candidate_id: string;
  confidence_level: ConfidenceLevel;
  confidence_sources: readonly string[];
  confidence_calibration: ConfidenceCalibration;
  uncertainty_analysis: UncertaintyAnalysis;
  confidence_lineage: readonly string[];
  confidence_history: readonly string[];
  validation_state: RiskConfidenceResolutionState;
  explainability: ConfidenceExplainability;
  integrity_hash: string;
}>;

export type RiskConfidenceContextRequest = Readonly<{
  resolution_id: string;
  candidate: DecisionCandidate;
  base_context?: DecisionContext;
  evidence_dependency_package?: EvidenceDependencyContextPackage;
  mission_tenant_package?: MissionTenantContextPackage;
  authority_operator_package?: AuthorityOperatorContextPackage;
  resolver_version: "risk-confidence-context-resolver/v1";
}>;

export type RiskConfidenceValidationResult = Readonly<{
  validation_status: "PASS" | "FAIL";
  validation_state: RiskConfidenceResolutionState;
  failure_reason?: RiskConfidenceFailureReason;
  failure_reasons: readonly RiskConfidenceFailureReason[];
  checks: Readonly<{
    active_risks_identified: boolean;
    risk_evidence_available: boolean;
    severity_reproducible: boolean;
    mitigation_status_verified: boolean;
    exposure_calculated: boolean;
    confidence_sources_complete: boolean;
    calibration_deterministic: boolean;
    uncertainty_documented: boolean;
    historical_lineage_preserved: boolean;
    replay_compatible: boolean;
    tenant_isolated: boolean;
    integrity_verified: boolean;
  }>;
}>;

export type RiskConfidenceContextPackage = Readonly<{
  resolution_id: string;
  candidate_id: string;
  risk_context: RiskContext;
  confidence_context: ConfidenceContext;
  risk_domain: DecisionContextDomain;
  confidence_domain: DecisionContextDomain;
  validation: RiskConfidenceValidationResult;
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type RiskConfidenceReplayResult = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  resolution_id: string;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_state: RiskConfidenceResolutionState;
  failures: readonly RiskConfidenceFailureReason[];
  integrity_hash: string;
}>;

export type RiskConfidenceObservability = Readonly<{
  resolution_attempts: number;
  successful_resolutions: number;
  failed_resolutions: number;
  risk_failures: number;
  confidence_failures: number;
  isolation_failures: number;
  integrity_failures: number;
  average_risk_exposure: number;
  average_calibrated_confidence: number;
  replay_success_rate: number;
}>;
