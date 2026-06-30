import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthEnforcementLayer,
  TruthCertificationState,
  TruthEnforcementAction,
  TruthEnforcementLayerContract,
  TruthEnforcementLayerInput,
  TruthEnforcementLayerReasonCode,
  TruthEnforcementLayerRequest,
  TruthEnforcementLayerValidation,
  TruthEnforcementLedgerEntry,
  TruthEnforcementObservability,
  TruthEnforcementReplay,
  TruthEnforcementTargetState,
  TruthEnforcementVisibility,
  TruthReplayResult,
} from "./types";

function addReason(reasons: TruthEnforcementLayerReasonCode[], reason: TruthEnforcementLayerReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthEnforcementLayerRequest): TruthEnforcementLayerRequest {
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

function translate(policyDecision: TruthEnforcementAction): TruthEnforcementTargetState {
  if (policyDecision === "ALLOW") return "ALLOWED";
  if (policyDecision === "DENY") return "BLOCKED";
  if (policyDecision === "ESCALATE") return "ESCALATED";
  return "CONTAINED";
}

export function buildTruthEnforcementLayerRequest(
  request: TruthEnforcementLayerRequest,
): TruthEnforcementLayerRequest {
  return requestCore(request);
}

export function sealTruthEnforcementLayer(input: TruthEnforcementLayerInput): SealedTruthEnforcementLayer {
  const reasons: TruthEnforcementLayerReasonCode[] = [];
  const runtime = input.runtimeEvaluation.evaluation;
  const replayReferences = Object.freeze([...(input.replayReferences ?? runtime.replay_references)]);
  const policyDecision = runtime.evaluation_result;
  const enforcementAction: TruthEnforcementAction = policyDecision;
  const targetState = input.targetState ?? translate(enforcementAction);
  const enforcementId = hashValue("mission-control-enforcement-id", {
    action_id: runtime.action_id,
    tenant_id: input.request.tenant_id,
    target_type: input.targetType,
    target_id: input.targetId,
    policy_decision: policyDecision,
    timestamp: input.request.now,
  });

  const enforcementIdPresent = enforcementId.length > 0;
  addReason(reasons, enforcementIdPresent ? "ENFORCEMENT_ID_PRESENT" : "ENFORCEMENT_ID_MISSING");
  const actionIdPresent = runtime.action_id.trim().length > 0;
  addReason(reasons, actionIdPresent ? "ACTION_ID_PRESENT" : "ACTION_ID_MISSING");
  const policyDecisionPresent = policyDecision.length > 0;
  addReason(reasons, policyDecisionPresent ? "POLICY_DECISION_PRESENT" : "POLICY_DECISION_MISSING");
  const enforcementActionPresent = enforcementAction.length > 0;
  addReason(reasons, enforcementActionPresent ? "ENFORCEMENT_ACTION_PRESENT" : "ENFORCEMENT_ACTION_MISSING");

  const violationExecuted = input.policyViolationExecuted === true;
  const filesystemEnforcementValid = input.targetType !== "FILESYSTEM"
    || (input.filesystemViolationExecuted === true ? false : policyDecision !== "DENY" || targetState === "BLOCKED");
  addReason(reasons, filesystemEnforcementValid ? "FILESYSTEM_ENFORCEMENT_OPERATIONAL" : "FILESYSTEM_ENFORCEMENT_FAILED");
  const networkEnforcementValid = input.targetType !== "NETWORK"
    || (input.networkViolationExecuted === true ? false : policyDecision !== "DENY" || targetState === "BLOCKED");
  addReason(reasons, networkEnforcementValid ? "NETWORK_ENFORCEMENT_OPERATIONAL" : "NETWORK_ENFORCEMENT_FAILED");
  const toolEnforcementValid = input.targetType !== "TOOL"
    || (input.toolViolationExecuted === true ? false : policyDecision !== "DENY" || targetState === "BLOCKED");
  addReason(reasons, toolEnforcementValid ? "TOOL_ENFORCEMENT_OPERATIONAL" : "TOOL_ENFORCEMENT_FAILED");
  const capabilityEnforcementValid = input.targetType !== "CAPABILITY"
    || (input.capabilityViolationExecuted === true ? false : policyDecision !== "DENY" || targetState === "BLOCKED");
  addReason(reasons, capabilityEnforcementValid ? "CAPABILITY_ENFORCEMENT_OPERATIONAL" : "CAPABILITY_ENFORCEMENT_FAILED");
  const federationEnforcementValid = input.targetType !== "FEDERATION_ROUTE"
    || (input.federationViolationExecuted === true ? false : policyDecision !== "DENY" || targetState === "BLOCKED");
  addReason(reasons, federationEnforcementValid ? "FEDERATION_ENFORCEMENT_OPERATIONAL" : "FEDERATION_ENFORCEMENT_FAILED");
  const runtimeEnforcementValid = input.targetType !== "RUNTIME_ACTION"
    || (input.runtimeViolationExecuted === true ? false : policyDecision !== "DENY" || targetState === "BLOCKED");
  addReason(reasons, runtimeEnforcementValid ? "RUNTIME_ENFORCEMENT_OPERATIONAL" : "RUNTIME_ENFORCEMENT_FAILED");
  const containmentEnforcementValid = input.containmentFailureDetected !== true
    && (policyDecision !== "CONTAIN" || targetState === "CONTAINED");
  addReason(reasons, containmentEnforcementValid ? "CONTAINMENT_ENFORCEMENT_OPERATIONAL" : "CONTAINMENT_ENFORCEMENT_FAILED");
  const escalationEnforcementValid = input.escalationNotGeneratedDetected !== true
    && (policyDecision !== "ESCALATE" || targetState === "ESCALATED");
  addReason(reasons, escalationEnforcementValid ? "ESCALATION_ENFORCEMENT_OPERATIONAL" : "ESCALATION_ENFORCEMENT_FAILED");
  const translatorValid = input.ambiguousOutcomeDetected !== true && targetState === translate(enforcementAction);
  addReason(reasons, translatorValid ? "ENFORCEMENT_TRANSLATION_DETERMINISTIC" : "ENFORCEMENT_TRANSLATION_AMBIGUOUS");
  const enforcementValidationValid = violationExecuted !== true
    && (policyDecision !== "DENY" || targetState === "BLOCKED")
    && (policyDecision !== "CONTAIN" || targetState === "CONTAINED")
    && (policyDecision !== "ESCALATE" || targetState === "ESCALATED");
  addReason(reasons, enforcementValidationValid ? "ENFORCEMENT_VALIDATION_VALID" : "ENFORCEMENT_VALIDATION_INVALID");
  const tenantIsolationValid = input.crossTenantEnforcementDetected !== true
    && runtime.tenant_id === input.request.tenant_id
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_ENFORCEMENT_ISOLATION_VALID" : "TENANT_ENFORCEMENT_ISOLATION_FAILED");

  const replayResult: TruthReplayResult = replayReferences.length === 0
    ? "UNREPLAYABLE"
    : input.replayMismatchDetected === true
      ? "MISMATCH"
      : !translatorValid
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
  addReason(reasons, "ENFORCEMENT_LAYER_IS_NOT_CONTROL");

  const contractValid = enforcementIdPresent && actionIdPresent && policyDecisionPresent && enforcementActionPresent;
  const valid = contractValid
    && filesystemEnforcementValid
    && networkEnforcementValid
    && toolEnforcementValid
    && capabilityEnforcementValid
    && federationEnforcementValid
    && runtimeEnforcementValid
    && containmentEnforcementValid
    && escalationEnforcementValid
    && translatorValid
    && enforcementValidationValid
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

  const enforcement: TruthEnforcementLayerContract = Object.freeze({
    enforcement_id: enforcementId,
    action_id: runtime.action_id,
    tenant_id: input.request.tenant_id,
    mission_id: runtime.mission_id,
    target_type: input.targetType,
    target_id: input.targetId,
    policy_decision: policyDecision,
    enforcement_action: enforcementAction,
    enforcement_timestamp: input.request.now,
    enforcement_state: valid || conditional ? "ENFORCED" : "REJECTED",
    replay_references: replayReferences,
  });

  const failureReason = valid ? null : [
    !enforcementValidationValid && "policy outcome not enforced",
    !filesystemEnforcementValid && "filesystem violation executes",
    !networkEnforcementValid && "network violation executes",
    !toolEnforcementValid && "tool violation executes",
    !capabilityEnforcementValid && "capability violation executes",
    !containmentEnforcementValid && "containment failure",
    !tenantIsolationValid && "cross-tenant enforcement",
    replayResult === "MISMATCH" && "enforcement replay mismatch",
  ].filter(Boolean).join("; ");

  const ledgerEntry: TruthEnforcementLedgerEntry = Object.freeze({
    enforcement_id: enforcement.enforcement_id,
    action_id: enforcement.action_id,
    tenant_id: enforcement.tenant_id,
    mission_id: enforcement.mission_id,
    target_type: enforcement.target_type,
    policy_decision: enforcement.policy_decision,
    enforcement_action: enforcement.enforcement_action,
    validation_status: valid || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    failure_reason: failureReason,
  });
  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");

  const visibility: TruthEnforcementVisibility = Object.freeze({
    action_id: enforcement.action_id,
    policy_decision: enforcement.policy_decision,
    enforcement_action: enforcement.enforcement_action,
    target_type: enforcement.target_type,
    target_state: targetState,
    validation_status: valid || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    timestamp: enforcement.enforcement_timestamp,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthEnforcementObservability = Object.freeze({
    enforcements_total: 1,
    allowed_actions: enforcementAction === "ALLOW" ? 1 : 0,
    blocked_actions: enforcementAction === "DENY" ? 1 : 0,
    contained_actions: enforcementAction === "CONTAIN" ? 1 : 0,
    escalated_actions: enforcementAction === "ESCALATE" ? 1 : 0,
    validation_failures: valid || conditional ? 0 : 1,
    containment_failures: containmentEnforcementValid ? 0 : 1,
    escalation_failures: escalationEnforcementValid ? 0 : 1,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
    replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });

  const validation: TruthEnforcementLayerValidation = Object.freeze({
    valid: valid || conditional,
    validationState: valid || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    contractValid,
    filesystemEnforcementValid,
    networkEnforcementValid,
    toolEnforcementValid,
    capabilityEnforcementValid,
    federationEnforcementValid,
    runtimeEnforcementValid,
    containmentEnforcementValid,
    escalationEnforcementValid,
    translatorValid,
    enforcementValidationValid,
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

  const replay: TruthEnforcementReplay = Object.freeze({
    replayResult,
    reconstructedEnforcement: enforcement,
    reconstructedTargetState: targetState,
  });

  return Object.freeze({
    request: requestCore(input.request),
    enforcement,
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
