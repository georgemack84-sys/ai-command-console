import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  CrossDomainValidation,
  CrossDomainValidationEvidencePath,
  CrossDomainValidationInput,
  CrossDomainValidationObservability,
  CrossDomainValidationReasonCode,
  CrossDomainValidationRequest,
  CrossDomainValidationResult,
  CrossDomainValidationValidation,
  DomainCompletionState,
  RecommendationIntelligenceCompletionContract,
  SealedCrossDomainValidationRecord,
  ValidationDomain,
  ValidationState,
} from "./types";

const MAX_DOMAINS = 14;
const MAX_VALIDATION_RECORDS = 50_000;
const MAX_GOVERNANCE_REFERENCES = 10_000;
const MAX_LINEAGE_REFERENCES = 10_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_CERTIFICATION_REFERENCES = 10_000;

const DOMAIN_ORDER: readonly ValidationDomain[] = Object.freeze([
  "MEMORY",
  "OBSERVABILITY",
  "GOVERNANCE",
  "READINESS",
  "PORTFOLIO",
  "DEPENDENCY",
  "IMPACT",
  "DRIFT",
  "TRUST",
  "RESILIENCE",
  "DEPENDENCY_RISK",
  "OPPORTUNITY",
  "CONSTRAINT",
  "DEPENDENCY_HEALTH",
]);

const REQUIRED_RELATIONSHIPS = Object.freeze([
  ["PORTFOLIO", "DEPENDENCY"],
  ["DEPENDENCY", "IMPACT"],
  ["IMPACT", "DRIFT"],
  ["DRIFT", "TRUST"],
  ["TRUST", "RESILIENCE"],
  ["RESILIENCE", "DEPENDENCY_RISK"],
  ["DEPENDENCY_RISK", "OPPORTUNITY"],
  ["OPPORTUNITY", "CONSTRAINT"],
  ["CONSTRAINT", "DEPENDENCY_HEALTH"],
] as const satisfies readonly (readonly [ValidationDomain, ValidationDomain])[]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
  controlSurfaceAbsent: boolean;
}>;

type DomainDetail = Readonly<{
  domain: ValidationDomain;
  completionState: DomainCompletionState;
  governanceReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  certificationReferences: readonly string[];
  evidenceHashes: readonly string[];
  tenantIsolationVerified: boolean;
  ownershipValid: boolean;
  governanceAligned: boolean;
  lineageContinuous: boolean;
  replayContinuous: boolean;
  partialEvidence: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(
  reasons: CrossDomainValidationReasonCode[],
  reason: CrossDomainValidationReasonCode,
): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(
  request: CrossDomainValidationRequest,
): CrossDomainValidationRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    graphVersion: request.graphVersion,
  });
}

function resultRecord(record: unknown): Record<string, unknown> {
  return (record && typeof record === "object" ? (record as { result?: unknown }).result : {}) as Record<string, unknown>;
}

function evidenceRecord(record: unknown): Record<string, unknown> {
  return (record && typeof record === "object" ? (record as { evidencePath?: unknown }).evidencePath : {}) as Record<string, unknown>;
}

function validationRecord(record: unknown): Record<string, unknown> {
  return (record && typeof record === "object" ? (record as { validation?: unknown }).validation : {}) as Record<string, unknown>;
}

function boolProp(record: Record<string, unknown>, key: string): boolean {
  return record[key] === true;
}

function stringProp(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function stringArrayProp(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0) : [];
}

function recommendationId(bundle: Record<string, unknown>): string {
  const ledger = bundle.ledger as Record<string, unknown> | undefined;
  const entry = ledger?.entry as Record<string, unknown> | undefined;
  return typeof entry?.recommendationId === "string" ? entry.recommendationId : "";
}

function orderedBundles(input: CrossDomainValidationInput): Record<string, unknown>[] {
  return [...input.recommendations as readonly Record<string, unknown>[]].sort((left, right) => (
    recommendationId(left).localeCompare(recommendationId(right))
  ));
}

function createBoundaryFlags(record: Record<string, unknown>): boolean {
  const blockedFlags = [
    "executionAuthorized",
    "workflowRoutingAllowed",
    "approvalAllowed",
    "recommendationApprovalAllowed",
    "recommendationRankingAllowed",
    "recommendationPrioritizationAllowed",
    "prioritizationAllowed",
    "recommendationScoringAllowed",
    "resourceAllocationAllowed",
    "approvalBehaviorAllowed",
    "governanceExecutionAllowed",
    "policyExecutionAllowed",
    "authorityMutationAllowed",
    "controlSurfacePresent",
  ] as const;
  return blockedFlags.every((key) => record[key] !== true);
}

function stateIsPartial(state: string): boolean {
  return [
    "LIMITED",
    "CONDITIONAL_PASS",
    "PARTIALLY_ALIGNED",
    "DEGRADED",
  ].includes(state);
}

