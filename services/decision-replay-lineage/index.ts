import crypto from "crypto";
import { createComplianceEvaluation } from "@/services/decision-compliance";
import type { ComplianceEvaluation } from "@/types/decision-compliance";
import type {
  DecisionLineageRecord,
  DecisionReplayLineageContract,
  DecisionReplayType,
  HistoricalReconstructionResult,
  ReplayLineageFailure,
  ReplayLineageInput,
  ReplayLineageObservability,
  ReplayLineageValidationResult,
  ReplayMetadata,
  ReplayReferenceRecord,
} from "@/types/decision-replay-lineage";

const NOW = "2026-07-02T09:17:00.000Z";
export const DECISION_REPLAY_ORDER: readonly DecisionReplayType[] = Object.freeze(["INPUT", "EVIDENCE", "RISK", "CONFIDENCE", "GOVERNANCE", "CONSTITUTIONAL", "AUTHORITY", "DECISION", "RECOMMENDATION", "PLAN", "MISSION_HEALTH", "FORECAST", "RECOVERY", "CERTIFICATION", "OPERATOR_ACTION", "LIFECYCLE", "LINEAGE"]);

function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().filter((key) => record[key] !== undefined).map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashValue(value: unknown): string {
  return crypto.createHash("sha256").update(canonicalize(value), "utf8").digest("hex");
}

function hashRecord(value: Record<string, unknown>): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  delete copy.deterministic_hash;
  return hashValue(copy);
}

function refId(orchestrationId: string, replayType: DecisionReplayType): string {
  return `replay_${orchestrationId}_${replayType.toLowerCase()}`;
}

export function createReplayReference(input: {
  compliance_evaluation: ComplianceEvaluation;
  replay_type: DecisionReplayType;
  referenced_record_id?: string;
  replay_order?: number;
  scenario?: ReplayLineageInput["scenario"];
}): ReplayReferenceRecord {
  const order = input.replay_order ?? DECISION_REPLAY_ORDER.indexOf(input.replay_type) + 1;
  const base: Omit<ReplayReferenceRecord, "integrity_hash"> = {
    replay_reference_id: input.scenario === "DUPLICATE_REFERENCE" ? `replay_${input.compliance_evaluation.orchestration_id}_duplicate` : refId(input.compliance_evaluation.orchestration_id, input.replay_type),
    orchestration_id: input.compliance_evaluation.orchestration_id,
    tenant_id: input.scenario === "TENANT_VIOLATION" ? "tenant_beta" : input.compliance_evaluation.tenant_id,
    mission_id: input.scenario === "MISSION_VIOLATION" ? "mission_other" : input.compliance_evaluation.mission_id,
    replay_type: input.replay_type,
    source_component: `decision-${input.replay_type.toLowerCase()}`,
    referenced_record_id: input.scenario === "UNKNOWN_REFERENCE" ? "" : input.referenced_record_id ?? `${input.compliance_evaluation.orchestration_id}_${input.replay_type.toLowerCase()}_record`,
    replay_order: input.scenario === "ORDER_FAILURE" && input.replay_type === "INPUT" ? 99 : order,
    replay_version: input.scenario === "UNSUPPORTED_VERSION" ? "replay/v2" as "replay/v1" : "replay/v1",
    replay_timestamp: NOW,
    lineage_refs: input.scenario === "BROKEN_LINEAGE" ? Object.freeze([]) : Object.freeze([`lineage_${input.compliance_evaluation.orchestration_id}`]),
    created_at: NOW,
    append_only: true,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashRecord(base) });
  return input.scenario === "HASH_MISMATCH" && input.replay_type === "INPUT" ? Object.freeze({ ...record, integrity_hash: "tampered" }) : record;
}

function defaultReferenceIds(evaluation: ComplianceEvaluation): Partial<Record<DecisionReplayType, string>> {
  return {
    INPUT: evaluation.orchestration_id,
    GOVERNANCE: evaluation.governance_references[0]?.governance_reference_id ?? "missing-governance",
    CONSTITUTIONAL: evaluation.constitutional_references[0]?.constitutional_reference_id ?? "missing-constitutional",
    AUTHORITY: evaluation.authority_record.authority_id,
    DECISION: evaluation.compliance_id,
    LIFECYCLE: evaluation.authority_record.orchestration_id,
    LINEAGE: `lineage_${evaluation.orchestration_id}`,
  };
}

