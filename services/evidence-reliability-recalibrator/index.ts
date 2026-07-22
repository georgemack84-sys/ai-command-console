import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { analyzeConfidenceDrift } from "@/services/confidence-drift-detector";
import type {
  EvidenceCompletenessRating,
  EvidenceConflictSeverity,
  EvidenceDurabilityRating,
  EvidenceReliabilityApiSurface,
  EvidenceReliabilityFailure,
  EvidenceReliabilityFoundation,
  EvidenceReliabilityInput,
  EvidenceReliabilityRecord,
  EvidenceReliabilityRegistry,
  EvidenceReliabilityResult,
  EvidenceReliabilityTrend,
  EvidenceReliabilityValidation,
  EvidenceSourceCategory,
  SourceReliabilityProfile,
  EvidenceReliabilityReport,
} from "@/types/evidence-reliability-recalibrator";

const EVIDENCE_RELIABILITY_VERSION = "evidence-reliability-recalibrator/v1" as const;

type Scenario = NonNullable<EvidenceReliabilityInput["scenario"]>;
type EvidenceSample = Readonly<{
  sourceCategory: EvidenceSourceCategory;
  completenessRating: EvidenceCompletenessRating;
  conflictSeverity: EvidenceConflictSeverity;
  durabilityRating: EvidenceDurabilityRating;
  sourceQuality: number;
  completeness: number;
  freshness: number;
  conflict: number;
  uncertainty: number;
  lineage: number;
  verification: number;
  durability: number;
  influence: number;
  trend: EvidenceReliabilityTrend;
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

function clamp(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}

function buildApiSurface(): EvidenceReliabilityApiSurface {
  const base: Omit<EvidenceReliabilityApiSurface, "integrity_hash"> = {
    api_id: "evidence_reliability_recalibrator_api",
    analyze_reliability: "POST /evidence-reliability-recalibrator/analyze",
    retrieve_records: "POST /evidence-reliability-recalibrator/records",
    retrieve_sources: "POST /evidence-reliability-recalibrator/sources",
    retrieve_report: "POST /evidence-reliability-recalibrator/report",
    retrieve_registry: "POST /evidence-reliability-recalibrator/registry",
    retrieve_completeness: "POST /evidence-reliability-recalibrator/completeness",
    retrieve_freshness: "POST /evidence-reliability-recalibrator/freshness",
    retrieve_conflicts: "POST /evidence-reliability-recalibrator/conflicts",
    retrieve_uncertainty: "POST /evidence-reliability-recalibrator/uncertainty",
    retrieve_lineage: "POST /evidence-reliability-recalibrator/lineage",
    retrieve_verification: "POST /evidence-reliability-recalibrator/verification",
    retrieve_durability: "POST /evidence-reliability-recalibrator/durability",
    replay_analysis: "POST /evidence-reliability-recalibrator/replay",
    retrieve_contract: "GET /evidence-reliability-recalibrator/contract",
    update_supported: false,
    delete_supported: false,
    evidence_mutation_supported: false,
    evidence_weight_update_supported: false,
    confidence_model_update_supported: false,
    historical_decision_change_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function sampleForScenario(scenario: Scenario): EvidenceSample {
  const map: Partial<Record<Scenario, EvidenceSample>> = {
    AUTHORITATIVE: { sourceCategory: "AUTHORITATIVE", completenessRating: "COMPLETE", conflictSeverity: "NONE", durabilityRating: "VERY_HIGH", sourceQuality: 0.96, completeness: 0.94, freshness: 0.92, conflict: 0.98, uncertainty: 0.9, lineage: 0.97, verification: 0.95, durability: 0.94, influence: 0.08, trend: "STABLE" },
    VERIFIED: { sourceCategory: "VERIFIED", completenessRating: "MOSTLY_COMPLETE", conflictSeverity: "MINOR", durabilityRating: "HIGH", sourceQuality: 0.9, completeness: 0.87, freshness: 0.86, conflict: 0.9, uncertainty: 0.84, lineage: 0.91, verification: 0.9, durability: 0.88, influence: 0.12, trend: "STABLE" },
    TRUSTED: { sourceCategory: "TRUSTED", completenessRating: "ADEQUATE", conflictSeverity: "MINOR", durabilityRating: "HIGH", sourceQuality: 0.84, completeness: 0.8, freshness: 0.78, conflict: 0.86, uncertainty: 0.76, lineage: 0.86, verification: 0.82, durability: 0.84, influence: 0.18, trend: "STABLE" },
    OPERATIONAL: { sourceCategory: "OPERATIONAL", completenessRating: "ADEQUATE", conflictSeverity: "MODERATE", durabilityRating: "MODERATE", sourceQuality: 0.76, completeness: 0.74, freshness: 0.72, conflict: 0.68, uncertainty: 0.7, lineage: 0.8, verification: 0.72, durability: 0.7, influence: 0.28, trend: "VOLATILE" },
    EXTERNAL: { sourceCategory: "EXTERNAL", completenessRating: "INCOMPLETE", conflictSeverity: "MODERATE", durabilityRating: "MODERATE", sourceQuality: 0.68, completeness: 0.58, freshness: 0.64, conflict: 0.62, uncertainty: 0.6, lineage: 0.7, verification: 0.62, durability: 0.66, influence: 0.36, trend: "DEGRADING" },
    DERIVED: { sourceCategory: "DERIVED", completenessRating: "ADEQUATE", conflictSeverity: "MODERATE", durabilityRating: "LOW", sourceQuality: 0.63, completeness: 0.7, freshness: 0.61, conflict: 0.58, uncertainty: 0.54, lineage: 0.68, verification: 0.6, durability: 0.49, influence: 0.42, trend: "DEGRADING" },
    UNVERIFIED: { sourceCategory: "UNVERIFIED", completenessRating: "INSUFFICIENT", conflictSeverity: "MAJOR", durabilityRating: "LOW", sourceQuality: 0.38, completeness: 0.42, freshness: 0.45, conflict: 0.32, uncertainty: 0.35, lineage: 0.52, verification: 0.22, durability: 0.36, influence: 0.68, trend: "DEGRADING" },
    UNKNOWN: { sourceCategory: "UNKNOWN", completenessRating: "CRITICAL_DEFICIENCY", conflictSeverity: "CRITICAL", durabilityRating: "VERY_LOW", sourceQuality: 0.18, completeness: 0.2, freshness: 0.25, conflict: 0.16, uncertainty: 0.18, lineage: 0.28, verification: 0.12, durability: 0.2, influence: 0.86, trend: "VOLATILE" },
    INCOMPLETE: { sourceCategory: "OPERATIONAL", completenessRating: "INSUFFICIENT", conflictSeverity: "MINOR", durabilityRating: "MODERATE", sourceQuality: 0.74, completeness: 0.36, freshness: 0.72, conflict: 0.84, uncertainty: 0.55, lineage: 0.78, verification: 0.7, durability: 0.68, influence: 0.56, trend: "DEGRADING" },
    STALE: { sourceCategory: "TRUSTED", completenessRating: "ADEQUATE", conflictSeverity: "MINOR", durabilityRating: "LOW", sourceQuality: 0.8, completeness: 0.76, freshness: 0.28, conflict: 0.82, uncertainty: 0.52, lineage: 0.82, verification: 0.72, durability: 0.4, influence: 0.52, trend: "DEGRADING" },
    CONTRADICTORY: { sourceCategory: "EXTERNAL", completenessRating: "MOSTLY_COMPLETE", conflictSeverity: "CRITICAL", durabilityRating: "MODERATE", sourceQuality: 0.64, completeness: 0.86, freshness: 0.74, conflict: 0.12, uncertainty: 0.32, lineage: 0.7, verification: 0.58, durability: 0.62, influence: 0.72, trend: "VOLATILE" },
    UNCERTAIN: { sourceCategory: "DERIVED", completenessRating: "ADEQUATE", conflictSeverity: "MODERATE", durabilityRating: "LOW", sourceQuality: 0.6, completeness: 0.68, freshness: 0.66, conflict: 0.58, uncertainty: 0.2, lineage: 0.66, verification: 0.56, durability: 0.44, influence: 0.65, trend: "VOLATILE" },
    LOW_DURABILITY: { sourceCategory: "OPERATIONAL", completenessRating: "ADEQUATE", conflictSeverity: "MINOR", durabilityRating: "VERY_LOW", sourceQuality: 0.72, completeness: 0.7, freshness: 0.6, conflict: 0.76, uncertainty: 0.62, lineage: 0.76, verification: 0.66, durability: 0.18, influence: 0.48, trend: "DEGRADING" },
  };
  return map[scenario] ?? map.VERIFIED!;
}

function overallReliability(sample: EvidenceSample, scenario: Scenario): number {
  const base = (
    sample.sourceQuality +
    sample.completeness +
    sample.freshness +
    sample.conflict +
    sample.uncertainty +
    sample.lineage +
    sample.verification +
    sample.durability
  ) / 8;
  return scenario === "MISSING_VERIFICATION" ? clamp(base - 0.14) : clamp(base);
}

function buildRecord(sample: EvidenceSample, scenario: Scenario, driftRef: string): EvidenceReliabilityRecord {
  const replay_refs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_evidence_reliability_1", driftRef]);
  const governance_refs = scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray(["governance_ref_evidence_reliability_1"]);
  const base: Omit<EvidenceReliabilityRecord, "integrity_hash"> = {
    evidence_reliability_id: `evidence_reliability_${hash(`${scenario}:${sample.sourceCategory}`).slice(0, 16)}`,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_mission_control:foreign" : "tenant_mission_control",
    mission_scope: "mission_scope_confidence_evidence",
    evidence_id: scenario === "MISSING_EVIDENCE" ? "" : `evidence_${hash(sample).slice(0, 12)}`,
    source_category: sample.sourceCategory,
    completeness_rating: sample.completenessRating,
    conflict_severity: sample.conflictSeverity,
    durability_rating: sample.durabilityRating,
    source_quality_score: sample.sourceQuality,
    completeness_score: scenario === "MISSING_EVIDENCE" ? 0 : sample.completeness,
    freshness_score: sample.freshness,
    conflict_score: sample.conflict,
    uncertainty_score: sample.uncertainty,
    lineage_integrity_score: scenario === "BROKEN_LINEAGE" ? 0.08 : sample.lineage,
    verification_score: scenario === "MISSING_VERIFICATION" ? 0.18 : sample.verification,
    durability_score: sample.durability,
    overall_reliability_score: overallReliability(sample, scenario),
    confidence_accuracy_influence: sample.influence,
    governance_refs,
    replay_refs,
    advisory_only: true,
    mutates_evidence: false,
    updates_evidence_weights: false,
    updates_confidence_model: false,
    changes_historical_decisions: false,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.evidence_reliability_id }) });
  if (scenario === "EVIDENCE_MUTATION") return Object.freeze({ ...record, mutates_evidence: true as false });
  if (scenario === "WEIGHT_UPDATE") return Object.freeze({ ...record, updates_evidence_weights: true as false });
  if (scenario === "CONFIDENCE_MODEL_UPDATE") return Object.freeze({ ...record, updates_confidence_model: true as false });
  if (scenario === "HISTORICAL_DECISION_CHANGE") return Object.freeze({ ...record, changes_historical_decisions: true as false });
  return record;
}

