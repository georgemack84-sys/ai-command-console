import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  OpportunityAnalysisEvidencePath,
  OpportunityAnalysisInput,
  OpportunityAnalysisObservability,
  OpportunityAnalysisReasonCode,
  OpportunityAnalysisRequest,
  OpportunityAnalysisResult,
  OpportunityAnalysisScope,
  OpportunityAnalysisState,
  OpportunityAnalysisValidation,
  OpportunityConcentration,
  OpportunityConcentrationType,
  OpportunityConflict,
  OpportunityConflictType,
  OpportunityGap,
  OpportunityGapType,
  OpportunityPropagation,
  OpportunityPropagationType,
  OpportunityStrength,
  OpportunityStrengthState,
  RecommendationOpportunity,
  RecommendationOpportunityType,
  SealedOpportunityAnalysisRecord,
} from "./types";

const MAX_RECOMMENDATIONS = 10_000;
const MAX_OPPORTUNITY_RECORDS = 50_000;
const MAX_OPPORTUNITY_CONFLICTS = 10_000;
const MAX_PROPAGATION_PATHS = 25_000;

const ANALYSIS_SCOPES: readonly OpportunityAnalysisScope[] = Object.freeze([
  "STRENGTH",
  "CONCENTRATION",
  "PROPAGATION",
  "GAPS",
  "CONFLICTS",
  "FULL",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  approvalImpossible: boolean;
  rankingAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
  controlSurfaceAbsent: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: OpportunityAnalysisReasonCode[], reason: OpportunityAnalysisReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashAnalysisValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: OpportunityAnalysisRequest): OpportunityAnalysisRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    recommendationIds: [...request.recommendationIds],
    analysisScope: request.analysisScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: OpportunityAnalysisInput): RecommendationPortfolioBundle[] {
  return [...input.recommendations].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function bundleMap(input: OpportunityAnalysisInput): Map<string, RecommendationPortfolioBundle> {
  return new Map(orderedBundles(input).map((bundle) => [recommendationId(bundle), bundle]));
}

function orderedOpportunities(input: OpportunityAnalysisInput): RecommendationOpportunity[] {
  return [...input.foundation.opportunities].sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.opportunityType.localeCompare(right.opportunityType)
    || left.opportunityId.localeCompare(right.opportunityId)
  ));
}

function includesScope(scope: OpportunityAnalysisScope, requested: OpportunityAnalysisScope): boolean {
  return scope === "FULL" || scope === requested;
}

function createBoundaryFlags(record: Record<string, unknown>): boolean {
  const blockedFlags = [
    "executionAuthorized",
    "workflowRoutingAllowed",
    "prioritizationAllowed",
    "approvalAllowed",
    "approvalOrderingAllowed",
    "recommendationApprovalAllowed",
    "recommendationRankingAllowed",
    "recommendationPrioritizationAllowed",
    "recommendationScoringAllowed",
    "resourceAllocationAllowed",
    "authorityMutationAllowed",
    "controlSurfacePresent",
  ] as const;
  return blockedFlags.every((key) => record[key] !== true);
}

function governanceIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.binding.result.bindingState !== "INVALID"
    && bundle.authorityScope.result.scopeState !== "INVALID"
    && bundle.policyVisibility.result.visibilityState !== "INVALID"
    && bundle.governanceCertification.result.certificationState !== "FAIL";
}

function replayIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.replay.result.replayState !== "INVALID"
    && bundle.governanceReplay.result.replayState !== "INVALID"
    && bundle.replayFramework.result.replayState !== "INVALID"
    && bundle.replayFramework.result.replayState !== "ESCALATED";
}

function trustSupported(input: OpportunityAnalysisInput): boolean {
  return input.trustCertification.result.governanceCertified === true
    && input.trustReplay.result.replayState !== "INVALID"
    && input.trustReplay.result.replayState !== "ESCALATED"
    && input.trustFoundation.result.trustState !== "DEGRADED"
    && input.trustFoundation.result.trustState !== "UNTRUSTED"
    && input.trustFoundation.result.trustState !== "UNKNOWN";
}

function resilienceSupported(input: OpportunityAnalysisInput): boolean {
  return input.resilienceCertification.result.governanceCertified === true
    && input.resilienceReplay.result.replayState !== "INVALID"
    && input.resilienceReplay.result.replayState !== "ESCALATED"
    && input.resilienceFoundation.result.resilienceState !== "DEGRADED"
    && input.resilienceFoundation.result.resilienceState !== "FRAGILE"
    && input.resilienceFoundation.result.resilienceState !== "UNKNOWN";
}

function membershipComplete(input: OpportunityAnalysisInput): boolean {
  const requested = normalizeStrings(input.request.recommendationIds);
  const actual = normalizeStrings(orderedBundles(input).map(recommendationId));
  return requested.length === actual.length && requested.every((value, index) => value === actual[index]);
}

function opportunityStrengthState(
  input: OpportunityAnalysisInput,
  opportunity: RecommendationOpportunity,
): OpportunityStrengthState {
  if (opportunity.opportunityState === "UNSUPPORTED") return "UNSUPPORTED";
  if (opportunity.opportunityState === "CONDITIONALLY_SUPPORTED") return "CONSTRAINED";
  if (opportunity.opportunityState === "LIMITED") return "WEAK";

  const supportReferences = [
    opportunity.evidenceReference,
    opportunity.governanceReference,
    opportunity.lineageReference,
    opportunity.replayReference,
  ].filter((value) => value.length > 0).length;

  const fullySupported = trustSupported(input)
    && resilienceSupported(input)
    && input.dependencyRiskFoundation.result.dependencyRiskState !== "HIGH"
    && input.dependencyRiskFoundation.result.dependencyRiskState !== "CRITICAL"
    && input.dependencyFoundation.result.dependencyState !== "LIMITED"
    && input.impactFoundation.result.impactState !== "LIMITED"
    && input.portfolio.result.portfolioState !== "LIMITED"
    && input.relationshipAnalysis.result.relationshipState !== "LIMITED";

  return fullySupported && supportReferences >= 4 ? "STRONG" : "MODERATE";
}

