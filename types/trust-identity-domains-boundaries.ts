export type TrustIdentityDomainBoundaryOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW" | "REQUIRES_OPERATOR_REVIEW";
export type TrustIdentityClass = "TRUST_SUBJECT" | "TRUST_AUTHORITY" | "TRUST_EVALUATOR" | "TRUST_SERVICE" | "TRUST_PROVIDER" | "TRUST_CONSUMER" | "TRUST_DELEGATE" | "TRUST_EVIDENCE_ISSUER" | "TRUST_EVIDENCE_HOLDER" | "TRUST_POLICY_AUTHORITY" | "TRUST_OPERATOR" | "TRUST_APPLICATION" | "TRUST_AGENT" | "TRUST_PLATFORM_COMPONENT" | "TRUST_RESOURCE" | "TRUST_DOMAIN_AUTHORITY";
export type TrustIdentityLifecycleStatus = "PROPOSED" | "REGISTERED" | "ACTIVE" | "SUSPENDED" | "REVOKED" | "EXPIRED" | "SUPERSEDED" | "RETIRED";
export type TrustRegistrationDecision = "ACCEPT" | "ACCEPT_WITH_RESTRICTIONS" | "REJECT" | "REQUIRES_GOVERNANCE_REVIEW" | "REQUIRES_OPERATOR_REVIEW" | "REQUIRES_ADDITIONAL_EVIDENCE";
export type TrustDomainType = "TENANT_ROOT" | "ORGANIZATIONAL" | "APPLICATION" | "AGENT" | "SERVICE" | "MISSION" | "OPERATIONAL" | "ASSURANCE" | "GOVERNANCE" | "EVIDENCE" | "DELEGATION" | "FEDERATION_ENDPOINT" | "SANDBOX" | "TEST" | "SYNTHETIC";
export type TrustDomainLifecycleStatus = "PROPOSED" | "REGISTERED" | "ACTIVE" | "RESTRICTED" | "SUSPENDED" | "QUARANTINED" | "RETIRED" | "SUPERSEDED";
export type TrustBoundaryType = "TENANT_BOUNDARY" | "TRUST_DOMAIN_BOUNDARY" | "IDENTITY_BOUNDARY" | "APPLICATION_BOUNDARY" | "AGENT_BOUNDARY" | "SERVICE_BOUNDARY" | "MISSION_BOUNDARY" | "DATA_BOUNDARY" | "EVIDENCE_BOUNDARY" | "POLICY_BOUNDARY" | "GOVERNANCE_BOUNDARY" | "ASSURANCE_BOUNDARY" | "TEMPORAL_BOUNDARY" | "FEDERATION_ENDPOINT_BOUNDARY";

