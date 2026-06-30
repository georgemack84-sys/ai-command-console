import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  EscalationCertificationContext,
  EscalationCertificationEvidencePath,
  EscalationCertificationInput,
  EscalationCertificationObservability,
  EscalationCertificationReasonCode,
  EscalationCertificationRequest,
  EscalationCertificationResult,
  EscalationCertificationValidation,
  SealedEscalationCertificationRecord,
} from "./types";

export const MAX_CERTIFICATION_DEPTH = 20;
export const MAX_CERTIFICATION_ARTIFACTS = 5000;
export const MAX_CERTIFICATION_LINEAGE_REFERENCES = 1000;

const CERTIFICATION_CONTEXTS: readonly EscalationCertificationContext[] = Object.freeze([
  "AUTHORITY",
  "FULL",
  "GRAPH",
  "LINEAGE",
  "OWNERSHIP",
  "REPLAY",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: EscalationCertificationReasonCode[], reason: EscalationCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashCertificationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: EscalationCertificationRequest): EscalationCertificationRequest {
  return Object.freeze({
    graphId: request.graphId,
    tenantId: request.tenantId,
    certificationContext: request.certificationContext,
    lineageReferences: normalizeStrings(request.lineageReferences),
    graphVersion: request.graphVersion,
  });
}

function collectLineage(input: Omit<EscalationCertificationInput, "request">): string[] {
  return normalizeStrings([
    ...input.intelligence.evidencePath.lineageReferences,
    ...input.oversight.evidencePath.lineageReferences,
    ...input.caution.evidencePath.lineageReferences,
    ...input.governance.evidencePath.lineageReferences,
    ...input.replay.evidencePath.lineageReferences,
    ...input.graphIntegration.evidencePath.lineageReferences,
    ...input.integrity.evidencePath.lineageReferences,
    ...input.verification.verificationPath.lineageReferences,
    ...input.certification.evidenceChain.lineageReferences,
  ]);
}

function collectEvidenceHashes(input: EscalationCertificationInput): string[] {
  return normalizeStrings([
    input.intelligence.result.escalationEvidenceHash,
    input.oversight.result.oversightEvidenceHash,
    input.caution.result.cautionEvidenceHash,
    input.governance.result.governanceEvidenceHash,
    input.replay.result.replayHash,
    input.replay.result.reconstructionHash,
    input.graphIntegration.result.graphEvidenceHash,
    input.graphIntegration.result.relationshipHash,
    input.integrity.result.integrityHash,
    input.verification.result.verificationHash,
    input.certification.result.certificationHash,
  ]);
}

function collectEvidenceIds(input: EscalationCertificationInput): string[] {
  return normalizeStrings([
    ...input.intelligence.evidencePath.evidenceIds,
    ...input.oversight.evidencePath.evidenceIds,
    ...input.caution.evidencePath.evidenceIds,
    ...input.governance.evidencePath.evidenceIds,
    ...input.replay.evidencePath.evidenceIds,
    ...input.graphIntegration.evidencePath.evidenceIds,
    ...input.integrity.evidencePath.evidenceIds,
    ...input.verification.verificationPath.artifactIds,
    ...input.certification.evidenceChain.evidenceIds,
  ]);
}

function projectEvidenceIds(context: EscalationCertificationContext, input: EscalationCertificationInput): string[] {
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
        governance: input.governance,
        replay: input.replay,
        graphIntegration: input.graphIntegration,
        integrity: input.integrity,
        verification: input.verification,
        certification: input.certification,
        certificationMutationAttempted: input.certificationMutationAttempted,
        executionRequested: input.executionRequested,
        workflowRoutingRequested: input.workflowRoutingRequested,
        notificationDispatchRequested: input.notificationDispatchRequested,
        approvalCreationRequested: input.approvalCreationRequested,
        governanceMutationRequested: input.governanceMutationRequested,
        authorityExpansionRequested: input.authorityExpansionRequested,
      });
    case "REPLAY":
      return normalizeStrings(
        input.replay.evidencePath.evidenceIds.filter((id) =>
          input.integrity.evidencePath.evidenceIds.includes(id),
        ),
      );
    case "GRAPH":
      return normalizeStrings(
        input.graphIntegration.evidencePath.evidenceIds.filter((id) =>
          input.integrity.evidencePath.evidenceIds.includes(id),
        ),
      );
    case "AUTHORITY":
      return normalizeStrings(
        input.governance.evidencePath.evidenceIds.filter((id) =>
          input.integrity.evidencePath.evidenceIds.includes(id),
        ),
      );
    case "FULL":
      return collectEvidenceIds(input);
  }
}

