import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  RecommendationOpportunity,
  RecommendationOpportunityEvidencePath,
  RecommendationOpportunityFoundationInput,
  RecommendationOpportunityFoundationObservability,
  RecommendationOpportunityFoundationReasonCode,
  RecommendationOpportunityFoundationRequest,
  RecommendationOpportunityFoundationResult,
  RecommendationOpportunityFoundationValidation,
  RecommendationOpportunityScope,
  RecommendationOpportunityState,
  RecommendationOpportunityType,
  SealedRecommendationOpportunityFoundationRecord,
} from "./types";

const MAX_RECOMMENDATIONS = 10_000;
const MAX_OPPORTUNITY_RECORDS = 50_000;
const MAX_LINEAGE_REFERENCES = 10_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_GOVERNANCE_REFERENCES = 10_000;

const OPPORTUNITY_SCOPES: readonly RecommendationOpportunityScope[] = Object.freeze([
  "GOVERNANCE",
  "DEPENDENCY",
  "IMPACT",
  "PORTFOLIO",
  "TRUST",
  "RESILIENCE",
  "READINESS",
  "FULL",
]);

const OPPORTUNITY_TYPES: readonly RecommendationOpportunityType[] = Object.freeze([
  "GOVERNANCE_OPPORTUNITY",
  "DEPENDENCY_OPPORTUNITY",
  "IMPACT_OPPORTUNITY",
  "PORTFOLIO_OPPORTUNITY",
  "TRUST_OPPORTUNITY",
  "RESILIENCE_OPPORTUNITY",
  "READINESS_OPPORTUNITY",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  invalidBoundary: boolean;
  controlSurfaceAbsent: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(
  reasons: RecommendationOpportunityFoundationReasonCode[],
  reason: RecommendationOpportunityFoundationReasonCode,
): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashOpportunityValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: RecommendationOpportunityFoundationRequest): RecommendationOpportunityFoundationRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    recommendationIds: [...request.recommendationIds],
    opportunityScope: request.opportunityScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: RecommendationOpportunityFoundationInput): RecommendationPortfolioBundle[] {
  return [...input.recommendations].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function bundleMap(input: RecommendationOpportunityFoundationInput): Map<string, RecommendationPortfolioBundle> {
  return new Map(orderedBundles(input).map((bundle) => [recommendationId(bundle), bundle]));
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

function includesScope(scope: RecommendationOpportunityScope, type: RecommendationOpportunityType): boolean {
  if (scope === "FULL") return true;
  return (
    (scope === "GOVERNANCE" && type === "GOVERNANCE_OPPORTUNITY")
    || (scope === "DEPENDENCY" && type === "DEPENDENCY_OPPORTUNITY")
    || (scope === "IMPACT" && type === "IMPACT_OPPORTUNITY")
    || (scope === "PORTFOLIO" && type === "PORTFOLIO_OPPORTUNITY")
    || (scope === "TRUST" && type === "TRUST_OPPORTUNITY")
    || (scope === "RESILIENCE" && type === "RESILIENCE_OPPORTUNITY")
    || (scope === "READINESS" && type === "READINESS_OPPORTUNITY")
  );
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

function collectLineageReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.ledger.entry.lineageReferences,
    ...bundle.lineage.ancestryChain.map((node) => node.lineageReference),
    ...bundle.lineage.evidencePath.lineageReferences,
    ...bundle.verification.evidencePath.lineageReferences,
    ...bundle.audit.evidencePath.lineageReferences,
    ...bundle.readinessCertification.evidencePath.lineageReferences,
    ...bundle.replayFramework.evidencePath.lineageReferences,
  ]);
}

function collectReplayReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.replayEvidence.replayReferences,
    ...bundle.replay.evidencePath.evidenceIds,
    ...bundle.governanceReplay.evidencePath.replayReferences,
    ...bundle.replayFramework.evidencePath.replayReferences,
    ...bundle.readinessCertification.evidencePath.replayReferences,
  ]);
}

function collectReadinessReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.readiness.evidencePath.evidenceReferences,
    ...bundle.alignment.evidencePath.alignmentReferences,
    ...bundle.reviewPacket.evidencePath.evidenceReferences,
    ...bundle.readinessCertification.evidencePath.evidenceReferences,
  ]);
}

function collectEvidenceHashes(bundle: RecommendationPortfolioBundle): string[] {
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
    bundle.authorityScope.result.authorityHash,
    bundle.policyVisibility.result.policyHash,
    bundle.governanceReplay.result.replayHash,
    bundle.governanceCertification.result.certificationHash,
    bundle.readiness.result.readinessHash,
    bundle.alignment.result.alignmentHash,
    bundle.reviewPacket.result.packetHash,
    bundle.replayFramework.result.replayHash,
    bundle.readinessCertification.result.certificationHash,
    bundle.governanceReferences.governanceHash,
    bundle.ownershipEvidence.ownershipHash,
    bundle.replayEvidence.replayHash,
  ]);
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

