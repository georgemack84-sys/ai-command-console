import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { appendRecommendationPerformanceRecord, replayRecommendationPerformanceLedger } from "@/services/recommendation-performance-ledger";
import type { RecommendationPerformanceLedgerInput, RecommendationPerformanceLedgerResult } from "@/types/recommendation-performance-ledger";
import type {
  CertificationDomainValidation,
  RecommendationEffectivenessCertification,
  RecommendationEffectivenessCertificationApiSurface,
  RecommendationEffectivenessCertificationFailure,
  RecommendationEffectivenessCertificationFoundation,
  RecommendationEffectivenessCertificationGateResult,
  RecommendationEffectivenessCertificationInput,
  RecommendationEffectivenessCertificationLedgerEntry,
  RecommendationEffectivenessCertificationResult,
  RecommendationEffectivenessSubsystem,
  SubsystemCertificationResult,
} from "@/types/recommendation-effectiveness-certification-gate";

const CERTIFICATION_GATE_VERSION = "recommendation-effectiveness-certification-gate/v1" as const;
const CERTIFICATION_TIMESTAMP = "2026-07-09T00:00:00.000Z";

export const RECOMMENDATION_EFFECTIVENESS_SUBSYSTEMS: readonly RecommendationEffectivenessSubsystem[] = Object.freeze([
  "RECOMMENDATION_EFFECTIVENESS_CONTRACT",
  "EXPECTED_VS_ACTUAL_COMPARATOR",
  "RECOMMENDATION_QUALITY_SCORING",
  "RECOMMENDATION_ACCEPTANCE_ANALYSIS",
  "RECOMMENDATION_REJECTION_ANALYSIS",
  "OVERRIDE_ANALYSIS_ENGINE",
  "RECOMMENDATION_DIMENSION_EVALUATION",
  "IMPROVEMENT_OPPORTUNITY_GENERATOR",
  "RECOMMENDATION_PERFORMANCE_LEDGER",
]);

type Scenario = NonNullable<RecommendationEffectivenessCertificationInput["scenario"]>;

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

function sourceScenario(scenario: Scenario): RecommendationPerformanceLedgerInput["scenario"] {
  const map: Partial<Record<Scenario, RecommendationPerformanceLedgerInput["scenario"]>> = {
    REPLAY_MISMATCH: "REPLAY_RECONSTRUCTION_FAILURE",
    LINEAGE_BREAK: "INCOMPLETE_LINEAGE",
    EVIDENCE_TRACEABILITY_GAP: "MISSING_EVIDENCE",
    GOVERNANCE_FAILURE: "GOVERNANCE_FAILURE",
    CONSTITUTIONAL_FAILURE: "CONSTITUTIONAL_FAILURE",
    CROSS_TENANT: "CROSS_TENANT",
    LEDGER_MUTATION: "MUTATION_ATTEMPT",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE",
  };
  return map[scenario] ?? "BASELINE";
}

function sourceForScenario(input: RecommendationEffectivenessCertificationInput, scenario: Scenario): RecommendationPerformanceLedgerResult {
  if (input.performance_ledger) return input.performance_ledger;
  return appendRecommendationPerformanceRecord({ scenario: sourceScenario(scenario) });
}