function createReferenceSet(evaluation: ComplianceEvaluation, scenario?: ReplayLineageInput["scenario"]): readonly ReplayReferenceRecord[] {
  const ids = defaultReferenceIds(evaluation);
  const types: readonly DecisionReplayType[] = Object.freeze(["INPUT", "EVIDENCE", "GOVERNANCE", "CONSTITUTIONAL", "AUTHORITY", "DECISION", "LIFECYCLE", "LINEAGE"]);
  const refs = types.map((type) => createReplayReference({ compliance_evaluation: evaluation, replay_type: type, referenced_record_id: ids[type], scenario }));
  if (scenario === "MISSING_REFERENCE") return Object.freeze(refs.filter((ref) => ref.replay_type !== "GOVERNANCE"));
  if (scenario === "DUPLICATE_REFERENCE") return Object.freeze([...refs, refs[0]!]);
  return Object.freeze(refs);
}

export function buildDecisionLineage(input: {
  compliance_evaluation: ComplianceEvaluation;
  replay_references?: readonly ReplayReferenceRecord[];
  parent_decision_id?: string;
  child_decision_ids?: readonly string[];
  scenario?: ReplayLineageInput["scenario"];
}): DecisionLineageRecord {
  const replayRefs = input.replay_references ?? createReferenceSet(input.compliance_evaluation, input.scenario);
  const childIds = input.scenario === "CIRCULAR_LINEAGE" ? Object.freeze([input.compliance_evaluation.orchestration_id]) : input.child_decision_ids ?? Object.freeze([]);
  const base: Omit<DecisionLineageRecord, "integrity_hash"> = {
    lineage_id: `lineage_${input.compliance_evaluation.orchestration_id}`,
    orchestration_id: input.compliance_evaluation.orchestration_id,
    tenant_id: input.scenario === "TENANT_VIOLATION" ? "tenant_beta" : input.compliance_evaluation.tenant_id,
    mission_id: input.scenario === "MISSION_VIOLATION" ? "mission_other" : input.compliance_evaluation.mission_id,
    parent_decision_id: input.scenario === "INVALID_PARENT" ? "" : input.parent_decision_id,
    child_decision_ids: input.scenario === "INVALID_CHILD" ? Object.freeze([""]) : childIds,
    originating_input_refs: Object.freeze(replayRefs.filter((ref) => ref.replay_type === "INPUT").map((ref) => ref.replay_reference_id).sort()),
    evidence_refs: Object.freeze(replayRefs.filter((ref) => ref.replay_type === "EVIDENCE").map((ref) => ref.replay_reference_id).sort()),
    governance_refs: Object.freeze(input.scenario === "BROKEN_LINEAGE" ? [] : replayRefs.filter((ref) => ref.replay_type === "GOVERNANCE").map((ref) => ref.replay_reference_id).sort()),
    constitutional_refs: Object.freeze(replayRefs.filter((ref) => ref.replay_type === "CONSTITUTIONAL").map((ref) => ref.replay_reference_id).sort()),
    authority_refs: Object.freeze(replayRefs.filter((ref) => ref.replay_type === "AUTHORITY").map((ref) => ref.replay_reference_id).sort()),
    replay_refs: Object.freeze(replayRefs.map((ref) => ref.replay_reference_id).sort()),
    decision_output_refs: Object.freeze(replayRefs.filter((ref) => ref.replay_type === "DECISION").map((ref) => ref.replay_reference_id).sort()),
    created_at: NOW,
    append_only: true,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashRecord(base) });
  return input.scenario === "HASH_MISMATCH" ? Object.freeze({ ...record, integrity_hash: "tampered" }) : record;
}

function createReplayMetadata(evaluation: ComplianceEvaluation, refs: readonly ReplayReferenceRecord[], scenario?: ReplayLineageInput["scenario"]): ReplayMetadata {
  const base: Omit<ReplayMetadata, "deterministic_hash"> = {
    replay_id: `replay_contract_${evaluation.orchestration_id}`,
    orchestration_id: evaluation.orchestration_id,
    replay_version: scenario === "UNSUPPORTED_VERSION" ? "replay/v2" as "replay/v1" : "replay/v1",
    schema_version: "1.0.0",
    replay_sequence: Object.freeze(refs.map((ref) => ref.replay_type)),
    replay_timestamp: NOW,
    replay_actor: "SYSTEM",
    serialization_version: scenario === "SERIALIZATION_MISMATCH" ? "decision-replay-canonical-json/v999" as "decision-replay-canonical-json/v1" : "decision-replay-canonical-json/v1",
    integrity_algorithm: "SHA-256",
    replay_status: "READY",
  };
  return Object.freeze({ ...base, deterministic_hash: hashRecord(base) });
}

