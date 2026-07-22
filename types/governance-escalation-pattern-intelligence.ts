import type { PatternScoringResult } from "@/types/pattern-confidence-strategic-scoring";

export type GovernancePatternType =
  | "RECURRING_POLICY_VIOLATION"
  | "GOVERNANCE_REVIEW_FAILURE"
  | "GOVERNANCE_OVERRIDE_PATTERN"
  | "AUTHORITY_CONFLICT"
  | "APPROVAL_AUTHORITY_CONFLICT"
  | "ESCALATION_AUTHORITY_CONFLICT"
  | "CONSTITUTIONAL_RISK"
  | "ADVISORY_BOUNDARY_RISK"
  | "REPLAY_GOVERNANCE_RISK"
  | "TENANT_BOUNDARY_RISK"
  | "CERTIFICATION_FAILURE_PATTERN"
  | "VALIDATION_FAILURE_PATTERN"
  | "REPLAY_FAILURE_PATTERN"
  | "INTEGRITY_FAILURE_PATTERN"
  | "APPROVAL_DELAY_PATTERN"
  | "GOVERNANCE_CONGESTION_PATTERN"
  | "REVIEW_BACKLOG_PATTERN"
  | "ESCALATION_QUEUE_PATTERN";

export type GovernanceEscalationLevel =
  | "LEVEL_1_INFORMATION"
  | "LEVEL_2_REVIEW"
  | "LEVEL_3_GOVERNANCE"
  | "LEVEL_4_CONSTITUTIONAL"
  | "LEVEL_5_EXECUTIVE_GOVERNANCE";

export type GovernanceEscalationState =
  | "SCORING_INPUT_VALIDATED"
  | "GOVERNANCE_PATTERN_DETECTED"
  | "CONSTITUTIONAL_ANALYZED"
  | "AUTHORITY_ANALYZED"
  | "CERTIFICATION_ANALYZED"
  | "ESCALATION_RECOMMENDED"
  | "REGISTERED"
  | "CERTIFIED"
  | "FAILED"
  | "PENDING_EVIDENCE";

export type GovernanceEscalationFailure =
  | "SCORED_PATTERN_MISSING"
  | "SCORING_INPUT_REJECTED"
  | "GOVERNANCE_LINEAGE_MISSING"
  | "CONSTITUTIONAL_REFERENCES_MISSING"
  | "AUTHORITY_REFERENCES_INCOMPLETE"
  | "CERTIFICATION_EVIDENCE_UNAVAILABLE"
  | "REPLAY_REFERENCES_INCOMPLETE"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_ISOLATION_VIOLATED"
  | "EXPLANATION_MISSING"
  | "ESCALATION_RULE_VERSION_UNAVAILABLE"
  | "REGISTRY_MUTATION_DETECTED"
  | "AUTONOMOUS_GOVERNANCE_ACTION_DETECTED"
  | "AUTHORITY_MUTATION_DETECTED"
  | "POLICY_MUTATION_DETECTED"
  | "NONDETERMINISTIC_ESCALATION_DETECTED"
  | "FAIL_OPEN_BEHAVIOR";

export type GovernanceEscalationScenario =
  | "BASELINE"
  | "GOVERNANCE_VIOLATION"
  | "AUTHORITY_CONFLICT"
  | "CONSTITUTIONAL_RISK"
  | "CERTIFICATION_FAILURE"
  | "APPROVAL_BOTTLENECK"
  | "MISSING_SCORING"
  | "REJECTED_SCORING"
  | "MISSING_GOVERNANCE_LINEAGE"
  | "MISSING_CONSTITUTIONAL_REFS"
  | "MISSING_AUTHORITY_REFS"
  | "MISSING_CERTIFICATION_EVIDENCE"
  | "MISSING_REPLAY"
  | "MISSING_RULE_VERSION"
  | "REPLAY_DIVERGENCE"
  | "HASH_MISMATCH"
  | "CROSS_TENANT"
  | "MISSING_EXPLANATION"
  | "REGISTRY_MUTATION"
  | "AUTONOMOUS_GOVERNANCE_ACTION"
  | "AUTHORITY_MUTATION"
  | "POLICY_MUTATION"
  | "NONDETERMINISTIC_ESCALATION"
  | "FAIL_OPEN";

