import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthEvidenceVerification,
  TruthCertificationState,
  TruthEvidenceAuthenticityState,
  TruthEvidenceCompletenessState,
  TruthEvidenceConsistencyState,
  TruthEvidenceTrustState,
  TruthEvidenceVerificationContract,
  TruthEvidenceVerificationInput,
  TruthEvidenceVerificationLedgerEntry,
  TruthEvidenceVerificationObservability,
  TruthEvidenceVerificationReasonCode,
  TruthEvidenceVerificationReplay,
  TruthEvidenceVerificationRequest,
  TruthEvidenceVerificationValidation,
  TruthEvidenceVerificationVisibility,
  TruthReplayResult,
} from "./types";

function addReason(reasons: TruthEvidenceVerificationReasonCode[], reason: TruthEvidenceVerificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthEvidenceVerificationRequest): TruthEvidenceVerificationRequest {
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

function completenessState(input: TruthEvidenceVerificationInput): TruthEvidenceCompletenessState {
  if (input.missingRequiredFieldDetected === true || input.missingProvenanceDetected === true) return "INCOMPLETE";
  if (input.registration.registration.evidence_references.length === 0 || input.registration.registration.replay_references.length === 0) return "PARTIAL";
  return "COMPLETE";
}

function consistencyState(input: TruthEvidenceVerificationInput): TruthEvidenceConsistencyState {
  if (input.relationshipConflictDetected === true || input.timestampConflictDetected === true) return "CONFLICTING";
  if (input.hashMismatchDetected === true) return "INCONSISTENT";
  return "CONSISTENT";
}

function authenticityState(input: TruthEvidenceVerificationInput): TruthEvidenceAuthenticityState {
  if (input.sourceSpoofingDetected === true || input.provenanceTamperingDetected === true || input.signatureMismatchDetected === true) return "INVALID";
  if (input.originUnverifiableDetected === true) return "UNVERIFIED";
  return "AUTHENTIC";
}

function trustState(
  completeness: TruthEvidenceCompletenessState,
  consistency: TruthEvidenceConsistencyState,
  authenticity: TruthEvidenceAuthenticityState,
): TruthEvidenceTrustState {
  if (authenticity === "INVALID") return "RESTRICTED";
  if (consistency === "CONFLICTING" || consistency === "INCONSISTENT") return "UNTRUSTED";
  if (completeness === "PARTIAL" || authenticity === "UNVERIFIED") return "CONDITIONALLY_TRUSTED";
  if (completeness === "INCOMPLETE") return "UNTRUSTED";
  return "TRUSTED";
}

export function buildTruthEvidenceVerificationRequest(
  request: TruthEvidenceVerificationRequest,
): TruthEvidenceVerificationRequest {
  return requestCore(request);
}

export function sealTruthEvidenceVerification(
  input: TruthEvidenceVerificationInput,
): SealedTruthEvidenceVerification {
  const reasons: TruthEvidenceVerificationReasonCode[] = [];
  const evidence = input.registration.evidence.evidence;

  const verificationId = input.verificationId ?? hashValue("mission-control-evidence-verification-id", {
    evidence_id: evidence.evidence_id,
    verification_timestamp: input.request.now,
  });
  const verificationIdPresent = verificationId.length > 0;
  addReason(reasons, verificationIdPresent ? "VERIFICATION_ID_PRESENT" : "VERIFICATION_ID_MISSING");
  const evidenceIdPresent = evidence.evidence_id.length > 0;
  addReason(reasons, evidenceIdPresent ? "EVIDENCE_ID_PRESENT" : "EVIDENCE_ID_MISSING");
  const verificationStatePresent = true;
  addReason(reasons, verificationStatePresent ? "VERIFICATION_STATE_PRESENT" : "VERIFICATION_STATE_MISSING");

  const completeness = completenessState(input);
  addReason(reasons, completeness === "COMPLETE" ? "COMPLETENESS_COMPLETE" : completeness === "PARTIAL" ? "COMPLETENESS_PARTIAL" : "COMPLETENESS_INCOMPLETE");

  const consistency = consistencyState(input);
  addReason(reasons, consistency === "CONSISTENT" ? "CONSISTENCY_CONSISTENT" : consistency === "INCONSISTENT" ? "CONSISTENCY_INCONSISTENT" : "CONSISTENCY_CONFLICTING");

  const authenticity = authenticityState(input);
  addReason(reasons, authenticity === "AUTHENTIC" ? "AUTHENTICITY_AUTHENTIC" : authenticity === "SUSPECT" ? "AUTHENTICITY_SUSPECT" : authenticity === "UNVERIFIED" ? "AUTHENTICITY_UNVERIFIED" : "AUTHENTICITY_INVALID");

  const trust = input.unsupportedTrustStateDetected === true
    ? "UNTRUSTED"
    : trustState(completeness, consistency, authenticity);
  addReason(
    reasons,
    trust === "TRUSTED"
      ? "TRUST_TRUSTED"
      : trust === "CONDITIONALLY_TRUSTED"
        ? "TRUST_CONDITIONAL"
        : trust === "UNTRUSTED"
          ? "TRUST_UNTRUSTED"
          : "TRUST_RESTRICTED",
  );

  const trustRationalePresent = (input.trustRationale?.length ?? 0) > 0;
  addReason(reasons, trustRationalePresent ? "TRUST_RATIONALE_PRESENT" : "TRUST_RATIONALE_MISSING");

  const baseScore = (
    (completeness === "COMPLETE" ? 30 : completeness === "PARTIAL" ? 15 : 0)
    + (consistency === "CONSISTENT" ? 25 : consistency === "INCONSISTENT" ? 10 : 0)
    + (authenticity === "AUTHENTIC" ? 25 : authenticity === "UNVERIFIED" ? 10 : 0)
    + Math.max(0, Math.min(10, input.sourceConfidence ?? 10))
    + Math.max(0, Math.min(5, input.lineageConfidence ?? 5))
    + Math.max(0, Math.min(5, input.verificationHistoryScore ?? 5))
  );
  const integrityScore = Math.max(0, Math.min(100, baseScore));
  const scoreValid = input.nonDeterministicScoreDetected !== true && integrityScore >= 0 && integrityScore <= 100;
  addReason(reasons, scoreValid ? "INTEGRITY_SCORE_VALID" : "INTEGRITY_SCORE_INVALID");

  const rulesDeterministic = input.nonDeterministicScoreDetected !== true;
  addReason(reasons, rulesDeterministic ? "RULES_DETERMINISTIC" : "RULES_NON_DETERMINISTIC");

  const tenantIsolationValid = input.crossTenantVerificationDetected !== true
    && input.crossTenantTrustCalculationDetected !== true
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
  addReason(reasons, "EVIDENCE_INTEGRITY_VERIFICATION_IS_NOT_CONTROL");

  const replayResult: TruthReplayResult = input.registration.replay.replayResult !== "REPRODUCED"
    ? input.registration.replay.replayResult
    : input.replayMismatchDetected === true || input.nonDeterministicScoreDetected === true
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

  const verificationAccepted = completeness !== "INCOMPLETE"
    && consistency === "CONSISTENT"
    && authenticity === "AUTHENTIC"
    && trustRationalePresent
    && scoreValid
    && tenantIsolationValid
    && rulesDeterministic
    && replayResult === "REPRODUCED"
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent;

  const verification: TruthEvidenceVerificationContract = Object.freeze({
    verification_id: verificationId,
    evidence_id: evidence.evidence_id,
    tenant_id: evidence.tenant_id,
    mission_id: evidence.mission_id,
    verification_timestamp: input.request.now,
    verification_state: verificationAccepted ? "VERIFIED" : "REJECTED",
    verification_score: integrityScore,
    verification_reason: input.trustRationale ?? "deterministic evidence verification",
    evidence_hash: evidence.evidence_hash,
    evidence_version: evidence.evidence_version,
    replay_references: Object.freeze([...evidence.replay_reference_ids]),
  });

  const verificationValid = verificationAccepted;
  addReason(reasons, verificationValid ? "VERIFICATION_VALID" : "VERIFICATION_INVALID");

  const failClosed = true;
  addReason(reasons, failClosed ? "FAIL_CLOSED_ENFORCED" : "FAIL_OPEN_DETECTED");

  const observabilityOperational = input.observabilityGapDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");

  const conditional = !verificationAccepted
    && input.observabilityGapDetected === true
    && input.remediationDocumented === true
    && completeness === "PARTIAL"
    && consistency === "CONSISTENT"
    && authenticity !== "INVALID"
    && trustRationalePresent
    && scoreValid
    && tenantIsolationValid
    && replayResult === "REPRODUCED";
  const certification = certificationState(
    verificationAccepted && observabilityOperational,
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

  const failureReason = verificationAccepted
    ? null
    : [
      completeness === "INCOMPLETE" && "incomplete evidence",
      consistency !== "CONSISTENT" && "inconsistent evidence",
      authenticity === "INVALID" && "invalid evidence",
      input.sourceSpoofingDetected === true && "source spoofing detected",
      !trustRationalePresent && "missing trust rationale",
      !scoreValid && "trust scoring corruption",
      !tenantIsolationValid && "cross-tenant verification blocked",
      replayResult === "MISMATCH" && "verification replay mismatch",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthEvidenceVerificationLedgerEntry = Object.freeze({
    verification_id: verification.verification_id,
    evidence_id: verification.evidence_id,
    tenant_id: verification.tenant_id,
    mission_id: verification.mission_id,
    verification_state: verification.verification_state,
    completeness_state: completeness,
    consistency_state: consistency,
    authenticity_state: authenticity,
    trust_state: trust,
    verification_score: verification.verification_score,
    validation_status: verificationAccepted ? "VALID" : "INVALID",
    replay_status: replayResult,
    failure_reason: failureReason,
  });

  const visibility: TruthEvidenceVerificationVisibility = Object.freeze({
    verification_id: verification.verification_id,
    evidence_id: verification.evidence_id,
    verification_state: verification.verification_state,
    completeness_state: completeness,
    consistency_state: consistency,
    authenticity_state: authenticity,
    trust_state: trust,
    integrity_score: integrityScore,
    validation_status: verificationAccepted ? "VALID" : "INVALID",
    replay_status: replayResult,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthEvidenceVerificationObservability = Object.freeze({
    verifications_total: 1,
    complete_evidence_count: completeness === "COMPLETE" ? 1 : 0,
    partial_evidence_count: completeness === "PARTIAL" ? 1 : 0,
    incomplete_evidence_count: completeness === "INCOMPLETE" ? 1 : 0,
    consistent_evidence_count: consistency === "CONSISTENT" ? 1 : 0,
    conflicting_evidence_count: consistency === "CONFLICTING" ? 1 : 0,
    authentic_evidence_count: authenticity === "AUTHENTIC" ? 1 : 0,
    suspect_evidence_count: authenticity === "SUSPECT" || authenticity === "UNVERIFIED" ? 1 : 0,
    verification_failures: verificationAccepted ? 0 : 1,
    trust_failures: trust === "TRUSTED" || trust === "CONDITIONALLY_TRUSTED" ? 0 : 1,
    replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });

  const validation: TruthEvidenceVerificationValidation = Object.freeze({
    valid: verificationAccepted || conditional,
    validationState: verificationAccepted || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    completenessValid: completeness !== "INCOMPLETE",
    consistencyValid: consistency === "CONSISTENT",
    authenticityValid: authenticity === "AUTHENTIC" || authenticity === "UNVERIFIED",
    trustValid: trustRationalePresent && input.unsupportedTrustStateDetected !== true,
    scoreValid,
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

  const replay: TruthEvidenceVerificationReplay = Object.freeze({
    replayResult,
    reconstructedVerification: verification,
  });

  return Object.freeze({
    request: requestCore(input.request),
    registration: input.registration,
    verification,
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
