import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  DependencyRiskEvidencePath,
  DependencyRiskFoundationInput,
  DependencyRiskFoundationObservability,
  DependencyRiskFoundationReasonCode,
  DependencyRiskFoundationRequest,
  DependencyRiskFoundationResult,
  DependencyRiskFoundationValidation,
  DependencyRiskScope,
  DependencyRiskState,
  DependencyRiskType,
  RecommendationDependencyRisk,
  SealedDependencyRiskFoundationRecord,
} from "./types";

const MAX_RECOMMENDATIONS = 10_000;
const MAX_DEPENDENCY_RISK_RECORDS = 50_000;
const MAX_DEPENDENCY_REFERENCES = 25_000;
const MAX_PROPAGATION_PATHS = 25_000;
const MAX_REPLAY_REFERENCES = 10_000;

const RISK_SCOPES: readonly DependencyRiskScope[] = Object.freeze([
  "CONCENTRATION",
  "FAILURE",
  "PROPAGATION",
  "FRAGILITY",
  "AVAILABILITY",
  "REPLAY",
  "GOVERNANCE",
  "TRUST",
  "DRIFT",
  "RESILIENCE",
  "FULL",
]);

const RISK_TYPES: readonly DependencyRiskType[] = Object.freeze([
  "DEPENDENCY_CONCENTRATION_RISK",
  "DEPENDENCY_FAILURE_RISK",
  "DEPENDENCY_PROPAGATION_RISK",
  "DEPENDENCY_FRAGILITY_RISK",
  "DEPENDENCY_AVAILABILITY_RISK",
  "DEPENDENCY_REPLAY_RISK",
  "DEPENDENCY_GOVERNANCE_RISK",
  "DEPENDENCY_TRUST_RISK",
  "DEPENDENCY_DRIFT_RISK",
  "DEPENDENCY_RESILIENCE_RISK",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  remediationAbsent: boolean;
  invalidBoundary: boolean;
  controlSurfaceAbsent: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: DependencyRiskFoundationReasonCode[], reason: DependencyRiskFoundationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashRiskValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: DependencyRiskFoundationRequest): DependencyRiskFoundationRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    recommendationIds: [...request.recommendationIds],
    riskScope: request.riskScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: DependencyRiskFoundationInput): RecommendationPortfolioBundle[] {
  return [...input.recommendations].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function bundleMap(input: DependencyRiskFoundationInput): Map<string, RecommendationPortfolioBundle> {
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
    "repairAllowed",
    "remediationAllowed",
    "authorityMutationAllowed",
    "controlSurfacePresent",
  ] as const;
  return blockedFlags.every((key) => record[key] !== true);
}

function includesScope(scope: DependencyRiskScope, riskType: DependencyRiskType): boolean {
  if (scope === "FULL") return true;
  return (
    (scope === "CONCENTRATION" && riskType === "DEPENDENCY_CONCENTRATION_RISK")
    || (scope === "FAILURE" && riskType === "DEPENDENCY_FAILURE_RISK")
    || (scope === "PROPAGATION" && riskType === "DEPENDENCY_PROPAGATION_RISK")
    || (scope === "FRAGILITY" && riskType === "DEPENDENCY_FRAGILITY_RISK")
    || (scope === "AVAILABILITY" && riskType === "DEPENDENCY_AVAILABILITY_RISK")
    || (scope === "REPLAY" && riskType === "DEPENDENCY_REPLAY_RISK")
    || (scope === "GOVERNANCE" && riskType === "DEPENDENCY_GOVERNANCE_RISK")
    || (scope === "TRUST" && riskType === "DEPENDENCY_TRUST_RISK")
    || (scope === "DRIFT" && riskType === "DEPENDENCY_DRIFT_RISK")
    || (scope === "RESILIENCE" && riskType === "DEPENDENCY_RESILIENCE_RISK")
  );
}

function dependencyIdsForRecommendation(input: DependencyRiskFoundationInput, recommendationIdValue: string): string[] {
  return normalizeStrings(input.dependencyFoundation.dependencies
    .filter((dependency) => (
      dependency.sourceRecommendationId === recommendationIdValue
      || dependency.targetRecommendationId === recommendationIdValue
    ))
    .map((dependency) => dependency.dependencyId));
}

function dependencyRelationshipCount(input: DependencyRiskFoundationInput, recommendationIdValue: string): number {
  return normalizeStrings(input.dependencyFoundation.dependencies
    .filter((dependency) => (
      dependency.sourceRecommendationId === recommendationIdValue
      || dependency.targetRecommendationId === recommendationIdValue
    ))
    .map((dependency) => (
      dependency.sourceRecommendationId === recommendationIdValue
        ? dependency.targetRecommendationId
        : dependency.sourceRecommendationId
    ))).length;
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
  ]);
}