export type GovernancePatternRecord = Readonly<{
  governance_pattern_id: string;
  pattern_id: string;
  tenant_id: string;
  mission_scope: string;
  governance_pattern_type: GovernancePatternType;
  governance_summary: string;
  constitutional_relevance: number;
  authority_relevance: number;
  certification_relevance: number;
  governance_severity: number;
  escalation_level: GovernanceEscalationLevel;
  escalation_rule_version: "governance-escalation-rule/v1";
  supporting_pattern_refs: readonly string[];
  supporting_governance_refs: readonly string[];
  supporting_authority_refs: readonly string[];
  supporting_certification_refs: readonly string[];
  supporting_replay_refs: readonly string[];
  escalation_required: boolean;
  recommended_governance_action: string;
  explanation: string;
  replay_refs: readonly string[];
  advisory_only: true;
  automatic_enforcement: false;
  modifies_policy: false;
  modifies_authority: false;
  modifies_certification: false;
  blocks_execution: false;
  integrity_hash: string;
}>;

export type GovernancePatternRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  governance_pattern_refs: readonly string[];
  pattern_refs: readonly string[];
  escalation_index: Readonly<Record<GovernanceEscalationLevel, readonly string[]>>;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type GovernanceEscalationValidation = Readonly<{
  validation_id: string;
  state: GovernanceEscalationState;
  certified: boolean;
  failures: readonly GovernanceEscalationFailure[];
  scoring_input_accepted: boolean;
  governance_lineage_complete: boolean;
  constitutional_references_complete: boolean;
  authority_references_complete: boolean;
  certification_evidence_available: boolean;
  replay_validated: boolean;
  escalation_rules_available: boolean;
  deterministic_escalation: boolean;
  explanations_complete: boolean;
  tenant_isolated: boolean;
  registry_immutable: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  no_governance_action: boolean;
  no_authority_mutation: boolean;
  no_policy_mutation: boolean;
  integrity_hash: string;
}>;

export type GovernanceEscalationApiSurface = Readonly<{
  api_id: string;
  analyze_governance_patterns: "POST /governance-escalation-pattern-intelligence/analyze";
  retrieve_governance_findings: "POST /governance-escalation-pattern-intelligence/governance";
  retrieve_constitutional_findings: "POST /governance-escalation-pattern-intelligence/constitutional";
  retrieve_authority_findings: "POST /governance-escalation-pattern-intelligence/authority";
  retrieve_certification_findings: "POST /governance-escalation-pattern-intelligence/certification";
  retrieve_escalation_recommendations: "POST /governance-escalation-pattern-intelligence/escalation";
  retrieve_registry: "POST /governance-escalation-pattern-intelligence/registry";
  replay_governance_analysis: "POST /governance-escalation-pattern-intelligence/replay";
  retrieve_contract: "GET /governance-escalation-pattern-intelligence/contract";
  update_supported: false;
  delete_supported: false;
  enforcement_supported: false;
  authority_mutation_supported: false;
  policy_mutation_supported: false;
  integrity_hash: string;
}>;

export type GovernanceEscalationInput = Readonly<{
  scoring_result?: PatternScoringResult;
  scenario?: GovernanceEscalationScenario;
}>;

export type GovernanceEscalationResult = Readonly<{
  governance_escalation_pattern_intelligence_version: "governance-escalation-pattern-intelligence/v1";
  scoring_result: PatternScoringResult;
  api_surface: GovernanceEscalationApiSurface;
  governance_pattern_records: readonly GovernancePatternRecord[];
  registry: GovernancePatternRegistry;
  validation: GovernanceEscalationValidation;
  deterministic: true;
  replayable: true;
  constitutionally_compliant: true;
  governance_traceable: true;
  operator_visible: true;
  tenant_isolated: true;
  advisory_only: true;
  automatic_enforcement: false;
  modifies_policy: false;
  modifies_authority: false;
  modifies_certification: false;
  blocks_execution: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type GovernanceEscalationFoundation = Readonly<{
  governance_escalation_pattern_intelligence_version: "governance-escalation-pattern-intelligence/v1";
  api_surface: GovernanceEscalationApiSurface;
  result: GovernanceEscalationResult;
}>;
