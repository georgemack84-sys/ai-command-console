import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthEvidenceRegistration,
  TruthCertificationState,
  TruthEvidenceRegistrationContract,
  TruthEvidenceRegistrationInput,
  TruthEvidenceRegistrationLedgerEntry,
  TruthEvidenceRegistrationObservability,
  TruthEvidenceRegistrationReasonCode,
  TruthEvidenceRegistrationReplay,
  TruthEvidenceRegistrationRequest,
  TruthEvidenceRegistrationType,
  TruthEvidenceRegistrationValidation,
  TruthEvidenceRegistrationVisibility,
  TruthEvidenceSource,
  TruthReplayResult,
} from "./types";

const REGISTRATION_TYPES = new Set<TruthEvidenceRegistrationType>([
  "INPUT",
  "REFERENCE",
  "SUPPORTING_SIGNAL",
  "OBSERVATION",
]);

const SIGNAL_TYPES = new Set([
  "risk",
  "confidence",
  "governance",
  "runtime",
  "classification",
  "escalation",
  "health",
  "certification",
]);

function addReason(reasons: TruthEvidenceRegistrationReasonCode[], reason: TruthEvidenceRegistrationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthEvidenceRegistrationRequest): TruthEvidenceRegistrationRequest {
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

function certificationState(pass: boolean, conditional: boolean): TruthCertificationState {
  if (pass) return "PASS";
  if (conditional) return "CONDITIONAL_PASS";
  return "FAIL";
}

function countByType(prior: readonly TruthEvidenceRegistrationLedgerEntry[], type: TruthEvidenceRegistrationType): number {
  return prior.filter((entry) => entry.registration_type === type && entry.registration_state === "REGISTERED").length;
}

export function buildTruthEvidenceRegistrationRequest(
  request: TruthEvidenceRegistrationRequest,
): TruthEvidenceRegistrationRequest {
  return requestCore(request);
}

export function sealTruthEvidenceRegistration(
  input: TruthEvidenceRegistrationInput,
): SealedTruthEvidenceRegistration {
  const reasons: TruthEvidenceRegistrationReasonCode[] = [];
  const priorRegistrations = input.priorRegistrations ?? [];
  const evidence = input.evidence.evidence;

  const registrationId = input.registrationId ?? hashValue("mission-control-evidence-registration-id", {
    evidence_id: evidence.evidence_id,
    registration_timestamp: input.request.now,
    registration_type: input.registrationType,
  });

  const registrationIdPresent = registrationId.length > 0;
  addReason(reasons, registrationIdPresent ? "REGISTRATION_ID_PRESENT" : "REGISTRATION_ID_MISSING");
  const evidenceIdPresent = evidence.evidence_id.length > 0;
  addReason(reasons, evidenceIdPresent ? "EVIDENCE_ID_PRESENT" : "EVIDENCE_ID_MISSING");

  const registrationTypePresent = input.registrationType.length > 0;
  addReason(reasons, registrationTypePresent ? "REGISTRATION_TYPE_PRESENT" : "REGISTRATION_TYPE_MISSING");
  const registrationTypeValid = REGISTRATION_TYPES.has(input.registrationType);
  addReason(reasons, registrationTypeValid ? "REGISTRATION_TYPE_VALID" : "REGISTRATION_TYPE_INVALID");

  const registrationSourcePresent = input.registrationSource.length > 0;
  addReason(reasons, registrationSourcePresent ? "REGISTRATION_SOURCE_PRESENT" : "REGISTRATION_SOURCE_MISSING");
  const registrationSourceValid = registrationSourcePresent;
  addReason(reasons, registrationSourceValid ? "REGISTRATION_SOURCE_VALID" : "REGISTRATION_SOURCE_INVALID");

  const inputSourcePresent = input.registrationType !== "INPUT" || input.registrationSource.length > 0;
  addReason(reasons, inputSourcePresent ? "INPUT_SOURCE_PRESENT" : "INPUT_SOURCE_MISSING");
  const inputTenantPresent = input.registrationType !== "INPUT" || input.request.tenant_id.length > 0;
  addReason(reasons, inputTenantPresent ? "INPUT_TENANT_PRESENT" : "INPUT_TENANT_MISSING");
  const inputPayloadPresent = input.registrationType !== "INPUT" || Object.keys(evidence.evidence_payload.payload_data).length > 0;
  addReason(reasons, inputPayloadPresent ? "INPUT_PAYLOAD_PRESENT" : "INPUT_PAYLOAD_MISSING");

  const referenceResolvable = input.registrationType !== "REFERENCE"
    || (input.unresolvableReferenceDetected !== true
      && (input.knownReferenceTargets?.length ?? 0) > 0);
  addReason(reasons, referenceResolvable ? "REFERENCE_RESOLVABLE" : "REFERENCE_UNRESOLVABLE");
  const referenceTargetPresent = input.registrationType !== "REFERENCE"
    || (input.evidenceReferences?.length ?? 0) > 0;
  addReason(reasons, referenceTargetPresent ? "REFERENCE_TARGET_PRESENT" : "REFERENCE_TARGET_MISSING");

  const signalTypeValid = input.registrationType !== "SUPPORTING_SIGNAL"
    || (input.signalType !== undefined && SIGNAL_TYPES.has(input.signalType));
  addReason(reasons, signalTypeValid ? "SIGNAL_TYPE_VALID" : "SIGNAL_TYPE_INVALID");
  const signalSourcePresent = input.registrationType !== "SUPPORTING_SIGNAL" || input.registrationSource.length > 0;
  addReason(reasons, signalSourcePresent ? "SIGNAL_SOURCE_PRESENT" : "SIGNAL_SOURCE_MISSING");

  const observationContextPresent = input.registrationType !== "OBSERVATION"
    || (input.observationContext?.length ?? 0) > 0;
  addReason(reasons, observationContextPresent ? "OBSERVATION_CONTEXT_PRESENT" : "OBSERVATION_CONTEXT_MISSING");
  const observationSourcePresent = input.registrationType !== "OBSERVATION" || input.registrationSource.length > 0;
  addReason(reasons, observationSourcePresent ? "OBSERVATION_SOURCE_PRESENT" : "OBSERVATION_SOURCE_MISSING");

  const normalizationValid = input.normalizationFailureDetected !== true
    && input.evidenceContractMismatchDetected !== true;
  addReason(reasons, normalizationValid ? "NORMALIZATION_VALID" : "NORMALIZATION_FAILED");

  const classificationValid = input.unknownClassificationDetected !== true
    && input.multipleClassificationsDetected !== true;
  addReason(reasons, classificationValid ? "CLASSIFICATION_ASSIGNED" : input.multipleClassificationsDetected === true ? "CLASSIFICATION_MULTIPLE_DETECTED" : "CLASSIFICATION_INVALID");

  const integrityValid = input.evidence.validation.valid
    && input.invalidPayloadDetected !== true
    && referenceResolvable
    && referenceTargetPresent
    && signalTypeValid
    && observationContextPresent;
  addReason(reasons, integrityValid ? "INTEGRITY_VALID" : "INTEGRITY_INVALID");

  const transactionProtected = input.partialRegistrationDetected !== true && input.rollbackFailed !== true;
  addReason(reasons, transactionProtected ? "TRANSACTION_PROTECTED" : "PARTIAL_REGISTRATION_DETECTED");
  if (input.rollbackFailed === true) addReason(reasons, "ROLLBACK_FAILED");

  const tenantIsolationValid = input.crossTenantRegistrationDetected !== true
    && input.crossTenantReferenceDetected !== true
    && evidence.tenant_id === input.request.tenant_id
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

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
  addReason(reasons, "EVIDENCE_REGISTRATION_IS_NOT_CONTROL");

  const replayResult: TruthReplayResult = input.evidence.replay.replayResult !== "REPRODUCED"
    ? input.evidence.replay.replayResult
    : input.replayMismatchDetected === true
      || input.normalizationFailureDetected === true
      || input.evidenceContractMismatchDetected === true
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

  const registered = registrationIdPresent
    && evidenceIdPresent
    && registrationTypePresent
    && registrationTypeValid
    && registrationSourcePresent
    && registrationSourceValid
    && inputSourcePresent
    && inputTenantPresent
    && inputPayloadPresent
    && referenceResolvable
    && referenceTargetPresent
    && signalTypeValid
    && signalSourcePresent
    && observationContextPresent
    && observationSourcePresent
    && normalizationValid
    && classificationValid
    && integrityValid
    && transactionProtected
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

  const registration: TruthEvidenceRegistrationContract = Object.freeze({
    registration_id: registrationId,
    evidence_id: evidence.evidence_id,
    tenant_id: evidence.tenant_id,
    mission_id: evidence.mission_id,
    registration_timestamp: input.request.now,
    registration_source: input.registrationSource,
    registration_type: input.registrationType,
    registration_state: registered ? "REGISTERED" : "REJECTED",
    evidence_hash: evidence.evidence_hash,
    evidence_references: Object.freeze([...(input.evidenceReferences ?? [])]),
    replay_references: Object.freeze([...(input.replayReferences ?? input.evidence.evidence.replay_reference_ids)]),
  });

  const failureReason = registered
    ? null
    : [
      !inputSourcePresent && "missing input source",
      !inputTenantPresent && "missing tenant",
      !inputPayloadPresent && "missing payload",
      !referenceResolvable && "unresolvable reference",
      !referenceTargetPresent && "missing reference target",
      !signalTypeValid && "unknown signal type",
      !signalSourcePresent && "missing signal source",
      !observationContextPresent && "missing observation context",
      !observationSourcePresent && "missing observation source",
      !classificationValid && "invalid classification",
      !integrityValid && "invalid evidence rejected",
      !transactionProtected && "partial registration prevented",
      !tenantIsolationValid && "cross-tenant registration blocked",
      replayResult === "MISMATCH" && "registration replay mismatch",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthEvidenceRegistrationLedgerEntry = Object.freeze({
    registration_id: registration.registration_id,
    evidence_id: registration.evidence_id,
    tenant_id: registration.tenant_id,
    mission_id: registration.mission_id,
    registration_source: registration.registration_source,
    registration_type: registration.registration_type,
    registration_state: registration.registration_state,
    validation_status: registered ? "VALID" : "INVALID",
    transaction_status: registered
      ? "COMMITTED"
      : transactionProtected
        ? "ROLLED_BACK"
        : "NOT_STARTED",
    failure_reason: failureReason,
  });

  const observabilityOperational = input.observabilityGapDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");

  const conditional = !registered
    && input.observabilityGapDetected === true
    && input.remediationDocumented === true
    && normalizationValid
    && classificationValid
    && integrityValid
    && transactionProtected
    && tenantIsolationValid
    && replayResult === "REPRODUCED";
  const certification = certificationState(
    registered && observabilityOperational,
    conditional,
  );
  addReason(
    reasons,
    certification === "PASS"
      ? "CERTIFICATION_PASS"
      : certification === "CONDITIONAL_PASS"
        ? "CERTIFICATION_CONDITIONAL_PASS"
        : "CERTIFICATION_FAIL",
  );

  const visibility: TruthEvidenceRegistrationVisibility = Object.freeze({
    registration_id: registration.registration_id,
    evidence_id: registration.evidence_id,
    registration_type: registration.registration_type,
    registration_state: registration.registration_state,
    registration_source: registration.registration_source,
    classification: registration.registration_type,
    validation_status: registered ? "VALID" : "INVALID",
    replay_status: replayResult,
    timestamp: registration.registration_timestamp,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthEvidenceRegistrationObservability = Object.freeze({
    registrations_total: priorRegistrations.filter((entry) => entry.registration_state === "REGISTERED").length + (registered ? 1 : 0),
    inputs_registered: countByType(priorRegistrations, "INPUT") + (registered && input.registrationType === "INPUT" ? 1 : 0),
    references_registered: countByType(priorRegistrations, "REFERENCE") + (registered && input.registrationType === "REFERENCE" ? 1 : 0),
    signals_registered: countByType(priorRegistrations, "SUPPORTING_SIGNAL") + (registered && input.registrationType === "SUPPORTING_SIGNAL" ? 1 : 0),
    observations_registered: countByType(priorRegistrations, "OBSERVATION") + (registered && input.registrationType === "OBSERVATION" ? 1 : 0),
    validation_failures: registered ? 0 : 1,
    normalization_failures: normalizationValid ? 0 : 1,
    transaction_failures: transactionProtected ? 0 : 1,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
    registration_replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });

  const validation: TruthEvidenceRegistrationValidation = Object.freeze({
    valid: registered || conditional,
    validationState: registered || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    normalizationValid,
    classificationValid,
    integrityValid,
    transactionProtected,
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

  const replay: TruthEvidenceRegistrationReplay = Object.freeze({
    replayResult,
    normalizedEvidence: evidence,
    reconstructedRegistration: registration,
  });

  return Object.freeze({
    request: requestCore(input.request),
    evidence: input.evidence,
    registration,
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