export type TrustIdentityDomainBoundaryFailure =
  | "P5_0_TRUST_CONSTITUTION_INVALID"
  | "P5_1_TRUST_ARCHITECTURE_INVALID"
  | "TRUST_REGISTRY_MISSING"
  | "TRUST_DOMAIN_REGISTRY_MISSING"
  | "TRUST_BOUNDARY_REGISTRY_MISSING"
  | "TRUST_IDENTITY_MISSING"
  | "TRUST_IDENTITY_NOT_DETERMINISTIC"
  | "TRUST_IDENTITY_NOT_UNIQUE"
  | "TRUST_IDENTITY_AMBIGUOUS_TENANT"
  | "TRUST_IDENTITY_NOT_DOMAIN_RESOLVABLE"
  | "TRUST_IDENTITY_LIFECYCLE_INVALID"
  | "REGISTRATION_OUTCOME_STORED_AS_LIFECYCLE"
  | "REVOKED_IDENTITY_CAN_INITIATE_RELATIONSHIP"
  | "IDENTITY_SILENTLY_TRUSTED"
  | "TRUST_DOMAIN_MISSING"
  | "DOMAIN_TENANT_CONTAINMENT_INVALID"
  | "DOMAIN_SPANS_MULTIPLE_TENANTS"
  | "DOMAIN_PARENT_TENANT_MISMATCH"
  | "DOMAIN_BOUNDARY_MISSING"
  | "DOMAIN_HIERARCHY_EXPANDS_SCOPE"
  | "SUSPENDED_DOMAIN_ALLOWS_NEW_RELATIONSHIP"
  | "TRUST_BOUNDARY_MISSING"
  | "BOUNDARY_TENANT_AMBIGUOUS"
  | "BOUNDARY_CONFLICT_SILENTLY_IGNORED"
  | "BOUNDARY_RULES_INCOMPLETE"
  | "TENANT_ISOLATION_INVALID"
  | "CROSS_TENANT_MEMBERSHIP_ALLOWED"
  | "CROSS_TENANT_DISCOVERY_LEAKAGE"
  | "TRUST_PROPAGATION_IMPLICIT"
  | "FOREIGN_EVIDENCE_AUTHORITATIVE"
  | "DELEGATION_BYPASSES_ISOLATION"
  | "FEDERATION_MERGES_DOMAINS"
  | "REGISTRY_SEPARATION_INVALID"
  | "REGISTRY_INTEGRITY_INVALID"
  | "REGISTRY_HISTORY_REWRITABLE"
  | "REGISTRY_MUTATION_WITHOUT_EVIDENCE"
  | "NAMESPACE_CONFLICT_UNRESOLVED"
  | "CONFLICTS_DO_NOT_FAIL_CLOSED"
  | "CONTAINMENT_VALIDATION_NONDETERMINISTIC"
  | "REPLAY_DIVERGENCE"
  | "SECURITY_MODEL_MISSING"
  | "OBSERVABILITY_MODEL_MISSING"
  | "EVIDENCE_MODEL_INCOMPLETE"
  | "GOVERNANCE_REVIEW_REQUIRED"
  | "OPERATOR_REVIEW_REQUIRED";

export type TrustIdentityDomainBoundaryScenario = "BASELINE" | TrustIdentityDomainBoundaryFailure;
export type TrustIdentityDomainBoundaryInput = Readonly<{ scenario?: TrustIdentityDomainBoundaryScenario; tenant_id?: string; trust_identity_id?: string; trust_domain_id?: string; trust_boundary_id?: string }>;

