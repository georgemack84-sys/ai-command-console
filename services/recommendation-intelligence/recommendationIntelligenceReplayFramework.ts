import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  RecommendationIntelligenceReplay,
  RecommendationIntelligenceReplayEvidencePath,
  RecommendationIntelligenceReplayInput,
  RecommendationIntelligenceReplayObservability,
  RecommendationIntelligenceReplayReasonCode,
  RecommendationIntelligenceReplayRequest,
  RecommendationIntelligenceReplayResult,
  RecommendationIntelligenceReplayValidation,
  RecommendationReplayState,
  RecommendationReplayScope,
  SealedRecommendationIntelligenceReplayRecord,
} from "./types";

const MAX_DOMAINS = 14;
const MAX_COMPLETION_REFERENCES = 10_000;
const MAX_VALIDATION_REFERENCES = 10_000;
const MAX_GOVERNANCE_REFERENCES = 10_000;
const MAX_LINEAGE_REFERENCES = 10_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_CERTIFICATION_REFERENCES = 10_000;

const SCOPE_ORDER: readonly RecommendationReplayScope[] = Object.freeze([
  "COMPLETION",
  "VALIDATION",
  "GOVERNANCE",
  "LINEAGE",
  "OBSERVABILITY",
  "CERTIFICATION",
  "FULL",
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

type ReplaySignals = Readonly<{
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  governanceAligned: boolean;
  lineageContinuous: boolean;
  replayContinuous: boolean;
  completionReconstructable: boolean;
  completionLimited: boolean;
  validationReconstructable: boolean;
  validationLimited: boolean;
  observabilityReconstructable: boolean;
  observabilityLimited: boolean;
  observabilityEscalated: boolean;
  certificationReconstructable: boolean;
  certificationLimited: boolean;
  completionReferences: readonly string[];
  validationReferences: readonly string[];
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
  reasons: RecommendationIntelligenceReplayReasonCode[],
  reason: RecommendationIntelligenceReplayReasonCode,
): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(
  request: RecommendationIntelligenceReplayRequest,
): RecommendationIntelligenceReplayRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    graphVersion: request.graphVersion,
  });
}

function resultRecord(record: unknown): Record<string, unknown> {
  return (record && typeof record === "object" ? (record as { result?: unknown }).result : {}) as Record<string, unknown>;
}

function evidenceRecord(record: unknown): Record<string, unknown> {
  return (record && typeof record === "object" ? (record as { evidencePath?: unknown }).evidencePath : {}) as Record<string, unknown>;
}

