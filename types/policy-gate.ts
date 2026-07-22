export type PolicyGateDecision = "POLICY_GATE_CERTIFIED" | "CONDITIONALLY_CERTIFIED" | "NOT_CERTIFIED" | "FAIL_CLOSED";
export type PolicyDisposition = "ALLOW" | "ALLOW_WITH_RESTRICTIONS" | "DENY" | "ESCALATE" | "FAIL_CLOSED";
export type PolicyScope = "Constitutional" | "Platform" | "Regulatory" | "Organization" | "Tenant" | "Mission" | "Runtime" | "Capability" | "Skill" | "Session";
export type PolicyGateFailure =
  | "W2_0_CAF_CONSTITUTION_INVALID"
  | "W2_1_AGENT_REGISTRY_INVALID"
  | "W2_2_LIFECYCLE_ENGINE_INVALID"
  | "W2_3_CAPABILITY_REGISTRY_INVALID"
  | "W2_4_SKILL_REGISTRY_INVALID"
  | "W2_5_AUTHORITY_VALIDATOR_INVALID"
  | "AUTHORITY_DECISION_NOT_VALIDATED"
  | "POLICY_ENGINE_MISSING"
  | "POLICY_ENGINE_NON_DETERMINISTIC"
  | "POLICY_REGISTRY_INTEGRATION_MISSING"
  | "POLICY_DEFINITION_INVALID"
  | "POLICY_RESOLUTION_ENGINE_MISSING"
  | "POLICY_RESOLUTION_NON_DETERMINISTIC"
  | "POLICY_INHERITANCE_INVALID"
  | "POLICY_PRECEDENCE_INVALID"
  | "CONSTITUTIONAL_PRECEDENCE_BYPASSED"
  | "TENANT_ISOLATION_FAILED"
  | "CONFLICT_DETECTION_MISSING"
  | "POLICY_CONFLICT_UNRESOLVED"
  | "CIRCULAR_POLICY_DEPENDENCY_ALLOWED"
  | "DUPLICATE_POLICY_ALLOWED"
  | "INVALID_POLICY_CONDITION_ALLOWED"
  | "EXCEPTION_WORKFLOW_MISSING"
  | "UNAPPROVED_EXCEPTION_ALLOWED"
  | "EXPIRED_EXCEPTION_ALLOWED"
  | "REVOKED_EXCEPTION_ALLOWED"
  | "EXCEPTION_EVIDENCE_MISSING"
  | "DISPOSITION_MAPPING_MISSING"
  | "INVALID_POLICY_DISPOSITION_ALLOWED"
  | "POLICY_GRANTED_AUTHORITY"
  | "SAFETY_EVALUATION_PERFORMED"
  | "OPERATOR_APPROVAL_PERFORMED"
  | "POLICY_API_MISSING"
  | "POLICY_REPLAY_INVALID"
  | "POLICY_EVIDENCE_MISSING"
  | "POLICY_EVIDENCE_NOT_IMMUTABLE"
  | "POLICY_GATE_CERTIFICATION_FAILED";
