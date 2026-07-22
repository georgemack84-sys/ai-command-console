export type KnowledgeType = "PLANNING_TEMPLATE" | "EXECUTION_HEURISTIC" | "RECOVERY_TEMPLATE" | "CONFIDENCE_REFINEMENT" | "RECOMMENDATION_IMPROVEMENT";
export type KnowledgeCategory = "PLANNING" | "EXECUTION" | "RECOVERY" | "CONFIDENCE" | "RECOMMENDATION" | "GOVERNANCE_INSIGHT" | "OPERATIONAL_INSIGHT" | "RISK_INSIGHT" | "PERFORMANCE_INSIGHT" | "COORDINATION_INSIGHT";
export type KnowledgeLifecycleState = "CAPTURED" | "NORMALIZED" | "ANALYZED" | "VALIDATED" | "CERTIFIED" | "APPROVED" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED" | "REJECTED";
export type KnowledgeCertificationState = "UNCERTIFIED" | "CERTIFIED" | "REJECTED";
export type KnowledgeEvolutionScenario = "BASELINE" | "GOVERNANCE_BYPASS_ATTEMPTED" | "CONSTITUTIONAL_MODIFICATION_ATTEMPTED" | "AUTHORITY_ESCALATION_ATTEMPTED" | "REPLAY_MUTATION_ATTEMPTED" | "MISSION_HISTORY_REWRITE_ATTEMPTED" | "AUDIT_RECORD_DELETION_ATTEMPTED" | "CROSS_TENANT_CONTAMINATION_ATTEMPTED" | "ACTIVATION_WITHOUT_OPERATOR_APPROVAL" | "MUTABLE_VERSION_ATTEMPTED" | "MISSING_EVIDENCE_LINEAGE" | "INTEGRITY_FAILURE" | "HIDDEN_LEARNING_ARTIFACT";
export type KnowledgeEvolutionFailure = "GOVERNANCE_BYPASS_DETECTED" | "CONSTITUTIONAL_MODIFICATION_DETECTED" | "AUTHORITY_ESCALATION_DETECTED" | "REPLAY_MUTATION_DETECTED" | "MISSION_HISTORY_REWRITE_DETECTED" | "AUDIT_RECORD_DELETION_DETECTED" | "CROSS_TENANT_CONTAMINATION_DETECTED" | "OPERATOR_APPROVAL_MISSING" | "MUTABLE_VERSION_DETECTED" | "EVIDENCE_LINEAGE_MISSING" | "INTEGRITY_VERIFICATION_FAILED" | "HIDDEN_LEARNING_ARTIFACT_DETECTED";

export type KnowledgeIdentity = Readonly<{
  knowledge_id: string;
  knowledge_name: string;
  knowledge_type: KnowledgeType;
  knowledge_category: KnowledgeCategory;
  version: string;
  lifecycle_state: KnowledgeLifecycleState;
  certification_state: KnowledgeCertificationState;
}>;

export type MissionKnowledgeReferences = Readonly<{
  mission_id: string;
  execution_id: string;
  planning_id: string;
  replay_id: string;
  tenant_id: string;
  operator_session_id: string;
}>;

export type KnowledgeEvidenceChain = Readonly<{
  evidence_ids: readonly string[];
  evidence_hashes: readonly string[];
  evidence_lineage: readonly string[];
  evidence_quality: number;
  evidence_confidence: number;
}>;

export type KnowledgeGovernanceContract = Readonly<{
  governance_validation: "PASS" | "FAIL";
  constitutional_validation: "PASS" | "FAIL";
  authority_validation: "PASS" | "FAIL";
  replay_validation: "PASS" | "FAIL";
  integrity_validation: "PASS" | "FAIL";
  tenant_isolation: "PASS" | "FAIL";
  operator_approval_required: true;
}>;

