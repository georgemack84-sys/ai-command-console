import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import {
  arbitrateClassifiedConflicts,
  computeArbitrationIntegrityHash,
} from "@/services/decision-arbitration-rules-engine";
import { generateTradeoffExplanations } from "@/services/decision-tradeoff-explanation-generator";
import type { ArbitrationResult, ArbitrationRulesEngineResult } from "@/types/decision-arbitration-rules-engine";
import type { TradeoffExplanationGeneratorResult } from "@/types/decision-tradeoff-explanation-generator";
import type {
  EscalationDestination,
  EscalationLifecycleState,
  EscalationLifecycleTransition,
  EscalationObservability,
  EscalationQueueEntry,
  EscalationRecord,
  EscalationReplay,
  EscalationRequest,
  EscalationRuleEvaluation,
  EscalationRuleId,
  EscalationValidation,
  EscalationWorkflowFailureReason,
  EscalationWorkflowFoundation,
  EscalationWorkflowInput,
  EscalationWorkflowResult,
} from "@/types/decision-conflict-escalation-workflow";

const NOW = "2026-07-03T23:47:00.000Z";
const WORKFLOW_VERSION = "conflict-escalation-workflow/v1" as const;
const AUTHORIZED_COMPONENT = "decision-conflict-escalation-workflow";

export const ESCALATION_DESTINATIONS: readonly EscalationDestination[] = Object.freeze([
  "Operator",
  "Governance",
  "Certification",
  "Simulation",
  "Mission Review",
  "Recovery Review",
]);

export const ESCALATION_DESTINATION_PRIORITY: readonly EscalationDestination[] = Object.freeze([
  "Governance",
  "Certification",
  "Operator",
  "Mission Review",
  "Recovery Review",
  "Simulation",
]);

export const ESCALATION_LIFECYCLE: readonly EscalationLifecycleState[] = Object.freeze([
  "PENDING",
  "VALIDATED",
  "ROUTED",
  "ACKNOWLEDGED",
  "UNDER_REVIEW",
  "RESOLVED",
  "CLOSED",
]);

const ALLOWED_TRANSITIONS: Readonly<Record<EscalationLifecycleState, readonly EscalationLifecycleState[]>> = Object.freeze({
  PENDING: Object.freeze(["VALIDATED"] as EscalationLifecycleState[]),
  VALIDATED: Object.freeze(["ROUTED"] as EscalationLifecycleState[]),
  ROUTED: Object.freeze(["ACKNOWLEDGED"] as EscalationLifecycleState[]),
  ACKNOWLEDGED: Object.freeze(["UNDER_REVIEW"] as EscalationLifecycleState[]),
  UNDER_REVIEW: Object.freeze(["RESOLVED"] as EscalationLifecycleState[]),
  RESOLVED: Object.freeze(["CLOSED"] as EscalationLifecycleState[]),
  CLOSED: Object.freeze([] as EscalationLifecycleState[]),
});

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalizeStrings(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).filter((value) => value.length > 0))].sort();
}

function ruleHash(rule: Omit<EscalationRuleEvaluation, "integrity_hash"> | EscalationRuleEvaluation): string {
  return hashWithoutIntegrity(rule);
}

function ruleEvaluation(rule_id: EscalationRuleId, triggered: boolean, destination: EscalationDestination | undefined, reason: string): EscalationRuleEvaluation {
  const base: Omit<EscalationRuleEvaluation, "integrity_hash"> = {
    rule_id,
    triggered,
    destination,
    reason,
    priority: destination ? ESCALATION_DESTINATION_PRIORITY.indexOf(destination) + 1 : 99,
  };
  return Object.freeze({ ...base, integrity_hash: ruleHash(base) });
}

