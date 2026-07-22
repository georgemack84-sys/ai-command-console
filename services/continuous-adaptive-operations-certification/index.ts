import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runOperationalEvolutionKnowledge } from "@/services/operational-evolution-knowledge";
import type {
  CertificationEvidenceDomain,
  ConstitutionalValidationRequirement,
  ContinuousAdaptiveOperationsBundle,
  ContinuousAdaptiveOperationsFailure,
  ContinuousAdaptiveOperationsInput,
  ContinuousAdaptiveOperationsOutcome,
  ContinuousAdaptiveOperationsResult,
  Phase18CertificationMatrixEntry,
  Phase18Service,
} from "@/types/continuous-adaptive-operations-certification";

const VERSION = "continuous-adaptive-operations-certification/v18.12" as const;
const IDENTIFIER = "ContinuousAdaptiveOperationsCertificationGate" as const;
const DEFAULT_TENANT = "tenant_phase_18_certification_gate";
const DEFAULT_OPERATOR = "operator_phase_18_certification_gate";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ContinuousAdaptiveOperationsFailure[], failure: ContinuousAdaptiveOperationsFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ContinuousAdaptiveOperationsInput["scenario"]): ContinuousAdaptiveOperationsFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ContinuousAdaptiveOperationsFailure[]): ContinuousAdaptiveOperationsOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_CERTIFICATION_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const phase18Services = freezeArray(["CONTINUOUS_OPERATIONS_FOUNDATION", "CONTINUOUS_MONITORING_INTELLIGENCE", "OPERATIONAL_LEARNING_ENGINE", "CONTINUOUS_OPTIMIZATION_FRAMEWORK", "ADAPTATION_SIMULATION_ENGINE", "ADAPTATION_QUALIFICATION_SERVICE", "CONTINUOUS_OPERATIONAL_CERTIFICATION_SERVICE", "ADAPTIVE_GOVERNANCE", "CONTINUOUS_RISK_INTELLIGENCE", "REPLAY_STABILITY_INTEGRITY", "OPERATIONAL_EVOLUTION_KNOWLEDGE"] as const satisfies readonly Phase18Service[]);
const evidenceDomains = freezeArray(["OPERATIONAL_GOVERNANCE", "CONTINUOUS_OPERATIONS", "OPERATIONAL_CHANGE_INTELLIGENCE", "LEARNING_OPTIMIZATION", "ADAPTATION_VALIDATION", "CONTINUOUS_CERTIFICATION", "ADAPTIVE_GOVERNANCE", "CONTINUOUS_RISK_INTELLIGENCE", "REPLAY_INTEGRITY", "OPERATIONAL_EVOLUTION", "EXTERNAL_IMPLEMENTATION_GOVERNANCE", "TENANT_ISOLATION", "OBSERVABILITY_EXPLAINABILITY"] as const satisfies readonly CertificationEvidenceDomain[]);
const constitutionalRequirements = freezeArray(["HISTORICAL_TRUTH_PRESERVED", "LEARNING_GOVERNANCE_ENFORCED", "OPTIMIZATION_AUTHORITY_BOUNDARY", "ADVISORY_RECOMMENDATIONS_ONLY", "QUALIFICATION_NO_IMPLEMENTATION_AUTHORITY", "CERTIFICATION_NO_IMPLEMENTATION_ASSUMPTION", "EXTERNAL_ATTESTATION_REQUIRED", "REPLAY_DETERMINISTIC_ACROSS_EVOLUTION", "STANDING_SERVICES_FAIL_CLOSED", "TENANT_ISOLATION_PRESERVED", "OPERATIONAL_KNOWLEDGE_IMMUTABLE", "HISTORICAL_EVIDENCE_ADDITIVE", "LINEAGE_COMPLETE", "GOVERNANCE_AUTHORITY_SUPREME"] as const satisfies readonly ConstitutionalValidationRequirement[]);

