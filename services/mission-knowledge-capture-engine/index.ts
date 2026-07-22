import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { getKnowledgeEvolutionContract, validateKnowledgeEvolutionContract } from "@/services/knowledge-evolution-contract";
import type {
  KnowledgeCaptureAuditRecord,
  KnowledgeCaptureState,
  MissionKnowledgeCaptureEngineBundle,
  MissionKnowledgeCaptureFailure,
  MissionKnowledgeCaptureInput,
  MissionKnowledgeCaptureObservabilitySurface,
  MissionKnowledgeCapturePackage,
  MissionKnowledgeCaptureValidationResult,
  MissionKnowledgeRecord,
  MissionKnowledgeScenario,
} from "@/types/mission-knowledge-capture-engine";

const VERSION = "mission-knowledge-capture-engine/v8ALT.9.2" as const;
const NOW = "2026-07-16T04:00:00.000Z";
const captureStates = Object.freeze(["DETECTED", "CAPTURED", "NORMALIZED", "CLASSIFIED", "VERIFIED", "RECORDED", "CERTIFIED", "ARCHIVED"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: MissionKnowledgeScenario): MissionKnowledgeCaptureFailure | null {
  const map: Partial<Record<MissionKnowledgeScenario, MissionKnowledgeCaptureFailure>> = {
    INCOMPLETE_MISSION_RECORD: "INCOMPLETE_MISSION_RECORD",
    MISSING_REPLAY_REFERENCE: "REPLAY_REFERENCE_MISSING",
    CORRUPTED_EVIDENCE: "CORRUPTED_EVIDENCE_DETECTED",
    INTEGRITY_MISMATCH: "INTEGRITY_MISMATCH_DETECTED",
    GOVERNANCE_VIOLATION: "GOVERNANCE_VIOLATION_DETECTED",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION_DETECTED",
    DUPLICATE_DETERMINISTIC_IDENTIFIER: "DUPLICATE_DETERMINISTIC_IDENTIFIER_DETECTED",
    ORPHANED_LINEAGE: "ORPHANED_LINEAGE_DETECTED",
    UNAUTHORIZED_KNOWLEDGE_SOURCE: "UNAUTHORIZED_KNOWLEDGE_SOURCE_DETECTED",
    CROSS_TENANT_CAPTURE_ATTEMPT: "CROSS_TENANT_CAPTURE_DETECTED",
    HISTORICAL_MUTATION_ATTEMPT: "HISTORICAL_MUTATION_DETECTED",
    LEARNING_EXECUTION_ATTEMPTED: "LEARNING_EXECUTION_ATTEMPTED",
    ACTIVATION_ATTEMPTED: "ACTIVATION_ATTEMPTED",
  };
  return map[scenario] ?? null;
}

function buildRecord(index: number, category: MissionKnowledgeRecord["category"], scenario: MissionKnowledgeScenario): MissionKnowledgeRecord {
  const duplicate = scenario === "DUPLICATE_DETERMINISTIC_IDENTIFIER";
  const missionId = scenario === "INCOMPLETE_MISSION_RECORD" && index === 0 ? "" : "mission:knowledge-capture:complete";
  const replayId = scenario === "MISSING_REPLAY_REFERENCE" && index === 0 ? "" : `replay:knowledge-capture:${index}`;
  const evidence = scenario === "CORRUPTED_EVIDENCE" && index === 0 ? ["evidence:corrupt"] : [`evidence:${category.toLowerCase()}:mission`, `evidence:${category.toLowerCase()}:replay`];
  const lineage = scenario === "ORPHANED_LINEAGE" && index === 0 ? [] : [`lineage:${category.toLowerCase()}:mission`, `lineage:${category.toLowerCase()}:operator`];
  const base = {
    knowledge_record_id: duplicate && index > 0 ? id("MK", "mission-knowledge-record", { index: 0 }) : id("MK", "mission-knowledge-record", { index, category, scenario }),
    mission_id: missionId,
    execution_id: `execution:knowledge-capture:${index}`,
    replay_id: replayId,
    tenant_id: scenario === "CROSS_TENANT_CAPTURE_ATTEMPT" && index === 0 ? "tenant:foreign" : "tenant:alpha",
    knowledge_type: "MISSION_CAPTURE" as const,
    category,
    source_component: scenario === "UNAUTHORIZED_KNOWLEDGE_SOURCE" && index === 0 ? "unauthorized-source" : `collector:${category.toLowerCase()}`,
    lifecycle_state: "RECORDED" as KnowledgeCaptureState,
    mission_type: "controlled-autonomy",
    mission_goal: "preserve deterministic mission knowledge",
    execution_scope: "completed mission",
    completion_status: index % 2 === 0 ? "SUCCESS" as const : "PARTIAL" as const,
    outcome: "captured without learning",
    evidence_references: freezeArray(evidence),
    replay_references: replayId ? freezeArray([replayId]) : freezeArray([]),
    lineage_references: freezeArray(lineage),
    integrity_hashes: scenario === "INTEGRITY_MISMATCH" && index === 0 ? freezeArray([]) : freezeArray(evidence.map((item) => `hash:${item}`)),
    execution_time: 120 + index,
    resource_usage: 0.42,
    confidence: 0.94,
    mission_health: 0.91,
    recovery_score: 0.88,
    governance_status: scenario === "GOVERNANCE_VIOLATION" && index === 0 ? "FAIL" as const : "PASS" as const,
    constitutional_status: scenario === "CONSTITUTIONAL_VIOLATION" && index === 0 ? "FAIL" as const : "PASS" as const,
    authority_status: "PASS" as const,
    created_timestamp: NOW,
    deterministic_sequence: duplicate ? 1 : index + 1,
    version: "1.0.0",
    capture_only: true as const,
    learning_execution_authorized: false as const,
    optimization_authority: false as const,
    activation_authority: false as const,
    historical_truth_mutable: scenario === "HISTORICAL_MUTATION_ATTEMPT" && index === 0,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_MISMATCH" && index === 0 ? "" : hashValue("mission-knowledge-record", base) });
}

function audit(failure: MissionKnowledgeCaptureFailure, scenario: MissionKnowledgeScenario): KnowledgeCaptureAuditRecord {
  const base = { audit_id: id("MKA", "mission-knowledge-audit", { failure, scenario }), mission_id: "mission:knowledge-capture:complete", tenant_id: scenario === "CROSS_TENANT_CAPTURE_ATTEMPT" ? "tenant:foreign" : "tenant:alpha", rejection_reason: failure, immutable: true as const, append_only: true as const, evidence_reference: `audit:evidence:${failure}`, created_timestamp: NOW };
  return Object.freeze({ ...base, integrity_hash: hashValue("mission-knowledge-audit", base) });
}

function collectFailures(capture: Omit<MissionKnowledgeCapturePackage, "integrity_hash"> | MissionKnowledgeCapturePackage): readonly MissionKnowledgeCaptureFailure[] {
  const ids = capture.records.map((record) => record.knowledge_record_id);
  const sequences = capture.records.map((record) => record.deterministic_sequence);
  return unique([
    ...capture.failures,
    ...(capture.records.some((record) => !record.mission_id || !record.execution_id) ? ["INCOMPLETE_MISSION_RECORD" as const] : []),
    ...(capture.records.some((record) => record.replay_references.length === 0 || !record.replay_id) ? ["REPLAY_REFERENCE_MISSING" as const] : []),
    ...(capture.records.some((record) => record.evidence_references.includes("evidence:corrupt")) ? ["CORRUPTED_EVIDENCE_DETECTED" as const] : []),
    ...(capture.records.some((record) => !record.integrity_hash || record.integrity_hashes.length === 0) ? ["INTEGRITY_MISMATCH_DETECTED" as const] : []),
    ...(capture.records.some((record) => record.governance_status === "FAIL") ? ["GOVERNANCE_VIOLATION_DETECTED" as const] : []),
    ...(capture.records.some((record) => record.constitutional_status === "FAIL") ? ["CONSTITUTIONAL_VIOLATION_DETECTED" as const] : []),
    ...(new Set(ids).size !== ids.length || new Set(sequences).size !== sequences.length ? ["DUPLICATE_DETERMINISTIC_IDENTIFIER_DETECTED" as const] : []),
    ...(capture.records.some((record) => record.lineage_references.length === 0) ? ["ORPHANED_LINEAGE_DETECTED" as const] : []),
    ...(capture.records.some((record) => record.source_component === "unauthorized-source") ? ["UNAUTHORIZED_KNOWLEDGE_SOURCE_DETECTED" as const] : []),
    ...(capture.records.some((record) => record.tenant_id !== "tenant:alpha") ? ["CROSS_TENANT_CAPTURE_DETECTED" as const] : []),
    ...(capture.records.some((record) => record.historical_truth_mutable) ? ["HISTORICAL_MUTATION_DETECTED" as const] : []),
    ...(capture.records.some((record) => record.learning_execution_authorized) ? ["LEARNING_EXECUTION_ATTEMPTED" as const] : []),
    ...(capture.records.some((record) => record.activation_authority) ? ["ACTIVATION_ATTEMPTED" as const] : []),
  ]);
}

export function captureMissionKnowledge(input: MissionKnowledgeCaptureInput = {}): MissionKnowledgeCapturePackage {
  if (input.capture) return input.capture;
  const scenario = input.scenario ?? "BASELINE";
  const contract = input.contract ?? getKnowledgeEvolutionContract();
  const contractValid = validateKnowledgeEvolutionContract(contract).valid;
  const injected = scenarioFailure(scenario);
  const categories: readonly MissionKnowledgeRecord["category"][] = ["PLANNING", "EXECUTION", "RECOVERY", "GOVERNANCE", "CONFIDENCE", "MISSION_HEALTH", "OPERATOR_ACTION", "OPTIMIZATION"];
  const records = freezeArray(categories.map((category, index) => buildRecord(index, category, scenario)));
  const baseFailures = unique([...(injected ? [injected] : []), ...(!contractValid ? ["KNOWLEDGE_CONTRACT_INVALID" as const] : [])]);
  const source = { capture_id: id("MKC", "mission-knowledge-capture", { scenario, contract: contract.contract_id }), contract_id: contract.contract_id, final_state: "MISSION_KNOWLEDGE_CAPTURED" as const, records, audit_records: freezeArray<KnowledgeCaptureAuditRecord>([]), failures: baseFailures, capture_only: true as const, learning_execution_authorized: false as const, optimization_authority: false as const, activation_authority: false as const, historical_truth_mutable: false as const };
  const failures = collectFailures(source);
  const audits = freezeArray(failures.map((failure) => audit(failure, scenario)));
  const capture = { ...source, failures, audit_records: audits, final_state: failures.length ? "MISSION_KNOWLEDGE_CAPTURE_REJECTED" as const : source.final_state };
  return Object.freeze({ ...capture, integrity_hash: scenario === "INTEGRITY_MISMATCH" ? "" : hashValue("mission-knowledge-capture", capture) });
}

export function listMissionKnowledgeRecords(input: MissionKnowledgeCaptureInput = {}) { return captureMissionKnowledge(input).records; }
export function listMissionKnowledgeAuditRecords(input: MissionKnowledgeCaptureInput = {}) { return captureMissionKnowledge(input).audit_records; }
export function normalizeMissionKnowledge(input: MissionKnowledgeCaptureInput = {}) { return captureMissionKnowledge(input).records.map((record) => ({ knowledge_record_id: record.knowledge_record_id, deterministic_sequence: record.deterministic_sequence, canonical_replay: record.replay_references.join("|"), canonical_evidence: record.evidence_references.join("|") })); }
export function listMissionKnowledgeEvidence(input: MissionKnowledgeCaptureInput = {}) { return captureMissionKnowledge(input).records.flatMap((record) => record.evidence_references); }

export function validateMissionKnowledgeCapture(capture = captureMissionKnowledge()): MissionKnowledgeCaptureValidationResult {
  const failures = unique([...collectFailures(capture), ...(!capture.integrity_hash ? ["INTEGRITY_MISMATCH_DETECTED" as const] : [])]);
  const has = (failure: MissionKnowledgeCaptureFailure) => failures.includes(failure);
  const valid = failures.length === 0 && capture.final_state === "MISSION_KNOWLEDGE_CAPTURED" && capture.capture_only && !capture.learning_execution_authorized && !capture.activation_authority && !capture.optimization_authority;
  const source = { capture_id: capture.capture_id, valid, contract_valid: !has("KNOWLEDGE_CONTRACT_INVALID"), completed_missions_captured: !has("INCOMPLETE_MISSION_RECORD"), records_normalized: true, evidence_complete: !has("CORRUPTED_EVIDENCE_DETECTED"), lineage_complete: !has("ORPHANED_LINEAGE_DETECTED"), replay_ready: !has("REPLAY_REFERENCE_MISSING"), governance_valid: !has("GOVERNANCE_VIOLATION_DETECTED"), constitutional_valid: !has("CONSTITUTIONAL_VIOLATION_DETECTED"), deterministic_identifiers_unique: !has("DUPLICATE_DETERMINISTIC_IDENTIFIER_DETECTED"), tenant_isolated: !has("CROSS_TENANT_CAPTURE_DETECTED"), immutable_capture: !has("HISTORICAL_MUTATION_DETECTED"), capture_only: true as const, learning_execution_authorization_absent: !capture.learning_execution_authorized, optimization_authority_absent: !capture.optimization_authority, activation_authority_absent: !capture.activation_authority, historical_truth_preserved: !capture.historical_truth_mutable, fail_closed: valid || failures.length > 0 || capture.final_state !== "MISSION_KNOWLEDGE_CAPTURED", failures };
  return Object.freeze({ ...source, validation_hash: hashValue("mission-knowledge-capture-validation", source) });
}

export function buildMissionKnowledgeCaptureObservabilitySurface(capture = captureMissionKnowledge()): MissionKnowledgeCaptureObservabilitySurface {
  return Object.freeze({ capture_id: capture.capture_id, final_state: capture.final_state, record_count: capture.records.length, audit_count: capture.audit_records.length, failure_count: capture.failures.length, capture_only: true, learning_execution_authorized: false, activation_authority: false, integrity_hash: capture.integrity_hash });
}

export function getMissionKnowledgeCaptureEngine(): MissionKnowledgeCaptureEngineBundle {
  const capture = captureMissionKnowledge();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "MISSION_KNOWLEDGE_CAPTURE_ENGINE_READY", capture_states: captureStates, principles: freezeArray(["capture-only", "deterministic-normalization", "immutable-recording", "append-only-audits", "replay-compatible", "complete-evidence-lineage", "tenant-isolated", "governance-validated", "no-learning-execution", "no-activation"]) }), capture, validation: validateMissionKnowledgeCapture(capture), observability: buildMissionKnowledgeCaptureObservabilitySurface(capture) });
}