function bundleGovernanceReferences(bundle: Record<string, unknown>): string[] {
  const governanceReferences = bundle.governanceReferences as Record<string, unknown> | undefined;
  const binding = bundle.binding as Record<string, unknown> | undefined;
  const authorityScope = bundle.authorityScope as Record<string, unknown> | undefined;
  const policyVisibility = bundle.policyVisibility as Record<string, unknown> | undefined;
  const governanceReplay = bundle.governanceReplay as Record<string, unknown> | undefined;
  const governanceCertification = bundle.governanceCertification as Record<string, unknown> | undefined;
  const readiness = bundle.readiness as Record<string, unknown> | undefined;
  const alignment = bundle.alignment as Record<string, unknown> | undefined;
  return normalizeStrings([
    ...stringArrayProp(governanceReferences ?? {}, "governanceReferences"),
    ...stringArrayProp(evidenceRecord(binding), "governanceReferences"),
    ...stringArrayProp(evidenceRecord(authorityScope), "governanceReferences"),
    ...stringArrayProp(evidenceRecord(policyVisibility), "governanceReferences"),
    ...stringArrayProp(evidenceRecord(governanceReplay), "governanceReferences"),
    ...stringArrayProp(evidenceRecord(governanceCertification), "governanceReferences"),
    ...stringArrayProp(evidenceRecord(readiness), "governanceReferences"),
    ...stringArrayProp(evidenceRecord(alignment), "governanceReferences"),
  ]);
}

function bundleLineageReferences(bundle: Record<string, unknown>): string[] {
  const ledger = bundle.ledger as Record<string, unknown> | undefined;
  const entry = (ledger?.entry ?? {}) as Record<string, unknown>;
  const lineage = bundle.lineage as Record<string, unknown> | undefined;
  const ancestry = Array.isArray(lineage?.ancestryChain)
    ? lineage.ancestryChain.map((node) => (
      typeof (node as Record<string, unknown>).lineageReference === "string"
        ? (node as Record<string, unknown>).lineageReference as string
        : ""
    ))
    : [];
  const verification = bundle.verification as Record<string, unknown> | undefined;
  const audit = bundle.audit as Record<string, unknown> | undefined;
  const reviewPacket = bundle.reviewPacket as Record<string, unknown> | undefined;
  const replayFramework = bundle.replayFramework as Record<string, unknown> | undefined;
  const readinessCertification = bundle.readinessCertification as Record<string, unknown> | undefined;
  return normalizeStrings([
    ...stringArrayProp(entry, "lineageReferences"),
    ...ancestry,
    ...stringArrayProp(evidenceRecord(lineage), "lineageReferences"),
    ...stringArrayProp(evidenceRecord(verification), "lineageReferences"),
    ...stringArrayProp(evidenceRecord(audit), "lineageReferences"),
    ...stringArrayProp(evidenceRecord(reviewPacket), "lineageReferences"),
    ...stringArrayProp(evidenceRecord(replayFramework), "lineageReferences"),
    ...stringArrayProp(evidenceRecord(readinessCertification), "lineageReferences"),
  ]);
}

function bundleReplayReferences(bundle: Record<string, unknown>): string[] {
  const replayEvidence = bundle.replayEvidence as Record<string, unknown> | undefined;
  const replay = bundle.replay as Record<string, unknown> | undefined;
  const governanceReplay = bundle.governanceReplay as Record<string, unknown> | undefined;
  const replayFramework = bundle.replayFramework as Record<string, unknown> | undefined;
  const readiness = bundle.readiness as Record<string, unknown> | undefined;
  const readinessCertification = bundle.readinessCertification as Record<string, unknown> | undefined;
  return normalizeStrings([
    ...stringArrayProp(replayEvidence ?? {}, "replayReferences"),
    ...stringArrayProp(evidenceRecord(replay), "evidenceIds"),
    ...stringArrayProp(evidenceRecord(governanceReplay), "replayReferences"),
    ...stringArrayProp(evidenceRecord(replayFramework), "replayReferences"),
    ...stringArrayProp(evidenceRecord(readiness), "replayReferences"),
    ...stringArrayProp(evidenceRecord(readinessCertification), "replayReferences"),
  ]);
}

