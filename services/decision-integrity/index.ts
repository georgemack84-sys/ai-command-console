import crypto from "crypto";
import { createReplayLineageContract, reconstructDecisionHistory, validateReplayLineageContract } from "@/services/decision-replay-lineage";
import type {
  DecisionIntegrityEvaluation,
  DecisionIntegrityFailure,
  DecisionIntegrityInput,
  DecisionIntegrityLedgerEntry,
  DecisionIntegrityObservability,
  DecisionIntegrityRecord,
  DecisionIntegrityValidationResult,
  DecisionVerificationState,
  IntegrityAuditRecord,
  IntegrityMetadata,
  IntegrityMutationReport,
} from "@/types/decision-integrity";
import type { DecisionReplayLineageContract } from "@/types/decision-replay-lineage";

const NOW = "2026-07-02T09:18:00.000Z";

function normalize(value: unknown): unknown {
  if (value === undefined) return null;
  if (typeof value === "string") return value.normalize("NFC");
  if (typeof value === "number") return Number.isFinite(value) ? Number(value.toFixed(10)) : null;
  if (Array.isArray(value)) return value.map((item) => normalize(item));
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record).sort().map((key) => [key, normalize(record[key])]));
  }
  return value;
}

export function serializeDecisionCanonically(value: unknown): string {
  return JSON.stringify(normalize(value));
}

function stripIntegrity(value: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...value };
  delete copy.integrity_hash;
  delete copy.deterministic_hash;
  return copy;
}

export function generateDecisionIntegrityHash(value: unknown): string {
  return crypto.createHash("sha256").update(serializeDecisionCanonically(value), "utf8").digest("hex");
}

function hashRecord(value: Record<string, unknown>): string {
  return generateDecisionIntegrityHash(stripIntegrity(value));
}

function replayHash(contract: DecisionReplayLineageContract): string {
  return generateDecisionIntegrityHash(contract.replay_references.map((ref) => [ref.replay_reference_id, ref.integrity_hash]));
}

function lineageHash(contract: DecisionReplayLineageContract): string {
  return generateDecisionIntegrityHash(contract.lineage);
}

function stateForFailures(failures: readonly DecisionIntegrityFailure[]): DecisionVerificationState {
  if (failures.includes("HASH_MISMATCH")) return "HASH_MISMATCH";
  if (failures.includes("SERIALIZATION_MISMATCH") || failures.includes("UNSUPPORTED_SERIALIZATION_VERSION")) return "SERIALIZATION_FAILURE";
  if (failures.includes("ORDERING_VIOLATION")) return "ORDERING_FAILURE";
  if (failures.includes("HISTORICAL_MUTATION") || failures.includes("OVERWRITE_ATTEMPT") || failures.includes("RECORD_DELETION") || failures.includes("GOVERNANCE_EVIDENCE_TAMPERING") || failures.includes("CONSTITUTIONAL_EVIDENCE_TAMPERING") || failures.includes("UNAUTHORIZED_LIFECYCLE_EDIT")) return "MUTATION_DETECTED";
  if (failures.includes("REPLAY_INCONSISTENCY")) return "REPLAY_FAILURE";
  if (failures.includes("LINEAGE_INCONSISTENCY")) return "LINEAGE_FAILURE";
  return failures.length ? "MUTATION_DETECTED" : "VERIFIED";
}

export function createDecisionIntegrityRecord(input: DecisionIntegrityInput = {}): DecisionIntegrityRecord {
  const replay_contract = input.replay_contract ?? createReplayLineageContract(input.scenario === "REPLAY_INCONSISTENCY" ? { scenario: "ORDER_FAILURE" } : input.scenario === "LINEAGE_INCONSISTENCY" ? { scenario: "BROKEN_LINEAGE" } : {});
  const failures = scenarioFailures(input.scenario);
  const base: Omit<DecisionIntegrityRecord, "integrity_hash"> = {
    integrity_id: `integrity_${replay_contract.orchestration_id}`,
    orchestration_id: replay_contract.orchestration_id,
    tenant_id: input.scenario === "TENANT_VIOLATION" ? "tenant_beta" : replay_contract.tenant_id,
    mission_id: replay_contract.mission_id,
    record_version: "decision-integrity-record/v1",
    serialization_version: input.scenario === "UNSUPPORTED_SERIALIZATION" ? "decision-integrity-canonical-json/v999" as "decision-integrity-canonical-json/v1" : "decision-integrity-canonical-json/v1",
    integrity_algorithm: input.scenario === "UNSUPPORTED_ALGORITHM" ? "MD5" as "SHA-256" : "SHA-256",
    parent_hash: input.parent_hash,
    replay_hash: replayHash(replay_contract),
    lineage_hash: lineageHash(replay_contract),
    verification_status: stateForFailures(failures),
    created_at: NOW,
    append_only: true,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashRecord(base) });
  return input.scenario === "HASH_MISMATCH" ? Object.freeze({ ...record, integrity_hash: "tampered" }) : record;
}

