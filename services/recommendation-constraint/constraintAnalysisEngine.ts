import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  ConstraintAnalysisEvidencePath,
  ConstraintAnalysisInput,
  ConstraintAnalysisObservability,
  ConstraintAnalysisReasonCode,
  ConstraintAnalysisRequest,
  ConstraintAnalysisResult,
  ConstraintAnalysisScope,
  ConstraintAnalysisState,
  ConstraintAnalysisValidation,
  ConstraintConcentration,
  ConstraintConcentrationType,
  ConstraintConflict,
  ConstraintConflictType,
  ConstraintGap,
  ConstraintGapType,
  ConstraintPropagation,
  ConstraintPropagationType,
  ConstraintSeverityLevel,
  ConstraintSeverityRecord,
  RecommendationConstraint,
  RecommendationConstraintType,
  SealedConstraintAnalysisRecord,
} from "./types";

const MAX_RECOMMENDATIONS = 10_000;
const MAX_CONSTRAINT_RECORDS = 50_000;
const MAX_CONSTRAINT_CONFLICTS = 10_000;
const MAX_PROPAGATION_PATHS = 25_000;

const ANALYSIS_SCOPES: readonly ConstraintAnalysisScope[] = Object.freeze([
  "SEVERITY",
  "CONCENTRATION",
  "PROPAGATION",
  "GAPS",
  "CONFLICTS",
  "FULL",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  approvalImpossible: boolean;
  prioritizationAbsent: boolean;
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

function addReason(reasons: ConstraintAnalysisReasonCode[], reason: ConstraintAnalysisReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashAnalysisValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: ConstraintAnalysisRequest): ConstraintAnalysisRequest {
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

function orderedBundles(input: ConstraintAnalysisInput): RecommendationPortfolioBundle[] {
  return [...input.recommendations].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function bundleMap(input: ConstraintAnalysisInput): Map<string, RecommendationPortfolioBundle> {
  return new Map(orderedBundles(input).map((bundle) => [recommendationId(bundle), bundle]));
}

function orderedConstraints(input: ConstraintAnalysisInput): RecommendationConstraint[] {
  return [...input.foundation.constraints].sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.constraintType.localeCompare(right.constraintType)
    || left.constraintId.localeCompare(right.constraintId)
  ));
}

function includesScope(scope: ConstraintAnalysisScope, requested: ConstraintAnalysisScope): boolean {
  return scope === "FULL" || scope === requested;
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

function trustSupported(input: ConstraintAnalysisInput): boolean {
  return input.trustCertification.result.governanceCertified === true
    && input.trustReplay.result.replayState !== "INVALID"
    && input.trustReplay.result.replayState !== "ESCALATED"
    && input.trustFoundation.result.trustState !== "DEGRADED"
    && input.trustFoundation.result.trustState !== "UNTRUSTED"
    && input.trustFoundation.result.trustState !== "UNKNOWN";
}

function resilienceSupported(input: ConstraintAnalysisInput): boolean {
  return input.resilienceCertification.result.governanceCertified === true
    && input.resilienceReplay.result.replayState !== "INVALID"
    && input.resilienceReplay.result.replayState !== "ESCALATED"
    && input.resilienceFoundation.result.resilienceState !== "DEGRADED"
    && input.resilienceFoundation.result.resilienceState !== "FRAGILE"
    && input.resilienceFoundation.result.resilienceState !== "UNKNOWN";
}

function membershipComplete(input: ConstraintAnalysisInput): boolean {
  const requested = normalizeStrings(input.request.recommendationIds);
  const actual = normalizeStrings(orderedBundles(input).map(recommendationId));
  return requested.length === actual.length && requested.every((value, index) => value === actual[index]);
}

function readinessSeverity(state: string): ConstraintSeverityLevel | null {
  if (state === "NOT_READY" || state === "CONSTITUTIONALLY_BLOCKED") return "BLOCKING";
  if (state === "LIMITED" || state === "LIMITED_READINESS" || state === "OPERATOR_REVIEW_REQUIRED") return "HIGH";
  if (state === "CONDITIONALLY_READY" || state === "DISPUTED") return "CRITICAL";
  return null;
}

function severityForConstraint(input: ConstraintAnalysisInput, constraint: RecommendationConstraint): ConstraintSeverityLevel {
  const readinessStates = orderedBundles(input).map((bundle) => bundle.readiness.result.readinessState);

  if (constraint.constraintState === "BLOCKING") return "BLOCKING";

  switch (constraint.constraintType) {
    case "GOVERNANCE_CONSTRAINT":
      if (!orderedBundles(input).every(governanceIntegrity)) return "BLOCKING";
      break;
    case "DEPENDENCY_CONSTRAINT":
      if (input.dependencyRiskFoundation.result.dependencyRiskState === "CRITICAL") return "BLOCKING";
      if (input.dependencyRiskFoundation.result.dependencyRiskState === "HIGH") return "CRITICAL";
      if (input.dependencyFoundation.result.dependencyState === "LIMITED") return "HIGH";
      break;
    case "RESOURCE_CONSTRAINT":
      if (input.impactFoundation.result.impactState === "LIMITED" && input.portfolio.result.portfolioState === "LIMITED") return "CRITICAL";
      if (input.impactFoundation.result.impactState === "LIMITED" || input.portfolio.result.portfolioState === "LIMITED") return "HIGH";
      break;
    case "TRUST_CONSTRAINT":
      if (input.trustFoundation.result.trustState === "UNTRUSTED") return "BLOCKING";
      if (input.trustFoundation.result.trustState === "DEGRADED") return "CRITICAL";
      if (input.trustFoundation.result.trustState === "CONDITIONALLY_TRUSTED") return "MODERATE";
      break;
    case "RESILIENCE_CONSTRAINT":
      if (input.resilienceFoundation.result.resilienceState === "FRAGILE") return "BLOCKING";
      if (input.resilienceFoundation.result.resilienceState === "DEGRADED") return "CRITICAL";
      if (input.resilienceFoundation.result.resilienceState === "CONDITIONALLY_RESILIENT") return "HIGH";
      break;
    case "READINESS_CONSTRAINT": {
      const derived = readinessStates.map(readinessSeverity).find((value) => value !== null);
      if (derived) return derived;
      break;
    }
    case "PORTFOLIO_CONSTRAINT":
      if (input.portfolio.result.portfolioState === "LIMITED" || input.relationshipAnalysis.result.relationshipState === "LIMITED") return "HIGH";
      break;
    case "RISK_CONSTRAINT":
      if (input.dependencyRiskFoundation.result.dependencyRiskState === "CRITICAL") return "BLOCKING";
      if (input.dependencyRiskFoundation.result.dependencyRiskState === "HIGH") return "CRITICAL";
      if (input.dependencyRiskFoundation.result.dependencyRiskState === "MODERATE") return "HIGH";
      break;
    default:
      break;
  }

  if (constraint.constraintState === "LIMITED") return "HIGH";
  if (constraint.constraintState === "CONDITIONAL") return "MODERATE";
  return "LOW";
}

function severityAnalysis(input: ConstraintAnalysisInput): ConstraintSeverityRecord[] {
  return orderedConstraints(input).map((constraint) => {
    const severity = severityForConstraint(input, constraint);
    return Object.freeze({
      severityId: hashAnalysisValue("constraint-severity-id", {
        constraintId: constraint.constraintId,
        recommendationId: constraint.recommendationId,
        constraintType: constraint.constraintType,
      }),
      constraintId: constraint.constraintId,
      recommendationId: constraint.recommendationId,
      constraintType: constraint.constraintType,
      severity,
      severityHash: hashAnalysisValue("constraint-severity", {
        constraintId: constraint.constraintId,
        recommendationId: constraint.recommendationId,
        constraintType: constraint.constraintType,
        severity,
      }),
    });
  });
}

function concentrationTypeFor(constraintType: RecommendationConstraintType): ConstraintConcentrationType | null {
  switch (constraintType) {
    case "GOVERNANCE_CONSTRAINT":
      return "GOVERNANCE_CONSTRAINT_CONCENTRATION";
    case "DEPENDENCY_CONSTRAINT":
      return "DEPENDENCY_CONSTRAINT_CONCENTRATION";
    case "RESOURCE_CONSTRAINT":
      return "RESOURCE_CONSTRAINT_CONCENTRATION";
    case "TRUST_CONSTRAINT":
      return "TRUST_CONSTRAINT_CONCENTRATION";
    case "RESILIENCE_CONSTRAINT":
      return "RESILIENCE_CONSTRAINT_CONCENTRATION";
    case "RISK_CONSTRAINT":
      return "RISK_CONSTRAINT_CONCENTRATION";
    default:
      return null;
  }
}

function concentrationAnalysis(input: ConstraintAnalysisInput): ConstraintConcentration[] {
  const records: ConstraintConcentration[] = [];
  const constraints = orderedConstraints(input);
  const byRecommendation = new Map<string, RecommendationConstraint[]>();
  const byType = new Map<RecommendationConstraintType, number>();

  for (const constraint of constraints) {
    const recommendationBucket = byRecommendation.get(constraint.recommendationId) ?? [];
    recommendationBucket.push(constraint);
    byRecommendation.set(constraint.recommendationId, recommendationBucket);
    byType.set(constraint.constraintType, (byType.get(constraint.constraintType) ?? 0) + 1);
  }

  for (const [recommendationIdValue, recommendationConstraints] of [...byRecommendation.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    if (recommendationConstraints.length >= 3) {
      records.push(Object.freeze({
        concentrationId: hashAnalysisValue("constraint-concentration-id", {
          recommendationId: recommendationIdValue,
          concentrationType: "HIGH_CONSTRAINT_CLUSTER",
        }),
        recommendationId: recommendationIdValue,
        constraintType: "PORTFOLIO",
        concentrationType: "HIGH_CONSTRAINT_CLUSTER",
        concentrationHash: hashAnalysisValue("constraint-concentration", {
          recommendationId: recommendationIdValue,
          constraintCount: recommendationConstraints.length,
          concentrationType: "HIGH_CONSTRAINT_CLUSTER",
        }),
      }));
    }
  }

  for (const constraintType of [...byType.keys()].sort()) {
    const concentrationType = concentrationTypeFor(constraintType);
    if (!concentrationType) continue;
    const count = byType.get(constraintType) ?? 0;
    if (count <= 1) continue;
    records.push(Object.freeze({
      concentrationId: hashAnalysisValue("constraint-concentration-id", {
        constraintType,
        concentrationType,
      }),
      recommendationId: "portfolio",
      constraintType,
      concentrationType,
      concentrationHash: hashAnalysisValue("constraint-concentration", {
        constraintType,
        concentrationType,
        count,
      }),
    }));
  }

  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.constraintType.localeCompare(right.constraintType)
    || left.concentrationType.localeCompare(right.concentrationType)
  ));
}

function propagationDescriptors(constraintType: RecommendationConstraintType): readonly ConstraintPropagationType[] {
  switch (constraintType) {
    case "GOVERNANCE_CONSTRAINT":
      return ["CONSTRAINT_PROPAGATION_PATH", "GOVERNANCE_RESTRICTION_PROPAGATION"];
    case "DEPENDENCY_CONSTRAINT":
      return ["CONSTRAINT_PROPAGATION_PATH", "DEPENDENCY_LIMITATION_PROPAGATION"];
    case "RESOURCE_CONSTRAINT":
      return ["CONSTRAINT_PROPAGATION_PATH", "RESOURCE_LIMITATION_PROPAGATION"];
    case "TRUST_CONSTRAINT":
      return ["CONSTRAINT_PROPAGATION_PATH", "TRUST_LIMITATION_PROPAGATION"];
    case "RESILIENCE_CONSTRAINT":
      return ["CONSTRAINT_PROPAGATION_PATH", "RESILIENCE_LIMITATION_PROPAGATION"];
    case "RISK_CONSTRAINT":
      return ["CONSTRAINT_PROPAGATION_PATH", "RISK_PROPAGATION"];
    default:
      return ["CONSTRAINT_PROPAGATION_PATH"];
  }
}

function resolvePropagationReference(
  input: ConstraintAnalysisInput,
  constraint: RecommendationConstraint,
  propagationType: ConstraintPropagationType,
): string {
  switch (propagationType) {
    case "GOVERNANCE_RESTRICTION_PROPAGATION":
      return constraint.governanceReference;
    case "DEPENDENCY_LIMITATION_PROPAGATION":
      return input.dependencyFoundation.result.dependencyGraphHash;
    case "RESOURCE_LIMITATION_PROPAGATION":
      return input.impactFoundation.result.impactGraphHash;
    case "TRUST_LIMITATION_PROPAGATION":
      return input.trustFoundation.result.trustGraphHash;
    case "RESILIENCE_LIMITATION_PROPAGATION":
      return input.resilienceFoundation.result.resilienceGraphHash;
    case "RISK_PROPAGATION":
      return input.dependencyRiskFoundation.result.dependencyRiskGraphHash;
    default:
      return `${constraint.lineageReference}->${constraint.replayReference}`;
  }
}

function propagationAnalysis(input: ConstraintAnalysisInput): ConstraintPropagation[] {
  const records: ConstraintPropagation[] = [];
  for (const constraint of orderedConstraints(input)) {
    for (const propagationType of propagationDescriptors(constraint.constraintType)) {
      const propagationReference = resolvePropagationReference(input, constraint, propagationType);
      records.push(Object.freeze({
        propagationId: hashAnalysisValue("constraint-propagation-id", {
          constraintId: constraint.constraintId,
          propagationType,
          propagationReference,
        }),
        constraintId: constraint.constraintId,
        recommendationId: constraint.recommendationId,
        constraintType: constraint.constraintType,
        propagationType,
        propagationReference,
        propagationHash: hashAnalysisValue("constraint-propagation", {
          constraintId: constraint.constraintId,
          recommendationId: constraint.recommendationId,
          constraintType: constraint.constraintType,
          propagationType,
          propagationReference,
        }),
      }));
    }
  }
  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.constraintType.localeCompare(right.constraintType)
    || left.propagationType.localeCompare(right.propagationType)
    || left.propagationReference.localeCompare(right.propagationReference)
  ));
}

