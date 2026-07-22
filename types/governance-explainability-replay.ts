import type { AdaptivePolicyConflictDetectorResult } from "@/types/adaptive-policy-conflict-detector";
import type { AuthorityBoundaryValidatorResult } from "@/types/authority-boundary-validator";
import type { ConstitutionalAdaptationValidatorResult } from "@/types/constitutional-adaptation-validator";
import type { EscalationRestrictionEngineResult, EscalationRestrictionScenario } from "@/types/escalation-restriction-engine";
import type { EvidenceCertificationValidatorResult } from "@/types/evidence-certification-validator";
import type { GovernanceAdaptationLedgerResult } from "@/types/governance-adaptation-ledger";
import type { GovernanceAdaptationValidatorResult } from "@/types/governance-adaptation-validator";
import type { RiskAdaptationFoundationResult, RiskAdaptationScenario } from "@/types/risk-adaptation-engine-foundation";
import type { TenantIsolationValidatorResult } from "@/types/tenant-isolation-validator";

export type GovernanceExplainabilityReplayState =
  | "APPROVED_FOR_SIMULATION"
  | "REQUIRES_OPERATOR_REVIEW"
  | "REQUIRES_GOVERNANCE_REVIEW"
  | "REQUIRES_CONSTITUTIONAL_REVIEW"
  | "RESTRICTED"
  | "REJECTED"
  | "FAIL_CLOSED";

export type GovernanceExplainabilityReplayFailure =
  | "GOVERNANCE_EVIDENCE_MISSING"
  | "CONSTITUTIONAL_IMPLICATIONS_UNKNOWN"
  | "REPLAY_CAPABILITY_MISSING"
  | "AUTHORITY_IMPACT_UNCLEAR"
  | "TENANT_BOUNDARY_RISK_EXISTS"
  | "PROHIBITED_DOMAIN_AFFECTED"
  | "OPERATOR_VISIBILITY_REDUCED"
  | "AUDITABILITY_WEAKENED"
  | "HISTORICAL_TRUTH_MUTATED"
  | "EXECUTION_BEHAVIOR_CHANGED_WITHOUT_APPROVAL"
  | "GOVERNANCE_LINEAGE_INCOMPLETE"
  | "CONSTITUTIONAL_VALIDATION_NONDETERMINISTIC"
  | "APPROVAL_REQUIREMENTS_UNRESOLVED"
  | "ROLLBACK_PATH_UNAVAILABLE"
  | "EVIDENCE_INTEGRITY_FAILED"
  | "GOVERNANCE_LEDGER_INTEGRITY_FAILED"
  | "DETERMINISTIC_REPLAY_DIVERGED"
  | "CERTIFICATION_DEPENDENCIES_UNRESOLVED"
  | "GOVERNANCE_EXPLANATION_GENERATION_FAILED"
  | "EVIDENCE_ATTRIBUTION_INCOMPLETE"
  | "REPLAY_METADATA_INCONSISTENT"
  | "INTEGRITY_VERIFICATION_FAILED";

export type GovernanceExplainabilityReplayScenario =
  | RiskAdaptationScenario
  | EscalationRestrictionScenario
  | "BASELINE"
  | "APPROVED_FOR_SIMULATION"
  | "REQUIRES_OPERATOR_REVIEW"
  | "REQUIRES_GOVERNANCE_REVIEW"
  | "REQUIRES_CONSTITUTIONAL_REVIEW"
  | "RESTRICTED"
  | "REJECTED"
  | "MISSING_GOVERNANCE_EVIDENCE"
  | "UNKNOWN_CONSTITUTIONAL_IMPLICATIONS"
  | "MISSING_REPLAY_CAPABILITY"
  | "UNCLEAR_AUTHORITY_IMPACT"
  | "TENANT_BOUNDARY_RISK"
  | "PROHIBITED_DOMAIN"
  | "OPERATOR_VISIBILITY_REDUCTION"
  | "AUDITABILITY_WEAKENED"
  | "HISTORICAL_TRUTH_MUTATION"
  | "EXECUTION_CHANGE_WITHOUT_APPROVAL"
  | "INCOMPLETE_GOVERNANCE_LINEAGE"
  | "NONDETERMINISTIC_CONSTITUTIONAL_VALIDATION"
  | "UNRESOLVED_APPROVAL_REQUIREMENTS"
  | "ROLLBACK_UNAVAILABLE"
  | "EVIDENCE_INTEGRITY_FAILURE"
  | "LEDGER_INTEGRITY_FAILURE"
  | "REPLAY_DIVERGENCE"
  | "UNRESOLVED_CERTIFICATION_DEPENDENCIES"
  | "EXPLANATION_GENERATION_FAILURE"
  | "INCOMPLETE_EVIDENCE_ATTRIBUTION"
  | "INCONSISTENT_REPLAY_METADATA"
  | "HASH_MISMATCH";

