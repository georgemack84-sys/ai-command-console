import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  RecommendationDrift,
  RecommendationDriftEvidencePath,
  RecommendationDriftFoundationInput,
  RecommendationDriftFoundationObservability,
  RecommendationDriftFoundationReasonCode,
  RecommendationDriftFoundationRequest,
  RecommendationDriftFoundationResult,
  RecommendationDriftFoundationValidation,
  RecommendationDriftScope,
  RecommendationDriftType,
  SealedRecommendationDriftFoundationRecord,
} from "./types";

const MAX_RECOMMENDATIONS = 10_000;
const MAX_DRIFTS = 50_000;
const MAX_BASELINE_REFERENCES = 10_000;
const MAX_CURRENT_REFERENCES = 10_000;

const DRIFT_SCOPES: readonly RecommendationDriftScope[] = Object.freeze([
  "EVIDENCE",
  "LINEAGE",
  "GOVERNANCE",
  "REPLAY",
  "READINESS",
  "PORTFOLIO",
  "DEPENDENCY",
  "IMPACT",
  "FULL",
]);

type DriftDescriptor = Readonly<{
  recommendationId: string;
  driftType: RecommendationDriftType;
  baselineReference: string;
  currentReference: string;
}>;

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

function addReason(reasons: RecommendationDriftFoundationReasonCode[], reason: RecommendationDriftFoundationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashDriftValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: RecommendationDriftFoundationRequest): RecommendationDriftFoundationRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    recommendationIds: [...request.recommendationIds],
    driftScope: request.driftScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(bundles: readonly RecommendationPortfolioBundle[]): RecommendationPortfolioBundle[] {
  return [...bundles].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function createBoundaryFlags(record: Record<string, unknown>): boolean {
  const blockedFlags = [
    "executionAuthorized",
    "workflowRoutingAllowed",
    "prioritizationAllowed",
    "approvalAllowed",
    "approvalOrderingAllowed",
    "recommendationApprovalAllowed",
    "repairAllowed",
    "authorityMutationAllowed",
    "controlSurfacePresent",
  ] as const;
  return blockedFlags.every((key) => record[key] !== true);
}

function includesScope(scope: RecommendationDriftScope, driftType: RecommendationDriftType): boolean {
  if (scope === "FULL") return true;
  return (
    (scope === "EVIDENCE" && driftType === "EVIDENCE_DRIFT")
    || (scope === "LINEAGE" && driftType === "LINEAGE_DRIFT")
    || (scope === "GOVERNANCE" && driftType === "GOVERNANCE_DRIFT")
    || (scope === "REPLAY" && driftType === "REPLAY_DRIFT")
    || (scope === "READINESS" && driftType === "READINESS_DRIFT")
    || (scope === "PORTFOLIO" && driftType === "PORTFOLIO_DRIFT")
    || (scope === "DEPENDENCY" && driftType === "DEPENDENCY_DRIFT")
    || (scope === "IMPACT" && driftType === "IMPACT_DRIFT")
  );
}

function bundleMap(bundles: readonly RecommendationPortfolioBundle[]): Map<string, RecommendationPortfolioBundle> {
  return new Map(orderedBundles(bundles).map((bundle) => [recommendationId(bundle), bundle]));
}

function collectEvidenceReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.ledger.entry.evidenceIds,
    ...bundle.ledger.evidencePath.evidenceIds,
    ...bundle.lineage.evidencePath.evidenceIds,
    ...bundle.verification.evidencePath.evidenceIds,
    ...bundle.replay.evidencePath.evidenceIds,
    ...bundle.integrity.evidencePath.evidenceIds,
    ...bundle.certification.evidencePath.evidenceIds,
    ...bundle.observability.evidencePath.evidenceIds,
    ...bundle.audit.evidencePath.evidenceIds,
    ...bundle.readiness.evidencePath.evidenceReferences,
    ...bundle.alignment.evidencePath.evidenceReferences,
    ...bundle.reviewPacket.evidencePath.evidenceReferences,
  ]);
}

function collectLineageReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.ledger.entry.lineageReferences,
    ...bundle.lineage.ancestryChain.map((node) => node.lineageReference),
    ...bundle.lineage.evidencePath.lineageReferences,
    ...bundle.verification.evidencePath.lineageReferences,
    ...bundle.audit.evidencePath.lineageReferences,
    ...bundle.replayFramework.evidencePath.lineageReferences,
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
    ...bundle.readiness.evidencePath.governanceReferences,
    ...bundle.alignment.evidencePath.governanceReferences,
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
    ...bundle.readiness.evidencePath.governanceReferences,
    ...bundle.alignment.evidencePath.alignmentReferences,
    ...bundle.reviewPacket.evidencePath.evidenceReferences,
    ...bundle.replayFramework.evidencePath.replayReferences,
    ...bundle.readinessCertification.evidencePath.evidenceReferences,
  ]);
}