function bundleEvidenceHashes(bundle: Record<string, unknown>): string[] {
  return normalizeStrings([
    stringProp(resultRecord(bundle.ledger), "ledgerHash"),
    stringProp(resultRecord(bundle.lineage), "reconstructionHash"),
    stringProp(resultRecord(bundle.verification), "verificationHash"),
    stringProp(resultRecord(bundle.replay), "replayHash"),
    stringProp(resultRecord(bundle.integrity), "integrityHash"),
    stringProp(resultRecord(bundle.certification), "certificationHash"),
    stringProp(resultRecord(bundle.observability), "observabilityHash"),
    stringProp(resultRecord(bundle.audit), "exportHash"),
    stringProp(resultRecord(bundle.binding), "governanceHash"),
    stringProp(resultRecord(bundle.authorityScope), "authorityHash"),
    stringProp(resultRecord(bundle.policyVisibility), "policyHash"),
    stringProp(resultRecord(bundle.governanceReplay), "replayHash"),
    stringProp(resultRecord(bundle.governanceCertification), "certificationHash"),
    stringProp(resultRecord(bundle.readiness), "readinessHash"),
    stringProp(resultRecord(bundle.alignment), "alignmentHash"),
    stringProp(resultRecord(bundle.reviewPacket), "packetHash"),
    stringProp(resultRecord(bundle.replayFramework), "replayHash"),
    stringProp(resultRecord(bundle.readinessCertification), "certificationHash"),
    stringProp(resultRecord(bundle.observabilityCertification), "certificationHash"),
  ]);
}

function contractMap(
  contracts: readonly RecommendationIntelligenceCompletionContract[],
): ReadonlyMap<ValidationDomain, RecommendationIntelligenceCompletionContract> {
  return new Map(contracts.map((contract) => [contract.domain, contract]));
}

function requirementStateToValidationState(state: DomainCompletionState): ValidationState {
  switch (state) {
    case "COMPLETE":
      return "VALID";
    case "PARTIAL":
      return "PARTIAL";
    case "UNKNOWN":
      return "UNKNOWN";
    default:
      return "INVALID";
  }
}

function validationAggregate(references: readonly string[], prefix: string): string {
  if (references.length === 0) return "";
  return `${prefix}:${hashValue(`cross-domain-${prefix}`, references)}`;
}

function bundleDomainDetail(
  domain: ValidationDomain,
  contract: RecommendationIntelligenceCompletionContract,
  input: CrossDomainValidationInput,
): DomainDetail {
  const bundles = orderedBundles(input);
  const governanceReferences = normalizeStrings([
    contract.governanceReference,
    ...bundles.flatMap(bundleGovernanceReferences),
  ]);
  const lineageReferences = normalizeStrings([
    contract.lineageReference,
    ...bundles.flatMap(bundleLineageReferences),
  ]);
  const replayReferences = normalizeStrings([
    contract.replayReference,
    ...bundles.flatMap(bundleReplayReferences),
  ]);
  const certificationReferences = normalizeStrings([
    contract.certificationReference,
    ...bundles.map((bundle) => stringProp(resultRecord(bundle.certification), "certificationHash")),
    ...bundles.map((bundle) => stringProp(resultRecord(bundle.governanceCertification), "certificationHash")),
    ...bundles.map((bundle) => stringProp(resultRecord(bundle.readinessCertification), "certificationHash")),
    ...bundles.map((bundle) => stringProp(resultRecord(bundle.observabilityCertification), "certificationHash")),
  ]);
  const evidenceHashes = normalizeStrings([
    contract.completionHash,
    ...bundles.flatMap(bundleEvidenceHashes),
  ]);
  const ownershipValid = input.completion.validation.ownershipValid
    && bundles.every((bundle) => (
      stringProp(bundle.ownershipEvidence as Record<string, unknown>, "recommendationId") === recommendationId(bundle)
    ));
  const tenantIsolationVerified = input.completion.validation.tenantIsolationVerified
    && bundles.every((bundle) => (
      stringProp((bundle.ledger as Record<string, unknown>).entry as Record<string, unknown>, "tenantId") === input.request.tenantId
      && stringProp(bundle.ownershipEvidence as Record<string, unknown>, "tenantId") === input.request.tenantId
      && stringProp(bundle.replayEvidence as Record<string, unknown>, "tenantId") === input.request.tenantId
    ));
  const governanceAligned = bundles.every((bundle) => (
    stringProp(resultRecord(bundle.governanceCertification), "certificationState") === "PASS"
  ));
  let replayContinuous = bundles.every((bundle) => {
    const replayState = stringProp(resultRecord(bundle.replay), "replayState");
    return replayState === "REPLAYABLE" || replayState === "LIMITED";
  });
  let partialEvidence = false;

  if (domain === "OBSERVABILITY") {
    partialEvidence = bundles.some((bundle) => (
      stateIsPartial(stringProp(resultRecord(bundle.observability), "observabilityState"))
      || !boolProp(resultRecord(bundle.observability), "replayVisible")
    ));
    replayContinuous = replayContinuous && bundles.every((bundle) => boolProp(resultRecord(bundle.observability), "replayVisible"));
  } else if (domain === "GOVERNANCE") {
    partialEvidence = bundles.some((bundle) => (
      stateIsPartial(stringProp(resultRecord(bundle.governanceReplay), "replayState"))
      || !stringProp(resultRecord(bundle.policyVisibility), "visibilityState").includes("VISIBLE")
    ));
    replayContinuous = replayContinuous && bundles.every((bundle) => {
      const replayState = stringProp(resultRecord(bundle.governanceReplay), "replayState");
      return replayState === "REPLAYABLE" || replayState === "LIMITED";
    });
  } else if (domain === "READINESS") {
    partialEvidence = bundles.some((bundle) => (
      stateIsPartial(stringProp(resultRecord(bundle.replayFramework), "replayState"))
      || stateIsPartial(stringProp(resultRecord(bundle.readiness), "readinessState"))
    ));
    replayContinuous = bundles.every((bundle) => {
      const replayState = stringProp(resultRecord(bundle.replayFramework), "replayState");
      return replayState === "REPLAYABLE" || replayState === "LIMITED";
    });
  } else {
    partialEvidence = bundles.some((bundle) => (
      stateIsPartial(stringProp(resultRecord(bundle.replay), "replayState"))
      || stateIsPartial(stringProp(resultRecord(bundle.lineage), "reconstructionState"))
    ));
  }

  return Object.freeze({
    domain,
    completionState: contract.completionState,
    governanceReferences,
    lineageReferences,
    replayReferences,
    certificationReferences,
    evidenceHashes,
    tenantIsolationVerified,
    ownershipValid,
    governanceAligned,
    lineageContinuous: lineageReferences.length > 0 && contract.lineageReference.length > 0,
    replayContinuous: replayContinuous && replayReferences.length > 0 && contract.replayReference.length > 0,
    partialEvidence,
  });
}

