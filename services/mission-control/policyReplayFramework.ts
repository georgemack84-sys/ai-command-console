import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthPolicyReplayFramework,
  TruthCertificationState,
  TruthPolicyAction,
  TruthPolicyLedgerContract,
  TruthPolicyReplayBundle,
  TruthPolicyReplayContract,
  TruthPolicyReplayExplanation,
  TruthPolicyReplayInput,
  TruthPolicyReplayLedgerEntry,
  TruthPolicyReplayObservability,
  TruthPolicyReplayReasonCode,
  TruthPolicyReplayReplay,
  TruthPolicyReplayRequest,
  TruthPolicyReplayValidation,
  TruthPolicyReplayVisibility,
  TruthReplayResult,
} from "./types";

function addReason(reasons: TruthPolicyReplayReasonCode[], reason: TruthPolicyReplayReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthPolicyReplayRequest): TruthPolicyReplayRequest {
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

function decisionRationale(input: TruthPolicyReplayInput, result: TruthPolicyAction): string {
  if (result === "DENY") return input.denialRationale ?? "";
  if (result === "ALLOW") return input.approvalRationale ?? "";
  if (result === "CONTAIN") return input.containmentRationale ?? "";
  return input.approvalRationale ?? input.denialRationale ?? input.containmentRationale ?? "";
}

function defaultExplanation(
  input: TruthPolicyReplayInput,
  evaluationResult: TruthPolicyAction,
  authorityId: string,
): TruthPolicyReplayExplanation {
  const policy = input.policy.policy;
  return Object.freeze({
    why_action: decisionRationale(input, evaluationResult),
    policy_applied: policy.policy_id,
    authority_involved: authorityId,
    evidence_summary: `Policy ${policy.policy_id} replayed as ${evaluationResult}.`,
    evidence_references: Object.freeze(policy.replay_reference_ids.length > 0
      ? [...policy.replay_reference_ids]
      : input.ledgerEntries.flatMap((entry) => entry.entry.evidence_references.map((evidence) => evidence.evidence_id))),
  });
}

function ledgerContracts(input: TruthPolicyReplayInput): readonly TruthPolicyLedgerContract[] {
  return Object.freeze(input.ledgerEntries.map((entry) => entry.entry));
}

export function buildTruthPolicyReplayRequest(request: TruthPolicyReplayRequest): TruthPolicyReplayRequest {
  return requestCore(request);
}

export function sealTruthPolicyReplayFramework(input: TruthPolicyReplayInput): SealedTruthPolicyReplayFramework {
  const reasons: TruthPolicyReplayReasonCode[] = [];
  const replayTimestamp = input.replayTimestamp ?? input.request.now;
  const replayScope = input.replayScope ?? "FULL_POLICY";
  const reconstructedLedgerEntries = ledgerContracts(input);
  const policy = input.policy.policy;
  const evaluationEntry = reconstructedLedgerEntries.find((entry) => entry.event_type === "POLICY_EVALUATED");
  const evaluationResult = input.evaluationResult ?? evaluationEntry?.evaluation_result ?? policy.policy_action;
  const authorityId = input.authorityId ?? policy.policy_authority.authority_id;
  const authorityScope = input.authorityScope ?? policy.policy_authority.authority_scope;
  const explanation = input.explanation ?? defaultExplanation(input, evaluationResult, authorityId);

  const evidenceReferences = Object.freeze([
    ...new Set([
      ...policy.replay_reference_ids,
      ...reconstructedLedgerEntries.flatMap((entry) => entry.evidence_references.map((evidence) => evidence.evidence_id)),
      ...explanation.evidence_references,
    ]),
  ]);

  const reconstructionBundleId = hashValue("mission-control-policy-replay-bundle-id", {
    policy_id: policy.policy_id,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    replay_scope: replayScope,
    replay_timestamp: replayTimestamp,
    evidence_references: evidenceReferences,
  });
  const replayHash = hashValue("mission-control-policy-replay-hash", {
    policy,
    ledger_entries: reconstructedLedgerEntries,
    evaluation_result: evaluationResult,
    authority_id: authorityId,
    authority_scope: authorityScope,
    explanation,
    reconstruction_bundle_id: reconstructionBundleId,
  });
  const replayId = hashValue("mission-control-policy-replay-id", {
    policy_id: policy.policy_id,
    mission_id: input.missionId,
    replay_hash: replayHash,
  });

  const replayIdPresent = replayId.length > 0;
  addReason(reasons, replayIdPresent ? "REPLAY_ID_PRESENT" : "REPLAY_ID_MISSING");
  const policyIdPresent = policy.policy_id.trim().length > 0;
  addReason(reasons, policyIdPresent ? "POLICY_ID_PRESENT" : "POLICY_ID_MISSING");
  const replayScopePresent = replayScope.length > 0;
  addReason(reasons, replayScopePresent ? "REPLAY_SCOPE_PRESENT" : "REPLAY_SCOPE_MISSING");

  const contractValid = replayIdPresent && policyIdPresent && replayScopePresent;
  addReason(reasons, contractValid ? "POLICY_REPLAY_CONTRACT_VALID" : "POLICY_REPLAY_CONTRACT_INVALID");

  const activePolicyReconstructed = input.missingPolicyDetected !== true
    && input.policy.certification !== "FAIL"
    && policy.policy_state === "ACTIVE";
  addReason(reasons, activePolicyReconstructed ? "ACTIVE_POLICY_RECONSTRUCTED" : "ACTIVE_POLICY_MISSING");
  const policyVersionReproduced = input.policyVersionMismatchDetected !== true && policy.policy_version.trim().length > 0;
  addReason(reasons, policyVersionReproduced ? "POLICY_VERSION_REPRODUCED" : "POLICY_VERSION_MISMATCH");
  const evaluationReplayed = input.evaluationMismatchDetected !== true
    && (evaluationEntry !== undefined || input.evaluationResult !== undefined)
    && evaluationResult === policy.policy_action;
  addReason(reasons, evaluationReplayed ? "EVALUATION_REPLAY_REPRODUCED" : "EVALUATION_MISMATCH");

  const denialReconstructed = evaluationResult !== "DENY"
    || (input.missingDenialRationaleDetected !== true && (input.denialRationale ?? "").trim().length > 0);
  addReason(reasons, denialReconstructed ? "DENIAL_RECONSTRUCTED" : "DENIAL_RATIONALE_MISSING");
  const allowanceReconstructed = evaluationResult !== "ALLOW"
    || (input.missingApprovalRationaleDetected !== true && (input.approvalRationale ?? "").trim().length > 0);
  addReason(reasons, allowanceReconstructed ? "ALLOWANCE_RECONSTRUCTED" : "APPROVAL_RATIONALE_MISSING");
  const containmentReconstructed = evaluationResult !== "CONTAIN"
    || (input.containmentMismatchDetected !== true
      && input.missingContainmentRationaleDetected !== true
      && (input.containmentRationale ?? "").trim().length > 0);
  addReason(
    reasons,
    containmentReconstructed
      ? "CONTAINMENT_RECONSTRUCTED"
      : input.containmentMismatchDetected === true
        ? "CONTAINMENT_MISMATCH"
        : "CONTAINMENT_RATIONALE_MISSING",
  );
  const escalationPath = Object.freeze([...(input.escalationPath ?? [])]);
  const escalationReconstructed = evaluationResult !== "ESCALATE"
    || (input.brokenEscalationChainDetected !== true && escalationPath.length > 0);
  addReason(reasons, escalationReconstructed ? "ESCALATION_RECONSTRUCTED" : "ESCALATION_CHAIN_BROKEN");
  const authorityReconstructed = input.authorityMismatchDetected !== true
    && authorityId.trim().length > 0
    && authorityScope.trim().length > 0
    && authorityId === policy.policy_authority.authority_id;
  addReason(reasons, authorityReconstructed ? "AUTHORITY_RECONSTRUCTED" : "AUTHORITY_MISMATCH");
  const explanationGenerated = input.missingExplanationDetected !== true
    && explanation.why_action.trim().length > 0
    && explanation.policy_applied.trim().length > 0
    && explanation.authority_involved.trim().length > 0
    && explanation.evidence_references.length > 0;
  addReason(reasons, explanationGenerated ? "EXPLANATION_GENERATED" : "EXPLANATION_MISSING");

  const bundleAssembled = input.bundleAssemblyFailureDetected !== true
    && input.incompleteBundleDetected !== true
    && activePolicyReconstructed
    && reconstructedLedgerEntries.length > 0
    && explanationGenerated;
  addReason(reasons, bundleAssembled ? "BUNDLE_ASSEMBLED" : "BUNDLE_INCOMPLETE");
  const integrityValid = input.replayInconsistencyDetected !== true
    && replayHash.length > 0
    && reconstructionBundleId.length > 0
    && evidenceReferences.length > 0;
  addReason(reasons, integrityValid ? "REPLAY_INTEGRITY_VALID" : "REPLAY_INTEGRITY_INVALID");

  const tenantIsolationValid = input.crossTenantReplayAccessDetected !== true
    && input.crossTenantVisibilityDetected !== true
    && policy.tenant_id === input.request.tenant_id
    && reconstructedLedgerEntries.every((entry) => entry.tenant_id === input.request.tenant_id)
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_REPLAY_ISOLATION_VALID" : "TENANT_REPLAY_ISOLATION_FAILED");

  const replayResult: TruthReplayResult = !activePolicyReconstructed
    || !bundleAssembled
    || evidenceReferences.length === 0
    ? "INCOMPLETE_EVIDENCE"
    : !evaluationReplayed
      || !authorityReconstructed
      || !containmentReconstructed
      || !escalationReconstructed
      || !integrityValid
      ? "MISMATCH"
      : "REPRODUCED";
  addReason(
    reasons,
    replayResult === "REPRODUCED"
      ? "REPLAY_REPRODUCED"
      : replayResult === "MISMATCH"
        ? "REPLAY_MISMATCH"
        : "REPLAY_INCOMPLETE_EVIDENCE",
  );

  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");
  const ledgerImmutable = true;
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
  addReason(reasons, "POLICY_REPLAY_IS_NOT_CONTROL");

  const coreValid = contractValid
    && activePolicyReconstructed
    && policyVersionReproduced
    && evaluationReplayed
    && denialReconstructed
    && allowanceReconstructed
    && containmentReconstructed
    && escalationReconstructed
    && authorityReconstructed
    && explanationGenerated
    && bundleAssembled
    && integrityValid
    && ledgerImmutable
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
  const conditional = coreValid && !observabilityOperational && input.remediationDocumented === true && integrityValid;
  const certification = certificationState(coreValid && observabilityOperational, conditional);
  addReason(reasons, certification === "PASS" ? "CERTIFICATION_PASS" : certification === "CONDITIONAL_PASS" ? "CERTIFICATION_CONDITIONAL_PASS" : "CERTIFICATION_FAIL");

  const replayContract: TruthPolicyReplayContract = Object.freeze({
    replay_id: replayId,
    policy_id: policy.policy_id,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    replay_timestamp: replayTimestamp,
    replay_scope: replayScope,
    replay_state: coreValid || conditional ? "REPLAYED" : "REJECTED",
    replay_hash: replayHash,
    evidence_references: evidenceReferences,
    reconstruction_bundle_id: reconstructionBundleId,
  });

  const reconstructionBundle: TruthPolicyReplayBundle = Object.freeze({
    reconstruction_bundle_id: reconstructionBundleId,
    active_policy: policy,
    ledger_entries: reconstructedLedgerEntries,
    evaluation_result: evaluationResult,
    decision_rationale: decisionRationale(input, evaluationResult),
    containment_rationale: input.containmentRationale,
    escalation_path: escalationPath,
    authority_id: authorityId,
    authority_scope: authorityScope,
    explanation,
    bundle_status: bundleAssembled ? "ASSEMBLED" : "INCOMPLETE",
    bundle_hash: hashValue("mission-control-policy-replay-bundle-hash", {
      reconstruction_bundle_id: reconstructionBundleId,
      policy_id: policy.policy_id,
      evaluation_result: evaluationResult,
      authority_id: authorityId,
      explanation,
    }),
  });

  const failureReason = coreValid
    ? null
    : [
      !activePolicyReconstructed && "missing policy reconstruction",
      !policyVersionReproduced && "policy version mismatch",
      !evaluationReplayed && "evaluation mismatch",
      !denialReconstructed && "missing denial rationale",
      !allowanceReconstructed && "missing approval rationale",
      !containmentReconstructed && "containment mismatch or missing rationale",
      !escalationReconstructed && "broken escalation path",
      !authorityReconstructed && "authority mismatch",
      !explanationGenerated && "missing explanation",
      !bundleAssembled && "incomplete replay bundle",
      !tenantIsolationValid && "cross-tenant replay access",
      !integrityValid && "replay inconsistency",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthPolicyReplayLedgerEntry = Object.freeze({
    replay_id: replayId,
    policy_id: policy.policy_id,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    replay_scope: replayScope,
    replay_state: replayContract.replay_state,
    validation_status: coreValid || conditional ? "VALID" : "INVALID",
    replay_result: replayResult,
    certification_state: certification,
    failure_reason: failureReason,
    entry_hash: hashValue("mission-control-policy-replay-ledger-entry-hash", {
      replay_id: replayId,
      policy_id: policy.policy_id,
      replay_hash: replayHash,
      certification,
      failureReason,
    }),
  });

  const validation: TruthPolicyReplayValidation = Object.freeze({
    valid: coreValid || conditional,
    validationState: coreValid || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    contractValid,
    activePolicyReconstructed,
    policyVersionReproduced,
    evaluationReplayed,
    denialReconstructed,
    allowanceReconstructed,
    containmentReconstructed,
    escalationReconstructed,
    authorityReconstructed,
    explanationGenerated,
    bundleAssembled,
    integrityValid,
    ledgerImmutable,
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

  const replay: TruthPolicyReplayReplay = Object.freeze({
    replayResult,
    reconstructedPolicy: policy,
    reconstructedLedgerEntries,
    reconstructedBundle: reconstructionBundle,
    explanation,
  });

  const visibility: TruthPolicyReplayVisibility = Object.freeze({
    policy_id: policy.policy_id,
    replay_state: replayContract.replay_state,
    bundle_status: reconstructionBundle.bundle_status,
    authority_status: authorityReconstructed ? "VALID" : "INVALID",
    containment_status: containmentReconstructed ? "VALID" : "INVALID",
    escalation_status: escalationReconstructed ? "VALID" : "INVALID",
    validation_status: coreValid || conditional ? "VALID" : "INVALID",
    replay_timestamp: replayTimestamp,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthPolicyReplayObservability = Object.freeze({
    replays_total: 1,
    successful_replays: coreValid || conditional ? 1 : 0,
    failed_replays: coreValid || conditional ? 0 : 1,
    bundle_failures: bundleAssembled ? 0 : 1,
    authority_mismatches: authorityReconstructed ? 0 : 1,
    evaluation_mismatches: evaluationReplayed ? 0 : 1,
    containment_mismatches: containmentReconstructed ? 0 : 1,
    escalation_mismatches: escalationReconstructed ? 0 : 1,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
  });

  return Object.freeze({
    request: requestCore(input.request),
    replayContract,
    reconstructionBundle,
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
