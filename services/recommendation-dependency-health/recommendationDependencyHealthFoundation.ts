import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  DependencyHealthState,
  DependencyHealthType,
  RecommendationDependencyHealth,
  RecommendationDependencyHealthEvidencePath,
  RecommendationDependencyHealthFoundationInput,
  RecommendationDependencyHealthFoundationObservability,
  RecommendationDependencyHealthFoundationReasonCode,
  RecommendationDependencyHealthFoundationRequest,
  RecommendationDependencyHealthFoundationResult,
  RecommendationDependencyHealthScope,
  SealedRecommendationDependencyHealthFoundationRecord,
} from "./types";

const MAX_RECOMMENDATIONS = 10_000;
const MAX_DEPENDENCY_HEALTH_RECORDS = 50_000;
const MAX_LINEAGE_REFERENCES = 10_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_GOVERNANCE_REFERENCES = 10_000;

const HEALTH_SCOPES: readonly RecommendationDependencyHealthScope[] = Object.freeze([
  "STABILITY",
  "AVAILABILITY",
  "CONTINUITY",
  "RECOVERABILITY",
  "DEGRADATION",
  "RISK",
  "OBSERVABILITY",
  "FULL",
]);

const HEALTH_TYPES: readonly DependencyHealthType[] = Object.freeze([
  "DEPENDENCY_STABILITY",
  "DEPENDENCY_AVAILABILITY",
  "DEPENDENCY_CONTINUITY",
  "DEPENDENCY_RECOVERABILITY",
  "DEPENDENCY_DEGRADATION",
  "DEPENDENCY_RISK",
  "DEPENDENCY_OBSERVABILITY",
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
  reasons: RecommendationDependencyHealthFoundationReasonCode[],
  reason: RecommendationDependencyHealthFoundationReasonCode,
): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashHealthValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(
  request: RecommendationDependencyHealthFoundationRequest,
): RecommendationDependencyHealthFoundationRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    recommendationIds: [...request.recommendationIds],
    healthScope: request.healthScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: RecommendationDependencyHealthFoundationInput): RecommendationPortfolioBundle[] {
  return [...input.recommendations].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function bundleMap(input: RecommendationDependencyHealthFoundationInput): Map<string, RecommendationPortfolioBundle> {
  return new Map(orderedBundles(input).map((bundle) => [recommendationId(bundle), bundle]));
}

function createBoundaryFlags(record: Record<string, unknown>): boolean {
  const blockedFlags = [
    "executionAuthorized",
    "workflowRoutingAllowed",
    "prioritizationAllowed",
    "recommendationRankingAllowed",
    "approvalAllowed",
    "recommendationScoringAllowed",
    "resourceAllocationAllowed",
    "authorityMutationAllowed",
    "controlSurfacePresent",
  ] as const;
  return blockedFlags.every((key) => record[key] !== true);
}

function includesScope(scope: RecommendationDependencyHealthScope, type: DependencyHealthType): boolean {
  if (scope === "FULL") return true;
  return (
    (scope === "STABILITY" && type === "DEPENDENCY_STABILITY")
    || (scope === "AVAILABILITY" && type === "DEPENDENCY_AVAILABILITY")
    || (scope === "CONTINUITY" && type === "DEPENDENCY_CONTINUITY")
    || (scope === "RECOVERABILITY" && type === "DEPENDENCY_RECOVERABILITY")
    || (scope === "DEGRADATION" && type === "DEPENDENCY_DEGRADATION")
    || (scope === "RISK" && type === "DEPENDENCY_RISK")
    || (scope === "OBSERVABILITY" && type === "DEPENDENCY_OBSERVABILITY")
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
    ...bundle.reviewPacket.evidencePath.lineageReferences,
    ...bundle.replayFramework.evidencePath.lineageReferences,
    ...bundle.readinessCertification.evidencePath.lineageReferences,
  ]);
}

function collectReplayReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.replayEvidence.replayReferences,
    ...bundle.replay.evidencePath.evidenceIds,
    ...bundle.governanceReplay.evidencePath.replayReferences,
    ...bundle.replayFramework.evidencePath.replayReferences,
    ...bundle.readiness.evidencePath.replayReferences,
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

function collectObservabilityReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    bundle.observability.result.observabilityHash,
    bundle.visibility.result.visibilityHash,
    bundle.audit.result.exportHash,
    bundle.observabilityCertification.result.certificationHash,
    bundle.governanceCertification.result.certificationHash,
    bundle.readinessCertification.result.certificationHash,
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
    bundle.observabilityCertification.result.certificationHash,
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
    && bundle.replayFramework.result.replayState !== "INVALID";
}

function firstReference(values: readonly string[]): string {
  return values[0] ?? "";
}