function createRiskRecord(
  recommendationIdValue: string,
  dependencyId: string,
  riskType: DependencyRiskType,
  baselineReference: string,
  dependencyReference: string,
  riskState: DependencyRiskState,
): RecommendationDependencyRisk {
  const dependencyRiskId = hashRiskValue("dependency-risk-id", {
    recommendationId: recommendationIdValue,
    dependencyId,
    riskType,
  });
  const dependencyRiskHash = hashRiskValue("dependency-risk-record", {
    recommendationId: recommendationIdValue,
    dependencyId,
    riskType,
    baselineReference,
    dependencyReference,
    riskState,
  });
  return Object.freeze({
    dependencyRiskId,
    recommendationId: recommendationIdValue,
    dependencyId,
    riskType,
    baselineReference,
    dependencyReference,
    riskState,
    dependencyRiskHash,
  });
}

function trustStateForRecommendation(input: DependencyRiskFoundationInput, recommendationIdValue: string): string {
  const records = input.trustFoundation.trusts.filter((record) => record.recommendationId === recommendationIdValue);
  if (records.length === 0) return input.trustFoundation.result.trustState;
  if (records.some((record) => record.trustState === "UNTRUSTED")) return "UNTRUSTED";
  if (records.some((record) => record.trustState === "DEGRADED")) return "DEGRADED";
  if (records.some((record) => record.trustState === "CONDITIONALLY_TRUSTED")) return "CONDITIONALLY_TRUSTED";
  if (records.some((record) => record.trustState === "UNKNOWN")) return "UNKNOWN";
  return "TRUSTED";
}

function driftStateForRecommendation(input: DependencyRiskFoundationInput): string {
  return input.driftFoundation.result.driftState;
}

function resilienceStateForRecommendation(input: DependencyRiskFoundationInput, recommendationIdValue: string): string {
  const records = input.resilienceFoundation.resiliences.filter((record) => record.recommendationId === recommendationIdValue);
  if (records.length === 0) return input.resilienceFoundation.result.resilienceState;
  if (records.some((record) => record.resilienceState === "FRAGILE")) return "FRAGILE";
  if (records.some((record) => record.resilienceState === "DEGRADED")) return "DEGRADED";
  if (records.some((record) => record.resilienceState === "CONDITIONALLY_RESILIENT")) return "CONDITIONALLY_RESILIENT";
  if (records.some((record) => record.resilienceState === "UNKNOWN")) return "UNKNOWN";
  return "RESILIENT";
}

function riskStateFromTrust(trustState: string, reasons: DependencyRiskFoundationReasonCode[]): DependencyRiskState {
  if (trustState === "UNTRUSTED") {
    addReason(reasons, "TRUST_RISK_CRITICAL");
    return "CRITICAL";
  }
  if (trustState === "DEGRADED") {
    addReason(reasons, "TRUST_RISK_HIGH");
    return "HIGH";
  }
  if (trustState === "CONDITIONALLY_TRUSTED") {
    addReason(reasons, "TRUST_RISK_MODERATE");
    return "MODERATE";
  }
  if (trustState === "UNKNOWN") return "UNKNOWN";
  addReason(reasons, "TRUST_RISK_LOW");
  return "LOW";
}

function riskStateFromDrift(driftState: string, reasons: DependencyRiskFoundationReasonCode[]): DependencyRiskState {
  if (driftState === "INVALID") return "CRITICAL";
  if (driftState === "DRIFT_DETECTED") {
    addReason(reasons, "DRIFT_RISK_HIGH");
    return "HIGH";
  }
  if (driftState === "OBSERVE") return "UNKNOWN";
  addReason(reasons, "DRIFT_RISK_LOW");
  return "LOW";
}

function riskStateFromResilience(resilienceState: string, reasons: DependencyRiskFoundationReasonCode[]): DependencyRiskState {
  if (resilienceState === "FRAGILE") {
    addReason(reasons, "RESILIENCE_RISK_CRITICAL");
    return "CRITICAL";
  }
  if (resilienceState === "DEGRADED") {
    addReason(reasons, "RESILIENCE_RISK_HIGH");
    return "HIGH";
  }
  if (resilienceState === "CONDITIONALLY_RESILIENT") {
    addReason(reasons, "RESILIENCE_RISK_MODERATE");
    return "MODERATE";
  }
  if (resilienceState === "UNKNOWN") return "UNKNOWN";
  addReason(reasons, "RESILIENCE_RISK_LOW");
  return "LOW";
}