function certificationLikeState(value: string | undefined): "PASS" | "CONDITIONAL_PASS" | "FAIL" | "UNKNOWN" {
  if (value === "PASS" || value === "CONDITIONAL_PASS" || value === "FAIL") return value;
  return "UNKNOWN";
}

function firstReference(values: readonly string[]): string {
  return values[0] ?? "";
}

function externalReplayCorrupted(input: RecommendationOpportunityFoundationInput): boolean {
  return (
    input.dependencyRiskReplay.result.replayState === "INVALID"
    || input.dependencyRiskReplay.result.replayState === "ESCALATED"
    || input.dependencyReplay.result.replayState === "INVALID"
    || input.dependencyReplay.result.replayState === "ESCALATED"
    || input.impactReplay.result.replayState === "INVALID"
    || input.impactReplay.result.replayState === "ESCALATED"
    || input.trustReplay.result.replayState === "INVALID"
    || input.trustReplay.result.replayState === "ESCALATED"
    || input.driftReplay.result.replayState === "INVALID"
    || input.driftReplay.result.replayState === "ESCALATED"
    || input.resilienceReplay.result.replayState === "INVALID"
    || input.resilienceReplay.result.replayState === "ESCALATED"
    || input.portfolioReplay.result.replayState === "INVALID"
    || input.portfolioReplay.result.replayState === "ESCALATED"
  );
}

function externalGovernanceCorrupted(input: RecommendationOpportunityFoundationInput): boolean {
  return (
    input.dependencyRiskCertification.result.governanceCertified !== true
    || input.dependencyCertification.result.governanceCertified !== true
    || input.impactCertification.result.governanceCertified !== true
    || input.trustCertification.result.governanceCertified !== true
    || input.driftCertification.result.governanceCertified !== true
    || input.resilienceCertification.result.governanceCertified !== true
    || input.portfolioCertification.result.governanceCertified !== true
  );
}

function domainStateFromCertification(
  certificationState: "PASS" | "CONDITIONAL_PASS" | "FAIL" | "UNKNOWN",
  limited: boolean,
): RecommendationOpportunityState {
  if (certificationState === "FAIL") return "UNSUPPORTED";
  if (limited) return "LIMITED";
  if (certificationState === "CONDITIONAL_PASS") return "CONDITIONALLY_SUPPORTED";
  if (certificationState === "UNKNOWN") return "UNKNOWN";
  return "SUPPORTED";
}

function reasonForState(
  type: RecommendationOpportunityType,
  state: RecommendationOpportunityState,
): RecommendationOpportunityFoundationReasonCode {
  if (type === "GOVERNANCE_OPPORTUNITY") {
    return state === "SUPPORTED"
      ? "GOVERNANCE_OPPORTUNITY_SUPPORTED"
      : state === "CONDITIONALLY_SUPPORTED"
        ? "GOVERNANCE_OPPORTUNITY_CONDITIONAL"
        : state === "LIMITED"
          ? "GOVERNANCE_OPPORTUNITY_LIMITED"
          : "GOVERNANCE_OPPORTUNITY_UNSUPPORTED";
  }
  if (type === "DEPENDENCY_OPPORTUNITY") {
    return state === "SUPPORTED"
      ? "DEPENDENCY_OPPORTUNITY_SUPPORTED"
      : state === "CONDITIONALLY_SUPPORTED"
        ? "DEPENDENCY_OPPORTUNITY_CONDITIONAL"
        : state === "LIMITED"
          ? "DEPENDENCY_OPPORTUNITY_LIMITED"
          : "DEPENDENCY_OPPORTUNITY_UNSUPPORTED";
  }
  if (type === "IMPACT_OPPORTUNITY") {
    return state === "SUPPORTED"
      ? "IMPACT_OPPORTUNITY_SUPPORTED"
      : state === "CONDITIONALLY_SUPPORTED"
        ? "IMPACT_OPPORTUNITY_CONDITIONAL"
        : state === "LIMITED"
          ? "IMPACT_OPPORTUNITY_LIMITED"
          : "IMPACT_OPPORTUNITY_UNSUPPORTED";
  }
  if (type === "PORTFOLIO_OPPORTUNITY") {
    return state === "SUPPORTED"
      ? "PORTFOLIO_OPPORTUNITY_SUPPORTED"
      : state === "CONDITIONALLY_SUPPORTED"
        ? "PORTFOLIO_OPPORTUNITY_CONDITIONAL"
        : state === "LIMITED"
          ? "PORTFOLIO_OPPORTUNITY_LIMITED"
          : "PORTFOLIO_OPPORTUNITY_UNSUPPORTED";
  }
  if (type === "TRUST_OPPORTUNITY") {
    return state === "SUPPORTED"
      ? "TRUST_OPPORTUNITY_SUPPORTED"
      : state === "CONDITIONALLY_SUPPORTED"
        ? "TRUST_OPPORTUNITY_CONDITIONAL"
        : state === "LIMITED"
          ? "TRUST_OPPORTUNITY_LIMITED"
          : "TRUST_OPPORTUNITY_UNSUPPORTED";
  }
  if (type === "RESILIENCE_OPPORTUNITY") {
    return state === "SUPPORTED"
      ? "RESILIENCE_OPPORTUNITY_SUPPORTED"
      : state === "CONDITIONALLY_SUPPORTED"
        ? "RESILIENCE_OPPORTUNITY_CONDITIONAL"
        : state === "LIMITED"
          ? "RESILIENCE_OPPORTUNITY_LIMITED"
          : "RESILIENCE_OPPORTUNITY_UNSUPPORTED";
  }
  return state === "SUPPORTED"
    ? "READINESS_OPPORTUNITY_SUPPORTED"
    : state === "CONDITIONALLY_SUPPORTED"
      ? "READINESS_OPPORTUNITY_CONDITIONAL"
      : state === "LIMITED"
        ? "READINESS_OPPORTUNITY_LIMITED"
        : "READINESS_OPPORTUNITY_UNSUPPORTED";
}

