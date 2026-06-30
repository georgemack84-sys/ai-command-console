import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  RecommendationTrust,
  RecommendationTrustConcentration,
  RecommendationTrustConflict,
  RecommendationTrustDimension,
  RecommendationTrustGap,
  RecommendationTrustPropagation,
  RecommendationTrustStrength,
  RecommendationTrustStrengthClass,
  RecommendationTrustState,
  SealedTrustAnalysisRecord,
  TrustAnalysisEvidencePath,
  TrustAnalysisInput,
  TrustAnalysisObservability,
  TrustAnalysisReasonCode,
  TrustAnalysisRequest,
  TrustAnalysisResult,
  TrustAnalysisScope,
  TrustAnalysisValidation,
} from "./types";

const MAX_RECOMMENDATIONS = 10_000;
const MAX_TRUST_RECORDS = 50_000;
const MAX_TRUST_CONFLICTS = 10_000;
const MAX_PROPAGATION_PATHS = 25_000;

const ANALYSIS_SCOPES: readonly TrustAnalysisScope[] = Object.freeze([
  "STRENGTH",
  "CONCENTRATION",
  "PROPAGATION",
  "GAPS",
  "CONFLICTS",
  "FULL",
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

function addReason(reasons: TrustAnalysisReasonCode[], reason: TrustAnalysisReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashAnalysisValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TrustAnalysisRequest): TrustAnalysisRequest {
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

function orderedBundles(bundles: readonly RecommendationPortfolioBundle[]): RecommendationPortfolioBundle[] {
  return [...bundles].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function orderedTrusts(trusts: readonly RecommendationTrust[]): RecommendationTrust[] {
  return [...trusts].sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.trustDimension.localeCompare(right.trustDimension)
    || left.trustId.localeCompare(right.trustId)
  ));
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

function includesScope(scope: TrustAnalysisScope, requested: TrustAnalysisScope): boolean {
  return scope === "FULL" || scope === requested;
}

function trustsByRecommendation(trusts: readonly RecommendationTrust[]): Map<string, RecommendationTrust[]> {
  const mapping = new Map<string, RecommendationTrust[]>();
  for (const trust of orderedTrusts(trusts)) {
    const bucket = mapping.get(trust.recommendationId) ?? [];
    bucket.push(trust);
    mapping.set(trust.recommendationId, bucket);
  }
  return mapping;
}

function classifyStrength(
  trusts: readonly RecommendationTrust[],
  recommendationIdValue: string,
  reasons: TrustAnalysisReasonCode[],
): RecommendationTrustStrengthClass {
  const states = trusts.map((trust) => trust.trustState);
  if (states.includes("UNTRUSTED")) return "CRITICAL";
  if (states.includes("UNKNOWN")) return "WEAK";
  const concernCount = states.filter((state) => state !== "TRUSTED").length;
  if (concernCount === 0) return "VERY_STRONG";
  if (concernCount === 1 && states.includes("CONDITIONALLY_TRUSTED")) return "STRONG";
  if (states.includes("DEGRADED") || concernCount <= 2) return "MODERATE";
  addReason(reasons, "TRUST_STRENGTH_LIMITED");
  return "WEAK";
}

function strengthAnalysis(
  input: TrustAnalysisInput,
  reasons: TrustAnalysisReasonCode[],
): RecommendationTrustStrength[] {
  const records: RecommendationTrustStrength[] = [];
  for (const [id, trusts] of trustsByRecommendation(input.foundation.trusts).entries()) {
    const trustedDimensions = trusts.filter((trust) => trust.trustState === "TRUSTED").map((trust) => trust.trustDimension);
    const degradedDimensions = trusts.filter((trust) => trust.trustState === "CONDITIONALLY_TRUSTED" || trust.trustState === "DEGRADED" || trust.trustState === "UNTRUSTED").map((trust) => trust.trustDimension);
    const unknownDimensions = trusts.filter((trust) => trust.trustState === "UNKNOWN").map((trust) => trust.trustDimension);
    const trustClass = classifyStrength(trusts, id, reasons);
    records.push(Object.freeze({
      recommendationId: id,
      trustClass,
      trustedDimensions: Object.freeze(normalizeStrings(trustedDimensions) as RecommendationTrustDimension[]),
      degradedDimensions: Object.freeze(normalizeStrings(degradedDimensions) as RecommendationTrustDimension[]),
      unknownDimensions: Object.freeze(normalizeStrings(unknownDimensions) as RecommendationTrustDimension[]),
      strengthHash: hashAnalysisValue("recommendation-trust-strength", {
        recommendationId: id,
        trustClass,
        trustIds: trusts.map((trust) => trust.trustId),
      }),
    }));
  }
  return records.sort((left, right) => left.recommendationId.localeCompare(right.recommendationId));
}

function concentrationAnalysis(
  strengths: readonly RecommendationTrustStrength[],
  trusts: readonly RecommendationTrust[],
): RecommendationTrustConcentration[] {
  const records: RecommendationTrustConcentration[] = [];
  const trustMap = trustsByRecommendation(trusts);
  for (const strength of strengths) {
    const trustRecords = trustMap.get(strength.recommendationId) ?? [];
    const degradedCount = trustRecords.filter((trust) => trust.trustState !== "TRUSTED").length;
    if (strength.trustClass === "VERY_STRONG" || strength.trustClass === "STRONG") {
      records.push(Object.freeze({
        concentrationId: hashAnalysisValue("trust-concentration-id", { recommendationId: strength.recommendationId, type: "HIGH_TRUST_CLUSTER" }),
        recommendationId: strength.recommendationId,
        concentrationType: "HIGH_TRUST_CLUSTER",
        concentrationHash: hashAnalysisValue("trust-concentration", { recommendationId: strength.recommendationId, type: "HIGH_TRUST_CLUSTER", trustIds: trustRecords.map((trust) => trust.trustId) }),
      }));
    }
    if (strength.trustClass === "WEAK" || strength.trustClass === "CRITICAL" || degradedCount >= 3) {
      records.push(Object.freeze({
        concentrationId: hashAnalysisValue("trust-concentration-id", { recommendationId: strength.recommendationId, type: "LOW_TRUST_CLUSTER" }),
        recommendationId: strength.recommendationId,
        concentrationType: "LOW_TRUST_CLUSTER",
        concentrationHash: hashAnalysisValue("trust-concentration", { recommendationId: strength.recommendationId, type: "LOW_TRUST_CLUSTER", degradedCount }),
      }));
    }
    for (const dimension of ["GOVERNANCE_TRUST", "DEPENDENCY_TRUST", "IMPACT_TRUST", "PORTFOLIO_TRUST"] as const) {
      const trust = trustRecords.find((record) => record.trustDimension === dimension);
      if (!trust || trust.trustState === "TRUSTED") continue;
      const concentrationType = (
        dimension === "GOVERNANCE_TRUST" ? "GOVERNANCE_CONCENTRATION"
          : dimension === "DEPENDENCY_TRUST" ? "DEPENDENCY_CONCENTRATION"
            : dimension === "IMPACT_TRUST" ? "IMPACT_CONCENTRATION"
              : "PORTFOLIO_CONCENTRATION"
      );
      records.push(Object.freeze({
        concentrationId: hashAnalysisValue("trust-concentration-id", { recommendationId: strength.recommendationId, concentrationType }),
        recommendationId: strength.recommendationId,
        concentrationType,
        concentrationHash: hashAnalysisValue("trust-concentration", { recommendationId: strength.recommendationId, concentrationType, trustId: trust.trustId }),
      }));
    }
  }
  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.concentrationType.localeCompare(right.concentrationType)
    || left.concentrationId.localeCompare(right.concentrationId)
  ));
}

function propagationAnalysis(input: TrustAnalysisInput): RecommendationTrustPropagation[] {
  const records: RecommendationTrustPropagation[] = [];
  const bundles = new Map(orderedBundles(input.recommendations).map((bundle) => [recommendationId(bundle), bundle]));
  for (const trust of orderedTrusts(input.foundation.trusts)) {
    const bundle = bundles.get(trust.recommendationId);
    if (!bundle) continue;
    const propagationRefs = [
      { type: "TRUST_PATH" as const, value: trust.currentReference },
      { type: "INHERITANCE_CHAIN" as const, value: bundle.lineage.result.reconstructionHash },
      { type: "CONTINUITY_PATH" as const, value: bundle.replay.result.replayHash },
    ];
    for (const propagation of propagationRefs) {
      records.push(Object.freeze({
        propagationId: hashAnalysisValue("trust-propagation-id", { recommendationId: trust.recommendationId, type: propagation.type, value: propagation.value }),
        recommendationId: trust.recommendationId,
        propagationType: propagation.type,
        propagationReference: propagation.value,
        propagationHash: hashAnalysisValue("trust-propagation", { trustId: trust.trustId, type: propagation.type, value: propagation.value }),
      }));
    }
    for (const dependencyRef of input.dependencyCertification.evidencePath.chainReferences) {
      records.push(Object.freeze({
        propagationId: hashAnalysisValue("trust-propagation-id", { recommendationId: trust.recommendationId, type: "DEPENDENCY_PROPAGATION", value: dependencyRef }),
        recommendationId: trust.recommendationId,
        propagationType: "DEPENDENCY_PROPAGATION",
        propagationReference: dependencyRef,
        propagationHash: hashAnalysisValue("trust-propagation", { trustId: trust.trustId, type: "DEPENDENCY_PROPAGATION", value: dependencyRef }),
      }));
    }
    for (const impactRef of input.impactCertification.evidencePath.propagationReferences) {
      records.push(Object.freeze({
        propagationId: hashAnalysisValue("trust-propagation-id", { recommendationId: trust.recommendationId, type: "IMPACT_PROPAGATION", value: impactRef }),
        recommendationId: trust.recommendationId,
        propagationType: "IMPACT_PROPAGATION",
        propagationReference: impactRef,
        propagationHash: hashAnalysisValue("trust-propagation", { trustId: trust.trustId, type: "IMPACT_PROPAGATION", value: impactRef }),
      }));
    }
  }
  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.propagationType.localeCompare(right.propagationType)
    || left.propagationReference.localeCompare(right.propagationReference)
  ));
}

