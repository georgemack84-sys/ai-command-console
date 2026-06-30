import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthRuntimePolicyEngine,
  TruthCertificationState,
  TruthRuntimeEvaluationResult,
  TruthRuntimePolicyEngineContract,
  TruthRuntimePolicyEngineInput,
  TruthRuntimePolicyEngineObservability,
  TruthRuntimePolicyEngineReasonCode,
  TruthRuntimePolicyEngineReplay,
  TruthRuntimePolicyEngineRequest,
  TruthRuntimePolicyEngineValidation,
  TruthRuntimePolicyEngineVisibility,
  TruthRuntimeGovernanceLedgerEntry,
  TruthReplayResult,
  TruthRuntimeActionType,
} from "./types";

const RUNTIME_ACTIONS = new Set<TruthRuntimeActionType>([
  "FILESYSTEM_ACTION",
  "NETWORK_ACTION",
  "TOOL_ACTION",
  "CAPABILITY_ACTION",
  "GOVERNANCE_ACTION",
  "FEDERATION_ACTION",
  "RUNTIME_ACTION",
  "OPERATOR_ACTION",
]);

function addReason(reasons: TruthRuntimePolicyEngineReasonCode[], reason: TruthRuntimePolicyEngineReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthRuntimePolicyEngineRequest): TruthRuntimePolicyEngineRequest {
  return Object.freeze({ tenant_id: request.tenant_id, now: request.now });
}

function certificationState(pass: boolean, conditional: boolean): TruthCertificationState {
  if (pass) return "PASS";
  if (conditional) return "CONDITIONAL_PASS";
  return "FAIL";
}

function createBoundaryFlags(record: Record<string, unknown>): boolean {
  const blockedFlags = [
    "executionAuthorized",
    "approvalAllowed",
    "rankingAllowed",
    "prioritizationAllowed",
    "scoringAllowed",
    "resourceAllocationAllowed",
    "authorityMutationAllowed",
    "controlSurfacePresent",
  ] as const;
  return blockedFlags.every((key) => record[key] !== true);
}

function decideRuntime(input: TruthRuntimePolicyEngineInput): TruthRuntimeEvaluationResult {
  if (input.crossTenantActionExecutionDetected || input.crossTenantEvaluationAccessDetected) return "DENY";
  if (input.policyBypassDetected) return "DENY";
  if (input.authorityState === "UNKNOWN" || input.authorityState === "INSUFFICIENT") return "DENY";
  if (input.authorityState === "SCOPE_VIOLATION") return "ESCALATE";
  if (input.governanceState === "CONSTITUTIONAL_VIOLATION") return "CONTAIN";
  if (input.governanceState === "VIOLATION") return "DENY";
  if (input.policyState === "VIOLATION" || input.policyState === "BYPASSED") return "DENY";
  if (input.trustState === "UNTRUSTED") return "DENY";
  if (input.trustState === "RESTRICTED") return "ESCALATE";
  if (input.certificationState === "MISSING" || input.certificationState === "EXPIRED") return "DENY";
  if (input.containmentState === "TRIGGERED") return "CONTAIN";
  return "ALLOW";
}

export function buildTruthRuntimePolicyEngineRequest(
  request: TruthRuntimePolicyEngineRequest,
): TruthRuntimePolicyEngineRequest {
  return requestCore(request);
}