function genericDomainDetail(
  domain: ValidationDomain,
  contract: RecommendationIntelligenceCompletionContract,
  foundation: unknown,
  replay: unknown,
  certification: unknown,
  stateKey: string,
): DomainDetail {
  const foundationResult = resultRecord(foundation);
  const replayResult = resultRecord(replay);
  const certificationResult = resultRecord(certification);
  const foundationEvidence = evidenceRecord(foundation);
  const replayEvidence = evidenceRecord(replay);
  const certificationEvidence = evidenceRecord(certification);
  const certificationValidation = validationRecord(certification);

  const governanceReferences = normalizeStrings([
    contract.governanceReference,
    ...stringArrayProp(foundationEvidence, "governanceReferences"),
    ...stringArrayProp(replayEvidence, "governanceReferences"),
    ...stringArrayProp(certificationEvidence, "governanceReferences"),
  ]);
  const lineageReferences = normalizeStrings([
    contract.lineageReference,
    ...stringArrayProp(foundationEvidence, "lineageReferences"),
    ...stringArrayProp(replayEvidence, "lineageReferences"),
    ...stringArrayProp(certificationEvidence, "lineageReferences"),
  ]);
  const replayReferences = normalizeStrings([
    contract.replayReference,
    ...stringArrayProp(foundationEvidence, "replayReferences"),
    ...stringArrayProp(replayEvidence, "replayReferences"),
    ...stringArrayProp(certificationEvidence, "replayReferences"),
  ]);
  const certificationReferences = normalizeStrings([
    contract.certificationReference,
    stringProp(certificationResult, "certificationHash"),
  ]);
  const evidenceHashes = normalizeStrings([
    contract.completionHash,
    stringProp(replayResult, "replayHash"),
    stringProp(replayResult, "reconstructionHash"),
    ...stringArrayProp(foundationEvidence, "evidenceHashes"),
    ...stringArrayProp(replayEvidence, "evidenceHashes"),
    ...stringArrayProp(certificationEvidence, "evidenceHashes"),
  ]);
  const replayState = stringProp(replayResult, "replayState");
  const foundationState = stringProp(foundationResult, stateKey);
  const governanceCertified = !("governanceCertified" in certificationResult) || boolProp(certificationResult, "governanceCertified");
  const observabilityPreserved = !("observabilityPreserved" in certificationValidation) || boolProp(certificationValidation, "observabilityPreserved");

  return Object.freeze({
    domain,
    completionState: contract.completionState,
    governanceReferences,
    lineageReferences,
    replayReferences,
    certificationReferences,
    evidenceHashes,
    tenantIsolationVerified: boolProp(foundationResult, "tenantIsolationVerified")
      && boolProp(replayResult, "tenantIsolationVerified")
      && boolProp(certificationResult, "tenantIsolationVerified"),
    ownershipValid: boolProp(validationRecord(foundation), "ownershipValid") !== false,
    governanceAligned: governanceCertified && governanceReferences.length > 0 && contract.governanceReference.length > 0,
    lineageContinuous: lineageReferences.length > 0 && contract.lineageReference.length > 0,
    replayContinuous: (replayState === "REPLAYABLE" || replayState === "LIMITED")
      && replayReferences.length > 0
      && contract.replayReference.length > 0,
    partialEvidence: stateIsPartial(foundationState) || replayState === "LIMITED" || !observabilityPreserved,
  });
}

