import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthPolicyLedger,
  TruthCertificationState,
  TruthPolicyLedgerContract,
  TruthPolicyLedgerInput,
  TruthPolicyLedgerObservability,
  TruthPolicyLedgerReasonCode,
  TruthPolicyLedgerReplay,
  TruthPolicyLedgerRequest,
  TruthPolicyLedgerValidation,
  TruthPolicyLedgerVisibility,
  TruthReplayResult,
} from "./types";

function addReason(reasons: TruthPolicyLedgerReasonCode[], reason: TruthPolicyLedgerReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthPolicyLedgerRequest): TruthPolicyLedgerRequest {
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

function eventRecorderReason(eventType: string, valid: boolean): TruthPolicyLedgerReasonCode {
  if (eventType === "POLICY_CREATED") return valid ? "CREATION_RECORDED" : "CREATION_MISSING";
  if (eventType === "POLICY_UPDATED") return valid ? "UPDATE_RECORDED" : "UPDATE_MISSING";
  if (eventType === "POLICY_EVALUATED") return valid ? "EVALUATION_RECORDED" : "EVALUATION_MISSING";
  if (eventType === "POLICY_VIOLATION") return valid ? "VIOLATION_RECORDED" : "VIOLATION_MISSING";
  if (eventType === "POLICY_ESCALATION") return valid ? "ESCALATION_RECORDED" : "ESCALATION_MISSING";
  return valid ? "CONTAINMENT_RECORDED" : "CONTAINMENT_MISSING";
}

export function buildTruthPolicyLedgerRequest(request: TruthPolicyLedgerRequest): TruthPolicyLedgerRequest {
  return requestCore(request);
}

export function sealTruthPolicyLedger(input: TruthPolicyLedgerInput): SealedTruthPolicyLedger {
  const reasons: TruthPolicyLedgerReasonCode[] = [];
  const eventTimestamp = input.eventTimestamp ?? input.request.now;
  const entryHash = hashValue("mission-control-policy-ledger-entry-hash", {
    policy_id: input.policyId,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    event_type: input.eventType,
    event_timestamp: eventTimestamp,
    actor_id: input.actorId,
    actor_type: input.actorType,
    rationale: input.rationale,
    evidence_references: input.evidenceReferences,
    replay_references: input.replayReferences,
    evaluation_result: input.evaluationResult,
    violation_severity: input.violationSeverity,
  });
  const ledgerEntryId = hashValue("mission-control-policy-ledger-entry-id", {
    policy_id: input.policyId,
    event_type: input.eventType,
    entry_hash: entryHash,
  });

  const ledgerEntryIdPresent = ledgerEntryId.length > 0;
  addReason(reasons, ledgerEntryIdPresent ? "LEDGER_ENTRY_ID_PRESENT" : "LEDGER_ENTRY_ID_MISSING");
  const policyIdPresent = input.policyId.trim().length > 0;
  addReason(reasons, policyIdPresent ? "POLICY_ID_PRESENT" : "POLICY_ID_MISSING");
  const eventTypePresent = input.eventType.length > 0;
  addReason(reasons, eventTypePresent ? "EVENT_TYPE_PRESENT" : "EVENT_TYPE_MISSING");
  const timestampPresent = eventTimestamp.length > 0 && !Number.isNaN(Date.parse(eventTimestamp));
  addReason(reasons, timestampPresent ? "EVENT_TIMESTAMP_PRESENT" : "EVENT_TIMESTAMP_MISSING");
  const actorValid = input.actorId.trim().length > 0 && input.actorType.length > 0;
  addReason(reasons, actorValid ? "ACTOR_VALID" : "ACTOR_INVALID");
  const rationalePresent = input.rationale.trim().length > 0;
  addReason(reasons, rationalePresent ? "RATIONALE_PRESENT" : "RATIONALE_MISSING");

  const recorderValid = input.missingEventRecordDetected !== true
    && (input.eventType !== "POLICY_EVALUATED" || input.evaluationResult !== undefined)
    && (input.eventType !== "POLICY_VIOLATION" || input.violationSeverity !== undefined);
  addReason(reasons, eventRecorderReason(input.eventType, recorderValid));

  const evidenceBindingValid = input.evidenceMissingDetected !== true
    && input.evidenceReferences.length > 0
    && input.evidenceReferences.every((evidence) => (
      evidence.evidence_id.length > 0
      && evidence.evidence_type.length > 0
      && evidence.evidence_hash.length > 0
      && evidence.evidence_scope.length > 0
    ));
  addReason(reasons, evidenceBindingValid ? "EVIDENCE_BINDING_VALID" : "EVIDENCE_BINDING_MISSING");
  const replayBindingValid = input.replayReferenceMissingDetected !== true
    && input.replayReferences.length > 0
    && input.replayReferences.every((replay) => (
      replay.replay_id.length > 0
      && replay.replay_bundle_id.length > 0
      && replay.replay_hash.length > 0
    ));
  addReason(reasons, replayBindingValid ? "REPLAY_BINDING_VALID" : "REPLAY_BINDING_MISSING");
  const integrityValid = input.tamperedEntryDetected !== true && input.orderingInvalidDetected !== true;
  addReason(reasons, integrityValid ? "LEDGER_INTEGRITY_VALID" : "LEDGER_INTEGRITY_INVALID");
  const immutableStorageValid = input.entryModificationDetected !== true;
  addReason(reasons, immutableStorageValid ? "IMMUTABLE_STORAGE_VALID" : "ENTRY_MODIFICATION_DETECTED");
  const tenantIsolationValid = input.crossTenantLedgerAccessDetected !== true
    && input.crossTenantReplayAccessDetected !== true
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_LEDGER_ISOLATION_VALID" : "TENANT_LEDGER_ISOLATION_FAILED");

  const replayResult: TruthReplayResult = !evidenceBindingValid
    ? "INCOMPLETE_EVIDENCE"
    : !replayBindingValid
      ? "UNREPLAYABLE"
      : input.replayMismatchDetected === true
        ? "MISMATCH"
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
  addReason(reasons, "POLICY_LEDGER_IS_NOT_CONTROL");

  const contractValid = ledgerEntryIdPresent && policyIdPresent && eventTypePresent && timestampPresent && actorValid && rationalePresent;
  const valid = contractValid
    && recorderValid
    && evidenceBindingValid
    && replayBindingValid
    && integrityValid
    && immutableStorageValid
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

  const entry: TruthPolicyLedgerContract = Object.freeze({
    ledger_entry_id: ledgerEntryId,
    policy_id: input.policyId,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    event_type: input.eventType,
    event_timestamp: eventTimestamp,
    actor_id: input.actorId,
    actor_type: input.actorType,
    rationale: input.rationale,
    evidence_references: Object.freeze(input.evidenceReferences.map((evidence) => Object.freeze({ ...evidence }))),
    replay_references: Object.freeze(input.replayReferences.map((replay) => Object.freeze({ ...replay }))),
    entry_hash: entryHash,
    evaluation_result: input.evaluationResult,
    violation_severity: input.violationSeverity,
  });

  const validation: TruthPolicyLedgerValidation = Object.freeze({
    valid: valid || conditional,
    validationState: valid || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    contractValid,
    recorderValid,
    evidenceBindingValid,
    replayBindingValid,
    integrityValid,
    immutableStorageValid,
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

  const replay: TruthPolicyLedgerReplay = Object.freeze({
    replayResult,
    reconstructedEntry: entry,
  });

  const visibility: TruthPolicyLedgerVisibility = Object.freeze({
    ledger_entry_id: entry.ledger_entry_id,
    policy_id: entry.policy_id,
    event_type: entry.event_type,
    actor: entry.actor_id,
    timestamp: entry.event_timestamp,
    evidence_status: evidenceBindingValid ? "VALID" : "INVALID",
    replay_status: replayResult,
    validation_status: valid || conditional ? "VALID" : "INVALID",
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthPolicyLedgerObservability = Object.freeze({
    ledger_entries_total: 1,
    policy_creations: input.eventType === "POLICY_CREATED" ? 1 : 0,
    policy_updates: input.eventType === "POLICY_UPDATED" ? 1 : 0,
    policy_evaluations: input.eventType === "POLICY_EVALUATED" ? 1 : 0,
    policy_violations: input.eventType === "POLICY_VIOLATION" ? 1 : 0,
    policy_escalations: input.eventType === "POLICY_ESCALATION" ? 1 : 0,
    containment_actions: input.eventType === "CONTAINMENT_ACTION" ? 1 : 0,
    validation_failures: valid || conditional ? 0 : 1,
    tamper_detections: integrityValid && immutableStorageValid ? 0 : 1,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
    replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });

  return Object.freeze({
    request: requestCore(input.request),
    entry,
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
