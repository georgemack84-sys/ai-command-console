import { runBehavioralReplayDivergence, validateBehavioralReplayDivergence } from "@/services/caf-behavioral-replay-divergence";
import { runGovernanceAuthorityPolicy, validateGovernanceAuthorityPolicy } from "@/services/caf-governance-authority-policy";
import { runObservabilityTelemetry, validateObservabilityTelemetry } from "@/services/caf-observability-telemetry";
import { runPlanningReasoning, validatePlanningReasoning } from "@/services/caf-planning-reasoning";
import { runSafetyBehavioralConstraints, validateSafetyBehavioralConstraints } from "@/services/caf-safety-behavioral-constraints";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AdaptationEvidenceRecord,
  LearningAdaptationBundle,
  LearningAdaptationFailure,
  LearningAdaptationInput,
  LearningAdaptationResult,
  LearningAdaptationScenario,
  LearningAdaptationValidation,
  LearningCertificationOutcome,
  LearningLifecycleState,
} from "@/types/caf-learning-adaptation";

const VERSION = "caf-learning-adaptation/v3.12" as const;
const IDENTIFIER = "CafLearningAdaptation" as const;
const LIFECYCLE: readonly LearningLifecycleState[] = Object.freeze([
  "CANDIDATE_IDENTIFIED",
  "EVIDENCE_COLLECTED",
  "PROPOSED",
  "GOVERNANCE_REVIEW",
  "REPLAY_VALIDATION",
  "SAFETY_VALIDATION",
  "QUALIFICATION",
  "APPROVED",
  "ACTIVATED",
  "SUPERSEDED",
  "RETIRED",
]);

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
function scenarioFailure(scenario: LearningAdaptationScenario): LearningAdaptationFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly LearningAdaptationFailure[], failure: LearningAdaptationFailure): boolean { return failures.includes(failure); }
function outcome(failures: readonly LearningAdaptationFailure[]): LearningCertificationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function buildEvidence(failures: readonly LearningAdaptationFailure[], proposalId: string, sourceRefs: readonly string[], replayRefs: readonly string[], governanceRefs: readonly string[]): readonly AdaptationEvidenceRecord[] {
  if (has(failures, "ADAPTATION_EVIDENCE_MISSING")) return freezeArray([]);
  return freezeArray(["PROPOSAL", "REPLAY", "GOVERNANCE", "SAFETY", "QUALIFICATION", "APPROVAL", "ACTIVATION"].map((type, index) => nested({
    evidence_id: `P3.12-ADAPTATION-EVIDENCE-${String(index + 1).padStart(3, "0")}`,
    proposal_id: proposalId,
    evidence_type: type as AdaptationEvidenceRecord["evidence_type"],
    source_refs: sourceRefs,
    replay_refs: replayRefs,
    governance_refs: governanceRefs,
    timestamp: `2026-07-17T00:30:0${index}.000Z`,
    immutable: true,
  })));
}