function collectBundleEvidenceHashes(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    bundle.ledger.result.ledgerHash,
    bundle.lineage.result.reconstructionHash,
    bundle.verification.result.verificationHash,
    bundle.replay.result.replayHash,
    bundle.replay.result.reconstructionHash,
    bundle.integrity.result.integrityHash,
    bundle.certification.result.certificationHash,
    bundle.observability.result.observabilityHash,
    bundle.audit.result.exportHash,
    bundle.binding.result.governanceHash,
    bundle.authorityScope.result.authorityHash,
    bundle.policyVisibility.result.policyHash,
    bundle.governanceReplay.result.replayHash,
    bundle.governanceReplay.result.reconstructionHash,
    bundle.governanceCertification.result.certificationHash,
    bundle.readiness.result.readinessHash,
    bundle.alignment.result.alignmentHash,
    bundle.reviewPacket.result.packetHash,
    bundle.replayFramework.result.replayHash,
    bundle.replayFramework.result.reconstructionHash,
    bundle.readinessCertification.result.certificationHash,
  ]);
}

function hashReference(domain: string, value: unknown): string {
  return hashDriftValue(domain, value);
}

function evidenceReference(bundle: RecommendationPortfolioBundle): string {
  return hashReference("recommendation-drift-evidence-reference", collectEvidenceReferences(bundle));
}

function lineageReference(bundle: RecommendationPortfolioBundle): string {
  return hashReference("recommendation-drift-lineage-reference", collectLineageReferences(bundle));
}

function governanceReference(bundle: RecommendationPortfolioBundle): string {
  return hashReference("recommendation-drift-governance-reference", {
    references: collectGovernanceReferences(bundle),
    bindingHash: bundle.binding.result.governanceHash,
    authorityHash: bundle.authorityScope.result.authorityHash,
    policyHash: bundle.policyVisibility.result.policyHash,
    certificationHash: bundle.governanceCertification.result.certificationHash,
  });
}

function replayReference(bundle: RecommendationPortfolioBundle): string {
  return hashReference("recommendation-drift-replay-reference", {
    references: collectReplayReferences(bundle),
    replayHash: bundle.replay.result.replayHash,
    replayReconstructionHash: bundle.replay.result.reconstructionHash,
    governanceReplayHash: bundle.governanceReplay.result.replayHash,
    governanceReconstructionHash: bundle.governanceReplay.result.reconstructionHash,
    readinessReplayHash: bundle.replayFramework.result.replayHash,
  });
}

function readinessReference(bundle: RecommendationPortfolioBundle): string {
  return hashReference("recommendation-drift-readiness-reference", {
    references: collectReadinessReferences(bundle),
    readinessHash: bundle.readiness.result.readinessHash,
    alignmentHash: bundle.alignment.result.alignmentHash,
    packetHash: bundle.reviewPacket.result.packetHash,
    replayHash: bundle.replayFramework.result.replayHash,
    certificationHash: bundle.readinessCertification.result.certificationHash,
  });
}

function portfolioReference(input: RecommendationDriftFoundationInput, current: boolean): string {
  const portfolio = current ? input.currentPortfolio : input.baselinePortfolio;
  const analysis = current ? input.currentRelationshipAnalysis : input.baselineRelationshipAnalysis;
  const replay = current ? input.currentPortfolioReplay : input.baselinePortfolioReplay;
  const certification = current ? input.currentPortfolioCertification : input.baselinePortfolioCertification;
  return hashReference("recommendation-drift-portfolio-reference", {
    portfolioHash: portfolio.result.portfolioHash,
    analysisHash: analysis.result.analysisHash,
    replayHash: replay.result.replayHash,
    reconstructionHash: replay.result.reconstructionHash,
    certificationHash: certification.result.certificationHash,
    portfolioReferences: certification.evidencePath.portfolioReferences,
    relationshipReferences: certification.evidencePath.relationshipReferences,
  });
}

function dependencyReference(input: RecommendationDriftFoundationInput, current: boolean): string {
  const foundation = current ? input.currentDependencyFoundation : input.baselineDependencyFoundation;
  const analysis = current ? input.currentDependencyAnalysis : input.baselineDependencyAnalysis;
  const replay = current ? input.currentDependencyReplay : input.baselineDependencyReplay;
  const certification = current ? input.currentDependencyCertification : input.baselineDependencyCertification;
  return hashReference("recommendation-drift-dependency-reference", {
    graphHash: foundation.result.dependencyGraphHash,
    analysisHash: analysis.result.analysisHash,
    replayHash: replay.result.replayHash,
    reconstructionHash: replay.result.reconstructionHash,
    certificationHash: certification.result.certificationHash,
    dependencyReferences: foundation.evidencePath.dependencyReferences,
    chainReferences: analysis.evidencePath.chainReferences,
    conflictReferences: analysis.evidencePath.conflictReferences,
  });
}

