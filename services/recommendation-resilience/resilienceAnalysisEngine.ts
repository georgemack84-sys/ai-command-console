import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  RecommendationResilience,
  RecommendationResilienceConcentration,
  RecommendationResilienceDimension,
  RecommendationResilienceFailure,
  RecommendationResilienceGap,
  RecommendationResiliencePropagation,
  RecommendationResilienceStrength,
  RecommendationResilienceStrengthClass,
  RecommendationResilienceState,
  ResilienceAnalysisEvidencePath,
  ResilienceAnalysisInput,
  ResilienceAnalysisObservability,
  ResilienceAnalysisReasonCode,
  ResilienceAnalysisRequest,
  ResilienceAnalysisResult,
  ResilienceAnalysisScope,
  ResilienceAnalysisValidation,
  SealedResilienceAnalysisRecord,
} from "./types";

const MAX_RECOMMENDATIONS = 10_000;
const MAX_RESILIENCE_RECORDS = 50_000;
const MAX_RESILIENCE_FAILURES = 10_000;
const MAX_PROPAGATION_PATHS = 25_000;

const ANALYSIS_SCOPES: readonly ResilienceAnalysisScope[] = Object.freeze([
  "STRENGTH",
  "CONCENTRATION",
  "PROPAGATION",
  "GAPS",
  "FAILURES",
  "FULL",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  repairAbsent: boolean;
  invalidBoundary: boolean;
  controlSurfaceAbsent: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: ResilienceAnalysisReasonCode[], reason: ResilienceAnalysisReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashAnalysisValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: ResilienceAnalysisRequest): ResilienceAnalysisRequest {
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

function orderedResiliences(resiliences: readonly RecommendationResilience[]): RecommendationResilience[] {
  return [...resiliences].sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.resilienceDimension.localeCompare(right.resilienceDimension)
    || left.resilienceId.localeCompare(right.resilienceId)
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
    "repairAllowed",
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

function includesScope(scope: ResilienceAnalysisScope, requested: ResilienceAnalysisScope): boolean {
  return scope === "FULL" || scope === requested;
}

function resiliencesByRecommendation(resiliences: readonly RecommendationResilience[]): Map<string, RecommendationResilience[]> {
  const mapping = new Map<string, RecommendationResilience[]>();
  for (const resilience of orderedResiliences(resiliences)) {
    const bucket = mapping.get(resilience.recommendationId) ?? [];
    bucket.push(resilience);
    mapping.set(resilience.recommendationId, bucket);
  }
  return mapping;
}

function classifyStrength(
  resiliences: readonly RecommendationResilience[],
  reasons: ResilienceAnalysisReasonCode[],
): RecommendationResilienceStrengthClass {
  const states = resiliences.map((resilience) => resilience.resilienceState);
  if (states.includes("FRAGILE")) return "FRAGILE";
  if (states.includes("UNKNOWN")) return "WEAK";
  const concernCount = states.filter((state) => state !== "RESILIENT").length;
  if (concernCount === 0) return "VERY_RESILIENT";
  if (concernCount === 1 && states.includes("CONDITIONALLY_RESILIENT")) return "RESILIENT";
  if (states.includes("DEGRADED") || concernCount <= 2) return "MODERATELY_RESILIENT";
  addReason(reasons, "RESILIENCE_STRENGTH_LIMITED");
  return "WEAK";
}

function strengthAnalysis(
  input: ResilienceAnalysisInput,
  reasons: ResilienceAnalysisReasonCode[],
): RecommendationResilienceStrength[] {
  const records: RecommendationResilienceStrength[] = [];
  for (const [id, resiliences] of resiliencesByRecommendation(input.foundation.resiliences).entries()) {
    const resilientDimensions = resiliences
      .filter((resilience) => resilience.resilienceState === "RESILIENT")
      .map((resilience) => resilience.resilienceDimension);
    const degradedDimensions = resiliences
      .filter((resilience) => resilience.resilienceState === "CONDITIONALLY_RESILIENT" || resilience.resilienceState === "DEGRADED" || resilience.resilienceState === "FRAGILE")
      .map((resilience) => resilience.resilienceDimension);
    const unknownDimensions = resiliences
      .filter((resilience) => resilience.resilienceState === "UNKNOWN")
      .map((resilience) => resilience.resilienceDimension);
    const resilienceClass = classifyStrength(resiliences, reasons);
    records.push(Object.freeze({
      recommendationId: id,
      resilienceClass,
      resilientDimensions: Object.freeze(normalizeStrings(resilientDimensions) as RecommendationResilienceDimension[]),
      degradedDimensions: Object.freeze(normalizeStrings(degradedDimensions) as RecommendationResilienceDimension[]),
      unknownDimensions: Object.freeze(normalizeStrings(unknownDimensions) as RecommendationResilienceDimension[]),
      strengthHash: hashAnalysisValue("recommendation-resilience-strength", {
        recommendationId: id,
        resilienceClass,
        resilienceIds: resiliences.map((resilience) => resilience.resilienceId),
      }),
    }));
  }
  return records.sort((left, right) => left.recommendationId.localeCompare(right.recommendationId));
}

function concentrationAnalysis(
  strengths: readonly RecommendationResilienceStrength[],
  resiliences: readonly RecommendationResilience[],
): RecommendationResilienceConcentration[] {
  const records: RecommendationResilienceConcentration[] = [];
  const resilienceMap = resiliencesByRecommendation(resiliences);
  for (const strength of strengths) {
    const resilienceRecords = resilienceMap.get(strength.recommendationId) ?? [];
    const degradedCount = resilienceRecords.filter((resilience) => resilience.resilienceState !== "RESILIENT").length;
    if (strength.resilienceClass === "VERY_RESILIENT" || strength.resilienceClass === "RESILIENT") {
      records.push(Object.freeze({
        concentrationId: hashAnalysisValue("resilience-concentration-id", { recommendationId: strength.recommendationId, type: "HIGH_RESILIENCE_CLUSTER" }),
        recommendationId: strength.recommendationId,
        concentrationType: "HIGH_RESILIENCE_CLUSTER",
        concentrationHash: hashAnalysisValue("resilience-concentration", {
          recommendationId: strength.recommendationId,
          type: "HIGH_RESILIENCE_CLUSTER",
          resilienceIds: resilienceRecords.map((resilience) => resilience.resilienceId),
        }),
      }));
    }
    if (strength.resilienceClass === "WEAK" || strength.resilienceClass === "FRAGILE" || degradedCount >= 3) {
      records.push(Object.freeze({
        concentrationId: hashAnalysisValue("resilience-concentration-id", { recommendationId: strength.recommendationId, type: "LOW_RESILIENCE_CLUSTER" }),
        recommendationId: strength.recommendationId,
        concentrationType: "LOW_RESILIENCE_CLUSTER",
        concentrationHash: hashAnalysisValue("resilience-concentration", {
          recommendationId: strength.recommendationId,
          type: "LOW_RESILIENCE_CLUSTER",
          degradedCount,
        }),
      }));
    }
    for (const dimension of [
      "GOVERNANCE_RESILIENCE",
      "DEPENDENCY_RESILIENCE",
      "IMPACT_RESILIENCE",
      "PORTFOLIO_RESILIENCE",
    ] as const) {
      const resilience = resilienceRecords.find((record) => record.resilienceDimension === dimension);
      if (!resilience || resilience.resilienceState === "RESILIENT") continue;
      const concentrationType = (
        dimension === "GOVERNANCE_RESILIENCE" ? "GOVERNANCE_RESILIENCE_CONCENTRATION"
          : dimension === "DEPENDENCY_RESILIENCE" ? "DEPENDENCY_RESILIENCE_CONCENTRATION"
            : dimension === "IMPACT_RESILIENCE" ? "IMPACT_RESILIENCE_CONCENTRATION"
              : "PORTFOLIO_RESILIENCE_CONCENTRATION"
      );
      records.push(Object.freeze({
        concentrationId: hashAnalysisValue("resilience-concentration-id", { recommendationId: strength.recommendationId, concentrationType }),
        recommendationId: strength.recommendationId,
        concentrationType,
        concentrationHash: hashAnalysisValue("resilience-concentration", {
          recommendationId: strength.recommendationId,
          concentrationType,
          resilienceId: resilience.resilienceId,
        }),
      }));
    }
  }
  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.concentrationType.localeCompare(right.concentrationType)
    || left.concentrationId.localeCompare(right.concentrationId)
  ));
}

function propagationAnalysis(input: ResilienceAnalysisInput): RecommendationResiliencePropagation[] {
  const records: RecommendationResiliencePropagation[] = [];
  const bundles = new Map(orderedBundles(input.recommendations).map((bundle) => [recommendationId(bundle), bundle]));
  for (const resilience of orderedResiliences(input.foundation.resiliences)) {
    const bundle = bundles.get(resilience.recommendationId);
    if (!bundle) continue;
    const propagationRefs = [
      { type: "RESILIENCE_PATH" as const, value: resilience.disruptionReference },
      { type: "FAILURE_PROPAGATION" as const, value: bundle.lineage.result.reconstructionHash },
      { type: "RECOVERABILITY_CONTINUITY" as const, value: bundle.replay.result.replayHash },
    ];
    for (const propagation of propagationRefs) {
      records.push(Object.freeze({
        propagationId: hashAnalysisValue("resilience-propagation-id", {
          recommendationId: resilience.recommendationId,
          type: propagation.type,
          value: propagation.value,
        }),
        recommendationId: resilience.recommendationId,
        propagationType: propagation.type,
        propagationReference: propagation.value,
        propagationHash: hashAnalysisValue("resilience-propagation", {
          resilienceId: resilience.resilienceId,
          type: propagation.type,
          value: propagation.value,
        }),
      }));
    }
    for (const dependencyRef of input.dependencyCertification.evidencePath.chainReferences) {
      records.push(Object.freeze({
        propagationId: hashAnalysisValue("resilience-propagation-id", { recommendationId: resilience.recommendationId, type: "DEPENDENCY_DISRUPTION_PROPAGATION", value: dependencyRef }),
        recommendationId: resilience.recommendationId,
        propagationType: "DEPENDENCY_DISRUPTION_PROPAGATION",
        propagationReference: dependencyRef,
        propagationHash: hashAnalysisValue("resilience-propagation", { resilienceId: resilience.resilienceId, type: "DEPENDENCY_DISRUPTION_PROPAGATION", value: dependencyRef }),
      }));
    }
    for (const impactRef of input.impactCertification.evidencePath.propagationReferences) {
      records.push(Object.freeze({
        propagationId: hashAnalysisValue("resilience-propagation-id", { recommendationId: resilience.recommendationId, type: "IMPACT_DISRUPTION_PROPAGATION", value: impactRef }),
        recommendationId: resilience.recommendationId,
        propagationType: "IMPACT_DISRUPTION_PROPAGATION",
        propagationReference: impactRef,
        propagationHash: hashAnalysisValue("resilience-propagation", { resilienceId: resilience.resilienceId, type: "IMPACT_DISRUPTION_PROPAGATION", value: impactRef }),
      }));
    }
  }
  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.propagationType.localeCompare(right.propagationType)
    || left.propagationReference.localeCompare(right.propagationReference)
  ));
}

