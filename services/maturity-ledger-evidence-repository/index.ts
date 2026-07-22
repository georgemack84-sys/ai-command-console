import { generateImprovementRecommendations } from "@/services/improvement-recommendation-engine";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { AutonomyMaturityDomain } from "@/types/autonomy-maturity-assessment-contract";
import type { ImprovementRecommendationRepository } from "@/types/improvement-recommendation-engine";
import type {
  DomainScoreRecord,
  EvidenceArtifact,
  EvidenceArtifactType,
  IntegrityRecord,
  LineageRecord,
  MaturityAssessmentLedgerRecord,
  MaturityLedgerBundle,
  MaturityLedgerEvidenceRepository,
  MaturityLedgerFailure,
  MaturityLedgerInput,
  MaturityLedgerObservabilitySurface,
  MaturityLedgerScenario,
  MaturityLedgerValidationResult,
  ReplayRecord,
  RepositoryIndexes,
} from "@/types/maturity-ledger-evidence-repository";

const VERSION = "maturity-ledger-evidence-repository/v8ALT.11.8" as const;
const canonicalDomains = ["CONSTITUTIONAL_COMPLIANCE", "GOVERNANCE_COMPLIANCE", "AUTHORITY_ENFORCEMENT", "PLANNING_INTELLIGENCE", "EXECUTION_INTELLIGENCE", "REPLAY_INTEGRITY", "EXPLAINABILITY", "RESILIENCE", "VISIBILITY", "CERTIFICATION_READINESS"] as const;

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: MaturityLedgerScenario): MaturityLedgerFailure | null {
  const map: Partial<Record<MaturityLedgerScenario, MaturityLedgerFailure>> = {
    LEDGER_ENTRY_MODIFICATION: "LEDGER_ENTRY_MODIFIED",
    MISSING_EVIDENCE: "EVIDENCE_MISSING",
    INCOMPLETE_REPLAY_REFERENCES: "REPLAY_REFERENCES_INCOMPLETE",
    BROKEN_LINEAGE: "LINEAGE_RELATIONSHIPS_BROKEN",
    INTEGRITY_VERIFICATION_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    DUPLICATE_ASSESSMENT_IDENTIFIERS: "DUPLICATE_ASSESSMENT_IDENTIFIERS_EXIST",
    REPLAY_RECONSTRUCTION_MISMATCH: "REPLAY_RECONSTRUCTION_MISMATCHED",
    MISSING_GOVERNANCE_EVIDENCE: "GOVERNANCE_EVIDENCE_MISSING",
    MISSING_CONSTITUTIONAL_EVIDENCE: "CONSTITUTIONAL_EVIDENCE_MISSING",
    HIDDEN_LEDGER_ENTRIES: "HIDDEN_LEDGER_ENTRIES_DETECTED",
    TENANT_ISOLATION_VIOLATION: "TENANT_ISOLATION_VIOLATED",
    APPEND_ONLY_COMPROMISE: "APPEND_ONLY_BEHAVIOR_COMPROMISED",
  };
  return map[scenario] ?? null;
}

function assessmentLedger(source: ImprovementRecommendationRepository, scenario: MaturityLedgerScenario): readonly MaturityAssessmentLedgerRecord[] {
  const scoring = source.readiness.history.classification.scoring.result;
  const classification = source.readiness.history.classification.record;
  const base = {
    assessment_id: scenario === "DUPLICATE_ASSESSMENT_IDENTIFIERS" ? "assessment:duplicate" : classification.assessment_id,
    assessment_version: "autonomy-maturity-assessment-contract/v8ALT.11.1" as const,
    tenant_id: scenario === "TENANT_ISOLATION_VIOLATION" ? "tenant:foreign" : "tenant:alpha",
    mission_id: "mission:maturity-ledger-evidence-repository",
    evaluation_scope: "PLATFORM" as const,
    assessment_type: "CONTINUOUS" as const,
    maturity_level: classification.maturity_level,
    overall_score: scoring.overall_maturity_score,
    readiness_score: scoring.readiness_score,
    confidence_score: scoring.confidence_score,
    assessment_state: "VERIFIED" as const,
    evaluator_version: VERSION,
    immutable: scenario !== "LEDGER_ENTRY_MODIFICATION",
    append_only: scenario !== "APPEND_ONLY_COMPROMISE",
    replay_reference: scenario === "INCOMPLETE_REPLAY_REFERENCES" ? "" : classification.replay_reference,
    lineage_reference: scenario === "BROKEN_LINEAGE" ? "" : classification.lineage_reference,
    timestamp: "1970-01-01T00:00:00.000Z" as const,
  };
  const record = Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("maturity-assessment-ledger-record", base) });
  if (scenario === "DUPLICATE_ASSESSMENT_IDENTIFIERS") return freezeArray([record, Object.freeze({ ...record })]);
  return freezeArray([record]);
}

