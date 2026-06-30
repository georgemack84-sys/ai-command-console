import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  RecommendationResilience,
  RecommendationResilienceDimension,
  RecommendationResilienceEvidencePath,
  RecommendationResilienceFoundationInput,
  RecommendationResilienceFoundationObservability,
  RecommendationResilienceFoundationReasonCode,
  RecommendationResilienceFoundationRequest,
  RecommendationResilienceFoundationResult,
  RecommendationResilienceFoundationValidation,
  RecommendationResilienceScope,
  RecommendationResilienceState,
  SealedRecommendationResilienceFoundationRecord,
} from "./types";

const MAX_RECOMMENDATIONS = 10_000;
const MAX_RESILIENCE_RECORDS = 50_000;
const MAX_LINEAGE_REFERENCES = 10_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_DISRUPTION_REFERENCES = 10_000;

const RESILIENCE_SCOPES: readonly RecommendationResilienceScope[] = Object.freeze([
  "EVIDENCE",
  "LINEAGE",
  "GOVERNANCE",
  "REPLAY",
  "READINESS",
  "PORTFOLIO",
  "DEPENDENCY",
  "IMPACT",
  "DRIFT",
  "TRUST",
  "FULL",
]);

const RESILIENCE_DIMENSIONS: readonly RecommendationResilienceDimension[] = Object.freeze([
  "EVIDENCE_RESILIENCE",
  "LINEAGE_RESILIENCE",
  "GOVERNANCE_RESILIENCE",
  "REPLAY_RESILIENCE",
  "READINESS_RESILIENCE",
  "PORTFOLIO_RESILIENCE",
  "DEPENDENCY_RESILIENCE",
  "IMPACT_RESILIENCE",
  "DRIFT_RESILIENCE",
  "TRUST_RESILIENCE",
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

function addReason(reasons: RecommendationResilienceFoundationReasonCode[], reason: RecommendationResilienceFoundationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashResilienceValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: RecommendationResilienceFoundationRequest): RecommendationResilienceFoundationRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    recommendationIds: [...request.recommendationIds],
    resilienceScope: request.resilienceScope,
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
    "repairAllowed",
    "authorityMutationAllowed",
    "controlSurfacePresent",
  ] as const;
  return blockedFlags.every((key) => record[key] !== true);
}