function gapAnalysis(input: TrustAnalysisInput): RecommendationTrustGap[] {
  const records: RecommendationTrustGap[] = [];
  for (const trust of orderedTrusts(input.foundation.trusts)) {
    if (trust.trustState !== "UNKNOWN") continue;
    const gapType = (
      trust.trustDimension === "LINEAGE_TRUST" ? "MISSING_LINEAGE_TRUST"
        : trust.trustDimension === "GOVERNANCE_TRUST" ? "MISSING_GOVERNANCE_TRUST"
          : trust.trustDimension === "REPLAY_TRUST" ? "MISSING_REPLAY_TRUST"
            : trust.trustDimension === "READINESS_TRUST" ? "MISSING_READINESS_TRUST"
              : trust.trustDimension === "DRIFT_TRUST" ? "MISSING_CERTIFICATION_TRUST"
                : "MISSING_TRUST_EVIDENCE"
    );
    records.push(Object.freeze({
      gapId: hashAnalysisValue("trust-gap-id", { recommendationId: trust.recommendationId, gapType, trustId: trust.trustId }),
      recommendationId: trust.recommendationId,
      gapType,
      gapHash: hashAnalysisValue("trust-gap", { recommendationId: trust.recommendationId, gapType, trustId: trust.trustId }),
    }));
  }
  if (input.foundation.evidencePath.trustReferences.length === 0) {
    records.push(Object.freeze({
      gapId: hashAnalysisValue("trust-gap-id", { recommendationId: "foundation", gapType: "MISSING_TRUST_EVIDENCE" }),
      recommendationId: "foundation",
      gapType: "MISSING_TRUST_EVIDENCE",
      gapHash: hashAnalysisValue("trust-gap", { recommendationId: "foundation", gapType: "MISSING_TRUST_EVIDENCE" }),
    }));
  }
  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.gapType.localeCompare(right.gapType)
    || left.gapId.localeCompare(right.gapId)
  ));
}