function externalReplayCorrupted(input: RecommendationDependencyHealthFoundationInput): boolean {
  return (
    input.constraintReplay.result.replayState === "INVALID"
    || input.constraintReplay.result.replayState === "ESCALATED"
    || input.opportunityReplay.result.replayState === "INVALID"
    || input.opportunityReplay.result.replayState === "ESCALATED"
    || input.dependencyRiskReplay.result.replayState === "INVALID"
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

function externalGovernanceCorrupted(input: RecommendationDependencyHealthFoundationInput): boolean {
  return (
    input.constraintCertification.result.governanceCertified !== true
    || input.opportunityCertification.result.governanceCertified !== true
    || input.dependencyRiskCertification.result.governanceCertified !== true
    || input.dependencyCertification.result.governanceCertified !== true
    || input.impactCertification.result.governanceCertified !== true
    || input.trustCertification.result.governanceCertified !== true
    || input.driftCertification.result.governanceCertified !== true
    || input.resilienceCertification.result.governanceCertified !== true
    || input.portfolioCertification.result.governanceCertified !== true
  );
}

function reasonForState(
  type: DependencyHealthType,
  state: DependencyHealthState,
): RecommendationDependencyHealthFoundationReasonCode {
  const prefix = type.replace("DEPENDENCY_", "");
  return `DEPENDENCY_${prefix}_${state}` as RecommendationDependencyHealthFoundationReasonCode;
}

function deriveDependencyReferences(
  input: RecommendationDependencyHealthFoundationInput,
  recommendationIdValue: string,
) {
  const dependencies = input.dependencyFoundation.dependencies.filter((dependency) => (
    dependency.sourceRecommendationId === recommendationIdValue
    || dependency.targetRecommendationId === recommendationIdValue
  ));
  return dependencies.sort((left, right) => left.dependencyId.localeCompare(right.dependencyId));
}

function resolveHealthState(
  input: RecommendationDependencyHealthFoundationInput,
  bundle: RecommendationPortfolioBundle,
  type: DependencyHealthType,
  evidenceReference: string,
  governanceReference: string,
  lineageReference: string,
  replayReference: string,
): DependencyHealthState {
  if (
    evidenceReference.length === 0
    || governanceReference.length === 0
    || lineageReference.length === 0
    || replayReference.length === 0
  ) return "UNKNOWN";

  if (
    externalGovernanceCorrupted(input)
    || externalReplayCorrupted(input)
    || !governanceIntegrity(bundle)
    || !replayIntegrity(bundle)
  ) return "UNHEALTHY";

  const dependencyState = input.dependencyFoundation.result.dependencyState;
  const dependencyRiskState = input.dependencyRiskFoundation.result.dependencyRiskState;
  const trustState = input.trustFoundation.result.trustState;
  const driftState = input.driftFoundation.result.driftState;
  const resilienceState = input.resilienceFoundation.result.resilienceState;
  const portfolioState = input.portfolio.result.portfolioState;

  if (type === "DEPENDENCY_RISK") {
    if (dependencyRiskState === "CRITICAL") return "UNHEALTHY";
    if (dependencyRiskState === "HIGH") return "AT_RISK";
    if (dependencyRiskState === "MODERATE") return "DEGRADED";
    if (dependencyRiskState === "UNKNOWN") return "UNKNOWN";
    return "HEALTHY";
  }

  if (type === "DEPENDENCY_OBSERVABILITY") {
    if (bundle.observabilityCertification.result.certificationState === "FAIL") return "UNHEALTHY";
    if (bundle.observabilityCertification.result.certificationState === "CONDITIONAL_PASS") return "DEGRADED";
    return "HEALTHY";
  }

  if (type === "DEPENDENCY_RECOVERABILITY") {
    if (resilienceState === "FRAGILE") return "UNHEALTHY";
    if (resilienceState === "UNKNOWN") return "UNKNOWN";
    if (resilienceState === "DEGRADED") return "AT_RISK";
    if (resilienceState === "CONDITIONALLY_RESILIENT") return "DEGRADED";
    return "HEALTHY";
  }

  if (type === "DEPENDENCY_DEGRADATION") {
    if (trustState === "UNTRUSTED" || driftState === "INVALID") return "UNHEALTHY";
    if (driftState === "OBSERVE" || trustState === "UNKNOWN") return "UNKNOWN";
    if (driftState === "DRIFT_DETECTED" && dependencyRiskState === "HIGH") return "AT_RISK";
    if (driftState === "DRIFT_DETECTED" || trustState === "DEGRADED") return "DEGRADED";
    return "HEALTHY";
  }

  if (type === "DEPENDENCY_CONTINUITY") {
    if (resilienceState === "FRAGILE") return "UNHEALTHY";
    if (resilienceState === "UNKNOWN") return "UNKNOWN";
    if (dependencyRiskState === "HIGH" || resilienceState === "DEGRADED") return "AT_RISK";
    if (portfolioState === "LIMITED" || resilienceState === "CONDITIONALLY_RESILIENT") return "DEGRADED";
    return "HEALTHY";
  }

  if (type === "DEPENDENCY_AVAILABILITY") {
    if (dependencyState === "INVALID" || portfolioState === "INVALID") return "UNHEALTHY";
    if (dependencyState === "OBSERVE" || portfolioState === "OBSERVE") return "UNKNOWN";
    if (dependencyRiskState === "HIGH") return "AT_RISK";
    if (dependencyRiskState === "MODERATE") return "DEGRADED";
    if (dependencyState === "LIMITED") return "STABLE";
    return "HEALTHY";
  }

  if (dependencyState === "INVALID" || dependencyRiskState === "CRITICAL" || trustState === "UNTRUSTED") return "UNHEALTHY";
  if (dependencyRiskState === "UNKNOWN" || trustState === "UNKNOWN" || driftState === "OBSERVE") return "UNKNOWN";
  if (dependencyRiskState === "HIGH" || driftState === "DRIFT_DETECTED") return "AT_RISK";
  if (dependencyRiskState === "MODERATE" || trustState === "DEGRADED") return "DEGRADED";
  if (dependencyState === "LIMITED" || trustState === "CONDITIONALLY_TRUSTED") return "STABLE";
  return "HEALTHY";
}

function createHealthRecord(
  input: RecommendationDependencyHealthFoundationInput,
  bundle: RecommendationPortfolioBundle,
  dependencyId: string,
  type: DependencyHealthType,
  reasons: RecommendationDependencyHealthFoundationReasonCode[],
): RecommendationDependencyHealth {
  const recommendationIdValue = recommendationId(bundle);
  const governanceReferences = collectGovernanceReferences(bundle);
  const lineageReferences = collectLineageReferences(bundle);
  const replayReferences = collectReplayReferences(bundle);
  const readinessReferences = collectReadinessReferences(bundle);
  const observabilityReferences = collectObservabilityReferences(bundle);

  const riskReference = firstReference(
    input.dependencyRiskFoundation.risks
      .filter((risk) => risk.recommendationId === recommendationIdValue && risk.dependencyId === dependencyId)
      .map((risk) => risk.dependencyRiskId),
  );

  const evidenceReference = type === "DEPENDENCY_STABILITY"
    ? dependencyId
    : type === "DEPENDENCY_AVAILABILITY"
      ? firstReference(input.opportunityFoundation.evidencePath.opportunityReferences)
      : type === "DEPENDENCY_CONTINUITY"
        ? firstReference(input.constraintFoundation.evidencePath.constraintReferences)
        : type === "DEPENDENCY_RECOVERABILITY"
          ? firstReference(input.resilienceFoundation.evidencePath.resilienceReferences)
          : type === "DEPENDENCY_DEGRADATION"
          ? firstReference(input.driftFoundation.evidencePath.driftReferences)
          : type === "DEPENDENCY_RISK"
            ? riskReference
            : firstReference(observabilityReferences);
  const normalizedEvidenceReference = evidenceReference.length > 0
    ? evidenceReference
    : dependencyId;
  const governanceReference = firstReference(governanceReferences);
  const lineageReference = firstReference(lineageReferences);
  const replayReference = firstReference(replayReferences);

  const healthState = resolveHealthState(
    input,
    bundle,
    type,
    normalizedEvidenceReference,
    governanceReference,
    lineageReference,
    replayReference,
  );
  addReason(reasons, reasonForState(type, healthState));

  const healthId = hashHealthValue("recommendation-dependency-health-id", {
    recommendationId: recommendationIdValue,
    dependencyId,
    healthType: type,
  });
  const healthHash = hashHealthValue("recommendation-dependency-health-record", {
    recommendationId: recommendationIdValue,
    dependencyId,
    healthType: type,
    evidenceReference: normalizedEvidenceReference,
    governanceReference,
    lineageReference,
    replayReference,
    readinessReferences,
    healthState,
  });

  return Object.freeze({
    healthId,
    recommendationId: recommendationIdValue,
    dependencyId,
    healthType: type,
    evidenceReference,
    governanceReference,
    lineageReference,
    replayReference,
    healthState,
    healthHash,
  });
}

function createHealthRecords(
  input: RecommendationDependencyHealthFoundationInput,
  reasons: RecommendationDependencyHealthFoundationReasonCode[],
): RecommendationDependencyHealth[] {
  const bundles = bundleMap(input);
  const records: RecommendationDependencyHealth[] = [];

  for (const recommendationIdValue of normalizeStrings(input.request.recommendationIds)) {
    const bundle = bundles.get(recommendationIdValue);
    if (!bundle) continue;
    for (const dependency of deriveDependencyReferences(input, recommendationIdValue)) {
      for (const type of HEALTH_TYPES) {
        if (!includesScope(input.request.healthScope, type)) continue;
        records.push(createHealthRecord(input, bundle, dependency.dependencyId, type, reasons));
      }
    }
  }

  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.dependencyId.localeCompare(right.dependencyId)
    || left.healthType.localeCompare(right.healthType)
    || left.healthId.localeCompare(right.healthId)
  ));
}

