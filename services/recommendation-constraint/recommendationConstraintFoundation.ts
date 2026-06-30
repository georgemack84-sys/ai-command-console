import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  RecommendationConstraint,
  RecommendationConstraintEvidencePath,
  RecommendationConstraintFoundationInput,
  RecommendationConstraintFoundationObservability,
  RecommendationConstraintFoundationReasonCode,
  RecommendationConstraintFoundationRequest,
  RecommendationConstraintFoundationResult,
  RecommendationConstraintScope,
  RecommendationConstraintState,
  RecommendationConstraintType,
  SealedRecommendationConstraintFoundationRecord,
} from "./types";

const MAX_RECOMMENDATIONS = 10_000;
const MAX_CONSTRAINT_RECORDS = 50_000;
const MAX_LINEAGE_REFERENCES = 10_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_GOVERNANCE_REFERENCES = 10_000;

const CONSTRAINT_SCOPES: readonly RecommendationConstraintScope[] = Object.freeze([
  "GOVERNANCE",
  "DEPENDENCY",
  "RESOURCE",
  "TRUST",
  "RESILIENCE",
  "READINESS",
  "PORTFOLIO",
  "RISK",
  "FULL",
]);

const CONSTRAINT_TYPES: readonly RecommendationConstraintType[] = Object.freeze([
  "GOVERNANCE_CONSTRAINT",
  "DEPENDENCY_CONSTRAINT",
  "RESOURCE_CONSTRAINT",
  "TRUST_CONSTRAINT",
  "RESILIENCE_CONSTRAINT",
  "READINESS_CONSTRAINT",
  "PORTFOLIO_CONSTRAINT",
  "RISK_CONSTRAINT",
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
  reasons: RecommendationConstraintFoundationReasonCode[],
  reason: RecommendationConstraintFoundationReasonCode,
): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashConstraintValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: RecommendationConstraintFoundationRequest): RecommendationConstraintFoundationRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    recommendationIds: [...request.recommendationIds],
    constraintScope: request.constraintScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: RecommendationConstraintFoundationInput): RecommendationPortfolioBundle[] {
  return [...input.recommendations].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function bundleMap(input: RecommendationConstraintFoundationInput): Map<string, RecommendationPortfolioBundle> {
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

function includesScope(scope: RecommendationConstraintScope, type: RecommendationConstraintType): boolean {
  if (scope === "FULL") return true;
  return (
    (scope === "GOVERNANCE" && type === "GOVERNANCE_CONSTRAINT")
    || (scope === "DEPENDENCY" && type === "DEPENDENCY_CONSTRAINT")
    || (scope === "RESOURCE" && type === "RESOURCE_CONSTRAINT")
    || (scope === "TRUST" && type === "TRUST_CONSTRAINT")
    || (scope === "RESILIENCE" && type === "RESILIENCE_CONSTRAINT")
    || (scope === "READINESS" && type === "READINESS_CONSTRAINT")
    || (scope === "PORTFOLIO" && type === "PORTFOLIO_CONSTRAINT")
    || (scope === "RISK" && type === "RISK_CONSTRAINT")
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
    && bundle.replayFramework.result.replayState !== "INVALID";
}

function firstReference(values: readonly string[]): string {
  return values[0] ?? "";
}

function externalReplayCorrupted(input: RecommendationConstraintFoundationInput): boolean {
  return (
    input.opportunityReplay.result.replayState === "INVALID"
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

function externalGovernanceCorrupted(input: RecommendationConstraintFoundationInput): boolean {
  return (
    input.opportunityCertification.result.governanceCertified !== true
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
  type: RecommendationConstraintType,
  state: RecommendationConstraintState,
): RecommendationConstraintFoundationReasonCode {
  const prefix = type === "GOVERNANCE_CONSTRAINT"
    ? "GOVERNANCE"
    : type === "DEPENDENCY_CONSTRAINT"
      ? "DEPENDENCY"
      : type === "RESOURCE_CONSTRAINT"
        ? "RESOURCE"
        : type === "TRUST_CONSTRAINT"
          ? "TRUST"
          : type === "RESILIENCE_CONSTRAINT"
            ? "RESILIENCE"
            : type === "READINESS_CONSTRAINT"
              ? "READINESS"
              : type === "PORTFOLIO_CONSTRAINT"
                ? "PORTFOLIO"
                : "RISK";
  return `${prefix}_CONSTRAINT_${state}` as RecommendationConstraintFoundationReasonCode;
}

function resolveConstraintState(
  input: RecommendationConstraintFoundationInput,
  bundle: RecommendationPortfolioBundle,
  type: RecommendationConstraintType,
  evidenceReference: string,
  governanceReference: string,
  lineageReference: string,
  replayReference: string,
): RecommendationConstraintState {
  if (
    evidenceReference.length === 0
    || governanceReference.length === 0
    || lineageReference.length === 0
    || replayReference.length === 0
  ) return "UNKNOWN";

  if (externalGovernanceCorrupted(input) || externalReplayCorrupted(input) || !governanceIntegrity(bundle) || !replayIntegrity(bundle)) {
    return "BLOCKING";
  }

  if (type === "GOVERNANCE_CONSTRAINT") {
    if (bundle.governanceCertification.result.certificationState === "FAIL" || bundle.binding.result.bindingState === "ESCALATED") return "BLOCKING";
    if (bundle.binding.result.bindingState === "LIMITED" || bundle.governanceCertification.result.certificationState === "CONDITIONAL_PASS") return "CONDITIONAL";
    return "ACTIVE";
  }

  if (type === "DEPENDENCY_CONSTRAINT") {
    if (input.dependencyRiskFoundation.result.dependencyRiskState === "CRITICAL" || input.dependencyCertification.result.certificationState === "FAIL") return "BLOCKING";
    if (input.dependencyFoundation.result.dependencyState === "LIMITED") return "LIMITED";
    if (
      input.dependencyRiskFoundation.result.dependencyRiskState === "HIGH"
      || input.dependencyRiskFoundation.result.dependencyRiskState === "MODERATE"
      || input.dependencyCertification.result.certificationState === "CONDITIONAL_PASS"
    ) return "CONDITIONAL";
    return "ACTIVE";
  }

  if (type === "RESOURCE_CONSTRAINT") {
    if (input.portfolio.result.portfolioState === "INVALID" || input.impactCertification.result.certificationState === "FAIL") return "BLOCKING";
    if (input.portfolio.result.portfolioState === "OBSERVE") return "UNKNOWN";
    if (input.portfolio.result.portfolioState === "LIMITED" || input.impactFoundation.result.impactState === "LIMITED") return "LIMITED";
    if (input.impactCertification.result.certificationState === "CONDITIONAL_PASS") return "CONDITIONAL";
    return "ACTIVE";
  }

  if (type === "TRUST_CONSTRAINT") {
    if (input.trustFoundation.result.trustState === "UNTRUSTED" || input.trustCertification.result.certificationState === "FAIL") return "BLOCKING";
    if (input.trustFoundation.result.trustState === "UNKNOWN") return "UNKNOWN";
    if (input.trustFoundation.result.trustState === "DEGRADED") return "CONDITIONAL";
    if (input.trustCertification.result.certificationState === "CONDITIONAL_PASS") return "LIMITED";
    return "ACTIVE";
  }

  if (type === "RESILIENCE_CONSTRAINT") {
    if (input.resilienceFoundation.result.resilienceState === "FRAGILE" || input.resilienceCertification.result.certificationState === "FAIL") return "BLOCKING";
    if (input.resilienceFoundation.result.resilienceState === "UNKNOWN") return "UNKNOWN";
    if (input.resilienceFoundation.result.resilienceState === "DEGRADED") return "CONDITIONAL";
    if (input.resilienceCertification.result.certificationState === "CONDITIONAL_PASS") return "LIMITED";
    return "ACTIVE";
  }

  if (type === "READINESS_CONSTRAINT") {
    if (bundle.readiness.result.readinessState === "NOT_READY" || bundle.alignment.result.alignmentState === "MISALIGNED") return "BLOCKING";
    if (bundle.readiness.result.readinessState === "OBSERVE" || bundle.alignment.result.alignmentState === "OBSERVE") return "UNKNOWN";
    if (bundle.readiness.result.readinessState === "LIMITED") return "LIMITED";
    if (
      bundle.alignment.result.alignmentState === "PARTIALLY_ALIGNED"
      || bundle.readinessCertification.result.certificationState === "CONDITIONAL_PASS"
    ) return "CONDITIONAL";
    return "ACTIVE";
  }

  if (type === "PORTFOLIO_CONSTRAINT") {
    if (input.portfolio.result.portfolioState === "INVALID" || input.portfolioCertification.result.certificationState === "FAIL") return "BLOCKING";
    if (input.portfolio.result.portfolioState === "OBSERVE") return "UNKNOWN";
    if (input.portfolio.result.portfolioState === "LIMITED") return "LIMITED";
    if (input.portfolioCertification.result.certificationState === "CONDITIONAL_PASS") return "CONDITIONAL";
    return "ACTIVE";
  }

  if (input.dependencyRiskFoundation.result.dependencyRiskState === "CRITICAL") return "BLOCKING";
  if (input.dependencyRiskFoundation.result.dependencyRiskState === "UNKNOWN") return "UNKNOWN";
  if (
    input.dependencyRiskFoundation.result.dependencyRiskState === "HIGH"
    || input.dependencyRiskFoundation.result.dependencyRiskState === "MODERATE"
  ) return "CONDITIONAL";
  return "ACTIVE";
}

function createConstraintRecord(
  input: RecommendationConstraintFoundationInput,
  bundle: RecommendationPortfolioBundle,
  type: RecommendationConstraintType,
  reasons: RecommendationConstraintFoundationReasonCode[],
): RecommendationConstraint {
  const recommendationIdValue = recommendationId(bundle);
  const governanceReferences = collectGovernanceReferences(bundle);
  const lineageReferences = collectLineageReferences(bundle);
  const replayReferences = collectReplayReferences(bundle);
  const readinessReferences = collectReadinessReferences(bundle);
  const opportunityReferences = input.opportunityFoundation.opportunities
    .filter((record) => record.recommendationId === recommendationIdValue)
    .map((record) => record.opportunityId);

  const evidenceReference = type === "GOVERNANCE_CONSTRAINT"
    ? firstReference(governanceReferences)
    : type === "DEPENDENCY_CONSTRAINT"
      ? firstReference(input.dependencyFoundation.evidencePath.dependencyReferences)
      : type === "RESOURCE_CONSTRAINT"
        ? firstReference(input.impactFoundation.evidencePath.impactReferences)
        : type === "TRUST_CONSTRAINT"
          ? firstReference(input.trustFoundation.evidencePath.trustReferences)
          : type === "RESILIENCE_CONSTRAINT"
            ? firstReference(input.resilienceFoundation.evidencePath.resilienceReferences)
            : type === "READINESS_CONSTRAINT"
              ? firstReference(readinessReferences)
              : type === "PORTFOLIO_CONSTRAINT"
                ? firstReference(input.portfolioReplay.evidencePath.portfolioReferences)
                : firstReference(input.dependencyRiskFoundation.evidencePath.dependencyRiskReferences);
  const governanceReference = firstReference(governanceReferences);
  const lineageReference = firstReference(lineageReferences);
  const replayReference = firstReference(replayReferences);

  const constraintState = resolveConstraintState(
    input,
    bundle,
    type,
    evidenceReference,
    governanceReference,
    lineageReference,
    replayReference,
  );
  addReason(reasons, reasonForState(type, constraintState));

  const constraintId = hashConstraintValue("recommendation-constraint-id", {
    recommendationId: recommendationIdValue,
    constraintType: type,
  });
  const constraintHash = hashConstraintValue("recommendation-constraint-record", {
    recommendationId: recommendationIdValue,
    constraintType: type,
    evidenceReference,
    governanceReference,
    lineageReference,
    replayReference,
    opportunityReferences,
    constraintState,
  });

  return Object.freeze({
    constraintId,
    recommendationId: recommendationIdValue,
    constraintType: type,
    evidenceReference,
    governanceReference,
    lineageReference,
    replayReference,
    constraintState,
    constraintHash,
  });
}

function createConstraintRecords(
  input: RecommendationConstraintFoundationInput,
  reasons: RecommendationConstraintFoundationReasonCode[],
): RecommendationConstraint[] {
  const bundles = bundleMap(input);
  const records: RecommendationConstraint[] = [];
  for (const recommendationIdValue of normalizeStrings(input.request.recommendationIds)) {
    const bundle = bundles.get(recommendationIdValue);
    if (!bundle) continue;
    for (const type of CONSTRAINT_TYPES) {
      if (!includesScope(input.request.constraintScope, type)) continue;
      records.push(createConstraintRecord(input, bundle, type, reasons));
    }
  }
  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.constraintType.localeCompare(right.constraintType)
    || left.constraintId.localeCompare(right.constraintId)
  ));
}

function validateRecommendationIds(
  request: RecommendationConstraintFoundationRequest,
  reasons: RecommendationConstraintFoundationReasonCode[],
): boolean {
  const valid = request.recommendationIds.length > 0;
  addReason(reasons, valid ? "RECOMMENDATION_IDS_PRESENT" : "RECOMMENDATION_IDS_MISSING");
  return valid;
}

function validateScope(
  scope: RecommendationConstraintScope,
  reasons: RecommendationConstraintFoundationReasonCode[],
): boolean {
  const valid = CONSTRAINT_SCOPES.includes(scope);
  addReason(reasons, valid ? "CONSTRAINT_SCOPE_VALID" : "CONSTRAINT_SCOPE_INVALID");
  return valid;
}

function validateSealedArtifacts(
  input: RecommendationConstraintFoundationInput,
  reasons: RecommendationConstraintFoundationReasonCode[],
): boolean {
  const sealed = input.opportunityFoundation.sealed === true
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
  addReason(reasons, input.relationshipAnalysis.sealed === true ? "PORTFOLIO_ANALYSIS_REQUIRED" : "PORTFOLIO_ANALYSIS_UNSEALED");
  addReason(reasons, input.portfolioReplay.sealed === true ? "PORTFOLIO_REPLAY_REQUIRED" : "PORTFOLIO_REPLAY_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed === true ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(
  input: RecommendationConstraintFoundationInput,
  reasons: RecommendationConstraintFoundationReasonCode[],
): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.opportunityFoundation.result.tenantIsolationVerified
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
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_CONSTRAINT_BLOCKED");
  return valid;
}

function validateOwnership(
  input: RecommendationConstraintFoundationInput,
  reasons: RecommendationConstraintFoundationReasonCode[],
): boolean {
  const valid = orderedBundles(input).every((bundle) => (
    bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
    && bundle.ownershipEvidence.ownershipReferences.length > 0
  ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateEvidencePresence(
  input: RecommendationConstraintFoundationInput,
  reasons: RecommendationConstraintFoundationReasonCode[],
): boolean {
  const bundles = orderedBundles(input);
  const evidencePresent = bundles.every((bundle) => (
    collectReadinessReferences(bundle).length > 0
    && collectGovernanceReferences(bundle).length > 0
    && collectLineageReferences(bundle).length > 0
    && collectReplayReferences(bundle).length > 0
  ));
  addReason(reasons, evidencePresent ? "CONSTRAINT_EVIDENCE_PRESENT" : "CONSTRAINT_EVIDENCE_MISSING");
  addReason(reasons, bundles.every((bundle) => collectGovernanceReferences(bundle).length > 0) ? "GOVERNANCE_REFERENCES_PRESENT" : "GOVERNANCE_REFERENCES_MISSING");
  addReason(reasons, bundles.every((bundle) => collectLineageReferences(bundle).length > 0) ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, bundles.every((bundle) => collectReplayReferences(bundle).length > 0) ? "REPLAY_REFERENCES_PRESENT" : "REPLAY_REFERENCES_MISSING");
  return evidencePresent;
}

function validateBoundary(
  input: RecommendationConstraintFoundationInput,
  reasons: RecommendationConstraintFoundationReasonCode[],
): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const scoringAbsent = input.recommendationScoringRequested !== true;
  const resourceAllocationAbsent = input.resourceAllocationRequested !== true;
  const controlSurfaceAbsent = !input.opportunityFoundation.controlSurfacePresent
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
  addReason(reasons, input.recommendationRankingRequested === true ? "RANKING_DETECTED" : "RANKING_ABSENT");
  addReason(reasons, input.approvalRequested === true ? "APPROVAL_DETECTED" : "APPROVAL_ABSENT");
  addReason(reasons, scoringAbsent ? "SCORING_ABSENT" : "SCORING_DETECTED");
  addReason(reasons, resourceAllocationAbsent ? "RESOURCE_ALLOCATION_ABSENT" : "RESOURCE_ALLOCATION_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.constraintMutationAttempted === true ? "CONSTRAINT_MUTATION_DETECTED" : "CONSTRAINT_MUTATION_BLOCKED");
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
      || input.constraintMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createRecommendationConstraintEvidencePath(
  input: RecommendationConstraintFoundationInput,
  constraints: readonly RecommendationConstraint[],
): RecommendationConstraintEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.constraintScope,
    constraintReferences: normalizeStrings(constraints.map((constraint) => constraint.constraintId)),
    governanceReferences: normalizeStrings([
      ...input.opportunityFoundation.evidencePath.governanceReferences,
      ...input.dependencyRiskFoundation.evidencePath.governanceReferences,
      ...input.dependencyCertification.evidencePath.governanceReferences,
      ...input.opportunityReplay.evidencePath.governanceReferences,
      ...bundles.flatMap(collectGovernanceReferences),
    ]),
    lineageReferences: normalizeStrings(bundles.flatMap(collectLineageReferences)),
    replayReferences: normalizeStrings([
      ...input.opportunityFoundation.evidencePath.replayReferences,
      ...input.opportunityReplay.evidencePath.replayReferences,
      ...input.dependencyRiskReplay.evidencePath.replayReferences,
      ...input.dependencyReplay.evidencePath.replayReferences,
      ...input.impactReplay.evidencePath.replayReferences,
      ...input.trustReplay.evidencePath.replayReferences,
      ...input.driftReplay.evidencePath.replayReferences,
      ...input.resilienceReplay.evidencePath.replayReferences,
      ...input.portfolioReplay.evidencePath.replayReferences,
      ...bundles.flatMap(collectReplayReferences),
    ]),
    opportunityReferences: normalizeStrings([
      ...input.opportunityFoundation.evidencePath.opportunityReferences,
      ...input.opportunityReplay.evidencePath.opportunityReferences,
      ...input.opportunityCertification.evidencePath.opportunityReferences,
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
    portfolioReferences: normalizeStrings([
      ...input.portfolio.evidencePath.governanceReferences,
      ...input.relationshipAnalysis.evidencePath.relationshipReferences,
      ...input.portfolioReplay.evidencePath.portfolioReferences,
      ...input.portfolioCertification.evidencePath.portfolioReferences,
    ]),
    evidenceHashes: normalizeStrings([
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
      input.relationshipAnalysis.result.analysisHash,
      input.portfolioReplay.result.replayHash,
      input.portfolioCertification.result.certificationHash,
      ...constraints.map((constraint) => constraint.constraintHash),
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  recommendationCount: number,
  constraintCount: number,
  lineageReferenceCount: number,
  replayReferenceCount: number,
  governanceReferenceCount: number,
  reasons: RecommendationConstraintFoundationReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_RECOMMENDATIONS
    && constraintCount <= MAX_CONSTRAINT_RECORDS
    && lineageReferenceCount <= MAX_LINEAGE_REFERENCES
    && replayReferenceCount <= MAX_REPLAY_REFERENCES
    && governanceReferenceCount <= MAX_GOVERNANCE_REFERENCES;
  addReason(reasons, recommendationCount <= MAX_RECOMMENDATIONS ? "RECOMMENDATION_LIMIT_VALID" : "RECOMMENDATION_LIMIT_EXCEEDED");
  addReason(reasons, constraintCount <= MAX_CONSTRAINT_RECORDS ? "CONSTRAINT_RECORD_LIMIT_VALID" : "CONSTRAINT_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, lineageReferenceCount <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, governanceReferenceCount <= MAX_GOVERNANCE_REFERENCES ? "GOVERNANCE_REFERENCE_LIMIT_VALID" : "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function deriveConstraintState(
  input: RecommendationConstraintFoundationInput,
  constraints: readonly RecommendationConstraint[],
  reasons: RecommendationConstraintFoundationReasonCode[],
): RecommendationConstraintState {
  const states = constraints.map((constraint) => constraint.constraintState);
  if (
    reasons.includes("OWNERSHIP_MISMATCH")
    || reasons.includes("CROSS_TENANT_CONSTRAINT_BLOCKED")
    || reasons.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || reasons.includes("REPLAY_CORRUPTION_DETECTED")
    || input.authorityExpansionDetected === true
  ) return "BLOCKING";
  if (
    states.includes("UNKNOWN")
    || reasons.includes("CONSTRAINT_EVIDENCE_MISSING")
    || reasons.includes("GOVERNANCE_REFERENCES_MISSING")
    || reasons.includes("LINEAGE_REFERENCES_MISSING")
    || reasons.includes("REPLAY_REFERENCES_MISSING")
  ) return "UNKNOWN";
  if (states.includes("BLOCKING")) return "BLOCKING";
  if (states.includes("LIMITED")) {
    addReason(reasons, "CONSTRAINT_EVIDENCE_GAPS_DETECTED");
    return "LIMITED";
  }
  if (states.includes("CONDITIONAL")) {
    addReason(reasons, "BOUNDED_CONSTRAINT_LIMITATIONS_DETECTED");
    return "CONDITIONAL";
  }
  return "ACTIVE";
}

function buildResult(
  request: RecommendationConstraintFoundationRequest,
  constraintState: RecommendationConstraintState,
  constraints: readonly RecommendationConstraint[],
  tenantIsolationVerified: boolean,
  constraintGraphHash: string,
): RecommendationConstraintFoundationResult {
  return Object.freeze({
    tenantId: request.tenantId,
    constraintState,
    constraintsCreated: constraints.length,
    governanceConstraintsDetected: constraints.filter((constraint) => constraint.constraintType === "GOVERNANCE_CONSTRAINT").length,
    dependencyConstraintsDetected: constraints.filter((constraint) => constraint.constraintType === "DEPENDENCY_CONSTRAINT").length,
    resourceConstraintsDetected: constraints.filter((constraint) => constraint.constraintType === "RESOURCE_CONSTRAINT").length,
    trustConstraintsDetected: constraints.filter((constraint) => constraint.constraintType === "TRUST_CONSTRAINT").length,
    resilienceConstraintsDetected: constraints.filter((constraint) => constraint.constraintType === "RESILIENCE_CONSTRAINT").length,
    readinessConstraintsDetected: constraints.filter((constraint) => constraint.constraintType === "READINESS_CONSTRAINT").length,
    portfolioConstraintsDetected: constraints.filter((constraint) => constraint.constraintType === "PORTFOLIO_CONSTRAINT").length,
    riskConstraintsDetected: constraints.filter((constraint) => constraint.constraintType === "RISK_CONSTRAINT").length,
    tenantIsolationVerified,
    constraintGraphHash,
    deterministic: true,
  });
}

function buildObservability(result: RecommendationConstraintFoundationResult): RecommendationConstraintFoundationObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    constraintState: result.constraintState,
    constraintsCreated: result.constraintsCreated,
    governanceConstraintsDetected: result.governanceConstraintsDetected,
    dependencyConstraintsDetected: result.dependencyConstraintsDetected,
    resourceConstraintsDetected: result.resourceConstraintsDetected,
    trustConstraintsDetected: result.trustConstraintsDetected,
    resilienceConstraintsDetected: result.resilienceConstraintsDetected,
    readinessConstraintsDetected: result.readinessConstraintsDetected,
    portfolioConstraintsDetected: result.portfolioConstraintsDetected,
    riskConstraintsDetected: result.riskConstraintsDetected,
    constraintGraphHash: result.constraintGraphHash,
  });
}

function buildValidation(
  constraintState: RecommendationConstraintState,
  reasonCodes: readonly RecommendationConstraintFoundationReasonCode[],
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    constraintsCreated: number;
    lineageReferenceCount: number;
    replayReferenceCount: number;
    governanceReferenceCount: number;
  }>,
): SealedRecommendationConstraintFoundationRecord["validation"] {
  return Object.freeze({
    valid: constraintState !== "BLOCKING",
    constraintState,
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

export function buildRecommendationConstraintFoundationRequest(
  request: RecommendationConstraintFoundationRequest,
): RecommendationConstraintFoundationRequest {
  return requestCore(request);
}

export function sealRecommendationConstraintFoundation(
  input: RecommendationConstraintFoundationInput,
): SealedRecommendationConstraintFoundationRecord {
  const reasons: RecommendationConstraintFoundationReasonCode[] = [];
  const requestValid = validateRecommendationIds(input.request, reasons)
    && validateScope(input.request.constraintScope, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const evidenceValid = validateEvidencePresence(input, reasons);
  const boundary = validateBoundary(input, reasons);

  if (externalGovernanceCorrupted(input)) addReason(reasons, "GOVERNANCE_CORRUPTION_DETECTED");
  if (externalReplayCorrupted(input)) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");
  if (orderedBundles(input).some((bundle) => !governanceIntegrity(bundle))) addReason(reasons, "GOVERNANCE_CORRUPTION_DETECTED");
  if (orderedBundles(input).some((bundle) => !replayIntegrity(bundle))) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");

  const constraints = createConstraintRecords(input, reasons);
  const evidencePath = createRecommendationConstraintEvidencePath(input, constraints);
  const limitsValid = validateLimits(
    normalizeStrings(input.request.recommendationIds).length,
    constraints.length,
    evidencePath.lineageReferences.length,
    evidencePath.replayReferences.length,
    evidencePath.governanceReferences.length,
    reasons,
  );
  addReason(reasons, "RECOMMENDATION_CONSTRAINT_FOUNDATION_IS_NOT_CONTROL");

  const constraintState = !requestValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || boundary.invalidBoundary
    || !limitsValid
    ? "BLOCKING"
    : !evidenceValid
      ? "UNKNOWN"
      : deriveConstraintState(input, constraints, reasons);

  const constraintGraphHash = hashConstraintValue("recommendation-constraint-foundation", {
    request: requestCore(input.request),
    constraintState,
    constraintReferences: evidencePath.constraintReferences,
    governanceReferences: evidencePath.governanceReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    opportunityReferences: evidencePath.opportunityReferences,
    dependencyRiskReferences: evidencePath.dependencyRiskReferences,
    dependencyReferences: evidencePath.dependencyReferences,
    impactReferences: evidencePath.impactReferences,
    trustReferences: evidencePath.trustReferences,
    resilienceReferences: evidencePath.resilienceReferences,
    readinessReferences: evidencePath.readinessReferences,
    portfolioReferences: evidencePath.portfolioReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    constraintState,
    constraints,
    tenantIsolationVerified,
    constraintGraphHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    constraintState,
    reasons,
    ownershipValid,
    tenantIsolationVerified,
    boundary,
    Object.freeze({
      constraintsCreated: constraints.length,
      lineageReferenceCount: evidencePath.lineageReferences.length,
      replayReferenceCount: evidencePath.replayReferences.length,
      governanceReferenceCount: evidencePath.governanceReferences.length,
    }),
  );

  return Object.freeze({
    result,
    constraints,
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    constraintOnly: true,
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
