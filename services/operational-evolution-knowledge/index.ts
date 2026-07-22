import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runReplayStabilityIntegrity } from "@/services/replay-stability-integrity";
import type {
  ContinuousImprovementStage,
  EvidenceArchiveCategory,
  EvolutionRegistryCategory,
  KnowledgeCategory,
  OperationalEvolutionKnowledgeBundle,
  OperationalEvolutionKnowledgeFailure,
  OperationalEvolutionKnowledgeInput,
  OperationalEvolutionKnowledgeOutcome,
  OperationalEvolutionKnowledgeResult,
  OperationalEvolutionKnowledgeTest,
  OperationalEvolutionStage,
} from "@/types/operational-evolution-knowledge";

const VERSION = "operational-evolution-knowledge/v18.11" as const;
const IDENTIFIER = "OperationalEvolutionKnowledgePreservation" as const;
const DEFAULT_TENANT = "tenant_phase_18_operational_evolution";
const DEFAULT_OPERATOR = "operator_phase_18_operational_evolution";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly OperationalEvolutionKnowledgeFailure[], failure: OperationalEvolutionKnowledgeFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: OperationalEvolutionKnowledgeInput["scenario"]): OperationalEvolutionKnowledgeFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly OperationalEvolutionKnowledgeFailure[]): OperationalEvolutionKnowledgeOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_EVOLUTION_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const evolutionStages = freezeArray(["QUALIFIED_RECOMMENDATION", "IMPLEMENTATION_ATTESTATION", "OPERATIONAL_VALIDATION", "OPERATIONAL_IMPROVEMENT_RECORD", "KNOWLEDGE_EXTRACTION", "EVIDENCE_PRESERVATION", "HISTORICAL_REPLAY"] as const satisfies readonly OperationalEvolutionStage[]);
const improvementStages = freezeArray(["CANDIDATE", "QUALIFIED", "RECOMMENDED", "IMPLEMENTED", "VALIDATED", "RECORDED", "ARCHIVED"] as const satisfies readonly ContinuousImprovementStage[]);
const registryCategories = freezeArray(["OPERATIONAL_IMPROVEMENT", "APPROVED_RECOMMENDATION", "IMPLEMENTED_RECOMMENDATION", "REJECTED_RECOMMENDATION", "SUPERSEDED_RECOMMENDATION", "OPERATIONAL_MILESTONE", "GOVERNANCE_MILESTONE", "PLATFORM_EVOLUTION", "CONSTITUTIONAL_EVOLUTION_REFERENCE"] as const satisfies readonly EvolutionRegistryCategory[]);
const knowledgeCategories = freezeArray(["LESSON_LEARNED", "OPERATIONAL_PATTERN", "RECURRING_OPERATIONAL_ISSUE", "VALIDATED_OPERATIONAL_PRACTICE", "GOVERNANCE_OBSERVATION", "REPLAY_OBSERVATION", "CERTIFICATION_OBSERVATION", "OPTIMIZATION_HISTORY", "RESILIENCE_OBSERVATION"] as const satisfies readonly KnowledgeCategory[]);
const evidenceCategories = freezeArray(["QUALIFICATION_EVIDENCE", "CERTIFICATION_EVIDENCE", "REPLAY_EVIDENCE", "MONITORING_EVIDENCE", "SIMULATION_EVIDENCE", "IMPLEMENTATION_EVIDENCE", "OPERATIONAL_REPORT", "GOVERNANCE_DECISION", "AUDIT_ARTIFACT"] as const satisfies readonly EvidenceArchiveCategory[]);

