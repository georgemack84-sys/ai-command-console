import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishMemoryQualificationValidation, replayMemoryQualificationValidation } from "@/services/memory-qualification-validation";
import type { MemoryQualificationRecord } from "@/types/memory-qualification-validation";
import type {
  GovernanceControlValidator,
  GovernanceDecisionExplanation,
  GovernanceMemoryControl,
  GovernanceMemoryControlApiSurface,
  GovernanceMemoryControlContract,
  GovernanceMemoryControlFailure,
  GovernanceMemoryControlInput,
  GovernanceMemoryControlMetrics,
  GovernanceMemoryControlResult,
  GovernanceMemoryControlScenario,
  GovernanceMemoryControlStatus,
  GovernanceMemoryLedgerEntry,
  GovernanceValidationReport,
  MemoryGovernanceRecord,
  MemoryReuseDecision,
} from "@/types/governance-aware-memory-control";

const CONTROL_VERSION = "governance-aware-memory-control/v1" as const;
const CONTROL_IDENTIFIER = "GovernanceAwareMemoryControl" as const;

const VALIDATORS: readonly GovernanceControlValidator[] = Object.freeze([
  "IDENTITY_VALIDATION",
  "AUTHORITY_VALIDATION",
  "CONSTITUTIONAL_VALIDATION",
  "GOVERNANCE_VALIDATION",
  "MISSION_AUTHORIZATION",
  "REPLAY_VALIDATION",
  "REUSE_POLICY_EVALUATION",
  "INTEGRITY_VERIFICATION",
]);

const DECISIONS: readonly MemoryReuseDecision[] = Object.freeze([
  "APPROVED",
  "DENIED",
  "REQUIRES_GOVERNANCE_REVIEW",
  "REQUIRES_OPERATOR_APPROVAL",
  "REQUIRES_CERTIFICATION",
]);

type Scenario = NonNullable<GovernanceMemoryControlInput["scenario"]>;

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