function deriveDomainDetails(
  input: CrossDomainValidationInput,
): readonly DomainDetail[] {
  const contracts = contractMap(input.completion.contracts);
  return Object.freeze([
    bundleDomainDetail("MEMORY", contracts.get("MEMORY")!, input),
    bundleDomainDetail("OBSERVABILITY", contracts.get("OBSERVABILITY")!, input),
    bundleDomainDetail("GOVERNANCE", contracts.get("GOVERNANCE")!, input),
    bundleDomainDetail("READINESS", contracts.get("READINESS")!, input),
    genericDomainDetail("PORTFOLIO", contracts.get("PORTFOLIO")!, input.portfolio, input.portfolioReplay, input.portfolioCertification, "portfolioState"),
    genericDomainDetail("DEPENDENCY", contracts.get("DEPENDENCY")!, input.dependencyFoundation, input.dependencyReplay, input.dependencyCertification, "dependencyState"),
    genericDomainDetail("IMPACT", contracts.get("IMPACT")!, input.impactFoundation, input.impactReplay, input.impactCertification, "impactState"),
    genericDomainDetail("DRIFT", contracts.get("DRIFT")!, input.driftFoundation, input.driftReplay, input.driftCertification, "driftState"),
    genericDomainDetail("TRUST", contracts.get("TRUST")!, input.trustFoundation, input.trustReplay, input.trustCertification, "trustState"),
    genericDomainDetail("RESILIENCE", contracts.get("RESILIENCE")!, input.resilienceFoundation, input.resilienceReplay, input.resilienceCertification, "resilienceState"),
    genericDomainDetail("DEPENDENCY_RISK", contracts.get("DEPENDENCY_RISK")!, input.dependencyRiskFoundation, input.dependencyRiskReplay, input.dependencyRiskCertification, "dependencyRiskState"),
    genericDomainDetail("OPPORTUNITY", contracts.get("OPPORTUNITY")!, input.opportunityFoundation, input.opportunityReplay, input.opportunityCertification, "opportunityState"),
    genericDomainDetail("CONSTRAINT", contracts.get("CONSTRAINT")!, input.constraintFoundation, input.constraintReplay, input.constraintCertification, "constraintState"),
    genericDomainDetail("DEPENDENCY_HEALTH", contracts.get("DEPENDENCY_HEALTH")!, input.dependencyHealthFoundation, input.dependencyHealthReplay, input.dependencyHealthCertification, "overallHealthState"),
  ]);
}

function missingEvidence(detail: DomainDetail): boolean {
  return detail.governanceReferences.length === 0
    || detail.lineageReferences.length === 0
    || detail.replayReferences.length === 0
    || detail.certificationReferences.length === 0;
}

function domainValidationState(
  detail: DomainDetail,
  boundary: BoundaryValidation,
): ValidationState {
  if (!detail.ownershipValid || !detail.tenantIsolationVerified || !boundary.authorityBounded) return "INVALID";
  if (missingEvidence(detail)) return "UNKNOWN";
  if (!detail.governanceAligned || !detail.lineageContinuous || !detail.replayContinuous) return "INVALID";
  if (detail.partialEvidence) return "PARTIAL";
  return requirementStateToValidationState(detail.completionState);
}

function buildValidationRecord(
  source: DomainDetail,
  target: DomainDetail,
  validationState: ValidationState,
): CrossDomainValidation {
  const governanceReference = validationAggregate(
    normalizeStrings([...source.governanceReferences, ...target.governanceReferences]),
    "governance",
  );
  const lineageReference = validationAggregate(
    normalizeStrings([...source.lineageReferences, ...target.lineageReferences]),
    "lineage",
  );
  const replayReference = validationAggregate(
    normalizeStrings([...source.replayReferences, ...target.replayReferences]),
    "replay",
  );
  const core = Object.freeze({
    sourceDomain: source.domain,
    targetDomain: target.domain,
    validationState,
    governanceReference,
    lineageReference,
    replayReference,
  });
  const validationHash = hashValue("cross-domain-validation-hash", core);
  const validationId = hashValue("cross-domain-validation-id", {
    sourceDomain: source.domain,
    targetDomain: target.domain,
    validationHash,
  });
  return Object.freeze({
    validationId,
    ...core,
    validationHash,
  });
}

