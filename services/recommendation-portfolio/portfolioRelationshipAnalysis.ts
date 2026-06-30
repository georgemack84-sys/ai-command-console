import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  PortfolioRelationshipAnalysisEvidencePath,
  PortfolioRelationshipAnalysisInput,
  PortfolioRelationshipAnalysisObservability,
  PortfolioRelationshipAnalysisReasonCode,
  PortfolioRelationshipAnalysisRequest,
  PortfolioRelationshipAnalysisResult,
  PortfolioRelationshipAnalysisScope,
  PortfolioRelationshipAnalysisValidation,
  RecommendationPortfolioBundle,
  RecommendationRelationship,
  SealedPortfolioRelationshipAnalysisRecord,
} from "./types";

const MAX_PORTFOLIO_SIZE = 10_000;
const MAX_RELATIONSHIPS = 50_000;
const MAX_GOVERNANCE_RELATIONSHIPS = 10_000;
const MAX_REPLAY_RELATIONSHIPS = 10_000;

const ANALYSIS_SCOPES: readonly PortfolioRelationshipAnalysisScope[] = Object.freeze([
  "EVIDENCE",
  "GOVERNANCE",
  "REPLAY",
  "LINEAGE",
  "FULL",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
  controlSurfaceAbsent: boolean;
}>;

type RelationshipDescriptor = Readonly<{
  sourceRecommendationId: string;
  targetRecommendationId: string;
  relationshipType: RecommendationRelationship["relationshipType"];
  sharedReferences: readonly string[];
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: PortfolioRelationshipAnalysisReasonCode[], reason: PortfolioRelationshipAnalysisReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashRelationshipValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: PortfolioRelationshipAnalysisRequest): PortfolioRelationshipAnalysisRequest {
  return Object.freeze({
    portfolioId: request.portfolioId,
    tenantId: request.tenantId,
    analysisScope: request.analysisScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: PortfolioRelationshipAnalysisInput): RecommendationPortfolioBundle[] {
  return [...input.recommendations].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function intersect(left: readonly string[], right: readonly string[]): string[] {
  const rightSet = new Set(right);
  return normalizeStrings(left.filter((value) => rightSet.has(value)));
}

function collectEvidenceReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.ledger.entry.evidenceIds,
    ...bundle.ledger.evidencePath.evidenceIds,
    ...bundle.lineage.evidencePath.evidenceIds,
    ...bundle.verification.evidencePath.evidenceIds,
    ...bundle.replay.evidencePath.evidenceIds,
    ...bundle.integrity.evidencePath.evidenceIds,
    ...bundle.certification.evidencePath.evidenceIds,
    ...bundle.observability.evidencePath.evidenceIds,
    ...bundle.inspection.evidencePath.evidenceIds,
    ...bundle.visibility.evidencePath.evidenceIds,
    ...bundle.audit.evidencePath.evidenceIds,
    ...bundle.readiness.evidencePath.evidenceReferences,
    ...bundle.alignment.evidencePath.evidenceReferences,
    ...bundle.reviewPacket.evidencePath.evidenceReferences,
    ...bundle.replayFramework.evidencePath.evidenceReferences,
    ...bundle.readinessCertification.evidencePath.evidenceReferences,
  ]);
}

function collectGovernanceReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.governanceReferences.governanceReferences,
    ...bundle.binding.evidencePath.governanceReferences,
    ...bundle.authorityScope.evidencePath.governanceReferences,
    ...bundle.policyVisibility.evidencePath.governanceReferences,
    ...bundle.governanceReplay.evidencePath.governanceReferences,
    ...bundle.governanceCertification.evidencePath.governanceReferences,
    ...bundle.readiness.evidencePath.governanceReferences,
    ...bundle.alignment.evidencePath.governanceReferences,
  ]);
}

function collectReplayReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.replayEvidence.replayReferences,
    ...bundle.replay.evidencePath.evidenceIds,
    ...bundle.governanceReplay.evidencePath.replayReferences,
    ...bundle.readiness.evidencePath.replayReferences,
    ...bundle.reviewPacket.evidencePath.replayReferences,
    ...bundle.replayFramework.evidencePath.replayReferences,
    ...bundle.readinessCertification.evidencePath.replayReferences,
  ]);
}

function collectLineageReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.ledger.entry.lineageReferences,
    ...bundle.lineage.ancestryChain.map((node) => node.lineageReference),
    ...bundle.lineage.evidencePath.lineageReferences,
    ...bundle.verification.evidencePath.lineageReferences,
    ...bundle.observability.evidencePath.lineageReferences,
    ...bundle.audit.evidencePath.lineageReferences,
    ...bundle.reviewPacket.evidencePath.lineageReferences,
    ...bundle.replayFramework.evidencePath.lineageReferences,
    ...bundle.readinessCertification.evidencePath.lineageReferences,
  ]);
}

function collectReadinessReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.readiness.evidencePath.evidenceReferences,
    ...bundle.reviewPacket.evidencePath.evidenceReferences,
  ]);
}

function collectAlignmentReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.alignment.evidencePath.alignmentReferences,
    ...bundle.alignment.evidencePath.governanceReferences,
  ]);
}

function collectOwnershipReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings(bundle.ownershipEvidence.ownershipReferences);
}

function collectEvidenceHashes(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    bundle.ledger.result.ledgerHash,
    bundle.lineage.result.reconstructionHash,
    bundle.lineage.result.lineageHash,
    bundle.verification.result.verificationHash,
    bundle.replay.result.replayHash,
    bundle.replay.result.reconstructionHash,
    bundle.integrity.result.integrityHash,
    bundle.certification.result.certificationHash,
    bundle.observability.result.observabilityHash,
    bundle.inspection.result.inspectionHash,
    bundle.visibility.result.visibilityHash,
    bundle.audit.result.exportHash,
    bundle.observabilityCertification.result.certificationHash,
    bundle.binding.result.governanceHash,
    bundle.authorityScope.result.authorityHash,
    bundle.policyVisibility.result.policyHash,
    bundle.governanceReplay.result.replayHash,
    bundle.governanceReplay.result.reconstructionHash,
    bundle.governanceCertification.result.certificationHash,
    bundle.governanceReferences.governanceHash,
    bundle.ownershipEvidence.ownershipHash,
    bundle.replayEvidence.replayHash,
    bundle.readiness.result.readinessHash,
    bundle.alignment.result.alignmentHash,
    bundle.reviewPacket.result.packetHash,
    bundle.replayFramework.result.replayHash,
    bundle.replayFramework.result.reconstructionHash,
    bundle.readinessCertification.result.certificationHash,
  ]);
}

function createBoundaryFlags(record: Record<string, unknown>): boolean {
  const blockedFlags = [
    "executionAuthorized",
    "workflowRoutingAllowed",
    "recommendationGenerationAllowed",
    "recommendationRankingAllowed",
    "recommendationPrioritizationAllowed",
    "recommendationScoringAllowed",
    "recommendationApprovalAllowed",
    "prioritizationAllowed",
    "approvalBehaviorAllowed",
    "policyExecutionAllowed",
    "approvalCreationAllowed",
    "authorityMutationAllowed",
    "repairAuthorized",
    "ledgerMutationAllowed",
    "controlSurfacePresent",
  ] as const;
  return blockedFlags.every((key) => record[key] !== true);
}

function relationshipDescriptorToRecord(descriptor: RelationshipDescriptor): RecommendationRelationship {
  const relationshipHash = hashRelationshipValue("portfolio-relationship", descriptor);
  return Object.freeze({
    relationshipId: hashRelationshipValue("portfolio-relationship-id", {
      sourceRecommendationId: descriptor.sourceRecommendationId,
      targetRecommendationId: descriptor.targetRecommendationId,
      relationshipType: descriptor.relationshipType,
    }),
    sourceRecommendationId: descriptor.sourceRecommendationId,
    targetRecommendationId: descriptor.targetRecommendationId,
    relationshipType: descriptor.relationshipType,
    relationshipHash,
  });
}