function strengthAnalysis(input: OpportunityAnalysisInput): OpportunityStrength[] {
  return orderedOpportunities(input).map((opportunity) => {
    const strength = opportunityStrengthState(input, opportunity);
    return Object.freeze({
      strengthId: hashAnalysisValue("opportunity-strength-id", {
        opportunityId: opportunity.opportunityId,
        recommendationId: opportunity.recommendationId,
        opportunityType: opportunity.opportunityType,
      }),
      opportunityId: opportunity.opportunityId,
      recommendationId: opportunity.recommendationId,
      opportunityType: opportunity.opportunityType,
      strength,
      strengthHash: hashAnalysisValue("opportunity-strength", {
        opportunityId: opportunity.opportunityId,
        recommendationId: opportunity.recommendationId,
        opportunityType: opportunity.opportunityType,
        strength,
      }),
    });
  });
}

function concentrationTypeFor(opportunityType: RecommendationOpportunityType): OpportunityConcentrationType | null {
  switch (opportunityType) {
    case "GOVERNANCE_OPPORTUNITY":
      return "GOVERNANCE_OPPORTUNITY_CONCENTRATION";
    case "DEPENDENCY_OPPORTUNITY":
      return "DEPENDENCY_OPPORTUNITY_CONCENTRATION";
    case "IMPACT_OPPORTUNITY":
      return "IMPACT_OPPORTUNITY_CONCENTRATION";
    case "PORTFOLIO_OPPORTUNITY":
      return "PORTFOLIO_OPPORTUNITY_CONCENTRATION";
    case "TRUST_OPPORTUNITY":
      return "TRUST_OPPORTUNITY_CONCENTRATION";
    case "RESILIENCE_OPPORTUNITY":
      return "RESILIENCE_OPPORTUNITY_CONCENTRATION";
    case "READINESS_OPPORTUNITY":
    default:
      return null;
  }
}

function concentrationAnalysis(input: OpportunityAnalysisInput): OpportunityConcentration[] {
  const records: OpportunityConcentration[] = [];
  const opportunities = orderedOpportunities(input);
  const byRecommendation = new Map<string, RecommendationOpportunity[]>();
  const byType = new Map<RecommendationOpportunityType, number>();

  for (const opportunity of opportunities) {
    const recommendationBucket = byRecommendation.get(opportunity.recommendationId) ?? [];
    recommendationBucket.push(opportunity);
    byRecommendation.set(opportunity.recommendationId, recommendationBucket);
    byType.set(opportunity.opportunityType, (byType.get(opportunity.opportunityType) ?? 0) + 1);
  }

  for (const [recommendationIdValue, recommendationOpportunities] of [...byRecommendation.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    if (recommendationOpportunities.length >= 3) {
      records.push(Object.freeze({
        concentrationId: hashAnalysisValue("opportunity-concentration-id", {
          recommendationId: recommendationIdValue,
          concentrationType: "HIGH_OPPORTUNITY_CLUSTER",
        }),
        recommendationId: recommendationIdValue,
        opportunityType: "PORTFOLIO",
        concentrationType: "HIGH_OPPORTUNITY_CLUSTER",
        concentrationHash: hashAnalysisValue("opportunity-concentration", {
          recommendationId: recommendationIdValue,
          opportunityCount: recommendationOpportunities.length,
          concentrationType: "HIGH_OPPORTUNITY_CLUSTER",
        }),
      }));
    }
  }

  for (const opportunityType of [...byType.keys()].sort()) {
    const concentrationType = concentrationTypeFor(opportunityType);
    if (!concentrationType) continue;
    const count = byType.get(opportunityType) ?? 0;
    if (count <= 1) continue;
    records.push(Object.freeze({
      concentrationId: hashAnalysisValue("opportunity-concentration-id", {
        opportunityType,
        concentrationType,
      }),
      recommendationId: "portfolio",
      opportunityType,
      concentrationType,
      concentrationHash: hashAnalysisValue("opportunity-concentration", {
        opportunityType,
        concentrationType,
        count,
      }),
    }));
  }

  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.opportunityType.localeCompare(right.opportunityType)
    || left.concentrationType.localeCompare(right.concentrationType)
  ));
}

function propagationDescriptors(opportunityType: RecommendationOpportunityType): readonly OpportunityPropagationType[] {
  switch (opportunityType) {
    case "GOVERNANCE_OPPORTUNITY":
      return ["OPPORTUNITY_PROPAGATION_PATH", "GOVERNANCE_SUPPORT_PROPAGATION"];
    case "DEPENDENCY_OPPORTUNITY":
      return ["OPPORTUNITY_PROPAGATION_PATH", "DEPENDENCY_STABILITY_PROPAGATION"];
    case "IMPACT_OPPORTUNITY":
      return ["OPPORTUNITY_PROPAGATION_PATH", "IMPACT_LEVERAGE_PROPAGATION"];
    case "PORTFOLIO_OPPORTUNITY":
      return ["OPPORTUNITY_PROPAGATION_PATH", "PORTFOLIO_OPPORTUNITY_PROPAGATION"];
    case "READINESS_OPPORTUNITY":
      return ["OPPORTUNITY_PROPAGATION_PATH", "READINESS_OPPORTUNITY_PROPAGATION"];
    case "TRUST_OPPORTUNITY":
    case "RESILIENCE_OPPORTUNITY":
    default:
      return ["OPPORTUNITY_PROPAGATION_PATH"];
  }
}

