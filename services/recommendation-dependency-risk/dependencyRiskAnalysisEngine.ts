import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  DependencyRiskAnalysisEvidencePath,
  DependencyRiskAnalysisInput,
  DependencyRiskAnalysisObservability,
  DependencyRiskAnalysisReasonCode,
  DependencyRiskAnalysisRequest,
  DependencyRiskAnalysisResult,
  DependencyRiskAnalysisScope,
  DependencyRiskAnalysisValidation,
  DependencyRiskConcentration,
  DependencyRiskConflict,
  DependencyRiskGap,
  DependencyRiskPropagation,
  DependencyRiskSeverity,
  DependencyRiskState,
  RecommendationDependencyRisk,
  SealedDependencyRiskAnalysisRecord,
} from "./types";

const MAX_RECOMMENDATIONS = 10_000;
const MAX_DEPENDENCY_RISK_RECORDS = 50_000;
const MAX_DEPENDENCY_REFERENCES = 25_000;
const MAX_PROPAGATION_PATHS = 25_000;
const MAX_REPLAY_REFERENCES = 10_000;

const ANALYSIS_SCOPES: readonly DependencyRiskAnalysisScope[] = Object.freeze([
  "SEVERITY",
  "CONCENTRATION",
  "PROPAGATION",
  "GAPS",
  "CONFLICTS",
  "FULL",
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

function addReason(reasons: DependencyRiskAnalysisReasonCode[], reason: DependencyRiskAnalysisReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashAnalysisValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: DependencyRiskAnalysisRequest): DependencyRiskAnalysisRequest {
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

function orderedBundles(input: DependencyRiskAnalysisInput): RecommendationPortfolioBundle[] {
  return [...input.recommendations].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function orderedRisks(risks: readonly RecommendationDependencyRisk[]): RecommendationDependencyRisk[] {
  return [...risks].sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.dependencyId.localeCompare(right.dependencyId)
    || left.riskType.localeCompare(right.riskType)
    || left.dependencyRiskId.localeCompare(right.dependencyRiskId)
  ));
}

function includesScope(scope: DependencyRiskAnalysisScope, requested: DependencyRiskAnalysisScope): boolean {
  return scope === "FULL" || scope === requested;
}

function createBoundaryFlags(record: Record<string, unknown>): boolean {
  const blockedFlags = [
    "executionAuthorized",
    "workflowRoutingAllowed",
    "prioritizationAllowed",
    "recommendationRankingAllowed",
    "approvalAllowed",
    "remediationAllowed",
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

function severityRank(state: DependencyRiskState): number {
  switch (state) {
    case "CRITICAL":
      return 4;
    case "HIGH":
      return 3;
    case "MODERATE":
      return 2;
    case "LOW":
      return 1;
    case "UNKNOWN":
    default:
      return 0;
  }
}

function groupedRiskEntries(risks: readonly RecommendationDependencyRisk[]): Array<{
  recommendationId: string;
  dependencyId: string;
  risks: RecommendationDependencyRisk[];
}> {
  const groups = new Map<string, RecommendationDependencyRisk[]>();
  for (const risk of orderedRisks(risks)) {
    const key = `${risk.recommendationId}::${risk.dependencyId}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(risk);
    groups.set(key, bucket);
  }
  return [...groups.entries()]
    .map(([key, grouped]) => {
      const [recommendationIdValue, dependencyId] = key.split("::");
      return { recommendationId: recommendationIdValue, dependencyId, risks: grouped };
    })
    .sort((left, right) => (
      left.recommendationId.localeCompare(right.recommendationId)
      || left.dependencyId.localeCompare(right.dependencyId)
    ));
}

function severityAnalysis(input: DependencyRiskAnalysisInput): DependencyRiskSeverity[] {
  const records: DependencyRiskSeverity[] = [];
  for (const entry of groupedRiskEntries(input.foundation.risks)) {
    const states = entry.risks.map((risk) => risk.riskState);
    const severity = states.includes("CRITICAL")
      ? "CRITICAL"
      : states.includes("HIGH")
        ? "HIGH"
        : states.includes("MODERATE")
          ? "MODERATE"
          : states.every((state) => state === "LOW")
            ? "LOW"
            : "UNKNOWN";
    records.push(Object.freeze({
      severityId: hashAnalysisValue("dependency-risk-severity-id", {
        recommendationId: entry.recommendationId,
        dependencyId: entry.dependencyId,
      }),
      recommendationId: entry.recommendationId,
      dependencyId: entry.dependencyId,
      severity,
      severityHash: hashAnalysisValue("dependency-risk-severity", {
        recommendationId: entry.recommendationId,
        dependencyId: entry.dependencyId,
        severity,
        riskIds: entry.risks.map((risk) => risk.dependencyRiskId),
      }),
    }));
  }
  return records;
}

function concentrationAnalysis(
  input: DependencyRiskAnalysisInput,
  severities: readonly DependencyRiskSeverity[],
): DependencyRiskConcentration[] {
  const records: DependencyRiskConcentration[] = [];
  const riskGroups = groupedRiskEntries(input.foundation.risks);
  const recommendationDependencyCounts = new Map<string, number>();
  const dependencyUsageCounts = new Map<string, number>();

  for (const entry of riskGroups) {
    recommendationDependencyCounts.set(`${entry.recommendationId}::${entry.dependencyId}`, entry.risks.length);
    dependencyUsageCounts.set(entry.dependencyId, (dependencyUsageCounts.get(entry.dependencyId) ?? 0) + 1);
  }

  for (const severity of severities) {
    const key = `${severity.recommendationId}::${severity.dependencyId}`;
    const recommendationRiskCount = recommendationDependencyCounts.get(key) ?? 0;
    const sharedCount = dependencyUsageCounts.get(severity.dependencyId) ?? 0;
    const concentrationTypes: DependencyRiskConcentration["concentrationType"][] = [];

    if (recommendationRiskCount >= 3 || severityRank(severity.severity) >= 3) {
      concentrationTypes.push("SINGLE_DEPENDENCY_OVER_RELIANCE");
    }
    if (sharedCount >= 2) {
      concentrationTypes.push("SHARED_DEPENDENCY_CONCENTRATION");
    }
    if (recommendationRiskCount >= 5 || sharedCount >= 3) {
      concentrationTypes.push("CLUSTER_CONCENTRATION_EXPOSURE");
    }
    if (recommendationRiskCount > 0) {
      concentrationTypes.push("PORTFOLIO_DEPENDENCY_CONCENTRATION");
    }

    for (const concentrationType of concentrationTypes) {
      records.push(Object.freeze({
        concentrationId: hashAnalysisValue("dependency-risk-concentration-id", {
          recommendationId: severity.recommendationId,
          dependencyId: severity.dependencyId,
          concentrationType,
        }),
        recommendationId: severity.recommendationId,
        dependencyId: severity.dependencyId,
        concentrationType,
        concentrationHash: hashAnalysisValue("dependency-risk-concentration", {
          recommendationId: severity.recommendationId,
          dependencyId: severity.dependencyId,
          concentrationType,
          recommendationRiskCount,
          sharedCount,
        }),
      }));
    }
  }

  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.dependencyId.localeCompare(right.dependencyId)
    || left.concentrationType.localeCompare(right.concentrationType)
  ));
}

function propagationAnalysis(
  input: DependencyRiskAnalysisInput,
  severities: readonly DependencyRiskSeverity[],
): DependencyRiskPropagation[] {
  const bundles = new Map(orderedBundles(input).map((bundle) => [recommendationId(bundle), bundle]));
  const records: DependencyRiskPropagation[] = [];
  const chainReferences = normalizeStrings([
    ...input.foundation.evidencePath.propagationReferences,
    ...input.dependencyAnalysis.evidencePath.chainReferences,
  ]);
  const impactReferences = normalizeStrings([
    ...input.impactAnalysis.evidencePath.propagationReferences,
    ...input.impactReplay.evidencePath.propagationReferences,
  ]);

  for (const severity of severities) {
    const bundle = bundles.get(severity.recommendationId);
    if (!bundle) continue;

    const propagationRefs: Array<{
      propagationType: DependencyRiskPropagation["propagationType"];
      propagationReference: string;
    }> = [];

    for (const reference of chainReferences) {
      propagationRefs.push({
        propagationType: "FAILURE_PROPAGATION_PATH",
        propagationReference: reference,
      });
      propagationRefs.push({
        propagationType: "DEPENDENCY_CHAIN_AMPLIFICATION",
        propagationReference: reference,
      });
    }
    for (const reference of impactReferences) {
      propagationRefs.push({
        propagationType: "IMPACT_PROPAGATION_EXPOSURE",
        propagationReference: reference,
      });
    }
    propagationRefs.push({
      propagationType: "CROSS_RELATIONSHIP_RISK_SPREAD",
      propagationReference: bundle.lineage.result.reconstructionHash,
    });
    propagationRefs.push({
      propagationType: "CASCADING_DEPENDENCY_EFFECT",
      propagationReference: bundle.replay.result.replayHash,
    });

    for (const propagation of propagationRefs) {
      records.push(Object.freeze({
        propagationId: hashAnalysisValue("dependency-risk-propagation-id", {
          recommendationId: severity.recommendationId,
          dependencyId: severity.dependencyId,
          propagationType: propagation.propagationType,
          propagationReference: propagation.propagationReference,
        }),
        recommendationId: severity.recommendationId,
        dependencyId: severity.dependencyId,
        propagationType: propagation.propagationType,
        propagationReference: propagation.propagationReference,
        propagationHash: hashAnalysisValue("dependency-risk-propagation", {
          recommendationId: severity.recommendationId,
          dependencyId: severity.dependencyId,
          propagationType: propagation.propagationType,
          propagationReference: propagation.propagationReference,
        }),
      }));
    }
  }

  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.dependencyId.localeCompare(right.dependencyId)
    || left.propagationType.localeCompare(right.propagationType)
    || left.propagationReference.localeCompare(right.propagationReference)
  ));
}

function gapsAnalysis(
  input: DependencyRiskAnalysisInput,
  severities: readonly DependencyRiskSeverity[],
): DependencyRiskGap[] {
  const records: DependencyRiskGap[] = [];
  const defaultTargets = severities.length > 0
    ? severities
    : [{ recommendationId: "foundation", dependencyId: "foundation" } satisfies Pick<DependencyRiskSeverity, "recommendationId" | "dependencyId">];

  const gapTypes: DependencyRiskGap["gapType"][] = [];
  if (input.foundation.evidencePath.dependencyReferences.length === 0) gapTypes.push("MISSING_DEPENDENCY_EVIDENCE");
  if (input.foundation.evidencePath.replayReferences.length === 0) gapTypes.push("MISSING_REPLAY_EVIDENCE");
  if (input.foundation.evidencePath.governanceReferences.length === 0) gapTypes.push("MISSING_GOVERNANCE_EVIDENCE");
  if (input.foundation.evidencePath.trustReferences.length === 0) gapTypes.push("MISSING_TRUST_EVIDENCE");
  if (input.foundation.evidencePath.resilienceReferences.length === 0) gapTypes.push("MISSING_RESILIENCE_EVIDENCE");
  if (input.foundation.evidencePath.driftReferences.length === 0) gapTypes.push("MISSING_DRIFT_EVIDENCE");

  for (const target of defaultTargets) {
    for (const gapType of gapTypes) {
      records.push(Object.freeze({
        gapId: hashAnalysisValue("dependency-risk-gap-id", {
          recommendationId: target.recommendationId,
          dependencyId: target.dependencyId,
          gapType,
        }),
        recommendationId: target.recommendationId,
        dependencyId: target.dependencyId,
        gapType,
        gapHash: hashAnalysisValue("dependency-risk-gap", {
          recommendationId: target.recommendationId,
          dependencyId: target.dependencyId,
          gapType,
        }),
      }));
    }
  }

  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.dependencyId.localeCompare(right.dependencyId)
    || left.gapType.localeCompare(right.gapType)
  ));
}

function conflictsAnalysis(
  input: DependencyRiskAnalysisInput,
  severities: readonly DependencyRiskSeverity[],
): DependencyRiskConflict[] {
  const records: DependencyRiskConflict[] = [];
  const bundles = new Map(orderedBundles(input).map((bundle) => [recommendationId(bundle), bundle]));

  for (const severity of severities) {
    const bundle = bundles.get(severity.recommendationId);
    if (!bundle) continue;
    const conflictTypes: DependencyRiskConflict["conflictType"][] = [];

    if (!governanceIntegrity(bundle)
      || input.dependencyCertification.result.governanceCertified === false
      || input.trustCertification.result.governanceCertified === false
      || input.driftCertification.result.governanceCertified === false
      || input.resilienceCertification.result.governanceCertified === false
      || input.impactCertification.result.governanceCertified === false
      || input.portfolioCertification.result.governanceCertified === false) {
      conflictTypes.push("GOVERNANCE_RISK_CONFLICT");
    }
    if (!replayIntegrity(bundle)
      || input.dependencyReplay.result.replayState === "INVALID"
      || input.dependencyReplay.result.replayState === "ESCALATED"
      || input.trustReplay.result.replayState === "INVALID"
      || input.trustReplay.result.replayState === "ESCALATED"
      || input.driftReplay.result.replayState === "INVALID"
      || input.driftReplay.result.replayState === "ESCALATED"
      || input.resilienceReplay.result.replayState === "INVALID"
      || input.resilienceReplay.result.replayState === "ESCALATED"
      || input.impactReplay.result.replayState === "INVALID"
      || input.impactReplay.result.replayState === "ESCALATED") {
      conflictTypes.push("REPLAY_RISK_CONFLICT");
    }
    if (input.trustFoundation.result.trustState === "UNTRUSTED"
      || input.trustFoundation.result.trustState === "UNKNOWN"
      || input.trustAnalysis.result.analysisState === "INVALID") {
      conflictTypes.push("TRUST_RISK_CONFLICT");
    }
    if (input.driftFoundation.result.driftState === "INVALID"
      || input.driftFoundation.result.driftState === "DRIFT_DETECTED"
      || input.driftAnalysis.result.analysisState === "INVALID") {
      conflictTypes.push("DRIFT_RISK_CONFLICT");
    }
    if (input.resilienceFoundation.result.resilienceState === "FRAGILE"
      || input.resilienceFoundation.result.resilienceState === "UNKNOWN"
      || input.resilienceAnalysis.result.analysisState === "INVALID") {
      conflictTypes.push("RESILIENCE_RISK_CONFLICT");
    }
    if (bundle.ownershipEvidence.recommendationId !== severity.recommendationId
      || input.authorityExpansionDetected === true) {
      conflictTypes.push("AUTHORITY_BOUNDARY_CONFLICT");
    }

    for (const conflictType of conflictTypes) {
      records.push(Object.freeze({
        conflictId: hashAnalysisValue("dependency-risk-conflict-id", {
          recommendationId: severity.recommendationId,
          dependencyId: severity.dependencyId,
          conflictType,
        }),
        recommendationId: severity.recommendationId,
        dependencyId: severity.dependencyId,
        conflictType,
        conflictHash: hashAnalysisValue("dependency-risk-conflict", {
          recommendationId: severity.recommendationId,
          dependencyId: severity.dependencyId,
          conflictType,
        }),
      }));
    }
  }

  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.dependencyId.localeCompare(right.dependencyId)
    || left.conflictType.localeCompare(right.conflictType)
  ));
}

function validateScope(scope: DependencyRiskAnalysisScope, reasons: DependencyRiskAnalysisReasonCode[]): boolean {
  const valid = ANALYSIS_SCOPES.includes(scope);
  addReason(reasons, valid ? "ANALYSIS_SCOPE_VALID" : "ANALYSIS_SCOPE_INVALID");
  return valid;
}

function validateRecommendationIds(request: DependencyRiskAnalysisRequest, reasons: DependencyRiskAnalysisReasonCode[]): boolean {
  const valid = request.recommendationIds.length > 0;
  addReason(reasons, valid ? "RECOMMENDATION_IDS_PRESENT" : "RECOMMENDATION_IDS_MISSING");
  return valid;
}

function validateFoundation(input: DependencyRiskAnalysisInput, reasons: DependencyRiskAnalysisReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, input.foundation.sealed === true ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: DependencyRiskAnalysisInput, reasons: DependencyRiskAnalysisReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.dependencyFoundation.sealed === true
    && input.dependencyAnalysis.sealed === true
    && input.dependencyReplay.sealed === true
    && input.dependencyCertification.sealed === true
    && input.trustFoundation.sealed === true
    && input.trustAnalysis.sealed === true
    && input.trustReplay.sealed === true
    && input.trustCertification.sealed === true
    && input.driftFoundation.sealed === true
    && input.driftAnalysis.sealed === true
    && input.driftReplay.sealed === true
    && input.driftCertification.sealed === true
    && input.resilienceFoundation.sealed === true
    && input.resilienceAnalysis.sealed === true
    && input.resilienceReplay.sealed === true
    && input.resilienceCertification.sealed === true
    && input.impactFoundation.sealed === true
    && input.impactAnalysis.sealed === true
    && input.impactReplay.sealed === true
    && input.impactCertification.sealed === true
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

  addReason(reasons, input.dependencyFoundation.sealed === true ? "DEPENDENCY_FOUNDATION_REQUIRED" : "DEPENDENCY_FOUNDATION_UNSEALED");
  addReason(reasons, input.dependencyAnalysis.sealed === true ? "DEPENDENCY_ANALYSIS_REQUIRED" : "DEPENDENCY_ANALYSIS_UNSEALED");
  addReason(reasons, input.dependencyReplay.sealed === true ? "DEPENDENCY_REPLAY_REQUIRED" : "DEPENDENCY_REPLAY_UNSEALED");
  addReason(reasons, input.dependencyCertification.sealed === true ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.trustFoundation.sealed === true ? "TRUST_FOUNDATION_REQUIRED" : "TRUST_FOUNDATION_UNSEALED");
  addReason(reasons, input.trustAnalysis.sealed === true ? "TRUST_ANALYSIS_REQUIRED" : "TRUST_ANALYSIS_UNSEALED");
  addReason(reasons, input.trustReplay.sealed === true ? "TRUST_REPLAY_REQUIRED" : "TRUST_REPLAY_UNSEALED");
  addReason(reasons, input.trustCertification.sealed === true ? "TRUST_CERTIFICATION_REQUIRED" : "TRUST_CERTIFICATION_UNSEALED");
  addReason(reasons, input.driftFoundation.sealed === true ? "DRIFT_FOUNDATION_REQUIRED" : "DRIFT_FOUNDATION_UNSEALED");
  addReason(reasons, input.driftAnalysis.sealed === true ? "DRIFT_ANALYSIS_REQUIRED" : "DRIFT_ANALYSIS_UNSEALED");
  addReason(reasons, input.driftReplay.sealed === true ? "DRIFT_REPLAY_REQUIRED" : "DRIFT_REPLAY_UNSEALED");
  addReason(reasons, input.driftCertification.sealed === true ? "DRIFT_CERTIFICATION_REQUIRED" : "DRIFT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.resilienceFoundation.sealed === true ? "RESILIENCE_FOUNDATION_REQUIRED" : "RESILIENCE_FOUNDATION_UNSEALED");
  addReason(reasons, input.resilienceAnalysis.sealed === true ? "RESILIENCE_ANALYSIS_REQUIRED" : "RESILIENCE_ANALYSIS_UNSEALED");
  addReason(reasons, input.resilienceReplay.sealed === true ? "RESILIENCE_REPLAY_REQUIRED" : "RESILIENCE_REPLAY_UNSEALED");
  addReason(reasons, input.resilienceCertification.sealed === true ? "RESILIENCE_CERTIFICATION_REQUIRED" : "RESILIENCE_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactFoundation.sealed === true ? "IMPACT_FOUNDATION_REQUIRED" : "IMPACT_FOUNDATION_UNSEALED");
  addReason(reasons, input.impactAnalysis.sealed === true ? "IMPACT_ANALYSIS_REQUIRED" : "IMPACT_ANALYSIS_UNSEALED");
  addReason(reasons, input.impactReplay.sealed === true ? "IMPACT_REPLAY_REQUIRED" : "IMPACT_REPLAY_UNSEALED");
  addReason(reasons, input.impactCertification.sealed === true ? "IMPACT_CERTIFICATION_REQUIRED" : "IMPACT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.portfolio.sealed === true ? "PORTFOLIO_REQUIRED" : "PORTFOLIO_UNSEALED");
  addReason(reasons, input.relationshipAnalysis.sealed === true ? "PORTFOLIO_ANALYSIS_REQUIRED" : "PORTFOLIO_ANALYSIS_UNSEALED");
  addReason(reasons, input.portfolioReplay.sealed === true ? "PORTFOLIO_REPLAY_REQUIRED" : "PORTFOLIO_REPLAY_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed === true ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: DependencyRiskAnalysisInput, reasons: DependencyRiskAnalysisReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.dependencyFoundation.result.tenantIsolationVerified
    && input.dependencyAnalysis.result.tenantIsolationVerified
    && input.dependencyReplay.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
    && input.trustFoundation.result.tenantIsolationVerified
    && input.trustAnalysis.result.tenantIsolationVerified
    && input.trustReplay.result.tenantIsolationVerified
    && input.trustCertification.result.tenantIsolationVerified
    && input.driftFoundation.result.tenantIsolationVerified
    && input.driftAnalysis.result.tenantIsolationVerified
    && input.driftReplay.result.tenantIsolationVerified
    && input.driftCertification.result.tenantIsolationVerified
    && input.resilienceFoundation.result.tenantIsolationVerified
    && input.resilienceAnalysis.result.tenantIsolationVerified
    && input.resilienceReplay.result.tenantIsolationVerified
    && input.resilienceCertification.result.tenantIsolationVerified
    && input.impactFoundation.result.tenantIsolationVerified
    && input.impactAnalysis.result.tenantIsolationVerified
    && input.impactReplay.result.tenantIsolationVerified
    && input.impactCertification.result.tenantIsolationVerified
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
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_DEPENDENCY_RISK_BLOCKED");
  return valid;
}

function validateOwnership(input: DependencyRiskAnalysisInput, reasons: DependencyRiskAnalysisReasonCode[]): boolean {
  const requested = normalizeStrings(input.request.recommendationIds);
  const actual = normalizeStrings(input.foundation.risks.map((risk) => risk.recommendationId));
  const valid = input.foundation.validation.ownershipValid
    && requested.every((id) => actual.includes(id))
    && orderedBundles(input).every((bundle) => bundle.ownershipEvidence.recommendationId === recommendationId(bundle));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateSeverities(severities: readonly DependencyRiskSeverity[], reasons: DependencyRiskAnalysisReasonCode[]): boolean {
  const valid = severities.length > 0;
  addReason(reasons, valid ? "RISK_SEVERITY_ANALYZED" : "RISK_SEVERITY_LIMITED");
  return valid;
}

function validateConcentrations(concentrations: readonly DependencyRiskConcentration[], reasons: DependencyRiskAnalysisReasonCode[]): boolean {
  const valid = concentrations.length > 0;
  addReason(reasons, valid ? "RISK_CONCENTRATION_ANALYZED" : "RISK_CONCENTRATION_LIMITED");
  return valid;
}

function validatePropagations(propagations: readonly DependencyRiskPropagation[], reasons: DependencyRiskAnalysisReasonCode[]): boolean {
  const valid = propagations.length > 0;
  addReason(reasons, valid ? "RISK_PROPAGATION_ANALYZED" : "RISK_PROPAGATION_LIMITED");
  return valid;
}

function validateGaps(gaps: readonly DependencyRiskGap[], reasons: DependencyRiskAnalysisReasonCode[]): boolean {
  addReason(reasons, gaps.length > 0 ? "RISK_GAPS_DETECTED" : "RISK_GAPS_ABSENT");
  return gaps.length === 0;
}

function validateConflicts(conflicts: readonly DependencyRiskConflict[], reasons: DependencyRiskAnalysisReasonCode[]): boolean {
  addReason(reasons, conflicts.length > 0 ? "RISK_CONFLICTS_DETECTED" : "RISK_CONFLICTS_ABSENT");
  return conflicts.length === 0;
}

function validateGovernance(input: DependencyRiskAnalysisInput, reasons: DependencyRiskAnalysisReasonCode[]): boolean {
  const valid = input.dependencyCertification.result.governanceCertified
    && input.trustCertification.result.governanceCertified
    && input.driftCertification.result.governanceCertified
    && input.resilienceCertification.result.governanceCertified
    && input.impactCertification.result.governanceCertified
    && input.portfolioCertification.result.governanceCertified
    && orderedBundles(input).every(governanceIntegrity);
  addReason(reasons, valid ? "GOVERNANCE_CONTINUITY_PRESERVED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return valid;
}

function validateReplay(input: DependencyRiskAnalysisInput, reasons: DependencyRiskAnalysisReasonCode[]): boolean {
  const valid = input.dependencyCertification.result.replayCertified
    && input.trustCertification.result.replayCertified
    && input.driftCertification.result.replayCertified
    && input.resilienceCertification.result.replayCertified
    && input.impactCertification.result.replayCertified
    && input.portfolioCertification.result.replayCertified
    && input.dependencyReplay.result.replayState !== "INVALID"
    && input.dependencyReplay.result.replayState !== "ESCALATED"
    && input.trustReplay.result.replayState !== "INVALID"
    && input.trustReplay.result.replayState !== "ESCALATED"
    && input.driftReplay.result.replayState !== "INVALID"
    && input.driftReplay.result.replayState !== "ESCALATED"
    && input.resilienceReplay.result.replayState !== "INVALID"
    && input.resilienceReplay.result.replayState !== "ESCALATED"
    && input.impactReplay.result.replayState !== "INVALID"
    && input.impactReplay.result.replayState !== "ESCALATED"
    && input.portfolioReplay.result.replayState !== "INVALID"
    && input.portfolioReplay.result.replayState !== "ESCALATED"
    && orderedBundles(input).every(replayIntegrity);
  addReason(reasons, valid ? "REPLAY_CONTINUITY_PRESERVED" : "REPLAY_CORRUPTION_DETECTED");
  return valid;
}

function validateRiskEvidence(input: DependencyRiskAnalysisInput, reasons: DependencyRiskAnalysisReasonCode[]): boolean {
  const valid = input.foundation.risks.length > 0 && input.foundation.evidencePath.dependencyRiskReferences.length > 0;
  addReason(reasons, valid ? "RISK_EVIDENCE_PRESENT" : "RISK_EVIDENCE_MISSING");
  addReason(reasons, input.foundation.evidencePath.dependencyReferences.length > 0 ? "DEPENDENCY_REFERENCES_PRESENT" : "DEPENDENCY_REFERENCES_MISSING");
  addReason(reasons, input.foundation.evidencePath.replayReferences.length > 0 ? "REPLAY_REFERENCES_PRESENT" : "REPLAY_REFERENCES_MISSING");
  addReason(reasons, input.foundation.evidencePath.governanceReferences.length > 0 ? "GOVERNANCE_REFERENCES_PRESENT" : "GOVERNANCE_REFERENCES_MISSING");
  return valid;
}

function validateBoundary(input: DependencyRiskAnalysisInput, reasons: DependencyRiskAnalysisReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const remediationAbsent = input.remediationRequested !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.dependencyFoundation.controlSurfacePresent
    && !input.dependencyAnalysis.controlSurfacePresent
    && !input.dependencyReplay.controlSurfacePresent
    && !input.dependencyCertification.controlSurfacePresent
    && !input.trustFoundation.controlSurfacePresent
    && !input.trustAnalysis.controlSurfacePresent
    && !input.trustReplay.controlSurfacePresent
    && !input.trustCertification.controlSurfacePresent
    && !input.driftFoundation.controlSurfacePresent
    && !input.driftAnalysis.controlSurfacePresent
    && !input.driftReplay.controlSurfacePresent
    && !input.driftCertification.controlSurfacePresent
    && !input.resilienceFoundation.controlSurfacePresent
    && !input.resilienceAnalysis.controlSurfacePresent
    && !input.resilienceReplay.controlSurfacePresent
    && !input.resilienceCertification.controlSurfacePresent
    && !input.impactFoundation.controlSurfacePresent
    && !input.impactAnalysis.controlSurfacePresent
    && !input.impactReplay.controlSurfacePresent
    && !input.impactCertification.controlSurfacePresent
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
  addReason(reasons, remediationAbsent ? "REMEDIATION_ABSENT" : "REMEDIATION_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.analysisMutationAttempted === true ? "ANALYSIS_MUTATION_DETECTED" : "ANALYSIS_MUTATION_BLOCKED");
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
      || input.analysisMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createDependencyRiskAnalysisEvidencePath(
  input: DependencyRiskAnalysisInput,
  severities: readonly DependencyRiskSeverity[],
  concentrations: readonly DependencyRiskConcentration[],
  propagations: readonly DependencyRiskPropagation[],
  gaps: readonly DependencyRiskGap[],
  conflicts: readonly DependencyRiskConflict[],
): DependencyRiskAnalysisEvidencePath {
  return Object.freeze({
    scope: input.request.analysisScope,
    dependencyRiskReferences: normalizeStrings(input.foundation.risks.map((risk) => risk.dependencyRiskId)),
    severityReferences: normalizeStrings(severities.map((severity) => `${severity.recommendationId}:${severity.dependencyId}:${severity.severity}`)),
    concentrationReferences: normalizeStrings(concentrations.map((concentration) => `${concentration.recommendationId}:${concentration.dependencyId}:${concentration.concentrationType}`)),
    propagationReferences: normalizeStrings(propagations.map((propagation) => `${propagation.recommendationId}:${propagation.dependencyId}:${propagation.propagationType}:${propagation.propagationReference}`)),
    gapReferences: normalizeStrings(gaps.map((gap) => `${gap.recommendationId}:${gap.dependencyId}:${gap.gapType}`)),
    conflictReferences: normalizeStrings(conflicts.map((conflict) => `${conflict.recommendationId}:${conflict.dependencyId}:${conflict.conflictType}`)),
    dependencyReferences: normalizeStrings([
      ...input.foundation.evidencePath.dependencyReferences,
      ...input.dependencyFoundation.evidencePath.dependencyReferences,
      ...input.dependencyAnalysis.evidencePath.dependencyReferences,
    ]),
    replayReferences: normalizeStrings([
      ...input.foundation.evidencePath.replayReferences,
      ...input.dependencyReplay.evidencePath.replayReferences,
      ...input.trustReplay.evidencePath.replayReferences,
      ...input.driftReplay.evidencePath.replayReferences,
      ...input.resilienceReplay.evidencePath.replayReferences,
      ...input.impactReplay.evidencePath.replayReferences,
      ...input.portfolioReplay.evidencePath.replayReferences,
    ]),
    governanceReferences: normalizeStrings([
      ...input.foundation.evidencePath.governanceReferences,
    ]),
    evidenceHashes: normalizeStrings([
      input.foundation.result.dependencyRiskGraphHash,
      input.dependencyFoundation.result.dependencyGraphHash,
      input.dependencyAnalysis.result.analysisHash,
      input.dependencyReplay.result.replayHash,
      input.dependencyCertification.result.certificationHash,
      input.trustFoundation.result.trustGraphHash,
      input.trustAnalysis.result.analysisHash,
      input.trustReplay.result.replayHash,
      input.trustCertification.result.certificationHash,
      input.driftFoundation.result.driftGraphHash,
      input.driftAnalysis.result.analysisHash,
      input.driftReplay.result.replayHash,
      input.driftCertification.result.certificationHash,
      input.resilienceFoundation.result.resilienceGraphHash,
      input.resilienceAnalysis.result.analysisHash,
      input.resilienceReplay.result.replayHash,
      input.resilienceCertification.result.certificationHash,
      input.impactFoundation.result.impactGraphHash,
      input.impactAnalysis.result.analysisHash,
      input.impactReplay.result.replayHash,
      input.impactCertification.result.certificationHash,
      input.portfolio.result.portfolioHash,
      input.relationshipAnalysis.result.analysisHash,
      input.portfolioReplay.result.replayHash,
      input.portfolioCertification.result.certificationHash,
      ...input.foundation.evidencePath.evidenceHashes,
      ...severities.map((severity) => severity.severityHash),
      ...concentrations.map((concentration) => concentration.concentrationHash),
      ...propagations.map((propagation) => propagation.propagationHash),
      ...gaps.map((gap) => gap.gapHash),
      ...conflicts.map((conflict) => conflict.conflictHash),
    ]),
  });
}

function validateLimits(
  recommendationCount: number,
  riskRecordCount: number,
  dependencyReferenceCount: number,
  propagationCount: number,
  replayReferenceCount: number,
  reasons: DependencyRiskAnalysisReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_RECOMMENDATIONS
    && riskRecordCount <= MAX_DEPENDENCY_RISK_RECORDS
    && dependencyReferenceCount <= MAX_DEPENDENCY_REFERENCES
    && propagationCount <= MAX_PROPAGATION_PATHS
    && replayReferenceCount <= MAX_REPLAY_REFERENCES;
  addReason(reasons, recommendationCount <= MAX_RECOMMENDATIONS ? "RECOMMENDATION_LIMIT_VALID" : "RECOMMENDATION_LIMIT_EXCEEDED");
  addReason(reasons, riskRecordCount <= MAX_DEPENDENCY_RISK_RECORDS ? "DEPENDENCY_RISK_RECORD_LIMIT_VALID" : "DEPENDENCY_RISK_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, dependencyReferenceCount <= MAX_DEPENDENCY_REFERENCES ? "DEPENDENCY_REFERENCE_LIMIT_VALID" : "DEPENDENCY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, propagationCount <= MAX_PROPAGATION_PATHS ? "PROPAGATION_LIMIT_VALID" : "PROPAGATION_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: DependencyRiskAnalysisRequest,
  analysisState: DependencyRiskAnalysisResult["analysisState"],
  severities: readonly DependencyRiskSeverity[],
  concentrations: readonly DependencyRiskConcentration[],
  propagations: readonly DependencyRiskPropagation[],
  gaps: readonly DependencyRiskGap[],
  conflicts: readonly DependencyRiskConflict[],
  tenantIsolationVerified: boolean,
  analysisHash: string,
): DependencyRiskAnalysisResult {
  return Object.freeze({
    tenantId: request.tenantId,
    analysisState,
    riskSeveritiesDetected: severities.length,
    riskConcentrationsDetected: concentrations.length,
    riskPropagationsDetected: propagations.length,
    riskGapsDetected: gaps.length,
    riskConflictsDetected: conflicts.length,
    tenantIsolationVerified,
    analysisHash,
    deterministic: true,
  });
}

function buildObservability(result: DependencyRiskAnalysisResult): DependencyRiskAnalysisObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    analysisState: result.analysisState,
    riskSeveritiesDetected: result.riskSeveritiesDetected,
    riskConcentrationsDetected: result.riskConcentrationsDetected,
    riskPropagationsDetected: result.riskPropagationsDetected,
    riskGapsDetected: result.riskGapsDetected,
    riskConflictsDetected: result.riskConflictsDetected,
    analysisHash: result.analysisHash,
  });
}

function buildValidation(
  analysisState: DependencyRiskAnalysisResult["analysisState"],
  reasonCodes: readonly DependencyRiskAnalysisReasonCode[],
  severities: readonly DependencyRiskSeverity[],
  concentrations: readonly DependencyRiskConcentration[],
  propagations: readonly DependencyRiskPropagation[],
  gaps: readonly DependencyRiskGap[],
  conflicts: readonly DependencyRiskConflict[],
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
): DependencyRiskAnalysisValidation {
  return Object.freeze({
    valid: analysisState !== "INVALID",
    analysisState,
    reasonCodes: [...reasonCodes],
    riskSeveritiesDetected: severities.length,
    riskConcentrationsDetected: concentrations.length,
    riskPropagationsDetected: propagations.length,
    riskGapsDetected: gaps.length,
    riskConflictsDetected: conflicts.length,
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    remediationAbsent: boundary.remediationAbsent,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
  });
}

export function buildDependencyRiskAnalysisRequest(request: DependencyRiskAnalysisRequest): DependencyRiskAnalysisRequest {
  return requestCore(request);
}

export function sealDependencyRiskAnalysis(input: DependencyRiskAnalysisInput): SealedDependencyRiskAnalysisRecord {
  const reasons: DependencyRiskAnalysisReasonCode[] = [];
  const severities = includesScope(input.request.analysisScope, "SEVERITY") ? severityAnalysis(input) : [];
  const concentrations = includesScope(input.request.analysisScope, "CONCENTRATION") ? concentrationAnalysis(input, severities) : [];
  const propagations = includesScope(input.request.analysisScope, "PROPAGATION") ? propagationAnalysis(input, severities) : [];
  const gaps = includesScope(input.request.analysisScope, "GAPS") ? gapsAnalysis(input, severities) : [];
  const conflicts = includesScope(input.request.analysisScope, "CONFLICTS") ? conflictsAnalysis(input, severities) : [];

  const requestValid = validateRecommendationIds(input.request, reasons) && validateScope(input.request.analysisScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const severitiesValid = includesScope(input.request.analysisScope, "SEVERITY") ? validateSeverities(severities, reasons) : true;
  const concentrationsValid = includesScope(input.request.analysisScope, "CONCENTRATION") ? validateConcentrations(concentrations, reasons) : true;
  const propagationsValid = includesScope(input.request.analysisScope, "PROPAGATION") ? validatePropagations(propagations, reasons) : true;
  const gapsClear = includesScope(input.request.analysisScope, "GAPS") ? validateGaps(gaps, reasons) : true;
  const conflictsClear = includesScope(input.request.analysisScope, "CONFLICTS") ? validateConflicts(conflicts, reasons) : true;
  const governanceValid = validateGovernance(input, reasons);
  const replayValid = validateReplay(input, reasons);
  const riskEvidencePresent = validateRiskEvidence(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createDependencyRiskAnalysisEvidencePath(input, severities, concentrations, propagations, gaps, conflicts);
  const limitsValid = validateLimits(
    normalizeStrings(input.request.recommendationIds).length,
    input.foundation.risks.length,
    evidencePath.dependencyReferences.length,
    propagations.length,
    evidencePath.replayReferences.length,
    reasons,
  );
  addReason(reasons, "DEPENDENCY_RISK_ANALYSIS_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !foundationValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || !governanceValid
    || !replayValid
    || boundary.invalidBoundary;
  const observe = !invalid && (!riskEvidencePresent || input.foundation.result.dependencyRiskState === "UNKNOWN");
  const limited = !invalid && !observe && (
    !severitiesValid
    || !concentrationsValid
    || !propagationsValid
    || !gapsClear
    || !conflictsClear
    || !limitsValid
    || input.foundation.result.dependencyRiskState === "MODERATE"
    || input.foundation.result.dependencyRiskState === "HIGH"
    || input.foundation.result.dependencyRiskState === "CRITICAL"
  );
  const analysisState = invalid ? "INVALID" : observe ? "OBSERVE" : limited ? "LIMITED" : "ANALYZED";

  const analysisHash = hashAnalysisValue("dependency-risk-analysis-engine", {
    request: requestCore(input.request),
    analysisState,
    dependencyRiskReferences: evidencePath.dependencyRiskReferences,
    severityReferences: evidencePath.severityReferences,
    concentrationReferences: evidencePath.concentrationReferences,
    propagationReferences: evidencePath.propagationReferences,
    gapReferences: evidencePath.gapReferences,
    conflictReferences: evidencePath.conflictReferences,
    dependencyReferences: evidencePath.dependencyReferences,
    replayReferences: evidencePath.replayReferences,
    governanceReferences: evidencePath.governanceReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    analysisState,
    severities,
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
    severities,
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
    severities: Object.freeze(severities),
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
    remediationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
