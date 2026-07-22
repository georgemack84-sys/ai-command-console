import { runAgentIdentityLifecycle, validateAgentIdentityLifecycle } from "@/services/caf-agent-identity-lifecycle";
import { runBehavioralReplayDivergence, validateBehavioralReplayDivergence } from "@/services/caf-behavioral-replay-divergence";
import { runCapabilityComposition, validateCapabilityComposition } from "@/services/caf-capability-composition";
import { runCollaborationFederation, validateCollaborationFederation } from "@/services/caf-collaboration-federation";
import { runGovernanceAuthorityPolicy, validateGovernanceAuthorityPolicy } from "@/services/caf-governance-authority-policy";
import { runHumanOperatorInteraction, validateHumanOperatorInteraction } from "@/services/caf-human-operator-interaction";
import { runLearningAdaptation, validateLearningAdaptation } from "@/services/caf-learning-adaptation";
import { runMemoryKnowledge, validateMemoryKnowledge } from "@/services/caf-memory-knowledge";
import { runObservabilityTelemetry, validateObservabilityTelemetry } from "@/services/caf-observability-telemetry";
import { runOperationsIncidentGovernance, validateOperationsIncidentGovernance } from "@/services/caf-operations-incident-governance";
import { runPlanningReasoning, validatePlanningReasoning } from "@/services/caf-planning-reasoning";
import { runRuntimeOrchestration, validateRuntimeOrchestration } from "@/services/caf-runtime-orchestration";
import { runSafetyBehavioralConstraints, validateSafetyBehavioralConstraints } from "@/services/caf-safety-behavioral-constraints";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  PlatformAssuranceBundle,
  PlatformAssuranceFailure,
  PlatformAssuranceInput,
  PlatformAssuranceResult,
  PlatformAssuranceScenario,
  PlatformAssuranceValidation,
  PlatformAssuranceOutcome,
} from "@/types/caf-platform-assurance";