function conflictAnalysis(input: TrustAnalysisInput): RecommendationTrustConflict[] {
  const records: RecommendationTrustConflict[] = [];
  const bundles = new Map(orderedBundles(input.recommendations).map((bundle) => [recommendationId(bundle), bundle]));
  for (const trust of orderedTrusts(input.foundation.trusts)) {
    if (trust.trustState === "TRUSTED" || trust.trustState === "UNKNOWN") continue;
    const conflictType = (
      trust.trustDimension === "GOVERNANCE_TRUST" ? "GOVERNANCE_TRUST_CONFLICT"
        : trust.trustDimension === "LINEAGE_TRUST" ? "LINEAGE_TRUST_CONFLICT"
          : trust.trustDimension === "REPLAY_TRUST" ? "REPLAY_TRUST_CONFLICT"
            : trust.trustDimension === "DEPENDENCY_TRUST" ? "DEPENDENCY_TRUST_CONFLICT"
              : trust.trustDimension === "IMPACT_TRUST" ? "IMPACT_TRUST_CONFLICT"
                : "DRIFT_TRUST_CONFLICT"
    );
    records.push(Object.freeze({
      conflictId: hashAnalysisValue("trust-conflict-id", { recommendationId: trust.recommendationId, conflictType, trustId: trust.trustId }),
      recommendationId: trust.recommendationId,
      conflictType,
      conflictHash: hashAnalysisValue("trust-conflict", { recommendationId: trust.recommendationId, conflictType, trustId: trust.trustId }),
    }));
  }
  for (const bundle of orderedBundles(input.recommendations)) {
    const id = recommendationId(bundle);
    if (!governanceIntegrity(bundle) || !replayIntegrity(bundle) || bundle.ownershipEvidence.recommendationId !== id || bundle.replayEvidence.tenantId !== input.request.tenantId) {
      records.push(Object.freeze({
        conflictId: hashAnalysisValue("trust-conflict-id", { recommendationId: id, conflictType: "AUTHORITY_BOUNDARY_CONFLICT" }),
        recommendationId: id,
        conflictType: "AUTHORITY_BOUNDARY_CONFLICT",
        conflictHash: hashAnalysisValue("trust-conflict", { recommendationId: id, conflictType: "AUTHORITY_BOUNDARY_CONFLICT" }),
      }));
    }
  }
  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.conflictType.localeCompare(right.conflictType)
    || left.conflictId.localeCompare(right.conflictId)
  ));
}

