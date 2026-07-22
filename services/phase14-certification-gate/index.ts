import { runAdvisoryBoundaryValidation, validateAdvisoryBoundaryValidation } from "@/services/advisory-boundary-validation";
import { runAssuranceDependencyGovernance, validateAssuranceDependencyGovernance } from "@/services/assurance-dependency-governance";
import { runCertificationLineageSupersession, validateCertificationLineageSupersession } from "@/services/certification-lineage-supersession";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runObservabilityOperations, validateObservabilityOperations } from "@/services/observability-operations";
import { replayReplayIntegrityExplainability, runReplayIntegrityExplainability, validateReplayIntegrityExplainability } from "@/services/replay-integrity-explainability";
import { runScaleStressResilienceValidation, validateScaleStressResilienceValidation } from "@/services/scale-stress-resilience-validation";
import { runSyntheticEnvironmentArchitecture, validateSyntheticEnvironmentArchitecture } from "@/services/synthetic-environment-architecture";
import { runSyntheticIdentityDataGeneration, validateSyntheticIdentityDataGeneration } from "@/services/synthetic-identity-data-generation";
import { runSyntheticScenarioOrchestration, validateSyntheticScenarioOrchestration } from "@/services/synthetic-scenario-orchestration";
import { runSyntheticValidationFoundation, validateSyntheticValidationFoundation } from "@/services/synthetic-validation-foundation";
import { runTenantIsolationValidation, validateTenantIsolationValidation } from "@/services/tenant-isolation-validation";
import type {
  Phase14Capability,
  Phase14CertificationBundle,
  Phase14CertificationFailure,
  Phase14CertificationInput,
  Phase14CertificationOutcome,
  Phase14CertificationRecord,
  Phase14CertificationResult,
  Phase14CertificationTest,
  Phase14CertificationValidation,
  Phase14EvidenceCategory,
  Phase14CertificationLifecycleState,
} from "@/types/phase14-certification-gate";

const VERSION = "phase14-certification-gate/v14.12" as const;
const IDENTIFIER = "Phase14CertificationGate" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_phase_14_synthetic_validation" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly Phase14CertificationFailure[], failure: Phase14CertificationFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: Phase14CertificationInput["scenario"]): Phase14CertificationFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly Phase14CertificationFailure[]): Phase14CertificationOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_CERTIFICATION_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycle = freezeArray(["REGISTERED", "EVIDENCE_AGGREGATED", "DEPENDENCY_VALIDATED", "LINEAGE_VALIDATED", "REPLAY_VALIDATED", "GOVERNANCE_VALIDATED", "OPERATIONS_VALIDATED", "DECIDED", "CERTIFIED", "BLOCKED"] as const satisfies readonly Phase14CertificationLifecycleState[]);
const scope = freezeArray(["Synthetic Validation Foundation", "Environment Architecture", "Synthetic Identity Generation", "Scenario Orchestration", "Tenant Isolation Validation", "Advisory Boundary Validation", "Scale & Resilience Validation", "Assurance Dependency Governance", "Certification Lineage", "Replay & Integrity", "Operational Monitoring"] as const satisfies readonly Phase14Capability[]);
const evidenceCategories = freezeArray(["VALIDATION", "DEPENDENCY", "LINEAGE", "REPLAY", "INTEGRITY", "EXPLAINABILITY", "GOVERNANCE", "TENANT_ISOLATION", "ADVISORY_BOUNDARY", "OPERATIONS"] as const satisfies readonly Phase14EvidenceCategory[]);