function impactReference(input: RecommendationDriftFoundationInput, current: boolean): string {
  const foundation = current ? input.currentImpactFoundation : input.baselineImpactFoundation;
  const analysis = current ? input.currentImpactAnalysis : input.baselineImpactAnalysis;
  const observability = current ? input.currentImpactObservability : input.baselineImpactObservability;
  const replay = current ? input.currentImpactReplay : input.baselineImpactReplay;
  const certification = current ? input.currentImpactCertification : input.baselineImpactCertification;
  return hashReference("recommendation-drift-impact-reference", {
    graphHash: foundation.result.impactGraphHash,
    analysisHash: analysis.result.analysisHash,
    observabilityHash: observability.result.observabilityHash,
    replayHash: replay.result.replayHash,
    reconstructionHash: replay.result.reconstructionHash,
    certificationHash: certification.result.certificationHash,
    impactReferences: foundation.evidencePath.impactReferences,
    propagationReferences: analysis.evidencePath.propagationReferences,
    conflictReferences: analysis.evidencePath.conflictReferences,
  });
}

function descriptorToDrift(descriptor: DriftDescriptor): RecommendationDrift {
  const driftHash = hashDriftValue("recommendation-drift-record", descriptor);
  return Object.freeze({
    driftId: hashDriftValue("recommendation-drift-id", {
      recommendationId: descriptor.recommendationId,
      driftType: descriptor.driftType,
    }),
    recommendationId: descriptor.recommendationId,
    driftType: descriptor.driftType,
    baselineReference: descriptor.baselineReference,
    currentReference: descriptor.currentReference,
    driftDetected: true,
    driftHash,
  });
}

function validateScope(scope: RecommendationDriftScope, reasons: RecommendationDriftFoundationReasonCode[]): boolean {
  const valid = DRIFT_SCOPES.includes(scope);
  addReason(reasons, valid ? "DRIFT_SCOPE_VALID" : "DRIFT_SCOPE_INVALID");
  return valid;
}

function validateRecommendationIds(request: RecommendationDriftFoundationRequest, reasons: RecommendationDriftFoundationReasonCode[]): boolean {
  const valid = request.recommendationIds.length > 0;
  addReason(reasons, valid ? "RECOMMENDATION_IDS_PRESENT" : "RECOMMENDATION_IDS_MISSING");
  return valid;
}

