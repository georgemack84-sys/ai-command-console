import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthPolicyContract,
  TruthCertificationState,
  TruthPolicyAction,
  TruthPolicyAuthorityType,
  TruthPolicyContract,
  TruthPolicyContractInput,
  TruthPolicyContractObservability,
  TruthPolicyContractReasonCode,
  TruthPolicyContractReplay,
  TruthPolicyContractRequest,
  TruthPolicyContractValidation,
  TruthPolicyContractVisibility,
  TruthPolicyLedgerEntry,
  TruthPolicyRule,
  TruthPolicyScopeType,
  TruthPolicyState,
  TruthPolicyType,
  TruthReplayResult,
} from "./types";

const POLICY_TYPES = new Set<TruthPolicyType>([
  "FILESYSTEM_POLICY",
  "NETWORK_POLICY",
  "TOOL_POLICY",
  "CAPABILITY_POLICY",
  "AUTHORITY_POLICY",
  "GOVERNANCE_POLICY",
  "TENANT_POLICY",
  "FEDERATION_POLICY",
]);

const POLICY_STATES = new Set<TruthPolicyState>(["DRAFT", "ACTIVE", "SUSPENDED", "RETIRED"]);
const POLICY_ACTIONS = new Set<TruthPolicyAction>(["ALLOW", "DENY", "ESCALATE", "CONTAIN"]);
const POLICY_SCOPES = new Set<TruthPolicyScopeType>(["GLOBAL", "TENANT", "MISSION", "SYSTEM", "AGENT", "RESOURCE", "FEDERATION"]);
const AUTHORITY_TYPES = new Set<TruthPolicyAuthorityType>([
  "OPERATOR",
  "GOVERNANCE_ENGINE",
  "CERTIFICATION_ENGINE",
  "SUPERVISION_ENGINE",
]);

function addReason(reasons: TruthPolicyContractReasonCode[], reason: TruthPolicyContractReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthPolicyContractRequest): TruthPolicyContractRequest {
  return Object.freeze({
    tenant_id: request.tenant_id,
    now: request.now,
  });
}

function certificationState(pass: boolean, conditional: boolean): TruthCertificationState {
  if (pass) return "PASS";
  if (conditional) return "CONDITIONAL_PASS";
  return "FAIL";
}