function stringProp(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function stringArrayProp(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0) : [];
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

function orderedBundles(input: RecommendationIntelligenceReplayInput): Record<string, unknown>[] {
  return [...input.recommendations as readonly Record<string, unknown>[]].sort((left, right) => {
    const leftId = stringProp((left.ledger as Record<string, unknown>)?.entry as Record<string, unknown>, "recommendationId");
    const rightId = stringProp((right.ledger as Record<string, unknown>)?.entry as Record<string, unknown>, "recommendationId");
    return leftId.localeCompare(rightId);
  });
}

function collectAllRecords(input: RecommendationIntelligenceReplayInput): Record<string, unknown>[] {
  return [
    input.completion,
    input.validationRecord,
    input.observabilityRecord,
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
    ...orderedBundles(input).flatMap((bundle) => Object.values(bundle)),
  ] as Record<string, unknown>[];
}

function validateBoundary(
  input: RecommendationIntelligenceReplayInput,
  reasons: RecommendationIntelligenceReplayReasonCode[],
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
  addReason(reasons, input.replayMutationAttempted === true ? "REPLAY_MUTATION_DETECTED" : "REPLAY_MUTATION_BLOCKED");
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
      || input.replayMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

function deriveSignals(input: RecommendationIntelligenceReplayInput): ReplaySignals {
  const bundles = orderedBundles(input);
  const completionReferences = normalizeStrings(input.completion.contracts.map((contract) => contract.completionId));
  const validationReferences = normalizeStrings(input.validationRecord.validations.map((validation) => validation.validationId));
  const governanceReferences = normalizeStrings([
    ...input.completion.evidencePath.governanceReferences,
    ...input.validationRecord.evidencePath.governanceReferences,
    ...input.observabilityRecord.evidencePath.governanceReferences,
  ]);
  const lineageReferences = normalizeStrings([
    ...input.completion.evidencePath.lineageReferences,
    ...input.validationRecord.evidencePath.lineageReferences,
    ...input.observabilityRecord.evidencePath.lineageReferences,
  ]);
  const replayReferences = normalizeStrings([
    ...input.completion.evidencePath.replayReferences,
    ...input.validationRecord.evidencePath.replayReferences,
    ...input.observabilityRecord.evidencePath.replayReferences,
    ...bundles.flatMap((bundle) => stringArrayProp(bundle.replayEvidence as Record<string, unknown> ?? {}, "replayReferences")),
  ]);
  const certificationReferences = normalizeStrings([
    ...input.completion.evidencePath.certificationReferences,
    ...input.validationRecord.evidencePath.certificationReferences,
    ...input.observabilityRecord.evidencePath.certificationReferences,
  ]);
  const evidenceHashes = normalizeStrings([
    ...input.completion.evidencePath.evidenceHashes,
    ...input.validationRecord.evidencePath.evidenceHashes,
    ...input.observabilityRecord.evidencePath.evidenceHashes,
    ...bundles.map((bundle) => stringProp(resultRecord(bundle.audit), "exportHash")),
  ]);

  const ownershipValid = input.completion.validation.ownershipValid
    && input.validationRecord.validation.ownershipValid
    && input.observabilityRecord.validation.ownershipValid;
  const tenantIsolationVerified = input.completion.validation.tenantIsolationVerified
    && input.validationRecord.validation.tenantIsolationVerified
    && input.observabilityRecord.validation.tenantIsolationVerified;
  const governanceAligned = input.validationRecord.validation.governanceAligned
    && input.observabilityRecord.validation.governanceAligned
    && governanceReferences.length > 0;
  const lineageContinuous = input.validationRecord.validation.lineageContinuous
    && input.observabilityRecord.validation.lineageContinuous
    && lineageReferences.length > 0;
  const replayContinuous = input.validationRecord.validation.replayContinuous
    && input.observabilityRecord.validation.replayContinuous
    && replayReferences.length > 0;

  const completionReconstructable = input.completion.result.overallCompletionState === "COMPLETE";
  const completionLimited = input.completion.result.overallCompletionState === "PARTIAL" || completionReferences.length === 0;
  const validationReconstructable = input.validationRecord.result.overallValidationState === "VALID";
  const validationLimited = input.validationRecord.result.overallValidationState === "PARTIAL" || validationReferences.length === 0;
  const observabilityReconstructable = input.observabilityRecord.result.overallObservabilityState === "VISIBLE";
  const observabilityLimited = input.observabilityRecord.result.overallObservabilityState === "LIMITED";
  const observabilityEscalated = input.observabilityRecord.result.overallObservabilityState === "OBSERVE";
  const certificationReconstructable = certificationReferences.length > 0 && input.observabilityRecord.result.overallObservabilityState !== "INVALID";
  const certificationLimited = certificationReferences.length === 0 || input.completion.result.overallCompletionState === "PARTIAL";

  return Object.freeze({
    ownershipValid,
    tenantIsolationVerified,
    governanceAligned,
    lineageContinuous,
    replayContinuous,
    completionReconstructable,
    completionLimited,
    validationReconstructable,
    validationLimited,
    observabilityReconstructable,
    observabilityLimited,
    observabilityEscalated,
    certificationReconstructable,
    certificationLimited,
    completionReferences,
    validationReferences,
    governanceReferences,
    lineageReferences,
    replayReferences,
    certificationReferences,
    evidenceHashes,
  });
}

function aggregateReference(kind: string, refs: readonly string[]): string {
  if (refs.length === 0) return "";
  return `${kind}:${hashValue(`recommendation-intelligence-replay-${kind}`, refs)}`;
}

function scopeState(
  scope: RecommendationReplayScope,
  signals: ReplaySignals,
  boundary: BoundaryValidation,
): RecommendationReplayState {
  if (!signals.ownershipValid || !signals.tenantIsolationVerified || !boundary.authorityBounded) return "INVALID";
  if (!signals.governanceAligned) return "INVALID";

  switch (scope) {
    case "COMPLETION":
      if (signals.completionReconstructable && signals.lineageContinuous) return "REPLAYABLE";
      if (signals.completionLimited) return "LIMITED";
      return "ESCALATED";
    case "VALIDATION":
      if (signals.validationReconstructable && signals.lineageContinuous) return "REPLAYABLE";
      if (signals.validationLimited) return "LIMITED";
      return "ESCALATED";
    case "GOVERNANCE":
      if (signals.governanceAligned && signals.governanceReferences.length > 0) return "REPLAYABLE";
      if (signals.governanceReferences.length > 0) return "LIMITED";
      return "ESCALATED";
    case "LINEAGE":
      if (signals.lineageContinuous) return "REPLAYABLE";
      if (signals.lineageReferences.length > 0) return "LIMITED";
      return "ESCALATED";
    case "OBSERVABILITY":
      if (signals.observabilityReconstructable && signals.replayContinuous) return "REPLAYABLE";
      if (signals.observabilityLimited) return "LIMITED";
      if (signals.observabilityEscalated) return "ESCALATED";
      return "ESCALATED";
    case "CERTIFICATION":
      if (signals.certificationReconstructable) return "REPLAYABLE";
      if (signals.certificationLimited) return "LIMITED";
      return "ESCALATED";
    case "FULL":
      if (
        signals.completionReconstructable
        && signals.validationReconstructable
        && signals.observabilityReconstructable
        && signals.governanceAligned
        && signals.lineageContinuous
        && signals.replayContinuous
        && signals.certificationReconstructable
      ) {
        return "REPLAYABLE";
      }
      if (
        signals.completionLimited
        || signals.validationLimited
        || signals.observabilityLimited
        || signals.certificationLimited
      ) {
        return "LIMITED";
      }
      if (signals.observabilityEscalated) return "ESCALATED";
      return "ESCALATED";
    default:
      return "ESCALATED";
  }
}

function buildReplayRecord(
  tenantId: string,
  replayScope: RecommendationReplayScope,
  replayState: RecommendationReplayState,
  signals: ReplaySignals,
): RecommendationIntelligenceReplay {
  const completionReference = aggregateReference(`${replayScope.toLowerCase()}-completion`, signals.completionReferences);
  const validationReference = aggregateReference(`${replayScope.toLowerCase()}-validation`, signals.validationReferences);
  const governanceReference = aggregateReference(`${replayScope.toLowerCase()}-governance`, signals.governanceReferences);
  const lineageReference = aggregateReference(`${replayScope.toLowerCase()}-lineage`, signals.lineageReferences);
  const observabilityReference = aggregateReference(`${replayScope.toLowerCase()}-observability`, signals.replayReferences);
  const certificationReference = aggregateReference(`${replayScope.toLowerCase()}-certification`, signals.certificationReferences);
  const replayCore = Object.freeze({
    tenantId,
    replayScope,
    replayState,
    completionReference,
    validationReference,
    governanceReference,
    lineageReference,
    observabilityReference,
    certificationReference,
  });
  const replayHash = hashValue("recommendation-intelligence-replay-record", replayCore);
  const reconstructionHash = hashValue("recommendation-intelligence-reconstruction-record", {
    ...replayCore,
    evidenceHashes: signals.evidenceHashes,
  });
  const replayId = hashValue("recommendation-intelligence-replay-id", {
    tenantId,
    replayScope,
    replayHash,
    reconstructionHash,
  });
  return Object.freeze({
    replayId,
    ...replayCore,
    replayHash,
    reconstructionHash,
  });
}

function createEvidencePath(
  records: readonly RecommendationIntelligenceReplay[],
  signals: ReplaySignals,
): RecommendationIntelligenceReplayEvidencePath {
  return Object.freeze({
    scopes: SCOPE_ORDER,
    completionReferences: signals.completionReferences,
    validationReferences: signals.validationReferences,
    governanceReferences: signals.governanceReferences,
    lineageReferences: signals.lineageReferences,
    replayReferences: signals.replayReferences,
    certificationReferences: signals.certificationReferences,
    evidenceHashes: normalizeStrings([
      ...signals.evidenceHashes,
      ...records.map((record) => record.replayHash),
      ...records.map((record) => record.reconstructionHash),
    ]),
  });
}

function validateTenantId(
  request: RecommendationIntelligenceReplayRequest,
  reasons: RecommendationIntelligenceReplayReasonCode[],
): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateSealedArtifacts(
  input: RecommendationIntelligenceReplayInput,
  reasons: RecommendationIntelligenceReplayReasonCode[],
): boolean {
  const completionSealed = input.completion.sealed === true;
  const validationSealed = input.validationRecord.sealed === true;
  const observabilitySealed = input.observabilityRecord.sealed === true;
  const artifactsSealed = collectAllRecords(input).every((record) => record.sealed === true);
  addReason(reasons, completionSealed ? "COMPLETION_RECORD_SEALED" : "COMPLETION_RECORD_UNSEALED");
  addReason(reasons, validationSealed ? "VALIDATION_RECORD_SEALED" : "VALIDATION_RECORD_UNSEALED");
  addReason(reasons, observabilitySealed ? "OBSERVABILITY_RECORD_SEALED" : "OBSERVABILITY_RECORD_UNSEALED");
  addReason(reasons, artifactsSealed ? "ARTIFACTS_SEALED" : "ARTIFACT_UNSEALED");
  return completionSealed && validationSealed && observabilitySealed && artifactsSealed;
}

function validateReconstruction(
  signals: ReplaySignals,
  reasons: RecommendationIntelligenceReplayReasonCode[],
): void {
  addReason(reasons, signals.completionReconstructable || signals.completionLimited ? "COMPLETION_RECONSTRUCTION_REPRODUCIBLE" : "COMPLETION_RECONSTRUCTION_INCOMPLETE");
  addReason(reasons, signals.validationReconstructable || signals.validationLimited ? "VALIDATION_RECONSTRUCTION_REPRODUCIBLE" : "VALIDATION_RECONSTRUCTION_INCOMPLETE");
  addReason(reasons, signals.governanceAligned ? "GOVERNANCE_RECONSTRUCTION_REPRODUCIBLE" : "GOVERNANCE_RECONSTRUCTION_INCOMPLETE");
  addReason(reasons, signals.lineageContinuous ? "LINEAGE_RECONSTRUCTION_REPRODUCIBLE" : "LINEAGE_RECONSTRUCTION_INCOMPLETE");
  addReason(reasons, signals.observabilityReconstructable || signals.observabilityLimited ? "OBSERVABILITY_RECONSTRUCTION_REPRODUCIBLE" : "OBSERVABILITY_RECONSTRUCTION_INCOMPLETE");
  addReason(reasons, signals.certificationReconstructable || signals.certificationLimited ? "CERTIFICATION_RECONSTRUCTION_REPRODUCIBLE" : "CERTIFICATION_RECONSTRUCTION_INCOMPLETE");
}

function validateLimits(
  records: readonly RecommendationIntelligenceReplay[],
  evidencePath: RecommendationIntelligenceReplayEvidencePath,
  reasons: RecommendationIntelligenceReplayReasonCode[],
): boolean {
  const valid = records.length <= MAX_DOMAINS
    && evidencePath.completionReferences.length <= MAX_COMPLETION_REFERENCES
    && evidencePath.validationReferences.length <= MAX_VALIDATION_REFERENCES
    && evidencePath.governanceReferences.length <= MAX_GOVERNANCE_REFERENCES
    && evidencePath.lineageReferences.length <= MAX_LINEAGE_REFERENCES
    && evidencePath.replayReferences.length <= MAX_REPLAY_REFERENCES
    && evidencePath.certificationReferences.length <= MAX_CERTIFICATION_REFERENCES;
  addReason(reasons, records.length <= MAX_DOMAINS ? "SCOPE_LIMIT_VALID" : "SCOPE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.completionReferences.length <= MAX_COMPLETION_REFERENCES ? "COMPLETION_REFERENCE_LIMIT_VALID" : "COMPLETION_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.validationReferences.length <= MAX_VALIDATION_REFERENCES ? "VALIDATION_REFERENCE_LIMIT_VALID" : "VALIDATION_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.governanceReferences.length <= MAX_GOVERNANCE_REFERENCES ? "GOVERNANCE_REFERENCE_LIMIT_VALID" : "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.lineageReferences.length <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.replayReferences.length <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.certificationReferences.length <= MAX_CERTIFICATION_REFERENCES ? "CERTIFICATION_REFERENCE_LIMIT_VALID" : "CERTIFICATION_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function overallReplayState(records: readonly RecommendationIntelligenceReplay[]): RecommendationReplayState {
  if (records.some((record) => record.replayState === "INVALID")) return "INVALID";
  if (records.some((record) => record.replayState === "ESCALATED")) return "ESCALATED";
  if (records.some((record) => record.replayState === "LIMITED")) return "LIMITED";
  return "REPLAYABLE";
}

function buildResult(
  request: RecommendationIntelligenceReplayRequest,
  records: readonly RecommendationIntelligenceReplay[],
  tenantIsolationVerified: boolean,
  replayHash: string,
  reconstructionHash: string,
): RecommendationIntelligenceReplayResult {
  const replayableScopes = records.filter((record) => record.replayState === "REPLAYABLE").length;
  const limitedScopes = records.filter((record) => record.replayState === "LIMITED").length;
  const escalatedScopes = records.filter((record) => record.replayState === "ESCALATED").length;
  const invalidScopes = records.filter((record) => record.replayState === "INVALID").length;
  return Object.freeze({
    tenantId: request.tenantId,
    overallReplayState: overallReplayState(records),
    domainsEvaluated: MAX_DOMAINS,
    scopesEvaluated: records.length,
    replayableScopes,
    limitedScopes,
    escalatedScopes,
    invalidScopes,
    tenantIsolationVerified,
    replayHash,
    reconstructionHash,
    deterministic: true,
  });
}

function buildObservability(
  result: RecommendationIntelligenceReplayResult,
): RecommendationIntelligenceReplayObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    overallReplayState: result.overallReplayState,
    domainsEvaluated: result.domainsEvaluated,
    scopesEvaluated: result.scopesEvaluated,
    replayableScopes: result.replayableScopes,
    limitedScopes: result.limitedScopes,
    escalatedScopes: result.escalatedScopes,
    invalidScopes: result.invalidScopes,
    replayHash: result.replayHash,
    reconstructionHash: result.reconstructionHash,
  });
}

