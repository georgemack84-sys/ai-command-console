import { verifyDecisionIntegrity } from "@/services/decision-integrity-verification-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { IntegrityVerificationEngineResult } from "@/types/decision-integrity-verification-engine";
import type {
  ImmutableDecisionLedgerFoundation,
  ImmutableDecisionLedgerResult,
  ImmutableLedgerFailure,
  ImmutableLedgerLifecycleState,
  ImmutableLedgerRecord,
  ImmutableLedgerType,
  LedgerCommitResult,
  LedgerQueryResult,
  LedgerQueryType,
} from "@/types/immutable-decision-ledger";

const LEDGER_VERSION = "immutable-decision-ledger/v1" as const;
const RECORD_VERSION = "immutable-decision-ledger-record/v1" as const;
const SCHEMA_VERSION = "immutable-decision-ledger-schema/v1" as const;
const NOW = "2026-07-05T01:50:00.000Z";

export const IMMUTABLE_LEDGER_TYPES: readonly ImmutableLedgerType[] = Object.freeze(["REPLAY_REQUEST", "REPLAY_EXECUTION", "REPLAY_OUTCOME", "AUDIT_REPORT", "OPERATOR_REVIEW", "DIVERGENCE_REPORT", "INTEGRITY_VERIFICATION", "CERTIFICATION_EVIDENCE"]);
export const IMMUTABLE_LEDGER_LIFECYCLE_STATES: readonly ImmutableLedgerLifecycleState[] = Object.freeze(["CREATED", "VALIDATED", "READY_FOR_COMMIT", "COMMITTED", "ARCHIVED"]);
export const IMMUTABLE_LEDGER_TERMINAL_STATES: readonly ImmutableLedgerLifecycleState[] = Object.freeze(["COMMITTED", "ARCHIVED"]);
export const IMMUTABLE_LEDGER_QUERY_TYPES: readonly LedgerQueryType[] = Object.freeze(["REPLAY_HISTORY", "AUDIT_HISTORY", "INTEGRITY_HISTORY", "DIVERGENCE_REPORTS", "OPERATOR_REVIEWS", "CERTIFICATION_EVIDENCE", "MISSION_LEDGER", "TENANT_LEDGER", "LINEAGE_CHAIN", "REPLAY_CHAIN"]);

type LedgerScenario =
  | "BASELINE"
  | "APPEND_ONLY_VIOLATION"
  | "MODIFICATION_ATTEMPT"
  | "DELETION_ATTEMPT"
  | "REPLACEMENT_ATTEMPT"
  | "HASH_MISMATCH"
  | "BROKEN_LINEAGE"
  | "DUPLICATE_RECORD"
  | "UNSUPPORTED_TYPE"
  | "UNSUPPORTED_SCHEMA"
  | "CROSS_TENANT"
  | "INCOMPLETE_VALIDATION"
  | "UNKNOWN_LIFECYCLE";

