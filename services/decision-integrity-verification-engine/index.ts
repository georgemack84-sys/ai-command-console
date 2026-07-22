import { generateDecisionAudit } from "@/services/decision-audit-engine";
import { computeTraceEventIntegrityHash } from "@/services/decision-orchestration-trace-builder";
import { computeReplaySnapshotIntegrityHash } from "@/services/decision-replay-snapshot-capture";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { DecisionAuditEngineResult } from "@/types/decision-audit-engine";
import type {
  HashVerificationResult,
  IntegrityDomainResult,
  IntegrityLedgerEntry,
  IntegrityLifecycleState,
  IntegrityOutcome,
  IntegrityReport,
  IntegrityVerificationEngineFoundation,
  IntegrityVerificationEngineResult,
  IntegrityVerificationFailure,
  IntegrityVerificationRecord,
} from "@/types/decision-integrity-verification-engine";

const ENGINE_VERSION = "decision-integrity-verification-engine/v1" as const;
const SCHEMA_VERSION = "decision-integrity-verification-schema/v1" as const;
const NOW = "2026-07-05T01:40:00.000Z";

export const INTEGRITY_VERIFICATION_LIFECYCLE_STATES: readonly IntegrityLifecycleState[] = Object.freeze(["CREATED", "VALIDATING", "VERIFIED", "MONITORED", "ARCHIVED", "MODIFIED", "CORRUPTED", "MISSING", "FAIL_CLOSED"]);
export const INTEGRITY_OUTCOMES: readonly IntegrityOutcome[] = Object.freeze(["VERIFIED", "MODIFIED", "CORRUPTED", "MISSING", "FAIL_CLOSED"]);

type IntegrityScenario =
  | "BASELINE"
  | "MODIFIED_ARTIFACT"
  | "CORRUPTED_ARTIFACT"
  | "MISSING_ARTIFACT"
  | "BROKEN_LINEAGE"
  | "CROSS_TENANT"
  | "UNSUPPORTED_ALGORITHM"
  | "VERIFICATION_INTERRUPTED"
  | "UNKNOWN_OUTCOME"
  | "LEDGER_MUTATION"
  | "REPLAY_INCONSISTENCY"
  | "PACKAGE_INCONSISTENCY"
  | "OPERATOR_INCONSISTENCY"
  | "SNAPSHOT_INCONSISTENCY";

type IntegrityInput = Readonly<{
  audit_result?: DecisionAuditEngineResult;
  scenario?: IntegrityScenario;
}>;

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

function traceRecordHash(value: object): string {
  const record = value as {
    trace_id: string;
    orchestration_id: string;
    mission_id: string;
    tenant_id: string;
    trace_version: string;
    schema_version: string;
    trace_state: string;
    execution_timeline: { integrity_hash: string };
    trace_events: readonly { integrity_hash: string }[];
    dependency_trace: readonly { integrity_hash: string }[];
    lineage_refs: unknown;
    replay_refs: unknown;
  };
  return hash({
    trace_id: record.trace_id,
    orchestration_id: record.orchestration_id,
    mission_id: record.mission_id,
    tenant_id: record.tenant_id,
    trace_version: record.trace_version,
    schema_version: record.schema_version,
    trace_state: record.trace_state,
    timeline_hash: record.execution_timeline.integrity_hash,
    event_hashes: record.trace_events.map((event) => event.integrity_hash),
    dependency_hashes: record.dependency_trace.map((dependency) => dependency.integrity_hash),
    lineage_refs: record.lineage_refs,
    replay_refs: record.replay_refs,
  });
}

function recompute(id: string, value: object): string {
  if (id.startsWith("snapshot_") && "snapshot_type" in value && !("ledger_entry_id" in value)) return computeReplaySnapshotIntegrityHash(value as Parameters<typeof computeReplaySnapshotIntegrityHash>[0]);
  if (id.startsWith("event_") && "event_type" in value) return computeTraceEventIntegrityHash(value as Parameters<typeof computeTraceEventIntegrityHash>[0]);
  if (id.startsWith("trace_") && "trace_events" in value) return traceRecordHash(value);
  return hashWithoutIntegrity(value);
}

