import { runAgentIdentityLifecycle, validateAgentIdentityLifecycle } from "@/services/caf-agent-identity-lifecycle";
import { runCapabilityComposition, validateCapabilityComposition } from "@/services/caf-capability-composition";
import { runCollaborationFederation, validateCollaborationFederation } from "@/services/caf-collaboration-federation";
import { runGovernanceAuthorityPolicy, validateGovernanceAuthorityPolicy } from "@/services/caf-governance-authority-policy";
import { runHumanOperatorInteraction, validateHumanOperatorInteraction } from "@/services/caf-human-operator-interaction";
import { runMemoryKnowledge, validateMemoryKnowledge } from "@/services/caf-memory-knowledge";
import { runObservabilityTelemetry, validateObservabilityTelemetry } from "@/services/caf-observability-telemetry";
import { runPlanningReasoning, validatePlanningReasoning } from "@/services/caf-planning-reasoning";
import { runRuntimeOrchestration, validateRuntimeOrchestration } from "@/services/caf-runtime-orchestration";
import { runSafetyBehavioralConstraints, validateSafetyBehavioralConstraints } from "@/services/caf-safety-behavioral-constraints";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  BehavioralDivergenceType,
  BehavioralReplayCertification,
  BehavioralReplayDivergenceBundle,
  BehavioralReplayDivergenceFailure,
  BehavioralReplayDivergenceInput,
  BehavioralReplayDivergenceResult,
  BehavioralReplayDivergenceResultValidation,
  BehavioralReplayDivergenceScenario,
  ReplayCertificationOutcome,
} from "@/types/caf-behavioral-replay-divergence";

const VERSION = "caf-behavioral-replay-divergence/v3.11" as const;
const IDENTIFIER = "CafBehavioralReplayDivergence" as const;

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
function scenarioFailure(scenario: BehavioralReplayDivergenceScenario): BehavioralReplayDivergenceFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly BehavioralReplayDivergenceFailure[], failure: BehavioralReplayDivergenceFailure): boolean { return failures.includes(failure); }
function outcome(failures: readonly BehavioralReplayDivergenceFailure[]): ReplayCertificationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function divergenceTypes(failures: readonly BehavioralReplayDivergenceFailure[]): readonly BehavioralDivergenceType[] {
  if (has(failures, "UNKNOWN_DIVERGENCE_NOT_UNEXPLAINED")) return freezeArray(["UNEXPLAINED"]);
  if (has(failures, "COMPARISON_ENGINE_INVALID")) return freezeArray(["DECISION", "OUTCOME"]);
  return freezeArray(["NONE"]);
}