function resolveOpportunityState(
  input: RecommendationOpportunityFoundationInput,
  bundle: RecommendationPortfolioBundle,
  type: RecommendationOpportunityType,
  evidenceReference: string,
  governanceReference: string,
  lineageReference: string,
  replayReference: string,
): RecommendationOpportunityState {
  if (
    evidenceReference.length === 0
    || governanceReference.length === 0
    || lineageReference.length === 0
    || replayReference.length === 0
  ) return "UNKNOWN";

  if (externalGovernanceCorrupted(input) || !governanceIntegrity(bundle)) return "UNSUPPORTED";
  if (externalReplayCorrupted(input) || !replayIntegrity(bundle)) return "UNSUPPORTED";

  if (type === "GOVERNANCE_OPPORTUNITY") {
    return domainStateFromCertification(
      certificationLikeState(bundle.governanceCertification.result.certificationState),
      bundle.binding.result.bindingState !== "BOUND",
    );
  }

  if (type === "DEPENDENCY_OPPORTUNITY") {
    return domainStateFromCertification(
      certificationLikeState(input.dependencyCertification.result.certificationState),
      input.dependencyRiskFoundation.result.dependencyRiskState === "HIGH"
        || input.dependencyRiskFoundation.result.dependencyRiskState === "MODERATE"
        || input.dependencyFoundation.result.dependencyState === "LIMITED",
    );
  }

  if (type === "IMPACT_OPPORTUNITY") {
    return domainStateFromCertification(
      certificationLikeState(input.impactCertification.result.certificationState),
      input.impactFoundation.result.impactState === "LIMITED",
    );
  }

  if (type === "PORTFOLIO_OPPORTUNITY") {
    return domainStateFromCertification(
      certificationLikeState(input.portfolioCertification.result.certificationState),
      input.portfolio.result.portfolioState === "LIMITED"
        || input.relationshipAnalysis.result.relationshipState === "LIMITED",
    );
  }

  if (type === "TRUST_OPPORTUNITY") {
    return domainStateFromCertification(
      certificationLikeState(input.trustCertification.result.certificationState),
      input.trustFoundation.result.trustState === "DEGRADED",
    );
  }

  if (type === "RESILIENCE_OPPORTUNITY") {
    return domainStateFromCertification(
      certificationLikeState(input.resilienceCertification.result.certificationState),
      input.resilienceFoundation.result.resilienceState === "DEGRADED",
    );
  }

  if (bundle.readiness.result.readinessState === "NOT_READY" || bundle.alignment.result.alignmentState === "MISALIGNED") {
    return "UNSUPPORTED";
  }
  if (
    bundle.readiness.result.readinessState === "OBSERVE"
    || bundle.alignment.result.alignmentState === "OBSERVE"
  ) return "UNKNOWN";
  if (
    bundle.readiness.result.readinessState === "LIMITED"
    || bundle.alignment.result.alignmentState === "PARTIALLY_ALIGNED"
  ) return "LIMITED";
  return domainStateFromCertification(
    certificationLikeState(bundle.readinessCertification.result.certificationState),
    false,
  );
}

