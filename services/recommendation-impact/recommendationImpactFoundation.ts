import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  RecommendationImpact,
  RecommendationImpactEvidencePath,
  RecommendationImpactFoundationInput,
  RecommendationImpactFoundationObservability,
  RecommendationImpactFoundationReasonCode,
  RecommendationImpactFoundationRequest,
  RecommendationImpactFoundationResult,
  RecommendationImpactFoundationValidation,
  RecommendationImpactScope,
  RecommendationImpactType,
  SealedRecommendationImpactFoundationRecord,
} from "./types";

const MAX_RECOMMENDATIONS = 10_000;
const MAX_IMPACTS = 50_000;
const MAX_GOVERNANCE_IMPACTS = 10_000;
const MAX_REPLAY_IMPACTS = 10_000;

const IMPACT_SCOPES: readonly RecommendationImpactScope[] = Object.freeze([
  "EVIDENCE",
  "LINEAGE",
  "GOVERNANCE",
  "REPLAY",
  "READINESS",
  "PORTFOLIO",
  "FULL",
]);

type ImpactDescriptor = Readonly<{
  sourceRecommendationId: string;
  affectedRecommendationId: string;
  impactType: RecommendationImpactType;
  sharedReferences: readonly string[];
}>;

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
  controlSurfaceAbsent: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: RecommendationImpactFoundationReasonCode[], reason: RecommendationImpactFoundationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashImpactValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: RecommendationImpactFoundationRequest): RecommendationImpactFoundationRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    recommendationIds: [...request.recommendationIds],
    impactScope: request.impactScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationImpactFoundationInput["recommendations"][number]): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: RecommendationImpactFoundationInput) {
  return [...input.recommendations].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function intersect(left: readonly string[], right: readonly string[]): string[] {
  const rightSet = new Set(right);
  return normalizeStrings(left.filter((value) => rightSet.has(value)));
}

function collectEvidenceReferences(bundle: RecommendationImpactFoundationInput["recommendations"][number]): string[] {
  return normalizeStrings([
    ...bundle.ledger.entry.evidenceIds,
    ...bundle.ledger.evidencePath.evidenceIds,
    ...bundle.lineage.evidencePath.evidenceIds,
    ...bundle.verification.evidencePath.evidenceIds,
    ...bundle.replay.evidencePath.evidenceIds,
    ...bundle.integrity.evidencePath.evidenceIds,
    ...bundle.certification.evidencePath.evidenceIds,
    ...bundle.observability.evidencePath.evidenceIds,
    ...bundle.audit.evidencePath.evidenceIds,
    ...bundle.readiness.evidencePath.evidenceReferences,
    ...bundle.alignment.evidencePath.evidenceReferences,
    ...bundle.reviewPacket.evidencePath.evidenceReferences,
  ]);
}

function collectLineageReferences(bundle: RecommendationImpactFoundationInput["recommendations"][number]): string[] {
  return normalizeStrings([
    ...bundle.ledger.entry.lineageReferences,
    ...bundle.lineage.ancestryChain.map((node) => node.lineageReference),
    ...bundle.lineage.evidencePath.lineageReferences,
    ...bundle.verification.evidencePath.lineageReferences,
    ...bundle.audit.evidencePath.lineageReferences,
    ...bundle.replayFramework.evidencePath.lineageReferences,
  ]);
}

function collectGovernanceReferences(bundle: RecommendationImpactFoundationInput["recommendations"][number]): string[] {
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

function collectReplayReferences(bundle: RecommendationImpactFoundationInput["recommendations"][number]): string[] {
  return normalizeStrings([
    ...bundle.replayEvidence.replayReferences,
    ...bundle.replay.evidencePath.evidenceIds,
    ...bundle.governanceReplay.evidencePath.replayReferences,
    ...bundle.replayFramework.evidencePath.replayReferences,
    ...bundle.readinessCertification.evidencePath.replayReferences,
  ]);
}

function collectReadinessReferences(bundle: RecommendationImpactFoundationInput["recommendations"][number]): string[] {
  return normalizeStrings([
    ...bundle.readiness.evidencePath.evidenceReferences,
    ...bundle.readiness.evidencePath.governanceReferences,
    ...bundle.alignment.evidencePath.alignmentReferences,
    ...bundle.reviewPacket.evidencePath.evidenceReferences,
    ...bundle.replayFramework.evidencePath.replayReferences,
    ...bundle.readinessCertification.evidencePath.evidenceReferences,
  ]);
}

function collectPortfolioReferences(input: RecommendationImpactFoundationInput): string[] {
  return normalizeStrings([
    input.portfolio.portfolio.portfolioId,
    ...input.portfolio.portfolio.recommendationIds,
    ...input.portfolio.evidencePath.governanceReferences,
    ...input.portfolio.evidencePath.replayReferences,
    ...input.portfolio.evidencePath.lineageReferences,
    ...input.portfolio.evidencePath.ownershipReferences,
    ...input.relationshipAnalysis.evidencePath.relationshipReferences,
    ...input.relationshipAnalysis.evidencePath.governanceReferences,
    ...input.relationshipAnalysis.evidencePath.replayReferences,
    ...input.portfolioReplay.evidencePath.replayReferences,
    ...input.portfolioCertification.evidencePath.portfolioReferences,
    ...input.portfolioCertification.evidencePath.relationshipReferences,
  ]);
}

function collectEvidenceHashes(bundle: RecommendationImpactFoundationInput["recommendations"][number]): string[] {
  return normalizeStrings([
    bundle.ledger.result.ledgerHash,
    bundle.lineage.result.reconstructionHash,
    bundle.verification.result.verificationHash,
    bundle.replay.result.replayHash,
    bundle.integrity.result.integrityHash,
    bundle.certification.result.certificationHash,
    bundle.observability.result.observabilityHash,
    bundle.audit.result.exportHash,
    bundle.binding.result.governanceHash,
    bundle.governanceReplay.result.replayHash,
    bundle.governanceCertification.result.certificationHash,
    bundle.readiness.result.readinessHash,
    bundle.alignment.result.alignmentHash,
    bundle.reviewPacket.result.packetHash,
    bundle.replayFramework.result.replayHash,
    bundle.readinessCertification.result.certificationHash,
  ]);
}

function createBoundaryFlags(record: Record<string, unknown>): boolean {
  const blockedFlags = [
    "executionAuthorized",
    "workflowRoutingAllowed",
    "prioritizationAllowed",
    "approvalAllowed",
    "approvalOrderingAllowed",
    "recommendationApprovalAllowed",
    "authorityMutationAllowed",
    "controlSurfacePresent",
  ] as const;
  return blockedFlags.every((key) => record[key] !== true);
}

function includesScope(scope: RecommendationImpactScope, impactType: RecommendationImpactType): boolean {
  if (scope === "FULL") return true;
  return (
    (scope === "EVIDENCE" && impactType === "EVIDENCE_IMPACT")
    || (scope === "LINEAGE" && impactType === "LINEAGE_IMPACT")
    || (scope === "GOVERNANCE" && impactType === "GOVERNANCE_IMPACT")
    || (scope === "REPLAY" && impactType === "REPLAY_IMPACT")
    || (scope === "READINESS" && impactType === "READINESS_IMPACT")
    || (scope === "PORTFOLIO" && impactType === "PORTFOLIO_IMPACT")
  );
}

function scopeSelected(scope: RecommendationImpactScope, impactType: RecommendationImpactType): boolean {
  return includesScope(scope, impactType);
}

function descriptorToImpact(descriptor: ImpactDescriptor): RecommendationImpact {
  const impactHash = hashImpactValue("recommendation-impact", descriptor);
  return Object.freeze({
    impactId: hashImpactValue("recommendation-impact-id", {
      sourceRecommendationId: descriptor.sourceRecommendationId,
      affectedRecommendationId: descriptor.affectedRecommendationId,
      impactType: descriptor.impactType,
    }),
    sourceRecommendationId: descriptor.sourceRecommendationId,
    affectedRecommendationId: descriptor.affectedRecommendationId,
    impactType: descriptor.impactType,
    impactHash,
  });
}

function createImpacts(input: RecommendationImpactFoundationInput): RecommendationImpact[] {
  const bundles = orderedBundles(input);
  const sharedPortfolioReferences = collectPortfolioReferences(input);
  const impacts: RecommendationImpact[] = [];
  for (const source of bundles) {
    for (const affected of bundles) {
      if (recommendationId(source) === recommendationId(affected)) continue;
      const descriptors: ImpactDescriptor[] = [
        {
          sourceRecommendationId: recommendationId(source),
          affectedRecommendationId: recommendationId(affected),
          impactType: "EVIDENCE_IMPACT",
          sharedReferences: intersect(collectEvidenceReferences(source), collectEvidenceReferences(affected)),
        },
        {
          sourceRecommendationId: recommendationId(source),
          affectedRecommendationId: recommendationId(affected),
          impactType: "LINEAGE_IMPACT",
          sharedReferences: intersect(collectLineageReferences(source), collectLineageReferences(affected)),
        },
        {
          sourceRecommendationId: recommendationId(source),
          affectedRecommendationId: recommendationId(affected),
          impactType: "GOVERNANCE_IMPACT",
          sharedReferences: intersect(collectGovernanceReferences(source), collectGovernanceReferences(affected)),
        },
        {
          sourceRecommendationId: recommendationId(source),
          affectedRecommendationId: recommendationId(affected),
          impactType: "REPLAY_IMPACT",
          sharedReferences: intersect(collectReplayReferences(source), collectReplayReferences(affected)),
        },
        {
          sourceRecommendationId: recommendationId(source),
          affectedRecommendationId: recommendationId(affected),
          impactType: "READINESS_IMPACT",
          sharedReferences: intersect(collectReadinessReferences(source), collectReadinessReferences(affected)),
        },
        {
          sourceRecommendationId: recommendationId(source),
          affectedRecommendationId: recommendationId(affected),
          impactType: "PORTFOLIO_IMPACT",
          sharedReferences: sharedPortfolioReferences,
        },
      ];
      for (const descriptor of descriptors) {
        if (includesScope(input.request.impactScope, descriptor.impactType) && descriptor.sharedReferences.length > 0) {
          impacts.push(descriptorToImpact(descriptor));
        }
      }
    }
  }
  return impacts.sort((a, b) => (
    a.sourceRecommendationId.localeCompare(b.sourceRecommendationId)
    || a.affectedRecommendationId.localeCompare(b.affectedRecommendationId)
    || a.impactType.localeCompare(b.impactType)
    || a.impactId.localeCompare(b.impactId)
  ));
}

function validateScope(scope: RecommendationImpactScope, reasons: RecommendationImpactFoundationReasonCode[]): boolean {
  const valid = IMPACT_SCOPES.includes(scope);
  addReason(reasons, valid ? "IMPACT_SCOPE_VALID" : "IMPACT_SCOPE_INVALID");
  return valid;
}

function validateRecommendationIds(request: RecommendationImpactFoundationRequest, reasons: RecommendationImpactFoundationReasonCode[]): boolean {
  const valid = request.recommendationIds.length > 0;
  addReason(reasons, valid ? "RECOMMENDATION_IDS_PRESENT" : "RECOMMENDATION_IDS_MISSING");
  return valid;
}

function validateSealedArtifacts(input: RecommendationImpactFoundationInput, reasons: RecommendationImpactFoundationReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
    && input.replay.sealed === true
    && input.certification.sealed === true
    && input.portfolio.sealed === true
    && input.relationshipAnalysis.sealed === true
    && input.portfolioReplay.sealed === true
    && input.portfolioCertification.sealed === true
    && orderedBundles(input).every((bundle) => [
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
    ].every((record) => record.sealed === true));
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateMembership(input: RecommendationImpactFoundationInput, reasons: RecommendationImpactFoundationReasonCode[]): boolean {
  const requested = normalizeStrings(input.request.recommendationIds);
  const actual = normalizeStrings(orderedBundles(input).map(recommendationId));
  const valid = requested.length === actual.length && requested.every((value, index) => value === actual[index]);
  addReason(reasons, valid ? "MEMBERSHIP_COMPLETE" : "IMPACT_EVIDENCE_MISSING");
  return valid;
}

function validateTenantScope(input: RecommendationImpactFoundationInput, reasons: RecommendationImpactFoundationReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified
    && input.portfolio.result.tenantIsolationVerified
    && input.relationshipAnalysis.result.tenantIsolationVerified
    && input.portfolioReplay.result.tenantIsolationVerified
    && input.portfolioCertification.result.tenantIsolationVerified
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
    ));
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_IMPACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: RecommendationImpactFoundationInput, reasons: RecommendationImpactFoundationReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && input.portfolioCertification.result.ownershipCertified
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.certification.result.ownershipCertified
      && bundle.authorityScope.result.ownershipValidated
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateEvidence(
  scope: RecommendationImpactScope,
  impacts: readonly RecommendationImpact[],
  reasons: RecommendationImpactFoundationReasonCode[],
): boolean {
  if (!scopeSelected(scope, "EVIDENCE_IMPACT")) {
    addReason(reasons, "EVIDENCE_IMPACTS_VALID");
    return true;
  }
  const valid = impacts.some((impact) => impact.impactType === "EVIDENCE_IMPACT");
  addReason(reasons, valid ? "EVIDENCE_IMPACTS_VALID" : "EVIDENCE_IMPACTS_MISSING");
  return valid;
}

function validateLineage(input: RecommendationImpactFoundationInput, impacts: readonly RecommendationImpact[], reasons: RecommendationImpactFoundationReasonCode[]): boolean {
  if (!scopeSelected(input.request.impactScope, "LINEAGE_IMPACT")) {
    addReason(reasons, "LINEAGE_IMPACTS_VALID");
    return true;
  }
  const valid = input.analysis.result.dependencyContinuityVerified
    && input.portfolio.result.lineageBound
    && impacts.some((impact) => impact.impactType === "LINEAGE_IMPACT")
    && orderedBundles(input).every((bundle) => (
      bundle.lineage.result.reconstructionState !== "INVALID"
      && bundle.lineage.result.lineageIntegrity
    ));
  addReason(reasons, valid ? "LINEAGE_IMPACTS_VALID" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateGovernance(input: RecommendationImpactFoundationInput, impacts: readonly RecommendationImpact[], reasons: RecommendationImpactFoundationReasonCode[]): boolean {
  if (!scopeSelected(input.request.impactScope, "GOVERNANCE_IMPACT")) {
    addReason(reasons, "GOVERNANCE_IMPACTS_VALID");
    return true;
  }
  const valid = input.certification.result.governanceCertified
    && input.portfolioCertification.result.governanceCertified
    && impacts.some((impact) => impact.impactType === "GOVERNANCE_IMPACT")
    && orderedBundles(input).every((bundle) => (
      bundle.binding.result.bindingState !== "INVALID"
      && bundle.authorityScope.result.scopeState !== "INVALID"
      && bundle.policyVisibility.result.visibilityState !== "INVALID"
      && bundle.governanceCertification.result.certificationState !== "FAIL"
    ));
  addReason(reasons, valid ? "GOVERNANCE_IMPACTS_VALID" : "GOVERNANCE_CORRUPTION_DETECTED");
  return valid;
}

function validateReplay(input: RecommendationImpactFoundationInput, impacts: readonly RecommendationImpact[], reasons: RecommendationImpactFoundationReasonCode[]): { valid: boolean; limited: boolean } {
  if (!scopeSelected(input.request.impactScope, "REPLAY_IMPACT")) {
    addReason(reasons, "REPLAY_IMPACTS_VALID");
    return { valid: true, limited: false };
  }
  const invalid = input.replay.result.replayState === "INVALID"
    || input.replay.result.replayState === "ESCALATED"
    || input.portfolioReplay.result.replayState === "INVALID"
    || input.portfolioReplay.result.replayState === "ESCALATED";
  const limited = !invalid && (
    input.replay.result.replayState === "LIMITED"
    || input.portfolioReplay.result.replayState === "LIMITED"
    || !impacts.some((impact) => impact.impactType === "REPLAY_IMPACT")
  );
  addReason(reasons, invalid ? "REPLAY_CORRUPTION_DETECTED" : "REPLAY_IMPACTS_VALID");
  return { valid: !invalid, limited };
}

function validateReadiness(input: RecommendationImpactFoundationInput, impacts: readonly RecommendationImpact[], reasons: RecommendationImpactFoundationReasonCode[]): { valid: boolean; limited: boolean } {
  if (!scopeSelected(input.request.impactScope, "READINESS_IMPACT")) {
    addReason(reasons, "READINESS_IMPACTS_VALID");
    return { valid: true, limited: false };
  }
  const invalid = orderedBundles(input).some((bundle) => (
    bundle.readiness.result.readinessState === "NOT_READY"
    || bundle.alignment.result.alignmentState === "MISALIGNED"
    || bundle.readinessCertification.result.certificationState === "FAIL"
  ));
  const limited = !invalid && (
    !impacts.some((impact) => impact.impactType === "READINESS_IMPACT")
    || orderedBundles(input).some((bundle) => bundle.reviewPacket.evidencePath.evidenceReferences.length === 0)
  );
  addReason(reasons, !invalid ? "READINESS_IMPACTS_VALID" : "READINESS_DEGRADED");
  return { valid: !invalid, limited };
}

function validatePortfolio(input: RecommendationImpactFoundationInput, impacts: readonly RecommendationImpact[], reasons: RecommendationImpactFoundationReasonCode[]): { valid: boolean; limited: boolean } {
  if (!scopeSelected(input.request.impactScope, "PORTFOLIO_IMPACT")) {
    addReason(reasons, "PORTFOLIO_IMPACTS_VALID");
    return { valid: true, limited: false };
  }
  const invalid = input.portfolio.result.portfolioState === "INVALID"
    || input.relationshipAnalysis.result.relationshipState === "INVALID"
    || input.portfolioReplay.result.replayState === "INVALID"
    || input.portfolioReplay.result.replayState === "ESCALATED"
    || input.portfolioCertification.result.certificationState === "FAIL";
  const limited = !invalid && (
    input.portfolioReplay.result.replayState === "LIMITED"
    || input.portfolioCertification.result.certificationState === "CONDITIONAL_PASS"
    || !impacts.some((impact) => impact.impactType === "PORTFOLIO_IMPACT")
  );
  addReason(reasons, !invalid ? "PORTFOLIO_IMPACTS_VALID" : "PORTFOLIO_CORRUPTION_DETECTED");
  return { valid: !invalid, limited };
}

function validateImpactReferences(impacts: readonly RecommendationImpact[], reasons: RecommendationImpactFoundationReasonCode[]): boolean {
  const present = impacts.length > 0;
  addReason(reasons, present ? "IMPACT_REFERENCES_PRESENT" : "IMPACT_REFERENCES_MISSING");
  return present;
}

function validateBoundary(input: RecommendationImpactFoundationInput, reasons: RecommendationImpactFoundationReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.analysis.controlSurfacePresent
    && !input.replay.controlSurfacePresent
    && !input.certification.controlSurfacePresent
    && !input.portfolio.controlSurfacePresent
    && !input.relationshipAnalysis.controlSurfacePresent
    && !input.portfolioReplay.controlSurfacePresent
    && !input.portfolioCertification.controlSurfacePresent
    && orderedBundles(input).every((bundle) => [
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
    ].every(createBoundaryFlags));
  addReason(reasons, executionImpossible ? "EXECUTION_IMPOSSIBLE" : "EXECUTION_REQUEST_BLOCKED");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.prioritizationRequested === true ? "PRIORITIZATION_DETECTED" : "PRIORITIZATION_BLOCKED");
  addReason(reasons, input.approvalRequested === true ? "APPROVAL_DETECTED" : "APPROVAL_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.impactMutationAttempted === true ? "IMPACT_MUTATION_DETECTED" : "IMPACT_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  return Object.freeze({
    executionImpossible,
    authorityBounded,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || input.prioritizationRequested === true
      || input.approvalRequested === true
      || !authorityBounded
      || input.impactMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createRecommendationImpactEvidencePath(
  input: RecommendationImpactFoundationInput,
  impacts: readonly RecommendationImpact[],
): RecommendationImpactEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.impactScope,
    impactReferences: normalizeStrings(impacts.map((impact) => impact.impactId)),
    evidenceReferences: normalizeStrings(bundles.flatMap(collectEvidenceReferences)),
    lineageReferences: normalizeStrings(bundles.flatMap(collectLineageReferences)),
    governanceReferences: normalizeStrings(bundles.flatMap(collectGovernanceReferences)),
    replayReferences: normalizeStrings(bundles.flatMap(collectReplayReferences)),
    readinessReferences: normalizeStrings(bundles.flatMap(collectReadinessReferences)),
    portfolioReferences: collectPortfolioReferences(input),
    evidenceHashes: normalizeStrings([
      input.foundation.result.dependencyGraphHash,
      input.analysis.result.analysisHash,
      input.replay.result.replayHash,
      input.certification.result.certificationHash,
      input.portfolio.result.portfolioHash,
      input.relationshipAnalysis.result.analysisHash,
      input.portfolioReplay.result.replayHash,
      input.portfolioCertification.result.certificationHash,
      ...bundles.flatMap(collectEvidenceHashes),
      ...impacts.map((impact) => impact.impactHash),
    ]),
  });
}

function validateLimits(
  recommendationCount: number,
  impactCount: number,
  governanceImpactCount: number,
  replayImpactCount: number,
  reasons: RecommendationImpactFoundationReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_RECOMMENDATIONS
    && impactCount <= MAX_IMPACTS
    && governanceImpactCount <= MAX_GOVERNANCE_IMPACTS
    && replayImpactCount <= MAX_REPLAY_IMPACTS;
  addReason(reasons, recommendationCount <= MAX_RECOMMENDATIONS ? "RECOMMENDATION_LIMIT_VALID" : "RECOMMENDATION_LIMIT_EXCEEDED");
  addReason(reasons, impactCount <= MAX_IMPACTS ? "IMPACT_LIMIT_VALID" : "IMPACT_LIMIT_EXCEEDED");
  addReason(reasons, governanceImpactCount <= MAX_GOVERNANCE_IMPACTS ? "GOVERNANCE_IMPACT_LIMIT_VALID" : "GOVERNANCE_IMPACT_LIMIT_EXCEEDED");
  addReason(reasons, replayImpactCount <= MAX_REPLAY_IMPACTS ? "REPLAY_IMPACT_LIMIT_VALID" : "REPLAY_IMPACT_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: RecommendationImpactFoundationRequest,
  impactState: RecommendationImpactFoundationResult["impactState"],
  impacts: readonly RecommendationImpact[],
  tenantIsolationVerified: boolean,
  impactGraphHash: string,
): RecommendationImpactFoundationResult {
  return Object.freeze({
    tenantId: request.tenantId,
    impactState,
    impactsCreated: impacts.length,
    evidenceImpactsDetected: impacts.filter((impact) => impact.impactType === "EVIDENCE_IMPACT").length,
    lineageImpactsDetected: impacts.filter((impact) => impact.impactType === "LINEAGE_IMPACT").length,
    governanceImpactsDetected: impacts.filter((impact) => impact.impactType === "GOVERNANCE_IMPACT").length,
    replayImpactsDetected: impacts.filter((impact) => impact.impactType === "REPLAY_IMPACT").length,
    readinessImpactsDetected: impacts.filter((impact) => impact.impactType === "READINESS_IMPACT").length,
    portfolioImpactsDetected: impacts.filter((impact) => impact.impactType === "PORTFOLIO_IMPACT").length,
    tenantIsolationVerified,
    impactGraphHash,
    deterministic: true,
  });
}

function buildObservability(result: RecommendationImpactFoundationResult): RecommendationImpactFoundationObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    impactState: result.impactState,
    impactsCreated: result.impactsCreated,
    evidenceImpactsDetected: result.evidenceImpactsDetected,
    lineageImpactsDetected: result.lineageImpactsDetected,
    governanceImpactsDetected: result.governanceImpactsDetected,
    replayImpactsDetected: result.replayImpactsDetected,
    readinessImpactsDetected: result.readinessImpactsDetected,
    portfolioImpactsDetected: result.portfolioImpactsDetected,
    impactGraphHash: result.impactGraphHash,
  });
}

function buildValidation(
  impactState: RecommendationImpactFoundationResult["impactState"],
  reasonCodes: readonly RecommendationImpactFoundationReasonCode[],
  domainValidity: Readonly<{
    evidenceImpactsValid: boolean;
    lineageImpactsValid: boolean;
    governanceImpactsValid: boolean;
    replayImpactsValid: boolean;
    readinessImpactsValid: boolean;
    portfolioImpactsValid: boolean;
    ownershipValid: boolean;
    tenantIsolationVerified: boolean;
  }>,
  boundary: BoundaryValidation,
  counts: Readonly<{
    impactsCreated: number;
    evidenceImpactsDetected: number;
    lineageImpactsDetected: number;
    governanceImpactsDetected: number;
    replayImpactsDetected: number;
    readinessImpactsDetected: number;
    portfolioImpactsDetected: number;
  }>,
): RecommendationImpactFoundationValidation {
  return Object.freeze({
    valid: impactState !== "INVALID",
    impactState,
    reasonCodes: [...reasonCodes],
    ...domainValidity,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true,
    ...counts,
  });
}

export function buildRecommendationImpactFoundationRequest(
  request: RecommendationImpactFoundationRequest,
): RecommendationImpactFoundationRequest {
  return requestCore(request);
}

export function sealRecommendationImpactFoundation(input: RecommendationImpactFoundationInput): SealedRecommendationImpactFoundationRecord {
  const reasons: RecommendationImpactFoundationReasonCode[] = [];
  const impacts = createImpacts(input);
  const evidencePath = createRecommendationImpactEvidencePath(input, impacts);
  const requestValid = validateRecommendationIds(input.request, reasons)
    && validateScope(input.request.impactScope, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const membershipValid = validateMembership(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const evidenceValid = validateEvidence(input.request.impactScope, impacts, reasons);
  const lineageValid = validateLineage(input, impacts, reasons);
  const governanceValid = validateGovernance(input, impacts, reasons);
  const replayValidation = validateReplay(input, impacts, reasons);
  const readinessValidation = validateReadiness(input, impacts, reasons);
  const portfolioValidation = validatePortfolio(input, impacts, reasons);
  const referencesPresent = validateImpactReferences(impacts, reasons);
  const boundary = validateBoundary(input, reasons);
  const counts = Object.freeze({
    impactsCreated: impacts.length,
    evidenceImpactsDetected: impacts.filter((impact) => impact.impactType === "EVIDENCE_IMPACT").length,
    lineageImpactsDetected: impacts.filter((impact) => impact.impactType === "LINEAGE_IMPACT").length,
    governanceImpactsDetected: impacts.filter((impact) => impact.impactType === "GOVERNANCE_IMPACT").length,
    replayImpactsDetected: impacts.filter((impact) => impact.impactType === "REPLAY_IMPACT").length,
    readinessImpactsDetected: impacts.filter((impact) => impact.impactType === "READINESS_IMPACT").length,
    portfolioImpactsDetected: impacts.filter((impact) => impact.impactType === "PORTFOLIO_IMPACT").length,
  });
  const limitsValid = validateLimits(
    normalizeStrings(input.request.recommendationIds).length,
    counts.impactsCreated,
    counts.governanceImpactsDetected,
    counts.replayImpactsDetected,
    reasons,
  );
  addReason(reasons, "IMPACT_FOUNDATION_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || !governanceValid
    || !lineageValid
    || !replayValidation.valid
    || !readinessValidation.valid
    || !portfolioValidation.valid
    || boundary.invalidBoundary
    || !limitsValid;
  const observe = !invalid && !membershipValid;
  const limited = !invalid && !observe && (
    !referencesPresent
    || !evidenceValid
    || replayValidation.limited
    || readinessValidation.limited
    || portfolioValidation.limited
  );
  const impactState = invalid ? "INVALID" : limited ? "LIMITED" : observe ? "OBSERVE" : "ESTABLISHED";

  const impactGraphHash = hashImpactValue("recommendation-impact-foundation", {
    request: requestCore(input.request),
    impactState,
    impactReferences: evidencePath.impactReferences,
    evidenceReferences: evidencePath.evidenceReferences,
    lineageReferences: evidencePath.lineageReferences,
    governanceReferences: evidencePath.governanceReferences,
    replayReferences: evidencePath.replayReferences,
    readinessReferences: evidencePath.readinessReferences,
    portfolioReferences: evidencePath.portfolioReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    impactState,
    impacts,
    tenantIsolationVerified,
    impactGraphHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    impactState,
    reasons,
    Object.freeze({
      evidenceImpactsValid: evidenceValid,
      lineageImpactsValid: lineageValid,
      governanceImpactsValid: governanceValid,
      replayImpactsValid: replayValidation.valid && !replayValidation.limited,
      readinessImpactsValid: readinessValidation.valid && !readinessValidation.limited,
      portfolioImpactsValid: portfolioValidation.valid && !portfolioValidation.limited,
      ownershipValid,
      tenantIsolationVerified,
    }),
    boundary,
    counts,
  );

  return Object.freeze({
    result,
    impacts,
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    impactOnly: true,
    executionAuthorized: false,
    workflowRoutingAllowed: false,
    prioritizationAllowed: false,
    approvalAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
