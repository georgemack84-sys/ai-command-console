export type AutonomyMaturityScope = "PLATFORM" | "MISSION" | "CAPABILITY" | "SERVICE" | "AGENT" | "RUNTIME" | "RECOVERY" | "GOVERNANCE" | "CONSTITUTIONAL" | "CERTIFICATION";
export type AutonomyMaturityAssessmentType = "INITIAL" | "SCHEDULED" | "CERTIFICATION" | "CONTINUOUS";
export type AutonomyMaturityDomain = "CONSTITUTIONAL_COMPLIANCE" | "GOVERNANCE_COMPLIANCE" | "AUTHORITY_ENFORCEMENT" | "PLANNING_INTELLIGENCE" | "EXECUTION_INTELLIGENCE" | "REPLAY_INTEGRITY" | "EXPLAINABILITY" | "RESILIENCE" | "VISIBILITY" | "CERTIFICATION_READINESS";
export type AutonomyMaturityLevel = "LEVEL_1_ASSISTED_EXECUTION" | "LEVEL_2_GUIDED_AUTONOMY" | "LEVEL_3_CONTROLLED_AUTONOMY" | "LEVEL_4_RESILIENT_AUTONOMY" | "LEVEL_5_CERTIFIED_CONSTITUTIONAL_AUTONOMY";
export type AutonomyMaturityScoreCategory = "INITIAL" | "EMERGING" | "DEVELOPING" | "MATURE" | "CERTIFIED";
export type AutonomyMaturityLifecycleState = "DEFINED" | "CONFIGURED" | "VALIDATING" | "ASSESSING" | "SCORING" | "REVIEWING" | "CERTIFIED" | "ARCHIVED";
export type AutonomyMaturityScenario = "BASELINE" | "INVALID_SCHEMA" | "UNDEFINED_MATURITY_LEVEL" | "INCONSISTENT_SCORING_RULES" | "MISSING_GOVERNANCE_RULES" | "MISSING_CONSTITUTIONAL_RULES" | "INCOMPLETE_LIFECYCLE" | "ABSENT_REPLAY_REFERENCES" | "MISSING_INTEGRITY_HASH" | "DETERMINISTIC_ORDERING_VIOLATION" | "TENANT_ISOLATION_VIOLATION" | "HIDDEN_SCORING_LOGIC" | "ADVISORY_ONLY_VIOLATION";
export type AutonomyMaturityFailure = "ASSESSMENT_SCHEMA_INVALID" | "MATURITY_LEVEL_UNDEFINED" | "SCORING_RULES_INCONSISTENT" | "GOVERNANCE_RULES_MISSING" | "CONSTITUTIONAL_RULES_MISSING" | "LIFECYCLE_INCOMPLETE" | "REPLAY_REFERENCES_ABSENT" | "INTEGRITY_HASH_MISSING" | "DETERMINISTIC_ORDERING_VIOLATED" | "TENANT_ISOLATION_VIOLATED" | "HIDDEN_SCORING_LOGIC_DETECTED" | "ADVISORY_ONLY_BEHAVIOR_VIOLATED";

export type AutonomyMaturityDomainDefinition = Readonly<{
  domain_id: string;
  domain: AutonomyMaturityDomain;
  measures: readonly string[];
  deterministic_evaluation_required: true;
  governance_required: true;
  constitutional_validation_required: true;
  replay_required: true;
  integrity_hash: string;
}>;

export type AutonomyMaturityLevelDefinition = Readonly<{
  level_id: string;
  level: AutonomyMaturityLevel;
  ordinal: 1 | 2 | 3 | 4 | 5;
  title: string;
  characteristics: readonly string[];
  advancement_criteria: readonly string[];
  integrity_hash: string;
}>;

export type AutonomyMaturityScoringRule = Readonly<{
  category: AutonomyMaturityScoreCategory;
  min_score: number;
  max_score: number;
  deterministic: true;
  evidence_based: true;
  replayable: true;
  governance_validated: true;
  constitutional_validated: true;
}>;

export type AutonomyMaturityLifecycleTransition = Readonly<{
  from: AutonomyMaturityLifecycleState;
  to: AutonomyMaturityLifecycleState;
  transition_order: number;
  replay_reference: string;
  lineage_reference: string;
  immutable_after_certification: boolean;
  integrity_hash: string;
}>;