function buildSourceProfile(sample: EvidenceSample, scenario: Scenario): SourceReliabilityProfile {
  const replay_refs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_source_reliability_1"]);
  const base: Omit<SourceReliabilityProfile, "integrity_hash"> = {
    profile_id: `source_reliability_${hash(`${scenario}:${sample.sourceQuality}:${sample.trend}`).slice(0, 14)}`,
    source_id: `source_${sample.sourceCategory.toLowerCase()}`,
    tenant_id: "tenant_mission_control",
    source_category: sample.sourceCategory,
    historical_accuracy: sample.sourceQuality,
    verification_success_rate: scenario === "MISSING_VERIFICATION" ? 0.18 : sample.verification,
    consistency_score: sample.conflict,
    trust_score: clamp((sample.sourceQuality + sample.verification + sample.lineage) / 3),
    durability_score: sample.durability,
    reliability_trend: sample.trend,
    replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReport(record: EvidenceReliabilityRecord, profile: SourceReliabilityProfile, scenario: Scenario): EvidenceReliabilityReport {
  const replay_refs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_evidence_reliability_report_1"]);
  const governance_findings = scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray([
    `Evidence reliability influence on confidence accuracy is ${record.confidence_accuracy_influence}.`,
    "Reliability assessment is advisory and requires governance before weighting or confidence adaptation proposals.",
  ]);
  const verificationFinding = scenario === "MISSING_VERIFICATION"
    ? freezeArray(["Verification history missing; reliability is reduced and governance review is required."])
    : freezeArray([]);
  const base: Omit<EvidenceReliabilityReport, "integrity_hash"> = {
    report_id: `evidence_reliability_report_${hash(record.evidence_reliability_id).slice(0, 14)}`,
    reporting_period: "2026-Q3",
    reliability_summary: `${record.source_category} evidence scored ${record.overall_reliability_score} overall reliability.`,
    source_analysis: `Source trust score ${profile.trust_score} with ${profile.reliability_trend} trend.`,
    completeness_analysis: `${record.completeness_rating} evidence completeness scored ${record.completeness_score}.`,
    freshness_analysis: `Evidence freshness scored ${record.freshness_score}.`,
    conflict_analysis: `${record.conflict_severity} conflict severity scored ${record.conflict_score}.`,
    uncertainty_analysis: `Evidence uncertainty score ${record.uncertainty_score}.`,
    trust_assessment: `Historical trust score ${profile.trust_score}; durability ${record.durability_rating}.`,
    governance_findings: freezeArray([...governance_findings, ...verificationFinding]),
    recommended_actions: freezeArray([
      "Preserve evidence reliability assessment in the confidence adaptation ledger.",
      "Route weak reliability dimensions to governed confidence adaptation planning.",
    ]),
    replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRegistry(records: readonly EvidenceReliabilityRecord[], profiles: readonly SourceReliabilityProfile[], report: EvidenceReliabilityReport, scenario: Scenario): EvidenceReliabilityRegistry {
  const sourceCategories: EvidenceSourceCategory[] = ["AUTHORITATIVE", "VERIFIED", "TRUSTED", "OPERATIONAL", "EXTERNAL", "DERIVED", "UNVERIFIED", "UNKNOWN"];
  const completenessRatings: EvidenceCompletenessRating[] = ["COMPLETE", "MOSTLY_COMPLETE", "ADEQUATE", "INCOMPLETE", "INSUFFICIENT", "CRITICAL_DEFICIENCY"];
  const conflictSeverities: EvidenceConflictSeverity[] = ["NONE", "MINOR", "MODERATE", "MAJOR", "CRITICAL"];
  const durabilityRatings: EvidenceDurabilityRating[] = ["VERY_HIGH", "HIGH", "MODERATE", "LOW", "VERY_LOW"];
  const source_quality_history = sourceCategories.reduce((index, category) => ({ ...index, [category]: freezeArray(records.filter((record) => record.source_category === category).map((record) => record.evidence_reliability_id)) }), {} as Record<EvidenceSourceCategory, readonly string[]>);
  const completeness_history = completenessRatings.reduce((index, rating) => ({ ...index, [rating]: freezeArray(records.filter((record) => record.completeness_rating === rating).map((record) => record.evidence_reliability_id)) }), {} as Record<EvidenceCompletenessRating, readonly string[]>);
  const conflict_history = conflictSeverities.reduce((index, severity) => ({ ...index, [severity]: freezeArray(records.filter((record) => record.conflict_severity === severity).map((record) => record.evidence_reliability_id)) }), {} as Record<EvidenceConflictSeverity, readonly string[]>);
  const durability_history = durabilityRatings.reduce((index, rating) => ({ ...index, [rating]: freezeArray(records.filter((record) => record.durability_rating === rating).map((record) => record.evidence_reliability_id)) }), {} as Record<EvidenceDurabilityRating, readonly string[]>);
  const base: Omit<EvidenceReliabilityRegistry, "integrity_hash"> = {
    registry_id: `evidence_reliability_registry_${hash(records.map((record) => record.integrity_hash)).slice(0, 14)}`,
    tenant_id: "tenant_mission_control",
    reliability_record_refs: records.map((record) => record.evidence_reliability_id),
    source_profile_refs: profiles.map((profile) => profile.profile_id),
    report_refs: freezeArray([report.report_id]),
    source_quality_history: Object.freeze(source_quality_history),
    completeness_history: Object.freeze(completeness_history),
    conflict_history: Object.freeze(conflict_history),
    durability_history: Object.freeze(durability_history),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(records: readonly EvidenceReliabilityRecord[], profiles: readonly SourceReliabilityProfile[], report: EvidenceReliabilityReport, registry: EvidenceReliabilityRegistry, scenario: Scenario): readonly EvidenceReliabilityFailure[] {
  const failures: EvidenceReliabilityFailure[] = [];
  if (scenario === "MISSING_EVIDENCE" || records.some((record) => !record.evidence_id || record.completeness_score === 0)) failures.push("EVIDENCE_MISSING");
  if (scenario === "BROKEN_LINEAGE" || records.some((record) => record.lineage_integrity_score < 0.2)) failures.push("EVIDENCE_LINEAGE_BROKEN");
  if (scenario === "MISSING_VERIFICATION" || records.some((record) => record.verification_score < 0.25)) failures.push("VERIFICATION_HISTORY_MISSING");
  if (scenario === "MISSING_REPLAY" || records.some((record) => record.replay_refs.length === 0) || profiles.some((profile) => profile.replay_refs.length === 0) || report.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "MISSING_GOVERNANCE" || records.some((record) => record.governance_refs.length === 0) || report.governance_findings.length === 0) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (scenario === "CROSS_TENANT" || records.some((record) => record.tenant_id !== registry.tenant_id)) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "HASH_MISMATCH" || records.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash) || profiles.some((profile) => hashWithoutIntegrity(profile) !== profile.integrity_hash) || hashWithoutIntegrity(report) !== report.integrity_hash || hashWithoutIntegrity(registry) !== registry.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "EVIDENCE_MUTATION" || records.some((record) => record.mutates_evidence)) failures.push("EVIDENCE_MUTATION_DETECTED");
  if (scenario === "WEIGHT_UPDATE" || records.some((record) => record.updates_evidence_weights)) failures.push("EVIDENCE_WEIGHT_UPDATE_DETECTED");
  if (scenario === "CONFIDENCE_MODEL_UPDATE" || records.some((record) => record.updates_confidence_model)) failures.push("CONFIDENCE_MODEL_UPDATE_DETECTED");
  if (scenario === "HISTORICAL_DECISION_CHANGE" || records.some((record) => record.changes_historical_decisions)) failures.push("HISTORICAL_DECISION_CHANGE_DETECTED");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) failures.push("REGISTRY_MUTATION_DETECTED");
  if (scenario === "NONDETERMINISTIC") failures.push("NONDETERMINISTIC_ANALYSIS");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly EvidenceReliabilityFailure[]): EvidenceReliabilityValidation["state"] {
  if (failures.includes("VERIFICATION_HISTORY_MISSING")) return "PENDING_VERIFICATION";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(records: readonly EvidenceReliabilityRecord[], profiles: readonly SourceReliabilityProfile[], report: EvidenceReliabilityReport, registry: EvidenceReliabilityRegistry, failures: readonly EvidenceReliabilityFailure[]): EvidenceReliabilityValidation {
  const recordsVerified = records.every((record) => hashWithoutIntegrity(record) === record.integrity_hash);
  const profilesVerified = profiles.every((profile) => hashWithoutIntegrity(profile) === profile.integrity_hash);
  const reportVerified = hashWithoutIntegrity(report) === report.integrity_hash;
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<EvidenceReliabilityValidation, "integrity_hash"> = {
    validation_id: "evidence_reliability_recalibrator_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && recordsVerified && profilesVerified && reportVerified && registryVerified,
    failures,
    evidence_complete: !failures.includes("EVIDENCE_MISSING"),
    lineage_intact: !failures.includes("EVIDENCE_LINEAGE_BROKEN"),
    verification_history_complete: !failures.includes("VERIFICATION_HISTORY_MISSING"),
    replay_complete: !failures.includes("REPLAY_REFERENCES_MISSING"),
    governance_complete: !failures.includes("GOVERNANCE_REFERENCES_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    deterministic: !failures.includes("NONDETERMINISTIC_ANALYSIS"),
    registry_immutable: registry.append_only && registry.immutable && !registry.deleted,
    advisory_only: records.every((record) => record.advisory_only),
    no_evidence_mutation: records.every((record) => !record.mutates_evidence),
    no_weight_update: records.every((record) => !record.updates_evidence_weights),
    no_confidence_model_update: records.every((record) => !record.updates_confidence_model),
    no_historical_decision_change: records.every((record) => !record.changes_historical_decisions),
    integrity_verified: recordsVerified && profilesVerified && reportVerified && registryVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<EvidenceReliabilityResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    reliability_records: result.reliability_records,
    source_profiles: result.source_profiles,
    report: result.report,
    registry: result.registry,
    validation: result.validation,
  });
}

function resultIntegrityHash(result: Omit<EvidenceReliabilityResult, "integrity_hash">): string {
  return hash({
    evidence_reliability_recalibrator_version: result.evidence_reliability_recalibrator_version,
    api_surface_hash: result.api_surface.integrity_hash,
    reliability_record_hashes: result.reliability_records.map((record) => record.integrity_hash),
    source_profile_hashes: result.source_profiles.map((profile) => profile.integrity_hash),
    report_hash: result.report.integrity_hash,
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function analyzeEvidenceReliability(input: EvidenceReliabilityInput = {}): EvidenceReliabilityResult {
  const scenario = input.scenario ?? "BASELINE";
  const drift = input.drift_result ?? analyzeConfidenceDrift();
  const driftRef = drift.drift_records[0]?.confidence_drift_id ?? "drift_ref_missing";
  const api_surface = buildApiSurface();
  const sample = sampleForScenario(scenario);
  const record = buildRecord(sample, scenario, driftRef);
  const profile = buildSourceProfile(sample, scenario);
  const report = buildReport(record, profile, scenario);
  const reliability_records = freezeArray([record]);
  const source_profiles = freezeArray([profile]);
  const registry = buildRegistry(reliability_records, source_profiles, report, scenario);
  const failures = collectFailures(reliability_records, source_profiles, report, registry, scenario);
  const validation = buildValidation(reliability_records, source_profiles, report, registry, failures);
  const base: Omit<EvidenceReliabilityResult, "integrity_hash" | "replay_hash"> = {
    evidence_reliability_recalibrator_version: EVIDENCE_RELIABILITY_VERSION,
    api_surface,
    reliability_records,
    source_profiles,
    report,
    registry,
    validation,
    deterministic: true,
    replayable: true,
    explainable: validation.certified,
    evidence_backed: validation.evidence_complete,
    governance_visible: validation.governance_complete,
    tenant_isolated: validation.tenant_isolated,
    advisory_only: true,
    mutates_evidence: false,
    updates_evidence_weights: false,
    updates_confidence_model: false,
    changes_historical_decisions: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayEvidenceReliability(result: EvidenceReliabilityResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getEvidenceReliabilityFoundation(): EvidenceReliabilityFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    evidence_reliability_recalibrator_version: EVIDENCE_RELIABILITY_VERSION,
    api_surface,
    result: analyzeEvidenceReliability(),
  });
}

export const EvidenceReliabilityRecalibrator = Object.freeze({
  analyze: analyzeEvidenceReliability,
  replay: replayEvidenceReliability,
});
