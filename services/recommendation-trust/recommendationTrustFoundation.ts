import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  RecommendationTrust,
  RecommendationTrustDimension,
  RecommendationTrustEvidencePath,
  RecommendationTrustFoundationInput,
  RecommendationTrustFoundationObservability,
  RecommendationTrustFoundationReasonCode,
  RecommendationTrustFoundationRequest,
  RecommendationTrustFoundationResult,
  RecommendationTrustFoundationValidation,
  RecommendationTrustScope,
  RecommendationTrustState,
  SealedRecommendationTrustFoundationRecord,
} from "./types";

const MAX_RECOMMENDATIONS = 10_000;
const MAX_TRUST_RECORDS = 50_000;
const MAX_LINEAGE_REFERENCES = 10_000;
const MAX_REPLAY_REFERENCES = 10_000;

const TRUST_SCOPES: readonly RecommendationTrustScope[] = Object.freeze([
  "EVIDENCE",
  "LINEAGE",
  "GOVERNANCE",
  "REPLAY",
  "READINESS",
  "PORTFOLIO",
  "DEPENDENCY",
  "IMPACT",
  "DRIFT",
  "FULL",
]);

const TRUST_DIMENSIONS: readonly RecommendationTrustDimension[] = Object.freeze([
  "EVIDENCE_TRUST",
  "LINEAGE_TRUST",
  "GOVERNANCE_TRUST",
  "REPLAY_TRUST",
  "READINESS_TRUST",
  "PORTFOLIO_TRUST",
  "DEPENDENCY_TRUST",
  "IMPACT_TRUST",
  "DRIFT_TRUST",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
  controlSurfaceAbsent: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: RecommendationTrustFoundationReasonCode[], reason: RecommendationTrustFoundationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashTrustValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: RecommendationTrustFoundationRequest): RecommendationTrustFoundationRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    recommendationIds: [...request.recommendationIds],
    trustScope: request.trustScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(bundles: readonly RecommendationPortfolioBundle[]): RecommendationPortfolioBundle[] {
  return [...bundles].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function bundleMap(bundles: readonly RecommendationPortfolioBundle[]): Map<string, RecommendationPortfolioBundle> {
  return new Map(orderedBundles(bundles).map((bundle) => [recommendationId(bundle), bundle]));
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
    "authorityMutationAllowed",
    "controlSurfacePresent",
  ] as const;
  return blockedFlags.every((key) => record[key] !== true);
}

function includesScope(scope: RecommendationTrustScope, dimension: RecommendationTrustDimension): boolean {
  if (scope === "FULL") return true;
  return (
    (scope === "EVIDENCE" && dimension === "EVIDENCE_TRUST")
    || (scope === "LINEAGE" && dimension === "LINEAGE_TRUST")
    || (scope === "GOVERNANCE" && dimension === "GOVERNANCE_TRUST")
    || (scope === "REPLAY" && dimension === "REPLAY_TRUST")
    || (scope === "READINESS" && dimension === "READINESS_TRUST")
    || (scope === "PORTFOLIO" && dimension === "PORTFOLIO_TRUST")
    || (scope === "DEPENDENCY" && dimension === "DEPENDENCY_TRUST")
    || (scope === "IMPACT" && dimension === "IMPACT_TRUST")
    || (scope === "DRIFT" && dimension === "DRIFT_TRUST")
  );
}

function collectEvidenceReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.ledger.entry.evidenceIds,
    ...bundle.ledger.evidencePath.evidenceIds,
    ...bundle.lineage.evidencePath.evidenceIds,
    ...bundle.verification.evidencePath.evidenceIds,
    ...bundle.replay.evidencePath.evidenceIds,
    ...bundle.certification.evidencePath.evidenceIds,
    ...bundle.audit.evidencePath.evidenceIds,
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

function lineageIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.lineage.result.reconstructionState !== "INVALID"
    && bundle.lineage.result.lineageIntegrity
    && bundle.integrity.result.lineageIntegrity;
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

function countConcerns(states: readonly RecommendationTrustState[]): number {
  return states.filter((state) => state !== "TRUSTED").length;
}

function fallbackReference(
  recommendationIdValue: string,
  dimension: RecommendationTrustDimension,
  payload: unknown,
): string {
  return hashTrustValue("recommendation-trust-reference", {
    recommendationId: recommendationIdValue,
    dimension,
    payload,
  });
}

function resolveDriftReference(
  input: RecommendationTrustFoundationInput,
  recommendationIdValue: string,
  dimension: RecommendationTrustDimension,
  currentReference: string,
): { baselineReference: string; currentReference: string } {
  const driftType = (
    dimension === "EVIDENCE_TRUST" ? "EVIDENCE_DRIFT"
      : dimension === "LINEAGE_TRUST" ? "LINEAGE_DRIFT"
        : dimension === "GOVERNANCE_TRUST" ? "GOVERNANCE_DRIFT"
          : dimension === "REPLAY_TRUST" ? "REPLAY_DRIFT"
            : dimension === "READINESS_TRUST" ? "READINESS_DRIFT"
              : dimension === "PORTFOLIO_TRUST" ? "PORTFOLIO_DRIFT"
                : dimension === "DEPENDENCY_TRUST" ? "DEPENDENCY_DRIFT"
                  : dimension === "IMPACT_TRUST" ? "IMPACT_DRIFT"
                    : "EVIDENCE_DRIFT"
  );
  const drift = input.driftFoundation.drifts.find((record) => (
    record.recommendationId === recommendationIdValue
    && record.driftType === driftType
  ));
  return drift
    ? { baselineReference: drift.baselineReference, currentReference: drift.currentReference }
    : { baselineReference: currentReference, currentReference };
}

function evaluateEvidenceTrust(
  bundle: RecommendationPortfolioBundle,
  reasons: RecommendationTrustFoundationReasonCode[],
): RecommendationTrustState {
  const evidenceReferences = collectEvidenceReferences(bundle);
  if (evidenceReferences.length === 0) {
    addReason(reasons, "EVIDENCE_TRUST_UNKNOWN");
    addReason(reasons, "TRUST_EVIDENCE_MISSING");
    return "UNKNOWN";
  }
  const certificationState = certificationLikeState(bundle.certification.result.certificationState);
  const observabilityState = certificationLikeState(bundle.observabilityCertification.result.certificationState);
  if (certificationState === "FAIL" || observabilityState === "FAIL") {
    addReason(reasons, "EVIDENCE_TRUST_CONDITIONAL");
    return "DEGRADED";
  }
  if (certificationState === "CONDITIONAL_PASS" || observabilityState === "CONDITIONAL_PASS" || bundle.observability.result.observabilityState !== "VISIBLE") {
    addReason(reasons, "EVIDENCE_TRUST_CONDITIONAL");
    addReason(reasons, "BOUNDED_DEGRADATION_DETECTED");
    return "CONDITIONALLY_TRUSTED";
  }
  addReason(reasons, "EVIDENCE_TRUST_TRUSTED");
  return "TRUSTED";
}

function evaluateLineageTrust(
  bundle: RecommendationPortfolioBundle,
  reasons: RecommendationTrustFoundationReasonCode[],
): RecommendationTrustState {
  const lineageReferences = collectLineageReferences(bundle);
  if (lineageReferences.length === 0) {
    addReason(reasons, "LINEAGE_TRUST_UNKNOWN");
    addReason(reasons, "LINEAGE_EVIDENCE_MISSING");
    return "UNKNOWN";
  }
  if (!lineageIntegrity(bundle) || bundle.ownershipEvidence.ownershipReferences.length === 0) {
    addReason(reasons, "LINEAGE_TRUST_UNTRUSTED");
    return "UNTRUSTED";
  }
  addReason(reasons, "LINEAGE_TRUST_TRUSTED");
  return "TRUSTED";
}

function evaluateGovernanceTrust(
  bundle: RecommendationPortfolioBundle,
  reasons: RecommendationTrustFoundationReasonCode[],
): RecommendationTrustState {
  const governanceReferences = collectGovernanceReferences(bundle);
  if (governanceReferences.length === 0) {
    addReason(reasons, "GOVERNANCE_TRUST_UNKNOWN");
    return "UNKNOWN";
  }
  if (!governanceIntegrity(bundle)) {
    addReason(reasons, "GOVERNANCE_TRUST_UNTRUSTED");
    addReason(reasons, "GOVERNANCE_CORRUPTION_DETECTED");
    return "UNTRUSTED";
  }
  addReason(reasons, "GOVERNANCE_TRUST_TRUSTED");
  return "TRUSTED";
}

function evaluateReplayTrust(
  input: RecommendationTrustFoundationInput,
  bundle: RecommendationPortfolioBundle,
  reasons: RecommendationTrustFoundationReasonCode[],
): RecommendationTrustState {
  const replayReferences = collectReplayReferences(bundle);
  if (replayReferences.length === 0) {
    addReason(reasons, "REPLAY_TRUST_UNKNOWN");
    addReason(reasons, "REPLAY_EVIDENCE_MISSING");
    return "UNKNOWN";
  }
  if (!replayIntegrity(bundle)) {
    addReason(reasons, "REPLAY_TRUST_UNTRUSTED");
    addReason(reasons, "REPLAY_CORRUPTION_DETECTED");
    return "UNTRUSTED";
  }
  if (
    bundle.replay.result.replayState === "LIMITED"
    || bundle.governanceReplay.result.replayState === "LIMITED"
    || bundle.replayFramework.result.replayState === "LIMITED"
    || input.driftReplay.result.replayState === "LIMITED"
  ) {
    addReason(reasons, "REPLAY_TRUST_CONDITIONAL");
    addReason(reasons, "BOUNDED_DEGRADATION_DETECTED");
    return "CONDITIONALLY_TRUSTED";
  }
  addReason(reasons, "REPLAY_TRUST_TRUSTED");
  return "TRUSTED";
}

function evaluateReadinessTrust(
  bundle: RecommendationPortfolioBundle,
  reasons: RecommendationTrustFoundationReasonCode[],
): RecommendationTrustState {
  const readinessReferences = collectReadinessReferences(bundle);
  if (readinessReferences.length === 0) {
    addReason(reasons, "READINESS_TRUST_UNKNOWN");
    return "UNKNOWN";
  }
  const certificationState = certificationLikeState(bundle.readinessCertification.result.certificationState);
  if (certificationState === "FAIL") {
    addReason(reasons, "READINESS_TRUST_UNTRUSTED");
    return "UNTRUSTED";
  }
  if (certificationState === "CONDITIONAL_PASS" || bundle.readiness.result.readinessState !== "READY") {
    addReason(reasons, "READINESS_TRUST_CONDITIONAL");
    return "CONDITIONALLY_TRUSTED";
  }
  addReason(reasons, "READINESS_TRUST_TRUSTED");
  return "TRUSTED";
}

function evaluateCertificationDomainTrust(
  state: string,
  trustedReason: RecommendationTrustFoundationReasonCode,
  conditionalReason: RecommendationTrustFoundationReasonCode,
  untrustedReason: RecommendationTrustFoundationReasonCode,
  reasons: RecommendationTrustFoundationReasonCode[],
): RecommendationTrustState {
  const normalizedState = certificationLikeState(state);
  if (normalizedState === "FAIL") {
    addReason(reasons, untrustedReason);
    return "UNTRUSTED";
  }
  if (normalizedState === "CONDITIONAL_PASS") {
    addReason(reasons, conditionalReason);
    return "CONDITIONALLY_TRUSTED";
  }
  addReason(reasons, trustedReason);
  return "TRUSTED";
}

function evaluateDriftTrust(
  input: RecommendationTrustFoundationInput,
  recommendationIdValue: string,
  reasons: RecommendationTrustFoundationReasonCode[],
): RecommendationTrustState {
  const driftReferences = input.driftFoundation.drifts.filter((record) => record.recommendationId === recommendationIdValue);
  if (input.driftFoundation.evidencePath.driftReferences.length === 0) {
    if (input.driftFoundation.result.driftsCreated === 0 && input.driftFoundation.result.driftState === "STABLE") {
      addReason(reasons, "DRIFT_TRUST_TRUSTED");
      return "TRUSTED";
    }
    addReason(reasons, "DRIFT_TRUST_UNKNOWN");
    return "UNKNOWN";
  }
  if (input.driftCertification.result.certificationState === "FAIL" || input.driftReplay.result.replayState === "INVALID" || input.driftReplay.result.replayState === "ESCALATED") {
    addReason(reasons, "DRIFT_TRUST_UNTRUSTED");
    return "UNTRUSTED";
  }
  if (input.driftCertification.result.certificationState === "CONDITIONAL_PASS" || input.driftReplay.result.replayState === "LIMITED" || driftReferences.length > 1) {
    addReason(reasons, "DRIFT_TRUST_CONDITIONAL");
    return "CONDITIONALLY_TRUSTED";
  }
  addReason(reasons, "DRIFT_TRUST_TRUSTED");
  return "TRUSTED";
}

function validateScope(scope: RecommendationTrustScope, reasons: RecommendationTrustFoundationReasonCode[]): boolean {
  const valid = TRUST_SCOPES.includes(scope);
  addReason(reasons, valid ? "TRUST_SCOPE_VALID" : "TRUST_SCOPE_INVALID");
  return valid;
}

function validateRecommendationIds(request: RecommendationTrustFoundationRequest, reasons: RecommendationTrustFoundationReasonCode[]): boolean {
  const valid = request.recommendationIds.length > 0;
  addReason(reasons, valid ? "RECOMMENDATION_IDS_PRESENT" : "RECOMMENDATION_IDS_MISSING");
  return valid;
}

function validateSealedArtifacts(input: RecommendationTrustFoundationInput, reasons: RecommendationTrustFoundationReasonCode[]): boolean {
  const sealed = input.driftFoundation.sealed === true
    && input.driftReplay.sealed === true
    && input.driftCertification.sealed === true
    && input.impactCertification.sealed === true
    && input.dependencyCertification.sealed === true
    && input.portfolioCertification.sealed === true
    && orderedBundles(input.recommendations).every((bundle) => [
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
  addReason(reasons, input.driftFoundation.sealed === true ? "DRIFT_FOUNDATION_REQUIRED" : "DRIFT_FOUNDATION_UNSEALED");
  addReason(reasons, input.driftReplay.sealed === true ? "DRIFT_REPLAY_REQUIRED" : "DRIFT_REPLAY_UNSEALED");
  addReason(reasons, input.driftCertification.sealed === true ? "DRIFT_CERTIFICATION_REQUIRED" : "DRIFT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactCertification.sealed === true ? "IMPACT_CERTIFICATION_REQUIRED" : "IMPACT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyCertification.sealed === true ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed === true ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: RecommendationTrustFoundationInput, reasons: RecommendationTrustFoundationReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.driftFoundation.result.tenantIsolationVerified
    && input.driftReplay.result.tenantIsolationVerified
    && input.driftCertification.result.tenantIsolationVerified
    && input.impactCertification.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
    && input.portfolioCertification.result.tenantIsolationVerified
    && orderedBundles(input.recommendations).every((bundle) => (
      bundle.ledger.entry.tenantId === tenantId
      && bundle.governanceReferences.tenantId === tenantId
      && bundle.ownershipEvidence.tenantId === tenantId
      && bundle.replayEvidence.tenantId === tenantId
      && bundle.readiness.result.tenantIsolationVerified
      && bundle.alignment.result.tenantIsolationVerified
      && bundle.reviewPacket.result.tenantIsolationVerified
      && bundle.replayFramework.result.tenantIsolationVerified
      && bundle.readinessCertification.result.tenantIsolationVerified
      && bundle.observability.result.tenantIsolationVerified
      && bundle.audit.result.tenantIsolationVerified
      && bundle.governanceCertification.result.tenantIsolationVerified
    ));
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_TRUST_BLOCKED");
  return valid;
}

function validateOwnership(input: RecommendationTrustFoundationInput, reasons: RecommendationTrustFoundationReasonCode[]): boolean {
  const requestedIds = normalizeStrings(input.request.recommendationIds);
  const recommendations = bundleMap(input.recommendations);
  const valid = requestedIds.every((id) => {
    const bundle = recommendations.get(id);
    return bundle
      && bundle.ownershipEvidence.recommendationId === id
      && bundle.ownershipEvidence.ownershipReferences.length > 0;
  });
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateBoundary(input: RecommendationTrustFoundationInput, reasons: RecommendationTrustFoundationReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = !input.driftFoundation.controlSurfacePresent
    && !input.driftReplay.controlSurfacePresent
    && !input.driftCertification.controlSurfacePresent
    && !input.impactCertification.controlSurfacePresent
    && !input.dependencyCertification.controlSurfacePresent
    && !input.portfolioCertification.controlSurfacePresent
    && orderedBundles(input.recommendations).every((bundle) => [
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
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.trustMutationAttempted === true ? "TRUST_MUTATION_DETECTED" : "TRUST_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  return Object.freeze({
    executionImpossible,
    authorityBounded,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || input.prioritizationRequested === true
      || input.recommendationRankingRequested === true
      || input.approvalRequested === true
      || !authorityBounded
      || input.trustMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

function createTrustRecords(
  input: RecommendationTrustFoundationInput,
  reasons: RecommendationTrustFoundationReasonCode[],
): RecommendationTrust[] {
  const records: RecommendationTrust[] = [];
  const recommendations = bundleMap(input.recommendations);
  for (const recommendationIdValue of normalizeStrings(input.request.recommendationIds)) {
    const bundle = recommendations.get(recommendationIdValue);
    if (!bundle) continue;
    for (const dimension of TRUST_DIMENSIONS) {
      if (!includesScope(input.request.trustScope, dimension)) continue;
      const currentReference = dimension === "EVIDENCE_TRUST"
        ? fallbackReference(recommendationIdValue, dimension, {
          evidenceReferences: collectEvidenceReferences(bundle),
          certificationHash: bundle.certification.result.certificationHash,
          observabilityHash: bundle.observability.result.observabilityHash,
        })
        : dimension === "LINEAGE_TRUST"
          ? fallbackReference(recommendationIdValue, dimension, {
            lineageReferences: collectLineageReferences(bundle),
            lineageHash: bundle.lineage.result.reconstructionHash,
            ownershipHash: bundle.ownershipEvidence.ownershipHash,
          })
          : dimension === "GOVERNANCE_TRUST"
            ? fallbackReference(recommendationIdValue, dimension, {
              governanceReferences: collectGovernanceReferences(bundle),
              governanceHash: bundle.binding.result.governanceHash,
              authorityHash: bundle.authorityScope.result.authorityHash,
            })
            : dimension === "REPLAY_TRUST"
              ? fallbackReference(recommendationIdValue, dimension, {
                replayReferences: collectReplayReferences(bundle),
                replayHash: bundle.replay.result.replayHash,
                reconstructionHash: bundle.replay.result.reconstructionHash,
                driftReplayHash: input.driftReplay.result.replayHash,
              })
              : dimension === "READINESS_TRUST"
                ? fallbackReference(recommendationIdValue, dimension, {
                  readinessReferences: collectReadinessReferences(bundle),
                  readinessHash: bundle.readiness.result.readinessHash,
                  alignmentHash: bundle.alignment.result.alignmentHash,
                  certificationHash: bundle.readinessCertification.result.certificationHash,
                })
                : dimension === "PORTFOLIO_TRUST"
                  ? fallbackReference(recommendationIdValue, dimension, {
                    portfolioHash: input.portfolioCertification.result.certificationHash,
                    recommendationId: recommendationIdValue,
                  })
                  : dimension === "DEPENDENCY_TRUST"
                    ? fallbackReference(recommendationIdValue, dimension, {
                      dependencyHash: input.dependencyCertification.result.certificationHash,
                      recommendationId: recommendationIdValue,
                    })
                    : dimension === "IMPACT_TRUST"
                      ? fallbackReference(recommendationIdValue, dimension, {
                        impactHash: input.impactCertification.result.certificationHash,
                        recommendationId: recommendationIdValue,
                      })
                      : fallbackReference(recommendationIdValue, dimension, {
                        driftReferences: input.driftFoundation.drifts.filter((record) => record.recommendationId === recommendationIdValue).map((record) => record.driftId),
                        certificationHash: input.driftCertification.result.certificationHash,
                        replayHash: input.driftReplay.result.replayHash,
                      });
      const references = resolveDriftReference(input, recommendationIdValue, dimension, currentReference);
      const trustState = dimension === "EVIDENCE_TRUST"
        ? evaluateEvidenceTrust(bundle, reasons)
        : dimension === "LINEAGE_TRUST"
          ? evaluateLineageTrust(bundle, reasons)
          : dimension === "GOVERNANCE_TRUST"
            ? evaluateGovernanceTrust(bundle, reasons)
            : dimension === "REPLAY_TRUST"
              ? evaluateReplayTrust(input, bundle, reasons)
              : dimension === "READINESS_TRUST"
                ? evaluateReadinessTrust(bundle, reasons)
                : dimension === "PORTFOLIO_TRUST"
                  ? evaluateCertificationDomainTrust(
                    input.portfolioCertification.result.certificationState,
                    "PORTFOLIO_TRUST_TRUSTED",
                    "PORTFOLIO_TRUST_CONDITIONAL",
                    "PORTFOLIO_TRUST_UNTRUSTED",
                    reasons,
                  )
                  : dimension === "DEPENDENCY_TRUST"
                    ? evaluateCertificationDomainTrust(
                      input.dependencyCertification.result.certificationState,
                      "DEPENDENCY_TRUST_TRUSTED",
                      "DEPENDENCY_TRUST_CONDITIONAL",
                      "DEPENDENCY_TRUST_UNTRUSTED",
                      reasons,
                    )
                    : dimension === "IMPACT_TRUST"
                      ? evaluateCertificationDomainTrust(
                        input.impactCertification.result.certificationState,
                        "IMPACT_TRUST_TRUSTED",
                        "IMPACT_TRUST_CONDITIONAL",
                        "IMPACT_TRUST_UNTRUSTED",
                        reasons,
                      )
                      : evaluateDriftTrust(input, recommendationIdValue, reasons);
      const trustId = hashTrustValue("recommendation-trust-id", {
        recommendationId: recommendationIdValue,
        dimension,
      });
      const trustHash = hashTrustValue("recommendation-trust-record", {
        recommendationId: recommendationIdValue,
        dimension,
        baselineReference: references.baselineReference,
        currentReference: references.currentReference,
        trustState,
      });
      records.push(Object.freeze({
        trustId,
        recommendationId: recommendationIdValue,
        trustDimension: dimension,
        baselineReference: references.baselineReference,
        currentReference: references.currentReference,
        trustState,
        trustHash,
      }));
    }
  }
  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.trustDimension.localeCompare(right.trustDimension)
    || left.trustId.localeCompare(right.trustId)
  ));
}

function createRecommendationTrustEvidencePath(
  input: RecommendationTrustFoundationInput,
  trusts: readonly RecommendationTrust[],
): RecommendationTrustEvidencePath {
  const bundles = orderedBundles(input.recommendations);
  return Object.freeze({
    scope: input.request.trustScope,
    trustReferences: normalizeStrings(trusts.map((trust) => trust.trustId)),
    baselineReferences: normalizeStrings(trusts.map((trust) => trust.baselineReference)),
    currentReferences: normalizeStrings(trusts.map((trust) => trust.currentReference)),
    evidenceReferences: normalizeStrings(bundles.flatMap(collectEvidenceReferences)),
    lineageReferences: normalizeStrings(bundles.flatMap(collectLineageReferences)),
    governanceReferences: normalizeStrings(bundles.flatMap(collectGovernanceReferences)),
    replayReferences: normalizeStrings(bundles.flatMap(collectReplayReferences)),
    readinessReferences: normalizeStrings(bundles.flatMap(collectReadinessReferences)),
    portfolioReferences: normalizeStrings([
      ...input.portfolioCertification.evidencePath.portfolioReferences,
      ...input.portfolioCertification.evidencePath.relationshipReferences,
    ]),
    dependencyReferences: normalizeStrings([
      ...input.dependencyCertification.evidencePath.dependencyReferences,
      ...input.dependencyCertification.evidencePath.chainReferences,
      ...input.dependencyCertification.evidencePath.conflictReferences,
    ]),
    impactReferences: normalizeStrings([
      ...input.impactCertification.evidencePath.impactReferences,
      ...input.impactCertification.evidencePath.chainReferences,
      ...input.impactCertification.evidencePath.propagationReferences,
      ...input.impactCertification.evidencePath.conflictReferences,
    ]),
    driftReferences: normalizeStrings([
      ...input.driftFoundation.evidencePath.driftReferences,
      ...input.driftReplay.evidencePath.driftReferences,
      ...input.driftCertification.evidencePath.driftReferences,
    ]),
    evidenceHashes: normalizeStrings([
      input.driftFoundation.result.driftGraphHash,
      input.driftReplay.result.replayHash,
      input.driftReplay.result.reconstructionHash,
      input.driftCertification.result.certificationHash,
      input.impactCertification.result.certificationHash,
      input.dependencyCertification.result.certificationHash,
      input.portfolioCertification.result.certificationHash,
      ...trusts.map((trust) => trust.trustHash),
      ...bundles.flatMap((bundle) => [
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
      ]),
    ]),
  });
}

function validateLimits(
  recommendationCount: number,
  trustRecordCount: number,
  lineageReferenceCount: number,
  replayReferenceCount: number,
  reasons: RecommendationTrustFoundationReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_RECOMMENDATIONS
    && trustRecordCount <= MAX_TRUST_RECORDS
    && lineageReferenceCount <= MAX_LINEAGE_REFERENCES
    && replayReferenceCount <= MAX_REPLAY_REFERENCES;
  addReason(reasons, recommendationCount <= MAX_RECOMMENDATIONS ? "RECOMMENDATION_LIMIT_VALID" : "RECOMMENDATION_LIMIT_EXCEEDED");
  addReason(reasons, trustRecordCount <= MAX_TRUST_RECORDS ? "TRUST_RECORD_LIMIT_VALID" : "TRUST_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, lineageReferenceCount <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function deriveTrustState(
  trusts: readonly RecommendationTrust[],
  reasons: RecommendationTrustFoundationReasonCode[],
): RecommendationTrustState {
  const states = trusts.map((trust) => trust.trustState);
  if (states.includes("UNTRUSTED") || reasons.includes("GOVERNANCE_CORRUPTION_DETECTED") || reasons.includes("REPLAY_CORRUPTION_DETECTED")) {
    return "UNTRUSTED";
  }
  if (states.includes("UNKNOWN")) {
    return "UNKNOWN";
  }
  const concernCount = countConcerns(states);
  if (concernCount >= 2) {
    addReason(reasons, "MULTIPLE_TRUST_CONCERNS_DETECTED");
    return "DEGRADED";
  }
  if (concernCount === 1) {
    addReason(reasons, "BOUNDED_DEGRADATION_DETECTED");
    return "CONDITIONALLY_TRUSTED";
  }
  return "TRUSTED";
}

function buildResult(
  request: RecommendationTrustFoundationRequest,
  trustState: RecommendationTrustState,
  trusts: readonly RecommendationTrust[],
  tenantIsolationVerified: boolean,
  trustGraphHash: string,
): RecommendationTrustFoundationResult {
  return Object.freeze({
    tenantId: request.tenantId,
    trustState,
    trustRecordsCreated: trusts.length,
    evidenceTrustDetected: trusts.filter((trust) => trust.trustDimension === "EVIDENCE_TRUST").length,
    lineageTrustDetected: trusts.filter((trust) => trust.trustDimension === "LINEAGE_TRUST").length,
    governanceTrustDetected: trusts.filter((trust) => trust.trustDimension === "GOVERNANCE_TRUST").length,
    replayTrustDetected: trusts.filter((trust) => trust.trustDimension === "REPLAY_TRUST").length,
    readinessTrustDetected: trusts.filter((trust) => trust.trustDimension === "READINESS_TRUST").length,
    portfolioTrustDetected: trusts.filter((trust) => trust.trustDimension === "PORTFOLIO_TRUST").length,
    dependencyTrustDetected: trusts.filter((trust) => trust.trustDimension === "DEPENDENCY_TRUST").length,
    impactTrustDetected: trusts.filter((trust) => trust.trustDimension === "IMPACT_TRUST").length,
    driftTrustDetected: trusts.filter((trust) => trust.trustDimension === "DRIFT_TRUST").length,
    tenantIsolationVerified,
    trustGraphHash,
    deterministic: true,
  });
}

function buildObservability(result: RecommendationTrustFoundationResult): RecommendationTrustFoundationObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    trustState: result.trustState,
    trustRecordsCreated: result.trustRecordsCreated,
    evidenceTrustDetected: result.evidenceTrustDetected,
    lineageTrustDetected: result.lineageTrustDetected,
    governanceTrustDetected: result.governanceTrustDetected,
    replayTrustDetected: result.replayTrustDetected,
    readinessTrustDetected: result.readinessTrustDetected,
    portfolioTrustDetected: result.portfolioTrustDetected,
    dependencyTrustDetected: result.dependencyTrustDetected,
    impactTrustDetected: result.impactTrustDetected,
    driftTrustDetected: result.driftTrustDetected,
    trustGraphHash: result.trustGraphHash,
  });
}

function buildValidation(
  trustState: RecommendationTrustState,
  reasonCodes: readonly RecommendationTrustFoundationReasonCode[],
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    trustRecordsCreated: number;
    lineageReferenceCount: number;
    replayReferenceCount: number;
  }>,
): RecommendationTrustFoundationValidation {
  return Object.freeze({
    valid: trustState !== "UNTRUSTED",
    trustState,
    reasonCodes: [...reasonCodes],
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
    ...counts,
  });
}

export function buildRecommendationTrustFoundationRequest(
  request: RecommendationTrustFoundationRequest,
): RecommendationTrustFoundationRequest {
  return requestCore(request);
}

export function sealRecommendationTrustFoundation(
  input: RecommendationTrustFoundationInput,
): SealedRecommendationTrustFoundationRecord {
  const reasons: RecommendationTrustFoundationReasonCode[] = [];
  const requestValid = validateRecommendationIds(input.request, reasons)
    && validateScope(input.request.trustScope, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const trusts = createTrustRecords(input, reasons);
  const evidencePath = createRecommendationTrustEvidencePath(input, trusts);
  const limitsValid = validateLimits(
    normalizeStrings(input.request.recommendationIds).length,
    trusts.length,
    evidencePath.lineageReferences.length,
    evidencePath.replayReferences.length,
    reasons,
  );
  addReason(reasons, "TRUST_FOUNDATION_IS_NOT_CONTROL");

  const trustState = !requestValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || boundary.invalidBoundary
    || !limitsValid
    ? "UNTRUSTED"
    : deriveTrustState(trusts, reasons);

  const trustGraphHash = hashTrustValue("recommendation-trust-foundation", {
    request: requestCore(input.request),
    trustState,
    trustReferences: evidencePath.trustReferences,
    baselineReferences: evidencePath.baselineReferences,
    currentReferences: evidencePath.currentReferences,
    evidenceReferences: evidencePath.evidenceReferences,
    lineageReferences: evidencePath.lineageReferences,
    governanceReferences: evidencePath.governanceReferences,
    replayReferences: evidencePath.replayReferences,
    readinessReferences: evidencePath.readinessReferences,
    portfolioReferences: evidencePath.portfolioReferences,
    dependencyReferences: evidencePath.dependencyReferences,
    impactReferences: evidencePath.impactReferences,
    driftReferences: evidencePath.driftReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    trustState,
    trusts,
    tenantIsolationVerified,
    trustGraphHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    trustState,
    reasons,
    ownershipValid,
    tenantIsolationVerified,
    boundary,
    Object.freeze({
      trustRecordsCreated: trusts.length,
      lineageReferenceCount: evidencePath.lineageReferences.length,
      replayReferenceCount: evidencePath.replayReferences.length,
    }),
  );

  return Object.freeze({
    result,
    trusts,
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    trustOnly: true,
    executionAuthorized: false,
    workflowRoutingAllowed: false,
    prioritizationAllowed: false,
    recommendationRankingAllowed: false,
    approvalAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