function createGapRecord(
  constraintId: string,
  recommendationIdValue: string,
  constraintType: RecommendationConstraintType | "FOUNDATION",
  gapType: ConstraintGapType,
): ConstraintGap {
  return Object.freeze({
    gapId: hashAnalysisValue("constraint-gap-id", {
      constraintId,
      recommendationId: recommendationIdValue,
      constraintType,
      gapType,
    }),
    constraintId,
    recommendationId: recommendationIdValue,
    constraintType,
    gapType,
    gapHash: hashAnalysisValue("constraint-gap", {
      constraintId,
      recommendationId: recommendationIdValue,
      constraintType,
      gapType,
    }),
  });
}

function gapsAnalysis(input: ConstraintAnalysisInput): ConstraintGap[] {
  const records: ConstraintGap[] = [];

  if (input.foundation.evidencePath.constraintReferences.length === 0) {
    records.push(createGapRecord("foundation", "foundation", "FOUNDATION", "MISSING_CONSTRAINT_EVIDENCE"));
  }
  if (input.foundation.evidencePath.governanceReferences.length === 0) {
    records.push(createGapRecord("foundation", "foundation", "FOUNDATION", "MISSING_GOVERNANCE_REFERENCES"));
  }
  if (input.foundation.evidencePath.lineageReferences.length === 0) {
    records.push(createGapRecord("foundation", "foundation", "FOUNDATION", "MISSING_LINEAGE_REFERENCES"));
  }
  if (input.foundation.evidencePath.replayReferences.length === 0) {
    records.push(createGapRecord("foundation", "foundation", "FOUNDATION", "MISSING_REPLAY_REFERENCES"));
  }
  if (input.foundation.evidencePath.readinessReferences.length === 0) {
    records.push(createGapRecord("foundation", "foundation", "FOUNDATION", "MISSING_READINESS_EVIDENCE"));
  }
  if (!trustSupported(input)) {
    records.push(createGapRecord("foundation", "foundation", "FOUNDATION", "MISSING_TRUST_EVIDENCE"));
  }
  if (!resilienceSupported(input)) {
    records.push(createGapRecord("foundation", "foundation", "FOUNDATION", "MISSING_RESILIENCE_EVIDENCE"));
  }

  for (const constraint of orderedConstraints(input)) {
    if (constraint.evidenceReference.length === 0) {
      records.push(createGapRecord(constraint.constraintId, constraint.recommendationId, constraint.constraintType, "MISSING_CONSTRAINT_EVIDENCE"));
    }
    if (constraint.governanceReference.length === 0) {
      records.push(createGapRecord(constraint.constraintId, constraint.recommendationId, constraint.constraintType, "MISSING_GOVERNANCE_REFERENCES"));
    }
    if (constraint.lineageReference.length === 0) {
      records.push(createGapRecord(constraint.constraintId, constraint.recommendationId, constraint.constraintType, "MISSING_LINEAGE_REFERENCES"));
    }
    if (constraint.replayReference.length === 0) {
      records.push(createGapRecord(constraint.constraintId, constraint.recommendationId, constraint.constraintType, "MISSING_REPLAY_REFERENCES"));
    }
  }

  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.constraintType.localeCompare(right.constraintType)
    || left.gapType.localeCompare(right.gapType)
    || left.constraintId.localeCompare(right.constraintId)
  ));
}

