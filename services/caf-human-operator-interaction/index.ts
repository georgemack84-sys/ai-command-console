import { runCafConstitutionalFoundation, validateCafConstitutionalFoundation } from "@/services/caf-constitutional-foundation";
import { runGovernanceAuthorityPolicy, validateGovernanceAuthorityPolicy } from "@/services/caf-governance-authority-policy";
import { runSafetyBehavioralConstraints, validateSafetyBehavioralConstraints } from "@/services/caf-safety-behavioral-constraints";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  HumanOperatorInteractionBundle,
  HumanOperatorInteractionFailure,
  HumanOperatorInteractionInput,
  HumanOperatorInteractionResult,
  HumanOperatorInteractionScenario,
  HumanOperatorInteractionValidation,
  InteractionCertificationOutcome,
  WarningDispositionRecord,
} from "@/types/caf-human-operator-interaction";

const VERSION = "caf-human-operator-interaction/v3.9" as const;
const IDENTIFIER = "CafHumanOperatorInteraction" as const;
const CANONICAL_SEQUENCE = Object.freeze([
  "Resolve Authority Matrix approval requirement",
  "P3.9 Operator approval when required",
  "P3.7 Authority Gate",
  "P3.7 Policy Gate",
  "P3.8 Safety Gate",
  "Warning disposition",
  "Execution admission",
  "Authorized execution",
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
function scenarioFailure(scenario: HumanOperatorInteractionScenario): HumanOperatorInteractionFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly HumanOperatorInteractionFailure[], failure: HumanOperatorInteractionFailure): boolean { return failures.includes(failure); }
function outcome(failures: readonly HumanOperatorInteractionFailure[]): InteractionCertificationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function buildWarningDispositions(failures: readonly HumanOperatorInteractionFailure[], evidenceRefs: readonly string[]): readonly WarningDispositionRecord[] {
  const missing = has(failures, "WARNING_ACKNOWLEDGEMENT_MISSING");
  const replayable = !has(failures, "WARNING_DISPOSITION_NOT_REPLAYABLE");
  const dispositions: readonly WarningDispositionRecord[] = [
    nested({
      disposition_id: "P3.9-WARNING-DISPOSITION-001",
      warning_id: "P3.7-WARN-001",
      warning_type: "APPROVAL_REQUIRED",
      warning_source: "P3.7_AUTHORITY" as const,
      operator_response: "ACKNOWLEDGED" as const,
      acknowledgement_required: true,
      acknowledgement_timestamp: missing ? "" : "2026-07-17T00:10:00.000Z",
      escalation_required: false,
      escalation_status: "NOT_REQUIRED" as const,
      replayable,
      evidence_refs: missing ? freezeArray([]) : evidenceRefs,
    }),
    nested({
      disposition_id: "P3.9-WARNING-DISPOSITION-002",
      warning_id: "P3.8-WARNING-001",
      warning_type: "SAFETY_POLICY_WARNING",
      warning_source: "P3.8_SAFETY" as const,
      operator_response: "ACCEPTED" as const,
      acknowledgement_required: true,
      acknowledgement_timestamp: missing ? "" : "2026-07-17T00:10:01.000Z",
      escalation_required: false,
      escalation_status: "NOT_REQUIRED" as const,
      replayable,
      evidence_refs: missing ? freezeArray([]) : evidenceRefs,
    }),
  ];
  return freezeArray(dispositions);
}

function resultReplayHash(result: Omit<HumanOperatorInteractionResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    session: result.interaction_session.integrity_hash,
    presentation: result.decision_presentation.integrity_hash,
    approval: result.operator_approval.integrity_hash,
    warnings: result.warning_dispositions.map((disposition) => disposition.integrity_hash),
    escalation: result.escalation_request.integrity_hash,
    intervention: result.intervention_record.integrity_hash,
    sequence: result.runtime_execution_sequence.integrity_hash,
    authorization: result.execution_authorization.integrity_hash,
    evidence: result.evidence_ledger.integrity_hash,
    observability: result.observability.integrity_hash,
    replay: result.replay_validation.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<HumanOperatorInteractionResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runHumanOperatorInteraction(input: HumanOperatorInteractionInput = {}): HumanOperatorInteractionResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<HumanOperatorInteractionFailure>(direct ? [direct] : []);
  const p30 = runCafConstitutionalFoundation();
  const p37 = runGovernanceAuthorityPolicy();
  const p38 = runSafetyBehavioralConstraints();
  const dependencyFailures = freezeArray<HumanOperatorInteractionFailure>([
    ...(!validateCafConstitutionalFoundation(p30).valid || has(scenarioFailures, "P3_0_AUTHORITY_MATRIX_INVALID") ? ["P3_0_AUTHORITY_MATRIX_INVALID" as const] : []),
    ...(!validateGovernanceAuthorityPolicy(p37).valid || has(scenarioFailures, "P3_7_GOVERNANCE_INVALID") ? ["P3_7_GOVERNANCE_INVALID" as const] : []),
    ...(!validateSafetyBehavioralConstraints(p38).valid || has(scenarioFailures, "P3_8_SAFETY_INVALID") ? ["P3_8_SAFETY_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const evidenceRefs = has(failures, "APPROVAL_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray(["evidence:p3.9:approval", "evidence:p3.9:warning-disposition", "evidence:p3.9:intervention", "evidence:p3.9:sequence"]);
  const interaction_session = nested({
    session_id: "P3.9-INTERACTION-SESSION-001",
    execution_request_id: "request:p3.9:execution-001",
    interaction_types: freezeArray(["EXECUTION_APPROVAL" as const, "WARNING_ACKNOWLEDGEMENT" as const, "SAFETY_ACKNOWLEDGEMENT" as const, "AUTHORITY_APPROVAL" as const, "INTERVENTION_REQUEST" as const]),
    lifecycle_state: has(failures, "FAIL_CLOSED_NOT_ENFORCED") ? "ADMISSION_PRODUCED" as const : "ADMISSION_PRODUCED" as const,
    exclusive_operator_layer: !has(failures, "INTERACTION_FRAMEWORK_DUPLICATED"),
    timeout_policy_ref: "timeout:p3.9:operator-escalation",
    replay_refs: freezeArray(["replay:p3.9:session"]),
  });
  const decision_presentation = nested({
    presentation_id: "P3.9-DECISION-PRESENTATION-001",
    execution_request_id: interaction_session.execution_request_id,
    authority_requirement_ref: has(failures, "APPROVAL_REQUIREMENT_NOT_RESOLVED") ? "" : "authority-matrix:p3.0:approval-required",
    policy_result_ref: p37.policy_evaluation.policy_evaluation_id,
    safety_result_ref: p38.safety_gate.safety_gate_id,
    warning_refs: freezeArray(["P3.7-WARN-001", "P3.8-WARNING-001"]),
    required_approval_refs: freezeArray(["operator-approval:p3.9"]),
    execution_consequence_refs: has(failures, "DECISION_PRESENTATION_INCOMPLETE") ? freezeArray([]) : freezeArray(["consequence:admission", "consequence:containment", "consequence:audit"]),
    complete: !has(failures, "DECISION_PRESENTATION_INCOMPLETE") && !has(failures, "APPROVAL_REQUIREMENT_NOT_RESOLVED"),
  });
  const operator_approval = nested({
    approval_id: "P3.9-OPERATOR-APPROVAL-001",
    execution_request_id: interaction_session.execution_request_id,
    operator_id: has(failures, "OPERATOR_APPROVAL_MISSING") ? "" : "operator:p3.9:primary",
    authority_role: "mission-operator",
    approval_required: true,
    approval_decision: has(failures, "OPERATOR_APPROVAL_MISSING") ? "DEFER" as const : "APPROVE" as const,
    approval_reason: "Execution request approved after authority, policy, and safety presentation.",
    approval_timestamp: has(failures, "OPERATOR_APPROVAL_MISSING") ? "" : "2026-07-17T00:09:00.000Z",
    expiration: "2026-07-17T01:09:00.000Z",
    authority_verified: !has(failures, "OPERATOR_AUTHORITY_INVALID"),
    deterministic: !has(failures, "APPROVAL_NON_DETERMINISTIC"),
    evidence_refs: evidenceRefs,
    replay_refs: freezeArray(["replay:p3.9:approval"]),
  });
  const warning_dispositions = buildWarningDispositions(failures, evidenceRefs);
  const escalation_request = nested({
    escalation_id: "P3.9-ESCALATION-001",
    escalation_type: "GOVERNANCE" as const,
    trigger_ref: "trigger:p3.9:operator-review",
    route_ref: has(failures, "ESCALATION_ROUTING_INVALID") ? "" : "route:governance-dashboard",
    routed: !has(failures, "ESCALATION_ROUTING_INVALID"),
    deterministic: !has(failures, "ESCALATION_ROUTING_INVALID"),
    evidence_refs: evidenceRefs,
  });
  const intervention_record = nested({
    intervention_id: "P3.9-INTERVENTION-001",
    request_ref: "intervention-request:p3.8:safety",
    action: "AUTHORIZE_RESUME" as const,
    operator_id: operator_approval.operator_id,
    governed: !has(failures, "INTERVENTION_GOVERNANCE_INVALID"),
    resume_authorization_ref: has(failures, "INTERVENTION_GOVERNANCE_INVALID") ? "" : "resume:p3.9:authorized",
    evidence_refs: evidenceRefs,
  });
  const sequenceSteps = has(failures, "EXECUTION_SEQUENCE_REORDERED")
    ? freezeArray([CANONICAL_SEQUENCE[0], CANONICAL_SEQUENCE[2], CANONICAL_SEQUENCE[1], ...CANONICAL_SEQUENCE.slice(3)])
    : CANONICAL_SEQUENCE;
  const runtime_execution_sequence = nested({
    sequence_id: "P3.9-RUNTIME-SEQUENCE-001",
    steps: sequenceSteps,
    canonical_order_enforced: sequenceSteps.join("|") === CANONICAL_SEQUENCE.join("|"),
    bypass_detected: has(failures, "EXECUTION_SEQUENCE_BYPASSED"),
    parallelization_detected: has(failures, "EXECUTION_SEQUENCE_REORDERED"),
    admission_after_disposition: !has(failures, "ADMISSION_BEFORE_DISPOSITION"),
    fail_closed_enforced: !has(failures, "FAIL_CLOSED_NOT_ENFORCED"),
  });
  const warningDispositionComplete = warning_dispositions.every((disposition) => !disposition.acknowledgement_required || (disposition.acknowledgement_timestamp.length > 0 && disposition.replayable));
  const authorizationAllowed = operator_approval.approval_decision === "APPROVE" && operator_approval.authority_verified && warningDispositionComplete && runtime_execution_sequence.canonical_order_enforced && runtime_execution_sequence.admission_after_disposition && runtime_execution_sequence.fail_closed_enforced;
  const execution_authorization = nested({
    authorization_id: "P3.9-EXECUTION-AUTHORIZATION-001",
    execution_request_id: interaction_session.execution_request_id,
    approval_ref: operator_approval.approval_id,
    gate_result_ref: p37.gate_result.gate_id,
    safety_gate_ref: p38.safety_gate.safety_gate_id,
    warning_disposition_refs: freezeArray(warning_dispositions.map((disposition) => disposition.disposition_id)),
    admission_state: authorizationAllowed ? "AUTHORIZED" as const : has(failures, "FAIL_CLOSED_NOT_ENFORCED") ? "AUTHORIZED" as const : "FAIL_CLOSED" as const,
    evidence_refs: evidenceRefs,
  });
  const evidence_ledger = nested({
    ledger_id: "P3.9-APPROVAL-EVIDENCE-LEDGER-001",
    approval_refs: freezeArray([operator_approval.approval_id]),
    acknowledgement_refs: freezeArray(warning_dispositions.map((disposition) => disposition.disposition_id)),
    escalation_refs: freezeArray([escalation_request.escalation_id]),
    intervention_refs: freezeArray([intervention_record.intervention_id]),
    presentation_refs: freezeArray([decision_presentation.presentation_id]),
    operator_decision_refs: freezeArray([operator_approval.approval_id]),
    immutable: evidenceRefs.length > 0,
    auditable: evidenceRefs.length > 0,
    replayable: evidenceRefs.length > 0,
  });
  const observability = nested({
    observability_id: "P3.9-INTERACTION-OBSERVABILITY-001",
    metrics: freezeArray(["approval_latency", "escalation_frequency", "intervention_rate", "acknowledgement_rate", "timeout_rate", "operator_workload", "replay_success"]),
    complete: !has(failures, "OBSERVABILITY_INCOMPLETE"),
    deterministic: true,
  });
  const replay_validation = nested({
    replay_validation_id: "P3.9-REPLAY-VALIDATION-001",
    presentation_replayed: decision_presentation.complete,
    approvals_replayed: operator_approval.deterministic,
    acknowledgements_replayed: warningDispositionComplete,
    interventions_replayed: intervention_record.governed,
    sequence_replayed: runtime_execution_sequence.canonical_order_enforced,
    admission_replayed: execution_authorization.admission_state === "AUTHORIZED",
    deterministic: !has(failures, "INTERACTION_REPLAY_DIVERGENCE"),
  });
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!interaction_session.exclusive_operator_layer ? ["INTERACTION_FRAMEWORK_DUPLICATED" as const] : []),
    ...(decision_presentation.authority_requirement_ref.length === 0 ? ["APPROVAL_REQUIREMENT_NOT_RESOLVED" as const] : []),
    ...(operator_approval.operator_id.length === 0 || operator_approval.approval_decision !== "APPROVE" ? ["OPERATOR_APPROVAL_MISSING" as const] : []),
    ...(!operator_approval.authority_verified ? ["OPERATOR_AUTHORITY_INVALID" as const] : []),
    ...(!operator_approval.deterministic ? ["APPROVAL_NON_DETERMINISTIC" as const] : []),
    ...(!warningDispositionComplete ? ["WARNING_ACKNOWLEDGEMENT_MISSING" as const] : []),
    ...(warning_dispositions.some((disposition) => !disposition.replayable) ? ["WARNING_DISPOSITION_NOT_REPLAYABLE" as const] : []),
    ...(!escalation_request.routed || !escalation_request.deterministic ? ["ESCALATION_ROUTING_INVALID" as const] : []),
    ...(!intervention_record.governed ? ["INTERVENTION_GOVERNANCE_INVALID" as const] : []),
    ...(!decision_presentation.complete ? ["DECISION_PRESENTATION_INCOMPLETE" as const] : []),
    ...(!runtime_execution_sequence.canonical_order_enforced ? ["EXECUTION_SEQUENCE_REORDERED" as const] : []),
    ...(runtime_execution_sequence.bypass_detected ? ["EXECUTION_SEQUENCE_BYPASSED" as const] : []),
    ...(!runtime_execution_sequence.admission_after_disposition ? ["ADMISSION_BEFORE_DISPOSITION" as const] : []),
    ...(!evidence_ledger.immutable || !evidence_ledger.auditable || !evidence_ledger.replayable ? ["APPROVAL_EVIDENCE_MISSING" as const] : []),
    ...(!replay_validation.deterministic ? ["INTERACTION_REPLAY_DIVERGENCE" as const] : []),
    ...(!observability.complete ? ["OBSERVABILITY_INCOMPLETE" as const] : []),
    ...(!runtime_execution_sequence.fail_closed_enforced ? ["FAIL_CLOSED_NOT_ENFORCED" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P3.9-HUMAN-OPERATOR-CERTIFICATION-GATE-001",
    outcome: outcome(derivedFailures),
    certified: outcome(derivedFailures) === "PASS",
    exclusive_interaction_framework: interaction_session.exclusive_operator_layer,
    approval_deterministic: operator_approval.deterministic,
    authority_compliant: operator_approval.authority_verified,
    warnings_acknowledged: warningDispositionComplete,
    escalation_routing_valid: escalation_request.routed && escalation_request.deterministic,
    intervention_governed: intervention_record.governed,
    presentation_complete: decision_presentation.complete,
    canonical_sequence_enforced: runtime_execution_sequence.canonical_order_enforced && !runtime_execution_sequence.bypass_detected && runtime_execution_sequence.admission_after_disposition,
    evidence_integrity: evidence_ledger.immutable && evidence_ledger.auditable && evidence_ledger.replayable,
    replay_reproducible: replay_validation.deterministic,
    observability_complete: observability.complete,
    fail_closed_enforced: runtime_execution_sequence.fail_closed_enforced,
    failures: derivedFailures,
  });
  const base: Omit<HumanOperatorInteractionResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    constitutional_ref: "P3.0-CAF-CONSTITUTION-001",
    governance_authority_policy_ref: "caf-governance-authority-policy/v3.7",
    safety_behavioral_constraints_ref: "caf-safety-behavioral-constraints/v3.8",
    interaction_session,
    decision_presentation,
    operator_approval,
    warning_dispositions,
    escalation_request,
    intervention_record,
    runtime_execution_sequence,
    execution_authorization,
    evidence_ledger,
    observability,
    replay_validation,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateHumanOperatorInteraction(result?: HumanOperatorInteractionResult): HumanOperatorInteractionValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, interaction_valid: false, approval_valid: false, warnings_valid: false, escalation_valid: false, intervention_valid: false, sequence_valid: false, authorization_valid: false, evidence_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.certification);
  const interaction_valid = verifyHashedRecord(result.interaction_session) && result.interaction_session.exclusive_operator_layer;
  const approval_valid = verifyHashedRecord(result.operator_approval) && result.operator_approval.approval_required && result.operator_approval.approval_decision === "APPROVE" && result.operator_approval.authority_verified && result.operator_approval.deterministic && result.operator_approval.evidence_refs.length > 0;
  const warnings_valid = result.warning_dispositions.length > 0 && result.warning_dispositions.every((disposition) => verifyHashedRecord(disposition) && (!disposition.acknowledgement_required || disposition.acknowledgement_timestamp.length > 0) && disposition.replayable && disposition.evidence_refs.length > 0);
  const escalation_valid = verifyHashedRecord(result.escalation_request) && result.escalation_request.routed && result.escalation_request.deterministic;
  const intervention_valid = verifyHashedRecord(result.intervention_record) && result.intervention_record.governed && result.intervention_record.resume_authorization_ref.length > 0;
  const sequence_valid = verifyHashedRecord(result.runtime_execution_sequence) && result.runtime_execution_sequence.canonical_order_enforced && !result.runtime_execution_sequence.bypass_detected && !result.runtime_execution_sequence.parallelization_detected && result.runtime_execution_sequence.admission_after_disposition && result.runtime_execution_sequence.fail_closed_enforced;
  const authorization_valid = verifyHashedRecord(result.execution_authorization) && result.execution_authorization.admission_state === "AUTHORIZED" && result.execution_authorization.evidence_refs.length > 0;
  const evidence_valid = verifyHashedRecord(result.evidence_ledger) && result.evidence_ledger.immutable && result.evidence_ledger.auditable && result.evidence_ledger.replayable;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.certified;
  const valid = replay_hash_valid && integrity_hash_valid && interaction_valid && approval_valid && warnings_valid && escalation_valid && intervention_valid && sequence_valid && authorization_valid && evidence_valid && certification_valid && result.replay_validation.deterministic;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, interaction_valid, approval_valid, warnings_valid, escalation_valid, intervention_valid, sequence_valid, authorization_valid, evidence_valid, certification_valid, failures: result.certification.failures });
}

export function replayHumanOperatorInteraction(result = runHumanOperatorInteraction()): boolean {
  const replayed = runHumanOperatorInteraction();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateHumanOperatorInteraction(result).valid;
}

export function getHumanOperatorInteractionBundle(): HumanOperatorInteractionBundle {
  const result = runHumanOperatorInteraction();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      exclusive_operator_interaction_layer: true,
      owns_operator_approval: true,
      owns_warning_acknowledgement: true,
      owns_escalation_routing: true,
      owns_intervention_workflows: true,
      owns_decision_presentation: true,
      owns_constitutional_authority: false,
      owns_policy_contracts: false,
      owns_safety_contracts: false,
      canonical_sequence_required: true,
      fail_closed_required: true,
    }),
    result,
    validation: validateHumanOperatorInteraction(result),
  });
}

export const HumanOperatorInteractionService = Object.freeze({
  run: runHumanOperatorInteraction,
  validate: validateHumanOperatorInteraction,
  replay: replayHumanOperatorInteraction,
});
