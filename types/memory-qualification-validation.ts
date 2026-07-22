import type { CrossMissionSimilarityResult, MissionSimilarityRecord } from "@/types/cross-mission-similarity-engine";

export type MemoryQualificationFrameworkStatus = "AUTHORITATIVE" | "REJECTED";

export type QualificationStatus =
  | "QUALIFIED"
  | "CONDITIONALLY_QUALIFIED"
  | "REJECTED"
  | "PENDING_GOVERNANCE"
  | "PENDING_CERTIFICATION";

export type QualificationWorkflowState =
  | "CANDIDATE"
  | "UNDER_REVIEW"
  | "EVIDENCE_VERIFIED"
  | "REPLAY_VERIFIED"
  | "GOVERNANCE_APPROVED"
  | "QUALIFIED"
  | "REGISTERED"
  | "REJECTED"
  | "PENDING_ADDITIONAL_EVIDENCE";

export type ValidationEngine =
  | "EVIDENCE_VALIDATION"
  | "REPLAY_VALIDATION"
  | "GOVERNANCE_VALIDATION"
  | "CONFIDENCE_VALIDATION"
  | "CERTIFICATION_VALIDATION"
  | "INTEGRITY_VERIFICATION";

export type MemoryQualificationFailure =
  | "SIMILARITY_ENGINE_UNAVAILABLE"
  | "UNQUALIFIED_MEMORY_APPROVED"
  | "QUALIFIED_MEMORY_LACKS_EVIDENCE"
  | "REPLAY_UNAVAILABLE"
  | "GOVERNANCE_BYPASSED"
  | "CERTIFICATION_IGNORED"
  | "CONFIDENCE_VALIDATION_OMITTED"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "TENANT_ISOLATION_VIOLATED"
  | "DETERMINISTIC_QUALIFICATION_FAILED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "CONSTITUTIONAL_VIOLATION"
  | "UNAUTHORIZED_SOURCE"
  | "DUPLICATE_MEMORY_DETECTED";

export type MemoryQualificationScenario =
  | "BASELINE"
  | "SIMILARITY_ENGINE_UNAVAILABLE"
  | "UNQUALIFIED_APPROVED"
  | "MISSING_EVIDENCE"
  | "REPLAY_UNAVAILABLE"
  | "GOVERNANCE_BYPASS"
  | "CERTIFICATION_IGNORED"
  | "CONFIDENCE_OMITTED"
  | "INCOMPLETE_EVIDENCE_LINEAGE"
  | "TENANT_BREACH"
  | "NONDETERMINISTIC_QUALIFICATION"
  | "INTEGRITY_FAILURE"
  | "CONSTITUTIONAL_VIOLATION"
  | "UNAUTHORIZED_SOURCE"
  | "DUPLICATE_MEMORY";

export type ValidationReport = Readonly<{
  engine: ValidationEngine;
  complete: boolean;
  deterministic: boolean;
  governance_compliant: boolean;
  replayable: boolean;
  score: number;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  certification_refs: readonly string[];
  integrity_hash: string;
}>;

