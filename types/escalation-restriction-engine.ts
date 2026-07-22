import type { AdaptivePolicyConflictDetectorResult } from "@/types/adaptive-policy-conflict-detector";
import type { AuthorityBoundaryValidatorResult } from "@/types/authority-boundary-validator";
import type { ConstitutionalAdaptationValidatorResult } from "@/types/constitutional-adaptation-validator";
import type { EvidenceCertificationValidatorResult, EvidenceCertificationScenario } from "@/types/evidence-certification-validator";
import type { GovernanceAdaptationLedgerResult } from "@/types/governance-adaptation-ledger";
import type { GovernanceAdaptationValidatorResult } from "@/types/governance-adaptation-validator";
import type { RiskAdaptationFoundationResult, RiskAdaptationScenario } from "@/types/risk-adaptation-engine-foundation";
import type { TenantIsolationValidatorResult } from "@/types/tenant-isolation-validator";

export type EscalationRestrictionDecisionState =
  | "APPROVED_FOR_SIMULATION"
  | "OPERATOR_REVIEW_REQUIRED"
  | "GOVERNANCE_REVIEW_REQUIRED"
  | "CONSTITUTIONAL_REVIEW_REQUIRED"
  | "MULTI_LEVEL_REVIEW_REQUIRED"
  | "RESTRICTED"
  | "REJECTED"
  | "FAIL_CLOSED";

export type EscalationCategory =
  | "CONSTITUTIONAL"
  | "GOVERNANCE"
  | "AUTHORITY"
  | "OPERATOR"
  | "AUDIT"
  | "REPLAY"
  | "EVIDENCE"
  | "CERTIFICATION"
  | "COMPLIANCE"
  | "RISK"
  | "TENANT_ISOLATION"
  | "SECURITY"
  | "PRIVACY"
  | "TRUST"
  | "DOCUMENTATION"
  | "ROLLBACK"
  | "SIMULATION"
  | "PRODUCTION_READINESS"
  | "OPERATIONAL_IMPACT"
  | "EXECUTIVE_OVERSIGHT";

export type RestrictionType =
  | "ADVISORY_ONLY"
  | "SIMULATION_ONLY"
  | "ADDITIONAL_APPROVALS_REQUIRED"
  | "RESTRICTED_DOMAIN"
  | "TEMPORARY_RESTRICTION"
  | "PERMANENT_RESTRICTION"
  | "PROHIBITED";

export type EscalationRestrictionFailure =
  | "ESCALATION_RULES_UNEVALUABLE"
  | "REVIEW_AUTHORITY_UNDETERMINED"
  | "MANDATORY_REVIEWER_ASSIGNMENT_AMBIGUOUS"
  | "CONSTITUTIONAL_IMPACT_UNRESOLVED"
  | "GOVERNANCE_MODIFICATION_WITHOUT_APPROVAL"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "POLICY_CONFLICTS_UNRESOLVED"
  | "AUDIT_DEGRADATION_UNMITIGATED"
  | "REPLAY_DEGRADATION_UNRESOLVED"
  | "TENANT_ISOLATION_RISK_UNRESOLVED"
  | "OPERATOR_VISIBILITY_REDUCED"
  | "RESTRICTION_ENFORCEMENT_FAILED"
  | "REVIEW_WORKFLOW_NONDETERMINISTIC"
  | "NONDETERMINISTIC_VALIDATION_REASONING"
  | "REPLAY_DIVERGENCE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "ESCALATION_DECISION_RECORDING_FAILED";

export type EscalationRestrictionScenario =
  | RiskAdaptationScenario
  | EvidenceCertificationScenario
  | "BASELINE"
  | "APPROVED_FOR_SIMULATION"
  | "OPERATOR_REVIEW_REQUIRED"
  | "GOVERNANCE_REVIEW_REQUIRED"
  | "CONSTITUTIONAL_REVIEW_REQUIRED"
  | "MULTI_LEVEL_REVIEW_REQUIRED"
  | "RESTRICTED"
  | "REJECTED"
  | "RULE_EVALUATION_FAILURE"
  | "AUTHORITY_UNDETERMINED"
  | "AMBIGUOUS_REVIEWERS"
  | "UNRESOLVED_CONSTITUTIONAL_IMPACT"
  | "GOVERNANCE_MODIFICATION_WITHOUT_APPROVAL"
  | "AUTHORITY_EXPANSION"
  | "AUTHORITY_EXPANSION_ATTEMPT"
  | "UNRESOLVED_POLICY_CONFLICTS"
  | "POLICY_CONTRADICTION"
  | "AUDIT_DEGRADATION"
  | "REPLAY_DEGRADATION"
  | "TENANT_RISK"
  | "OPERATOR_VISIBILITY_REDUCTION"
  | "RESTRICTION_ENFORCEMENT_FAILURE"
  | "NONDETERMINISTIC_WORKFLOW"
  | "NONDETERMINISTIC_REASONING"
  | "REPLAY_DIVERGENCE"
  | "HASH_MISMATCH"
  | "RECORDING_FAILURE";

export type ValidationContextSummary = Readonly<{
  context_id: string;
  governance_status: string;
  constitutional_status: string;
  authority_status: string;
  tenant_status: string;
  policy_conflict_status: string;
  evidence_certification_status: string;
  replay_ready: boolean;
  audit_ready: boolean;
  dependency_graph: readonly string[];
  complete: boolean;
  integrity_hash: string;
}>;

