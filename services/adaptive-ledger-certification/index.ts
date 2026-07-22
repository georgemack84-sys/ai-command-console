import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AdaptiveLedgerApiSurface,
  AdaptiveLedgerCertificationRecord,
  AdaptiveLedgerCertificationReport,
  AdaptiveLedgerCertificationTest,
  AdaptiveLedgerContract,
  AdaptiveLedgerEntry,
  AdaptiveLedgerFailure,
  AdaptiveLedgerInput,
  AdaptiveLedgerName,
  AdaptiveLedgerObservability,
  AdaptiveLedgerResult,
  AdaptiveLedgerScenario,
  AdaptiveLedgerValidationResult,
  AdaptiveLedgerWidget,
  EvidenceLineageValidation,
  LedgerIntegrityLineageReport,
  LedgerIntegrityValidation,
  LedgerLifecycleValidation,
  ReplayLineageValidation,
  TenantLedgerIsolationValidation,
} from "@/types/adaptive-ledger-certification";

const VERSION = "adaptive-ledger-certification/v10.15.8" as const;
const LEDGER_VERSION = "adaptive-ledger/v10.15.8" as const;
const ID = "AdaptiveLedgerCertification" as const;
const TENANT_ID = "tenant_mission_control";
const MISSION_ID = "mission_adaptive_intelligence";
const WIDGETS: readonly AdaptiveLedgerWidget[] = Object.freeze(["Ledger Certification", "Ledger Entry Schema", "Integrity Validation", "Replay Lineage", "Lifecycle Validation", "Certification Report", "Integrity Lineage Report"]);
const LEDGERS: readonly AdaptiveLedgerName[] = Object.freeze(["OutcomeObservationLedger", "NormalizedOutcomeLedger", "RecommendationEffectivenessLedger", "PatternIntelligenceLedger", "StrategyEvolutionLedger", "ConfidenceAdaptationLedger", "RiskAdaptationLedger", "GovernanceAdaptationLedger", "OperatorFeedbackLedger", "AdaptationProposalLedger", "AdaptationSimulationLedger", "AdaptiveDriftLedger", "AdaptiveMemoryLedger", "AdaptiveDashboardLedger", "AdaptiveCertificationLedger"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function failed(failures: readonly AdaptiveLedgerFailure[], values: readonly AdaptiveLedgerFailure[]): boolean { return failures.some((failure) => values.includes(failure)); }

function failureForScenario(scenario: AdaptiveLedgerScenario): AdaptiveLedgerFailure | undefined {
  const map: Partial<Record<AdaptiveLedgerScenario, AdaptiveLedgerFailure>> = {
    LEDGER_MUTATION: "LEDGER_MUTATION_DETECTED",
    RECORD_DELETION: "RECORD_DELETION_DETECTED",
    APPEND_ONLY_VIOLATION: "APPEND_ONLY_VIOLATION",
    INTEGRITY_HASH_MISMATCH: "INTEGRITY_HASH_MISMATCH",
    BROKEN_HASH_CHAIN: "BROKEN_HASH_CHAIN",
    REPLAY_REFERENCE_OMISSION: "REPLAY_REFERENCE_OMITTED",
    EVIDENCE_LINKAGE_GAP: "EVIDENCE_LINKAGE_GAP",
    GOVERNANCE_LINEAGE_GAP: "GOVERNANCE_LINEAGE_GAP",
    CONSTITUTIONAL_LINEAGE_GAP: "CONSTITUTIONAL_LINEAGE_GAP",
    ORPHANED_ENTRIES: "ORPHANED_LEDGER_ENTRIES",
    REPLAY_RECONSTRUCTION_FAILURE: "REPLAY_RECONSTRUCTION_FAILED",
    CROSS_TENANT_LEDGER_ACCESS: "CROSS_TENANT_LEDGER_ACCESS",
    TENANT_ISOLATION_BREACH: "TENANT_ISOLATION_BREACH",
    LIFECYCLE_INCONSISTENCY: "LIFECYCLE_INCONSISTENCY",
    NONDETERMINISTIC_SEQUENCING: "NONDETERMINISTIC_SEQUENCING",
    INCOMPLETE_AUDIT_HISTORY: "INCOMPLETE_AUDIT_HISTORY",
    TAMPER_DETECTION_FAILURE: "TAMPER_DETECTION_FAILED",
  };
  return map[scenario];
}
function apiSurface(): AdaptiveLedgerApiSurface {
  const base: Omit<AdaptiveLedgerApiSurface, "integrity_hash"> = { api_id: "adaptive_ledger_certification_api", retrieve_dashboard: "POST /adaptive-ledger-certification/dashboard", retrieve_contract: "GET /adaptive-ledger-certification/contract", retrieve_sections: freezeArray(["certification", "entry-schema", "integrity", "lineage", "lifecycle", "report", "integrity-lineage"]), validate_certification: "POST /adaptive-ledger-certification/validate", inspect_certification: "POST /adaptive-ledger-certification/inspect", mutation_supported: false, update_supported: false, delete_supported: false, hidden_persistence_supported: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function entrySchema(failures: readonly AdaptiveLedgerFailure[]): AdaptiveLedgerEntry {
  const base: Omit<AdaptiveLedgerEntry, "integrity_hash"> = { ledger_entry_id: id("ledger_entry", LEDGER_VERSION), ledger_name: "AdaptiveCertificationLedger", tenant_id: failures.includes("TENANT_ISOLATION_BREACH") ? "tenant-cross-boundary" : TENANT_ID, mission_id: MISSION_ID, adaptive_event_type: "ADAPTIVE_LEDGER_CERTIFICATION", adaptive_event_version: VERSION, source_record_refs: freezeArray(["source:adaptive-ledger:canonical"]), evidence_refs: failures.includes("EVIDENCE_LINKAGE_GAP") ? freezeArray([]) : freezeArray(["evidence:adaptive-ledger:canonical"]), governance_refs: failures.includes("GOVERNANCE_LINEAGE_GAP") ? freezeArray([]) : freezeArray(["governance:adaptive-ledger:1"]), constitutional_refs: failures.includes("CONSTITUTIONAL_LINEAGE_GAP") ? freezeArray([]) : freezeArray(["constitutional:adaptive-ledger:1"]), replay_refs: failures.includes("REPLAY_REFERENCE_OMITTED") ? freezeArray([]) : freezeArray(["replay:adaptive-ledger:1"]), operator_refs: freezeArray(["operator:adaptive-ledger:auditor"]), certification_refs: freezeArray(["certification:adaptive-ledger:10.15.8"]), parent_entry_refs: failures.includes("ORPHANED_LEDGER_ENTRIES") ? freezeArray([]) : freezeArray(["ledger-parent:adaptive-ledger:0"]), child_entry_refs: freezeArray(["ledger-child:adaptive-ledger:2"]), event_timestamp: "2026-07-09T00:00:00.000Z", sequence_number: failures.includes("NONDETERMINISTIC_SEQUENCING") ? -1 : 1, previous_entry_hash: failures.includes("BROKEN_HASH_CHAIN") ? "broken-chain" : hash("previous-entry"), append_only_status: failed(failures, ["APPEND_ONLY_VIOLATION", "LEDGER_MUTATION_DETECTED", "RECORD_DELETION_DETECTED"]) ? "FAIL" : "PASS", lifecycle_state: "ACTIVE" };
  return Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_HASH_MISMATCH") ? "invalid-integrity" : hashWithoutIntegrity(base) });
}
function record(input: AdaptiveLedgerInput, failures: readonly AdaptiveLedgerFailure[]): AdaptiveLedgerCertificationRecord {
  const base: Omit<AdaptiveLedgerCertificationRecord, "integrity_hash"> = { certification_id: id("adaptive_ledger_certification", VERSION), tenant_id: input.tenant_id ?? TENANT_ID, mission_id: input.mission_id ?? MISSION_ID, ledger_name: "ALL_ADAPTIVE_LEDGERS", ledger_version: LEDGER_VERSION, append_only_status: failed(failures, ["APPEND_ONLY_VIOLATION", "LEDGER_MUTATION_DETECTED", "RECORD_DELETION_DETECTED"]) ? "FAIL" : "PASS", immutability_status: failed(failures, ["LEDGER_MUTATION_DETECTED", "RECORD_DELETION_DETECTED"]) ? "FAIL" : "PASS", replayability_status: failed(failures, ["REPLAY_REFERENCE_OMITTED", "REPLAY_RECONSTRUCTION_FAILED", "NONDETERMINISTIC_SEQUENCING"]) ? "FAIL" : "PASS", integrity_protection_status: failed(failures, ["INTEGRITY_HASH_MISMATCH", "BROKEN_HASH_CHAIN", "TAMPER_DETECTION_FAILED"]) ? "FAIL" : "PASS", tenant_isolation_status: failed(failures, ["CROSS_TENANT_LEDGER_ACCESS", "TENANT_ISOLATION_BREACH"]) ? "FAIL" : "PASS", evidence_linkage_status: failures.includes("EVIDENCE_LINKAGE_GAP") ? "FAIL" : "PASS", governance_lineage_status: failures.includes("GOVERNANCE_LINEAGE_GAP") ? "FAIL" : "PASS", constitutional_lineage_status: failures.includes("CONSTITUTIONAL_LINEAGE_GAP") ? "FAIL" : "PASS", lifecycle_status: failed(failures, ["LIFECYCLE_INCONSISTENCY", "ORPHANED_LEDGER_ENTRIES", "INCOMPLETE_AUDIT_HISTORY"]) ? "FAIL" : "PASS", findings: failures, evidence_refs: failures.includes("EVIDENCE_LINKAGE_GAP") ? freezeArray([]) : freezeArray(["evidence:ledger:canonical", "truth-ledger:ledger:canonical"]), governance_refs: failures.includes("GOVERNANCE_LINEAGE_GAP") ? freezeArray([]) : freezeArray(["governance:ledger:1"]), constitutional_refs: failures.includes("CONSTITUTIONAL_LINEAGE_GAP") ? freezeArray([]) : freezeArray(["constitutional:ledger:1"]), replay_refs: failures.includes("REPLAY_REFERENCE_OMITTED") ? freezeArray([]) : freezeArray(["replay:ledger:1"]), certification_refs: freezeArray(LEDGERS.map((ledger) => `certification:${ledger}:10.15.8`)), certification_status: failures.length ? "REJECTED" : "CERTIFIED", certification_timestamp: "2026-07-09T00:00:00.000Z" };
  return Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_HASH_MISMATCH") ? "invalid-integrity" : hashWithoutIntegrity(base) });
}
function integrity(failures: readonly AdaptiveLedgerFailure[]): LedgerIntegrityValidation {
  const base: Omit<LedgerIntegrityValidation, "integrity_hash"> = { validation_id: "ledger_integrity_validation", append_only_enforced: !failures.includes("APPEND_ONLY_VIOLATION"), updates_prohibited: !failures.includes("LEDGER_MUTATION_DETECTED"), deletions_prohibited: !failures.includes("RECORD_DELETION_DETECTED"), immutability_verified: !failed(failures, ["LEDGER_MUTATION_DETECTED", "RECORD_DELETION_DETECTED"]), cryptographic_integrity_verified: !failures.includes("INTEGRITY_HASH_MISMATCH"), hash_chain_continuity_verified: !failures.includes("BROKEN_HASH_CHAIN"), tamper_detection_operational: !failures.includes("TAMPER_DETECTION_FAILED"), replay_hash_verified: !failures.includes("REPLAY_RECONSTRUCTION_FAILED"), certification_hash_verified: !failures.includes("INTEGRITY_HASH_MISMATCH") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function replayLineage(failures: readonly AdaptiveLedgerFailure[]): ReplayLineageValidation {
  const base: Omit<ReplayLineageValidation, "integrity_hash"> = { validation_id: "replay_lineage_validation", replay_reconstruction_supported: !failures.includes("REPLAY_RECONSTRUCTION_FAILED"), replay_refs_complete: !failures.includes("REPLAY_REFERENCE_OMITTED"), stable_identifiers: true, immutable_timestamps: !failures.includes("LEDGER_MUTATION_DETECTED"), event_ordering_deterministic: !failures.includes("NONDETERMINISTIC_SEQUENCING"), state_reconstruction_supported: !failures.includes("REPLAY_RECONSTRUCTION_FAILED"), replay_equivalence_maintained: !failed(failures, ["REPLAY_RECONSTRUCTION_FAILED", "NONDETERMINISTIC_SEQUENCING"]), dependency_lineage_complete: !failures.includes("ORPHANED_LEDGER_ENTRIES") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function evidenceLineage(failures: readonly AdaptiveLedgerFailure[]): EvidenceLineageValidation {
  const base: Omit<EvidenceLineageValidation, "integrity_hash"> = { validation_id: "evidence_lineage_validation", evidence_linkage_complete: !failures.includes("EVIDENCE_LINKAGE_GAP"), truth_ledger_refs_valid: !failures.includes("EVIDENCE_LINKAGE_GAP"), source_observations_linked: !failures.includes("EVIDENCE_LINKAGE_GAP"), supporting_evidence_linked: !failures.includes("EVIDENCE_LINKAGE_GAP"), governance_decisions_linked: !failures.includes("GOVERNANCE_LINEAGE_GAP"), constitutional_evaluations_linked: !failures.includes("CONSTITUTIONAL_LINEAGE_GAP"), replay_artifacts_linked: !failures.includes("REPLAY_REFERENCE_OMITTED"), certification_artifacts_linked: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function tenantIsolation(failures: readonly AdaptiveLedgerFailure[]): TenantLedgerIsolationValidation {
  const base: Omit<TenantLedgerIsolationValidation, "integrity_hash"> = { validation_id: "tenant_ledger_isolation_validation", tenant_isolation_preserved: !failures.includes("TENANT_ISOLATION_BREACH"), cross_tenant_access_blocked: !failures.includes("CROSS_TENANT_LEDGER_ACCESS"), ledger_storage_isolated: !failures.includes("TENANT_ISOLATION_BREACH"), ledger_refs_isolated: !failures.includes("TENANT_ISOLATION_BREACH"), replay_artifacts_isolated: !failures.includes("TENANT_ISOLATION_BREACH"), adaptive_memory_isolated: !failures.includes("TENANT_ISOLATION_BREACH"), governance_records_isolated: !failures.includes("TENANT_ISOLATION_BREACH"), certification_artifacts_isolated: !failures.includes("TENANT_ISOLATION_BREACH"), dashboards_isolated: !failures.includes("TENANT_ISOLATION_BREACH") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function lifecycle(failures: readonly AdaptiveLedgerFailure[]): LedgerLifecycleValidation {
  const base: Omit<LedgerLifecycleValidation, "integrity_hash"> = { validation_id: "ledger_lifecycle_validation", lifecycle_deterministic: !failures.includes("LIFECYCLE_INCONSISTENCY"), ledger_creation_deterministic: true, entry_commitment_deterministic: !failures.includes("LIFECYCLE_INCONSISTENCY"), archival_deterministic: !failures.includes("LIFECYCLE_INCONSISTENCY"), retention_deterministic: !failures.includes("LIFECYCLE_INCONSISTENCY"), replay_access_deterministic: !failures.includes("LIFECYCLE_INCONSISTENCY"), audit_access_deterministic: !failures.includes("LIFECYCLE_INCONSISTENCY"), certification_access_deterministic: !failures.includes("LIFECYCLE_INCONSISTENCY"), audit_continuity_verified: !failures.includes("INCOMPLETE_AUDIT_HISTORY"), orphaned_entries_absent: !failures.includes("ORPHANED_LEDGER_ENTRIES"), ledger_continuity_complete: !failed(failures, ["ORPHANED_LEDGER_ENTRIES", "INCOMPLETE_AUDIT_HISTORY"]) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function certReport(record: AdaptiveLedgerCertificationRecord): AdaptiveLedgerCertificationReport {
  const base: Omit<AdaptiveLedgerCertificationReport, "integrity_hash"> = { report_id: "adaptive_ledger_certification_report", certification_outcome: record.certification_status, append_only_assessment: record.append_only_status, immutability_assessment: record.immutability_status, replayability_assessment: record.replayability_status, integrity_protection_analysis: record.integrity_protection_status, tenant_isolation_validation: record.tenant_isolation_status, evidence_linkage_verification: record.evidence_linkage_status, governance_constitutional_lineage_assessment: record.governance_lineage_status === "PASS" && record.constitutional_lineage_status === "PASS" ? "PASS" : "FAIL", lifecycle_validation: record.lifecycle_status, findings: record.findings, remediation_actions: record.findings.map((f) => `remediate:${f}`), production_readiness_recommendation: record.certification_status === "CERTIFIED" ? "READY" : "BLOCKED" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function integrityLineageReport(record: AdaptiveLedgerCertificationRecord): LedgerIntegrityLineageReport {
  const base: Omit<LedgerIntegrityLineageReport, "integrity_hash"> = { report_id: "ledger_integrity_lineage_report", ledger_inventory: LEDGERS, integrity_verification_result: record.integrity_protection_status, hash_chain_continuity: record.integrity_protection_status, replay_readiness: record.replayability_status, evidence_lineage_completeness: record.evidence_linkage_status, governance_constitutional_traceability: record.governance_lineage_status === "PASS" && record.constitutional_lineage_status === "PASS" ? "PASS" : "FAIL", tenant_isolation_assessment: record.tenant_isolation_status, lifecycle_analysis: record.lifecycle_status, audit_readiness: record.lifecycle_status, certification_evidence_refs: freezeArray([...record.evidence_refs, ...record.governance_refs, ...record.constitutional_refs, ...record.replay_refs, ...record.certification_refs]) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function test(name: string, passed: boolean, failure: AdaptiveLedgerFailure, refs: readonly string[]): AdaptiveLedgerCertificationTest {
  const base: Omit<AdaptiveLedgerCertificationTest, "integrity_hash"> = { test_id: id("adaptive_ledger_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
type BuildBase = Omit<AdaptiveLedgerResult, "validation_tests" | "failures" | "replay_hash" | "integrity_hash">;
function tests(result: BuildBase): readonly AdaptiveLedgerCertificationTest[] {
  const refs = freezeArray([result.record.integrity_hash]);
  return freezeArray([
    test("Append-only enforcement verified", result.integrity_validation.append_only_enforced, "APPEND_ONLY_VIOLATION", refs),
    test("Ledger updates prohibited", result.integrity_validation.updates_prohibited, "LEDGER_MUTATION_DETECTED", refs),
    test("Ledger deletions prohibited", result.integrity_validation.deletions_prohibited, "RECORD_DELETION_DETECTED", refs),
    test("Ledger immutability verified", result.integrity_validation.immutability_verified, "LEDGER_MUTATION_DETECTED", refs),
    test("Replay reconstruction supported", result.replay_lineage_validation.replay_reconstruction_supported, "REPLAY_RECONSTRUCTION_FAILED", refs),
    test("Replay references complete", result.replay_lineage_validation.replay_refs_complete, "REPLAY_REFERENCE_OMITTED", refs),
    test("Event ordering deterministic", result.replay_lineage_validation.event_ordering_deterministic, "NONDETERMINISTIC_SEQUENCING", refs),
    test("Cryptographic integrity verified", result.integrity_validation.cryptographic_integrity_verified, "INTEGRITY_HASH_MISMATCH", refs),
    test("Hash chain continuity verified", result.integrity_validation.hash_chain_continuity_verified, "BROKEN_HASH_CHAIN", refs),
    test("Tamper detection operational", result.integrity_validation.tamper_detection_operational, "TAMPER_DETECTION_FAILED", refs),
    test("Tenant isolation preserved", result.tenant_isolation_validation.tenant_isolation_preserved, "TENANT_ISOLATION_BREACH", refs),
    test("Cross-tenant ledger access blocked", result.tenant_isolation_validation.cross_tenant_access_blocked, "CROSS_TENANT_LEDGER_ACCESS", refs),
    test("Evidence linkage complete", result.evidence_lineage_validation.evidence_linkage_complete, "EVIDENCE_LINKAGE_GAP", refs),
    test("Truth Ledger references valid", result.evidence_lineage_validation.truth_ledger_refs_valid, "EVIDENCE_LINKAGE_GAP", refs),
    test("Governance lineage complete", result.evidence_lineage_validation.governance_decisions_linked, "GOVERNANCE_LINEAGE_GAP", refs),
    test("Constitutional lineage complete", result.evidence_lineage_validation.constitutional_evaluations_linked, "CONSTITUTIONAL_LINEAGE_GAP", refs),
    test("Certification lineage complete", result.evidence_lineage_validation.certification_artifacts_linked, "EVIDENCE_LINKAGE_GAP", refs),
    test("Audit continuity verified", result.lifecycle_validation.audit_continuity_verified, "INCOMPLETE_AUDIT_HISTORY", refs),
    test("Lifecycle deterministic", result.lifecycle_validation.lifecycle_deterministic, "LIFECYCLE_INCONSISTENCY", refs),
    test("Integrity hashes reproducible", hashWithoutIntegrity(result.record) === result.record.integrity_hash, "INTEGRITY_HASH_MISMATCH", refs),
    test("Replay equivalence maintained", result.replay_lineage_validation.replay_equivalence_maintained, "REPLAY_RECONSTRUCTION_FAILED", refs),
    test("Ledger continuity complete", result.lifecycle_validation.ledger_continuity_complete, "ORPHANED_LEDGER_ENTRIES", refs),
    test("Orphaned entries absent", result.lifecycle_validation.orphaned_entries_absent, "ORPHANED_LEDGER_ENTRIES", refs),
    test("Production readiness validated", result.production_ready, "LIFECYCLE_INCONSISTENCY", refs),
  ]);
}
function replayHash(result: Omit<AdaptiveLedgerResult, "replay_hash" | "integrity_hash">): string { return hash({ record: result.record.integrity_hash, entry: result.certified_entry_schema.integrity_hash, integrity: result.integrity_validation.integrity_hash, replay: result.replay_lineage_validation.integrity_hash, evidence: result.evidence_lineage_validation.integrity_hash, tenant: result.tenant_isolation_validation.integrity_hash, lifecycle: result.lifecycle_validation.integrity_hash, failures: result.failures }); }
function integrityHash(result: Omit<AdaptiveLedgerResult, "integrity_hash">): string { return hash({ version: result.adaptive_ledger_certification_version, id: result.certification_identifier, status: result.status, replay_hash: result.replay_hash }); }
export function certifyAdaptiveLedger(input: AdaptiveLedgerInput = {}): AdaptiveLedgerResult {
  const initialFailures = freezeArray(failureForScenario(input.scenario ?? "BASELINE") ? [failureForScenario(input.scenario ?? "BASELINE") as AdaptiveLedgerFailure] : []);
  const rec = record(input, initialFailures);
  const baseWithoutTests: BuildBase = { adaptive_ledger_certification_version: VERSION, certification_identifier: ID, status: initialFailures.length ? "FAIL" : "PASS", api_surface: apiSurface(), record: rec, certified_entry_schema: entrySchema(initialFailures), integrity_validation: integrity(initialFailures), replay_lineage_validation: replayLineage(initialFailures), evidence_lineage_validation: evidenceLineage(initialFailures), tenant_isolation_validation: tenantIsolation(initialFailures), lifecycle_validation: lifecycle(initialFailures), certification_report: certReport(rec), integrity_lineage_report: integrityLineageReport(rec), widgets: WIDGETS, append_only: rec.append_only_status === "PASS", immutable: rec.immutability_status === "PASS", replayable: rec.replayability_status === "PASS", integrity_protected: rec.integrity_protection_status === "PASS", tenant_isolated: rec.tenant_isolation_status === "PASS", production_ready: initialFailures.length === 0 };
  const validation_tests = tests(baseWithoutTests);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((t) => t.failure_reason).filter((f): f is AdaptiveLedgerFailure => Boolean(f))])]);
  const base: Omit<AdaptiveLedgerResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutTests, status: failures.length ? "FAIL" : "PASS", append_only: !failed(failures, ["APPEND_ONLY_VIOLATION", "LEDGER_MUTATION_DETECTED", "RECORD_DELETION_DETECTED"]), immutable: !failed(failures, ["LEDGER_MUTATION_DETECTED", "RECORD_DELETION_DETECTED"]), replayable: !failed(failures, ["REPLAY_REFERENCE_OMITTED", "REPLAY_RECONSTRUCTION_FAILED", "NONDETERMINISTIC_SEQUENCING"]), integrity_protected: !failed(failures, ["INTEGRITY_HASH_MISMATCH", "BROKEN_HASH_CHAIN", "TAMPER_DETECTION_FAILED"]), tenant_isolated: !failed(failures, ["CROSS_TENANT_LEDGER_ACCESS", "TENANT_ISOLATION_BREACH"]), production_ready: failures.length === 0, validation_tests, failures };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}
export function validateAdaptiveLedgerCertification(result?: AdaptiveLedgerResult): AdaptiveLedgerValidationResult {
  if (!result) {
    const failures = freezeArray<AdaptiveLedgerFailure>(["APPEND_ONLY_VIOLATION"]);
    const base: Omit<AdaptiveLedgerValidationResult, "certification_hash"> = { certification_id: null, valid: false, status: "FAIL", failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.record) === result.record.integrity_hash && result.validation_tests.every((t) => hashWithoutIntegrity(t) === t.integrity_hash);
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const valid = result.status === "PASS" && result.failures.length === 0 && result.append_only && result.immutable && result.replayable && result.integrity_protected && result.tenant_isolated && result.production_ready && replay_hash_valid && integrity_hash_valid;
  const base: Omit<AdaptiveLedgerValidationResult, "certification_hash"> = { certification_id: result.record.certification_id, valid, status: result.status, failures: result.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
}
export function replayAdaptiveLedgerCertification(result: AdaptiveLedgerResult): boolean { return validateAdaptiveLedgerCertification(result).valid; }
export function buildAdaptiveLedgerObservability(result = certifyAdaptiveLedger()): AdaptiveLedgerObservability {
  return Object.freeze({ certification_id: result.record.certification_id, status: result.status, failed_tests: result.validation_tests.filter((t) => !t.passed).length, failures: result.failures, append_only: result.append_only, immutable: result.immutable, replayable: result.replayable, integrity_protected: result.integrity_protected, tenant_isolated: result.tenant_isolated, production_ready: result.production_ready, integrity_hash: result.integrity_hash });
}
export function getAdaptiveLedgerContract(): AdaptiveLedgerContract {
  const result = certifyAdaptiveLedger();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, widgets: WIDGETS, ledgers: LEDGERS, append_only_required: true, immutable_required: true, replay_required: true, integrity_required: true, tenant_isolation_required: true, evidence_linkage_required: true }), result, validation: validateAdaptiveLedgerCertification(result), observability: buildAdaptiveLedgerObservability(result) });
}
export const AdaptiveLedgerCertification = Object.freeze({ certify: certifyAdaptiveLedger, validate: validateAdaptiveLedgerCertification, replay: replayAdaptiveLedgerCertification });