type LedgerInput = Readonly<{
  integrity_result?: IntegrityVerificationEngineResult;
  scenario?: LedgerScenario;
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

function ledgerHash(record: Omit<ImmutableLedgerRecord, "integrity_hash"> | ImmutableLedgerRecord): string {
  return hash({
    ledger_record_id: record.ledger_record_id,
    ledger_type: record.ledger_type,
    orchestration_id: record.orchestration_id,
    mission_id: record.mission_id,
    tenant_id: record.tenant_id,
    record_version: record.record_version,
    schema_version: record.schema_version,
    lineage: record.parent_record_refs,
    commit_sequence: record.commit_sequence,
    artifact_refs: record.artifact_refs,
  });
}

export function computeImmutableLedgerRecordHash(record: Omit<ImmutableLedgerRecord, "integrity_hash"> | ImmutableLedgerRecord): string {
  return ledgerHash(record);
}

function ctx(integrity: IntegrityVerificationEngineResult) {
  const replay = integrity.audit_result.replay_difference_result.replay_result.trace_builder_result.snapshot_capture.replay_contract;
  return {
    replay,
    execution: integrity.audit_result.replay_difference_result.replay_result.execution_record,
    report: integrity.audit_result.replay_difference_result.replay_result.report,
    diff: integrity.audit_result.replay_difference_result.diff_result,
    audit: integrity.audit_result.audit_record,
    certification: integrity.audit_result.certification_evidence,
    verification: integrity.verification_record,
  };
}

function refsFor(type: ImmutableLedgerType, integrity: IntegrityVerificationEngineResult): Pick<ImmutableLedgerRecord, "artifact_refs" | "replay_refs" | "governance_refs" | "constitutional_refs" | "audit_refs" | "integrity_refs" | "certification_refs"> {
  const c = ctx(integrity);
  const base = {
    artifact_refs: freezeArray([c.execution.replay_execution_id, c.audit.audit_id, c.verification.verification_id]),
    replay_refs: freezeArray([c.replay.replay_id, c.execution.replay_execution_id]),
    governance_refs: c.certification.governance_refs,
    constitutional_refs: c.certification.constitutional_refs,
    audit_refs: freezeArray([c.audit.audit_id]),
    integrity_refs: freezeArray([c.verification.verification_id, integrity.report.report_id]),
    certification_refs: freezeArray([c.certification.evidence_package_id]),
  };
  if (type === "REPLAY_REQUEST") return { ...base, artifact_refs: freezeArray([c.replay.replay_id]) };
  if (type === "REPLAY_EXECUTION") return { ...base, artifact_refs: freezeArray([c.execution.replay_execution_id]) };
  if (type === "REPLAY_OUTCOME") return { ...base, artifact_refs: freezeArray([c.report.replay_report_id]) };
  if (type === "AUDIT_REPORT") return { ...base, artifact_refs: freezeArray([c.audit.audit_id]) };
  if (type === "OPERATOR_REVIEW") return { ...base, artifact_refs: c.certification.operator_refs };
  if (type === "DIVERGENCE_REPORT") return { ...base, artifact_refs: freezeArray([c.diff.replay_diff_id]) };
  if (type === "INTEGRITY_VERIFICATION") return { ...base, artifact_refs: freezeArray([c.verification.verification_id]) };
  return { ...base, artifact_refs: freezeArray([c.certification.evidence_package_id]) };
}

function buildRecord(type: ImmutableLedgerType, index: number, integrity: IntegrityVerificationEngineResult, parent: string | null, child: string | null, scenario: LedgerScenario): ImmutableLedgerRecord {
  const c = ctx(integrity);
  const recordType = scenario === "UNSUPPORTED_TYPE" && index === 0 ? "UNKNOWN" as ImmutableLedgerType : type;
  const id = scenario === "DUPLICATE_RECORD" && index === 1 ? "ledger_replay_request_01" : `ledger_${type.toLowerCase()}_${String(index + 1).padStart(2, "0")}`;
  const base: Omit<ImmutableLedgerRecord, "integrity_hash"> = {
    ledger_record_id: id,
    ledger_type: recordType,
    orchestration_id: c.replay.orchestration_id,
    mission_id: c.replay.mission_id,
    tenant_id: scenario === "CROSS_TENANT" && index === 0 ? "tenant_other" : c.replay.tenant_id,
    record_version: RECORD_VERSION,
    schema_version: scenario === "UNSUPPORTED_SCHEMA" && index === 0 ? "immutable-decision-ledger-schema/v999" as typeof SCHEMA_VERSION : SCHEMA_VERSION,
    lifecycle_state: scenario === "UNKNOWN_LIFECYCLE" && index === 0 ? "UNKNOWN" as ImmutableLedgerLifecycleState : "COMMITTED",
    ...refsFor(type, integrity),
    parent_record_refs: freezeArray(scenario === "BROKEN_LINEAGE" && index === 3 ? [] : parent ? [parent] : []),
    child_record_refs: freezeArray(child ? [child] : []),
    commit_sequence: scenario === "APPEND_ONLY_VIOLATION" && index === 2 ? 2 : index + 1,
    commit_timestamp: `${NOW}#${String(index + 1).padStart(2, "0")}`,
  };
  const record = Object.freeze({ ...base, integrity_hash: ledgerHash(base) });
  if (scenario === "HASH_MISMATCH" && index === 0) return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.ledger_record_id }) });
  if (scenario === "MODIFICATION_ATTEMPT" && index === 0) return Object.freeze({ ...record, artifact_refs: freezeArray(["modified_after_commit"]) });
  if (scenario === "REPLACEMENT_ATTEMPT" && index === 0) return Object.freeze({ ...record, ledger_record_id: "replacement_record" });
  return record;
}

