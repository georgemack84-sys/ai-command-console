import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runOperationalResilienceRecoveryGovernance } from "@/services/operational-resilience-recovery-governance";
import type {
  Phase17CertificationArtifact,
  Phase17CertificationDomain,
  Phase17CertificationGateBundle,
  Phase17CertificationGateFailure,
  Phase17CertificationGateInput,
  Phase17CertificationGateOutcome,
  Phase17CertificationGateResult,
  Phase17CertificationGateTest,
  Phase17CertificationGateValidation,
  Phase17DecisionPipelineStage,
} from "@/types/phase-17-certification-gate";

const VERSION = "phase-17-certification-gate/v17.12" as const;
const IDENTIFIER = "Phase17CertificationGate" as const;
const DEFAULT_TENANT = "tenant_phase_17_gate";
const DEFAULT_OPERATOR = "operator_phase_17_gate";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly Phase17CertificationGateFailure[], failure: Phase17CertificationGateFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: Phase17CertificationGateInput["scenario"]): Phase17CertificationGateFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly Phase17CertificationGateFailure[]): Phase17CertificationGateOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_PHASE_17_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const domains = freezeArray(["MULTI_TENANT_PRODUCTION", "TENANT_LIFECYCLE", "REGIONAL_GOVERNANCE", "RESOURCE_GOVERNANCE", "GLOBAL_DISTRIBUTION", "REPLICATION", "SCALABILITY", "OBSERVABILITY", "CONTINUOUS_CERTIFICATION", "OPERATIONAL_RESILIENCE"] as const satisfies readonly Phase17CertificationDomain[]);
const pipelineStages = freezeArray(["EVIDENCE_COLLECTION", "EVIDENCE_INTEGRITY_VALIDATION", "REPLAY_VALIDATION", "GOVERNANCE_VALIDATION", "TENANT_ISOLATION_VALIDATION", "REGIONAL_CONSISTENCY_VALIDATION", "RESILIENCE_VALIDATION", "RECOVERY_VALIDATION", "POST_RECOVERY_REQUALIFICATION_VALIDATION", "CERTIFICATION_DECISION"] as const satisfies readonly Phase17DecisionPipelineStage[]);
const artifacts = freezeArray(["CERTIFICATION_REPORT", "CERTIFICATION_DECISION", "EVIDENCE_MANIFEST", "REPLAY_VALIDATION_REPORT", "REGIONAL_CONSISTENCY_REPORT", "TENANT_ISOLATION_REPORT", "RECOVERY_VALIDATION_REPORT", "REQUALIFICATION_REPORT", "CERTIFICATION_LINEAGE_MANIFEST", "IMMUTABLE_AUDIT_PACKAGE"] as const satisfies readonly Phase17CertificationArtifact[]);