function buildValidation(
  result: RecommendationIntelligenceReplayResult,
  reasons: readonly RecommendationIntelligenceReplayReasonCode[],
  signals: ReplaySignals,
  boundary: BoundaryValidation,
  evidencePath: RecommendationIntelligenceReplayEvidencePath,
): RecommendationIntelligenceReplayValidation {
  return Object.freeze({
    valid: result.overallReplayState !== "INVALID",
    overallReplayState: result.overallReplayState,
    reasonCodes: [...reasons],
    ownershipValid: signals.ownershipValid,
    tenantIsolationVerified: result.tenantIsolationVerified,
    governanceAligned: signals.governanceAligned,
    lineageContinuous: signals.lineageContinuous,
    replayContinuous: signals.replayContinuous,
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
    domainsEvaluated: MAX_DOMAINS,
    scopesEvaluated: SCOPE_ORDER.length,
    completionReferenceCount: evidencePath.completionReferences.length,
    validationReferenceCount: evidencePath.validationReferences.length,
    governanceReferenceCount: evidencePath.governanceReferences.length,
    lineageReferenceCount: evidencePath.lineageReferences.length,
    replayReferenceCount: evidencePath.replayReferences.length,
    certificationReferenceCount: evidencePath.certificationReferences.length,
  });
}