function resolvePropagationReference(
  input: OpportunityAnalysisInput,
  opportunity: RecommendationOpportunity,
  propagationType: OpportunityPropagationType,
): string {
  if (propagationType === "GOVERNANCE_SUPPORT_PROPAGATION") return opportunity.governanceReference;
  if (propagationType === "DEPENDENCY_STABILITY_PROPAGATION") return input.dependencyFoundation.result.dependencyGraphHash;
  if (propagationType === "IMPACT_LEVERAGE_PROPAGATION") return input.impactFoundation.result.impactGraphHash;
  if (propagationType === "PORTFOLIO_OPPORTUNITY_PROPAGATION") return input.portfolio.result.portfolioHash;
  if (propagationType === "READINESS_OPPORTUNITY_PROPAGATION") return opportunity.evidenceReference;
  return `${opportunity.lineageReference}->${opportunity.replayReference}`;
}

function propagationAnalysis(input: OpportunityAnalysisInput): OpportunityPropagation[] {
  const records: OpportunityPropagation[] = [];
  for (const opportunity of orderedOpportunities(input)) {
    for (const propagationType of propagationDescriptors(opportunity.opportunityType)) {
      const propagationReference = resolvePropagationReference(input, opportunity, propagationType);
      records.push(Object.freeze({
        propagationId: hashAnalysisValue("opportunity-propagation-id", {
          opportunityId: opportunity.opportunityId,
          propagationType,
          propagationReference,
        }),
        opportunityId: opportunity.opportunityId,
        recommendationId: opportunity.recommendationId,
        opportunityType: opportunity.opportunityType,
        propagationType,
        propagationReference,
        propagationHash: hashAnalysisValue("opportunity-propagation", {
          opportunityId: opportunity.opportunityId,
          recommendationId: opportunity.recommendationId,
          opportunityType: opportunity.opportunityType,
          propagationType,
          propagationReference,
        }),
      }));
    }
  }
  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.opportunityType.localeCompare(right.opportunityType)
    || left.propagationType.localeCompare(right.propagationType)
    || left.propagationReference.localeCompare(right.propagationReference)
  ));
}

function createGapRecord(
  opportunityId: string,
  recommendationIdValue: string,
  opportunityType: RecommendationOpportunityType | "FOUNDATION",
  gapType: OpportunityGapType,
): OpportunityGap {
  return Object.freeze({
    gapId: hashAnalysisValue("opportunity-gap-id", {
      opportunityId,
      recommendationId: recommendationIdValue,
      opportunityType,
      gapType,
    }),
    opportunityId,
    recommendationId: recommendationIdValue,
    opportunityType,
    gapType,
    gapHash: hashAnalysisValue("opportunity-gap", {
      opportunityId,
      recommendationId: recommendationIdValue,
      opportunityType,
      gapType,
    }),
  });
}

function gapsAnalysis(input: OpportunityAnalysisInput): OpportunityGap[] {
  const records: OpportunityGap[] = [];
  const opportunities = orderedOpportunities(input);
  const bundles = orderedBundles(input);

  if (input.foundation.evidencePath.opportunityReferences.length === 0) {
    records.push(createGapRecord("foundation", "foundation", "FOUNDATION", "MISSING_OPPORTUNITY_EVIDENCE"));
  }
  if (input.foundation.evidencePath.governanceReferences.length === 0) {
    records.push(createGapRecord("foundation", "foundation", "FOUNDATION", "MISSING_GOVERNANCE_SUPPORT"));
  }
  if (input.foundation.evidencePath.replayReferences.length === 0) {
    records.push(createGapRecord("foundation", "foundation", "FOUNDATION", "MISSING_REPLAY_REFERENCES"));
  }
  if (input.foundation.evidencePath.lineageReferences.length === 0) {
    records.push(createGapRecord("foundation", "foundation", "FOUNDATION", "MISSING_LINEAGE_REFERENCES"));
  }
  if (input.foundation.evidencePath.readinessReferences.length === 0) {
    records.push(createGapRecord("foundation", "foundation", "FOUNDATION", "MISSING_READINESS_EVIDENCE"));
  }
  if (!trustSupported(input)) {
    records.push(createGapRecord("foundation", "foundation", "FOUNDATION", "MISSING_TRUST_SUPPORT"));
  }
  if (!resilienceSupported(input)) {
    records.push(createGapRecord("foundation", "foundation", "FOUNDATION", "MISSING_RESILIENCE_SUPPORT"));
  }
  for (const bundle of bundles) {
    const id = recommendationId(bundle);
    if (bundle.replayEvidence.replayReferences.length === 0) {
      records.push(createGapRecord(`foundation:${id}`, id, "FOUNDATION", "MISSING_REPLAY_REFERENCES"));
    }
    if (bundle.governanceReferences.governanceReferences.length === 0) {
      records.push(createGapRecord(`foundation:${id}`, id, "FOUNDATION", "MISSING_GOVERNANCE_SUPPORT"));
    }
    if (bundle.readiness.evidencePath.evidenceReferences.length === 0) {
      records.push(createGapRecord(`foundation:${id}`, id, "FOUNDATION", "MISSING_READINESS_EVIDENCE"));
    }
  }

  for (const opportunity of opportunities) {
    if (opportunity.evidenceReference.length === 0) {
      records.push(createGapRecord(opportunity.opportunityId, opportunity.recommendationId, opportunity.opportunityType, "MISSING_OPPORTUNITY_EVIDENCE"));
    }
    if (opportunity.governanceReference.length === 0) {
      records.push(createGapRecord(opportunity.opportunityId, opportunity.recommendationId, opportunity.opportunityType, "MISSING_GOVERNANCE_SUPPORT"));
    }
    if (opportunity.replayReference.length === 0) {
      records.push(createGapRecord(opportunity.opportunityId, opportunity.recommendationId, opportunity.opportunityType, "MISSING_REPLAY_REFERENCES"));
    }
    if (opportunity.lineageReference.length === 0) {
      records.push(createGapRecord(opportunity.opportunityId, opportunity.recommendationId, opportunity.opportunityType, "MISSING_LINEAGE_REFERENCES"));
    }
  }

  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.opportunityType.localeCompare(right.opportunityType)
    || left.gapType.localeCompare(right.gapType)
    || left.opportunityId.localeCompare(right.opportunityId)
  ));
}