function validateSealedArtifacts(input: RecommendationDriftFoundationInput, reasons: RecommendationDriftFoundationReasonCode[]): boolean {
  const records = [
    input.baselineImpactFoundation,
    input.currentImpactFoundation,
    input.baselineImpactAnalysis,
    input.currentImpactAnalysis,
    input.baselineImpactObservability,
    input.currentImpactObservability,
    input.baselineImpactReplay,
    input.currentImpactReplay,
    input.baselineImpactCertification,
    input.currentImpactCertification,
    input.baselineDependencyFoundation,
    input.currentDependencyFoundation,
    input.baselineDependencyAnalysis,
    input.currentDependencyAnalysis,
    input.baselineDependencyReplay,
    input.currentDependencyReplay,
    input.baselineDependencyCertification,
    input.currentDependencyCertification,
    input.baselinePortfolio,
    input.currentPortfolio,
    input.baselineRelationshipAnalysis,
    input.currentRelationshipAnalysis,
    input.baselinePortfolioReplay,
    input.currentPortfolioReplay,
    input.baselinePortfolioCertification,
    input.currentPortfolioCertification,
  ] satisfies readonly Record<string, unknown>[];
  const bundles = [...input.baselineRecommendations, ...input.currentRecommendations];
  const sealed = records.every((record) => record.sealed === true)
    && bundles.every((bundle) => [
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
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  addReason(reasons, sealed ? "BASELINE_REQUIRED" : "BASELINE_UNSEALED");
  addReason(reasons, sealed ? "CURRENT_REQUIRED" : "CURRENT_UNSEALED");
  return sealed;
}

function validateTenantScope(input: RecommendationDriftFoundationInput, reasons: RecommendationDriftFoundationReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const bundles = [...input.baselineRecommendations, ...input.currentRecommendations];
  const valid = [
    input.baselineImpactFoundation,
    input.currentImpactFoundation,
    input.baselineImpactAnalysis,
    input.currentImpactAnalysis,
    input.baselineImpactObservability,
    input.currentImpactObservability,
    input.baselineImpactReplay,
    input.currentImpactReplay,
    input.baselineImpactCertification,
    input.currentImpactCertification,
    input.baselineDependencyFoundation,
    input.currentDependencyFoundation,
    input.baselineDependencyAnalysis,
    input.currentDependencyAnalysis,
    input.baselineDependencyReplay,
    input.currentDependencyReplay,
    input.baselineDependencyCertification,
    input.currentDependencyCertification,
    input.baselinePortfolio,
    input.currentPortfolio,
    input.baselineRelationshipAnalysis,
    input.currentRelationshipAnalysis,
    input.baselinePortfolioReplay,
    input.currentPortfolioReplay,
    input.baselinePortfolioCertification,
    input.currentPortfolioCertification,
  ].every((record) => record.result.tenantIsolationVerified)
    && bundles.every((bundle) => (
      bundle.ledger.entry.tenantId === tenantId
      && bundle.governanceReferences.tenantId === tenantId
      && bundle.ownershipEvidence.tenantId === tenantId
      && bundle.replayEvidence.tenantId === tenantId
      && bundle.readiness.result.tenantIsolationVerified
      && bundle.alignment.result.tenantIsolationVerified
      && bundle.reviewPacket.result.tenantIsolationVerified
      && bundle.replayFramework.result.tenantIsolationVerified
      && bundle.readinessCertification.result.tenantIsolationVerified
      && bundle.governanceCertification.result.tenantIsolationVerified
      && bundle.audit.result.tenantIsolationVerified
    ));
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_DRIFT_BLOCKED");
  return valid;
}

function validateOwnership(input: RecommendationDriftFoundationInput, reasons: RecommendationDriftFoundationReasonCode[]): boolean {
  const requestedIds = normalizeStrings(input.request.recommendationIds);
  const baselineIds = normalizeStrings(orderedBundles(input.baselineRecommendations).map(recommendationId));
  const currentIds = normalizeStrings(orderedBundles(input.currentRecommendations).map(recommendationId));
  const baselineMap = bundleMap(input.baselineRecommendations);
  const currentMap = bundleMap(input.currentRecommendations);
  const valid = requestedIds.every((id) => {
    const baseline = baselineMap.get(id);
    const current = currentMap.get(id);
    if (!baseline || !current) return true;
    return baseline
      && baseline.ownershipEvidence.recommendationId === id
      && current.ownershipEvidence.recommendationId === id
      && baseline.ownershipEvidence.ownershipReferences.length > 0
      && current.ownershipEvidence.ownershipReferences.length > 0
      && baseline.ownershipEvidence.ownershipHash === current.ownershipEvidence.ownershipHash;
  });
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateGovernanceContinuity(input: RecommendationDriftFoundationInput, reasons: RecommendationDriftFoundationReasonCode[]): boolean {
  const bundles = [...input.baselineRecommendations, ...input.currentRecommendations];
  const valid = input.baselineImpactCertification.result.governanceCertified
    && input.currentImpactCertification.result.governanceCertified
    && input.baselineDependencyCertification.result.governanceCertified
    && input.currentDependencyCertification.result.governanceCertified
    && input.baselinePortfolioCertification.result.governanceCertified
    && input.currentPortfolioCertification.result.governanceCertified
    && bundles.every((bundle) => (
      bundle.binding.result.bindingState !== "INVALID"
      && bundle.authorityScope.result.scopeState !== "INVALID"
      && bundle.policyVisibility.result.visibilityState !== "INVALID"
      && bundle.governanceCertification.result.certificationState !== "FAIL"
    ));
  addReason(reasons, valid ? "GOVERNANCE_CONTINUITY_PRESERVED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return valid;
}

function validateReplayContinuity(input: RecommendationDriftFoundationInput, reasons: RecommendationDriftFoundationReasonCode[]): boolean {
  const bundles = [...input.baselineRecommendations, ...input.currentRecommendations];
  const replayStates = [
    input.baselineImpactReplay.result.replayState,
    input.currentImpactReplay.result.replayState,
    input.baselineDependencyReplay.result.replayState,
    input.currentDependencyReplay.result.replayState,
    input.baselinePortfolioReplay.result.replayState,
    input.currentPortfolioReplay.result.replayState,
  ];
  const valid = replayStates.every((state) => state !== "INVALID" && state !== "ESCALATED")
    && bundles.every((bundle) => (
      bundle.replay.result.replayState !== "INVALID"
      && bundle.governanceReplay.result.replayState !== "INVALID"
      && bundle.governanceReplay.result.replayState !== "ESCALATED"
      && bundle.replayFramework.result.replayState !== "INVALID"
      && bundle.replayFramework.result.replayState !== "ESCALATED"
    ));
  addReason(reasons, valid ? "REPLAY_CONTINUITY_PRESERVED" : "REPLAY_CORRUPTION_DETECTED");
  return valid;
}

function validateBoundary(input: RecommendationDriftFoundationInput, reasons: RecommendationDriftFoundationReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const repairAbsent = input.repairRequested !== true;
  const records = [
    input.baselineImpactFoundation,
    input.currentImpactFoundation,
    input.baselineImpactAnalysis,
    input.currentImpactAnalysis,
    input.baselineImpactObservability,
    input.currentImpactObservability,
    input.baselineImpactReplay,
    input.currentImpactReplay,
    input.baselineImpactCertification,
    input.currentImpactCertification,
    input.baselineDependencyFoundation,
    input.currentDependencyFoundation,
    input.baselineDependencyAnalysis,
    input.currentDependencyAnalysis,
    input.baselineDependencyReplay,
    input.currentDependencyReplay,
    input.baselineDependencyCertification,
    input.currentDependencyCertification,
    input.baselinePortfolio,
    input.currentPortfolio,
    input.baselineRelationshipAnalysis,
    input.currentRelationshipAnalysis,
    input.baselinePortfolioReplay,
    input.currentPortfolioReplay,
    input.baselinePortfolioCertification,
    input.currentPortfolioCertification,
    ...input.baselineRecommendations.flatMap((bundle) => [
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
    ]),
    ...input.currentRecommendations.flatMap((bundle) => [
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
    ]),
  ] satisfies readonly Record<string, unknown>[];
  const controlSurfaceAbsent = records.every(createBoundaryFlags);
  addReason(reasons, executionImpossible ? "EXECUTION_IMPOSSIBLE" : "EXECUTION_REQUEST_BLOCKED");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.prioritizationRequested === true ? "PRIORITIZATION_DETECTED" : "PRIORITIZATION_BLOCKED");
  addReason(reasons, input.approvalRequested === true ? "APPROVAL_DETECTED" : "APPROVAL_BLOCKED");
  addReason(reasons, repairAbsent ? "REPAIR_ABSENT" : "REPAIR_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.driftMutationAttempted === true ? "DRIFT_MUTATION_DETECTED" : "DRIFT_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  return Object.freeze({
    executionImpossible,
    authorityBounded,
    repairAbsent,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || input.prioritizationRequested === true
      || input.approvalRequested === true
      || !repairAbsent
      || !authorityBounded
      || input.driftMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

function createDescriptors(input: RecommendationDriftFoundationInput): {
  descriptors: RecommendationDrift[];
  baselineReferenceCount: number;
  currentReferenceCount: number;
  baselineMissing: boolean;
  currentMissing: boolean;
  evidenceDriftDetected: boolean;
  lineageDriftDetected: boolean;
  governanceDriftDetected: boolean;
  replayDriftDetected: boolean;
  readinessDriftDetected: boolean;
  portfolioDriftDetected: boolean;
  dependencyDriftDetected: boolean;
  impactDriftDetected: boolean;
} {
  const baseline = bundleMap(input.baselineRecommendations);
  const current = bundleMap(input.currentRecommendations);
  const baselineReferences = new Set<string>();
  const currentReferences = new Set<string>();
  const drifts: RecommendationDrift[] = [];
  let baselineMissing = false;
  let currentMissing = false;
  let evidenceDriftDetected = false;
  let lineageDriftDetected = false;
  let governanceDriftDetected = false;
  let replayDriftDetected = false;
  let readinessDriftDetected = false;
  let portfolioDriftDetected = false;
  let dependencyDriftDetected = false;
  let impactDriftDetected = false;

  const requestedIds = normalizeStrings(input.request.recommendationIds);
  const baselinePortfolioRef = portfolioReference(input, false);
  const currentPortfolioRef = portfolioReference(input, true);
  const baselineDependencyRef = dependencyReference(input, false);
  const currentDependencyRef = dependencyReference(input, true);
  const baselineImpactRef = impactReference(input, false);
  const currentImpactRef = impactReference(input, true);

  for (const id of requestedIds) {
    const baselineBundle = baseline.get(id);
    const currentBundle = current.get(id);
    if (!baselineBundle) {
      baselineMissing = true;
      continue;
    }
    if (!currentBundle) {
      currentMissing = true;
      continue;
    }

    const domainReferences = [
      { type: "EVIDENCE_DRIFT" as const, baselineReference: evidenceReference(baselineBundle), currentReference: evidenceReference(currentBundle) },
      { type: "LINEAGE_DRIFT" as const, baselineReference: lineageReference(baselineBundle), currentReference: lineageReference(currentBundle) },
      { type: "GOVERNANCE_DRIFT" as const, baselineReference: governanceReference(baselineBundle), currentReference: governanceReference(currentBundle) },
      { type: "REPLAY_DRIFT" as const, baselineReference: replayReference(baselineBundle), currentReference: replayReference(currentBundle) },
      { type: "READINESS_DRIFT" as const, baselineReference: readinessReference(baselineBundle), currentReference: readinessReference(currentBundle) },
      { type: "PORTFOLIO_DRIFT" as const, baselineReference: baselinePortfolioRef, currentReference: currentPortfolioRef },
      { type: "DEPENDENCY_DRIFT" as const, baselineReference: baselineDependencyRef, currentReference: currentDependencyRef },
      { type: "IMPACT_DRIFT" as const, baselineReference: baselineImpactRef, currentReference: currentImpactRef },
    ];

    for (const domain of domainReferences) {
      if (!includesScope(input.request.driftScope, domain.type)) continue;
      if (domain.baselineReference.length === 0) baselineMissing = true;
      if (domain.currentReference.length === 0) currentMissing = true;
      baselineReferences.add(domain.baselineReference);
      currentReferences.add(domain.currentReference);
      if (domain.baselineReference !== domain.currentReference) {
        drifts.push(descriptorToDrift({
          recommendationId: id,
          driftType: domain.type,
          baselineReference: domain.baselineReference,
          currentReference: domain.currentReference,
        }));
        if (domain.type === "EVIDENCE_DRIFT") evidenceDriftDetected = true;
        if (domain.type === "LINEAGE_DRIFT") lineageDriftDetected = true;
        if (domain.type === "GOVERNANCE_DRIFT") governanceDriftDetected = true;
        if (domain.type === "REPLAY_DRIFT") replayDriftDetected = true;
        if (domain.type === "READINESS_DRIFT") readinessDriftDetected = true;
        if (domain.type === "PORTFOLIO_DRIFT") portfolioDriftDetected = true;
        if (domain.type === "DEPENDENCY_DRIFT") dependencyDriftDetected = true;
        if (domain.type === "IMPACT_DRIFT") impactDriftDetected = true;
      }
    }
  }

  return {
    descriptors: drifts.sort((a, b) => (
      a.recommendationId.localeCompare(b.recommendationId)
      || a.driftType.localeCompare(b.driftType)
      || a.driftId.localeCompare(b.driftId)
    )),
    baselineReferenceCount: baselineReferences.size,
    currentReferenceCount: currentReferences.size,
    baselineMissing,
    currentMissing,
    evidenceDriftDetected,
    lineageDriftDetected,
    governanceDriftDetected,
    replayDriftDetected,
    readinessDriftDetected,
    portfolioDriftDetected,
    dependencyDriftDetected,
    impactDriftDetected,
  };
}

function addDomainReasons(flags: ReturnType<typeof createDescriptors>, reasons: RecommendationDriftFoundationReasonCode[]): void {
  addReason(reasons, flags.baselineReferenceCount > 0 ? "BASELINE_REFERENCES_PRESENT" : "BASELINE_REFERENCES_MISSING");
  addReason(reasons, flags.currentReferenceCount > 0 ? "CURRENT_REFERENCES_PRESENT" : "CURRENT_REFERENCES_MISSING");
  addReason(reasons, flags.evidenceDriftDetected ? "EVIDENCE_DRIFT_DETECTED" : "EVIDENCE_DRIFT_STABLE");
  addReason(reasons, flags.lineageDriftDetected ? "LINEAGE_DRIFT_DETECTED" : "LINEAGE_DRIFT_STABLE");
  addReason(reasons, flags.governanceDriftDetected ? "GOVERNANCE_DRIFT_DETECTED" : "GOVERNANCE_DRIFT_STABLE");
  addReason(reasons, flags.replayDriftDetected ? "REPLAY_DRIFT_DETECTED" : "REPLAY_DRIFT_STABLE");
  addReason(reasons, flags.readinessDriftDetected ? "READINESS_DRIFT_DETECTED" : "READINESS_DRIFT_STABLE");
  addReason(reasons, flags.portfolioDriftDetected ? "PORTFOLIO_DRIFT_DETECTED" : "PORTFOLIO_DRIFT_STABLE");
  addReason(reasons, flags.dependencyDriftDetected ? "DEPENDENCY_DRIFT_DETECTED" : "DEPENDENCY_DRIFT_STABLE");
  addReason(reasons, flags.impactDriftDetected ? "IMPACT_DRIFT_DETECTED" : "IMPACT_DRIFT_STABLE");
}

export function createRecommendationDriftEvidencePath(
  input: RecommendationDriftFoundationInput,
  drifts: readonly RecommendationDrift[],
): RecommendationDriftEvidencePath {
  const baselineBundles = orderedBundles(input.baselineRecommendations);
  const currentBundles = orderedBundles(input.currentRecommendations);
  return Object.freeze({
    scope: input.request.driftScope,
    driftReferences: normalizeStrings(drifts.map((drift) => drift.driftId)),
    baselineReferences: normalizeStrings([
      ...baselineBundles.map(evidenceReference),
      ...baselineBundles.map(lineageReference),
      ...baselineBundles.map(governanceReference),
      ...baselineBundles.map(replayReference),
      ...baselineBundles.map(readinessReference),
      portfolioReference(input, false),
      dependencyReference(input, false),
      impactReference(input, false),
    ]),
    currentReferences: normalizeStrings([
      ...currentBundles.map(evidenceReference),
      ...currentBundles.map(lineageReference),
      ...currentBundles.map(governanceReference),
      ...currentBundles.map(replayReference),
      ...currentBundles.map(readinessReference),
      portfolioReference(input, true),
      dependencyReference(input, true),
      impactReference(input, true),
    ]),
    evidenceReferences: normalizeStrings([
      ...baselineBundles.flatMap(collectEvidenceReferences),
      ...currentBundles.flatMap(collectEvidenceReferences),
    ]),
    lineageReferences: normalizeStrings([
      ...baselineBundles.flatMap(collectLineageReferences),
      ...currentBundles.flatMap(collectLineageReferences),
    ]),
    governanceReferences: normalizeStrings([
      ...baselineBundles.flatMap(collectGovernanceReferences),
      ...currentBundles.flatMap(collectGovernanceReferences),
    ]),
    replayReferences: normalizeStrings([
      ...baselineBundles.flatMap(collectReplayReferences),
      ...currentBundles.flatMap(collectReplayReferences),
    ]),
    readinessReferences: normalizeStrings([
      ...baselineBundles.flatMap(collectReadinessReferences),
      ...currentBundles.flatMap(collectReadinessReferences),
    ]),
    portfolioReferences: normalizeStrings([
      ...input.baselinePortfolioCertification.evidencePath.portfolioReferences,
      ...input.currentPortfolioCertification.evidencePath.portfolioReferences,
      ...input.baselinePortfolioCertification.evidencePath.relationshipReferences,
      ...input.currentPortfolioCertification.evidencePath.relationshipReferences,
    ]),
    dependencyReferences: normalizeStrings([
      ...input.baselineDependencyFoundation.evidencePath.dependencyReferences,
      ...input.currentDependencyFoundation.evidencePath.dependencyReferences,
      ...input.baselineDependencyAnalysis.evidencePath.chainReferences,
      ...input.currentDependencyAnalysis.evidencePath.chainReferences,
      ...input.baselineDependencyAnalysis.evidencePath.conflictReferences,
      ...input.currentDependencyAnalysis.evidencePath.conflictReferences,
    ]),
    impactReferences: normalizeStrings([
      ...input.baselineImpactFoundation.evidencePath.impactReferences,
      ...input.currentImpactFoundation.evidencePath.impactReferences,
      ...input.baselineImpactAnalysis.evidencePath.propagationReferences,
      ...input.currentImpactAnalysis.evidencePath.propagationReferences,
      ...input.baselineImpactAnalysis.evidencePath.conflictReferences,
      ...input.currentImpactAnalysis.evidencePath.conflictReferences,
    ]),
    evidenceHashes: normalizeStrings([
      input.baselinePortfolio.result.portfolioHash,
      input.currentPortfolio.result.portfolioHash,
      input.baselineRelationshipAnalysis.result.analysisHash,
      input.currentRelationshipAnalysis.result.analysisHash,
      input.baselinePortfolioReplay.result.replayHash,
      input.currentPortfolioReplay.result.replayHash,
      input.baselinePortfolioCertification.result.certificationHash,
      input.currentPortfolioCertification.result.certificationHash,
      input.baselineDependencyFoundation.result.dependencyGraphHash,
      input.currentDependencyFoundation.result.dependencyGraphHash,
      input.baselineDependencyAnalysis.result.analysisHash,
      input.currentDependencyAnalysis.result.analysisHash,
      input.baselineDependencyReplay.result.replayHash,
      input.currentDependencyReplay.result.replayHash,
      input.baselineDependencyCertification.result.certificationHash,
      input.currentDependencyCertification.result.certificationHash,
      input.baselineImpactFoundation.result.impactGraphHash,
      input.currentImpactFoundation.result.impactGraphHash,
      input.baselineImpactAnalysis.result.analysisHash,
      input.currentImpactAnalysis.result.analysisHash,
      input.baselineImpactObservability.result.observabilityHash,
      input.currentImpactObservability.result.observabilityHash,
      input.baselineImpactReplay.result.replayHash,
      input.currentImpactReplay.result.replayHash,
      input.baselineImpactCertification.result.certificationHash,
      input.currentImpactCertification.result.certificationHash,
      ...baselineBundles.flatMap(collectBundleEvidenceHashes),
      ...currentBundles.flatMap(collectBundleEvidenceHashes),
      ...drifts.map((drift) => drift.driftHash),
    ]),
  });
}

function validateLimits(
  recommendationCount: number,
  driftCount: number,
  baselineReferenceCount: number,
  currentReferenceCount: number,
  reasons: RecommendationDriftFoundationReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_RECOMMENDATIONS
    && driftCount <= MAX_DRIFTS
    && baselineReferenceCount <= MAX_BASELINE_REFERENCES
    && currentReferenceCount <= MAX_CURRENT_REFERENCES;
  addReason(reasons, recommendationCount <= MAX_RECOMMENDATIONS ? "RECOMMENDATION_LIMIT_VALID" : "RECOMMENDATION_LIMIT_EXCEEDED");
  addReason(reasons, driftCount <= MAX_DRIFTS ? "DRIFT_LIMIT_VALID" : "DRIFT_LIMIT_EXCEEDED");
  addReason(reasons, baselineReferenceCount <= MAX_BASELINE_REFERENCES ? "BASELINE_REFERENCE_LIMIT_VALID" : "BASELINE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, currentReferenceCount <= MAX_CURRENT_REFERENCES ? "CURRENT_REFERENCE_LIMIT_VALID" : "CURRENT_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: RecommendationDriftFoundationRequest,
  driftState: RecommendationDriftFoundationResult["driftState"],
  drifts: readonly RecommendationDrift[],
  tenantIsolationVerified: boolean,
  driftGraphHash: string,
): RecommendationDriftFoundationResult {
  return Object.freeze({
    tenantId: request.tenantId,
    driftState,
    driftsCreated: drifts.length,
    evidenceDriftsDetected: drifts.filter((drift) => drift.driftType === "EVIDENCE_DRIFT").length,
    lineageDriftsDetected: drifts.filter((drift) => drift.driftType === "LINEAGE_DRIFT").length,
    governanceDriftsDetected: drifts.filter((drift) => drift.driftType === "GOVERNANCE_DRIFT").length,
    replayDriftsDetected: drifts.filter((drift) => drift.driftType === "REPLAY_DRIFT").length,
    readinessDriftsDetected: drifts.filter((drift) => drift.driftType === "READINESS_DRIFT").length,
    portfolioDriftsDetected: drifts.filter((drift) => drift.driftType === "PORTFOLIO_DRIFT").length,
    dependencyDriftsDetected: drifts.filter((drift) => drift.driftType === "DEPENDENCY_DRIFT").length,
    impactDriftsDetected: drifts.filter((drift) => drift.driftType === "IMPACT_DRIFT").length,
    tenantIsolationVerified,
    driftGraphHash,
    deterministic: true,
  });
}

function buildObservability(result: RecommendationDriftFoundationResult): RecommendationDriftFoundationObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    driftState: result.driftState,
    driftsCreated: result.driftsCreated,
    evidenceDriftsDetected: result.evidenceDriftsDetected,
    lineageDriftsDetected: result.lineageDriftsDetected,
    governanceDriftsDetected: result.governanceDriftsDetected,
    replayDriftsDetected: result.replayDriftsDetected,
    readinessDriftsDetected: result.readinessDriftsDetected,
    portfolioDriftsDetected: result.portfolioDriftsDetected,
    dependencyDriftsDetected: result.dependencyDriftsDetected,
    impactDriftsDetected: result.impactDriftsDetected,
    driftGraphHash: result.driftGraphHash,
  });
}

function buildValidation(
  driftState: RecommendationDriftFoundationResult["driftState"],
  reasonCodes: readonly RecommendationDriftFoundationReasonCode[],
  flags: Readonly<{
    evidenceDriftDetected: boolean;
    lineageDriftDetected: boolean;
    governanceDriftDetected: boolean;
    replayDriftDetected: boolean;
    readinessDriftDetected: boolean;
    portfolioDriftDetected: boolean;
    dependencyDriftDetected: boolean;
    impactDriftDetected: boolean;
    ownershipValid: boolean;
    tenantIsolationVerified: boolean;
  }>,
  boundary: BoundaryValidation,
  counts: Readonly<{
    driftsCreated: number;
    baselineReferenceCount: number;
    currentReferenceCount: number;
  }>,
): RecommendationDriftFoundationValidation {
  return Object.freeze({
    valid: driftState !== "INVALID",
    driftState,
    reasonCodes: [...reasonCodes],
    ...flags,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    repairAbsent: boundary.repairAbsent,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
    ...counts,
  });
}

export function buildRecommendationDriftFoundationRequest(
  request: RecommendationDriftFoundationRequest,
): RecommendationDriftFoundationRequest {
  return requestCore(request);
}

export function sealRecommendationDriftFoundation(
  input: RecommendationDriftFoundationInput,
): SealedRecommendationDriftFoundationRecord {
  const reasons: RecommendationDriftFoundationReasonCode[] = [];
  const requestValid = validateRecommendationIds(input.request, reasons)
    && validateScope(input.request.driftScope, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const governanceValid = validateGovernanceContinuity(input, reasons);
  const replayValid = validateReplayContinuity(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const driftFlags = createDescriptors(input);
  addDomainReasons(driftFlags, reasons);
  const evidencePath = createRecommendationDriftEvidencePath(input, driftFlags.descriptors);
  const limitsValid = validateLimits(
    normalizeStrings(input.request.recommendationIds).length,
    driftFlags.descriptors.length,
    driftFlags.baselineReferenceCount,
    driftFlags.currentReferenceCount,
    reasons,
  );
  addReason(reasons, "DRIFT_FOUNDATION_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || !governanceValid
    || !replayValid
    || boundary.invalidBoundary
    || !limitsValid;
  const observe = !invalid && (
    driftFlags.baselineMissing
    || driftFlags.currentMissing
    || driftFlags.baselineReferenceCount === 0
    || driftFlags.currentReferenceCount === 0
  );
  const driftDetected = !invalid && !observe && driftFlags.descriptors.length > 0;
  const driftState = invalid ? "INVALID" : observe ? "OBSERVE" : driftDetected ? "DRIFT_DETECTED" : "STABLE";

  const driftGraphHash = hashDriftValue("recommendation-drift-foundation", {
    request: requestCore(input.request),
    driftState,
    driftReferences: evidencePath.driftReferences,
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
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    driftState,
    driftFlags.descriptors,
    tenantIsolationVerified,
    driftGraphHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    driftState,
    reasons,
    Object.freeze({
      evidenceDriftDetected: driftFlags.evidenceDriftDetected,
      lineageDriftDetected: driftFlags.lineageDriftDetected,
      governanceDriftDetected: driftFlags.governanceDriftDetected,
      replayDriftDetected: driftFlags.replayDriftDetected,
      readinessDriftDetected: driftFlags.readinessDriftDetected,
      portfolioDriftDetected: driftFlags.portfolioDriftDetected,
      dependencyDriftDetected: driftFlags.dependencyDriftDetected,
      impactDriftDetected: driftFlags.impactDriftDetected,
      ownershipValid,
      tenantIsolationVerified,
    }),
    boundary,
    Object.freeze({
      driftsCreated: driftFlags.descriptors.length,
      baselineReferenceCount: driftFlags.baselineReferenceCount,
      currentReferenceCount: driftFlags.currentReferenceCount,
    }),
  );

  return Object.freeze({
    result,
    drifts: driftFlags.descriptors,
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    driftOnly: true,
    executionAuthorized: false,
    workflowRoutingAllowed: false,
    prioritizationAllowed: false,
    approvalAllowed: false,
    repairAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