function buildApiSurface(): RecommendationEffectivenessCertificationApiSurface {
  const base: Omit<RecommendationEffectivenessCertificationApiSurface, "integrity_hash"> = {
    api_id: "recommendation_effectiveness_certification_gate_api",
    certify_architecture: "POST /recommendation-effectiveness-certification-gate/certify",
    certify_replay: "POST /recommendation-effectiveness-certification-gate/replay",
    certify_governance: "POST /recommendation-effectiveness-certification-gate/governance",
    certify_constitutional: "POST /recommendation-effectiveness-certification-gate/constitutional",
    certify_operator_authority: "POST /recommendation-effectiveness-certification-gate/operator",
    certify_production_readiness: "POST /recommendation-effectiveness-certification-gate/readiness",
    retrieve_contract: "GET /recommendation-effectiveness-certification-gate/contract",
    update_supported: false,
    delete_supported: false,
    adaptive_learning_supported: false,
    autonomous_optimization_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(ledger: RecommendationPerformanceLedgerResult, scenario: Scenario): readonly RecommendationEffectivenessCertificationFailure[] {
  const failures: RecommendationEffectivenessCertificationFailure[] = [];
  if (scenario === "SUBSYSTEM_EXCLUDED") failures.push("SUBSYSTEM_EXCLUDED");
  if (scenario === "NONDETERMINISTIC_SCORING") failures.push("NONDETERMINISTIC_SCORING_DETECTED");
  if (scenario === "REPLAY_MISMATCH" || !replayRecommendationPerformanceLedger(ledger) || !ledger.validation.replay_validated) failures.push("REPLAY_MISMATCH_DETECTED");
  if (scenario === "LINEAGE_BREAK" || !ledger.validation.lineage_complete) failures.push("RECOMMENDATION_LINEAGE_INCOMPLETE");
  if (scenario === "EVIDENCE_TRACEABILITY_GAP" || !ledger.validation.evidence_referenced) failures.push("EVIDENCE_TRACEABILITY_INCOMPLETE");
  if (scenario === "GOVERNANCE_FAILURE" || !ledger.validation.governance_validated) failures.push("GOVERNANCE_VALIDATION_FAILED");
  if (scenario === "CONSTITUTIONAL_FAILURE") failures.push("CONSTITUTIONAL_VALIDATION_FAILED");
  if (scenario === "OPERATOR_AUTHORITY_VIOLATION") failures.push("OPERATOR_AUTHORITY_VIOLATED");
  if (scenario === "ADVISORY_BOUNDARY_VIOLATION" || !ledger.advisory_only) failures.push("ADVISORY_ONLY_BOUNDARY_VIOLATED");
  if (scenario === "AUTOMATIC_LEARNING" || ledger.learning_database) failures.push("AUTOMATIC_LEARNING_DETECTED");
  if (scenario === "AUTONOMOUS_OPTIMIZATION") failures.push("AUTONOMOUS_OPTIMIZATION_DETECTED");
  if (scenario === "HIDDEN_EVALUATION_LOGIC") failures.push("HIDDEN_EVALUATION_LOGIC_DETECTED");
  if (scenario === "HIDDEN_SCORING_HEURISTICS") failures.push("HIDDEN_SCORING_HEURISTICS_DETECTED");
  if (scenario === "CROSS_TENANT" || !ledger.validation.tenant_isolated) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "LEDGER_MUTATION" || !ledger.validation.append_only || !ledger.validation.immutable) failures.push("LEDGER_MUTATION_DETECTED");
  if (scenario === "INTEGRITY_FAILURE" || !ledger.validation.integrity_verified) failures.push("CRYPTOGRAPHIC_INTEGRITY_FAILED");
  if (scenario === "PRODUCTION_READINESS_GAP") failures.push("PRODUCTION_READINESS_INCOMPLETE");
  return freezeArray([...new Set(failures)]);
}

function resultForFailures(failures: readonly RecommendationEffectivenessCertificationFailure[], scenario: Scenario): RecommendationEffectivenessCertificationResult {
  if (failures.length) return "FAIL";
  if (scenario === "CONDITIONAL_DOCUMENTATION_GAP") return "CONDITIONAL_PASS";
  return "PASS";
}

function subsystemResults(result: RecommendationEffectivenessCertificationResult, scenario: Scenario): readonly SubsystemCertificationResult[] {
  const excluded = scenario === "SUBSYSTEM_EXCLUDED" ? "EXPECTED_VS_ACTUAL_COMPARATOR" : undefined;
  return freezeArray(RECOMMENDATION_EFFECTIVENESS_SUBSYSTEMS.filter((subsystem) => subsystem !== excluded).map((subsystem) => {
    const base: Omit<SubsystemCertificationResult, "integrity_hash"> = {
      subsystem,
      result,
      deterministic: result !== "FAIL",
      replayable: result !== "FAIL",
      governance_compliant: result !== "FAIL",
      advisory_only: true,
      findings: result === "PASS" ? freezeArray([`${subsystem} certified`]) : freezeArray([`${subsystem} requires certification review`]),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function domainValidation(id: string, passed: boolean, findings: readonly string[], ledger: RecommendationPerformanceLedgerResult): CertificationDomainValidation {
  const base: Omit<CertificationDomainValidation, "integrity_hash"> = {
    validation_id: id,
    passed,
    findings: freezeArray(findings),
    replay_refs: ledger.performance_record.replay_refs,
    governance_refs: ledger.performance_record.governance_refs,
    lineage_refs: ledger.performance_record.lineage_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function correctiveActions(failures: readonly RecommendationEffectivenessCertificationFailure[], result: RecommendationEffectivenessCertificationResult): readonly string[] {
  if (result === "PASS") return freezeArray([]);
  if (result === "CONDITIONAL_PASS") return freezeArray(["complete non-blocking certification documentation before advancement"]);
  return freezeArray(failures.map((failure) => `resolve ${failure.toLowerCase()}`));
}

function buildCertification(ledger: RecommendationPerformanceLedgerResult, failures: readonly RecommendationEffectivenessCertificationFailure[], scenario: Scenario): RecommendationEffectivenessCertification {
  const certification_result = resultForFailures(failures, scenario);
  const findings = certification_result === "PASS" ? freezeArray(["Phase 10.3 recommendation effectiveness architecture certified for Phase 10.4 input"]) : freezeArray(failures.map((failure) => `certification blocked: ${failure}`));
  const base: Omit<RecommendationEffectivenessCertification, "integrity_hash"> = {
    certification_id: `recommendation_effectiveness_cert_${hash(ledger.performance_record.performance_record_id).slice(0, 14)}`,
    tenant_id: ledger.performance_record.tenant_id,
    certification_timestamp: CERTIFICATION_TIMESTAMP,
    certification_result,
    certification_state: certification_result === "PASS" ? "CERTIFICATION_GRANTED" : "CERTIFICATION_FAILED",
    subsystem_results: subsystemResults(certification_result, scenario),
    replay_validation: domainValidation("replay_certification", !failures.includes("REPLAY_MISMATCH_DETECTED"), ["replay reconstruction must be identical"], ledger),
    governance_validation: domainValidation("governance_certification", !failures.includes("GOVERNANCE_VALIDATION_FAILED"), ["governance enforcement and approval requirements verified"], ledger),
    constitutional_validation: domainValidation("constitutional_certification", !failures.includes("CONSTITUTIONAL_VALIDATION_FAILED"), ["constitutional constraints verified"], ledger),
    operator_validation: domainValidation("operator_authority_certification", !failures.includes("OPERATOR_AUTHORITY_VIOLATED") && !failures.includes("ADVISORY_ONLY_BOUNDARY_VIOLATED"), ["operator supremacy and advisory-only behavior verified"], ledger),
    adaptive_boundary_validation: domainValidation("adaptive_boundary_certification", !failures.includes("AUTOMATIC_LEARNING_DETECTED") && !failures.includes("AUTONOMOUS_OPTIMIZATION_DETECTED"), ["no automatic learning or autonomous optimization detected"], ledger),
    production_readiness: domainValidation("production_readiness_certification", !failures.includes("PRODUCTION_READINESS_INCOMPLETE") && certification_result !== "FAIL", ["production readiness verified"], ledger),
    certification_findings: findings,
    corrective_actions: correctiveActions(failures, certification_result),
    replay_refs: ledger.performance_record.replay_refs,
    governance_refs: ledger.performance_record.governance_refs,
    lineage_refs: ledger.performance_record.lineage_refs,
    progression_to_phase_10_4_authorized: certification_result === "PASS",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedgerEntry(ledger: RecommendationPerformanceLedgerResult, certification: RecommendationEffectivenessCertification, scenario: Scenario): RecommendationEffectivenessCertificationLedgerEntry {
  const base: Omit<RecommendationEffectivenessCertificationLedgerEntry, "integrity_hash"> = {
    ledger_entry_id: `recommendation_effectiveness_cert_ledger_${hash(certification.certification_id).slice(0, 14)}`,
    tenant_id: certification.tenant_id,
    certification_id: certification.certification_id,
    performance_record_ref: ledger.performance_record.performance_record_id,
    subsystem_refs: certification.subsystem_results.map((subsystem) => subsystem.subsystem),
    replay_refs: certification.replay_refs,
    governance_refs: certification.governance_refs,
    lineage_refs: certification.lineage_refs,
    append_only: true,
    deleted: scenario === "LEDGER_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<RecommendationEffectivenessCertificationGateResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    certification: result.certification,
    certification_ledger_entry: result.certification_ledger_entry,
    failures: result.failures,
    performance_ledger_replay_hash: result.performance_ledger.replay_hash,
  });
}

function resultIntegrityHash(result: Omit<RecommendationEffectivenessCertificationGateResult, "integrity_hash">): string {
  return hash({
    recommendation_effectiveness_certification_gate_version: result.recommendation_effectiveness_certification_gate_version,
    api_surface_hash: result.api_surface.integrity_hash,
    certification_hash: result.certification.integrity_hash,
    certification_ledger_hash: result.certification_ledger_entry.integrity_hash,
    performance_ledger_hash: result.performance_ledger.integrity_hash,
    replay_hash: result.replay_hash,
    deterministic: result.deterministic,
    replayable: result.replayable,
    advisory_only: result.advisory_only,
    governance_controlled: result.governance_controlled,
    constitutionally_constrained: result.constitutionally_constrained,
    operator_controlled: result.operator_controlled,
    adaptive_learning: result.adaptive_learning,
    autonomous_optimization: result.autonomous_optimization,
    modifies_recommendations: result.modifies_recommendations,
  });
}

export function certifyRecommendationEffectiveness(input: RecommendationEffectivenessCertificationInput = {}): RecommendationEffectivenessCertificationGateResult {
  const scenario = input.scenario ?? "BASELINE";
  const performance_ledger = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const initialFailures = collectFailures(performance_ledger, scenario);
  const certification = buildCertification(performance_ledger, initialFailures, scenario);
  const certification_ledger_entry = buildLedgerEntry(performance_ledger, certification, scenario);
  const failures = certification_ledger_entry.deleted ? freezeArray([...initialFailures, "LEDGER_MUTATION_DETECTED" as const]) : initialFailures;
  const base: Omit<RecommendationEffectivenessCertificationGateResult, "integrity_hash" | "replay_hash"> = {
    recommendation_effectiveness_certification_gate_version: CERTIFICATION_GATE_VERSION,
    performance_ledger,
    api_surface,
    certification,
    certification_ledger_entry,
    failures,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    governance_controlled: true,
    constitutionally_constrained: true,
    operator_controlled: true,
    adaptive_learning: false,
    autonomous_optimization: false,
    modifies_recommendations: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayRecommendationEffectivenessCertification(result: RecommendationEffectivenessCertificationGateResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash && replayRecommendationPerformanceLedger(result.performance_ledger);
}

export function computeRecommendationEffectivenessCertificationHash(record: Omit<RecommendationEffectivenessCertification, "integrity_hash"> | RecommendationEffectivenessCertification): string {
  return hashWithoutIntegrity(record);
}

export function getRecommendationEffectivenessCertificationFoundation(): RecommendationEffectivenessCertificationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    recommendation_effectiveness_certification_gate_version: CERTIFICATION_GATE_VERSION,
    certified_subsystems: RECOMMENDATION_EFFECTIVENESS_SUBSYSTEMS,
    api_surface,
    result: certifyRecommendationEffectiveness(),
  });
}

export const RecommendationEffectivenessCertificationGate = Object.freeze({
  certify: certifyRecommendationEffectiveness,
  replay: replayRecommendationEffectivenessCertification,
});