export function createReplayLineageContract(input: ReplayLineageInput = {}): DecisionReplayLineageContract {
  const compliance_evaluation = input.compliance_evaluation ?? createComplianceEvaluation();
  const replay_references = createReferenceSet(compliance_evaluation, input.scenario);
  const lineage = buildDecisionLineage({
    compliance_evaluation,
    replay_references,
    parent_decision_id: input.parent_decision_id,
    child_decision_ids: input.child_decision_ids,
    scenario: input.scenario,
  });
  const metadata = createReplayMetadata(compliance_evaluation, replay_references, input.scenario);
  const base: Omit<DecisionReplayLineageContract, "integrity_hash"> = {
    replay_contract_id: `drli_9_1_7_${compliance_evaluation.orchestration_id}`,
    orchestration_id: compliance_evaluation.orchestration_id,
    tenant_id: compliance_evaluation.tenant_id,
    mission_id: compliance_evaluation.mission_id,
    compliance_evaluation,
    replay_references,
    lineage,
    metadata,
    advisory_only: true,
  };
  const contract = Object.freeze({ ...base, integrity_hash: hashRecord(base) });
  return input.scenario === "HASH_MISMATCH" ? Object.freeze({ ...contract, integrity_hash: "tampered" }) : contract;
}

export function validateReplayReferences(contract: DecisionReplayLineageContract): ReplayLineageValidationResult {
  return validateReplayLineageContract(contract, "replay");
}

export function validateDecisionLineage(contract: DecisionReplayLineageContract): ReplayLineageValidationResult {
  return validateReplayLineageContract(contract, "lineage");
}

export function validateReplayIntegrity(contract: DecisionReplayLineageContract): ReplayLineageValidationResult {
  return validateReplayLineageContract(contract, "integrity");
}

export function validateReplayLineageContract(contract: DecisionReplayLineageContract, focus: "all" | "replay" | "lineage" | "integrity" = "all"): ReplayLineageValidationResult {
  const failures = collectFailures(contract);
  const filtered = focus === "replay" ? failures.filter((failure) => ["MISSING_REFERENCE", "DUPLICATE_REPLAY_REFERENCE", "REPLAY_ORDER_FAILURE", "VERSION_MISMATCH", "UNKNOWN_REFERENCE", "TENANT_VIOLATION", "MISSION_VIOLATION"].includes(failure))
    : focus === "lineage" ? failures.filter((failure) => ["BROKEN_LINEAGE", "INVALID_PARENT", "INVALID_CHILD", "CIRCULAR_LINEAGE", "TENANT_VIOLATION", "MISSION_VIOLATION"].includes(failure))
    : focus === "integrity" ? failures.filter((failure) => ["HASH_MISMATCH", "SERIALIZATION_MISMATCH", "VERSION_MISMATCH"].includes(failure))
    : failures;
  const unique = Object.freeze([...new Set(filtered)]);
  const has = (failure: ReplayLineageFailure) => unique.includes(failure);
  return Object.freeze({
    validation_status: unique.length ? "FAILED_CLOSED" : "VALID",
    replay_contract_id: contract.replay_contract_id,
    failures: unique,
    checks: Object.freeze({
      replay_references_exist: !has("MISSING_REFERENCE"),
      replay_references_unique: !has("DUPLICATE_REPLAY_REFERENCE"),
      replay_ordering_valid: !has("REPLAY_ORDER_FAILURE"),
      referenced_records_exist: !has("UNKNOWN_REFERENCE"),
      replay_versions_supported: !has("VERSION_MISMATCH"),
      integrity_hashes_reproducible: !has("HASH_MISMATCH"),
      tenant_ownership_preserved: !has("TENANT_VIOLATION"),
      mission_ownership_preserved: !has("MISSION_VIOLATION"),
      lineage_complete: !has("BROKEN_LINEAGE") && !has("INVALID_PARENT") && !has("INVALID_CHILD"),
      lineage_acyclic: !has("CIRCULAR_LINEAGE"),
    }),
  });
}

