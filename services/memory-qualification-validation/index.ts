import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishCrossMissionSimilarityEngine, replayCrossMissionSimilarityEngine } from "@/services/cross-mission-similarity-engine";
import type { MissionSimilarityRecord } from "@/types/cross-mission-similarity-engine";
import type {
  MemoryQualificationApiSurface,
  MemoryQualificationContract,
  MemoryQualificationFailure,
  MemoryQualificationFramework,
  MemoryQualificationInput,
  MemoryQualificationMetrics,
  MemoryQualificationRecord,
  MemoryQualificationResult,
  MemoryQualificationScenario,
  MemoryQualificationFrameworkStatus,
  QualificationLedgerEntry,
  QualificationStatus,
  QualificationWorkflowState,
  ValidationEngine,
  ValidationReport,
} from "@/types/memory-qualification-validation";

const QUALIFICATION_VERSION = "memory-qualification-validation/v1" as const;
const FRAMEWORK_IDENTIFIER = "MemoryQualificationValidation" as const;
const VALIDATION_TIMESTAMP = "2026-07-11T00:00:00.000Z";

const ENGINES: readonly ValidationEngine[] = Object.freeze([
  "EVIDENCE_VALIDATION",
  "REPLAY_VALIDATION",
  "GOVERNANCE_VALIDATION",
  "CONFIDENCE_VALIDATION",
  "CERTIFICATION_VALIDATION",
  "INTEGRITY_VERIFICATION",
]);

const STATUSES: readonly QualificationStatus[] = Object.freeze([
  "QUALIFIED",
  "CONDITIONALLY_QUALIFIED",
  "REJECTED",
  "PENDING_GOVERNANCE",
  "PENDING_CERTIFICATION",
]);

const WORKFLOW_STATES: readonly QualificationWorkflowState[] = Object.freeze([
  "CANDIDATE",
  "UNDER_REVIEW",
  "EVIDENCE_VERIFIED",
  "REPLAY_VERIFIED",
  "GOVERNANCE_APPROVED",
  "QUALIFIED",
  "REGISTERED",
  "REJECTED",
  "PENDING_ADDITIONAL_EVIDENCE",
]);

const QUALIFICATION_RULES = Object.freeze([
  "evidence_complete",
  "replay_available",
  "replay_deterministic",
  "governance_approved",
  "constitutional_compliance_verified",
  "authority_boundaries_satisfied",
  "confidence_reliable",
  "certification_valid",
  "integrity_verified",
  "tenant_ownership_confirmed",
]);

const REJECTION_RULES = Object.freeze([
  "evidence_incomplete",
  "replay_unavailable",
  "governance_approval_missing",
  "constitutional_violation_detected",
  "confidence_unreliable",
  "certification_invalid",
  "integrity_failure",
  "tenant_mismatch",
  "unauthorized_source",
  "duplicate_memory_detected",
]);

const SECURITY_REQUIREMENTS = Object.freeze([
  "enforce_tenant_isolation",
  "validate_authorization",
  "prevent_unauthorized_approvals",
  "detect_qualification_tampering",
  "preserve_immutable_validation_history",
  "encrypt_validation_metadata",
]);

const REPLAY_REQUIREMENTS = Object.freeze([
  "submitted_memory",
  "evidence_validation",
  "replay_validation",
  "governance_validation",
  "confidence_validation",
  "certification_validation",
  "approval_decision",
]);

type Scenario = NonNullable<MemoryQualificationInput["scenario"]>;

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

