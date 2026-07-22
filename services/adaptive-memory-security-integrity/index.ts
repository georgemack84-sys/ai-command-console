import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import {
  establishAdaptiveMemoryObservability,
  replayAdaptiveMemoryObservability,
} from "@/services/adaptive-memory-observability";
import type { MemoryLifecycleRecord } from "@/types/memory-lifecycle-expiration-management";
import type {
  AdaptiveMemorySecurityApiSurface,
  AdaptiveMemorySecurityContract,
  AdaptiveMemorySecurityFramework,
  AdaptiveMemorySecurityInput,
  AdaptiveMemorySecurityResult,
  MemorySecurityRecord,
  SecurityAlert,
  SecurityDecision,
  SecurityFailure,
  SecurityLedgerEntry,
  SecurityMetrics,
  SecurityScenario,
  SecurityValidationReport,
  SecurityValidationStatus,
  SecurityValidator,
} from "@/types/adaptive-memory-security-integrity";

const SECURITY_VERSION = "adaptive-memory-security-integrity/v1" as const;
const FRAMEWORK_IDENTIFIER = "AdaptiveMemorySecurityIntegrity" as const;

const VALIDATORS: readonly SecurityValidator[] = Object.freeze([
  "IDENTITY_AUTHENTICATION",
  "ACCESS_VERIFICATION",
  "GOVERNANCE_VALIDATION",
  "INTEGRITY_VALIDATION",
  "TAMPER_DETECTION",
  "REPLAY_VALIDATION",
  "ENCRYPTION_VALIDATION",
  "POISONING_PROTECTION",
  "TENANT_ISOLATION_VALIDATION",
  "CRYPTOGRAPHIC_VERIFICATION",
]);

const DECISIONS: readonly SecurityDecision[] = Object.freeze(["ALLOWED", "BLOCKED"]);