function domainScores(source: ImprovementRecommendationRepository, scenario: MaturityLedgerScenario): readonly DomainScoreRecord[] {
  return freezeArray(source.readiness.history.classification.scoring.normalized_scores.map((score) => {
    const contribution = source.readiness.history.classification.scoring.contributions.find((entry) => entry.domain === score.domain);
    const base = { domain: score.domain, score: score.normalized_score, confidence: source.readiness.history.classification.scoring.result.confidence_score, readiness_contribution: source.readiness.history.classification.scoring.result.readiness_score, weighting: contribution?.weight ?? 0, evaluation_version: "maturity-domain-evaluation-engine/v8ALT.11.2" as const, supporting_evidence: freezeArray([score.evidence_reference]) };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && score.domain === "REPLAY_INTEGRITY" ? "" : hashValue("maturity-domain-score-record", base) });
  }));
}

function evidence(source: ImprovementRecommendationRepository, ledger: readonly MaturityAssessmentLedgerRecord[], scenario: MaturityLedgerScenario): readonly EvidenceArtifact[] {
  if (scenario === "MISSING_EVIDENCE") return freezeArray([]);
  const assessment = ledger[0]!;
  const evidenceTypes: readonly EvidenceArtifactType[] = ["RUNTIME", "GOVERNANCE", "CONSTITUTIONAL", "REPLAY", "CERTIFICATION", "EXPLAINABILITY"];
  return freezeArray(evidenceTypes.map((evidence_type, index) => {
    const domain = evidence_type === "GOVERNANCE" ? "GOVERNANCE_COMPLIANCE" : evidence_type === "CONSTITUTIONAL" ? "CONSTITUTIONAL_COMPLIANCE" : evidence_type === "REPLAY" ? "REPLAY_INTEGRITY" : evidence_type === "CERTIFICATION" ? "CERTIFICATION_READINESS" : evidence_type === "EXPLAINABILITY" ? "EXPLAINABILITY" : "RESILIENCE";
    const base = { evidence_id: id("MLR-E", "maturity-evidence", evidence_type), evidence_type, originating_assessment: assessment.assessment_id, originating_domain: domain as AutonomyMaturityDomain, replay_reference: scenario === "INCOMPLETE_REPLAY_REFERENCES" && evidence_type === "REPLAY" ? "" : `replay:evidence:${evidence_type.toLowerCase()}`, lineage_reference: scenario === "BROKEN_LINEAGE" ? "" : `lineage:evidence:${evidence_type.toLowerCase()}`, governance_reference: scenario === "MISSING_GOVERNANCE_EVIDENCE" ? "" : source.readiness.record.governance_reference, constitutional_reference: scenario === "MISSING_CONSTITUTIONAL_EVIDENCE" ? "" : source.readiness.record.constitutional_reference, timestamp: "1970-01-01T00:00:00.000Z" as const };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && index === 0 ? "" : hashValue("maturity-evidence-artifact", base) });
  }));
}