function createOpportunityRecord(
  input: RecommendationOpportunityFoundationInput,
  bundle: RecommendationPortfolioBundle,
  type: RecommendationOpportunityType,
  reasons: RecommendationOpportunityFoundationReasonCode[],
): RecommendationOpportunity {
  const recommendationIdValue = recommendationId(bundle);
  const governanceReferences = collectGovernanceReferences(bundle);
  const lineageReferences = collectLineageReferences(bundle);
  const replayReferences = collectReplayReferences(bundle);
  const readinessReferences = collectReadinessReferences(bundle);

  const evidenceReference = type === "GOVERNANCE_OPPORTUNITY"
    ? firstReference(governanceReferences)
    : type === "DEPENDENCY_OPPORTUNITY"
      ? firstReference(input.dependencyRiskFoundation.evidencePath.dependencyRiskReferences)
      : type === "IMPACT_OPPORTUNITY"
        ? firstReference(input.impactCertification.evidencePath.impactReferences)
        : type === "PORTFOLIO_OPPORTUNITY"
          ? firstReference(input.portfolio.evidencePath.governanceReferences)
          : type === "TRUST_OPPORTUNITY"
            ? firstReference(input.trustFoundation.evidencePath.trustReferences)
            : type === "RESILIENCE_OPPORTUNITY"
              ? firstReference(input.resilienceFoundation.evidencePath.resilienceReferences)
              : firstReference(readinessReferences);

  const governanceReference = firstReference(governanceReferences);
  const lineageReference = firstReference(lineageReferences);
  const replayReference = firstReference(replayReferences);
  const opportunityState = resolveOpportunityState(
    input,
    bundle,
    type,
    evidenceReference,
    governanceReference,
    lineageReference,
    replayReference,
  );
  addReason(reasons, reasonForState(type, opportunityState));

  const opportunityId = hashOpportunityValue("recommendation-opportunity-id", {
    recommendationId: recommendationIdValue,
    opportunityType: type,
  });
  const opportunityHash = hashOpportunityValue("recommendation-opportunity-record", {
    recommendationId: recommendationIdValue,
    opportunityType: type,
    evidenceReference,
    governanceReference,
    lineageReference,
    replayReference,
    opportunityState,
  });

  return Object.freeze({
    opportunityId,
    recommendationId: recommendationIdValue,
    opportunityType: type,
    evidenceReference,
    governanceReference,
    lineageReference,
    replayReference,
    opportunityState,
    opportunityHash,
  });
}

function createOpportunityRecords(
  input: RecommendationOpportunityFoundationInput,
  reasons: RecommendationOpportunityFoundationReasonCode[],
): RecommendationOpportunity[] {
  const bundles = bundleMap(input);
  const records: RecommendationOpportunity[] = [];
  for (const recommendationIdValue of normalizeStrings(input.request.recommendationIds)) {
    const bundle = bundles.get(recommendationIdValue);
    if (!bundle) continue;
    for (const type of OPPORTUNITY_TYPES) {
      if (!includesScope(input.request.opportunityScope, type)) continue;
      records.push(createOpportunityRecord(input, bundle, type, reasons));
    }
  }
  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.opportunityType.localeCompare(right.opportunityType)
    || left.opportunityId.localeCompare(right.opportunityId)
  ));
}

function validateRecommendationIds(
  request: RecommendationOpportunityFoundationRequest,
  reasons: RecommendationOpportunityFoundationReasonCode[],
): boolean {
  const valid = request.recommendationIds.length > 0;
  addReason(reasons, valid ? "RECOMMENDATION_IDS_PRESENT" : "RECOMMENDATION_IDS_MISSING");
  return valid;
}

function validateScope(scope: RecommendationOpportunityScope, reasons: RecommendationOpportunityFoundationReasonCode[]): boolean {
  const valid = OPPORTUNITY_SCOPES.includes(scope);
  addReason(reasons, valid ? "OPPORTUNITY_SCOPE_VALID" : "OPPORTUNITY_SCOPE_INVALID");
  return valid;
}