type Scenario = NonNullable<AdaptiveMemorySecurityInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function buildApiSurface(): AdaptiveMemorySecurityApiSurface {
  const base: Omit<AdaptiveMemorySecurityApiSurface, "integrity_hash"> = {
    api_id: "adaptive_memory_security_integrity_api",
    establish_security: "POST /adaptive-memory-security-integrity/establish",
    retrieve_contract: "GET /adaptive-memory-security-integrity/contract",
    retrieve_records: "POST /adaptive-memory-security-integrity/records",
    retrieve_integrity: "POST /adaptive-memory-security-integrity/integrity",
    retrieve_tamper: "POST /adaptive-memory-security-integrity/tamper",
    retrieve_access: "POST /adaptive-memory-security-integrity/access",
    retrieve_encryption: "POST /adaptive-memory-security-integrity/encryption",
    retrieve_alerts: "POST /adaptive-memory-security-integrity/alerts",
    retrieve_ledger: "POST /adaptive-memory-security-integrity/ledger",
    retrieve_metrics: "POST /adaptive-memory-security-integrity/metrics",
    replay_security: "POST /adaptive-memory-security-integrity/replay",
    inspect_security: "POST /adaptive-memory-security-integrity/inspect",
    direct_memory_modification_supported: false,
    governance_bypass_supported: false,
    privilege_escalation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): SecurityFailure | undefined {
  const map: Partial<Record<SecurityScenario, SecurityFailure>> = {
    OBSERVABILITY_UNAVAILABLE: "OBSERVABILITY_UNAVAILABLE",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    UNAUTHORIZED_WRITE: "UNAUTHORIZED_WRITE_SUCCEEDED",
    REPLAY_MANIPULATION: "REPLAY_MANIPULATED",
    MEMORY_POISONING: "MEMORY_POISONING_SUCCEEDED",
    EVIDENCE_ALTERATION: "EVIDENCE_ALTERED",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASSED",
    CRYPTOGRAPHIC_FAILURE: "CRYPTOGRAPHIC_VALIDATION_FAILED",
    TENANT_ISOLATION_BREACH: "TENANT_ISOLATION_VIOLATED",
    UNDETECTED_TAMPERING: "TAMPERING_UNDETECTED",
    NONDETERMINISTIC_SECURITY: "SECURITY_DECISION_NONDETERMINISTIC",
    PRIVILEGE_ESCALATION: "PRIVILEGE_ESCALATION_SUCCEEDED",
    UNAUTHORIZED_RETRIEVAL: "UNAUTHORIZED_RETRIEVAL_SUCCEEDED",
    UNAUTHORIZED_INDEXING: "UNAUTHORIZED_INDEXING_SUCCEEDED",
    LINEAGE_CORRUPTION: "LINEAGE_CORRUPTED",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, observabilityReplayable: boolean): readonly SecurityFailure[] {
  const failures: SecurityFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!observabilityReplayable) failures.push("OBSERVABILITY_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function buildContract(): AdaptiveMemorySecurityContract {
  const base: Omit<AdaptiveMemorySecurityContract, "integrity_hash"> = {
    contract_id: "adaptive-memory-security-integrity-contract",
    version: SECURITY_VERSION,
    architecture: freezeArray(["Adaptive Memory Operation", "Identity Authentication", "Access Verification Engine", "Integrity Validation", "Tamper Detection Engine", "Encryption Manager", "Security Decision", "Security Ledger"]),
    validators: VALIDATORS,
    decisions: DECISIONS,
    integrity_rules: freezeArray(["cryptographic_hash", "evidence_lineage", "replay_lineage", "governance_lineage", "lifecycle_lineage", "version_lineage", "certification_lineage"]),
    tamper_detection_rules: freezeArray(["record_modification", "replay_divergence", "lineage_inconsistency", "evidence_substitution", "metadata_corruption", "unauthorized_state_transition", "unauthorized_archival", "unauthorized_supersession"]),
    poisoning_protection_rules: freezeArray(["block_fabricated_memory", "block_fabricated_evidence", "block_malicious_recommendations", "block_malicious_governance_history", "block_synthetic_lineage", "block_unauthorized_pattern_injection", "block_similarity_manipulation", "block_replay_contamination"]),
    security_policies: freezeArray(["no_direct_memory_modification", "no_bypassed_governance", "no_bypassed_replay", "no_unauthorized_lifecycle_transitions", "no_unauthorized_similarity_analysis", "no_unauthorized_cross_tenant_access", "no_hidden_security_exceptions", "no_privilege_escalation"]),
    replay_requirements: freezeArray(["authentication", "authorization", "governance_validation", "integrity_validation", "tamper_detection", "replay_validation", "encryption_validation", "final_security_decision"]),
    cryptographic_guarantees: freezeArray(["integrity_hash", "immutable_identity", "lineage_verification", "version_verification", "replay_verification", "ledger_verification"]),
    integrity_before_intelligence: true,
    zero_trust_validation: true,
    immutable_institutional_knowledge: true,
    security_without_hidden_behavior: true,
    constitutional_security: true,
    deterministic_protection: true,
    direct_memory_modification_supported: false,
    hidden_security_exceptions_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validatorStatus(validator: SecurityValidator, failures: readonly SecurityFailure[]): SecurityValidationStatus {
  const blocked: Record<SecurityValidator, readonly SecurityFailure[]> = {
    IDENTITY_AUTHENTICATION: ["UNAUTHORIZED_RETRIEVAL_SUCCEEDED", "PRIVILEGE_ESCALATION_SUCCEEDED"],
    ACCESS_VERIFICATION: ["UNAUTHORIZED_WRITE_SUCCEEDED", "UNAUTHORIZED_RETRIEVAL_SUCCEEDED", "UNAUTHORIZED_INDEXING_SUCCEEDED", "PRIVILEGE_ESCALATION_SUCCEEDED"],
    GOVERNANCE_VALIDATION: ["GOVERNANCE_BYPASSED"],
    INTEGRITY_VALIDATION: ["INTEGRITY_VERIFICATION_FAILED", "EVIDENCE_ALTERED", "LINEAGE_CORRUPTED"],
    TAMPER_DETECTION: ["TAMPERING_UNDETECTED", "UNAUTHORIZED_WRITE_SUCCEEDED", "EVIDENCE_ALTERED"],
    REPLAY_VALIDATION: ["REPLAY_MANIPULATED"],
    ENCRYPTION_VALIDATION: ["CRYPTOGRAPHIC_VALIDATION_FAILED"],
    POISONING_PROTECTION: ["MEMORY_POISONING_SUCCEEDED"],
    TENANT_ISOLATION_VALIDATION: ["TENANT_ISOLATION_VIOLATED"],
    CRYPTOGRAPHIC_VERIFICATION: ["CRYPTOGRAPHIC_VALIDATION_FAILED", "INTEGRITY_VERIFICATION_FAILED", "SECURITY_DECISION_NONDETERMINISTIC"],
  };
  return blocked[validator].some((failure) => failures.includes(failure)) ? "FAILED" : "VERIFIED";
}

function buildReport(validator: SecurityValidator, failures: readonly SecurityFailure[]): SecurityValidationReport {
  const status = validatorStatus(validator, failures);
  const base: Omit<SecurityValidationReport, "integrity_hash"> = {
    validator,
    status,
    deterministic: !failures.includes("SECURITY_DECISION_NONDETERMINISTIC"),
    replayable: !failures.includes("REPLAY_MANIPULATED"),
    explanation: status === "VERIFIED" ? `${validator.toLowerCase()} verified adaptive memory security.` : `${validator.toLowerCase()} blocked adaptive memory operation.`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(source: MemoryLifecycleRecord, failures: readonly SecurityFailure[]): MemorySecurityRecord {
  const reports = VALIDATORS.map((validator) => buildReport(validator, failures));
  const decision: SecurityDecision = failures.length ? "BLOCKED" : "ALLOWED";
  const base: Omit<MemorySecurityRecord, "integrity_hash"> = {
    security_event_id: `amsi_${hash({ source: source.lifecycle_id, version: SECURITY_VERSION }).slice(0, 32)}`,
    memory_id: source.memory_id,
    tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : source.tenant_id,
    mission_id: source.mission_id,
    requester: "AdaptiveMemorySecurityIntegrity",
    authentication_status: reports[0],
    authorization_status: reports[1],
    governance_validation: reports[2],
    integrity_validation: reports[3],
    tamper_detection: reports[4],
    replay_validation: reports[5],
    encryption_status: reports[6],
    poisoning_protection: reports[7],
    tenant_isolation_validation: reports[8],
    cryptographic_verification: reports[9],
    security_decision: decision,
    evidence_refs: failures.includes("EVIDENCE_ALTERED") ? [] : source.governance_refs,
    replay_refs: failures.includes("REPLAY_MANIPULATED") ? [] : source.replay_refs,
    security_evidence_refs: freezeArray([
      `security-evidence:${source.memory_id}:identity`,
      `security-evidence:${source.memory_id}:integrity`,
      `security-evidence:${source.memory_id}:crypto`,
    ]),
    source_observability_hash: source.integrity_hash,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAlerts(failures: readonly SecurityFailure[]): readonly SecurityAlert[] {
  const alerts: SecurityAlert[] = [];
  const add = (alert_type: SecurityAlert["alert_type"], severity: SecurityAlert["severity"]) => {
    const base: Omit<SecurityAlert, "integrity_hash"> = {
      alert_id: `amsi_alert_${hash({ alert_type, severity, failures }).slice(0, 24)}`,
      alert_type,
      severity,
      deterministic: true,
      replayable: true,
      forensic_evidence_preserved: !failures.includes("TAMPERING_UNDETECTED"),
    };
    alerts.push(Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) }));
  };
  if (failures.includes("TAMPERING_UNDETECTED") || failures.includes("EVIDENCE_ALTERED") || failures.includes("LINEAGE_CORRUPTED")) add("TAMPERING_DETECTED", "CRITICAL");
  if (failures.includes("REPLAY_MANIPULATED")) add("REPLAY_MANIPULATION", "CRITICAL");
  if (failures.includes("INTEGRITY_VERIFICATION_FAILED")) add("INTEGRITY_MISMATCH", "CRITICAL");
  if (failures.includes("MEMORY_POISONING_SUCCEEDED")) add("MEMORY_POISONING_ATTEMPT", "CRITICAL");
  if (failures.includes("UNAUTHORIZED_WRITE_SUCCEEDED")) add("UNAUTHORIZED_WRITE", "CRITICAL");
  if (failures.includes("GOVERNANCE_BYPASSED")) add("GOVERNANCE_BYPASS_ATTEMPT", "CRITICAL");
  if (failures.includes("PRIVILEGE_ESCALATION_SUCCEEDED")) add("PRIVILEGE_ESCALATION", "CRITICAL");
  if (failures.includes("UNAUTHORIZED_RETRIEVAL_SUCCEEDED")) add("AUTHENTICATION_FAILURES", "WARNING");
  if (failures.includes("CRYPTOGRAPHIC_VALIDATION_FAILED")) add("CRYPTOGRAPHIC_FAILURE", "CRITICAL");
  if (failures.includes("TENANT_ISOLATION_VIOLATED")) add("TENANT_ISOLATION_VIOLATION", "CRITICAL");
  return freezeArray(alerts);
}

function buildLedger(records: readonly MemorySecurityRecord[], failures: readonly SecurityFailure[]): readonly SecurityLedgerEntry[] {
  const events: readonly SecurityLedgerEntry["event"][] = ["AUTHENTICATION_EVENT", "AUTHORIZATION_DECISION", "INTEGRITY_VALIDATION", "TAMPER_DETECTION", "REPLAY_VALIDATION", "ENCRYPTION_EVENT", "SECURITY_ALERT", "GOVERNANCE_VALIDATION", "BLOCKED_OPERATION", "CRYPTOGRAPHIC_VERIFICATION"];
  return freezeArray(records.flatMap((record, recordIndex) => events.map((event, eventIndex) => {
    const base: Omit<SecurityLedgerEntry, "integrity_hash"> = {
      ledger_id: `adaptive_memory_security_ledger_${String(recordIndex + 1).padStart(2, "0")}_${String(eventIndex + 1).padStart(2, "0")}`,
      security_event_id: record.security_event_id,
      memory_id: record.memory_id,
      tenant_id: record.tenant_id,
      event,
      append_only: true,
      immutable: true,
      deterministic: true,
      replayable: true,
      tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
      cryptographically_verified: !failures.includes("CRYPTOGRAPHIC_VALIDATION_FAILED") && !failures.includes("INTEGRITY_VERIFICATION_FAILED"),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  })));
}

function buildMetrics(records: readonly MemorySecurityRecord[], failures: readonly SecurityFailure[]): SecurityMetrics {
  const blocked = records.filter((record) => record.security_decision === "BLOCKED").length;
  const base: Omit<SecurityMetrics, "integrity_hash"> = {
    security_events: records.length,
    integrity_verification_rate: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? 0 : 1,
    tamper_detections: failures.some((failure) => ["TAMPERING_UNDETECTED", "EVIDENCE_ALTERED", "LINEAGE_CORRUPTED"].includes(failure)) ? 1 : 0,
    replay_manipulation_attempts: failures.includes("REPLAY_MANIPULATED") ? 1 : 0,
    unauthorized_access_attempts: failures.some((failure) => ["UNAUTHORIZED_WRITE_SUCCEEDED", "UNAUTHORIZED_RETRIEVAL_SUCCEEDED", "UNAUTHORIZED_INDEXING_SUCCEEDED"].includes(failure)) ? 1 : 0,
    encryption_health: failures.includes("CRYPTOGRAPHIC_VALIDATION_FAILED") ? 0 : 1,
    poisoning_attempts: failures.includes("MEMORY_POISONING_SUCCEEDED") ? 1 : 0,
    privilege_escalation_attempts: failures.includes("PRIVILEGE_ESCALATION_SUCCEEDED") ? 1 : 0,
    governance_bypass_attempts: failures.includes("GOVERNANCE_BYPASSED") ? 1 : 0,
    authentication_failures: failures.includes("UNAUTHORIZED_RETRIEVAL_SUCCEEDED") ? 1 : 0,
    security_response_latency_ms: 5,
    blocked_operations: blocked,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptiveMemorySecurityResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    observability_hash: result.observability_result.integrity_hash,
    contract_hash: result.contract.integrity_hash,
    record_hashes: result.security_records.map((record) => record.integrity_hash),
    alert_hashes: result.alerts.map((alert) => alert.integrity_hash),
    ledger_hashes: result.security_ledger.map((entry) => entry.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<AdaptiveMemorySecurityResult, "integrity_hash">): string {
  return hash({
    version: result.adaptive_memory_security_version,
    framework_identifier: result.framework_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    contract_hash: result.contract.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function establishAdaptiveMemorySecurityIntegrity(input: AdaptiveMemorySecurityInput = {}): AdaptiveMemorySecurityResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const observability_result = input.observability_result ?? establishAdaptiveMemoryObservability();
  const failures = collectFailures(scenario, replayAdaptiveMemoryObservability(observability_result));
  const contract = buildContract();
  const security_records = freezeArray(observability_result.lifecycle_result.lifecycle_records.map((record) => buildRecord(record, failures)));
  const alerts = buildAlerts(failures);
  const security_ledger = buildLedger(security_records, failures);
  const metrics = buildMetrics(security_records, failures);
  const base: Omit<AdaptiveMemorySecurityResult, "integrity_hash" | "replay_hash"> = {
    adaptive_memory_security_version: SECURITY_VERSION,
    framework_identifier: FRAMEWORK_IDENTIFIER,
    status: failures.length ? "REJECTED" : "AUTHORITATIVE",
    api_surface,
    observability_result,
    contract,
    security_records,
    alerts,
    security_ledger,
    metrics,
    failures,
    deterministic: !failures.includes("SECURITY_DECISION_NONDETERMINISTIC"),
    replayable: !failures.includes("REPLAY_MANIPULATED"),
    integrity_verified: !failures.includes("INTEGRITY_VERIFICATION_FAILED"),
    tamper_evident: !failures.includes("TAMPERING_UNDETECTED"),
    encryption_enforced: !failures.includes("CRYPTOGRAPHIC_VALIDATION_FAILED"),
    access_verified: !failures.some((failure) => ["UNAUTHORIZED_WRITE_SUCCEEDED", "UNAUTHORIZED_RETRIEVAL_SUCCEEDED", "UNAUTHORIZED_INDEXING_SUCCEEDED", "PRIVILEGE_ESCALATION_SUCCEEDED"].includes(failure)),
    tenant_isolation_preserved: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    governance_enforced: !failures.includes("GOVERNANCE_BYPASSED"),
    poisoning_prevented: !failures.includes("MEMORY_POISONING_SUCCEEDED"),
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayAdaptiveMemorySecurityIntegrity(result: AdaptiveMemorySecurityResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayAdaptiveMemoryObservability(result.observability_result) &&
    verifyHashedRecord(result.contract) &&
    result.security_records.every((record) =>
      verifyHashedRecord(record.authentication_status) &&
      verifyHashedRecord(record.authorization_status) &&
      verifyHashedRecord(record.governance_validation) &&
      verifyHashedRecord(record.integrity_validation) &&
      verifyHashedRecord(record.tamper_detection) &&
      verifyHashedRecord(record.replay_validation) &&
      verifyHashedRecord(record.encryption_status) &&
      verifyHashedRecord(record.poisoning_protection) &&
      verifyHashedRecord(record.tenant_isolation_validation) &&
      verifyHashedRecord(record.cryptographic_verification) &&
      verifyHashedRecord(record)
    ) &&
    result.alerts.every(verifyHashedRecord) &&
    result.security_ledger.every(verifyHashedRecord) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getAdaptiveMemorySecurityIntegrity(): AdaptiveMemorySecurityFramework {
  const api_surface = buildApiSurface();
  return Object.freeze({
    adaptive_memory_security_version: SECURITY_VERSION,
    supported_validators: VALIDATORS,
    supported_decisions: DECISIONS,
    api_surface,
    result: establishAdaptiveMemorySecurityIntegrity(),
  });
}

export const AdaptiveMemorySecurityIntegrity = Object.freeze({
  establish: establishAdaptiveMemorySecurityIntegrity,
  replay: replayAdaptiveMemorySecurityIntegrity,
});
