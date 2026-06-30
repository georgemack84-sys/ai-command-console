import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  RecommendationIntelligenceCertification,
  RecommendationIntelligenceCertificationEvidencePath,
  RecommendationIntelligenceCertificationInput,
  RecommendationIntelligenceCertificationObservability,
  RecommendationIntelligenceCertificationReasonCode,
  RecommendationIntelligenceCertificationRequest,
  RecommendationIntelligenceCertificationResult,
  RecommendationIntelligenceCertificationState,
  RecommendationIntelligenceCertificationValidation,
  RecommendationIntelligenceDomain,
  SealedRecommendationIntelligenceCertificationRecord,
} from "./types";

const MAX_DOMAINS = 14;
const MAX_CERTIFICATION_REFERENCES = 10_000;
const MAX_LINEAGE_REFERENCES = 10_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_GOVERNANCE_REFERENCES = 10_000;
const MAX_EVIDENCE_REFERENCES = 10_000;

const DOMAIN_ORDER: readonly RecommendationIntelligenceDomain[] = Object.freeze([
  "MEMORY",
  "OBSERVABILITY",
  "GOVERNANCE",
  "READINESS",
  "PORTFOLIO",
  "DEPENDENCY",
  "IMPACT",
  "DRIFT",
  "TRUST",
  "RESILIENCE",
  "DEPENDENCY_RISK",
  "OPPORTUNITY",
  "CONSTRAINT",
  "DEPENDENCY_HEALTH",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
  controlSurfaceAbsent: boolean;
}>;

type CertificationSignals = Readonly<{
  ownershipValid: boolean;
  tenantIsolationCertified: boolean;
  completionCertified: boolean;
  validationCertified: boolean;
  observabilityCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  lineageCertified: boolean;
  evidenceCertified: boolean;
  completionLimited: boolean;
  validationLimited: boolean;
  observabilityLimited: boolean;
  replayLimited: boolean;
  evidenceLimited: boolean;
  governanceReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  certificationReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(
  reasons: RecommendationIntelligenceCertificationReasonCode[],
  reason: RecommendationIntelligenceCertificationReasonCode,
): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(
  request: RecommendationIntelligenceCertificationRequest,
): RecommendationIntelligenceCertificationRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    graphVersion: request.graphVersion,
  });
}

function createBoundaryFlags(record: Record<string, unknown>): boolean {
  const blockedFlags = [
    "executionAuthorized",
    "workflowRoutingAllowed",
    "approvalAllowed",
    "recommendationApprovalAllowed",
    "recommendationRankingAllowed",
    "recommendationPrioritizationAllowed",
    "prioritizationAllowed",
    "recommendationScoringAllowed",
    "resourceAllocationAllowed",
    "approvalBehaviorAllowed",
    "governanceExecutionAllowed",
    "policyExecutionAllowed",
    "authorityMutationAllowed",
    "controlSurfacePresent",
  ] as const;
  return blockedFlags.every((key) => record[key] !== true);
}

function collectAllRecords(input: RecommendationIntelligenceCertificationInput): Record<string, unknown>[] {
  return [
    input.completion,
    input.validationRecord,
    input.observabilityRecord,
    input.replayRecord,
    input.portfolio,
    input.portfolioReplay,
    input.portfolioCertification,
    input.dependencyFoundation,
    input.dependencyReplay,
    input.dependencyCertification,
    input.impactFoundation,
    input.impactReplay,
    input.impactCertification,
    input.driftFoundation,
    input.driftReplay,
    input.driftCertification,
    input.trustFoundation,
    input.trustReplay,
    input.trustCertification,
    input.resilienceFoundation,
    input.resilienceReplay,
    input.resilienceCertification,
    input.dependencyRiskFoundation,
    input.dependencyRiskReplay,
    input.dependencyRiskCertification,
    input.opportunityFoundation,
    input.opportunityReplay,
    input.opportunityCertification,
    input.constraintFoundation,
    input.constraintReplay,
    input.constraintCertification,
    input.dependencyHealthFoundation,
    input.dependencyHealthReplay,
    input.dependencyHealthCertification,
    ...([...input.recommendations] as Record<string, unknown>[]).flatMap((bundle) => Object.values(bundle)),
  ] as Record<string, unknown>[];
}