function maxRiskState(states: readonly DependencyRiskState[]): DependencyRiskState {
  const order: readonly DependencyRiskState[] = ["LOW", "MODERATE", "HIGH", "CRITICAL"];
  if (states.length === 0 || states.every((state) => state === "UNKNOWN")) return "UNKNOWN";
  if (states.includes("CRITICAL")) return "CRITICAL";
  if (states.includes("HIGH")) return "HIGH";
  if (states.includes("MODERATE")) return "MODERATE";
  return order.find((state) => states.includes(state)) ?? "LOW";
}

function createDomainRisk(
  input: DependencyRiskFoundationInput,
  bundle: RecommendationPortfolioBundle,
  dependencyId: string,
  riskType: DependencyRiskType,
  dependencyCount: number,
  reasons: DependencyRiskFoundationReasonCode[],
): RecommendationDependencyRisk {
  const recommendationIdValue = recommendationId(bundle);
  const trustState = trustStateForRecommendation(input, recommendationIdValue);
  const driftState = driftStateForRecommendation(input);
  const resilienceState = resilienceStateForRecommendation(input, recommendationIdValue);
  const baselineReference = hashRiskValue("dependency-risk-baseline", {
    recommendationId: recommendationIdValue,
    dependencyId,
    riskType,
    dependencyGraphHash: input.dependencyFoundation.result.dependencyGraphHash,
    dependencyRiskScope: input.request.riskScope,
  });
  const dependencyReference = hashRiskValue("dependency-risk-reference", {
    recommendationId: recommendationIdValue,
    dependencyId,
    riskType,
    dependencyReplayHash: input.dependencyReplay.result.replayHash,
    dependencyCertificationHash: input.dependencyCertification.result.certificationHash,
  });

  let riskState: DependencyRiskState;
  if (
    input.dependencyFoundation.result.dependencyState === "OBSERVE"
    || input.dependencyFoundation.evidencePath.dependencyReferences.length === 0
  ) {
    riskState = "UNKNOWN";
  } else if (riskType === "DEPENDENCY_CONCENTRATION_RISK") {
    riskState = dependencyCount >= 3 ? "HIGH" : dependencyCount === 2 ? "MODERATE" : "LOW";
    addReason(reasons, riskState === "HIGH" ? "CONCENTRATION_RISK_HIGH" : riskState === "MODERATE" ? "CONCENTRATION_RISK_MODERATE" : "CONCENTRATION_RISK_LOW");
  } else if (riskType === "DEPENDENCY_FAILURE_RISK") {
    riskState = maxRiskState([
      input.dependencyCertification.result.certificationState === "FAIL" ? "CRITICAL" : "LOW",
      input.dependencyReplay.result.replayState === "INVALID" || input.dependencyReplay.result.replayState === "ESCALATED" ? "CRITICAL" : "LOW",
      riskStateFromTrust(trustState, reasons),
      riskStateFromResilience(resilienceState, reasons),
    ]);
    addReason(reasons, riskState === "CRITICAL" ? "FAILURE_RISK_CRITICAL" : riskState === "HIGH" ? "FAILURE_RISK_HIGH" : "FAILURE_RISK_LOW");
  } else if (riskType === "DEPENDENCY_PROPAGATION_RISK") {
    riskState = input.dependencyReplay.result.chainsReconstructed !== true
      ? "HIGH"
      : dependencyCount >= 3 ? "HIGH" : dependencyCount === 2 ? "MODERATE" : "LOW";
    addReason(reasons, riskState === "HIGH" ? "PROPAGATION_RISK_HIGH" : riskState === "MODERATE" ? "PROPAGATION_RISK_MODERATE" : "PROPAGATION_RISK_LOW");
  } else if (riskType === "DEPENDENCY_FRAGILITY_RISK") {
    riskState = maxRiskState([
      riskStateFromResilience(resilienceState, reasons),
      trustState === "UNTRUSTED" ? "CRITICAL" : trustState === "DEGRADED" ? "HIGH" : "LOW",
    ]);
    addReason(reasons, riskState === "CRITICAL" ? "FRAGILITY_RISK_CRITICAL" : riskState === "HIGH" ? "FRAGILITY_RISK_HIGH" : "FRAGILITY_RISK_LOW");
  } else if (riskType === "DEPENDENCY_AVAILABILITY_RISK") {
    riskState = input.resilienceCertification.result.certificationState === "FAIL"
      ? "HIGH"
      : input.resilienceCertification.result.certificationState === "CONDITIONAL_PASS" || input.resilienceReplay.result.replayState === "LIMITED"
        ? "MODERATE"
        : "LOW";
    addReason(reasons, riskState === "HIGH" ? "AVAILABILITY_RISK_HIGH" : riskState === "MODERATE" ? "AVAILABILITY_RISK_MODERATE" : "AVAILABILITY_RISK_LOW");
  } else if (riskType === "DEPENDENCY_REPLAY_RISK") {
    riskState = input.dependencyReplay.result.replayState === "INVALID" || input.dependencyReplay.result.replayState === "ESCALATED"
      ? "CRITICAL"
      : input.dependencyReplay.result.replayState === "LIMITED" || input.resilienceReplay.result.replayState === "LIMITED"
        ? "HIGH"
        : "LOW";
    addReason(reasons, riskState === "CRITICAL" ? "REPLAY_RISK_CRITICAL" : riskState === "HIGH" ? "REPLAY_RISK_HIGH" : "REPLAY_RISK_LOW");
  } else if (riskType === "DEPENDENCY_GOVERNANCE_RISK") {
    riskState = input.dependencyCertification.result.governanceCertified !== true
      || input.trustCertification.result.governanceCertified !== true
      || input.driftCertification.result.governanceCertified !== true
      || input.resilienceCertification.result.governanceCertified !== true
      ? "CRITICAL"
      : input.portfolioCertification.result.governanceCertified !== true
        ? "MODERATE"
        : "LOW";
    addReason(reasons, riskState === "CRITICAL" ? "GOVERNANCE_RISK_CRITICAL" : riskState === "MODERATE" ? "GOVERNANCE_RISK_MODERATE" : "GOVERNANCE_RISK_LOW");
  } else if (riskType === "DEPENDENCY_TRUST_RISK") {
    riskState = riskStateFromTrust(trustState, reasons);
  } else if (riskType === "DEPENDENCY_DRIFT_RISK") {
    riskState = riskStateFromDrift(driftState, reasons);
  } else {
    riskState = riskStateFromResilience(resilienceState, reasons);
  }

  return createRiskRecord(recommendationIdValue, dependencyId, riskType, baselineReference, dependencyReference, riskState);
}

