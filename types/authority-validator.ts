export type AuthorityValidatorDecision = "AUTHORITY_VALIDATOR_OPERATIONAL" | "CONDITIONALLY_OPERATIONAL" | "NOT_OPERATIONAL" | "FAIL_CLOSED";
export type AuthorityDisposition = "AUTHORIZED" | "AUTHORIZED_WITH_RESTRICTIONS" | "DELEGATED" | "DENIED" | "REQUIRES_OPERATOR" | "REQUIRES_POLICY" | "REQUIRES_CERTIFICATION" | "SUSPENDED" | "REVOKED" | "UNKNOWN";
export type AuthorityProfileKind = "Agent" | "Operator" | "Tenant" | "Organization" | "Runtime" | "Service" | "Workflow" | "Capability" | "Skill" | "Administrative";
export type DelegationKind = "Temporary" | "Permanent" | "Scoped" | "Conditional" | "Hierarchical" | "Tenant" | "Workflow" | "Runtime";
export type AuthorityValidatorFailure =
  | "W2_0_CAF_CONSTITUTION_INVALID"
  | "W2_1_AGENT_REGISTRY_INVALID"
  | "W2_2_LIFECYCLE_ENGINE_INVALID"
  | "W2_3_CAPABILITY_REGISTRY_INVALID"
  | "W2_4_SKILL_REGISTRY_INVALID"
  | "AUTHORITY_PROFILES_MISSING"
  | "AUTHORITY_PROFILE_SCOPE_INVALID"
  | "AUTHORITY_PROFILE_OWNERSHIP_AMBIGUOUS"
  | "AUTHORITY_PROFILE_CERTIFICATION_MISSING"
  | "DELEGATION_ENGINE_MISSING"
  | "UNSCOPED_DELEGATION_ALLOWED"
  | "EXPIRED_DELEGATION_ALLOWED"
  | "REVOKED_DELEGATION_ALLOWED"
  | "DELEGATION_EVIDENCE_MISSING"
  | "AUTHORITY_EVALUATION_ENGINE_MISSING"
  | "AUTHORITY_DECISION_NON_DETERMINISTIC"
  | "AUTHORITY_CONFLICT_UNRESOLVED"
  | "TENANT_BOUNDARY_BYPASSED"
  | "NAMESPACE_VALIDATION_FAILED"
  | "LIFECYCLE_VALIDATION_FAILED"
  | "CERTIFICATION_VALIDATION_FAILED"
  | "RESTRICTION_MODEL_MISSING"
  | "RESTRICTIONS_NOT_ENFORCED"
  | "POLICY_PREREQUISITES_SKIPPED"
  | "SAFETY_PREREQUISITES_SKIPPED"
  | "DISPOSITION_MAPPING_MISSING"
  | "UNKNOWN_DISPOSITION_ALLOWED"
  | "AUTHORITY_REGISTRY_MISSING"
  | "AUTHORITY_API_MISSING"
  | "DELEGATION_API_MISSING"
  | "RESTRICTION_API_MISSING"
  | "DECISION_API_MISSING"
  | "ENFORCEMENT_SEQUENCE_INVALID"
  | "AUTHORITY_EVIDENCE_MISSING"
  | "AUTHORITY_EVIDENCE_NOT_IMMUTABLE"
  | "AUTHORITY_REPLAY_INVALID"
  | "AUTHORITY_VALIDATOR_OPERATIONAL_GATE_FAILED";
