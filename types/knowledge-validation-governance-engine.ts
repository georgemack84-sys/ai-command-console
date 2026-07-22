import type { CandidateKnowledgeRepository } from "@/types/template-heuristic-generation-engine";

export type KnowledgeValidationStatus = "PASS" | "FAIL";
export type KnowledgeValidationReadinessState = "READY_FOR_CERTIFICATION" | "REJECTED";
export type KnowledgeValidationLifecycleState = "RECEIVED" | "SCHEMA_VALIDATED" | "EVIDENCE_VALIDATED" | "REPLAY_VALIDATED" | "DETERMINISM_VALIDATED" | "GOVERNANCE_VALIDATED" | "CONSTITUTION_VALIDATED" | "AUTHORITY_VALIDATED" | "TENANT_VALIDATED" | "INTEGRITY_VALIDATED" | "READY_FOR_CERTIFICATION" | "REJECTED";
export type KnowledgeValidationScenario = "BASELINE" | "INVALID_SCHEMA" | "MISSING_EVIDENCE" | "REPLAY_MISMATCH" | "NONDETERMINISTIC_BEHAVIOR" | "GOVERNANCE_VIOLATION" | "CONSTITUTIONAL_VIOLATION" | "AUTHORITY_CONFLICT" | "INTEGRITY_FAILURE" | "LINEAGE_BREAK" | "TENANT_ISOLATION_FAILURE" | "INCOMPLETE_EXPLAINABILITY" | "DUPLICATE_CERTIFIED_IDENTIFIER" | "CERTIFICATION_ATTEMPTED" | "ACTIVATION_ATTEMPTED" | "GOVERNANCE_BYPASS_ATTEMPTED" | "OPERATOR_APPROVAL_BYPASS_ATTEMPTED";
export type KnowledgeValidationFailure = "INVALID_SCHEMA_DETECTED" | "MISSING_EVIDENCE_DETECTED" | "REPLAY_MISMATCH_DETECTED" | "NONDETERMINISTIC_BEHAVIOR_DETECTED" | "GOVERNANCE_VIOLATION_DETECTED" | "CONSTITUTIONAL_VIOLATION_DETECTED" | "AUTHORITY_CONFLICT_DETECTED" | "INTEGRITY_FAILURE_DETECTED" | "LINEAGE_BREAK_DETECTED" | "TENANT_ISOLATION_FAILURE_DETECTED" | "INCOMPLETE_EXPLAINABILITY_DETECTED" | "DUPLICATE_CERTIFIED_IDENTIFIER_DETECTED" | "CERTIFICATION_ATTEMPTED" | "ACTIVATION_ATTEMPTED" | "GOVERNANCE_BYPASS_ATTEMPTED" | "OPERATOR_APPROVAL_BYPASS_ATTEMPTED";

export type KnowledgeValidationRecord = Readonly<{
  validation_id: string;
  artifact_id: string;
  artifact_version: string;
  validation_version: "knowledge-validation-governance-engine/v8ALT.9.7";
  tenant_id: string;
  lifecycle_state: KnowledgeValidationLifecycleState;
  schema_status: KnowledgeValidationStatus;
  evidence_status: KnowledgeValidationStatus;
  replay_status: KnowledgeValidationStatus;
  determinism_status: KnowledgeValidationStatus;
  governance_status: KnowledgeValidationStatus;
  constitution_status: KnowledgeValidationStatus;
  authority_status: KnowledgeValidationStatus;
  tenant_status: KnowledgeValidationStatus;
  integrity_status: KnowledgeValidationStatus;
  explainability_status: KnowledgeValidationStatus;
  replay_score: number;
  evidence_score: number;
  integrity_score: number;
  governance_score: number;
  confidence_score: number;
  evidence_chain: readonly string[];
  lineage_reference: readonly string[];
  replay_reference: readonly string[];
  readiness_state: KnowledgeValidationReadinessState;
  approval_required: true;
  validation_timestamp: "1970-01-01T00:00:00.000Z";
  explanation: readonly string[];
  rejected_conditions: readonly KnowledgeValidationFailure[];
  read_only: true;
  advisory_only: true;
  certification_authorized: boolean;
  activation_authorized: boolean;
  operator_approval_bypass_authorized: boolean;
  governance_modification_authorized: boolean;
  constitutional_modification_authorized: boolean;
  deterministic_signature: string;
  integrity_hash: string;
}>;

export type KnowledgeValidationAuditRecord = Readonly<{
  audit_id: string;
  artifact_id: string | null;
  validation_id: string | null;
  rejection_reason: KnowledgeValidationFailure;
  immutable: true;
  append_only: true;
  replay_reference: string;
  integrity_hash: string;
}>;

export type KnowledgeValidationRepository = Readonly<{
  repository_id: string;
  source_candidate_repository_id: string | null;
  final_state: "KNOWLEDGE_VALIDATION_COMPLETE" | "KNOWLEDGE_VALIDATION_REJECTED";
  validation_records: readonly KnowledgeValidationRecord[];
  readiness_records: readonly KnowledgeValidationRecord[];
  audit_records: readonly KnowledgeValidationAuditRecord[];
  failures: readonly KnowledgeValidationFailure[];
  read_only: true;
  advisory_only: true;
  certification_authorized: false;
  activation_authorized: false;
  operator_approval_bypass_authorized: false;
  governance_modification_authorized: false;
  constitutional_modification_authorized: false;
  integrity_hash: string;
}>;

export type KnowledgeValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  schema_valid: boolean;
  evidence_complete: boolean;
  replay_reproducible: boolean;
  deterministic: boolean;
  governance_valid: boolean;
  constitution_valid: boolean;
  authority_preserved: boolean;
  tenant_isolated: boolean;
  integrity_verified: boolean;
  explainability_complete: boolean;
  duplicate_certified_identifiers_absent: boolean;
  certification_blocked: boolean;
  activation_blocked: boolean;
  operator_approval_required: boolean;
  read_only: true;
  advisory_only: true;
  fail_closed: boolean;
  failures: readonly KnowledgeValidationFailure[];
  validation_hash: string;
}>;

export type KnowledgeValidationObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  validation_count: number;
  readiness_count: number;
  rejected_count: number;
  audit_count: number;
  failure_count: number;
  read_only: true;
  advisory_only: true;
  certification_authorized: false;
  activation_authorized: false;
  integrity_hash: string;
}>;

export type KnowledgeValidationInput = Readonly<{ scenario?: KnowledgeValidationScenario; candidateRepository?: CandidateKnowledgeRepository; repository?: KnowledgeValidationRepository }>;

export type KnowledgeValidationGovernanceEngineBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "knowledge-validation-governance-engine/v8ALT.9.7";
    final_state: "KNOWLEDGE_VALIDATION_GOVERNANCE_READY";
    lifecycle_states: readonly KnowledgeValidationLifecycleState[];
    principles: readonly string[];
  }>;
  repository: KnowledgeValidationRepository;
  validation: KnowledgeValidationResult;
  observability: KnowledgeValidationObservabilitySurface;
}>;