function createRiskRecords(
  input: DependencyRiskFoundationInput,
  reasons: DependencyRiskFoundationReasonCode[],
): RecommendationDependencyRisk[] {
  const bundles = bundleMap(input);
  const records: RecommendationDependencyRisk[] = [];
  for (const recommendationIdValue of normalizeStrings(input.request.recommendationIds)) {
    const bundle = bundles.get(recommendationIdValue);
    if (!bundle) continue;
    const dependencyIds = dependencyIdsForRecommendation(input, recommendationIdValue);
    const dependencyCount = dependencyRelationshipCount(input, recommendationIdValue);
    for (const dependencyId of dependencyIds) {
      for (const riskType of RISK_TYPES) {
        if (!includesScope(input.request.riskScope, riskType)) continue;
        records.push(createDomainRisk(input, bundle, dependencyId, riskType, dependencyCount, reasons));
      }
    }
  }
  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.dependencyId.localeCompare(right.dependencyId)
    || left.riskType.localeCompare(right.riskType)
    || left.dependencyRiskId.localeCompare(right.dependencyRiskId)
  ));
}

function validateRecommendationIds(request: DependencyRiskFoundationRequest, reasons: DependencyRiskFoundationReasonCode[]): boolean {
  const valid = request.recommendationIds.length > 0;
  addReason(reasons, valid ? "RECOMMENDATION_IDS_PRESENT" : "RECOMMENDATION_IDS_MISSING");
  return valid;
}

function validateScope(scope: DependencyRiskScope, reasons: DependencyRiskFoundationReasonCode[]): boolean {
  const valid = RISK_SCOPES.includes(scope);
  addReason(reasons, valid ? "RISK_SCOPE_VALID" : "RISK_SCOPE_INVALID");
  return valid;
}