function validateSealedArtifacts(input: EscalationCertificationInput, reasons: EscalationCertificationReasonCode[]): boolean {
  const states = [
    [input.intelligence.sealed, "INTELLIGENCE_REQUIRED", "INTELLIGENCE_UNSEALED"],
    [input.oversight.sealed, "OVERSIGHT_REQUIRED", "OVERSIGHT_UNSEALED"],
    [input.caution.sealed, "CAUTION_REQUIRED", "CAUTION_UNSEALED"],
    [input.governance.sealed, "GOVERNANCE_REQUIRED", "GOVERNANCE_UNSEALED"],
    [input.replay.sealed, "REPLAY_REQUIRED", "REPLAY_UNSEALED"],
    [input.graphIntegration.sealed, "GRAPH_INTEGRATION_REQUIRED", "GRAPH_INTEGRATION_UNSEALED"],
    [input.integrity.sealed, "INTEGRITY_REQUIRED", "INTEGRITY_UNSEALED"],
    [input.verification.sealed, "VERIFICATION_REQUIRED", "VERIFICATION_UNSEALED"],
    [input.certification.sealed, "CERTIFICATION_REQUIRED", "CERTIFICATION_UNSEALED"],
  ] as const;
  for (const [sealed, ok, fail] of states) addReason(reasons, sealed ? ok : fail);
  return states.every(([sealed]) => sealed);
}

function validateContext(request: EscalationCertificationRequest, reasons: EscalationCertificationReasonCode[]): boolean {
  const valid = CERTIFICATION_CONTEXTS.includes(request.certificationContext);
  addReason(reasons, valid ? "CERTIFICATION_CONTEXT_VALID" : "CERTIFICATION_CONTEXT_INVALID");
  return valid;
}