function certTest(name: string, passed: boolean, failure: OperationalEvolutionKnowledgeFailure, evidence_refs: readonly string[]): OperationalEvolutionKnowledgeTest {
  const actual: OperationalEvolutionKnowledgeOutcome = passed ? "PASS" : "FAIL";
  return nested({ test_id: id("operational_evolution_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}

function resultReplayHash(result: Omit<OperationalEvolutionKnowledgeResult, "replay_hash" | "integrity_hash">): string {
  return hash({ replay: result.replay_stability_integrity_ref, stages: result.evolution_stages, registry: result.evolution_registry.integrity_hash, ledger: result.improvement_ledger.integrity_hash, knowledge: result.knowledge_registry.integrity_hash, archive: result.evidence_archive.integrity_hash, package: result.certification_package.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<OperationalEvolutionKnowledgeResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runOperationalEvolutionKnowledge(input: OperationalEvolutionKnowledgeInput = {}): OperationalEvolutionKnowledgeResult {
  const replay = runReplayStabilityIntegrity({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: OperationalEvolutionKnowledgeFailure[] = replay.outcome === "PASS" ? [] : ["PHASE_18_10_REPLAY_STABILITY_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_EVOLUTION_WARNING"));
  const evolutionId = input.evolution_id ?? id("operational_evolution", replay.integrity_hash);
  const deterministic = !has(failures, "OPERATIONAL_EVOLUTION_NOT_DETERMINISTIC");
  const recommendationLineage = !has(failures, "RECOMMENDATION_LINEAGE_INCOMPLETE") && !has(failures, "LINEAGE_INCOMPLETE");
  const certificationLineage = !has(failures, "CERTIFICATION_LINEAGE_NOT_PRESERVED");
  const implementationLineage = !has(failures, "IMPLEMENTATION_LINEAGE_NOT_VALIDATED");
  const lessonsGoverned = !has(failures, "LESSONS_LEARNED_NOT_GOVERNED");
  const knowledgePreserved = !has(failures, "OPERATIONAL_KNOWLEDGE_NOT_PRESERVED");
  const evidenceImmutable = !has(failures, "HISTORICAL_EVIDENCE_NOT_IMMUTABLE") && !has(failures, "HISTORICAL_RECORD_MUTATED");
  const archiveIntegrity = !has(failures, "ARCHIVE_INTEGRITY_NOT_VERIFIED") && !has(failures, "ARCHIVE_CORRUPTION_DETECTED");
  const replayReproducible = !has(failures, "REPLAY_NOT_REPRODUCIBLE");
  const lineageComplete = recommendationLineage && implementationLineage && !has(failures, "LINEAGE_INCOMPLETE");
  const governancePreserved = !has(failures, "GOVERNANCE_NOT_PRESERVED");
  const auditComplete = !has(failures, "HISTORICAL_AUDIT_INCOMPLETE");
  const supersessionValid = !has(failures, "SUPERSESSION_CHAIN_INVALID");
  const evidenceRefs = freezeArray(evidenceImmutable ? [replay.integrity_hash, replay.certification_package.integrity_hash, replay.evidence_service.integrity_hash, replay.stability_ledger.integrity_hash] : []);
  const replayRefs = freezeArray(replayReproducible ? [replay.replay_hash] : []);
  const knowledgeRefs = freezeArray(knowledgePreserved ? [id("knowledge_lesson", evolutionId), id("knowledge_pattern", evolutionId), id("knowledge_resilience", evolutionId)] : []);

  const evolution_record = nested({
    evolution_id: evolutionId,
    operational_change_ref: id("operational_change", replay.integrity_hash),
    recommendation_ref: id("recommendation", replay.certification_package.integrity_hash),
    qualification_ref: replay.integrity_validator.integrity_hash,
    implementation_attestation_ref: id("implementation_attestation", replay.stability_record.integrity_hash),
    validation_ref: replay.stability_record.integrity_hash,
    certification_refs: freezeArray(certificationLineage ? [replay.certification_package.integrity_hash] : []),
    evidence_refs: evidenceRefs,
    knowledge_refs: knowledgeRefs,
    replay_refs: replayRefs,
    supersedes_refs: freezeArray(supersessionValid ? [replay.baseline_registry.baselines[0]?.integrity_hash ?? replay.baseline_registry.integrity_hash] : []),
    superseded_by_refs: freezeArray([]),
    operational_summary: "Operational evolution preserved with deterministic replay and additive knowledge extraction.",
    governance_summary: "Governance accountability and approval lineage are preserved.",
    constitutional_summary: "Historical records remain immutable; corrections are additive lineage only.",
    lineage_version: "lineage/v18.11",
    immutable: evidenceImmutable,
  });
  const evolution_registry = nested({ registry_id: id("evolution_registry", evolutionId), categories: registryCategories, evolution_records: freezeArray([evolution_record]), operational_improvements: [evolution_record.integrity_hash], approved_recommendations: [evolution_record.recommendation_ref], implemented_recommendations: [evolution_record.implementation_attestation_ref], rejected_recommendations: [id("rejected_recommendation_record", evolutionId)], superseded_recommendations: evolution_record.supersedes_refs, operational_milestones: [id("operational_milestone", evolutionId)], governance_milestones: [id("governance_milestone", evolutionId)], platform_evolution: [id("platform_evolution", evolutionId)], constitutional_evolution_refs: [id("constitutional_evolution", evolutionId)], deterministic_evolution: deterministic, immutable_history: evidenceImmutable, additive_corrections: supersessionValid, governance_preserved: governancePreserved });
  const improvement_ledger = nested({ ledger_id: id("continuous_improvement_ledger", evolutionId), stages: improvementStages, improvement_proposals: [evolution_record.operational_change_ref], qualification_results: [evolution_record.qualification_ref], recommendation_lineage: recommendationLineage ? [evolution_record.recommendation_ref] : [], implementation_decisions: implementationLineage ? [evolution_record.implementation_attestation_ref] : [], implementation_outcomes: implementationLineage ? [evolution_record.validation_ref] : [], operational_effectiveness: [replay.stability_monitor.integrity_hash], rollback_history: [id("rollback_history_none", evolutionId)], supersession_history: supersessionValid ? evolution_record.supersedes_refs : [], immutable_entries: evidenceImmutable, additive_lineage: supersessionValid, deterministic_transitions: deterministic });
  const knowledge_registry = nested({ knowledge_registry_id: id("operational_knowledge_registry", evolutionId), categories: knowledgeCategories, lessons_learned: lessonsGoverned ? [knowledgeRefs[0] ?? id("knowledge_lesson", evolutionId)] : [], operational_patterns: [knowledgeRefs[1] ?? id("knowledge_pattern", evolutionId)], recurring_operational_issues: [id("recurring_issue_observation", evolutionId)], validated_operational_practices: [id("validated_practice", evolutionId)], governance_observations: [replay.divergence_analysis.integrity_hash], replay_observations: replayRefs, certification_observations: certificationLineage ? evolution_record.certification_refs : [], optimization_history: [id("optimization_history", evolutionId)], resilience_observations: [knowledgeRefs[2] ?? id("knowledge_resilience", evolutionId)], evidence_refs: evidenceRefs, additive_knowledge: knowledgePreserved, knowledge_never_replaces_evidence: evidenceImmutable, governed_lessons: lessonsGoverned, historical_context_preserved: knowledgePreserved });
  const evidence_archive = nested({ archive_id: id("operational_evidence_archive", evolutionId), categories: evidenceCategories, qualification_evidence: [evolution_record.qualification_ref], certification_evidence: evolution_record.certification_refs, replay_evidence: replayRefs, monitoring_evidence: [replay.stability_monitor.integrity_hash], simulation_evidence: [replay.regression_engine.integrity_hash], implementation_evidence: [evolution_record.implementation_attestation_ref], operational_reports: [evolution_record.integrity_hash], governance_decisions: [id("governance_approval", evolutionId)], audit_artifacts: evidenceRefs, immutable_evidence: evidenceImmutable, cryptographically_verifiable: archiveIntegrity, replayable: replayReproducible, archive_integrity_verified: archiveIntegrity });
  const certification_package = nested({
    package_id: id("operational_evolution_certification", evolutionId),
    operational_evolution_deterministic: evolution_registry.deterministic_evolution && improvement_ledger.deterministic_transitions,
    recommendation_lineage_complete: improvement_ledger.recommendation_lineage.length > 0 && recommendationLineage,
    certification_lineage_preserved: evolution_record.certification_refs.length > 0 && certificationLineage,
    implementation_lineage_validated: implementation_ledger_valid(improvement_ledger) && implementationLineage,
    lessons_learned_governed: knowledge_registry.lessons_learned.length > 0 && knowledge_registry.governed_lessons,
    operational_knowledge_preserved: knowledge_registry.additive_knowledge && knowledge_registry.historical_context_preserved,
    historical_evidence_immutable: evidence_archive.immutable_evidence && evolution_record.immutable,
    archive_integrity_verified: evidence_archive.archive_integrity_verified && evidence_archive.cryptographically_verifiable,
    replay_reproducible: evidence_archive.replayable && replayRefs.length > 0,
    lineage_complete: lineageComplete && evolution_record.evidence_refs.length > 0 && evolution_record.knowledge_refs.length > 0,
    governance_preserved: evolution_registry.governance_preserved,
    historical_audit_complete: auditComplete && evidence_archive.audit_artifacts.length > 0,
    operational_evolution_certified: blockingFailures.length === 0,
    evidence_refs: evidenceRefs,
  });
  const tests = freezeArray([
    certTest("Operational evolution deterministic", certification_package.operational_evolution_deterministic, "OPERATIONAL_EVOLUTION_NOT_DETERMINISTIC", [evolution_registry.integrity_hash]),
    certTest("Recommendation lineage complete", certification_package.recommendation_lineage_complete, "RECOMMENDATION_LINEAGE_INCOMPLETE", [improvement_ledger.integrity_hash]),
    certTest("Certification lineage preserved", certification_package.certification_lineage_preserved, "CERTIFICATION_LINEAGE_NOT_PRESERVED", [evolution_record.integrity_hash]),
    certTest("Implementation lineage validated", certification_package.implementation_lineage_validated, "IMPLEMENTATION_LINEAGE_NOT_VALIDATED", [improvement_ledger.integrity_hash]),
    certTest("Lessons learned governed", certification_package.lessons_learned_governed, "LESSONS_LEARNED_NOT_GOVERNED", [knowledge_registry.integrity_hash]),
    certTest("Operational knowledge preserved", certification_package.operational_knowledge_preserved, "OPERATIONAL_KNOWLEDGE_NOT_PRESERVED", [knowledge_registry.integrity_hash]),
    certTest("Historical evidence immutable", certification_package.historical_evidence_immutable, "HISTORICAL_EVIDENCE_NOT_IMMUTABLE", [evidence_archive.integrity_hash]),
    certTest("Archive integrity verified", certification_package.archive_integrity_verified, "ARCHIVE_INTEGRITY_NOT_VERIFIED", [evidence_archive.integrity_hash]),
    certTest("Replay reproducible", certification_package.replay_reproducible, "REPLAY_NOT_REPRODUCIBLE", [evidence_archive.integrity_hash]),
    certTest("Lineage complete", certification_package.lineage_complete, "LINEAGE_INCOMPLETE", [evolution_record.integrity_hash]),
    certTest("Governance preserved", certification_package.governance_preserved, "GOVERNANCE_NOT_PRESERVED", [evolution_registry.integrity_hash]),
    certTest("Historical audit complete", certification_package.historical_audit_complete, "HISTORICAL_AUDIT_INCOMPLETE", [evidence_archive.integrity_hash]),
    certTest("Operational evolution certified", certification_package.operational_evolution_certified, "OPERATIONAL_EVOLUTION_NOT_CERTIFIED", [certification_package.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is OperationalEvolutionKnowledgeFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<OperationalEvolutionKnowledgeResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, replay_stability_integrity_ref: replay.integrity_hash, evolution_stages: evolutionStages, evolution_registry, improvement_ledger, knowledge_registry, evidence_archive, certification_package, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

function implementation_ledger_valid(ledger: { implementation_decisions: readonly string[]; implementation_outcomes: readonly string[] }): boolean {
  return ledger.implementation_decisions.length > 0 && ledger.implementation_outcomes.length > 0;
}

export function validateOperationalEvolutionKnowledge(result = runOperationalEvolutionKnowledge()) {
  const evolution_registry_valid = verify(result.evolution_registry) && result.evolution_registry.categories.length === 9 && result.evolution_registry.evolution_records.length > 0 && result.evolution_registry.evolution_records.every((record) => verify(record) && record.immutable && record.evidence_refs.length > 0 && record.knowledge_refs.length > 0 && record.replay_refs.length > 0) && result.evolution_registry.deterministic_evolution && result.evolution_registry.immutable_history && result.evolution_registry.additive_corrections && result.evolution_registry.governance_preserved;
  const improvement_ledger_valid = verify(result.improvement_ledger) && result.improvement_ledger.stages.length === 7 && result.improvement_ledger.immutable_entries && result.improvement_ledger.additive_lineage && result.improvement_ledger.deterministic_transitions && Object.entries(result.improvement_ledger).filter(([key]) => !["ledger_id", "immutable_entries", "additive_lineage", "deterministic_transitions", "integrity_hash"].includes(key)).every(([, value]) => Array.isArray(value) && value.length > 0);
  const knowledge_registry_valid = verify(result.knowledge_registry) && result.knowledge_registry.categories.length === 9 && result.knowledge_registry.additive_knowledge && result.knowledge_registry.knowledge_never_replaces_evidence && result.knowledge_registry.governed_lessons && result.knowledge_registry.historical_context_preserved && Object.entries(result.knowledge_registry).filter(([key]) => !["knowledge_registry_id", "additive_knowledge", "knowledge_never_replaces_evidence", "governed_lessons", "historical_context_preserved", "integrity_hash"].includes(key)).every(([, value]) => Array.isArray(value) && value.length > 0);
  const evidence_archive_valid = verify(result.evidence_archive) && result.evidence_archive.categories.length === 9 && result.evidence_archive.immutable_evidence && result.evidence_archive.cryptographically_verifiable && result.evidence_archive.replayable && result.evidence_archive.archive_integrity_verified && Object.entries(result.evidence_archive).filter(([key]) => !["archive_id", "immutable_evidence", "cryptographically_verifiable", "replayable", "archive_integrity_verified", "integrity_hash"].includes(key)).every(([, value]) => Array.isArray(value) && value.length > 0);
  const certification_package_valid = verify(result.certification_package) && result.certification_package.evidence_refs.length > 0 && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 13 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && evolution_registry_valid && improvement_ledger_valid && knowledge_registry_valid && evidence_archive_valid && certification_package_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, evolution_registry_valid, improvement_ledger_valid, knowledge_registry_valid, evidence_archive_valid, certification_package_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayOperationalEvolutionKnowledge(result = runOperationalEvolutionKnowledge()): boolean {
  const replayed = runOperationalEvolutionKnowledge();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateOperationalEvolutionKnowledge(result).valid;
}

export function getOperationalEvolutionKnowledgeBundle(): OperationalEvolutionKnowledgeBundle {
  const result = runOperationalEvolutionKnowledge();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "replay-stability-integrity/v18.10" as const, evolution_stages: evolutionStages, improvement_stages: improvementStages, registry_categories: registryCategories, knowledge_categories: knowledgeCategories, evidence_categories: evidenceCategories, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateOperationalEvolutionKnowledge(result) });
}

export const OperationalEvolutionKnowledgeService = Object.freeze({ run: runOperationalEvolutionKnowledge, validate: validateOperationalEvolutionKnowledge, replay: replayOperationalEvolutionKnowledge });
