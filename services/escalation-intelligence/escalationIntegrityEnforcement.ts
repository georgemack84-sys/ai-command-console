import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  EscalationIntegrityContext,
  EscalationIntegrityEvidencePath,
  EscalationIntegrityInput,
  EscalationIntegrityObservability,
  EscalationIntegrityReasonCode,
  EscalationIntegrityRequest,
  EscalationIntegrityResult,
  EscalationIntegrityValidation,
  SealedEscalationIntegrityRecord,
} from "./types";

export const MAX_INTEGRITY_DEPTH = 20;
export const MAX_INTEGRITY_ARTIFACTS = 5000;
export const MAX_LINEAGE_REFERENCES = 1000;

const INTEGRITY_CONTEXTS: readonly EscalationIntegrityContext[] = Object.freeze([
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

function addReason(reasons: EscalationIntegrityReasonCode[], reason: EscalationIntegrityReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashIntegrityValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: EscalationIntegrityRequest): EscalationIntegrityRequest {
  return Object.freeze({
    graphId: request.graphId,
    tenantId: request.tenantId,
    integrityContext: request.integrityContext,
    lineageReferences: normalizeStrings(request.lineageReferences),
    graphVersion: request.graphVersion,
  });
}

function collectLineage(input: Omit<EscalationIntegrityInput, "request">): string[] {
  return normalizeStrings([
    ...input.intelligence.evidencePath.lineageReferences,
    ...input.oversight.evidencePath.lineageReferences,
    ...input.caution.evidencePath.lineageReferences,
    ...input.governance.evidencePath.lineageReferences,
    ...input.replay.evidencePath.lineageReferences,
    ...input.graphIntegration.evidencePath.lineageReferences,
    ...input.verification.verificationPath.lineageReferences,
    ...input.certification.evidenceChain.lineageReferences,
  ]);
}

function collectEvidenceHashes(input: EscalationIntegrityInput): string[] {
  return normalizeStrings([
    input.intelligence.result.escalationEvidenceHash,
    input.oversight.result.oversightEvidenceHash,
    input.caution.result.cautionEvidenceHash,
    input.governance.result.governanceEvidenceHash,
    input.replay.result.replayHash,
    input.replay.result.reconstructionHash,
    input.graphIntegration.result.graphEvidenceHash,
    input.graphIntegration.result.relationshipHash,
    input.verification.result.verificationHash,
    input.certification.result.certificationHash,
  ]);
}

function collectEvidenceIds(input: EscalationIntegrityInput): string[] {
  return normalizeStrings([
    ...input.intelligence.evidencePath.evidenceIds,
    ...input.oversight.evidencePath.evidenceIds,
    ...input.caution.evidencePath.evidenceIds,
    ...input.governance.evidencePath.evidenceIds,
    ...input.replay.evidencePath.evidenceIds,
    ...input.graphIntegration.evidencePath.evidenceIds,
    ...input.verification.verificationPath.artifactIds,
    ...input.certification.evidenceChain.evidenceIds,
  ]);
}

function projectEvidenceIds(context: EscalationIntegrityContext, input: EscalationIntegrityInput): string[] {
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
        verification: input.verification,
        certification: input.certification,
        mutationSignalsDetected: input.mutationSignalsDetected,
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
          input.graphIntegration.evidencePath.evidenceIds.includes(id),
        ),
      );
    case "GRAPH":
      return normalizeStrings(
        input.graphIntegration.evidencePath.evidenceIds.filter((id) =>
          input.certification.evidenceChain.evidenceIds.includes(id),
        ),
      );
    case "AUTHORITY":
      return normalizeStrings(
        input.governance.evidencePath.evidenceIds.filter((id) =>
          input.replay.evidencePath.evidenceIds.includes(id),
        ),
      );
    case "FULL":
      return collectEvidenceIds(input);
  }
}

