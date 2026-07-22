export type CafConstitutionalFoundationDecision = "CONSTITUTION_APPROVED" | "APPROVED_WITH_OBSERVATIONS" | "CONDITIONALLY_APPROVED" | "NOT_APPROVED" | "FAIL_CLOSED";
export type CafConstitutionalFoundationFailure =
  | "WAVE_1_PLATFORM_OPERATIONS_INVALID"
  | "W1_8_CAF_RUNTIME_INVALID"
  | "CONSTITUTION_MISSING"
  | "CONSTITUTION_INCOMPLETE"
  | "CONSTITUTION_INCONSISTENT"
  | "CONSTITUTIONAL_OWNERSHIP_UNCLEAR"
  | "AGENT_DOCTRINE_MISSING"
  | "DOCTRINE_CONFLICTS_WITH_CONSTITUTION"
  | "AUTHORITY_MODEL_MISSING"
  | "AUTHORITY_PRECEDENCE_INVALID"
  | "OPERATOR_SUPREMACY_NOT_ENFORCED"
  | "RUNTIME_INVARIANTS_MISSING"
  | "DETERMINISTIC_REPLAY_NOT_GUARANTEED"
  | "IMMUTABLE_EVIDENCE_NOT_REQUIRED"
  | "AUTHORITY_VERIFICATION_NOT_REQUIRED"
  | "POLICY_VALIDATION_NOT_REQUIRED"
  | "SAFETY_VALIDATION_NOT_REQUIRED"
  | "TENANT_ISOLATION_NOT_GUARANTEED"
  | "CAF_VOCABULARY_MISSING"
  | "TERMINOLOGY_NOT_UNIQUE"
  | "CAF_CCI_CONTRACTS_MISSING"
  | "CCI_COMPATIBILITY_FAILED"
  | "CAF_CATA_CONTRACTS_MISSING"
  | "CATA_COMPATIBILITY_FAILED"
  | "CATA_AVAILABILITY_CONTRACT_MISSING"
  | "CATA_FAIL_CLOSED_BEHAVIOR_UNDEFINED"
  | "TENANT_INTEGRATION_CONTRACT_MISSING"
  | "TENANT_BOUNDARIES_UNCLEAR"
  | "CAF_ARCHITECTURE_MISSING"
  | "SERVICE_BOUNDARY_MODEL_MISSING"
  | "CONSTITUTIONAL_REVIEW_NOT_APPROVED"
  | "GOVERNANCE_EVIDENCE_MISSING"
  | "GOVERNANCE_EVIDENCE_NOT_IMMUTABLE";