function validateSealedArtifacts(
  input: RecommendationOpportunityFoundationInput,
  reasons: RecommendationOpportunityFoundationReasonCode[],
): boolean {
  const sealed = input.dependencyRiskFoundation.sealed === true
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
  const flags: ReadonlyArray<readonly [boolean, RecommendationOpportunityFoundationReasonCode, RecommendationOpportunityFoundationReasonCode]> = [
    [input.dependencyRiskFoundation.sealed === true, "DEPENDENCY_RISK_FOUNDATION_REQUIRED", "DEPENDENCY_RISK_FOUNDATION_UNSEALED"],
    [input.dependencyRiskReplay.sealed === true, "DEPENDENCY_RISK_REPLAY_REQUIRED", "DEPENDENCY_RISK_REPLAY_UNSEALED"],
    [input.dependencyRiskCertification.sealed === true, "DEPENDENCY_RISK_CERTIFICATION_REQUIRED", "DEPENDENCY_RISK_CERTIFICATION_UNSEALED"],
    [input.dependencyFoundation.sealed === true, "DEPENDENCY_FOUNDATION_REQUIRED", "DEPENDENCY_FOUNDATION_UNSEALED"],
    [input.dependencyReplay.sealed === true, "DEPENDENCY_REPLAY_REQUIRED", "DEPENDENCY_REPLAY_UNSEALED"],
    [input.dependencyCertification.sealed === true, "DEPENDENCY_CERTIFICATION_REQUIRED", "DEPENDENCY_CERTIFICATION_UNSEALED"],
    [input.impactFoundation.sealed === true, "IMPACT_FOUNDATION_REQUIRED", "IMPACT_FOUNDATION_UNSEALED"],
    [input.impactReplay.sealed === true, "IMPACT_REPLAY_REQUIRED", "IMPACT_REPLAY_UNSEALED"],
    [input.impactCertification.sealed === true, "IMPACT_CERTIFICATION_REQUIRED", "IMPACT_CERTIFICATION_UNSEALED"],
    [input.trustFoundation.sealed === true, "TRUST_FOUNDATION_REQUIRED", "TRUST_FOUNDATION_UNSEALED"],
    [input.trustReplay.sealed === true, "TRUST_REPLAY_REQUIRED", "TRUST_REPLAY_UNSEALED"],
    [input.trustCertification.sealed === true, "TRUST_CERTIFICATION_REQUIRED", "TRUST_CERTIFICATION_UNSEALED"],
    [input.driftFoundation.sealed === true, "DRIFT_FOUNDATION_REQUIRED", "DRIFT_FOUNDATION_UNSEALED"],
    [input.driftReplay.sealed === true, "DRIFT_REPLAY_REQUIRED", "DRIFT_REPLAY_UNSEALED"],
    [input.driftCertification.sealed === true, "DRIFT_CERTIFICATION_REQUIRED", "DRIFT_CERTIFICATION_UNSEALED"],
    [input.resilienceFoundation.sealed === true, "RESILIENCE_FOUNDATION_REQUIRED", "RESILIENCE_FOUNDATION_UNSEALED"],
    [input.resilienceReplay.sealed === true, "RESILIENCE_REPLAY_REQUIRED", "RESILIENCE_REPLAY_UNSEALED"],
    [input.resilienceCertification.sealed === true, "RESILIENCE_CERTIFICATION_REQUIRED", "RESILIENCE_CERTIFICATION_UNSEALED"],
    [input.portfolio.sealed === true, "PORTFOLIO_REQUIRED", "PORTFOLIO_UNSEALED"],
    [input.relationshipAnalysis.sealed === true, "PORTFOLIO_ANALYSIS_REQUIRED", "PORTFOLIO_ANALYSIS_UNSEALED"],
    [input.portfolioReplay.sealed === true, "PORTFOLIO_REPLAY_REQUIRED", "PORTFOLIO_REPLAY_UNSEALED"],
    [input.portfolioCertification.sealed === true, "PORTFOLIO_CERTIFICATION_REQUIRED", "PORTFOLIO_CERTIFICATION_UNSEALED"],
  ];
  for (const [present, okReason, failReason] of flags) addReason(reasons, present ? okReason : failReason);
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(
  input: RecommendationOpportunityFoundationInput,
  reasons: RecommendationOpportunityFoundationReasonCode[],
): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.dependencyRiskFoundation.result.tenantIsolationVerified
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
      && bundle.governanceReferences.tenantId === tenantId
      && bundle.ownershipEvidence.tenantId === tenantId
      && bundle.replayEvidence.tenantId === tenantId
      && bundle.readinessCertification.result.tenantIsolationVerified
      && bundle.observabilityCertification.result.tenantIsolationVerified
      && bundle.governanceCertification.result.tenantIsolationVerified
    ));
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_OPPORTUNITY_BLOCKED");
  return valid;
}

