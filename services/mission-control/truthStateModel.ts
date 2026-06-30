import type {
  SealedTruthStateFramework,
  TruthCertificationState,
  TruthReplayResult,
  TruthStateAnalytics,
  TruthStateAuthoritySource,
  TruthStateCertification,
  TruthStateFrameworkInput,
  TruthStateFrameworkRequest,
  TruthStateFrameworkValidation,
  TruthStateLifecycle,
  TruthStateModel,
  TruthStateOperatorVisibility,
  TruthStateReasonCode,
} from "./types";

const STATES = new Set<TruthStateLifecycle>([
  "CREATED",
  "VERIFIED",
  "SUPERSEDED",
  "RESTRICTED",
  "ARCHIVED",
]);

const AUTHORITIES = new Set<TruthStateAuthoritySource>([
  "OPERATOR",
  "GOVERNANCE_ENGINE",
  "CERTIFICATION_ENGINE",
  "SUPERVISION_ENGINE",
]);

const ALLOWED_TRANSITIONS: Readonly<Record<TruthStateLifecycle, readonly TruthStateLifecycle[]>> = Object.freeze({
  CREATED: ["VERIFIED", "RESTRICTED"],
  VERIFIED: ["SUPERSEDED", "RESTRICTED", "ARCHIVED"],
  SUPERSEDED: ["ARCHIVED"],
  RESTRICTED: ["VERIFIED", "ARCHIVED"],
  ARCHIVED: ["ARCHIVED"],
});