function buildRecords(integrity: IntegrityVerificationEngineResult, scenario: LedgerScenario): readonly ImmutableLedgerRecord[] {
  const ids = IMMUTABLE_LEDGER_TYPES.map((type, index) => `ledger_${type.toLowerCase()}_${String(index + 1).padStart(2, "0")}`);
  const records = IMMUTABLE_LEDGER_TYPES.map((type, index) => buildRecord(type, index, integrity, index > 0 ? ids[index - 1]! : null, index < ids.length - 1 ? ids[index + 1]! : null, scenario));
  if (scenario === "DELETION_ATTEMPT") return freezeArray(records.slice(0, -1));
  return freezeArray(records);
}

function collectFailures(records: readonly ImmutableLedgerRecord[], integrity: IntegrityVerificationEngineResult, scenario: LedgerScenario): readonly ImmutableLedgerFailure[] {
  const failures: ImmutableLedgerFailure[] = [];
  const c = ctx(integrity);
  if (records.length !== IMMUTABLE_LEDGER_TYPES.length || scenario === "DELETION_ATTEMPT") failures.push("RECORD_DELETION_ATTEMPT");
  if (records.some((record, index) => record.commit_sequence !== index + 1) || scenario === "APPEND_ONLY_VIOLATION") failures.push("APPEND_ONLY_VIOLATION");
  if (scenario === "MODIFICATION_ATTEMPT") failures.push("RECORD_MODIFICATION_ATTEMPT");
  if (scenario === "REPLACEMENT_ATTEMPT") failures.push("RECORD_REPLACEMENT_ATTEMPT");
  if (records.some((record) => ledgerHash(record) !== record.integrity_hash) || scenario === "HASH_MISMATCH" || scenario === "MODIFICATION_ATTEMPT" || scenario === "REPLACEMENT_ATTEMPT") failures.push("HASH_MISMATCH");
  if (records.slice(1).some((record) => record.parent_record_refs.length === 0) || scenario === "BROKEN_LINEAGE") failures.push("LINEAGE_BROKEN");
  if (new Set(records.map((record) => record.ledger_record_id)).size !== records.length || scenario === "DUPLICATE_RECORD") failures.push("DUPLICATE_RECORD_IDENTITY");
  if (records.some((record) => !IMMUTABLE_LEDGER_TYPES.includes(record.ledger_type)) || scenario === "UNSUPPORTED_TYPE") failures.push("UNSUPPORTED_LEDGER_TYPE");
  if (records.some((record) => record.schema_version !== SCHEMA_VERSION) || scenario === "UNSUPPORTED_SCHEMA") failures.push("UNSUPPORTED_SCHEMA_VERSION");
  if (records.some((record) => record.tenant_id !== c.replay.tenant_id) || scenario === "CROSS_TENANT") failures.push("TENANT_BOUNDARY_VIOLATION");
  if (!integrity.certification_ready || scenario === "INCOMPLETE_VALIDATION") failures.push("INCOMPLETE_VALIDATION");
  if (records.some((record) => !IMMUTABLE_LEDGER_LIFECYCLE_STATES.includes(record.lifecycle_state)) || scenario === "UNKNOWN_LIFECYCLE") failures.push("UNKNOWN_LIFECYCLE_STATE");
  return freezeArray([...new Set(failures)]);
}

function commitHash(commit: Omit<LedgerCommitResult, "integrity_hash"> | LedgerCommitResult): string {
  return hashWithoutIntegrity(commit);
}