export function evaluateEscalationRules(arbitration: ArbitrationResult): readonly EscalationRuleEvaluation[] {
  const outcome = arbitration.arbitration_outcome;
  const tradeoffs = arbitration.tradeoff_metadata.join(" ").toLowerCase();
  return Object.freeze([
    ruleEvaluation("constitutional_uncertainty_rule", outcome === "REJECT" && arbitration.resolution_priority_path.includes("Constitution"), "Governance", "Constitutional uncertainty or rejection requires governance escalation."),
    ruleEvaluation("policy_disagreement_rule", outcome === "ESCALATE_TO_GOVERNANCE" || arbitration.governance_summary.toLowerCase().includes("critical"), "Governance", "Policy disagreement or governance ambiguity requires governance review."),
    ruleEvaluation("certification_dependency_rule", outcome === "REQUIRE_CERTIFICATION" || tradeoffs.includes("certification"), "Certification", "Certification dependency requires certification review."),
    ruleEvaluation("authority_uncertainty_rule", outcome === "ESCALATE_TO_OPERATOR" || arbitration.operator_summary.toLowerCase().includes("operator authority required"), "Operator", "Authority uncertainty requires operator review."),
    ruleEvaluation("mission_ambiguity_rule", outcome === "SPLIT_DECISION" || tradeoffs.includes("mission"), "Mission Review", "Mission ambiguity requires mission review."),
    ruleEvaluation("resource_exhaustion_rule", tradeoffs.includes("resource") || tradeoffs.includes("recovery") || outcome === "DEFER", "Recovery Review", "Resource or recovery ambiguity requires recovery review."),
    ruleEvaluation("low_confidence_rule", outcome === "REQUIRE_SIMULATION" || tradeoffs.includes("confidence") || tradeoffs.includes("simulation"), "Simulation", "Low confidence or forecast uncertainty requires simulation."),
  ]);
}

function triggeredRules(evaluations: readonly EscalationRuleEvaluation[]): readonly EscalationRuleEvaluation[] {
  return Object.freeze(evaluations.filter((evaluation) => evaluation.triggered).sort((a, b) => a.priority - b.priority || a.rule_id.localeCompare(b.rule_id)));
}

export function selectEscalationDestinations(evaluations: readonly EscalationRuleEvaluation[]): readonly EscalationDestination[] {
  return Object.freeze(normalizeStrings(triggeredRules(evaluations).map((evaluation) => evaluation.destination!).filter(Boolean))
    .sort((a, b) => ESCALATION_DESTINATION_PRIORITY.indexOf(a as EscalationDestination) - ESCALATION_DESTINATION_PRIORITY.indexOf(b as EscalationDestination)) as EscalationDestination[]);
}

function requestHash(request: Omit<EscalationRequest, "integrity_hash"> | EscalationRequest): string {
  return hashWithoutIntegrity(request);
}

function evidenceFor(arbitration: ArbitrationResult, destination: EscalationDestination): readonly string[] {
  return Object.freeze(normalizeStrings([
    `escalation_evidence_${arbitration.arbitration_id}`,
    ...arbitration.evaluated_candidates.map((candidate) => `evidence_${candidate}`),
    ...arbitration.rules_applied.map((rule) => `rule_evidence_${rule}`),
    `destination_${destination.toLowerCase().replaceAll(" ", "_")}`,
  ]));
}

function refs(prefix: string, arbitration: ArbitrationResult): readonly string[] {
  return Object.freeze(normalizeStrings([
    `${prefix}_${arbitration.arbitration_id}`,
    ...arbitration.rules_applied.map((rule) => `${prefix}_${rule}`),
  ]));
}

export function generateEscalationRequest(arbitration: ArbitrationResult, destination: EscalationDestination, evaluations: readonly EscalationRuleEvaluation[]): EscalationRequest {
  const rules = triggeredRules(evaluations).filter((evaluation) => evaluation.destination === destination).map((evaluation) => evaluation.rule_id);
  const base: Omit<EscalationRequest, "integrity_hash"> = {
    escalation_id: `escalation_${hash({ arbitration_id: arbitration.arbitration_id, destination }).slice(0, 32)}`,
    arbitration_id: arbitration.arbitration_id,
    conflict_id: arbitration.conflict_id,
    escalation_reason: rules.length > 0 ? `Triggered ${rules.join(",")} for ${destination}.` : `Manual deterministic route to ${destination}.`,
    escalation_destination: destination,
    triggering_rules: Object.freeze(rules),
    supporting_evidence: evidenceFor(arbitration, destination),
    governance_refs: refs("governance", arbitration),
    constitutional_refs: refs("constitutional", arbitration),
    authority_refs: refs("authority", arbitration),
    operator_action_required: destination === "Operator" || destination === "Governance",
    advisory_only: true,
    replay_ref: `${arbitration.replay_ref}_escalation_${destination.toLowerCase().replaceAll(" ", "_")}`,
    lineage_ref: `${arbitration.lineage_ref}_escalation_${destination.toLowerCase().replaceAll(" ", "_")}`,
  };
  return Object.freeze({ ...base, integrity_hash: requestHash(base) });
}