function conflictTypesFor(
  input: ConstraintAnalysisInput,
  constraint: RecommendationConstraint,
  bundle: RecommendationPortfolioBundle,
): ConstraintConflictType[] {
  const conflicts: ConstraintConflictType[] = [];

  if (constraint.constraintType === "GOVERNANCE_CONSTRAINT" && !governanceIntegrity(bundle)) {
    conflicts.push("GOVERNANCE_CONFLICT");
  }
  if (
    constraint.constraintType === "DEPENDENCY_CONSTRAINT"
    && (
      input.dependencyFoundation.result.dependencyState === "LIMITED"
      || input.dependencyRiskFoundation.result.dependencyRiskState === "HIGH"
      || input.dependencyRiskFoundation.result.dependencyRiskState === "CRITICAL"
    )
  ) {
    conflicts.push("DEPENDENCY_CONFLICT");
  }
  if (
    constraint.constraintType === "RESOURCE_CONSTRAINT"
    && (
      input.impactFoundation.result.impactState === "LIMITED"
      || input.portfolio.result.portfolioState === "LIMITED"
    )
  ) {
    conflicts.push("RESOURCE_CONFLICT");
  }
  if (
    constraint.constraintType === "TRUST_CONSTRAINT"
    && (
      input.trustFoundation.result.trustState === "DEGRADED"
      || input.trustFoundation.result.trustState === "UNTRUSTED"
    )
  ) {
    conflicts.push("TRUST_CONFLICT");
  }
  if (
    constraint.constraintType === "RESILIENCE_CONSTRAINT"
    && (
      input.resilienceFoundation.result.resilienceState === "DEGRADED"
      || input.resilienceFoundation.result.resilienceState === "FRAGILE"
    )
  ) {
    conflicts.push("RESILIENCE_CONFLICT");
  }
  if (
    constraint.constraintType === "PORTFOLIO_CONSTRAINT"
    && (
      input.portfolio.result.portfolioState === "LIMITED"
      || input.relationshipAnalysis.result.relationshipState === "LIMITED"
    )
  ) {
    conflicts.push("PORTFOLIO_CONFLICT");
  }
  if (
    constraint.constraintType === "RISK_CONSTRAINT"
    && (
      input.dependencyRiskFoundation.result.dependencyRiskState === "HIGH"
      || input.dependencyRiskFoundation.result.dependencyRiskState === "CRITICAL"
    )
  ) {
    conflicts.push("RISK_CONFLICT");
  }
  if (input.authorityExpansionDetected === true || !bundle.authorityScope.readOnly || bundle.authorityScope.controlSurfacePresent) {
    conflicts.push("AUTHORITY_BOUNDARY_CONFLICT");
  }

  return conflicts;
}