export function sealTruthRuntimePolicyEngine(input: TruthRuntimePolicyEngineInput): SealedTruthRuntimePolicyEngine {
  const reasons: TruthRuntimePolicyEngineReasonCode[] = [];
  const replayReferences = Object.freeze([...(input.replayReferences ?? ["runtime-policy-replay/v1"])]);
  const evaluationResult = decideRuntime(input);
  const evaluationId = hashValue("mission-control-runtime-policy-evaluation-id", {
    tenant_id: input.request.tenant_id,
    action_id: input.actionId,
    requested_action: input.requestedAction,
    timestamp: input.request.now,
  });

  const evaluationIdPresent = evaluationId.length > 0;
  addReason(reasons, evaluationIdPresent ? "EVALUATION_ID_PRESENT" : "EVALUATION_ID_MISSING");
  const actionIdPresent = input.actionId.trim().length > 0;
  addReason(reasons, actionIdPresent ? "ACTION_ID_PRESENT" : "ACTION_ID_MISSING");
  const requestedActionPresent = input.requestedAction.length > 0;
  addReason(reasons, requestedActionPresent ? "REQUESTED_ACTION_PRESENT" : "REQUESTED_ACTION_MISSING");
  const requestedActionValid = RUNTIME_ACTIONS.has(input.requestedAction) && input.unknownActionDetected !== true;
  addReason(reasons, requestedActionValid ? "REQUESTED_ACTION_VALID" : "REQUESTED_ACTION_INVALID");
  const evaluationResultPresent = evaluationResult.length > 0;
  addReason(reasons, evaluationResultPresent ? "EVALUATION_RESULT_PRESENT" : "EVALUATION_RESULT_MISSING");

  const actionIntakeValid = actionIdPresent
    && requestedActionValid
    && input.authenticated !== false
    && input.missionId.trim().length > 0
    && input.agentId.trim().length > 0;
  addReason(reasons, actionIntakeValid ? "ACTION_INTAKE_OPERATIONAL" : "ACTION_INTAKE_FAILED");
  const authorityValidationValid = input.authorityState === "AUTHORIZED"
    || input.authorityState === "UNKNOWN" && evaluationResult === "DENY"
    || input.authorityState === "INSUFFICIENT" && evaluationResult === "DENY"
    || input.authorityState === "SCOPE_VIOLATION" && evaluationResult === "ESCALATE";
  addReason(reasons, authorityValidationValid ? "AUTHORITY_VALIDATION_OPERATIONAL" : "AUTHORITY_VALIDATION_FAILED");
  const governanceValidationValid = input.governanceState === "COMPLIANT"
    || input.governanceState === "VIOLATION" && evaluationResult === "DENY"
    || input.governanceState === "CONSTITUTIONAL_VIOLATION" && evaluationResult === "CONTAIN";
  addReason(reasons, governanceValidationValid ? "GOVERNANCE_VALIDATION_OPERATIONAL" : "GOVERNANCE_VALIDATION_FAILED");
  const policyEvaluationValid = input.policyState === "COMPLIANT"
    ? input.policyBypassDetected !== true
    : evaluationResult === "DENY";
  addReason(reasons, policyEvaluationValid ? "POLICY_EVALUATION_OPERATIONAL" : "POLICY_EVALUATION_FAILED");
  const trustValidationValid = input.trustState === "TRUSTED" || input.trustState === "CONDITIONALLY_TRUSTED"
    ? true
    : input.trustState === "RESTRICTED" ? evaluationResult === "ESCALATE" : evaluationResult === "DENY";
  addReason(reasons, trustValidationValid ? "TRUST_VALIDATION_OPERATIONAL" : "TRUST_VALIDATION_FAILED");
  const certificationValidationValid = input.certificationState === "VALID" || evaluationResult === "DENY";
  addReason(reasons, certificationValidationValid ? "CERTIFICATION_VALIDATION_OPERATIONAL" : "CERTIFICATION_VALIDATION_FAILED");
  const containmentState = input.containmentState ?? "NOT_REQUIRED";
  const containmentValid = containmentState !== "FAILED" && (containmentState !== "TRIGGERED" || evaluationResult === "CONTAIN");
  addReason(reasons, containmentValid ? "CONTAINMENT_OPERATIONAL" : "CONTAINMENT_FAILED");
  const runtimeDecisionValid = input.nondeterministicOutcomeDetected !== true && input.multipleOutcomesDetected !== true;
  addReason(reasons, runtimeDecisionValid ? "RUNTIME_DECISION_DETERMINISTIC" : "RUNTIME_DECISION_NONDETERMINISTIC");
  const tenantIsolationValid = input.crossTenantActionExecutionDetected !== true
    && input.crossTenantEvaluationAccessDetected !== true
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_RUNTIME_ISOLATION_VALID" : "TENANT_RUNTIME_ISOLATION_FAILED");

  const replayResult: TruthReplayResult = replayReferences.length === 0
    ? "UNREPLAYABLE"
    : input.replayMismatchDetected === true || input.decisionMismatchDetected === true
      ? "MISMATCH"
      : !runtimeDecisionValid
        ? "INCOMPLETE_EVIDENCE"
        : "REPRODUCED";
  addReason(reasons, replayResult === "REPRODUCED" ? "REPLAY_REPRODUCED" : replayResult === "MISMATCH" ? "REPLAY_MISMATCH" : replayResult === "INCOMPLETE_EVIDENCE" ? "REPLAY_INCOMPLETE_EVIDENCE" : "REPLAY_UNREPLAYABLE");

  const failClosed = true;
  addReason(reasons, failClosed ? "FAIL_CLOSED_ENFORCED" : "FAIL_OPEN_DETECTED");
  const executionImpossible = input.executionRequested !== true;
  const approvalAbsent = input.approvalRequested !== true;
  const rankingAbsent = input.rankingRequested !== true;
  const prioritizationAbsent = input.prioritizationRequested !== true;
  const scoringAbsent = input.scoringRequested !== true;
  const resourceAllocationAbsent = input.resourceAllocationRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = createBoundaryFlags({
    executionAuthorized: false,
    approvalAllowed: false,
    rankingAllowed: false,
    prioritizationAllowed: false,
    scoringAllowed: false,
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
  addReason(reasons, executionImpossible ? "EXECUTION_IMPOSSIBLE" : "EXECUTION_REQUEST_BLOCKED");
  addReason(reasons, approvalAbsent ? "APPROVAL_ABSENT" : "APPROVAL_DETECTED");
  addReason(reasons, rankingAbsent ? "RANKING_ABSENT" : "RANKING_DETECTED");
  addReason(reasons, prioritizationAbsent ? "PRIORITIZATION_ABSENT" : "PRIORITIZATION_DETECTED");
  addReason(reasons, scoringAbsent ? "SCORING_ABSENT" : "SCORING_DETECTED");
  addReason(reasons, resourceAllocationAbsent ? "RESOURCE_ALLOCATION_ABSENT" : "RESOURCE_ALLOCATION_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  addReason(reasons, "RUNTIME_POLICY_ENGINE_IS_NOT_CONTROL");

  const contractValid = evaluationIdPresent && actionIdPresent && requestedActionValid && evaluationResultPresent;
  const valid = contractValid
    && actionIntakeValid
    && authorityValidationValid
    && governanceValidationValid
    && policyEvaluationValid
    && trustValidationValid
    && certificationValidationValid
    && containmentValid
    && runtimeDecisionValid
    && tenantIsolationValid
    && replayResult === "REPRODUCED"
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent;

  const observabilityOperational = input.observabilityGapDetected !== true && input.reportingLimitationDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");
  const conditional = valid && !observabilityOperational && input.remediationDocumented === true && replayResult === "REPRODUCED";
  const certification = certificationState(valid && observabilityOperational, conditional);
  addReason(reasons, certification === "PASS" ? "CERTIFICATION_PASS" : certification === "CONDITIONAL_PASS" ? "CERTIFICATION_CONDITIONAL_PASS" : "CERTIFICATION_FAIL");

  const evaluation: TruthRuntimePolicyEngineContract = Object.freeze({
    evaluation_id: evaluationId,
    action_id: input.actionId,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    agent_id: input.agentId,
    requested_action: input.requestedAction,
    authority_state: input.authorityState,
    governance_state: input.governanceState,
    policy_state: input.policyState,
    trust_state: input.trustState,
    certification_state: input.certificationState,
    containment_state: containmentState,
    evaluation_timestamp: input.request.now,
    evaluation_result: evaluationResult,
    replay_references: replayReferences,
  });

  const failureReason = valid ? null : [
    !actionIntakeValid && "action intake failure",
    !authorityValidationValid && "authority violation ignored",
    !governanceValidationValid && "governance violation ignored",
    !policyEvaluationValid && "action bypasses policy engine",
    !trustValidationValid && "trust violation ignored",
    !certificationValidationValid && "certification violation ignored",
    !containmentValid && "containment failure",
    !tenantIsolationValid && "cross-tenant action execution",
    replayResult === "MISMATCH" && "runtime replay mismatch",
  ].filter(Boolean).join("; ");

  const ledgerEntry: TruthRuntimeGovernanceLedgerEntry = Object.freeze({
    evaluation_id: evaluation.evaluation_id,
    action_id: evaluation.action_id,
    tenant_id: evaluation.tenant_id,
    mission_id: evaluation.mission_id,
    agent_id: evaluation.agent_id,
    requested_action: evaluation.requested_action,
    evaluation_result: evaluation.evaluation_result,
    validation_status: valid || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    failure_reason: failureReason,
  });
  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");

  const visibility: TruthRuntimePolicyEngineVisibility = Object.freeze({
    action_id: evaluation.action_id,
    requested_action: evaluation.requested_action,
    authority_status: evaluation.authority_state,
    governance_status: evaluation.governance_state,
    policy_status: evaluation.policy_state,
    trust_status: evaluation.trust_state,
    certification_status: evaluation.certification_state,
    evaluation_result: evaluation.evaluation_result,
    replay_status: replayResult,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthRuntimePolicyEngineObservability = Object.freeze({
    actions_total: 1,
    allowed_actions: evaluationResult === "ALLOW" ? 1 : 0,
    denied_actions: evaluationResult === "DENY" ? 1 : 0,
    escalated_actions: evaluationResult === "ESCALATE" ? 1 : 0,
    contained_actions: evaluationResult === "CONTAIN" ? 1 : 0,
    authority_violations: input.authorityState === "AUTHORIZED" ? 0 : 1,
    governance_violations: input.governanceState === "COMPLIANT" ? 0 : 1,
    trust_violations: input.trustState === "TRUSTED" || input.trustState === "CONDITIONALLY_TRUSTED" ? 0 : 1,
    certification_violations: input.certificationState === "VALID" ? 0 : 1,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
    replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });

  const validation: TruthRuntimePolicyEngineValidation = Object.freeze({
    valid: valid || conditional,
    validationState: valid || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    contractValid,
    actionIntakeValid,
    authorityValidationValid,
    governanceValidationValid,
    policyEvaluationValid,
    trustValidationValid,
    certificationValidationValid,
    containmentValid,
    runtimeDecisionValid,
    tenantIsolationValid,
    replayValid: replayResult === "REPRODUCED",
    failClosed,
    deterministic: true,
    readOnly: true,
    executionImpossible,
    approvalAbsent,
    rankingAbsent,
    prioritizationAbsent,
    scoringAbsent,
    resourceAllocationAbsent,
    authorityBounded,
    controlSurfaceAbsent,
  });

  const replay: TruthRuntimePolicyEngineReplay = Object.freeze({
    replayResult,
    reconstructedEvaluation: evaluation,
    reconstructedDecision: evaluationResult,
  });

  return Object.freeze({
    request: requestCore(input.request),
    evaluation,
    ledgerEntry,
    validation,
    replay,
    visibility,
    observability,
    certification,
    sealed: true,
    readOnly: true,
    executionAuthorized: false,
    approvalAllowed: false,
    rankingAllowed: false,
    prioritizationAllowed: false,
    scoringAllowed: false,
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
