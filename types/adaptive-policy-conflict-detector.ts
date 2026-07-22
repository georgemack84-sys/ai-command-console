import type { AuthorityBoundaryValidatorResult } from "@/types/authority-boundary-validator";
import type { ConstitutionalAdaptationValidatorResult } from "@/types/constitutional-adaptation-validator";
import type { GovernanceAdaptationValidatorResult } from "@/types/governance-adaptation-validator";
import type { RiskAdaptationFoundationResult, RiskAdaptationScenario } from "@/types/risk-adaptation-engine-foundation";
import type { TenantIsolationValidatorResult } from "@/types/tenant-isolation-validator";

export type AdaptivePolicyConflictCategory =
  | "GOVERNANCE_POLICY"
  | "CONSTITUTIONAL_PRINCIPLE"
  | "APPROVAL_WORKFLOW"
  | "AUTHORITY_BOUNDARY"
  | "CERTIFICATION_REQUIREMENT"
  | "AUDIT_REQUIREMENT"
  | "REPLAY_REQUIREMENT"
  | "EVIDENCE_REQUIREMENT"
  | "ROLLBACK_REQUIREMENT"
  | "COMPLIANCE_OBLIGATION"
  | "TENANT_ISOLATION"
  | "SECURITY_POLICY"
  | "OPERATIONAL_POLICY"
  | "TRUST_POLICY"
  | "LIFECYCLE_POLICY"
  | "SIMULATION_POLICY"
  | "DOCUMENTATION_POLICY"
  | "REPORTING_POLICY"
  | "DATA_GOVERNANCE"
  | "RISK_GOVERNANCE";

export type AdaptivePolicyConflictSeverity = "INFORMATIONAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "BLOCKING" | "FAIL_CLOSED";
export type AdaptivePolicyConflictState =
  | "NO_CONFLICT"
  | "RESOLUTION_AVAILABLE"
  | "REQUIRES_OPERATOR_REVIEW"
  | "REQUIRES_GOVERNANCE_REVIEW"
  | "REQUIRES_CONSTITUTIONAL_REVIEW"
  | "REQUIRES_MULTI_STAGE_REVIEW"
  | "BLOCKED"
  | "FAIL_CLOSED";

export type AdaptivePolicyConflictFailure =
  | "POLICY_PRECEDENCE_UNRESOLVED"
  | "IRRECONCILABLE_GOVERNANCE_CONSTITUTIONAL_CONFLICT"
  | "MUTUALLY_EXCLUSIVE_APPROVALS"
  | "UNRESOLVED_CONSTITUTIONAL_CONFLICT"
  | "BLOCKING_CERTIFICATION_CONFLICT"
  | "UNAUTHORIZED_AUTHORITY_EXPANSION_CONFLICT"
  | "AUDIT_INTEGRITY_UNMAINTAINABLE"
  | "REPLAY_DETERMINISM_UNGUARANTEED"
  | "CONTRADICTORY_OR_INSUFFICIENT_EVIDENCE"
  | "ROLLBACK_UNAVAILABLE"
  | "COMPLIANCE_UNSATISFIED"
  | "NONDETERMINISTIC_CONFLICT_REASONING"
  | "CONFLICT_LINEAGE_INCOMPLETE"
  | "REPLAY_DIVERGENCE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "CONFLICT_DECISION_RECORDING_FAILED";

export type AdaptivePolicyConflictScenario =
  | RiskAdaptationScenario
  | "BASELINE"
  | "POLICY_CONTRADICTION"
  | "APPROVAL_CONFLICT"
  | "CONSTITUTIONAL_CONFLICT"
  | "CERTIFICATION_CONFLICT"
  | "AUTHORITY_CONFLICT"
  | "AUDIT_CONFLICT"
  | "REPLAY_CONFLICT"
  | "EVIDENCE_CONFLICT"
  | "ROLLBACK_CONFLICT"
  | "COMPLIANCE_CONFLICT"
  | "TENANT_CONFLICT"
  | "SECURITY_CONFLICT"
  | "RESOLUTION_AVAILABLE"
  | "OPERATOR_REVIEW"
  | "GOVERNANCE_REVIEW"
  | "CONSTITUTIONAL_REVIEW"
  | "MULTI_STAGE_REVIEW"
  | "POLICY_PRECEDENCE_FAILURE"
  | "IRRECONCILABLE_POLICY"
  | "MUTUALLY_EXCLUSIVE_APPROVALS"
  | "CERTIFICATION_BLOCKED"
  | "AUTHORITY_EXPANSION"
  | "AUDIT_UNMAINTAINABLE"
  | "REPLAY_UNGUARANTEED"
  | "CONTRADICTORY_EVIDENCE"
  | "ROLLBACK_UNAVAILABLE"
  | "COMPLIANCE_UNSATISFIED"
  | "NONDETERMINISTIC"
  | "LINEAGE_INCOMPLETE"
  | "REPLAY_DIVERGENCE"
  | "HASH_MISMATCH"
  | "LEDGER_FAILURE";

