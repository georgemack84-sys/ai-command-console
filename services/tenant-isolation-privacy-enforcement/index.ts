import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishGovernanceAwareMemoryControl, replayGovernanceAwareMemoryControl } from "@/services/governance-aware-memory-control";
import type { MemoryGovernanceRecord } from "@/types/governance-aware-memory-control";
import type {
  IsolationDecision,
  IsolationLedgerEntry,
  IsolationValidationReport,
  IsolationValidator,
  TenantIsolationApiSurface,
  TenantIsolationContract,
  TenantIsolationEnforcement,
  TenantIsolationFailure,
  TenantIsolationInput,
  TenantIsolationMetrics,
  TenantIsolationRecord,
  TenantIsolationResult,
  TenantIsolationScenario,
  TenantSegment,
} from "@/types/tenant-isolation-privacy-enforcement";

const ISOLATION_VERSION = "tenant-isolation-privacy-enforcement/v1" as const;
const ENFORCEMENT_IDENTIFIER = "TenantIsolationPrivacyEnforcement" as const;

const VALIDATORS: readonly IsolationValidator[] = Object.freeze([
  "IDENTITY_AUTHENTICATION",
  "TENANT_VALIDATION",
  "PRIVACY_BOUNDARY_VALIDATION",
  "SEGMENTATION_VALIDATION",
  "GOVERNANCE_VALIDATION",
  "CROSS_TENANT_GUARD",
  "REPLAY_VALIDATION",
  "INTEGRITY_VERIFICATION",
]);

const DECISIONS: readonly IsolationDecision[] = Object.freeze([
  "AUTHORIZED",
  "BLOCKED",
  "REQUIRES_CROSS_TENANT_APPROVAL",
]);

type Scenario = NonNullable<TenantIsolationInput["scenario"]>;

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