function includesScope(scope: RecommendationResilienceScope, dimension: RecommendationResilienceDimension): boolean {
  if (scope === "FULL") return true;
  return (
    (scope === "EVIDENCE" && dimension === "EVIDENCE_RESILIENCE")
    || (scope === "LINEAGE" && dimension === "LINEAGE_RESILIENCE")
    || (scope === "GOVERNANCE" && dimension === "GOVERNANCE_RESILIENCE")
    || (scope === "REPLAY" && dimension === "REPLAY_RESILIENCE")
    || (scope === "READINESS" && dimension === "READINESS_RESILIENCE")
    || (scope === "PORTFOLIO" && dimension === "PORTFOLIO_RESILIENCE")
    || (scope === "DEPENDENCY" && dimension === "DEPENDENCY_RESILIENCE")
    || (scope === "IMPACT" && dimension === "IMPACT_RESILIENCE")
    || (scope === "DRIFT" && dimension === "DRIFT_RESILIENCE")
    || (scope === "TRUST" && dimension === "TRUST_RESILIENCE")
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
    ...bundle.replayFramework.evidencePath.lineageReferences,
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

function mapTrustDimension(dimension: RecommendationResilienceDimension):
  | "EVIDENCE_TRUST"
  | "LINEAGE_TRUST"
  | "GOVERNANCE_TRUST"
  | "REPLAY_TRUST"
  | "READINESS_TRUST"
  | "PORTFOLIO_TRUST"
  | "DEPENDENCY_TRUST"
  | "IMPACT_TRUST"
  | "DRIFT_TRUST"
  | null {
  return (
    dimension === "EVIDENCE_RESILIENCE" ? "EVIDENCE_TRUST"
      : dimension === "LINEAGE_RESILIENCE" ? "LINEAGE_TRUST"
        : dimension === "GOVERNANCE_RESILIENCE" ? "GOVERNANCE_TRUST"
          : dimension === "REPLAY_RESILIENCE" ? "REPLAY_TRUST"
            : dimension === "READINESS_RESILIENCE" ? "READINESS_TRUST"
              : dimension === "PORTFOLIO_RESILIENCE" ? "PORTFOLIO_TRUST"
                : dimension === "DEPENDENCY_RESILIENCE" ? "DEPENDENCY_TRUST"
                  : dimension === "IMPACT_RESILIENCE" ? "IMPACT_TRUST"
                    : dimension === "DRIFT_RESILIENCE" ? "DRIFT_TRUST"
                      : null
  );
}

function trustStateFor(
  input: RecommendationResilienceFoundationInput,
  recommendationIdValue: string,
  dimension: RecommendationResilienceDimension,
): { baselineReference: string; disruptionReference: string; trustState?: string } | undefined {
  const trustDimension = mapTrustDimension(dimension);
  if (!trustDimension) return undefined;
  const trust = input.trustFoundation.trusts.find((record) => (
    record.recommendationId === recommendationIdValue
    && record.trustDimension === trustDimension
  ));
  return trust
    ? {
      baselineReference: trust.baselineReference,
      disruptionReference: trust.currentReference,
      trustState: trust.trustState,
    }
    : undefined;
}

function fallbackReference(
  recommendationIdValue: string,
  dimension: RecommendationResilienceDimension,
  payload: unknown,
): string {
  return hashResilienceValue("recommendation-resilience-reference", {
    recommendationId: recommendationIdValue,
    dimension,
    payload,
  });
}

function mapTrustStateToResilience(trustState: string | undefined): RecommendationResilienceState | null {
  return (
    trustState === "TRUSTED" ? "RESILIENT"
      : trustState === "CONDITIONALLY_TRUSTED" ? "CONDITIONALLY_RESILIENT"
        : trustState === "DEGRADED" ? "DEGRADED"
          : trustState === "UNTRUSTED" ? "FRAGILE"
            : trustState === "UNKNOWN" ? "UNKNOWN"
              : null
  );
}

function createResilienceRecord(
  recommendationIdValue: string,
  dimension: RecommendationResilienceDimension,
  baselineReference: string,
  disruptionReference: string,
  resilienceState: RecommendationResilienceState,
): RecommendationResilience {
  const resilienceId = hashResilienceValue("recommendation-resilience-id", {
    recommendationId: recommendationIdValue,
    dimension,
  });
  const resilienceHash = hashResilienceValue("recommendation-resilience-record", {
    recommendationId: recommendationIdValue,
    dimension,
    baselineReference,
    disruptionReference,
    resilienceState,
  });
  return Object.freeze({
    resilienceId,
    recommendationId: recommendationIdValue,
    resilienceDimension: dimension,
    baselineReference,
    disruptionReference,
    resilienceState,
    resilienceHash,
  });
}

function validateScope(scope: RecommendationResilienceScope, reasons: RecommendationResilienceFoundationReasonCode[]): boolean {
  const valid = RESILIENCE_SCOPES.includes(scope);
  addReason(reasons, valid ? "RESILIENCE_SCOPE_VALID" : "RESILIENCE_SCOPE_INVALID");
  return valid;
}

function validateRecommendationIds(request: RecommendationResilienceFoundationRequest, reasons: RecommendationResilienceFoundationReasonCode[]): boolean {
  const valid = request.recommendationIds.length > 0;
  addReason(reasons, valid ? "RECOMMENDATION_IDS_PRESENT" : "RECOMMENDATION_IDS_MISSING");
  return valid;
}

function validateSealedArtifacts(input: RecommendationResilienceFoundationInput, reasons: RecommendationResilienceFoundationReasonCode[]): boolean {
  const sealed = input.trustFoundation.sealed === true
    && input.trustReplay.sealed === true
    && input.trustCertification.sealed === true
    && input.driftFoundation.sealed === true
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
  addReason(reasons, input.trustFoundation.sealed === true ? "TRUST_FOUNDATION_REQUIRED" : "TRUST_FOUNDATION_UNSEALED");
  addReason(reasons, input.trustReplay.sealed === true ? "TRUST_REPLAY_REQUIRED" : "TRUST_REPLAY_UNSEALED");
  addReason(reasons, input.trustCertification.sealed === true ? "TRUST_CERTIFICATION_REQUIRED" : "TRUST_CERTIFICATION_UNSEALED");
  addReason(reasons, input.driftFoundation.sealed === true ? "DRIFT_FOUNDATION_REQUIRED" : "DRIFT_FOUNDATION_UNSEALED");
  addReason(reasons, input.driftReplay.sealed === true ? "DRIFT_REPLAY_REQUIRED" : "DRIFT_REPLAY_UNSEALED");
  addReason(reasons, input.driftCertification.sealed === true ? "DRIFT_CERTIFICATION_REQUIRED" : "DRIFT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactCertification.sealed === true ? "IMPACT_CERTIFICATION_REQUIRED" : "IMPACT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyCertification.sealed === true ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed === true ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: RecommendationResilienceFoundationInput, reasons: RecommendationResilienceFoundationReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.trustFoundation.result.tenantIsolationVerified
    && input.trustReplay.result.tenantIsolationVerified
    && input.trustCertification.result.tenantIsolationVerified
    && input.driftFoundation.result.tenantIsolationVerified
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
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_RESILIENCE_BLOCKED");
  return valid;
}

function validateOwnership(input: RecommendationResilienceFoundationInput, reasons: RecommendationResilienceFoundationReasonCode[]): boolean {
  const requestedIds = normalizeStrings(input.request.recommendationIds);
  const recommendations = bundleMap(input.recommendations);
  const valid = input.trustFoundation.validation.ownershipValid
    && requestedIds.every((id) => {
      const bundle = recommendations.get(id);
      return bundle
        && bundle.ownershipEvidence.recommendationId === id
        && bundle.ownershipEvidence.ownershipReferences.length > 0;
    });
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateBoundary(input: RecommendationResilienceFoundationInput, reasons: RecommendationResilienceFoundationReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const repairAbsent = input.repairRequested !== true;
  const controlSurfaceAbsent = !input.trustFoundation.controlSurfacePresent
    && !input.trustReplay.controlSurfacePresent
    && !input.trustCertification.controlSurfacePresent
    && !input.driftFoundation.controlSurfacePresent
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
  addReason(reasons, input.resilienceMutationAttempted === true ? "RESILIENCE_MUTATION_DETECTED" : "RESILIENCE_MUTATION_BLOCKED");
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
      || input.resilienceMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

function evaluateEvidenceResilience(
  input: RecommendationResilienceFoundationInput,
  bundle: RecommendationPortfolioBundle,
  recommendationIdValue: string,
  reasons: RecommendationResilienceFoundationReasonCode[],
): RecommendationResilience {
  const references = trustStateFor(input, recommendationIdValue, "EVIDENCE_RESILIENCE");
  const evidenceReferences = collectEvidenceReferences(bundle);
  const baselineReference = references?.baselineReference ?? fallbackReference(recommendationIdValue, "EVIDENCE_RESILIENCE", evidenceReferences);
  const disruptionReference = references?.disruptionReference ?? fallbackReference(recommendationIdValue, "EVIDENCE_RESILIENCE", {
    observabilityHash: bundle.observability.result.observabilityHash,
    certificationHash: bundle.certification.result.certificationHash,
  });
  const trustState = mapTrustStateToResilience(references?.trustState);
  let resilienceState: RecommendationResilienceState;
  if (evidenceReferences.length === 0) {
    resilienceState = "UNKNOWN";
    addReason(reasons, "EVIDENCE_RESILIENCE_UNKNOWN");
    addReason(reasons, "RESILIENCE_EVIDENCE_MISSING");
  } else if (bundle.certification.result.certificationState === "FAIL" || bundle.observabilityCertification.result.certificationState === "FAIL") {
    resilienceState = "FRAGILE";
    addReason(reasons, "EVIDENCE_RESILIENCE_CONDITIONAL");
  } else if (trustState === "DEGRADED") {
    resilienceState = "DEGRADED";
    addReason(reasons, "EVIDENCE_RESILIENCE_CONDITIONAL");
  } else if (trustState === "CONDITIONALLY_RESILIENT" || bundle.observability.result.observabilityState !== "VISIBLE") {
    resilienceState = "CONDITIONALLY_RESILIENT";
    addReason(reasons, "EVIDENCE_RESILIENCE_CONDITIONAL");
  } else {
    resilienceState = "RESILIENT";
    addReason(reasons, "EVIDENCE_RESILIENCE_RESILIENT");
  }
  return createResilienceRecord(recommendationIdValue, "EVIDENCE_RESILIENCE", baselineReference, disruptionReference, resilienceState);
}

function evaluateLineageResilience(
  input: RecommendationResilienceFoundationInput,
  bundle: RecommendationPortfolioBundle,
  recommendationIdValue: string,
  reasons: RecommendationResilienceFoundationReasonCode[],
): RecommendationResilience {
  const references = trustStateFor(input, recommendationIdValue, "LINEAGE_RESILIENCE");
  const lineageReferences = collectLineageReferences(bundle);
  const baselineReference = references?.baselineReference ?? fallbackReference(recommendationIdValue, "LINEAGE_RESILIENCE", lineageReferences);
  const disruptionReference = references?.disruptionReference ?? fallbackReference(recommendationIdValue, "LINEAGE_RESILIENCE", {
    lineageHash: bundle.lineage.result.reconstructionHash,
    ownershipHash: bundle.ownershipEvidence.ownershipHash,
  });
  const trustState = mapTrustStateToResilience(references?.trustState);
  let resilienceState: RecommendationResilienceState;
  if (lineageReferences.length === 0 || bundle.ownershipEvidence.ownershipReferences.length === 0) {
    resilienceState = "UNKNOWN";
    addReason(reasons, "LINEAGE_RESILIENCE_UNKNOWN");
    addReason(reasons, "DISRUPTION_REFERENCES_MISSING");
  } else if (!lineageIntegrity(bundle)) {
    resilienceState = "FRAGILE";
    addReason(reasons, "LINEAGE_RESILIENCE_FRAGILE");
  } else if (trustState === "DEGRADED") {
    resilienceState = "DEGRADED";
    addReason(reasons, "LINEAGE_RESILIENCE_CONDITIONAL");
  } else if (trustState === "CONDITIONALLY_RESILIENT") {
    resilienceState = "CONDITIONALLY_RESILIENT";
    addReason(reasons, "LINEAGE_RESILIENCE_CONDITIONAL");
  } else {
    resilienceState = "RESILIENT";
    addReason(reasons, "LINEAGE_RESILIENCE_RESILIENT");
  }
  return createResilienceRecord(recommendationIdValue, "LINEAGE_RESILIENCE", baselineReference, disruptionReference, resilienceState);
}

function evaluateGovernanceResilience(
  input: RecommendationResilienceFoundationInput,
  bundle: RecommendationPortfolioBundle,
  recommendationIdValue: string,
  reasons: RecommendationResilienceFoundationReasonCode[],
): RecommendationResilience {
  const references = trustStateFor(input, recommendationIdValue, "GOVERNANCE_RESILIENCE");
  const governanceReferences = collectGovernanceReferences(bundle);
  const baselineReference = references?.baselineReference ?? fallbackReference(recommendationIdValue, "GOVERNANCE_RESILIENCE", governanceReferences);
  const disruptionReference = references?.disruptionReference ?? fallbackReference(recommendationIdValue, "GOVERNANCE_RESILIENCE", {
    governanceHash: bundle.binding.result.governanceHash,
    certificationHash: bundle.governanceCertification.result.certificationHash,
  });
  let resilienceState: RecommendationResilienceState;
  if (governanceReferences.length === 0) {
    resilienceState = "UNKNOWN";
    addReason(reasons, "GOVERNANCE_RESILIENCE_UNKNOWN");
  } else if (!governanceIntegrity(bundle) || input.trustCertification.result.governanceCertified === false) {
    resilienceState = "FRAGILE";
    addReason(reasons, "GOVERNANCE_RESILIENCE_FRAGILE");
    addReason(reasons, "GOVERNANCE_CORRUPTION_DETECTED");
  } else if (
    input.trustCertification.result.certificationState === "CONDITIONAL_PASS"
    || certificationLikeState(bundle.governanceCertification.result.certificationState) === "CONDITIONAL_PASS"
  ) {
    resilienceState = "CONDITIONALLY_RESILIENT";
    addReason(reasons, "GOVERNANCE_RESILIENCE_CONDITIONAL");
  } else {
    resilienceState = "RESILIENT";
    addReason(reasons, "GOVERNANCE_RESILIENCE_RESILIENT");
  }
  return createResilienceRecord(recommendationIdValue, "GOVERNANCE_RESILIENCE", baselineReference, disruptionReference, resilienceState);
}

function evaluateReplayResilience(
  input: RecommendationResilienceFoundationInput,
  bundle: RecommendationPortfolioBundle,
  recommendationIdValue: string,
  reasons: RecommendationResilienceFoundationReasonCode[],
): RecommendationResilience {
  const references = trustStateFor(input, recommendationIdValue, "REPLAY_RESILIENCE");
  const replayReferences = collectReplayReferences(bundle);
  const baselineReference = references?.baselineReference ?? fallbackReference(recommendationIdValue, "REPLAY_RESILIENCE", replayReferences);
  const disruptionReference = references?.disruptionReference ?? fallbackReference(recommendationIdValue, "REPLAY_RESILIENCE", {
    replayHash: bundle.replay.result.replayHash,
    trustReplayHash: input.trustReplay.result.replayHash,
  });
  let resilienceState: RecommendationResilienceState;
  if (replayReferences.length === 0) {
    resilienceState = "UNKNOWN";
    addReason(reasons, "REPLAY_RESILIENCE_UNKNOWN");
    addReason(reasons, "REPLAY_EVIDENCE_MISSING");
  } else if (!replayIntegrity(bundle) || input.trustReplay.result.replayState === "INVALID" || input.trustReplay.result.replayState === "ESCALATED") {
    resilienceState = "FRAGILE";
    addReason(reasons, "REPLAY_RESILIENCE_FRAGILE");
    addReason(reasons, "REPLAY_CORRUPTION_DETECTED");
  } else if (
    input.trustReplay.result.replayState === "LIMITED"
    || bundle.replay.result.replayState === "LIMITED"
    || bundle.governanceReplay.result.replayState === "LIMITED"
    || bundle.replayFramework.result.replayState === "LIMITED"
  ) {
    resilienceState = "CONDITIONALLY_RESILIENT";
    addReason(reasons, "REPLAY_RESILIENCE_CONDITIONAL");
  } else {
    resilienceState = "RESILIENT";
    addReason(reasons, "REPLAY_RESILIENCE_RESILIENT");
  }
  return createResilienceRecord(recommendationIdValue, "REPLAY_RESILIENCE", baselineReference, disruptionReference, resilienceState);
}

function evaluateReadinessResilience(
  bundle: RecommendationPortfolioBundle,
  recommendationIdValue: string,
  reasons: RecommendationResilienceFoundationReasonCode[],
): RecommendationResilience {
  const readinessReferences = collectReadinessReferences(bundle);
  const baselineReference = fallbackReference(recommendationIdValue, "READINESS_RESILIENCE", readinessReferences);
  const disruptionReference = fallbackReference(recommendationIdValue, "READINESS_RESILIENCE", {
    readinessHash: bundle.readiness.result.readinessHash,
    alignmentHash: bundle.alignment.result.alignmentHash,
    packetHash: bundle.reviewPacket.result.packetHash,
  });
  let resilienceState: RecommendationResilienceState;
  if (readinessReferences.length === 0) {
    resilienceState = "UNKNOWN";
    addReason(reasons, "READINESS_RESILIENCE_UNKNOWN");
  } else if (bundle.readinessCertification.result.certificationState === "FAIL") {
    resilienceState = "FRAGILE";
    addReason(reasons, "READINESS_RESILIENCE_FRAGILE");
  } else if (
    bundle.readinessCertification.result.certificationState === "CONDITIONAL_PASS"
    || bundle.readiness.result.readinessState !== "READY"
  ) {
    resilienceState = "CONDITIONALLY_RESILIENT";
    addReason(reasons, "READINESS_RESILIENCE_CONDITIONAL");
  } else {
    resilienceState = "RESILIENT";
    addReason(reasons, "READINESS_RESILIENCE_RESILIENT");
  }
  return createResilienceRecord(recommendationIdValue, "READINESS_RESILIENCE", baselineReference, disruptionReference, resilienceState);
}

function evaluateCertificationResilience(
  dimension: RecommendationResilienceDimension,
  recommendationIdValue: string,
  certificationState: string,
  reasons: RecommendationResilienceFoundationReasonCode[],
): RecommendationResilience {
  const baselineReference = fallbackReference(recommendationIdValue, dimension, { certificationState, phase: "baseline" });
  const disruptionReference = fallbackReference(recommendationIdValue, dimension, { certificationState, phase: "disruption" });
  const state = certificationLikeState(certificationState);
  const resilienceState = state === "FAIL"
    ? "FRAGILE"
    : state === "CONDITIONAL_PASS"
      ? "CONDITIONALLY_RESILIENT"
      : "RESILIENT";
  addReason(
    reasons,
    dimension === "PORTFOLIO_RESILIENCE"
      ? resilienceState === "RESILIENT" ? "PORTFOLIO_RESILIENCE_RESILIENT" : resilienceState === "CONDITIONALLY_RESILIENT" ? "PORTFOLIO_RESILIENCE_CONDITIONAL" : "PORTFOLIO_RESILIENCE_FRAGILE"
      : dimension === "DEPENDENCY_RESILIENCE"
        ? resilienceState === "RESILIENT" ? "DEPENDENCY_RESILIENCE_RESILIENT" : resilienceState === "CONDITIONALLY_RESILIENT" ? "DEPENDENCY_RESILIENCE_CONDITIONAL" : "DEPENDENCY_RESILIENCE_FRAGILE"
        : "IMPACT_RESILIENCE_RESILIENT",
  );
  if (dimension === "IMPACT_RESILIENCE" && resilienceState === "CONDITIONALLY_RESILIENT") addReason(reasons, "IMPACT_RESILIENCE_CONDITIONAL");
  if (dimension === "IMPACT_RESILIENCE" && resilienceState === "FRAGILE") addReason(reasons, "IMPACT_RESILIENCE_FRAGILE");
  return createResilienceRecord(recommendationIdValue, dimension, baselineReference, disruptionReference, resilienceState);
}

function evaluateDriftResilience(
  input: RecommendationResilienceFoundationInput,
  recommendationIdValue: string,
  reasons: RecommendationResilienceFoundationReasonCode[],
): RecommendationResilience {
  const references = trustStateFor(input, recommendationIdValue, "DRIFT_RESILIENCE");
  const driftReferences = input.driftFoundation.drifts.filter((record) => record.recommendationId === recommendationIdValue);
  const baselineReference = references?.baselineReference ?? fallbackReference(recommendationIdValue, "DRIFT_RESILIENCE", driftReferences.map((record) => record.driftId));
  const disruptionReference = references?.disruptionReference ?? fallbackReference(recommendationIdValue, "DRIFT_RESILIENCE", {
    driftReplayHash: input.driftReplay.result.replayHash,
    driftCertificationHash: input.driftCertification.result.certificationHash,
  });
  let resilienceState: RecommendationResilienceState;
  if (input.driftFoundation.evidencePath.driftReferences.length === 0) {
    resilienceState = input.driftFoundation.result.driftState === "STABLE" ? "RESILIENT" : "UNKNOWN";
    addReason(reasons, resilienceState === "RESILIENT" ? "DRIFT_RESILIENCE_RESILIENT" : "DRIFT_RESILIENCE_UNKNOWN");
  } else if (
    input.driftCertification.result.certificationState === "FAIL"
    || input.driftReplay.result.replayState === "INVALID"
    || input.driftReplay.result.replayState === "ESCALATED"
  ) {
    resilienceState = "FRAGILE";
    addReason(reasons, "DRIFT_RESILIENCE_FRAGILE");
  } else if (
    input.driftCertification.result.certificationState === "CONDITIONAL_PASS"
    || input.driftReplay.result.replayState === "LIMITED"
    || driftReferences.length > 1
  ) {
    resilienceState = "CONDITIONALLY_RESILIENT";
    addReason(reasons, "DRIFT_RESILIENCE_CONDITIONAL");
  } else {
    resilienceState = "RESILIENT";
    addReason(reasons, "DRIFT_RESILIENCE_RESILIENT");
  }
  return createResilienceRecord(recommendationIdValue, "DRIFT_RESILIENCE", baselineReference, disruptionReference, resilienceState);
}

function evaluateTrustResilience(
  input: RecommendationResilienceFoundationInput,
  recommendationIdValue: string,
  reasons: RecommendationResilienceFoundationReasonCode[],
): RecommendationResilience {
  const trustRecords = input.trustFoundation.trusts.filter((record) => record.recommendationId === recommendationIdValue);
  const baselineReference = fallbackReference(recommendationIdValue, "TRUST_RESILIENCE", {
    trustIds: trustRecords.map((record) => record.trustId),
    trustHash: input.trustFoundation.result.trustGraphHash,
  });
  const disruptionReference = fallbackReference(recommendationIdValue, "TRUST_RESILIENCE", {
    replayHash: input.trustReplay.result.replayHash,
    certificationHash: input.trustCertification.result.certificationHash,
  });
  let resilienceState: RecommendationResilienceState;
  if (trustRecords.length === 0 || input.trustFoundation.evidencePath.trustReferences.length === 0) {
    resilienceState = "UNKNOWN";
    addReason(reasons, "TRUST_RESILIENCE_UNKNOWN");
  } else if (
    input.trustCertification.result.certificationState === "FAIL"
    || input.trustFoundation.result.trustState === "UNTRUSTED"
    || input.trustReplay.result.replayState === "INVALID"
    || input.trustReplay.result.replayState === "ESCALATED"
  ) {
    resilienceState = "FRAGILE";
    addReason(reasons, "TRUST_RESILIENCE_FRAGILE");
  } else if (
    input.trustCertification.result.certificationState === "CONDITIONAL_PASS"
    || input.trustFoundation.result.trustState === "CONDITIONALLY_TRUSTED"
    || input.trustReplay.result.replayState === "LIMITED"
  ) {
    resilienceState = "CONDITIONALLY_RESILIENT";
    addReason(reasons, "TRUST_RESILIENCE_CONDITIONAL");
  } else if (input.trustFoundation.result.trustState === "DEGRADED") {
    resilienceState = "DEGRADED";
    addReason(reasons, "TRUST_RESILIENCE_CONDITIONAL");
  } else {
    resilienceState = "RESILIENT";
    addReason(reasons, "TRUST_RESILIENCE_RESILIENT");
  }
  return createResilienceRecord(recommendationIdValue, "TRUST_RESILIENCE", baselineReference, disruptionReference, resilienceState);
}

function createResilienceRecords(
  input: RecommendationResilienceFoundationInput,
  reasons: RecommendationResilienceFoundationReasonCode[],
): RecommendationResilience[] {
  const records: RecommendationResilience[] = [];
  const recommendations = bundleMap(input.recommendations);
  for (const recommendationIdValue of normalizeStrings(input.request.recommendationIds)) {
    const bundle = recommendations.get(recommendationIdValue);
    if (!bundle) continue;
    for (const dimension of RESILIENCE_DIMENSIONS) {
      if (!includesScope(input.request.resilienceScope, dimension)) continue;
      const record = (
        dimension === "EVIDENCE_RESILIENCE" ? evaluateEvidenceResilience(input, bundle, recommendationIdValue, reasons)
          : dimension === "LINEAGE_RESILIENCE" ? evaluateLineageResilience(input, bundle, recommendationIdValue, reasons)
            : dimension === "GOVERNANCE_RESILIENCE" ? evaluateGovernanceResilience(input, bundle, recommendationIdValue, reasons)
              : dimension === "REPLAY_RESILIENCE" ? evaluateReplayResilience(input, bundle, recommendationIdValue, reasons)
                : dimension === "READINESS_RESILIENCE" ? evaluateReadinessResilience(bundle, recommendationIdValue, reasons)
                  : dimension === "PORTFOLIO_RESILIENCE" ? evaluateCertificationResilience(dimension, recommendationIdValue, input.portfolioCertification.result.certificationState, reasons)
                    : dimension === "DEPENDENCY_RESILIENCE" ? evaluateCertificationResilience(dimension, recommendationIdValue, input.dependencyCertification.result.certificationState, reasons)
                      : dimension === "IMPACT_RESILIENCE" ? evaluateCertificationResilience(dimension, recommendationIdValue, input.impactCertification.result.certificationState, reasons)
                        : dimension === "DRIFT_RESILIENCE" ? evaluateDriftResilience(input, recommendationIdValue, reasons)
                          : evaluateTrustResilience(input, recommendationIdValue, reasons)
      );
      records.push(record);
    }
  }
  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.resilienceDimension.localeCompare(right.resilienceDimension)
    || left.resilienceId.localeCompare(right.resilienceId)
  ));
}

export function createRecommendationResilienceEvidencePath(
  input: RecommendationResilienceFoundationInput,
  resiliences: readonly RecommendationResilience[],
): RecommendationResilienceEvidencePath {
  const bundles = orderedBundles(input.recommendations);
  return Object.freeze({
    scope: input.request.resilienceScope,
    resilienceReferences: normalizeStrings(resiliences.map((resilience) => resilience.resilienceId)),
    baselineReferences: normalizeStrings(resiliences.map((resilience) => resilience.baselineReference)),
    disruptionReferences: normalizeStrings(resiliences.map((resilience) => resilience.disruptionReference)),
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
    trustReferences: normalizeStrings([
      ...input.trustFoundation.evidencePath.trustReferences,
      ...input.trustReplay.evidencePath.trustReferences,
    ]),
    evidenceHashes: normalizeStrings([
      input.trustFoundation.result.trustGraphHash,
      input.trustReplay.result.replayHash,
      input.trustReplay.result.reconstructionHash,
      input.trustCertification.result.certificationHash,
      input.driftFoundation.result.driftGraphHash,
      input.driftReplay.result.replayHash,
      input.driftReplay.result.reconstructionHash,
      input.driftCertification.result.certificationHash,
      input.impactCertification.result.certificationHash,
      input.dependencyCertification.result.certificationHash,
      input.portfolioCertification.result.certificationHash,
      ...resiliences.map((resilience) => resilience.resilienceHash),
      ...input.trustFoundation.evidencePath.evidenceHashes,
      ...input.trustReplay.evidencePath.evidenceHashes,
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

function validateEvidencePath(evidencePath: RecommendationResilienceEvidencePath, reasons: RecommendationResilienceFoundationReasonCode[]): void {
  addReason(reasons, evidencePath.evidenceReferences.length > 0 ? "RESILIENCE_EVIDENCE_PRESENT" : "RESILIENCE_EVIDENCE_MISSING");
  addReason(reasons, evidencePath.disruptionReferences.length > 0 ? "DISRUPTION_REFERENCES_PRESENT" : "DISRUPTION_REFERENCES_MISSING");
  addReason(reasons, evidencePath.replayReferences.length > 0 ? "REPLAY_EVIDENCE_PRESENT" : "REPLAY_EVIDENCE_MISSING");
}

function validateLimits(
  recommendationCount: number,
  resilienceRecordCount: number,
  lineageReferenceCount: number,
  replayReferenceCount: number,
  disruptionReferenceCount: number,
  reasons: RecommendationResilienceFoundationReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_RECOMMENDATIONS
    && resilienceRecordCount <= MAX_RESILIENCE_RECORDS
    && lineageReferenceCount <= MAX_LINEAGE_REFERENCES
    && replayReferenceCount <= MAX_REPLAY_REFERENCES
    && disruptionReferenceCount <= MAX_DISRUPTION_REFERENCES;
  addReason(reasons, recommendationCount <= MAX_RECOMMENDATIONS ? "RECOMMENDATION_LIMIT_VALID" : "RECOMMENDATION_LIMIT_EXCEEDED");
  addReason(reasons, resilienceRecordCount <= MAX_RESILIENCE_RECORDS ? "RESILIENCE_RECORD_LIMIT_VALID" : "RESILIENCE_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, lineageReferenceCount <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, disruptionReferenceCount <= MAX_DISRUPTION_REFERENCES ? "DISRUPTION_REFERENCE_LIMIT_VALID" : "DISRUPTION_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function countConcerns(states: readonly RecommendationResilienceState[]): number {
  return states.filter((state) => state !== "RESILIENT").length;
}

function deriveResilienceState(
  resiliences: readonly RecommendationResilience[],
  reasons: RecommendationResilienceFoundationReasonCode[],
): RecommendationResilienceState {
  const states = resiliences.map((resilience) => resilience.resilienceState);
  if (reasons.includes("OWNERSHIP_MISMATCH") || reasons.includes("CROSS_TENANT_RESILIENCE_BLOCKED") || reasons.includes("GOVERNANCE_CORRUPTION_DETECTED") || reasons.includes("REPLAY_CORRUPTION_DETECTED")) {
    return "FRAGILE";
  }
  if (states.includes("FRAGILE")) return "FRAGILE";
  if (states.includes("UNKNOWN")) return "UNKNOWN";
  const concernCount = countConcerns(states);
  if (concernCount >= 2) {
    addReason(reasons, "MULTIPLE_RESILIENCE_CONCERNS_DETECTED");
    return "DEGRADED";
  }
  if (concernCount === 1) {
    addReason(reasons, "BOUNDED_DEGRADATION_DETECTED");
    return "CONDITIONALLY_RESILIENT";
  }
  return "RESILIENT";
}

function buildResult(
  request: RecommendationResilienceFoundationRequest,
  resilienceState: RecommendationResilienceState,
  resiliences: readonly RecommendationResilience[],
  tenantIsolationVerified: boolean,
  resilienceGraphHash: string,
): RecommendationResilienceFoundationResult {
  return Object.freeze({
    tenantId: request.tenantId,
    resilienceState,
    resilienceRecordsCreated: resiliences.length,
    evidenceResilienceDetected: resiliences.filter((record) => record.resilienceDimension === "EVIDENCE_RESILIENCE").length,
    lineageResilienceDetected: resiliences.filter((record) => record.resilienceDimension === "LINEAGE_RESILIENCE").length,
    governanceResilienceDetected: resiliences.filter((record) => record.resilienceDimension === "GOVERNANCE_RESILIENCE").length,
    replayResilienceDetected: resiliences.filter((record) => record.resilienceDimension === "REPLAY_RESILIENCE").length,
    readinessResilienceDetected: resiliences.filter((record) => record.resilienceDimension === "READINESS_RESILIENCE").length,
    portfolioResilienceDetected: resiliences.filter((record) => record.resilienceDimension === "PORTFOLIO_RESILIENCE").length,
    dependencyResilienceDetected: resiliences.filter((record) => record.resilienceDimension === "DEPENDENCY_RESILIENCE").length,
    impactResilienceDetected: resiliences.filter((record) => record.resilienceDimension === "IMPACT_RESILIENCE").length,
    driftResilienceDetected: resiliences.filter((record) => record.resilienceDimension === "DRIFT_RESILIENCE").length,
    trustResilienceDetected: resiliences.filter((record) => record.resilienceDimension === "TRUST_RESILIENCE").length,
    tenantIsolationVerified,
    resilienceGraphHash,
    deterministic: true,
  });
}

function buildObservability(result: RecommendationResilienceFoundationResult): RecommendationResilienceFoundationObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    resilienceState: result.resilienceState,
    resilienceRecordsCreated: result.resilienceRecordsCreated,
    evidenceResilienceDetected: result.evidenceResilienceDetected,
    lineageResilienceDetected: result.lineageResilienceDetected,
    governanceResilienceDetected: result.governanceResilienceDetected,
    replayResilienceDetected: result.replayResilienceDetected,
    readinessResilienceDetected: result.readinessResilienceDetected,
    portfolioResilienceDetected: result.portfolioResilienceDetected,
    dependencyResilienceDetected: result.dependencyResilienceDetected,
    impactResilienceDetected: result.impactResilienceDetected,
    driftResilienceDetected: result.driftResilienceDetected,
    trustResilienceDetected: result.trustResilienceDetected,
    resilienceGraphHash: result.resilienceGraphHash,
  });
}

function buildValidation(
  resilienceState: RecommendationResilienceState,
  reasonCodes: readonly RecommendationResilienceFoundationReasonCode[],
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    resilienceRecordsCreated: number;
    lineageReferenceCount: number;
    replayReferenceCount: number;
    disruptionReferenceCount: number;
  }>,
): RecommendationResilienceFoundationValidation {
  return Object.freeze({
    valid: resilienceState !== "FRAGILE",
    resilienceState,
    reasonCodes: [...reasonCodes],
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    repairAbsent: boundary.repairAbsent,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
    ...counts,
  });
}

export function buildRecommendationResilienceFoundationRequest(
  request: RecommendationResilienceFoundationRequest,
): RecommendationResilienceFoundationRequest {
  return requestCore(request);
}

export function sealRecommendationResilienceFoundation(
  input: RecommendationResilienceFoundationInput,
): SealedRecommendationResilienceFoundationRecord {
  const reasons: RecommendationResilienceFoundationReasonCode[] = [];
  const requestValid = validateRecommendationIds(input.request, reasons)
    && validateScope(input.request.resilienceScope, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const resiliences = createResilienceRecords(input, reasons);
  const evidencePath = createRecommendationResilienceEvidencePath(input, resiliences);
  validateEvidencePath(evidencePath, reasons);
  const limitsValid = validateLimits(
    normalizeStrings(input.request.recommendationIds).length,
    resiliences.length,
    evidencePath.lineageReferences.length,
    evidencePath.replayReferences.length,
    evidencePath.disruptionReferences.length,
    reasons,
  );
  addReason(reasons, "RECOMMENDATION_RESILIENCE_FOUNDATION_IS_NOT_CONTROL");

  const resilienceState = !requestValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || boundary.invalidBoundary
    || !limitsValid
    ? "FRAGILE"
    : deriveResilienceState(resiliences, reasons);

  const resilienceGraphHash = hashResilienceValue("recommendation-resilience-foundation", {
    request: requestCore(input.request),
    resilienceState,
    resilienceReferences: evidencePath.resilienceReferences,
    baselineReferences: evidencePath.baselineReferences,
    disruptionReferences: evidencePath.disruptionReferences,
    evidenceReferences: evidencePath.evidenceReferences,
    lineageReferences: evidencePath.lineageReferences,
    governanceReferences: evidencePath.governanceReferences,
    replayReferences: evidencePath.replayReferences,
    readinessReferences: evidencePath.readinessReferences,
    portfolioReferences: evidencePath.portfolioReferences,
    dependencyReferences: evidencePath.dependencyReferences,
    impactReferences: evidencePath.impactReferences,
    driftReferences: evidencePath.driftReferences,
    trustReferences: evidencePath.trustReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    resilienceState,
    resiliences,
    tenantIsolationVerified,
    resilienceGraphHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    resilienceState,
    reasons,
    ownershipValid,
    tenantIsolationVerified,
    boundary,
    Object.freeze({
      resilienceRecordsCreated: resiliences.length,
      lineageReferenceCount: evidencePath.lineageReferences.length,
      replayReferenceCount: evidencePath.replayReferences.length,
      disruptionReferenceCount: evidencePath.disruptionReferences.length,
    }),
  );

  return Object.freeze({
    result,
    resiliences,
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    resilienceOnly: true,
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