function conflictsAnalysis(input: ConstraintAnalysisInput): ConstraintConflict[] {
  const records: ConstraintConflict[] = [];
  const bundles = bundleMap(input);

  for (const constraint of orderedConstraints(input)) {
    const bundle = bundles.get(constraint.recommendationId);
    if (!bundle) continue;
    for (const conflictType of conflictTypesFor(input, constraint, bundle)) {
      records.push(Object.freeze({
        conflictId: hashAnalysisValue("constraint-conflict-id", {
          constraintId: constraint.constraintId,
          conflictType,
        }),
        constraintId: constraint.constraintId,
        recommendationId: constraint.recommendationId,
        constraintType: constraint.constraintType,
        conflictType,
        conflictHash: hashAnalysisValue("constraint-conflict", {
          constraintId: constraint.constraintId,
          recommendationId: constraint.recommendationId,
          constraintType: constraint.constraintType,
          conflictType,
        }),
      }));
    }
  }

  return records.sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.constraintType.localeCompare(right.constraintType)
    || left.conflictType.localeCompare(right.conflictType)
    || left.constraintId.localeCompare(right.constraintId)
  ));
}

function validateRecommendationIds(request: ConstraintAnalysisRequest, reasons: ConstraintAnalysisReasonCode[]): boolean {
  const valid = request.recommendationIds.length > 0;
  addReason(reasons, valid ? "RECOMMENDATION_IDS_PRESENT" : "RECOMMENDATION_IDS_MISSING");
  return valid;
}