function validateSealedArtifacts(input: EscalationIntegrityInput, reasons: EscalationIntegrityReasonCode[]): boolean {
  const states = [
    [input.intelligence.sealed, "INTELLIGENCE_REQUIRED", "INTELLIGENCE_UNSEALED"],
    [input.oversight.sealed, "OVERSIGHT_REQUIRED", "OVERSIGHT_UNSEALED"],
    [input.caution.sealed, "CAUTION_REQUIRED", "CAUTION_UNSEALED"],
    [input.governance.sealed, "GOVERNANCE_REQUIRED", "GOVERNANCE_UNSEALED"],
    [input.replay.sealed, "REPLAY_REQUIRED", "REPLAY_UNSEALED"],
    [input.graphIntegration.sealed, "GRAPH_INTEGRATION_REQUIRED", "GRAPH_INTEGRATION_UNSEALED"],
    [input.verification.sealed, "VERIFICATION_REQUIRED", "VERIFICATION_UNSEALED"],
    [input.certification.sealed, "CERTIFICATION_REQUIRED", "CERTIFICATION_UNSEALED"],
  ] as const;
  for (const [sealed, ok, fail] of states) addReason(reasons, sealed ? ok : fail);
  return states.every(([sealed]) => sealed);
}

function validateContext(request: EscalationIntegrityRequest, reasons: EscalationIntegrityReasonCode[]): boolean {
  const valid = INTEGRITY_CONTEXTS.includes(request.integrityContext);
  addReason(reasons, valid ? "INTEGRITY_CONTEXT_VALID" : "INTEGRITY_CONTEXT_INVALID");
  return valid;
}