export type TrustRegistryRecord = Readonly<{ record_id: string; tenant_id: string; version: "trust-identity-domains-boundaries/v5.2"; refs: readonly string[]; immutable: boolean; deterministic: boolean; integrity_hash: string }>;
export type TrustIdentityRecord = TrustRegistryRecord & Readonly<{ trust_identity_id: string; identity_type: "CIVITAS_TRUST_IDENTITY"; canonical_entity_id: string; trust_domain_ids: readonly string[]; trust_boundary_ids: readonly string[]; owner_identity_ref: string; authority_identity_refs: readonly string[]; namespace: string; display_name: string; identity_classes: readonly TrustIdentityClass[]; identity_version: string; lifecycle_status: TrustIdentityLifecycleStatus; registration_status: TrustRegistrationDecision; source_registry_refs: readonly string[]; constitutional_scope: string; permitted_trust_roles: readonly string[]; prohibited_trust_roles: readonly string[]; delegation_allowed: boolean; cross_domain_participation_allowed: boolean; created_at: string; activated_at: string; suspended_at: string; revoked_at: string; expired_at: string; superseded_by: string; lineage_refs: readonly string[]; evidence_refs: readonly string[]; trusted_by_registration: boolean; can_initiate_new_relationships: boolean }>;
export type TrustDomainRecord = TrustRegistryRecord & Readonly<{ trust_domain_id: string; parent_domain_id: string; domain_type: TrustDomainType; domain_name: string; namespace: string; owning_identity_ref: string; governing_authority_refs: readonly string[]; trust_boundary_id: string; constitutional_scope: string; permitted_identity_types: readonly TrustIdentityClass[]; permitted_trust_relationship_types: readonly string[]; prohibited_relationship_types: readonly string[]; inherited_policy_refs: readonly string[]; domain_policy_refs: readonly string[]; domain_status: TrustDomainLifecycleStatus; registration_status: TrustRegistrationDecision; isolation_class: "TENANT_CONTAINED"; cross_domain_rules: readonly string[]; evidence_scope: string; replay_scope: string; created_at: string; activated_at: string; suspended_at: string; retired_at: string; superseded_by: string; lineage_refs: readonly string[]; tenant_boundary_ids: readonly string[]; allows_new_relationships: boolean; expands_parent_scope: boolean }>;
export type TrustBoundaryRecord = TrustRegistryRecord & Readonly<{ trust_boundary_id: string; trust_domain_id: string; boundary_type: TrustBoundaryType; boundary_name: string; parent_boundary_id: string; owning_identity_ref: string; governing_authority_refs: readonly string[]; included_identity_refs: readonly string[]; included_service_refs: readonly string[]; included_resource_refs: readonly string[]; included_namespace_refs: readonly string[]; permitted_ingress_types: readonly string[]; permitted_egress_types: readonly string[]; prohibited_crossings: readonly string[]; evidence_visibility_rules: readonly string[]; trust_propagation_rules: readonly string[]; delegation_rules: readonly string[]; federation_endpoint_rules: readonly string[]; temporal_constraints: readonly string[]; jurisdictional_constraints: readonly string[]; isolation_requirements: readonly string[]; enforcement_refs: readonly string[]; boundary_status: TrustDomainLifecycleStatus; created_at: string; activated_at: string; suspended_at: string; retired_at: string; superseded_by: string; lineage_refs: readonly string[]; tenant_boundary_ids: readonly string[]; conflicts_silently_ignored: boolean }>;
export type TrustRegistryModel = TrustRegistryRecord & Readonly<{ registry_id: string; registry_kind: "TRUST_REGISTRY"; canonical_for: readonly string[]; identities: readonly TrustIdentityRecord[]; tenant_scoped: boolean; rejects_ambiguous_registration: boolean; preserves_history: boolean; separates_identity_from_trust_status: boolean; separates_lifecycle_from_registration_decision: boolean; fail_closed_resolution: boolean; prevents_cross_tenant_discovery: boolean }>;
export type TrustDomainRegistryModel = TrustRegistryRecord & Readonly<{ registry_id: string; registry_kind: "TRUST_DOMAIN_REGISTRY"; canonical_for: readonly string[]; domains: readonly TrustDomainRecord[]; tenant_containment_validated: boolean; hierarchy_validated: boolean; membership_queries_tenant_scoped: boolean; deterministic_historical_replay: boolean }>;
export type TrustBoundaryRegistryModel = TrustRegistryRecord & Readonly<{ registry_id: string; registry_kind: "TRUST_BOUNDARY_REGISTRY"; canonical_for: readonly string[]; boundaries: readonly TrustBoundaryRecord[]; boundary_to_domain_resolution: boolean; boundary_to_tenant_resolution: boolean; conflict_detection: boolean; lifecycle_managed: boolean; deterministic_historical_reconstruction: boolean }>;
export type TenantTrustIsolationModel = Readonly<{ requesting_tenant_id: string; subject_tenant_id: string; trust_domain_tenant_id: string; trust_boundary_tenant_id: string; evidence_tenant_id: string; all_tenant_refs_equal: boolean; foreign_evidence_authoritative_by_default: boolean; delegation_bypasses_isolation: boolean; federation_merges_domains: boolean; registry_queries_tenant_scoped: boolean; integrity_hash: string }>;
export type TrustResolutionModel = Readonly<{ path: readonly ["TrustIdentity", "TrustDomain", "TrustBoundary", "TenantBoundary"]; terminates_in_exactly_one_tenant_boundary: boolean; identity_to_domain_resolved: boolean; domain_to_boundary_resolved: boolean; boundary_to_tenant_resolved: boolean; trust_domain_subset_tenant_boundary: boolean; deterministic_containment_validation: boolean; fail_closed_on_ambiguity: boolean; integrity_hash: string }>;
export type TrustRegistryGovernanceModel = Readonly<{ registration_authorities_defined: boolean; mutation_permissions_defined: boolean; conflict_escalation_defined: boolean; no_self_approval_unless_governed: boolean; no_cross_tenant_mutation: boolean; exceptional_cross_domain_interaction_requires_governance: boolean; integrity_hash: string }>;
export type TrustRegistryEvidenceModel = Readonly<{ evidence_refs: readonly string[]; captures_previous_state: boolean; captures_proposed_state: boolean; captures_validation_results: boolean; captures_conflicts_detected: boolean; emits_audit_records: boolean; immutable_lineage_preserved: boolean; replayable_history: boolean; integrity_hash: string }>;
export type TrustRegistrySecurityModel = Readonly<{ tenant_scoped_authorization: boolean; role_based_field_visibility: boolean; anti_enumeration_controls: boolean; namespace_protection: boolean; mutation_authorization: boolean; stale_write_prevention: boolean; suspension_revocation_enforced: boolean; fail_closed_resolution: boolean; integrity_hash: string }>;
export type TrustRegistryObservabilityModel = Readonly<{ metric_refs: readonly string[]; monitors_containment_violations: boolean; monitors_isolation_violations: boolean; monitors_namespace_conflicts: boolean; monitors_integrity_failures: boolean; monitors_replay_divergence: boolean; monitors_unauthorized_queries: boolean; integrity_hash: string }>;
export type TrustIdentityDomainBoundaryCertification = Readonly<{ certification_id: string; outcome: TrustIdentityDomainBoundaryOutcome; phase_ready: boolean; trust_identity_uniqueness: boolean; trust_identity_determinism: boolean; trust_domain_containment: boolean; tenant_trust_isolation: boolean; domain_hierarchy_validity: boolean; trust_boundary_completeness: boolean; registry_separation: boolean; registry_integrity: boolean; namespace_conflict_handling: boolean; lifecycle_correctness: boolean; decision_status_separation: boolean; governance_authority_enforcement: boolean; evidence_completeness: boolean; deterministic_replay: boolean; cross_tenant_leakage_prevention: boolean; fail_closed_resolution: boolean; failures: readonly TrustIdentityDomainBoundaryFailure[]; integrity_hash: string }>;
export type TrustIdentityDomainBoundaryResult = Readonly<{ phase_version: "trust-identity-domains-boundaries/v5.2"; phase_identifier: "TrustIdentityDomainsBoundaries"; trust_constitution_ref: "trust-constitutional-foundation/v5.0"; trust_architecture_ref: "trust-architecture-alignment-foundation/v5.1"; trust_registry: TrustRegistryModel; trust_domain_registry: TrustDomainRegistryModel; trust_boundary_registry: TrustBoundaryRegistryModel; tenant_isolation: TenantTrustIsolationModel; resolution: TrustResolutionModel; governance: TrustRegistryGovernanceModel; evidence: TrustRegistryEvidenceModel; security: TrustRegistrySecurityModel; observability: TrustRegistryObservabilityModel; certification: TrustIdentityDomainBoundaryCertification; replay_hash: string; integrity_hash: string }>;
export type TrustIdentityDomainBoundaryValidation = Readonly<{ valid: boolean; outcome: TrustIdentityDomainBoundaryOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; trust_registry_valid: boolean; domain_registry_valid: boolean; boundary_registry_valid: boolean; tenant_isolation_valid: boolean; resolution_valid: boolean; governance_valid: boolean; evidence_valid: boolean; security_valid: boolean; observability_valid: boolean; certification_valid: boolean; failures: readonly TrustIdentityDomainBoundaryFailure[]; integrity_hash: string }>;
export type TrustIdentityDomainBoundaryBundle = Readonly<{ doctrine: Readonly<{ version: "trust-identity-domains-boundaries/v5.2"; owns_trust_identities: true; owns_trust_domains: true; owns_trust_boundaries: true; owns_tenant_trust_isolation: true; owns_trust_registries: true; implements_trust_scoring: false; implements_trust_evaluation: false; issues_credentials: false; executes_federation: false; authorizes_execution: false }>; result: TrustIdentityDomainBoundaryResult; validation: TrustIdentityDomainBoundaryValidation }>;
