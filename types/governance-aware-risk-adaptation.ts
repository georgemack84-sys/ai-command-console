import type { RiskAdaptationFoundationResult } from "@/types/risk-adaptation-engine-foundation";
import type { RiskAdaptationLedgerResult } from "@/types/risk-adaptation-ledger";

export type GovernanceRiskStatus = "COMPLIANT" | "REQUIRES_REVIEW" | "NON_COMPLIANT";
export type GovernanceRiskDecision = "APPROVED_FOR_SIMULATION" | "GOVERNANCE_REVIEW_REQUIRED" | "CONSTITUTIONAL_REVIEW_REQUIRED" | "COMPLIANCE_REVIEW_REQUIRED" | "TRUST_REVIEW_REQUIRED" | "ESCALATED" | "REJECTED";
export type GovernanceRiskValidationState = "CERTIFIED" | "FAILED" | "PENDING_REPLAY" | "REJECTED";

export type GovernanceRiskFailure =
  | "CONSTITUTIONAL_COMPLIANCE_MISSING"
  | "GOVERNANCE_COMPLIANCE_MISSING"
  | "AUTHORITY_VALIDATION_MISSING"
  | "COMPLIANCE_ASSESSMENT_MISSING"
  | "TRUST_ASSESSMENT_MISSING"
  | "ESCALATION_EVALUATION_MISSING"
  | "CERTIFICATION_ASSESSMENT_MISSING"
  | "SUPPORTING_EVIDENCE_MISSING"
  | "DETERMINISTIC_DECISION_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "LINEAGE_REFERENCES_MISSING"
  | "TENANT_ISOLATION_VIOLATED"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "INTEGRITY_HASH_MISMATCH"
  | "CONSTITUTIONAL_PROTECTION_WEAKENING_DETECTED"
  | "GOVERNANCE_OVERSIGHT_REDUCTION_DETECTED"
  | "OPERATOR_AUTHORITY_OVERRIDE_DETECTED"
  | "APPROVAL_BYPASS_DETECTED"
  | "CONSTITUTIONAL_RISK_SUPPRESSION_DETECTED"
  | "GOVERNANCE_POLICY_MUTATION_DETECTED"
  | "CERTIFICATION_STATUS_MUTATION_DETECTED"
  | "COMPLIANCE_POLICY_MUTATION_DETECTED"
  | "HISTORICAL_EVIDENCE_REWRITE_DETECTED"
  | "PRODUCTION_DEPLOYMENT_APPROVAL_DETECTED"
  | "PRODUCTION_RISK_MODEL_MUTATION_DETECTED"
  | "NONDETERMINISTIC_GOVERNANCE_DECISION"
  | "FAIL_OPEN_BEHAVIOR";

export type GovernanceRiskScenario =
  | "BASELINE"
  | "APPROVED_FOR_SIMULATION"
  | "GOVERNANCE_REVIEW"
  | "CONSTITUTIONAL_REVIEW"
  | "COMPLIANCE_REVIEW"
  | "TRUST_REVIEW"
  | "ESCALATED"
  | "REJECTED"
  | "CRITICAL_SEVERITY"
  | "AUTHORITY_BOUNDARY"
  | "ENTERPRISE_IMPACT"
  | "MISSING_CONSTITUTIONAL"
  | "MISSING_GOVERNANCE"
  | "MISSING_AUTHORITY"
  | "MISSING_COMPLIANCE"
  | "MISSING_TRUST"
  | "MISSING_ESCALATION"
  | "MISSING_CERTIFICATION"
  | "MISSING_EVIDENCE"
  | "MISSING_DECISION"
  | "MISSING_REPLAY"
  | "BROKEN_LINEAGE"
  | "CROSS_TENANT"
  | "REPLAY_DIVERGENCE"
  | "HASH_MISMATCH"
  | "WEAKEN_CONSTITUTION"
  | "REDUCE_GOVERNANCE"
  | "OPERATOR_OVERRIDE"
  | "APPROVAL_BYPASS"
  | "CONSTITUTIONAL_SUPPRESSION"
  | "GOVERNANCE_POLICY_MUTATION"
  | "CERTIFICATION_MUTATION"
  | "COMPLIANCE_POLICY_MUTATION"
  | "EVIDENCE_REWRITE"
  | "PRODUCTION_APPROVAL"
  | "PRODUCTION_MUTATION"
  | "NONDETERMINISTIC"
  | "FAIL_OPEN";

