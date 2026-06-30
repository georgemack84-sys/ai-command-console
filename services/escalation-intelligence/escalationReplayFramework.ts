import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  EscalationReplayContext,
  EscalationReplayEvidencePath,
  EscalationReplayInput,
  EscalationReplayObservability,
  EscalationReplayReasonCode,
  EscalationReplayRequest,
  EscalationReplayResult,
  EscalationReplayValidation,
  SealedEscalationReplayRecord,
} from "./types";

export const MAX_REPLAY_DEPTH = 20;
export const MAX_REPLAY_ARTIFACTS = 5000;

const REPLAY_CONTEXTS: readonly EscalationReplayContext[] = Object.freeze([
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

function addReason(reasons: EscalationReplayReasonCode[], reason: EscalationReplayReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashReplayValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: EscalationReplayRequest): EscalationReplayRequest {
  return Object.freeze({
    graphId: request.graphId,
    tenantId: request.tenantId,
    replayContext: request.replayContext,
    lineageReferences: normalizeStrings(request.lineageReferences),
    graphVersion: request.graphVersion,
  });
}

function collectLineage(input: Omit<EscalationReplayInput, "request">): string[] {
  return normalizeStrings([
    ...input.intelligence.evidencePath.lineageReferences,
    ...input.oversight.evidencePath.lineageReferences,
    ...input.caution.evidencePath.lineageReferences,
    ...input.governance.evidencePath.lineageReferences,
    ...input.verification.verificationPath.lineageReferences,
    ...input.certification.evidenceChain.lineageReferences,
  ]);
}

function collectEvidenceHashes(input: EscalationReplayInput): string[] {
  return normalizeStrings([
    input.intelligence.result.escalationEvidenceHash,
    input.oversight.result.oversightEvidenceHash,
    input.caution.result.cautionEvidenceHash,
    input.governance.result.governanceEvidenceHash,
    input.verification.result.verificationHash,
    input.certification.result.certificationHash,
  ]);
}

function collectEvidenceIds(input: EscalationReplayInput): string[] {
  return normalizeStrings([
    ...input.intelligence.evidencePath.evidenceIds,
    ...input.oversight.evidencePath.evidenceIds,
    ...input.caution.evidencePath.evidenceIds,
    ...input.governance.evidencePath.evidenceIds,
    ...input.verification.verificationPath.artifactIds,
    ...input.certification.evidenceChain.evidenceIds,
  ]);
}

function projectEvidenceIds(context: EscalationReplayContext, input: EscalationReplayInput): string[] {
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
        verification: input.verification,
        certification: input.certification,
        mutationSignalsDetected: input.mutationSignalsDetected,
        executionRequested: input.executionRequested,
        workflowRoutingRequested: input.workflowRoutingRequested,
        approvalCreationRequested: input.approvalCreationRequested,
        notificationDispatchRequested: input.notificationDispatchRequested,
        governanceMutationRequested: input.governanceMutationRequested,
        repairRequested: input.repairRequested,
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
        input.governance.evidencePath.evidenceIds.filter((id) =>
          input.intelligence.evidencePath.evidenceIds.includes(id),
        ),
      );
    case "FULL":
      return collectEvidenceIds(input);
  }
}

function validateSealedArtifacts(input: EscalationReplayInput, reasons: EscalationReplayReasonCode[]): boolean {
  const intelligenceSealed = input.intelligence.sealed;
  const oversightSealed = input.oversight.sealed;
  const cautionSealed = input.caution.sealed;
  const governanceSealed = input.governance.sealed;
  const verificationSealed = input.verification.sealed;
  const certificationSealed = input.certification.sealed;
  addReason(reasons, intelligenceSealed ? "INTELLIGENCE_REQUIRED" : "INTELLIGENCE_UNSEALED");
  addReason(reasons, oversightSealed ? "OVERSIGHT_REQUIRED" : "OVERSIGHT_UNSEALED");
  addReason(reasons, cautionSealed ? "CAUTION_REQUIRED" : "CAUTION_UNSEALED");
  addReason(reasons, governanceSealed ? "GOVERNANCE_REQUIRED" : "GOVERNANCE_UNSEALED");
  addReason(reasons, verificationSealed ? "VERIFICATION_REQUIRED" : "VERIFICATION_UNSEALED");
  addReason(reasons, certificationSealed ? "CERTIFICATION_REQUIRED" : "CERTIFICATION_UNSEALED");
  return intelligenceSealed && oversightSealed && cautionSealed && governanceSealed && verificationSealed && certificationSealed;
}

