import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { MissionSubsystemId, SubsystemRegistryEntry } from "@/types/mission-health-contract";
import type {
  AlertCategory,
  CollectedSubsystemHealthRecord,
  CollectionEvidence,
  CollectionFailureCategory,
  HealthAlert,
  HealthAnomaly,
  HealthCategory,
  NormalizedHealthMetric,
  StabilityMetrics,
  SubsystemHealthCollection,
  SubsystemHealthCollectionEngineContract,
  SubsystemHealthCollectionFailure,
  SubsystemHealthCollectionInput,
  SubsystemHealthCollectionObservabilitySurface,
  SubsystemHealthCollectionReplayResult,
  SubsystemHealthCollectionScenario,
  SubsystemHealthCollectionValidationResult,
} from "@/types/subsystem-health-collection-engine";

const NOW = "2026-07-13T02:00:00.000Z";
const VERSION = "subsystem-health-collection-engine/v8ALT.4.2" as const;
const TENANT_ID = "tenant:autonomy:primary";

const registry: readonly (SubsystemRegistryEntry & { category: HealthCategory })[] = Object.freeze([
  { subsystem_id: "planning", subsystem_name: "Planning Intelligence", purpose: "Measures planning quality and readiness", weight: 0.15, certified: true, category: "Planning Health" },
  { subsystem_id: "orchestration", subsystem_name: "Execution Orchestration", purpose: "Measures workflow execution health", weight: 0.15, certified: true, category: "Orchestration Health" },
  { subsystem_id: "delegation", subsystem_name: "Task Delegation", purpose: "Measures delegation correctness", weight: 0.1, certified: true, category: "Delegation Health" },
  { subsystem_id: "runtime_supervision", subsystem_name: "Runtime Supervision", purpose: "Measures execution stability", weight: 0.15, certified: true, category: "Supervision Health" },
  { subsystem_id: "governance", subsystem_name: "Governance Intelligence", purpose: "Measures governance compliance", weight: 0.15, certified: true, category: "Governance Health" },
  { subsystem_id: "replay", subsystem_name: "Replay Intelligence", purpose: "Measures replay integrity", weight: 0.1, certified: true, category: "Replay Health" },
  { subsystem_id: "integrity", subsystem_name: "Integrity Intelligence", purpose: "Measures immutable history integrity", weight: 0.1, certified: true, category: "Integrity Health" },
  { subsystem_id: "authority", subsystem_name: "Authority Intelligence", purpose: "Measures authority compliance", weight: 0.1, certified: true, category: "Authority Health" },
]);

