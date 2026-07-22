import type { AdaptiveMemoryObservabilityResult } from "@/types/adaptive-memory-observability";

export type AdaptiveMemorySecurityStatus = "AUTHORITATIVE" | "REJECTED";

export type SecurityDecision = "ALLOWED" | "BLOCKED";

export type SecurityValidationStatus = "VERIFIED" | "FAILED";

export type SecurityValidator =
  | "IDENTITY_AUTHENTICATION"
  | "ACCESS_VERIFICATION"
  | "GOVERNANCE_VALIDATION"
  | "INTEGRITY_VALIDATION"
  | "TAMPER_DETECTION"
  | "REPLAY_VALIDATION"
  | "ENCRYPTION_VALIDATION"
  | "POISONING_PROTECTION"
  | "TENANT_ISOLATION_VALIDATION"
  | "CRYPTOGRAPHIC_VERIFICATION";

export type SecurityFailure =
  | "OBSERVABILITY_UNAVAILABLE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "UNAUTHORIZED_WRITE_SUCCEEDED"
  | "REPLAY_MANIPULATED"
  | "MEMORY_POISONING_SUCCEEDED"
  | "EVIDENCE_ALTERED"
  | "GOVERNANCE_BYPASSED"
  | "CRYPTOGRAPHIC_VALIDATION_FAILED"
  | "TENANT_ISOLATION_VIOLATED"
  | "TAMPERING_UNDETECTED"
  | "SECURITY_DECISION_NONDETERMINISTIC"
  | "PRIVILEGE_ESCALATION_SUCCEEDED"
  | "UNAUTHORIZED_RETRIEVAL_SUCCEEDED"
  | "UNAUTHORIZED_INDEXING_SUCCEEDED"
  | "LINEAGE_CORRUPTED";

export type SecurityScenario =
  | "BASELINE"
  | "OBSERVABILITY_UNAVAILABLE"
  | "INTEGRITY_FAILURE"
  | "UNAUTHORIZED_WRITE"
  | "REPLAY_MANIPULATION"
  | "MEMORY_POISONING"
  | "EVIDENCE_ALTERATION"
  | "GOVERNANCE_BYPASS"
  | "CRYPTOGRAPHIC_FAILURE"
  | "TENANT_ISOLATION_BREACH"
  | "UNDETECTED_TAMPERING"
  | "NONDETERMINISTIC_SECURITY"
  | "PRIVILEGE_ESCALATION"
  | "UNAUTHORIZED_RETRIEVAL"
  | "UNAUTHORIZED_INDEXING"
  | "LINEAGE_CORRUPTION";

export type SecurityValidationReport = Readonly<{
  validator: SecurityValidator;
  status: SecurityValidationStatus;
  deterministic: boolean;
  replayable: boolean;
  explanation: string;
  integrity_hash: string;
}>;

export type MemorySecurityRecord = Readonly<{
  security_event_id: string;
  memory_id: string;
  tenant_id: string;
  mission_id: string;
  requester: "AdaptiveMemorySecurityIntegrity";
  authentication_status: SecurityValidationReport;
  authorization_status: SecurityValidationReport;
  integrity_validation: SecurityValidationReport;
  tamper_detection: SecurityValidationReport;
  replay_validation: SecurityValidationReport;
  encryption_status: SecurityValidationReport;
  governance_validation: SecurityValidationReport;
  poisoning_protection: SecurityValidationReport;
  tenant_isolation_validation: SecurityValidationReport;
  cryptographic_verification: SecurityValidationReport;
  security_decision: SecurityDecision;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  security_evidence_refs: readonly string[];
  source_observability_hash: string;
  integrity_hash: string;
}>;

export type SecurityAlert = Readonly<{
  alert_id: string;
  alert_type:
    | "TAMPERING_DETECTED"
    | "REPLAY_MANIPULATION"
    | "INTEGRITY_MISMATCH"
    | "MEMORY_POISONING_ATTEMPT"
    | "UNAUTHORIZED_WRITE"
    | "GOVERNANCE_BYPASS_ATTEMPT"
    | "PRIVILEGE_ESCALATION"
    | "AUTHENTICATION_FAILURES"
    | "CRYPTOGRAPHIC_FAILURE"
    | "TENANT_ISOLATION_VIOLATION";
  severity: "INFO" | "WARNING" | "CRITICAL";
  deterministic: true;
  replayable: true;
  forensic_evidence_preserved: boolean;
  integrity_hash: string;
}>;