function validateRecommendationIds(
  request: RecommendationDependencyHealthFoundationRequest,
  reasons: RecommendationDependencyHealthFoundationReasonCode[],
): boolean {
  const valid = request.recommendationIds.length > 0;
  addReason(reasons, valid ? "RECOMMENDATION_IDS_PRESENT" : "RECOMMENDATION_IDS_MISSING");
  return valid;
}

function validateScope(
  scope: RecommendationDependencyHealthScope,
  reasons: RecommendationDependencyHealthFoundationReasonCode[],
): boolean {
  const valid = HEALTH_SCOPES.includes(scope);
  addReason(reasons, valid ? "HEALTH_SCOPE_VALID" : "HEALTH_SCOPE_INVALID");
  return valid;
}

function validateSealedArtifacts(
  input: RecommendationDependencyHealthFoundationInput,
  reasons: RecommendationDependencyHealthFoundationReasonCode[],
): boolean {
  const sealed = input.constraintFoundation.sealed === true
    && input.constraintReplay.sealed === true
    && input.constraintCertification.sealed === true
    && input.opportunityFoundation.sealed === true
    && input.opportunityReplay.sealed === true
    && input.opportunityCertification.sealed === true
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

  addReason(reasons, input.constraintFoundation.sealed === true ? "CONSTRAINT_FOUNDATION_REQUIRED" : "CONSTRAINT_FOUNDATION_UNSEALED");
  addReason(reasons, input.constraintReplay.sealed === true ? "CONSTRAINT_REPLAY_REQUIRED" : "CONSTRAINT_REPLAY_UNSEALED");
  addReason(reasons, input.constraintCertification.sealed === true ? "CONSTRAINT_CERTIFICATION_REQUIRED" : "CONSTRAINT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.opportunityFoundation.sealed === true ? "OPPORTUNITY_FOUNDATION_REQUIRED" : "OPPORTUNITY_FOUNDATION_UNSEALED");
  addReason(reasons, input.opportunityReplay.sealed === true ? "OPPORTUNITY_REPLAY_REQUIRED" : "OPPORTUNITY_REPLAY_UNSEALED");
  addReason(reasons, input.opportunityCertification.sealed === true ? "OPPORTUNITY_CERTIFICATION_REQUIRED" : "OPPORTUNITY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyRiskFoundation.sealed === true ? "DEPENDENCY_RISK_FOUNDATION_REQUIRED" : "DEPENDENCY_RISK_FOUNDATION_UNSEALED");
  addReason(reasons, input.dependencyRiskReplay.sealed === true ? "DEPENDENCY_RISK_REPLAY_REQUIRED" : "DEPENDENCY_RISK_REPLAY_UNSEALED");
  addReason(reasons, input.dependencyRiskCertification.sealed === true ? "DEPENDENCY_RISK_CERTIFICATION_REQUIRED" : "DEPENDENCY_RISK_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyFoundation.sealed === true ? "DEPENDENCY_FOUNDATION_REQUIRED" : "DEPENDENCY_FOUNDATION_UNSEALED");
  addReason(reasons, input.dependencyReplay.sealed === true ? "DEPENDENCY_REPLAY_REQUIRED" : "DEPENDENCY_REPLAY_UNSEALED");
  addReason(reasons, input.dependencyCertification.sealed === true ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactFoundation.sealed === true ? "IMPACT_FOUNDATION_REQUIRED" : "IMPACT_FOUNDATION_UNSEALED");
  addReason(reasons, input.impactReplay.sealed === true ? "IMPACT_REPLAY_REQUIRED" : "IMPACT_REPLAY_UNSEALED");
  addReason(reasons, input.impactCertification.sealed === true ? "IMPACT_CERTIFICATION_REQUIRED" : "IMPACT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.trustFoundation.sealed === true ? "TRUST_FOUNDATION_REQUIRED" : "TRUST_FOUNDATION_UNSEALED");
  addReason(reasons, input.trustReplay.sealed === true ? "TRUST_REPLAY_REQUIRED" : "TRUST_REPLAY_UNSEALED");
  addReason(reasons, input.trustCertification.sealed === true ? "TRUST_CERTIFICATION_REQUIRED" : "TRUST_CERTIFICATION_UNSEALED");
  addReason(reasons, input.driftFoundation.sealed === true ? "DRIFT_FOUNDATION_REQUIRED" : "DRIFT_FOUNDATION_UNSEALED");
  addReason(reasons, input.driftReplay.sealed === true ? "DRIFT_REPLAY_REQUIRED" : "DRIFT_REPLAY_UNSEALED");
  addReason(reasons, input.driftCertification.sealed === true ? "DRIFT_CERTIFICATION_REQUIRED" : "DRIFT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.resilienceFoundation.sealed === true ? "RESILIENCE_FOUNDATION_REQUIRED" : "RESILIENCE_FOUNDATION_UNSEALED");
  addReason(reasons, input.resilienceReplay.sealed === true ? "RESILIENCE_REPLAY_REQUIRED" : "RESILIENCE_REPLAY_UNSEALED");
  addReason(reasons, input.resilienceCertification.sealed === true ? "RESILIENCE_CERTIFICATION_REQUIRED" : "RESILIENCE_CERTIFICATION_UNSEALED");
  addReason(reasons, input.portfolio.sealed === true ? "PORTFOLIO_REQUIRED" : "PORTFOLIO_UNSEALED");
  addReason(reasons, input.portfolioReplay.sealed === true ? "PORTFOLIO_REPLAY_REQUIRED" : "PORTFOLIO_REPLAY_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed === true ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(
  input: RecommendationDependencyHealthFoundationInput,
  reasons: RecommendationDependencyHealthFoundationReasonCode[],
): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.constraintFoundation.result.tenantIsolationVerified
    && input.constraintReplay.result.tenantIsolationVerified
    && input.constraintCertification.result.tenantIsolationVerified
    && input.opportunityFoundation.result.tenantIsolationVerified
    && input.opportunityReplay.result.tenantIsolationVerified
    && input.opportunityCertification.result.tenantIsolationVerified
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
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_HEALTH_BLOCKED");
  return valid;
}

function validateOwnership(
  input: RecommendationDependencyHealthFoundationInput,
  reasons: RecommendationDependencyHealthFoundationReasonCode[],
): boolean {
  const valid = input.constraintFoundation.validation.ownershipValid
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateEvidencePresence(
  input: RecommendationDependencyHealthFoundationInput,
  reasons: RecommendationDependencyHealthFoundationReasonCode[],
): boolean {
  const bundles = orderedBundles(input);
  const evidencePresent = bundles.every((bundle) => (
    collectGovernanceReferences(bundle).length > 0
    && collectLineageReferences(bundle).length > 0
    && collectReplayReferences(bundle).length > 0
    && collectObservabilityReferences(bundle).length > 0
  ));
  addReason(reasons, evidencePresent ? "HEALTH_EVIDENCE_PRESENT" : "HEALTH_EVIDENCE_MISSING");
  addReason(reasons, bundles.every((bundle) => collectGovernanceReferences(bundle).length > 0) ? "GOVERNANCE_REFERENCES_PRESENT" : "GOVERNANCE_REFERENCES_MISSING");
  addReason(reasons, bundles.every((bundle) => collectLineageReferences(bundle).length > 0) ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, bundles.every((bundle) => collectReplayReferences(bundle).length > 0) ? "REPLAY_REFERENCES_PRESENT" : "REPLAY_REFERENCES_MISSING");
  return evidencePresent;
}

function validateBoundary(
  input: RecommendationDependencyHealthFoundationInput,
  reasons: RecommendationDependencyHealthFoundationReasonCode[],
): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const scoringAbsent = input.recommendationScoringRequested !== true;
  const resourceAllocationAbsent = input.resourceAllocationRequested !== true;
  const controlSurfaceAbsent = !input.constraintFoundation.controlSurfacePresent
    && !input.constraintReplay.controlSurfacePresent
    && !input.constraintCertification.controlSurfacePresent
    && !input.opportunityFoundation.controlSurfacePresent
    && !input.opportunityReplay.controlSurfacePresent
    && !input.opportunityCertification.controlSurfacePresent
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
  addReason(reasons, input.prioritizationRequested === true ? "PRIORITIZATION_DETECTED" : "PRIORITIZATION_ABSENT");
  addReason(reasons, input.recommendationRankingRequested === true ? "RANKING_DETECTED" : "RANKING_ABSENT");
  addReason(reasons, input.approvalRequested === true ? "APPROVAL_DETECTED" : "APPROVAL_ABSENT");
  addReason(reasons, scoringAbsent ? "SCORING_ABSENT" : "SCORING_DETECTED");
  addReason(reasons, resourceAllocationAbsent ? "RESOURCE_ALLOCATION_ABSENT" : "RESOURCE_ALLOCATION_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.healthMutationAttempted === true ? "HEALTH_MUTATION_DETECTED" : "HEALTH_MUTATION_BLOCKED");
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
      || input.healthMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createRecommendationDependencyHealthEvidencePath(
  input: RecommendationDependencyHealthFoundationInput,
  healthRecords: readonly RecommendationDependencyHealth[],
): RecommendationDependencyHealthEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.healthScope,
    healthReferences: normalizeStrings(healthRecords.map((record) => record.healthId)),
    governanceReferences: normalizeStrings([
      ...input.constraintFoundation.evidencePath.governanceReferences,
      ...input.constraintReplay.evidencePath.governanceReferences,
      ...input.dependencyFoundation.evidencePath.governanceReferences,
      ...input.dependencyReplay.evidencePath.governanceReferences,
      ...input.dependencyRiskFoundation.evidencePath.governanceReferences,
      ...bundles.flatMap(collectGovernanceReferences),
    ]),
    lineageReferences: normalizeStrings(bundles.flatMap(collectLineageReferences)),
    replayReferences: normalizeStrings([
      ...input.constraintFoundation.evidencePath.replayReferences,
      ...input.constraintReplay.evidencePath.replayReferences,
      ...input.dependencyFoundation.evidencePath.replayReferences,
      ...input.dependencyReplay.evidencePath.replayReferences,
      ...input.dependencyRiskFoundation.evidencePath.replayReferences,
      ...input.opportunityReplay.evidencePath.replayReferences,
      ...input.impactReplay.evidencePath.replayReferences,
      ...input.trustReplay.evidencePath.replayReferences,
      ...input.driftReplay.evidencePath.replayReferences,
      ...input.resilienceReplay.evidencePath.replayReferences,
      ...input.portfolioReplay.evidencePath.replayReferences,
      ...bundles.flatMap(collectReplayReferences),
    ]),
    constraintReferences: normalizeStrings([
      ...input.constraintFoundation.evidencePath.constraintReferences,
      ...input.constraintReplay.evidencePath.constraintReferences,
      ...input.constraintCertification.evidencePath.constraintReferences,
    ]),
    opportunityReferences: normalizeStrings([
      ...input.opportunityFoundation.evidencePath.opportunityReferences,
      ...input.opportunityReplay.evidencePath.opportunityReferences,
      ...input.opportunityCertification.evidencePath.opportunityReferences,
    ]),
    dependencyRiskReferences: normalizeStrings([
      ...input.dependencyRiskFoundation.evidencePath.dependencyRiskReferences,
      ...input.dependencyRiskReplay.evidencePath.dependencyRiskReferences,
      ...input.dependencyRiskCertification.evidencePath.dependencyRiskReferences,
    ]),
    dependencyReferences: normalizeStrings([
      ...input.dependencyFoundation.dependencies.map((dependency) => dependency.dependencyId),
      ...input.dependencyFoundation.evidencePath.dependencyReferences,
      ...input.dependencyReplay.evidencePath.dependencyReferences,
      ...input.dependencyCertification.evidencePath.dependencyReferences,
    ]),
    impactReferences: normalizeStrings([
      ...input.impactFoundation.evidencePath.impactReferences,
      ...input.impactReplay.evidencePath.impactReferences,
      ...input.impactCertification.evidencePath.impactReferences,
    ]),
    trustReferences: normalizeStrings([
      ...input.trustFoundation.evidencePath.trustReferences,
      ...input.trustReplay.evidencePath.trustReferences,
      ...input.trustCertification.evidencePath.trustReferences,
    ]),
    driftReferences: normalizeStrings([
      ...input.driftFoundation.evidencePath.driftReferences,
      ...input.driftReplay.evidencePath.driftReferences,
      ...input.driftCertification.evidencePath.driftReferences,
    ]),
    resilienceReferences: normalizeStrings([
      ...input.resilienceFoundation.evidencePath.resilienceReferences,
      ...input.resilienceReplay.evidencePath.resilienceReferences,
      ...input.resilienceCertification.evidencePath.resilienceReferences,
    ]),
    portfolioReferences: normalizeStrings([
      ...input.portfolio.evidencePath.governanceReferences,
      ...input.portfolioReplay.evidencePath.portfolioReferences,
      ...input.portfolioCertification.evidencePath.portfolioReferences,
    ]),
    readinessReferences: normalizeStrings(bundles.flatMap(collectReadinessReferences)),
    observabilityReferences: normalizeStrings(bundles.flatMap(collectObservabilityReferences)),
    recommendationReferences: normalizeStrings([
      ...bundles.map((bundle) => bundle.certification.result.certificationHash),
      ...bundles.map((bundle) => bundle.observabilityCertification.result.certificationHash),
    ]),
    evidenceHashes: normalizeStrings([
      input.constraintFoundation.result.constraintGraphHash,
      input.constraintReplay.result.replayHash,
      input.constraintCertification.result.certificationHash,
      input.opportunityFoundation.result.opportunityGraphHash,
      input.opportunityReplay.result.replayHash,
      input.opportunityCertification.result.certificationHash,
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
      input.portfolioReplay.result.replayHash,
      input.portfolioCertification.result.certificationHash,
      ...healthRecords.map((record) => record.healthHash),
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  recommendationCount: number,
  healthRecordCount: number,
  lineageReferenceCount: number,
  replayReferenceCount: number,
  governanceReferenceCount: number,
  reasons: RecommendationDependencyHealthFoundationReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_RECOMMENDATIONS
    && healthRecordCount <= MAX_DEPENDENCY_HEALTH_RECORDS
    && lineageReferenceCount <= MAX_LINEAGE_REFERENCES
    && replayReferenceCount <= MAX_REPLAY_REFERENCES
    && governanceReferenceCount <= MAX_GOVERNANCE_REFERENCES;
  addReason(reasons, recommendationCount <= MAX_RECOMMENDATIONS ? "RECOMMENDATION_LIMIT_VALID" : "RECOMMENDATION_LIMIT_EXCEEDED");
  addReason(reasons, healthRecordCount <= MAX_DEPENDENCY_HEALTH_RECORDS ? "DEPENDENCY_HEALTH_RECORD_LIMIT_VALID" : "DEPENDENCY_HEALTH_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, lineageReferenceCount <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, governanceReferenceCount <= MAX_GOVERNANCE_REFERENCES ? "GOVERNANCE_REFERENCE_LIMIT_VALID" : "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function deriveOverallHealthState(
  input: RecommendationDependencyHealthFoundationInput,
  healthRecords: readonly RecommendationDependencyHealth[],
  reasons: RecommendationDependencyHealthFoundationReasonCode[],
): DependencyHealthState {
  const states = healthRecords.map((record) => record.healthState);
  if (
    reasons.includes("OWNERSHIP_MISMATCH")
    || reasons.includes("CROSS_TENANT_HEALTH_BLOCKED")
    || reasons.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || reasons.includes("REPLAY_CORRUPTION_DETECTED")
    || input.authorityExpansionDetected === true
  ) return "UNHEALTHY";
  if (
    states.includes("UNKNOWN")
    || reasons.includes("HEALTH_EVIDENCE_MISSING")
    || reasons.includes("GOVERNANCE_REFERENCES_MISSING")
    || reasons.includes("LINEAGE_REFERENCES_MISSING")
    || reasons.includes("REPLAY_REFERENCES_MISSING")
  ) return "UNKNOWN";
  if (states.includes("UNHEALTHY")) return "UNHEALTHY";
  if (states.includes("AT_RISK")) {
    addReason(reasons, "ELEVATED_RISK_DETECTED");
    return "AT_RISK";
  }
  if (states.includes("DEGRADED")) {
    addReason(reasons, "DEGRADATION_DETECTED");
    return "DEGRADED";
  }
  if (states.includes("STABLE")) return "STABLE";
  return "HEALTHY";
}

function buildResult(
  request: RecommendationDependencyHealthFoundationRequest,
  overallHealthState: DependencyHealthState,
  healthRecords: readonly RecommendationDependencyHealth[],
  tenantIsolationVerified: boolean,
  healthGraphHash: string,
): RecommendationDependencyHealthFoundationResult {
  return Object.freeze({
    tenantId: request.tenantId,
    overallHealthState,
    healthRecordsCreated: healthRecords.length,
    stabilityRecordsDetected: healthRecords.filter((record) => record.healthType === "DEPENDENCY_STABILITY").length,
    availabilityRecordsDetected: healthRecords.filter((record) => record.healthType === "DEPENDENCY_AVAILABILITY").length,
    continuityRecordsDetected: healthRecords.filter((record) => record.healthType === "DEPENDENCY_CONTINUITY").length,
    recoverabilityRecordsDetected: healthRecords.filter((record) => record.healthType === "DEPENDENCY_RECOVERABILITY").length,
    degradationRecordsDetected: healthRecords.filter((record) => record.healthType === "DEPENDENCY_DEGRADATION").length,
    riskRecordsDetected: healthRecords.filter((record) => record.healthType === "DEPENDENCY_RISK").length,
    observabilityRecordsDetected: healthRecords.filter((record) => record.healthType === "DEPENDENCY_OBSERVABILITY").length,
    tenantIsolationVerified,
    healthGraphHash,
    deterministic: true,
  });
}

function buildObservability(
  result: RecommendationDependencyHealthFoundationResult,
): RecommendationDependencyHealthFoundationObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    overallHealthState: result.overallHealthState,
    healthRecordsCreated: result.healthRecordsCreated,
    stabilityRecordsDetected: result.stabilityRecordsDetected,
    availabilityRecordsDetected: result.availabilityRecordsDetected,
    continuityRecordsDetected: result.continuityRecordsDetected,
    recoverabilityRecordsDetected: result.recoverabilityRecordsDetected,
    degradationRecordsDetected: result.degradationRecordsDetected,
    riskRecordsDetected: result.riskRecordsDetected,
    observabilityRecordsDetected: result.observabilityRecordsDetected,
    healthGraphHash: result.healthGraphHash,
  });
}

function buildValidation(
  overallHealthState: DependencyHealthState,
  reasonCodes: readonly RecommendationDependencyHealthFoundationReasonCode[],
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    healthRecordsCreated: number;
    lineageReferenceCount: number;
    replayReferenceCount: number;
    governanceReferenceCount: number;
  }>,
): SealedRecommendationDependencyHealthFoundationRecord["validation"] {
  return Object.freeze({
    valid: overallHealthState !== "UNHEALTHY",
    overallHealthState,
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

export function buildRecommendationDependencyHealthFoundationRequest(
  request: RecommendationDependencyHealthFoundationRequest,
): RecommendationDependencyHealthFoundationRequest {
  return requestCore(request);
}

export function sealRecommendationDependencyHealthFoundation(
  input: RecommendationDependencyHealthFoundationInput,
): SealedRecommendationDependencyHealthFoundationRecord {
  const reasons: RecommendationDependencyHealthFoundationReasonCode[] = [];
  const requestValid = validateRecommendationIds(input.request, reasons)
    && validateScope(input.request.healthScope, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const evidenceValid = validateEvidencePresence(input, reasons);
  const boundary = validateBoundary(input, reasons);

  if (externalGovernanceCorrupted(input)) addReason(reasons, "GOVERNANCE_CORRUPTION_DETECTED");
  if (externalReplayCorrupted(input)) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");
  if (orderedBundles(input).some((bundle) => !governanceIntegrity(bundle))) addReason(reasons, "GOVERNANCE_CORRUPTION_DETECTED");
  if (orderedBundles(input).some((bundle) => !replayIntegrity(bundle))) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");

  const healthRecords = createHealthRecords(input, reasons);
  const evidencePath = createRecommendationDependencyHealthEvidencePath(input, healthRecords);
  const limitsValid = validateLimits(
    normalizeStrings(input.request.recommendationIds).length,
    healthRecords.length,
    evidencePath.lineageReferences.length,
    evidencePath.replayReferences.length,
    evidencePath.governanceReferences.length,
    reasons,
  );
  addReason(reasons, "RECOMMENDATION_DEPENDENCY_HEALTH_FOUNDATION_IS_NOT_CONTROL");

  const overallHealthState = !requestValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || boundary.invalidBoundary
    || !limitsValid
    ? "UNHEALTHY"
    : !evidenceValid
      ? "UNKNOWN"
      : deriveOverallHealthState(input, healthRecords, reasons);

  const healthGraphHash = hashHealthValue("recommendation-dependency-health-foundation", {
    request: requestCore(input.request),
    overallHealthState,
    healthReferences: evidencePath.healthReferences,
    governanceReferences: evidencePath.governanceReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    constraintReferences: evidencePath.constraintReferences,
    opportunityReferences: evidencePath.opportunityReferences,
    dependencyRiskReferences: evidencePath.dependencyRiskReferences,
    dependencyReferences: evidencePath.dependencyReferences,
    impactReferences: evidencePath.impactReferences,
    trustReferences: evidencePath.trustReferences,
    driftReferences: evidencePath.driftReferences,
    resilienceReferences: evidencePath.resilienceReferences,
    portfolioReferences: evidencePath.portfolioReferences,
    readinessReferences: evidencePath.readinessReferences,
    observabilityReferences: evidencePath.observabilityReferences,
    recommendationReferences: evidencePath.recommendationReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    overallHealthState,
    healthRecords,
    tenantIsolationVerified,
    healthGraphHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    overallHealthState,
    reasons,
    ownershipValid,
    tenantIsolationVerified,
    boundary,
    Object.freeze({
      healthRecordsCreated: healthRecords.length,
      lineageReferenceCount: evidencePath.lineageReferences.length,
      replayReferenceCount: evidencePath.replayReferences.length,
      governanceReferenceCount: evidencePath.governanceReferences.length,
    }),
  );

  return Object.freeze({
    result,
    healthRecords,
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    healthOnly: true,
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