function validateBoundary(
  input: RecommendationIntelligenceCertificationInput,
  reasons: RecommendationIntelligenceCertificationReasonCode[],
): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const approvalAbsent = input.approvalRequested !== true;
  const rankingAbsent = input.recommendationRankingRequested !== true;
  const prioritizationAbsent = input.prioritizationRequested !== true;
  const scoringAbsent = input.recommendationScoringRequested !== true;
  const resourceAllocationAbsent = input.resourceAllocationRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = collectAllRecords(input).every(createBoundaryFlags);

  addReason(reasons, executionImpossible ? "EXECUTION_IMPOSSIBLE" : "EXECUTION_REQUEST_BLOCKED");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, approvalAbsent ? "APPROVAL_ABSENT" : "APPROVAL_DETECTED");
  addReason(reasons, rankingAbsent ? "RANKING_ABSENT" : "RANKING_DETECTED");
  addReason(reasons, prioritizationAbsent ? "PRIORITIZATION_ABSENT" : "PRIORITIZATION_DETECTED");
  addReason(reasons, scoringAbsent ? "SCORING_ABSENT" : "SCORING_DETECTED");
  addReason(reasons, resourceAllocationAbsent ? "RESOURCE_ALLOCATION_ABSENT" : "RESOURCE_ALLOCATION_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.certificationMutationAttempted === true ? "CERTIFICATION_MUTATION_DETECTED" : "CERTIFICATION_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");

  return Object.freeze({
    executionImpossible,
    approvalAbsent,
    rankingAbsent,
    prioritizationAbsent,
    scoringAbsent,
    resourceAllocationAbsent,
    authorityBounded,
    invalidBoundary: !executionImpossible
      || !approvalAbsent
      || !rankingAbsent
      || !prioritizationAbsent
      || !scoringAbsent
      || !resourceAllocationAbsent
      || input.workflowRoutingRequested === true
      || !authorityBounded
      || input.certificationMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

function deriveSignals(input: RecommendationIntelligenceCertificationInput): CertificationSignals {
  const completionCertified = input.completion.result.overallCompletionState === "COMPLETE";
  const validationCertified = input.validationRecord.result.overallValidationState === "VALID";
  const observabilityCertified = input.observabilityRecord.result.overallObservabilityState === "VISIBLE";
  const replayCertified = input.replayRecord.result.overallReplayState === "REPLAYABLE";
  const governanceCertified = input.validationRecord.validation.governanceAligned
    && input.observabilityRecord.validation.governanceAligned
    && input.replayRecord.validation.governanceAligned;
  const lineageCertified = input.validationRecord.validation.lineageContinuous
    && input.observabilityRecord.validation.lineageContinuous
    && input.replayRecord.validation.lineageContinuous;
  const tenantIsolationCertified = input.completion.validation.tenantIsolationVerified
    && input.validationRecord.validation.tenantIsolationVerified
    && input.observabilityRecord.validation.tenantIsolationVerified
    && input.replayRecord.validation.tenantIsolationVerified;
  const ownershipValid = input.completion.validation.ownershipValid
    && input.validationRecord.validation.ownershipValid
    && input.observabilityRecord.validation.ownershipValid
    && input.replayRecord.validation.ownershipValid;

  const governanceReferences = normalizeStrings([
    ...input.completion.evidencePath.governanceReferences,
    ...input.validationRecord.evidencePath.governanceReferences,
    ...input.observabilityRecord.evidencePath.governanceReferences,
    ...input.replayRecord.evidencePath.governanceReferences,
  ]);
  const lineageReferences = normalizeStrings([
    ...input.completion.evidencePath.lineageReferences,
    ...input.validationRecord.evidencePath.lineageReferences,
    ...input.observabilityRecord.evidencePath.lineageReferences,
    ...input.replayRecord.evidencePath.lineageReferences,
  ]);
  const replayReferences = normalizeStrings([
    ...input.completion.evidencePath.replayReferences,
    ...input.validationRecord.evidencePath.replayReferences,
    ...input.observabilityRecord.evidencePath.replayReferences,
    ...input.replayRecord.evidencePath.replayReferences,
  ]);
  const certificationReferences = normalizeStrings([
    ...input.completion.evidencePath.certificationReferences,
    ...input.validationRecord.evidencePath.certificationReferences,
    ...input.observabilityRecord.evidencePath.certificationReferences,
    ...input.replayRecord.evidencePath.certificationReferences,
  ]);
  const evidenceHashes = normalizeStrings([
    ...input.completion.evidencePath.evidenceHashes,
    ...input.validationRecord.evidencePath.evidenceHashes,
    ...input.observabilityRecord.evidencePath.evidenceHashes,
    ...input.replayRecord.evidencePath.evidenceHashes,
  ]);

  const evidenceCertified = evidenceHashes.length > 0
    && governanceReferences.length > 0
    && lineageReferences.length > 0
    && replayReferences.length > 0
    && certificationReferences.length > 0;

  return Object.freeze({
    ownershipValid,
    tenantIsolationCertified,
    completionCertified,
    validationCertified,
    observabilityCertified,
    replayCertified,
    governanceCertified,
    lineageCertified,
    evidenceCertified,
    completionLimited: input.completion.result.overallCompletionState === "PARTIAL",
    validationLimited: input.validationRecord.result.overallValidationState === "PARTIAL",
    observabilityLimited: input.observabilityRecord.result.overallObservabilityState === "LIMITED",
    replayLimited: input.replayRecord.result.overallReplayState === "LIMITED",
    evidenceLimited: !evidenceCertified && evidenceHashes.length > 0,
    governanceReferences,
    lineageReferences,
    replayReferences,
    certificationReferences,
    evidenceHashes,
  });
}

function createEvidencePath(
  signals: CertificationSignals,
): RecommendationIntelligenceCertificationEvidencePath {
  return Object.freeze({
    domains: DOMAIN_ORDER,
    governanceReferences: signals.governanceReferences,
    lineageReferences: signals.lineageReferences,
    replayReferences: signals.replayReferences,
    certificationReferences: signals.certificationReferences,
    evidenceHashes: signals.evidenceHashes,
  });
}

function certificationState(
  signals: CertificationSignals,
  boundary: BoundaryValidation,
): RecommendationIntelligenceCertificationState {
  if (
    !signals.ownershipValid
    || !signals.tenantIsolationCertified
    || !signals.governanceCertified
    || !signals.lineageCertified
    || boundary.invalidBoundary
  ) {
    return "FAIL";
  }
  if (
    signals.completionCertified
    && signals.validationCertified
    && signals.observabilityCertified
    && signals.replayCertified
    && signals.governanceCertified
    && signals.lineageCertified
    && signals.evidenceCertified
    && signals.tenantIsolationCertified
  ) {
    return "PASS";
  }
  return "CONDITIONAL_PASS";
}

function validateTenantId(
  request: RecommendationIntelligenceCertificationRequest,
  reasons: RecommendationIntelligenceCertificationReasonCode[],
): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateSealedArtifacts(
  input: RecommendationIntelligenceCertificationInput,
  reasons: RecommendationIntelligenceCertificationReasonCode[],
): boolean {
  const completionSealed = input.completion.sealed === true;
  const validationSealed = input.validationRecord.sealed === true;
  const observabilitySealed = input.observabilityRecord.sealed === true;
  const replaySealed = input.replayRecord.sealed === true;
  const artifactsSealed = collectAllRecords(input).every((record) => record.sealed === true);
  addReason(reasons, completionSealed ? "COMPLETION_RECORD_SEALED" : "COMPLETION_RECORD_UNSEALED");
  addReason(reasons, validationSealed ? "VALIDATION_RECORD_SEALED" : "VALIDATION_RECORD_UNSEALED");
  addReason(reasons, observabilitySealed ? "OBSERVABILITY_RECORD_SEALED" : "OBSERVABILITY_RECORD_UNSEALED");
  addReason(reasons, replaySealed ? "REPLAY_RECORD_SEALED" : "REPLAY_RECORD_UNSEALED");
  addReason(reasons, artifactsSealed ? "ARTIFACTS_SEALED" : "ARTIFACT_UNSEALED");
  return completionSealed && validationSealed && observabilitySealed && replaySealed && artifactsSealed;
}

function validateSignals(
  signals: CertificationSignals,
  reasons: RecommendationIntelligenceCertificationReasonCode[],
): void {
  addReason(reasons, signals.completionCertified ? "COMPLETION_CERTIFIED" : "COMPLETION_NOT_CERTIFIED");
  addReason(reasons, signals.validationCertified ? "VALIDATION_CERTIFIED" : "VALIDATION_NOT_CERTIFIED");
  addReason(reasons, signals.observabilityCertified ? "OBSERVABILITY_CERTIFIED" : "OBSERVABILITY_NOT_CERTIFIED");
  addReason(reasons, signals.replayCertified ? "REPLAY_CERTIFIED" : "REPLAY_NOT_CERTIFIED");
  addReason(reasons, signals.governanceCertified ? "GOVERNANCE_CERTIFIED" : "GOVERNANCE_NOT_CERTIFIED");
  addReason(reasons, signals.lineageCertified ? "LINEAGE_CERTIFIED" : "LINEAGE_NOT_CERTIFIED");
  addReason(reasons, signals.evidenceCertified ? "EVIDENCE_CERTIFIED" : "EVIDENCE_NOT_CERTIFIED");
  addReason(reasons, signals.tenantIsolationCertified ? "TENANT_ISOLATION_CERTIFIED" : "TENANT_ISOLATION_NOT_CERTIFIED");
  addReason(reasons, signals.tenantIsolationCertified ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_CERTIFICATION_BLOCKED");
  addReason(reasons, signals.ownershipValid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  addReason(reasons, signals.governanceCertified ? "GOVERNANCE_ALIGNMENT_VALID" : "GOVERNANCE_CORRUPTION_DETECTED");
  addReason(reasons, signals.lineageCertified ? "LINEAGE_CONTINUITY_VALID" : "LINEAGE_CORRUPTION_DETECTED");
  addReason(reasons, signals.replayCertified || signals.replayLimited ? "REPLAY_CONTINUITY_VALID" : "REPLAY_CORRUPTION_DETECTED");
}

function validateLimits(
  evidencePath: RecommendationIntelligenceCertificationEvidencePath,
  reasons: RecommendationIntelligenceCertificationReasonCode[],
): boolean {
  const valid = evidencePath.domains.length <= MAX_DOMAINS
    && evidencePath.certificationReferences.length <= MAX_CERTIFICATION_REFERENCES
    && evidencePath.lineageReferences.length <= MAX_LINEAGE_REFERENCES
    && evidencePath.replayReferences.length <= MAX_REPLAY_REFERENCES
    && evidencePath.governanceReferences.length <= MAX_GOVERNANCE_REFERENCES
    && evidencePath.evidenceHashes.length <= MAX_EVIDENCE_REFERENCES;
  addReason(reasons, evidencePath.domains.length <= MAX_DOMAINS ? "DOMAIN_LIMIT_VALID" : "DOMAIN_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.certificationReferences.length <= MAX_CERTIFICATION_REFERENCES ? "CERTIFICATION_REFERENCE_LIMIT_VALID" : "CERTIFICATION_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.lineageReferences.length <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.replayReferences.length <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.governanceReferences.length <= MAX_GOVERNANCE_REFERENCES ? "GOVERNANCE_REFERENCE_LIMIT_VALID" : "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.evidenceHashes.length <= MAX_EVIDENCE_REFERENCES ? "EVIDENCE_REFERENCE_LIMIT_VALID" : "EVIDENCE_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildCertification(
  tenantId: string,
  state: RecommendationIntelligenceCertificationState,
  signals: CertificationSignals,
): RecommendationIntelligenceCertification {
  const core = Object.freeze({
    tenantId,
    certificationState: state,
    completionCertified: signals.completionCertified,
    validationCertified: signals.validationCertified,
    observabilityCertified: signals.observabilityCertified,
    replayCertified: signals.replayCertified,
    governanceCertified: signals.governanceCertified,
    lineageCertified: signals.lineageCertified,
    evidenceCertified: signals.evidenceCertified,
    tenantIsolationCertified: signals.tenantIsolationCertified,
    deterministic: true,
  });
  const certificationHash = hashValue("recommendation-intelligence-certification", core);
  const certificationId = hashValue("recommendation-intelligence-certification-id", {
    tenantId,
    certificationHash,
  });
  return Object.freeze({
    certificationId,
    ...core,
    certificationHash,
  });
}

function buildResult(
  certification: RecommendationIntelligenceCertification,
): RecommendationIntelligenceCertificationResult {
  return Object.freeze({
    tenantId: certification.tenantId,
    certificationState: certification.certificationState,
    completionCertified: certification.completionCertified,
    validationCertified: certification.validationCertified,
    observabilityCertified: certification.observabilityCertified,
    replayCertified: certification.replayCertified,
    governanceCertified: certification.governanceCertified,
    lineageCertified: certification.lineageCertified,
    evidenceCertified: certification.evidenceCertified,
    tenantIsolationCertified: certification.tenantIsolationCertified,
    domainsEvaluated: DOMAIN_ORDER.length,
    certificationHash: certification.certificationHash,
    deterministic: true,
  });
}

function buildObservability(
  result: RecommendationIntelligenceCertificationResult,
): RecommendationIntelligenceCertificationObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    certificationState: result.certificationState,
    completionCertified: result.completionCertified,
    validationCertified: result.validationCertified,
    observabilityCertified: result.observabilityCertified,
    replayCertified: result.replayCertified,
    governanceCertified: result.governanceCertified,
    lineageCertified: result.lineageCertified,
    evidenceCertified: result.evidenceCertified,
    tenantIsolationCertified: result.tenantIsolationCertified,
    certificationHash: result.certificationHash,
  });
}

function buildValidation(
  result: RecommendationIntelligenceCertificationResult,
  reasons: readonly RecommendationIntelligenceCertificationReasonCode[],
  signals: CertificationSignals,
  boundary: BoundaryValidation,
  evidencePath: RecommendationIntelligenceCertificationEvidencePath,
): RecommendationIntelligenceCertificationValidation {
  return Object.freeze({
    valid: result.certificationState !== "FAIL",
    certificationState: result.certificationState,
    reasonCodes: [...reasons],
    ownershipValid: signals.ownershipValid,
    tenantIsolationVerified: signals.tenantIsolationCertified,
    governanceAligned: signals.governanceCertified,
    lineageContinuous: signals.lineageCertified,
    replayContinuous: signals.replayCertified || signals.replayLimited,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    approvalAbsent: boundary.approvalAbsent,
    rankingAbsent: boundary.rankingAbsent,
    prioritizationAbsent: boundary.prioritizationAbsent,
    scoringAbsent: boundary.scoringAbsent,
    resourceAllocationAbsent: boundary.resourceAllocationAbsent,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
    domainsEvaluated: DOMAIN_ORDER.length,
    governanceReferenceCount: evidencePath.governanceReferences.length,
    lineageReferenceCount: evidencePath.lineageReferences.length,
    replayReferenceCount: evidencePath.replayReferences.length,
    certificationReferenceCount: evidencePath.certificationReferences.length,
    evidenceReferenceCount: evidencePath.evidenceHashes.length,
  });
}

export function buildRecommendationIntelligenceCertificationRequest(
  request: RecommendationIntelligenceCertificationRequest,
): RecommendationIntelligenceCertificationRequest {
  return requestCore(request);
}

export function sealRecommendationIntelligenceCertificationGate(
  input: RecommendationIntelligenceCertificationInput,
): SealedRecommendationIntelligenceCertificationRecord {
  const reasons: RecommendationIntelligenceCertificationReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const signals = deriveSignals(input);
  validateSignals(signals, reasons);
  const evidencePath = createEvidencePath(signals);
  const limitsValid = validateLimits(evidencePath, reasons);
  addReason(reasons, "RECOMMENDATION_INTELLIGENCE_CERTIFICATION_IS_NOT_CONTROL");

  const state = certificationState(signals, boundary);
  const certification = buildCertification(input.request.tenantId, state, signals);
  const result = buildResult(certification);

  const hardFail = !requestValid
    || !sealedValid
    || !signals.ownershipValid
    || !signals.tenantIsolationCertified
    || !signals.governanceCertified
    || !signals.lineageCertified
    || boundary.invalidBoundary
    || !limitsValid;

  const finalResult = hardFail
    ? Object.freeze({
      ...result,
      certificationState: "FAIL" as const,
      completionCertified: result.completionCertified,
      validationCertified: result.validationCertified,
      observabilityCertified: result.observabilityCertified,
      replayCertified: result.replayCertified,
      governanceCertified: result.governanceCertified,
      lineageCertified: result.lineageCertified,
      evidenceCertified: result.evidenceCertified,
      tenantIsolationCertified: result.tenantIsolationCertified,
    })
    : result;

  const finalCertification = hardFail
    ? Object.freeze({
      ...certification,
      certificationState: "FAIL" as const,
    })
    : certification;

  const observability = buildObservability(finalResult);
  const validation = buildValidation(finalResult, reasons, signals, boundary, evidencePath);

  return Object.freeze({
    result: finalResult,
    certification: finalCertification,
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    certificationOnly: true,
    executionAuthorized: false,
    workflowRoutingAllowed: false,
    approvalAllowed: false,
    recommendationRankingAllowed: false,
    prioritizationAllowed: false,
    recommendationScoringAllowed: false,
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