function validateScope(scope: ConstraintAnalysisScope, reasons: ConstraintAnalysisReasonCode[]): boolean {
  const valid = ANALYSIS_SCOPES.includes(scope);
  addReason(reasons, valid ? "ANALYSIS_SCOPE_VALID" : "ANALYSIS_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: ConstraintAnalysisInput, reasons: ConstraintAnalysisReasonCode[]): boolean {
  const valid = input.foundation !== undefined;
  addReason(reasons, valid ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: ConstraintAnalysisInput, reasons: ConstraintAnalysisReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
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
    ].every((record) => record.sealed === true));
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: ConstraintAnalysisInput, reasons: ConstraintAnalysisReasonCode[]): boolean {
  const valid = input.foundation.result.tenantIsolationVerified
    && input.opportunityFoundation.result.tenantIsolationVerified
    && input.dependencyRiskFoundation.result.tenantIsolationVerified
    && input.dependencyFoundation.result.tenantIsolationVerified
    && input.impactFoundation.result.tenantIsolationVerified
    && input.trustFoundation.result.tenantIsolationVerified
    && input.driftFoundation.result.tenantIsolationVerified
    && input.resilienceFoundation.result.tenantIsolationVerified
    && input.portfolio.result.tenantIsolationVerified
    && input.relationshipAnalysis.result.tenantIsolationVerified
    && orderedBundles(input).every((bundle) => bundle.ownershipEvidence.tenantId === input.request.tenantId);
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_CONSTRAINT_BLOCKED");
  return valid;
}