export type AuthorityValidatorScenario = "BASELINE" | "OPERATIONAL_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | AuthorityValidatorFailure;
export type AuthorityValidatorInput = Readonly<{ scenario?: AuthorityValidatorScenario; seed?: string }>;
export type AuthorityProfiles = Readonly<{ registry_id: string; profile_kinds: readonly AuthorityProfileKind[]; authority_scope: boolean; authority_level: boolean; ownership: boolean; jurisdiction: boolean; inherited_authority: boolean; delegated_authority_eligibility: boolean; restrictions: boolean; expiration_rules: boolean; certification_requirements: boolean; integrity_hash: string }>;
export type DelegatedAuthorityModel = Readonly<{ engine_id: string; delegation_kinds: readonly DelegationKind[]; issuer: boolean; recipient: boolean; authority_scope: boolean; duration: boolean; limitations: boolean; revocation: boolean; evidence: boolean; approval_history: boolean; constitutional_constraints: boolean; integrity_hash: string }>;
export type AuthorityEvaluationEngine = Readonly<{ engine_id: string; requester: boolean; authority_profile: boolean; delegated_authority: boolean; capability_ownership: boolean; skill_ownership: boolean; lifecycle_state: boolean; tenant_boundary: boolean; namespace: boolean; constitutional_constraints: boolean; runtime_eligibility: boolean; certification_status: boolean; conflict_resolution: boolean; deterministic_results: boolean; integrity_hash: string }>;
export type AuthorityRestrictionModel = Readonly<{ model_id: string; tenant_restrictions: boolean; organization_restrictions: boolean; jurisdiction_restrictions: boolean; capability_restrictions: boolean; skill_restrictions: boolean; lifecycle_restrictions: boolean; runtime_restrictions: boolean; certification_restrictions: boolean; policy_prerequisites: boolean; safety_prerequisites: boolean; before_execution_authorization: boolean; integrity_hash: string }>;
export type AuthorityDispositionMapping = Readonly<{ table_id: string; dispositions: readonly AuthorityDisposition[]; authority_state: boolean; restriction_state: boolean; delegation_state: boolean; lifecycle_state: boolean; canonical_mapping: boolean; platform_standard: boolean; unknown_rejected: boolean; integrity_hash: string }>;
export type AuthorityRegistryService = Readonly<{ service_id: string; authority_profiles: boolean; delegation_records: boolean; authority_hierarchy: boolean; restriction_definitions: boolean; constitutional_mappings: boolean; evidence_references: boolean; historical_decisions: boolean; queryable: boolean; integrity_hash: string }>;
export type AuthorityDecisionEngine = Readonly<{ engine_id: string; validate_authority: boolean; validate_delegation: boolean; resolve_authority: boolean; evaluate_restrictions: boolean; produce_decision: boolean; decision_identifier: boolean; requester: boolean; requested_action: boolean; evaluated_authority: boolean; restrictions_applied: boolean; delegated_authority_used: boolean; disposition: AuthorityDisposition; reasoning: boolean; timestamp: boolean; evidence_reference: boolean; deterministic_decision: boolean; integrity_hash: string }>;
export type AuthorityValidatorApis = Readonly<{ api_id: string; validate_authority: boolean; evaluate_authority: boolean; resolve_authority: boolean; list_authority_profiles: boolean; query_authority: boolean; grant_delegation: boolean; revoke_delegation: boolean; validate_delegation: boolean; list_delegations: boolean; evaluate_restrictions: boolean; query_restrictions: boolean; list_restriction_policies: boolean; retrieve_decision: boolean; replay_decision: boolean; verify_decision: boolean; stable: boolean; integrity_hash: string }>;
export type AuthorityValidatorEvidence = Readonly<{ ledger_id: string; records: readonly string[]; authority_evaluations: boolean; delegation_evidence: boolean; restriction_evaluations: boolean; constitutional_decisions: boolean; decision_history: boolean; authority_lineage: boolean; decision_replay_evidence: boolean; immutable: boolean; replayable: boolean; integrity_hash: string }>;
export type AuthorityValidatorReadiness = Readonly<{ readiness_id: string; decision: AuthorityValidatorDecision; phase_ready: boolean; constitution_ready: boolean; agent_registry_ready: boolean; lifecycle_engine_ready: boolean; capability_registry_ready: boolean; skill_registry_ready: boolean; profiles_ready: boolean; delegation_ready: boolean; evaluation_ready: boolean; restrictions_ready: boolean; disposition_mapping_ready: boolean; registry_ready: boolean; decisions_ready: boolean; apis_ready: boolean; evidence_ready: boolean; enforcement_sequence: "Authority -> Policy -> Safety -> Operator"; authority_precedes_policy_safety_operator: boolean; failures: readonly AuthorityValidatorFailure[]; integrity_hash: string }>;
export type AuthorityValidatorResult = Readonly<{ phase_version: "authority-validator/w2.5"; phase_identifier: "AuthorityValidator"; caf_constitution_ref: "caf-constitutional-foundation/w2.0"; agent_registry_ref: "agent-registry/w2.1"; lifecycle_engine_ref: "lifecycle-engine/w2.2"; capability_registry_ref: "capability-registry/w2.3"; skill_registry_ref: "skill-registry/w2.4"; profiles: AuthorityProfiles; delegation: DelegatedAuthorityModel; evaluation: AuthorityEvaluationEngine; restrictions: AuthorityRestrictionModel; disposition_mapping: AuthorityDispositionMapping; registry: AuthorityRegistryService; decisions: AuthorityDecisionEngine; apis: AuthorityValidatorApis; evidence: AuthorityValidatorEvidence; readiness: AuthorityValidatorReadiness; replay_hash: string; integrity_hash: string }>;
export type AuthorityValidatorValidation = Readonly<{ valid: boolean; decision: AuthorityValidatorDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; profiles_valid: boolean; delegation_valid: boolean; evaluation_valid: boolean; restrictions_valid: boolean; disposition_mapping_valid: boolean; registry_valid: boolean; decisions_valid: boolean; apis_valid: boolean; evidence_valid: boolean; readiness_valid: boolean; failures: readonly AuthorityValidatorFailure[]; integrity_hash: string }>;
export type AuthorityValidatorBundle = Readonly<{ doctrine: Readonly<{ version: "authority-validator/w2.5"; owns_authority_profiles: true; owns_delegated_authority: true; owns_authority_evaluation: true; owns_restriction_evaluation: true; owns_disposition_mapping: true; owns_authority_registry: true; owns_authority_decisions: true; owns_authority_apis: true; owns_authority_evidence: true; enforcement_sequence: "Authority -> Policy -> Safety -> Operator"; operational_gate: "Authority Validator Operational Gate" }>; result: AuthorityValidatorResult; validation: AuthorityValidatorValidation }>;