function validateSealedArtifacts(input: DependencyRiskFoundationInput, reasons: DependencyRiskFoundationReasonCode[]): boolean {
  const sealed = input.dependencyFoundation.sealed === true
    && input.dependencyReplay.sealed === true
    && input.dependencyCertification.sealed === true
    && input.trustFoundation.sealed === true
    && input.trustReplay.sealed === true
    && input.trustCertification.sealed === true
    && input.driftFoundation.sealed === true
    && input.driftReplay.sealed === true
    && input.driftCertification.sealed === true
    && input.resilienceFoundation.sealed === true
    && input.resilienceReplay.sealed === true
    && input.resilienceCertification.sealed === true
    && input.impactCertification.sealed === true
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
  addReason(reasons, input.dependencyFoundation.sealed ? "DEPENDENCY_FOUNDATION_REQUIRED" : "DEPENDENCY_FOUNDATION_UNSEALED");
  addReason(reasons, input.dependencyReplay.sealed ? "DEPENDENCY_REPLAY_REQUIRED" : "DEPENDENCY_REPLAY_UNSEALED");
  addReason(reasons, input.dependencyCertification.sealed ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.trustFoundation.sealed ? "TRUST_FOUNDATION_REQUIRED" : "TRUST_FOUNDATION_UNSEALED");
  addReason(reasons, input.trustReplay.sealed ? "TRUST_REPLAY_REQUIRED" : "TRUST_REPLAY_UNSEALED");
  addReason(reasons, input.trustCertification.sealed ? "TRUST_CERTIFICATION_REQUIRED" : "TRUST_CERTIFICATION_UNSEALED");
  addReason(reasons, input.driftFoundation.sealed ? "DRIFT_FOUNDATION_REQUIRED" : "DRIFT_FOUNDATION_UNSEALED");
  addReason(reasons, input.driftReplay.sealed ? "DRIFT_REPLAY_REQUIRED" : "DRIFT_REPLAY_UNSEALED");
  addReason(reasons, input.driftCertification.sealed ? "DRIFT_CERTIFICATION_REQUIRED" : "DRIFT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.resilienceFoundation.sealed ? "RESILIENCE_FOUNDATION_REQUIRED" : "RESILIENCE_FOUNDATION_UNSEALED");
  addReason(reasons, input.resilienceReplay.sealed ? "RESILIENCE_REPLAY_REQUIRED" : "RESILIENCE_REPLAY_UNSEALED");
  addReason(reasons, input.resilienceCertification.sealed ? "RESILIENCE_CERTIFICATION_REQUIRED" : "RESILIENCE_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactCertification.sealed ? "IMPACT_CERTIFICATION_REQUIRED" : "IMPACT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: DependencyRiskFoundationInput, reasons: DependencyRiskFoundationReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.dependencyFoundation.result.tenantIsolationVerified
    && input.dependencyReplay.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
    && input.trustFoundation.result.tenantIsolationVerified
    && input.trustReplay.result.tenantIsolationVerified
    && input.trustCertification.result.tenantIsolationVerified
    && input.driftFoundation.result.tenantIsolationVerified
    && input.driftReplay.result.tenantIsolationVerified
    && input.driftCertification.result.tenantIsolationVerified
    && input.resilienceFoundation.result.tenantIsolationVerified
    && input.resilienceReplay.result.tenantIsolationVerified
    && input.resilienceCertification.result.tenantIsolationVerified
    && input.impactCertification.result.tenantIsolationVerified
    && input.portfolioCertification.result.tenantIsolationVerified
    && orderedBundles(input).every((bundle) => (
      bundle.ledger.entry.tenantId === tenantId
      && bundle.governanceReferences.tenantId === tenantId
      && bundle.ownershipEvidence.tenantId === tenantId
      && bundle.replayEvidence.tenantId === tenantId
    ));
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_DEPENDENCY_RISK_BLOCKED");
  return valid;
}

function validateOwnership(input: DependencyRiskFoundationInput, reasons: DependencyRiskFoundationReasonCode[]): boolean {
  const valid = input.dependencyFoundation.validation.ownershipValid
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateEvidencePresence(input: DependencyRiskFoundationInput, reasons: DependencyRiskFoundationReasonCode[]): boolean {
  const dependencyPresent = input.dependencyFoundation.evidencePath.dependencyReferences.length > 0;
  const governancePresent = input.dependencyFoundation.evidencePath.governanceReferences.length > 0;
  const replayPresent = input.dependencyFoundation.evidencePath.replayReferences.length > 0;
  addReason(reasons, dependencyPresent ? "DEPENDENCY_EVIDENCE_PRESENT" : "DEPENDENCY_EVIDENCE_MISSING");
  addReason(reasons, governancePresent ? "GOVERNANCE_EVIDENCE_PRESENT" : "GOVERNANCE_EVIDENCE_MISSING");
  addReason(reasons, replayPresent ? "REPLAY_EVIDENCE_PRESENT" : "REPLAY_EVIDENCE_MISSING");
  return dependencyPresent && governancePresent && replayPresent;
}

function validateBoundary(input: DependencyRiskFoundationInput, reasons: DependencyRiskFoundationReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const remediationAbsent = input.remediationRequested !== true;
  const controlSurfaceAbsent = !input.dependencyFoundation.controlSurfacePresent
    && !input.dependencyReplay.controlSurfacePresent
    && !input.dependencyCertification.controlSurfacePresent
    && !input.trustFoundation.controlSurfacePresent
    && !input.trustReplay.controlSurfacePresent
    && !input.trustCertification.controlSurfacePresent
    && !input.driftFoundation.controlSurfacePresent
    && !input.driftReplay.controlSurfacePresent
    && !input.driftCertification.controlSurfacePresent
    && !input.resilienceFoundation.controlSurfacePresent
    && !input.resilienceReplay.controlSurfacePresent
    && !input.resilienceCertification.controlSurfacePresent
    && !input.impactCertification.controlSurfacePresent
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
  addReason(reasons, remediationAbsent ? "REMEDIATION_ABSENT" : "REMEDIATION_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.dependencyRiskMutationAttempted === true ? "DEPENDENCY_RISK_MUTATION_DETECTED" : "DEPENDENCY_RISK_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  return Object.freeze({
    executionImpossible,
    authorityBounded,
    remediationAbsent,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || input.prioritizationRequested === true
      || input.recommendationRankingRequested === true
      || input.approvalRequested === true
      || !remediationAbsent
      || !authorityBounded
      || input.dependencyRiskMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createDependencyRiskEvidencePath(
  input: DependencyRiskFoundationInput,
  risks: readonly RecommendationDependencyRisk[],
): DependencyRiskEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.riskScope,
    dependencyRiskReferences: normalizeStrings(risks.map((risk) => risk.dependencyRiskId)),
    baselineReferences: normalizeStrings(risks.map((risk) => risk.baselineReference)),
    dependencyReferences: normalizeStrings([
      ...input.dependencyFoundation.evidencePath.dependencyReferences,
      ...risks.map((risk) => risk.dependencyReference),
    ]),
    propagationReferences: normalizeStrings([
      ...input.dependencyCertification.evidencePath.chainReferences,
      ...input.driftCertification.evidencePath.propagationReferences,
      ...input.resilienceCertification.evidencePath.propagationReferences,
    ]),
    replayReferences: normalizeStrings([
      ...input.dependencyFoundation.evidencePath.replayReferences,
      ...input.dependencyReplay.evidencePath.replayReferences,
      ...input.trustReplay.evidencePath.replayReferences,
      ...input.driftReplay.evidencePath.replayReferences,
      ...input.resilienceReplay.evidencePath.replayReferences,
      ...bundles.flatMap(collectReplayReferences),
    ]),
    governanceReferences: normalizeStrings([
      ...input.dependencyFoundation.evidencePath.governanceReferences,
      ...input.dependencyCertification.evidencePath.governanceReferences,
      ...input.trustCertification.evidencePath.governanceReferences,
      ...input.driftCertification.evidencePath.governanceReferences,
      ...input.resilienceCertification.evidencePath.governanceReferences,
      ...bundles.flatMap(collectGovernanceReferences),
    ]),
    trustReferences: normalizeStrings([
      ...input.trustFoundation.evidencePath.trustReferences,
      ...input.trustCertification.evidencePath.trustReferences,
    ]),
    driftReferences: normalizeStrings([
      ...input.driftFoundation.evidencePath.driftReferences,
      ...input.driftCertification.evidencePath.driftReferences,
    ]),
    resilienceReferences: normalizeStrings([
      ...input.resilienceFoundation.evidencePath.resilienceReferences,
      ...input.resilienceCertification.evidencePath.resilienceReferences,
    ]),
    evidenceHashes: normalizeStrings([
      input.dependencyFoundation.result.dependencyGraphHash,
      input.dependencyReplay.result.replayHash,
      input.dependencyReplay.result.reconstructionHash,
      input.dependencyCertification.result.certificationHash,
      input.trustFoundation.result.trustGraphHash,
      input.trustReplay.result.replayHash,
      input.trustCertification.result.certificationHash,
      input.driftFoundation.result.driftGraphHash,
      input.driftReplay.result.replayHash,
      input.driftCertification.result.certificationHash,
      input.resilienceFoundation.result.resilienceGraphHash,
      input.resilienceReplay.result.replayHash,
      input.resilienceCertification.result.certificationHash,
      input.impactCertification.result.certificationHash,
      input.portfolioCertification.result.certificationHash,
      ...risks.map((risk) => risk.dependencyRiskHash),
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  recommendationCount: number,
  riskCount: number,
  dependencyReferenceCount: number,
  propagationReferenceCount: number,
  replayReferenceCount: number,
  reasons: DependencyRiskFoundationReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_RECOMMENDATIONS
    && riskCount <= MAX_DEPENDENCY_RISK_RECORDS
    && dependencyReferenceCount <= MAX_DEPENDENCY_REFERENCES
    && propagationReferenceCount <= MAX_PROPAGATION_PATHS
    && replayReferenceCount <= MAX_REPLAY_REFERENCES;
  addReason(reasons, recommendationCount <= MAX_RECOMMENDATIONS ? "RECOMMENDATION_LIMIT_VALID" : "RECOMMENDATION_LIMIT_EXCEEDED");
  addReason(reasons, riskCount <= MAX_DEPENDENCY_RISK_RECORDS ? "DEPENDENCY_RISK_RECORD_LIMIT_VALID" : "DEPENDENCY_RISK_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, dependencyReferenceCount <= MAX_DEPENDENCY_REFERENCES ? "DEPENDENCY_REFERENCE_LIMIT_VALID" : "DEPENDENCY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, propagationReferenceCount <= MAX_PROPAGATION_PATHS ? "PROPAGATION_LIMIT_VALID" : "PROPAGATION_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function deriveRiskState(
  input: DependencyRiskFoundationInput,
  risks: readonly RecommendationDependencyRisk[],
  reasons: DependencyRiskFoundationReasonCode[],
): DependencyRiskState {
  const states = risks.map((risk) => risk.riskState);
  const highOrCriticalCount = states.filter((state) => state === "HIGH" || state === "CRITICAL").length;
  if (
    reasons.includes("OWNERSHIP_MISMATCH")
    || reasons.includes("CROSS_TENANT_DEPENDENCY_RISK_BLOCKED")
    || reasons.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || reasons.includes("REPLAY_CORRUPTION_DETECTED")
    || input.authorityExpansionDetected === true
  ) {
    return "CRITICAL";
  }
  if (
    input.dependencyFoundation.result.dependencyState === "OBSERVE"
    || input.dependencyFoundation.evidencePath.dependencyReferences.length === 0
    || input.dependencyFoundation.evidencePath.governanceReferences.length === 0
    || input.dependencyFoundation.evidencePath.replayReferences.length === 0
  ) {
    return "UNKNOWN";
  }
  if (states.includes("CRITICAL")) return "CRITICAL";
  if (highOrCriticalCount >= 2) {
    addReason(reasons, "MULTIPLE_DEPENDENCY_RISK_DOMAINS_TRIGGERED");
    return "HIGH";
  }
  if (states.includes("HIGH")) return "HIGH";
  if (states.includes("MODERATE")) {
    addReason(reasons, "BOUNDED_DEPENDENCY_RISK_DETECTED");
    return "MODERATE";
  }
  return "LOW";
}

function buildResult(
  request: DependencyRiskFoundationRequest,
  dependencyRiskState: DependencyRiskState,
  risks: readonly RecommendationDependencyRisk[],
  tenantIsolationVerified: boolean,
  dependencyRiskGraphHash: string,
): DependencyRiskFoundationResult {
  return Object.freeze({
    tenantId: request.tenantId,
    dependencyRiskState,
    dependencyRiskRecordsCreated: risks.length,
    concentrationRisksDetected: risks.filter((risk) => risk.riskType === "DEPENDENCY_CONCENTRATION_RISK").length,
    failureRisksDetected: risks.filter((risk) => risk.riskType === "DEPENDENCY_FAILURE_RISK").length,
    propagationRisksDetected: risks.filter((risk) => risk.riskType === "DEPENDENCY_PROPAGATION_RISK").length,
    fragilityRisksDetected: risks.filter((risk) => risk.riskType === "DEPENDENCY_FRAGILITY_RISK").length,
    availabilityRisksDetected: risks.filter((risk) => risk.riskType === "DEPENDENCY_AVAILABILITY_RISK").length,
    replayRisksDetected: risks.filter((risk) => risk.riskType === "DEPENDENCY_REPLAY_RISK").length,
    governanceRisksDetected: risks.filter((risk) => risk.riskType === "DEPENDENCY_GOVERNANCE_RISK").length,
    trustRisksDetected: risks.filter((risk) => risk.riskType === "DEPENDENCY_TRUST_RISK").length,
    driftRisksDetected: risks.filter((risk) => risk.riskType === "DEPENDENCY_DRIFT_RISK").length,
    resilienceRisksDetected: risks.filter((risk) => risk.riskType === "DEPENDENCY_RESILIENCE_RISK").length,
    tenantIsolationVerified,
    dependencyRiskGraphHash,
    deterministic: true,
  });
}

function buildObservability(result: DependencyRiskFoundationResult): DependencyRiskFoundationObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    dependencyRiskState: result.dependencyRiskState,
    dependencyRiskRecordsCreated: result.dependencyRiskRecordsCreated,
    concentrationRisksDetected: result.concentrationRisksDetected,
    failureRisksDetected: result.failureRisksDetected,
    propagationRisksDetected: result.propagationRisksDetected,
    fragilityRisksDetected: result.fragilityRisksDetected,
    availabilityRisksDetected: result.availabilityRisksDetected,
    replayRisksDetected: result.replayRisksDetected,
    governanceRisksDetected: result.governanceRisksDetected,
    trustRisksDetected: result.trustRisksDetected,
    driftRisksDetected: result.driftRisksDetected,
    resilienceRisksDetected: result.resilienceRisksDetected,
    dependencyRiskGraphHash: result.dependencyRiskGraphHash,
  });
}

function buildValidation(
  dependencyRiskState: DependencyRiskState,
  reasonCodes: readonly DependencyRiskFoundationReasonCode[],
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    dependencyRiskRecordsCreated: number;
    dependencyReferenceCount: number;
    propagationReferenceCount: number;
    replayReferenceCount: number;
  }>,
): DependencyRiskFoundationValidation {
  return Object.freeze({
    valid: dependencyRiskState !== "CRITICAL",
    dependencyRiskState,
    reasonCodes: [...reasonCodes],
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    remediationAbsent: boundary.remediationAbsent,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
    ...counts,
  });
}

export function buildDependencyRiskFoundationRequest(request: DependencyRiskFoundationRequest): DependencyRiskFoundationRequest {
  return requestCore(request);
}

export function sealDependencyRiskFoundation(input: DependencyRiskFoundationInput): SealedDependencyRiskFoundationRecord {
  const reasons: DependencyRiskFoundationReasonCode[] = [];
  const requestValid = validateRecommendationIds(input.request, reasons)
    && validateScope(input.request.riskScope, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const evidenceValid = validateEvidencePresence(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const risks = createRiskRecords(input, reasons);

  if (
    input.dependencyCertification.result.governanceCertified !== true
    || input.trustCertification.result.governanceCertified !== true
    || input.driftCertification.result.governanceCertified !== true
    || input.resilienceCertification.result.governanceCertified !== true
  ) addReason(reasons, "GOVERNANCE_CORRUPTION_DETECTED");

  if (
    input.dependencyReplay.result.replayState === "INVALID"
    || input.dependencyReplay.result.replayState === "ESCALATED"
    || input.trustReplay.result.replayState === "INVALID"
    || input.trustReplay.result.replayState === "ESCALATED"
    || input.driftReplay.result.replayState === "INVALID"
    || input.driftReplay.result.replayState === "ESCALATED"
    || input.resilienceReplay.result.replayState === "INVALID"
    || input.resilienceReplay.result.replayState === "ESCALATED"
  ) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");

  const evidencePath = createDependencyRiskEvidencePath(input, risks);
  const limitsValid = validateLimits(
    normalizeStrings(input.request.recommendationIds).length,
    risks.length,
    evidencePath.dependencyReferences.length,
    evidencePath.propagationReferences.length,
    evidencePath.replayReferences.length,
    reasons,
  );
  addReason(reasons, "DEPENDENCY_RISK_FOUNDATION_IS_NOT_CONTROL");

  const dependencyRiskState = !requestValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || boundary.invalidBoundary
    || !limitsValid
    ? "CRITICAL"
    : !evidenceValid
      ? "UNKNOWN"
      : deriveRiskState(input, risks, reasons);

  const dependencyRiskGraphHash = hashRiskValue("dependency-risk-foundation", {
    request: requestCore(input.request),
    dependencyRiskState,
    dependencyRiskReferences: evidencePath.dependencyRiskReferences,
    baselineReferences: evidencePath.baselineReferences,
    dependencyReferences: evidencePath.dependencyReferences,
    propagationReferences: evidencePath.propagationReferences,
    replayReferences: evidencePath.replayReferences,
    governanceReferences: evidencePath.governanceReferences,
    trustReferences: evidencePath.trustReferences,
    driftReferences: evidencePath.driftReferences,
    resilienceReferences: evidencePath.resilienceReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    dependencyRiskState,
    risks,
    tenantIsolationVerified,
    dependencyRiskGraphHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    dependencyRiskState,
    reasons,
    ownershipValid,
    tenantIsolationVerified,
    boundary,
    Object.freeze({
      dependencyRiskRecordsCreated: risks.length,
      dependencyReferenceCount: evidencePath.dependencyReferences.length,
      propagationReferenceCount: evidencePath.propagationReferences.length,
      replayReferenceCount: evidencePath.replayReferences.length,
    }),
  );

  return Object.freeze({
    result,
    risks,
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    riskOnly: true,
    executionAuthorized: false,
    workflowRoutingAllowed: false,
    prioritizationAllowed: false,
    recommendationRankingAllowed: false,
    approvalAllowed: false,
    remediationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