function resultReplayHash(result: Omit<BehavioralReplayDivergenceResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    context: result.replay_context.integrity_hash,
    reconstruction: result.reconstructed_behavior.integrity_hash,
    comparison: result.comparison_result.integrity_hash,
    divergence: result.divergence_analysis.integrity_hash,
    evidence: result.replay_evidence.integrity_hash,
    report: result.divergence_report.integrity_hash,
    qualification: result.replay_qualification.integrity_hash,
    record: result.replay_record.integrity_hash,
    validation: result.replay_validation.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<BehavioralReplayDivergenceResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runBehavioralReplayDivergence(input: BehavioralReplayDivergenceInput = {}): BehavioralReplayDivergenceResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<BehavioralReplayDivergenceFailure>(direct ? [direct] : []);
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
  const dependencyFailures = freezeArray<BehavioralReplayDivergenceFailure>([
    ...(!validateAgentIdentityLifecycle(p31).valid || has(scenarioFailures, "P3_1_AGENT_IDENTITY_INVALID") ? ["P3_1_AGENT_IDENTITY_INVALID" as const] : []),
    ...(!validateCapabilityComposition(p32).valid || has(scenarioFailures, "P3_2_CAPABILITY_INVALID") ? ["P3_2_CAPABILITY_INVALID" as const] : []),
    ...(!validateRuntimeOrchestration(p33).valid || has(scenarioFailures, "P3_3_RUNTIME_INVALID") ? ["P3_3_RUNTIME_INVALID" as const] : []),
    ...(!validateMemoryKnowledge(p34).valid || has(scenarioFailures, "P3_4_MEMORY_INVALID") ? ["P3_4_MEMORY_INVALID" as const] : []),
    ...(!validatePlanningReasoning(p35).valid || has(scenarioFailures, "P3_5_PLANNING_INVALID") ? ["P3_5_PLANNING_INVALID" as const] : []),
    ...(!validateCollaborationFederation(p36).valid || has(scenarioFailures, "P3_6_COLLABORATION_INVALID") ? ["P3_6_COLLABORATION_INVALID" as const] : []),
    ...(!validateGovernanceAuthorityPolicy(p37).valid || has(scenarioFailures, "P3_7_GOVERNANCE_INVALID") ? ["P3_7_GOVERNANCE_INVALID" as const] : []),
    ...(!validateSafetyBehavioralConstraints(p38).valid || has(scenarioFailures, "P3_8_SAFETY_INVALID") ? ["P3_8_SAFETY_INVALID" as const] : []),
    ...(!validateHumanOperatorInteraction(p39).valid || has(scenarioFailures, "P3_9_INTERACTION_INVALID") ? ["P3_9_INTERACTION_INVALID" as const] : []),
    ...(!validateObservabilityTelemetry(p310).valid || has(scenarioFailures, "P3_10_OBSERVABILITY_INVALID") ? ["P3_10_OBSERVABILITY_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const sourceRefs = freezeArray([
    "agent-identity:p3.1",
    "capability-composition:p3.2",
    "runtime-orchestration:p3.3",
    "memory:p3.4",
    "planning:p3.5",
    "collaboration:p3.6",
    p37.authority_decision.authority_decision_id,
    p37.policy_evaluation.policy_evaluation_id,
    p38.safety_gate.safety_gate_id,
    p39.operator_approval.approval_id,
    p310.trace_records[0]?.trace_id ?? "trace:p3.10:missing",
  ]);
  const evidenceRefs = has(failures, "REPLAY_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray(["evidence:p3.11:cci-replay", "evidence:p3.11:comparison", "evidence:p3.11:divergence"]);
  const replay_context = nested({
    context_id: "P3.11-BEHAVIORAL-REPLAY-CONTEXT-001",
    cci_replay_session_id: has(failures, "CCI_REPLAY_NOT_CONSUMED") ? "" : "cci-replay-session:p3.11:001",
    source_refs: has(failures, "REPLAY_CONTEXT_INCOMPLETE") ? freezeArray(sourceRefs.slice(0, 7)) : sourceRefs,
    deterministic: !has(failures, "REPLAY_CONTEXT_NON_DETERMINISTIC"),
    complete: !has(failures, "REPLAY_CONTEXT_INCOMPLETE"),
    consumes_cci_replay: !has(failures, "CCI_REPLAY_NOT_CONSUMED"),
    duplicates_cci_replay: has(failures, "CCI_REPLAY_DUPLICATED"),
  });
  const reconstructed_behavior = nested({
    reconstructed_behavior_id: "P3.11-RECONSTRUCTED-BEHAVIOR-001",
    reasoning_ref: "replay:reasoning:p3.11",
    planning_ref: "replay:planning:p3.11",
    memory_ref: "replay:memory:p3.11",
    execution_ref: "replay:execution:p3.11",
    interaction_ref: "replay:interaction:p3.11",
    single_interpretation: !has(failures, "MULTIPLE_BEHAVIORAL_INTERPRETATIONS"),
    complete: !has(failures, "BEHAVIOR_RECONSTRUCTION_INCOMPLETE"),
  });
  const divergence_types = divergenceTypes(failures);
  const comparison_result = nested({
    comparison_id: "P3.11-BEHAVIORAL-COMPARISON-001",
    reconstructed_behavior_ref: reconstructed_behavior.reconstructed_behavior_id,
    expected_behavior_ref: "expected-behavior:p3.11:baseline",
    behavioral_match: divergence_types.includes("NONE"),
    reasoning_match: !divergence_types.includes("REASONING"),
    decision_match: !divergence_types.includes("DECISION"),
    workflow_match: !divergence_types.includes("EXECUTION_ORDER"),
    execution_match: !divergence_types.includes("OUTCOME"),
    valid: !has(failures, "COMPARISON_ENGINE_INVALID"),
  });
  const divergence_analysis = nested({
    analysis_id: "P3.11-DIVERGENCE-ANALYSIS-001",
    divergence_detected: !divergence_types.includes("NONE"),
    divergence_types,
    root_cause_summary: divergence_types.includes("NONE") ? "No behavioral divergence detected." : "Behavioral divergence requires governance review.",
    governance_impact: divergence_types.includes("GOVERNANCE") || divergence_types.includes("AUTHORITY") || divergence_types.includes("POLICY") ? "governance impact detected" : "no governance impact",
    safety_impact: divergence_types.includes("SAFETY") ? "safety impact detected" : "no safety impact",
    confidence: has(failures, "DIVERGENCE_ANALYSIS_INCOMPLETE") ? 0.4 : 0.99,
    complete: !has(failures, "DIVERGENCE_ANALYSIS_INCOMPLETE"),
  });
  const replay_evidence = nested({
    evidence_id: "P3.11-BEHAVIORAL-REPLAY-EVIDENCE-001",
    cci_replay_evidence_refs: evidenceRefs,
    lineage_refs: has(failures, "REPLAY_LINEAGE_INCOMPLETE") ? freezeArray([]) : sourceRefs,
    replay_refs: freezeArray([replay_context.cci_replay_session_id]),
    divergence_evidence_refs: evidenceRefs,
    immutable: evidenceRefs.length > 0,
    complete: evidenceRefs.length > 0 && !has(failures, "REPLAY_LINEAGE_INCOMPLETE"),
  });
  const divergence_report = nested({
    report_id: "P3.11-DIVERGENCE-REPORT-001",
    summary: divergence_analysis.root_cause_summary,
    behavioral_explanation: "Replay comparison used one reconstructed execution path from CCI replay output.",
    impact_report: `${divergence_analysis.governance_impact}; ${divergence_analysis.safety_impact}`,
    recommendations: freezeArray(["retain replay evidence", "route divergence report to assurance", "continue deterministic replay sampling"]),
    replay_traceability_refs: replay_evidence.lineage_refs,
    reproducible: !has(failures, "DIVERGENCE_REPORT_NON_REPRODUCIBLE"),
  });
  const failClosed = !has(failures, "FAIL_CLOSED_NOT_ENFORCED");
  const replay_qualification = nested({
    qualification_id: "P3.11-REPLAY-QUALIFICATION-001",
    replay_verified: replay_context.consumes_cci_replay && replay_evidence.complete,
    behavior_qualified: reconstructed_behavior.complete && reconstructed_behavior.single_interpretation && failClosed,
    completeness_validated: replay_context.complete && divergence_analysis.complete,
    evidence_verified: replay_evidence.complete,
  });
  const replay_record = nested({
    replay_id: "P3.11-AGENT-BEHAVIORAL-REPLAY-001",
    execution_id: "execution:p3.11:historical-001",
    replay_session_id: replay_context.cci_replay_session_id,
    replay_context_ref: replay_context.context_id,
    reconstructed_behavior_ref: reconstructed_behavior.reconstructed_behavior_id,
    expected_behavior_ref: comparison_result.expected_behavior_ref,
    comparison_result: comparison_result.comparison_id,
    divergence_detected: divergence_analysis.divergence_detected,
    divergence_types: divergence_analysis.divergence_types,
    root_cause_summary: divergence_analysis.root_cause_summary,
    governance_impact: divergence_analysis.governance_impact,
    safety_impact: divergence_analysis.safety_impact,
    evidence_refs: replay_evidence.cci_replay_evidence_refs,
    replay_status: failClosed ? "COMPLETED" as const : "FAILED" as const,
  });
  const replay_validation = nested({
    replay_validation_id: "P3.11-REPLAY-VALIDATION-001",
    context_replayed: replay_context.deterministic,
    reconstruction_replayed: reconstructed_behavior.complete,
    comparison_replayed: comparison_result.valid,
    divergence_replayed: divergence_analysis.complete,
    evidence_replayed: replay_evidence.complete,
    report_replayed: divergence_report.reproducible,
    deterministic: !has(failures, "DIVERGENCE_REPORT_NON_REPRODUCIBLE"),
  });
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!replay_context.consumes_cci_replay ? ["CCI_REPLAY_NOT_CONSUMED" as const] : []),
    ...(replay_context.duplicates_cci_replay ? ["CCI_REPLAY_DUPLICATED" as const] : []),
    ...(!replay_context.deterministic ? ["REPLAY_CONTEXT_NON_DETERMINISTIC" as const] : []),
    ...(!replay_context.complete ? ["REPLAY_CONTEXT_INCOMPLETE" as const] : []),
    ...(!reconstructed_behavior.complete ? ["BEHAVIOR_RECONSTRUCTION_INCOMPLETE" as const] : []),
    ...(!reconstructed_behavior.single_interpretation ? ["MULTIPLE_BEHAVIORAL_INTERPRETATIONS" as const] : []),
    ...(!comparison_result.valid ? ["COMPARISON_ENGINE_INVALID" as const] : []),
    ...(!divergence_analysis.complete ? ["DIVERGENCE_ANALYSIS_INCOMPLETE" as const] : []),
    ...(has(failures, "UNKNOWN_DIVERGENCE_NOT_UNEXPLAINED") && !divergence_analysis.divergence_types.includes("UNEXPLAINED") ? ["UNKNOWN_DIVERGENCE_NOT_UNEXPLAINED" as const] : []),
    ...(!replay_evidence.immutable || replay_evidence.cci_replay_evidence_refs.length === 0 ? ["REPLAY_EVIDENCE_MISSING" as const] : []),
    ...(!divergence_report.reproducible ? ["DIVERGENCE_REPORT_NON_REPRODUCIBLE" as const] : []),
    ...(!replay_evidence.complete ? ["REPLAY_LINEAGE_INCOMPLETE" as const] : []),
    ...(!failClosed ? ["FAIL_CLOSED_NOT_ENFORCED" as const] : []),
  ])]);
  const certification: BehavioralReplayCertification = nested({
    certification_id: "P3.11-BEHAVIORAL-REPLAY-CERTIFICATION-GATE-001",
    outcome: outcome(derivedFailures),
    certified: outcome(derivedFailures) === "PASS",
    consumes_cci_replay: replay_context.consumes_cci_replay,
    does_not_duplicate_cci_replay: !replay_context.duplicates_cci_replay,
    context_deterministic: replay_context.deterministic,
    context_complete: replay_context.complete,
    reconstruction_complete: reconstructed_behavior.complete,
    single_behavioral_interpretation: reconstructed_behavior.single_interpretation,
    comparison_valid: comparison_result.valid,
    divergence_analysis_complete: divergence_analysis.complete,
    evidence_complete: replay_evidence.complete,
    report_reproducible: divergence_report.reproducible,
    lineage_complete: replay_evidence.lineage_refs.length >= 11,
    fail_closed_enforced: failClosed,
    failures: derivedFailures,
  });
  const base: Omit<BehavioralReplayDivergenceResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    cci_replay_ref: "Program 2 - CCI Replay Infrastructure",
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
    replay_context,
    reconstructed_behavior,
    comparison_result,
    divergence_analysis,
    replay_evidence,
    divergence_report,
    replay_qualification,
    replay_record,
    replay_validation,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateBehavioralReplayDivergence(result?: BehavioralReplayDivergenceResult): BehavioralReplayDivergenceResultValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, context_valid: false, reconstruction_valid: false, comparison_valid: false, divergence_valid: false, evidence_valid: false, report_valid: false, qualification_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.certification);
  const context_valid = verifyHashedRecord(result.replay_context) && result.replay_context.consumes_cci_replay && !result.replay_context.duplicates_cci_replay && result.replay_context.deterministic && result.replay_context.complete;
  const reconstruction_valid = verifyHashedRecord(result.reconstructed_behavior) && result.reconstructed_behavior.complete && result.reconstructed_behavior.single_interpretation;
  const comparison_valid = verifyHashedRecord(result.comparison_result) && result.comparison_result.valid;
  const divergence_valid = verifyHashedRecord(result.divergence_analysis) && result.divergence_analysis.complete;
  const evidence_valid = verifyHashedRecord(result.replay_evidence) && result.replay_evidence.immutable && result.replay_evidence.complete && result.replay_evidence.lineage_refs.length >= 11;
  const report_valid = verifyHashedRecord(result.divergence_report) && result.divergence_report.reproducible && result.divergence_report.replay_traceability_refs.length >= 11;
  const qualification_valid = verifyHashedRecord(result.replay_qualification) && result.replay_qualification.replay_verified && result.replay_qualification.behavior_qualified && result.replay_qualification.completeness_validated && result.replay_qualification.evidence_verified;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.certified;
  const valid = replay_hash_valid && integrity_hash_valid && context_valid && reconstruction_valid && comparison_valid && divergence_valid && evidence_valid && report_valid && qualification_valid && certification_valid && result.replay_validation.deterministic;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, context_valid, reconstruction_valid, comparison_valid, divergence_valid, evidence_valid, report_valid, qualification_valid, certification_valid, failures: result.certification.failures });
}

export function replayBehavioralReplayDivergence(result = runBehavioralReplayDivergence()): boolean {
  const replayed = runBehavioralReplayDivergence();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateBehavioralReplayDivergence(result).valid;
}

export function getBehavioralReplayDivergenceBundle(): BehavioralReplayDivergenceBundle {
  const result = runBehavioralReplayDivergence();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_behavioral_replay_orchestration: true,
      owns_divergence_analysis: true,
      owns_replay_evidence: true,
      consumes_cci_replay: true,
      implements_replay_infrastructure: false,
      single_behavioral_interpretation_required: true,
      fail_closed_required: true,
    }),
    result,
    validation: validateBehavioralReplayDivergence(result),
  });
}

export const BehavioralReplayDivergenceService = Object.freeze({
  run: runBehavioralReplayDivergence,
  validate: validateBehavioralReplayDivergence,
  replay: replayBehavioralReplayDivergence,
});
