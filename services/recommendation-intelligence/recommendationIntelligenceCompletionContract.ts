import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  DomainCompletionState,
  RecommendationIntelligenceCompletionContract,
  RecommendationIntelligenceCompletionEvidencePath,
  RecommendationIntelligenceCompletionInput,
  RecommendationIntelligenceCompletionObservability,
  RecommendationIntelligenceCompletionReasonCode,
  RecommendationIntelligenceCompletionRequest,
  RecommendationIntelligenceCompletionResult,
  RecommendationIntelligenceCompletionValidation,
  RecommendationIntelligenceDomain,
  SealedRecommendationIntelligenceCompletionRecord,
} from "./types";

const MAX_DOMAINS = 14;
const MAX_COMPLETION_RECORDS = 50_000;
const MAX_GOVERNANCE_REFERENCES = 10_000;
const MAX_LINEAGE_REFERENCES = 10_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_CERTIFICATION_REFERENCES = 10_000;

const DOMAIN_ORDER: readonly RecommendationIntelligenceDomain[] = Object.freeze([
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

type ReferenceBundle = Readonly<{
  governanceReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  certificationReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

type DomainSignals = Readonly<{
  domain: RecommendationIntelligenceDomain;
  implemented: boolean;
  observabilityAvailable: boolean;
  observabilityLimited: boolean;
  governancePreserved: boolean;
  replayAvailable: boolean;
  replayLimited: boolean;
  certificationPresent: boolean;
  evidencePresent: boolean;
  lineagePresent: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  references: ReferenceBundle;
}>;

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

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(
  reasons: RecommendationIntelligenceCompletionReasonCode[],
  reason: RecommendationIntelligenceCompletionReasonCode,
): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(
  request: RecommendationIntelligenceCompletionRequest,
): RecommendationIntelligenceCompletionRequest {
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

function orderedBundles(input: RecommendationIntelligenceCompletionInput): Record<string, unknown>[] {
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

function stateIsComplete(state: string): boolean {
  return [
    "ESTABLISHED",
    "READY",
    "ALIGNED",
    "READY_FOR_REVIEW",
    "REPLAYABLE",
    "PASS",
    "VISIBLE",
    "EXPORTED",
    "AVAILABLE",
    "HEALTHY",
    "ANALYZED",
    "CERTIFIED",
    "BOUND",
    "SCOPED",
    "CONTAINED",
    "VALID",
    "RECONSTRUCTED",
  ].includes(state);
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
    ? lineage?.ancestryChain.map((node) => (
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

function collectGenericReferences(records: readonly unknown[], field: string): string[] {
  return normalizeStrings(records.flatMap((record) => stringArrayProp(evidenceRecord(record), field)));
}

function collectGenericEvidenceHashes(records: readonly unknown[]): string[] {
  return normalizeStrings(records.flatMap((record) => stringArrayProp(evidenceRecord(record), "evidenceHashes")));
}

function domainCompletionState(signals: DomainSignals): DomainCompletionState {
  const governancePresent = signals.references.governanceReferences.length > 0;
  const lineagePresent = signals.references.lineageReferences.length > 0;
  const replayPresent = signals.references.replayReferences.length > 0;
  const certificationPresent = signals.references.certificationReferences.length > 0;
  if (!signals.ownershipValid || !signals.tenantIsolationVerified) return "INCOMPLETE";
  if (!governancePresent || !lineagePresent || !replayPresent || !signals.evidencePresent) return "UNKNOWN";
  if (!signals.implemented || !signals.certificationPresent || !certificationPresent) return "INCOMPLETE";
  if (signals.replayLimited || signals.observabilityLimited) return "PARTIAL";
  if (signals.governancePreserved && signals.replayAvailable && signals.observabilityAvailable) return "COMPLETE";
  return "PARTIAL";
}

function aggregateReference(referenceType: string, refs: readonly string[]): string {
  if (refs.length === 0) return "";
  return `${referenceType}:${hashValue(`recommendation-intelligence-${referenceType}`, refs)}`;
}

function buildContract(
  tenantId: string,
  signals: DomainSignals,
): RecommendationIntelligenceCompletionContract {
  const completionState = domainCompletionState(signals);
  const governanceReference = aggregateReference("governance", signals.references.governanceReferences);
  const lineageReference = aggregateReference("lineage", signals.references.lineageReferences);
  const replayReference = aggregateReference("replay", signals.references.replayReferences);
  const certificationReference = aggregateReference("certification", signals.references.certificationReferences);
  const completionCore = Object.freeze({
    tenantId,
    domain: signals.domain,
    completionState,
    governanceReference,
    lineageReference,
    replayReference,
    certificationReference,
  });
  const completionHash = hashValue("recommendation-intelligence-completion-contract", completionCore);
  const completionId = hashValue("recommendation-intelligence-completion-id", {
    domain: signals.domain,
    tenantId,
    completionHash,
  });
  return Object.freeze({
    completionId,
    ...completionCore,
    completionHash,
  });
}

function memorySignals(input: RecommendationIntelligenceCompletionInput): DomainSignals {
  const bundles = orderedBundles(input);
  const governanceReferences = normalizeStrings(bundles.flatMap(bundleGovernanceReferences));
  const lineageReferences = normalizeStrings(bundles.flatMap(bundleLineageReferences));
  const replayReferences = normalizeStrings(bundles.flatMap(bundleReplayReferences));
  const certificationReferences = normalizeStrings(
    bundles.map((bundle) => stringProp(resultRecord(bundle.certification), "certificationHash")),
  );
  const evidenceHashes = normalizeStrings(bundles.flatMap(bundleEvidenceHashes));
  const replayLimited = bundles.some((bundle) => stateIsPartial(stringProp(resultRecord(bundle.replay), "replayState")))
    || bundles.some((bundle) => stateIsPartial(stringProp(resultRecord(bundle.lineage), "reconstructionState")));
  const observabilityLimited = bundles.some((bundle) => stateIsPartial(stringProp(resultRecord(bundle.observability), "observabilityState")));
  return Object.freeze({
    domain: "MEMORY",
    implemented: bundles.length > 0,
    observabilityAvailable: !observabilityLimited,
    observabilityLimited,
    governancePreserved: bundles.every((bundle) => stateIsComplete(stringProp(resultRecord(bundle.governanceCertification), "certificationState"))),
    replayAvailable: bundles.every((bundle) => stateIsComplete(stringProp(resultRecord(bundle.replay), "replayState"))),
    replayLimited,
    certificationPresent: certificationReferences.every((reference) => reference.length > 0),
    evidencePresent: evidenceHashes.length > 0,
    lineagePresent: lineageReferences.length > 0,
    ownershipValid: bundles.every((bundle) => (
      stringProp(bundle.ownershipEvidence as Record<string, unknown>, "recommendationId") === recommendationId(bundle)
    )),
    tenantIsolationVerified: bundles.every((bundle) => (
      stringProp((bundle.ledger as Record<string, unknown>).entry as Record<string, unknown>, "tenantId") === input.request.tenantId
      && stringProp(bundle.ownershipEvidence as Record<string, unknown>, "tenantId") === input.request.tenantId
      && stringProp(bundle.replayEvidence as Record<string, unknown>, "tenantId") === input.request.tenantId
    )),
    references: Object.freeze({
      governanceReferences,
      lineageReferences,
      replayReferences,
      certificationReferences,
      evidenceHashes,
    }),
  });
}

function observabilitySignals(input: RecommendationIntelligenceCompletionInput): DomainSignals {
  const bundles = orderedBundles(input);
  const governanceReferences = normalizeStrings(bundles.flatMap(bundleGovernanceReferences));
  const lineageReferences = normalizeStrings(bundles.flatMap(bundleLineageReferences));
  const replayReferences = normalizeStrings(bundles.flatMap(bundleReplayReferences));
  const certificationReferences = normalizeStrings(
    bundles.map((bundle) => stringProp(resultRecord(bundle.observabilityCertification), "certificationHash")),
  );
  const evidenceHashes = normalizeStrings(bundles.flatMap(bundleEvidenceHashes));
  const observabilityLimited = bundles.some((bundle) => stateIsPartial(stringProp(resultRecord(bundle.observability), "observabilityState")))
    || bundles.some((bundle) => stateIsPartial(stringProp(resultRecord(bundle.visibility), "visibilityState")))
    || bundles.some((bundle) => stateIsPartial(stringProp(resultRecord(bundle.audit), "exportState")));
  return Object.freeze({
    domain: "OBSERVABILITY",
    implemented: bundles.length > 0,
    observabilityAvailable: !observabilityLimited
      && bundles.every((bundle) => stateIsComplete(stringProp(resultRecord(bundle.observability), "observabilityState"))),
    observabilityLimited,
    governancePreserved: bundles.every((bundle) => stateIsComplete(stringProp(resultRecord(bundle.governanceCertification), "certificationState"))),
    replayAvailable: bundles.every((bundle) => boolProp(resultRecord(bundle.observability), "replayVisible")),
    replayLimited: bundles.some((bundle) => !boolProp(resultRecord(bundle.observability), "replayVisible")),
    certificationPresent: certificationReferences.every((reference) => reference.length > 0),
    evidencePresent: evidenceHashes.length > 0,
    lineagePresent: lineageReferences.length > 0,
    ownershipValid: bundles.every((bundle) => (
      stringProp(bundle.ownershipEvidence as Record<string, unknown>, "recommendationId") === recommendationId(bundle)
    )),
    tenantIsolationVerified: bundles.every((bundle) => (
      stringProp(bundle.ownershipEvidence as Record<string, unknown>, "tenantId") === input.request.tenantId
    )),
    references: Object.freeze({
      governanceReferences,
      lineageReferences,
      replayReferences,
      certificationReferences,
      evidenceHashes,
    }),
  });
}

function governanceSignals(input: RecommendationIntelligenceCompletionInput): DomainSignals {
  const bundles = orderedBundles(input);
  const governanceReferences = normalizeStrings(bundles.flatMap(bundleGovernanceReferences));
  const lineageReferences = normalizeStrings(bundles.flatMap(bundleLineageReferences));
  const replayReferences = normalizeStrings(bundles.flatMap(bundleReplayReferences));
  const certificationReferences = normalizeStrings(
    bundles.map((bundle) => stringProp(resultRecord(bundle.governanceCertification), "certificationHash")),
  );
  const evidenceHashes = normalizeStrings(bundles.flatMap(bundleEvidenceHashes));
  const observabilityLimited = bundles.some((bundle) => !stateIsComplete(stringProp(resultRecord(bundle.policyVisibility), "visibilityState")));
  const replayLimited = bundles.some((bundle) => stateIsPartial(stringProp(resultRecord(bundle.governanceReplay), "replayState")));
  return Object.freeze({
    domain: "GOVERNANCE",
    implemented: bundles.length > 0,
    observabilityAvailable: !observabilityLimited,
    observabilityLimited,
    governancePreserved: bundles.every((bundle) => stateIsComplete(stringProp(resultRecord(bundle.governanceCertification), "certificationState"))),
    replayAvailable: bundles.every((bundle) => stateIsComplete(stringProp(resultRecord(bundle.governanceReplay), "replayState"))),
    replayLimited,
    certificationPresent: certificationReferences.every((reference) => reference.length > 0),
    evidencePresent: evidenceHashes.length > 0,
    lineagePresent: lineageReferences.length > 0,
    ownershipValid: bundles.every((bundle) => (
      stringProp(bundle.ownershipEvidence as Record<string, unknown>, "recommendationId") === recommendationId(bundle)
    )),
    tenantIsolationVerified: bundles.every((bundle) => (
      stringProp(bundle.governanceReferences as Record<string, unknown>, "tenantId") === input.request.tenantId
    )),
    references: Object.freeze({
      governanceReferences,
      lineageReferences,
      replayReferences,
      certificationReferences,
      evidenceHashes,
    }),
  });
}

function readinessSignals(input: RecommendationIntelligenceCompletionInput): DomainSignals {
  const bundles = orderedBundles(input);
  const governanceReferences = normalizeStrings(bundles.flatMap(bundleGovernanceReferences));
  const lineageReferences = normalizeStrings(bundles.flatMap(bundleLineageReferences));
  const replayReferences = normalizeStrings(bundles.flatMap(bundleReplayReferences));
  const certificationReferences = normalizeStrings(
    bundles.map((bundle) => stringProp(resultRecord(bundle.readinessCertification), "certificationHash")),
  );
  const evidenceHashes = normalizeStrings(bundles.flatMap(bundleEvidenceHashes));
  const observabilityLimited = bundles.some((bundle) => stateIsPartial(stringProp(resultRecord(bundle.readiness), "readinessState")))
    || bundles.some((bundle) => stateIsPartial(stringProp(resultRecord(bundle.reviewPacket), "packetState")));
  const replayLimited = bundles.some((bundle) => stateIsPartial(stringProp(resultRecord(bundle.replayFramework), "replayState")));
  return Object.freeze({
    domain: "READINESS",
    implemented: bundles.length > 0,
    observabilityAvailable: !observabilityLimited,
    observabilityLimited,
    governancePreserved: bundles.every((bundle) => boolProp(resultRecord(bundle.readinessCertification), "governanceCertified") || stateIsComplete(stringProp(resultRecord(bundle.readinessCertification), "certificationState"))),
    replayAvailable: bundles.every((bundle) => stateIsComplete(stringProp(resultRecord(bundle.replayFramework), "replayState"))),
    replayLimited,
    certificationPresent: certificationReferences.every((reference) => reference.length > 0),
    evidencePresent: evidenceHashes.length > 0,
    lineagePresent: lineageReferences.length > 0,
    ownershipValid: bundles.every((bundle) => (
      stringProp(bundle.ownershipEvidence as Record<string, unknown>, "recommendationId") === recommendationId(bundle)
    )),
    tenantIsolationVerified: bundles.every((bundle) => (
      stringProp(bundle.ownershipEvidence as Record<string, unknown>, "tenantId") === input.request.tenantId
    )),
    references: Object.freeze({
      governanceReferences,
      lineageReferences,
      replayReferences,
      certificationReferences,
      evidenceHashes,
    }),
  });
}

function genericDomainSignals(
  domain: RecommendationIntelligenceDomain,
  foundation: unknown,
  replay: unknown,
  certification: unknown,
  stateKey: string,
  foundationHashKey: string,
  observabilityFlagPath: "validation" | "result" = "result",
): DomainSignals {
  const foundationResult = resultRecord(foundation);
  const replayResult = resultRecord(replay);
  const certificationResult = resultRecord(certification);
  const foundationEvidence = evidenceRecord(foundation);
  const replayEvidence = evidenceRecord(replay);
  const certificationEvidence = evidenceRecord(certification);
  const certificationValidation = validationRecord(certification);
  const observabilityCertified = observabilityFlagPath === "validation"
    ? boolProp(certificationValidation, "observabilityPreserved")
    : !("observabilityCertified" in certificationResult) || boolProp(certificationResult, "observabilityCertified");
  const replayState = stringProp(replayResult, "replayState");
  const foundationState = stringProp(foundationResult, stateKey);
  const governanceCertified = !("governanceCertified" in certificationResult) || boolProp(certificationResult, "governanceCertified");
  return Object.freeze({
    domain,
    implemented: stringProp(foundationResult, foundationHashKey).length > 0,
    observabilityAvailable: observabilityCertified && !stateIsPartial(foundationState),
    observabilityLimited: !observabilityCertified || stateIsPartial(foundationState),
    governancePreserved: governanceCertified,
    replayAvailable: replayState === "REPLAYABLE",
    replayLimited: replayState === "LIMITED",
    certificationPresent: stringProp(certificationResult, "certificationHash").length > 0,
    evidencePresent: (
      stringArrayProp(foundationEvidence, "evidenceHashes").length > 0
      || stringArrayProp(replayEvidence, "evidenceHashes").length > 0
      || stringArrayProp(certificationEvidence, "evidenceHashes").length > 0
    ),
    lineagePresent: normalizeStrings([
      ...stringArrayProp(foundationEvidence, "lineageReferences"),
      ...stringArrayProp(replayEvidence, "lineageReferences"),
      ...stringArrayProp(certificationEvidence, "lineageReferences"),
    ]).length > 0,
    ownershipValid: boolProp(validationRecord(foundation), "ownershipValid") !== false,
    tenantIsolationVerified: boolProp(foundationResult, "tenantIsolationVerified")
      && boolProp(replayResult, "tenantIsolationVerified")
      && boolProp(certificationResult, "tenantIsolationVerified"),
    references: Object.freeze({
      governanceReferences: normalizeStrings([
        ...stringArrayProp(foundationEvidence, "governanceReferences"),
        ...stringArrayProp(replayEvidence, "governanceReferences"),
        ...stringArrayProp(certificationEvidence, "governanceReferences"),
      ]),
      lineageReferences: normalizeStrings([
        ...stringArrayProp(foundationEvidence, "lineageReferences"),
        ...stringArrayProp(replayEvidence, "lineageReferences"),
        ...stringArrayProp(certificationEvidence, "lineageReferences"),
      ]),
      replayReferences: normalizeStrings([
        ...stringArrayProp(foundationEvidence, "replayReferences"),
        ...stringArrayProp(replayEvidence, "replayReferences"),
        ...stringArrayProp(certificationEvidence, "replayReferences"),
      ]),
      certificationReferences: normalizeStrings([
        stringProp(certificationResult, "certificationHash"),
      ]),
      evidenceHashes: normalizeStrings([
        stringProp(foundationResult, foundationHashKey),
        stringProp(replayResult, "replayHash"),
        stringProp(replayResult, "reconstructionHash"),
        stringProp(certificationResult, "certificationHash"),
        ...collectGenericEvidenceHashes([foundation, replay, certification]),
      ]),
    }),
  });
}

function collectAllRecords(input: RecommendationIntelligenceCompletionInput): Record<string, unknown>[] {
  return [
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

function validateSealedArtifacts(
  input: RecommendationIntelligenceCompletionInput,
  reasons: RecommendationIntelligenceCompletionReasonCode[],
): boolean {
  const sealed = collectAllRecords(input).every((record) => (record as Record<string, unknown>).sealed === true);
  addReason(reasons, sealed ? "ARTIFACTS_SEALED" : "ARTIFACT_UNSEALED");
  return sealed;
}

function validateTenantId(
  request: RecommendationIntelligenceCompletionRequest,
  reasons: RecommendationIntelligenceCompletionReasonCode[],
): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateRepresentation(
  contracts: readonly RecommendationIntelligenceCompletionContract[],
  reasons: RecommendationIntelligenceCompletionReasonCode[],
): boolean {
  const represented = contracts.length === DOMAIN_ORDER.length
    && DOMAIN_ORDER.every((domain, index) => contracts[index]?.domain === domain);
  addReason(reasons, represented ? "ALL_DOMAINS_REPRESENTED" : "DOMAIN_REPRESENTATION_INCOMPLETE");
  return represented;
}

function validateTenantScope(
  signals: readonly DomainSignals[],
  reasons: RecommendationIntelligenceCompletionReasonCode[],
): boolean {
  const valid = signals.every((signal) => signal.tenantIsolationVerified);
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_COMPLETION_BLOCKED");
  return valid;
}

function validateOwnership(
  signals: readonly DomainSignals[],
  reasons: RecommendationIntelligenceCompletionReasonCode[],
): boolean {
  const valid = signals.every((signal) => signal.ownershipValid);
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateReferencePresence(
  evidencePath: RecommendationIntelligenceCompletionEvidencePath,
  reasons: RecommendationIntelligenceCompletionReasonCode[],
): void {
  addReason(reasons, evidencePath.governanceReferences.length > 0 ? "GOVERNANCE_REFERENCES_PRESENT" : "GOVERNANCE_REFERENCES_MISSING");
  addReason(reasons, evidencePath.lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, evidencePath.replayReferences.length > 0 ? "REPLAY_REFERENCES_PRESENT" : "REPLAY_REFERENCES_MISSING");
  addReason(reasons, evidencePath.certificationReferences.length > 0 ? "CERTIFICATION_REFERENCES_PRESENT" : "CERTIFICATION_REFERENCES_MISSING");
}

function validateBoundary(
  input: RecommendationIntelligenceCompletionInput,
  reasons: RecommendationIntelligenceCompletionReasonCode[],
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
  addReason(reasons, input.completionMutationAttempted === true ? "COMPLETION_MUTATION_DETECTED" : "COMPLETION_MUTATION_BLOCKED");
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
      || input.completionMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createRecommendationIntelligenceCompletionEvidencePath(
  contracts: readonly RecommendationIntelligenceCompletionContract[],
  signals: readonly DomainSignals[],
): RecommendationIntelligenceCompletionEvidencePath {
  return Object.freeze({
    domains: DOMAIN_ORDER,
    governanceReferences: normalizeStrings(signals.flatMap((signal) => signal.references.governanceReferences)),
    lineageReferences: normalizeStrings(signals.flatMap((signal) => signal.references.lineageReferences)),
    replayReferences: normalizeStrings(signals.flatMap((signal) => signal.references.replayReferences)),
    certificationReferences: normalizeStrings(signals.flatMap((signal) => signal.references.certificationReferences)),
    evidenceHashes: normalizeStrings([
      ...contracts.map((contract) => contract.completionHash),
      ...signals.flatMap((signal) => signal.references.evidenceHashes),
    ]),
  });
}

function validateLimits(
  contracts: readonly RecommendationIntelligenceCompletionContract[],
  evidencePath: RecommendationIntelligenceCompletionEvidencePath,
  reasons: RecommendationIntelligenceCompletionReasonCode[],
): boolean {
  const valid = contracts.length <= MAX_DOMAINS
    && contracts.length <= MAX_COMPLETION_RECORDS
    && evidencePath.governanceReferences.length <= MAX_GOVERNANCE_REFERENCES
    && evidencePath.lineageReferences.length <= MAX_LINEAGE_REFERENCES
    && evidencePath.replayReferences.length <= MAX_REPLAY_REFERENCES
    && evidencePath.certificationReferences.length <= MAX_CERTIFICATION_REFERENCES;
  addReason(reasons, contracts.length <= MAX_DOMAINS ? "DOMAIN_LIMIT_VALID" : "DOMAIN_LIMIT_EXCEEDED");
  addReason(reasons, contracts.length <= MAX_COMPLETION_RECORDS ? "COMPLETION_RECORD_LIMIT_VALID" : "COMPLETION_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.governanceReferences.length <= MAX_GOVERNANCE_REFERENCES ? "GOVERNANCE_REFERENCE_LIMIT_VALID" : "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.lineageReferences.length <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.replayReferences.length <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidencePath.certificationReferences.length <= MAX_CERTIFICATION_REFERENCES ? "CERTIFICATION_REFERENCE_LIMIT_VALID" : "CERTIFICATION_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function overallCompletionState(contracts: readonly RecommendationIntelligenceCompletionContract[]): DomainCompletionState {
  if (contracts.some((contract) => contract.completionState === "INCOMPLETE")) return "INCOMPLETE";
  if (contracts.some((contract) => contract.completionState === "UNKNOWN")) return "UNKNOWN";
  if (contracts.some((contract) => contract.completionState === "PARTIAL")) return "PARTIAL";
  return "COMPLETE";
}

function buildResult(
  request: RecommendationIntelligenceCompletionRequest,
  contracts: readonly RecommendationIntelligenceCompletionContract[],
  tenantIsolationVerified: boolean,
  completionHash: string,
): RecommendationIntelligenceCompletionResult {
  const completeDomains = contracts.filter((contract) => contract.completionState === "COMPLETE").length;
  const partialDomains = contracts.filter((contract) => contract.completionState === "PARTIAL").length;
  const incompleteDomains = contracts.filter((contract) => contract.completionState === "INCOMPLETE").length;
  const unknownDomains = contracts.filter((contract) => contract.completionState === "UNKNOWN").length;
  return Object.freeze({
    tenantId: request.tenantId,
    overallCompletionState: overallCompletionState(contracts),
    domainsEvaluated: contracts.length,
    completeDomains,
    partialDomains,
    incompleteDomains,
    unknownDomains,
    tenantIsolationVerified,
    completionHash,
    deterministic: true,
  });
}

function buildObservability(
  result: RecommendationIntelligenceCompletionResult,
): RecommendationIntelligenceCompletionObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    overallCompletionState: result.overallCompletionState,
    domainsEvaluated: result.domainsEvaluated,
    completeDomains: result.completeDomains,
    partialDomains: result.partialDomains,
    incompleteDomains: result.incompleteDomains,
    unknownDomains: result.unknownDomains,
    completionHash: result.completionHash,
  });
}

function buildValidation(
  result: RecommendationIntelligenceCompletionResult,
  reasonCodes: readonly RecommendationIntelligenceCompletionReasonCode[],
  ownershipValid: boolean,
  boundary: BoundaryValidation,
  evidencePath: RecommendationIntelligenceCompletionEvidencePath,
): RecommendationIntelligenceCompletionValidation {
  return Object.freeze({
    valid: result.overallCompletionState !== "INCOMPLETE",
    overallCompletionState: result.overallCompletionState,
    reasonCodes: [...reasonCodes],
    ownershipValid,
    tenantIsolationVerified: result.tenantIsolationVerified,
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
    domainsEvaluated: result.domainsEvaluated,
    governanceReferenceCount: evidencePath.governanceReferences.length,
    lineageReferenceCount: evidencePath.lineageReferences.length,
    replayReferenceCount: evidencePath.replayReferences.length,
    certificationReferenceCount: evidencePath.certificationReferences.length,
  });
}

export function buildRecommendationIntelligenceCompletionRequest(
  request: RecommendationIntelligenceCompletionRequest,
): RecommendationIntelligenceCompletionRequest {
  return requestCore(request);
}

export function sealRecommendationIntelligenceCompletionContract(
  input: RecommendationIntelligenceCompletionInput,
): SealedRecommendationIntelligenceCompletionRecord {
  const reasons: RecommendationIntelligenceCompletionReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);

  const signals = Object.freeze([
    memorySignals(input),
    observabilitySignals(input),
    governanceSignals(input),
    readinessSignals(input),
    genericDomainSignals("PORTFOLIO", input.portfolio, input.portfolioReplay, input.portfolioCertification, "portfolioState", "portfolioHash", "validation"),
    genericDomainSignals("DEPENDENCY", input.dependencyFoundation, input.dependencyReplay, input.dependencyCertification, "dependencyState", "dependencyGraphHash"),
    genericDomainSignals("IMPACT", input.impactFoundation, input.impactReplay, input.impactCertification, "impactState", "impactGraphHash"),
    genericDomainSignals("DRIFT", input.driftFoundation, input.driftReplay, input.driftCertification, "driftState", "driftGraphHash"),
    genericDomainSignals("TRUST", input.trustFoundation, input.trustReplay, input.trustCertification, "trustState", "trustGraphHash"),
    genericDomainSignals("RESILIENCE", input.resilienceFoundation, input.resilienceReplay, input.resilienceCertification, "resilienceState", "resilienceGraphHash"),
    genericDomainSignals("DEPENDENCY_RISK", input.dependencyRiskFoundation, input.dependencyRiskReplay, input.dependencyRiskCertification, "dependencyRiskState", "dependencyRiskGraphHash"),
    genericDomainSignals("OPPORTUNITY", input.opportunityFoundation, input.opportunityReplay, input.opportunityCertification, "opportunityState", "opportunityGraphHash"),
    genericDomainSignals("CONSTRAINT", input.constraintFoundation, input.constraintReplay, input.constraintCertification, "constraintState", "constraintGraphHash"),
    genericDomainSignals("DEPENDENCY_HEALTH", input.dependencyHealthFoundation, input.dependencyHealthReplay, input.dependencyHealthCertification, "overallHealthState", "healthGraphHash"),
  ] satisfies readonly DomainSignals[]);

  const contracts = Object.freeze(signals.map((signal) => buildContract(input.request.tenantId, signal)));
  const representationValid = validateRepresentation(contracts, reasons);
  const tenantIsolationVerified = validateTenantScope(signals, reasons);
  const ownershipValid = validateOwnership(signals, reasons);
  const evidencePath = createRecommendationIntelligenceCompletionEvidencePath(contracts, signals);
  validateReferencePresence(evidencePath, reasons);
  const boundary = validateBoundary(input, reasons);
  const limitsValid = validateLimits(contracts, evidencePath, reasons);
  addReason(reasons, "RECOMMENDATION_INTELLIGENCE_COMPLETION_IS_NOT_CONTROL");

  const completionHash = hashValue("recommendation-intelligence-completion-record", {
    request: requestCore(input.request),
    contracts,
    evidencePath,
  });

  const result = buildResult(
    input.request,
    contracts,
    tenantIsolationVerified,
    completionHash,
  );

  const hardInvalid = !requestValid
    || !sealedValid
    || !representationValid
    || !tenantIsolationVerified
    || !ownershipValid
    || boundary.invalidBoundary
    || !limitsValid;

  const finalResult = hardInvalid
    ? Object.freeze({
      ...result,
      overallCompletionState: "INCOMPLETE" as const,
    })
    : result;

  const observability = buildObservability(finalResult);
  const validation = buildValidation(finalResult, reasons, ownershipValid, boundary, evidencePath);

  return Object.freeze({
    result: finalResult,
    contracts,
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    completionOnly: true,
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
