import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  OversightRequirementContext,
  OversightRequirementEvidencePath,
  OversightRequirementInput,
  OversightRequirementObservability,
  OversightRequirementReasonCode,
  OversightRequirementRequest,
  OversightRequirementResult,
  OversightRequirementValidation,
  SealedOversightRequirementRecord,
} from "./types";

export const MAX_OVERSIGHT_ANALYSIS_DEPTH = 20;
export const MAX_OVERSIGHT_ARTIFACTS = 5000;

const OVERSIGHT_CONTEXTS: readonly OversightRequirementContext[] = Object.freeze([
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

function addReason(reasons: OversightRequirementReasonCode[], reason: OversightRequirementReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashOversightValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: OversightRequirementRequest): OversightRequirementRequest {
  return Object.freeze({
    graphId: request.graphId,
    tenantId: request.tenantId,
    oversightContext: request.oversightContext,
    lineageReferences: normalizeStrings(request.lineageReferences),
    graphVersion: request.graphVersion,
  });
}

function collectLineage(input: Omit<OversightRequirementInput, "request">): string[] {
  return normalizeStrings([
    ...input.intelligence.evidencePath.lineageReferences,
    ...input.certification.evidenceChain.lineageReferences,
    ...input.verification.verificationPath.lineageReferences,
  ]);
}

function collectEvidenceHashes(input: OversightRequirementInput): string[] {
  return normalizeStrings([
    input.intelligence.result.escalationEvidenceHash,
    input.certification.result.certificationHash,
    input.verification.result.verificationHash,
  ]);
}

function collectEvidenceIds(input: OversightRequirementInput): string[] {
  return normalizeStrings([
    ...input.intelligence.evidencePath.evidenceIds,
    ...input.certification.evidenceChain.evidenceIds,
    ...input.verification.verificationPath.artifactIds,
  ]);
}

function projectEvidenceIds(context: OversightRequirementContext, input: OversightRequirementInput): string[] {
  switch (context) {
    case "OWNERSHIP":
      return normalizeStrings(
        input.intelligence.evidencePath.evidenceIds.filter((id) =>
          input.verification.verificationPath.artifactIds.includes(id),
        ),
      );
    case "LINEAGE":
      return collectLineage({
        intelligence: input.intelligence,
        certification: input.certification,
        verification: input.verification,
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
        input.certification.evidenceChain.evidenceIds.filter((id) =>
          input.intelligence.evidencePath.evidenceIds.includes(id),
        ),
      );
    case "FULL":
      return collectEvidenceIds(input);
  }
}

function validateSealedArtifacts(input: OversightRequirementInput, reasons: OversightRequirementReasonCode[]): boolean {
  const intelligenceSealed = input.intelligence.sealed;
  const certificationSealed = input.certification.sealed;
  const verificationSealed = input.verification.sealed;
  addReason(reasons, intelligenceSealed ? "INTELLIGENCE_REQUIRED" : "INTELLIGENCE_UNSEALED");
  addReason(reasons, certificationSealed ? "CERTIFICATION_REQUIRED" : "CERTIFICATION_UNSEALED");
  addReason(reasons, verificationSealed ? "VERIFICATION_REQUIRED" : "VERIFICATION_UNSEALED");
  return intelligenceSealed && certificationSealed && verificationSealed;
}

function validateContext(request: OversightRequirementRequest, reasons: OversightRequirementReasonCode[]): boolean {
  const valid = OVERSIGHT_CONTEXTS.includes(request.oversightContext);
  addReason(reasons, valid ? "OVERSIGHT_CONTEXT_VALID" : "OVERSIGHT_CONTEXT_INVALID");
  return valid;
}

function validateIdentity(input: OversightRequirementInput, reasons: OversightRequirementReasonCode[]): boolean {
  const graphIdValid = input.request.graphId === input.intelligence.result.graphId
    && input.certification.result.graphId === input.request.graphId
    && input.verification.result.graphId === input.request.graphId;
  const versionValid = input.request.graphVersion === "decision-graph/v1";
  addReason(reasons, graphIdValid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  addReason(reasons, versionValid ? "GRAPH_VERSION_MATCHED" : "GRAPH_VERSION_MISMATCH");
  return graphIdValid && versionValid;
}

function validateTenantScope(input: OversightRequirementInput, reasons: OversightRequirementReasonCode[]): boolean {
  const valid = input.intelligence.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: OversightRequirementInput, reasons: OversightRequirementReasonCode[]): boolean {
  const valid = input.certification.result.ownershipCertified && input.verification.result.ownershipIntegrity;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateLineage(input: OversightRequirementInput, reasons: OversightRequirementReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const required = collectLineage({
    intelligence: input.intelligence,
    certification: input.certification,
    verification: input.verification,
    mutationSignalsDetected: input.mutationSignalsDetected,
    executionRequested: input.executionRequested,
    workflowRoutingRequested: input.workflowRoutingRequested,
    approvalCreationRequested: input.approvalCreationRequested,
    notificationDispatchRequested: input.notificationDispatchRequested,
    containmentActionRequested: input.containmentActionRequested,
    authorityExpansionRequested: input.authorityExpansionRequested,
  });
  const valid = lineageReferences.length > 0
    && input.intelligence.result.lineageConcern === false
    && input.certification.result.lineageCertified
    && input.verification.result.lineageIntegrity
    && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateEscalationEvidence(input: OversightRequirementInput, reasons: OversightRequirementReasonCode[]): boolean {
  const valid = input.intelligence.evidencePath.evidenceIds.length > 0
    && input.intelligence.evidencePath.evidenceHashes.length > 0
    && input.intelligence.result.escalationEvidenceHash.length === 64;
  addReason(reasons, valid ? "ESCALATION_EVIDENCE_VALID" : "ESCALATION_EVIDENCE_BROKEN");
  return valid;
}

function validateTopology(input: OversightRequirementInput, reasons: OversightRequirementReasonCode[]): boolean {
  const valid = input.verification.result.topologyIntegrity && input.intelligence.result.topologyConcern === false;
  addReason(reasons, valid ? "TOPOLOGY_INTEGRITY_VALID" : "TOPOLOGY_CORRUPTION_DETECTED");
  return valid;
}

function validateEvidenceHashes(input: OversightRequirementInput, reasons: OversightRequirementReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(input: OversightRequirementInput, reasons: OversightRequirementReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionRequested !== true
    && input.intelligence.validation.authorityBounded
    && input.certification.result.authorityBounded
    && input.verification.result.authorityBounded;
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
  addReason(reasons, "OVERSIGHT_ANALYSIS_IS_NOT_EXECUTION");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function classifyOversight(
  ownershipConcern: boolean,
  lineageConcern: boolean,
  authorityConcern: boolean,
  topologyConcern: boolean,
  authorityBounded: boolean,
): OversightRequirementResult["oversightRequirement"] {
  if (authorityConcern || !authorityBounded) return "CONTAINMENT_REVIEW";
  if (topologyConcern) return "REVIEW";
  const count = [ownershipConcern, lineageConcern, topologyConcern].filter(Boolean).length;
  if (count >= 2) return "REVIEW";
  if (count === 1) return "OBSERVE";
  return "NONE";
}

function validateLimits(path: OversightRequirementEvidencePath, reasons: OversightRequirementReasonCode[]): boolean {
  const depthValid = path.lineageReferences.length <= MAX_OVERSIGHT_ANALYSIS_DEPTH;
  const artifactValid = path.evidenceIds.length <= MAX_OVERSIGHT_ARTIFACTS;
  addReason(reasons, depthValid ? "ANALYSIS_DEPTH_VALID" : "ANALYSIS_DEPTH_EXCEEDED");
  addReason(reasons, artifactValid ? "OVERSIGHT_ARTIFACT_LIMIT_VALID" : "OVERSIGHT_ARTIFACT_LIMIT_EXCEEDED");
  return depthValid && artifactValid;
}

export function buildOversightRequirementRequest(
  input: Omit<OversightRequirementInput, "request"> & {
    oversightContext?: OversightRequirementContext;
    tenantId?: string;
    graphVersion?: string;
  },
): OversightRequirementRequest {
  return Object.freeze({
    graphId: input.intelligence.result.graphId,
    tenantId: input.tenantId ?? "",
    oversightContext: input.oversightContext ?? "FULL",
    lineageReferences: collectLineage(input),
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  } as OversightRequirementRequest);
}

export function createOversightRequirementEvidencePath(
  input: OversightRequirementInput,
): OversightRequirementEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    context: request.oversightContext,
    evidenceIds: Object.freeze(projectEvidenceIds(request.oversightContext, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
    lineageReferences: Object.freeze(
      request.oversightContext === "OWNERSHIP" || request.oversightContext === "AUTHORITY"
        ? request.lineageReferences.slice(0, MAX_OVERSIGHT_ANALYSIS_DEPTH)
        : request.lineageReferences,
    ),
  });
}

export function validateOversightRequirement(input: OversightRequirementInput): OversightRequirementValidation {
  const reasons: OversightRequirementReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const contextValid = validateContext(request, reasons);
  const identityValid = validateIdentity(normalizedInput, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const lineageValid = validateLineage(normalizedInput, reasons);
  const escalationEvidenceValid = validateEscalationEvidence(normalizedInput, reasons);
  const topologyValid = validateTopology(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const evidencePath = createOversightRequirementEvidencePath(normalizedInput);
  const limitsValid = validateLimits(evidencePath, reasons);

  const ownershipConcern = !ownershipValid || normalizedInput.intelligence.result.ownershipConcern;
  const lineageConcern = !lineageValid || normalizedInput.intelligence.result.lineageConcern;
  const authorityConcern = !boundary.authorityBounded || normalizedInput.intelligence.result.authorityConcern;
  const topologyConcern = !topologyValid || normalizedInput.intelligence.result.topologyConcern;
  const oversightRequirement = classifyOversight(
    ownershipConcern,
    lineageConcern,
    authorityConcern,
    topologyConcern,
    boundary.authorityBounded,
  );

  const valid = sealedArtifacts
    && contextValid
    && identityValid
    && tenantIsolationVerified
    && ownershipValid
    && lineageValid
    && escalationEvidenceValid
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    reasonCodes: normalizeStrings(reasons) as readonly OversightRequirementReasonCode[],
    oversightRequirement,
    ownershipConcern,
    lineageConcern,
    authorityConcern,
    topologyConcern,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    analyzedArtifactCount: evidencePath.evidenceIds.length,
  });
}

export function buildOversightRequirementResult(input: OversightRequirementInput): OversightRequirementResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const validation = validateOversightRequirement(normalizedInput);
  const evidencePath = createOversightRequirementEvidencePath(normalizedInput);
  const oversightEvidenceHash = hashOversightValue("oversight-requirement-analysis", {
    request,
    evidencePath,
    oversightRequirement: validation.oversightRequirement,
    ownershipConcern: validation.ownershipConcern,
    lineageConcern: validation.lineageConcern,
    authorityConcern: validation.authorityConcern,
    topologyConcern: validation.topologyConcern,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    graphId: request.graphId,
    oversightRequirement: validation.oversightRequirement,
    ownershipConcern: validation.ownershipConcern,
    lineageConcern: validation.lineageConcern,
    authorityConcern: validation.authorityConcern,
    topologyConcern: validation.topologyConcern,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    oversightEvidenceHash,
    deterministic: true,
  });
}

export function buildOversightRequirementObservability(
  result: OversightRequirementResult,
): OversightRequirementObservability {
  return Object.freeze({
    graphId: result.graphId,
    oversightRequirement: result.oversightRequirement,
    ownershipConcern: result.ownershipConcern,
    lineageConcern: result.lineageConcern,
    authorityConcern: result.authorityConcern,
    topologyConcern: result.topologyConcern,
    oversightEvidenceHash: result.oversightEvidenceHash,
  });
}

export function sealOversightRequirement(input: OversightRequirementInput): SealedOversightRequirementRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createOversightRequirementEvidencePath(normalizedInput);
  const validation = validateOversightRequirement(normalizedInput);
  const result = buildOversightRequirementResult(normalizedInput);
  const observability = buildOversightRequirementObservability(result);

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    analysisOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    approvalCreationAllowed: false as const,
    notificationDispatchAllowed: false as const,
    containmentActionAllowed: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const OversightRequirementValidator = Object.freeze({
  validate: validateOversightRequirement,
});

export const OversightRequirementAnalysis = Object.freeze({
  buildRequest: buildOversightRequirementRequest,
  createEvidencePath: createOversightRequirementEvidencePath,
  buildResult: buildOversightRequirementResult,
  seal: sealOversightRequirement,
});

export const OversightRequirementObservabilityService = Object.freeze({
  build: buildOversightRequirementObservability,
});