export type GovernanceAdaptationValidation = Readonly<{
  validation_id: string;
  tenant_id: string;
  proposal_id: string;
  adaptation_type: string;
  governance_status: string;
  constitutional_status: string;
  authority_status: string;
  tenant_isolation_status: string;
  replay_status: "BYTE_IDENTICAL" | "DIVERGED" | "UNAVAILABLE";
  evidence_status: string;
  certification_status: string;
  approval_requirements: readonly string[];
  violations: readonly string[];
  restrictions: readonly string[];
  required_escalations: readonly string[];
  final_validation_state: GovernanceExplainabilityReplayState;
  integrity_hash: string;
}>;

export type GovernanceEvidenceAttribution = Readonly<{
  attribution_id: string;
  conclusion_ref: string;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  evidence_quality: string;
  sufficient: boolean;
  integrity_hash: string;
}>;

export type GovernanceReplayTraceStep = Readonly<{
  step_id: string;
  step_name: string;
  input_hash: string;
  output_hash: string;
  byte_identical: boolean;
  integrity_hash: string;
}>;

export type GovernanceReplayVerificationReport = Readonly<{
  report_id: string;
  replay_status: "BYTE_IDENTICAL" | "DIVERGED" | "UNAVAILABLE";
  validation_sequence_match: boolean;
  policy_evaluation_match: boolean;
  rule_execution_match: boolean;
  violation_match: boolean;
  escalation_match: boolean;
  restriction_match: boolean;
  evidence_attribution_match: boolean;
  final_decision_match: boolean;
  integrity_hashes_match: boolean;
  failures: readonly GovernanceExplainabilityReplayFailure[];
  integrity_hash: string;
}>;

export type GovernanceExplainabilityLedgerEntry = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  proposal_id: string;
  validation_id: string;
  final_validation_state: GovernanceExplainabilityReplayState;
  explanation_refs: readonly string[];
  replay_report_id: string;
  validation_timestamp: string;
  append_only: true;
  immutable: true;
  replayable: boolean;
  integrity_hash: string;
}>;

export type GovernanceExplainabilityReplayApiSurface = Readonly<{
  api_id: string;
  explain_governance: "POST /governance-explainability-replay/explain";
  retrieve_validation: "POST /governance-explainability-replay/validation";
  retrieve_policy_attribution: "POST /governance-explainability-replay/policy-attribution";
  retrieve_constitutional_reasoning: "POST /governance-explainability-replay/constitutional-reasoning";
  retrieve_authority_explanation: "POST /governance-explainability-replay/authority-explanation";
  retrieve_evidence_attribution: "POST /governance-explainability-replay/evidence-attribution";
  retrieve_escalation_restriction: "POST /governance-explainability-replay/escalation-restriction";
  retrieve_replay_trace: "POST /governance-explainability-replay/replay-trace";
  retrieve_replay_verification: "POST /governance-explainability-replay/replay-verification";
  retrieve_ledger: "POST /governance-explainability-replay/ledger";
  replay_explanation: "POST /governance-explainability-replay/replay";
  retrieve_contract: "GET /governance-explainability-replay/contract";
  new_governance_decisions_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  byte_identical_replay_required: true;
  integrity_hash: string;
}>;

export type GovernanceExplainabilityReplayInput = Readonly<{
  scenario?: GovernanceExplainabilityReplayScenario;
  adaptation_result?: RiskAdaptationFoundationResult;
  governance_result?: GovernanceAdaptationValidatorResult;
  constitutional_result?: ConstitutionalAdaptationValidatorResult;
  authority_result?: AuthorityBoundaryValidatorResult;
  tenant_result?: TenantIsolationValidatorResult;
  conflict_result?: AdaptivePolicyConflictDetectorResult;
  ledger_result?: GovernanceAdaptationLedgerResult;
  evidence_result?: EvidenceCertificationValidatorResult;
  escalation_result?: EscalationRestrictionEngineResult;
}>;

export type GovernanceExplainabilityReplayResult = Readonly<{
  governance_explainability_replay_version: "governance-explainability-replay/v1";
  api_surface: GovernanceExplainabilityReplayApiSurface;
  validation: GovernanceAdaptationValidation;
  governance_explainability_report: readonly string[];
  governance_decision_narrative: readonly string[];
  policy_attribution_report: readonly string[];
  constitutional_reasoning_report: readonly string[];
  authority_validation_explanation: readonly string[];
  evidence_attribution_graph: readonly GovernanceEvidenceAttribution[];
  restriction_explanation_report: readonly string[];
  escalation_explanation_report: readonly string[];
  governance_replay_trace: readonly GovernanceReplayTraceStep[];
  deterministic_replay_verification_report: GovernanceReplayVerificationReport;
  replay_metadata: readonly string[];
  failures: readonly GovernanceExplainabilityReplayFailure[];
  ledger_entry: GovernanceExplainabilityLedgerEntry;
  final_validation_state: GovernanceExplainabilityReplayState;
  fully_explainable: boolean;
  byte_identical: boolean;
  fail_closed: boolean;
  tenant_isolated: boolean;
  audit_ready: boolean;
  replayable: boolean;
  advisory_only: true;
  immutable: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type GovernanceExplainabilityReplayFoundation = Readonly<{
  governance_explainability_replay_version: "governance-explainability-replay/v1";
  api_surface: GovernanceExplainabilityReplayApiSurface;
  result: GovernanceExplainabilityReplayResult;
}>;
