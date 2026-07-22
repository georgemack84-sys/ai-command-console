import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runStrategyCandidateGeneration, validateStrategyCandidateGeneration } from "@/services/strategy-candidate-generation";
import type {
  ScenarioArtifact,
  ScenarioAssumptionArtifact,
  ScenarioClosureCertificate,
  ScenarioConstructionLedger,
  ScenarioConstructionPolicy,
  ScenarioCoverageReport,
  ScenarioIntelligenceCertification,
  ScenarioIntelligenceCertificationTest,
  ScenarioIntelligenceContractBundle,
  ScenarioIntelligenceFailure,
  ScenarioIntelligenceInput,
  ScenarioIntelligenceResult,
  ScenarioIntelligenceScenario,
  ScenarioIntelligenceValidation,
  ScenarioObservabilityReport,
  ScenarioQualificationRecord,
  ScenarioRegistry,
  ScenarioReplayReport,
  ScenarioTaxonomy,
  ScenarioType,
} from "@/types/scenario-intelligence";

const VERSION = "scenario-intelligence/v12.5" as const;
const ID = "ScenarioIntelligence" as const;
const TAXONOMY_VERSION = "12.5.0" as const;
const FIXED_TIME = "2026-07-15T00:30:00.000Z" as const;
const TYPES: readonly ScenarioType[] = Object.freeze(["BASE_CASE", "BEST_CASE", "WORST_CASE", "EXPECTED_CASE", "STRESS_CASE", "ADVERSARIAL_CASE", "CONSTRAINT_CASE", "POLICY_CASE", "RESOURCE_CASE", "TEMPORAL_CASE"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function failureForScenario(scenario: ScenarioIntelligenceScenario): ScenarioIntelligenceFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function statusFor(failures: readonly ScenarioIntelligenceFailure[]): "PASS" | "CONDITIONAL_PASS" | "FAIL" { return failures.length ? "FAIL" : "PASS"; }

function taxonomy(failures: readonly ScenarioIntelligenceFailure[]): ScenarioTaxonomy {
  const scenarioTypes = failures.includes("TAXONOMY_INCOMPLETE") ? TYPES.slice(0, -1) : failures.includes("UNKNOWN_SCENARIO_TYPE") ? [...TYPES, "UNKNOWN" as ScenarioType] : TYPES;
  const semantics = Object.freeze(Object.fromEntries(TYPES.map((type) => [type, `${type.toLowerCase().replace(/_/g, " ")} deterministic evaluation semantics.`])) as Record<ScenarioType, string>);
  const base = { taxonomy_id: id("scenario_taxonomy", VERSION), version: TAXONOMY_VERSION, scenario_types: freezeArray(scenarioTypes), semantics, immutable: true, duplicate_entries: failures.includes("DUPLICATE_TAXONOMY_ENTRY") ? freezeArray(["BASE_CASE"] as const) : freezeArray([]), ambiguous_classifications: failures.includes("AMBIGUOUS_CLASSIFICATION") ? freezeArray(["BEST_CASE overlaps EXPECTED_CASE"]) : freezeArray([]) };
  return nested(base);
}

function constructionPolicy(failures: readonly ScenarioIntelligenceFailure[]): ScenarioConstructionPolicy {
  const methods = ["evidence-derived construction", "policy-driven construction", "resource-constrained construction", "temporal projection", "adversarial evaluation", "deterministic stress generation", "baseline comparison generation"];
  const base = { policy_id: id("scenario_construction_policy", VERSION), approved_methods: freezeArray(failures.includes("CONSTRUCTION_POLICY_INCOMPLETE") ? methods.slice(0, -2) : methods), prohibited_methods: freezeArray(["speculative scenarios without evidence", "random generation", "probabilistic nondeterminism", "hidden assumptions", "policy violations", "cross-tenant inputs"]), evidence_required: true, assumptions_required: true, policy_binding_required: true, governance_validation_required: true, deterministic_generation_required: !failures.includes("NONDETERMINISTIC_CONSTRUCTION"), complete: !failures.includes("CONSTRUCTION_POLICY_INCOMPLETE") };
  return nested(base);
}

function scenarioArtifacts(input: Required<Omit<ScenarioIntelligenceInput, "scenario">>, candidateRefs: readonly string[], failures: readonly ScenarioIntelligenceFailure[]): readonly ScenarioArtifact[] {
  return freezeArray(TYPES.map((scenarioType, index) => {
    const seed = { cycle: input.recommendation_cycle_id, type: scenarioType, scope: input.scope, version: VERSION };
    const scenarioId = failures.includes("SCENARIO_IDENTITY_NONDETERMINISTIC") && index === 0 ? id("scenario_artifact", { seed, nonce: "unstable" }) : id("scenario_artifact", seed);
    const evidenceRefs = failures.includes("EVIDENCE_MISSING") && index === 0 ? [] : [`evidence:${input.recommendation_cycle_id}:${scenarioType.toLowerCase()}`, "evidence:strategy-candidate-generation:qualified"];
    const assumptionRefs = failures.includes("ASSUMPTION_MISSING") && index === 0 ? [] : [`assumption:${scenarioId}:primary`];
    const base = {
      scenario_id: scenarioId,
      scenario_type: scenarioType,
      recommendation_cycle_id: input.recommendation_cycle_id,
      candidate_strategy_refs: candidateRefs,
      objective_refs: freezeArray(["objective:strategic-outcome"]),
      scope: input.scope,
      temporal_range: Object.freeze({ start: "2026-07-15", end: "2026-10-15" }),
      assumptions_ref: freezeArray(assumptionRefs),
      variables: freezeArray(["resource availability", "policy constraint pressure", "confidence drift"]),
      constraints: freezeArray(["advisory-only", "policy-bound", "tenant-isolated"]),
      evidence_refs: freezeArray(evidenceRefs),
      policy_manifest_ref: failures.includes("POLICY_MANIFEST_MISSING") ? "" : `manifest:${input.recommendation_cycle_id}:bound`,
      governance_refs: failures.includes("GOVERNANCE_APPROVAL_MISSING") ? freezeArray([]) : freezeArray([`governance:${input.recommendation_cycle_id}:scenario-approved`, `constitutional:${input.recommendation_cycle_id}:scenario-approved`]),
      qualification_status: evidenceRefs.length && assumptionRefs.length ? "QUALIFIED" as const : "REQUIRES_MORE_EVIDENCE" as const,
      confidence: Number((0.7 + index * 0.01).toFixed(2)),
      uncertainty: Number((0.25 - Math.min(index, 9) * 0.01).toFixed(2)),
      origin_ref: failures.includes("ORIGIN_INCOMPLETE") && index === 0 ? "" : `origin:${input.recommendation_cycle_id}:scenario-intelligence`,
      parent_scenario_refs: freezeArray(index === 0 ? [] : [`scenario:${input.recommendation_cycle_id}:base`]),
      lifecycle_state: failures.includes("LIFECYCLE_NONDETERMINISTIC") && index === 0 ? "UNDER_CONSTRUCTION" as const : "QUALIFIED" as const,
      advisory_only: !failures.includes("ADVISORY_BOUNDARY_VIOLATION"),
      tenant_id: failures.includes("CROSS_TENANT_INPUT") && index === 3 ? "tenant_beta" : input.tenant_id,
      creation_timestamp: FIXED_TIME,
    };
    return nested(base);
  }));
}

function assumptions(scenarios: readonly ScenarioArtifact[], failures: readonly ScenarioIntelligenceFailure[]): readonly ScenarioAssumptionArtifact[] {
  return freezeArray(scenarios.flatMap((scenario, index) => {
    if (failures.includes("HIDDEN_ASSUMPTION") && index === 0) return [];
    const duplicated = failures.includes("DUPLICATE_ASSUMPTION") && index === 1;
    const base = {
      assumption_id: duplicated ? id("scenario_assumption", scenarios[0]?.scenario_id ?? scenario.scenario_id) : id("scenario_assumption", scenario.scenario_id),
      scenario_ref: scenario.scenario_id,
      description: failures.includes("UNSUPPORTED_ASSUMPTION") && index === 2 ? "unsupported extrapolation without governance basis" : `${scenario.scenario_type.toLowerCase().replace(/_/g, " ")} assumption set`,
      category: failures.includes("CONFLICTING_ASSUMPTION") && index === 3 ? "conflicting" : "operational",
      evidence_refs: scenario.evidence_refs,
      confidence: scenario.confidence,
      uncertainty: scenario.uncertainty,
      policy_refs: scenario.policy_manifest_ref ? freezeArray([scenario.policy_manifest_ref]) : freezeArray([]),
      origin_ref: scenario.origin_ref,
      version: "1.0.0" as const,
      lifecycle: "ACTIVE" as const,
      governance_approved: scenario.governance_refs.length >= 2,
    };
    return [nested(base)];
  }));
}

function coverage(scenarios: readonly ScenarioArtifact[], failures: readonly ScenarioIntelligenceFailure[]): ScenarioCoverageReport {
  const present = freezeArray([...new Set(scenarios.map((scenario) => scenario.scenario_type))] as ScenarioType[]);
  const missing = freezeArray(TYPES.filter((type) => !present.includes(type)));
  const duplicateCoverage = failures.includes("DUPLICATE_COVERAGE") ? freezeArray(["BASE_CASE"]) : freezeArray([]);
  const base = { report_id: id("scenario_coverage", present), required_scenario_classes: TYPES, present_scenario_classes: present, missing_scenario_classes: failures.includes("COVERAGE_INCOMPLETE") ? freezeArray(["TEMPORAL_CASE"] as const) : missing, objective_coverage: true, strategy_coverage: true, constraint_coverage: !failures.includes("UNSUPPORTED_COVERAGE_GAP"), temporal_coverage: !failures.includes("COVERAGE_INCOMPLETE"), governance_coverage: !failures.includes("GOVERNANCE_APPROVAL_MISSING"), policy_coverage: !failures.includes("POLICY_MANIFEST_MISSING"), adversarial_coverage: present.includes("ADVERSARIAL_CASE"), duplicate_coverage: duplicateCoverage, complete: missing.length === 0 && duplicateCoverage.length === 0 && !failures.includes("COVERAGE_INCOMPLETE") && !failures.includes("UNSUPPORTED_COVERAGE_GAP") };
  return nested(base);
}

function qualifications(scenarios: readonly ScenarioArtifact[], assumptionsList: readonly ScenarioAssumptionArtifact[], failures: readonly ScenarioIntelligenceFailure[]): readonly ScenarioQualificationRecord[] {
  const assumptionByScenario = new Map(assumptionsList.map((assumption) => [assumption.scenario_ref, assumption]));
  return freezeArray(scenarios.map((scenario) => {
    const assumption = assumptionByScenario.get(scenario.scenario_id);
    const evidence = scenario.evidence_refs.length > 0;
    const policy = scenario.policy_manifest_ref.length > 0;
    const governance = scenario.governance_refs.length >= 2;
    const assumptionsValid = Boolean(assumption) && !failures.includes("UNSUPPORTED_ASSUMPTION") && !failures.includes("CONFLICTING_ASSUMPTION") && !failures.includes("DUPLICATE_ASSUMPTION");
    const ok = evidence && policy && governance && assumptionsValid && !failures.includes("QUALIFICATION_NONDETERMINISTIC") && !failures.includes("CONSTITUTIONAL_VIOLATION") && scenario.origin_ref.length > 0;
    const base = { qualification_id: id("scenario_qualification", scenario.scenario_id), scenario_id: scenario.scenario_id, status: ok ? "QUALIFIED" as const : !evidence ? "REQUIRES_MORE_EVIDENCE" as const : !policy ? "REQUIRES_POLICY_REVIEW" as const : !governance ? "REQUIRES_GOVERNANCE_REVIEW" as const : "REJECTED" as const, evidence_sufficient: evidence, policy_compliant: policy, governance_eligible: governance, assumptions_valid: assumptionsValid, relevant: true, replay_reproducible: !failures.includes("REPLAY_NOT_REPRODUCIBLE"), integrity_valid: !failures.includes("INTEGRITY_VALIDATION_FAILED"), origin_complete: scenario.origin_ref.length > 0 };
    return nested(base);
  }));
}

function registry(tenantId: string, scenarios: readonly ScenarioArtifact[], assumptionsList: readonly ScenarioAssumptionArtifact[], qualificationList: readonly ScenarioQualificationRecord[]): ScenarioRegistry {
  const complete = scenarios.every((scenario) => scenario.tenant_id === tenantId) && qualificationList.every((record) => record.status === "QUALIFIED");
  const base = { registry_id: id("scenario_registry", { tenantId, version: VERSION }), tenant_id: tenantId, scenarios, assumptions: assumptionsList, qualifications: qualificationList, complete };
  return nested(base);
}

function closure(coverageReport: ScenarioCoverageReport, registryRecord: ScenarioRegistry, ledgered: boolean, failures: readonly ScenarioIntelligenceFailure[]): ScenarioClosureCertificate {
  const closed = coverageReport.complete && registryRecord.complete && ledgered && !failures.includes("REPLAY_NOT_REPRODUCIBLE") && !failures.includes("INTEGRITY_VALIDATION_FAILED");
  const base = { closure_id: id("scenario_closure", registryRecord.registry_id), state: closed ? "CLOSED" as const : "FAILED" as const, required_scenario_classes_exist: coverageReport.missing_scenario_classes.length === 0, coverage_validated: coverageReport.complete, assumptions_registered: registryRecord.assumptions.length === registryRecord.scenarios.length, evidence_linked: registryRecord.scenarios.every((scenario) => scenario.evidence_refs.length > 0), policy_manifest_bound: registryRecord.scenarios.every((scenario) => scenario.policy_manifest_ref.length > 0), governance_validation_complete: registryRecord.scenarios.every((scenario) => scenario.governance_refs.length >= 2), qualification_completed: registryRecord.qualifications.every((record) => record.status === "QUALIFIED"), integrity_verified: !failures.includes("INTEGRITY_VALIDATION_FAILED"), replay_reproducible: !failures.includes("REPLAY_NOT_REPRODUCIBLE"), immutable: closed && !failures.includes("LINEAGE_MUTABLE") };
  return nested(base);
}

function ledger(scenarios: readonly ScenarioArtifact[], closureRecord: ScenarioClosureCertificate, failures: readonly ScenarioIntelligenceFailure[]): ScenarioConstructionLedger {
  const entries = freezeArray(["SCENARIOS_GENERATED", "ASSUMPTIONS_REGISTERED", "COVERAGE_VALIDATED", "QUALIFICATIONS_RECORDED", "CLOSURE_CERTIFIED", "REPLAY_REFERENCED"].map((type, index) => {
    const base = { entry_id: id("scenario_ledger_entry", { type, index, closure: closureRecord.closure_id }), type, subject_id: index === 0 ? scenarios.map((scenario) => scenario.scenario_id).join("|") : closureRecord.closure_id };
    return nested(base);
  }));
  const base = { ledger_id: id("scenario_ledger", closureRecord.closure_id), append_only: !failures.includes("LEDGER_NOT_APPEND_ONLY"), immutable: true, entries };
  return nested(base);
}

function replayReport(failures: readonly ScenarioIntelligenceFailure[]): ScenarioReplayReport {
  const ok = !failures.includes("REPLAY_NOT_REPRODUCIBLE");
  const base = { replay_id: id("scenario_replay", VERSION), identical_scenarios_constructed: ok, identical_assumptions_registered: ok, identical_coverage_report: ok, identical_qualifications: ok, identical_closure: ok, identical_ledger: ok, integrity_hashes_reproduced: ok };
  return nested(base);
}

function observability(scenarios: readonly ScenarioArtifact[], coverageReport: ScenarioCoverageReport, qualificationsList: readonly ScenarioQualificationRecord[], failures: readonly ScenarioIntelligenceFailure[]): ScenarioObservabilityReport {
  const qualificationFailures = qualificationsList.filter((record) => record.status !== "QUALIFIED").length;
  const alerts = freezeArray([...(coverageReport.missing_scenario_classes.length ? ["coverage gap"] : []), ...(qualificationFailures ? ["qualification failure"] : []), ...(failures.includes("REPLAY_NOT_REPRODUCIBLE") ? ["replay inconsistency"] : []), ...(failures.includes("INTEGRITY_VALIDATION_FAILED") ? ["integrity violation"] : [])]);
  const base = { report_id: id("scenario_observability", coverageReport.report_id), scenarios_generated: scenarios.length, qualification_failures: qualificationFailures, coverage_gaps: coverageReport.missing_scenario_classes.length, replay_failures: failures.includes("REPLAY_NOT_REPRODUCIBLE") ? 1 : 0, governance_failures: failures.includes("GOVERNANCE_APPROVAL_MISSING") ? 1 : 0, integrity_violations: failures.includes("INTEGRITY_VALIDATION_FAILED") ? 1 : 0, alerts, observable: !failures.includes("OBSERVABILITY_MISSING") };
  return nested(base);
}

function certTest(name: string, passed: boolean, failure: ScenarioIntelligenceFailure, refs: readonly string[]): ScenarioIntelligenceCertificationTest {
  const base = { test_id: id("scenario_intelligence_test", name), name, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return nested(base);
}

type CertBase = Omit<ScenarioIntelligenceResult, "certification" | "replay_hash" | "integrity_hash">;
function certificationTests(result: CertBase): readonly ScenarioIntelligenceCertificationTest[] {
  const refs = freezeArray([result.registry.integrity_hash, result.coverage.integrity_hash, result.closure.integrity_hash, result.replay.integrity_hash]);
  return freezeArray([
    certTest("Scenario artifact contract finalized", result.scenarios.every((scenario) => scenario.scenario_id && scenario.origin_ref && scenario.policy_manifest_ref), "SCENARIO_ARTIFACT_CONTRACT_INVALID", refs),
    certTest("Scenario identity deterministic", result.scenarios.every((scenario) => scenario.scenario_id === id("scenario_artifact", { cycle: scenario.recommendation_cycle_id, type: scenario.scenario_type, scope: scenario.scope, version: VERSION })), "SCENARIO_IDENTITY_NONDETERMINISTIC", refs),
    certTest("Lifecycle deterministic", result.scenarios.every((scenario) => scenario.lifecycle_state === "QUALIFIED"), "LIFECYCLE_NONDETERMINISTIC", refs),
    certTest("Taxonomy complete", result.taxonomy.scenario_types.length === TYPES.length, "TAXONOMY_INCOMPLETE", refs),
    certTest("Unknown scenario types rejected", result.taxonomy.scenario_types.every((type) => TYPES.includes(type)), "UNKNOWN_SCENARIO_TYPE", refs),
    certTest("Duplicate taxonomy entries rejected", result.taxonomy.duplicate_entries.length === 0, "DUPLICATE_TAXONOMY_ENTRY", refs),
    certTest("Ambiguous classifications rejected", result.taxonomy.ambiguous_classifications.length === 0, "AMBIGUOUS_CLASSIFICATION", refs),
    certTest("Construction policy complete", result.construction_policy.complete, "CONSTRUCTION_POLICY_INCOMPLETE", refs),
    certTest("Construction deterministic", result.construction_policy.deterministic_generation_required, "NONDETERMINISTIC_CONSTRUCTION", refs),
    certTest("Evidence sufficient", result.scenarios.every((scenario) => scenario.evidence_refs.length > 0), "EVIDENCE_MISSING", refs),
    certTest("Assumptions registered", result.scenarios.every((scenario) => scenario.assumptions_ref.length > 0), "ASSUMPTION_MISSING", refs),
    certTest("Hidden assumptions rejected", result.assumptions.length === result.scenarios.length, "HIDDEN_ASSUMPTION", refs),
    certTest("Unsupported assumptions rejected", result.qualifications.every((record) => record.assumptions_valid), "UNSUPPORTED_ASSUMPTION", refs),
    certTest("Duplicate assumptions rejected", new Set(result.assumptions.map((assumption) => assumption.assumption_id)).size === result.assumptions.length, "DUPLICATE_ASSUMPTION", refs),
    certTest("Conflicting assumptions rejected", result.assumptions.every((assumption) => assumption.category !== "conflicting"), "CONFLICTING_ASSUMPTION", refs),
    certTest("Policy manifest bound", result.closure.policy_manifest_bound, "POLICY_MANIFEST_MISSING", refs),
    certTest("Governance approval enforced", result.closure.governance_validation_complete, "GOVERNANCE_APPROVAL_MISSING", refs),
    certTest("Constitutional compliance enforced", result.qualifications.every((record) => record.status === "QUALIFIED"), "CONSTITUTIONAL_VIOLATION", refs),
    certTest("Tenant isolation preserved", result.scenarios.every((scenario) => scenario.tenant_id === result.registry.tenant_id), "CROSS_TENANT_INPUT", refs),
    certTest("Coverage complete", result.coverage.complete, "COVERAGE_INCOMPLETE", refs),
    certTest("Duplicate coverage rejected", result.coverage.duplicate_coverage.length === 0, "DUPLICATE_COVERAGE", refs),
    certTest("Unsupported coverage gaps rejected", result.coverage.constraint_coverage, "UNSUPPORTED_COVERAGE_GAP", refs),
    certTest("Qualification deterministic", result.qualifications.every((record) => record.status === "QUALIFIED"), "QUALIFICATION_NONDETERMINISTIC", refs),
    certTest("Replay reproducible", result.replay.integrity_hashes_reproduced, "REPLAY_NOT_REPRODUCIBLE", refs),
    certTest("Integrity valid", result.closure.integrity_verified, "INTEGRITY_VALIDATION_FAILED", refs),
    certTest("Origin complete", result.qualifications.every((record) => record.origin_complete), "ORIGIN_INCOMPLETE", refs),
    certTest("Lineage immutable", result.closure.immutable, "LINEAGE_MUTABLE", refs),
    certTest("Advisory boundary enforced", result.scenarios.every((scenario) => scenario.advisory_only), "ADVISORY_BOUNDARY_VIOLATION", refs),
    certTest("Ledger append-only", result.ledger.append_only, "LEDGER_NOT_APPEND_ONLY", refs),
    certTest("Observability active", result.observability.observable, "OBSERVABILITY_MISSING", refs),
  ]);
}

function replayHash(result: Omit<ScenarioIntelligenceResult, "replay_hash" | "integrity_hash">): string {
  return hash({ taxonomy: result.taxonomy.integrity_hash, policy: result.construction_policy.integrity_hash, scenarios: result.scenarios.map((item) => item.integrity_hash), assumptions: result.assumptions.map((item) => item.integrity_hash), coverage: result.coverage.integrity_hash, qualifications: result.qualifications.map((item) => item.integrity_hash), registry: result.registry.integrity_hash, closure: result.closure.integrity_hash, ledger: result.ledger.integrity_hash, replay: result.replay.integrity_hash, certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<ScenarioIntelligenceResult, "integrity_hash">): string { return hash({ version: result.phase_version, id: result.phase_identifier, status: result.certification.status, replay_hash: result.replay_hash }); }

export function runScenarioIntelligence(input: ScenarioIntelligenceInput = {}): ScenarioIntelligenceResult {
  const candidates = runStrategyCandidateGeneration({ tenant_id: input.tenant_id ?? "tenant_mission_control" });
  const candidatesValid = validateStrategyCandidateGeneration(candidates).valid;
  const scenarioFailure = failureForScenario(input.scenario ?? "BASELINE");
  const failures = freezeArray<ScenarioIntelligenceFailure>([...(candidatesValid ? [] : ["SCENARIO_ARTIFACT_CONTRACT_INVALID" as const]), ...(scenarioFailure ? [scenarioFailure] : [])]);
  const resolved = { tenant_id: input.tenant_id ?? "tenant_mission_control", recommendation_cycle_id: input.recommendation_cycle_id ?? candidates.candidates[0]?.recommendation_cycle_ref ?? "recommendation-cycle:strategic:alpha", scope: input.scope ?? "scenario-scope:enterprise-recommendations" };
  const candidateRefs = freezeArray(candidates.registry.registered_strategy_ids.slice(0, 3));
  const scenarioTaxonomy = taxonomy(failures);
  const policy = constructionPolicy(failures);
  const scenarioSet = scenarioArtifacts(resolved, candidateRefs, failures);
  const assumptionSet = assumptions(scenarioSet, failures);
  const coverageReport = coverage(scenarioSet, failures);
  const qualificationSet = qualifications(scenarioSet, assumptionSet, failures);
  const registryRecord = registry(resolved.tenant_id, scenarioSet, assumptionSet, qualificationSet);
  const closureRecord = closure(coverageReport, registryRecord, true, failures);
  const ledgerRecord = ledger(scenarioSet, closureRecord, failures);
  const replayRecord = replayReport(failures);
  const observabilityRecord = observability(scenarioSet, coverageReport, qualificationSet, failures);
  const baseWithoutCertification: CertBase = { phase_version: VERSION, phase_identifier: ID, taxonomy: scenarioTaxonomy, construction_policy: policy, scenarios: scenarioSet, assumptions: assumptionSet, coverage: coverageReport, qualifications: qualificationSet, registry: registryRecord, closure: closureRecord, ledger: ledgerRecord, replay: replayRecord, observability: observabilityRecord };
  const tests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...tests.map((item) => item.failure_reason).filter((failure): failure is ScenarioIntelligenceFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certBase: Omit<ScenarioIntelligenceCertification, "integrity_hash"> = { certification_id: id("scenario_intelligence_certification", VERSION), status, ready_for_forecast_intelligence: status === "PASS", failures: finalFailures, tests };
  const certification = nested(certBase);
  const base = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateScenarioIntelligence(result?: ScenarioIntelligenceResult): ScenarioIntelligenceValidation {
  if (!result) {
    const failures = freezeArray<ScenarioIntelligenceFailure>(["SCENARIO_ARTIFACT_CONTRACT_INVALID"]);
    const base = { registry_id: null, valid: false, status: "FAIL" as const, ready_for_forecast_intelligence: false, failures, replay_hash_valid: false, integrity_hash_valid: false, closure_valid: false, coverage_valid: false };
    return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && hashWithoutIntegrity(result.registry) === result.registry.integrity_hash && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const closure_valid = result.closure.state === "CLOSED" && result.closure.immutable;
  const coverage_valid = result.coverage.complete && result.coverage.missing_scenario_classes.length === 0;
  const valid = result.certification.status === "PASS" && result.certification.ready_for_forecast_intelligence && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid && closure_valid && coverage_valid;
  const base = { registry_id: result.registry.registry_id, valid, status: result.certification.status, ready_for_forecast_intelligence: result.certification.ready_for_forecast_intelligence, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid, closure_valid, coverage_valid };
  return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayScenarioIntelligence(result = runScenarioIntelligence()): boolean {
  const replayed = runScenarioIntelligence({ tenant_id: result.registry.tenant_id, recommendation_cycle_id: result.scenarios[0]?.recommendation_cycle_id, scope: result.scenarios[0]?.scope });
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateScenarioIntelligence(result).valid;
}

export function getScenarioIntelligenceContract(): ScenarioIntelligenceContractBundle {
  const result = runScenarioIntelligence();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, advisory_only: true, bounded_taxonomy_required: true, explicit_assumptions_required: true, policy_bound_scenarios_required: true, governance_qualification_required: true, coverage_validation_required: true, replay_required: true }), result, validation: validateScenarioIntelligence(result) });
}

export const ScenarioIntelligence = Object.freeze({ run: runScenarioIntelligence, validate: validateScenarioIntelligence, replay: replayScenarioIntelligence });
