import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedUncertaintyTriggeredCautionRecord,
  UncertaintyTriggeredCautionContext,
  UncertaintyTriggeredCautionEvidencePath,
  UncertaintyTriggeredCautionInput,
  UncertaintyTriggeredCautionObservability,
  UncertaintyTriggeredCautionReasonCode,
  UncertaintyTriggeredCautionRequest,
  UncertaintyTriggeredCautionResult,
  UncertaintyTriggeredCautionValidation,
} from "./types";

export const MAX_CAUTION_ANALYSIS_DEPTH = 20;
export const MAX_UNCERTAINTY_ARTIFACTS = 5000;

const UNCERTAINTY_CONTEXTS: readonly UncertaintyTriggeredCautionContext[] = Object.freeze([
  "AUTHORITY",
  "FULL",
  "LINEAGE",
  "OWNERSHIP",
  "TOPOLOGY",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: UncertaintyTriggeredCautionReasonCode[], reason: UncertaintyTriggeredCautionReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashCautionValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: UncertaintyTriggeredCautionRequest): UncertaintyTriggeredCautionRequest {
  return Object.freeze({
    graphId: request.graphId,
    tenantId: request.tenantId,
    uncertaintyContext: request.uncertaintyContext,
    lineageReferences: normalizeStrings(request.lineageReferences),
    graphVersion: request.graphVersion,
  });
}

function collectLineage(input: Omit<UncertaintyTriggeredCautionInput, "request">): string[] {
  return normalizeStrings([
    ...input.intelligence.evidencePath.lineageReferences,
    ...input.oversight.evidencePath.lineageReferences,
    ...input.verification.verificationPath.lineageReferences,
    ...input.certification.evidenceChain.lineageReferences,
  ]);
}

function collectEvidenceHashes(input: UncertaintyTriggeredCautionInput): string[] {
  return normalizeStrings([
    input.intelligence.result.escalationEvidenceHash,
    input.oversight.result.oversightEvidenceHash,
    input.verification.result.verificationHash,
    input.certification.result.certificationHash,
  ]);
}

function collectEvidenceIds(input: UncertaintyTriggeredCautionInput): string[] {
  return normalizeStrings([
    ...input.intelligence.evidencePath.evidenceIds,
    ...input.oversight.evidencePath.evidenceIds,
    ...input.verification.verificationPath.artifactIds,
    ...input.certification.evidenceChain.evidenceIds,
  ]);
}

function projectEvidenceIds(context: UncertaintyTriggeredCautionContext, input: UncertaintyTriggeredCautionInput): string[] {
  switch (context) {
    case "OWNERSHIP":
      return normalizeStrings(
        input.certification.evidenceChain.evidenceIds.filter((id) =>
          input.verification.verificationPath.artifactIds.includes(id),
        ),
      );
    case "LINEAGE":
      return collectLineage({
        intelligence: input.intelligence,
        oversight: input.oversight,
        verification: input.verification,
        certification: input.certification,
        mutationSignalsDetected: input.mutationSignalsDetected,
        executionRequested: input.executionRequested,
        workflowRoutingRequested: input.workflowRoutingRequested,
        approvalCreationRequested: input.approvalCreationRequested,
        notificationDispatchRequested: input.notificationDispatchRequested,
        containmentActionRequested: input.containmentActionRequested,
        authorityExpansionRequested: input.authorityExpansionRequested,
      });
    case "TOPOLOGY":
      return normalizeStrings(
        input.verification.verificationPath.artifactIds.filter((id) =>
          input.intelligence.evidencePath.evidenceIds.includes(id),
        ),
      );
    case "AUTHORITY":
      return normalizeStrings(
        input.oversight.evidencePath.evidenceIds.filter((id) =>
          input.intelligence.evidencePath.evidenceIds.includes(id),
        ),
      );
    case "FULL":
      return collectEvidenceIds(input);
  }
}

function validateSealedArtifacts(input: UncertaintyTriggeredCautionInput, reasons: UncertaintyTriggeredCautionReasonCode[]): boolean {
  const intelligenceSealed = input.intelligence.sealed;
  const oversightSealed = input.oversight.sealed;
  const verificationSealed = input.verification.sealed;
  const certificationSealed = input.certification.sealed;
  addReason(reasons, intelligenceSealed ? "INTELLIGENCE_REQUIRED" : "INTELLIGENCE_UNSEALED");
  addReason(reasons, oversightSealed ? "OVERSIGHT_REQUIRED" : "OVERSIGHT_UNSEALED");
  addReason(reasons, verificationSealed ? "VERIFICATION_REQUIRED" : "VERIFICATION_UNSEALED");
  addReason(reasons, certificationSealed ? "CERTIFICATION_REQUIRED" : "CERTIFICATION_UNSEALED");
  return intelligenceSealed && oversightSealed && verificationSealed && certificationSealed;
}

function validateContext(request: UncertaintyTriggeredCautionRequest, reasons: UncertaintyTriggeredCautionReasonCode[]): boolean {
  const valid = UNCERTAINTY_CONTEXTS.includes(request.uncertaintyContext);
  addReason(reasons, valid ? "UNCERTAINTY_CONTEXT_VALID" : "UNCERTAINTY_CONTEXT_INVALID");
  return valid;
}

function validateIdentity(input: UncertaintyTriggeredCautionInput, reasons: UncertaintyTriggeredCautionReasonCode[]): boolean {
  const graphIdValid = input.request.graphId === input.intelligence.result.graphId
    && input.oversight.result.graphId === input.request.graphId
    && input.verification.result.graphId === input.request.graphId
    && input.certification.result.graphId === input.request.graphId;
  const versionValid = input.request.graphVersion === "decision-graph/v1";
  addReason(reasons, graphIdValid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  addReason(reasons, versionValid ? "GRAPH_VERSION_MATCHED" : "GRAPH_VERSION_MISMATCH");
  return graphIdValid && versionValid;
}

function validateTenantScope(input: UncertaintyTriggeredCautionInput, reasons: UncertaintyTriggeredCautionReasonCode[]): boolean {
  const valid = input.intelligence.result.tenantIsolationVerified
    && input.oversight.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: UncertaintyTriggeredCautionInput, reasons: UncertaintyTriggeredCautionReasonCode[]): boolean {
  const valid = input.certification.result.ownershipCertified && input.verification.result.ownershipIntegrity;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateLineage(input: UncertaintyTriggeredCautionInput, reasons: UncertaintyTriggeredCautionReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const required = collectLineage({
    intelligence: input.intelligence,
    oversight: input.oversight,
    verification: input.verification,
    certification: input.certification,
    mutationSignalsDetected: input.mutationSignalsDetected,
    executionRequested: input.executionRequested,
    workflowRoutingRequested: input.workflowRoutingRequested,
    approvalCreationRequested: input.approvalCreationRequested,
    notificationDispatchRequested: input.notificationDispatchRequested,
    containmentActionRequested: input.containmentActionRequested,
    authorityExpansionRequested: input.authorityExpansionRequested,
  });
  const valid = lineageReferences.length > 0
    && input.certification.result.lineageCertified
    && input.verification.result.lineageIntegrity
    && input.intelligence.result.lineageConcern === false
    && input.oversight.result.lineageConcern === false
    && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateEvidenceCompleteness(input: UncertaintyTriggeredCautionInput, reasons: UncertaintyTriggeredCautionReasonCode[]): boolean {
  const valid = input.intelligence.evidencePath.evidenceIds.length > 0
    && input.oversight.evidencePath.evidenceIds.length > 0
    && input.verification.verificationPath.artifactIds.length > 0
    && input.certification.evidenceChain.evidenceIds.length > 0;
  addReason(reasons, valid ? "EVIDENCE_COMPLETENESS_VALID" : "EVIDENCE_CHAIN_BROKEN");
  return valid;
}

function validateEvidenceHashes(input: UncertaintyTriggeredCautionInput, reasons: UncertaintyTriggeredCautionReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(input: UncertaintyTriggeredCautionInput, reasons: UncertaintyTriggeredCautionReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionRequested !== true
    && input.intelligence.validation.authorityBounded
    && input.oversight.validation.authorityBounded
    && input.verification.result.authorityBounded
    && input.certification.result.authorityBounded;
  const invalidBoundary = input.mutationSignalsDetected === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.approvalCreationRequested === true
    || input.notificationDispatchRequested === true
    || input.containmentActionRequested === true;
  addReason(reasons, input.mutationSignalsDetected === true ? "MUTATION_SIGNALS_DETECTED" : "MUTATION_SIGNALS_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.approvalCreationRequested === true ? "APPROVAL_CREATION_DETECTED" : "APPROVAL_CREATION_BLOCKED");
  addReason(reasons, input.notificationDispatchRequested === true ? "NOTIFICATION_DISPATCH_DETECTED" : "NOTIFICATION_DISPATCH_BLOCKED");
  addReason(reasons, input.containmentActionRequested === true ? "CONTAINMENT_ACTION_DETECTED" : "CONTAINMENT_ACTION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "UNCERTAINTY_LAYER_IS_NOT_EXECUTION");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function classifyCaution(
  uncertaintyDetected: boolean,
  evidenceQualityConcern: boolean,
  ambiguityDetected: boolean,
  authorityConcern: boolean,
  tenantIsolationVerified: boolean,
): UncertaintyTriggeredCautionResult["cautionState"] {
  if (authorityConcern || !tenantIsolationVerified || ambiguityDetected) return "HIGH_CAUTION";
  const count = [uncertaintyDetected, evidenceQualityConcern, ambiguityDetected].filter(Boolean).length;
  if (count >= 2) return "LIMITED";
  if (count === 1) return "CAUTION";
  return "NORMAL";
}

function validateLimits(path: UncertaintyTriggeredCautionEvidencePath, reasons: UncertaintyTriggeredCautionReasonCode[]): boolean {
  const depthValid = path.lineageReferences.length <= MAX_CAUTION_ANALYSIS_DEPTH;
  const artifactValid = path.evidenceIds.length <= MAX_UNCERTAINTY_ARTIFACTS;
  addReason(reasons, depthValid ? "ANALYSIS_DEPTH_VALID" : "ANALYSIS_DEPTH_EXCEEDED");
  addReason(reasons, artifactValid ? "UNCERTAINTY_ARTIFACT_LIMIT_VALID" : "UNCERTAINTY_ARTIFACT_LIMIT_EXCEEDED");
  return depthValid && artifactValid;
}

export function buildUncertaintyTriggeredCautionRequest(
  input: Omit<UncertaintyTriggeredCautionInput, "request"> & {
    uncertaintyContext?: UncertaintyTriggeredCautionContext;
    tenantId?: string;
    graphVersion?: string;
  },
): UncertaintyTriggeredCautionRequest {
  return Object.freeze({
    graphId: input.intelligence.result.graphId,
    tenantId: input.tenantId ?? "",
    uncertaintyContext: input.uncertaintyContext ?? "FULL",
    lineageReferences: collectLineage(input),
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  } as UncertaintyTriggeredCautionRequest);
}

export function createUncertaintyTriggeredCautionEvidencePath(
  input: UncertaintyTriggeredCautionInput,
): UncertaintyTriggeredCautionEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    context: request.uncertaintyContext,
    evidenceIds: Object.freeze(projectEvidenceIds(request.uncertaintyContext, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
    lineageReferences: Object.freeze(
      request.uncertaintyContext === "OWNERSHIP" || request.uncertaintyContext === "AUTHORITY"
        ? request.lineageReferences.slice(0, MAX_CAUTION_ANALYSIS_DEPTH)
        : request.lineageReferences,
    ),
  });
}

export function validateUncertaintyTriggeredCaution(
  input: UncertaintyTriggeredCautionInput,
): UncertaintyTriggeredCautionValidation {
  const reasons: UncertaintyTriggeredCautionReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const contextValid = validateContext(request, reasons);
  const identityValid = validateIdentity(normalizedInput, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const lineageValid = validateLineage(normalizedInput, reasons);
  const evidenceComplete = validateEvidenceCompleteness(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const evidencePath = createUncertaintyTriggeredCautionEvidencePath(normalizedInput);
  const limitsValid = validateLimits(evidencePath, reasons);

  const uncertaintyDetected = normalizedInput.intelligence.result.escalationClassification !== "NO_ESCALATION"
    || normalizedInput.oversight.result.oversightRequirement !== "NONE"
    || evidenceComplete === false;
  const evidenceQualityConcern = normalizedInput.intelligence.result.topologyConcern
    || normalizedInput.oversight.result.topologyConcern
    || normalizedInput.certification.result.certificationStatus === "CONDITIONAL_PASS";
  const ambiguityDetected = normalizedInput.intelligence.result.lineageConcern
    || normalizedInput.oversight.result.lineageConcern
    || lineageValid === false
    || evidenceComplete === false;
  const authorityConcern = !boundary.authorityBounded
    || normalizedInput.intelligence.result.authorityConcern
    || normalizedInput.oversight.result.authorityConcern;

  addReason(reasons, uncertaintyDetected ? "UNCERTAINTY_SIGNAL_DETECTED" : "UNCERTAINTY_SIGNAL_ABSENT");
  addReason(reasons, evidenceQualityConcern ? "EVIDENCE_QUALITY_DEGRADED" : "EVIDENCE_QUALITY_HEALTHY");
  addReason(reasons, ambiguityDetected ? "AMBIGUITY_DETECTED" : "AMBIGUITY_ABSENT");

  const cautionState = boundary.authorityBounded
    ? classifyCaution(
      uncertaintyDetected,
      evidenceQualityConcern,
      ambiguityDetected,
      authorityConcern,
      tenantIsolationVerified,
    )
    : "HIGH_CAUTION";

  const valid = sealedArtifacts
    && contextValid
    && identityValid
    && tenantIsolationVerified
    && ownershipValid
    && lineageValid
    && evidenceComplete
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    reasonCodes: normalizeStrings(reasons) as readonly UncertaintyTriggeredCautionReasonCode[],
    cautionState,
    uncertaintyDetected,
    evidenceQualityConcern,
    ambiguityDetected,
    authorityConcern,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    analyzedArtifactCount: evidencePath.evidenceIds.length,
  });
}

export function buildUncertaintyTriggeredCautionResult(
  input: UncertaintyTriggeredCautionInput,
): UncertaintyTriggeredCautionResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const validation = validateUncertaintyTriggeredCaution(normalizedInput);
  const evidencePath = createUncertaintyTriggeredCautionEvidencePath(normalizedInput);
  const cautionEvidenceHash = hashCautionValue("uncertainty-triggered-caution-layer", {
    request,
    evidencePath,
    cautionState: validation.cautionState,
    uncertaintyDetected: validation.uncertaintyDetected,
    evidenceQualityConcern: validation.evidenceQualityConcern,
    ambiguityDetected: validation.ambiguityDetected,
    authorityConcern: validation.authorityConcern,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    graphId: request.graphId,
    cautionState: validation.cautionState,
    uncertaintyDetected: validation.uncertaintyDetected,
    evidenceQualityConcern: validation.evidenceQualityConcern,
    ambiguityDetected: validation.ambiguityDetected,
    authorityConcern: validation.authorityConcern,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    cautionEvidenceHash,
    deterministic: true,
  });
}

export function buildUncertaintyTriggeredCautionObservability(
  result: UncertaintyTriggeredCautionResult,
): UncertaintyTriggeredCautionObservability {
  return Object.freeze({
    graphId: result.graphId,
    cautionState: result.cautionState,
    uncertaintyDetected: result.uncertaintyDetected,
    evidenceQualityConcern: result.evidenceQualityConcern,
    ambiguityDetected: result.ambiguityDetected,
    cautionEvidenceHash: result.cautionEvidenceHash,
  });
}

export function sealUncertaintyTriggeredCaution(
  input: UncertaintyTriggeredCautionInput,
): SealedUncertaintyTriggeredCautionRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createUncertaintyTriggeredCautionEvidencePath(normalizedInput);
  const validation = validateUncertaintyTriggeredCaution(normalizedInput);
  const result = buildUncertaintyTriggeredCautionResult(normalizedInput);
  const observability = buildUncertaintyTriggeredCautionObservability(result);

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    cautionOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    approvalCreationAllowed: false as const,
    notificationDispatchAllowed: false as const,
    containmentActionAllowed: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const UncertaintyTriggeredCautionValidator = Object.freeze({
  validate: validateUncertaintyTriggeredCaution,
});

export const UncertaintyTriggeredCautionLayer = Object.freeze({
  buildRequest: buildUncertaintyTriggeredCautionRequest,
  createEvidencePath: createUncertaintyTriggeredCautionEvidencePath,
  buildResult: buildUncertaintyTriggeredCautionResult,
  seal: sealUncertaintyTriggeredCaution,
});

export const UncertaintyTriggeredCautionObservabilityService = Object.freeze({
  build: buildUncertaintyTriggeredCautionObservability,
});