function createRelationships(input: PortfolioRelationshipAnalysisInput): RecommendationRelationship[] {
  const bundles = orderedBundles(input);
  const relationships: RecommendationRelationship[] = [];

  for (let index = 0; index < bundles.length; index += 1) {
    for (let offset = index + 1; offset < bundles.length; offset += 1) {
      const source = bundles[index];
      const target = bundles[offset];
      const sourceId = recommendationId(source);
      const targetId = recommendationId(target);
      const descriptors: RelationshipDescriptor[] = [
        {
          sourceRecommendationId: sourceId,
          targetRecommendationId: targetId,
          relationshipType: "SHARED_EVIDENCE",
          sharedReferences: intersect(collectEvidenceReferences(source), collectEvidenceReferences(target)),
        },
        {
          sourceRecommendationId: sourceId,
          targetRecommendationId: targetId,
          relationshipType: "SHARED_GOVERNANCE",
          sharedReferences: intersect(collectGovernanceReferences(source), collectGovernanceReferences(target)),
        },
        {
          sourceRecommendationId: sourceId,
          targetRecommendationId: targetId,
          relationshipType: "SHARED_REPLAY",
          sharedReferences: intersect(collectReplayReferences(source), collectReplayReferences(target)),
        },
        {
          sourceRecommendationId: sourceId,
          targetRecommendationId: targetId,
          relationshipType: "SHARED_LINEAGE",
          sharedReferences: intersect(collectLineageReferences(source), collectLineageReferences(target)),
        },
        {
          sourceRecommendationId: sourceId,
          targetRecommendationId: targetId,
          relationshipType: "SHARED_READINESS",
          sharedReferences: intersect(collectReadinessReferences(source), collectReadinessReferences(target)),
        },
        {
          sourceRecommendationId: sourceId,
          targetRecommendationId: targetId,
          relationshipType: "SHARED_ALIGNMENT",
          sharedReferences: intersect(collectAlignmentReferences(source), collectAlignmentReferences(target)),
        },
        {
          sourceRecommendationId: sourceId,
          targetRecommendationId: targetId,
          relationshipType: "SHARED_OWNERSHIP",
          sharedReferences: intersect(collectOwnershipReferences(source), collectOwnershipReferences(target)),
        },
      ];

      for (const descriptor of descriptors) {
        if (descriptor.sharedReferences.length > 0) {
          relationships.push(relationshipDescriptorToRecord(descriptor));
        }
      }
    }
  }

  return relationships.sort((left, right) => (
    left.sourceRecommendationId.localeCompare(right.sourceRecommendationId)
    || left.targetRecommendationId.localeCompare(right.targetRecommendationId)
    || left.relationshipType.localeCompare(right.relationshipType)
    || left.relationshipId.localeCompare(right.relationshipId)
  ));
}