function validateIdentity(input: EscalationIntegrityInput, reasons: EscalationIntegrityReasonCode[]): boolean {
  const graphIdValid = input.request.graphId === input.intelligence.result.graphId
    && input.oversight.result.graphId === input.request.graphId
    && input.caution.result.graphId === input.request.graphId
    && input.governance.result.graphId === input.request.graphId
    && input.replay.result.graphId === input.request.graphId
    && input.graphIntegration.result.graphId === input.request.graphId
    && input.verification.result.graphId === input.request.graphId
    && input.certification.result.graphId === input.request.graphId;
  const versionValid = input.request.graphVersion === "decision-graph/v1";
  addReason(reasons, graphIdValid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  addReason(reasons, versionValid ? "GRAPH_VERSION_MATCHED" : "GRAPH_VERSION_MISMATCH");
  return graphIdValid && versionValid;
}

function validateTenantScope(input: EscalationIntegrityInput, reasons: EscalationIntegrityReasonCode[]): boolean {
  const valid = input.intelligence.result.tenantIsolationVerified
    && input.oversight.result.tenantIsolationVerified
    && input.caution.result.tenantIsolationVerified
    && input.governance.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.graphIntegration.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: EscalationIntegrityInput, reasons: EscalationIntegrityReasonCode[]): boolean {
  const valid = input.certification.result.ownershipCertified && input.verification.result.ownershipIntegrity;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateLineage(input: EscalationIntegrityInput, reasons: EscalationIntegrityReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const required = collectLineage({
    intelligence: input.intelligence,
    oversight: input.oversight,
    caution: input.caution,
    governance: input.governance,
    replay: input.replay,
    graphIntegration: input.graphIntegration,
    verification: input.verification,
    certification: input.certification,
    mutationSignalsDetected: input.mutationSignalsDetected,
    executionRequested: input.executionRequested,
    workflowRoutingRequested: input.workflowRoutingRequested,
    notificationDispatchRequested: input.notificationDispatchRequested,
    approvalCreationRequested: input.approvalCreationRequested,
    governanceMutationRequested: input.governanceMutationRequested,
    authorityExpansionRequested: input.authorityExpansionRequested,
  });
  const valid = lineageReferences.length > 0
    && input.verification.result.lineageIntegrity
    && input.certification.result.lineageCertified
    && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateEvidenceIntegrity(input: EscalationIntegrityInput, reasons: EscalationIntegrityReasonCode[]): boolean {
  const valid = input.intelligence.evidencePath.evidenceIds.length > 0
    && input.oversight.evidencePath.evidenceIds.length > 0
    && input.caution.evidencePath.evidenceIds.length > 0
    && input.governance.evidencePath.evidenceIds.length > 0
    && input.replay.evidencePath.evidenceIds.length > 0
    && input.graphIntegration.evidencePath.evidenceIds.length > 0
    && input.verification.verificationPath.artifactIds.length > 0
    && input.certification.evidenceChain.evidenceIds.length > 0;
  addReason(reasons, valid ? "EVIDENCE_CHAIN_VALID" : "EVIDENCE_CHAIN_BROKEN");
  return valid;
}

function validateReplayIntegrity(input: EscalationIntegrityInput, reasons: EscalationIntegrityReasonCode[]): boolean {
  const valid = input.replay.result.replayState === "REPLAYABLE"
    || input.replay.result.replayState === "LIMITED";
  addReason(reasons, valid ? "REPLAY_INTEGRITY_VALID" : "REPLAY_HASH_MISMATCH");
  return valid;
}

function validateGraphIntegrity(input: EscalationIntegrityInput, reasons: EscalationIntegrityReasonCode[]): boolean {
  const valid = input.graphIntegration.result.integrationState === "INTEGRATED"
    || input.graphIntegration.result.integrationState === "LIMITED";
  addReason(reasons, valid ? "GRAPH_INTEGRITY_VALID" : "GRAPH_BINDING_CORRUPTED");
  return valid;
}

function validateEvidenceHashes(input: EscalationIntegrityInput, reasons: EscalationIntegrityReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(input: EscalationIntegrityInput, reasons: EscalationIntegrityReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionRequested !== true
    && input.intelligence.validation.authorityBounded
    && input.oversight.validation.authorityBounded
    && input.caution.validation.authorityBounded
    && input.governance.validation.authorityBounded
    && input.replay.validation.authorityBounded
    && input.graphIntegration.validation.authorityBounded
    && input.certification.result.authorityBounded;
  const invalidBoundary = input.mutationSignalsDetected === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.notificationDispatchRequested === true
    || input.approvalCreationRequested === true
    || input.governanceMutationRequested === true
    || input.authorityExpansionRequested === true;
  addReason(reasons, input.mutationSignalsDetected === true ? "INTEGRITY_MUTATION_DETECTED" : "MUTATION_SIGNALS_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.notificationDispatchRequested === true ? "NOTIFICATION_DISPATCH_DETECTED" : "NOTIFICATION_DISPATCH_BLOCKED");
  addReason(reasons, input.approvalCreationRequested === true ? "APPROVAL_CREATION_DETECTED" : "APPROVAL_CREATION_BLOCKED");
  addReason(reasons, input.governanceMutationRequested === true ? "GOVERNANCE_MUTATION_DETECTED" : "GOVERNANCE_MUTATION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "ESCALATION_INTEGRITY_IS_NOT_EXECUTION");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(path: EscalationIntegrityEvidencePath, reasons: EscalationIntegrityReasonCode[]): boolean {
  const depthValid = path.lineageReferences.length <= MAX_INTEGRITY_DEPTH;
  const artifactValid = path.evidenceIds.length <= MAX_INTEGRITY_ARTIFACTS;
  const lineageValid = path.lineageReferences.length <= MAX_LINEAGE_REFERENCES;
  addReason(reasons, depthValid ? "INTEGRITY_DEPTH_VALID" : "INTEGRITY_DEPTH_EXCEEDED");
  addReason(reasons, artifactValid ? "INTEGRITY_ARTIFACT_LIMIT_VALID" : "INTEGRITY_ARTIFACT_LIMIT_EXCEEDED");
  addReason(reasons, lineageValid ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && artifactValid && lineageValid;
}

function classifyIntegrityState(
  valid: boolean,
  evidenceIntegrity: boolean,
  replayIntegrity: boolean,
  graphIntegrity: boolean,
  boundedDegradation: boolean,
): EscalationIntegrityResult["integrityState"] {
  if (!valid || !evidenceIntegrity) return "INVALID";
  if (!replayIntegrity || !graphIntegrity) return "LIMITED";
  if (boundedDegradation) return "DEGRADED";
  return "HEALTHY";
}

export function buildEscalationIntegrityRequest(
  input: Omit<EscalationIntegrityInput, "request"> & {
    integrityContext?: EscalationIntegrityContext;
    tenantId?: string;
    graphVersion?: string;
  },
): EscalationIntegrityRequest {
  return Object.freeze({
    graphId: input.intelligence.result.graphId,
    tenantId: input.tenantId ?? "",
    integrityContext: input.integrityContext ?? "FULL",
    lineageReferences: collectLineage(input),
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  } as EscalationIntegrityRequest);
}

export function createEscalationIntegrityEvidencePath(input: EscalationIntegrityInput): EscalationIntegrityEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    context: request.integrityContext,
    evidenceIds: Object.freeze(projectEvidenceIds(request.integrityContext, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
    lineageReferences: Object.freeze(
      request.integrityContext === "OWNERSHIP" || request.integrityContext === "AUTHORITY"
        ? request.lineageReferences.slice(0, MAX_INTEGRITY_DEPTH)
        : request.lineageReferences,
    ),
  });
}

export function validateEscalationIntegrity(input: EscalationIntegrityInput): EscalationIntegrityValidation {
  const reasons: EscalationIntegrityReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const contextValid = validateContext(request, reasons);
  const identityValid = validateIdentity(normalizedInput, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const lineageIntegrity = validateLineage(normalizedInput, reasons);
  const evidenceIntegrity = validateEvidenceIntegrity(normalizedInput, reasons);
  const replayIntegrity = validateReplayIntegrity(normalizedInput, reasons);
  const graphIntegrity = validateGraphIntegrity(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const evidencePath = createEscalationIntegrityEvidencePath(normalizedInput);
  const limitsValid = validateLimits(evidencePath, reasons);

  const boundedDegradation = normalizedInput.replay.result.replayState === "LIMITED"
    || normalizedInput.graphIntegration.result.integrationState === "LIMITED"
    || normalizedInput.governance.result.governanceEscalationState === "GOVERNANCE_AWARE"
    || normalizedInput.caution.result.cautionState === "CAUTION";

  const valid = sealedArtifacts
    && contextValid
    && identityValid
    && tenantIsolationVerified
    && ownershipValid
    && lineageIntegrity
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  const integrityState = classifyIntegrityState(
    valid,
    evidenceIntegrity,
    replayIntegrity,
    graphIntegrity,
    boundedDegradation,
  );

  return Object.freeze({
    valid,
    integrityState,
    reasonCodes: normalizeStrings(reasons) as readonly EscalationIntegrityReasonCode[],
    evidenceIntegrity,
    replayIntegrity,
    graphIntegrity,
    authorityBounded: boundary.authorityBounded,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    controlSurfaceAbsent: true as const,
    analyzedArtifactCount: evidencePath.evidenceIds.length,
  });
}

export function buildEscalationIntegrityResult(input: EscalationIntegrityInput): EscalationIntegrityResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createEscalationIntegrityEvidencePath(normalizedInput);
  const validation = validateEscalationIntegrity(normalizedInput);

  const integrityHash = hashIntegrityValue("escalation-integrity-enforcement", {
    request,
    evidencePath,
    integrityState: validation.integrityState,
    evidenceIntegrity: validation.evidenceIntegrity,
    replayIntegrity: validation.replayIntegrity,
    graphIntegrity: validation.graphIntegrity,
    authorityBounded: validation.authorityBounded,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    graphId: request.graphId,
    integrityState: validation.integrityState,
    evidenceIntegrity: validation.evidenceIntegrity,
    replayIntegrity: validation.replayIntegrity,
    graphIntegrity: validation.graphIntegrity,
    authorityBounded: validation.authorityBounded,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    integrityHash,
    deterministic: true,
  });
}

export function buildEscalationIntegrityObservability(
  result: EscalationIntegrityResult,
): EscalationIntegrityObservability {
  return Object.freeze({
    graphId: result.graphId,
    integrityState: result.integrityState,
    evidenceIntegrity: result.evidenceIntegrity,
    replayIntegrity: result.replayIntegrity,
    graphIntegrity: result.graphIntegrity,
    integrityHash: result.integrityHash,
  });
}

export function sealEscalationIntegrity(input: EscalationIntegrityInput): SealedEscalationIntegrityRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createEscalationIntegrityEvidencePath(normalizedInput);
  const validation = validateEscalationIntegrity(normalizedInput);
  const result = buildEscalationIntegrityResult(normalizedInput);
  const observability = buildEscalationIntegrityObservability(result);

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    integrityOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    notificationDispatchAllowed: false as const,
    approvalCreationAllowed: false as const,
    governanceMutationAllowed: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const EscalationIntegrityValidator = Object.freeze({
  validate: validateEscalationIntegrity,
});

export const EscalationIntegrityEnforcement = Object.freeze({
  buildRequest: buildEscalationIntegrityRequest,
  createEvidencePath: createEscalationIntegrityEvidencePath,
  buildResult: buildEscalationIntegrityResult,
  seal: sealEscalationIntegrity,
});

export const EscalationIntegrityObservabilityService = Object.freeze({
  build: buildEscalationIntegrityObservability,
});