function ctx(audit: DecisionAuditEngineResult) {
  const replay = audit.replay_difference_result.replay_result.trace_builder_result.snapshot_capture.replay_contract;
  return {
    replay,
    snapshots: audit.replay_difference_result.replay_result.trace_builder_result.snapshot_capture.snapshots,
    snapshotLedger: audit.replay_difference_result.replay_result.trace_builder_result.snapshot_capture.ledger,
    trace: audit.replay_difference_result.replay_result.trace_builder_result.trace_record,
    traceLedger: audit.replay_difference_result.replay_result.trace_builder_result.ledger,
    replayExecution: audit.replay_difference_result.replay_result.execution_record,
    replayLedger: audit.replay_difference_result.replay_result.ledger,
    diff: audit.replay_difference_result.diff_result,
    diffLedger: audit.replay_difference_result.ledger,
  };
}

function artifactPairs(audit: DecisionAuditEngineResult): readonly { id: string; value: object; storedHash: string }[] {
  const c = ctx(audit);
  return freezeArray([
    ...c.snapshots.map((snapshot) => ({ id: snapshot.snapshot_id, value: snapshot, storedHash: snapshot.integrity_hash })),
    ...c.snapshotLedger.map((entry) => ({ id: entry.ledger_entry_id, value: entry, storedHash: entry.integrity_hash })),
    { id: c.trace.trace_id, value: c.trace, storedHash: c.trace.integrity_hash },
    ...c.trace.trace_events.map((event) => ({ id: event.event_id, value: event, storedHash: event.integrity_hash })),
    ...c.trace.dependency_trace.map((dependency) => ({ id: dependency.dependency_trace_id, value: dependency, storedHash: dependency.integrity_hash })),
    ...c.traceLedger.map((entry) => ({ id: entry.ledger_entry_id, value: entry, storedHash: entry.integrity_hash })),
    { id: c.replayExecution.replay_execution_id, value: c.replayExecution, storedHash: c.replayExecution.integrity_hash },
    { id: audit.replay_difference_result.replay_result.report.replay_report_id, value: audit.replay_difference_result.replay_result.report, storedHash: audit.replay_difference_result.replay_result.report.integrity_hash },
    ...c.replayLedger.map((entry) => ({ id: entry.ledger_entry_id, value: entry, storedHash: entry.integrity_hash })),
    { id: c.diff.replay_diff_id, value: c.diff, storedHash: c.diff.integrity_hash },
    { id: audit.replay_difference_result.drift_report.drift_report_id, value: audit.replay_difference_result.drift_report, storedHash: audit.replay_difference_result.drift_report.integrity_hash },
    ...c.diff.difference_records.map((record) => ({ id: record.difference_id, value: record, storedHash: record.integrity_hash })),
    ...c.diffLedger.map((entry) => ({ id: entry.ledger_entry_id, value: entry, storedHash: entry.integrity_hash })),
    { id: audit.audit_record.audit_id, value: audit.audit_record, storedHash: audit.audit_record.integrity_hash },
    { id: audit.audit_package.orchestration_summary.section_id, value: audit.audit_package.orchestration_summary, storedHash: audit.audit_package.orchestration_summary.integrity_hash },
    { id: audit.audit_package.considered_decisions.section_id, value: audit.audit_package.considered_decisions, storedHash: audit.audit_package.considered_decisions.integrity_hash },
    { id: audit.audit_package.rejected_decisions.section_id, value: audit.audit_package.rejected_decisions, storedHash: audit.audit_package.rejected_decisions.integrity_hash },
    { id: audit.audit_package.evidence_summary.section_id, value: audit.audit_package.evidence_summary, storedHash: audit.audit_package.evidence_summary.integrity_hash },
    { id: audit.audit_package.governance_validation.section_id, value: audit.audit_package.governance_validation, storedHash: audit.audit_package.governance_validation.integrity_hash },
    { id: audit.audit_package.constitutional_validation.section_id, value: audit.audit_package.constitutional_validation, storedHash: audit.audit_package.constitutional_validation.integrity_hash },
    { id: audit.audit_package.priority_explanation.section_id, value: audit.audit_package.priority_explanation, storedHash: audit.audit_package.priority_explanation.integrity_hash },
    { id: audit.audit_package.conflict_resolution.section_id, value: audit.audit_package.conflict_resolution, storedHash: audit.audit_package.conflict_resolution.integrity_hash },
    { id: audit.audit_package.operator_actions.section_id, value: audit.audit_package.operator_actions, storedHash: audit.audit_package.operator_actions.integrity_hash },
    { id: audit.audit_package.final_outcome.section_id, value: audit.audit_package.final_outcome, storedHash: audit.audit_package.final_outcome.integrity_hash },
    { id: audit.audit_package.replay_verification.section_id, value: audit.audit_package.replay_verification, storedHash: audit.audit_package.replay_verification.integrity_hash },
    { id: audit.audit_package.integrity_verification.section_id, value: audit.audit_package.integrity_verification, storedHash: audit.audit_package.integrity_verification.integrity_hash },
    { id: audit.audit_package.compliance_summary.compliance_id, value: audit.audit_package.compliance_summary, storedHash: audit.audit_package.compliance_summary.integrity_hash },
    { id: audit.audit_package.certification_evidence.evidence_package_id, value: audit.audit_package.certification_evidence, storedHash: audit.audit_package.certification_evidence.integrity_hash },
    { id: "decision_audit_package", value: audit.audit_package, storedHash: audit.audit_package.integrity_hash },
    ...audit.ledger.map((entry) => ({ id: entry.ledger_entry_id, value: entry, storedHash: entry.integrity_hash })),
    { id: "decision_audit_engine_result", value: audit, storedHash: audit.integrity_hash },
  ]);
}