function relationshipState(
  source: DomainDetail,
  target: DomainDetail,
  boundary: BoundaryValidation,
): ValidationState {
  if (!source.ownershipValid || !target.ownershipValid || !source.tenantIsolationVerified || !target.tenantIsolationVerified || !boundary.authorityBounded) {
    return "INVALID";
  }
  if (missingEvidence(source) || missingEvidence(target)) return "UNKNOWN";
  if (
    !source.governanceAligned || !target.governanceAligned
    || !source.lineageContinuous || !target.lineageContinuous
    || !source.replayContinuous || !target.replayContinuous
  ) {
    return "INVALID";
  }

  const sourceState = domainValidationState(source, boundary);
  const targetState = domainValidationState(target, boundary);
  if (sourceState === "UNKNOWN" || targetState === "UNKNOWN") return "UNKNOWN";
  if (sourceState === "INVALID" || targetState === "INVALID") return "INVALID";
  if (sourceState === "PARTIAL" || targetState === "PARTIAL" || source.partialEvidence || target.partialEvidence) return "PARTIAL";
  return "VALID";
}

function collectAllRecords(input: CrossDomainValidationInput): Record<string, unknown>[] {
  return [
    input.completion,
    input.portfolio,
    input.portfolioReplay,
    input.portfolioCertification,
    input.dependencyFoundation,
    input.dependencyReplay,
    input.dependencyCertification,
    input.impactFoundation,
    input.impactReplay,
    input.impactCertification,
    input.driftFoundation,
    input.driftReplay,
    input.driftCertification,
    input.trustFoundation,
    input.trustReplay,
    input.trustCertification,
    input.resilienceFoundation,
    input.resilienceReplay,
    input.resilienceCertification,
    input.dependencyRiskFoundation,
    input.dependencyRiskReplay,
    input.dependencyRiskCertification,
    input.opportunityFoundation,
    input.opportunityReplay,
    input.opportunityCertification,
    input.constraintFoundation,
    input.constraintReplay,
    input.constraintCertification,
    input.dependencyHealthFoundation,
    input.dependencyHealthReplay,
    input.dependencyHealthCertification,
    ...orderedBundles(input).flatMap((bundle) => Object.values(bundle)),
  ] as Record<string, unknown>[];
}

