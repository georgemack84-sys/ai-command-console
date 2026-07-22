export type DelegationLifecycleState = "CREATED" | "OFFERED" | "ACCEPTED" | "ACTIVE" | "COMPLETED" | "DECLINED" | "REVOKED" | "EXPIRED";
export type NegotiationOutcome = "AGREEMENT" | "PARTIAL_AGREEMENT" | "REJECTED" | "ESCALATED" | "CANCELLED";
export type CollaborationCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type CollaborationFederationFailure =
  | "P3_5_PLANNING_REASONING_INVALID"
  | "COLLABORATION_MODEL_INCOMPLETE"
  | "SHARED_STATE_UNGOVERNED"
  | "UNAUTHORIZED_DELEGATION"
  | "DELEGATION_AUTHORITY_LOST"
  | "NON_DETERMINISTIC_NEGOTIATION"
  | "FEDERATION_TRUST_FAILURE"
  | "FEDERATION_SESSION_UNSECURED"
  | "INTEROPERABILITY_CONTRACT_VIOLATION"
  | "CONTEXT_VISIBILITY_BYPASS"
  | "COLLABORATION_GOVERNANCE_BYPASS"
  | "PARTNER_VALIDATION_INCOMPLETE"
  | "OBSERVABILITY_GAP"
  | "AUDIT_GAP"
  | "REPLAY_INCONSISTENCY"
  | "TENANT_ISOLATION_VIOLATION"
  | "CERTIFICATION_PRUNED";

export type CollaborationFederationScenario = "BASELINE" | CollaborationFederationFailure;
export type CollaborationFederationInput = Readonly<{ scenario?: CollaborationFederationScenario; tenant_id?: string }>;

export type CollaborationFrameworkRecord = Readonly<{
  collaboration_id: string;
  model_ref: string;
  participant_refs: readonly string[];
  shared_objective_refs: readonly string[];
  responsibility_refs: readonly string[];
  lifecycle_states: readonly string[];
  contracts_deterministic: boolean;
  shared_state_governed: boolean;
  collaboration_deterministic: boolean;
  registry_ref: string;
  integrity_hash: string;
}>;