function hashResult(id: string, storedHash: string, recomputedHash: string, scenario: IntegrityScenario): HashVerificationResult {
  const base: Omit<HashVerificationResult, "integrity_hash"> = {
    artifact_id: id,
    stored_hash: scenario === "MODIFIED_ARTIFACT" && id === "decision_audit_package" ? hash({ modified: id }) : storedHash,
    recomputed_hash: recomputedHash,
    hash_algorithm: scenario === "UNSUPPORTED_ALGORITHM" && id === "decision_audit_package" ? "MD5" as "SHA-256" : "SHA-256",
    match_status: scenario === "MODIFIED_ARTIFACT" && id === "decision_audit_package" ? "MISMATCH" : storedHash === recomputedHash ? "MATCH" : "MISMATCH",
    verification_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildHashResults(audit: DecisionAuditEngineResult, scenario: IntegrityScenario): readonly HashVerificationResult[] {
  if (scenario === "MISSING_ARTIFACT") return freezeArray(artifactPairs(audit).slice(1).map((artifact) => hashResult(artifact.id, artifact.storedHash, recompute(artifact.id, artifact.value), scenario)));
  if (scenario === "CORRUPTED_ARTIFACT") {
    const artifacts = artifactPairs(audit);
    return freezeArray(artifacts.map((artifact, index) => hashResult(artifact.id, artifact.storedHash, index === 0 ? "corrupted" : recompute(artifact.id, artifact.value), scenario)));
  }
  return freezeArray(artifactPairs(audit).map((artifact) => hashResult(artifact.id, artifact.storedHash, recompute(artifact.id, artifact.value), scenario)));
}

function domainResult(domain: IntegrityDomainResult["domain"], verified: boolean, failed: readonly string[]): IntegrityDomainResult {
  const base: Omit<IntegrityDomainResult, "integrity_hash"> = {
    domain_id: `integrity_domain_${domain.toLowerCase()}`,
    domain,
    verified,
    failed_artifacts: freezeArray(failed),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function ledgerEntries(audit: DecisionAuditEngineResult) {
  const c = ctx(audit);
  return [...c.snapshotLedger, ...c.traceLedger, ...c.replayLedger, ...c.diffLedger, ...audit.ledger];
}

function collectFailures(audit: DecisionAuditEngineResult, hashes: readonly HashVerificationResult[], scenario: IntegrityScenario): readonly IntegrityVerificationFailure[] {
  const failures: IntegrityVerificationFailure[] = [];
  const c = ctx(audit);
  if (hashes.some((result) => result.match_status === "MISMATCH") || scenario === "MODIFIED_ARTIFACT") failures.push("HASH_MISMATCH");
  if (scenario === "CORRUPTED_ARTIFACT") failures.push("CORRUPTED_ARTIFACT");
  if (scenario === "MISSING_ARTIFACT" || c.snapshots.length === 0) failures.push("MISSING_ARTIFACT");
  if (scenario === "BROKEN_LINEAGE" || audit.audit_record.lineage_refs.length === 0 || c.trace.lineage_refs.length === 0) failures.push("LINEAGE_BROKEN");
  if (scenario === "CROSS_TENANT" || audit.audit_record.tenant_id !== c.replay.tenant_id || c.snapshots.some((snapshot) => snapshot.tenant_id !== c.replay.tenant_id)) failures.push("TENANT_BOUNDARY_VIOLATION");
  if (scenario === "UNSUPPORTED_ALGORITHM" || hashes.some((result) => result.hash_algorithm !== "SHA-256")) failures.push("UNSUPPORTED_HASH_ALGORITHM");
  if (scenario === "VERIFICATION_INTERRUPTED") failures.push("VERIFICATION_INTERRUPTED");
  if (scenario === "UNKNOWN_OUTCOME") failures.push("UNKNOWN_INTEGRITY_OUTCOME");
  if (scenario === "REPLAY_INCONSISTENCY" || !audit.replay_difference_result.replay_result.report.certification_ready) failures.push("REPLAY_INCONSISTENCY");
  if (scenario === "PACKAGE_INCONSISTENCY" || !audit.audit_package.certification_evidence.certification_ready) failures.push("PACKAGE_INCONSISTENCY");
  if (scenario === "OPERATOR_INCONSISTENCY" || audit.audit_package.operator_actions.evidence_refs.length === 0) failures.push("OPERATOR_INCONSISTENCY");
  if (scenario === "SNAPSHOT_INCONSISTENCY" || !audit.replay_difference_result.replay_result.trace_builder_result.snapshot_capture.validation.replay_ready) failures.push("SNAPSHOT_INCONSISTENCY");
  const ledgers = ledgerEntries(audit);
  const ledgerContinuity = ledgers.every((entry, index) => entry.append_only && !entry.deleted && entry.sequence >= 1 && typeof entry.integrity_hash === "string" && (index === 0 || entry.sequence >= 1));
  if (scenario === "LEDGER_MUTATION" || !ledgerContinuity) failures.push("LEDGER_INCONSISTENCY");
  return freezeArray([...new Set(failures)]);
}

function outcomeFor(failures: readonly IntegrityVerificationFailure[]): IntegrityOutcome {
  if (failures.includes("UNKNOWN_INTEGRITY_OUTCOME") || failures.includes("VERIFICATION_INTERRUPTED") || failures.includes("UNSUPPORTED_HASH_ALGORITHM") || failures.includes("TENANT_BOUNDARY_VIOLATION") || failures.includes("LINEAGE_BROKEN")) return "FAIL_CLOSED";
  if (failures.includes("MISSING_ARTIFACT")) return "MISSING";
  if (failures.includes("CORRUPTED_ARTIFACT")) return "CORRUPTED";
  if (failures.includes("HASH_MISMATCH")) return "MODIFIED";
  if (failures.length) return "FAIL_CLOSED";
  return "VERIFIED";
}

function buildReport(verificationId: string, hashes: readonly HashVerificationResult[], failures: readonly IntegrityVerificationFailure[], outcome: IntegrityOutcome): IntegrityReport {
  const failed = freezeArray(hashes.filter((result) => result.match_status === "MISMATCH").map((result) => result.artifact_id));
  const missing = failures.includes("MISSING_ARTIFACT") ? freezeArray(["required_replay_artifact"]) : freezeArray([]);
  const corrupted = failures.includes("CORRUPTED_ARTIFACT") ? freezeArray(["corrupted_replay_artifact"]) : freezeArray([]);
  const base: Omit<IntegrityReport, "integrity_hash"> = {
    report_id: `integrity_report_${verificationId}`,
    verification_id: verificationId,
    verified_artifacts: freezeArray(hashes.filter((result) => result.match_status === "MATCH").map((result) => result.artifact_id)),
    modified_artifacts: failed,
    corrupted_artifacts: corrupted,
    missing_artifacts: missing,
    lineage_summary: failures.includes("LINEAGE_BROKEN") ? "lineage failure detected" : "lineage verified",
    consistency_summary: failures.some((failure) => failure.endsWith("INCONSISTENCY")) ? "consistency failure detected" : "cross-artifact consistency verified",
    tamper_summary: failures.length ? "tamper or trust failure detected" : "no tampering detected",
    integrity_outcome: outcome,
    certification_ready: outcome === "VERIFIED",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(audit: DecisionAuditEngineResult, hashes: readonly HashVerificationResult[], failures: readonly IntegrityVerificationFailure[], report: IntegrityReport, outcome: IntegrityOutcome, scenario: IntegrityScenario): IntegrityVerificationRecord {
  const c = ctx(audit);
  const failedHashes = hashes.filter((result) => result.match_status === "MISMATCH").map((result) => result.artifact_id);
  const lineage = domainResult("LINEAGE", !failures.includes("LINEAGE_BROKEN"), failures.includes("LINEAGE_BROKEN") ? ["lineage_chain"] : []);
  const consistency = freezeArray([
    domainResult("SNAPSHOT", !failures.includes("SNAPSHOT_INCONSISTENCY"), failures.includes("SNAPSHOT_INCONSISTENCY") ? ["snapshot_chain"] : []),
    domainResult("LEDGER", !failures.includes("LEDGER_INCONSISTENCY"), failures.includes("LEDGER_INCONSISTENCY") ? ["ledger_chain"] : []),
    domainResult("REPLAY", !failures.includes("REPLAY_INCONSISTENCY"), failures.includes("REPLAY_INCONSISTENCY") ? ["replay_chain"] : []),
    domainResult("PACKAGE", !failures.includes("PACKAGE_INCONSISTENCY"), failures.includes("PACKAGE_INCONSISTENCY") ? ["audit_package"] : []),
    domainResult("OPERATOR", !failures.includes("OPERATOR_INCONSISTENCY"), failures.includes("OPERATOR_INCONSISTENCY") ? ["operator_workflow"] : []),
  ]);
  const tamper = domainResult("TAMPER", failures.length === 0, failedHashes);
  const base: Omit<IntegrityVerificationRecord, "integrity_hash"> = {
    verification_id: `integrity_verification_${c.replay.orchestration_id}`,
    orchestration_id: c.replay.orchestration_id,
    replay_id: c.replay.replay_id,
    mission_id: c.replay.mission_id,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_other" : c.replay.tenant_id,
    verification_version: ENGINE_VERSION,
    schema_version: SCHEMA_VERSION,
    verification_scope: freezeArray(["hashes", "lineage", "snapshots", "ledgers", "replay", "packages", "operator", "audit", "certification"]),
    artifact_refs: freezeArray(hashes.map((result) => result.artifact_id)),
    hash_results: hashes,
    lineage_results: lineage,
    consistency_results: consistency,
    tamper_results: tamper,
    integrity_outcome: outcome,
    validation_status: outcome === "VERIFIED" ? "VALID" : "BLOCKED",
    report_ref: report.report_id,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function ledgerHash(entry: Omit<IntegrityLedgerEntry, "integrity_hash"> | IntegrityLedgerEntry): string {
  return hashWithoutIntegrity(entry);
}

function buildLedger(record: IntegrityVerificationRecord, report: IntegrityReport): readonly IntegrityLedgerEntry[] {
  const base: Omit<IntegrityLedgerEntry, "integrity_hash"> = {
    ledger_entry_id: `integrity_ledger_${record.verification_id}`,
    verification_id: record.verification_id,
    sequence: 1,
    record_hash: record.integrity_hash,
    report_hash: report.integrity_hash,
    append_only: true,
    deleted: false,
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: ledgerHash(base) })]);
}

export function verifyDecisionIntegrity(input: IntegrityInput = {}): IntegrityVerificationEngineResult {
  const scenario = input.scenario ?? "BASELINE";
  const audit_result = input.audit_result ?? generateDecisionAudit(
    scenario === "BROKEN_LINEAGE" ? { scenario: "BROKEN_LINEAGE" }
      : scenario === "CROSS_TENANT" ? { scenario: "CROSS_TENANT" }
        : scenario === "PACKAGE_INCONSISTENCY" ? { scenario: "MISSING_CERTIFICATION_EVIDENCE" }
          : scenario === "OPERATOR_INCONSISTENCY" ? { scenario: "MISSING_EVIDENCE" }
            : scenario === "REPLAY_INCONSISTENCY" ? { scenario: "MISSING_REPLAY" }
              : {},
  );
  const hash_results = buildHashResults(audit_result, scenario);
  const failures = collectFailures(audit_result, hash_results, scenario);
  const integrity_outcome = outcomeFor(failures);
  const verificationId = `integrity_verification_${ctx(audit_result).replay.orchestration_id}`;
  const report = buildReport(verificationId, hash_results, failures, integrity_outcome);
  const verification_record = buildRecord(audit_result, hash_results, failures, report, integrity_outcome, scenario);
  const ledger = buildLedger(verification_record, report);
  const base: Omit<IntegrityVerificationEngineResult, "integrity_hash"> = {
    verification_engine_version: ENGINE_VERSION,
    audit_result,
    verification_record,
    report,
    ledger,
    failures,
    deterministic: true,
    advisory_only: true,
    mutates_artifacts: false,
    certification_ready: integrity_outcome === "VERIFIED",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function getIntegrityVerificationEngineFoundation(): IntegrityVerificationEngineFoundation {
  return Object.freeze({
    verification_engine_version: ENGINE_VERSION,
    lifecycle_states: INTEGRITY_VERIFICATION_LIFECYCLE_STATES,
    outcomes: INTEGRITY_OUTCOMES,
    result: verifyDecisionIntegrity(),
  });
}

export const IntegrityVerificationEngine = Object.freeze({
  verify: verifyDecisionIntegrity,
});