function validateContext(request: EscalationReplayRequest, reasons: EscalationReplayReasonCode[]): boolean {
  const valid = REPLAY_CONTEXTS.includes(request.replayContext);
  addReason(reasons, valid ? "REPLAY_CONTEXT_VALID" : "REPLAY_CONTEXT_INVALID");
  return valid;
}

function validateIdentity(input: EscalationReplayInput, reasons: EscalationReplayReasonCode[]): boolean {
  const graphIdValid = input.request.graphId === input.intelligence.result.graphId
    && input.oversight.result.graphId === input.request.graphId
    && input.caution.result.graphId === input.request.graphId
    && input.governance.result.graphId === input.request.graphId
    && input.verification.result.graphId === input.request.graphId
    && input.certification.result.graphId === input.request.graphId;
  const versionValid = input.request.graphVersion === "decision-graph/v1";
  addReason(reasons, graphIdValid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  addReason(reasons, versionValid ? "GRAPH_VERSION_MATCHED" : "GRAPH_VERSION_MISMATCH");
  return graphIdValid && versionValid;
}

function validateTenantScope(input: EscalationReplayInput, reasons: EscalationReplayReasonCode[]): boolean {
  const valid = input.intelligence.result.tenantIsolationVerified
    && input.oversight.result.tenantIsolationVerified
    && input.caution.result.tenantIsolationVerified
    && input.governance.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: EscalationReplayInput, reasons: EscalationReplayReasonCode[]): boolean {
  const valid = input.certification.result.ownershipCertified && input.verification.result.ownershipIntegrity;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateLineagePresence(input: EscalationReplayInput, reasons: EscalationReplayReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const required = collectLineage({
    intelligence: input.intelligence,
    oversight: input.oversight,
    caution: input.caution,
    governance: input.governance,
    verification: input.verification,
    certification: input.certification,
    mutationSignalsDetected: input.mutationSignalsDetected,
    executionRequested: input.executionRequested,
    workflowRoutingRequested: input.workflowRoutingRequested,
    approvalCreationRequested: input.approvalCreationRequested,
    notificationDispatchRequested: input.notificationDispatchRequested,
    governanceMutationRequested: input.governanceMutationRequested,
    repairRequested: input.repairRequested,
    authorityExpansionRequested: input.authorityExpansionRequested,
  });
  const present = lineageReferences.length > 0 && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  return present;
}

function validateLineageIntegrity(input: EscalationReplayInput, reasons: EscalationReplayReasonCode[]): boolean {
  const valid = input.verification.result.lineageIntegrity
    && input.certification.result.lineageCertified
    && !input.intelligence.result.lineageConcern
    && !input.oversight.result.lineageConcern
    && !input.caution.result.ambiguityDetected;
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateEvidenceChain(input: EscalationReplayInput, reasons: EscalationReplayReasonCode[]): boolean {
  const valid = input.intelligence.evidencePath.evidenceIds.length > 0
    && input.oversight.evidencePath.evidenceIds.length > 0
    && input.caution.evidencePath.evidenceIds.length > 0
    && input.governance.evidencePath.evidenceIds.length > 0
    && input.verification.verificationPath.artifactIds.length > 0
    && input.certification.evidenceChain.evidenceIds.length > 0;
  addReason(reasons, valid ? "EVIDENCE_CHAIN_VALID" : "EVIDENCE_CHAIN_BROKEN");
  return valid;
}

function validateEvidenceHashes(input: EscalationReplayInput, reasons: EscalationReplayReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(input: EscalationReplayInput, reasons: EscalationReplayReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionRequested !== true
    && input.intelligence.validation.authorityBounded
    && input.oversight.validation.authorityBounded
    && input.caution.validation.authorityBounded
    && input.governance.validation.authorityBounded
    && input.verification.result.authorityBounded
    && input.certification.result.authorityBounded;
  const invalidBoundary = input.mutationSignalsDetected === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.approvalCreationRequested === true
    || input.notificationDispatchRequested === true
    || input.governanceMutationRequested === true
    || input.repairRequested === true;
  addReason(reasons, input.mutationSignalsDetected === true ? "MUTATION_SIGNALS_DETECTED" : "MUTATION_SIGNALS_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.approvalCreationRequested === true ? "APPROVAL_CREATION_DETECTED" : "APPROVAL_CREATION_BLOCKED");
  addReason(reasons, input.notificationDispatchRequested === true ? "NOTIFICATION_DISPATCH_DETECTED" : "NOTIFICATION_DISPATCH_BLOCKED");
  addReason(reasons, input.governanceMutationRequested === true ? "GOVERNANCE_MUTATION_DETECTED" : "GOVERNANCE_MUTATION_BLOCKED");
  addReason(reasons, input.repairRequested === true ? "REPAIR_DETECTED" : "REPAIR_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "ESCALATION_REPLAY_IS_NOT_EXECUTION");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(path: EscalationReplayEvidencePath, reasons: EscalationReplayReasonCode[]): boolean {
  const depthValid = path.lineageReferences.length <= MAX_REPLAY_DEPTH;
  const artifactValid = path.evidenceIds.length <= MAX_REPLAY_ARTIFACTS;
  addReason(reasons, depthValid ? "ANALYSIS_DEPTH_VALID" : "ANALYSIS_DEPTH_EXCEEDED");
  addReason(reasons, artifactValid ? "REPLAY_ARTIFACT_LIMIT_VALID" : "REPLAY_ARTIFACT_LIMIT_EXCEEDED");
  return depthValid && artifactValid;
}

function detectReplayDrift(input: EscalationReplayInput, reasons: EscalationReplayReasonCode[]): boolean {
  const driftDetected = !input.verification.result.deterministicReplayVerified
    || !input.certification.result.replayDeterministic;
  addReason(reasons, driftDetected ? "REPLAY_DRIFT_DETECTED" : "REPLAY_DETERMINISM_VERIFIED");
  return driftDetected;
}

function detectReconstructionMismatch(input: EscalationReplayInput, reasons: EscalationReplayReasonCode[]): boolean {
  const mismatch = input.verification.result.verificationStatus === "ESCALATED"
    || input.certification.result.certificationStatus === "CONDITIONAL_PASS";
  addReason(reasons, mismatch ? "RECONSTRUCTION_MISMATCH" : "RECONSTRUCTION_HASH_VERIFIED");
  return mismatch;
}

function classifyReplayState(
  valid: boolean,
  replayDriftDetected: boolean,
  reconstructionMismatch: boolean,
  lineageIntegrity: boolean,
  boundedDegradation: boolean,
): EscalationReplayResult["replayState"] {
  if (!valid) return "INVALID";
  if (replayDriftDetected || reconstructionMismatch || !lineageIntegrity) return "ESCALATED";
  if (boundedDegradation) return "LIMITED";
  return "REPLAYABLE";
}

export function buildEscalationReplayRequest(
  input: Omit<EscalationReplayInput, "request"> & {
    replayContext?: EscalationReplayContext;
    tenantId?: string;
    graphVersion?: string;
  },
): EscalationReplayRequest {
  return Object.freeze({
    graphId: input.intelligence.result.graphId,
    tenantId: input.tenantId ?? "",
    replayContext: input.replayContext ?? "FULL",
    lineageReferences: collectLineage(input),
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  } as EscalationReplayRequest);
}

export function createEscalationReplayEvidencePath(input: EscalationReplayInput): EscalationReplayEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    context: request.replayContext,
    evidenceIds: Object.freeze(projectEvidenceIds(request.replayContext, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
    lineageReferences: Object.freeze(
      request.replayContext === "OWNERSHIP" || request.replayContext === "AUTHORITY"
        ? request.lineageReferences.slice(0, MAX_REPLAY_DEPTH)
        : request.lineageReferences,
    ),
  });
}

export function validateEscalationReplay(input: EscalationReplayInput): EscalationReplayValidation {
  const reasons: EscalationReplayReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const contextValid = validateContext(request, reasons);
  const identityValid = validateIdentity(normalizedInput, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const lineagePresent = validateLineagePresence(normalizedInput, reasons);
  const lineageIntegrity = validateLineageIntegrity(normalizedInput, reasons);
  const evidenceChainValid = validateEvidenceChain(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const evidencePath = createEscalationReplayEvidencePath(normalizedInput);
  const limitsValid = validateLimits(evidencePath, reasons);
  const replayDriftDetected = detectReplayDrift(normalizedInput, reasons);
  const reconstructionMismatch = detectReconstructionMismatch(normalizedInput, reasons);

  const boundedDegradation = normalizedInput.caution.result.cautionState === "CAUTION"
    || normalizedInput.oversight.result.oversightRequirement === "OBSERVE"
    || normalizedInput.governance.result.governanceEscalationState === "GOVERNANCE_AWARE"
    || normalizedInput.verification.result.verificationStatus === "LIMITED";

  const valid = sealedArtifacts
    && contextValid
    && identityValid
    && tenantIsolationVerified
    && ownershipValid
    && lineagePresent
    && evidenceChainValid
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  const replayState = classifyReplayState(
    valid,
    replayDriftDetected,
    reconstructionMismatch,
    lineageIntegrity,
    boundedDegradation,
  );

  return Object.freeze({
    valid,
    replayState,
    reasonCodes: normalizeStrings(reasons) as readonly EscalationReplayReasonCode[],
    replayDeterministic: !replayDriftDetected,
    lineageIntegrity,
    tenantIsolationVerified,
    evidenceChainValid,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    replayArtifactCount: evidencePath.evidenceIds.length,
  });
}

export function buildEscalationReplayResult(input: EscalationReplayInput): EscalationReplayResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const validation = validateEscalationReplay(normalizedInput);
  const evidencePath = createEscalationReplayEvidencePath(normalizedInput);

  const replayHash = hashReplayValue("escalation-replay-framework", {
    request,
    evidencePath,
    replayState: validation.replayState,
    replayDeterministic: validation.replayDeterministic,
    lineageIntegrity: validation.lineageIntegrity,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    evidenceChainValid: validation.evidenceChainValid,
  });

  const reconstructionHash = hashReplayValue("escalation-replay-reconstruction", {
    request,
    evidenceIds: evidencePath.evidenceIds,
    evidenceHashes: evidencePath.evidenceHashes,
    lineageReferences: evidencePath.lineageReferences,
  });

  return Object.freeze({
    graphId: request.graphId,
    replayState: validation.replayState,
    replayDeterministic: validation.replayDeterministic,
    lineageIntegrity: validation.lineageIntegrity,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    evidenceChainValid: validation.evidenceChainValid,
    replayHash,
    reconstructionHash,
  });
}

export function buildEscalationReplayObservability(
  result: EscalationReplayResult,
): EscalationReplayObservability {
  return Object.freeze({
    graphId: result.graphId,
    replayState: result.replayState,
    replayDeterministic: result.replayDeterministic,
    lineageIntegrity: result.lineageIntegrity,
    replayHash: result.replayHash,
    reconstructionHash: result.reconstructionHash,
  });
}

export function sealEscalationReplay(input: EscalationReplayInput): SealedEscalationReplayRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createEscalationReplayEvidencePath(normalizedInput);
  const validation = validateEscalationReplay(normalizedInput);
  const result = buildEscalationReplayResult(normalizedInput);
  const observability = buildEscalationReplayObservability(result);

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    replayOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    approvalCreationAllowed: false as const,
    notificationDispatchAllowed: false as const,
    governanceMutationAllowed: false as const,
    repairAuthorized: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const EscalationReplayValidator = Object.freeze({
  validate: validateEscalationReplay,
});

export const EscalationReplayFramework = Object.freeze({
  buildRequest: buildEscalationReplayRequest,
  createEvidencePath: createEscalationReplayEvidencePath,
  buildResult: buildEscalationReplayResult,
  seal: sealEscalationReplay,
});

export const EscalationReplayObservabilityService = Object.freeze({
  build: buildEscalationReplayObservability,
});