export type DelegationRecord = Readonly<{
  delegation_id: string;
  source_agent_ref: string;
  target_agent_ref: string;
  task_ref: string;
  lifecycle_state: DelegationLifecycleState;
  authority_preserved: boolean;
  ownership_transfer_governed: boolean;
  acceptance_validated: boolean;
  completion_evidenced: boolean;
  replayable: boolean;
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type NegotiationRecord = Readonly<{
  negotiation_id: string;
  proposal_refs: readonly string[];
  counter_proposal_refs: readonly string[];
  outcome: NegotiationOutcome;
  conflict_resolution_ref: string;
  history_refs: readonly string[];
  deterministic: boolean;
  governance_enforced: boolean;
  integrity_hash: string;
}>;

export type FederationRecord = Readonly<{
  federation_id: string;
  federation_registry_ref: string;
  external_partner_refs: readonly string[];
  federation_contract_refs: readonly string[];
  session_refs: readonly string[];
  trust_established: boolean;
  session_secure: boolean;
  remote_coordination_governed: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type InteroperabilityRecord = Readonly<{
  interoperability_id: string;
  supported_domains: readonly string[];
  protocol_adapter_refs: readonly string[];
  capability_mapping_refs: readonly string[];
  schema_translation_refs: readonly string[];
  endpoint_discovery_validated: boolean;
  mappings_deterministic: boolean;
  contracts_validated: boolean;
  integrity_hash: string;
}>;

export type SharedContextRecord = Readonly<{
  context_id: string;
  shared_memory_refs: readonly string[];
  context_version: string;
  participant_visibility_refs: readonly string[];
  synchronization_hash: string;
  visibility_governed: boolean;
  synchronization_integrity: boolean;
  tenant_id: string;
  tenant_isolated: boolean;
  integrity_hash: string;
}>;

export type CollaborationGovernanceRecord = Readonly<{
  governance_id: string;
  authority_validated: boolean;
  participant_authorized: boolean;
  delegation_approved: boolean;
  federation_policy_validated: boolean;
  collaboration_policy_validated: boolean;
  lifecycle_validated: boolean;
  replay_validated: boolean;
  fail_closed_enforced: boolean;
  integrity_hash: string;
}>;

export type TrustSecurityRecord = Readonly<{
  trust_id: string;
  federation_trust_validated: boolean;
  partner_verification_complete: boolean;
  credential_validation_complete: boolean;
  reputation_assessment_ref: string;
  session_security_validated: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type CollaborationEvidenceEntry = Readonly<{
  evidence_id: string;
  event_type: "PARTICIPANT_REGISTERED" | "AUTHORITY_DECISION" | "MESSAGE_RECORDED" | "NEGOTIATION_EVENT" | "DELEGATION_CHAIN" | "FEDERATION_EVENT" | "POLICY_EVALUATION" | "REPLAY_VALIDATED" | "CERTIFICATION_REFERENCED";
  evidence_refs: readonly string[];
  lineage_ref: string;
  sequence: number;
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type CollaborationReplayValidation = Readonly<{
  replay_validation_id: string;
  collaboration_replayed: boolean;
  delegation_replayed: boolean;
  negotiation_replayed: boolean;
  federation_replayed: boolean;
  interoperability_replayed: boolean;
  audit_replayed: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type CollaborationObservabilityRecord = Readonly<{
  observability_id: string;
  metrics: Readonly<{
    active_collaborations: number;
    active_delegations: number;
    negotiation_events: number;
    federation_sessions: number;
    interoperability_checks: number;
    policy_violations: number;
    replay_match_rate: number;
  }>;
  collaboration_dashboard_validated: boolean;
  federation_dashboard_validated: boolean;
  complete_visibility: boolean;
  integrity_hash: string;
}>;

export type CollaborationCertification = Readonly<{
  certification_id: string;
  outcome: CollaborationCertificationOutcome;
  certified: boolean;
  collaboration_correctness: boolean;
  delegation_integrity: boolean;
  negotiation_determinism: boolean;
  federation_security: boolean;
  interoperability_compatibility: boolean;
  governance_compliance: boolean;
  replay_validated: boolean;
  audit_complete: boolean;
  tenant_isolation: boolean;
  constitutional_conformance: boolean;
  approved_for_p3_7: boolean;
  failures: readonly CollaborationFederationFailure[];
  integrity_hash: string;
}>;

export type CollaborationFederationResult = Readonly<{
  phase_version: "caf-collaboration-federation/v3.6";
  phase_identifier: "CafCollaborationFederation";
  constitutional_ref: "P3.0-CAF-CONSTITUTION-001";
  planning_reasoning_ref: "caf-planning-reasoning/v3.5";
  cci_messaging_ref: "Program 2 - CCI Messaging Infrastructure";
  collaboration: CollaborationFrameworkRecord;
  delegation: DelegationRecord;
  negotiation: NegotiationRecord;
  federation: FederationRecord;
  interoperability: InteroperabilityRecord;
  shared_context: SharedContextRecord;
  governance: CollaborationGovernanceRecord;
  trust_security: TrustSecurityRecord;
  evidence: readonly CollaborationEvidenceEntry[];
  replay_validation: CollaborationReplayValidation;
  observability: CollaborationObservabilityRecord;
  certification: CollaborationCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type CollaborationFederationValidation = Readonly<{
  valid: boolean;
  outcome: CollaborationCertificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  collaboration_valid: boolean;
  delegation_valid: boolean;
  federation_valid: boolean;
  governance_valid: boolean;
  evidence_valid: boolean;
  certification_valid: boolean;
  failures: readonly CollaborationFederationFailure[];
  integrity_hash: string;
}>;

export type CollaborationFederationBundle = Readonly<{
  doctrine: Readonly<{
    version: "caf-collaboration-federation/v3.6";
    consumes_planning_reasoning: true;
    consumes_cci_messaging_identity_security_runtime_governance_evidence: true;
    owns_collaboration_not_messaging_infrastructure: true;
    governed_delegation_required: true;
    deterministic_negotiation_required: true;
    secure_federation_required: true;
    tenant_isolation_required: true;
  }>;
  result: CollaborationFederationResult;
  validation: CollaborationFederationValidation;
}>;