function collectFailures(contract: DecisionReplayLineageContract): readonly ReplayLineageFailure[] {
  const failures: ReplayLineageFailure[] = [];
  if (contract.replay_references.length === 0 || !contract.replay_references.some((ref) => ref.replay_type === "GOVERNANCE")) failures.push("MISSING_REFERENCE");
  const ids = contract.replay_references.map((ref) => ref.replay_reference_id);
  if (new Set(ids).size !== ids.length) failures.push("DUPLICATE_REPLAY_REFERENCE");
  const orders = contract.replay_references.map((ref) => ref.replay_order);
  if (!orders.every((order, index) => index === 0 || order > orders[index - 1]!)) failures.push("REPLAY_ORDER_FAILURE");
  if (contract.replay_references.some((ref) => !ref.referenced_record_id)) failures.push("UNKNOWN_REFERENCE");
  if (contract.replay_references.some((ref) => ref.replay_version !== "replay/v1") || contract.metadata.replay_version !== "replay/v1") failures.push("VERSION_MISMATCH");
  if (contract.metadata.serialization_version !== "decision-replay-canonical-json/v1") failures.push("SERIALIZATION_MISMATCH");
  if (contract.replay_references.some((ref) => ref.tenant_id !== contract.tenant_id) || contract.lineage.tenant_id !== contract.tenant_id) failures.push("TENANT_VIOLATION");
  if (contract.replay_references.some((ref) => ref.mission_id !== contract.mission_id) || contract.lineage.mission_id !== contract.mission_id) failures.push("MISSION_VIOLATION");
  if (contract.replay_references.some((ref) => hashRecord(ref) !== ref.integrity_hash) || hashRecord(contract.lineage) !== contract.lineage.integrity_hash || hashRecord(contract) !== contract.integrity_hash) failures.push("HASH_MISMATCH");
  if (contract.lineage.parent_decision_id === "") failures.push("INVALID_PARENT");
  if (contract.lineage.child_decision_ids.some((id) => !id)) failures.push("INVALID_CHILD");
  if (contract.lineage.child_decision_ids.includes(contract.orchestration_id) || contract.lineage.parent_decision_id === contract.orchestration_id) failures.push("CIRCULAR_LINEAGE");
  if (contract.lineage.governance_refs.length === 0 || contract.replay_references.some((ref) => ref.lineage_refs.length === 0)) failures.push("BROKEN_LINEAGE");
  return Object.freeze([...new Set(failures)]);
}

export function reconstructDecisionHistory(contract: DecisionReplayLineageContract): HistoricalReconstructionResult {
  const validation = validateReplayLineageContract(contract);
  const reconstructed_sequence = Object.freeze(contract.replay_references.map((ref) => ref.replay_type));
  const reconstructed_record_ids = Object.freeze(contract.replay_references.map((ref) => ref.referenced_record_id));
  const reconstructed_hash = hashRecord(contract);
  return Object.freeze({
    replay_contract_id: contract.replay_contract_id,
    reconstruction_valid: validation.validation_status === "VALID" && reconstructed_hash === contract.integrity_hash,
    reconstructed_sequence,
    reconstructed_record_ids,
    reconstructed_lineage_id: contract.lineage.lineage_id,
    reconstructed_hash,
    expected_hash: contract.integrity_hash,
    failures: validation.failures,
  });
}

export function buildReplayLineageObservability(contracts: readonly DecisionReplayLineageContract[]): ReplayLineageObservability {
  const validations = contracts.map((contract) => validateReplayLineageContract(contract));
  const failures = validations.flatMap((validation) => validation.failures);
  return Object.freeze({
    replay_generation_count: contracts.length,
    replay_validation_failures: validations.filter((validation) => validation.validation_status !== "VALID").length,
    lineage_graph_size: contracts.reduce((count, contract) => count + 1 + contract.lineage.child_decision_ids.length + (contract.lineage.parent_decision_id ? 1 : 0), 0),
    replay_latency_ms: 0,
    reconstruction_latency_ms: 0,
    orphaned_lineage_count: failures.filter((failure) => failure === "INVALID_PARENT" || failure === "INVALID_CHILD").length,
    replay_version_distribution: Object.freeze(contracts.flatMap((contract) => contract.replay_references.map((ref) => ref.replay_version)).reduce<Record<string, number>>((counts, version) => {
      counts[version] = (counts[version] ?? 0) + 1;
      return counts;
    }, {})),
    integrity_mismatches: failures.filter((failure) => failure === "HASH_MISMATCH").length,
    replay_ordering_violations: failures.filter((failure) => failure === "REPLAY_ORDER_FAILURE").length,
    historical_reconstruction_success_rate: contracts.length === 0 ? 0 : contracts.filter((contract) => reconstructDecisionHistory(contract).reconstruction_valid).length / contracts.length,
  });
}

export function getDecisionReplayLineageContract() {
  const contract = createReplayLineageContract();
  return Object.freeze({
    replay_order: DECISION_REPLAY_ORDER,
    contract,
    replay_validation: validateReplayReferences(contract),
    lineage_validation: validateDecisionLineage(contract),
    integrity_validation: validateReplayIntegrity(contract),
    reconstruction: reconstructDecisionHistory(contract),
    observability: buildReplayLineageObservability([contract]),
  });
}