const collectionStates = Object.freeze(["REGISTERED", "WAITING_FOR_REPORT", "COLLECTING", "VALIDATING", "NORMALIZING", "EVIDENCE_LINKING", "HEALTH_RECORD_CREATED", "PUBLISHED", "ARCHIVED"] as const);
const alertCategories = Object.freeze(["INFORMATION", "NOTICE", "WARNING", "HIGH_RISK", "CRITICAL", "EMERGENCY"] as const);
const failureCategories = Object.freeze(["COLLECTION_FAILURE", "VALIDATION_FAILURE", "NORMALIZATION_FAILURE", "SCHEMA_FAILURE", "SUBSYSTEM_TIMEOUT", "MISSING_EVIDENCE", "REPLAY_FAILURE", "INTEGRITY_FAILURE", "AUTHORITY_FAILURE", "GOVERNANCE_FAILURE"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function round(value: number): number { return Number(value.toFixed(4)); }

function classify(score: number) {
  if (score >= 98) return "OPTIMAL" as const;
  if (score >= 90) return "HEALTHY" as const;
  if (score >= 80) return "STABLE" as const;
  if (score >= 65) return "WARNING" as const;
  if (score >= 40) return "DEGRADED" as const;
  if (score >= 20) return "CRITICAL" as const;
  return "FAILED" as const;
}

function scenarioFailures(scenario: SubsystemHealthCollectionScenario): readonly SubsystemHealthCollectionFailure[] {
  const map: Partial<Record<SubsystemHealthCollectionScenario, SubsystemHealthCollectionFailure>> = {
    SCHEMA_INVALID: "HEALTH_SCHEMA_INVALID",
    DUPLICATE_SUBMISSION: "DUPLICATE_SUBMISSION_DETECTED",
    MISSING_EVIDENCE: "EVIDENCE_MISSING",
    INVALID_CONFIDENCE: "CONFIDENCE_INVALID",
    MISSING_REPLAY_REFERENCE: "REPLAY_REFERENCE_MISSING",
    MISSING_LINEAGE: "LINEAGE_REFERENCE_MISSING",
    INTEGRITY_FAILURE: "INTEGRITY_INVALID",
    AUTHORITY_FAILURE: "AUTHORITY_VALIDATION_FAILED",
    GOVERNANCE_FAILURE: "GOVERNANCE_VALIDATION_FAILED",
    CROSS_TENANT_REPORT: "TENANT_OWNERSHIP_INVALID",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_VIOLATION",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function stability(subsystem: MissionSubsystemId, index: number): StabilityMetrics {
  const base = {
    stability_score: round(0.9 - index * 0.018),
    stability_duration: "PT4H",
    oscillation_frequency: round(0.02 + index * 0.003),
    recovery_rate: round(0.78 - index * 0.01),
    degradation_velocity: round(0.015 + index * 0.002),
    health_volatility: round(0.08 + index * 0.004),
    operational_consistency: round(0.89 - index * 0.01),
  };
  return Object.freeze({ ...base, stability_hash: hashValue("subsystem-health-stability", { subsystem, ...base }) });
}

function alert(subsystem: MissionSubsystemId, severity: AlertCategory, evidenceId: string, index: number): HealthAlert {
  const base = { alert_id: id("SHCA", "subsystem-health-alert", { subsystem, index }), subsystem, severity, affected_metric: "health_score", supporting_evidence: evidenceId, confidence: round(0.82 - index * 0.01), timestamp: NOW };
  return Object.freeze({ ...base, alert_hash: hashValue("subsystem-health-alert", base) });
}

function anomaly(subsystem: MissionSubsystemId, evidenceId: string, replayRef: string, index: number): HealthAnomaly {
  const base = { anomaly_id: id("SHCAN", "subsystem-health-anomaly", { subsystem, index }), subsystem, detected_metric: "health_volatility", severity: index > 5 ? "WARNING" as const : "NOTICE" as const, evidence: evidenceId, replay_reference: replayRef };
  return Object.freeze({ ...base, anomaly_hash: hashValue("subsystem-health-anomaly", base) });
}

function evidence(recordId: string, missionId: string, subsystem: MissionSubsystemId, score: number, confidence: number, failures: readonly SubsystemHealthCollectionFailure[]): CollectionEvidence {
  const lineage_reference = failures.includes("LINEAGE_REFERENCE_MISSING") ? "" : `lineage:subsystem-health:${subsystem}`;
  const replay_reference = failures.includes("REPLAY_REFERENCE_MISSING") ? "" : `replay:subsystem-health:${subsystem}`;
  const base = { evidence_id: id("SHCE", "subsystem-health-evidence", { recordId, subsystem }), health_record_id: recordId, subsystem, metric: "health_score", metric_value: score, confidence, source: `subsystem:${subsystem}`, timestamp: NOW, lineage_reference, replay_reference, integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("subsystem-health-evidence-integrity", { recordId, subsystem, score, confidence }) };
  return Object.freeze({ ...base, evidence_hash: hashValue("subsystem-health-evidence", base) });
}

function record(entry: typeof registry[number], missionId: string, tenantId: string, index: number, failures: readonly SubsystemHealthCollectionFailure[]): { record: CollectedSubsystemHealthRecord; evidence: CollectionEvidence; metric: NormalizedHealthMetric } {
  const health_record_id = id("SHCR", "subsystem-health-record", { missionId, subsystem: entry.subsystem_id, index });
  const score = failures.includes("HEALTH_SCHEMA_INVALID") && index === 0 ? 130 : round(93 - index * 2.1);
  const confidence = failures.includes("CONFIDENCE_INVALID") && index === 0 ? 1.2 : round(0.92 - index * 0.015);
  const ev = evidence(health_record_id, missionId, entry.subsystem_id, score, confidence, failures);
  const replay_reference = failures.includes("REPLAY_REFERENCE_MISSING") ? "" : `replay:subsystem-health:${entry.subsystem_id}`;
  const lineage_reference = failures.includes("LINEAGE_REFERENCE_MISSING") ? "" : `lineage:subsystem-health:${entry.subsystem_id}`;
  const failCats: CollectionFailureCategory[] = [
    ...(failures.includes("HEALTH_SCHEMA_INVALID") && index === 0 ? ["SCHEMA_FAILURE" as const] : []),
    ...(failures.includes("EVIDENCE_MISSING") ? ["MISSING_EVIDENCE" as const] : []),
    ...(failures.includes("REPLAY_REFERENCE_MISSING") ? ["REPLAY_FAILURE" as const] : []),
    ...(failures.includes("INTEGRITY_INVALID") ? ["INTEGRITY_FAILURE" as const] : []),
    ...(failures.includes("AUTHORITY_VALIDATION_FAILED") ? ["AUTHORITY_FAILURE" as const] : []),
    ...(failures.includes("GOVERNANCE_VALIDATION_FAILED") ? ["GOVERNANCE_FAILURE" as const] : []),
  ];
  const st = stability(entry.subsystem_id, index);
  const alerts = freezeArray(score < 80 ? [alert(entry.subsystem_id, score < 65 ? "HIGH_RISK" : "WARNING", ev.evidence_id, index)] : [alert(entry.subsystem_id, "INFORMATION", ev.evidence_id, index)]);
  const anomalies = freezeArray(index > 5 ? [anomaly(entry.subsystem_id, ev.evidence_id, replay_reference, index)] : []);
  const base = {
    health_record_id,
    subsystem_id: entry.subsystem_id,
    subsystem_name: entry.subsystem_name,
    health_category: entry.category,
    mission_id: missionId,
    tenant_id: failures.includes("TENANT_OWNERSHIP_INVALID") ? "external-tenant" : tenantId,
    health_score: score,
    confidence,
    health_state: classify(Math.max(0, Math.min(100, score))),
    stability_score: st.stability_score,
    stability_metrics: st,
    risk_level: round((100 - Math.min(100, score)) / 100),
    degradation_state: score < 65 ? "CRITICAL" as const : score < 80 ? "DEGRADED" as const : score < 90 ? "WATCH" as const : "NONE" as const,
    alerts,
    anomalies,
    failures: freezeArray(failCats),
    evidence_reference: failures.includes("EVIDENCE_MISSING") ? "" : ev.evidence_id,
    evidence: failures.includes("EVIDENCE_MISSING") ? freezeArray<string>([]) : freezeArray([ev.evidence_id]),
    lineage_reference,
    replay_reference,
    integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("subsystem-health-record-integrity", { health_record_id, ev: ev.evidence_hash, stability: st.stability_hash }),
    timestamp: NOW,
  };
  const rec = Object.freeze({ ...base, record_hash: hashValue("subsystem-health-record", base) });
  const metricBase = { metric_id: id("SHCM", "subsystem-health-normalized-metric", { missionId, subsystem: entry.subsystem_id }), subsystem: entry.subsystem_id, normalized_score: Math.max(0, Math.min(100, score)), normalized_confidence: Math.max(0, Math.min(1, confidence)), normalized_stability: st.stability_score, normalized_risk: base.risk_level, version_alignment: "mission-health-contract/v8ALT.4.1" as const };
  const metric = Object.freeze({ ...metricBase, metric_hash: hashValue("subsystem-health-normalized-metric", metricBase) });
  return { record: rec, evidence: ev, metric };
}

function computeCollectionHash(collection: Omit<SubsystemHealthCollection, "collection_hash"> | SubsystemHealthCollection): string {
  const { collection_hash: _hash, ...source } = collection as SubsystemHealthCollection;
  return hashValue("subsystem-health-collection", source);
}

export function collectSubsystemHealth(input: SubsystemHealthCollectionInput = {}): SubsystemHealthCollection {
  const scenario = input.scenario ?? "BASELINE";
  const failures = scenarioFailures(scenario);
  const tenantId = input.tenant_id ?? TENANT_ID;
  const missionId = input.mission_id ?? "mission:health:primary";
  let effectiveRegistry = [...registry];
  if (scenario === "DUPLICATE_SUBMISSION") effectiveRegistry = [...effectiveRegistry, registry[0]];
  const produced = effectiveRegistry.map((entry, index) => record(entry, missionId, tenantId, index, failures));
  const subsystems = freezeArray(produced.map((item) => item.record).sort((a, b) => a.subsystem_id.localeCompare(b.subsystem_id)));
  const normalized_metrics = freezeArray(produced.map((item) => item.metric).sort((a, b) => a.subsystem.localeCompare(b.subsystem)));
  const evidence_references = freezeArray(produced.map((item) => item.evidence).sort((a, b) => a.subsystem.localeCompare(b.subsystem)));
  const base = {
    collection_id: id("SHC", "subsystem-health-collection", { missionId, scenario }),
    mission_id: missionId,
    tenant_id: failures.includes("TENANT_OWNERSHIP_INVALID") ? "external-tenant" : tenantId,
    collection_timestamp: NOW,
    collection_state: failures.length ? "VALIDATING" as const : "PUBLISHED" as const,
    overall_collection_status: failures.length ? "REJECTED" as const : "COMPLETE" as const,
    subsystems,
    normalized_metrics,
    evidence_references,
    health_event_stream: freezeArray(subsystems.map((item) => `${item.timestamp}:${item.subsystem_id}:${item.health_state}`).sort()),
    lineage_reference: failures.includes("LINEAGE_REFERENCE_MISSING") ? "" : `lineage:subsystem-health-collection:${missionId}`,
    replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : `replay:subsystem-health-collection:${missionId}`,
    integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("subsystem-health-collection-integrity", { records: subsystems.map((item) => item.record_hash), evidence: evidence_references.map((item) => item.evidence_hash), metrics: normalized_metrics.map((item) => item.metric_hash) }),
    contract_version: VERSION,
    advisory_only: true as const,
    corrective_action_executed: failures.includes("ADVISORY_ONLY_VIOLATION"),
    recovery_initiated: failures.includes("ADVISORY_ONLY_VIOLATION"),
    subsystem_state_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    governance_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    authority_escalated: failures.includes("ADVISORY_ONLY_VIOLATION"),
  };
  return Object.freeze({ ...base, collection_hash: computeCollectionHash(base as Omit<SubsystemHealthCollection, "collection_hash">) });
}

export function replaySubsystemHealthCollection(collection = collectSubsystemHealth()): SubsystemHealthCollectionReplayResult {
  const reconstructed_hash = computeCollectionHash(collection);
  const source = { replay_reference: collection.replay_reference, collection_id: collection.collection_id, deterministic: reconstructed_hash === collection.collection_hash && Boolean(collection.replay_reference), reconstructed_hash, original_hash: collection.collection_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("subsystem-health-collection-replay", source) });
}

export function validateSubsystemHealthCollection(collection?: SubsystemHealthCollection): SubsystemHealthCollectionValidationResult {
  if (!collection) {
    const failures = freezeArray<SubsystemHealthCollectionFailure>(["COLLECTION_CONTRACT_INVALID"]);
    const source = { collection_id: null, valid: false, collection_contract_valid: false, health_schema_valid: false, subsystem_identity_verified: false, deterministic_ordering_verified: false, normalization_reproducible: false, evidence_registered: false, confidence_valid: false, replay_references_present: false, lineage_references_present: false, integrity_hashes_valid: false, authority_validation_enforced: false, governance_validation_enforced: false, tenant_ownership_valid: false, advisory_only_behavior_enforced: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("subsystem-health-collection-validation", source) });
  }
  const ids = collection.subsystems.map((item) => item.subsystem_id);
  const collection_contract_valid = collection.contract_version === VERSION;
  const health_schema_valid = collection.subsystems.every((item) => item.health_record_id && item.health_score >= 0 && item.health_score <= 100);
  const subsystem_identity_verified = collection.subsystems.length === registry.length && new Set(ids).size === registry.length && registry.every((entry) => ids.includes(entry.subsystem_id));
  const deterministic_ordering_verified = ids.join("|") === [...ids].sort().join("|");
  const normalization_reproducible = collection.normalized_metrics.length === collection.subsystems.length && collection.normalized_metrics.every((item) => item.normalized_score >= 0 && item.normalized_score <= 100);
  const evidence_registered = collection.evidence_references.length === collection.subsystems.length && collection.subsystems.every((item) => item.evidence.length > 0 && item.evidence_reference);
  const confidence_valid = collection.subsystems.every((item) => item.confidence >= 0 && item.confidence <= 1);
  const replay_references_present = Boolean(collection.replay_reference) && collection.subsystems.every((item) => item.replay_reference) && collection.evidence_references.every((item) => item.replay_reference);
  const lineage_references_present = Boolean(collection.lineage_reference) && collection.subsystems.every((item) => item.lineage_reference) && collection.evidence_references.every((item) => item.lineage_reference);
  const integrity_hashes_valid = Boolean(collection.integrity_hash) && collection.subsystems.every((item) => item.integrity_hash) && collection.evidence_references.every((item) => item.integrity_hash) && computeCollectionHash(collection) === collection.collection_hash;
  const authority_validation_enforced = !collection.authority_escalated && collection.subsystems.every((item) => !item.failures.includes("AUTHORITY_FAILURE"));
  const governance_validation_enforced = !collection.governance_modified && collection.subsystems.every((item) => !item.failures.includes("GOVERNANCE_FAILURE"));
  const tenant_ownership_valid = collection.tenant_id.startsWith("tenant:") && collection.subsystems.every((item) => item.tenant_id === collection.tenant_id);
  const advisory_only_behavior_enforced = collection.advisory_only && !collection.corrective_action_executed && !collection.recovery_initiated && !collection.subsystem_state_modified && !collection.governance_modified && !collection.authority_escalated;
  const failures = unique([
    ...(!collection_contract_valid ? ["COLLECTION_CONTRACT_INVALID" as const] : []),
    ...(!health_schema_valid ? ["HEALTH_SCHEMA_INVALID" as const] : []),
    ...(!subsystem_identity_verified ? ["SUBSYSTEM_IDENTITY_INVALID" as const, ...(new Set(ids).size !== ids.length ? ["DUPLICATE_SUBMISSION_DETECTED" as const] : [])] : []),
    ...(!normalization_reproducible ? ["NORMALIZATION_INVALID" as const] : []),
    ...(!evidence_registered ? ["EVIDENCE_MISSING" as const] : []),
    ...(!confidence_valid ? ["CONFIDENCE_INVALID" as const] : []),
    ...(!replay_references_present ? ["REPLAY_REFERENCE_MISSING" as const] : []),
    ...(!lineage_references_present ? ["LINEAGE_REFERENCE_MISSING" as const] : []),
    ...(!integrity_hashes_valid ? ["INTEGRITY_INVALID" as const] : []),
    ...(!authority_validation_enforced ? ["AUTHORITY_VALIDATION_FAILED" as const] : []),
    ...(!governance_validation_enforced ? ["GOVERNANCE_VALIDATION_FAILED" as const] : []),
    ...(!tenant_ownership_valid ? ["TENANT_OWNERSHIP_INVALID" as const] : []),
    ...(!advisory_only_behavior_enforced ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { collection_id: collection.collection_id, valid, collection_contract_valid, health_schema_valid, subsystem_identity_verified, deterministic_ordering_verified, normalization_reproducible, evidence_registered, confidence_valid, replay_references_present, lineage_references_present, integrity_hashes_valid, authority_validation_enforced, governance_validation_enforced, tenant_ownership_valid, advisory_only_behavior_enforced, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("subsystem-health-collection-validation", source) });
}

export function buildSubsystemHealthCollectionObservabilitySurface(collection = collectSubsystemHealth()): SubsystemHealthCollectionObservabilitySurface {
  return Object.freeze({ collection_id: collection.collection_id, mission_id: collection.mission_id, tenant_id: collection.tenant_id, subsystem_count: collection.subsystems.length, alert_count: collection.subsystems.reduce((sum, item) => sum + item.alerts.length, 0), anomaly_count: collection.subsystems.reduce((sum, item) => sum + item.anomalies.length, 0), failure_count: collection.subsystems.reduce((sum, item) => sum + item.failures.length, 0), overall_collection_status: collection.overall_collection_status, advisory_only: true, collection_hash: collection.collection_hash });
}

export function getSubsystemHealthCollectionEngineContract(): SubsystemHealthCollectionEngineContract {
  const collection = collectSubsystemHealth();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic-collection", "deterministic-normalization", "schema-validation", "evidence-registration", "replay-reproducibility", "immutable-lineage", "governance-enforcement", "constitutional-compliance", "tenant-isolation", "observation-only"]),
      collection_states: collectionStates,
      supported_subsystems: freezeArray(registry.map((item) => item.subsystem_name)),
      alert_categories: alertCategories,
      failure_categories: failureCategories,
      advisory_only: true,
    }),
    collection,
    validation: validateSubsystemHealthCollection(collection),
    replay: replaySubsystemHealthCollection(collection),
    observability: buildSubsystemHealthCollectionObservabilitySurface(collection),
  });
}