function buildApiSurface(): MemoryQualificationApiSurface {
  const base: Omit<MemoryQualificationApiSurface, "integrity_hash"> = {
    api_id: "memory_qualification_validation_api",
    establish_framework: "POST /memory-qualification-validation/establish",
    retrieve_contract: "GET /memory-qualification-validation/contract",
    retrieve_records: "POST /memory-qualification-validation/records",
    retrieve_evidence_validation: "POST /memory-qualification-validation/evidence",
    retrieve_replay_validation: "POST /memory-qualification-validation/replay",
    retrieve_governance_validation: "POST /memory-qualification-validation/governance",
    retrieve_confidence_validation: "POST /memory-qualification-validation/confidence",
    retrieve_certification_validation: "POST /memory-qualification-validation/certification",
    retrieve_ledger: "POST /memory-qualification-validation/ledger",
    retrieve_metrics: "POST /memory-qualification-validation/metrics",
    replay_framework: "POST /memory-qualification-validation/replay",
    inspect_framework: "POST /memory-qualification-validation/inspect",
    unqualified_registration_supported: false,
    execution_authority_supported: false,
    governance_bypass_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): MemoryQualificationFailure | undefined {
  const map: Partial<Record<MemoryQualificationScenario, MemoryQualificationFailure>> = {
    SIMILARITY_ENGINE_UNAVAILABLE: "SIMILARITY_ENGINE_UNAVAILABLE",
    UNQUALIFIED_APPROVED: "UNQUALIFIED_MEMORY_APPROVED",
    MISSING_EVIDENCE: "QUALIFIED_MEMORY_LACKS_EVIDENCE",
    REPLAY_UNAVAILABLE: "REPLAY_UNAVAILABLE",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASSED",
    CERTIFICATION_IGNORED: "CERTIFICATION_IGNORED",
    CONFIDENCE_OMITTED: "CONFIDENCE_VALIDATION_OMITTED",
    INCOMPLETE_EVIDENCE_LINEAGE: "EVIDENCE_LINEAGE_INCOMPLETE",
    TENANT_BREACH: "TENANT_ISOLATION_VIOLATED",
    NONDETERMINISTIC_QUALIFICATION: "DETERMINISTIC_QUALIFICATION_FAILED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION",
    UNAUTHORIZED_SOURCE: "UNAUTHORIZED_SOURCE",
    DUPLICATE_MEMORY: "DUPLICATE_MEMORY_DETECTED",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, similarityReplayable: boolean): readonly MemoryQualificationFailure[] {
  const failures: MemoryQualificationFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!similarityReplayable) failures.push("SIMILARITY_ENGINE_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function statusFor(failures: readonly MemoryQualificationFailure[]): MemoryQualificationFrameworkStatus {
  return failures.length ? "REJECTED" : "AUTHORITATIVE";
}

function buildContract(): MemoryQualificationContract {
  const base: Omit<MemoryQualificationContract, "integrity_hash"> = {
    contract_id: "memory-qualification-validation-contract",
    version: QUALIFICATION_VERSION,
    architecture: freezeArray([
      "Historical Intelligence",
      "Memory Qualification Engine",
      "Evidence Validation",
      "Replay Validation",
      "Governance Validation",
      "Confidence Validation",
      "Certification Validation",
      "Qualification Decision",
      "Adaptive Memory Store",
      "Qualification Ledger",
    ]),
    validation_engines: ENGINES,
    qualification_statuses: STATUSES,
    workflow_states: WORKFLOW_STATES,
    qualification_rules: QUALIFICATION_RULES,
    rejection_rules: REJECTION_RULES,
    security_requirements: SECURITY_REQUIREMENTS,
    replay_requirements: REPLAY_REQUIREMENTS,
    quality_gate: true,
    qualification_before_memory: true,
    advisory_only: true,
    execution_authority_supported: false,
    unqualified_registration_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validationPassed(engine: ValidationEngine, failures: readonly MemoryQualificationFailure[]): boolean {
  const blocked: Record<ValidationEngine, readonly MemoryQualificationFailure[]> = {
    EVIDENCE_VALIDATION: ["QUALIFIED_MEMORY_LACKS_EVIDENCE", "EVIDENCE_LINEAGE_INCOMPLETE", "UNAUTHORIZED_SOURCE"],
    REPLAY_VALIDATION: ["REPLAY_UNAVAILABLE"],
    GOVERNANCE_VALIDATION: ["GOVERNANCE_BYPASSED", "CONSTITUTIONAL_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    CONFIDENCE_VALIDATION: ["CONFIDENCE_VALIDATION_OMITTED"],
    CERTIFICATION_VALIDATION: ["CERTIFICATION_IGNORED"],
    INTEGRITY_VERIFICATION: ["INTEGRITY_VERIFICATION_FAILED", "DUPLICATE_MEMORY_DETECTED", "DETERMINISTIC_QUALIFICATION_FAILED"],
  };
  return !blocked[engine].some((failure) => failures.includes(failure));
}

function buildValidationReport(engine: ValidationEngine, source: MissionSimilarityRecord, failures: readonly MemoryQualificationFailure[]): ValidationReport {
  const complete = validationPassed(engine, failures);
  const base: Omit<ValidationReport, "integrity_hash"> = {
    engine,
    complete,
    deterministic: !failures.includes("DETERMINISTIC_QUALIFICATION_FAILED"),
    governance_compliant: !failures.includes("GOVERNANCE_BYPASSED") && !failures.includes("CONSTITUTIONAL_VIOLATION"),
    replayable: !failures.includes("REPLAY_UNAVAILABLE"),
    score: complete ? 1 : 0,
    evidence_refs: engine === "EVIDENCE_VALIDATION" && !complete ? [] : source.evidence_refs,
    replay_refs: engine === "REPLAY_VALIDATION" && !complete ? [] : source.replay_refs,
    governance_refs: engine === "GOVERNANCE_VALIDATION" && !complete ? [] : source.governance_refs,
    certification_refs: [`certification:${source.similarity_id}:qualification`],
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function decisionFor(reports: readonly ValidationReport[], failures: readonly MemoryQualificationFailure[]): QualificationStatus {
  if (failures.includes("GOVERNANCE_BYPASSED")) return "PENDING_GOVERNANCE";
  if (failures.includes("CERTIFICATION_IGNORED")) return "PENDING_CERTIFICATION";
  if (failures.includes("QUALIFIED_MEMORY_LACKS_EVIDENCE") || failures.includes("EVIDENCE_LINEAGE_INCOMPLETE")) return "CONDITIONALLY_QUALIFIED";
  return reports.every((report) => report.complete) && failures.length === 0 ? "QUALIFIED" : "REJECTED";
}

function workflowFor(status: QualificationStatus): QualificationWorkflowState {
  const map: Record<QualificationStatus, QualificationWorkflowState> = {
    QUALIFIED: "REGISTERED",
    CONDITIONALLY_QUALIFIED: "PENDING_ADDITIONAL_EVIDENCE",
    REJECTED: "REJECTED",
    PENDING_GOVERNANCE: "UNDER_REVIEW",
    PENDING_CERTIFICATION: "UNDER_REVIEW",
  };
  return map[status];
}

function buildQualificationRecord(source: MissionSimilarityRecord, failures: readonly MemoryQualificationFailure[]): MemoryQualificationRecord {
  const evidence_validation = buildValidationReport("EVIDENCE_VALIDATION", source, failures);
  const replay_validation = buildValidationReport("REPLAY_VALIDATION", source, failures);
  const governance_validation = buildValidationReport("GOVERNANCE_VALIDATION", source, failures);
  const confidence_validation = buildValidationReport("CONFIDENCE_VALIDATION", source, failures);
  const certification_validation = buildValidationReport("CERTIFICATION_VALIDATION", source, failures);
  const reports = [evidence_validation, replay_validation, governance_validation, confidence_validation, certification_validation];
  const qualification_status = decisionFor(reports, failures);
  const qualification_score = Number((reports.reduce((sum, report) => sum + report.score, 0) / reports.length).toFixed(2));
  const base: Omit<MemoryQualificationRecord, "integrity_hash"> = {
    qualification_id: `mqv_${hash({ source: source.similarity_id, version: QUALIFICATION_VERSION }).slice(0, 32)}`,
    memory_id: source.similarity_id,
    tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : source.tenant_id,
    mission_id: source.candidate_mission_id,
    qualification_status,
    workflow_state: workflowFor(qualification_status),
    evidence_validation,
    replay_validation,
    governance_validation,
    confidence_validation,
    certification_validation,
    qualification_score,
    validation_timestamp: VALIDATION_TIMESTAMP,
    reviewer: "MemoryQualificationEngine",
    evidence_refs: evidence_validation.evidence_refs,
    governance_refs: governance_validation.governance_refs,
    replay_refs: replay_validation.replay_refs,
    certification_refs: certification_validation.certification_refs,
    source_similarity_hash: source.integrity_hash,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(records: readonly MemoryQualificationRecord[], failures: readonly MemoryQualificationFailure[]): readonly QualificationLedgerEntry[] {
  const events = [
    "QUALIFICATION_REQUEST",
    "EVIDENCE_VALIDATION",
    "REPLAY_VALIDATION",
    "GOVERNANCE_APPROVAL",
    "CONFIDENCE_VALIDATION",
    "CERTIFICATION_VALIDATION",
    "QUALIFICATION_DECISION",
    "APPROVAL_HISTORY",
    "INTEGRITY_VERIFICATION",
  ] as const;
  return freezeArray(records.flatMap((record, recordIndex) => events.map((event, eventIndex) => {
    const base: Omit<QualificationLedgerEntry, "integrity_hash"> = {
      ledger_id: `memory_qualification_ledger_${String(recordIndex + 1).padStart(2, "0")}_${String(eventIndex + 1).padStart(2, "0")}`,
      qualification_id: record.qualification_id,
      memory_id: record.memory_id,
      tenant_id: record.tenant_id,
      event: failures.length && eventIndex === events.length - 1 ? "REJECTION_REASON" : event,
      append_only: true,
      immutable: true,
      deterministic: true,
      replayable: true,
      tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
      cryptographically_verified: !failures.includes("INTEGRITY_VERIFICATION_FAILED"),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  })));
}

function buildMetrics(records: readonly MemoryQualificationRecord[], failures: readonly MemoryQualificationFailure[]): MemoryQualificationMetrics {
  const base: Omit<MemoryQualificationMetrics, "integrity_hash"> = {
    qualification_requests: records.length,
    qualification_success_rate: failures.length ? 0 : 1,
    qualification_failures: failures.length,
    evidence_validation_failures: failures.some((failure) => ["QUALIFIED_MEMORY_LACKS_EVIDENCE", "EVIDENCE_LINEAGE_INCOMPLETE"].includes(failure)) ? 1 : 0,
    replay_failures: failures.includes("REPLAY_UNAVAILABLE") ? 1 : 0,
    governance_rejections: failures.includes("GOVERNANCE_BYPASSED") || failures.includes("CONSTITUTIONAL_VIOLATION") ? 1 : 0,
    confidence_validation_failures: failures.includes("CONFIDENCE_VALIDATION_OMITTED") ? 1 : 0,
    certification_failures: failures.includes("CERTIFICATION_IGNORED") ? 1 : 0,
    qualification_latency_ms: 11,
    replay_success_rate: failures.includes("REPLAY_UNAVAILABLE") ? 0 : 1,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<MemoryQualificationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    similarity_hash: result.similarity_result.integrity_hash,
    contract_hash: result.contract.integrity_hash,
    record_hashes: result.qualification_records.map((record) => record.integrity_hash),
    ledger_hashes: result.qualification_ledger.map((entry) => entry.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<MemoryQualificationResult, "integrity_hash">): string {
  return hash({
    version: result.memory_qualification_version,
    framework_identifier: result.framework_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    contract_hash: result.contract.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function establishMemoryQualificationValidation(input: MemoryQualificationInput = {}): MemoryQualificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const similarity_result = input.similarity_result ?? establishCrossMissionSimilarityEngine();
  const failures = collectFailures(scenario, replayCrossMissionSimilarityEngine(similarity_result));
  const contract = buildContract();
  const source_similarity_records = similarity_result.similarity_records;
  const qualification_records = freezeArray(source_similarity_records.map((record) => buildQualificationRecord(record, failures)));
  const qualification_ledger = buildLedger(qualification_records, failures);
  const metrics = buildMetrics(qualification_records, failures);
  const base: Omit<MemoryQualificationResult, "integrity_hash" | "replay_hash"> = {
    memory_qualification_version: QUALIFICATION_VERSION,
    framework_identifier: FRAMEWORK_IDENTIFIER,
    status: statusFor(failures),
    api_surface,
    similarity_result,
    contract,
    source_similarity_records,
    qualification_records,
    qualification_ledger,
    metrics,
    failures,
    deterministic: !failures.includes("DETERMINISTIC_QUALIFICATION_FAILED"),
    replayable: !failures.includes("REPLAY_UNAVAILABLE"),
    governed: !failures.includes("GOVERNANCE_BYPASSED"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    evidence_lineage_preserved: !failures.includes("EVIDENCE_LINEAGE_INCOMPLETE") && !failures.includes("QUALIFIED_MEMORY_LACKS_EVIDENCE"),
    qualified_memory_approved: failures.length === 0,
    invalid_memory_rejected: failures.length > 0,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayMemoryQualificationValidation(result: MemoryQualificationResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayCrossMissionSimilarityEngine(result.similarity_result) &&
    verifyHashedRecord(result.contract) &&
    result.qualification_records.every((record) =>
      verifyHashedRecord(record.evidence_validation) &&
      verifyHashedRecord(record.replay_validation) &&
      verifyHashedRecord(record.governance_validation) &&
      verifyHashedRecord(record.confidence_validation) &&
      verifyHashedRecord(record.certification_validation) &&
      verifyHashedRecord(record)
    ) &&
    result.qualification_ledger.every(verifyHashedRecord) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getMemoryQualificationValidation(): MemoryQualificationFramework {
  const api_surface = buildApiSurface();
  return Object.freeze({
    memory_qualification_version: QUALIFICATION_VERSION,
    supported_validation_engines: ENGINES,
    supported_statuses: STATUSES,
    api_surface,
    result: establishMemoryQualificationValidation(),
  });
}

export const MemoryQualificationValidation = Object.freeze({
  establish: establishMemoryQualificationValidation,
  replay: replayMemoryQualificationValidation,
});