function severityPriority(arbitration: ArbitrationResult): number {
  if (arbitration.arbitration_outcome === "REJECT") return 100;
  if (arbitration.arbitration_outcome === "ESCALATE_TO_GOVERNANCE") return 90;
  if (arbitration.arbitration_outcome === "ESCALATE_TO_OPERATOR") return 80;
  if (arbitration.arbitration_outcome === "REQUIRE_CERTIFICATION") return 70;
  if (arbitration.arbitration_outcome === "DEFER") return 60;
  if (arbitration.arbitration_outcome === "REQUIRE_SIMULATION") return 50;
  if (arbitration.arbitration_outcome === "SPLIT_DECISION") return 40;
  return 10;
}

function queueHash(entry: Omit<EscalationQueueEntry, "integrity_hash"> | EscalationQueueEntry): string {
  return hashWithoutIntegrity(entry);
}

export function queueEscalation(request: EscalationRequest, arbitration: ArbitrationResult): EscalationQueueEntry {
  const base: Omit<EscalationQueueEntry, "integrity_hash"> = {
    queue_id: `queue_${request.escalation_id}`,
    escalation_id: request.escalation_id,
    conflict_id: request.conflict_id,
    arbitration_id: request.arbitration_id,
    destination: request.escalation_destination,
    lifecycle_state: "PENDING",
    constitutional_priority: request.escalation_destination === "Governance" && request.triggering_rules.includes("constitutional_uncertainty_rule") ? 1 : 9,
    governance_priority: request.escalation_destination === "Governance" ? 1 : 9,
    severity_priority: severityPriority(arbitration),
    destination_priority: ESCALATION_DESTINATION_PRIORITY.indexOf(request.escalation_destination) + 1,
    mission_priority: request.escalation_destination === "Mission Review" ? 1 : 5,
    conflict_order_key: request.conflict_id,
    replay_ref: `${request.replay_ref}_queue`,
  };
  return Object.freeze({ ...base, integrity_hash: queueHash(base) });
}

function orderQueue(queue: readonly EscalationQueueEntry[]): readonly EscalationQueueEntry[] {
  return Object.freeze([...queue].sort((a, b) => (
    a.constitutional_priority - b.constitutional_priority
    || a.governance_priority - b.governance_priority
    || b.severity_priority - a.severity_priority
    || a.destination_priority - b.destination_priority
    || a.mission_priority - b.mission_priority
    || a.conflict_order_key.localeCompare(b.conflict_order_key)
  )));
}