function validateScope(scope: TrustAnalysisScope, reasons: TrustAnalysisReasonCode[]): boolean {
  const valid = ANALYSIS_SCOPES.includes(scope);
  addReason(reasons, valid ? "ANALYSIS_SCOPE_VALID" : "ANALYSIS_SCOPE_INVALID");
  return valid;
}

function validateRecommendationIds(request: TrustAnalysisRequest, reasons: TrustAnalysisReasonCode[]): boolean {
  const valid = request.recommendationIds.length > 0;
  addReason(reasons, valid ? "RECOMMENDATION_IDS_PRESENT" : "RECOMMENDATION_IDS_MISSING");
  return valid;
}

function validateFoundation(input: TrustAnalysisInput, reasons: TrustAnalysisReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, input.foundation.sealed === true ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: TrustAnalysisInput, reasons: TrustAnalysisReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
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
  addReason(reasons, input.driftReplay.sealed === true ? "DRIFT_REPLAY_REQUIRED" : "DRIFT_REPLAY_UNSEALED");
  addReason(reasons, input.driftCertification.sealed === true ? "DRIFT_CERTIFICATION_REQUIRED" : "DRIFT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactCertification.sealed === true ? "IMPACT_CERTIFICATION_REQUIRED" : "IMPACT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyCertification.sealed === true ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed === true ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: TrustAnalysisInput, reasons: TrustAnalysisReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.driftReplay.result.tenantIsolationVerified
    && input.driftCertification.result.tenantIsolationVerified
    && input.impactCertification.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
    && input.portfolioCertification.result.tenantIsolationVerified
    && orderedBundles(input.recommendations).every((bundle) => (
      bundle.ledger.entry.tenantId === tenantId
      && bundle.ownershipEvidence.tenantId === tenantId
      && bundle.governanceReferences.tenantId === tenantId
      && bundle.replayEvidence.tenantId === tenantId
    ));
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_TRUST_BLOCKED");
  return valid;
}

function validateOwnership(input: TrustAnalysisInput, reasons: TrustAnalysisReasonCode[]): boolean {
  const requested = normalizeStrings(input.request.recommendationIds);
  const actual = normalizeStrings(input.foundation.trusts.map((trust) => trust.recommendationId));
  const valid = input.foundation.validation.ownershipValid
    && requested.every((id) => actual.includes(id))
    && orderedBundles(input.recommendations).every((bundle) => bundle.ownershipEvidence.recommendationId === recommendationId(bundle));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateStrengths(strengths: readonly RecommendationTrustStrength[], reasons: TrustAnalysisReasonCode[]): boolean {
  const valid = strengths.length > 0;
  addReason(reasons, valid ? "TRUST_STRENGTH_ANALYZED" : "TRUST_STRENGTH_LIMITED");
  return valid;
}

function validateConcentrations(concentrations: readonly RecommendationTrustConcentration[], reasons: TrustAnalysisReasonCode[]): boolean {
  const valid = concentrations.length > 0;
  addReason(reasons, valid ? "TRUST_CONCENTRATION_ANALYZED" : "TRUST_CONCENTRATION_LIMITED");
  return valid;
}

function validatePropagations(propagations: readonly RecommendationTrustPropagation[], reasons: TrustAnalysisReasonCode[]): boolean {
  const valid = propagations.length > 0;
  addReason(reasons, valid ? "TRUST_PROPAGATION_ANALYZED" : "TRUST_PROPAGATION_LIMITED");
  return valid;
}

function validateGaps(gaps: readonly RecommendationTrustGap[], reasons: TrustAnalysisReasonCode[]): boolean {
  addReason(reasons, gaps.length > 0 ? "TRUST_GAPS_DETECTED" : "TRUST_GAPS_ABSENT");
  return gaps.length === 0;
}

function validateConflicts(conflicts: readonly RecommendationTrustConflict[], reasons: TrustAnalysisReasonCode[]): boolean {
  addReason(reasons, conflicts.length > 0 ? "TRUST_CONFLICTS_DETECTED" : "TRUST_CONFLICTS_ABSENT");
  return conflicts.length === 0;
}

function validateGovernance(input: TrustAnalysisInput, reasons: TrustAnalysisReasonCode[]): boolean {
  const valid = input.foundation.result.trustState !== "UNTRUSTED"
    && orderedBundles(input.recommendations).every(governanceIntegrity);
  addReason(reasons, valid ? "GOVERNANCE_CONTINUITY_PRESERVED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return valid;
}

function validateReplay(input: TrustAnalysisInput, reasons: TrustAnalysisReasonCode[]): boolean {
  const valid = input.foundation.result.trustState !== "UNTRUSTED"
    && orderedBundles(input.recommendations).every(replayIntegrity);
  addReason(reasons, valid ? "REPLAY_CONTINUITY_PRESERVED" : "REPLAY_CORRUPTION_DETECTED");
  return valid;
}

function validateTrustReferences(input: TrustAnalysisInput, reasons: TrustAnalysisReasonCode[]): boolean {
  const valid = input.foundation.evidencePath.trustReferences.length > 0;
  addReason(reasons, valid ? "TRUST_EVIDENCE_PRESENT" : "TRUST_EVIDENCE_MISSING");
  addReason(reasons, input.foundation.evidencePath.baselineReferences.length > 0 ? "BASELINE_REFERENCES_PRESENT" : "BASELINE_REFERENCES_MISSING");
  addReason(reasons, input.foundation.evidencePath.currentReferences.length > 0 ? "CURRENT_REFERENCES_PRESENT" : "CURRENT_REFERENCES_MISSING");
  return valid;
}

function validateBoundary(input: TrustAnalysisInput, reasons: TrustAnalysisReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
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
  addReason(reasons, input.analysisMutationAttempted === true ? "ANALYSIS_MUTATION_DETECTED" : "ANALYSIS_MUTATION_BLOCKED");
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
      || input.analysisMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createTrustAnalysisEvidencePath(
  input: TrustAnalysisInput,
  strengths: readonly RecommendationTrustStrength[],
  concentrations: readonly RecommendationTrustConcentration[],
  propagations: readonly RecommendationTrustPropagation[],
  gaps: readonly RecommendationTrustGap[],
  conflicts: readonly RecommendationTrustConflict[],
): TrustAnalysisEvidencePath {
  return Object.freeze({
    scope: input.request.analysisScope,
    trustReferences: normalizeStrings(input.foundation.trusts.map((trust) => trust.trustId)),
    strengthReferences: normalizeStrings(strengths.map((strength) => `${strength.recommendationId}:${strength.trustClass}`)),
    concentrationReferences: normalizeStrings(concentrations.map((concentration) => `${concentration.recommendationId}:${concentration.concentrationType}`)),
    propagationReferences: normalizeStrings(propagations.map((propagation) => `${propagation.recommendationId}:${propagation.propagationType}:${propagation.propagationReference}`)),
    gapReferences: normalizeStrings(gaps.map((gap) => `${gap.recommendationId}:${gap.gapType}`)),
    conflictReferences: normalizeStrings(conflicts.map((conflict) => `${conflict.recommendationId}:${conflict.conflictType}`)),
    baselineReferences: normalizeStrings(input.foundation.evidencePath.baselineReferences),
    currentReferences: normalizeStrings(input.foundation.evidencePath.currentReferences),
    evidenceHashes: normalizeStrings([
      input.foundation.result.trustGraphHash,
      input.driftReplay.result.replayHash,
      input.driftCertification.result.certificationHash,
      input.impactCertification.result.certificationHash,
      input.dependencyCertification.result.certificationHash,
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
  trustRecordCount: number,
  propagationCount: number,
  conflictCount: number,
  reasons: TrustAnalysisReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_RECOMMENDATIONS
    && trustRecordCount <= MAX_TRUST_RECORDS
    && propagationCount <= MAX_PROPAGATION_PATHS
    && conflictCount <= MAX_TRUST_CONFLICTS;
  addReason(reasons, recommendationCount <= MAX_RECOMMENDATIONS ? "RECOMMENDATION_LIMIT_VALID" : "RECOMMENDATION_LIMIT_EXCEEDED");
  addReason(reasons, trustRecordCount <= MAX_TRUST_RECORDS ? "TRUST_RECORD_LIMIT_VALID" : "TRUST_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, propagationCount <= MAX_PROPAGATION_PATHS ? "PROPAGATION_LIMIT_VALID" : "PROPAGATION_LIMIT_EXCEEDED");
  addReason(reasons, conflictCount <= MAX_TRUST_CONFLICTS ? "CONFLICT_LIMIT_VALID" : "CONFLICT_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: TrustAnalysisRequest,
  analysisState: TrustAnalysisResult["analysisState"],
  strengths: readonly RecommendationTrustStrength[],
  concentrations: readonly RecommendationTrustConcentration[],
  propagations: readonly RecommendationTrustPropagation[],
  gaps: readonly RecommendationTrustGap[],
  conflicts: readonly RecommendationTrustConflict[],
  tenantIsolationVerified: boolean,
  analysisHash: string,
): TrustAnalysisResult {
  return Object.freeze({
    tenantId: request.tenantId,
    analysisState,
    trustStrengthsDetected: strengths.length,
    trustConcentrationsDetected: concentrations.length,
    trustPropagationsDetected: propagations.length,
    trustGapsDetected: gaps.length,
    trustConflictsDetected: conflicts.length,
    tenantIsolationVerified,
    analysisHash,
    deterministic: true,
  });
}

function buildObservability(result: TrustAnalysisResult): TrustAnalysisObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    analysisState: result.analysisState,
    trustStrengthsDetected: result.trustStrengthsDetected,
    trustConcentrationsDetected: result.trustConcentrationsDetected,
    trustPropagationsDetected: result.trustPropagationsDetected,
    trustGapsDetected: result.trustGapsDetected,
    trustConflictsDetected: result.trustConflictsDetected,
    analysisHash: result.analysisHash,
  });
}

function buildValidation(
  analysisState: TrustAnalysisResult["analysisState"],
  reasonCodes: readonly TrustAnalysisReasonCode[],
  strengths: readonly RecommendationTrustStrength[],
  concentrations: readonly RecommendationTrustConcentration[],
  propagations: readonly RecommendationTrustPropagation[],
  gaps: readonly RecommendationTrustGap[],
  conflicts: readonly RecommendationTrustConflict[],
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
): TrustAnalysisValidation {
  return Object.freeze({
    valid: analysisState !== "INVALID",
    analysisState,
    reasonCodes: [...reasonCodes],
    trustStrengthsDetected: strengths.length,
    trustConcentrationsDetected: concentrations.length,
    trustPropagationsDetected: propagations.length,
    trustGapsDetected: gaps.length,
    trustConflictsDetected: conflicts.length,
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
  });
}

export function buildTrustAnalysisRequest(request: TrustAnalysisRequest): TrustAnalysisRequest {
  return requestCore(request);
}

export function sealTrustAnalysis(input: TrustAnalysisInput): SealedTrustAnalysisRecord {
  const reasons: TrustAnalysisReasonCode[] = [];
  const strengths = includesScope(input.request.analysisScope, "STRENGTH") ? strengthAnalysis(input, reasons) : [];
  const concentrations = includesScope(input.request.analysisScope, "CONCENTRATION") ? concentrationAnalysis(strengths, input.foundation.trusts) : [];
  const propagations = includesScope(input.request.analysisScope, "PROPAGATION") ? propagationAnalysis(input) : [];
  const gaps = includesScope(input.request.analysisScope, "GAPS") ? gapAnalysis(input) : [];
  const conflicts = includesScope(input.request.analysisScope, "CONFLICTS") ? conflictAnalysis(input) : [];

  const requestValid = validateRecommendationIds(input.request, reasons) && validateScope(input.request.analysisScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const strengthsValid = includesScope(input.request.analysisScope, "STRENGTH") ? validateStrengths(strengths, reasons) : true;
  const concentrationsValid = includesScope(input.request.analysisScope, "CONCENTRATION") ? validateConcentrations(concentrations, reasons) : true;
  const propagationsValid = includesScope(input.request.analysisScope, "PROPAGATION") ? validatePropagations(propagations, reasons) : true;
  const gapsClear = includesScope(input.request.analysisScope, "GAPS") ? validateGaps(gaps, reasons) : true;
  const conflictsClear = includesScope(input.request.analysisScope, "CONFLICTS") ? validateConflicts(conflicts, reasons) : true;
  const governanceValid = validateGovernance(input, reasons);
  const replayValid = validateReplay(input, reasons);
  const trustEvidencePresent = validateTrustReferences(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createTrustAnalysisEvidencePath(input, strengths, concentrations, propagations, gaps, conflicts);
  const limitsValid = validateLimits(
    normalizeStrings(input.request.recommendationIds).length,
    input.foundation.trusts.length,
    propagations.length,
    conflicts.length,
    reasons,
  );
  addReason(reasons, "TRUST_ANALYSIS_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !foundationValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || !governanceValid
    || !replayValid
    || boundary.invalidBoundary;
  const observe = !invalid && (!trustEvidencePresent || input.foundation.result.trustState === "UNKNOWN");
  const limited = !invalid && !observe && (
    !strengthsValid
    || !concentrationsValid
    || !propagationsValid
    || !gapsClear
    || !conflictsClear
    || !limitsValid
    || input.foundation.result.trustState === "CONDITIONALLY_TRUSTED"
    || input.foundation.result.trustState === "DEGRADED"
  );
  const analysisState = invalid ? "INVALID" : observe ? "OBSERVE" : limited ? "LIMITED" : "ANALYZED";

  const analysisHash = hashAnalysisValue("trust-analysis-engine", {
    request: requestCore(input.request),
    analysisState,
    trustReferences: evidencePath.trustReferences,
    strengthReferences: evidencePath.strengthReferences,
    concentrationReferences: evidencePath.concentrationReferences,
    propagationReferences: evidencePath.propagationReferences,
    gapReferences: evidencePath.gapReferences,
    conflictReferences: evidencePath.conflictReferences,
    baselineReferences: evidencePath.baselineReferences,
    currentReferences: evidencePath.currentReferences,
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
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