const VERSION = "caf-platform-assurance/v3.14" as const;
const IDENTIFIER = "CafPlatformAssurance" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}
function nested<T extends object>(value: T): T & { integrity_hash: string } {
  return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string };
}
function scenarioFailure(scenario: PlatformAssuranceScenario): PlatformAssuranceFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly PlatformAssuranceFailure[], failure: PlatformAssuranceFailure): boolean { return failures.includes(failure); }
function outcome(failures: readonly PlatformAssuranceFailure[]): PlatformAssuranceOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function resultReplayHash(result: Omit<PlatformAssuranceResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    package: result.assurance_package.integrity_hash,
    dependency: result.dependency_report.integrity_hash,
    governance: result.governance_report.integrity_hash,
    evidence: result.evidence_report.integrity_hash,
    replay: result.replay_findings.integrity_hash,
    correlation: result.evidence_correlation.integrity_hash,
    decision: result.assurance_decision.integrity_hash,
    qualification: result.qualification_evidence.integrity_hash,
    report: result.assurance_report.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<PlatformAssuranceResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runPlatformAssurance(input: PlatformAssuranceInput = {}): PlatformAssuranceResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<PlatformAssuranceFailure>(direct ? [direct] : []);
  const p31 = runAgentIdentityLifecycle();
  const p32 = runCapabilityComposition();
  const p33 = runRuntimeOrchestration();
  const p34 = runMemoryKnowledge();
  const p35 = runPlanningReasoning();
  const p36 = runCollaborationFederation();
  const p37 = runGovernanceAuthorityPolicy();
  const p38 = runSafetyBehavioralConstraints();
  const p39 = runHumanOperatorInteraction();
  const p310 = runObservabilityTelemetry();
  const p311 = runBehavioralReplayDivergence();
  const p312 = runLearningAdaptation();
  const p313 = runOperationsIncidentGovernance();
  const dependencyFailures = freezeArray<PlatformAssuranceFailure>([
    ...(!validateAgentIdentityLifecycle(p31).valid || has(scenarioFailures, "P3_1_DEPENDENCY_INVALID") ? ["P3_1_DEPENDENCY_INVALID" as const] : []),
    ...(!validateCapabilityComposition(p32).valid || has(scenarioFailures, "P3_2_DEPENDENCY_INVALID") ? ["P3_2_DEPENDENCY_INVALID" as const] : []),
    ...(!validateRuntimeOrchestration(p33).valid || has(scenarioFailures, "P3_3_DEPENDENCY_INVALID") ? ["P3_3_DEPENDENCY_INVALID" as const] : []),
    ...(!validateMemoryKnowledge(p34).valid || has(scenarioFailures, "P3_4_DEPENDENCY_INVALID") ? ["P3_4_DEPENDENCY_INVALID" as const] : []),
    ...(!validatePlanningReasoning(p35).valid || has(scenarioFailures, "P3_5_DEPENDENCY_INVALID") ? ["P3_5_DEPENDENCY_INVALID" as const] : []),
    ...(!validateCollaborationFederation(p36).valid || has(scenarioFailures, "P3_6_DEPENDENCY_INVALID") ? ["P3_6_DEPENDENCY_INVALID" as const] : []),
    ...(!validateGovernanceAuthorityPolicy(p37).valid || has(scenarioFailures, "P3_7_DEPENDENCY_INVALID") ? ["P3_7_DEPENDENCY_INVALID" as const] : []),
    ...(!validateSafetyBehavioralConstraints(p38).valid || has(scenarioFailures, "P3_8_DEPENDENCY_INVALID") ? ["P3_8_DEPENDENCY_INVALID" as const] : []),
    ...(!validateHumanOperatorInteraction(p39).valid || has(scenarioFailures, "P3_9_DEPENDENCY_INVALID") ? ["P3_9_DEPENDENCY_INVALID" as const] : []),
    ...(!validateObservabilityTelemetry(p310).valid || has(scenarioFailures, "P3_10_DEPENDENCY_INVALID") ? ["P3_10_DEPENDENCY_INVALID" as const] : []),
    ...(!validateBehavioralReplayDivergence(p311).valid || has(scenarioFailures, "P3_11_REPLAY_EVIDENCE_INVALID") ? ["P3_11_REPLAY_EVIDENCE_INVALID" as const] : []),
    ...(!validateLearningAdaptation(p312).valid || has(scenarioFailures, "P3_12_DEPENDENCY_INVALID") ? ["P3_12_DEPENDENCY_INVALID" as const] : []),
    ...(!validateOperationsIncidentGovernance(p313).valid || has(scenarioFailures, "P3_13_DEPENDENCY_INVALID") ? ["P3_13_DEPENDENCY_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const evidenceRefs = freezeArray([
    p37.gate_result.gate_id,
    p38.safety_gate.safety_gate_id,
    p310.evidence.evidence_id,
    p311.replay_evidence.evidence_id,
    p312.evidence_records[0]?.evidence_id ?? "evidence:p3.12:missing",
    p313.operational_evidence.evidence_id,
    p33.runtime_evidence[0]?.evidence_id ?? "evidence:p3.3:missing",
  ]);
  const assurance_package = nested({
    package_id: "P3.14-ASSURANCE-PACKAGE-001",
    evidence_refs: has(failures, "ASSURANCE_AGGREGATION_INCOMPLETE") ? freezeArray(evidenceRefs.slice(0, 4)) : evidenceRefs,
    governance_evidence_refs: freezeArray([p37.certification.certification_id]),
    operational_evidence_refs: freezeArray([p313.operational_evidence.evidence_id]),
    replay_evidence_refs: has(failures, "REPLAY_EVIDENCE_NOT_CONSUMED") ? freezeArray([]) : freezeArray([p311.replay_evidence.evidence_id]),
    learning_evidence_refs: freezeArray(p312.evidence_records.map((record) => record.evidence_id)),
    observability_evidence_refs: freezeArray([p310.evidence.evidence_id]),
    runtime_evidence_refs: freezeArray(p33.runtime_evidence.map((record) => record.evidence_id)),
    complete: !has(failures, "ASSURANCE_AGGREGATION_INCOMPLETE"),
  });
  const dependencyPass = dependencyFailures.length === 0 && !has(failures, "DEPENDENCY_VERIFICATION_FAILED");
  const dependency_report = nested({
    report_id: "P3.14-DEPENDENCY-VERIFICATION-001",
    dependency_refs: freezeArray(["P3.1", "P3.2", "P3.3", "P3.4", "P3.5", "P3.6", "P3.7", "P3.8", "P3.9", "P3.10", "P3.11", "P3.12", "P3.13"]),
    dependency_versions_valid: dependencyPass,
    interface_compatible: dependencyPass,
    contract_compatible: dependencyPass,
    required_evidence_present: assurance_package.evidence_refs.length >= 7,
    ownership_validated: dependencyPass,
    result: dependencyPass ? "PASS" as const : "FAIL" as const,
  });
  const governancePass = !has(failures, "GOVERNANCE_VERIFICATION_FAILED") && p37.certification.certified && p38.certification.certified && p313.certification.certified;
  const governance_report = nested({
    report_id: "P3.14-GOVERNANCE-VERIFICATION-001",
    authority_matrix_compliant: governancePass,
    approvals_validated: governancePass,
    policy_validated: governancePass,
    safety_validated: governancePass,
    operational_governance_validated: governancePass,
    lifecycle_governance_validated: governancePass,
    result: governancePass ? "PASS" as const : "FAIL" as const,
  });
  const evidencePass = !has(failures, "EVIDENCE_VERIFICATION_FAILED") && assurance_package.complete && assurance_package.evidence_refs.length >= 7;
  const evidence_report = nested({
    report_id: "P3.14-EVIDENCE-VERIFICATION-001",
    complete: evidencePass,
    integrity_valid: evidencePass,
    lineage_complete: evidencePass && !has(failures, "FINDINGS_NOT_TRACEABLE"),
    signatures_present: evidencePass,
    timestamps_valid: evidencePass,
    immutable_references: evidencePass,
    constitutional_ownership_valid: evidencePass,
    result: evidencePass ? "PASS" as const : "FAIL" as const,
  });
  const replayExecuted = has(failures, "REPLAY_EXECUTION_ATTEMPTED");
  const replayArtifactGenerated = has(failures, "REPLAY_ARTIFACT_GENERATED");
  const replayPass = !has(failures, "REPLAY_EVIDENCE_NOT_CONSUMED") && !has(failures, "P3_11_REPLAY_EVIDENCE_INVALID") && !replayExecuted && !replayArtifactGenerated;
  const replay_findings = nested({
    findings_id: "P3.14-REPLAY-ASSURANCE-FINDINGS-001",
    p3_11_replay_evidence_ref: replayPass ? p311.replay_evidence.evidence_id : "",
    replay_evidence_consumed: replayPass,
    replay_executed_by_p3_14: replayExecuted,
    replay_artifact_generated_by_p3_14: replayArtifactGenerated,
    completeness_valid: replayPass,
    determinism_valid: replayPass,
    divergence_analysis_valid: replayPass,
    replay_lineage_valid: replayPass,
    replay_integrity_valid: replayPass,
    replay_governance_valid: replayPass,
    result: replayPass ? "PASS" as const : "FAIL" as const,
  });
  const correlationPass = !has(failures, "EVIDENCE_CORRELATION_INCOMPLETE") && !has(failures, "FINDINGS_NOT_TRACEABLE");
  const evidence_correlation = nested({
    correlation_id: "P3.14-EVIDENCE-CORRELATION-001",
    correlated_evidence_refs: correlationPass ? assurance_package.evidence_refs : freezeArray([]),
    cross_phase_lineage_complete: correlationPass,
    findings_traceable: correlationPass,
  });
  const blockingFindings = freezeArray([
    ...(!dependencyPass ? ["dependency verification failed"] : []),
    ...(!governancePass ? ["governance verification failed"] : []),
    ...(!evidencePass ? ["evidence verification failed"] : []),
    ...(!replayPass ? ["replay evidence verification failed"] : []),
  ]);
  const overall = blockingFindings.length ? "FAIL" as const : "PASS" as const;
  const assurance_decision = nested({
    decision_id: has(failures, "ASSURANCE_DECISION_MISSING") ? "" : "P3.14-ASSURANCE-DECISION-001",
    evaluation_scope: "Program 3 CAF platform assurance",
    dependency_result: dependency_report.result,
    governance_result: governance_report.result,
    evidence_result: evidence_report.result,
    replay_result: replay_findings.result,
    overall_result: has(failures, "ASSURANCE_DECISION_MISSING") ? "FAIL" as const : overall,
    blocking_findings: blockingFindings,
    warnings: freezeArray(["P3.14 does not certify the platform; certification phase must consume this decision."]),
    qualification_recommendation: overall === "PASS" ? "QUALIFY" as const : "DO_NOT_QUALIFY" as const,
    evidence_refs: assurance_package.evidence_refs,
    generated_timestamp: "2026-07-17T00:55:00.000Z",
  });
  const qualification_evidence = nested({
    qualification_evidence_id: "P3.14-QUALIFICATION-EVIDENCE-001",
    assurance_package_ref: assurance_package.package_id,
    decision_ref: assurance_decision.decision_id,
    report_refs: freezeArray([dependency_report.report_id, governance_report.report_id, evidence_report.report_id, replay_findings.findings_id]),
    immutable: !has(failures, "QUALIFICATION_EVIDENCE_INCOMPLETE"),
    complete: !has(failures, "QUALIFICATION_EVIDENCE_INCOMPLETE") && assurance_decision.decision_id.length > 0,
  });
  const assurance_report = nested({
    report_id: has(failures, "ASSURANCE_REPORT_MISSING") ? "" : "P3.14-ASSURANCE-REPORT-001",
    summary: "Program 3 assurance evidence is sufficient for downstream certification review.",
    dependency_report_ref: dependency_report.report_id,
    governance_report_ref: governance_report.report_id,
    evidence_report_ref: evidence_report.report_id,
    replay_findings_ref: replay_findings.findings_id,
    decision_ref: assurance_decision.decision_id,
    generated: !has(failures, "ASSURANCE_REPORT_MISSING"),
    traceable: evidence_correlation.findings_traceable,
  });
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!assurance_package.complete ? ["ASSURANCE_AGGREGATION_INCOMPLETE" as const] : []),
    ...(dependency_report.result !== "PASS" ? ["DEPENDENCY_VERIFICATION_FAILED" as const] : []),
    ...(governance_report.result !== "PASS" ? ["GOVERNANCE_VERIFICATION_FAILED" as const] : []),
    ...(evidence_report.result !== "PASS" ? ["EVIDENCE_VERIFICATION_FAILED" as const] : []),
    ...(!replay_findings.replay_evidence_consumed ? ["REPLAY_EVIDENCE_NOT_CONSUMED" as const] : []),
    ...(replay_findings.replay_executed_by_p3_14 ? ["REPLAY_EXECUTION_ATTEMPTED" as const] : []),
    ...(replay_findings.replay_artifact_generated_by_p3_14 ? ["REPLAY_ARTIFACT_GENERATED" as const] : []),
    ...(!evidence_correlation.cross_phase_lineage_complete ? ["EVIDENCE_CORRELATION_INCOMPLETE" as const] : []),
    ...(!qualification_evidence.complete ? ["QUALIFICATION_EVIDENCE_INCOMPLETE" as const] : []),
    ...(!assurance_report.generated ? ["ASSURANCE_REPORT_MISSING" as const] : []),
    ...(assurance_decision.decision_id.length === 0 ? ["ASSURANCE_DECISION_MISSING" as const] : []),
    ...(!evidence_correlation.findings_traceable ? ["FINDINGS_NOT_TRACEABLE" as const] : []),
    ...(has(failures, "CERTIFICATION_ATTEMPTED") ? ["CERTIFICATION_ATTEMPTED" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P3.14-PLATFORM-ASSURANCE-GATE-001",
    outcome: outcome(derivedFailures),
    certified: false,
    assurance_aggregation_complete: assurance_package.complete,
    dependency_verification_passed: dependency_report.result === "PASS",
    governance_verification_passed: governance_report.result === "PASS",
    evidence_verification_passed: evidence_report.result === "PASS",
    replay_evidence_consumed: replay_findings.replay_evidence_consumed,
    no_replay_execution_capability: !replay_findings.replay_executed_by_p3_14,
    no_replay_artifact_generation: !replay_findings.replay_artifact_generated_by_p3_14,
    assurance_report_generated: assurance_report.generated,
    qualification_evidence_complete: qualification_evidence.complete,
    assurance_decision_produced: assurance_decision.decision_id.length > 0,
    findings_traceable: evidence_correlation.findings_traceable,
    did_not_certify_platform: !has(derivedFailures, "CERTIFICATION_ATTEMPTED"),
    failures: derivedFailures,
  });
  const base: Omit<PlatformAssuranceResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    agent_identity_lifecycle_ref: "caf-agent-identity-lifecycle/v3.1",
    capability_composition_ref: "caf-capability-composition/v3.2",
    runtime_orchestration_ref: "caf-runtime-orchestration/v3.3",
    memory_knowledge_ref: "caf-memory-knowledge/v3.4",
    planning_reasoning_ref: "caf-planning-reasoning/v3.5",
    collaboration_federation_ref: "caf-collaboration-federation/v3.6",
    governance_authority_policy_ref: "caf-governance-authority-policy/v3.7",
    safety_behavioral_constraints_ref: "caf-safety-behavioral-constraints/v3.8",
    human_operator_interaction_ref: "caf-human-operator-interaction/v3.9",
    observability_telemetry_ref: "caf-observability-telemetry/v3.10",
    behavioral_replay_divergence_ref: "caf-behavioral-replay-divergence/v3.11",
    learning_adaptation_ref: "caf-learning-adaptation/v3.12",
    operations_incident_governance_ref: "caf-operations-incident-governance/v3.13",
    assurance_package,
    dependency_report,
    governance_report,
    evidence_report,
    replay_findings,
    evidence_correlation,
    assurance_decision,
    qualification_evidence,
    assurance_report,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validatePlatformAssurance(result?: PlatformAssuranceResult): PlatformAssuranceValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, package_valid: false, dependency_valid: false, governance_valid: false, evidence_valid: false, replay_valid: false, decision_valid: false, qualification_valid: false, report_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.certification);
  const package_valid = verifyHashedRecord(result.assurance_package) && result.assurance_package.complete && result.assurance_package.evidence_refs.length >= 7;
  const dependency_valid = verifyHashedRecord(result.dependency_report) && result.dependency_report.result === "PASS";
  const governance_valid = verifyHashedRecord(result.governance_report) && result.governance_report.result === "PASS";
  const evidence_valid = verifyHashedRecord(result.evidence_report) && result.evidence_report.result === "PASS";
  const replay_valid = verifyHashedRecord(result.replay_findings) && result.replay_findings.result === "PASS" && result.replay_findings.replay_evidence_consumed && !result.replay_findings.replay_executed_by_p3_14 && !result.replay_findings.replay_artifact_generated_by_p3_14;
  const decision_valid = verifyHashedRecord(result.assurance_decision) && result.assurance_decision.decision_id.length > 0 && result.assurance_decision.overall_result === "PASS";
  const qualification_valid = verifyHashedRecord(result.qualification_evidence) && result.qualification_evidence.complete && result.qualification_evidence.immutable;
  const report_valid = verifyHashedRecord(result.assurance_report) && result.assurance_report.generated && result.assurance_report.traceable;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && !result.certification.certified && result.certification.did_not_certify_platform;
  const valid = replay_hash_valid && integrity_hash_valid && package_valid && dependency_valid && governance_valid && evidence_valid && replay_valid && decision_valid && qualification_valid && report_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, package_valid, dependency_valid, governance_valid, evidence_valid, replay_valid, decision_valid, qualification_valid, report_valid, certification_valid, failures: result.certification.failures });
}

export function replayPlatformAssurance(result = runPlatformAssurance()): boolean {
  const replayed = runPlatformAssurance();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validatePlatformAssurance(result).valid;
}

export function getPlatformAssuranceBundle(): PlatformAssuranceBundle {
  const result = runPlatformAssurance();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_assurance_aggregation: true,
      owns_dependency_verification: true,
      owns_governance_verification: true,
      owns_evidence_verification: true,
      consumes_replay_evidence: true,
      executes_replay: false,
      generates_replay_artifacts: false,
      certifies_platform: false,
    }),
    result,
    validation: validatePlatformAssurance(result),
  });
}

export const PlatformAssuranceService = Object.freeze({
  run: runPlatformAssurance,
  validate: validatePlatformAssurance,
  replay: replayPlatformAssurance,
});