function matrixEntry(name: string, passed: boolean, failure: ContinuousAdaptiveOperationsFailure, evidence_refs: readonly string[]): Phase18CertificationMatrixEntry {
  return nested({ test_id: id("phase_18_matrix", name), name, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}

function resultReplayHash(result: Omit<ContinuousAdaptiveOperationsResult, "replay_hash" | "integrity_hash">): string {
  return hash({ evolution: result.operational_evolution_knowledge_ref, preconditions: result.preconditions.integrity_hash, evidence: result.evidence_domains.map((domain) => domain.integrity_hash), constitutional: result.constitutional_validation.integrity_hash, matrix: result.certification_matrix.map((entry) => entry.integrity_hash), package: result.certification_package.integrity_hash, outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ContinuousAdaptiveOperationsResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runContinuousAdaptiveOperationsCertification(input: ContinuousAdaptiveOperationsInput = {}): ContinuousAdaptiveOperationsResult {
  const evolution = runOperationalEvolutionKnowledge({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: ContinuousAdaptiveOperationsFailure[] = evolution.outcome === "PASS" ? [] : ["PHASE_18_11_OPERATIONAL_EVOLUTION_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_CERTIFICATION_WARNING"));
  const certificationId = input.certification_id ?? id("phase_18_certification", evolution.integrity_hash);
  const continuousOperations = !has(failures, "CONTINUOUS_OPERATIONS_NOT_CERTIFIED");
  const governance = !has(failures, "PERPETUAL_GOVERNANCE_NOT_VERIFIED") && !has(failures, "GOVERNANCE_SUPREMACY_NOT_PRESERVED") && !has(failures, "GOVERNANCE_VIOLATION");
  const monitoring = !has(failures, "CONTINUOUS_MONITORING_NOT_OPERATIONAL") && !has(failures, "NONDETERMINISTIC_MONITORING");
  const adaptation = !has(failures, "DETERMINISTIC_ADAPTATION_NOT_VALIDATED") && !has(failures, "NONDETERMINISTIC_CHANGE_DETECTION") && !has(failures, "NONDETERMINISTIC_SIMULATION");
  const qualification = !has(failures, "ADAPTATION_QUALIFICATION_NOT_VERIFIED") && !has(failures, "NONDETERMINISTIC_QUALIFICATION");
  const certification = !has(failures, "CONTINUOUS_CERTIFICATION_NOT_OPERATIONAL") && !has(failures, "MUTABLE_CERTIFICATION_LINEAGE");
  const replay = !has(failures, "REPLAY_NOT_CONTINUOUSLY_REPRODUCIBLE") && !has(failures, "REPLAY_DIVERGENCE_WITHOUT_GOVERNED_EXPLANATION") && !has(failures, "INCOMPLETE_REPLAY_EVIDENCE");
  const advisory = !has(failures, "ADVISORY_BOUNDARY_NOT_ENFORCED") && !has(failures, "AUTHORITY_EXPANSION");
  const attestation = !has(failures, "EXTERNAL_IMPLEMENTATION_ATTESTATION_NOT_VERIFIED") && !has(failures, "MISSING_IMPLEMENTATION_ATTESTATION") && !has(failures, "MUTABLE_IMPLEMENTATION_LINEAGE");
  const evolutionLineage = !has(failures, "IMMUTABLE_EVOLUTION_LINEAGE_NOT_VERIFIED") && !has(failures, "MUTABLE_OPERATIONAL_HISTORY") && !has(failures, "MUTABLE_RECOMMENDATION_LINEAGE");
  const improvementLedger = !has(failures, "CONTINUOUS_IMPROVEMENT_LEDGER_INCOMPLETE");
  const knowledge = !has(failures, "OPERATIONAL_KNOWLEDGE_NOT_PRESERVED");
  const evidence = !has(failures, "OPERATIONAL_EVIDENCE_NOT_IMMUTABLE") && !has(failures, "INCOMPLETE_OPERATIONAL_EVIDENCE");
  const risk = !has(failures, "DETERMINISTIC_RISK_INTELLIGENCE_NOT_OPERATIONAL") && !has(failures, "MISSING_RISK_INTELLIGENCE");
  const observability = !has(failures, "OBSERVABILITY_INCOMPLETE");
  const explainability = !has(failures, "EXPLAINABILITY_NOT_REPRODUCIBLE");
  const tenantIsolation = !has(failures, "TENANT_ISOLATION_NOT_PRESERVED");
  const constitutional = !has(failures, "CONSTITUTIONAL_COMPLIANCE_NOT_VERIFIED") && !has(failures, "CONSTITUTIONAL_VIOLATION");
  const evidenceRefs = freezeArray(evidence ? [evolution.integrity_hash, evolution.certification_package.integrity_hash, evolution.evidence_archive.integrity_hash, evolution.knowledge_registry.integrity_hash, evolution.improvement_ledger.integrity_hash] : []);

  const preconditions = nested({ precondition_id: id("phase_18_preconditions", certificationId), completed_services: phase18Services, standing_constitutional_services_operational: continuousOperations, operational_evidence_complete: evidence, replay_infrastructure_operational: replay, evolution_lineage_complete: evolutionLineage, knowledge_registry_populated: knowledge, continuous_certification_operational: certification, risk_intelligence_operational: risk, governance_validation_complete: governance, tenant_isolation_verified: tenantIsolation, external_attestation_framework_operational: attestation });
  const domainRecords = freezeArray(evidenceDomains.map((domain) => nested({ domain, evidence_refs: evidenceRefs, complete: evidence, immutable: evidence && evolutionLineage, replayable: replay, explainable: explainability })));
  const constitutional_validation = nested({ validation_id: id("constitutional_validation", certificationId), requirements: constitutionalRequirements, historical_truth_preserved: evolutionLineage, learning_governance_enforced: governance, optimization_authority_bounded: advisory, advisory_recommendations_only: advisory, qualification_no_implementation_authority: qualification && advisory, certification_no_implementation_assumption: certification && attestation, external_attestation_required: attestation, replay_deterministic_across_evolution: replay, standing_services_fail_closed: continuousOperations, tenant_isolation_preserved: tenantIsolation, operational_knowledge_immutable: knowledge, historical_evidence_additive: evidence, lineage_complete: evolutionLineage && improvementLedger, governance_authority_supreme: governance });
  const certification_matrix = freezeArray([
    matrixEntry("Continuous monitoring operational", monitoring, "CONTINUOUS_MONITORING_NOT_OPERATIONAL", [preconditions.integrity_hash]),
    matrixEntry("Operational change detection deterministic", adaptation, "DETERMINISTIC_ADAPTATION_NOT_VALIDATED", [evolution.evolution_registry.integrity_hash]),
    matrixEntry("Simulation deterministic", adaptation, "DETERMINISTIC_ADAPTATION_NOT_VALIDATED", [evolution.evidence_archive.integrity_hash]),
    matrixEntry("Adaptation qualification deterministic", qualification, "ADAPTATION_QUALIFICATION_NOT_VERIFIED", [evolution.evolution_registry.evolution_records[0]?.qualification_ref ?? evolution.integrity_hash]),
    matrixEntry("Continuous certification operational", certification, "CONTINUOUS_CERTIFICATION_NOT_OPERATIONAL", [evolution.certification_package.integrity_hash]),
    matrixEntry("Standing services fail closed", continuousOperations, "CONTINUOUS_OPERATIONS_NOT_CERTIFIED", [preconditions.integrity_hash]),
    matrixEntry("Replay continuously verified", replay, "REPLAY_NOT_CONTINUOUSLY_REPRODUCIBLE", [evolution.evidence_archive.integrity_hash]),
    matrixEntry("Governance supremacy preserved", governance, "GOVERNANCE_SUPREMACY_NOT_PRESERVED", [constitutional_validation.integrity_hash]),
    matrixEntry("Advisory-only boundary enforced", advisory, "ADVISORY_BOUNDARY_NOT_ENFORCED", [constitutional_validation.integrity_hash]),
    matrixEntry("External implementation attested", attestation, "EXTERNAL_IMPLEMENTATION_ATTESTATION_NOT_VERIFIED", [evolution.evolution_registry.evolution_records[0]?.implementation_attestation_ref ?? evolution.integrity_hash]),
    matrixEntry("Attestation lineage immutable", attestation, "EXTERNAL_IMPLEMENTATION_ATTESTATION_NOT_VERIFIED", [evolution.evolution_registry.evolution_records[0]?.integrity_hash ?? evolution.integrity_hash]),
    matrixEntry("Certification lineage immutable", certification, "CONTINUOUS_CERTIFICATION_NOT_OPERATIONAL", [evolution.certification_package.integrity_hash]),
    matrixEntry("Tenant isolation preserved", tenantIsolation, "TENANT_ISOLATION_NOT_PRESERVED", [preconditions.integrity_hash]),
    matrixEntry("Operational evolution traceable", evolutionLineage, "IMMUTABLE_EVOLUTION_LINEAGE_NOT_VERIFIED", [evolution.evolution_registry.integrity_hash]),
    matrixEntry("Continuous Improvement Ledger complete", improvementLedger, "CONTINUOUS_IMPROVEMENT_LEDGER_INCOMPLETE", [evolution.improvement_ledger.integrity_hash]),
    matrixEntry("Operational knowledge preserved", knowledge, "OPERATIONAL_KNOWLEDGE_NOT_PRESERVED", [evolution.knowledge_registry.integrity_hash]),
    matrixEntry("Risk intelligence operational", risk, "DETERMINISTIC_RISK_INTELLIGENCE_NOT_OPERATIONAL", [evolution.replay_stability_integrity_ref]),
    matrixEntry("Observability complete", observability, "OBSERVABILITY_INCOMPLETE", [preconditions.integrity_hash]),
    matrixEntry("Explainability reproducible", explainability, "EXPLAINABILITY_NOT_REPRODUCIBLE", [constitutional_validation.integrity_hash]),
  ]);
  const certification_package = nested({
    package_id: id("phase_18_certification_package", certificationId),
    continuous_operations_certified: continuousOperations,
    perpetual_operational_governance_verified: governance,
    continuous_monitoring_operational: monitoring,
    deterministic_operational_adaptation_validated: adaptation,
    adaptation_qualification_verified: qualification,
    continuous_certification_operational: certification,
    replay_continuously_reproducible: replay,
    governance_supremacy_preserved: governance,
    advisory_only_boundary_enforced: advisory,
    external_implementation_attestation_verified: attestation,
    immutable_operational_evolution_lineage_verified: evolutionLineage,
    continuous_improvement_ledger_complete: improvementLedger,
    operational_knowledge_preserved: knowledge,
    operational_evidence_immutable: evidence,
    deterministic_risk_intelligence_operational: risk,
    observability_complete: observability,
    explainability_reproducible: explainability,
    tenant_isolation_preserved: tenantIsolation,
    constitutional_compliance_verified: constitutional,
    phase_18_certified: blockingFailures.length === 0,
    mission_control_qualified_for_continuous_adaptive_operation: blockingFailures.length === 0,
    evidence_refs: evidenceRefs,
  });
  const packageTests = freezeArray([
    matrixEntry("Continuous operations certified", certification_package.continuous_operations_certified, "CONTINUOUS_OPERATIONS_NOT_CERTIFIED", [certification_package.integrity_hash]),
    matrixEntry("Perpetual operational governance verified", certification_package.perpetual_operational_governance_verified, "PERPETUAL_GOVERNANCE_NOT_VERIFIED", [constitutional_validation.integrity_hash]),
    matrixEntry("Constitutional compliance verified", certification_package.constitutional_compliance_verified, "CONSTITUTIONAL_COMPLIANCE_NOT_VERIFIED", [constitutional_validation.integrity_hash]),
    matrixEntry("Phase 18 certified", certification_package.phase_18_certified, "PHASE_18_NOT_CERTIFIED", [certification_package.integrity_hash]),
    matrixEntry("Mission Control qualified for continuous adaptive operation", certification_package.mission_control_qualified_for_continuous_adaptive_operation, "MISSION_CONTROL_NOT_QUALIFIED_FOR_CONTINUOUS_ADAPTIVE_OPERATION", [certification_package.integrity_hash]),
  ]);
  const allTests = freezeArray([...certification_matrix, ...packageTests]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...allTests.map((test) => test.failure_reason).filter((failure): failure is ContinuousAdaptiveOperationsFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<ContinuousAdaptiveOperationsResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, operational_evolution_knowledge_ref: evolution.integrity_hash, preconditions, evidence_domains: domainRecords, constitutional_validation, certification_matrix: allTests, certification_package, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateContinuousAdaptiveOperationsCertification(result = runContinuousAdaptiveOperationsCertification()) {
  const preconditions_valid = verify(result.preconditions) && result.preconditions.completed_services.length === 11 && Object.entries(result.preconditions).filter(([key]) => !["precondition_id", "completed_services", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const evidence_domains_valid = result.evidence_domains.length === 13 && result.evidence_domains.every((domain) => verify(domain) && domain.evidence_refs.length > 0 && domain.complete && domain.immutable && domain.replayable && domain.explainable);
  const constitutional_validation_valid = verify(result.constitutional_validation) && result.constitutional_validation.requirements.length === 14 && Object.entries(result.constitutional_validation).filter(([key]) => !["validation_id", "requirements", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_matrix_valid = result.certification_matrix.length === 24 && result.certification_matrix.every((entry) => verify(entry) && entry.passed && entry.evidence_refs.length > 0);
  const certification_package_valid = verify(result.certification_package) && result.certification_package.evidence_refs.length > 0 && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && preconditions_valid && evidence_domains_valid && constitutional_validation_valid && certification_matrix_valid && certification_package_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, preconditions_valid, evidence_domains_valid, constitutional_validation_valid, certification_matrix_valid, certification_package_valid, result_replay_valid, failures: result.failures });
}

export function replayContinuousAdaptiveOperationsCertification(result = runContinuousAdaptiveOperationsCertification()): boolean {
  const replayed = runContinuousAdaptiveOperationsCertification();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateContinuousAdaptiveOperationsCertification(result).valid;
}

export function getContinuousAdaptiveOperationsCertificationBundle(): ContinuousAdaptiveOperationsBundle {
  const result = runContinuousAdaptiveOperationsCertification();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "operational-evolution-knowledge/v18.11" as const, outcome_family: "Amendment 29" as const, phase_18_services: phase18Services, evidence_domains: evidenceDomains, constitutional_requirements: constitutionalRequirements, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateContinuousAdaptiveOperationsCertification(result) });
}

export const ContinuousAdaptiveOperationsCertificationService = Object.freeze({ run: runContinuousAdaptiveOperationsCertification, validate: validateContinuousAdaptiveOperationsCertification, replay: replayContinuousAdaptiveOperationsCertification });