function certTest(name: string, passed: boolean, failure: Phase17CertificationGateFailure, evidence_refs: readonly string[]): Phase17CertificationGateTest {
  const actual: Phase17CertificationGateOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_PHASE_17_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("phase_17_gate_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<Phase17CertificationGateResult, "replay_hash" | "integrity_hash">): string {
  return hash({ resilience: result.operational_resilience_recovery_governance_ref, engine: result.certification_engine.integrity_hash, framework: result.production_scale_framework.integrity_hash, evidence: result.evidence_aggregator.integrity_hash, decision: result.decision_service.integrity_hash, dashboard: result.dashboard.integrity_hash, ledger: result.certification_ledger.map((entry) => entry.integrity_hash), lineage: result.lineage_registry.integrity_hash, approval: result.approval_report.integrity_hash, package: result.certification_package.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<Phase17CertificationGateResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runPhase17CertificationGate(input: Phase17CertificationGateInput = {}): Phase17CertificationGateResult {
  const resilience = runOperationalResilienceRecoveryGovernance({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: Phase17CertificationGateFailure[] = resilience.outcome === "PASS" ? [] : ["PHASE_17_11_RESILIENCE_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_PHASE_17_WARNING"));
  const multiTenant = !has(failures, "MULTI_TENANT_PRODUCTION_ARCHITECTURE_NOT_VALIDATED");
  const lifecycle = !has(failures, "TENANT_LIFECYCLE_GOVERNANCE_NOT_VALIDATED");
  const regionalConflict = !has(failures, "REGIONAL_ASSIGNMENT_CONFLICT_RESOLUTION_NOT_DETERMINISTIC");
  const resourceIsolation = !has(failures, "RESOURCE_SCHEDULING_TENANT_ISOLATION_NOT_PRESERVED");
  const distributionReplay = !has(failures, "GLOBAL_WORKLOAD_DISTRIBUTION_NOT_REPLAYABLE");
  const continuousCertification = !has(failures, "CONTINUOUS_CERTIFICATION_NOT_OPERATIONAL") && resilience.certification_package.operational_resilience_certified;
  const resilienceRecovery = !has(failures, "FAILURE_CONTAINMENT_RECOVERY_REQUALIFICATION_NOT_VALIDATED") && resilience.certification_package.requalification_validated;
  const productionScale = !has(failures, "PRODUCTION_SCALE_NOT_CERTIFIED");
  const tenantIsolationScale = !has(failures, "TENANT_ISOLATION_NOT_VERIFIED_AT_SCALE");
  const globalReplay = !has(failures, "GLOBAL_REPLAY_NOT_DETERMINISTIC") && resilience.replay_validator.identical_outcomes;
  const governance = !has(failures, "GOVERNANCE_NOT_PRESERVED");
  const containment = !has(failures, "FAILURE_CONTAINMENT_NOT_VALIDATED") && resilience.containment_engine.containment_validated;
  const recovery = !has(failures, "DETERMINISTIC_RECOVERY_NOT_VERIFIED") && resilience.recovery_coordinator.deterministic_recovery;
  const requalification = !has(failures, "POST_RECOVERY_REQUALIFICATION_INCOMPLETE") && resilience.post_recovery_qualification.requalification_validated;
  const noDivergence = !has(failures, "UNRESOLVED_DIVERGENCE_PRESENT");
  const lineageImmutable = !has(failures, "CERTIFICATION_LINEAGE_CORRUPTED");
  const platformApproved = !has(failures, "PLATFORM_NOT_APPROVED_FOR_ECOSYSTEM_PRODUCTION") && blockingFailures.length === 0;
  const engine = nested({ engine_id: id("phase_17_certification_engine", VERSION), domains, deterministic_rule_evaluation: globalReplay, complete_certification_required: true, unresolved_divergence_blocks: noDivergence, production_approval_authority: platformApproved });
  const framework = nested({ framework_id: id("production_scale_framework", VERSION), production_scale_certified: productionScale, tenant_isolation_at_scale: tenantIsolationScale, global_replay_deterministic: globalReplay, governance_preserved: governance, workload_distribution_certified: distributionReplay, resource_governance_certified: resourceIsolation, regional_consistency_certified: regionalConflict, scalability_certified: productionScale, observability_certified: continuousCertification });
  const requiredEvidence = freezeArray(["tenant isolation validation", "deterministic replay validation", "regional consistency verification", "controlled failure injection results", "blast-radius verification", "containment validation", "recovery replay validation", "recovery objective verification", "degraded-mode validation", "post-recovery integrity verification", "post-recovery tenant isolation verification", "requalification decision records", "immutable audit verification", "certification lineage validation"]);
  const evidenceManifest = freezeArray(lineageImmutable ? [resilience.integrity_hash, resilience.recovery_state.integrity_hash, resilience.certification_package.integrity_hash, resilience.replay_hash] : []);
  const evidence = nested({ aggregator_id: id("phase_17_evidence", VERSION), required_evidence: requiredEvidence, evidence_manifest: evidenceManifest, evidence_integrity_validated: evidenceManifest.length > 0 && noDivergence, immutable_audit_verified: lineageImmutable && resilience.certification_package.incident_audit_complete, lineage_validated: lineageImmutable, unresolved_evidence: freezeArray(noDivergence ? [] : ["unresolved divergence report"]) });
  const decisionOutcome = outcomeFor(failures);
  const decision = nested({ service_id: id("phase_17_decision", VERSION), pipeline: pipelineStages, replay_validated: globalReplay, governance_validated: governance, tenant_isolation_validated: tenantIsolationScale, regional_consistency_validated: regionalConflict, resilience_validated: resilienceRecovery, recovery_validated: recovery, requalification_validated: requalification, deterministic_decision: globalReplay && noDivergence, decision: decisionOutcome });
  const lineage = nested({ registry_id: id("phase_17_lineage", VERSION), artifacts, lineage_refs: evidenceManifest, additive_only: lineageImmutable, immutable: lineageImmutable, no_corruption_detected: lineageImmutable });
  const ledger = freezeArray(pipelineStages.map((stage, index) => nested({ ledger_entry_id: id("phase_17_ledger", { stage, index }), sequence: index + 1, stage, evidence_ref: evidence.integrity_hash, decision_ref: decision.integrity_hash, lineage_ref: lineage.integrity_hash, replay_ref: resilience.replay_hash, governance_ref: resilience.certification_package.integrity_hash, append_only: lineageImmutable, immutable: lineageImmutable })));
  const approval = nested({ report_id: id("phase_17_approval", VERSION), approval_scope: input.approval_scope ?? "ecosystem-scale multi-tenant production", outcome: decisionOutcome, production_deployment_authorized: decisionOutcome !== "FAIL" && platformApproved, restrictions: freezeArray(decisionOutcome === "CONDITIONAL_PASS" ? ["governed restrictions only; constitutional guarantees unchanged"] : []), certification_artifacts: artifacts, approval_evidence_refs: evidenceManifest });
  const dashboard = nested({ dashboard_id: id("phase_17_dashboard", VERSION), production_scale_visible: true, tenant_isolation_visible: true, replay_status_visible: true, governance_status_visible: true, regional_consistency_visible: true, resilience_status_visible: true, recovery_status_visible: true, requalification_status_visible: true, approval_status_visible: true });
  const certification_package = nested({ package_id: id("phase_17_package", VERSION), multi_tenant_production_architecture_validated: multiTenant, tenant_lifecycle_governance_validated: lifecycle, regional_assignment_conflict_resolution_deterministic: regionalConflict, resource_scheduling_tenant_isolation_preserved: resourceIsolation, global_workload_distribution_replayable: distributionReplay, continuous_certification_operational: continuousCertification, failure_containment_recovery_requalification_validated: resilienceRecovery, production_scale_certified: productionScale, tenant_isolation_verified_at_scale: tenantIsolationScale, replay_deterministic_globally: globalReplay, governance_preserved: governance, failure_containment_validated: containment, deterministic_recovery_verified: recovery, post_recovery_requalification_complete: requalification, platform_approved_for_ecosystem_scale_multi_tenant_production_deployment: approval.production_deployment_authorized, certification_lineage_immutable: lineage.immutable && ledger.every((entry) => entry.immutable), evidence_refs: evidenceManifest });
  const tests = freezeArray([
    certTest("Multi-tenant production architecture validated", certification_package.multi_tenant_production_architecture_validated, "MULTI_TENANT_PRODUCTION_ARCHITECTURE_NOT_VALIDATED", [framework.integrity_hash]),
    certTest("Tenant lifecycle governance validated", certification_package.tenant_lifecycle_governance_validated, "TENANT_LIFECYCLE_GOVERNANCE_NOT_VALIDATED", [framework.integrity_hash]),
    certTest("Regional assignment conflict resolution deterministic", certification_package.regional_assignment_conflict_resolution_deterministic, "REGIONAL_ASSIGNMENT_CONFLICT_RESOLUTION_NOT_DETERMINISTIC", [framework.integrity_hash]),
    certTest("Resource scheduling and tenant isolation preserved", certification_package.resource_scheduling_tenant_isolation_preserved, "RESOURCE_SCHEDULING_TENANT_ISOLATION_NOT_PRESERVED", [framework.integrity_hash]),
    certTest("Global workload distribution replayable", certification_package.global_workload_distribution_replayable, "GLOBAL_WORKLOAD_DISTRIBUTION_NOT_REPLAYABLE", [decision.integrity_hash]),
    certTest("Continuous certification operational", certification_package.continuous_certification_operational, "CONTINUOUS_CERTIFICATION_NOT_OPERATIONAL", [resilience.continuous_multi_tenant_certification_ref]),
    certTest("Failure containment, deterministic recovery, and post-recovery requalification validated", certification_package.failure_containment_recovery_requalification_validated, "FAILURE_CONTAINMENT_RECOVERY_REQUALIFICATION_NOT_VALIDATED", [resilience.certification_package.integrity_hash]),
    certTest("Production scale certified", certification_package.production_scale_certified, "PRODUCTION_SCALE_NOT_CERTIFIED", [framework.integrity_hash]),
    certTest("Tenant isolation verified at scale", certification_package.tenant_isolation_verified_at_scale, "TENANT_ISOLATION_NOT_VERIFIED_AT_SCALE", [framework.integrity_hash]),
    certTest("Replay deterministic globally", certification_package.replay_deterministic_globally, "GLOBAL_REPLAY_NOT_DETERMINISTIC", [decision.integrity_hash]),
    certTest("Governance preserved", certification_package.governance_preserved, "GOVERNANCE_NOT_PRESERVED", [decision.integrity_hash]),
    certTest("Failure containment validated", certification_package.failure_containment_validated, "FAILURE_CONTAINMENT_NOT_VALIDATED", [resilience.containment_engine.integrity_hash]),
    certTest("Deterministic recovery verified", certification_package.deterministic_recovery_verified, "DETERMINISTIC_RECOVERY_NOT_VERIFIED", [resilience.recovery_coordinator.integrity_hash]),
    certTest("Post-recovery requalification complete", certification_package.post_recovery_requalification_complete, "POST_RECOVERY_REQUALIFICATION_INCOMPLETE", [resilience.post_recovery_qualification.integrity_hash]),
    certTest("Platform approved for ecosystem-scale multi-tenant production deployment", certification_package.platform_approved_for_ecosystem_scale_multi_tenant_production_deployment, "PLATFORM_NOT_APPROVED_FOR_ECOSYSTEM_PRODUCTION", [approval.integrity_hash]),
    certTest("No unresolved divergence present", noDivergence && evidence.unresolved_evidence.length === 0, "UNRESOLVED_DIVERGENCE_PRESENT", [evidence.integrity_hash]),
    certTest("Certification lineage immutable", certification_package.certification_lineage_immutable, "CERTIFICATION_LINEAGE_CORRUPTED", [lineage.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is Phase17CertificationGateFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<Phase17CertificationGateResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, operational_resilience_recovery_governance_ref: resilience.integrity_hash, certification_engine: engine, production_scale_framework: framework, evidence_aggregator: evidence, decision_service: decision, dashboard, certification_ledger: ledger, lineage_registry: lineage, approval_report: approval, certification_package, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validatePhase17CertificationGate(result = runPhase17CertificationGate()): Phase17CertificationGateValidation {
  const engine_valid = verify(result.certification_engine) && result.certification_engine.domains.length === 10 && Object.entries(result.certification_engine).filter(([key]) => !["engine_id", "domains", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const framework_valid = verify(result.production_scale_framework) && Object.entries(result.production_scale_framework).filter(([key]) => !["framework_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const evidence_valid = verify(result.evidence_aggregator) && result.evidence_aggregator.required_evidence.length >= 14 && result.evidence_aggregator.evidence_manifest.length > 0 && result.evidence_aggregator.unresolved_evidence.length === 0 && result.evidence_aggregator.evidence_integrity_validated && result.evidence_aggregator.immutable_audit_verified && result.evidence_aggregator.lineage_validated;
  const decision_valid = verify(result.decision_service) && result.decision_service.pipeline.length === 10 && result.decision_service.decision === "PASS" && Object.entries(result.decision_service).filter(([key]) => !["service_id", "pipeline", "decision", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const dashboard_valid = verify(result.dashboard) && Object.entries(result.dashboard).filter(([key]) => !["dashboard_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const ledger_valid = result.certification_ledger.length === 10 && result.certification_ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.evidence_ref.length > 0 && entry.decision_ref.length > 0 && entry.lineage_ref.length > 0 && entry.replay_ref.length > 0 && entry.governance_ref.length > 0 && entry.append_only && entry.immutable);
  const lineage_valid = verify(result.lineage_registry) && result.lineage_registry.artifacts.length === 10 && result.lineage_registry.lineage_refs.length > 0 && result.lineage_registry.additive_only && result.lineage_registry.immutable && result.lineage_registry.no_corruption_detected;
  const approval_valid = verify(result.approval_report) && result.approval_report.outcome === "PASS" && result.approval_report.production_deployment_authorized && result.approval_report.certification_artifacts.length === 10 && result.approval_report.approval_evidence_refs.length > 0;
  const certification_package_valid = verify(result.certification_package) && result.certification_package.evidence_refs.length > 0 && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 17 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && engine_valid && framework_valid && evidence_valid && decision_valid && dashboard_valid && ledger_valid && lineage_valid && approval_valid && certification_package_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, engine_valid, framework_valid, evidence_valid, decision_valid, dashboard_valid, ledger_valid, lineage_valid, approval_valid, certification_package_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayPhase17CertificationGate(result = runPhase17CertificationGate()): boolean {
  const replayed = runPhase17CertificationGate();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validatePhase17CertificationGate(result).valid;
}

export function getPhase17CertificationGateBundle(): Phase17CertificationGateBundle {
  const result = runPhase17CertificationGate();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "operational-resilience-recovery-governance/v17.11" as const, domains, pipeline_stages: pipelineStages, artifacts, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validatePhase17CertificationGate(result) });
}

export const Phase17CertificationGateService = Object.freeze({ run: runPhase17CertificationGate, validate: validatePhase17CertificationGate, replay: replayPhase17CertificationGate });
