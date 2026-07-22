import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  HealthEvidence,
  MissionConfidence,
  MissionHealthClassification,
  MissionHealthContract,
  MissionHealthFailure,
  MissionHealthInput,
  MissionHealthObservabilitySurface,
  MissionHealthRecord,
  MissionHealthReplayResult,
  MissionHealthScenario,
  MissionHealthState,
  MissionHealthTimelineSnapshot,
  MissionHealthValidationResult,
  MissionSubsystemId,
  MissionTrendState,
  MissionTrendSummary,
  SubsystemHealth,
  SubsystemRegistryEntry,
} from "@/types/mission-health-contract";

const NOW = "2026-07-13T01:00:00.000Z";
const VERSION = "mission-health-contract/v8ALT.4.1" as const;
const TENANT_ID = "tenant:autonomy:primary";

const registry: readonly SubsystemRegistryEntry[] = Object.freeze([
  { subsystem_id: "planning", subsystem_name: "Planning Intelligence", purpose: "Measures planning quality and readiness", weight: 0.15, certified: true },
  { subsystem_id: "orchestration", subsystem_name: "Execution Orchestration", purpose: "Measures workflow execution health", weight: 0.15, certified: true },
  { subsystem_id: "delegation", subsystem_name: "Task Delegation", purpose: "Measures delegation correctness", weight: 0.1, certified: true },
  { subsystem_id: "runtime_supervision", subsystem_name: "Runtime Supervision", purpose: "Measures execution stability", weight: 0.15, certified: true },
  { subsystem_id: "governance", subsystem_name: "Governance Intelligence", purpose: "Measures governance compliance", weight: 0.15, certified: true },
  { subsystem_id: "replay", subsystem_name: "Replay Intelligence", purpose: "Measures replay integrity", weight: 0.1, certified: true },
  { subsystem_id: "integrity", subsystem_name: "Integrity Intelligence", purpose: "Measures immutable history integrity", weight: 0.1, certified: true },
  { subsystem_id: "authority", subsystem_name: "Authority Intelligence", purpose: "Measures authority compliance", weight: 0.1, certified: true },
]);

