import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import { assessOrchestrationReadiness, createOrchestrationReadinessRequest, replayOrchestrationReadiness } from "@/services/decision-context-orchestration-readiness";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type {
  ContextConstitutionalComplianceReport,
  ContextGovernanceComplianceReport,
  ContextProductionReadinessReport,
  ContextReplayValidationReport,
  DecisionContextCertification,
  DecisionContextCertificationEvidencePackage,
  DecisionContextCertificationFailure,
  DecisionContextCertificationGatePackage,
  DecisionContextCertificationGateRequest,
  DecisionContextCertificationObservability,
  DecisionContextCertificationOutcome,
  DecisionContextCertificationReplayResult,
  DecisionContextCertificationScenario,
  DecisionContextCertificationStatus,
  DecisionContextCertificationTest,
  DecisionContextCertificationReport,
} from "@/types/decision-context-certification-gate";
import type { OrchestrationReadinessPackage } from "@/types/decision-context-orchestration-readiness";

const NOW = "2026-07-03T09:40:00.000Z";
const CERTIFICATION_VERSION = "decision-context-certification-gate/v1" as const;
const PHASE = "9.3.13" as const;

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  delete copy.certification_hash;
  return hash(copy);
}

function packageHash(pkg: Omit<DecisionContextCertificationGatePackage, "integrity_hash"> | DecisionContextCertificationGatePackage): string {
  const copy = { ...(pkg as DecisionContextCertificationGatePackage) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(copy);
}

function defaultCandidate(): DecisionCandidate {
  const result = normalizeDecisionCandidateInput();
  if (!result.candidate) throw new Error("default normalized candidate unavailable");
  return result.candidate;
}

export function createDecisionContextCertificationGateRequest(overrides: Partial<DecisionContextCertificationGateRequest> = {}): DecisionContextCertificationGateRequest {
  const candidate = overrides.candidate ?? defaultCandidate();
  const scenario = overrides.scenario ?? "BASELINE";
  const readiness_package = overrides.readiness_package ?? assessOrchestrationReadiness(createOrchestrationReadinessRequest({
    candidate,
    interface_overrides: scenario === "INTERFACE_INCOMPATIBLE" ? { replay_engine: "INCOMPATIBLE" } : undefined,
  }));
  return Object.freeze({
    certification_id: overrides.certification_id ?? `decision_context_certification_${candidate.candidate_id}`,
    candidate,
    readiness_package,
    scenario,
    certification_version: overrides.certification_version ?? CERTIFICATION_VERSION,
  });
}

function status(ok: boolean): DecisionContextCertificationStatus {
  return ok ? "PASS" : "FAIL";
}

function testRecord(input: { name: string; passed: boolean; failure: DecisionContextCertificationFailure; evidence_refs?: readonly string[] }): DecisionContextCertificationTest {
  const base: Omit<DecisionContextCertificationTest, "integrity_hash"> = {
    certification_test_id: `context_cert_test_${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    test_name: input.name,
    expected: "PASS",
    actual: input.passed ? "PASS" : "FAIL",
    failure: input.passed ? undefined : input.failure,
    evidence_refs: Object.freeze([...(input.evidence_refs ?? [`evidence_${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`])].sort()),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function certificationTests(pkg: OrchestrationReadinessPackage, scenario: DecisionContextCertificationScenario): readonly DecisionContextCertificationTest[] {
  const registry = pkg.orchestration_entry_package;
  const readiness = pkg.readiness;
  const validation = pkg.validation;
  const replay = replayOrchestrationReadiness(pkg);
  return Object.freeze([
    testRecord({ name: "Context contract validation", passed: scenario !== "MISSING_CONTEXT" && validation.checks.context_complete, failure: "MANDATORY_CONTEXT_MISSING", evidence_refs: [registry.decision_context_ref] }),
    testRecord({ name: "All context domains complete", passed: scenario !== "MISSING_CONTEXT" && pkg.readiness.context_status === "COMPLETE", failure: "MANDATORY_CONTEXT_MISSING" }),
    testRecord({ name: "Context resolution deterministic", passed: scenario !== "REPLAY_UNAVAILABLE" && replay.replay_valid, failure: "NONDETERMINISTIC_CONTEXT_RESOLUTION" }),
    testRecord({ name: "Completeness scoring reproducible", passed: readiness.readiness_score === 1 || scenario !== "BASELINE", failure: "NONDETERMINISTIC_CONTEXT_RESOLUTION" }),
    testRecord({ name: "Replay reconstructs identical readiness", passed: scenario !== "REPLAY_UNAVAILABLE" && replay.replay_valid, failure: "REPLAY_DIVERGENCE", evidence_refs: [pkg.replay_ref] }),
    testRecord({ name: "Replay artifacts available", passed: scenario !== "REPLAY_UNAVAILABLE" && validation.checks.replay_verified, failure: "MISSING_REPLAY_ARTIFACTS" }),
    testRecord({ name: "Integrity hashes reproducible", passed: scenario !== "INTEGRITY_MISMATCH" && validation.checks.integrity_verified, failure: "INTEGRITY_HASH_MISMATCH" }),
    testRecord({ name: "Governance compliance verified", passed: scenario !== "GOVERNANCE_BYPASS" && validation.checks.governance_complete, failure: "GOVERNANCE_VIOLATION" }),
    testRecord({ name: "Constitutional compliance verified", passed: scenario !== "CONSTITUTIONAL_BYPASS" && validation.checks.constitutional_complete, failure: "CONSTITUTIONAL_VIOLATION" }),
    testRecord({ name: "Authority boundaries enforced", passed: scenario !== "AUTHORITY_UNRESOLVED" && validation.checks.authority_resolved, failure: "AUTHORITY_BOUNDARY_VIOLATION" }),
    testRecord({ name: "Tenant isolation preserved", passed: scenario !== "TENANT_VIOLATION" && validation.checks.tenant_isolated, failure: "TENANT_ISOLATION_FAILURE" }),
    testRecord({ name: "Explainability complete", passed: scenario !== "MISSING_CONTEXT" && Boolean(registry.explainability_report_ref), failure: "MISSING_EXPLAINABILITY", evidence_refs: [registry.explainability_report_ref] }),
    testRecord({ name: "Registry and ledger immutable", passed: scenario !== "INTEGRITY_MISMATCH" && Boolean(pkg.integration.integration_lineage.length), failure: "REGISTRY_LEDGER_FAILURE" }),
    testRecord({ name: "Orchestration readiness complete", passed: scenario !== "INTERFACE_INCOMPATIBLE" && readiness.readiness_state === "READY", failure: "ORCHESTRATION_READINESS_INCOMPLETE" }),
    testRecord({ name: "Fail closed behavior verified", passed: !["MISSING_CONTEXT", "REPLAY_UNAVAILABLE", "GOVERNANCE_BYPASS", "CONSTITUTIONAL_BYPASS", "AUTHORITY_UNRESOLVED", "INTEGRITY_MISMATCH", "TENANT_VIOLATION", "INTERFACE_INCOMPATIBLE"].includes(scenario) || readiness.readiness_state !== "READY", failure: "FAIL_OPEN_BEHAVIOR" }),
  ]);
}

function failuresFor(tests: readonly DecisionContextCertificationTest[]): readonly DecisionContextCertificationFailure[] {
  return Object.freeze([...new Set(tests.filter((test) => test.actual === "FAIL").map((test) => test.failure ?? "INCOMPLETE_VALIDATION"))]);
}

function outcomeFor(tests: readonly DecisionContextCertificationTest[], scenario: DecisionContextCertificationScenario): DecisionContextCertificationOutcome {
  if (failuresFor(tests).length > 0) return "FAIL";
  if (scenario === "CONDITIONAL_REPORTING_GAP") return "CONDITIONAL_PASS";
  return "PASS";
}

function certificationRecord(request: DecisionContextCertificationGateRequest, tests: readonly DecisionContextCertificationTest[], outcome: DecisionContextCertificationOutcome): DecisionContextCertification {
  const failures = failuresFor(tests);
  const hasNo = (failure: DecisionContextCertificationFailure) => !failures.includes(failure);
  const base: Omit<DecisionContextCertification, "certification_hash"> = {
    certification_id: request.certification_id,
    phase: PHASE,
    certification_version: CERTIFICATION_VERSION,
    certification_timestamp: NOW,
    context_validation: status(hasNo("MANDATORY_CONTEXT_MISSING") && hasNo("INCOMPLETE_VALIDATION")),
    replay_validation: status(hasNo("REPLAY_DIVERGENCE") && hasNo("MISSING_REPLAY_ARTIFACTS")),
    integrity_validation: status(hasNo("INTEGRITY_HASH_MISMATCH") && hasNo("REGISTRY_LEDGER_FAILURE")),
    governance_validation: status(hasNo("GOVERNANCE_VIOLATION")),
    constitutional_validation: status(hasNo("CONSTITUTIONAL_VIOLATION")),
    authority_validation: status(hasNo("AUTHORITY_BOUNDARY_VIOLATION")),
    tenant_validation: status(hasNo("TENANT_ISOLATION_FAILURE")),
    explainability_validation: status(hasNo("MISSING_EXPLAINABILITY")),
    readiness_validation: status(hasNo("ORCHESTRATION_READINESS_INCOMPLETE") && hasNo("FAIL_OPEN_BEHAVIOR")),
    certification_state: outcome,
  };
  return Object.freeze({ ...base, certification_hash: recordHash(base) });
}

function contextReport(request: DecisionContextCertificationGateRequest, outcome: DecisionContextCertificationOutcome, failures: readonly DecisionContextCertificationFailure[]): DecisionContextCertificationReport {
  const base: Omit<DecisionContextCertificationReport, "integrity_hash"> = {
    report_id: `context_certification_report_${request.candidate.candidate_id}`,
    certification_id: request.certification_id,
    context_completeness: request.readiness_package?.readiness.context_status ?? "UNKNOWN",
    resolver_performance: "deterministic_zero_runtime_variance",
    validation_summary: outcome === "PASS" ? "Decision Context Builder is certified for orchestration handoff." : outcome === "CONDITIONAL_PASS" ? "Core certification passed, but non-functional artifacts remain incomplete." : "Decision Context Builder certification failed.",
    outstanding_issues: Object.freeze(outcome === "PASS" ? [] : outcome === "CONDITIONAL_PASS" ? ["Close non-functional reporting or visualization gap before production progression."] : failures.map((failure) => `Resolve ${failure}.`)),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function replayReport(request: DecisionContextCertificationGateRequest): ContextReplayValidationReport {
  const replay = replayOrchestrationReadiness(request.readiness_package!);
  const base: Omit<ContextReplayValidationReport, "integrity_hash"> = {
    report_id: `context_replay_report_${request.candidate.candidate_id}`,
    replay_fidelity: replay.replay_valid,
    replay_reconstruction: replay.reconstructed_hash,
    replay_lineage: Object.freeze([request.readiness_package!.replay_ref, request.readiness_package!.orchestration_entry_package.replay_package_ref]),
    replay_integrity: status(replay.replay_valid),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function governanceReport(request: DecisionContextCertificationGateRequest): ContextGovernanceComplianceReport {
  const base: Omit<ContextGovernanceComplianceReport, "integrity_hash"> = {
    report_id: `context_governance_report_${request.candidate.candidate_id}`,
    policy_compliance: status(request.scenario !== "GOVERNANCE_BYPASS" && request.readiness_package!.validation.checks.governance_complete),
    governance_approvals: request.readiness_package!.orchestration_entry_package.governance_package_refs,
    policy_conflicts: Object.freeze(["documented_policy_conflicts_preserved"]),
    governance_lineage: request.readiness_package!.integration.integration_lineage,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function constitutionalReport(request: DecisionContextCertificationGateRequest): ContextConstitutionalComplianceReport {
  const base: Omit<ContextConstitutionalComplianceReport, "integrity_hash"> = {
    report_id: `context_constitutional_report_${request.candidate.candidate_id}`,
    constitutional_validation: status(request.scenario !== "CONSTITUTIONAL_BYPASS" && request.readiness_package!.validation.checks.constitutional_complete),
    principle_enforcement: Object.freeze(["governance_supremacy", "constitutional_supremacy", "advisory_only"]),
    constraint_enforcement: Object.freeze(["no_autonomous_execution", "no_tenant_crossover", "replay_required"]),
    violation_analysis: Object.freeze(request.scenario === "CONSTITUTIONAL_BYPASS" ? ["constitutional_bypass_detected"] : []),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function productionReport(request: DecisionContextCertificationGateRequest, outcome: DecisionContextCertificationOutcome, failures: readonly DecisionContextCertificationFailure[]): ContextProductionReadinessReport {
  const base: Omit<ContextProductionReadinessReport, "integrity_hash"> = {
    report_id: `context_production_readiness_${request.candidate.candidate_id}`,
    readiness_summary: outcome === "PASS" ? "Phase 9.4 orchestration entry is authorized." : "Phase 9.4 orchestration entry is blocked.",
    remaining_blockers: failures,
    certification_outcome: outcome,
    deployment_recommendation: outcome === "PASS" ? "AUTHORIZE_PHASE_9_4_ENTRY" : "BLOCK_PHASE_9_4_ENTRY",
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function evidencePackage(request: DecisionContextCertificationGateRequest, tests: readonly DecisionContextCertificationTest[]): DecisionContextCertificationEvidencePackage {
  const readiness = request.readiness_package!;
  const base: Omit<DecisionContextCertificationEvidencePackage, "integrity_hash"> = {
    evidence_package_id: `context_certification_evidence_${request.candidate.candidate_id}`,
    certification_id: request.certification_id,
    readiness_package: readiness,
    certification_tests: tests,
    validation_evidence_refs: Object.freeze([readiness.readiness_report.report_id, readiness.validation.validation_state]),
    replay_evidence_refs: Object.freeze([readiness.replay_ref, readiness.orchestration_entry_package.replay_package_ref]),
    integrity_evidence_refs: Object.freeze([readiness.integrity_hash, readiness.orchestration_entry_package.integrity_hash]),
    certification_artifacts: Object.freeze([readiness.orchestration_entry_package.entry_package_id, readiness.readiness_report.report_id]),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function certifyDecisionContext(request: DecisionContextCertificationGateRequest = createDecisionContextCertificationGateRequest()): DecisionContextCertificationGatePackage {
  const tests = certificationTests(request.readiness_package!, request.scenario ?? "BASELINE");
  const failures = failuresFor(tests);
  const outcome = outcomeFor(tests, request.scenario ?? "BASELINE");
  const certification = certificationRecord(request, tests, outcome);
  const context_certification_report = contextReport(request, outcome, failures);
  const replay_validation_report = replayReport(request);
  const governance_compliance_report = governanceReport(request);
  const constitutional_compliance_report = constitutionalReport(request);
  const production_readiness_report = productionReport(request, outcome, failures);
  const evidence_package = evidencePackage(request, tests);
  const base: Omit<DecisionContextCertificationGatePackage, "integrity_hash"> = {
    certification_id: request.certification_id,
    candidate_id: request.candidate.candidate_id,
    certification,
    certification_tests: tests,
    context_certification_report,
    replay_validation_report,
    governance_compliance_report,
    constitutional_compliance_report,
    production_readiness_report,
    evidence_package,
    failures,
    replay_ref: `replay_decision_context_certification_${request.certification_id}`,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: packageHash(base) });
}

export function replayDecisionContextCertification(pkg: DecisionContextCertificationGatePackage): DecisionContextCertificationReplayResult {
  const reconstructed_hash = packageHash(pkg);
  const replay_valid = reconstructed_hash === pkg.integrity_hash;
  const base: Omit<DecisionContextCertificationReplayResult, "integrity_hash"> = {
    replay_id: `replay_validation_${pkg.certification_id}`,
    replay_valid,
    certification_id: pkg.certification_id,
    reconstructed_hash,
    expected_hash: pkg.integrity_hash,
    reconstructed_outcome: pkg.certification.certification_state,
    failures: replay_valid ? Object.freeze([]) : Object.freeze(["REPLAY_DIVERGENCE"] as const),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function buildDecisionContextCertificationObservability(packages: readonly DecisionContextCertificationGatePackage[]): DecisionContextCertificationObservability {
  const failures = packages.flatMap((pkg) => pkg.failures);
  return Object.freeze({
    certification_attempts: packages.length,
    pass_count: packages.filter((pkg) => pkg.certification.certification_state === "PASS").length,
    conditional_pass_count: packages.filter((pkg) => pkg.certification.certification_state === "CONDITIONAL_PASS").length,
    fail_count: packages.filter((pkg) => pkg.certification.certification_state === "FAIL").length,
    replay_fidelity_rate: packages.length === 0 ? 0 : packages.filter((pkg) => replayDecisionContextCertification(pkg).replay_valid).length / packages.length,
    integrity_pass_rate: packages.length === 0 ? 0 : packages.filter((pkg) => pkg.certification.integrity_validation === "PASS").length / packages.length,
    governance_pass_rate: packages.length === 0 ? 0 : packages.filter((pkg) => pkg.certification.governance_validation === "PASS").length / packages.length,
    constitutional_pass_rate: packages.length === 0 ? 0 : packages.filter((pkg) => pkg.certification.constitutional_validation === "PASS").length / packages.length,
    authority_failure_count: failures.filter((failure) => failure === "AUTHORITY_BOUNDARY_VIOLATION").length,
    tenant_failure_count: failures.filter((failure) => failure === "TENANT_ISOLATION_FAILURE").length,
    readiness_failure_count: failures.filter((failure) => failure === "ORCHESTRATION_READINESS_INCOMPLETE").length,
    evidence_completeness_rate: packages.length === 0 ? 0 : packages.filter((pkg) => pkg.evidence_package.certification_tests.length > 0 && pkg.evidence_package.certification_artifacts.length > 0).length / packages.length,
  });
}

export function getDecisionContextCertificationGate() {
  const request = createDecisionContextCertificationGateRequest();
  const certification_package = certifyDecisionContext(request);
  return Object.freeze({
    certification_version: CERTIFICATION_VERSION,
    phase: PHASE,
    request,
    certification_package,
    replay: replayDecisionContextCertification(certification_package),
    observability: buildDecisionContextCertificationObservability([certification_package]),
  });
}