function validateOwnership(input: ConstraintAnalysisInput, reasons: ConstraintAnalysisReasonCode[]): boolean {
  const requestedIds = new Set(normalizeStrings(input.request.recommendationIds));
  const valid = orderedBundles(input).every((bundle) => (
    bundle.ownershipEvidence.tenantId === input.request.tenantId
    && requestedIds.has(bundle.ownershipEvidence.recommendationId)
    && bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
  ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateConstraintEvidence(input: ConstraintAnalysisInput, reasons: ConstraintAnalysisReasonCode[]): boolean {
  const evidencePresent = input.foundation.constraints.length > 0
    && input.foundation.evidencePath.constraintReferences.length > 0
    && membershipComplete(input);
  addReason(reasons, evidencePresent ? "CONSTRAINT_EVIDENCE_PRESENT" : "CONSTRAINT_EVIDENCE_MISSING");
  addReason(reasons, input.foundation.evidencePath.governanceReferences.length > 0 ? "GOVERNANCE_REFERENCES_PRESENT" : "GOVERNANCE_REFERENCES_MISSING");
  addReason(reasons, input.foundation.evidencePath.lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, input.foundation.evidencePath.replayReferences.length > 0 ? "REPLAY_REFERENCES_PRESENT" : "REPLAY_REFERENCES_MISSING");
  addReason(reasons, input.foundation.evidencePath.readinessReferences.length > 0 ? "READINESS_REFERENCES_PRESENT" : "READINESS_REFERENCES_MISSING");
  return evidencePresent;
}

function validateSeverities(severities: readonly ConstraintSeverityRecord[], reasons: ConstraintAnalysisReasonCode[]): boolean {
  const valid = severities.length > 0;
  addReason(reasons, valid ? "SEVERITIES_ANALYZED" : "SEVERITIES_LIMITED");
  return valid;
}

function validateConcentrations(concentrations: readonly ConstraintConcentration[], reasons: ConstraintAnalysisReasonCode[]): boolean {
  const valid = concentrations.length > 0;
  addReason(reasons, valid ? "CONCENTRATIONS_ANALYZED" : "CONCENTRATIONS_LIMITED");
  return valid;
}

function validatePropagations(propagations: readonly ConstraintPropagation[], reasons: ConstraintAnalysisReasonCode[]): boolean {
  const valid = propagations.length > 0;
  addReason(reasons, valid ? "PROPAGATIONS_ANALYZED" : "PROPAGATIONS_LIMITED");
  return valid;
}

function validateGaps(gaps: readonly ConstraintGap[], reasons: ConstraintAnalysisReasonCode[]): boolean {
  addReason(reasons, gaps.length > 0 ? "CONSTRAINT_GAPS_DETECTED" : "CONSTRAINT_GAPS_ABSENT");
  return gaps.length === 0;
}

function validateConflicts(conflicts: readonly ConstraintConflict[], reasons: ConstraintAnalysisReasonCode[]): boolean {
  addReason(reasons, conflicts.length > 0 ? "CONSTRAINT_CONFLICTS_DETECTED" : "CONSTRAINT_CONFLICTS_ABSENT");
  return conflicts.length === 0;
}

function validateGovernance(input: ConstraintAnalysisInput, reasons: ConstraintAnalysisReasonCode[]): boolean {
  const valid = input.opportunityCertification.result.governanceCertified === true
    && input.dependencyRiskCertification.result.governanceCertified === true
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

function validateReplay(input: ConstraintAnalysisInput, reasons: ConstraintAnalysisReasonCode[]): boolean {
  const valid = input.opportunityReplay.result.replayState !== "INVALID"
    && input.opportunityReplay.result.replayState !== "ESCALATED"
    && input.dependencyRiskReplay.result.replayState !== "INVALID"
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

function validateBoundary(input: ConstraintAnalysisInput, reasons: ConstraintAnalysisReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const approvalImpossible = input.approvalRequested !== true;
  const prioritizationAbsent = input.prioritizationRequested !== true;
  const rankingAbsent = input.recommendationRankingRequested !== true;
  const scoringAbsent = input.recommendationScoringRequested !== true;
  const resourceAllocationAbsent = input.resourceAllocationRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
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
  addReason(reasons, prioritizationAbsent ? "PRIORITIZATION_ABSENT" : "PRIORITIZATION_DETECTED");
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
    prioritizationAbsent,
    rankingAbsent,
    scoringAbsent,
    resourceAllocationAbsent,
    authorityBounded,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || !prioritizationAbsent
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

export function createConstraintAnalysisEvidencePath(
  input: ConstraintAnalysisInput,
  severities: readonly ConstraintSeverityRecord[],
  concentrations: readonly ConstraintConcentration[],
  propagations: readonly ConstraintPropagation[],
  gaps: readonly ConstraintGap[],
  conflicts: readonly ConstraintConflict[],
): ConstraintAnalysisEvidencePath {
  return Object.freeze({
    scope: input.request.analysisScope,
    constraintReferences: normalizeStrings(input.foundation.constraints.map((constraint) => constraint.constraintId)),
    severityReferences: normalizeStrings(severities.map((severity) => `${severity.constraintId}:${severity.severity}`)),
    concentrationReferences: normalizeStrings(concentrations.map((concentration) => `${concentration.recommendationId}:${concentration.constraintType}:${concentration.concentrationType}`)),
    propagationReferences: normalizeStrings(propagations.map((propagation) => `${propagation.constraintId}:${propagation.propagationType}:${propagation.propagationReference}`)),
    gapReferences: normalizeStrings(gaps.map((gap) => `${gap.constraintId}:${gap.constraintType}:${gap.gapType}`)),
    conflictReferences: normalizeStrings(conflicts.map((conflict) => `${conflict.constraintId}:${conflict.constraintType}:${conflict.conflictType}`)),
    governanceReferences: normalizeStrings(input.foundation.evidencePath.governanceReferences),
    lineageReferences: normalizeStrings(input.foundation.evidencePath.lineageReferences),
    replayReferences: normalizeStrings(input.foundation.evidencePath.replayReferences),
    readinessReferences: normalizeStrings(input.foundation.evidencePath.readinessReferences),
    evidenceHashes: normalizeStrings([
      input.foundation.result.constraintGraphHash,
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
  constraintCount: number,
  conflictCount: number,
  propagationCount: number,
  reasons: ConstraintAnalysisReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_RECOMMENDATIONS
    && constraintCount <= MAX_CONSTRAINT_RECORDS
    && conflictCount <= MAX_CONSTRAINT_CONFLICTS
    && propagationCount <= MAX_PROPAGATION_PATHS;
  addReason(reasons, recommendationCount <= MAX_RECOMMENDATIONS ? "RECOMMENDATION_LIMIT_VALID" : "RECOMMENDATION_LIMIT_EXCEEDED");
  addReason(reasons, constraintCount <= MAX_CONSTRAINT_RECORDS ? "CONSTRAINT_RECORD_LIMIT_VALID" : "CONSTRAINT_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, conflictCount <= MAX_CONSTRAINT_CONFLICTS ? "CONSTRAINT_CONFLICT_LIMIT_VALID" : "CONSTRAINT_CONFLICT_LIMIT_EXCEEDED");
  addReason(reasons, propagationCount <= MAX_PROPAGATION_PATHS ? "PROPAGATION_LIMIT_VALID" : "PROPAGATION_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: ConstraintAnalysisRequest,
  analysisState: ConstraintAnalysisState,
  severities: readonly ConstraintSeverityRecord[],
  concentrations: readonly ConstraintConcentration[],
  propagations: readonly ConstraintPropagation[],
  gaps: readonly ConstraintGap[],
  conflicts: readonly ConstraintConflict[],
  tenantIsolationVerified: boolean,
  analysisHash: string,
): ConstraintAnalysisResult {
  return Object.freeze({
    tenantId: request.tenantId,
    analysisState,
    constraintSeveritiesDetected: severities.length,
    constraintConcentrationsDetected: concentrations.length,
    constraintPropagationsDetected: propagations.length,
    constraintGapsDetected: gaps.length,
    constraintConflictsDetected: conflicts.length,
    tenantIsolationVerified,
    analysisHash,
    deterministic: true,
  });
}

function buildObservability(result: ConstraintAnalysisResult): ConstraintAnalysisObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    analysisState: result.analysisState,
    constraintSeveritiesDetected: result.constraintSeveritiesDetected,
    constraintConcentrationsDetected: result.constraintConcentrationsDetected,
    constraintPropagationsDetected: result.constraintPropagationsDetected,
    constraintGapsDetected: result.constraintGapsDetected,
    constraintConflictsDetected: result.constraintConflictsDetected,
    analysisHash: result.analysisHash,
  });
}

function buildValidation(
  analysisState: ConstraintAnalysisState,
  reasonCodes: readonly ConstraintAnalysisReasonCode[],
  severities: readonly ConstraintSeverityRecord[],
  concentrations: readonly ConstraintConcentration[],
  propagations: readonly ConstraintPropagation[],
  gaps: readonly ConstraintGap[],
  conflicts: readonly ConstraintConflict[],
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
): ConstraintAnalysisValidation {
  return Object.freeze({
    valid: analysisState !== "INVALID",
    analysisState,
    reasonCodes: [...reasonCodes],
    constraintSeveritiesDetected: severities.length,
    constraintConcentrationsDetected: concentrations.length,
    constraintPropagationsDetected: propagations.length,
    constraintGapsDetected: gaps.length,
    constraintConflictsDetected: conflicts.length,
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    approvalImpossible: boundary.approvalImpossible,
    prioritizationAbsent: boundary.prioritizationAbsent,
    rankingAbsent: boundary.rankingAbsent,
    scoringAbsent: boundary.scoringAbsent,
    resourceAllocationAbsent: boundary.resourceAllocationAbsent,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
  });
}

export function buildConstraintAnalysisRequest(request: ConstraintAnalysisRequest): ConstraintAnalysisRequest {
  return requestCore(request);
}

export function sealConstraintAnalysis(input: ConstraintAnalysisInput): SealedConstraintAnalysisRecord {
  const reasons: ConstraintAnalysisReasonCode[] = [];
  const severities = includesScope(input.request.analysisScope, "SEVERITY") ? severityAnalysis(input) : [];
  const concentrations = includesScope(input.request.analysisScope, "CONCENTRATION") ? concentrationAnalysis(input) : [];
  const propagations = includesScope(input.request.analysisScope, "PROPAGATION") ? propagationAnalysis(input) : [];
  const gaps = includesScope(input.request.analysisScope, "GAPS") ? gapsAnalysis(input) : [];
  const conflicts = includesScope(input.request.analysisScope, "CONFLICTS") ? conflictsAnalysis(input) : [];

  const requestValid = validateRecommendationIds(input.request, reasons) && validateScope(input.request.analysisScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const evidencePresent = validateConstraintEvidence(input, reasons);
  const severitiesValid = includesScope(input.request.analysisScope, "SEVERITY") ? validateSeverities(severities, reasons) : true;
  const concentrationsValid = includesScope(input.request.analysisScope, "CONCENTRATION") ? validateConcentrations(concentrations, reasons) : true;
  const propagationsValid = includesScope(input.request.analysisScope, "PROPAGATION") ? validatePropagations(propagations, reasons) : true;
  const gapsClear = includesScope(input.request.analysisScope, "GAPS") ? validateGaps(gaps, reasons) : true;
  const conflictsClear = includesScope(input.request.analysisScope, "CONFLICTS") ? validateConflicts(conflicts, reasons) : true;
  const governanceValid = validateGovernance(input, reasons);
  const replayValid = validateReplay(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createConstraintAnalysisEvidencePath(input, severities, concentrations, propagations, gaps, conflicts);
  const limitsValid = validateLimits(
    normalizeStrings(input.request.recommendationIds).length,
    input.foundation.constraints.length,
    conflicts.length,
    propagations.length,
    reasons,
  );
  addReason(reasons, "CONSTRAINT_ANALYSIS_IS_NOT_CONTROL");

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
    || input.foundation.result.constraintState === "UNKNOWN"
  );
  const limited = !invalid && !observe && (
    !severitiesValid
    || !concentrationsValid
    || !propagationsValid
    || !gapsClear
    || !conflictsClear
    || !limitsValid
    || input.foundation.result.constraintState === "LIMITED"
    || input.foundation.result.constraintState === "CONDITIONAL"
  );
  const analysisState: ConstraintAnalysisState = invalid ? "INVALID" : observe ? "OBSERVE" : limited ? "LIMITED" : "ANALYZED";

  const analysisHash = hashAnalysisValue("constraint-analysis-engine", {
    request: requestCore(input.request),
    analysisState,
    constraintReferences: evidencePath.constraintReferences,
    severityReferences: evidencePath.severityReferences,
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
    recommendationScoringAllowed: false,
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