function gapTypeForDimension(dimension: RecommendationResilienceDimension): RecommendationResilienceGap["gapType"] {
  return (
    dimension === "LINEAGE_RESILIENCE" ? "MISSING_LINEAGE_RESILIENCE"
      : dimension === "GOVERNANCE_RESILIENCE" ? "MISSING_GOVERNANCE_RESILIENCE"
        : dimension === "REPLAY_RESILIENCE" ? "MISSING_REPLAY_RESILIENCE"
          : dimension === "DEPENDENCY_RESILIENCE" ? "MISSING_DEPENDENCY_RESILIENCE"
            : dimension === "TRUST_RESILIENCE" ? "MISSING_TRUST_RESILIENCE"
              : "MISSING_RESILIENCE_EVIDENCE"
  );
}

function gapAnalysis(input: ResilienceAnalysisInput): RecommendationResilienceGap[] {
  const records: RecommendationResilienceGap[] = [];
  for (const resilience of orderedResiliences(input.foundation.resiliences)) {
    if (resilience.resilienceState !== "UNKNOWN") continue;
    const gapType = gapTypeForDimension(resilience.resilienceDimension);
    records.push(Object.freeze({
      gapId: hashAnalysisValue("resilience-gap-id", { recommendationId: resilience.recommendationId, gapType, resilienceId: resilience.resilienceId }),
      recommendationId: resilience.recommendationId,
      gapType,
      gapHash: hashAnalysisValue("resilience-gap", { recommendationId: resilience.recommendationId, gapType, resilienceId: resilience.resilienceId }),
    }));
  }
  if (input.foundation.evidencePath.resilienceReferences.length === 0) {
    records.push(Object.freeze({
      gapId: hashAnalysisValue("resilience-gap-id", { recommendationId: "foundation", gapType: "MISSING_RESILIENCE_EVIDENCE" }),
      recommendationId: "foundation",
      gapType: "MISSING_RESILIENCE_EVIDENCE",
      gapHash: hashAnalysisValue("resilience-gap", { recommendationId: "foundation", gapType: "MISSING_RESILIENCE_EVIDENCE" }),
    }));
  }
  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.gapType.localeCompare(right.gapType)
    || left.gapId.localeCompare(right.gapId)
  ));
}