export type PolicyEvaluationRecord = Readonly<{
  policy_id: string;
  category: AdaptivePolicyConflictCategory;
  applicable: boolean;
  precedence: number;
  satisfied: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type AdaptivePolicyConflict = Readonly<{
  conflict_ref: string;
  category: AdaptivePolicyConflictCategory;
  severity: AdaptivePolicyConflictSeverity;
  policies: readonly string[];
  explanation: string;
  resolvable: boolean;
  failure?: AdaptivePolicyConflictFailure;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConflictResolutionStep = Readonly<{
  step_id: string;
  sequence: number;
  action: string;
  required: boolean;
  dependency_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConflictReviewerAssignment = Readonly<{
  reviewer_id: string;
  reviewer_role: string;
  sequence: number;
  required_for: AdaptivePolicyConflictCategory;
  integrity_hash: string;
}>;

export type AdaptivePolicyConflictLedgerEntry = Readonly<{
  ledger_entry_id: string;
  conflict_id: string;
  proposal_id: string;
  tenant_id: string;
  final_status: AdaptivePolicyConflictState;
  append_only: true;
  immutable: true;
  replayable: true;
  tenant_isolated: boolean;
  recorded_at: string;
  integrity_hash: string;
}>;

export type AdaptivePolicyConflictAnalysis = Readonly<{
  conflict_id: string;
  tenant_id: string;
  proposal_id: string;
  evaluated_policies: readonly PolicyEvaluationRecord[];
  detected_conflicts: readonly AdaptivePolicyConflict[];
  conflict_categories: readonly AdaptivePolicyConflictCategory[];
  severity_levels: readonly AdaptivePolicyConflictSeverity[];
  constitutional_impact: AdaptivePolicyConflictSeverity;
  governance_impact: AdaptivePolicyConflictSeverity;
  authority_impact: AdaptivePolicyConflictSeverity;
  certification_impact: AdaptivePolicyConflictSeverity;
  replay_impact: AdaptivePolicyConflictSeverity;
  audit_impact: AdaptivePolicyConflictSeverity;
  evidence_impact: AdaptivePolicyConflictSeverity;
  rollback_impact: AdaptivePolicyConflictSeverity;
  compliance_impact: AdaptivePolicyConflictSeverity;
  resolution_path: readonly ConflictResolutionStep[];
  required_reviewers: readonly ConflictReviewerAssignment[];
  conflict_status: AdaptivePolicyConflictState;
  conflict_reasoning: readonly string[];
  failures: readonly AdaptivePolicyConflictFailure[];
  supporting_evidence: readonly string[];
  replay_reference: string;
  validation_timestamp: string;
  integrity_hash: string;
}>;

export type AdaptivePolicyConflictApiSurface = Readonly<{
  api_id: string;
  analyze_conflicts: "POST /adaptive-policy-conflict-detector/analyze";
  retrieve_policies: "POST /adaptive-policy-conflict-detector/policies";
  retrieve_conflicts: "POST /adaptive-policy-conflict-detector/conflicts";
  retrieve_severity: "POST /adaptive-policy-conflict-detector/severity";
  retrieve_resolution: "POST /adaptive-policy-conflict-detector/resolution";
  retrieve_reviewers: "POST /adaptive-policy-conflict-detector/reviewers";
  retrieve_ledger: "POST /adaptive-policy-conflict-detector/ledger";
  replay_analysis: "POST /adaptive-policy-conflict-detector/replay";
  retrieve_contract: "GET /adaptive-policy-conflict-detector/contract";
  governance_override_supported: false;
  conflict_auto_resolution_supported: false;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type AdaptivePolicyConflictDetectorInput = Readonly<{
  scenario?: AdaptivePolicyConflictScenario;
  adaptation_result?: RiskAdaptationFoundationResult;
  governance_result?: GovernanceAdaptationValidatorResult;
  constitutional_result?: ConstitutionalAdaptationValidatorResult;
  authority_result?: AuthorityBoundaryValidatorResult;
  tenant_result?: TenantIsolationValidatorResult;
}>;

export type AdaptivePolicyConflictDetectorResult = Readonly<{
  adaptive_policy_conflict_detector_version: "adaptive-policy-conflict-detector/v1";
  api_surface: AdaptivePolicyConflictApiSurface;
  analysis: AdaptivePolicyConflictAnalysis;
  ledger_entry: AdaptivePolicyConflictLedgerEntry;
  deterministic: true;
  replayable: true;
  explainable: true;
  evidence_backed: boolean;
  advisory_only: true;
  human_governed: true;
  conflict_transparent: true;
  fail_closed: boolean;
  tenant_isolated: boolean;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptivePolicyConflictDetectorFoundation = Readonly<{
  adaptive_policy_conflict_detector_version: "adaptive-policy-conflict-detector/v1";
  api_surface: AdaptivePolicyConflictApiSurface;
  result: AdaptivePolicyConflictDetectorResult;
}>;
