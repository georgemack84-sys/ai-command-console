import type { KnowledgeCategory, KnowledgeEvolutionContract } from "@/types/knowledge-evolution-contract";

export type KnowledgeCaptureState = "DETECTED" | "CAPTURED" | "NORMALIZED" | "CLASSIFIED" | "VERIFIED" | "RECORDED" | "CERTIFIED" | "ARCHIVED";
export type MissionKnowledgeCategory = KnowledgeCategory | "DELEGATION" | "COORDINATION" | "GOVERNANCE" | "CONSTITUTIONAL" | "RISK" | "MISSION_HEALTH" | "OPTIMIZATION" | "OPERATOR_ACTION";
export type MissionKnowledgeScenario = "BASELINE" | "INCOMPLETE_MISSION_RECORD" | "MISSING_REPLAY_REFERENCE" | "CORRUPTED_EVIDENCE" | "INTEGRITY_MISMATCH" | "GOVERNANCE_VIOLATION" | "CONSTITUTIONAL_VIOLATION" | "DUPLICATE_DETERMINISTIC_IDENTIFIER" | "ORPHANED_LINEAGE" | "UNAUTHORIZED_KNOWLEDGE_SOURCE" | "CROSS_TENANT_CAPTURE_ATTEMPT" | "HISTORICAL_MUTATION_ATTEMPT" | "LEARNING_EXECUTION_ATTEMPTED" | "ACTIVATION_ATTEMPTED";
export type MissionKnowledgeCaptureFailure = "INCOMPLETE_MISSION_RECORD" | "REPLAY_REFERENCE_MISSING" | "CORRUPTED_EVIDENCE_DETECTED" | "INTEGRITY_MISMATCH_DETECTED" | "GOVERNANCE_VIOLATION_DETECTED" | "CONSTITUTIONAL_VIOLATION_DETECTED" | "DUPLICATE_DETERMINISTIC_IDENTIFIER_DETECTED" | "ORPHANED_LINEAGE_DETECTED" | "UNAUTHORIZED_KNOWLEDGE_SOURCE_DETECTED" | "CROSS_TENANT_CAPTURE_DETECTED" | "HISTORICAL_MUTATION_DETECTED" | "LEARNING_EXECUTION_ATTEMPTED" | "ACTIVATION_ATTEMPTED" | "KNOWLEDGE_CONTRACT_INVALID";

export type MissionKnowledgeRecord = Readonly<{
  knowledge_record_id: string;
  mission_id: string;
  execution_id: string;
  replay_id: string;
  tenant_id: string;
  knowledge_type: "MISSION_CAPTURE";
  category: MissionKnowledgeCategory;
  source_component: string;
  lifecycle_state: KnowledgeCaptureState;
  mission_type: string;
  mission_goal: string;
  execution_scope: string;
  completion_status: "SUCCESS" | "FAILURE" | "PARTIAL";
  outcome: string;
  evidence_references: readonly string[];
  replay_references: readonly string[];
  lineage_references: readonly string[];
  integrity_hashes: readonly string[];
  execution_time: number;
  resource_usage: number;
  confidence: number;
  mission_health: number;
  recovery_score: number;
  governance_status: "PASS" | "FAIL";
  constitutional_status: "PASS" | "FAIL";
  authority_status: "PASS" | "FAIL";
  created_timestamp: string;
  deterministic_sequence: number;
  version: string;
  capture_only: true;
  learning_execution_authorized: false;
  optimization_authority: false;
  activation_authority: false;
  historical_truth_mutable: boolean;
  integrity_hash: string;
}>;

export type KnowledgeCaptureAuditRecord = Readonly<{
  audit_id: string;
  mission_id: string | null;
  tenant_id: string | null;
  rejection_reason: MissionKnowledgeCaptureFailure;
  immutable: true;
  append_only: true;
  evidence_reference: string;
  created_timestamp: string;
  integrity_hash: string;
}>;

export type MissionKnowledgeCapturePackage = Readonly<{
  capture_id: string;
  contract_id: string;
  final_state: "MISSION_KNOWLEDGE_CAPTURED" | "MISSION_KNOWLEDGE_CAPTURE_REJECTED";
  records: readonly MissionKnowledgeRecord[];
  audit_records: readonly KnowledgeCaptureAuditRecord[];
  failures: readonly MissionKnowledgeCaptureFailure[];
  capture_only: true;
  learning_execution_authorized: false;
  optimization_authority: false;
  activation_authority: false;
  historical_truth_mutable: false;
  integrity_hash: string;
}>;

export type MissionKnowledgeCaptureValidationResult = Readonly<{
  capture_id: string;
  valid: boolean;
  contract_valid: boolean;
  completed_missions_captured: boolean;
  records_normalized: boolean;
  evidence_complete: boolean;
  lineage_complete: boolean;
  replay_ready: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  deterministic_identifiers_unique: boolean;
  tenant_isolated: boolean;
  immutable_capture: boolean;
  capture_only: true;
  learning_execution_authorization_absent: boolean;
  optimization_authority_absent: boolean;
  activation_authority_absent: boolean;
  historical_truth_preserved: boolean;
  fail_closed: boolean;
  failures: readonly MissionKnowledgeCaptureFailure[];
  validation_hash: string;
}>;

export type MissionKnowledgeCaptureObservabilitySurface = Readonly<{
  capture_id: string;
  final_state: string;
  record_count: number;
  audit_count: number;
  failure_count: number;
  capture_only: true;
  learning_execution_authorized: false;
  activation_authority: false;
  integrity_hash: string;
}>;

export type MissionKnowledgeCaptureInput = Readonly<{ scenario?: MissionKnowledgeScenario; contract?: KnowledgeEvolutionContract; capture?: MissionKnowledgeCapturePackage }>;

export type MissionKnowledgeCaptureEngineBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "mission-knowledge-capture-engine/v8ALT.9.2";
    final_state: "MISSION_KNOWLEDGE_CAPTURE_ENGINE_READY";
    capture_states: readonly KnowledgeCaptureState[];
    principles: readonly string[];
  }>;
  capture: MissionKnowledgeCapturePackage;
  validation: MissionKnowledgeCaptureValidationResult;
  observability: MissionKnowledgeCaptureObservabilitySurface;
}>;