function scenarioFailures(scenario?: DecisionIntegrityInput["scenario"]): readonly DecisionIntegrityFailure[] {
  const map: Partial<Record<NonNullable<DecisionIntegrityInput["scenario"]>, DecisionIntegrityFailure>> = {
    HASH_MISMATCH: "HASH_MISMATCH",
    SERIALIZATION_MISMATCH: "SERIALIZATION_MISMATCH",
    ORDERING_VIOLATION: "ORDERING_VIOLATION",
    HISTORICAL_MUTATION: "HISTORICAL_MUTATION",
    OVERWRITE_ATTEMPT: "OVERWRITE_ATTEMPT",
    RECORD_DELETION: "RECORD_DELETION",
    REPLAY_INCONSISTENCY: "REPLAY_INCONSISTENCY",
    LINEAGE_INCONSISTENCY: "LINEAGE_INCONSISTENCY",
    GOVERNANCE_TAMPERING: "GOVERNANCE_EVIDENCE_TAMPERING",
    CONSTITUTIONAL_TAMPERING: "CONSTITUTIONAL_EVIDENCE_TAMPERING",
    LIFECYCLE_EDIT: "UNAUTHORIZED_LIFECYCLE_EDIT",
    UNSUPPORTED_SERIALIZATION: "UNSUPPORTED_SERIALIZATION_VERSION",
    UNSUPPORTED_ALGORITHM: "UNSUPPORTED_INTEGRITY_ALGORITHM",
    TENANT_VIOLATION: "TENANT_BOUNDARY_VIOLATION",
  };
  return Object.freeze(scenario && map[scenario] ? [map[scenario]] : []);
}

function createLedger(record: DecisionIntegrityRecord, scenario?: DecisionIntegrityInput["scenario"]): readonly DecisionIntegrityLedgerEntry[] {
  const base: Omit<DecisionIntegrityLedgerEntry, "integrity_hash"> = {
    ledger_entry_id: `ledger_${record.integrity_id}_001`,
    integrity_id: record.integrity_id,
    orchestration_id: record.orchestration_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    sequence: scenario === "ORDERING_VIOLATION" ? 99 : 1,
    previous_entry_hash: record.parent_hash,
    record_hash: record.integrity_hash,
    append_only: scenario === "OVERWRITE_ATTEMPT" ? false as true : true,
    deleted: scenario === "RECORD_DELETION" ? true as false : false,
    recorded_at: NOW,
  };
  return Object.freeze([Object.freeze({ ...base, integrity_hash: hashRecord(base) })]);
}

export function createDecisionIntegrityEvaluation(input: DecisionIntegrityInput = {}): DecisionIntegrityEvaluation {
  const replay_contract = input.replay_contract ?? createReplayLineageContract(input.scenario === "REPLAY_INCONSISTENCY" ? { scenario: "ORDER_FAILURE" } : input.scenario === "LINEAGE_INCONSISTENCY" ? { scenario: "BROKEN_LINEAGE" } : {});
  const integrity_record = createDecisionIntegrityRecord({ ...input, replay_contract });
  const ledger = createLedger(integrity_record, input.scenario);
  const failures = collectFailures({ replay_contract, integrity_record, ledger, scenario: input.scenario });
  const verification_state = stateForFailures(failures);
  const metadataBase: Omit<IntegrityMetadata, "integrity_hash"> = {
    integrity_id: integrity_record.integrity_id,
    orchestration_id: integrity_record.orchestration_id,
    serialization_version: integrity_record.serialization_version,
    integrity_algorithm: integrity_record.integrity_algorithm,
    verification_state,
    replay_hash: integrity_record.replay_hash,
    lineage_hash: integrity_record.lineage_hash,
    audit_refs: Object.freeze([`audit_${integrity_record.integrity_id}`]),
    verification_timestamp: NOW,
  };
  const metadata = Object.freeze({ ...metadataBase, integrity_hash: hashRecord(metadataBase) });
  const auditBase: Omit<IntegrityAuditRecord, "integrity_hash"> = {
    audit_id: `audit_${integrity_record.integrity_id}`,
    integrity_id: integrity_record.integrity_id,
    orchestration_id: integrity_record.orchestration_id,
    verification_state,
    failures,
    append_only: true,
    advisory_only: true,
    recorded_at: NOW,
  };
  const audit_record = Object.freeze({ ...auditBase, integrity_hash: hashRecord(auditBase) });
  const base: Omit<DecisionIntegrityEvaluation, "integrity_hash"> = {
    evaluation_id: `eval_${integrity_record.integrity_id}`,
    replay_contract,
    integrity_record,
    metadata,
    audit_record,
    ledger,
    verification_state,
    failures,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashRecord(base) });
}