const lifecycleStates = Object.freeze(["CREATED", "COLLECTING_SUBSYSTEM_HEALTH", "AGGREGATING", "SCORING", "CONFIDENCE_ESTIMATION", "TREND_ANALYSIS", "HEALTH_VALIDATED", "PUBLISHED", "ARCHIVED"] as const);
const healthStates = Object.freeze(["INITIALIZING", "COLLECTING", "CALCULATING", "VALIDATING", "HEALTHY", "STABLE", "WARNING", "DEGRADED", "CRITICAL", "RECOVERING", "FAILED", "ARCHIVED"] as const);
const confidenceLevels = Object.freeze(["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "VERY_LOW", "INSUFFICIENT"] as const);
const trendStates = Object.freeze(["IMPROVING", "STABLE", "FLUCTUATING", "DEGRADING", "RAPID_DECLINE", "RECOVERING", "UNKNOWN"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function round(value: number): number { return Number(value.toFixed(4)); }

function classify(score: number): MissionHealthClassification {
  if (score >= 98) return "OPTIMAL";
  if (score >= 90) return "HEALTHY";
  if (score >= 80) return "STABLE";
  if (score >= 65) return "WARNING";
  if (score >= 40) return "DEGRADED";
  if (score >= 20) return "CRITICAL";
  return "FAILED";
}

function healthState(score: number): MissionHealthState {
  const c = classify(score);
  if (c === "OPTIMAL" || c === "HEALTHY") return "HEALTHY";
  if (c === "STABLE") return "STABLE";
  if (c === "WARNING") return "WARNING";
  if (c === "DEGRADED") return "DEGRADED";
  if (c === "CRITICAL") return "CRITICAL";
  return "FAILED";
}

function confidenceLevel(value: number) {
  if (value >= 0.9) return "VERY_HIGH" as const;
  if (value >= 0.78) return "HIGH" as const;
  if (value >= 0.62) return "MEDIUM" as const;
  if (value >= 0.45) return "LOW" as const;
  if (value > 0) return "VERY_LOW" as const;
  return "INSUFFICIENT" as const;
}

function scenarioFailures(scenario: MissionHealthScenario): readonly MissionHealthFailure[] {
  const map: Partial<Record<MissionHealthScenario, MissionHealthFailure>> = {
    MISSING_SUBSYSTEM: "SUBSYSTEM_REGISTRATION_INVALID",
    DUPLICATE_SUBSYSTEM: "SUBSYSTEM_REGISTRATION_INVALID",
    INVALID_HEALTH_SCORE: "REQUIRED_HEALTH_METRICS_MISSING",
    INVALID_CONFIDENCE: "CONFIDENCE_INVALID",
    INCONSISTENT_AGGREGATION: "AGGREGATION_INCONSISTENT",
    MISSING_EVIDENCE: "EVIDENCE_INCOMPLETE",
    MISSING_REPLAY_REFERENCE: "REPLAY_REFERENCE_MISSING",
    BROKEN_LINEAGE: "LINEAGE_BROKEN",
    INTEGRITY_FAILURE: "INTEGRITY_INVALID",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_VIOLATION",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function evidence(missionId: string, subsystem: MissionSubsystemId, index: number, failures: readonly MissionHealthFailure[]): HealthEvidence {
  const lineage_reference = failures.includes("LINEAGE_BROKEN") ? "" : `lineage:mission-health:${subsystem}`;
  const replay_reference = failures.includes("REPLAY_REFERENCE_MISSING") ? "" : `replay:mission-health:${subsystem}`;
  const base = {
    evidence_id: id("MHE", "mission-health-evidence", { missionId, subsystem }),
    mission_id: missionId,
    subsystem,
    metric: "health_score",
    metric_value: round(92 - index * 2.2),
    calculation: "deterministic weighted subsystem health",
    confidence: round(0.91 - index * 0.015),
    timestamp: NOW,
    source: `subsystem:${subsystem}`,
    lineage_reference,
    replay_reference,
    integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("mission-health-evidence-integrity", { missionId, subsystem, lineage_reference, replay_reference }),
  };
  return Object.freeze({ ...base, evidence_hash: hashValue("mission-health-evidence", base) });
}

function subsystem(entry: SubsystemRegistryEntry, evidenceId: string, index: number, failures: readonly MissionHealthFailure[]): SubsystemHealth {
  const score = failures.includes("REQUIRED_HEALTH_METRICS_MISSING") && index === 0 ? 120 : round(92 - index * 2.2);
  const confidence = failures.includes("CONFIDENCE_INVALID") && index === 0 ? 1.4 : round(0.91 - index * 0.015);
  const lineage_reference = failures.includes("LINEAGE_BROKEN") ? "" : `lineage:mission-health:${entry.subsystem_id}`;
  const replay_reference = failures.includes("REPLAY_REFERENCE_MISSING") ? "" : `replay:mission-health:${entry.subsystem_id}`;
  const base = {
    subsystem_id: entry.subsystem_id,
    subsystem_name: entry.subsystem_name,
    health_score: score,
    confidence,
    stability: round(0.88 - index * 0.01),
    risk_level: round((100 - Math.min(100, score)) / 100),
    status: classify(Math.max(0, Math.min(100, score))),
    degradation_detected: score < 80,
    trend: index % 3 === 0 ? "STABLE" as const : index % 3 === 1 ? "IMPROVING" as const : "FLUCTUATING" as const,
    evidence: failures.includes("EVIDENCE_INCOMPLETE") ? freezeArray<string>([]) : freezeArray([evidenceId]),
    last_updated: NOW,
    lineage_reference,
    replay_reference,
  };
  return Object.freeze({ ...base, subsystem_hash: hashValue("mission-health-subsystem", base) });
}

function confidenceModel(subsystems: readonly SubsystemHealth[]): MissionConfidence {
  const by = Object.fromEntries(subsystems.map((item) => [item.subsystem_id, item.confidence])) as Record<MissionSubsystemId, number>;
  const overall = round(subsystems.reduce((sum, item) => sum + item.confidence, 0) / Math.max(1, subsystems.length));
  const base = {
    overall_confidence: overall,
    confidence_level: confidenceLevel(overall),
    planning_confidence: by.planning ?? 0,
    orchestration_confidence: by.orchestration ?? 0,
    delegation_confidence: by.delegation ?? 0,
    supervision_confidence: by.runtime_supervision ?? 0,
    governance_confidence: by.governance ?? 0,
    replay_confidence: by.replay ?? 0,
    integrity_confidence: by.integrity ?? 0,
    authority_confidence: by.authority ?? 0,
  };
  return Object.freeze({ ...base, confidence_hash: hashValue("mission-health-confidence", base) });
}

function trendSummary(score: number, confidence: number): MissionTrendSummary {
  const base = {
    trend_state: score >= 85 ? "STABLE" as const : "DEGRADING" as const,
    moving_average: round(score - 0.75),
    health_velocity: round(0.12),
    degradation_acceleration: round(0.01),
    recovery_velocity: round(0.05),
    stability_duration: "PT6H",
    confidence_evolution: freezeArray([round(confidence - 0.02), round(confidence - 0.01), confidence]),
  };
  return Object.freeze({ ...base, trend_hash: hashValue("mission-health-trend", base) });
}

function computeRecordHash(record: Omit<MissionHealthRecord, "record_hash"> | MissionHealthRecord): string {
  const { record_hash: _hash, ...source } = record as MissionHealthRecord;
  return hashValue("mission-health-record", source);
}

export function createMissionHealth(input: MissionHealthInput = {}): MissionHealthRecord {
  const scenario = input.scenario ?? "BASELINE";
  const failures = scenarioFailures(scenario);
  const tenantId = input.tenant_id ?? TENANT_ID;
  const missionId = input.mission_id ?? "mission:health:primary";
  let effectiveRegistry = [...registry];
  if (scenario === "MISSING_SUBSYSTEM") effectiveRegistry = effectiveRegistry.slice(1);
  if (scenario === "DUPLICATE_SUBSYSTEM") effectiveRegistry = [...effectiveRegistry, registry[0]];
  const evidenceRecords = effectiveRegistry.map((entry, index) => evidence(missionId, entry.subsystem_id, index, failures));
  const subsystems = effectiveRegistry.map((entry, index) => subsystem(entry, evidenceRecords[index]?.evidence_id ?? "", index, failures));
  const weighted = round(subsystems.reduce((sum, item) => sum + item.health_score * (registry.find((entry) => entry.subsystem_id === item.subsystem_id)?.weight ?? 0), 0));
  const overall_health_score = failures.includes("AGGREGATION_INCONSISTENT") ? round(weighted + 5) : weighted;
  const confidence = confidenceModel(subsystems);
  const trend = trendSummary(overall_health_score, confidence.overall_confidence);
  const timelineBase = {
    timestamp: NOW,
    mission_health_score: overall_health_score,
    subsystem_scores: freezeArray(subsystems.map((item) => `${item.subsystem_id}:${item.health_score}`).sort()),
    confidence: confidence.overall_confidence,
    trend_state: trend.trend_state,
    detected_degradation: subsystems.some((item) => item.degradation_detected),
    recommendations: freezeArray(["operator review if health degrades", "preserve advisory-only governance"]),
    evidence_references: freezeArray(evidenceRecords.map((item) => item.evidence_id).sort()),
    replay_references: freezeArray(evidenceRecords.map((item) => item.replay_reference).filter(Boolean).sort()),
    lineage_references: freezeArray(evidenceRecords.map((item) => item.lineage_reference).filter(Boolean).sort()),
  };
  const snapshot: MissionHealthTimelineSnapshot = Object.freeze({ ...timelineBase, snapshot_hash: hashValue("mission-health-timeline", timelineBase) });
  const base = {
    mission_health_id: id("MHC", "mission-health-contract", { missionId, scenario }),
    mission_id: missionId,
    tenant_id: tenantId,
    status: "PUBLISHED" as const,
    overall_health_score,
    overall_confidence: confidence.overall_confidence,
    overall_risk: round((100 - Math.min(100, overall_health_score)) / 100),
    overall_stability: round(subsystems.reduce((sum, item) => sum + item.stability, 0) / Math.max(1, subsystems.length)),
    health_state: healthState(overall_health_score),
    health_classification: classify(Math.max(0, Math.min(100, overall_health_score))),
    calculation_timestamp: NOW,
    subsystem_scores: freezeArray(subsystems),
    confidence_model: confidence,
    trend_summary: trend,
    timeline_reference: `timeline:${missionId}`,
    timeline: freezeArray([snapshot]),
    evidence_reference: `evidence:${missionId}`,
    evidence: freezeArray(evidenceRecords),
    lineage_reference: failures.includes("LINEAGE_BROKEN") ? "" : `lineage:${missionId}`,
    replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : `replay:${missionId}`,
    integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("mission-health-integrity", { subsystems: subsystems.map((item) => item.subsystem_hash), evidence: evidenceRecords.map((item) => item.evidence_hash), confidence: confidence.confidence_hash, trend: trend.trend_hash }),
    contract_version: VERSION,
    advisory_only: true as const,
    recovery_executed: failures.includes("ADVISORY_ONLY_VIOLATION"),
    execution_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    governance_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    constitutional_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    autonomous_execution_approved: failures.includes("ADVISORY_ONLY_VIOLATION"),
  };
  return Object.freeze({ ...base, record_hash: computeRecordHash(base as Omit<MissionHealthRecord, "record_hash">) });
}

export function replayMissionHealth(record = createMissionHealth()): MissionHealthReplayResult {
  const reconstructed_hash = computeRecordHash(record);
  const source = { replay_reference: record.replay_reference, mission_health_id: record.mission_health_id, deterministic: reconstructed_hash === record.record_hash && Boolean(record.replay_reference), reconstructed_hash, original_hash: record.record_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("mission-health-replay", source) });
}

export function validateMissionHealth(record?: MissionHealthRecord): MissionHealthValidationResult {
  if (!record) {
    const failures = freezeArray<MissionHealthFailure>(["SCHEMA_INVALID"]);
    const source = { mission_health_id: null, valid: false, contract_version_valid: false, schema_integrity_valid: false, subsystem_registration_valid: false, required_health_metrics_present: false, scoring_weights_valid: false, confidence_values_valid: false, aggregation_consistent: false, evidence_complete: false, replay_references_present: false, lineage_references_present: false, integrity_hashes_valid: false, governance_valid: false, constitutional_valid: false, tenant_isolated: false, advisory_only_behavior_enforced: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("mission-health-validation", source) });
  }
  const ids = record.subsystem_scores.map((item) => item.subsystem_id);
  const contract_version_valid = record.contract_version === VERSION;
  const schema_integrity_valid = Boolean(record.mission_health_id && record.mission_id && record.tenant_id);
  const subsystem_registration_valid = ids.length === registry.length && new Set(ids).size === registry.length && registry.every((entry) => ids.includes(entry.subsystem_id));
  const required_health_metrics_present = record.subsystem_scores.every((item) => item.health_score >= 0 && item.health_score <= 100 && item.stability >= 0 && item.risk_level >= 0);
  const scoring_weights_valid = round(registry.reduce((sum, entry) => sum + entry.weight, 0)) === 1;
  const confidence_values_valid = record.subsystem_scores.every((item) => item.confidence >= 0 && item.confidence <= 1) && record.overall_confidence >= 0 && record.overall_confidence <= 1;
  const expected = round(record.subsystem_scores.reduce((sum, item) => sum + item.health_score * (registry.find((entry) => entry.subsystem_id === item.subsystem_id)?.weight ?? 0), 0));
  const aggregation_consistent = expected === record.overall_health_score;
  const evidence_complete = record.evidence.length === record.subsystem_scores.length && record.subsystem_scores.every((item) => item.evidence.length > 0);
  const replay_references_present = Boolean(record.replay_reference) && record.evidence.every((item) => item.replay_reference) && record.subsystem_scores.every((item) => item.replay_reference);
  const lineage_references_present = Boolean(record.lineage_reference) && record.evidence.every((item) => item.lineage_reference) && record.subsystem_scores.every((item) => item.lineage_reference);
  const integrity_hashes_valid = Boolean(record.integrity_hash) && record.evidence.every((item) => item.integrity_hash) && computeRecordHash(record) === record.record_hash;
  const governance_valid = !record.governance_modified;
  const constitutional_valid = !record.constitutional_modified;
  const tenant_isolated = record.tenant_id.startsWith("tenant:");
  const advisory_only_behavior_enforced = record.advisory_only && !record.recovery_executed && !record.execution_modified && !record.governance_modified && !record.constitutional_modified && !record.autonomous_execution_approved;
  const failures = unique([
    ...(!contract_version_valid ? ["CONTRACT_VERSION_INVALID" as const] : []),
    ...(!schema_integrity_valid ? ["SCHEMA_INVALID" as const] : []),
    ...(!subsystem_registration_valid ? ["SUBSYSTEM_REGISTRATION_INVALID" as const] : []),
    ...(!required_health_metrics_present ? ["REQUIRED_HEALTH_METRICS_MISSING" as const] : []),
    ...(!scoring_weights_valid ? ["SCORING_WEIGHTS_INVALID" as const] : []),
    ...(!confidence_values_valid ? ["CONFIDENCE_INVALID" as const] : []),
    ...(!aggregation_consistent ? ["AGGREGATION_INCONSISTENT" as const] : []),
    ...(!evidence_complete ? ["EVIDENCE_INCOMPLETE" as const] : []),
    ...(!replay_references_present ? ["REPLAY_REFERENCE_MISSING" as const] : []),
    ...(!lineage_references_present ? ["LINEAGE_BROKEN" as const] : []),
    ...(!integrity_hashes_valid ? ["INTEGRITY_INVALID" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_INVALID" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_INVALID" as const] : []),
    ...(!tenant_isolated ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(!advisory_only_behavior_enforced ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { mission_health_id: record.mission_health_id, valid, contract_version_valid, schema_integrity_valid, subsystem_registration_valid, required_health_metrics_present, scoring_weights_valid, confidence_values_valid, aggregation_consistent, evidence_complete, replay_references_present, lineage_references_present, integrity_hashes_valid, governance_valid, constitutional_valid, tenant_isolated, advisory_only_behavior_enforced, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("mission-health-validation", source) });
}

export function buildMissionHealthObservabilitySurface(record = createMissionHealth()): MissionHealthObservabilitySurface {
  return Object.freeze({ mission_health_id: record.mission_health_id, mission_id: record.mission_id, tenant_id: record.tenant_id, health_state: record.health_state, health_score: record.overall_health_score, confidence: record.overall_confidence, subsystem_count: record.subsystem_scores.length, trend_state: record.trend_summary.trend_state, advisory_only: true, record_hash: record.record_hash });
}

export function getMissionHealthContract(): MissionHealthContract {
  const health = createMissionHealth();
  return Object.freeze({
    doctrine: Object.freeze({
      contract_version: VERSION,
      principles: freezeArray(["deterministic-health-scoring", "standardized-subsystem-health", "immutable-weighting", "replay-reproducibility", "governance-supremacy", "constitutional-compliance", "tenant-isolation", "advisory-only-behavior", "certification-readiness"]),
      lifecycle_states: lifecycleStates,
      health_states: healthStates,
      confidence_levels: confidenceLevels,
      trend_states: trendStates,
      subsystem_registry: registry,
      advisory_only: true,
    }),
    health,
    validation: validateMissionHealth(health),
    replay: replayMissionHealth(health),
    observability: buildMissionHealthObservabilitySurface(health),
  });
}