function validateBoundary(
  input: CrossDomainValidationInput,
  reasons: CrossDomainValidationReasonCode[],
): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const approvalAbsent = input.approvalRequested !== true;
  const rankingAbsent = input.recommendationRankingRequested !== true;
  const prioritizationAbsent = input.prioritizationRequested !== true;
  const scoringAbsent = input.recommendationScoringRequested !== true;
  const resourceAllocationAbsent = input.resourceAllocationRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = collectAllRecords(input).every(createBoundaryFlags);

  addReason(reasons, executionImpossible ? "EXECUTION_IMPOSSIBLE" : "EXECUTION_REQUEST_BLOCKED");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, approvalAbsent ? "APPROVAL_ABSENT" : "APPROVAL_DETECTED");
  addReason(reasons, rankingAbsent ? "RANKING_ABSENT" : "RANKING_DETECTED");
  addReason(reasons, prioritizationAbsent ? "PRIORITIZATION_ABSENT" : "PRIORITIZATION_DETECTED");
  addReason(reasons, scoringAbsent ? "SCORING_ABSENT" : "SCORING_DETECTED");
  addReason(reasons, resourceAllocationAbsent ? "RESOURCE_ALLOCATION_ABSENT" : "RESOURCE_ALLOCATION_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.validationMutationAttempted === true ? "VALIDATION_MUTATION_DETECTED" : "VALIDATION_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");

  return Object.freeze({
    executionImpossible,
    approvalAbsent,
    rankingAbsent,
    prioritizationAbsent,
    scoringAbsent,
    resourceAllocationAbsent,
    authorityBounded,
    invalidBoundary: !executionImpossible
      || !approvalAbsent
      || !rankingAbsent
      || !prioritizationAbsent
      || !scoringAbsent
      || !resourceAllocationAbsent
      || input.workflowRoutingRequested === true
      || !authorityBounded
      || input.validationMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

function createEvidencePath(
  details: readonly DomainDetail[],
  validations: readonly CrossDomainValidation[],
): CrossDomainValidationEvidencePath {
  return Object.freeze({
    domains: DOMAIN_ORDER,
    governanceReferences: normalizeStrings(details.flatMap((detail) => detail.governanceReferences)),
    lineageReferences: normalizeStrings(details.flatMap((detail) => detail.lineageReferences)),
    replayReferences: normalizeStrings(details.flatMap((detail) => detail.replayReferences)),
    certificationReferences: normalizeStrings(details.flatMap((detail) => detail.certificationReferences)),
    evidenceHashes: normalizeStrings([
      ...details.flatMap((detail) => detail.evidenceHashes),
      ...validations.map((validation) => validation.validationHash),
    ]),
  });
}

function validateTenantId(
  request: CrossDomainValidationRequest,
  reasons: CrossDomainValidationReasonCode[],
): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateSealedArtifacts(
  input: CrossDomainValidationInput,
  reasons: CrossDomainValidationReasonCode[],
): boolean {
  const completionSealed = input.completion.sealed === true;
  const artifactsSealed = collectAllRecords(input).every((record) => record.sealed === true);
  addReason(reasons, completionSealed ? "COMPLETION_RECORD_SEALED" : "COMPLETION_RECORD_UNSEALED");
  addReason(reasons, artifactsSealed ? "ARTIFACTS_SEALED" : "ARTIFACT_UNSEALED");
  return completionSealed && artifactsSealed;
}

function validateCompletionReferences(
  input: CrossDomainValidationInput,
  reasons: CrossDomainValidationReasonCode[],
): boolean {
  const present = input.completion.evidencePath.governanceReferences.length > 0
    && input.completion.evidencePath.lineageReferences.length > 0
    && input.completion.evidencePath.replayReferences.length > 0
    && input.completion.evidencePath.certificationReferences.length > 0;
  addReason(reasons, present ? "COMPLETION_REFERENCES_PRESENT" : "COMPLETION_REFERENCES_MISSING");
  return present;
}

function validateRequiredRelationships(
  validations: readonly CrossDomainValidation[],
  reasons: CrossDomainValidationReasonCode[],
): boolean {
  const represented = REQUIRED_RELATIONSHIPS.every(([source, target]) => (
    validations.some((validation) => validation.sourceDomain === source && validation.targetDomain === target)
  ));
  addReason(reasons, represented ? "REQUIRED_RELATIONSHIPS_REPRESENTED" : "REQUIRED_RELATIONSHIPS_INCOMPLETE");
  return represented;
}

function validateLimits(
  details: readonly DomainDetail[],
  validations: readonly CrossDomainValidation[],
  evidencePath: CrossDomainValidationEvidencePath,
  reasons: CrossDomainValidationReasonCode[],
): boolean {
  const valid = details.length <= MAX_DOMAINS
    && validations.length <= MAX_VALIDATION_RECORDS
    && evidencePath.governanceReferences.length <= MAX_GOVERNANCE_REFERENCES
    && evidencePath.lineageReferences.length <= MAX_LINEAGE_REFERENCES
    && evidencePath.replayReferences.length <= MAX_REPLAY_REFERENCES
    && evidencePath.certificationReferences.length <= MAX_CERTIFICATION_REFERENCES;
  addReason(reasons, details.length <= MAX_DOMAINS ? "DOMAIN_LIMIT_VALID" : "DOMAIN_LIMIT_EXCEEDED");
  addReason(reasons, validations.length <= MAX_VALIDATION_RECORDS ? "VALIDATION_RECORD_LIMIT_VALID" : "VALIDATION_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.governanceReferences.length <= MAX_GOVERNANCE_REFERENCES ? "GOVERNANCE_REFERENCE_LIMIT_VALID" : "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.lineageReferences.length <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.replayReferences.length <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.certificationReferences.length <= MAX_CERTIFICATION_REFERENCES ? "CERTIFICATION_REFERENCE_LIMIT_VALID" : "CERTIFICATION_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function overallValidationState(validations: readonly CrossDomainValidation[]): ValidationState {
  if (validations.some((validation) => validation.validationState === "INVALID")) return "INVALID";
  if (validations.some((validation) => validation.validationState === "UNKNOWN")) return "UNKNOWN";
  if (validations.some((validation) => validation.validationState === "PARTIAL")) return "PARTIAL";
  return "VALID";
}

function buildResult(
  request: CrossDomainValidationRequest,
  validations: readonly CrossDomainValidation[],
  tenantIsolationVerified: boolean,
  validationHash: string,
): CrossDomainValidationResult {
  const validValidations = validations.filter((validation) => validation.validationState === "VALID").length;
  const partialValidations = validations.filter((validation) => validation.validationState === "PARTIAL").length;
  const invalidValidations = validations.filter((validation) => validation.validationState === "INVALID").length;
  const unknownValidations = validations.filter((validation) => validation.validationState === "UNKNOWN").length;
  return Object.freeze({
    tenantId: request.tenantId,
    overallValidationState: overallValidationState(validations),
    domainsEvaluated: DOMAIN_ORDER.length,
    validationsEvaluated: validations.length,
    validValidations,
    partialValidations,
    invalidValidations,
    unknownValidations,
    tenantIsolationVerified,
    validationHash,
    deterministic: true,
  });
}

function buildObservability(
  result: CrossDomainValidationResult,
): CrossDomainValidationObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    overallValidationState: result.overallValidationState,
    domainsEvaluated: result.domainsEvaluated,
    validationsEvaluated: result.validationsEvaluated,
    validValidations: result.validValidations,
    partialValidations: result.partialValidations,
    invalidValidations: result.invalidValidations,
    unknownValidations: result.unknownValidations,
    validationHash: result.validationHash,
  });
}

function buildValidation(
  result: CrossDomainValidationResult,
  reasonCodes: readonly CrossDomainValidationReasonCode[],
  details: readonly DomainDetail[],
  boundary: BoundaryValidation,
  evidencePath: CrossDomainValidationEvidencePath,
): CrossDomainValidationValidation {
  return Object.freeze({
    valid: result.overallValidationState !== "INVALID",
    overallValidationState: result.overallValidationState,
    reasonCodes: [...reasonCodes],
    ownershipValid: details.every((detail) => detail.ownershipValid),
    tenantIsolationVerified: result.tenantIsolationVerified,
    governanceAligned: details.every((detail) => detail.governanceAligned),
    lineageContinuous: details.every((detail) => detail.lineageContinuous),
    replayContinuous: details.every((detail) => detail.replayContinuous),
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    approvalAbsent: boundary.approvalAbsent,
    rankingAbsent: boundary.rankingAbsent,
    prioritizationAbsent: boundary.prioritizationAbsent,
    scoringAbsent: boundary.scoringAbsent,
    resourceAllocationAbsent: boundary.resourceAllocationAbsent,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
    domainsEvaluated: DOMAIN_ORDER.length,
    validationsEvaluated: result.validationsEvaluated,
    governanceReferenceCount: evidencePath.governanceReferences.length,
    lineageReferenceCount: evidencePath.lineageReferences.length,
    replayReferenceCount: evidencePath.replayReferences.length,
    certificationReferenceCount: evidencePath.certificationReferences.length,
  });
}

export function buildCrossDomainValidationRequest(
  request: CrossDomainValidationRequest,
): CrossDomainValidationRequest {
  return requestCore(request);
}

export function sealCrossDomainValidationEngine(
  input: CrossDomainValidationInput,
): SealedCrossDomainValidationRecord {
  const reasons: CrossDomainValidationReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const completionReferencesValid = validateCompletionReferences(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const details = deriveDomainDetails(input);

  const selfValidations = details.map((detail) => buildValidationRecord(
    detail,
    detail,
    domainValidationState(detail, boundary),
  ));

  const detailMap = new Map(details.map((detail) => [detail.domain, detail]));
  const relationshipValidations = REQUIRED_RELATIONSHIPS.map(([sourceDomain, targetDomain]) => {
    const source = detailMap.get(sourceDomain)!;
    const target = detailMap.get(targetDomain)!;
    return buildValidationRecord(source, target, relationshipState(source, target, boundary));
  });

  const validations = Object.freeze([
    ...selfValidations,
    ...relationshipValidations,
  ]);

  const evidencePath = createEvidencePath(details, validations);
  const relationshipsValid = validateRequiredRelationships(validations, reasons);

  const tenantIsolationVerified = details.every((detail) => detail.tenantIsolationVerified);
  const ownershipValid = details.every((detail) => detail.ownershipValid);
  const governanceAligned = details.every((detail) => detail.governanceAligned);
  const lineageContinuous = details.every((detail) => detail.lineageContinuous);
  const replayContinuous = details.every((detail) => detail.replayContinuous);

  addReason(reasons, tenantIsolationVerified ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_VALIDATION_BLOCKED");
  addReason(reasons, ownershipValid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  addReason(reasons, governanceAligned ? "GOVERNANCE_ALIGNMENT_VALID" : "GOVERNANCE_CONFLICT_DETECTED");
  addReason(reasons, lineageContinuous ? "LINEAGE_CONTINUITY_VALID" : "LINEAGE_BREAK_DETECTED");
  addReason(reasons, replayContinuous ? "REPLAY_CONTINUITY_VALID" : "REPLAY_BREAK_DETECTED");

  const limitsValid = validateLimits(details, validations, evidencePath, reasons);
  addReason(reasons, "CROSS_DOMAIN_VALIDATION_IS_NOT_CONTROL");

  const validationHash = hashValue("cross-domain-validation-record", {
    request: requestCore(input.request),
    validations,
    evidencePath,
  });

  const result = buildResult(
    input.request,
    validations,
    tenantIsolationVerified,
    validationHash,
  );

  const hardInvalid = !requestValid
    || !sealedValid
    || !completionReferencesValid
    || !relationshipsValid
    || !tenantIsolationVerified
    || !ownershipValid
    || !governanceAligned
    || !lineageContinuous
    || !replayContinuous
    || boundary.invalidBoundary
    || !limitsValid;

  const finalResult = hardInvalid
    ? Object.freeze({
      ...result,
      overallValidationState: "INVALID" as const,
    })
    : result;

  const observability = buildObservability(finalResult);
  const validation = buildValidation(finalResult, reasons, details, boundary, evidencePath);

  return Object.freeze({
    result: finalResult,
    validations,
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    validationOnly: true,
    executionAuthorized: false,
    workflowRoutingAllowed: false,
    approvalAllowed: false,
    recommendationRankingAllowed: false,
    prioritizationAllowed: false,
    recommendationScoringAllowed: false,
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