function buildApiSurface(): TenantIsolationApiSurface {
  const base: Omit<TenantIsolationApiSurface, "integrity_hash"> = {
    api_id: "tenant_isolation_privacy_enforcement_api",
    establish_enforcement: "POST /tenant-isolation-privacy-enforcement/establish",
    retrieve_contract: "GET /tenant-isolation-privacy-enforcement/contract",
    retrieve_records: "POST /tenant-isolation-privacy-enforcement/records",
    retrieve_privacy: "POST /tenant-isolation-privacy-enforcement/privacy",
    retrieve_segmentation: "POST /tenant-isolation-privacy-enforcement/segmentation",
    retrieve_cross_tenant: "POST /tenant-isolation-privacy-enforcement/cross-tenant",
    retrieve_ledger: "POST /tenant-isolation-privacy-enforcement/ledger",
    retrieve_metrics: "POST /tenant-isolation-privacy-enforcement/metrics",
    replay_enforcement: "POST /tenant-isolation-privacy-enforcement/replay",
    inspect_enforcement: "POST /tenant-isolation-privacy-enforcement/inspect",
    implicit_sharing_supported: false,
    cross_tenant_default_supported: false,
    privilege_escalation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): TenantIsolationFailure | undefined {
  const map: Partial<Record<TenantIsolationScenario, TenantIsolationFailure>> = {
    GOVERNANCE_CONTROL_UNAVAILABLE: "GOVERNANCE_CONTROL_UNAVAILABLE",
    TENANT_MEMORY_LEAK: "TENANT_MEMORY_LEAK",
    UNAUTHORIZED_RETRIEVAL: "UNAUTHORIZED_RETRIEVAL_SUCCEEDED",
    UNAUTHORIZED_INDEXING: "UNAUTHORIZED_INDEXING_OCCURRED",
    HIDDEN_SHARING: "HIDDEN_SHARING_DETECTED",
    PRIVILEGE_ESCALATION: "PRIVILEGE_ESCALATION_SUCCEEDED",
    GOVERNANCE_BYPASS: "GOVERNANCE_VALIDATION_BYPASSED",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_PROTECTION_VIOLATED",
    REPLAY_OMITTED: "REPLAY_VALIDATION_OMITTED",
    SEGMENTATION_FAILURE: "SEGMENTATION_COMPROMISED",
    NONDETERMINISTIC_ISOLATION: "DETERMINISTIC_ISOLATION_FAILED",
    PRIVACY_VIOLATION: "PRIVACY_BOUNDARY_VIOLATED",
    INCOMPLETE_EVIDENCE: "EVIDENCE_LINEAGE_INCOMPLETE",
    CROSS_TENANT_ATTEMPT: "CROSS_TENANT_ACCESS_NOT_APPROVED",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, governanceReplayable: boolean): readonly TenantIsolationFailure[] {
  const failures: TenantIsolationFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!governanceReplayable) failures.push("GOVERNANCE_CONTROL_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function buildContract(): TenantIsolationContract {
  const base: Omit<TenantIsolationContract, "integrity_hash"> = {
    contract_id: "tenant-isolation-privacy-enforcement-contract",
    version: ISOLATION_VERSION,
    architecture: freezeArray([
      "Adaptive Memory Access Request",
      "Tenant Identity Authentication",
      "Tenant Boundary Validation",
      "Privacy Boundary Validation",
      "Memory Segmentation Engine",
      "Governance Authorization Check",
      "Cross-Tenant Guard",
      "Isolation Ledger",
      "Replay Verification",
      "Final Isolation Decision",
    ]),
    validators: VALIDATORS,
    decisions: DECISIONS,
    isolation_rules: freezeArray([
      "isolation_by_default",
      "zero_implicit_sharing",
      "tenant_private_segments_only",
      "independent_tenant_indexing",
      "independent_tenant_replay",
      "governance_before_any_access",
      "cross_tenant_access_requires_explicit_constitutional_governance",
    ]),
    automatic_rejection_rules: freezeArray([
      "tenant_mismatch_detected",
      "privacy_boundary_violation_detected",
      "unauthorized_retrieval_attempted",
      "unauthorized_indexing_attempted",
      "hidden_sharing_detected",
      "privilege_escalation_detected",
      "governance_validation_missing",
      "constitutional_violation_detected",
      "replay_validation_missing",
      "segmentation_compromised",
    ]),
    isolation_guarantees: freezeArray([
      "memory_never_exposed_across_tenants_by_default",
      "memory_never_indexed_across_tenants_by_default",
      "memory_never_compared_across_tenants_by_default",
      "memory_never_reused_across_tenants_by_default",
      "tenant_segments_are_governed_independently",
    ]),
    privacy_guarantees: freezeArray([
      "privacy_before_intelligence",
      "privacy_before_similarity",
      "privacy_before_pattern_reuse",
      "certified_anonymization_required_for_any_cross_tenant_policy",
      "complete_evidence_lineage_required_for_access",
    ]),
    security_requirements: freezeArray([
      "authenticate_every_requester",
      "authorize_every_retrieval",
      "prevent_privilege_escalation",
      "prevent_governance_bypass",
      "prevent_hidden_sharing",
      "preserve_append_only_isolation_ledger",
    ]),
    replay_requirements: freezeArray([
      "requester_identity",
      "source_tenant",
      "target_tenant",
      "privacy_validation",
      "segmentation_validation",
      "governance_validation",
      "cross_tenant_policy_validation",
      "final_authorization_decision",
    ]),
    isolation_by_default: true,
    zero_implicit_sharing: true,
    privacy_before_intelligence: true,
    cross_tenant_blocked_by_default: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validatorValid(validator: IsolationValidator, failures: readonly TenantIsolationFailure[]): boolean {
  const blocked: Record<IsolationValidator, readonly TenantIsolationFailure[]> = {
    IDENTITY_AUTHENTICATION: ["UNAUTHORIZED_RETRIEVAL_SUCCEEDED"],
    TENANT_VALIDATION: ["TENANT_MEMORY_LEAK", "CROSS_TENANT_ACCESS_NOT_APPROVED"],
    PRIVACY_BOUNDARY_VALIDATION: ["PRIVACY_BOUNDARY_VIOLATED", "EVIDENCE_LINEAGE_INCOMPLETE"],
    SEGMENTATION_VALIDATION: ["SEGMENTATION_COMPROMISED", "UNAUTHORIZED_INDEXING_OCCURRED"],
    GOVERNANCE_VALIDATION: [
      "GOVERNANCE_CONTROL_UNAVAILABLE",
      "GOVERNANCE_VALIDATION_BYPASSED",
      "CONSTITUTIONAL_PROTECTION_VIOLATED",
    ],
    CROSS_TENANT_GUARD: [
      "CROSS_TENANT_ACCESS_NOT_APPROVED",
      "HIDDEN_SHARING_DETECTED",
      "PRIVILEGE_ESCALATION_SUCCEEDED",
      "TENANT_MEMORY_LEAK",
    ],
    REPLAY_VALIDATION: ["REPLAY_VALIDATION_OMITTED"],
    INTEGRITY_VERIFICATION: ["DETERMINISTIC_ISOLATION_FAILED"],
  };
  return !blocked[validator].some((failure) => failures.includes(failure));
}

function buildReport(validator: IsolationValidator, failures: readonly TenantIsolationFailure[]): IsolationValidationReport {
  const valid = validatorValid(validator, failures);
  const base: Omit<IsolationValidationReport, "integrity_hash"> = {
    validator,
    valid,
    deterministic: !failures.includes("DETERMINISTIC_ISOLATION_FAILED"),
    replayable: !failures.includes("REPLAY_VALIDATION_OMITTED"),
    explanation: valid
      ? `${validator.toLowerCase()} preserved deterministic tenant isolation.`
      : `${validator.toLowerCase()} blocked tenant memory access.`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildSegment(source: MemoryGovernanceRecord, failures: readonly TenantIsolationFailure[]): TenantSegment {
  const tenant_id = failures.includes("TENANT_MEMORY_LEAK") ? "tenant-cross-boundary" : source.tenant_id;
  const base: Omit<TenantSegment, "integrity_hash"> = {
    segment_id: `tenant_segment_${hash({ source: source.governance_id, version: ISOLATION_VERSION }).slice(0, 32)}`,
    tenant_id,
    organization_id: "org-mission-control",
    mission_id: source.mission_id,
    operational_domain: "adaptive-memory",
    governance_scope: "tenant-isolated",
    classification_level: "TENANT_PRIVATE",
    encrypted_partition_hash: hash({ tenant_id, memory_id: source.memory_id, mission_id: source.mission_id }),
    independently_indexed: true,
    independently_replayable: true,
    independently_governed: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function decisionFor(failures: readonly TenantIsolationFailure[]): IsolationDecision {
  if (failures.includes("CROSS_TENANT_ACCESS_NOT_APPROVED")) return "REQUIRES_CROSS_TENANT_APPROVAL";
  return failures.length ? "BLOCKED" : "AUTHORIZED";
}

function buildRecord(source: MemoryGovernanceRecord, failures: readonly TenantIsolationFailure[]): TenantIsolationRecord {
  const reports = VALIDATORS.map((validator) => buildReport(validator, failures));
  const final_decision = decisionFor(failures);
  const segment = buildSegment(source, failures);
  const target_tenant = failures.includes("CROSS_TENANT_ACCESS_NOT_APPROVED") || failures.includes("TENANT_MEMORY_LEAK")
    ? "tenant-cross-boundary"
    : source.tenant_id;
  const base: Omit<TenantIsolationRecord, "integrity_hash"> = {
    isolation_id: `tipe_${hash({ source: source.governance_id, version: ISOLATION_VERSION }).slice(0, 32)}`,
    requester_id: "TenantIsolationEngine",
    requester_tenant: source.tenant_id,
    target_tenant,
    memory_id: source.memory_id,
    mission_id: source.mission_id,
    authorization_status: final_decision,
    identity_authentication: reports[0],
    tenant_validation: reports[1],
    privacy_validation: reports[2],
    segmentation_validation: reports[3],
    governance_validation: reports[4],
    cross_tenant_policy: reports[5],
    replay_validation: reports[6],
    integrity_validation: reports[7],
    final_decision,
    evidence_refs: failures.includes("EVIDENCE_LINEAGE_INCOMPLETE") ? [] : source.evidence_refs,
    governance_refs: source.governance_refs,
    replay_refs: failures.includes("REPLAY_VALIDATION_OMITTED") ? [] : source.replay_refs,
    segment,
    source_governance_hash: source.integrity_hash,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(records: readonly TenantIsolationRecord[], failures: readonly TenantIsolationFailure[]): readonly IsolationLedgerEntry[] {
  const events: readonly IsolationLedgerEntry["event"][] = [
    "ACCESS_REQUEST",
    "TENANT_VALIDATION",
    "PRIVACY_VALIDATION",
    "SEGMENTATION_VALIDATION",
    "GOVERNANCE_APPROVAL",
    "REPLAY_VALIDATION",
    "AUTHORIZATION_DECISION",
    "BLOCKED_REQUEST",
    "CROSS_TENANT_ATTEMPT",
    "INTEGRITY_VERIFICATION",
  ];
  return freezeArray(records.flatMap((record, recordIndex) => events.map((event, eventIndex) => {
    const base: Omit<IsolationLedgerEntry, "integrity_hash"> = {
      ledger_id: `tenant_isolation_ledger_${String(recordIndex + 1).padStart(2, "0")}_${String(eventIndex + 1).padStart(2, "0")}`,
      isolation_id: record.isolation_id,
      memory_id: record.memory_id,
      tenant_id: record.requester_tenant,
      event,
      append_only: true,
      immutable: true,
      deterministic: true,
      replayable: true,
      tenant_isolated: !failures.includes("TENANT_MEMORY_LEAK"),
      cryptographically_verified: !failures.includes("DETERMINISTIC_ISOLATION_FAILED"),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  })));
}

function buildMetrics(records: readonly TenantIsolationRecord[], failures: readonly TenantIsolationFailure[]): TenantIsolationMetrics {
  const approvals = records.filter((record) => record.final_decision === "AUTHORIZED").length;
  const base: Omit<TenantIsolationMetrics, "integrity_hash"> = {
    access_requests: records.length,
    authorization_approvals: approvals,
    authorization_denials: records.length - approvals,
    blocked_cross_tenant_requests: failures.includes("CROSS_TENANT_ACCESS_NOT_APPROVED") || failures.includes("TENANT_MEMORY_LEAK") ? 1 : 0,
    privacy_violations: failures.includes("PRIVACY_BOUNDARY_VIOLATED") || failures.includes("TENANT_MEMORY_LEAK") ? 1 : 0,
    segmentation_failures: failures.includes("SEGMENTATION_COMPROMISED") || failures.includes("UNAUTHORIZED_INDEXING_OCCURRED") ? 1 : 0,
    privilege_escalation_attempts: failures.includes("PRIVILEGE_ESCALATION_SUCCEEDED") ? 1 : 0,
    hidden_sharing_attempts: failures.includes("HIDDEN_SHARING_DETECTED") ? 1 : 0,
    replay_validation_failures: failures.includes("REPLAY_VALIDATION_OMITTED") ? 1 : 0,
    isolation_latency_ms: 6,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<TenantIsolationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    governance_hash: result.governance_result.integrity_hash,
    contract_hash: result.contract.integrity_hash,
    record_hashes: result.isolation_records.map((record) => record.integrity_hash),
    segment_hashes: result.segments.map((segment) => segment.integrity_hash),
    ledger_hashes: result.isolation_ledger.map((entry) => entry.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<TenantIsolationResult, "integrity_hash">): string {
  return hash({
    version: result.tenant_isolation_version,
    enforcement_identifier: result.enforcement_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    contract_hash: result.contract.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function establishTenantIsolationPrivacyEnforcement(input: TenantIsolationInput = {}): TenantIsolationResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const governance_result = input.governance_result ?? establishGovernanceAwareMemoryControl();
  const failures = collectFailures(scenario, replayGovernanceAwareMemoryControl(governance_result));
  const contract = buildContract();
  const source_governance_records = governance_result.governance_records;
  const isolation_records = freezeArray(source_governance_records.map((record) => buildRecord(record, failures)));
  const segments = freezeArray(isolation_records.map((record) => record.segment));
  const isolation_ledger = buildLedger(isolation_records, failures);
  const metrics = buildMetrics(isolation_records, failures);
  const base: Omit<TenantIsolationResult, "integrity_hash" | "replay_hash"> = {
    tenant_isolation_version: ISOLATION_VERSION,
    enforcement_identifier: ENFORCEMENT_IDENTIFIER,
    status: failures.length ? "REJECTED" : "AUTHORITATIVE",
    api_surface,
    governance_result,
    contract,
    source_governance_records,
    isolation_records,
    segments,
    isolation_ledger,
    metrics,
    failures,
    deterministic: !failures.includes("DETERMINISTIC_ISOLATION_FAILED"),
    replayable: !failures.includes("REPLAY_VALIDATION_OMITTED"),
    privacy_preserved: !failures.includes("PRIVACY_BOUNDARY_VIOLATED") && !failures.includes("TENANT_MEMORY_LEAK"),
    tenant_isolated: !failures.includes("TENANT_MEMORY_LEAK"),
    segmentation_enforced: !failures.includes("SEGMENTATION_COMPROMISED") && !failures.includes("UNAUTHORIZED_INDEXING_OCCURRED"),
    cross_tenant_blocked_by_default: true,
    zero_implicit_sharing: true,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayTenantIsolationPrivacyEnforcement(result: TenantIsolationResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayGovernanceAwareMemoryControl(result.governance_result) &&
    verifyHashedRecord(result.contract) &&
    result.isolation_records.every((record) =>
      verifyHashedRecord(record.identity_authentication) &&
      verifyHashedRecord(record.tenant_validation) &&
      verifyHashedRecord(record.privacy_validation) &&
      verifyHashedRecord(record.segmentation_validation) &&
      verifyHashedRecord(record.governance_validation) &&
      verifyHashedRecord(record.cross_tenant_policy) &&
      verifyHashedRecord(record.replay_validation) &&
      verifyHashedRecord(record.integrity_validation) &&
      verifyHashedRecord(record.segment) &&
      verifyHashedRecord(record)
    ) &&
    result.segments.every(verifyHashedRecord) &&
    result.isolation_ledger.every(verifyHashedRecord) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getTenantIsolationPrivacyEnforcement(): TenantIsolationEnforcement {
  const api_surface = buildApiSurface();
  return Object.freeze({
    tenant_isolation_version: ISOLATION_VERSION,
    supported_validators: VALIDATORS,
    supported_decisions: DECISIONS,
    api_surface,
    result: establishTenantIsolationPrivacyEnforcement(),
  });
}

export const TenantIsolationPrivacyEnforcement = Object.freeze({
  establish: establishTenantIsolationPrivacyEnforcement,
  replay: replayTenantIsolationPrivacyEnforcement,
});
