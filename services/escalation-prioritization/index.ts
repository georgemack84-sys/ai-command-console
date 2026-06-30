import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runEscalationDetection, validateEscalationDetection } from "@/services/escalation-detection";
import { validateEscalationContractRecord } from "@/services/escalation-contract";
import type { EscalationConfidenceLevel, EscalationContractRecord } from "@/types/escalation-contract";
import type { EscalationDetectionOutputType, EscalationDetectionScenario } from "@/types/escalation-detection";
import type {
  EscalationPrioritizationDoctrine,
  EscalationPrioritizationFailureReason,
  EscalationPrioritizationMetrics,
  EscalationPrioritizationObservabilitySurface,
  EscalationPrioritizationReplayResult,
  EscalationPrioritizationResult,
  EscalationPrioritizationScenario,
  EscalationPrioritizationValidationFailure,
  EscalationPrioritizationValidationResult,
  EscalationPriorityConfidence,
  EscalationPriorityFactor,
  EscalationPriorityFactorType,
  EscalationPriorityLevel,
  EscalationPriorityRecord,
} from "@/types/escalation-prioritization";

const NOW: "2026-06-26T15:30:00.000Z" = "2026-06-26T15:30:00.000Z";
const CONTRACT_VERSION: "ESCALATION-PRIORITIZATION-V1" = "ESCALATION-PRIORITIZATION-V1";
const PRIORITY_LEVELS: readonly EscalationPriorityLevel[] = Object.freeze(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const DETECTION_OUTPUTS: readonly EscalationDetectionOutputType[] = Object.freeze(["CONSTITUTIONAL_ESCALATION", "AUTHORITY_ESCALATION", "POLICY_ESCALATION", "COMPLIANCE_ESCALATION", "PROCESS_ESCALATION", "RISK_ESCALATION", "EVIDENCE_ESCALATION", "REPLAY_ESCALATION", "INTEGRITY_ESCALATION"]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function tenantLeak(ref: unknown, tenant_id: string | undefined): boolean {
  if (!tenant_id || typeof ref !== "string") return false;
  const match = ref.match(/tenant_(alpha|beta|[0-9]+)/i);
  return Boolean(match && match[0] !== tenant_id);
}

function containsTenantLeak(value: unknown, tenant_id: string | undefined): boolean {
  if (tenantLeak(value, tenant_id)) return true;
  if (Array.isArray(value)) return value.some((item) => containsTenantLeak(item, tenant_id));
  if (isRecord(value)) return Object.values(value).some((item) => containsTenantLeak(item, tenant_id));
  return false;
}

function failure(reason: EscalationPrioritizationFailureReason, field_path: string, message: string): EscalationPrioritizationValidationFailure {
  return Object.freeze({ failure_id: hashValue("escalation-prioritization-validation-failure", { reason, field_path, message }), reason, field_path, message, fail_closed: true });
}

function detectionScenarioFor(scenario: EscalationPrioritizationScenario): EscalationDetectionScenario {
  if (["INFO_EVENT", "LOW_POLICY_INCONSISTENCY", "INVALID_ESCALATION_RECORD", "UNSUPPORTED_PRIORITY", "MISSING_PRIORITY_EVIDENCE", "INCOMPLETE_PRIORITY_CONTEXT", "PRIORITY_REPLAY_MISMATCH", "BROKEN_PRIORITY_LINEAGE", "CROSS_TENANT_PRIORITY", "HIDDEN_PRIORITY_STATE", "PRIORITY_HASH_MISMATCH", "PRIORITIZATION_HASH_MISMATCH"].includes(scenario)) return "BASELINE";
  return scenario as EscalationDetectionScenario;
}

function scoreForEscalation(record: EscalationContractRecord, scenario: EscalationPrioritizationScenario): number {
  if (scenario === "INFO_EVENT") return 10;
  if (scenario === "LOW_POLICY_INCONSISTENCY") return 30;
  switch (record.escalation_type) {
    case "CONSTITUTIONAL":
      return 100;
    case "AUTHORITY":
      return 84;
    case "POLICY":
      return 64;
    case "COMPLIANCE":
      return 58;
    case "GOVERNANCE":
      return 55;
    case "RISK":
      return 82;
    case "EVIDENCE":
      return record.category.includes("integrity") ? 96 : 52;
    case "REPLAY":
      return 86;
    default:
      return Math.max(10, Math.min(100, record.severity_definition.severity_score));
  }
}

function levelForScore(score: number): EscalationPriorityLevel {
  if (score >= 90) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 45) return "MEDIUM";
  if (score >= 20) return "LOW";
  return "INFO";
}

function confidenceLevel(score: number): EscalationConfidenceLevel {
  if (score >= 95) return "CERTIFICATION_READY";
  if (score >= 85) return "HIGH";
  if (score >= 65) return "MODERATE";
  return "LOW";
}

function factor(type: EscalationPriorityFactorType, score: number, weight: number, reason: string, evidence_refs: readonly string[]): EscalationPriorityFactor {
  return Object.freeze({ factor_type: type, factor_score: score, factor_weight: weight, factor_reason: reason, evidence_refs });
}

function buildFactors(record: EscalationContractRecord, score: number): readonly EscalationPriorityFactor[] {
  const evidence = record.evidence_references.evidence_ids;
  return Object.freeze([
    factor("CONSTITUTIONAL_IMPACT", record.escalation_type === "CONSTITUTIONAL" ? 100 : 20, 0.2, "Constitutional impact is elevated only when constitutional conflict is the escalation class.", record.governance_context.constitutional_context),
    factor("AUTHORITY_IMPACT", record.escalation_type === "AUTHORITY" ? 90 : 18, 0.16, "Authority impact measures boundary drift, privilege exposure, and unauthorized decision influence.", record.governance_context.authority_context),
    factor("POLICY_IMPACT", record.escalation_type === "POLICY" ? 72 : 24, 0.14, "Policy impact reflects failed or inconsistent governance policy references.", record.evidence_references.policy_ids),
    factor("COMPLIANCE_IMPACT", record.escalation_type === "COMPLIANCE" ? 68 : 20, 0.12, "Compliance impact reflects degradation, repeated violations, and corrective-action exposure.", record.evidence_references.compliance_ids),
    factor("OPERATIONAL_GOVERNANCE_IMPACT", record.escalation_type === "GOVERNANCE" ? 64 : 18, 0.1, "Operational governance impact reflects workflow disruption and review bottlenecks.", evidence),
    factor("RISK_IMPACT", record.escalation_type === "RISK" ? 86 : Math.max(20, record.severity_definition.severity_score - 20), 0.13, "Risk impact consumes severity, likelihood, confidence, and organizational exposure.", record.evidence_references.risk_ids),
    factor("EVIDENCE_QUALITY", record.evidence_references.evidence_ids.length > 0 ? 95 : 0, 0.07, "Evidence quality reflects completeness, reproducibility, and lineage integrity.", evidence),
    factor("REPLAY_INTEGRITY", record.replay_metadata.replay_hash ? 96 : 0, 0.05, "Replay integrity confirms the calculation can be reconstructed.", [record.replay_metadata.replay_id].filter(Boolean)),
    factor("HISTORICAL_CONTEXT", score >= 90 ? 85 : 45, 0.03, "Historical context preserves lineage for future escalation reconstruction.", record.lineage_references.lineage_chain),
  ]);
}

function expectedPriorityId(record: EscalationContractRecord, source_detection_hash: string): string {
  return `EPRI-7F3-${hashValue("escalation-priority-id", { escalation_id: record.escalation_id, source_detection_hash }).slice(0, 10).toUpperCase()}`;
}

function computeConfidence(record: EscalationContractRecord, score: number, evidence_refs: readonly string[], governance_refs: readonly string[], replay_refs: readonly string[]): EscalationPriorityConfidence {
  let confidence_score = 98;
  if (!evidence_refs.length) confidence_score -= 45;
  if (!governance_refs.length) confidence_score -= 30;
  if (!replay_refs.length) confidence_score -= 20;
  if (record.confidence_metadata.confidence_score < 85) confidence_score -= 8;
  if (score >= 90 && record.governance_context.constitutional_context.length === 0) confidence_score -= 12;
  confidence_score = Math.max(0, Math.min(100, confidence_score));
  const inputs = Object.freeze([
    `evidence:${evidence_refs.length}`,
    `governance:${governance_refs.length}`,
    `replay:${replay_refs.length}`,
    `source_confidence:${record.confidence_metadata.confidence_score}`,
    `priority_score:${score}`,
  ]);
  return Object.freeze({
    confidence_score,
    confidence_level: confidenceLevel(confidence_score),
    confidence_reason: "Priority confidence is derived from evidence completeness, governance context, replay reconstruction, source escalation confidence, and priority severity.",
    confidence_inputs: inputs,
    confidence_hash: hashValue("escalation-priority-confidence", inputs),
  });
}

export function computeEscalationPriorityRecordHash(record: Omit<EscalationPriorityRecord, "priority_hash">): string {
  return hashValue("escalation-priority-record", {
    priority_id: record.priority_id,
    escalation_id: record.escalation_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    priority_level: record.priority_level,
    priority_score: record.priority_score,
    priority_reason: record.priority_reason,
    priority_factors: record.priority_factors.map((item) => ({ type: item.factor_type, score: item.factor_score, weight: item.factor_weight, reason: item.factor_reason, evidence_refs: item.evidence_refs })),
    priority_timestamp: record.priority_timestamp,
    confidence_hash: record.confidence.confidence_hash,
    lineage: record.lineage,
    evidence_refs: record.evidence_refs,
    governance_refs: record.governance_refs,
    replay_refs: record.replay_refs,
    truth_ledger_refs: record.truth_ledger_refs,
    explainability: record.explainability,
    advisory_boundary: record.advisory_boundary,
    priority_version: record.priority_version,
  });
}

function buildPriorityRecord(record: EscalationContractRecord, source_detection_hash: string, scenario: EscalationPrioritizationScenario): EscalationPriorityRecord {
  const score = scoreForEscalation(record, scenario);
  const priority_level = levelForScore(score);
  const priority_id = expectedPriorityId(record, source_detection_hash);
  const evidence_refs = record.evidence_references.evidence_ids;
  const governance_refs = uniqueSorted([...record.governance_context.constitutional_context, ...record.governance_context.authority_context, ...record.governance_context.policy_context, ...record.governance_context.compliance_context, ...record.governance_context.risk_context]);
  const replay_refs = Object.freeze([record.replay_metadata.replay_id, record.replay_metadata.replay_hash].filter(Boolean));
  const truth_ledger_refs = Object.freeze([record.truth_ledger_reference.truth_record_reference]);
  const priority_factors = buildFactors(record, score);
  const confidence = computeConfidence(record, score, evidence_refs, governance_refs, replay_refs);
  const base: Omit<EscalationPriorityRecord, "priority_hash"> = Object.freeze({
    priority_id,
    escalation_id: record.escalation_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    priority_level,
    priority_score: score,
    priority_reason: `${priority_level} priority assigned because ${record.escalation_type} escalation scored ${score} under deterministic constitutional, authority, policy, compliance, risk, evidence, replay, and historical factors.`,
    priority_factors,
    priority_timestamp: NOW,
    confidence,
    lineage: Object.freeze({
      priority_id,
      escalation_id: record.escalation_id,
      parent_priority: null,
      root_priority: priority_id,
      priority_history: Object.freeze([record.escalation_id, priority_id]),
      trigger_chain: record.lineage_references.lineage_chain,
    }),
    evidence_refs,
    governance_refs,
    replay_refs,
    truth_ledger_refs,
    explainability: Object.freeze({
      why_assigned: `${priority_level} was selected from score ${score} using fixed threshold boundaries: CRITICAL >=90, HIGH >=70, MEDIUM >=45, LOW >=20, INFO below 20.`,
      contributing_factors: Object.freeze(priority_factors.map((item) => `${item.factor_type}:${item.factor_score}`)),
      constitutional_basis: record.governance_context.constitutional_context,
      authority_basis: record.governance_context.authority_context,
      policy_basis: record.governance_context.policy_context,
      compliance_basis: record.governance_context.compliance_context,
      evidence_basis: evidence_refs,
      higher_priority_exclusion: priority_level === "CRITICAL" ? "No higher priority exists." : `The score did not meet the next deterministic threshold above ${priority_level}.`,
      lower_priority_exclusion: priority_level === "INFO" ? "No lower priority exists." : `The score met or exceeded the deterministic threshold for ${priority_level}.`,
      confidence_explanation: confidence.confidence_reason,
    }),
    advisory_boundary: Object.freeze({
      advisory_only: true,
      execution_authority: false,
      mutation_authority: false,
      policy_modification_authority: false,
      operator_override_authority: false,
      recommendation_authority: false,
    }),
    priority_version: CONTRACT_VERSION,
  });
  return Object.freeze({ ...base, priority_hash: computeEscalationPriorityRecordHash(base) });
}

function applyScenarioMutations(records: readonly EscalationPriorityRecord[], scenario: EscalationPrioritizationScenario): readonly EscalationPriorityRecord[] {
  if (!records.length) return records;
  const first = records[0];
  switch (scenario) {
    case "UNSUPPORTED_PRIORITY":
      return Object.freeze([{ ...first, priority_level: "BLOCKER" as EscalationPriorityLevel }, ...records.slice(1)]);
    case "MISSING_PRIORITY_EVIDENCE":
      return Object.freeze([{ ...first, evidence_refs: Object.freeze([]) }, ...records.slice(1)]);
    case "INCOMPLETE_PRIORITY_CONTEXT":
      return Object.freeze([{ ...first, governance_refs: Object.freeze([]) }, ...records.slice(1)]);
    case "PRIORITY_REPLAY_MISMATCH":
      return Object.freeze([{ ...first, replay_refs: Object.freeze([]) }, ...records.slice(1)]);
    case "BROKEN_PRIORITY_LINEAGE":
      return Object.freeze([{ ...first, lineage: { ...first.lineage, priority_history: Object.freeze([]), trigger_chain: Object.freeze([]) } }, ...records.slice(1)]);
    case "CROSS_TENANT_PRIORITY":
      return Object.freeze([{ ...first, evidence_refs: Object.freeze([...first.evidence_refs, "evidence_tenant_beta_priority_leak"]) }, ...records.slice(1)]);
    case "PRIORITY_HASH_MISMATCH":
      return Object.freeze([{ ...first, priority_hash: "tampered" }, ...records.slice(1)]);
    default:
      return records;
  }
}

function ledgerFor(result: Pick<EscalationPrioritizationResult, "tenant_id" | "mission_id" | "source_detection" | "priority_records" | "prioritization_hash">) {
  return Object.freeze({
    priority_ledger_id: `EPLEDGER-7F3-${hashValue("escalation-priority-ledger", result.prioritization_hash).slice(0, 10).toUpperCase()}`,
    tenant_id: result.tenant_id,
    mission_id: result.mission_id,
    source_detection_hash: result.source_detection.detection_hash,
    escalation_ids: Object.freeze(result.priority_records.map((record) => record.escalation_id)),
    priority_ids: Object.freeze(result.priority_records.map((record) => record.priority_id)),
    priority_levels: Object.freeze(result.priority_records.map((record) => record.priority_level)),
    evidence_refs: uniqueSorted(result.priority_records.flatMap((record) => record.evidence_refs)),
    governance_context_refs: uniqueSorted(result.priority_records.flatMap((record) => record.governance_refs)),
    confidence_refs: Object.freeze(result.priority_records.map((record) => record.confidence.confidence_hash)),
    lineage_refs: uniqueSorted(result.priority_records.flatMap((record) => [...record.lineage.priority_history, ...record.lineage.trigger_chain])),
    replay_refs: uniqueSorted(result.priority_records.flatMap((record) => record.replay_refs)),
    truth_ledger_refs: uniqueSorted(result.priority_records.flatMap((record) => record.truth_ledger_refs)),
    prioritization_hash: result.prioritization_hash,
    recorded_timestamp: NOW,
  });
}

export function buildEscalationPrioritizationDoctrine(): EscalationPrioritizationDoctrine {
  return Object.freeze({
    principles: Object.freeze(["deterministic", "severity-calculated", "impact-assessed", "evidence-backed", "confidence-reproducible", "lineage-preserving", "truth-ledger-recorded", "replayable", "explainable", "advisory-only", "tenant-safe", "certification-ready", "fail-closed"] as const),
    supported_priority_levels: PRIORITY_LEVELS,
    supported_detection_outputs: DETECTION_OUTPUTS,
    prioritizer_version: CONTRACT_VERSION,
  });
}

export function computeEscalationPrioritizationHash(input: Pick<EscalationPrioritizationResult, "source_detection" | "priority_records" | "prioritized_escalation_ids">): string {
  return hashValue("escalation-prioritization-result", {
    source_detection_hash: input.source_detection.detection_hash,
    priority_records: input.priority_records.map((record) => ({ priority_id: record.priority_id, escalation_id: record.escalation_id, priority_hash: record.priority_hash })),
    prioritized_escalation_ids: input.prioritized_escalation_ids,
  });
}

export function prioritizeEscalations(input: { tenant_id?: string; mission_id?: string; scenario?: EscalationPrioritizationScenario } = {}): EscalationPrioritizationResult {
  const scenario = input.scenario ?? "BASELINE";
  const detected = runEscalationDetection({ tenant_id: input.tenant_id, mission_id: input.mission_id, scenario: detectionScenarioFor(scenario) });
  const sourceRecords = scenario === "INVALID_ESCALATION_RECORD" && detected.escalation_records.length
    ? Object.freeze([{ ...detected.escalation_records[0], escalation_hash: "tampered" }, ...detected.escalation_records.slice(1)])
    : detected.escalation_records;
  const source_detection = sourceRecords === detected.escalation_records ? detected : Object.freeze({ ...detected, escalation_records: sourceRecords });
  const priority_records = applyScenarioMutations(Object.freeze(sourceRecords.map((record) => buildPriorityRecord(record, source_detection.detection_hash, scenario))), scenario);
  const sorted_records = Object.freeze([...priority_records].sort((a, b) => b.priority_score - a.priority_score || PRIORITY_LEVELS.indexOf(b.priority_level) - PRIORITY_LEVELS.indexOf(a.priority_level) || a.escalation_id.localeCompare(b.escalation_id)));
  const prioritized_escalation_ids = Object.freeze(sorted_records.map((record) => record.escalation_id));
  const prioritization_hash = scenario === "PRIORITIZATION_HASH_MISMATCH" ? "tampered" : computeEscalationPrioritizationHash({ source_detection, priority_records: sorted_records, prioritized_escalation_ids });
  const provisional = {
    contract_version: CONTRACT_VERSION,
    tenant_id: source_detection.tenant_id,
    mission_id: source_detection.mission_id,
    prioritizer_version: CONTRACT_VERSION,
    source_detection,
    priority_records: sorted_records,
    prioritized_escalation_ids,
    ledger_record: ledgerFor({ tenant_id: source_detection.tenant_id, mission_id: source_detection.mission_id, source_detection, priority_records: sorted_records, prioritization_hash }),
    validation_state: "VALID" as const,
    replay_state: "REPRODUCED" as const,
    prioritization_hash,
  };
  const validation = validateEscalationPrioritization(provisional);
  const replay = replayEscalationPrioritization(provisional);
  const result = Object.freeze({ ...provisional, validation_state: validation.validation_state, replay_state: replay.replay_state });
  if (scenario === "HIDDEN_PRIORITY_STATE") return Object.freeze({ ...result, hidden_prioritization_state: true } as never);
  return result;
}

export function validateEscalationPrioritization(result: Partial<EscalationPrioritizationResult> | undefined): EscalationPrioritizationValidationResult {
  const errors: EscalationPrioritizationValidationFailure[] = [];
  if (!result) errors.push(failure("PRIORITIZATION_RESULT_MISSING", "result", "prioritization result missing"));
  if (result?.source_detection && validateEscalationDetection(result.source_detection).validation_state !== "VALID") errors.push(failure("SOURCE_DETECTION_INVALID", "source_detection", "source detection must be valid before prioritization"));
  for (const escalation of result?.source_detection?.escalation_records ?? []) {
    const contractValidation = validateEscalationContractRecord(escalation);
    for (const error of contractValidation.errors) errors.push(failure(error.reason === "TENANT_SCOPE_VIOLATION" ? "CROSS_TENANT_PRIORITY" : error.reason === "LINEAGE_BROKEN" ? "BROKEN_LINEAGE" : error.reason === "REPLAY_HASH_MISMATCH" ? "REPLAY_MISMATCH_ACCEPTED" : "INVALID_ESCALATION_RECORD", `source_detection.escalation_records.${escalation.escalation_id}.${error.field_path}`, error.message));
    if (!result?.priority_records?.some((record) => record.escalation_id === escalation.escalation_id)) errors.push(failure("ESCALATION_NOT_PRIORITIZED", `priority_records.${escalation.escalation_id}`, "validated escalation was not prioritized"));
  }
  const seen = new Set<string>();
  for (const record of result?.priority_records ?? []) {
    if (seen.has(record.escalation_id)) errors.push(failure("DUPLICATE_PRIORITY_RECORD", `priority_records.${record.priority_id}`, "duplicate priority record for escalation"));
    seen.add(record.escalation_id);
    const sourceEscalation = result?.source_detection?.escalation_records?.find((item) => item.escalation_id === record.escalation_id);
    if (sourceEscalation && record.priority_id !== expectedPriorityId(sourceEscalation, result?.source_detection?.detection_hash ?? "")) errors.push(failure("MUTABLE_PRIORITY_IDENTIFIER", `priority_records.${record.priority_id}.priority_id`, "priority identifier is not deterministic"));
    if (!PRIORITY_LEVELS.includes(record.priority_level)) errors.push(failure("UNSUPPORTED_PRIORITY_LEVEL", `priority_records.${record.priority_id}.priority_level`, "priority level is unsupported"));
    if (!Number.isInteger(record.priority_score) || record.priority_score < 0 || record.priority_score > 100) errors.push(failure("PRIORITY_SCORE_INVALID", `priority_records.${record.priority_id}.priority_score`, "priority score must be an integer from 0 through 100"));
    if (!record.priority_reason) errors.push(failure("PRIORITY_REASON_MISSING", `priority_records.${record.priority_id}.priority_reason`, "priority reason is required"));
    if (!record.evidence_refs.length) errors.push(failure("MISSING_EVIDENCE", `priority_records.${record.priority_id}.evidence_refs`, "priority evidence references are required"));
    if (!record.governance_refs.length) errors.push(failure("INCOMPLETE_GOVERNANCE_CONTEXT", `priority_records.${record.priority_id}.governance_refs`, "governance context references are required"));
    if (!record.replay_refs.length) errors.push(failure("REPLAY_MISMATCH_ACCEPTED", `priority_records.${record.priority_id}.replay_refs`, "replay references are required"));
    if (!record.lineage.priority_history.length || !record.lineage.trigger_chain.length || record.lineage.priority_id !== record.priority_id || record.lineage.escalation_id !== record.escalation_id) errors.push(failure("BROKEN_LINEAGE", `priority_records.${record.priority_id}.lineage`, "priority lineage is incomplete"));
    if (!record.truth_ledger_refs.length) errors.push(failure("TRUTH_LEDGER_RECORD_MISSING", `priority_records.${record.priority_id}.truth_ledger_refs`, "Truth Ledger references are required"));
    if (record.confidence.confidence_hash !== hashValue("escalation-priority-confidence", record.confidence.confidence_inputs)) errors.push(failure("CONFIDENCE_HASH_MISMATCH", `priority_records.${record.priority_id}.confidence.confidence_hash`, "confidence hash mismatch"));
    if (!Number.isInteger(record.confidence.confidence_score) || record.confidence.confidence_score < 0 || record.confidence.confidence_score > 100) errors.push(failure("CONFIDENCE_INVALID", `priority_records.${record.priority_id}.confidence.confidence_score`, "confidence score must be an integer from 0 through 100"));
    if (record.advisory_boundary.advisory_only !== true || record.advisory_boundary.execution_authority !== false || record.advisory_boundary.mutation_authority !== false || record.advisory_boundary.policy_modification_authority !== false || record.advisory_boundary.operator_override_authority !== false || record.advisory_boundary.recommendation_authority !== false) errors.push(failure("EXECUTION_AUTHORITY_DETECTED", `priority_records.${record.priority_id}.advisory_boundary`, "prioritization must remain advisory-only"));
    const { priority_hash: _hash, ...withoutHash } = record;
    if (computeEscalationPriorityRecordHash(withoutHash) !== record.priority_hash) errors.push(failure("PRIORITY_HASH_MISMATCH", `priority_records.${record.priority_id}.priority_hash`, "priority record hash mismatch"));
  }
  if (containsTenantLeak(result, result?.tenant_id)) errors.push(failure("CROSS_TENANT_PRIORITY", "tenant_id", "cross-tenant priority reference detected"));
  if (isRecord(result) && ("hidden_state" in result || "hidden_prioritization_state" in result || "random_seed" in result)) errors.push(failure("HIDDEN_PRIORITIZATION_STATE", "result", "hidden prioritization state detected"));
  if (!result?.ledger_record?.truth_ledger_refs?.length && (result?.priority_records?.length ?? 0) > 0) errors.push(failure("TRUTH_LEDGER_RECORD_MISSING", "ledger_record.truth_ledger_refs", "Truth Ledger record missing"));
  if (result?.prioritization_hash && result.source_detection && result.priority_records && result.prioritized_escalation_ids && computeEscalationPrioritizationHash(result as EscalationPrioritizationResult) !== result.prioritization_hash) errors.push(failure("PRIORITIZATION_HASH_MISMATCH", "prioritization_hash", "prioritization hash mismatch"));
  const validation_state = errors.some((error) => error.reason === "CROSS_TENANT_PRIORITY") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => ["HIDDEN_PRIORITIZATION_STATE", "EXECUTION_AUTHORITY_DETECTED"].includes(error.reason)) ? "CERTIFICATION_BLOCKED" : errors.some((error) => ["REPLAY_MISMATCH_ACCEPTED", "PRIORITY_HASH_MISMATCH", "PRIORITIZATION_HASH_MISMATCH"].includes(error.reason)) ? "REPLAY_MISMATCH" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    validation_state,
    validator_version: "ESCALATION-PRIORITIZATION-VALIDATOR-V1",
    checks: Object.freeze({
      source_detection_valid: !errors.some((error) => error.reason === "SOURCE_DETECTION_INVALID"),
      escalation_records_valid: !errors.some((error) => error.reason === "INVALID_ESCALATION_RECORD"),
      every_escalation_prioritized: !errors.some((error) => error.reason === "ESCALATION_NOT_PRIORITIZED" || error.reason === "DUPLICATE_PRIORITY_RECORD"),
      priority_levels_supported: !errors.some((error) => error.reason === "UNSUPPORTED_PRIORITY_LEVEL"),
      score_reproducible: !errors.some((error) => error.reason === "PRIORITY_SCORE_INVALID" || error.reason === "PRIORITY_HASH_MISMATCH" || error.reason === "PRIORITIZATION_HASH_MISMATCH"),
      evidence_complete: !errors.some((error) => error.reason === "MISSING_EVIDENCE"),
      governance_context_complete: !errors.some((error) => error.reason === "INCOMPLETE_GOVERNANCE_CONTEXT"),
      confidence_reproducible: !errors.some((error) => error.reason === "CONFIDENCE_INVALID" || error.reason === "CONFIDENCE_HASH_MISMATCH"),
      lineage_reconstructable: !errors.some((error) => error.reason === "BROKEN_LINEAGE"),
      replay_ready: !errors.some((error) => ["REPLAY_MISMATCH_ACCEPTED", "PRIORITY_HASH_MISMATCH", "PRIORITIZATION_HASH_MISMATCH"].includes(error.reason)),
      truth_ledger_recorded: !errors.some((error) => error.reason === "TRUTH_LEDGER_RECORD_MISSING"),
      advisory_only_enforced: !errors.some((error) => error.reason === "EXECUTION_AUTHORITY_DETECTED"),
      tenant_isolated: !errors.some((error) => error.reason === "CROSS_TENANT_PRIORITY"),
      hidden_state_absent: !errors.some((error) => error.reason === "HIDDEN_PRIORITIZATION_STATE"),
      hash_valid: !errors.some((error) => error.reason === "PRIORITY_HASH_MISMATCH" || error.reason === "PRIORITIZATION_HASH_MISMATCH"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    validation_timestamp: NOW,
  });
}

export function replayEscalationPrioritization(result: EscalationPrioritizationResult): EscalationPrioritizationReplayResult {
  const reconstructed_prioritization_hash = computeEscalationPrioritizationHash(result);
  const validation = validateEscalationPrioritization(result);
  const reproduced = validation.validation_state === "VALID" && reconstructed_prioritization_hash === result.prioritization_hash;
  return Object.freeze({
    replay_id: hashValue("escalation-prioritization-replay", { expected: result.prioritization_hash, reconstructed_prioritization_hash }),
    replay_state: reproduced ? "REPRODUCED" : "MISMATCH",
    reconstructed_prioritization_hash,
    expected_prioritization_hash: result.prioritization_hash,
    reconstructed_priority_ids: Object.freeze(result.priority_records.map((record) => record.priority_id)),
    expected_priority_ids: result.ledger_record.priority_ids,
    failure_reason: reproduced ? null : validation.errors[0]?.reason ?? "PRIORITIZATION_HASH_MISMATCH",
  });
}

export function buildEscalationPrioritizationMetrics(result = prioritizeEscalations()): EscalationPrioritizationMetrics {
  const total = result.priority_records.length;
  const priority_distribution = Object.fromEntries(PRIORITY_LEVELS.map((level) => [level, result.priority_records.filter((record) => record.priority_level === level).length])) as EscalationPrioritizationMetrics["priority_distribution"];
  const confidenceLevels: readonly EscalationConfidenceLevel[] = Object.freeze(["LOW", "MODERATE", "HIGH", "CERTIFICATION_READY"]);
  const confidence_distribution = Object.fromEntries(confidenceLevels.map((level) => [level, result.priority_records.filter((record) => record.confidence.confidence_level === level).length])) as EscalationPrioritizationMetrics["confidence_distribution"];
  const countType = (type: string) => result.source_detection.escalation_records.filter((record) => record.escalation_type === type).length;
  return Object.freeze({
    total_prioritized_escalations: total,
    priority_distribution: Object.freeze(priority_distribution),
    average_priority_score: total ? Math.round(result.priority_records.reduce((sum, record) => sum + record.priority_score, 0) / total) : 0,
    constitutional_escalation_rate: total ? countType("CONSTITUTIONAL") / total : 0,
    authority_escalation_rate: total ? countType("AUTHORITY") / total : 0,
    compliance_escalation_rate: total ? countType("COMPLIANCE") / total : 0,
    policy_escalation_rate: total ? countType("POLICY") / total : 0,
    evidence_completeness_rate: total ? result.priority_records.filter((record) => record.evidence_refs.length > 0).length / total : 1,
    confidence_distribution: Object.freeze(confidence_distribution),
    replay_success_rate: result.replay_state === "REPRODUCED" ? 1 : 0,
    prioritization_latency_ms: 0,
    lineage_reconstruction_success: total ? result.priority_records.filter((record) => record.lineage.priority_history.length > 0 && record.lineage.trigger_chain.length > 0).length / total : 1,
  });
}

export function buildEscalationPrioritizationObservabilitySurface(result = prioritizeEscalations()): EscalationPrioritizationObservabilitySurface {
  const validation = validateEscalationPrioritization(result);
  return Object.freeze({
    priority_count: result.priority_records.length,
    priority_ids: Object.freeze(result.priority_records.map((record) => record.priority_id)),
    priorities: Object.freeze(result.priority_records.map((record) => record.priority_level)),
    scores: Object.freeze(result.priority_records.map((record) => record.priority_score)),
    priority_reasons: Object.freeze(result.priority_records.map((record) => record.priority_reason)),
    contributing_factors: uniqueSorted(result.priority_records.flatMap((record) => record.explainability.contributing_factors)),
    evidence_refs: result.ledger_record.evidence_refs,
    governance_refs: result.ledger_record.governance_context_refs,
    replay_refs: result.ledger_record.replay_refs,
    ledger_refs: result.ledger_record.truth_ledger_refs,
    replay_state: result.replay_state,
    advisory_only_notice: "Escalation prioritization is advisory only; it ranks governance attention without executing actions, modifying policy, overriding operators, or producing recommendations.",
    metrics: buildEscalationPrioritizationMetrics(result),
    validation_failures: Object.freeze(validation.errors.map((error) => error.reason)),
  });
}

export function getEscalationPrioritizationContract() {
  const baseline_prioritization = prioritizeEscalations();
  return Object.freeze({ doctrine: buildEscalationPrioritizationDoctrine(), baseline_prioritization, observability: buildEscalationPrioritizationObservabilitySurface(baseline_prioritization) });
}