function validatePortfolio(input: PortfolioRelationshipAnalysisInput, reasons: PortfolioRelationshipAnalysisReasonCode[]): boolean {
  const valid = input.portfolio.sealed === true
    && input.portfolio.result.portfolioId === input.request.portfolioId
    && input.portfolio.portfolio.tenantId === input.request.tenantId;
  addReason(reasons, input.portfolio.sealed === true ? "PORTFOLIO_REQUIRED" : "PORTFOLIO_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: PortfolioRelationshipAnalysisInput, reasons: PortfolioRelationshipAnalysisReasonCode[]): boolean {
  const sealed = input.portfolio.sealed === true && orderedBundles(input).every((bundle) => {
    const records = [
      bundle.readiness,
      bundle.alignment,
      bundle.reviewPacket,
      bundle.replayFramework,
      bundle.readinessCertification,
      bundle.ledger,
      bundle.lineage,
      bundle.verification,
      bundle.replay,
      bundle.integrity,
      bundle.certification,
      bundle.observability,
      bundle.inspection,
      bundle.visibility,
      bundle.audit,
      bundle.observabilityCertification,
      bundle.binding,
      bundle.authorityScope,
      bundle.policyVisibility,
      bundle.governanceReplay,
      bundle.governanceCertification,
      bundle.governanceReferences,
      bundle.ownershipEvidence,
      bundle.replayEvidence,
    ] satisfies readonly Record<string, unknown>[];
    return records.every((record) => record.sealed === true);
  });
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateScope(scope: PortfolioRelationshipAnalysisScope, reasons: PortfolioRelationshipAnalysisReasonCode[]): boolean {
  const valid = ANALYSIS_SCOPES.includes(scope);
  addReason(reasons, valid ? "ANALYSIS_SCOPE_VALID" : "ANALYSIS_SCOPE_INVALID");
  return valid;
}

function validatePortfolioId(request: PortfolioRelationshipAnalysisRequest, reasons: PortfolioRelationshipAnalysisReasonCode[]): boolean {
  const valid = request.portfolioId.length > 0;
  addReason(reasons, valid ? "PORTFOLIO_ID_PRESENT" : "PORTFOLIO_ID_MISSING");
  return valid;
}

function validateMembership(input: PortfolioRelationshipAnalysisInput, reasons: PortfolioRelationshipAnalysisReasonCode[]): boolean {
  const requested = normalizeStrings(input.portfolio.portfolio.recommendationIds);
  const actual = normalizeStrings(orderedBundles(input).map(recommendationId));
  const valid = requested.length === actual.length && requested.every((value, index) => value === actual[index]);
  addReason(reasons, valid ? "RELATIONSHIP_MEMBERSHIP_COMPLETE" : "RELATIONSHIP_EVIDENCE_MISSING");
  return valid;
}

function validateTenantScope(input: PortfolioRelationshipAnalysisInput, reasons: PortfolioRelationshipAnalysisReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.portfolio.result.tenantIsolationVerified
    && orderedBundles(input).every((bundle) => (
      bundle.ledger.entry.tenantId === tenantId
      && bundle.governanceReferences.tenantId === tenantId
      && bundle.ownershipEvidence.tenantId === tenantId
      && bundle.replayEvidence.tenantId === tenantId
      && bundle.readiness.result.tenantIsolationVerified
      && bundle.alignment.result.tenantIsolationVerified
      && bundle.reviewPacket.result.tenantIsolationVerified
      && bundle.replayFramework.result.tenantIsolationVerified
      && bundle.readinessCertification.result.tenantIsolationVerified
      && bundle.binding.result.tenantIsolationVerified
      && bundle.governanceCertification.result.tenantIsolationVerified
    ));
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_RELATIONSHIPS_BLOCKED");
  return valid;
}

function validateOwnership(input: PortfolioRelationshipAnalysisInput, reasons: PortfolioRelationshipAnalysisReasonCode[]): boolean {
  const valid = orderedBundles(input).every((bundle) => (
    bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
    && bundle.ownershipEvidence.ownershipReferences.length > 0
    && bundle.certification.result.ownershipCertified
    && bundle.authorityScope.result.ownershipValidated
  ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateGovernance(input: PortfolioRelationshipAnalysisInput, reasons: PortfolioRelationshipAnalysisReasonCode[]): boolean {
  const valid = input.portfolio.result.governanceBound && orderedBundles(input).every((bundle) => (
    bundle.binding.result.bindingState !== "INVALID"
    && bundle.authorityScope.result.scopeState !== "INVALID"
    && bundle.policyVisibility.result.visibilityState !== "INVALID"
    && bundle.governanceReplay.result.replayState !== "INVALID"
    && bundle.governanceCertification.result.certificationState !== "FAIL"
  ));
  addReason(reasons, valid ? "GOVERNANCE_RELATIONSHIPS_VALID" : "GOVERNANCE_CORRUPTION_DETECTED");
  return valid;
}

function validateReplay(input: PortfolioRelationshipAnalysisInput, reasons: PortfolioRelationshipAnalysisReasonCode[]): { valid: boolean; degraded: boolean } {
  const corrupted = input.portfolio.result.replayBound === false && input.portfolio.result.portfolioState === "INVALID"
    || orderedBundles(input).some((bundle) => (
      bundle.replay.result.replayState === "INVALID"
      || bundle.governanceReplay.result.replayState === "INVALID"
      || bundle.replayFramework.result.replayState === "INVALID"
      || bundle.replayFramework.result.replayState === "ESCALATED"
    ));
  const degraded = !corrupted && (
    input.portfolio.result.portfolioState === "LIMITED"
    || orderedBundles(input).some((bundle) => (
      bundle.replayEvidence.replayReferences.length === 0
      || bundle.replay.result.replayState === "LIMITED"
      || bundle.governanceReplay.result.replayState === "LIMITED"
      || bundle.replayFramework.result.replayState === "LIMITED"
    ))
  );
  if (corrupted) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");
  else addReason(reasons, degraded ? "REPLAY_DEGRADED" : "REPLAY_RELATIONSHIPS_VALID");
  return { valid: !corrupted, degraded };
}

function validateLineage(input: PortfolioRelationshipAnalysisInput, reasons: PortfolioRelationshipAnalysisReasonCode[]): boolean {
  const valid = input.portfolio.result.lineageBound && orderedBundles(input).every((bundle) => (
    bundle.lineage.result.reconstructionState !== "INVALID"
    && bundle.lineage.result.lineageIntegrity
    && bundle.integrity.result.lineageIntegrity
    && collectLineageReferences(bundle).length > 0
  ));
  addReason(reasons, valid ? "LINEAGE_RELATIONSHIPS_VALID" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateObservability(input: PortfolioRelationshipAnalysisInput, reasons: PortfolioRelationshipAnalysisReasonCode[]): boolean {
  const valid = orderedBundles(input).every((bundle) => (
    bundle.observability.result.observabilityState === "VISIBLE"
    && bundle.inspection.result.inspectionState === "AVAILABLE"
    && bundle.visibility.result.visibilityState === "VISIBLE"
    && bundle.audit.result.exportState === "EXPORTED"
    && bundle.observabilityCertification.result.certificationState === "PASS"
  ));
  addReason(reasons, valid ? "OBSERVABILITY_PRESERVED" : "OBSERVABILITY_DEGRADED");
  return valid;
}

function validateBoundary(input: PortfolioRelationshipAnalysisInput, reasons: PortfolioRelationshipAnalysisReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = orderedBundles(input).every((bundle) => {
    const records = [
      bundle.readiness,
      bundle.alignment,
      bundle.reviewPacket,
      bundle.replayFramework,
      bundle.readinessCertification,
      bundle.ledger,
      bundle.lineage,
      bundle.verification,
      bundle.replay,
      bundle.integrity,
      bundle.certification,
      bundle.observability,
      bundle.inspection,
      bundle.visibility,
      bundle.audit,
      bundle.observabilityCertification,
      bundle.binding,
      bundle.authorityScope,
      bundle.policyVisibility,
      bundle.governanceReplay,
      bundle.governanceCertification,
    ] satisfies readonly Record<string, unknown>[];
    return records.every(createBoundaryFlags);
  });
  addReason(reasons, executionImpossible ? "EXECUTION_IMPOSSIBLE" : "EXECUTION_REQUEST_BLOCKED");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.recommendationRankingRequested === true ? "RECOMMENDATION_RANKING_DETECTED" : "RECOMMENDATION_RANKING_BLOCKED");
  addReason(reasons, input.recommendationPrioritizationRequested === true ? "RECOMMENDATION_PRIORITIZATION_DETECTED" : "RECOMMENDATION_PRIORITIZATION_BLOCKED");
  addReason(reasons, input.recommendationScoringRequested === true ? "RECOMMENDATION_SCORING_DETECTED" : "RECOMMENDATION_SCORING_BLOCKED");
  addReason(reasons, input.recommendationApprovalRequested === true ? "RECOMMENDATION_APPROVAL_DETECTED" : "RECOMMENDATION_APPROVAL_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.analysisMutationAttempted === true ? "ANALYSIS_MUTATION_DETECTED" : "ANALYSIS_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  const invalidBoundary = !executionImpossible
    || input.workflowRoutingRequested === true
    || input.recommendationRankingRequested === true
    || input.recommendationPrioritizationRequested === true
    || input.recommendationScoringRequested === true
    || input.recommendationApprovalRequested === true
    || !authorityBounded
    || input.analysisMutationAttempted === true
    || !controlSurfaceAbsent;
  return Object.freeze({
    executionImpossible,
    authorityBounded,
    invalidBoundary,
    controlSurfaceAbsent,
  });
}

function createPortfolioRelationshipAnalysisEvidencePath(
  input: PortfolioRelationshipAnalysisInput,
  relationships: readonly RecommendationRelationship[],
): PortfolioRelationshipAnalysisEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.analysisScope,
    relationshipReferences: relationships.map((relationship) => relationship.relationshipId),
    governanceReferences: normalizeStrings(bundles.flatMap(collectGovernanceReferences)),
    replayReferences: normalizeStrings(bundles.flatMap(collectReplayReferences)),
    lineageReferences: normalizeStrings(bundles.flatMap(collectLineageReferences)),
    evidenceHashes: normalizeStrings([
      input.portfolio.result.portfolioHash,
      ...bundles.flatMap(collectEvidenceHashes),
      ...relationships.map((relationship) => relationship.relationshipHash),
    ]),
  });
}

function validateLimits(
  recommendationCount: number,
  relationshipCount: number,
  governanceRelationshipCount: number,
  replayRelationshipCount: number,
  reasons: PortfolioRelationshipAnalysisReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_PORTFOLIO_SIZE
    && relationshipCount <= MAX_RELATIONSHIPS
    && governanceRelationshipCount <= MAX_GOVERNANCE_RELATIONSHIPS
    && replayRelationshipCount <= MAX_REPLAY_RELATIONSHIPS;
  addReason(reasons, recommendationCount <= MAX_PORTFOLIO_SIZE ? "PORTFOLIO_SIZE_VALID" : "PORTFOLIO_SIZE_EXCEEDED");
  addReason(reasons, relationshipCount <= MAX_RELATIONSHIPS ? "RELATIONSHIP_LIMIT_VALID" : "RELATIONSHIP_LIMIT_EXCEEDED");
  addReason(reasons, governanceRelationshipCount <= MAX_GOVERNANCE_RELATIONSHIPS ? "GOVERNANCE_RELATIONSHIP_LIMIT_VALID" : "GOVERNANCE_RELATIONSHIP_LIMIT_EXCEEDED");
  addReason(reasons, replayRelationshipCount <= MAX_REPLAY_RELATIONSHIPS ? "REPLAY_RELATIONSHIP_LIMIT_VALID" : "REPLAY_RELATIONSHIP_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: PortfolioRelationshipAnalysisRequest,
  relationshipState: PortfolioRelationshipAnalysisResult["relationshipState"],
  relationships: readonly RecommendationRelationship[],
  tenantIsolationVerified: boolean,
  analysisHash: string,
): PortfolioRelationshipAnalysisResult {
  return Object.freeze({
    portfolioId: request.portfolioId,
    relationshipState,
    relationshipsDetected: relationships.length,
    governanceRelationshipsDetected: relationships.filter((relationship) => relationship.relationshipType === "SHARED_GOVERNANCE").length,
    replayRelationshipsDetected: relationships.filter((relationship) => relationship.relationshipType === "SHARED_REPLAY").length,
    lineageRelationshipsDetected: relationships.filter((relationship) => relationship.relationshipType === "SHARED_LINEAGE").length,
    tenantIsolationVerified,
    analysisHash,
    deterministic: true,
  });
}

function buildObservability(
  result: PortfolioRelationshipAnalysisResult,
): PortfolioRelationshipAnalysisObservability {
  return Object.freeze({
    portfolioId: result.portfolioId,
    relationshipState: result.relationshipState,
    relationshipsDetected: result.relationshipsDetected,
    governanceRelationshipsDetected: result.governanceRelationshipsDetected,
    replayRelationshipsDetected: result.replayRelationshipsDetected,
    lineageRelationshipsDetected: result.lineageRelationshipsDetected,
    analysisHash: result.analysisHash,
  });
}

function buildValidation(
  relationshipState: PortfolioRelationshipAnalysisResult["relationshipState"],
  reasonCodes: readonly PortfolioRelationshipAnalysisReasonCode[],
  governanceRelationshipsValid: boolean,
  replayRelationshipsValid: boolean,
  lineageRelationshipsValid: boolean,
  ownershipValid: boolean,
  observabilityPreserved: boolean,
  tenantIsolationVerified: boolean,
  counts: Readonly<{
    relationshipsDetected: number;
    governanceRelationshipsDetected: number;
    replayRelationshipsDetected: number;
    lineageRelationshipsDetected: number;
  }>,
  boundary: BoundaryValidation,
): PortfolioRelationshipAnalysisValidation {
  return Object.freeze({
    valid: relationshipState !== "INVALID",
    relationshipState,
    reasonCodes: [...reasonCodes],
    governanceRelationshipsValid,
    replayRelationshipsValid,
    lineageRelationshipsValid,
    ownershipValid,
    observabilityPreserved,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true,
    relationshipsDetected: counts.relationshipsDetected,
    governanceRelationshipsDetected: counts.governanceRelationshipsDetected,
    replayRelationshipsDetected: counts.replayRelationshipsDetected,
    lineageRelationshipsDetected: counts.lineageRelationshipsDetected,
  });
}

export function buildPortfolioRelationshipAnalysisRequest(
  request: PortfolioRelationshipAnalysisRequest,
): PortfolioRelationshipAnalysisRequest {
  return requestCore(request);
}

export { createPortfolioRelationshipAnalysisEvidencePath };

export function sealPortfolioRelationshipAnalysis(input: PortfolioRelationshipAnalysisInput): SealedPortfolioRelationshipAnalysisRecord {
  const reasons: PortfolioRelationshipAnalysisReasonCode[] = [];
  const relationships = createRelationships(input);
  const evidencePath = createPortfolioRelationshipAnalysisEvidencePath(input, relationships);

  const requestValid = validatePortfolioId(input.request, reasons)
    && validateScope(input.request.analysisScope, reasons);
  const portfolioValid = validatePortfolio(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const membershipValid = validateMembership(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const governanceRelationshipsValid = validateGovernance(input, reasons);
  const replayValidation = validateReplay(input, reasons);
  const lineageRelationshipsValid = validateLineage(input, reasons);
  const observabilityPreserved = validateObservability(input, reasons);
  const boundary = validateBoundary(input, reasons);

  const counts = Object.freeze({
    relationshipsDetected: relationships.length,
    governanceRelationshipsDetected: relationships.filter((relationship) => relationship.relationshipType === "SHARED_GOVERNANCE").length,
    replayRelationshipsDetected: relationships.filter((relationship) => relationship.relationshipType === "SHARED_REPLAY").length,
    lineageRelationshipsDetected: relationships.filter((relationship) => relationship.relationshipType === "SHARED_LINEAGE").length,
  });

  const limitsValid = validateLimits(
    input.portfolio.result.recommendationCount,
    counts.relationshipsDetected,
    counts.governanceRelationshipsDetected,
    counts.replayRelationshipsDetected,
    reasons,
  );
  addReason(reasons, "PORTFOLIO_RELATIONSHIP_ANALYSIS_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !portfolioValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || !governanceRelationshipsValid
    || !lineageRelationshipsValid
    || !replayValidation.valid
    || boundary.invalidBoundary
    || !limitsValid;

  const observe = !invalid && (!membershipValid || relationships.length === 0);
  const limited = !invalid && !observe && (replayValidation.degraded || !observabilityPreserved || input.portfolio.result.portfolioState === "LIMITED");
  const relationshipState = invalid ? "INVALID" : limited ? "LIMITED" : observe ? "OBSERVE" : "ANALYZED";

  const analysisHash = hashRelationshipValue("portfolio-relationship-analysis", {
    request: requestCore(input.request),
    portfolioHash: input.portfolio.result.portfolioHash,
    relationshipState,
    relationshipReferences: evidencePath.relationshipReferences,
    governanceReferences: evidencePath.governanceReferences,
    replayReferences: evidencePath.replayReferences,
    lineageReferences: evidencePath.lineageReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    relationshipState,
    relationships,
    tenantIsolationVerified,
    analysisHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    relationshipState,
    reasons,
    governanceRelationshipsValid,
    replayValidation.valid && !replayValidation.degraded,
    lineageRelationshipsValid,
    ownershipValid,
    observabilityPreserved,
    tenantIsolationVerified,
    counts,
    boundary,
  );

  return Object.freeze({
    result,
    relationships,
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    analysisOnly: true,
    executionAuthorized: false,
    workflowRoutingAllowed: false,
    recommendationRankingAllowed: false,
    recommendationPrioritizationAllowed: false,
    recommendationScoringAllowed: false,
    recommendationApprovalAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