function failureTypeForDimension(dimension: RecommendationResilienceDimension): RecommendationResilienceFailure["failureType"] {
  return (
    dimension === "GOVERNANCE_RESILIENCE" ? "GOVERNANCE_RESILIENCE_FAILURE"
      : dimension === "LINEAGE_RESILIENCE" ? "LINEAGE_RESILIENCE_FAILURE"
        : dimension === "REPLAY_RESILIENCE" ? "REPLAY_RESILIENCE_FAILURE"
          : dimension === "DEPENDENCY_RESILIENCE" ? "DEPENDENCY_RESILIENCE_FAILURE"
            : dimension === "IMPACT_RESILIENCE" ? "IMPACT_RESILIENCE_FAILURE"
              : dimension === "DRIFT_RESILIENCE" ? "DRIFT_RESILIENCE_FAILURE"
                : "TRUST_RESILIENCE_FAILURE"
  );
}

function failureAnalysis(input: ResilienceAnalysisInput): RecommendationResilienceFailure[] {
  const records: RecommendationResilienceFailure[] = [];
  const bundles = new Map(orderedBundles(input.recommendations).map((bundle) => [recommendationId(bundle), bundle]));
  for (const resilience of orderedResiliences(input.foundation.resiliences)) {
    if (resilience.resilienceState === "RESILIENT" || resilience.resilienceState === "UNKNOWN") continue;
    const failureType = failureTypeForDimension(resilience.resilienceDimension);
    records.push(Object.freeze({
      failureId: hashAnalysisValue("resilience-failure-id", { recommendationId: resilience.recommendationId, failureType, resilienceId: resilience.resilienceId }),
      recommendationId: resilience.recommendationId,
      failureType,
      failureHash: hashAnalysisValue("resilience-failure", { recommendationId: resilience.recommendationId, failureType, resilienceId: resilience.resilienceId }),
    }));
  }
  for (const bundle of orderedBundles(input.recommendations)) {
    const id = recommendationId(bundle);
    if (!governanceIntegrity(bundle) || !replayIntegrity(bundle) || bundle.ownershipEvidence.recommendationId !== id || bundle.replayEvidence.tenantId !== input.request.tenantId) {
      records.push(Object.freeze({
        failureId: hashAnalysisValue("resilience-failure-id", { recommendationId: id, failureType: "AUTHORITY_BOUNDARY_FAILURE" }),
        recommendationId: id,
        failureType: "AUTHORITY_BOUNDARY_FAILURE",
        failureHash: hashAnalysisValue("resilience-failure", { recommendationId: id, failureType: "AUTHORITY_BOUNDARY_FAILURE" }),
      }));
    }
  }
  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.failureType.localeCompare(right.failureType)
    || left.failureId.localeCompare(right.failureId)
  ));
}