function lineage(ledger: readonly MaturityAssessmentLedgerRecord[], scenario: MaturityLedgerScenario): readonly LineageRecord[] {
  const assessment = ledger[0]!;
  const rows = ["ASSESSMENT_EVOLUTION", "CERTIFICATION_LINEAGE", "RECOMMENDATION_LINEAGE", "REPLAY_LINEAGE", "EVIDENCE_LINEAGE"] as const;
  return freezeArray(rows.map((relationship) => {
    const base = { lineage_id: id("MLR-L", "maturity-lineage", relationship), assessment_id: assessment.assessment_id, parent_assessment_id: scenario === "BROKEN_LINEAGE" ? "" : "assessment:previous", child_assessment_id: assessment.assessment_id, relationship, replay_reference: assessment.replay_reference };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && relationship === "REPLAY_LINEAGE" ? "" : hashValue("maturity-lineage-record", base) });
  }));
}

function replay(ledger: readonly MaturityAssessmentLedgerRecord[], scenario: MaturityLedgerScenario): readonly ReplayRecord[] {
  const assessment = ledger[0]!;
  const base = { replay_id: id("MLR-R", "maturity-replay", assessment.assessment_id), assessment_id: assessment.assessment_id, replay_version: "maturity-replay/v1" as const, reconstruction_metadata: "reconstructs maturity assessment from ledger, evidence, lineage, scoring, classification, readiness, and recommendations", replay_validated: scenario !== "REPLAY_RECONSTRUCTION_MISMATCH", replay_reference: scenario === "INCOMPLETE_REPLAY_REFERENCES" ? "" : assessment.replay_reference, lineage_reference: assessment.lineage_reference, timestamp: "1970-01-01T00:00:00.000Z" as const };
  return freezeArray([Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("maturity-replay-record", base) })]);
}

function integrity(ledger: readonly MaturityAssessmentLedgerRecord[], scenario: MaturityLedgerScenario): readonly IntegrityRecord[] {
  return freezeArray(ledger.map((record) => {
    const base = { integrity_id: id("MLR-I", "maturity-integrity", record.assessment_id), assessment_id: record.assessment_id, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : record.integrity_hash, previous_hash: "GENESIS", verification_status: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "FAIL" as const : "PASS" as const, verification_timestamp: "1970-01-01T00:00:00.000Z" as const, verifier_version: "integrity-verifier/v1" as const };
    return Object.freeze(base);
  }));
}

function indexes(ledger: readonly MaturityAssessmentLedgerRecord[], scores: readonly DomainScoreRecord[], evidenceStore: readonly EvidenceArtifact[], lineageStore: readonly LineageRecord[], replayStore: readonly ReplayRecord[], scenario: MaturityLedgerScenario): RepositoryIndexes {
  const base = { assessment_index: freezeArray(ledger.map((record) => record.assessment_id).sort()), maturity_level_index: freezeArray(ledger.map((record) => record.maturity_level).sort()), domain_index: freezeArray(scores.map((score) => score.domain).sort()), tenant_index: freezeArray(ledger.map((record) => record.tenant_id).sort()), mission_index: freezeArray(ledger.map((record) => record.mission_id).sort()), certification_index: freezeArray(evidenceStore.filter((entry) => entry.evidence_type === "CERTIFICATION").map((entry) => entry.evidence_id).sort()), governance_index: freezeArray(evidenceStore.map((entry) => entry.governance_reference).filter(Boolean).sort()), constitutional_index: freezeArray(evidenceStore.map((entry) => entry.constitutional_reference).filter(Boolean).sort()), replay_index: freezeArray(replayStore.map((entry) => entry.replay_reference).filter(Boolean).sort()), lineage_index: freezeArray(lineageStore.map((entry) => entry.lineage_id).sort()), timestamp_index: freezeArray(ledger.map((record) => record.timestamp).sort()) };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("maturity-repository-indexes", base) });
}