function collectFailures(input: {
  replay_contract: DecisionReplayLineageContract;
  integrity_record: DecisionIntegrityRecord;
  ledger: readonly DecisionIntegrityLedgerEntry[];
  scenario?: DecisionIntegrityInput["scenario"];
}): readonly DecisionIntegrityFailure[] {
  const replayValidation = validateReplayLineageContract(input.replay_contract);
  const failures: DecisionIntegrityFailure[] = [...scenarioFailures(input.scenario)];
  if (hashRecord(input.integrity_record) !== input.integrity_record.integrity_hash) failures.push("HASH_MISMATCH");
  if (input.integrity_record.serialization_version !== "decision-integrity-canonical-json/v1") failures.push("UNSUPPORTED_SERIALIZATION_VERSION");
  if (input.integrity_record.integrity_algorithm !== "SHA-256") failures.push("UNSUPPORTED_INTEGRITY_ALGORITHM");
  if (!input.ledger.every((entry, index) => entry.sequence === index + 1)) failures.push("ORDERING_VIOLATION");
  if (!input.ledger.every((entry) => entry.append_only)) failures.push("OVERWRITE_ATTEMPT");
  if (input.ledger.some((entry) => entry.deleted)) failures.push("RECORD_DELETION");
  if (replayValidation.failures.includes("HASH_MISMATCH") || reconstructDecisionHistory(input.replay_contract).reconstructed_hash !== input.replay_contract.integrity_hash) failures.push("REPLAY_INCONSISTENCY");
  if (!replayValidation.checks.lineage_complete || !replayValidation.checks.lineage_acyclic) failures.push("LINEAGE_INCONSISTENCY");
  if (input.integrity_record.tenant_id !== input.replay_contract.tenant_id) failures.push("TENANT_BOUNDARY_VIOLATION");
  if (input.replay_contract.compliance_evaluation.governance_references.some((ref) => !ref.integrity_hash || ref.integrity_hash === "tampered")) failures.push("GOVERNANCE_EVIDENCE_TAMPERING");
  if (input.replay_contract.compliance_evaluation.constitutional_references.some((ref) => !ref.integrity_hash || ref.integrity_hash === "tampered")) failures.push("CONSTITUTIONAL_EVIDENCE_TAMPERING");
  return Object.freeze([...new Set(failures)]);
}

