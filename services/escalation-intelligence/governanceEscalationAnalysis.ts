import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  GovernanceEscalationContext,
  GovernanceEscalationEvidencePath,
  GovernanceEscalationInput,
  GovernanceEscalationObservability,
  GovernanceEscalationReasonCode,
  GovernanceEscalationRequest,
  GovernanceEscalationResult,
  GovernanceEscalationValidation,
  SealedGovernanceEscalationRecord,
} from "./types";

export const MAX_GOVERNANCE_ANALYSIS_DEPTH = 20;
export const MAX_GOVERNANCE_ARTIFACTS = 5000;

const GOVERNANCE_CONTEXTS: readonly GovernanceEscalationContext[] = Object.freeze([
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

function addReason(reasons: GovernanceEscalationReasonCode[], reason: GovernanceEscalationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashGovernanceValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: GovernanceEscalationRequest): GovernanceEscalationRequest {
  return Object.freeze({
    graphId: request.graphId,
    tenantId: request.tenantId,
    governanceContext: request.governanceContext,
    lineageReferences: normalizeStrings(request.lineageReferences),
    graphVersion: request.graphVersion,
  });
}

function collectLineage(input: Omit<GovernanceEscalationInput, "request">): string[] {
  return normalizeStrings([
    ...input.intelligence.evidencePath.lineageReferences,
    ...input.oversight.evidencePath.lineageReferences,
    ...input.caution.evidencePath.lineageReferences,
    ...input.verification.verificationPath.lineageReferences,
    ...input.certification.evidenceChain.lineageReferences,
  ]);
}

function collectEvidenceHashes(input: GovernanceEscalationInput): string[] {
  return normalizeStrings([
    input.intelligence.result.escalationEvidenceHash,
    input.oversight.result.oversightEvidenceHash,
    input.caution.result.cautionEvidenceHash,
    input.verification.result.verificationHash,
    input.certification.result.certificationHash,
  ]);
}

function collectEvidenceIds(input: GovernanceEscalationInput): string[] {
  return normalizeStrings([
    ...input.intelligence.evidencePath.evidenceIds,
    ...input.oversight.evidencePath.evidenceIds,
    ...input.caution.evidencePath.evidenceIds,
    ...input.verification.verificationPath.artifactIds,
    ...input.certification.evidenceChain.evidenceIds,
  ]);
}

function projectEvidenceIds(context: GovernanceEscalationContext, input: GovernanceEscalationInput): string[] {
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
        caution: input.caution,
        verification: input.verification,
        certification: input.certification,
        mutationSignalsDetected: input.mutationSignalsDetected,
        executionRequested: input.executionRequested,
        workflowRoutingRequested: input.workflowRoutingRequested,
        approvalCreationRequested: input.approvalCreationRequested,
        notificationDispatchRequested: input.notificationDispatchRequested,
        reviewAssignmentRequested: input.reviewAssignmentRequested,
        governanceMutationRequested: input.governanceMutationRequested,
        authorityExpansionRequested: input.authorityExpansionRequested,
      });
    case "TOPOLOGY":
      return normalizeStrings(
        input.verification.verificationPath.artifactIds.filter((id) =>
          input.certification.evidenceChain.evidenceIds.includes(id),
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

function validateSealedArtifacts(input: GovernanceEscalationInput, reasons: GovernanceEscalationReasonCode[]): boolean {
  const intelligenceSealed = input.intelligence.sealed;
  const oversightSealed = input.oversight.sealed;
  const cautionSealed = input.caution.sealed;
  const verificationSealed = input.verification.sealed;
  const certificationSealed = input.certification.sealed;
  addReason(reasons, intelligenceSealed ? "INTELLIGENCE_REQUIRED" : "INTELLIGENCE_UNSEALED");
  addReason(reasons, oversightSealed ? "OVERSIGHT_REQUIRED" : "OVERSIGHT_UNSEALED");
  addReason(reasons, cautionSealed ? "CAUTION_REQUIRED" : "CAUTION_UNSEALED");
  addReason(reasons, verificationSealed ? "VERIFICATION_REQUIRED" : "VERIFICATION_UNSEALED");
  addReason(reasons, certificationSealed ? "CERTIFICATION_REQUIRED" : "CERTIFICATION_UNSEALED");
  return intelligenceSealed && oversightSealed && cautionSealed && verificationSealed && certificationSealed;
}

function validateContext(request: GovernanceEscalationRequest, reasons: GovernanceEscalationReasonCode[]): boolean {
  const valid = GOVERNANCE_CONTEXTS.includes(request.governanceContext);
  addReason(reasons, valid ? "GOVERNANCE_CONTEXT_VALID" : "GOVERNANCE_CONTEXT_INVALID");
  return valid;
}

function validateIdentity(input: GovernanceEscalationInput, reasons: GovernanceEscalationReasonCode[]): boolean {
  const graphIdValid = input.request.graphId === input.intelligence.result.graphId
    && input.oversight.result.graphId === input.request.graphId
    && input.caution.result.graphId === input.request.graphId
    && input.verification.result.graphId === input.request.graphId
    && input.certification.result.graphId === input.request.graphId;
  const versionValid = input.request.graphVersion === "decision-graph/v1";
  addReason(reasons, graphIdValid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  addReason(reasons, versionValid ? "GRAPH_VERSION_MATCHED" : "GRAPH_VERSION_MISMATCH");
  return graphIdValid && versionValid;
}

function validateTenantScope(input: GovernanceEscalationInput, reasons: GovernanceEscalationReasonCode[]): boolean {
  const valid = input.intelligence.result.tenantIsolationVerified
    && input.oversight.result.tenantIsolationVerified
    && input.caution.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: GovernanceEscalationInput, reasons: GovernanceEscalationReasonCode[]): boolean {
  const valid = input.certification.result.ownershipCertified && input.verification.result.ownershipIntegrity;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateLineage(input: GovernanceEscalationInput, reasons: GovernanceEscalationReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const required = collectLineage({
    intelligence: input.intelligence,
    oversight: input.oversight,
    caution: input.caution,
    verification: input.verification,
    certification: input.certification,
    mutationSignalsDetected: input.mutationSignalsDetected,
    executionRequested: input.executionRequested,
    workflowRoutingRequested: input.workflowRoutingRequested,
    approvalCreationRequested: input.approvalCreationRequested,
    notificationDispatchRequested: input.notificationDispatchRequested,
    reviewAssignmentRequested: input.reviewAssignmentRequested,
    governanceMutationRequested: input.governanceMutationRequested,
    authorityExpansionRequested: input.authorityExpansionRequested,
  });
  const valid = lineageReferences.length > 0
    && input.certification.result.lineageCertified
    && input.verification.result.lineageIntegrity
    && !input.intelligence.result.lineageConcern
    && !input.oversight.result.lineageConcern
    && !input.caution.result.ambiguityDetected
    && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateGovernanceEvidence(input: GovernanceEscalationInput, reasons: GovernanceEscalationReasonCode[]): boolean {
  const valid = input.intelligence.evidencePath.evidenceIds.length > 0
    && input.oversight.evidencePath.evidenceIds.length > 0
    && input.caution.evidencePath.evidenceIds.length > 0;
  addReason(reasons, valid ? "GOVERNANCE_EVIDENCE_VALID" : "GOVERNANCE_EVIDENCE_BROKEN");
  return valid;
}

function validatePolicyDependencies(input: GovernanceEscalationInput, reasons: GovernanceEscalationReasonCode[]): boolean {
  const valid = !input.intelligence.result.topologyConcern
    && input.oversight.result.oversightRequirement !== "CONTAINMENT_REVIEW"
    && input.caution.result.cautionState !== "HIGH_CAUTION";
  addReason(reasons, valid ? "POLICY_DEPENDENCY_HEALTHY" : "POLICY_BOUNDARY_VIOLATION");
  return valid;
}

function validateEvidenceHashes(input: GovernanceEscalationInput, reasons: GovernanceEscalationReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(input: GovernanceEscalationInput, reasons: GovernanceEscalationReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionRequested !== true
    && input.intelligence.validation.authorityBounded
    && input.oversight.validation.authorityBounded
    && input.caution.validation.authorityBounded
    && input.verification.result.authorityBounded
    && input.certification.result.authorityBounded;
  const invalidBoundary = input.mutationSignalsDetected === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.approvalCreationRequested === true
    || input.notificationDispatchRequested === true
    || input.reviewAssignmentRequested === true
    || input.governanceMutationRequested === true;
  addReason(reasons, input.mutationSignalsDetected === true ? "MUTATION_SIGNALS_DETECTED" : "MUTATION_SIGNALS_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.approvalCreationRequested === true ? "APPROVAL_CREATION_DETECTED" : "APPROVAL_CREATION_BLOCKED");
  addReason(reasons, input.notificationDispatchRequested === true ? "NOTIFICATION_DISPATCH_DETECTED" : "NOTIFICATION_DISPATCH_BLOCKED");
  addReason(reasons, input.reviewAssignmentRequested === true ? "REVIEW_ASSIGNMENT_DETECTED" : "REVIEW_ASSIGNMENT_BLOCKED");
  addReason(reasons, input.governanceMutationRequested === true ? "GOVERNANCE_MUTATION_DETECTED" : "GOVERNANCE_MUTATION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "GOVERNANCE_ANALYSIS_IS_NOT_EXECUTION");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function classifyGovernance(
  governanceConcern: boolean,
  authorityBoundaryConcern: boolean,
  policyDependencyConcern: boolean,
  tenantIsolationVerified: boolean,
): GovernanceEscalationResult["governanceEscalationState"] {
  if (authorityBoundaryConcern || policyDependencyConcern || !tenantIsolationVerified) {
    return "HIGH_GOVERNANCE_ATTENTION";
  }
  if (governanceConcern) return "GOVERNANCE_REVIEW";
  if (policyDependencyConcern || governanceConcern) return "GOVERNANCE_AWARE";
  return "NORMAL";
}

function validateLimits(path: GovernanceEscalationEvidencePath, reasons: GovernanceEscalationReasonCode[]): boolean {
  const depthValid = path.lineageReferences.length <= MAX_GOVERNANCE_ANALYSIS_DEPTH;
  const artifactValid = path.evidenceIds.length <= MAX_GOVERNANCE_ARTIFACTS;
  addReason(reasons, depthValid ? "ANALYSIS_DEPTH_VALID" : "ANALYSIS_DEPTH_EXCEEDED");
  addReason(reasons, artifactValid ? "GOVERNANCE_ARTIFACT_LIMIT_VALID" : "GOVERNANCE_ARTIFACT_LIMIT_EXCEEDED");
  return depthValid && artifactValid;
}

export function buildGovernanceEscalationRequest(
  input: Omit<GovernanceEscalationInput, "request"> & {
    governanceContext?: GovernanceEscalationContext;
    tenantId?: string;
    graphVersion?: string;
  },
): GovernanceEscalationRequest {
  return Object.freeze({
    graphId: input.intelligence.result.graphId,
    tenantId: input.tenantId ?? "",
    governanceContext: input.governanceContext ?? "FULL",
    lineageReferences: collectLineage(input),
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  } as GovernanceEscalationRequest);
}

export function createGovernanceEscalationEvidencePath(
  input: GovernanceEscalationInput,
): GovernanceEscalationEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    context: request.governanceContext,
    evidenceIds: Object.freeze(projectEvidenceIds(request.governanceContext, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
    lineageReferences: Object.freeze(
      request.governanceContext === "OWNERSHIP" || request.governanceContext === "AUTHORITY"
        ? request.lineageReferences.slice(0, MAX_GOVERNANCE_ANALYSIS_DEPTH)
        : request.lineageReferences,
    ),
  });
}

export function validateGovernanceEscalation(input: GovernanceEscalationInput): GovernanceEscalationValidation {
  const reasons: GovernanceEscalationReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const contextValid = validateContext(request, reasons);
  const identityValid = validateIdentity(normalizedInput, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const lineageValid = validateLineage(normalizedInput, reasons);
  const governanceEvidenceValid = validateGovernanceEvidence(normalizedInput, reasons);
  const policyDependenciesHealthy = validatePolicyDependencies(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const evidencePath = createGovernanceEscalationEvidencePath(normalizedInput);
  const limitsValid = validateLimits(evidencePath, reasons);

  const governanceConcern = normalizedInput.intelligence.result.escalationClassification !== "NO_ESCALATION"
    || normalizedInput.oversight.result.oversightRequirement === "GOVERNANCE_REVIEW"
    || normalizedInput.caution.result.cautionState === "LIMITED";
  const authorityBoundaryConcern = !boundary.authorityBounded
    || normalizedInput.intelligence.result.authorityConcern
    || normalizedInput.oversight.result.authorityConcern
    || normalizedInput.caution.result.authorityConcern;
  const policyDependencyConcern = !policyDependenciesHealthy
    || normalizedInput.intelligence.result.topologyConcern
    || normalizedInput.oversight.result.topologyConcern
    || normalizedInput.caution.result.evidenceQualityConcern;
  const governanceEscalationState = boundary.authorityBounded
    ? classifyGovernance(
      governanceConcern,
      authorityBoundaryConcern,
      policyDependencyConcern,
      tenantIsolationVerified,
    )
    : "HIGH_GOVERNANCE_ATTENTION";

  const valid = sealedArtifacts
    && contextValid
    && identityValid
    && tenantIsolationVerified
    && ownershipValid
    && lineageValid
    && governanceEvidenceValid
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    reasonCodes: normalizeStrings(reasons) as readonly GovernanceEscalationReasonCode[],
    governanceEscalationState,
    governanceConcern,
    authorityBoundaryConcern,
    policyDependencyConcern,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    analyzedArtifactCount: evidencePath.evidenceIds.length,
  });
}

export function buildGovernanceEscalationResult(input: GovernanceEscalationInput): GovernanceEscalationResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const validation = validateGovernanceEscalation(normalizedInput);
  const evidencePath = createGovernanceEscalationEvidencePath(normalizedInput);
  const governanceEvidenceHash = hashGovernanceValue("governance-escalation-analysis", {
    request,
    evidencePath,
    governanceEscalationState: validation.governanceEscalationState,
    governanceConcern: validation.governanceConcern,
    authorityBoundaryConcern: validation.authorityBoundaryConcern,
    policyDependencyConcern: validation.policyDependencyConcern,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    graphId: request.graphId,
    governanceEscalationState: validation.governanceEscalationState,
    governanceConcern: validation.governanceConcern,
    authorityBoundaryConcern: validation.authorityBoundaryConcern,
    policyDependencyConcern: validation.policyDependencyConcern,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    governanceEvidenceHash,
    deterministic: true,
  });
}

export function buildGovernanceEscalationObservability(
  result: GovernanceEscalationResult,
): GovernanceEscalationObservability {
  return Object.freeze({
    graphId: result.graphId,
    governanceEscalationState: result.governanceEscalationState,
    governanceConcern: result.governanceConcern,
    authorityBoundaryConcern: result.authorityBoundaryConcern,
    governanceEvidenceHash: result.governanceEvidenceHash,
  });
}

export function sealGovernanceEscalation(input: GovernanceEscalationInput): SealedGovernanceEscalationRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createGovernanceEscalationEvidencePath(normalizedInput);
  const validation = validateGovernanceEscalation(normalizedInput);
  const result = buildGovernanceEscalationResult(normalizedInput);
  const observability = buildGovernanceEscalationObservability(result);

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
    reviewAssignmentAllowed: false as const,
    governanceMutationAllowed: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const GovernanceEscalationValidator = Object.freeze({
  validate: validateGovernanceEscalation,
});

export const GovernanceEscalationAnalysis = Object.freeze({
  buildRequest: buildGovernanceEscalationRequest,
  createEvidencePath: createGovernanceEscalationEvidencePath,
  buildResult: buildGovernanceEscalationResult,
  seal: sealGovernanceEscalation,
});

export const GovernanceEscalationObservabilityService = Object.freeze({
  build: buildGovernanceEscalationObservability,
});