function conflictTypesFor(
  input: OpportunityAnalysisInput,
  opportunity: RecommendationOpportunity,
  bundle: RecommendationPortfolioBundle,
): OpportunityConflictType[] {
  const conflicts: OpportunityConflictType[] = [];

  if (!governanceIntegrity(bundle) || input.foundation.result.opportunityState === "UNSUPPORTED") {
    conflicts.push("GOVERNANCE_OPPORTUNITY_CONFLICT");
  }
  if (
    opportunity.opportunityType === "DEPENDENCY_OPPORTUNITY"
    && (
      input.dependencyRiskFoundation.result.dependencyRiskState === "HIGH"
      || input.dependencyRiskFoundation.result.dependencyRiskState === "CRITICAL"
      || input.dependencyFoundation.result.dependencyState === "LIMITED"
    )
  ) {
    conflicts.push("DEPENDENCY_OPPORTUNITY_CONFLICT");
  }
  if (opportunity.opportunityType === "IMPACT_OPPORTUNITY" && input.impactFoundation.result.impactState === "LIMITED") {
    conflicts.push("IMPACT_OPPORTUNITY_CONFLICT");
  }
  if (
    opportunity.opportunityType === "PORTFOLIO_OPPORTUNITY"
    && (
      input.portfolio.result.portfolioState === "LIMITED"
      || input.relationshipAnalysis.result.relationshipState === "LIMITED"
    )
  ) {
    conflicts.push("PORTFOLIO_OPPORTUNITY_CONFLICT");
  }
  if (
    opportunity.opportunityType === "TRUST_OPPORTUNITY"
    && (
      input.trustFoundation.result.trustState === "DEGRADED"
      || input.trustFoundation.result.trustState === "UNTRUSTED"
      || input.trustFoundation.result.trustState === "UNKNOWN"
    )
  ) {
    conflicts.push("TRUST_OPPORTUNITY_CONFLICT");
  }
  if (
    opportunity.opportunityType === "RESILIENCE_OPPORTUNITY"
    && (
      input.resilienceFoundation.result.resilienceState === "DEGRADED"
      || input.resilienceFoundation.result.resilienceState === "FRAGILE"
      || input.resilienceFoundation.result.resilienceState === "UNKNOWN"
    )
  ) {
    conflicts.push("RESILIENCE_OPPORTUNITY_CONFLICT");
  }
  if (!replayIntegrity(bundle) || input.authorityExpansionDetected === true) {
    conflicts.push("AUTHORITY_BOUNDARY_CONFLICT");
  }

  return conflicts;
}

function conflictsAnalysis(input: OpportunityAnalysisInput): OpportunityConflict[] {
  const bundles = bundleMap(input);
  const records: OpportunityConflict[] = [];
  for (const opportunity of orderedOpportunities(input)) {
    const bundle = bundles.get(opportunity.recommendationId);
    if (!bundle) continue;
    for (const conflictType of conflictTypesFor(input, opportunity, bundle)) {
      records.push(Object.freeze({
        conflictId: hashAnalysisValue("opportunity-conflict-id", {
          opportunityId: opportunity.opportunityId,
          conflictType,
        }),
        opportunityId: opportunity.opportunityId,
        recommendationId: opportunity.recommendationId,
        opportunityType: opportunity.opportunityType,
        conflictType,
        conflictHash: hashAnalysisValue("opportunity-conflict", {
          opportunityId: opportunity.opportunityId,
          recommendationId: opportunity.recommendationId,
          opportunityType: opportunity.opportunityType,
          conflictType,
        }),
      }));
    }
  }
  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.opportunityType.localeCompare(right.opportunityType)
    || left.conflictType.localeCompare(right.conflictType)
    || left.opportunityId.localeCompare(right.opportunityId)
  ));
}

function validateScope(scope: OpportunityAnalysisScope, reasons: OpportunityAnalysisReasonCode[]): boolean {
  const valid = ANALYSIS_SCOPES.includes(scope);
  addReason(reasons, valid ? "ANALYSIS_SCOPE_VALID" : "ANALYSIS_SCOPE_INVALID");
  return valid;
}