function resultReplayHash(result: Omit<LearningAdaptationResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    lifecycle: result.lifecycle.integrity_hash,
    proposal: result.proposal.integrity_hash,
    assessment: result.assessment.integrity_hash,
    learning: result.learning_record.integrity_hash,
    evidence: result.evidence_records.map((record) => record.integrity_hash),
    bounded: result.bounded_improvement.integrity_hash,
    governance: result.governance_workflow.integrity_hash,
    telemetry: result.telemetry.integrity_hash,
    replay: result.replay_validation.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<LearningAdaptationResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runLearningAdaptation(input: LearningAdaptationInput = {}): LearningAdaptationResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<LearningAdaptationFailure>(direct ? [direct] : []);
  const p35 = runPlanningReasoning();
  const p37 = runGovernanceAuthorityPolicy();
  const p38 = runSafetyBehavioralConstraints();
  const p310 = runObservabilityTelemetry();
  const p311 = runBehavioralReplayDivergence();
  const dependencyFailures = freezeArray<LearningAdaptationFailure>([
    ...(!validatePlanningReasoning(p35).valid || has(scenarioFailures, "P3_5_PLANNING_INVALID") ? ["P3_5_PLANNING_INVALID" as const] : []),
    ...(!validateGovernanceAuthorityPolicy(p37).valid || has(scenarioFailures, "P3_7_GOVERNANCE_INVALID") ? ["P3_7_GOVERNANCE_INVALID" as const] : []),
    ...(!validateSafetyBehavioralConstraints(p38).valid || has(scenarioFailures, "P3_8_SAFETY_INVALID") ? ["P3_8_SAFETY_INVALID" as const] : []),
    ...(!validateObservabilityTelemetry(p310).valid || has(scenarioFailures, "P3_10_OBSERVABILITY_INVALID") ? ["P3_10_OBSERVABILITY_INVALID" as const] : []),
    ...(!validateBehavioralReplayDivergence(p311).valid || has(scenarioFailures, "P3_11_REPLAY_INVALID") ? ["P3_11_REPLAY_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const sourceRefs = freezeArray(["caf-planning-reasoning/v3.5", p37.gate_result.gate_id, p38.safety_gate.safety_gate_id, p310.evidence.evidence_id, p311.replay_record.replay_id]);
  const replayRefs = has(failures, "REPLAY_VALIDATION_MISSING") ? freezeArray([]) : freezeArray([p311.replay_record.replay_id, "cci-replay:p3.12:validation"]);
  const governanceRefs = freezeArray([p37.authority_decision.authority_decision_id, p37.policy_evaluation.policy_evaluation_id]);
  const safetyRefs = freezeArray([p38.safety_gate.safety_gate_id]);
  const lifecycle = nested({
    lifecycle_id: "P3.12-LEARNING-LIFECYCLE-001",
    states: has(failures, "LEARNING_LIFECYCLE_NON_DETERMINISTIC") ? freezeArray([...LIFECYCLE].reverse()) : LIFECYCLE,
    deterministic: !has(failures, "LEARNING_LIFECYCLE_NON_DETERMINISTIC"),
    current_state: "ACTIVATED" as const,
  });
  const proposal = nested({
    proposal_id: has(failures, "ADAPTATION_PROPOSAL_MISSING") ? "" : "P3.12-ADAPTATION-PROPOSAL-001",
    agent_id: "agent:p3.12:learning",
    proposal_type: "BEHAVIORAL_REFINEMENT" as const,
    rationale: has(failures, "ADAPTATION_NOT_EXPLAINABLE") ? "" : "Refine behavior using replay-validated operational evidence without expanding authority.",
    expected_improvement: "Reduce operator review latency while preserving approval gates.",
    evidence_refs: sourceRefs,
    replay_refs: replayRefs,
    governance_refs: governanceRefs,
    safety_refs: safetyRefs,
    created_at: "2026-07-17T00:30:00.000Z",
    explainable: !has(failures, "ADAPTATION_NOT_EXPLAINABLE"),
  });
  const replayValidated = replayRefs.length > 0 && !has(failures, "REPLAY_DIVERGENCE");
  const governanceOk = !has(failures, "AUTHORITY_GATE_BYPASSED") && !has(failures, "POLICY_GATE_BYPASSED") && !has(failures, "AUTHORITY_EXPANSION_ATTEMPTED") && !has(failures, "CONSTITUTIONAL_GOVERNANCE_MODIFIED");
  const safetyOk = !has(failures, "SAFETY_GATE_BYPASSED");
  const boundedOk = !has(failures, "BOUNDED_IMPROVEMENT_VIOLATED") && !has(failures, "AUTHORITY_EXPANSION_ATTEMPTED") && !has(failures, "CONSTITUTIONAL_GOVERNANCE_MODIFIED");
  const assessment = nested({
    assessment_id: "P3.12-ADAPTATION-ASSESSMENT-001",
    proposal_id: proposal.proposal_id,
    replay_result: replayValidated ? "VALIDATED" as const : has(failures, "REPLAY_DIVERGENCE") ? "DIVERGED" as const : "MISSING" as const,
    governance_result: governanceOk ? "COMPLIANT" as const : "BYPASSED" as const,
    safety_result: safetyOk ? "SAFE" as const : "BYPASSED" as const,
    qualification_result: has(failures, "ADAPTATION_QUALIFICATION_INVALID") || !replayValidated || !governanceOk || !safetyOk || !boundedOk ? "FAIL_CLOSED" as const : "QUALIFIED" as const,
    bounded_improvement_result: boundedOk ? "WITHIN_LIMITS" as const : "VIOLATED" as const,
    approval_required: true,
    assessment_summary: "Adaptation requires governed approval, replay validation, safety validation, and bounded improvement.",
  });
  const evidence_records = buildEvidence(failures, proposal.proposal_id, sourceRefs, replayRefs, governanceRefs);
  const lineageRefs = has(failures, "ADAPTATION_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray([...sourceRefs, ...replayRefs, ...governanceRefs, ...safetyRefs]);
  const learning_record = nested({
    learning_record_id: "P3.12-LEARNING-RECORD-001",
    agent_id: proposal.agent_id,
    lifecycle_state: lifecycle.current_state,
    proposal_refs: proposal.proposal_id ? freezeArray([proposal.proposal_id]) : freezeArray([]),
    adaptation_refs: freezeArray(["adaptation:p3.12:activated"]),
    replay_refs: replayRefs,
    evidence_refs: freezeArray(evidence_records.map((record) => record.evidence_id)),
    approval_refs: has(failures, "APPROVAL_INTEGRATION_MISSING") ? freezeArray([]) : freezeArray(["approval:p3.9:operator", "approval:p3.12:learning-governance"]),
    lineage_refs: lineageRefs,
  });
  const bounded_improvement = nested({
    bounded_contract_id: "P3.12-BOUNDED-IMPROVEMENT-001",
    improvement_ceiling_ref: "ceiling:p3.12:no-authority-expansion",
    optimization_limit_refs: freezeArray(["limit:policy-preserved", "limit:safety-preserved", "limit:rollback-required"]),
    authority_preserved: !has(failures, "AUTHORITY_EXPANSION_ATTEMPTED"),
    behavioral_boundaries_preserved: !has(failures, "BOUNDED_IMPROVEMENT_VIOLATED"),
    constitutional_limits_preserved: !has(failures, "CONSTITUTIONAL_GOVERNANCE_MODIFIED"),
    rollback_eligible: true,
  });
  const governance_workflow = nested({
    workflow_id: "P3.12-LEARNING-GOVERNANCE-001",
    policy_review_ref: p37.policy_evaluation.policy_evaluation_id,
    authority_validation_ref: p37.authority_decision.authority_decision_id,
    safety_validation_ref: p38.safety_gate.safety_gate_id,
    approval_workflow_ref: has(failures, "APPROVAL_INTEGRATION_MISSING") ? "" : "approval-workflow:p3.9:p3.12",
    activation_ref: "activation:p3.12:governed",
    authority_gate_enforced: !has(failures, "AUTHORITY_GATE_BYPASSED"),
    policy_gate_enforced: !has(failures, "POLICY_GATE_BYPASSED"),
    safety_gate_enforced: !has(failures, "SAFETY_GATE_BYPASSED"),
    approval_integrated: !has(failures, "APPROVAL_INTEGRATION_MISSING"),
  });
  const telemetry = nested({
    telemetry_id: "P3.12-ADAPTATION-TELEMETRY-001",
    metrics: freezeArray(["adaptation_activity", "proposal_rate", "replay_success", "approval_rate", "divergence", "rollback_frequency", "evidence_completeness"]),
    dashboard_refs: has(failures, "ADAPTATION_OBSERVABILITY_INCOMPLETE") ? freezeArray([]) : freezeArray(["dashboard:p3.12:learning", p310.dashboards[0]?.dashboard_id ?? "dashboard:p3.10:agent"]),
    complete: !has(failures, "ADAPTATION_OBSERVABILITY_INCOMPLETE"),
  });
  const replay_validation = nested({
    replay_validation_id: "P3.12-ADAPTATION-REPLAY-VALIDATION-001",
    p3_11_replay_ref: p311.replay_record.replay_id,
    cci_replay_ref: has(failures, "CCI_REPLAY_NOT_CONSUMED") ? "" : "Program 2 - CCI Replay Infrastructure",
    replay_validated: replayValidated,
    deterministic: !has(failures, "REPLAY_DIVERGENCE"),
    duplicates_replay_infrastructure: has(failures, "CCI_REPLAY_DUPLICATED"),
  });
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!replay_validation.cci_replay_ref ? ["CCI_REPLAY_NOT_CONSUMED" as const] : []),
    ...(replay_validation.duplicates_replay_infrastructure ? ["CCI_REPLAY_DUPLICATED" as const] : []),
    ...(!lifecycle.deterministic ? ["LEARNING_LIFECYCLE_NON_DETERMINISTIC" as const] : []),
    ...(proposal.proposal_id.length === 0 ? ["ADAPTATION_PROPOSAL_MISSING" as const] : []),
    ...(assessment.qualification_result !== "QUALIFIED" && has(failures, "ADAPTATION_QUALIFICATION_INVALID") ? ["ADAPTATION_QUALIFICATION_INVALID" as const] : []),
    ...(!governance_workflow.authority_gate_enforced ? ["AUTHORITY_GATE_BYPASSED" as const] : []),
    ...(!governance_workflow.policy_gate_enforced ? ["POLICY_GATE_BYPASSED" as const] : []),
    ...(!governance_workflow.safety_gate_enforced ? ["SAFETY_GATE_BYPASSED" as const] : []),
    ...(!replay_validation.replay_validated ? ["REPLAY_VALIDATION_MISSING" as const] : []),
    ...(evidence_records.length < 7 || evidence_records.some((record) => !record.immutable) ? ["ADAPTATION_EVIDENCE_MISSING" as const] : []),
    ...(learning_record.lineage_refs.length === 0 || learning_record.proposal_refs.length === 0 ? ["LEARNING_REGISTRY_INCOMPLETE" as const] : []),
    ...(!bounded_improvement.behavioral_boundaries_preserved ? ["BOUNDED_IMPROVEMENT_VIOLATED" as const] : []),
    ...(!bounded_improvement.authority_preserved ? ["AUTHORITY_EXPANSION_ATTEMPTED" as const] : []),
    ...(!bounded_improvement.constitutional_limits_preserved ? ["CONSTITUTIONAL_GOVERNANCE_MODIFIED" as const] : []),
    ...(!proposal.explainable ? ["ADAPTATION_NOT_EXPLAINABLE" as const] : []),
    ...(lineageRefs.length === 0 ? ["ADAPTATION_LINEAGE_INCOMPLETE" as const] : []),
    ...(!telemetry.complete ? ["ADAPTATION_OBSERVABILITY_INCOMPLETE" as const] : []),
    ...(!governance_workflow.approval_integrated || learning_record.approval_refs.length === 0 ? ["APPROVAL_INTEGRATION_MISSING" as const] : []),
    ...(!replay_validation.deterministic ? ["REPLAY_DIVERGENCE" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P3.12-LEARNING-ADAPTATION-CERTIFICATION-GATE-001",
    outcome: outcome(derivedFailures),
    certified: outcome(derivedFailures) === "PASS",
    governed_adaptation: governance_workflow.authority_gate_enforced && governance_workflow.policy_gate_enforced && governance_workflow.safety_gate_enforced,
    lifecycle_deterministic: lifecycle.deterministic,
    proposal_present: proposal.proposal_id.length > 0,
    qualification_valid: assessment.qualification_result === "QUALIFIED",
    replay_validated: replay_validation.replay_validated,
    cci_replay_consumed_without_duplication: replay_validation.cci_replay_ref.length > 0 && !replay_validation.duplicates_replay_infrastructure,
    gates_enforced: governance_workflow.authority_gate_enforced && governance_workflow.policy_gate_enforced && governance_workflow.safety_gate_enforced,
    evidence_immutable: evidence_records.length >= 7 && evidence_records.every((record) => record.immutable),
    registry_complete: learning_record.proposal_refs.length > 0 && learning_record.lineage_refs.length > 0,
    bounded_improvement: bounded_improvement.behavioral_boundaries_preserved && bounded_improvement.constitutional_limits_preserved,
    no_authority_expansion: bounded_improvement.authority_preserved,
    no_constitutional_modification: bounded_improvement.constitutional_limits_preserved,
    explainable: proposal.explainable,
    lineage_complete: lineageRefs.length > 0,
    observability_complete: telemetry.complete,
    approval_integrated: governance_workflow.approval_integrated,
    replay_reproducible: replay_validation.deterministic,
    failures: derivedFailures,
  });
  const base: Omit<LearningAdaptationResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    planning_reasoning_ref: "caf-planning-reasoning/v3.5",
    governance_authority_policy_ref: "caf-governance-authority-policy/v3.7",
    safety_behavioral_constraints_ref: "caf-safety-behavioral-constraints/v3.8",
    observability_telemetry_ref: "caf-observability-telemetry/v3.10",
    behavioral_replay_divergence_ref: "caf-behavioral-replay-divergence/v3.11",
    cci_replay_ref: "Program 2 - CCI Replay Infrastructure",
    cci_evidence_ref: "Program 2 - CCI Evidence Infrastructure",
    cci_registry_ref: "Program 2 - CCI Registry",
    cci_storage_ref: "Program 2 - CCI Storage",
    lifecycle,
    proposal,
    assessment,
    learning_record,
    evidence_records,
    bounded_improvement,
    governance_workflow,
    telemetry,
    replay_validation,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateLearningAdaptation(result?: LearningAdaptationResult): LearningAdaptationValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, lifecycle_valid: false, proposal_valid: false, assessment_valid: false, registry_valid: false, evidence_valid: false, bounded_valid: false, governance_valid: false, replay_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.certification);
  const lifecycle_valid = verifyHashedRecord(result.lifecycle) && result.lifecycle.deterministic && result.lifecycle.states[0] === "CANDIDATE_IDENTIFIED";
  const proposal_valid = verifyHashedRecord(result.proposal) && result.proposal.proposal_id.length > 0 && result.proposal.explainable && result.proposal.replay_refs.length > 0;
  const assessment_valid = verifyHashedRecord(result.assessment) && result.assessment.qualification_result === "QUALIFIED" && result.assessment.replay_result === "VALIDATED" && result.assessment.governance_result === "COMPLIANT" && result.assessment.safety_result === "SAFE";
  const registry_valid = verifyHashedRecord(result.learning_record) && result.learning_record.proposal_refs.length > 0 && result.learning_record.lineage_refs.length > 0 && result.learning_record.approval_refs.length > 0;
  const evidence_valid = result.evidence_records.length >= 7 && result.evidence_records.every((record) => verifyHashedRecord(record) && record.immutable);
  const bounded_valid = verifyHashedRecord(result.bounded_improvement) && result.bounded_improvement.authority_preserved && result.bounded_improvement.behavioral_boundaries_preserved && result.bounded_improvement.constitutional_limits_preserved && result.bounded_improvement.rollback_eligible;
  const governance_valid = verifyHashedRecord(result.governance_workflow) && result.governance_workflow.authority_gate_enforced && result.governance_workflow.policy_gate_enforced && result.governance_workflow.safety_gate_enforced && result.governance_workflow.approval_integrated;
  const replay_valid = verifyHashedRecord(result.replay_validation) && result.replay_validation.replay_validated && result.replay_validation.deterministic && !result.replay_validation.duplicates_replay_infrastructure && result.replay_validation.cci_replay_ref.length > 0;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.certified;
  const valid = replay_hash_valid && integrity_hash_valid && lifecycle_valid && proposal_valid && assessment_valid && registry_valid && evidence_valid && bounded_valid && governance_valid && replay_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, lifecycle_valid, proposal_valid, assessment_valid, registry_valid, evidence_valid, bounded_valid, governance_valid, replay_valid, certification_valid, failures: result.certification.failures });
}

export function replayLearningAdaptation(result = runLearningAdaptation()): boolean {
  const replayed = runLearningAdaptation();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateLearningAdaptation(result).valid;
}

export function getLearningAdaptationBundle(): LearningAdaptationBundle {
  const result = runLearningAdaptation();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_governed_learning: true,
      owns_adaptation_proposals: true,
      owns_learning_registry: true,
      owns_adaptation_evidence: true,
      owns_runtime_execution: false,
      owns_replay_infrastructure: false,
      owns_certification: false,
      may_expand_authority: false,
      may_modify_constitutional_governance: false,
    }),
    result,
    validation: validateLearningAdaptation(result),
  });
}

export const LearningAdaptationService = Object.freeze({
  run: runLearningAdaptation,
  validate: validateLearningAdaptation,
  replay: replayLearningAdaptation,
});