export function transitionEscalationLifecycle(entry: EscalationQueueEntry, new_state: EscalationLifecycleState): EscalationLifecycleTransition {
  const base: Omit<EscalationLifecycleTransition, "integrity_hash"> = {
    transition_id: `transition_${entry.escalation_id}_${entry.lifecycle_state.toLowerCase()}_${new_state.toLowerCase()}`,
    escalation_id: entry.escalation_id,
    previous_state: entry.lifecycle_state,
    new_state,
    transition_valid: ALLOWED_TRANSITIONS[entry.lifecycle_state].includes(new_state),
    replay_ref: `${entry.replay_ref}_${new_state.toLowerCase()}`,
    transition_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function recordHash(record: Omit<EscalationRecord, "integrity_hash"> | EscalationRecord): string {
  return hashWithoutIntegrity(record);
}

function writeEscalationRecord(request: EscalationRequest, queue: EscalationQueueEntry, routing_path: readonly EscalationDestination[]): EscalationRecord {
  const base: Omit<EscalationRecord, "integrity_hash"> = {
    escalation_id: request.escalation_id,
    conflict_id: request.conflict_id,
    arbitration_id: request.arbitration_id,
    destination: request.escalation_destination,
    escalation_reason: request.escalation_reason,
    lifecycle_state: queue.lifecycle_state,
    routing_path,
    decision_refs: Object.freeze(normalizeStrings([request.arbitration_id, request.conflict_id, ...request.supporting_evidence])),
    replay_ref: request.replay_ref,
    created_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function validationResult(failures: readonly EscalationWorkflowFailureReason[]): EscalationValidation {
  const unique = Object.freeze([...new Set(failures)] as EscalationWorkflowFailureReason[]);
  const has = (failure: EscalationWorkflowFailureReason) => unique.includes(failure);
  return Object.freeze({
    validation_state: unique.length > 0 ? "REJECTED" : "VALID",
    fail_closed: unique.length > 0,
    failures: unique,
    checks: Object.freeze({
      destination_valid: !has("INVALID_ESCALATION_DESTINATION"),
      governance_valid: !has("MISSING_GOVERNANCE_REFERENCES"),
      constitutional_valid: !has("MISSING_CONSTITUTIONAL_METADATA"),
      authority_valid: !has("INVALID_AUTHORITY_ASSIGNMENT"),
      replay_valid: !has("REPLAY_CORRUPTION"),
      integrity_valid: !has("INTEGRITY_HASH_MISMATCH"),
      tenant_isolated: !has("CROSS_TENANT_ROUTING"),
      lifecycle_valid: !has("INVALID_LIFECYCLE_TRANSITION"),
      advisory_only: !has("ADVISORY_ONLY_VIOLATION"),
    }),
  });
}

export function validateEscalationRequest(request: unknown, queue?: EscalationQueueEntry, arbitration?: ArbitrationResult): EscalationValidation {
  if (!request || typeof request !== "object" || Array.isArray(request)) return validationResult(["INVALID_ESCALATION_DESTINATION"]);
  const typed = request as EscalationRequest;
  const failures: EscalationWorkflowFailureReason[] = [];
  if (!ESCALATION_DESTINATIONS.includes(typed.escalation_destination)) failures.push("INVALID_ESCALATION_DESTINATION");
  if (!typed.governance_refs?.length) failures.push("MISSING_GOVERNANCE_REFERENCES");
  if (!typed.constitutional_refs?.length) failures.push("MISSING_CONSTITUTIONAL_METADATA");
  if (!typed.authority_refs?.length) failures.push("INVALID_AUTHORITY_ASSIGNMENT");
  if (!typed.replay_ref) failures.push("REPLAY_CORRUPTION");
  if (typed.advisory_only !== true) failures.push("ADVISORY_ONLY_VIOLATION");
  if (typed.integrity_hash && requestHash(typed) !== typed.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (queue && queueHash(queue) !== queue.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (arbitration && computeArbitrationIntegrityHash(arbitration) !== arbitration.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (JSON.stringify(typed).includes("tenant_beta") && !typed.conflict_id.includes("tenant_beta")) failures.push("CROSS_TENANT_ROUTING");
  return validationResult(failures);
}

function replayHash(result: Omit<EscalationWorkflowResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    rule_evaluations: result.rule_evaluations,
    requests: result.requests,
    queue: result.queue,
    transitions: result.transitions,
    validations: result.validations,
    ledger_records: result.ledger_records,
    failures: result.failures,
  });
}

function failResult(failures: readonly EscalationWorkflowFailureReason[]): EscalationWorkflowResult {
  const base: Omit<EscalationWorkflowResult, "integrity_hash" | "replay_hash"> = {
    escalation_status: "FAIL",
    fail_closed: true,
    decision_type: "NO_ESCALATION_REQUIRED",
    rule_evaluations: Object.freeze([]),
    requests: Object.freeze([]),
    queue: Object.freeze([]),
    transitions: Object.freeze([]),
    validations: Object.freeze([]),
    ledger_records: Object.freeze([]),
    failures: Object.freeze([...new Set(failures)]),
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = replayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

function noEscalationResult(evaluations: readonly EscalationRuleEvaluation[]): EscalationWorkflowResult {
  const base: Omit<EscalationWorkflowResult, "integrity_hash" | "replay_hash"> = {
    escalation_status: "NO_ESCALATION",
    fail_closed: false,
    decision_type: "NO_ESCALATION_REQUIRED",
    rule_evaluations: evaluations,
    requests: Object.freeze([]),
    queue: Object.freeze([]),
    transitions: Object.freeze([]),
    validations: Object.freeze([]),
    ledger_records: Object.freeze([]),
    failures: Object.freeze([]),
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = replayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

function arbitrationsFromInput(input: EscalationWorkflowInput): readonly ArbitrationResult[] {
  if (input.arbitrations) return input.arbitrations;
  if (input.arbitration_result) return input.arbitration_result.arbitrations;
  return arbitrateClassifiedConflicts().arbitrations;
}

export function runConflictEscalationWorkflow(input: EscalationWorkflowInput = {}): EscalationWorkflowResult {
  if (input.authorized_component && input.authorized_component !== AUTHORIZED_COMPONENT) return failResult(["UNAUTHORIZED_ROUTING_ATTEMPT"]);
  const arbitrations = Object.freeze([...arbitrationsFromInput(input)]);
  if (arbitrations.length === 0) return failResult(["MISSING_ARBITRATION_RECORDS"]);
  const explanationResult: TradeoffExplanationGeneratorResult = input.explanation_result ?? generateTradeoffExplanations({ arbitrations });
  if (explanationResult.explanation_status === "FAIL") return failResult(["REPLAY_CORRUPTION"]);

  const allEvaluations = Object.freeze(arbitrations.flatMap((arbitration) => evaluateEscalationRules(arbitration).map((evaluation) => Object.freeze({ ...evaluation, reason: `${arbitration.arbitration_id}: ${evaluation.reason}`, integrity_hash: ruleHash({ ...evaluation, reason: `${arbitration.arbitration_id}: ${evaluation.reason}` }) }))));
  const requests: EscalationRequest[] = [];
  const queue: EscalationQueueEntry[] = [];
  const transitions: EscalationLifecycleTransition[] = [];
  const validations: EscalationValidation[] = [];
  const ledgers: EscalationRecord[] = [];

  for (const arbitration of arbitrations) {
    const evaluations = evaluateEscalationRules(arbitration);
    const destinations = selectEscalationDestinations(evaluations);
    for (const destination of destinations) {
      const request = generateEscalationRequest(arbitration, destination, evaluations);
      const entry = queueEscalation(request, arbitration);
      const validation = validateEscalationRequest(request, entry, arbitration);
      if (validation.validation_state !== "VALID") return failResult(validation.failures);
      requests.push(request);
      queue.push(entry);
      validations.push(validation);
    }
  }
  if (requests.length === 0) return noEscalationResult(allEvaluations);

  const orderedQueue = orderQueue(queue);
  if (orderedQueue.some((entry) => queueHash(entry) !== entry.integrity_hash)) return failResult(["QUEUE_ORDERING_INCONSISTENT"]);
  for (const entry of orderedQueue) {
    const request = requests.find((item) => item.escalation_id === entry.escalation_id)!;
    const transition = transitionEscalationLifecycle(entry, "VALIDATED");
    if (!transition.transition_valid) return failResult(["INVALID_LIFECYCLE_TRANSITION"]);
    transitions.push(transition);
    ledgers.push(writeEscalationRecord(request, entry, selectEscalationDestinations(evaluateEscalationRules(arbitrations.find((item) => item.arbitration_id === entry.arbitration_id)!))));
  }
  if (ledgers.some((record) => recordHash(record) !== record.integrity_hash)) return failResult(["ESCALATION_LEDGER_FAILED"]);

  const base: Omit<EscalationWorkflowResult, "integrity_hash" | "replay_hash"> = {
    escalation_status: "PASS",
    fail_closed: false,
    decision_type: requests.length > 1 ? "MULTIPLE_COORDINATED_ESCALATIONS" : "SINGLE_ESCALATION",
    rule_evaluations: allEvaluations,
    requests: Object.freeze(requests),
    queue: orderedQueue,
    transitions: Object.freeze(transitions),
    validations: Object.freeze(validations),
    ledger_records: Object.freeze(ledgers),
    failures: Object.freeze([]),
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = replayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) return failResult(["REPLAY_CORRUPTION"]);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayConflictEscalationWorkflow(result: EscalationWorkflowResult): EscalationReplay {
  const reconstructed = replayHash(result);
  const replay_valid = result.replay_hash === reconstructed
    && result.requests.every((request) => requestHash(request) === request.integrity_hash)
    && result.queue.every((entry) => queueHash(entry) === entry.integrity_hash)
    && result.ledger_records.every((record) => recordHash(record) === record.integrity_hash);
  const failures: EscalationWorkflowFailureReason[] = replay_valid ? [] : ["REPLAY_CORRUPTION"];
  const base: Omit<EscalationReplay, "integrity_hash"> = {
    replay_id: "replay_conflict_escalation_workflow",
    replay_valid,
    escalation_refs: Object.freeze(result.requests.map((request) => request.escalation_id)),
    queue_refs: Object.freeze(result.queue.map((entry) => entry.queue_id)),
    ledger_refs: Object.freeze(result.ledger_records.map((record) => record.escalation_id)),
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function countBy<T extends string>(items: readonly T[], keys: readonly T[]): Record<T, number> {
  return Object.freeze(keys.reduce((counts, key) => {
    counts[key] = items.filter((item) => item === key).length;
    return counts;
  }, {} as Record<T, number>));
}

export function buildEscalationObservability(result: EscalationWorkflowResult): EscalationObservability {
  return Object.freeze({
    escalations_generated: result.requests.length,
    escalations_by_destination: countBy(result.requests.map((request) => request.escalation_destination), ESCALATION_DESTINATIONS),
    escalation_reasons: countBy(result.requests.flatMap((request) => [...request.triggering_rules]), ["low_confidence_rule", "policy_disagreement_rule", "authority_uncertainty_rule", "certification_dependency_rule", "mission_ambiguity_rule", "constitutional_uncertainty_rule", "resource_exhaustion_rule"]),
    governance_escalations: result.requests.filter((request) => request.escalation_destination === "Governance").length,
    operator_escalations: result.requests.filter((request) => request.escalation_destination === "Operator").length,
    certification_escalations: result.requests.filter((request) => request.escalation_destination === "Certification").length,
    simulation_requests: result.requests.filter((request) => request.escalation_destination === "Simulation").length,
    mission_review_requests: result.requests.filter((request) => request.escalation_destination === "Mission Review").length,
    recovery_review_requests: result.requests.filter((request) => request.escalation_destination === "Recovery Review").length,
    queue_depth: result.queue.length,
    average_routing_latency: result.requests.length === 0 ? 0 : 1,
    replay_success_rate: replayConflictEscalationWorkflow(result).replay_valid ? 1 : 0,
    validation_failures: result.validations.filter((validation) => validation.validation_state !== "VALID").length,
    integrity_failures: result.validations.filter((validation) => !validation.checks.integrity_valid).length,
  });
}

export function getConflictEscalationWorkflowFoundation(): EscalationWorkflowFoundation {
  const result = runConflictEscalationWorkflow();
  const replay = replayConflictEscalationWorkflow(result);
  return Object.freeze({
    workflow_version: WORKFLOW_VERSION,
    destinations: ESCALATION_DESTINATIONS,
    destination_priority: ESCALATION_DESTINATION_PRIORITY,
    lifecycle_states: ESCALATION_LIFECYCLE,
    result,
    replay,
    observability: buildEscalationObservability(result),
  });
}

export const ConflictEscalationWorkflow = Object.freeze({
  evaluate: evaluateEscalationRules,
  selectDestinations: selectEscalationDestinations,
  request: generateEscalationRequest,
  queue: queueEscalation,
  transition: transitionEscalationLifecycle,
  run: runConflictEscalationWorkflow,
  replay: replayConflictEscalationWorkflow,
});