export type SecurityLedgerEntry = Readonly<{
  ledger_id: string;
  security_event_id: string;
  memory_id: string;
  tenant_id: string;
  event:
    | "AUTHENTICATION_EVENT"
    | "AUTHORIZATION_DECISION"
    | "INTEGRITY_VALIDATION"
    | "TAMPER_DETECTION"
    | "REPLAY_VALIDATION"
    | "ENCRYPTION_EVENT"
    | "SECURITY_ALERT"
    | "GOVERNANCE_VALIDATION"
    | "BLOCKED_OPERATION"
    | "CRYPTOGRAPHIC_VERIFICATION";
  append_only: true;
  immutable: true;
  deterministic: true;
  replayable: true;
  tenant_isolated: boolean;
  cryptographically_verified: boolean;
  integrity_hash: string;
}>;

export type AdaptiveMemorySecurityContract = Readonly<{
  contract_id: "adaptive-memory-security-integrity-contract";
  version: "adaptive-memory-security-integrity/v1";
  architecture: readonly string[];
  validators: readonly SecurityValidator[];
  decisions: readonly SecurityDecision[];
  integrity_rules: readonly string[];
  tamper_detection_rules: readonly string[];
  poisoning_protection_rules: readonly string[];
  security_policies: readonly string[];
  replay_requirements: readonly string[];
  cryptographic_guarantees: readonly string[];
  integrity_before_intelligence: true;
  zero_trust_validation: true;
  immutable_institutional_knowledge: true;
  security_without_hidden_behavior: true;
  constitutional_security: true;
  deterministic_protection: true;
  direct_memory_modification_supported: false;
  hidden_security_exceptions_supported: false;
  integrity_hash: string;
}>;

export type SecurityMetrics = Readonly<{
  security_events: number;
  integrity_verification_rate: number;
  tamper_detections: number;
  replay_manipulation_attempts: number;
  unauthorized_access_attempts: number;
  encryption_health: number;
  poisoning_attempts: number;
  privilege_escalation_attempts: number;
  governance_bypass_attempts: number;
  authentication_failures: number;
  security_response_latency_ms: number;
  blocked_operations: number;
  failures: readonly SecurityFailure[];
  integrity_hash: string;
}>;

export type AdaptiveMemorySecurityApiSurface = Readonly<{
  api_id: string;
  establish_security: "POST /adaptive-memory-security-integrity/establish";
  retrieve_contract: "GET /adaptive-memory-security-integrity/contract";
  retrieve_records: "POST /adaptive-memory-security-integrity/records";
  retrieve_integrity: "POST /adaptive-memory-security-integrity/integrity";
  retrieve_tamper: "POST /adaptive-memory-security-integrity/tamper";
  retrieve_access: "POST /adaptive-memory-security-integrity/access";
  retrieve_encryption: "POST /adaptive-memory-security-integrity/encryption";
  retrieve_alerts: "POST /adaptive-memory-security-integrity/alerts";
  retrieve_ledger: "POST /adaptive-memory-security-integrity/ledger";
  retrieve_metrics: "POST /adaptive-memory-security-integrity/metrics";
  replay_security: "POST /adaptive-memory-security-integrity/replay";
  inspect_security: "POST /adaptive-memory-security-integrity/inspect";
  direct_memory_modification_supported: false;
  governance_bypass_supported: false;
  privilege_escalation_supported: false;
  integrity_hash: string;
}>;

export type AdaptiveMemorySecurityInput = Readonly<{
  scenario?: SecurityScenario;
  observability_result?: AdaptiveMemoryObservabilityResult;
}>;

export type AdaptiveMemorySecurityResult = Readonly<{
  adaptive_memory_security_version: "adaptive-memory-security-integrity/v1";
  framework_identifier: "AdaptiveMemorySecurityIntegrity";
  status: AdaptiveMemorySecurityStatus;
  api_surface: AdaptiveMemorySecurityApiSurface;
  observability_result: AdaptiveMemoryObservabilityResult;
  contract: AdaptiveMemorySecurityContract;
  security_records: readonly MemorySecurityRecord[];
  alerts: readonly SecurityAlert[];
  security_ledger: readonly SecurityLedgerEntry[];
  metrics: SecurityMetrics;
  failures: readonly SecurityFailure[];
  deterministic: boolean;
  replayable: boolean;
  integrity_verified: boolean;
  tamper_evident: boolean;
  encryption_enforced: boolean;
  access_verified: boolean;
  tenant_isolation_preserved: boolean;
  governance_enforced: boolean;
  poisoning_prevented: boolean;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptiveMemorySecurityFramework = Readonly<{
  adaptive_memory_security_version: "adaptive-memory-security-integrity/v1";
  supported_validators: readonly SecurityValidator[];
  supported_decisions: readonly SecurityDecision[];
  api_surface: AdaptiveMemorySecurityApiSurface;
  result: AdaptiveMemorySecurityResult;
}>;