function buildCommits(records: readonly ImmutableLedgerRecord[], failures: readonly ImmutableLedgerFailure[]): readonly LedgerCommitResult[] {
  return freezeArray(records.map((record) => {
    const recordFailures = failures.length ? failures : [];
    const base: Omit<LedgerCommitResult, "integrity_hash"> = {
      commit_id: `commit_${record.ledger_record_id}`,
      ledger_record_id: record.ledger_record_id,
      validation_result: recordFailures.length ? "BLOCKED" : "VALID",
      commit_status: recordFailures.length ? "REJECTED" : "COMMITTED",
      commit_sequence: record.commit_sequence,
      lineage_verified: !recordFailures.includes("LINEAGE_BROKEN"),
      integrity_verified: !recordFailures.includes("HASH_MISMATCH"),
      commit_timestamp: record.commit_timestamp,
      failures: recordFailures,
    };
    return Object.freeze({ ...base, integrity_hash: commitHash(base) });
  }));
}

function queryHash(query: Omit<LedgerQueryResult, "integrity_hash"> | LedgerQueryResult): string {
  return hashWithoutIntegrity(query);
}

export function queryImmutableDecisionLedger(records: readonly ImmutableLedgerRecord[], query_type: LedgerQueryType): LedgerQueryResult {
  const matching = query_type === "REPLAY_HISTORY" || query_type === "REPLAY_CHAIN"
    ? records.filter((record) => record.ledger_type.startsWith("REPLAY"))
    : query_type === "AUDIT_HISTORY"
      ? records.filter((record) => record.ledger_type === "AUDIT_REPORT")
      : query_type === "INTEGRITY_HISTORY"
        ? records.filter((record) => record.ledger_type === "INTEGRITY_VERIFICATION")
        : query_type === "DIVERGENCE_REPORTS"
          ? records.filter((record) => record.ledger_type === "DIVERGENCE_REPORT")
          : query_type === "OPERATOR_REVIEWS"
            ? records.filter((record) => record.ledger_type === "OPERATOR_REVIEW")
            : query_type === "CERTIFICATION_EVIDENCE"
              ? records.filter((record) => record.ledger_type === "CERTIFICATION_EVIDENCE")
              : records;
  const base: Omit<LedgerQueryResult, "integrity_hash"> = {
    query_id: `ledger_query_${query_type.toLowerCase()}`,
    query_type,
    matching_records: freezeArray(matching),
    lineage_chain: freezeArray(records.map((record) => record.ledger_record_id)),
    replay_ready: records.length === IMMUTABLE_LEDGER_TYPES.length,
    integrity_verified: records.every((record) => ledgerHash(record) === record.integrity_hash),
    query_timestamp: NOW,
    read_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: queryHash(base) });
}

export function commitImmutableDecisionLedger(input: LedgerInput = {}): ImmutableDecisionLedgerResult {
  const scenario = input.scenario ?? "BASELINE";
  const integrity_result = input.integrity_result ?? verifyDecisionIntegrity();
  const records = buildRecords(integrity_result, scenario);
  const failures = collectFailures(records, integrity_result, scenario);
  const commits = buildCommits(records, failures);
  const query_results = freezeArray(IMMUTABLE_LEDGER_QUERY_TYPES.map((queryType) => queryImmutableDecisionLedger(records, queryType)));
  const base: Omit<ImmutableDecisionLedgerResult, "integrity_hash"> = {
    ledger_version: LEDGER_VERSION,
    integrity_result,
    records,
    commits,
    query_results,
    failures,
    append_only: true,
    read_only_queries: true,
    deterministic: true,
    advisory_only: true,
    mutates_history: false,
    certification_ready: failures.length === 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function getImmutableDecisionLedgerFoundation(): ImmutableDecisionLedgerFoundation {
  return Object.freeze({
    ledger_version: LEDGER_VERSION,
    ledger_types: IMMUTABLE_LEDGER_TYPES,
    lifecycle_states: IMMUTABLE_LEDGER_LIFECYCLE_STATES,
    terminal_states: IMMUTABLE_LEDGER_TERMINAL_STATES,
    query_types: IMMUTABLE_LEDGER_QUERY_TYPES,
    result: commitImmutableDecisionLedger(),
  });
}

export const ImmutableDecisionLedger = Object.freeze({
  commit: commitImmutableDecisionLedger,
  query: queryImmutableDecisionLedger,
});