export type KnowledgeActivationContract = Readonly<{
  approval_required: true;
  approval_reference: string | null;
  activation_timestamp: string | null;
  activation_state: "NOT_APPROVED" | "APPROVED_ONLY" | "ACTIVE" | "REJECTED";
  activation_authority: false;
  learning_execution_authorized: false;
}>;

export type KnowledgeVersioningContract = Readonly<{
  parent_version: string | null;
  child_versions: readonly string[];
  evolution_history: readonly KnowledgeLifecycleState[];
  replay_reference: string;
  immutable_version: boolean;
  append_only: true;
}>;

export type KnowledgeArtifactRecord = Readonly<{
  identity: KnowledgeIdentity;
  priority: "LOW" | "MEDIUM" | "HIGH";
  impact_level: "LOW" | "MODERATE" | "HIGH";
  origin: MissionKnowledgeReferences;
  knowledge_sources: readonly string[];
  evidence: KnowledgeEvidenceChain;
  governance: KnowledgeGovernanceContract;
  certification_timestamp: string | null;
  activation: KnowledgeActivationContract;
  lineage: KnowledgeVersioningContract;
  explainability: readonly string[];
  advisory_only: true;
  self_modification_allowed: false;
  historical_truth_mutable: false;
  integrity_hash: string;
}>;

export type KnowledgeEvolutionContract = Readonly<{
  contract_id: string;
  contract_version: "knowledge-evolution-contract/v8ALT.9.1";
  artifact_schema: KnowledgeArtifactRecord;
  lifecycle_model: readonly KnowledgeLifecycleState[];
  governance_rules: KnowledgeGovernanceContract;
  activation_contract: KnowledgeActivationContract;
  versioning_standard: KnowledgeVersioningContract;
  constitutional_restrictions: readonly string[];
  tenant_isolation_requirements: readonly string[];
  security_requirements: readonly string[];
  failures: readonly KnowledgeEvolutionFailure[];
  advisory_only: true;
  learning_execution_authorized: false;
  activation_authority: false;
  operator_approval_required: true;
  self_modification_allowed: false;
  final_state: "KNOWLEDGE_EVOLUTION_CONTRACT_DEFINED" | "KNOWLEDGE_EVOLUTION_CONTRACT_BLOCKED";
  integrity_hash: string;
}>;

export type KnowledgeEvolutionValidationResult = Readonly<{
  contract_id: string;
  valid: boolean;
  deterministic_schema_defined: boolean;
  lifecycle_immutable: boolean;
  evidence_lineage_complete: boolean;
  governance_enforced: boolean;
  constitutional_compliant: boolean;
  authority_preserved: boolean;
  replay_preserved: boolean;
  historical_truth_preserved: boolean;
  audit_records_preserved: boolean;
  tenant_isolated: boolean;
  operator_approval_required: true;
  advisory_only: true;
  learning_execution_authorization_absent: boolean;
  activation_authority_absent: boolean;
  self_modification_absent: boolean;
  fail_closed: boolean;
  failures: readonly KnowledgeEvolutionFailure[];
  validation_hash: string;
}>;

export type KnowledgeEvolutionObservabilitySurface = Readonly<{
  contract_id: string;
  final_state: string;
  lifecycle_state_count: number;
  failure_count: number;
  advisory_only: true;
  learning_execution_authorized: false;
  activation_authority: false;
  integrity_hash: string;
}>;

export type KnowledgeEvolutionInput = Readonly<{ scenario?: KnowledgeEvolutionScenario; contract?: KnowledgeEvolutionContract }>;

export type KnowledgeEvolutionContractBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "knowledge-evolution-contract/v8ALT.9.1";
    final_state: "KNOWLEDGE_EVOLUTION_CONTRACT_DEFINED";
    lifecycle: readonly KnowledgeLifecycleState[];
    knowledge_types: readonly KnowledgeType[];
    principles: readonly string[];
  }>;
  contract: KnowledgeEvolutionContract;
  validation: KnowledgeEvolutionValidationResult;
  observability: KnowledgeEvolutionObservabilitySurface;
}>;