export type PolicyGateScenario = "BASELINE" | "CERTIFIED_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | PolicyGateFailure;
export type PolicyGateInput = Readonly<{ scenario?: PolicyGateScenario; seed?: string }>;
export type PolicyEngine = Readonly<{ engine_id: string; load_applicable_policies: boolean; resolve_inheritance: boolean; evaluate_conditions: boolean; apply_restrictions: boolean; calculate_decisions: boolean; generate_evidence: boolean; policy_decision: boolean; evaluation_trace: boolean; resolution_tree: boolean; deterministic_evaluation: boolean; fail_closed: boolean; integrity_hash: string }>;
export type PolicyRegistryIntegration = Readonly<{ registry_id: string; platform_policies: boolean; tenant_policies: boolean; runtime_policies: boolean; mission_policies: boolean; capability_policies: boolean; skill_policies: boolean; governance_policies: boolean; configuration_policies: boolean; definitions_versioned: boolean; evidence_references: boolean; integrity_hash: string }>;
export type PolicyResolutionEngine = Readonly<{ engine_id: string; inheritance: boolean; aggregation: boolean; overrides: boolean; exclusions: boolean; conditional_activation: boolean; runtime_policy_activation: boolean; resolved_policy_set: boolean; deterministic_resolution: boolean; integrity_hash: string }>;
export type PolicyHierarchy = Readonly<{ hierarchy_id: string; scopes: readonly PolicyScope[]; constitutional_precedence: boolean; delegated_precedence_exceptions: boolean; precedence_deterministic: boolean; tenant_isolation: boolean; integrity_hash: string }>;
export type PolicyConflictDetection = Readonly<{ engine_id: string; incompatible_permissions: boolean; conflicting_restrictions: boolean; circular_dependencies: boolean; duplicate_policies: boolean; invalid_inheritance: boolean; impossible_conditions: boolean; conflict_reports: boolean; deterministic_resolution: boolean; integrity_hash: string }>;
export type PolicyExceptionWorkflow = Readonly<{ workflow_id: string; temporary_exceptions: boolean; emergency_exceptions: boolean; delegated_exceptions: boolean; operator_approved_exceptions: boolean; expiration: boolean; revocation: boolean; evidence: boolean; lineage: boolean; approval_required: boolean; integrity_hash: string }>;
export type PolicyDispositionMapping = Readonly<{ table_id: string; dispositions: readonly PolicyDisposition[]; allow: boolean; allow_with_restrictions: boolean; deny: boolean; escalate: boolean; fail_closed: boolean; safety_gate_input: boolean; canonical_mapping: boolean; integrity_hash: string }>;
export type PolicyDecisionEngine = Readonly<{ engine_id: string; decision_id: boolean; authority_decision_reference: boolean; applied_policies: boolean; evaluation_result: boolean; restrictions: boolean; exceptions: boolean; final_disposition: PolicyDisposition; timestamp: boolean; traceable_to_authority: boolean; deterministic_decision: boolean; grants_authority: false; evaluates_safety: false; performs_operator_approval: false; integrity_hash: string }>;
export type PolicyGateApis = Readonly<{ api_id: string; policy_evaluation_api: boolean; policy_registry_api: boolean; policy_resolution_api: boolean; conflict_detection_api: boolean; exception_api: boolean; policy_replay_api: boolean; stable: boolean; integrity_hash: string }>;
export type PolicyGateEvidence = Readonly<{ ledger_id: string; records: readonly string[]; policy_evaluation_records: boolean; resolution_trees: boolean; conflict_reports: boolean; exception_records: boolean; policy_decision_evidence: boolean; deterministic_replay_evidence: boolean; policy_lineage: boolean; audit_records: boolean; immutable: boolean; replayable: boolean; integrity_hash: string }>;
export type PolicyGateReadiness = Readonly<{ readiness_id: string; decision: PolicyGateDecision; phase_ready: boolean; constitution_ready: boolean; agent_registry_ready: boolean; lifecycle_engine_ready: boolean; capability_registry_ready: boolean; skill_registry_ready: boolean; authority_validator_ready: boolean; validated_authority_input: boolean; engine_ready: boolean; registry_ready: boolean; resolution_ready: boolean; hierarchy_ready: boolean; conflict_detection_ready: boolean; exception_workflow_ready: boolean; disposition_mapping_ready: boolean; decisions_ready: boolean; apis_ready: boolean; evidence_ready: boolean; enforcement_sequence: "Authority -> Policy -> Safety -> Operator"; policy_precedes_safety_operator: boolean; failures: readonly PolicyGateFailure[]; integrity_hash: string }>;
export type PolicyGateResult = Readonly<{ phase_version: "policy-gate/w2.6"; phase_identifier: "PolicyGate"; caf_constitution_ref: "caf-constitutional-foundation/w2.0"; agent_registry_ref: "agent-registry/w2.1"; lifecycle_engine_ref: "lifecycle-engine/w2.2"; capability_registry_ref: "capability-registry/w2.3"; skill_registry_ref: "skill-registry/w2.4"; authority_validator_ref: "authority-validator/w2.5"; engine: PolicyEngine; registry: PolicyRegistryIntegration; resolution: PolicyResolutionEngine; hierarchy: PolicyHierarchy; conflicts: PolicyConflictDetection; exceptions: PolicyExceptionWorkflow; disposition_mapping: PolicyDispositionMapping; decisions: PolicyDecisionEngine; apis: PolicyGateApis; evidence: PolicyGateEvidence; readiness: PolicyGateReadiness; replay_hash: string; integrity_hash: string }>;
export type PolicyGateValidation = Readonly<{ valid: boolean; decision: PolicyGateDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; engine_valid: boolean; registry_valid: boolean; resolution_valid: boolean; hierarchy_valid: boolean; conflicts_valid: boolean; exceptions_valid: boolean; disposition_mapping_valid: boolean; decisions_valid: boolean; apis_valid: boolean; evidence_valid: boolean; readiness_valid: boolean; failures: readonly PolicyGateFailure[]; integrity_hash: string }>;
export type PolicyGateBundle = Readonly<{ doctrine: Readonly<{ version: "policy-gate/w2.6"; owns_policy_evaluation: true; owns_policy_inheritance: true; owns_policy_resolution: true; owns_policy_precedence: true; owns_policy_conflict_detection: true; owns_exception_workflow: true; owns_policy_disposition_mapping: true; owns_policy_decisions: true; owns_policy_evidence: true; does_not_grant_authority: true; does_not_evaluate_safety: true; does_not_perform_operator_approval: true; enforcement_sequence: "Authority -> Policy -> Safety -> Operator"; certification_gate: "Policy Gate Certification Gate" }>; result: PolicyGateResult; validation: PolicyGateValidation }>;
