import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  RecommendationIntelligenceObservability,
  RecommendationIntelligenceObservabilityEvidencePath,
  RecommendationIntelligenceObservabilityInput,
  RecommendationIntelligenceLayerObservability,
  RecommendationIntelligenceObservabilityReasonCode,
  RecommendationIntelligenceObservabilityRequest,
  RecommendationIntelligenceObservabilityResult,
  RecommendationIntelligenceObservabilityState,
  RecommendationIntelligenceObservabilityValidation,
  RecommendationIntelligenceVisibilityScope,
  SealedRecommendationIntelligenceObservabilityRecord,
} from "./types";

const MAX_DOMAINS = 14;
const MAX_VISIBLE_REFERENCES = 50_000;
const MAX_GOVERNANCE_REFERENCES = 10_000;
const MAX_LINEAGE_REFERENCES = 10_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_CERTIFICATION_REFERENCES = 10_000;

const SCOPE_ORDER: readonly RecommendationIntelligenceVisibilityScope[] = Object.freeze([
  "SUMMARY",
  "COMPLETION",
  "VALIDATION",
  "GOVERNANCE",
  "LINEAGE",
  "REPLAY",
  "AUDIT",
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

type ObservabilitySignals = Readonly<{
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  governanceAligned: boolean;
  lineageContinuous: boolean;
  replayContinuous: boolean;
  completionVisible: boolean;
  completionLimited: boolean;
  validationVisible: boolean;
  validationLimited: boolean;
  auditVisible: boolean;
  auditLimited: boolean;
  certificationVisible: boolean;
  certificationLimited: boolean;
  governanceReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  certificationReferences: readonly string[];
  auditReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(
  reasons: RecommendationIntelligenceObservabilityReasonCode[],
  reason: RecommendationIntelligenceObservabilityReasonCode,
): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(
  request: RecommendationIntelligenceObservabilityRequest,
): RecommendationIntelligenceObservabilityRequest {
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

function stringArrayProp(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0) : [];
}

function stringProp(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
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

function orderedBundles(input: RecommendationIntelligenceObservabilityInput): Record<string, unknown>[] {
  return [...input.recommendations as readonly Record<string, unknown>[]].sort((left, right) => {
    const leftId = stringProp((left.ledger as Record<string, unknown>)?.entry as Record<string, unknown>, "recommendationId");
    const rightId = stringProp((right.ledger as Record<string, unknown>)?.entry as Record<string, unknown>, "recommendationId");
    return leftId.localeCompare(rightId);
  });
}

function collectAllRecords(input: RecommendationIntelligenceObservabilityInput): Record<string, unknown>[] {
  return [
    input.completion,
    input.validationRecord,
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
  input: RecommendationIntelligenceObservabilityInput,
  reasons: RecommendationIntelligenceObservabilityReasonCode[],
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
  addReason(reasons, input.observabilityMutationAttempted === true ? "OBSERVABILITY_MUTATION_DETECTED" : "OBSERVABILITY_MUTATION_BLOCKED");
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
      || input.observabilityMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

function deriveSignals(
  input: RecommendationIntelligenceObservabilityInput,
): ObservabilitySignals {
  const bundles = orderedBundles(input);
  const governanceReferences = normalizeStrings([
    ...input.completion.evidencePath.governanceReferences,
    ...input.validationRecord.evidencePath.governanceReferences,
    ...bundles.flatMap((bundle) => stringArrayProp(bundle.governanceReferences as Record<string, unknown> ?? {}, "governanceReferences")),
    ...bundles.flatMap((bundle) => stringArrayProp(evidenceRecord(bundle.binding), "governanceReferences")),
    ...bundles.flatMap((bundle) => stringArrayProp(evidenceRecord(bundle.authorityScope), "governanceReferences")),
    ...bundles.flatMap((bundle) => stringArrayProp(evidenceRecord(bundle.policyVisibility), "governanceReferences")),
    ...bundles.flatMap((bundle) => stringArrayProp(evidenceRecord(bundle.governanceReplay), "governanceReferences")),
    ...bundles.flatMap((bundle) => stringArrayProp(evidenceRecord(bundle.governanceCertification), "governanceReferences")),
  ]);
  const lineageReferences = normalizeStrings([
    ...input.completion.evidencePath.lineageReferences,
    ...input.validationRecord.evidencePath.lineageReferences,
    ...bundles.flatMap((bundle) => stringArrayProp(evidenceRecord(bundle.lineage), "lineageReferences")),
    ...bundles.flatMap((bundle) => stringArrayProp(evidenceRecord(bundle.verification), "lineageReferences")),
    ...bundles.flatMap((bundle) => stringArrayProp(evidenceRecord(bundle.audit), "lineageReferences")),
    ...bundles.flatMap((bundle) => stringArrayProp(evidenceRecord(bundle.reviewPacket), "lineageReferences")),
    ...bundles.flatMap((bundle) => stringArrayProp(evidenceRecord(bundle.replayFramework), "lineageReferences")),
    ...bundles.flatMap((bundle) => stringArrayProp(evidenceRecord(bundle.readinessCertification), "lineageReferences")),
  ]);
  const replayReferences = normalizeStrings([
    ...input.completion.evidencePath.replayReferences,
    ...input.validationRecord.evidencePath.replayReferences,
    ...bundles.flatMap((bundle) => stringArrayProp(bundle.replayEvidence as Record<string, unknown> ?? {}, "replayReferences")),
    ...bundles.flatMap((bundle) => stringArrayProp(evidenceRecord(bundle.replay), "evidenceIds")),
    ...bundles.flatMap((bundle) => stringArrayProp(evidenceRecord(bundle.governanceReplay), "replayReferences")),
    ...bundles.flatMap((bundle) => stringArrayProp(evidenceRecord(bundle.replayFramework), "replayReferences")),
    ...bundles.flatMap((bundle) => stringArrayProp(evidenceRecord(bundle.readiness), "replayReferences")),
    ...bundles.flatMap((bundle) => stringArrayProp(evidenceRecord(bundle.readinessCertification), "replayReferences")),
  ]);
  const certificationReferences = normalizeStrings([
    ...input.completion.evidencePath.certificationReferences,
    ...input.validationRecord.evidencePath.certificationReferences,
    ...bundles.map((bundle) => stringProp(resultRecord(bundle.certification), "certificationHash")),
    ...bundles.map((bundle) => stringProp(resultRecord(bundle.governanceCertification), "certificationHash")),
    ...bundles.map((bundle) => stringProp(resultRecord(bundle.readinessCertification), "certificationHash")),
    ...bundles.map((bundle) => stringProp(resultRecord(bundle.observabilityCertification), "certificationHash")),
  ]);
  const auditReferences = normalizeStrings([
    ...bundles.flatMap((bundle) => stringArrayProp(evidenceRecord(bundle.audit), "evidenceIds")),
    ...bundles.flatMap((bundle) => stringArrayProp(evidenceRecord(bundle.audit), "lineageReferences")),
  ]);
  const evidenceHashes = normalizeStrings([
    ...input.completion.evidencePath.evidenceHashes,
    ...input.validationRecord.evidencePath.evidenceHashes,
    ...bundles.map((bundle) => stringProp(resultRecord(bundle.ledger), "ledgerHash")),
    ...bundles.map((bundle) => stringProp(resultRecord(bundle.lineage), "reconstructionHash")),
    ...bundles.map((bundle) => stringProp(resultRecord(bundle.verification), "verificationHash")),
    ...bundles.map((bundle) => stringProp(resultRecord(bundle.replay), "replayHash")),
    ...bundles.map((bundle) => stringProp(resultRecord(bundle.audit), "exportHash")),
    ...bundles.map((bundle) => stringProp(resultRecord(bundle.certification), "certificationHash")),
    ...bundles.map((bundle) => stringProp(resultRecord(bundle.governanceCertification), "certificationHash")),
    ...bundles.map((bundle) => stringProp(resultRecord(bundle.readinessCertification), "certificationHash")),
    ...bundles.map((bundle) => stringProp(resultRecord(bundle.observabilityCertification), "certificationHash")),
  ]);

  const ownershipValid = input.completion.validation.ownershipValid && input.validationRecord.validation.ownershipValid;
  const tenantIsolationVerified = input.completion.validation.tenantIsolationVerified && input.validationRecord.validation.tenantIsolationVerified;
  const governanceAligned = input.validationRecord.validation.governanceAligned && governanceReferences.length > 0;
  const lineageContinuous = input.validationRecord.validation.lineageContinuous && lineageReferences.length > 0;
  const replayContinuous = input.validationRecord.validation.replayContinuous && replayReferences.length > 0;

  const completionVisible = input.completion.result.overallCompletionState === "COMPLETE";
  const completionLimited = input.completion.result.overallCompletionState === "PARTIAL";
  const validationVisible = input.validationRecord.result.overallValidationState === "VALID";
  const validationLimited = input.validationRecord.result.overallValidationState === "PARTIAL";
  const certificationVisible = certificationReferences.length > 0 && input.completion.result.overallCompletionState !== "INCOMPLETE";
  const certificationLimited = certificationReferences.length > 0 && input.completion.result.overallCompletionState === "PARTIAL";
  const auditVisible = auditReferences.length > 0;
  const auditLimited = auditReferences.length > 0 && (completionLimited || validationLimited);

  return Object.freeze({
    ownershipValid,
    tenantIsolationVerified,
    governanceAligned,
    lineageContinuous,
    replayContinuous,
    completionVisible,
    completionLimited,
    validationVisible,
    validationLimited,
    auditVisible,
    auditLimited,
    certificationVisible,
    certificationLimited,
    governanceReferences,
    lineageReferences,
    replayReferences,
    certificationReferences,
    auditReferences,
    evidenceHashes,
  });
}

function aggregateReference(kind: string, refs: readonly string[]): string {
  if (refs.length === 0) return "";
  return `${kind}:${hashValue(`recommendation-intelligence-observability-${kind}`, refs)}`;
}

function scopeState(
  scope: RecommendationIntelligenceVisibilityScope,
  signals: ObservabilitySignals,
  boundary: BoundaryValidation,
): RecommendationIntelligenceObservabilityState {
  if (!signals.ownershipValid || !signals.tenantIsolationVerified || !boundary.authorityBounded) return "INVALID";
  if (!signals.governanceAligned) return "INVALID";

  switch (scope) {
    case "SUMMARY":
    case "FULL":
      if (!signals.lineageContinuous || !signals.replayContinuous) return "INVALID";
      if (!signals.completionVisible || !signals.validationVisible || !signals.auditVisible) {
        if (signals.completionLimited || signals.validationLimited || signals.auditLimited || signals.certificationLimited) return "LIMITED";
        return "OBSERVE";
      }
      if (!signals.certificationVisible) return "LIMITED";
      return "VISIBLE";
    case "COMPLETION":
      if (signals.completionVisible && signals.lineageContinuous && signals.replayContinuous) return "VISIBLE";
      if (signals.completionLimited) return "LIMITED";
      return "OBSERVE";
    case "VALIDATION":
      if (!signals.lineageContinuous) return "INVALID";
      if (signals.validationVisible) return "VISIBLE";
      if (signals.validationLimited) return "LIMITED";
      return "OBSERVE";
    case "GOVERNANCE":
      if (!signals.governanceAligned) return "INVALID";
      return signals.governanceReferences.length > 0 ? "VISIBLE" : "OBSERVE";
    case "LINEAGE":
      if (!signals.lineageContinuous) return "INVALID";
      return signals.lineageReferences.length > 0 ? "VISIBLE" : "OBSERVE";
    case "REPLAY":
      if (!signals.replayContinuous) return "INVALID";
      if (signals.replayReferences.length === 0) return "OBSERVE";
      if (signals.completionLimited || signals.validationLimited) return "LIMITED";
      return "VISIBLE";
    case "AUDIT":
      if (signals.auditVisible && !signals.auditLimited) return "VISIBLE";
      if (signals.auditLimited) return "LIMITED";
      return "OBSERVE";
    case "CERTIFICATION":
      if (signals.certificationVisible && !signals.certificationLimited) return "VISIBLE";
      if (signals.certificationReferences.length === 0) return "LIMITED";
      return "LIMITED";
    default:
      return "OBSERVE";
  }
}

function buildObservabilityRecord(
  tenantId: string,
  scope: RecommendationIntelligenceVisibilityScope,
  state: RecommendationIntelligenceObservabilityState,
  signals: ObservabilitySignals,
): RecommendationIntelligenceObservability {
  const governanceReference = aggregateReference(`${scope.toLowerCase()}-governance`, signals.governanceReferences);
  const lineageReference = aggregateReference(`${scope.toLowerCase()}-lineage`, signals.lineageReferences);
  const replayReference = aggregateReference(`${scope.toLowerCase()}-replay`, signals.replayReferences);
  const certificationReference = aggregateReference(`${scope.toLowerCase()}-certification`, signals.certificationReferences);
  const core = Object.freeze({
    tenantId,
    scope,
    observabilityState: state,
    governanceReference,
    lineageReference,
    replayReference,
    certificationReference,
  });
  const observabilityHash = hashValue("recommendation-intelligence-observability-record", core);
  const observabilityId = hashValue("recommendation-intelligence-observability-id", {
    scope,
    tenantId,
    observabilityHash,
  });
  return Object.freeze({
    observabilityId,
    ...core,
    observabilityHash,
  });
}

function createEvidencePath(
  records: readonly RecommendationIntelligenceObservability[],
  signals: ObservabilitySignals,
): RecommendationIntelligenceObservabilityEvidencePath {
  return Object.freeze({
    scopes: SCOPE_ORDER,
    governanceReferences: signals.governanceReferences,
    lineageReferences: signals.lineageReferences,
    replayReferences: signals.replayReferences,
    certificationReferences: signals.certificationReferences,
    evidenceHashes: normalizeStrings([
      ...signals.evidenceHashes,
      ...records.map((record) => record.observabilityHash),
    ]),
  });
}

function validateTenantId(
  request: RecommendationIntelligenceObservabilityRequest,
  reasons: RecommendationIntelligenceObservabilityReasonCode[],
): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateSealedArtifacts(
  input: RecommendationIntelligenceObservabilityInput,
  reasons: RecommendationIntelligenceObservabilityReasonCode[],
): boolean {
  const completionSealed = input.completion.sealed === true;
  const validationSealed = input.validationRecord.sealed === true;
  const artifactsSealed = collectAllRecords(input).every((record) => record.sealed === true);
  addReason(reasons, completionSealed ? "COMPLETION_RECORD_SEALED" : "COMPLETION_RECORD_UNSEALED");
  addReason(reasons, validationSealed ? "VALIDATION_RECORD_SEALED" : "VALIDATION_RECORD_UNSEALED");
  addReason(reasons, artifactsSealed ? "ARTIFACTS_SEALED" : "ARTIFACT_UNSEALED");
  return completionSealed && validationSealed && artifactsSealed;
}

function validateVisibility(
  signals: ObservabilitySignals,
  reasons: RecommendationIntelligenceObservabilityReasonCode[],
): void {
  addReason(reasons, signals.completionVisible || signals.completionLimited ? "COMPLETION_VISIBILITY_REPRODUCIBLE" : "COMPLETION_VISIBILITY_INCOMPLETE");
  addReason(reasons, signals.validationVisible || signals.validationLimited ? "VALIDATION_VISIBILITY_REPRODUCIBLE" : "VALIDATION_VISIBILITY_INCOMPLETE");
  addReason(reasons, signals.governanceAligned ? "GOVERNANCE_VISIBILITY_REPRODUCIBLE" : "GOVERNANCE_VISIBILITY_INCOMPLETE");
  addReason(reasons, signals.lineageContinuous ? "LINEAGE_VISIBILITY_REPRODUCIBLE" : "LINEAGE_VISIBILITY_INCOMPLETE");
  addReason(reasons, signals.replayContinuous ? "REPLAY_VISIBILITY_REPRODUCIBLE" : "REPLAY_VISIBILITY_INCOMPLETE");
  addReason(reasons, signals.auditVisible || signals.auditLimited ? "AUDIT_VISIBILITY_REPRODUCIBLE" : "AUDIT_VISIBILITY_INCOMPLETE");
  addReason(reasons, signals.certificationVisible || signals.certificationLimited ? "CERTIFICATION_VISIBILITY_REPRODUCIBLE" : "CERTIFICATION_VISIBILITY_INCOMPLETE");
}

function validateLimits(
  records: readonly RecommendationIntelligenceObservability[],
  evidencePath: RecommendationIntelligenceObservabilityEvidencePath,
  reasons: RecommendationIntelligenceObservabilityReasonCode[],
): boolean {
  const visibleReferences = evidencePath.governanceReferences.length
    + evidencePath.lineageReferences.length
    + evidencePath.replayReferences.length
    + evidencePath.certificationReferences.length;
  const valid = records.length <= MAX_DOMAINS
    && visibleReferences <= MAX_VISIBLE_REFERENCES
    && evidencePath.governanceReferences.length <= MAX_GOVERNANCE_REFERENCES
    && evidencePath.lineageReferences.length <= MAX_LINEAGE_REFERENCES
    && evidencePath.replayReferences.length <= MAX_REPLAY_REFERENCES
    && evidencePath.certificationReferences.length <= MAX_CERTIFICATION_REFERENCES;
  addReason(reasons, records.length <= MAX_DOMAINS ? "SCOPE_LIMIT_VALID" : "SCOPE_LIMIT_EXCEEDED");
  addReason(reasons, visibleReferences <= MAX_VISIBLE_REFERENCES ? "VISIBLE_REFERENCE_LIMIT_VALID" : "VISIBLE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.governanceReferences.length <= MAX_GOVERNANCE_REFERENCES ? "GOVERNANCE_REFERENCE_LIMIT_VALID" : "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.lineageReferences.length <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.replayReferences.length <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.certificationReferences.length <= MAX_CERTIFICATION_REFERENCES ? "CERTIFICATION_REFERENCE_LIMIT_VALID" : "CERTIFICATION_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function overallObservabilityState(
  records: readonly RecommendationIntelligenceObservability[],
): RecommendationIntelligenceObservabilityState {
  if (records.some((record) => record.observabilityState === "INVALID")) return "INVALID";
  if (records.some((record) => record.observabilityState === "OBSERVE")) return "OBSERVE";
  if (records.some((record) => record.observabilityState === "LIMITED")) return "LIMITED";
  return "VISIBLE";
}

function buildResult(
  request: RecommendationIntelligenceObservabilityRequest,
  records: readonly RecommendationIntelligenceObservability[],
  tenantIsolationVerified: boolean,
  observabilityHash: string,
): RecommendationIntelligenceObservabilityResult {
  const visibleScopes = records.filter((record) => record.observabilityState === "VISIBLE").length;
  const limitedScopes = records.filter((record) => record.observabilityState === "LIMITED").length;
  const observeScopes = records.filter((record) => record.observabilityState === "OBSERVE").length;
  const invalidScopes = records.filter((record) => record.observabilityState === "INVALID").length;
  return Object.freeze({
    tenantId: request.tenantId,
    overallObservabilityState: overallObservabilityState(records),
    domainsEvaluated: MAX_DOMAINS,
    scopesEvaluated: records.length,
    visibleScopes,
    limitedScopes,
    observeScopes,
    invalidScopes,
    tenantIsolationVerified,
    observabilityHash,
    deterministic: true,
  });
}

function buildLayerObservability(
  result: RecommendationIntelligenceObservabilityResult,
): RecommendationIntelligenceLayerObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    overallObservabilityState: result.overallObservabilityState,
    domainsEvaluated: result.domainsEvaluated,
    scopesEvaluated: result.scopesEvaluated,
    visibleScopes: result.visibleScopes,
    limitedScopes: result.limitedScopes,
    observeScopes: result.observeScopes,
    invalidScopes: result.invalidScopes,
    observabilityHash: result.observabilityHash,
  });
}

function buildValidation(
  result: RecommendationIntelligenceObservabilityResult,
  reasons: readonly RecommendationIntelligenceObservabilityReasonCode[],
  signals: ObservabilitySignals,
  boundary: BoundaryValidation,
  evidencePath: RecommendationIntelligenceObservabilityEvidencePath,
): RecommendationIntelligenceObservabilityValidation {
  return Object.freeze({
    valid: result.overallObservabilityState !== "INVALID",
    overallObservabilityState: result.overallObservabilityState,
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
    governanceReferenceCount: evidencePath.governanceReferences.length,
    lineageReferenceCount: evidencePath.lineageReferences.length,
    replayReferenceCount: evidencePath.replayReferences.length,
    certificationReferenceCount: evidencePath.certificationReferences.length,
  });
}

export function buildRecommendationIntelligenceObservabilityRequest(
  request: RecommendationIntelligenceObservabilityRequest,
): RecommendationIntelligenceObservabilityRequest {
  return requestCore(request);
}

export function sealRecommendationIntelligenceObservabilityLayer(
  input: RecommendationIntelligenceObservabilityInput,
): SealedRecommendationIntelligenceObservabilityRecord {
  const reasons: RecommendationIntelligenceObservabilityReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const signals = deriveSignals(input);
  validateVisibility(signals, reasons);

  addReason(reasons, signals.tenantIsolationVerified ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_VISIBILITY_BLOCKED");
  addReason(reasons, signals.ownershipValid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  addReason(reasons, signals.governanceAligned ? "GOVERNANCE_ALIGNMENT_VALID" : "GOVERNANCE_CORRUPTION_DETECTED");
  addReason(reasons, signals.lineageContinuous ? "LINEAGE_CONTINUITY_VALID" : "LINEAGE_BREAK_DETECTED");
  addReason(reasons, signals.replayContinuous ? "REPLAY_CONTINUITY_VALID" : "REPLAY_CORRUPTION_DETECTED");

  const observabilityRecords = Object.freeze(SCOPE_ORDER.map((scope) => (
    buildObservabilityRecord(
      input.request.tenantId,
      scope,
      scopeState(scope, signals, boundary),
      signals,
    )
  )));

  const evidencePath = createEvidencePath(observabilityRecords, signals);
  const limitsValid = validateLimits(observabilityRecords, evidencePath, reasons);
  addReason(reasons, "RECOMMENDATION_INTELLIGENCE_OBSERVABILITY_IS_NOT_CONTROL");

  const observabilityHash = hashValue("recommendation-intelligence-observability-layer", {
    request: requestCore(input.request),
    observabilityRecords,
    evidencePath,
  });

  const result = buildResult(
    input.request,
    observabilityRecords,
    signals.tenantIsolationVerified,
    observabilityHash,
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
      overallObservabilityState: "INVALID" as const,
    })
    : result;

  const observability = buildLayerObservability(finalResult);
  const validation = buildValidation(finalResult, reasons, signals, boundary, evidencePath);

  return Object.freeze({
    result: finalResult,
    observabilityRecords,
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    observabilityOnly: true,
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
