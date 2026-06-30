import type { AutonomyCertificationComponent } from "@/types/autonomy-certification-contract";
import type { SecurityGovernanceValidationReport } from "@/types/security-governance-validation-engine";

export type ReplayIntegrityCertificationState = "REGISTERED" | "REPLAY_PREPARATION" | "REPLAY_RECONSTRUCTION" | "TIMELINE_VALIDATION" | "DECISION_VALIDATION" | "INTEGRITY_VALIDATION" | "HASH_CHAIN_VALIDATION" | "LINEAGE_VALIDATION" | "EVIDENCE_VALIDATION" | "VISIBILITY_VALIDATION" | "TENANT_VALIDATION" | "ASSESSMENT" | "COMPLETE";
export type ReplayIntegrityDomain = "REPLAY" | "TIMELINE" | "PLANNING" | "EXECUTION" | "DELEGATION" | "SUPERVISION" | "GOVERNANCE" | "INTEGRITY" | "HASH_CHAIN" | "LINEAGE" | "EVIDENCE" | "VISIBILITY" | "TENANT";
export type ReplayIntegrityStatus = "PASS" | "FAIL";
export type ReplayIntegrityRisk = "NONE" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ReplayIntegrityScenario =
  | "BASELINE"
  | "REPLAY_RECONSTRUCTION_FAILS"
  | "REPLAY_MISMATCH"
  | "PLANNING_REPLAY_DIVERGES"
  | "EXECUTION_REPLAY_DIVERGES"
  | "DELEGATION_REPLAY_DIVERGES"
  | "SUPERVISION_REPLAY_DIVERGES"
  | "GOVERNANCE_REPLAY_DIVERGES"
  | "INTEGRITY_VERIFICATION_FAILS"
  | "HASH_MISMATCH"
  | "HASH_CHAIN_BROKEN"
  | "LINEAGE_BREAK"
  | "REPLAY_REFERENCES_MISSING"
  | "IMMUTABLE_IDENTIFIER_MISMATCH"
  | "EVIDENCE_CORRUPTION"
  | "HIDDEN_EXECUTION_HISTORY"
  | "HISTORICAL_TRUTH_MODIFIED"
  | "REPLAY_VISUALIZATION_INCONSISTENT"
  | "TENANT_ISOLATION_VIOLATED"
  | "CROSS_TENANT_REPLAY"
  | "FAIL_OPEN_REPLAY_BEHAVIOR";

export type ReplayIntegrityFailure =
  | "REPLAY_RECONSTRUCTION_FAILED"
  | "REPLAY_MISMATCH_DETECTED"
  | "PLANNING_REPLAY_DIVERGENCE_DETECTED"
  | "EXECUTION_REPLAY_DIVERGENCE_DETECTED"
  | "DELEGATION_REPLAY_DIVERGENCE_DETECTED"
  | "SUPERVISION_REPLAY_DIVERGENCE_DETECTED"
  | "GOVERNANCE_REPLAY_DIVERGENCE_DETECTED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "HASH_MISMATCH_DETECTED"
  | "HASH_CHAIN_BROKEN"
  | "LINEAGE_BREAK_DETECTED"
  | "REPLAY_REFERENCE_MISSING"
  | "IMMUTABLE_IDENTIFIER_MISMATCH"
  | "EVIDENCE_CORRUPTION_DETECTED"
  | "HIDDEN_EXECUTION_HISTORY_DETECTED"
  | "HISTORICAL_TRUTH_MODIFIED"
  | "REPLAY_VISUALIZATION_INCONSISTENT"
  | "TENANT_ISOLATION_VIOLATED"
  | "CROSS_TENANT_REPLAY_DETECTED"
  | "FAIL_OPEN_REPLAY_BEHAVIOR_DETECTED";

export type ReplayIntegrityDomainResult = Readonly<{
  result_id: string;
  domain: ReplayIntegrityDomain;
  status: ReplayIntegrityStatus;
  score: number;
  detected_failure: ReplayIntegrityFailure | null;
  risk: ReplayIntegrityRisk;
  explanation: string;
  evidence_refs: readonly string[];
  result_hash: string;
}>;

export type ReplayIntegrityEvidence = Readonly<{
  evidence_id: string;
  domain: ReplayIntegrityDomain;
  tenant_id: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  immutable_identifier: string;
  hash_chain_reference: string;
  evidence_reference: string;
  evidence_hash: string;
}>;

export type ReplayIntegrityCertificationReport = Readonly<{
  certification_id: string;
  engine_version: "replay-integrity-certification-engine/v8K.4";
  tenant_id: string;
  mission_id: string;
  component: AutonomyCertificationComponent;
  certification_scope: readonly AutonomyCertificationComponent[];
  replay_validation: ReplayIntegrityDomainResult;
  timeline_validation: ReplayIntegrityDomainResult;
  planning_validation: ReplayIntegrityDomainResult;
  execution_validation: ReplayIntegrityDomainResult;
  delegation_validation: ReplayIntegrityDomainResult;
  supervision_validation: ReplayIntegrityDomainResult;
  governance_validation: ReplayIntegrityDomainResult;
  integrity_validation: ReplayIntegrityDomainResult;
  hash_validation: ReplayIntegrityDomainResult;
  lineage_validation: ReplayIntegrityDomainResult;
  evidence_validation: ReplayIntegrityDomainResult;
  visibility_validation: ReplayIntegrityDomainResult;
  tenant_validation: ReplayIntegrityDomainResult;
  replay_score: number;
  integrity_score: number;
  overall_score: number;
  detected_failures: readonly ReplayIntegrityFailure[];
  detected_risks: readonly string[];
  recommendations: readonly string[];
  operator_required: boolean;
  certification_state: ReplayIntegrityCertificationState;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  evidence: readonly ReplayIntegrityEvidence[];
  security_governance_validation: SecurityGovernanceValidationReport;
  certification_timestamp: string;
  metadata: Readonly<Record<string, string>>;
  report_hash: string;
}>;

export type ReplayIntegrityCertificationInput = Readonly<{
  scenario?: ReplayIntegrityScenario;
  component?: AutonomyCertificationComponent;
}>;

export type ReplayIntegrityCertificationValidationResult = Readonly<{
  certification_id: string | null;
  valid: boolean;
  report_hash_valid: boolean;
  evidence_complete: boolean;
  failures: readonly ReplayIntegrityFailure[];
  validation_hash: string;
}>;

export type ReplayIntegrityCertificationObservabilitySurface = Readonly<{
  certification_id: string;
  certification_state: ReplayIntegrityCertificationState;
  replay_score: number;
  integrity_score: number;
  overall_score: number;
  failures: readonly ReplayIntegrityFailure[];
  risks: readonly string[];
  operator_required: boolean;
  evidence_records: number;
  report_hash: string;
}>;