export function buildRecommendationIntelligenceReplayRequest(
  request: RecommendationIntelligenceReplayRequest,
): RecommendationIntelligenceReplayRequest {
  return requestCore(request);
}

export function sealRecommendationIntelligenceReplayFramework(
  input: RecommendationIntelligenceReplayInput,
): SealedRecommendationIntelligenceReplayRecord {
  const reasons: RecommendationIntelligenceReplayReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const signals = deriveSignals(input);
  validateReconstruction(signals, reasons);

  addReason(reasons, signals.tenantIsolationVerified ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_REPLAY_BLOCKED");
  addReason(reasons, signals.ownershipValid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  addReason(reasons, signals.governanceAligned ? "GOVERNANCE_ALIGNMENT_VALID" : "GOVERNANCE_CORRUPTION_DETECTED");
  addReason(reasons, signals.lineageContinuous ? "LINEAGE_CONTINUITY_VALID" : "LINEAGE_BREAK_DETECTED");
  addReason(reasons, signals.replayContinuous ? "REPLAY_CONTINUITY_VALID" : "REPLAY_CORRUPTION_DETECTED");

  const replayRecords = Object.freeze(SCOPE_ORDER.map((scope) => buildReplayRecord(
    input.request.tenantId,
    scope,
    scopeState(scope, signals, boundary),
    signals,
  )));

  const evidencePath = createEvidencePath(replayRecords, signals);
  const limitsValid = validateLimits(replayRecords, evidencePath, reasons);
  addReason(reasons, "RECOMMENDATION_INTELLIGENCE_REPLAY_IS_NOT_CONTROL");

  const replayHash = hashValue("recommendation-intelligence-replay-framework", {
    request: requestCore(input.request),
    replayRecords,
    evidencePath,
  });
  const reconstructionHash = hashValue("recommendation-intelligence-reconstruction-framework", {
    replayHash,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    replayRecords,
    signals.tenantIsolationVerified,
    replayHash,
    reconstructionHash,
  );

  const hardInvalid = !requestValid
    || !sealedValid
    || !signals.ownershipValid
    || !signals.tenantIsolationVerified
    || !signals.governanceAligned
    || boundary.invalidBoundary
    || !limitsValid;

  const finalResult = hardInvalid
    ? Object.freeze({
      ...result,
      overallReplayState: "INVALID" as const,
    })
    : result;

  const observability = buildObservability(finalResult);
  const validation = buildValidation(finalResult, reasons, signals, boundary, evidencePath);

  return Object.freeze({
    result: finalResult,
    replayRecords,
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    replayOnly: true,
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