export function validateDecisionIntegrity(evaluation: DecisionIntegrityEvaluation): DecisionIntegrityValidationResult {
  const failures = Object.freeze([...new Set([
    ...evaluation.failures,
    ...collectFailures(evaluation),
    ...(hashRecord(evaluation.metadata) !== evaluation.metadata.integrity_hash ? ["HASH_MISMATCH" as const] : []),
    ...(hashRecord(evaluation.audit_record) !== evaluation.audit_record.integrity_hash ? ["HASH_MISMATCH" as const] : []),
    ...(hashRecord(evaluation) !== evaluation.integrity_hash ? ["HASH_MISMATCH" as const] : []),
  ])]);
  const has = (failure: DecisionIntegrityFailure) => failures.includes(failure);
  return Object.freeze({
    validation_status: failures.length ? "FAILED_CLOSED" : "VALID",
    verification_state: stateForFailures(failures),
    integrity_id: evaluation.integrity_record.integrity_id,
    failures,
    checks: Object.freeze({
      serialization_consistent: !has("SERIALIZATION_MISMATCH") && !has("UNSUPPORTED_SERIALIZATION_VERSION"),
      hash_reproducible: !has("HASH_MISMATCH"),
      append_only_compliant: !has("OVERWRITE_ATTEMPT") && !has("RECORD_DELETION"),
      ordering_valid: !has("ORDERING_VIOLATION"),
      replay_compatible: !has("REPLAY_INCONSISTENCY"),
      lineage_intact: !has("LINEAGE_INCONSISTENCY"),
      tenant_ownership_preserved: !has("TENANT_BOUNDARY_VIOLATION"),
      schema_version_supported: !has("UNSUPPORTED_SERIALIZATION_VERSION") && !has("UNSUPPORTED_INTEGRITY_ALGORITHM"),
      governance_evidence_preserved: !has("GOVERNANCE_EVIDENCE_TAMPERING"),
      constitutional_evidence_preserved: !has("CONSTITUTIONAL_EVIDENCE_TAMPERING"),
    }),
  });
}

export function detectDecisionMutation(original: DecisionIntegrityEvaluation, candidate: DecisionIntegrityEvaluation): IntegrityMutationReport {
  const original_hash = original.integrity_hash;
  const candidate_hash = candidate.integrity_hash;
  const failures = original_hash === candidate_hash ? Object.freeze([]) : Object.freeze(["HISTORICAL_MUTATION"] as const);
  return Object.freeze({ mutation_detected: failures.length > 0, failures, original_hash, candidate_hash });
}

export function validateDecisionOrdering(evaluation: DecisionIntegrityEvaluation): DecisionIntegrityValidationResult {
  return validateDecisionIntegrity(evaluation);
}

export function validateReplayIntegrityHash(evaluation: DecisionIntegrityEvaluation): DecisionIntegrityValidationResult {
  return validateDecisionIntegrity(evaluation);
}

export function buildDecisionIntegrityObservability(evaluations: readonly DecisionIntegrityEvaluation[]): DecisionIntegrityObservability {
  const validations = evaluations.map((evaluation) => validateDecisionIntegrity(evaluation));
  const failures = validations.flatMap((validation) => validation.failures);
  return Object.freeze({
    integrity_validations: evaluations.length,
    hash_generation_latency_ms: 0,
    verification_failures: validations.filter((validation) => validation.validation_status !== "VALID").length,
    mutation_detection_events: failures.filter((failure) => ["HISTORICAL_MUTATION", "GOVERNANCE_EVIDENCE_TAMPERING", "CONSTITUTIONAL_EVIDENCE_TAMPERING", "UNAUTHORIZED_LIFECYCLE_EDIT"].includes(failure)).length,
    ordering_violations: failures.filter((failure) => failure === "ORDERING_VIOLATION").length,
    replay_integrity_failures: failures.filter((failure) => failure === "REPLAY_INCONSISTENCY").length,
    append_only_violations: failures.filter((failure) => failure === "OVERWRITE_ATTEMPT" || failure === "RECORD_DELETION").length,
    serialization_mismatches: failures.filter((failure) => failure === "SERIALIZATION_MISMATCH" || failure === "UNSUPPORTED_SERIALIZATION_VERSION").length,
    integrity_algorithm_usage: Object.freeze(evaluations.reduce<Record<string, number>>((counts, evaluation) => {
      counts[evaluation.integrity_record.integrity_algorithm] = (counts[evaluation.integrity_record.integrity_algorithm] ?? 0) + 1;
      return counts;
    }, {})),
    verification_success_rate: evaluations.length === 0 ? 0 : validations.filter((validation) => validation.validation_status === "VALID").length / evaluations.length,
  });
}

export function getDecisionIntegrityFramework() {
  const evaluation = createDecisionIntegrityEvaluation();
  return Object.freeze({
    integrity_rules: Object.freeze(["canonical serialization", "SHA-256 hashing", "append-only ledger", "deterministic ordering", "replay integrity", "lineage integrity", "tenant isolation"] as const),
    evaluation,
    validation: validateDecisionIntegrity(evaluation),
    mutation_report: detectDecisionMutation(evaluation, evaluation),
    replay_validation: validateReplayIntegrityHash(evaluation),
    observability: buildDecisionIntegrityObservability([evaluation]),
  });
}