function collectFailures(repository: Omit<MaturityLedgerEvidenceRepository, "integrity_hash"> | MaturityLedgerEvidenceRepository): readonly MaturityLedgerFailure[] {
  const ids = repository.assessment_ledger.map((record) => record.assessment_id);
  return unique([
    ...repository.failures,
    ...(repository.assessment_ledger.some((record) => !record.immutable) ? ["LEDGER_ENTRY_MODIFIED" as const] : []),
    ...(repository.evidence_repository.length === 0 ? ["EVIDENCE_MISSING" as const] : []),
    ...(repository.assessment_ledger.some((record) => !record.replay_reference) || repository.evidence_repository.some((entry) => !entry.replay_reference) || repository.replay_repository.some((entry) => !entry.replay_reference) ? ["REPLAY_REFERENCES_INCOMPLETE" as const] : []),
    ...(repository.assessment_ledger.some((record) => !record.lineage_reference) || repository.lineage_store.some((entry) => !entry.parent_assessment_id || !entry.child_assessment_id) ? ["LINEAGE_RELATIONSHIPS_BROKEN" as const] : []),
    ...(repository.assessment_ledger.some((record) => !record.integrity_hash) || repository.domain_scores.some((record) => !record.integrity_hash) || repository.evidence_repository.some((entry) => !entry.integrity_hash) || repository.lineage_store.some((entry) => !entry.integrity_hash) || repository.replay_repository.some((entry) => !entry.integrity_hash) || repository.integrity_records.some((entry) => entry.verification_status === "FAIL" || !entry.integrity_hash) || !repository.indexes.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(new Set(ids).size !== ids.length ? ["DUPLICATE_ASSESSMENT_IDENTIFIERS_EXIST" as const] : []),
    ...(repository.replay_repository.some((entry) => !entry.replay_validated) ? ["REPLAY_RECONSTRUCTION_MISMATCHED" as const] : []),
    ...(repository.evidence_repository.some((entry) => !entry.governance_reference) || repository.indexes.governance_index.length === 0 ? ["GOVERNANCE_EVIDENCE_MISSING" as const] : []),
    ...(repository.evidence_repository.some((entry) => !entry.constitutional_reference) || repository.indexes.constitutional_index.length === 0 ? ["CONSTITUTIONAL_EVIDENCE_MISSING" as const] : []),
    ...(repository.assessment_ledger.some((record) => record.assessment_id.includes("hidden")) ? ["HIDDEN_LEDGER_ENTRIES_DETECTED" as const] : []),
    ...(!repository.tenant_isolated || repository.assessment_ledger.some((record) => record.tenant_id !== "tenant:alpha") ? ["TENANT_ISOLATION_VIOLATED" as const] : []),
    ...(!repository.append_only || repository.assessment_ledger.some((record) => !record.append_only) ? ["APPEND_ONLY_BEHAVIOR_COMPROMISED" as const] : []),
  ]);
}

export function buildMaturityLedgerEvidenceRepository(input: MaturityLedgerInput = {}): MaturityLedgerEvidenceRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const recommendation_repository = input.recommendation_repository ?? generateImprovementRecommendations();
  const rawLedger = assessmentLedger(recommendation_repository, scenario);
  const assessment_ledger = scenario === "HIDDEN_LEDGER_ENTRIES" ? freezeArray([Object.freeze({ ...rawLedger[0]!, assessment_id: "hidden:assessment" })]) : rawLedger;
  const domain_scores = domainScores(recommendation_repository, scenario);
  const evidence_repository = evidence(recommendation_repository, assessment_ledger, scenario);
  const lineage_store = lineage(assessment_ledger, scenario);
  const replay_repository = replay(assessment_ledger, scenario);
  const integrity_records = integrity(assessment_ledger, scenario);
  const repositoryIndexes = indexes(assessment_ledger, domain_scores, evidence_repository, lineage_store, replay_repository, scenario);
  const directFailure = scenarioFailure(scenario);
  const source = { repository_id: id("MLR", "maturity-ledger-repository", scenario), final_state: "MATURITY_LEDGER_REPOSITORY_COMPLETE" as const, recommendation_repository, assessment_ledger, domain_scores, evidence_repository, lineage_store, replay_repository, integrity_records, indexes: repositoryIndexes, failures: freezeArray(directFailure ? [directFailure] : []), append_only: scenario !== "APPEND_ONLY_COMPROMISE", immutable: scenario !== "LEDGER_ENTRY_MODIFICATION", tenant_isolated: scenario !== "TENANT_ISOLATION_VIOLATION", mutation_authorized: false as const, repository_administration_mutation_authorized: false as const };
  const failures = collectFailures(source);
  const repository = { ...source, failures, final_state: failures.length ? "MATURITY_LEDGER_REPOSITORY_FAILED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("maturity-ledger-evidence-repository", repository) });
}

export function listMaturityLedgerEvidence(input: MaturityLedgerInput = {}) { return buildMaturityLedgerEvidenceRepository(input).evidence_repository; }
export function listMaturityLedgerLineage(input: MaturityLedgerInput = {}) { return buildMaturityLedgerEvidenceRepository(input).lineage_store; }
export function listMaturityLedgerReplay(input: MaturityLedgerInput = {}) { return buildMaturityLedgerEvidenceRepository(input).replay_repository; }
export function getMaturityLedgerIndexes(input: MaturityLedgerInput = {}) { return buildMaturityLedgerEvidenceRepository(input).indexes; }

export function validateMaturityLedgerEvidenceRepository(repository = buildMaturityLedgerEvidenceRepository()): MaturityLedgerValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : [])]);
  const has = (failure: MaturityLedgerFailure) => failures.includes(failure);
  const result = { repository_id: repository.repository_id, valid: failures.length === 0 && repository.final_state === "MATURITY_LEDGER_REPOSITORY_COMPLETE", ledger_immutable: !has("LEDGER_ENTRY_MODIFIED"), evidence_complete: !has("EVIDENCE_MISSING"), replay_references_complete: !has("REPLAY_REFERENCES_INCOMPLETE"), lineage_intact: !has("LINEAGE_RELATIONSHIPS_BROKEN"), integrity_verified: !has("INTEGRITY_VERIFICATION_FAILED"), identifiers_unique: !has("DUPLICATE_ASSESSMENT_IDENTIFIERS_EXIST"), replay_reconstruction_verified: !has("REPLAY_RECONSTRUCTION_MISMATCHED"), governance_evidence_present: !has("GOVERNANCE_EVIDENCE_MISSING"), constitutional_evidence_present: !has("CONSTITUTIONAL_EVIDENCE_MISSING"), no_hidden_entries: !has("HIDDEN_LEDGER_ENTRIES_DETECTED"), tenant_isolated: !has("TENANT_ISOLATION_VIOLATED"), append_only: !has("APPEND_ONLY_BEHAVIOR_COMPROMISED"), failures };
  return Object.freeze({ ...result, validation_hash: hashValue("maturity-ledger-validation", result) });
}

export function buildMaturityLedgerObservabilitySurface(repository = buildMaturityLedgerEvidenceRepository()): MaturityLedgerObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, assessment_count: repository.assessment_ledger.length, domain_score_count: repository.domain_scores.length, evidence_count: repository.evidence_repository.length, lineage_count: repository.lineage_store.length, replay_count: repository.replay_repository.length, integrity_record_count: repository.integrity_records.length, failure_count: repository.failures.length, append_only: repository.append_only, immutable: repository.immutable, integrity_hash: repository.integrity_hash });
}

export function getMaturityLedgerEvidenceRepositoryBundle(): MaturityLedgerBundle {
  const repository = buildMaturityLedgerEvidenceRepository();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "MATURITY_LEDGER_REPOSITORY_READY", principles: freezeArray(["recommendation-chain-derived", "append-only", "immutable-records", "complete-evidence", "lineage-preserved", "replay-preserved", "tenant-isolated", "no-mutation-authority"]) }), repository, validation: validateMaturityLedgerEvidenceRepository(repository), observability: buildMaturityLedgerObservabilitySurface(repository) });
}