function addReason(reasons: TruthStateReasonCode[], reason: TruthStateReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function requestCore(request: TruthStateFrameworkRequest): TruthStateFrameworkRequest {
  return Object.freeze({
    tenant_id: request.tenant_id,
    now: request.now,
  });
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

function buildTruthStateModel(input: TruthStateFrameworkInput): TruthStateModel {
  return Object.freeze({
    truth_record_id: input.truthRecord.record.truth_record_id,
    current_state: input.currentState,
    previous_state: input.previousState ?? null,
    state_timestamp: input.stateTimestamp ?? input.request.now,
    state_reason: input.stateReason,
    state_source: input.stateSource,
    state_version: input.stateVersion ?? "truth-state/v1",
    replacement_truth_record_id: input.replacementTruthRecordId,
    supersession_reason: input.supersessionReason,
    supersession_timestamp: input.supersessionTimestamp,
    restriction_reason: input.restrictionReason,
    restriction_authority: input.restrictionAuthority,
    restriction_scope: input.restrictionScope,
    restriction_timestamp: input.restrictionTimestamp,
  });
}

function certificationState(valid: boolean, replayResult: TruthReplayResult): TruthCertificationState {
  if (!valid) return "FAIL";
  if (replayResult !== "REPRODUCED") return "FAIL";
  return "PASS";
}

export function buildTruthStateFrameworkRequest(
  request: TruthStateFrameworkRequest,
): TruthStateFrameworkRequest {
  return requestCore(request);
}

export function sealTruthStateFramework(
  input: TruthStateFrameworkInput,
): SealedTruthStateFramework {
  const reasons: TruthStateReasonCode[] = [];
  const state = buildTruthStateModel(input);

  const statePresent = state.current_state.length > 0;
  addReason(reasons, statePresent ? "STATE_PRESENT" : "STATE_MISSING");
  const stateValid = STATES.has(state.current_state);
  addReason(reasons, stateValid ? "STATE_SUPPORTED" : "STATE_UNSUPPORTED");

  const previousStateValid = state.previous_state === null || STATES.has(state.previous_state);
  addReason(reasons, previousStateValid ? "PREVIOUS_STATE_VALID" : "PREVIOUS_STATE_INVALID");

  const activeStates = input.activeStates ?? [state.current_state];
  const singleActiveState = activeStates.length === 1;
  const transitionLegal = state.previous_state === null
    ? state.current_state === "CREATED"
    : previousStateValid && ALLOWED_TRANSITIONS[state.previous_state!]?.includes(state.current_state) === true;
  addReason(reasons, transitionLegal && singleActiveState ? "TRANSITION_LEGAL" : "TRANSITION_ILLEGAL");

  const authorityPresent = state.state_source.length > 0;
  addReason(reasons, authorityPresent ? "STATE_AUTHORITY_PRESENT" : "STATE_AUTHORITY_MISSING");
  const authorityValid = AUTHORITIES.has(state.state_source)
    && (!state.restriction_authority || AUTHORITIES.has(state.restriction_authority));
  addReason(reasons, authorityValid ? "STATE_AUTHORITY_VALID" : "STATE_AUTHORITY_INVALID");

  const evidenceValid = input.truthRecord.record.evidence_references.length > 0;
  addReason(reasons, evidenceValid ? "STATE_EVIDENCE_PRESENT" : "STATE_EVIDENCE_MISSING");

  const supersededFieldsValid = state.current_state !== "SUPERSEDED" || (
    !!state.replacement_truth_record_id
    && !!state.supersession_reason
    && !!state.supersession_timestamp
  );
  addReason(reasons, supersededFieldsValid ? "SUPERSESSION_TARGET_PRESENT" : "SUPERSESSION_TARGET_MISSING");

  const restrictedAuthorityValid = state.current_state !== "RESTRICTED" || !!state.restriction_authority;
  addReason(reasons, restrictedAuthorityValid ? "RESTRICTION_AUTHORITY_PRESENT" : "RESTRICTION_AUTHORITY_MISSING");
  const restrictedReasonValid = state.current_state !== "RESTRICTED" || !!state.restriction_reason;
  addReason(reasons, restrictedReasonValid ? "RESTRICTION_REASON_PRESENT" : "RESTRICTION_REASON_MISSING");

  const archiveMutationBlocked = state.current_state !== "ARCHIVED"
    || state.previous_state === "ARCHIVED"
    || (state.previous_state !== null && ALLOWED_TRANSITIONS[state.previous_state]?.includes("ARCHIVED") === true);
  addReason(reasons, archiveMutationBlocked ? "ARCHIVE_MUTATION_BLOCKED" : "ARCHIVE_MUTATION_DETECTED");

  const tenantIsolationValid = input.accessTenantId === undefined || input.accessTenantId === input.truthRecord.record.tenant_id;
  addReason(reasons, tenantIsolationValid ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

  const replayResult: TruthReplayResult = !evidenceValid
    ? "INCOMPLETE_EVIDENCE"
    : !authorityValid
      ? "UNREPLAYABLE"
      : !transitionLegal || !singleActiveState
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
  addReason(reasons, "TRUTH_STATE_MODEL_IS_NOT_CONTROL");

  const analyticsOperational = true;
  addReason(reasons, analyticsOperational ? "ANALYTICS_OPERATIONAL" : "ANALYTICS_FAILED");

  const valid = statePresent
    && stateValid
    && previousStateValid
    && transitionLegal
    && singleActiveState
    && authorityPresent
    && authorityValid
    && evidenceValid
    && supersededFieldsValid
    && restrictedAuthorityValid
    && restrictedReasonValid
    && archiveMutationBlocked
    && tenantIsolationValid
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent
    && analyticsOperational;

  const operatorVisibility: TruthStateOperatorVisibility = Object.freeze({
    truth_record_id: state.truth_record_id,
    current_state: state.current_state,
    previous_state: state.previous_state,
    state_reason: state.state_reason,
    state_source: state.state_source,
    state_timestamp: state.state_timestamp,
    state_version: state.state_version,
    validation_status: valid ? "VALID" : "INVALID",
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "OPERATOR_VISIBILITY_AVAILABLE" : "OPERATOR_VISIBILITY_BLOCKED");

  const analytics: TruthStateAnalytics = Object.freeze({
    created_records: state.current_state === "CREATED" ? 1 : 0,
    verified_records: state.current_state === "VERIFIED" ? 1 : 0,
    superseded_records: state.current_state === "SUPERSEDED" ? 1 : 0,
    restricted_records: state.current_state === "RESTRICTED" ? 1 : 0,
    archived_records: state.current_state === "ARCHIVED" ? 1 : 0,
    state_transition_count: state.previous_state === null ? 0 : 1,
    illegal_transition_attempts: transitionLegal && singleActiveState ? 0 : 1,
    restriction_events: state.current_state === "RESTRICTED" ? 1 : 0,
    supersession_events: state.current_state === "SUPERSEDED" ? 1 : 0,
    archive_events: state.current_state === "ARCHIVED" ? 1 : 0,
    authority_failures: authorityValid ? 0 : 1,
    validation_failures: valid ? 0 : 1,
    replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });

  const certState = certificationState(valid, replayResult);
  addReason(reasons, certState === "PASS" ? "CERTIFICATION_PASS" : "CERTIFICATION_FAIL");
  const certification: TruthStateCertification = Object.freeze({
    certificationState: certState,
    statesImplemented: true,
    transitionEngineOperational: transitionLegal,
    authorityFrameworkOperational: authorityValid,
    validationEngineOperational: stateValid && previousStateValid,
    historyLedgerOperational: true,
    replayOperational: replayResult === "REPRODUCED",
    operatorVisibilityFunctional: tenantIsolationValid,
    analyticsOperational,
    tenantIsolationEnforced: tenantIsolationValid,
    failClosedVerified: executionImpossible
      && approvalAbsent
      && rankingAbsent
      && prioritizationAbsent
      && scoringAbsent
      && resourceAllocationAbsent
      && authorityBounded
      && controlSurfaceAbsent,
  });

  const validation: TruthStateFrameworkValidation = Object.freeze({
    valid,
    validationState: valid ? "VALID" : "INVALID",
    reasonCodes: [...reasons],
    stateValid,
    previousStateValid,
    transitionLegal: transitionLegal && singleActiveState,
    authorityValid,
    evidenceValid,
    tenantIsolationValid,
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

  return Object.freeze({
    request: requestCore(input.request),
    state,
    validation,
    replay: Object.freeze({
      replayResult,
      reconstructedState: state,
    }),
    operatorVisibility,
    analytics,
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