export type EscalationTrigger = Readonly<{
  trigger_id: string;
  category: EscalationCategory;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  mandatory: boolean;
  rationale: string;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type EscalationRestriction = Readonly<{
  restriction_id: string;
  restriction_type: RestrictionType;
  category: EscalationCategory;
  active: boolean;
  rationale: string;
  release_condition: string;
  integrity_hash: string;
}>;

export type ReviewerAssignment = Readonly<{
  reviewer_id: string;
  reviewer_role: string;
  category: EscalationCategory;
  primary: boolean;
  sequence: number;
  required: boolean;
  integrity_hash: string;
}>;

export type ReviewWorkflowStep = Readonly<{
  step_id: string;
  step_name: string;
  reviewer_role: string;
  depends_on: readonly string[];
  blocking: boolean;
  integrity_hash: string;
}>;

export type EscalationRestrictionLedgerEntry = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  proposal_id: string;
  decision_id: string;
  final_decision: EscalationRestrictionDecisionState;
  escalation_triggers: readonly string[];
  restrictions: readonly string[];
  required_reviewers: readonly string[];
  validation_timestamp: string;
  append_only: true;
  immutable: true;
  replayable: boolean;
  integrity_hash: string;
}>;

export type EscalationRestrictionDecision = Readonly<{
  decision_id: string;
  tenant_id: string;
  proposal_id: string;
  validation_summary: ValidationContextSummary;
  escalation_triggers: readonly EscalationTrigger[];
  escalation_level: "NONE" | "OPERATOR" | "GOVERNANCE" | "CONSTITUTIONAL" | "MULTI_LEVEL" | "EXECUTIVE" | "FAIL_CLOSED";
  required_reviewers: readonly ReviewerAssignment[];
  review_workflow: readonly ReviewWorkflowStep[];
  restrictions: readonly EscalationRestriction[];
  review_dependencies: readonly string[];
  approval_requirements: readonly string[];
  simulation_authorization: "AUTHORIZED_FOR_SIMULATION" | "DENIED" | "PENDING_REVIEW";
  final_decision: EscalationRestrictionDecisionState;
  decision_reasoning: readonly string[];
  supporting_evidence: readonly string[];
  replay_reference: string;
  validation_timestamp: string;
  integrity_hash: string;
}>;

export type EscalationRestrictionApiSurface = Readonly<{
  api_id: string;
  determine_escalation: "POST /escalation-restriction-engine/determine";
  retrieve_context: "POST /escalation-restriction-engine/context";
  retrieve_triggers: "POST /escalation-restriction-engine/triggers";
  retrieve_restrictions: "POST /escalation-restriction-engine/restrictions";
  retrieve_workflow: "POST /escalation-restriction-engine/workflow";
  retrieve_reviewers: "POST /escalation-restriction-engine/reviewers";
  retrieve_enforcement: "POST /escalation-restriction-engine/enforcement";
  retrieve_ledger: "POST /escalation-restriction-engine/ledger";
  replay_decision: "POST /escalation-restriction-engine/replay";
  retrieve_contract: "GET /escalation-restriction-engine/contract";
  execution_authorization_supported: false;
  governance_override_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type EscalationRestrictionEngineInput = Readonly<{
  scenario?: EscalationRestrictionScenario;
  adaptation_result?: RiskAdaptationFoundationResult;
  governance_result?: GovernanceAdaptationValidatorResult;
  constitutional_result?: ConstitutionalAdaptationValidatorResult;
  authority_result?: AuthorityBoundaryValidatorResult;
  tenant_result?: TenantIsolationValidatorResult;
  conflict_result?: AdaptivePolicyConflictDetectorResult;
  ledger_result?: GovernanceAdaptationLedgerResult;
  evidence_result?: EvidenceCertificationValidatorResult;
}>;

export type EscalationRestrictionEngineResult = Readonly<{
  escalation_restriction_engine_version: "escalation-restriction-engine/v1";
  api_surface: EscalationRestrictionApiSurface;
  decision: EscalationRestrictionDecision;
  escalation_decision_report: readonly string[];
  escalation_trigger_analysis: readonly string[];
  restriction_assessment: readonly string[];
  review_workflow_specification: readonly string[];
  reviewer_assignment_matrix: readonly string[];
  escalation_hierarchy: readonly string[];
  approval_requirements_report: readonly string[];
  simulation_authorization_decision: "AUTHORIZED_FOR_SIMULATION" | "DENIED" | "PENDING_REVIEW";
  restriction_enforcement_report: readonly string[];
  failures: readonly EscalationRestrictionFailure[];
  ledger_entry: EscalationRestrictionLedgerEntry;
  final_decision: EscalationRestrictionDecisionState;
  fail_closed: boolean;
  tenant_isolated: boolean;
  audit_ready: boolean;
  replayable: boolean;
  advisory_only: true;
  human_controlled: true;
  least_authority: true;
  immutable: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type EscalationRestrictionEngineFoundation = Readonly<{
  escalation_restriction_engine_version: "escalation-restriction-engine/v1";
  api_surface: EscalationRestrictionApiSurface;
  result: EscalationRestrictionEngineResult;
}>;