function isValidStateTransition(priorState: TruthPolicyState | null | undefined, nextState: TruthPolicyState): boolean {
  if (!priorState) return nextState === "DRAFT" || nextState === "ACTIVE";
  const transitions: Readonly<Record<TruthPolicyState, readonly TruthPolicyState[]>> = Object.freeze({
    DRAFT: ["ACTIVE", "SUSPENDED", "RETIRED"],
    ACTIVE: ["SUSPENDED", "RETIRED"],
    SUSPENDED: ["ACTIVE", "RETIRED"],
    RETIRED: [],
  });
  return transitions[priorState].includes(nextState);
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

export function buildTruthPolicyContractRequest(
  request: TruthPolicyContractRequest,
): TruthPolicyContractRequest {
  return requestCore(request);
}

export function sealTruthPolicyContract(input: TruthPolicyContractInput): SealedTruthPolicyContract {
  const reasons: TruthPolicyContractReasonCode[] = [];
  const policyTimestamp = input.policyTimestamp ?? input.request.now;
  const policyRules: readonly TruthPolicyRule[] = Object.freeze(input.policyRules.map((rule) => Object.freeze({
    rule_id: rule.rule_id,
    rule_condition: rule.rule_condition,
    rule_action: rule.rule_action,
    rule_priority: rule.rule_priority,
    rule_scope: rule.rule_scope,
  })));
  const replayReferenceIds = Object.freeze([...(input.replayReferenceIds ?? ["policy-replay/v1"])]);
  const policyHash = hashValue("mission-control-policy-hash", {
    tenant_id: input.request.tenant_id,
    policy_type: input.policyType,
    policy_name: input.policyName,
    policy_description: input.policyDescription,
    policy_scope: input.policyScope,
    policy_version: input.policyVersion,
    policy_state: input.policyState,
    policy_action: input.policyAction,
    policy_priority: input.policyPriority,
    policy_authority: input.policyAuthority,
    policy_timestamp: policyTimestamp,
    policy_rules: policyRules,
    replay_reference_ids: replayReferenceIds,
  });
  const policyId = input.policyId ?? hashValue("mission-control-policy-id", {
    tenant_id: input.request.tenant_id,
    policy_type: input.policyType,
    policy_name: input.policyName,
    policy_version: input.policyVersion,
    policy_hash: policyHash,
  });

  const policy: TruthPolicyContract = Object.freeze({
    policy_id: policyId,
    tenant_id: input.request.tenant_id,
    policy_type: input.policyType,
    policy_name: input.policyName,
    policy_description: input.policyDescription,
    policy_scope: Object.freeze({
      scope_type: input.policyScope.scope_type,
      scope_id: input.policyScope.scope_id,
      scope_description: input.policyScope.scope_description,
    }),
    policy_version: input.policyVersion,
    policy_state: input.policyState,
    policy_action: input.policyAction,
    policy_priority: input.policyPriority,
    policy_authority: Object.freeze({
      authority_id: input.policyAuthority.authority_id,
      authority_type: input.policyAuthority.authority_type,
      authority_scope: input.policyAuthority.authority_scope,
      authority_timestamp: input.policyAuthority.authority_timestamp,
      authority_evidence: Object.freeze([...input.policyAuthority.authority_evidence]),
    }),
    policy_timestamp: policyTimestamp,
    policy_hash: policyHash,
    created_timestamp: input.request.now,
    policy_rules: policyRules,
    replay_reference_ids: replayReferenceIds,
  });

  const policyIdPresent = policy.policy_id.length > 0;
  addReason(reasons, policyIdPresent ? "POLICY_ID_PRESENT" : "POLICY_ID_MISSING");
  const policyIdUnique = !(input.priorPolicyIds ?? []).includes(policy.policy_id);
  addReason(reasons, policyIdUnique ? "POLICY_ID_UNIQUE" : "POLICY_ID_DUPLICATE");
  const identityImmutable = input.identityMutated !== true;
  addReason(reasons, identityImmutable ? "POLICY_ID_IMMUTABLE" : "POLICY_ID_MUTATED");
  const policyHashValid = input.hashMismatchDetected !== true;
  addReason(reasons, policyHashValid ? "POLICY_HASH_VALID" : "POLICY_HASH_MISMATCH");

  const tenantIdPresent = policy.tenant_id.length > 0;
  addReason(reasons, tenantIdPresent ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  const policyTypePresent = policy.policy_type.length > 0;
  addReason(reasons, policyTypePresent ? "POLICY_TYPE_PRESENT" : "POLICY_TYPE_MISSING");
  const policyTypeValid = POLICY_TYPES.has(policy.policy_type) && input.unknownPolicyTypeDetected !== true;
  addReason(reasons, policyTypeValid ? "POLICY_TYPE_VALID" : "POLICY_TYPE_INVALID");
  const policyTypeNotDeprecated = input.deprecatedPolicyTypeDetected !== true;
  addReason(reasons, policyTypeNotDeprecated ? "POLICY_TYPE_NOT_DEPRECATED" : "POLICY_TYPE_DEPRECATED");

  const policyStatePresent = policy.policy_state.length > 0;
  addReason(reasons, policyStatePresent ? "POLICY_STATE_PRESENT" : "POLICY_STATE_MISSING");
  const policyStateValid = POLICY_STATES.has(policy.policy_state) && input.unknownPolicyStateDetected !== true;
  addReason(reasons, policyStateValid ? "POLICY_STATE_VALID" : "POLICY_STATE_INVALID");
  const stateTransitionValid = policyStateValid
    && input.invalidStateTransitionDetected !== true
    && isValidStateTransition(input.priorState, policy.policy_state);
  addReason(reasons, stateTransitionValid ? "POLICY_STATE_TRANSITION_VALID" : "POLICY_STATE_TRANSITION_INVALID");

  const policyActionPresent = policy.policy_action.length > 0;
  addReason(reasons, policyActionPresent ? "POLICY_ACTION_PRESENT" : "POLICY_ACTION_MISSING");
  const policyActionSingle = input.multipleActionsDetected !== true;
  addReason(reasons, policyActionSingle ? "POLICY_ACTION_SINGLE" : "POLICY_ACTION_MULTIPLE");
  const policyActionValid = policyActionSingle
    && POLICY_ACTIONS.has(policy.policy_action)
    && input.unknownPolicyActionDetected !== true;
  addReason(reasons, policyActionValid ? "POLICY_ACTION_VALID" : "POLICY_ACTION_INVALID");

  const policyScopePresent = input.missingScopeDetected !== true
    && policy.policy_scope.scope_id.trim().length > 0
    && policy.policy_scope.scope_description.trim().length > 0;
  addReason(reasons, policyScopePresent ? "POLICY_SCOPE_PRESENT" : "POLICY_SCOPE_MISSING");
  const policyScopeValid = policyScopePresent
    && POLICY_SCOPES.has(policy.policy_scope.scope_type)
    && input.unknownScopeDetected !== true;
  addReason(reasons, policyScopeValid ? "POLICY_SCOPE_VALID" : "POLICY_SCOPE_INVALID");

  const policyAuthorityPresent = input.missingAuthorityDetected !== true
    && policy.policy_authority.authority_id.trim().length > 0
    && policy.policy_authority.authority_scope.trim().length > 0
    && !Number.isNaN(Date.parse(policy.policy_authority.authority_timestamp));
  addReason(reasons, policyAuthorityPresent ? "POLICY_AUTHORITY_PRESENT" : "POLICY_AUTHORITY_MISSING");
  const policyAuthorityValid = policyAuthorityPresent
    && AUTHORITY_TYPES.has(policy.policy_authority.authority_type)
    && policy.policy_authority.authority_evidence.length > 0
    && input.unknownAuthorityDetected !== true
    && input.missingAuthorityEvidenceDetected !== true;
  addReason(reasons, policyAuthorityValid ? "POLICY_AUTHORITY_VALID" : "POLICY_AUTHORITY_INVALID");

  const policyRulesPresent = policy.policy_rules.length > 0;
  addReason(reasons, policyRulesPresent ? "POLICY_RULES_PRESENT" : "POLICY_RULES_MISSING");
  const ruleConditionPresent = policyRulesPresent
    && input.missingRuleConditionDetected !== true
    && policy.policy_rules.every((rule) => rule.rule_condition.trim().length > 0);
  addReason(reasons, ruleConditionPresent ? "RULE_CONDITION_PRESENT" : "RULE_CONDITION_MISSING");
  const ruleActionPresent = policyRulesPresent
    && input.missingRuleActionDetected !== true
    && policy.policy_rules.every((rule) => POLICY_ACTIONS.has(rule.rule_action));
  addReason(reasons, ruleActionPresent ? "RULE_ACTION_PRESENT" : "RULE_ACTION_MISSING");
  const policyRulesValid = policyRulesPresent
    && ruleConditionPresent
    && ruleActionPresent
    && input.invalidRuleDetected !== true
    && policy.policy_rules.every((rule) => rule.rule_id.length > 0 && rule.rule_priority >= 0 && POLICY_SCOPES.has(rule.rule_scope));
  addReason(reasons, policyRulesValid ? "POLICY_RULES_VALID" : "POLICY_RULES_INVALID");

  const replayBindingValid = input.replayReferencesResolvable !== false && policy.replay_reference_ids.length > 0;
  addReason(reasons, replayBindingValid ? "REPLAY_BINDING_VALID" : "REPLAY_BINDING_INVALID");
  const tenantIsolationValid = input.crossTenantPolicyAccessDetected !== true
    && input.crossTenantPolicyReplayDetected !== true
    && policy.tenant_id === input.request.tenant_id
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

  const replayResult: TruthReplayResult = !policyRulesValid
    ? "INCOMPLETE_EVIDENCE"
    : !replayBindingValid
      ? "UNREPLAYABLE"
      : input.replayMismatchDetected === true
        || input.ruleMismatchDetected === true
        || input.authorityMismatchDetected === true
        ? "MISMATCH"
        : "REPRODUCED";
  addReason(
    reasons,
    replayResult === "REPRODUCED"
      ? "REPLAY_REPRODUCED"
      : replayResult === "MISMATCH"
        ? "REPLAY_MISMATCH"
        : replayResult === "INCOMPLETE_EVIDENCE"
          ? "REPLAY_INCOMPLETE_EVIDENCE"
          : "REPLAY_UNREPLAYABLE",
  );

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
  addReason(reasons, "POLICY_CONTRACT_IS_NOT_CONTROL");

  const valid = policyIdPresent
    && policyIdUnique
    && identityImmutable
    && policyHashValid
    && tenantIdPresent
    && policyTypePresent
    && policyTypeValid
    && policyTypeNotDeprecated
    && policyStatePresent
    && policyStateValid
    && stateTransitionValid
    && policyActionPresent
    && policyActionValid
    && policyScopeValid
    && policyAuthorityValid
    && policyRulesValid
    && replayBindingValid
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

  const observabilityOperational = input.observabilityGapDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");
  const conditional = valid
    && !observabilityOperational
    && input.remediationDocumented === true
    && replayResult === "REPRODUCED";
  const certification = certificationState(valid && observabilityOperational, conditional);
  addReason(
    reasons,
    certification === "PASS"
      ? "CERTIFICATION_PASS"
      : certification === "CONDITIONAL_PASS"
        ? "CERTIFICATION_CONDITIONAL_PASS"
        : "CERTIFICATION_FAIL",
  );

  const failureReason = valid
    ? null
    : [
      !policyIdUnique && "duplicate identity",
      !identityImmutable && "identity mutation detected",
      !policyHashValid && "hash mismatch",
      !policyTypeValid && "unknown policy type",
      !policyTypeNotDeprecated && "deprecated policy type",
      !policyStateValid && "unknown policy state",
      !stateTransitionValid && "invalid transition",
      !policyActionValid && "unknown or multiple policy actions",
      !policyScopeValid && "invalid scope",
      !policyAuthorityValid && "invalid authority",
      !policyRulesValid && "invalid rule",
      replayResult === "MISMATCH" && "policy replay mismatch",
      !tenantIsolationValid && "cross-tenant policy access",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthPolicyLedgerEntry = Object.freeze({
    policy_id: policy.policy_id,
    tenant_id: policy.tenant_id,
    policy_type: policy.policy_type,
    policy_state: policy.policy_state,
    policy_action: policy.policy_action,
    policy_version: policy.policy_version,
    validation_status: valid || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    certification_state: certification,
    failure_reason: failureReason,
  });
  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");

  const visibility: TruthPolicyContractVisibility = Object.freeze({
    policy_id: policy.policy_id,
    policy_type: policy.policy_type,
    policy_state: policy.policy_state,
    policy_action: policy.policy_action,
    policy_scope: policy.policy_scope.scope_type,
    policy_authority: policy.policy_authority.authority_id,
    validation_status: valid || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    timestamp: policy.policy_timestamp,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthPolicyContractObservability = Object.freeze({
    policies_total: 1,
    active_policies: policy.policy_state === "ACTIVE" ? 1 : 0,
    draft_policies: policy.policy_state === "DRAFT" ? 1 : 0,
    suspended_policies: policy.policy_state === "SUSPENDED" ? 1 : 0,
    retired_policies: policy.policy_state === "RETIRED" ? 1 : 0,
    validation_failures: valid || conditional ? 0 : 1,
    authority_failures: policyAuthorityValid ? 0 : 1,
    replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
  });

  const validation: TruthPolicyContractValidation = Object.freeze({
    valid: valid || conditional,
    validationState: valid || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    identityValid: policyIdUnique && identityImmutable && policyHashValid,
    typeValid: policyTypeValid && policyTypeNotDeprecated,
    stateValid: policyStateValid && stateTransitionValid,
    actionValid: policyActionValid,
    scopeValid: policyScopeValid,
    authorityValid: policyAuthorityValid,
    rulesValid: policyRulesValid,
    replayValid: replayResult === "REPRODUCED",
    tenantIsolationValid,
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

  const replay: TruthPolicyContractReplay = Object.freeze({
    replayResult,
    reconstructedPolicy: policy,
    reconstructedRules: policy.policy_rules,
    reconstructedAuthority: policy.policy_authority,
  });

  return Object.freeze({
    request: requestCore(input.request),
    policy,
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