export type CafConstitutionalFoundationScenario = "BASELINE" | "APPROVED_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | CafConstitutionalFoundationFailure;
export type CafConstitutionalFoundationInput = Readonly<{ scenario?: CafConstitutionalFoundationScenario; seed?: string }>;
export type CafConstitution = Readonly<{ constitution_id: string; constitutional_authority: boolean; hierarchy: boolean; obligations: boolean; prohibitions: boolean; guarantees: boolean; compliance_model: boolean; amendment_process: boolean; governance_model: boolean; integrity_hash: string }>;
export type AgentDoctrine = Readonly<{ doctrine_id: string; mission_first: boolean; advisory_only: boolean; operator_supremacy: boolean; constitutional_obedience: boolean; deterministic_behavior: boolean; evidence_first_execution: boolean; tenant_isolation: boolean; fail_closed_operation: boolean; explainability: boolean; bounded_autonomy: boolean; integrity_hash: string }>;
export type CafAuthorityModel = Readonly<{ authority_id: string; precedence: readonly string[]; operator_authority: boolean; governance_policy: boolean; safety_policy: boolean; runtime_subordination: boolean; agent_execution_subordination: boolean; authority_resolution: boolean; ownership_validation: boolean; integrity_hash: string }>;
export type RuntimeInvariantRegistry = Readonly<{ registry_id: string; invariants: readonly string[]; deterministic_execution: boolean; deterministic_replay: boolean; immutable_evidence: boolean; immutable_audit_lineage: boolean; authority_before_execution: boolean; policy_before_execution: boolean; safety_before_execution: boolean; tenant_isolation: boolean; namespace_isolation: boolean; signed_decisions: boolean; replay_reproducibility: boolean; integrity_hash: string }>;
export type CafVocabulary = Readonly<{ registry_id: string; terms: readonly string[]; canonical_naming: boolean; terminology_unique: boolean; cross_program_consistency: boolean; registry_complete: boolean; integrity_hash: string }>;
export type CafCciContracts = Readonly<{ contract_id: string; identity_contract: boolean; authorization_contract: boolean; registry_contract: boolean; storage_contract: boolean; messaging_contract: boolean; configuration_contract: boolean; observability_contract: boolean; security_contract: boolean; audit_contract: boolean; replay_contract: boolean; compatibility_validated: boolean; integrity_hash: string }>;
export type CafCataContracts = Readonly<{ contract_id: string; trust_evaluation_contract: boolean; alignment_contract: boolean; confidence_contract: boolean; risk_contract: boolean; human_oversight_contract: boolean; recovery_contract: boolean; drift_contract: boolean; certification_contract: boolean; compatibility_validated: boolean; integrity_hash: string }>;
export type CataAvailabilityContract = Readonly<{ contract_id: string; availability_modes: readonly string[]; degraded_advisory_modes: boolean; unavailable_behavior: boolean; disconnected_behavior: boolean; recovering_behavior: boolean; mandatory_fail_closed: boolean; operating_capability_matrix: boolean; integrity_hash: string }>;
export type TenantIntegrationContract = Readonly<{ contract_id: string; tenant_boundaries: boolean; namespace_ownership: boolean; identity_ownership: boolean; authority_delegation: boolean; tenant_customization: boolean; policy_inheritance: boolean; evidence_ownership: boolean; lifecycle: boolean; isolation_guarantees: boolean; integrity_hash: string }>;
export type CafArchitectureFoundation = Readonly<{ architecture_id: string; caf_architecture: boolean; service_boundary_model: boolean; runtime_ownership_model: boolean; capability_boundary_model: boolean; integration_architecture: boolean; service_ownership_finalized: boolean; platform_boundaries_approved: boolean; integrity_hash: string }>;
export type ConstitutionalGovernanceEvidence = Readonly<{ ledger_id: string; records: readonly string[]; constitutional_approval_record: boolean; governance_evidence_package: boolean; qualification_evidence: boolean; review_evidence: boolean; integration_evidence: boolean; immutable: boolean; integrity_hash: string }>;
export type CafConstitutionalFoundationReadiness = Readonly<{ readiness_id: string; decision: CafConstitutionalFoundationDecision; phase_ready: boolean; wave1_ready: boolean; caf_runtime_ready: boolean; constitution_ready: boolean; doctrine_ready: boolean; authority_ready: boolean; invariants_ready: boolean; vocabulary_ready: boolean; cci_contracts_ready: boolean; cata_contracts_ready: boolean; cata_availability_ready: boolean; tenant_contract_ready: boolean; architecture_ready: boolean; review_approved: boolean; evidence_ready: boolean; failures: readonly CafConstitutionalFoundationFailure[]; integrity_hash: string }>;
export type CafConstitutionalFoundationResult = Readonly<{ phase_version: "caf-constitutional-foundation/w2.0"; phase_identifier: "CafConstitutionalFoundation"; platform_operations_ref: "platform-operations/w1.9"; caf_runtime_ref: "caf-legion-runtime/w1.8"; constitution: CafConstitution; doctrine: AgentDoctrine; authority_model: CafAuthorityModel; invariants: RuntimeInvariantRegistry; vocabulary: CafVocabulary; cci_contracts: CafCciContracts; cata_contracts: CafCataContracts; cata_availability: CataAvailabilityContract; tenant_integration: TenantIntegrationContract; architecture: CafArchitectureFoundation; evidence: ConstitutionalGovernanceEvidence; readiness: CafConstitutionalFoundationReadiness; replay_hash: string; integrity_hash: string }>;
export type CafConstitutionalFoundationValidation = Readonly<{ valid: boolean; decision: CafConstitutionalFoundationDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; constitution_valid: boolean; doctrine_valid: boolean; authority_valid: boolean; invariants_valid: boolean; vocabulary_valid: boolean; cci_contracts_valid: boolean; cata_contracts_valid: boolean; availability_valid: boolean; tenant_contract_valid: boolean; architecture_valid: boolean; evidence_valid: boolean; readiness_valid: boolean; failures: readonly CafConstitutionalFoundationFailure[]; integrity_hash: string }>;
export type CafConstitutionalFoundationBundle = Readonly<{ doctrine: Readonly<{ version: "caf-constitutional-foundation/w2.0"; owns_caf_constitution: true; owns_agent_doctrine: true; owns_authority_model: true; owns_runtime_invariants: true; owns_caf_vocabulary: true; owns_cci_contracts: true; owns_cata_contracts: true; owns_cata_availability_contract: true; owns_tenant_integration_contract: true; owns_constitutional_evidence: true; enables_wave_2: true }>; result: CafConstitutionalFoundationResult; validation: CafConstitutionalFoundationValidation }>;