export type GovernanceRiskAdaptationRecord = Readonly<{
  governance_review_id: string;
  adaptation_id: string;
  tenant_id: string;
  mission_scope: string;
  constitutional_status: GovernanceRiskStatus;
  governance_status: GovernanceRiskStatus;
  authority_status: GovernanceRiskStatus;
  compliance_status: GovernanceRiskStatus;
  trust_status: GovernanceRiskStatus;
  escalation_status: GovernanceRiskStatus;
  certification_status: GovernanceRiskStatus;
  required_actions: readonly string[];
  supporting_evidence_refs: readonly string[];
  governance_decision: GovernanceRiskDecision;
  decision_rationale: string;
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
  created_at: string;
  advisory_only: true;
  authorizes_production_deployment: false;
  mutates_production_risk_models: false;
  weakens_constitutional_protections: false;
  reduces_governance_oversight: false;
  overrides_operator_authority: false;
  bypasses_required_approvals: false;
  suppresses_constitutional_risk: false;
  changes_governance_policy: false;
  modifies_certification_status: false;
  changes_compliance_policy: false;
  rewrites_historical_evidence: false;
}>;

export type GovernanceRiskImpactReport = Readonly<{
  report_id: string;
  governance_review_id: string;
  constitutional_impact: string;
  governance_impact: string;
  authority_impact: string;
  compliance_impact: string;
  trust_impact: string;
  certification_impact: string;
  escalation_required: boolean;
  escalation_reasons: readonly string[];
  integrity_hash: string;
}>;

export type GovernanceRiskDecisionLedger = Readonly<{
  ledger_id: string;
  tenant_id: string;
  governance_review_refs: readonly string[];
  decision_index: Readonly<Record<GovernanceRiskDecision, readonly string[]>>;
  required_action_refs: readonly string[];
  replay_refs: readonly string[];
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type GovernanceRiskValidation = Readonly<{
  validation_id: string;
  state: GovernanceRiskValidationState;
  certified: boolean;
  failures: readonly GovernanceRiskFailure[];
  constitutional_complete: boolean;
  governance_complete: boolean;
  authority_complete: boolean;
  compliance_complete: boolean;
  trust_complete: boolean;
  escalation_complete: boolean;
  certification_complete: boolean;
  evidence_complete: boolean;
  deterministic_decision_complete: boolean;
  replay_complete: boolean;
  lineage_complete: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  no_production_approval: boolean;
  no_production_mutation: boolean;
  no_constitutional_weakening: boolean;
  no_governance_reduction: boolean;
  no_operator_override: boolean;
  no_approval_bypass: boolean;
  no_constitutional_suppression: boolean;
  no_policy_mutation: boolean;
  no_certification_mutation: boolean;
  no_evidence_rewrite: boolean;
  deterministic: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type GovernanceRiskApiSurface = Readonly<{
  api_id: string;
  evaluate_governance: "POST /governance-aware-risk-adaptation/evaluate";
  retrieve_records: "POST /governance-aware-risk-adaptation/records";
  retrieve_impact: "POST /governance-aware-risk-adaptation/impact";
  retrieve_decision: "POST /governance-aware-risk-adaptation/decision";
  retrieve_ledger: "POST /governance-aware-risk-adaptation/ledger";
  retrieve_validation: "POST /governance-aware-risk-adaptation/validation";
  replay_evaluation: "POST /governance-aware-risk-adaptation/replay";
  retrieve_contract: "GET /governance-aware-risk-adaptation/contract";
  update_supported: false;
  delete_supported: false;
  production_deployment_approval_supported: false;
  production_risk_mutation_supported: false;
  governance_policy_mutation_supported: false;
  certification_mutation_supported: false;
  integrity_hash: string;
}>;

export type GovernanceRiskInput = Readonly<{
  scenario?: GovernanceRiskScenario;
  foundation_result?: RiskAdaptationFoundationResult;
  ledger_result?: RiskAdaptationLedgerResult;
}>;

export type GovernanceRiskResult = Readonly<{
  governance_aware_risk_adaptation_version: "governance-aware-risk-adaptation/v1";
  api_surface: GovernanceRiskApiSurface;
  records: readonly GovernanceRiskAdaptationRecord[];
  impact_report: GovernanceRiskImpactReport;
  decision_ledger: GovernanceRiskDecisionLedger;
  validation: GovernanceRiskValidation;
  deterministic: true;
  replayable: true;
  explainable: boolean;
  evidence_backed: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  authorizes_production_deployment: false;
  mutates_production_risk_models: false;
  changes_governance_policy: false;
  modifies_certification_status: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type GovernanceRiskFoundation = Readonly<{
  governance_aware_risk_adaptation_version: "governance-aware-risk-adaptation/v1";
  api_surface: GovernanceRiskApiSurface;
  result: GovernanceRiskResult;
}>;