function validateIdentity(input: EscalationCertificationInput, reasons: EscalationCertificationReasonCode[]): boolean {
  const graphIdValid = input.request.graphId === input.intelligence.result.graphId
    && input.oversight.result.graphId === input.request.graphId
    && input.caution.result.graphId === input.request.graphId
    && input.governance.result.graphId === input.request.graphId
    && input.replay.result.graphId === input.request.graphId
    && input.graphIntegration.result.graphId === input.request.graphId
    && input.integrity.result.graphId === input.request.graphId
    && input.verification.result.graphId === input.request.graphId
    && input.certification.result.graphId === input.request.graphId;
  const versionValid = input.request.graphVersion === "decision-graph/v1";
  addReason(reasons, graphIdValid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  addReason(reasons, versionValid ? "GRAPH_VERSION_MATCHED" : "GRAPH_VERSION_MISMATCH");
  return graphIdValid && versionValid;
}

function validateTenantScope(input: EscalationCertificationInput, reasons: EscalationCertificationReasonCode[]): boolean {
  const valid = input.intelligence.result.tenantIsolationVerified
    && input.oversight.result.tenantIsolationVerified
    && input.caution.result.tenantIsolationVerified
    && input.governance.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.graphIntegration.result.tenantIsolationVerified
    && input.integrity.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: EscalationCertificationInput, reasons: EscalationCertificationReasonCode[]): boolean {
  const valid = input.certification.result.ownershipCertified && input.verification.result.ownershipIntegrity;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateLineage(input: EscalationCertificationInput, reasons: EscalationCertificationReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const required = collectLineage({
    intelligence: input.intelligence,
    oversight: input.oversight,
    caution: input.caution,
    governance: input.governance,
    replay: input.replay,
    graphIntegration: input.graphIntegration,
    integrity: input.integrity,
    verification: input.verification,
    certification: input.certification,
    certificationMutationAttempted: input.certificationMutationAttempted,
    executionRequested: input.executionRequested,
    workflowRoutingRequested: input.workflowRoutingRequested,
    notificationDispatchRequested: input.notificationDispatchRequested,
    approvalCreationRequested: input.approvalCreationRequested,
    governanceMutationRequested: input.governanceMutationRequested,
    authorityExpansionRequested: input.authorityExpansionRequested,
  });
  const valid = lineageReferences.length > 0
    && input.integrity.result.evidenceIntegrity
    && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateEvidenceCertified(input: EscalationCertificationInput, reasons: EscalationCertificationReasonCode[]): boolean {
  const valid = input.integrity.result.evidenceIntegrity;
  addReason(reasons, valid ? "EVIDENCE_CERTIFIED" : "EVIDENCE_CHAIN_BROKEN");
  return valid;
}

function validateReplayCertified(input: EscalationCertificationInput, reasons: EscalationCertificationReasonCode[]): boolean {
  const valid = input.integrity.result.replayIntegrity && input.replay.result.replayState !== "INVALID";
  addReason(reasons, valid ? "REPLAY_CERTIFIED" : "REPLAY_INTEGRITY_FAILURE");
  return valid;
}

function validateGraphCertified(input: EscalationCertificationInput, reasons: EscalationCertificationReasonCode[]): boolean {
  const valid = input.integrity.result.graphIntegrity && input.graphIntegration.result.integrationState !== "INVALID";
  addReason(reasons, valid ? "GRAPH_CERTIFIED" : "GRAPH_INTEGRATION_FAILURE");
  return valid;
}

function validateEvidenceHashes(input: EscalationCertificationInput, reasons: EscalationCertificationReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(input: EscalationCertificationInput, reasons: EscalationCertificationReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionRequested !== true
    && input.intelligence.validation.authorityBounded
    && input.oversight.validation.authorityBounded
    && input.caution.validation.authorityBounded
    && input.governance.validation.authorityBounded
    && input.replay.validation.authorityBounded
    && input.graphIntegration.validation.authorityBounded
    && input.integrity.result.authorityBounded
    && input.certification.result.authorityBounded;
  const invalidBoundary = input.certificationMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.notificationDispatchRequested === true
    || input.approvalCreationRequested === true
    || input.governanceMutationRequested === true
    || input.authorityExpansionRequested === true;
  addReason(reasons, input.certificationMutationAttempted === true ? "CERTIFICATION_MUTATION_DETECTED" : "CERTIFICATION_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.notificationDispatchRequested === true ? "NOTIFICATION_DISPATCH_DETECTED" : "NOTIFICATION_DISPATCH_BLOCKED");
  addReason(reasons, input.approvalCreationRequested === true ? "APPROVAL_CREATION_DETECTED" : "APPROVAL_CREATION_BLOCKED");
  addReason(reasons, input.governanceMutationRequested === true ? "GOVERNANCE_MUTATION_DETECTED" : "GOVERNANCE_MUTATION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "ESCALATION_CERTIFICATION_IS_NOT_EXECUTION");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(path: EscalationCertificationEvidencePath, reasons: EscalationCertificationReasonCode[]): boolean {
  const depthValid = path.lineageReferences.length <= MAX_CERTIFICATION_DEPTH;
  const artifactValid = path.evidenceIds.length <= MAX_CERTIFICATION_ARTIFACTS;
  const lineageValid = path.lineageReferences.length <= MAX_CERTIFICATION_LINEAGE_REFERENCES;
  addReason(reasons, depthValid ? "CERTIFICATION_DEPTH_VALID" : "CERTIFICATION_DEPTH_EXCEEDED");
  addReason(reasons, artifactValid ? "CERTIFICATION_ARTIFACT_LIMIT_VALID" : "CERTIFICATION_ARTIFACT_LIMIT_EXCEEDED");
  addReason(reasons, lineageValid ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && artifactValid && lineageValid;
}

function classifyCertificationState(
  valid: boolean,
  evidenceCertified: boolean,
  replayCertified: boolean,
  graphCertified: boolean,
): EscalationCertificationResult["certificationState"] {
  if (!valid || !evidenceCertified) return "FAIL";
  if (!replayCertified || !graphCertified) return "CONDITIONAL_PASS";
  return "PASS";
}

export function buildEscalationCertificationRequest(
  input: Omit<EscalationCertificationInput, "request"> & {
    certificationContext?: EscalationCertificationContext;
    tenantId?: string;
    graphVersion?: string;
  },
): EscalationCertificationRequest {
  return Object.freeze({
    graphId: input.intelligence.result.graphId,
    tenantId: input.tenantId ?? "",
    certificationContext: input.certificationContext ?? "FULL",
    lineageReferences: collectLineage(input),
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  } as EscalationCertificationRequest);
}

export function createEscalationCertificationEvidencePath(
  input: EscalationCertificationInput,
): EscalationCertificationEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    context: request.certificationContext,
    evidenceIds: Object.freeze(projectEvidenceIds(request.certificationContext, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
    lineageReferences: Object.freeze(
      request.certificationContext === "OWNERSHIP" || request.certificationContext === "AUTHORITY"
        ? request.lineageReferences.slice(0, MAX_CERTIFICATION_DEPTH)
        : request.lineageReferences,
    ),
  });
}

export function validateEscalationCertification(input: EscalationCertificationInput): EscalationCertificationValidation {
  const reasons: EscalationCertificationReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const contextValid = validateContext(request, reasons);
  const identityValid = validateIdentity(normalizedInput, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const lineageValid = validateLineage(normalizedInput, reasons);
  const evidenceCertified = validateEvidenceCertified(normalizedInput, reasons);
  const replayCertified = validateReplayCertified(normalizedInput, reasons);
  const graphCertified = validateGraphCertified(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const evidencePath = createEscalationCertificationEvidencePath(normalizedInput);
  const limitsValid = validateLimits(evidencePath, reasons);

  const valid = sealedArtifacts
    && contextValid
    && identityValid
    && tenantIsolationVerified
    && ownershipValid
    && lineageValid
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  const certificationState = classifyCertificationState(
    valid,
    evidenceCertified,
    replayCertified,
    graphCertified,
  );

  return Object.freeze({
    valid,
    certificationState,
    reasonCodes: normalizeStrings(reasons) as readonly EscalationCertificationReasonCode[],
    evidenceCertified,
    replayCertified,
    graphCertified,
    authorityBounded: boundary.authorityBounded,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    controlSurfaceAbsent: true as const,
    certifiedArtifactCount: evidencePath.evidenceIds.length,
  });
}

export function buildEscalationCertificationResult(input: EscalationCertificationInput): EscalationCertificationResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const validation = validateEscalationCertification(normalizedInput);
  const evidencePath = createEscalationCertificationEvidencePath(normalizedInput);

  const certificationHash = hashCertificationValue("escalation-intelligence-certification-gate", {
    request,
    evidencePath,
    certificationState: validation.certificationState,
    evidenceCertified: validation.evidenceCertified,
    replayCertified: validation.replayCertified,
    graphCertified: validation.graphCertified,
    authorityBounded: validation.authorityBounded,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    graphId: request.graphId,
    certificationState: validation.certificationState,
    evidenceCertified: validation.evidenceCertified,
    replayCertified: validation.replayCertified,
    graphCertified: validation.graphCertified,
    authorityBounded: validation.authorityBounded,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    certificationHash,
    deterministic: true,
  });
}

export function buildEscalationCertificationObservability(
  result: EscalationCertificationResult,
): EscalationCertificationObservability {
  return Object.freeze({
    graphId: result.graphId,
    certificationState: result.certificationState,
    evidenceCertified: result.evidenceCertified,
    replayCertified: result.replayCertified,
    graphCertified: result.graphCertified,
    certificationHash: result.certificationHash,
  });
}

export function sealEscalationCertification(input: EscalationCertificationInput): SealedEscalationCertificationRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createEscalationCertificationEvidencePath(normalizedInput);
  const validation = validateEscalationCertification(normalizedInput);
  const result = buildEscalationCertificationResult(normalizedInput);
  const observability = buildEscalationCertificationObservability(result);

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    certificationOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    notificationDispatchAllowed: false as const,
    approvalCreationAllowed: false as const,
    governanceMutationAllowed: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const EscalationCertificationValidator = Object.freeze({
  validate: validateEscalationCertification,
});

export const EscalationIntelligenceCertificationGate = Object.freeze({
  buildRequest: buildEscalationCertificationRequest,
  createEvidencePath: createEscalationCertificationEvidencePath,
  buildResult: buildEscalationCertificationResult,
  seal: sealEscalationCertification,
});

export const EscalationCertificationObservabilityService = Object.freeze({
  build: buildEscalationCertificationObservability,
});