function certTest(name: string, passed: boolean, failure: Phase14CertificationFailure, evidence_refs: readonly string[]): Phase14CertificationTest {
  const actual: Phase14CertificationOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_CERTIFICATION_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("phase14_certification_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<Phase14CertificationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ contract: result.contract.integrity_hash, evidence: result.evidence_binder.integrity_hash, dependency: result.dependency_certification.integrity_hash, lineage: result.lineage_certification.integrity_hash, replay: result.replay_certification.integrity_hash, governance: result.governance_certification.integrity_hash, operations: result.operational_readiness.integrity_hash, tests: result.certification_tests.map((t) => t.integrity_hash), record: result.certification_record.integrity_hash, outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<Phase14CertificationResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runPhase14CertificationGate(input: Phase14CertificationInput = {}): Phase14CertificationResult {
  const foundation = runSyntheticValidationFoundation();
  const environment = runSyntheticEnvironmentArchitecture();
  const identity = runSyntheticIdentityDataGeneration();
  const orchestration = runSyntheticScenarioOrchestration();
  const tenant = runTenantIsolationValidation({ tenant_id: input.tenant_id ?? DEFAULT_TENANT });
  const advisory = runAdvisoryBoundaryValidation({ tenant_id: input.tenant_id ?? DEFAULT_TENANT });
  const scale = runScaleStressResilienceValidation();
  const dependency = runAssuranceDependencyGovernance({ dependency_status: "VERIFIED_COMPATIBLE" });
  const lineage = runCertificationLineageSupersession({ tenant_id: input.tenant_id ?? DEFAULT_TENANT });
  const replay = runReplayIntegrityExplainability();
  const operations = runObservabilityOperations({ tenant_id: input.tenant_id ?? DEFAULT_TENANT });
  const validations = {
    foundation: validateSyntheticValidationFoundation(foundation),
    environment: validateSyntheticEnvironmentArchitecture(environment),
    identity: validateSyntheticIdentityDataGeneration(identity),
    orchestration: validateSyntheticScenarioOrchestration(orchestration),
    tenant: validateTenantIsolationValidation(tenant),
    advisory: validateAdvisoryBoundaryValidation(advisory),
    scale: validateScaleStressResilienceValidation(scale),
    dependency: validateAssuranceDependencyGovernance(dependency),
    lineage: validateCertificationLineageSupersession(lineage),
    replay: validateReplayIntegrityExplainability(replay),
    operations: validateObservabilityOperations(operations),
  };
  const direct = directFailure(input.scenario);
  const upstreamFailure: Phase14CertificationFailure[] = Object.values(validations).every((validation) => validation.valid) ? [] : ["INTEGRITY_NOT_VERIFIED"];
  const failures = freezeArray([...new Set([...upstreamFailure, ...(direct ? [direct] : [])])]);
  const tenant_id = input.tenant_id ?? DEFAULT_TENANT;
  const evidenceRefs = freezeArray([foundation.integrity_hash, environment.integrity_hash, identity.integrity_hash, orchestration.integrity_hash, tenant.integrity_hash, advisory.integrity_hash, scale.integrity_hash, dependency.integrity_hash, lineage.integrity_hash, replay.integrity_hash, operations.integrity_hash]);
  const validationRefs = freezeArray(Object.values(validations).map((validation) => validation.integrity_hash));
  const dependencyManifestRefs = has(failures, "UNVERIFIED_DEPENDENCY_SATISFIED_CERTIFICATION") ? freezeArray(dependency.manifests.map((manifest) => manifest.dependency_id)) : freezeArray(dependency.manifests.filter((manifest) => manifest.dependency_status === "VERIFIED_COMPATIBLE").map((manifest) => manifest.manifest_id));
  const contract = nested({ contract_version: VERSION, certification_authority: "CONSTITUTIONAL_CERTIFICATION_ENGINE" as const, lifecycle, certification_scope: scope, required_evidence: evidenceCategories, dependency_requirements_enforced: !has(failures, "PHASE_13_DEPENDENCY_GATE_NOT_ENFORCED"), replay_required: true, governance_required: true, advisory_only: !has(failures, "ADVISORY_BOUNDARY_NOT_ENFORCED"), execution_authority: false as const });
  const evidence_binder = nested({ binder_id: id("phase14_evidence_binder", evidenceRefs), tenant_id, evidence_refs: evidenceRefs, validation_refs: has(failures, "SYNTHETIC_VALIDATION_CONTRACT_INVALID") ? validationRefs.slice(1) : validationRefs, dependency_refs: freezeArray([dependency.integrity_hash, dependency.promotion.integrity_hash, dependency.blocking.integrity_hash]), lineage_refs: freezeArray([lineage.integrity_hash, lineage.lineage_graph.integrity_hash]), replay_refs: freezeArray([replay.replay_hash, replay.execution.integrity_hash]), integrity_refs: has(failures, "INTEGRITY_NOT_VERIFIED") ? freezeArray([]) : freezeArray([replay.artifact_integrity.integrity_hash, operations.integrity_hash]), explainability_refs: has(failures, "EXPLAINABILITY_NOT_REPRODUCIBLE") ? freezeArray([]) : freezeArray([replay.explanation.integrity_hash]), governance_refs: freezeArray([tenant.governance.integrity_hash, advisory.governance.integrity_hash, dependency.integrity_hash]), operational_refs: freezeArray([operations.dashboard.integrity_hash, operations.integrity_hash]), deterministic_ordering: !has(failures, "ENVIRONMENT_QUALIFICATION_NON_DETERMINISTIC"), immutable: !has(failures, "BOUNDARY_VIOLATIONS_MUTABLE"), complete: !has(failures, "SYNTHETIC_VALIDATION_CONTRACT_INVALID") });
  const dependency_certification = nested({ validation_id: id("phase14_dependency_certification", dependency.integrity_hash), verified_compatible_manifest_refs: dependencyManifestRefs, candidate_dependency_refs: freezeArray(dependency.candidates.map((candidate) => candidate.candidate_dependency_id)), candidates_excluded_from_certification: !has(failures, "CANDIDATE_DEPENDENCY_REGISTER_UNGOVERNED") && !has(failures, "CANDIDATE_MANIFEST_ARTIFACTS_NOT_DISTINCT"), manifest_authority_deterministic: !has(failures, "MANIFEST_AUTHORITY_NON_DETERMINISTIC"), phase_13_gate_enforced: !has(failures, "PHASE_13_DEPENDENCY_GATE_NOT_ENFORCED"), unverified_dependencies_blocked: !has(failures, "UNVERIFIED_DEPENDENCY_SATISFIED_CERTIFICATION"), promotion_lineage_preserved: !has(failures, "DEPENDENCY_PROMOTION_LINEAGE_LOST"), dependency_gate_result: has(failures, "UNVERIFIED_DEPENDENCY_SATISFIED_CERTIFICATION") || has(failures, "PHASE_13_DEPENDENCY_GATE_NOT_ENFORCED") ? "FAIL" as const : "PASS" as const });
  const lineage_certification = nested({ validation_id: id("phase14_lineage_certification", lineage.integrity_hash), certification_lineage_refs: freezeArray([lineage.integrity_hash, lineage.lineage_graph.integrity_hash]), predecessor_certification_refs: has(failures, "SUCCESSOR_CERTIFICATION_MISSING_PREDECESSOR") ? freezeArray([]) : freezeArray(lineage.certification_attempts.map((attempt) => attempt.predecessor_certification_id).filter((ref): ref is string => Boolean(ref))), remediation_refs: freezeArray([lineage.remediation.integrity_hash]), production_effect_refs: has(failures, "PRODUCTION_EFFECT_ESCALATION_NOT_ENFORCED") ? freezeArray([]) : freezeArray([lineage.production_escalation.integrity_hash]), failed_certifications_visible: !has(failures, "FAILED_CERTIFICATION_NOT_PRESERVED"), successor_references_predecessor: !has(failures, "SUCCESSOR_CERTIFICATION_MISSING_PREDECESSOR"), immutable_history: !has(failures, "CERTIFICATION_LINEAGE_MUTABLE"), replay_refs_preserved: !has(failures, "REPLAY_NON_DETERMINISTIC") });
  const replay_certification = nested({ validation_id: id("phase14_replay_certification", replay.integrity_hash), replay_validation_refs: has(failures, "REPLAY_NON_DETERMINISTIC") ? freezeArray([]) : freezeArray([replay.replay_hash, replay.execution.integrity_hash]), integrity_validation_refs: has(failures, "INTEGRITY_NOT_VERIFIED") ? freezeArray([]) : freezeArray([replay.artifact_integrity.integrity_hash, validations.replay.integrity_hash]), explainability_refs: has(failures, "EXPLAINABILITY_NOT_REPRODUCIBLE") ? freezeArray([]) : freezeArray([replay.explanation.integrity_hash]), deterministic_replay: !has(failures, "REPLAY_NON_DETERMINISTIC") && replayReplayIntegrityExplainability(replay), integrity_verified: !has(failures, "INTEGRITY_NOT_VERIFIED") && replay.artifact_integrity.integrity_state === "VERIFIED", explainability_reproducible: !has(failures, "EXPLAINABILITY_NOT_REPRODUCIBLE") && replay.explanation.reproducible, certification_decision_replayable: !has(failures, "REPLAY_NON_DETERMINISTIC") });
  const governance_certification = nested({ validation_id: id("phase14_governance_certification", advisory.integrity_hash), governance_validation_refs: freezeArray([tenant.governance.integrity_hash, advisory.governance.integrity_hash, dependency.integrity_hash]), tenant_isolation_refs: has(failures, "TENANT_ISOLATION_NOT_ENFORCED") ? freezeArray([]) : freezeArray([tenant.integrity_hash, tenant.validation_record.integrity_hash]), advisory_boundary_refs: has(failures, "ADVISORY_BOUNDARY_NOT_ENFORCED") ? freezeArray([]) : freezeArray([advisory.integrity_hash, advisory.validation.integrity_hash]), constitutional_compliance: !has(failures, "ADVISORY_BOUNDARY_NOT_ENFORCED"), governance_enforced: !has(failures, "PHASE_13_DEPENDENCY_GATE_NOT_ENFORCED"), tenant_isolation_enforced: !has(failures, "TENANT_ISOLATION_NOT_ENFORCED"), advisory_only_enforced: !has(failures, "ADVISORY_BOUNDARY_NOT_ENFORCED"), execution_authority_prohibited: !has(failures, "ADVISORY_BOUNDARY_NOT_ENFORCED") });
  const operational_readiness = nested({ validation_id: id("phase14_operational_readiness", operations.integrity_hash), operational_monitoring_refs: has(failures, "OPERATIONAL_MONITORING_INCOMPLETE") ? freezeArray([]) : freezeArray([operations.dashboard.integrity_hash, ...operations.monitors.map((monitor) => monitor.integrity_hash)]), dashboard_complete: !has(failures, "OPERATIONAL_MONITORING_INCOMPLETE") && operations.dashboard.views.length === 10, alerts_configured: !has(failures, "OPERATIONAL_MONITORING_INCOMPLETE") && operations.alerts.length === 10, runbooks_complete: !has(failures, "OPERATIONAL_MONITORING_INCOMPLETE") && operations.runbooks.length === 10, replay_monitoring_complete: !has(failures, "OPERATIONAL_MONITORING_INCOMPLETE"), dependency_monitoring_complete: !has(failures, "OPERATIONAL_MONITORING_INCOMPLETE"), certification_monitoring_complete: !has(failures, "OPERATIONAL_MONITORING_INCOMPLETE"), readiness_verified: !has(failures, "OPERATIONAL_MONITORING_INCOMPLETE") });
  const tests = freezeArray([
    certTest("Synthetic Validation Contract valid", validations.foundation.valid && !has(failures, "SYNTHETIC_VALIDATION_CONTRACT_INVALID"), "SYNTHETIC_VALIDATION_CONTRACT_INVALID", [foundation.integrity_hash]),
    certTest("Environment qualification deterministic", validations.environment.valid && !has(failures, "ENVIRONMENT_QUALIFICATION_NON_DETERMINISTIC"), "ENVIRONMENT_QUALIFICATION_NON_DETERMINISTIC", [environment.integrity_hash]),
    certTest("Synthetic identity reproducible", validations.identity.valid && !has(failures, "SYNTHETIC_IDENTITY_NOT_REPRODUCIBLE"), "SYNTHETIC_IDENTITY_NOT_REPRODUCIBLE", [identity.integrity_hash]),
    certTest("Tenant isolation enforced", governance_certification.tenant_isolation_enforced && validations.tenant.valid, "TENANT_ISOLATION_NOT_ENFORCED", [tenant.integrity_hash]),
    certTest("Advisory boundary enforced", governance_certification.advisory_only_enforced && validations.advisory.valid, "ADVISORY_BOUNDARY_NOT_ENFORCED", [advisory.integrity_hash]),
    certTest("Boundary violations immutable", evidence_binder.immutable, "BOUNDARY_VIOLATIONS_MUTABLE", [advisory.violations[0]?.integrity_hash ?? advisory.integrity_hash]),
    certTest("Candidate Dependency Register governed", dependency_certification.candidates_excluded_from_certification, "CANDIDATE_DEPENDENCY_REGISTER_UNGOVERNED", [dependency.candidates[0]?.integrity_hash ?? dependency.integrity_hash]),
    certTest("Candidate and manifest artifacts distinct", dependency_certification.candidates_excluded_from_certification && dependency.candidates[0]?.candidate_dependency_id !== dependency.manifests[0]?.manifest_id, "CANDIDATE_MANIFEST_ARTIFACTS_NOT_DISTINCT", [dependency.integrity_hash]),
    certTest("Dependency promotion lineage preserved", dependency_certification.promotion_lineage_preserved && dependency.promotion.candidate_history_preserved, "DEPENDENCY_PROMOTION_LINEAGE_LOST", [dependency.promotion.integrity_hash]),
    certTest("Manifest authority deterministic", dependency_certification.manifest_authority_deterministic && dependency.manifests.every((manifest) => manifest.governance_validation), "MANIFEST_AUTHORITY_NON_DETERMINISTIC", dependency.manifests.map((manifest) => manifest.integrity_hash)),
    certTest("Phase 13 dependency gate enforced", dependency_certification.phase_13_gate_enforced && dependency.blocking.certification_gate_enforced, "PHASE_13_DEPENDENCY_GATE_NOT_ENFORCED", [dependency.blocking.integrity_hash]),
    certTest("Unverified dependencies cannot satisfy certification", dependency_certification.unverified_dependencies_blocked && dependency.manifests.every((manifest) => manifest.dependency_status === "VERIFIED_COMPATIBLE"), "UNVERIFIED_DEPENDENCY_SATISFIED_CERTIFICATION", dependency.manifests.map((manifest) => manifest.integrity_hash)),
    certTest("Certification lineage immutable", lineage_certification.immutable_history && lineage.lineage_graph.failed_certifications_visible, "CERTIFICATION_LINEAGE_MUTABLE", [lineage.lineage_graph.integrity_hash]),
    certTest("Failed certification preserved after remediation", lineage_certification.failed_certifications_visible, "FAILED_CERTIFICATION_NOT_PRESERVED", lineage.certification_attempts.map((attempt) => attempt.integrity_hash)),
    certTest("Successor certification references predecessor", lineage_certification.successor_references_predecessor && lineage_certification.predecessor_certification_refs.length > 0, "SUCCESSOR_CERTIFICATION_MISSING_PREDECESSOR", [lineage.supersession.integrity_hash]),
    certTest("Production-effect escalation enforced", lineage_certification.production_effect_refs.length > 0, "PRODUCTION_EFFECT_ESCALATION_NOT_ENFORCED", [lineage.production_escalation.integrity_hash]),
    certTest("Replay deterministic", replay_certification.deterministic_replay, "REPLAY_NON_DETERMINISTIC", [replay.replay_hash]),
    certTest("Integrity verified", replay_certification.integrity_verified && evidence_binder.integrity_refs.length > 0, "INTEGRITY_NOT_VERIFIED", [replay.artifact_integrity.integrity_hash]),
    certTest("Explainability reproducible", replay_certification.explainability_reproducible && replay_certification.explainability_refs.length > 0, "EXPLAINABILITY_NOT_REPRODUCIBLE", [replay.explanation.integrity_hash]),
    certTest("Operational monitoring complete", operational_readiness.readiness_verified && validations.operations.valid, "OPERATIONAL_MONITORING_INCOMPLETE", [operations.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is Phase14CertificationFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const certification_conditions = outcome === "CONDITIONAL_PASS" ? freezeArray(["Resolve non-constitutional certification warnings before advancement."]) : freezeArray([] as string[]);
  const record: Phase14CertificationRecord = nested({ certification_id: id("phase14_certification", evidenceRefs), certification_version: VERSION, phase_version: "Phase 14" as const, certification_timestamp: TIMESTAMP, certification_outcome: outcome, certification_scope: scope, validation_summary: freezeArray(scope.map((capability) => `${capability}: ${outcome === "PASS" ? "certified" : "evaluated"}`)), dependency_manifest_refs: dependencyManifestRefs, dependency_gate_result: dependency_certification.dependency_gate_result, replay_validation_refs: replay_certification.replay_validation_refs, integrity_validation_refs: replay_certification.integrity_validation_refs, explainability_refs: replay_certification.explainability_refs, governance_validation_refs: governance_certification.governance_validation_refs, tenant_isolation_refs: governance_certification.tenant_isolation_refs, advisory_boundary_refs: governance_certification.advisory_boundary_refs, certification_lineage_refs: lineage_certification.certification_lineage_refs, predecessor_certification_refs: lineage_certification.predecessor_certification_refs, remediation_refs: lineage_certification.remediation_refs, production_effect_refs: lineage_certification.production_effect_refs, operational_monitoring_refs: operational_readiness.operational_monitoring_refs, evidence_bundle_refs: freezeArray([evidence_binder.integrity_hash]), certification_decision: outcome, certification_reasoning: outcome === "PASS" ? "Phase 14 is certified for Mission Control pre-production synthetic validation." : "Phase 14 certification is blocked until all recorded conditions and failures are resolved.", certification_conditions });
  const base: Omit<Phase14CertificationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, contract, evidence_binder, dependency_certification, lineage_certification, replay_certification, governance_certification, operational_readiness, certification_tests: tests, certification_record: record, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validatePhase14CertificationGate(result = runPhase14CertificationGate()): Phase14CertificationValidation {
  const contract_valid = verify(result.contract) && result.contract.certification_scope.length === 11 && result.contract.required_evidence.length === 10 && result.contract.advisory_only && result.contract.execution_authority === false;
  const evidence_valid = verify(result.evidence_binder) && result.evidence_binder.complete && result.evidence_binder.immutable && result.evidence_binder.deterministic_ordering && result.evidence_binder.evidence_refs.length === 11;
  const dependency_valid = verify(result.dependency_certification) && result.dependency_certification.dependency_gate_result === "PASS" && result.dependency_certification.verified_compatible_manifest_refs.length > 0 && result.dependency_certification.candidates_excluded_from_certification && result.dependency_certification.phase_13_gate_enforced && result.dependency_certification.unverified_dependencies_blocked;
  const lineage_valid = verify(result.lineage_certification) && result.lineage_certification.immutable_history && result.lineage_certification.failed_certifications_visible && result.lineage_certification.successor_references_predecessor && result.lineage_certification.production_effect_refs.length > 0;
  const replay_valid = verify(result.replay_certification) && result.replay_certification.deterministic_replay && result.replay_certification.integrity_verified && result.replay_certification.explainability_reproducible && result.replay_certification.certification_decision_replayable && resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const governance_valid = verify(result.governance_certification) && result.governance_certification.constitutional_compliance && result.governance_certification.governance_enforced && result.governance_certification.tenant_isolation_enforced && result.governance_certification.advisory_only_enforced && result.governance_certification.execution_authority_prohibited;
  const operations_valid = verify(result.operational_readiness) && result.operational_readiness.readiness_verified && result.operational_readiness.dashboard_complete && result.operational_readiness.alerts_configured && result.operational_readiness.runbooks_complete;
  const certification_valid = result.certification_tests.length === 20 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const record_valid = verify(result.certification_record) && result.certification_record.certification_decision === result.outcome && result.certification_record.evidence_bundle_refs.length > 0 && result.certification_record.replay_validation_refs.length > 0 && result.certification_record.certification_lineage_refs.length > 0;
  const valid = result.outcome === "PASS" && contract_valid && evidence_valid && dependency_valid && lineage_valid && replay_valid && governance_valid && operations_valid && certification_valid && record_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, evidence_valid, dependency_valid, lineage_valid, replay_valid, governance_valid, operations_valid, certification_valid, record_valid, failures: result.failures });
}

export function replayPhase14CertificationGate(result = runPhase14CertificationGate()): boolean {
  const replayed = runPhase14CertificationGate({ tenant_id: result.evidence_binder.tenant_id });
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validatePhase14CertificationGate(result).valid;
}

export function getPhase14CertificationGateBundle(): Phase14CertificationBundle {
  const result = runPhase14CertificationGate();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, scope, evidence_categories: evidenceCategories, lifecycle, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validatePhase14CertificationGate(result) });
}

export const Phase14CertificationGateService = Object.freeze({ run: runPhase14CertificationGate, validate: validatePhase14CertificationGate, replay: replayPhase14CertificationGate });