function validateScope(scope: ResilienceAnalysisScope, reasons: ResilienceAnalysisReasonCode[]): boolean {
  const valid = ANALYSIS_SCOPES.includes(scope);
  addReason(reasons, valid ? "ANALYSIS_SCOPE_VALID" : "ANALYSIS_SCOPE_INVALID");
  return valid;
}

function validateRecommendationIds(request: ResilienceAnalysisRequest, reasons: ResilienceAnalysisReasonCode[]): boolean {
  const valid = request.recommendationIds.length > 0;
  addReason(reasons, valid ? "RECOMMENDATION_IDS_PRESENT" : "RECOMMENDATION_IDS_MISSING");
  return valid;
}

function validateFoundation(input: ResilienceAnalysisInput, reasons: ResilienceAnalysisReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, input.foundation.sealed === true ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: ResilienceAnalysisInput, reasons: ResilienceAnalysisReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.trustReplay.sealed === true
    && input.trustCertification.sealed === true
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
  addReason(reasons, input.trustReplay.sealed === true ? "TRUST_REPLAY_REQUIRED" : "TRUST_REPLAY_UNSEALED");
  addReason(reasons, input.trustCertification.sealed === true ? "TRUST_CERTIFICATION_REQUIRED" : "TRUST_CERTIFICATION_UNSEALED");
  addReason(reasons, input.driftReplay.sealed === true ? "DRIFT_REPLAY_REQUIRED" : "DRIFT_REPLAY_UNSEALED");
  addReason(reasons, input.driftCertification.sealed === true ? "DRIFT_CERTIFICATION_REQUIRED" : "DRIFT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactCertification.sealed === true ? "IMPACT_CERTIFICATION_REQUIRED" : "IMPACT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyCertification.sealed === true ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed === true ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: ResilienceAnalysisInput, reasons: ResilienceAnalysisReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.trustReplay.result.tenantIsolationVerified
    && input.trustCertification.result.tenantIsolationVerified
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
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_RESILIENCE_BLOCKED");
  return valid;
}

function validateOwnership(input: ResilienceAnalysisInput, reasons: ResilienceAnalysisReasonCode[]): boolean {
  const requested = normalizeStrings(input.request.recommendationIds);
  const actual = normalizeStrings(input.foundation.resiliences.map((resilience) => resilience.recommendationId));
  const valid = input.foundation.validation.ownershipValid
    && requested.every((id) => actual.includes(id))
    && orderedBundles(input.recommendations).every((bundle) => bundle.ownershipEvidence.recommendationId === recommendationId(bundle));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateStrengths(strengths: readonly RecommendationResilienceStrength[], reasons: ResilienceAnalysisReasonCode[]): boolean {
  const valid = strengths.length > 0;
  addReason(reasons, valid ? "RESILIENCE_STRENGTH_ANALYZED" : "RESILIENCE_STRENGTH_LIMITED");
  return valid;
}

function validateConcentrations(concentrations: readonly RecommendationResilienceConcentration[], reasons: ResilienceAnalysisReasonCode[]): boolean {
  const valid = concentrations.length > 0;
  addReason(reasons, valid ? "RESILIENCE_CONCENTRATION_ANALYZED" : "RESILIENCE_CONCENTRATION_LIMITED");
  return valid;
}

function validatePropagations(propagations: readonly RecommendationResiliencePropagation[], reasons: ResilienceAnalysisReasonCode[]): boolean {
  const valid = propagations.length > 0;
  addReason(reasons, valid ? "RESILIENCE_PROPAGATION_ANALYZED" : "RESILIENCE_PROPAGATION_LIMITED");
  return valid;
}

function validateGaps(gaps: readonly RecommendationResilienceGap[], reasons: ResilienceAnalysisReasonCode[]): boolean {
  addReason(reasons, gaps.length > 0 ? "RESILIENCE_GAPS_DETECTED" : "RESILIENCE_GAPS_ABSENT");
  return gaps.length === 0;
}

function validateFailures(failures: readonly RecommendationResilienceFailure[], reasons: ResilienceAnalysisReasonCode[]): boolean {
  addReason(reasons, failures.length > 0 ? "RESILIENCE_FAILURES_DETECTED" : "RESILIENCE_FAILURES_ABSENT");
  return failures.length === 0;
}

function validateGovernance(input: ResilienceAnalysisInput, reasons: ResilienceAnalysisReasonCode[]): boolean {
  const valid = input.foundation.result.resilienceState !== "FRAGILE"
    && orderedBundles(input.recommendations).every(governanceIntegrity);
  addReason(reasons, valid ? "GOVERNANCE_CONTINUITY_PRESERVED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return valid;
}

function validateReplay(input: ResilienceAnalysisInput, reasons: ResilienceAnalysisReasonCode[]): boolean {
  const valid = input.foundation.result.resilienceState !== "FRAGILE"
    && orderedBundles(input.recommendations).every(replayIntegrity);
  addReason(reasons, valid ? "REPLAY_CONTINUITY_PRESERVED" : "REPLAY_CORRUPTION_DETECTED");
  return valid;
}

function validateResilienceReferences(input: ResilienceAnalysisInput, reasons: ResilienceAnalysisReasonCode[]): boolean {
  const valid = input.foundation.evidencePath.resilienceReferences.length > 0;
  addReason(reasons, valid ? "RESILIENCE_EVIDENCE_PRESENT" : "RESILIENCE_EVIDENCE_MISSING");
  addReason(reasons, input.foundation.evidencePath.baselineReferences.length > 0 ? "BASELINE_REFERENCES_PRESENT" : "BASELINE_REFERENCES_MISSING");
  addReason(reasons, input.foundation.evidencePath.disruptionReferences.length > 0 ? "DISRUPTION_REFERENCES_PRESENT" : "DISRUPTION_REFERENCES_MISSING");
  return valid;
}

function validateBoundary(input: ResilienceAnalysisInput, reasons: ResilienceAnalysisReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const repairAbsent = input.repairRequested !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.trustReplay.controlSurfacePresent
    && !input.trustCertification.controlSurfacePresent
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
  addReason(reasons, repairAbsent ? "REPAIR_ABSENT" : "REPAIR_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.analysisMutationAttempted === true ? "ANALYSIS_MUTATION_DETECTED" : "ANALYSIS_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  return Object.freeze({
    executionImpossible,
    authorityBounded,
    repairAbsent,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || input.prioritizationRequested === true
      || input.recommendationRankingRequested === true
      || input.approvalRequested === true
      || !repairAbsent
      || !authorityBounded
      || input.analysisMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createResilienceAnalysisEvidencePath(
  input: ResilienceAnalysisInput,
  strengths: readonly RecommendationResilienceStrength[],
  concentrations: readonly RecommendationResilienceConcentration[],
  propagations: readonly RecommendationResiliencePropagation[],
  gaps: readonly RecommendationResilienceGap[],
  failures: readonly RecommendationResilienceFailure[],
): ResilienceAnalysisEvidencePath {
  return Object.freeze({
    scope: input.request.analysisScope,
    resilienceReferences: normalizeStrings(input.foundation.resiliences.map((resilience) => resilience.resilienceId)),
    strengthReferences: normalizeStrings(strengths.map((strength) => `${strength.recommendationId}:${strength.resilienceClass}`)),
    concentrationReferences: normalizeStrings(concentrations.map((concentration) => `${concentration.recommendationId}:${concentration.concentrationType}`)),
    propagationReferences: normalizeStrings(propagations.map((propagation) => `${propagation.recommendationId}:${propagation.propagationType}:${propagation.propagationReference}`)),
    gapReferences: normalizeStrings(gaps.map((gap) => `${gap.recommendationId}:${gap.gapType}`)),
    failureReferences: normalizeStrings(failures.map((failure) => `${failure.recommendationId}:${failure.failureType}`)),
    baselineReferences: normalizeStrings(input.foundation.evidencePath.baselineReferences),
    disruptionReferences: normalizeStrings(input.foundation.evidencePath.disruptionReferences),
    evidenceHashes: normalizeStrings([
      input.foundation.result.resilienceGraphHash,
      input.trustReplay.result.replayHash,
      input.trustCertification.result.certificationHash,
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
      ...failures.map((failure) => failure.failureHash),
    ]),
  });
}

function validateLimits(
  recommendationCount: number,
  resilienceRecordCount: number,
  propagationCount: number,
  failureCount: number,
  reasons: ResilienceAnalysisReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_RECOMMENDATIONS
    && resilienceRecordCount <= MAX_RESILIENCE_RECORDS
    && propagationCount <= MAX_PROPAGATION_PATHS
    && failureCount <= MAX_RESILIENCE_FAILURES;
  addReason(reasons, recommendationCount <= MAX_RECOMMENDATIONS ? "RECOMMENDATION_LIMIT_VALID" : "RECOMMENDATION_LIMIT_EXCEEDED");
  addReason(reasons, resilienceRecordCount <= MAX_RESILIENCE_RECORDS ? "RESILIENCE_RECORD_LIMIT_VALID" : "RESILIENCE_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, propagationCount <= MAX_PROPAGATION_PATHS ? "PROPAGATION_LIMIT_VALID" : "PROPAGATION_LIMIT_EXCEEDED");
  addReason(reasons, failureCount <= MAX_RESILIENCE_FAILURES ? "FAILURE_LIMIT_VALID" : "FAILURE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: ResilienceAnalysisRequest,
  analysisState: ResilienceAnalysisResult["analysisState"],
  strengths: readonly RecommendationResilienceStrength[],
  concentrations: readonly RecommendationResilienceConcentration[],
  propagations: readonly RecommendationResiliencePropagation[],
  gaps: readonly RecommendationResilienceGap[],
  failures: readonly RecommendationResilienceFailure[],
  tenantIsolationVerified: boolean,
  analysisHash: string,
): ResilienceAnalysisResult {
  return Object.freeze({
    tenantId: request.tenantId,
    analysisState,
    resilienceStrengthsDetected: strengths.length,
    resilienceConcentrationsDetected: concentrations.length,
    resiliencePropagationsDetected: propagations.length,
    resilienceGapsDetected: gaps.length,
    resilienceFailuresDetected: failures.length,
    tenantIsolationVerified,
    analysisHash,
    deterministic: true,
  });
}

function buildObservability(result: ResilienceAnalysisResult): ResilienceAnalysisObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    analysisState: result.analysisState,
    resilienceStrengthsDetected: result.resilienceStrengthsDetected,
    resilienceConcentrationsDetected: result.resilienceConcentrationsDetected,
    resiliencePropagationsDetected: result.resiliencePropagationsDetected,
    resilienceGapsDetected: result.resilienceGapsDetected,
    resilienceFailuresDetected: result.resilienceFailuresDetected,
    analysisHash: result.analysisHash,
  });
}

function buildValidation(
  analysisState: ResilienceAnalysisResult["analysisState"],
  reasonCodes: readonly ResilienceAnalysisReasonCode[],
  strengths: readonly RecommendationResilienceStrength[],
  concentrations: readonly RecommendationResilienceConcentration[],
  propagations: readonly RecommendationResiliencePropagation[],
  gaps: readonly RecommendationResilienceGap[],
  failures: readonly RecommendationResilienceFailure[],
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
): ResilienceAnalysisValidation {
  return Object.freeze({
    valid: analysisState !== "INVALID",
    analysisState,
    reasonCodes: [...reasonCodes],
    resilienceStrengthsDetected: strengths.length,
    resilienceConcentrationsDetected: concentrations.length,
    resiliencePropagationsDetected: propagations.length,
    resilienceGapsDetected: gaps.length,
    resilienceFailuresDetected: failures.length,
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    repairAbsent: boundary.repairAbsent,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
  });
}

export function buildResilienceAnalysisRequest(request: ResilienceAnalysisRequest): ResilienceAnalysisRequest {
  return requestCore(request);
}

export function sealResilienceAnalysis(input: ResilienceAnalysisInput): SealedResilienceAnalysisRecord {
  const reasons: ResilienceAnalysisReasonCode[] = [];
  const strengths = includesScope(input.request.analysisScope, "STRENGTH") ? strengthAnalysis(input, reasons) : [];
  const concentrations = includesScope(input.request.analysisScope, "CONCENTRATION") ? concentrationAnalysis(strengths, input.foundation.resiliences) : [];
  const propagations = includesScope(input.request.analysisScope, "PROPAGATION") ? propagationAnalysis(input) : [];
  const gaps = includesScope(input.request.analysisScope, "GAPS") ? gapAnalysis(input) : [];
  const failures = includesScope(input.request.analysisScope, "FAILURES") ? failureAnalysis(input) : [];

  const requestValid = validateRecommendationIds(input.request, reasons) && validateScope(input.request.analysisScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const strengthsValid = includesScope(input.request.analysisScope, "STRENGTH") ? validateStrengths(strengths, reasons) : true;
  const concentrationsValid = includesScope(input.request.analysisScope, "CONCENTRATION") ? validateConcentrations(concentrations, reasons) : true;
  const propagationsValid = includesScope(input.request.analysisScope, "PROPAGATION") ? validatePropagations(propagations, reasons) : true;
  const gapsClear = includesScope(input.request.analysisScope, "GAPS") ? validateGaps(gaps, reasons) : true;
  const failuresClear = includesScope(input.request.analysisScope, "FAILURES") ? validateFailures(failures, reasons) : true;
  const governanceValid = validateGovernance(input, reasons);
  const replayValid = validateReplay(input, reasons);
  const resilienceEvidencePresent = validateResilienceReferences(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createResilienceAnalysisEvidencePath(input, strengths, concentrations, propagations, gaps, failures);
  const limitsValid = validateLimits(
    normalizeStrings(input.request.recommendationIds).length,
    input.foundation.resiliences.length,
    propagations.length,
    failures.length,
    reasons,
  );
  addReason(reasons, "RESILIENCE_ANALYSIS_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !foundationValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || !governanceValid
    || !replayValid
    || boundary.invalidBoundary;
  const observe = !invalid && (!resilienceEvidencePresent || input.foundation.result.resilienceState === "UNKNOWN");
  const limited = !invalid && !observe && (
    !strengthsValid
    || !concentrationsValid
    || !propagationsValid
    || !gapsClear
    || !failuresClear
    || !limitsValid
    || input.foundation.result.resilienceState === "CONDITIONALLY_RESILIENT"
    || input.foundation.result.resilienceState === "DEGRADED"
  );
  const analysisState = invalid ? "INVALID" : observe ? "OBSERVE" : limited ? "LIMITED" : "ANALYZED";

  const analysisHash = hashAnalysisValue("resilience-analysis-engine", {
    request: requestCore(input.request),
    analysisState,
    resilienceReferences: evidencePath.resilienceReferences,
    strengthReferences: evidencePath.strengthReferences,
    concentrationReferences: evidencePath.concentrationReferences,
    propagationReferences: evidencePath.propagationReferences,
    gapReferences: evidencePath.gapReferences,
    failureReferences: evidencePath.failureReferences,
    baselineReferences: evidencePath.baselineReferences,
    disruptionReferences: evidencePath.disruptionReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    analysisState,
    strengths,
    concentrations,
    propagations,
    gaps,
    failures,
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
    failures,
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
    failures: Object.freeze(failures),
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
    repairAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