export type MemoryQualificationRecord = Readonly<{
  qualification_id: string;
  memory_id: string;
  tenant_id: string;
  mission_id: string;
  qualification_status: QualificationStatus;
  workflow_state: QualificationWorkflowState;
  evidence_validation: ValidationReport;
  replay_validation: ValidationReport;
  governance_validation: ValidationReport;
  confidence_validation: ValidationReport;
  certification_validation: ValidationReport;
  qualification_score: number;
  validation_timestamp: string;
  reviewer: "MemoryQualificationEngine";
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  source_similarity_hash: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type QualificationLedgerEntry = Readonly<{
  ledger_id: string;
  qualification_id: string;
  memory_id: string;
  tenant_id: string;
  event:
    | "QUALIFICATION_REQUEST"
    | "EVIDENCE_VALIDATION"
    | "REPLAY_VALIDATION"
    | "GOVERNANCE_APPROVAL"
    | "CONFIDENCE_VALIDATION"
    | "CERTIFICATION_VALIDATION"
    | "QUALIFICATION_DECISION"
    | "REJECTION_REASON"
    | "APPROVAL_HISTORY"
    | "INTEGRITY_VERIFICATION";
  append_only: true;
  immutable: true;
  deterministic: true;
  replayable: true;
  tenant_isolated: boolean;
  cryptographically_verified: boolean;
  integrity_hash: string;
}>;

export type MemoryQualificationContract = Readonly<{
  contract_id: "memory-qualification-validation-contract";
  version: "memory-qualification-validation/v1";
  architecture: readonly string[];
  validation_engines: readonly ValidationEngine[];
  qualification_statuses: readonly QualificationStatus[];
  workflow_states: readonly QualificationWorkflowState[];
  qualification_rules: readonly string[];
  rejection_rules: readonly string[];
  security_requirements: readonly string[];
  replay_requirements: readonly string[];
  quality_gate: true;
  qualification_before_memory: true;
  advisory_only: true;
  execution_authority_supported: false;
  unqualified_registration_supported: false;
  integrity_hash: string;
}>;

export type MemoryQualificationMetrics = Readonly<{
  qualification_requests: number;
  qualification_success_rate: number;
  qualification_failures: number;
  evidence_validation_failures: number;
  replay_failures: number;
  governance_rejections: number;
  confidence_validation_failures: number;
  certification_failures: number;
  qualification_latency_ms: number;
  replay_success_rate: number;
  failures: readonly MemoryQualificationFailure[];
  integrity_hash: string;
}>;

export type MemoryQualificationApiSurface = Readonly<{
  api_id: string;
  establish_framework: "POST /memory-qualification-validation/establish";
  retrieve_contract: "GET /memory-qualification-validation/contract";
  retrieve_records: "POST /memory-qualification-validation/records";
  retrieve_evidence_validation: "POST /memory-qualification-validation/evidence";
  retrieve_replay_validation: "POST /memory-qualification-validation/replay";
  retrieve_governance_validation: "POST /memory-qualification-validation/governance";
  retrieve_confidence_validation: "POST /memory-qualification-validation/confidence";
  retrieve_certification_validation: "POST /memory-qualification-validation/certification";
  retrieve_ledger: "POST /memory-qualification-validation/ledger";
  retrieve_metrics: "POST /memory-qualification-validation/metrics";
  replay_framework: "POST /memory-qualification-validation/replay";
  inspect_framework: "POST /memory-qualification-validation/inspect";
  unqualified_registration_supported: false;
  execution_authority_supported: false;
  governance_bypass_supported: false;
  integrity_hash: string;
}>;

export type MemoryQualificationInput = Readonly<{
  scenario?: MemoryQualificationScenario;
  similarity_result?: CrossMissionSimilarityResult;
}>;

export type MemoryQualificationResult = Readonly<{
  memory_qualification_version: "memory-qualification-validation/v1";
  framework_identifier: "MemoryQualificationValidation";
  status: MemoryQualificationFrameworkStatus;
  api_surface: MemoryQualificationApiSurface;
  similarity_result: CrossMissionSimilarityResult;
  contract: MemoryQualificationContract;
  source_similarity_records: readonly MissionSimilarityRecord[];
  qualification_records: readonly MemoryQualificationRecord[];
  qualification_ledger: readonly QualificationLedgerEntry[];
  metrics: MemoryQualificationMetrics;
  failures: readonly MemoryQualificationFailure[];
  deterministic: boolean;
  replayable: boolean;
  governed: boolean;
  tenant_isolated: boolean;
  evidence_lineage_preserved: boolean;
  qualified_memory_approved: boolean;
  invalid_memory_rejected: boolean;
  advisory_only: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type MemoryQualificationFramework = Readonly<{
  memory_qualification_version: "memory-qualification-validation/v1";
  supported_validation_engines: readonly ValidationEngine[];
  supported_statuses: readonly QualificationStatus[];
  api_surface: MemoryQualificationApiSurface;
  result: MemoryQualificationResult;
}>;