function validateRecommendationIds(request: OpportunityAnalysisRequest, reasons: OpportunityAnalysisReasonCode[]): boolean {
  const valid = request.recommendationIds.length > 0;
  addReason(reasons, valid ? "RECOMMENDATION_IDS_PRESENT" : "RECOMMENDATION_IDS_MISSING");
  return valid;
}

function validateFoundation(input: OpportunityAnalysisInput, reasons: OpportunityAnalysisReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: OpportunityAnalysisInput, reasons: OpportunityAnalysisReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.dependencyRiskFoundation.sealed === true
    && input.dependencyRiskReplay.sealed === true
    && input.dependencyRiskCertification.sealed === true
    && input.dependencyFoundation.sealed === true
    && input.dependencyReplay.sealed === true
    && input.dependencyCertification.sealed === true
    && input.impactFoundation.sealed === true
    && input.impactReplay.sealed === true
    && input.impactCertification.sealed === true
    && input.trustFoundation.sealed === true
    && input.trustReplay.sealed === true
    && input.trustCertification.sealed === true
    && input.driftFoundation.sealed === true
    && input.driftReplay.sealed === true
    && input.driftCertification.sealed === true
    && input.resilienceFoundation.sealed === true
    && input.resilienceReplay.sealed === true
    && input.resilienceCertification.sealed === true
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

function validateTenantScope(input: OpportunityAnalysisInput, reasons: OpportunityAnalysisReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.dependencyRiskFoundation.result.tenantIsolationVerified
    && input.dependencyRiskReplay.result.tenantIsolationVerified
    && input.dependencyRiskCertification.result.tenantIsolationVerified
    && input.dependencyFoundation.result.tenantIsolationVerified
    && input.dependencyReplay.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
    && input.impactFoundation.result.tenantIsolationVerified
    && input.impactReplay.result.tenantIsolationVerified
    && input.impactCertification.result.tenantIsolationVerified
    && input.trustFoundation.result.tenantIsolationVerified
    && input.trustReplay.result.tenantIsolationVerified
    && input.trustCertification.result.tenantIsolationVerified
    && input.driftFoundation.result.tenantIsolationVerified
    && input.driftReplay.result.tenantIsolationVerified
    && input.driftCertification.result.tenantIsolationVerified
    && input.resilienceFoundation.result.tenantIsolationVerified
    && input.resilienceReplay.result.tenantIsolationVerified
    && input.resilienceCertification.result.tenantIsolationVerified
    && input.portfolio.result.tenantIsolationVerified
    && input.relationshipAnalysis.result.tenantIsolationVerified
    && input.portfolioReplay.result.tenantIsolationVerified
    && input.portfolioCertification.result.tenantIsolationVerified
    && orderedBundles(input).every((bundle) => (
      bundle.ledger.entry.tenantId === tenantId
      && bundle.ownershipEvidence.tenantId === tenantId
      && bundle.governanceReferences.tenantId === tenantId
      && bundle.replayEvidence.tenantId === tenantId
    ));
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_OPPORTUNITY_BLOCKED");
  return valid;
}

function validateOwnership(input: OpportunityAnalysisInput, reasons: OpportunityAnalysisReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateGovernance(input: OpportunityAnalysisInput, reasons: OpportunityAnalysisReasonCode[]): boolean {
  const valid = input.dependencyRiskCertification.result.governanceCertified === true
    && input.dependencyCertification.result.governanceCertified === true
    && input.impactCertification.result.governanceCertified === true
    && input.trustCertification.result.governanceCertified === true
    && input.driftCertification.result.governanceCertified === true
    && input.resilienceCertification.result.governanceCertified === true
    && input.portfolioCertification.result.governanceCertified === true
    && !input.foundation.validation.reasonCodes.includes("GOVERNANCE_CORRUPTION_DETECTED")
    && orderedBundles(input).every(governanceIntegrity);
  addReason(reasons, valid ? "GOVERNANCE_CONTINUITY_PRESERVED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return valid;
}

function validateReplay(input: OpportunityAnalysisInput, reasons: OpportunityAnalysisReasonCode[]): boolean {
  const valid = input.dependencyRiskReplay.result.replayState !== "INVALID"
    && input.dependencyRiskReplay.result.replayState !== "ESCALATED"
    && input.dependencyReplay.result.replayState !== "INVALID"
    && input.dependencyReplay.result.replayState !== "ESCALATED"
    && input.impactReplay.result.replayState !== "INVALID"
    && input.impactReplay.result.replayState !== "ESCALATED"
    && input.trustReplay.result.replayState !== "INVALID"
    && input.trustReplay.result.replayState !== "ESCALATED"
    && input.driftReplay.result.replayState !== "INVALID"
    && input.driftReplay.result.replayState !== "ESCALATED"
    && input.resilienceReplay.result.replayState !== "INVALID"
    && input.resilienceReplay.result.replayState !== "ESCALATED"
    && input.portfolioReplay.result.replayState !== "INVALID"
    && input.portfolioReplay.result.replayState !== "ESCALATED"
    && !input.foundation.validation.reasonCodes.includes("REPLAY_CORRUPTION_DETECTED")
    && orderedBundles(input).every(replayIntegrity);
  addReason(reasons, valid ? "REPLAY_CONTINUITY_PRESERVED" : "REPLAY_CORRUPTION_DETECTED");
  return valid;
}

function validateOpportunityEvidence(input: OpportunityAnalysisInput, reasons: OpportunityAnalysisReasonCode[]): boolean {
  const referencesPresent = input.foundation.evidencePath.opportunityReferences.length > 0;
  const evidencePresent = input.foundation.opportunities.length > 0
    && referencesPresent
    && membershipComplete(input);
  addReason(reasons, evidencePresent ? "OPPORTUNITY_EVIDENCE_PRESENT" : "OPPORTUNITY_EVIDENCE_MISSING");
  addReason(reasons, referencesPresent ? "OPPORTUNITY_REFERENCES_PRESENT" : "OPPORTUNITY_REFERENCES_MISSING");
  addReason(reasons, input.foundation.evidencePath.governanceReferences.length > 0 ? "GOVERNANCE_REFERENCES_PRESENT" : "GOVERNANCE_REFERENCES_MISSING");
  addReason(reasons, input.foundation.evidencePath.lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, input.foundation.evidencePath.replayReferences.length > 0 ? "REPLAY_REFERENCES_PRESENT" : "REPLAY_REFERENCES_MISSING");
  addReason(reasons, input.foundation.evidencePath.readinessReferences.length > 0 ? "READINESS_REFERENCES_PRESENT" : "READINESS_REFERENCES_MISSING");
  return evidencePresent;
}

function validateStrengths(strengths: readonly OpportunityStrength[], reasons: OpportunityAnalysisReasonCode[]): boolean {
  const valid = strengths.length > 0;
  addReason(reasons, valid ? "STRENGTHS_ANALYZED" : "STRENGTHS_LIMITED");
  return valid;
}

function validateConcentrations(concentrations: readonly OpportunityConcentration[], reasons: OpportunityAnalysisReasonCode[]): boolean {
  const valid = concentrations.length > 0;
  addReason(reasons, valid ? "CONCENTRATIONS_ANALYZED" : "CONCENTRATIONS_LIMITED");
  return valid;
}

function validatePropagations(propagations: readonly OpportunityPropagation[], reasons: OpportunityAnalysisReasonCode[]): boolean {
  const valid = propagations.length > 0;
  addReason(reasons, valid ? "PROPAGATIONS_ANALYZED" : "PROPAGATIONS_LIMITED");
  return valid;
}

function validateGaps(gaps: readonly OpportunityGap[], reasons: OpportunityAnalysisReasonCode[]): boolean {
  addReason(reasons, gaps.length > 0 ? "OPPORTUNITY_GAPS_DETECTED" : "OPPORTUNITY_GAPS_ABSENT");
  return gaps.length === 0;
}

function validateConflicts(conflicts: readonly OpportunityConflict[], reasons: OpportunityAnalysisReasonCode[]): boolean {
  addReason(reasons, conflicts.length > 0 ? "OPPORTUNITY_CONFLICTS_DETECTED" : "OPPORTUNITY_CONFLICTS_ABSENT");
  return conflicts.length === 0;
}

function validateBoundary(input: OpportunityAnalysisInput, reasons: OpportunityAnalysisReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const approvalImpossible = input.approvalRequested !== true;
  const rankingAbsent = input.recommendationRankingRequested !== true;
  const scoringAbsent = input.recommendationScoringRequested !== true;
  const resourceAllocationAbsent = input.resourceAllocationRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.dependencyRiskFoundation.controlSurfacePresent
    && !input.dependencyRiskReplay.controlSurfacePresent
    && !input.dependencyRiskCertification.controlSurfacePresent
    && !input.dependencyFoundation.controlSurfacePresent
    && !input.dependencyReplay.controlSurfacePresent
    && !input.dependencyCertification.controlSurfacePresent
    && !input.impactFoundation.controlSurfacePresent
    && !input.impactReplay.controlSurfacePresent
    && !input.impactCertification.controlSurfacePresent
    && !input.trustFoundation.controlSurfacePresent
    && !input.trustReplay.controlSurfacePresent
    && !input.trustCertification.controlSurfacePresent
    && !input.driftFoundation.controlSurfacePresent
    && !input.driftReplay.controlSurfacePresent
    && !input.driftCertification.controlSurfacePresent
    && !input.resilienceFoundation.controlSurfacePresent
    && !input.resilienceReplay.controlSurfacePresent
    && !input.resilienceCertification.controlSurfacePresent
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
  addReason(reasons, rankingAbsent ? "RANKING_ABSENT" : "RANKING_DETECTED");
  addReason(reasons, approvalImpossible ? "APPROVAL_IMPOSSIBLE" : "APPROVAL_DETECTED");
  addReason(reasons, scoringAbsent ? "SCORING_ABSENT" : "SCORING_DETECTED");
  addReason(reasons, resourceAllocationAbsent ? "RESOURCE_ALLOCATION_ABSENT" : "RESOURCE_ALLOCATION_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.analysisMutationAttempted === true ? "ANALYSIS_MUTATION_DETECTED" : "ANALYSIS_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");

  return Object.freeze({
    executionImpossible,
    approvalImpossible,
    rankingAbsent,
    scoringAbsent,
    resourceAllocationAbsent,
    authorityBounded,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || input.prioritizationRequested === true
      || !rankingAbsent
      || !approvalImpossible
      || !scoringAbsent
      || !resourceAllocationAbsent
      || !authorityBounded
      || input.analysisMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createOpportunityAnalysisEvidencePath(
  input: OpportunityAnalysisInput,
  strengths: readonly OpportunityStrength[],
  concentrations: readonly OpportunityConcentration[],
  propagations: readonly OpportunityPropagation[],
  gaps: readonly OpportunityGap[],
  conflicts: readonly OpportunityConflict[],
): OpportunityAnalysisEvidencePath {
  return Object.freeze({
    scope: input.request.analysisScope,
    opportunityReferences: normalizeStrings(input.foundation.opportunities.map((opportunity) => opportunity.opportunityId)),
    strengthReferences: normalizeStrings(strengths.map((strength) => `${strength.opportunityId}:${strength.strength}`)),
    concentrationReferences: normalizeStrings(concentrations.map((concentration) => `${concentration.recommendationId}:${concentration.opportunityType}:${concentration.concentrationType}`)),
    propagationReferences: normalizeStrings(propagations.map((propagation) => `${propagation.opportunityId}:${propagation.propagationType}:${propagation.propagationReference}`)),
    gapReferences: normalizeStrings(gaps.map((gap) => `${gap.opportunityId}:${gap.opportunityType}:${gap.gapType}`)),
    conflictReferences: normalizeStrings(conflicts.map((conflict) => `${conflict.opportunityId}:${conflict.opportunityType}:${conflict.conflictType}`)),
    governanceReferences: normalizeStrings(input.foundation.evidencePath.governanceReferences),
    lineageReferences: normalizeStrings(input.foundation.evidencePath.lineageReferences),
    replayReferences: normalizeStrings(input.foundation.evidencePath.replayReferences),
    readinessReferences: normalizeStrings(input.foundation.evidencePath.readinessReferences),
    evidenceHashes: normalizeStrings([
      input.foundation.result.opportunityGraphHash,
      input.dependencyRiskFoundation.result.dependencyRiskGraphHash,
      input.dependencyRiskReplay.result.replayHash,
      input.dependencyRiskCertification.result.certificationHash,
      input.dependencyFoundation.result.dependencyGraphHash,
      input.dependencyReplay.result.replayHash,
      input.dependencyCertification.result.certificationHash,
      input.impactFoundation.result.impactGraphHash,
      input.impactReplay.result.replayHash,
      input.impactCertification.result.certificationHash,
      input.trustFoundation.result.trustGraphHash,
      input.trustReplay.result.replayHash,
      input.trustCertification.result.certificationHash,
      input.driftFoundation.result.driftGraphHash,
      input.driftReplay.result.replayHash,
      input.driftCertification.result.certificationHash,
      input.resilienceFoundation.result.resilienceGraphHash,
      input.resilienceReplay.result.replayHash,
      input.resilienceCertification.result.certificationHash,
      input.portfolio.result.portfolioHash,
      input.relationshipAnalysis.result.analysisHash,
      input.portfolioReplay.result.replayHash,
      input.portfolioCertification.result.certificationHash,
      ...input.foundation.evidencePath.evidenceHashes,
      ...strengths.map((strength) => strength.strengthHash),
      ...concentrations.map((concentration) => concentration.concentrationHash),
      ...propagations.map((propagation) => propagation.propagationHash),
      ...gaps.map((gap) => gap.gapHash),
      ...conflicts.map((conflict) => conflict.conflictHash),
    ]),
  });
}

function validateLimits(
  recommendationCount: number,
  opportunityCount: number,
  conflictCount: number,
  propagationCount: number,
  reasons: OpportunityAnalysisReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_RECOMMENDATIONS
    && opportunityCount <= MAX_OPPORTUNITY_RECORDS
    && conflictCount <= MAX_OPPORTUNITY_CONFLICTS
    && propagationCount <= MAX_PROPAGATION_PATHS;
  addReason(reasons, recommendationCount <= MAX_RECOMMENDATIONS ? "RECOMMENDATION_LIMIT_VALID" : "RECOMMENDATION_LIMIT_EXCEEDED");
  addReason(reasons, opportunityCount <= MAX_OPPORTUNITY_RECORDS ? "OPPORTUNITY_RECORD_LIMIT_VALID" : "OPPORTUNITY_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, conflictCount <= MAX_OPPORTUNITY_CONFLICTS ? "OPPORTUNITY_CONFLICT_LIMIT_VALID" : "OPPORTUNITY_CONFLICT_LIMIT_EXCEEDED");
  addReason(reasons, propagationCount <= MAX_PROPAGATION_PATHS ? "PROPAGATION_LIMIT_VALID" : "PROPAGATION_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: OpportunityAnalysisRequest,
  analysisState: OpportunityAnalysisState,
  strengths: readonly OpportunityStrength[],
  concentrations: readonly OpportunityConcentration[],
  propagations: readonly OpportunityPropagation[],
  gaps: readonly OpportunityGap[],
  conflicts: readonly OpportunityConflict[],
  tenantIsolationVerified: boolean,
  analysisHash: string,
): OpportunityAnalysisResult {
  return Object.freeze({
    tenantId: request.tenantId,
    analysisState,
    opportunityStrengthsDetected: strengths.length,
    opportunityConcentrationsDetected: concentrations.length,
    opportunityPropagationsDetected: propagations.length,
    opportunityGapsDetected: gaps.length,
    opportunityConflictsDetected: conflicts.length,
    tenantIsolationVerified,
    analysisHash,
    deterministic: true,
  });
}

function buildObservability(result: OpportunityAnalysisResult): OpportunityAnalysisObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    analysisState: result.analysisState,
    opportunityStrengthsDetected: result.opportunityStrengthsDetected,
    opportunityConcentrationsDetected: result.opportunityConcentrationsDetected,
    opportunityPropagationsDetected: result.opportunityPropagationsDetected,
    opportunityGapsDetected: result.opportunityGapsDetected,
    opportunityConflictsDetected: result.opportunityConflictsDetected,
    analysisHash: result.analysisHash,
  });
}

function buildValidation(
  analysisState: OpportunityAnalysisState,
  reasonCodes: readonly OpportunityAnalysisReasonCode[],
  strengths: readonly OpportunityStrength[],
  concentrations: readonly OpportunityConcentration[],
  propagations: readonly OpportunityPropagation[],
  gaps: readonly OpportunityGap[],
  conflicts: readonly OpportunityConflict[],
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
): OpportunityAnalysisValidation {
  return Object.freeze({
    valid: analysisState !== "INVALID",
    analysisState,
    reasonCodes: [...reasonCodes],
    opportunityStrengthsDetected: strengths.length,
    opportunityConcentrationsDetected: concentrations.length,
    opportunityPropagationsDetected: propagations.length,
    opportunityGapsDetected: gaps.length,
    opportunityConflictsDetected: conflicts.length,
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    approvalImpossible: boundary.approvalImpossible,
    rankingAbsent: boundary.rankingAbsent,
    scoringAbsent: boundary.scoringAbsent,
    resourceAllocationAbsent: boundary.resourceAllocationAbsent,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
  });
}

export function buildOpportunityAnalysisRequest(request: OpportunityAnalysisRequest): OpportunityAnalysisRequest {
  return requestCore(request);
}

export function sealOpportunityAnalysis(input: OpportunityAnalysisInput): SealedOpportunityAnalysisRecord {
  const reasons: OpportunityAnalysisReasonCode[] = [];
  const strengths = includesScope(input.request.analysisScope, "STRENGTH") ? strengthAnalysis(input) : [];
  const concentrations = includesScope(input.request.analysisScope, "CONCENTRATION") ? concentrationAnalysis(input) : [];
  const propagations = includesScope(input.request.analysisScope, "PROPAGATION") ? propagationAnalysis(input) : [];
  const gaps = includesScope(input.request.analysisScope, "GAPS") ? gapsAnalysis(input) : [];
  const conflicts = includesScope(input.request.analysisScope, "CONFLICTS") ? conflictsAnalysis(input) : [];

  const requestValid = validateRecommendationIds(input.request, reasons) && validateScope(input.request.analysisScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const evidencePresent = validateOpportunityEvidence(input, reasons);
  const strengthsValid = includesScope(input.request.analysisScope, "STRENGTH") ? validateStrengths(strengths, reasons) : true;
  const concentrationsValid = includesScope(input.request.analysisScope, "CONCENTRATION") ? validateConcentrations(concentrations, reasons) : true;
  const propagationsValid = includesScope(input.request.analysisScope, "PROPAGATION") ? validatePropagations(propagations, reasons) : true;
  const gapsClear = includesScope(input.request.analysisScope, "GAPS") ? validateGaps(gaps, reasons) : true;
  const conflictsClear = includesScope(input.request.analysisScope, "CONFLICTS") ? validateConflicts(conflicts, reasons) : true;
  const governanceValid = validateGovernance(input, reasons);
  const replayValid = validateReplay(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createOpportunityAnalysisEvidencePath(input, strengths, concentrations, propagations, gaps, conflicts);
  const limitsValid = validateLimits(
    normalizeStrings(input.request.recommendationIds).length,
    input.foundation.opportunities.length,
    conflicts.length,
    propagations.length,
    reasons,
  );
  addReason(reasons, "OPPORTUNITY_ANALYSIS_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !foundationValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || !governanceValid
    || !replayValid
    || boundary.invalidBoundary;
  const observe = !invalid && (
    !evidencePresent
    || input.foundation.result.opportunityState === "UNKNOWN"
  );
  const limited = !invalid && !observe && (
    !strengthsValid
    || !concentrationsValid
    || !propagationsValid
    || !gapsClear
    || !conflictsClear
    || !limitsValid
    || strengths.some((strength) => strength.strength === "WEAK" || strength.strength === "CONSTRAINED")
    || input.foundation.result.opportunityState === "LIMITED"
  );
  const analysisState: OpportunityAnalysisState = invalid ? "INVALID" : observe ? "OBSERVE" : limited ? "LIMITED" : "ANALYZED";

  const analysisHash = hashAnalysisValue("opportunity-analysis-engine", {
    request: requestCore(input.request),
    analysisState,
    opportunityReferences: evidencePath.opportunityReferences,
    strengthReferences: evidencePath.strengthReferences,
    concentrationReferences: evidencePath.concentrationReferences,
    propagationReferences: evidencePath.propagationReferences,
    gapReferences: evidencePath.gapReferences,
    conflictReferences: evidencePath.conflictReferences,
    governanceReferences: evidencePath.governanceReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    readinessReferences: evidencePath.readinessReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    analysisState,
    strengths,
    concentrations,
    propagations,
    gaps,
    conflicts,
    tenantIsolationVerified,
    analysisHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    analysisState,
    reasons,
    strengths,
    concentrations,
    propagations,
    gaps,
    conflicts,
    ownershipValid,
    tenantIsolationVerified,
    boundary,
  );

  return Object.freeze({
    result,
    strengths: Object.freeze(strengths),
    concentrations: Object.freeze(concentrations),
    propagations: Object.freeze(propagations),
    gaps: Object.freeze(gaps),
    conflicts: Object.freeze(conflicts),
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    analysisOnly: true,
    executionAuthorized: false,
    workflowRoutingAllowed: false,
    prioritizationAllowed: false,
    recommendationRankingAllowed: false,
    approvalAllowed: false,
    recommendationScoringAllowed: false,
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