function validateOwnership(
  input: RecommendationOpportunityFoundationInput,
  reasons: RecommendationOpportunityFoundationReasonCode[],
): boolean {
  const valid = orderedBundles(input).every((bundle) => (
    bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
    && bundle.ownershipEvidence.ownershipReferences.length > 0
  ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateEvidencePresence(
  input: RecommendationOpportunityFoundationInput,
  reasons: RecommendationOpportunityFoundationReasonCode[],
): boolean {
  const bundles = orderedBundles(input);
  const evidencePresent = bundles.every((bundle) => (
    collectReadinessReferences(bundle).length > 0
    && collectGovernanceReferences(bundle).length > 0
    && collectLineageReferences(bundle).length > 0
    && collectReplayReferences(bundle).length > 0
  ));
  addReason(reasons, evidencePresent ? "OPPORTUNITY_EVIDENCE_PRESENT" : "OPPORTUNITY_EVIDENCE_MISSING");
  addReason(reasons, bundles.every((bundle) => collectGovernanceReferences(bundle).length > 0) ? "GOVERNANCE_REFERENCES_PRESENT" : "GOVERNANCE_REFERENCES_MISSING");
  addReason(reasons, bundles.every((bundle) => collectLineageReferences(bundle).length > 0) ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, bundles.every((bundle) => collectReplayReferences(bundle).length > 0) ? "REPLAY_REFERENCES_PRESENT" : "REPLAY_REFERENCES_MISSING");
  return evidencePresent;
}

function validateBoundary(
  input: RecommendationOpportunityFoundationInput,
  reasons: RecommendationOpportunityFoundationReasonCode[],
): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const scoringAbsent = input.recommendationScoringRequested !== true;
  const resourceAllocationAbsent = input.resourceAllocationRequested !== true;
  const controlSurfaceAbsent = !input.dependencyRiskFoundation.controlSurfacePresent
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
  addReason(reasons, input.recommendationRankingRequested === true ? "RANKING_DETECTED" : "RANKING_BLOCKED");
  addReason(reasons, input.approvalRequested === true ? "APPROVAL_DETECTED" : "APPROVAL_BLOCKED");
  addReason(reasons, scoringAbsent ? "SCORING_ABSENT" : "SCORING_DETECTED");
  addReason(reasons, resourceAllocationAbsent ? "RESOURCE_ALLOCATION_ABSENT" : "RESOURCE_ALLOCATION_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.opportunityMutationAttempted === true ? "OPPORTUNITY_MUTATION_DETECTED" : "OPPORTUNITY_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  return Object.freeze({
    executionImpossible,
    authorityBounded,
    scoringAbsent,
    resourceAllocationAbsent,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || input.prioritizationRequested === true
      || input.recommendationRankingRequested === true
      || input.approvalRequested === true
      || !scoringAbsent
      || !resourceAllocationAbsent
      || !authorityBounded
      || input.opportunityMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createRecommendationOpportunityEvidencePath(
  input: RecommendationOpportunityFoundationInput,
  opportunities: readonly RecommendationOpportunity[],
): RecommendationOpportunityEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.opportunityScope,
    opportunityReferences: normalizeStrings(opportunities.map((opportunity) => opportunity.opportunityId)),
    governanceReferences: normalizeStrings([
      ...input.dependencyRiskFoundation.evidencePath.governanceReferences,
      ...input.dependencyCertification.evidencePath.governanceReferences,
      ...input.trustCertification.evidencePath.governanceReferences,
      ...input.driftCertification.evidencePath.governanceReferences,
      ...input.resilienceCertification.evidencePath.governanceReferences,
      ...bundles.flatMap(collectGovernanceReferences),
    ]),
    lineageReferences: normalizeStrings(bundles.flatMap(collectLineageReferences)),
    replayReferences: normalizeStrings([
      ...input.dependencyRiskFoundation.evidencePath.replayReferences,
      ...input.dependencyRiskReplay.evidencePath.replayReferences,
      ...input.dependencyReplay.evidencePath.replayReferences,
      ...input.impactReplay.evidencePath.replayReferences,
      ...input.trustReplay.evidencePath.replayReferences,
      ...input.driftReplay.evidencePath.replayReferences,
      ...input.resilienceReplay.evidencePath.replayReferences,
      ...input.portfolioReplay.evidencePath.replayReferences,
      ...bundles.flatMap(collectReplayReferences),
    ]),
    dependencyRiskReferences: normalizeStrings([
      ...input.dependencyRiskFoundation.evidencePath.dependencyRiskReferences,
      ...input.dependencyRiskReplay.evidencePath.dependencyRiskReferences,
    ]),
    dependencyReferences: normalizeStrings([
      ...input.dependencyFoundation.evidencePath.dependencyReferences,
      ...input.dependencyCertification.evidencePath.dependencyReferences,
    ]),
    impactReferences: normalizeStrings([
      ...input.impactFoundation.evidencePath.impactReferences,
      ...input.impactReplay.evidencePath.impactReferences,
      ...input.impactCertification.evidencePath.impactReferences,
    ]),
    portfolioReferences: normalizeStrings([
      ...input.portfolio.evidencePath.governanceReferences,
      ...input.relationshipAnalysis.evidencePath.relationshipReferences,
      ...input.portfolioReplay.evidencePath.portfolioReferences,
      ...input.portfolioCertification.evidencePath.portfolioReferences,
    ]),
    trustReferences: normalizeStrings([
      ...input.trustFoundation.evidencePath.trustReferences,
      ...input.trustReplay.evidencePath.trustReferences,
      ...input.trustCertification.evidencePath.trustReferences,
    ]),
    resilienceReferences: normalizeStrings([
      ...input.resilienceFoundation.evidencePath.resilienceReferences,
      ...input.resilienceReplay.evidencePath.resilienceReferences,
      ...input.resilienceCertification.evidencePath.resilienceReferences,
    ]),
    readinessReferences: normalizeStrings(bundles.flatMap(collectReadinessReferences)),
    evidenceHashes: normalizeStrings([
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
      ...opportunities.map((opportunity) => opportunity.opportunityHash),
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  recommendationCount: number,
  opportunityCount: number,
  lineageReferenceCount: number,
  replayReferenceCount: number,
  governanceReferenceCount: number,
  reasons: RecommendationOpportunityFoundationReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_RECOMMENDATIONS
    && opportunityCount <= MAX_OPPORTUNITY_RECORDS
    && lineageReferenceCount <= MAX_LINEAGE_REFERENCES
    && replayReferenceCount <= MAX_REPLAY_REFERENCES
    && governanceReferenceCount <= MAX_GOVERNANCE_REFERENCES;
  addReason(reasons, recommendationCount <= MAX_RECOMMENDATIONS ? "RECOMMENDATION_LIMIT_VALID" : "RECOMMENDATION_LIMIT_EXCEEDED");
  addReason(reasons, opportunityCount <= MAX_OPPORTUNITY_RECORDS ? "OPPORTUNITY_RECORD_LIMIT_VALID" : "OPPORTUNITY_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, lineageReferenceCount <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, governanceReferenceCount <= MAX_GOVERNANCE_REFERENCES ? "GOVERNANCE_REFERENCE_LIMIT_VALID" : "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function deriveOpportunityState(
  input: RecommendationOpportunityFoundationInput,
  opportunities: readonly RecommendationOpportunity[],
  reasons: RecommendationOpportunityFoundationReasonCode[],
): RecommendationOpportunityState {
  const states = opportunities.map((opportunity) => opportunity.opportunityState);
  if (
    reasons.includes("OWNERSHIP_MISMATCH")
    || reasons.includes("CROSS_TENANT_OPPORTUNITY_BLOCKED")
    || reasons.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || reasons.includes("REPLAY_CORRUPTION_DETECTED")
    || input.authorityExpansionDetected === true
  ) return "UNSUPPORTED";
  if (
    states.includes("UNKNOWN")
    || reasons.includes("OPPORTUNITY_EVIDENCE_MISSING")
    || reasons.includes("GOVERNANCE_REFERENCES_MISSING")
    || reasons.includes("LINEAGE_REFERENCES_MISSING")
    || reasons.includes("REPLAY_REFERENCES_MISSING")
  ) return "UNKNOWN";
  if (states.includes("UNSUPPORTED")) return "UNSUPPORTED";
  if (states.includes("LIMITED")) {
    addReason(reasons, "OPPORTUNITY_EVIDENCE_GAPS_DETECTED");
    return "LIMITED";
  }
  if (states.includes("CONDITIONALLY_SUPPORTED")) {
    addReason(reasons, "BOUNDED_OPPORTUNITY_LIMITATIONS_DETECTED");
    return "CONDITIONALLY_SUPPORTED";
  }
  return "SUPPORTED";
}

function buildResult(
  request: RecommendationOpportunityFoundationRequest,
  opportunityState: RecommendationOpportunityState,
  opportunities: readonly RecommendationOpportunity[],
  tenantIsolationVerified: boolean,
  opportunityGraphHash: string,
): RecommendationOpportunityFoundationResult {
  return Object.freeze({
    tenantId: request.tenantId,
    opportunityState,
    opportunitiesCreated: opportunities.length,
    governanceOpportunitiesDetected: opportunities.filter((opportunity) => opportunity.opportunityType === "GOVERNANCE_OPPORTUNITY").length,
    dependencyOpportunitiesDetected: opportunities.filter((opportunity) => opportunity.opportunityType === "DEPENDENCY_OPPORTUNITY").length,
    impactOpportunitiesDetected: opportunities.filter((opportunity) => opportunity.opportunityType === "IMPACT_OPPORTUNITY").length,
    portfolioOpportunitiesDetected: opportunities.filter((opportunity) => opportunity.opportunityType === "PORTFOLIO_OPPORTUNITY").length,
    trustOpportunitiesDetected: opportunities.filter((opportunity) => opportunity.opportunityType === "TRUST_OPPORTUNITY").length,
    resilienceOpportunitiesDetected: opportunities.filter((opportunity) => opportunity.opportunityType === "RESILIENCE_OPPORTUNITY").length,
    readinessOpportunitiesDetected: opportunities.filter((opportunity) => opportunity.opportunityType === "READINESS_OPPORTUNITY").length,
    tenantIsolationVerified,
    opportunityGraphHash,
    deterministic: true,
  });
}

function buildObservability(result: RecommendationOpportunityFoundationResult): RecommendationOpportunityFoundationObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    opportunityState: result.opportunityState,
    opportunitiesCreated: result.opportunitiesCreated,
    governanceOpportunitiesDetected: result.governanceOpportunitiesDetected,
    dependencyOpportunitiesDetected: result.dependencyOpportunitiesDetected,
    impactOpportunitiesDetected: result.impactOpportunitiesDetected,
    portfolioOpportunitiesDetected: result.portfolioOpportunitiesDetected,
    trustOpportunitiesDetected: result.trustOpportunitiesDetected,
    resilienceOpportunitiesDetected: result.resilienceOpportunitiesDetected,
    readinessOpportunitiesDetected: result.readinessOpportunitiesDetected,
    opportunityGraphHash: result.opportunityGraphHash,
  });
}

function buildValidation(
  opportunityState: RecommendationOpportunityState,
  reasonCodes: readonly RecommendationOpportunityFoundationReasonCode[],
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    opportunitiesCreated: number;
    lineageReferenceCount: number;
    replayReferenceCount: number;
    governanceReferenceCount: number;
  }>,
): RecommendationOpportunityFoundationValidation {
  return Object.freeze({
    valid: opportunityState !== "UNSUPPORTED",
    opportunityState,
    reasonCodes: [...reasonCodes],
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    scoringAbsent: boundary.scoringAbsent,
    resourceAllocationAbsent: boundary.resourceAllocationAbsent,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
    ...counts,
  });
}

export function buildRecommendationOpportunityFoundationRequest(
  request: RecommendationOpportunityFoundationRequest,
): RecommendationOpportunityFoundationRequest {
  return requestCore(request);
}

export function sealRecommendationOpportunityFoundation(
  input: RecommendationOpportunityFoundationInput,
): SealedRecommendationOpportunityFoundationRecord {
  const reasons: RecommendationOpportunityFoundationReasonCode[] = [];
  const requestValid = validateRecommendationIds(input.request, reasons)
    && validateScope(input.request.opportunityScope, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const evidenceValid = validateEvidencePresence(input, reasons);
  const boundary = validateBoundary(input, reasons);

  if (externalGovernanceCorrupted(input)) addReason(reasons, "GOVERNANCE_CORRUPTION_DETECTED");
  if (externalReplayCorrupted(input)) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");

  const opportunities = createOpportunityRecords(input, reasons);
  const evidencePath = createRecommendationOpportunityEvidencePath(input, opportunities);
  const limitsValid = validateLimits(
    normalizeStrings(input.request.recommendationIds).length,
    opportunities.length,
    evidencePath.lineageReferences.length,
    evidencePath.replayReferences.length,
    evidencePath.governanceReferences.length,
    reasons,
  );
  addReason(reasons, "RECOMMENDATION_OPPORTUNITY_FOUNDATION_IS_NOT_CONTROL");

  const opportunityState = !requestValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || boundary.invalidBoundary
    || !limitsValid
    ? "UNSUPPORTED"
    : !evidenceValid
      ? "UNKNOWN"
      : deriveOpportunityState(input, opportunities, reasons);

  const opportunityGraphHash = hashOpportunityValue("recommendation-opportunity-foundation", {
    request: requestCore(input.request),
    opportunityState,
    opportunityReferences: evidencePath.opportunityReferences,
    governanceReferences: evidencePath.governanceReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    dependencyRiskReferences: evidencePath.dependencyRiskReferences,
    dependencyReferences: evidencePath.dependencyReferences,
    impactReferences: evidencePath.impactReferences,
    portfolioReferences: evidencePath.portfolioReferences,
    trustReferences: evidencePath.trustReferences,
    resilienceReferences: evidencePath.resilienceReferences,
    readinessReferences: evidencePath.readinessReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    opportunityState,
    opportunities,
    tenantIsolationVerified,
    opportunityGraphHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    opportunityState,
    reasons,
    ownershipValid,
    tenantIsolationVerified,
    boundary,
    Object.freeze({
      opportunitiesCreated: opportunities.length,
      lineageReferenceCount: evidencePath.lineageReferences.length,
      replayReferenceCount: evidencePath.replayReferences.length,
      governanceReferenceCount: evidencePath.governanceReferences.length,
    }),
  );

  return Object.freeze({
    result,
    opportunities,
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    opportunityOnly: true,
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