export type AutonomyMaturityAssessmentRecord = Readonly<{
  assessment_id: string;
  assessment_version: "autonomy-maturity-assessment-contract/v8ALT.11.1";
  tenant_id: string;
  mission_id: string;
  assessment_scope: AutonomyMaturityScope;
  assessment_type: AutonomyMaturityAssessmentType;
  maturity_level: AutonomyMaturityLevel;
  maturity_score: number;
  readiness_score: number;
  assessment_state: AutonomyMaturityLifecycleState;
  evaluation_timestamp: "1970-01-01T00:00:00.000Z";
  evaluator: "autonomy-maturity-assessment-contract";
  governance_status: "PASS" | "FAIL";
  constitutional_status: "PASS" | "FAIL";
  replay_reference: string;
  lineage_reference: string;
  advisory_only: true;
  maturity_advancement_authorized: false;
  production_certification_authorized: false;
  authority_change_authorized: false;
  execution_behavior_change_authorized: false;
  integrity_hash: string;
}>;

export type AutonomyMaturityAssessmentSchema = Readonly<{
  schema_id: string;
  sections: readonly ("ASSESSMENT_METADATA" | "ASSESSMENT_CONFIGURATION" | "DOMAIN_RESULTS" | "OVERALL_RESULTS" | "EVIDENCE")[];
  required_fields: readonly string[];
  supported_scopes: readonly AutonomyMaturityScope[];
  supported_assessment_types: readonly AutonomyMaturityAssessmentType[];
  integrity_hash: string;
}>;

export type AutonomyMaturityRuleSet = Readonly<{
  governance_rules: readonly string[];
  constitutional_rules: readonly string[];
  deterministic_requirements: readonly string[];
  security_requirements: readonly string[];
  audit_requirements: readonly string[];
  integrity_hash: string;
}>;

export type AutonomyMaturityContractRepository = Readonly<{
  repository_id: string;
  final_state: "AUTONOMY_MATURITY_CONTRACT_READY" | "AUTONOMY_MATURITY_CONTRACT_INVALID";
  contract: AutonomyMaturityAssessmentRecord;
  schema: AutonomyMaturityAssessmentSchema;
  domains: readonly AutonomyMaturityDomainDefinition[];
  levels: readonly AutonomyMaturityLevelDefinition[];
  scoring: readonly AutonomyMaturityScoringRule[];
  lifecycle: readonly AutonomyMaturityLifecycleTransition[];
  rules: AutonomyMaturityRuleSet;
  failures: readonly AutonomyMaturityFailure[];
  advisory_only: true;
  maturity_advancement_authorized: false;
  production_certification_authorized: false;
  authority_change_authorized: false;
  execution_behavior_change_authorized: false;
  integrity_hash: string;
}>;

export type AutonomyMaturityContractValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  schema_valid: boolean;
  maturity_level_defined: boolean;
  scoring_consistent: boolean;
  governance_rules_present: boolean;
  constitutional_rules_present: boolean;
  lifecycle_complete: boolean;
  replay_references_present: boolean;
  integrity_verified: boolean;
  deterministic_ordering: boolean;
  tenant_isolated: boolean;
  no_hidden_scoring_logic: boolean;
  advisory_only: true;
  no_maturity_advancement_authority: boolean;
  failures: readonly AutonomyMaturityFailure[];
  validation_hash: string;
}>;

export type AutonomyMaturityContractObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  domain_count: number;
  level_count: number;
  scoring_rule_count: number;
  lifecycle_transition_count: number;
  failure_count: number;
  advisory_only: true;
  maturity_advancement_authorized: false;
  integrity_hash: string;
}>;

export type AutonomyMaturityContractInput = Readonly<{ scenario?: AutonomyMaturityScenario; repository?: AutonomyMaturityContractRepository }>;

export type AutonomyMaturityContractBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "autonomy-maturity-assessment-contract/v8ALT.11.1";
    final_state: "AUTONOMY_MATURITY_CONTRACT_SPECIFIED";
    domains: readonly AutonomyMaturityDomain[];
    levels: readonly AutonomyMaturityLevel[];
    principles: readonly string[];
  }>;
  repository: AutonomyMaturityContractRepository;
  validation: AutonomyMaturityContractValidationResult;
  observability: AutonomyMaturityContractObservabilitySurface;
}>;