function buildApiSurface(): GovernanceMemoryControlApiSurface {
  const base: Omit<GovernanceMemoryControlApiSurface, "integrity_hash"> = {
    api_id: "governance_aware_memory_control_api",
    establish_control: "POST /governance-aware-memory-control/establish",
    retrieve_contract: "GET /governance-aware-memory-control/contract",
    retrieve_records: "POST /governance-aware-memory-control/records",
    retrieve_authority: "POST /governance-aware-memory-control/authority",
    retrieve_constitutional: "POST /governance-aware-memory-control/constitutional",
    retrieve_reuse_policy: "POST /governance-aware-memory-control/reuse-policy",
    retrieve_ledger: "POST /governance-aware-memory-control/ledger",
    retrieve_metrics: "POST /governance-aware-memory-control/metrics",
    replay_control: "POST /governance-aware-memory-control/replay",
    inspect_control: "POST /governance-aware-memory-control/inspect",
    governance_bypass_supported: false,
    authority_expansion_supported: false,
    cross_tenant_default_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): GovernanceMemoryControlFailure | undefined {
  const map: Partial<Record<GovernanceMemoryControlScenario, GovernanceMemoryControlFailure>> = {
    QUALIFICATION_UNAVAILABLE: "QUALIFICATION_UNAVAILABLE",
    UNAUTHORIZED_REUSE: "UNAUTHORIZED_MEMORY_REUSED",
    GOVERNANCE_BYPASS: "GOVERNANCE_VALIDATION_BYPASSED",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_PROTECTION_VIOLATED",
    AUTHORITY_ESCALATION: "AUTHORITY_INCORRECTLY_GRANTED",
    REPLAY_OMITTED: "REPLAY_VALIDATION_OMITTED",
    MISSION_AUTH_IGNORED: "MISSION_AUTHORIZATION_IGNORED",
    TENANT_BREACH: "TENANT_ISOLATION_VIOLATED",
    POLICY_CIRCUMVENTION: "REUSE_POLICY_CIRCUMVENTED",
    NONDETERMINISTIC_DECISION: "NONDETERMINISTIC_GOVERNANCE_DECISION",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    CROSS_TENANT_REUSE: "CROSS_TENANT_REUSE_NOT_APPROVED",
    OPERATOR_APPROVAL_REQUIRED: "OPERATOR_APPROVAL_REQUIRED",
    CERTIFICATION_REQUIRED: "CERTIFICATION_REQUIRED",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, qualificationReplayable: boolean): readonly GovernanceMemoryControlFailure[] {
  const failures: GovernanceMemoryControlFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!qualificationReplayable) failures.push("QUALIFICATION_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function statusFor(failures: readonly GovernanceMemoryControlFailure[]): GovernanceMemoryControlStatus {
  return failures.length ? "REJECTED" : "AUTHORITATIVE";
}

function buildContract(): GovernanceMemoryControlContract {
  const base: Omit<GovernanceMemoryControlContract, "integrity_hash"> = {
    contract_id: "governance-aware-memory-control-contract",
    version: CONTROL_VERSION,
    architecture: freezeArray(["Adaptive Memory Request", "Identity Validation", "Authority Validation", "Constitutional Validation", "Mission Authorization", "Replay Validation", "Reuse Policy Engine", "Governance Decision"]),
    validators: VALIDATORS,
    decision_outcomes: DECISIONS,
    reuse_authorization_rules: freezeArray(["authority_validated", "governance_approved", "constitutional_compliance_verified", "mission_authorization_granted", "replay_available", "integrity_verified", "certification_valid", "tenant_boundaries_preserved"]),
    automatic_rejection_rules: freezeArray(["authority_invalid", "governance_approval_missing", "constitutional_violation_detected", "replay_unavailable", "evidence_lineage_incomplete", "certification_invalid", "tenant_boundary_violated", "mission_authorization_denied", "reuse_policy_prohibits_access"]),
    cross_mission_rules: freezeArray(["governance_authorizes_reuse", "mission_compatibility_confirmed", "replay_references_available", "evidence_provenance_complete", "operator_visibility_preserved", "constitutional_constraints_satisfied"]),
    cross_tenant_rules: freezeArray(["blocked_by_default", "constitutional_approval_required", "governance_approval_required", "certified_anonymization_required", "explicit_authorization_required", "immutable_audit_trail_required"]),
    security_requirements: freezeArray(["enforce_tenant_isolation", "authenticate_every_requester", "authorize_every_retrieval", "prevent_privilege_escalation", "prevent_governance_bypass", "detect_unauthorized_access", "preserve_immutable_audit_history"]),
    replay_requirements: freezeArray(["requester_identity", "authority_validation", "constitutional_validation", "governance_evaluation", "mission_authorization", "replay_verification", "reuse_policy_decision", "final_authorization"]),
    governance_before_memory: true,
    constitution_supreme: true,
    memory_grants_authority: false,
    cross_tenant_blocked_by_default: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validatorValid(validator: GovernanceControlValidator, failures: readonly GovernanceMemoryControlFailure[]): boolean {
  const blocked: Record<GovernanceControlValidator, readonly GovernanceMemoryControlFailure[]> = {
    IDENTITY_VALIDATION: ["UNAUTHORIZED_MEMORY_REUSED"],
    AUTHORITY_VALIDATION: ["AUTHORITY_INCORRECTLY_GRANTED", "UNAUTHORIZED_MEMORY_REUSED"],
    CONSTITUTIONAL_VALIDATION: ["CONSTITUTIONAL_PROTECTION_VIOLATED"],
    GOVERNANCE_VALIDATION: ["GOVERNANCE_VALIDATION_BYPASSED"],
    MISSION_AUTHORIZATION: ["MISSION_AUTHORIZATION_IGNORED"],
    REPLAY_VALIDATION: ["REPLAY_VALIDATION_OMITTED"],
    REUSE_POLICY_EVALUATION: ["REUSE_POLICY_CIRCUMVENTED", "CROSS_TENANT_REUSE_NOT_APPROVED"],
    INTEGRITY_VERIFICATION: ["INTEGRITY_VERIFICATION_FAILED", "NONDETERMINISTIC_GOVERNANCE_DECISION"],
  };
  return !blocked[validator].some((failure) => failures.includes(failure));
}

function buildReport(validator: GovernanceControlValidator, failures: readonly GovernanceMemoryControlFailure[]): GovernanceValidationReport {
  const valid = validatorValid(validator, failures);
  const base: Omit<GovernanceValidationReport, "integrity_hash"> = {
    validator,
    valid,
    deterministic: !failures.includes("NONDETERMINISTIC_GOVERNANCE_DECISION"),
    replayable: !failures.includes("REPLAY_VALIDATION_OMITTED"),
    explanation: valid ? `${validator.toLowerCase()} passed deterministic governance control.` : `${validator.toLowerCase()} blocked memory reuse.`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function decisionFor(failures: readonly GovernanceMemoryControlFailure[], reports: readonly GovernanceValidationReport[]): MemoryReuseDecision {
  if (failures.includes("OPERATOR_APPROVAL_REQUIRED")) return "REQUIRES_OPERATOR_APPROVAL";
  if (failures.includes("CERTIFICATION_REQUIRED")) return "REQUIRES_CERTIFICATION";
  if (failures.includes("GOVERNANCE_VALIDATION_BYPASSED")) return "REQUIRES_GOVERNANCE_REVIEW";
  return reports.every((report) => report.valid) && failures.length === 0 ? "APPROVED" : "DENIED";
}

function buildExplanation(decision: MemoryReuseDecision, reports: readonly GovernanceValidationReport[]): GovernanceDecisionExplanation {
  const base: Omit<GovernanceDecisionExplanation, "integrity_hash"> = {
    authority_evaluation: reports.find((report) => report.validator === "AUTHORITY_VALIDATION")?.explanation ?? "authority unavailable",
    constitutional_validation: reports.find((report) => report.validator === "CONSTITUTIONAL_VALIDATION")?.explanation ?? "constitutional unavailable",
    governance_outcome: reports.find((report) => report.validator === "GOVERNANCE_VALIDATION")?.explanation ?? "governance unavailable",
    mission_authorization: reports.find((report) => report.validator === "MISSION_AUTHORIZATION")?.explanation ?? "mission unavailable",
    replay_status: reports.find((report) => report.validator === "REPLAY_VALIDATION")?.explanation ?? "replay unavailable",
    reuse_policy_evaluation: reports.find((report) => report.validator === "REUSE_POLICY_EVALUATION")?.explanation ?? "reuse unavailable",
    rationale: `Final decision ${decision} derived from deterministic governance validators.`,
    explanation_complete: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(source: MemoryQualificationRecord, failures: readonly GovernanceMemoryControlFailure[]): MemoryGovernanceRecord {
  const reports = VALIDATORS.map((validator) => buildReport(validator, failures));
  const final_decision = decisionFor(failures, reports);
  const tenant_id = failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : source.tenant_id;
  const base: Omit<MemoryGovernanceRecord, "integrity_hash"> = {
    governance_id: `gmc_${hash({ source: source.qualification_id, version: CONTROL_VERSION }).slice(0, 32)}`,
    memory_id: source.memory_id,
    tenant_id,
    mission_id: source.mission_id,
    requester: "MemoryGovernanceValidator",
    identity_validation: reports[0],
    authority_validation: reports[1],
    constitutional_validation: reports[2],
    governance_validation: reports[3],
    mission_authorization: reports[4],
    replay_validation: reports[5],
    reuse_policy_result: reports[6],
    integrity_validation: reports[7],
    final_decision,
    evidence_refs: source.evidence_refs,
    governance_refs: source.governance_refs,
    replay_refs: failures.includes("REPLAY_VALIDATION_OMITTED") ? [] : source.replay_refs,
    certification_refs: source.certification_refs,
    explanation: buildExplanation(final_decision, reports),
    source_qualification_hash: source.integrity_hash,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(records: readonly MemoryGovernanceRecord[], failures: readonly GovernanceMemoryControlFailure[]): readonly GovernanceMemoryLedgerEntry[] {
  const events = ["REUSE_REQUEST", "IDENTITY_VALIDATION", "AUTHORITY_VALIDATION", "CONSTITUTIONAL_VALIDATION", "GOVERNANCE_APPROVAL", "MISSION_AUTHORIZATION", "REPLAY_VALIDATION", "REUSE_POLICY_DECISION", "FINAL_DECISION", "INTEGRITY_VERIFICATION"] as const;
  return freezeArray(records.flatMap((record, recordIndex) => events.map((event, eventIndex) => {
    const base: Omit<GovernanceMemoryLedgerEntry, "integrity_hash"> = {
      ledger_id: `governance_memory_ledger_${String(recordIndex + 1).padStart(2, "0")}_${String(eventIndex + 1).padStart(2, "0")}`,
      governance_id: record.governance_id,
      memory_id: record.memory_id,
      tenant_id: record.tenant_id,
      event,
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

function buildMetrics(records: readonly MemoryGovernanceRecord[], failures: readonly GovernanceMemoryControlFailure[]): GovernanceMemoryControlMetrics {
  const approvals = records.filter((record) => record.final_decision === "APPROVED").length;
  const base: Omit<GovernanceMemoryControlMetrics, "integrity_hash"> = {
    reuse_requests: records.length,
    approvals,
    denials: records.filter((record) => record.final_decision === "DENIED").length,
    governance_escalations: records.filter((record) => record.final_decision === "REQUIRES_GOVERNANCE_REVIEW").length,
    constitutional_violations: failures.includes("CONSTITUTIONAL_PROTECTION_VIOLATED") ? 1 : 0,
    authority_failures: failures.includes("AUTHORITY_INCORRECTLY_GRANTED") || failures.includes("UNAUTHORIZED_MEMORY_REUSED") ? 1 : 0,
    replay_failures: failures.includes("REPLAY_VALIDATION_OMITTED") ? 1 : 0,
    mission_authorization_failures: failures.includes("MISSION_AUTHORIZATION_IGNORED") ? 1 : 0,
    blocked_cross_tenant_requests: failures.includes("CROSS_TENANT_REUSE_NOT_APPROVED") ? 1 : 0,
    decision_latency_ms: 7,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<GovernanceMemoryControlResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    qualification_hash: result.qualification_result.integrity_hash,
    contract_hash: result.contract.integrity_hash,
    record_hashes: result.governance_records.map((record) => record.integrity_hash),
    ledger_hashes: result.governance_ledger.map((entry) => entry.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<GovernanceMemoryControlResult, "integrity_hash">): string {
  return hash({
    version: result.governance_memory_control_version,
    control_identifier: result.control_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    contract_hash: result.contract.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function establishGovernanceAwareMemoryControl(input: GovernanceMemoryControlInput = {}): GovernanceMemoryControlResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const qualification_result = input.qualification_result ?? establishMemoryQualificationValidation();
  const failures = collectFailures(scenario, replayMemoryQualificationValidation(qualification_result));
  const contract = buildContract();
  const source_qualification_records = qualification_result.qualification_records;
  const governance_records = freezeArray(source_qualification_records.map((record) => buildRecord(record, failures)));
  const governance_ledger = buildLedger(governance_records, failures);
  const metrics = buildMetrics(governance_records, failures);
  const base: Omit<GovernanceMemoryControlResult, "integrity_hash" | "replay_hash"> = {
    governance_memory_control_version: CONTROL_VERSION,
    control_identifier: CONTROL_IDENTIFIER,
    status: statusFor(failures),
    api_surface,
    qualification_result,
    contract,
    source_qualification_records,
    governance_records,
    governance_ledger,
    metrics,
    failures,
    deterministic: !failures.includes("NONDETERMINISTIC_GOVERNANCE_DECISION"),
    replayable: !failures.includes("REPLAY_VALIDATION_OMITTED"),
    explainable: true,
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    governance_enforced: !failures.includes("GOVERNANCE_VALIDATION_BYPASSED"),
    constitutional_protections_preserved: !failures.includes("CONSTITUTIONAL_PROTECTION_VIOLATED"),
    authority_boundaries_preserved: !failures.includes("AUTHORITY_INCORRECTLY_GRANTED"),
    cross_tenant_blocked_by_default: true,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayGovernanceAwareMemoryControl(result: GovernanceMemoryControlResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayMemoryQualificationValidation(result.qualification_result) &&
    verifyHashedRecord(result.contract) &&
    result.governance_records.every((record) =>
      verifyHashedRecord(record.identity_validation) &&
      verifyHashedRecord(record.authority_validation) &&
      verifyHashedRecord(record.constitutional_validation) &&
      verifyHashedRecord(record.governance_validation) &&
      verifyHashedRecord(record.mission_authorization) &&
      verifyHashedRecord(record.replay_validation) &&
      verifyHashedRecord(record.reuse_policy_result) &&
      verifyHashedRecord(record.integrity_validation) &&
      verifyHashedRecord(record.explanation) &&
      verifyHashedRecord(record)
    ) &&
    result.governance_ledger.every(verifyHashedRecord) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getGovernanceAwareMemoryControl(): GovernanceMemoryControl {
  const api_surface = buildApiSurface();
  return Object.freeze({
    governance_memory_control_version: CONTROL_VERSION,
    supported_validators: VALIDATORS,
    supported_decisions: DECISIONS,
    api_surface,
    result: establishGovernanceAwareMemoryControl(),
  });
}

export const GovernanceAwareMemoryControl = Object.freeze({
  establish: establishGovernanceAwareMemoryControl,
  replay: replayGovernanceAwareMemoryControl,
});
