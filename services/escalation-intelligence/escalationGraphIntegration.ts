import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  EscalationGraphIntegrationContext,
  EscalationGraphIntegrationEvidencePath,
  EscalationGraphIntegrationInput,
  EscalationGraphIntegrationObservability,
  EscalationGraphIntegrationReasonCode,
  EscalationGraphIntegrationRequest,
  EscalationGraphIntegrationResult,
  EscalationGraphIntegrationValidation,
  EscalationGraphRelationshipBinding,
  SealedEscalationGraphIntegrationRecord,
} from "./types";

export const MAX_GRAPH_REFERENCES = 5000;
export const MAX_RELATIONSHIP_DEPTH = 20;
export const MAX_ESCALATION_BINDINGS = 1000;

const INTEGRATION_CONTEXTS: readonly EscalationGraphIntegrationContext[] = Object.freeze([
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

function addReason(reasons: EscalationGraphIntegrationReasonCode[], reason: EscalationGraphIntegrationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashIntegrationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: EscalationGraphIntegrationRequest): EscalationGraphIntegrationRequest {
  return Object.freeze({
    graphId: request.graphId,
    tenantId: request.tenantId,
    integrationContext: request.integrationContext,
    lineageReferences: normalizeStrings(request.lineageReferences),
    graphVersion: request.graphVersion,
  });
}

function collectLineage(input: Omit<EscalationGraphIntegrationInput, "request">): string[] {
  return normalizeStrings([
    ...input.intelligence.evidencePath.lineageReferences,
    ...input.oversight.evidencePath.lineageReferences,
    ...input.caution.evidencePath.lineageReferences,
    ...input.governance.evidencePath.lineageReferences,
    ...input.replay.evidencePath.lineageReferences,
    ...input.certification.evidenceChain.lineageReferences,
    ...input.inspection.projection.lineageReferences,
  ]);
}

function collectEvidenceHashes(input: EscalationGraphIntegrationInput): string[] {
  return normalizeStrings([
    input.intelligence.result.escalationEvidenceHash,
    input.oversight.result.oversightEvidenceHash,
    input.caution.result.cautionEvidenceHash,
    input.governance.result.governanceEvidenceHash,
    input.replay.result.replayHash,
    input.replay.result.reconstructionHash,
    input.topology.result.topologyHash,
    input.topology.result.reconstructionHash,
    input.inspection.result.inspectionHash,
    input.certification.result.certificationHash,
  ]);
}

function collectEvidenceIds(input: EscalationGraphIntegrationInput): string[] {
  return normalizeStrings([
    ...input.intelligence.evidencePath.evidenceIds,
    ...input.oversight.evidencePath.evidenceIds,
    ...input.caution.evidencePath.evidenceIds,
    ...input.governance.evidencePath.evidenceIds,
    ...input.replay.evidencePath.evidenceIds,
    ...input.inspection.projection.dependencyIds,
    ...input.certification.evidenceChain.evidenceIds,
  ]);
}

function projectEvidenceIds(
  context: EscalationGraphIntegrationContext,
  input: EscalationGraphIntegrationInput,
): string[] {
  switch (context) {
    case "OWNERSHIP":
      return normalizeStrings(
        input.certification.evidenceChain.evidenceIds.filter((id) =>
          input.inspection.projection.dependencyIds.includes(id),
        ),
      );
    case "LINEAGE":
      return collectLineage({
        intelligence: input.intelligence,
        oversight: input.oversight,
        caution: input.caution,
        governance: input.governance,
        replay: input.replay,
        topology: input.topology,
        inspection: input.inspection,
        certification: input.certification,
        mutationSignalsDetected: input.mutationSignalsDetected,
        executionRequested: input.executionRequested,
        workflowRoutingRequested: input.workflowRoutingRequested,
        notificationDispatchRequested: input.notificationDispatchRequested,
        approvalCreationRequested: input.approvalCreationRequested,
        graphMutationRequested: input.graphMutationRequested,
        graphOptimizationRequested: input.graphOptimizationRequested,
        authorityExpansionRequested: input.authorityExpansionRequested,
      });
    case "TOPOLOGY":
      return normalizeStrings(
        input.topology.nodes.map((node) => node.nodeHash).filter((hash) =>
          input.inspection.projection.topologyNodeHashes.includes(hash),
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

function buildBindings(input: EscalationGraphIntegrationInput): readonly EscalationGraphRelationshipBinding[] {
  const evidenceIds = collectEvidenceIds(input);
  const topologyNodeHashes = [...input.topology.nodes.map((node) => node.nodeHash)].sort();
  const count = Math.min(evidenceIds.length, topologyNodeHashes.length, MAX_ESCALATION_BINDINGS);
  return Object.freeze(
    Array.from({ length: count }, (_, index) =>
      Object.freeze({
        bindingId: `binding:${input.request.graphId}:${String(index + 1).padStart(4, "0")}`,
        graphId: input.request.graphId,
        evidenceId: evidenceIds[index]!,
        topologyNodeHash: topologyNodeHashes[index]!,
        relationshipOrder: index + 1,
      })),
  );
}

function validateSealedArtifacts(input: EscalationGraphIntegrationInput, reasons: EscalationGraphIntegrationReasonCode[]): boolean {
  const states = [
    [input.intelligence.sealed, "INTELLIGENCE_REQUIRED", "INTELLIGENCE_UNSEALED"],
    [input.oversight.sealed, "OVERSIGHT_REQUIRED", "OVERSIGHT_UNSEALED"],
    [input.caution.sealed, "CAUTION_REQUIRED", "CAUTION_UNSEALED"],
    [input.governance.sealed, "GOVERNANCE_REQUIRED", "GOVERNANCE_UNSEALED"],
    [input.replay.sealed, "REPLAY_REQUIRED", "REPLAY_UNSEALED"],
    [input.topology.sealed, "TOPOLOGY_REQUIRED", "TOPOLOGY_UNSEALED"],
    [input.inspection.sealed, "INSPECTION_REQUIRED", "INSPECTION_UNSEALED"],
    [input.certification.sealed, "CERTIFICATION_REQUIRED", "CERTIFICATION_UNSEALED"],
  ] as const;
  for (const [sealed, ok, fail] of states) addReason(reasons, sealed ? ok : fail);
  return states.every(([sealed]) => sealed);
}

function validateContext(request: EscalationGraphIntegrationRequest, reasons: EscalationGraphIntegrationReasonCode[]): boolean {
  const valid = INTEGRATION_CONTEXTS.includes(request.integrationContext);
  addReason(reasons, valid ? "INTEGRATION_CONTEXT_VALID" : "INTEGRATION_CONTEXT_INVALID");
  return valid;
}

function validateIdentity(input: EscalationGraphIntegrationInput, reasons: EscalationGraphIntegrationReasonCode[]): boolean {
  const graphIdValid = input.request.graphId === input.intelligence.result.graphId
    && input.oversight.result.graphId === input.request.graphId
    && input.caution.result.graphId === input.request.graphId
    && input.governance.result.graphId === input.request.graphId
    && input.replay.result.graphId === input.request.graphId
    && input.topology.result.graphId === input.request.graphId
    && input.inspection.result.graphId === input.request.graphId
    && input.certification.result.graphId === input.request.graphId;
  const versionValid = input.request.graphVersion === "decision-graph/v1";
  addReason(reasons, graphIdValid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  addReason(reasons, versionValid ? "GRAPH_VERSION_MATCHED" : "GRAPH_VERSION_MISMATCH");
  return graphIdValid && versionValid;
}

function validateTenantScope(input: EscalationGraphIntegrationInput, reasons: EscalationGraphIntegrationReasonCode[]): boolean {
  const valid = input.intelligence.result.tenantIsolationVerified
    && input.oversight.result.tenantIsolationVerified
    && input.caution.result.tenantIsolationVerified
    && input.governance.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.topology.result.tenantIsolationVerified
    && input.inspection.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: EscalationGraphIntegrationInput, reasons: EscalationGraphIntegrationReasonCode[]): boolean {
  const valid = input.certification.result.ownershipCertified;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateLineagePresence(input: EscalationGraphIntegrationInput, reasons: EscalationGraphIntegrationReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const required = collectLineage({
    intelligence: input.intelligence,
    oversight: input.oversight,
    caution: input.caution,
    governance: input.governance,
    replay: input.replay,
    topology: input.topology,
    inspection: input.inspection,
    certification: input.certification,
    mutationSignalsDetected: input.mutationSignalsDetected,
    executionRequested: input.executionRequested,
    workflowRoutingRequested: input.workflowRoutingRequested,
    notificationDispatchRequested: input.notificationDispatchRequested,
    approvalCreationRequested: input.approvalCreationRequested,
    graphMutationRequested: input.graphMutationRequested,
    graphOptimizationRequested: input.graphOptimizationRequested,
    authorityExpansionRequested: input.authorityExpansionRequested,
  });
  const valid = lineageReferences.length > 0 && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateGraphEvidence(input: EscalationGraphIntegrationInput, reasons: EscalationGraphIntegrationReasonCode[]): boolean {
  const valid = input.topology.nodes.length > 0
    && input.topology.edges.length > 0
    && input.inspection.projection.topologyNodeHashes.length > 0
    && input.certification.evidenceChain.evidenceIds.length > 0;
  addReason(reasons, valid ? "GRAPH_EVIDENCE_PRESENT" : "GRAPH_EVIDENCE_MISSING");
  return valid;
}

function validateRelationshipReferences(
  input: EscalationGraphIntegrationInput,
  bindings: readonly EscalationGraphRelationshipBinding[],
  reasons: EscalationGraphIntegrationReasonCode[],
): boolean {
  const valid = bindings.length > 0
    && input.replay.evidencePath.evidenceIds.length > 0
    && bindings.every((binding, index) => binding.relationshipOrder === index + 1);
  addReason(reasons, valid ? "RELATIONSHIP_REFERENCES_VALID" : "RELATIONSHIP_REFERENCES_BROKEN");
  return valid;
}

function validateTopology(input: EscalationGraphIntegrationInput, reasons: EscalationGraphIntegrationReasonCode[]): boolean {
  const valid = input.topology.result.topologyDeterministic
    && input.inspection.result.topologyDeterministic
    && input.replay.result.replayState !== "INVALID";
  addReason(reasons, valid ? "TOPOLOGY_INTEGRITY_VALID" : "TOPOLOGY_MISMATCH_DETECTED");
  return valid;
}

function validateReplayGraphAlignment(input: EscalationGraphIntegrationInput, reasons: EscalationGraphIntegrationReasonCode[]): boolean {
  const valid = input.replay.result.replayState !== "ESCALATED"
    && input.replay.result.lineageIntegrity
    && input.replay.result.evidenceChainValid;
  addReason(reasons, valid ? "REPLAY_GRAPH_ALIGNMENT_VERIFIED" : "REPLAY_GRAPH_MISMATCH");
  return valid;
}

function validateEvidenceHashes(input: EscalationGraphIntegrationInput, reasons: EscalationGraphIntegrationReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(input: EscalationGraphIntegrationInput, reasons: EscalationGraphIntegrationReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionRequested !== true
    && input.intelligence.validation.authorityBounded
    && input.oversight.validation.authorityBounded
    && input.caution.validation.authorityBounded
    && input.governance.validation.authorityBounded
    && input.replay.validation.authorityBounded
    && input.certification.result.authorityBounded;
  const invalidBoundary = input.mutationSignalsDetected === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.notificationDispatchRequested === true
    || input.approvalCreationRequested === true
    || input.graphMutationRequested === true
    || input.graphOptimizationRequested === true
    || input.authorityExpansionRequested === true;
  addReason(reasons, input.mutationSignalsDetected === true ? "MUTATION_SIGNALS_DETECTED" : "MUTATION_SIGNALS_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.notificationDispatchRequested === true ? "NOTIFICATION_DISPATCH_DETECTED" : "NOTIFICATION_DISPATCH_BLOCKED");
  addReason(reasons, input.approvalCreationRequested === true ? "APPROVAL_CREATION_DETECTED" : "APPROVAL_CREATION_BLOCKED");
  addReason(reasons, input.graphMutationRequested === true ? "GRAPH_MUTATION_DETECTED" : "GRAPH_MUTATION_BLOCKED");
  addReason(reasons, input.graphOptimizationRequested === true ? "GRAPH_OPTIMIZATION_DETECTED" : "GRAPH_OPTIMIZATION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "ESCALATION_GRAPH_INTEGRATION_IS_NOT_EXECUTION");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(
  evidencePath: EscalationGraphIntegrationEvidencePath,
  bindings: readonly EscalationGraphRelationshipBinding[],
  reasons: EscalationGraphIntegrationReasonCode[],
): boolean {
  const referenceValid = evidencePath.evidenceIds.length <= MAX_GRAPH_REFERENCES;
  const depthValid = evidencePath.lineageReferences.length <= MAX_RELATIONSHIP_DEPTH;
  const bindingValid = bindings.length <= MAX_ESCALATION_BINDINGS;
  addReason(reasons, referenceValid ? "GRAPH_REFERENCE_LIMIT_VALID" : "GRAPH_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, depthValid ? "RELATIONSHIP_DEPTH_VALID" : "RELATIONSHIP_DEPTH_EXCEEDED");
  addReason(reasons, bindingValid ? "ESCALATION_BINDING_LIMIT_VALID" : "ESCALATION_BINDING_LIMIT_EXCEEDED");
  return referenceValid && depthValid && bindingValid;
}

function classifyIntegrationState(
  valid: boolean,
  topologyIntegrityVerified: boolean,
  replayAlignmentValid: boolean,
  boundedDegradation: boolean,
): EscalationGraphIntegrationResult["integrationState"] {
  if (!valid) return "INVALID";
  if (!topologyIntegrityVerified || !replayAlignmentValid) return "ESCALATED";
  if (boundedDegradation) return "LIMITED";
  return "INTEGRATED";
}

export function buildEscalationGraphIntegrationRequest(
  input: Omit<EscalationGraphIntegrationInput, "request"> & {
    integrationContext?: EscalationGraphIntegrationContext;
    tenantId?: string;
    graphVersion?: string;
  },
): EscalationGraphIntegrationRequest {
  return Object.freeze({
    graphId: input.intelligence.result.graphId,
    tenantId: input.tenantId ?? "",
    integrationContext: input.integrationContext ?? "FULL",
    lineageReferences: collectLineage(input),
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  } as EscalationGraphIntegrationRequest);
}

export function createEscalationGraphIntegrationEvidencePath(
  input: EscalationGraphIntegrationInput,
): EscalationGraphIntegrationEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    context: request.integrationContext,
    evidenceIds: Object.freeze(projectEvidenceIds(request.integrationContext, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
    lineageReferences: Object.freeze(
      request.integrationContext === "OWNERSHIP" || request.integrationContext === "AUTHORITY"
        ? request.lineageReferences.slice(0, MAX_RELATIONSHIP_DEPTH)
        : request.lineageReferences,
    ),
    topologyNodeHashes: Object.freeze([...input.topology.nodes.map((node) => node.nodeHash)].sort()),
    topologyEdgeHashes: Object.freeze([...input.topology.edges.map((edge) => edge.edgeHash)].sort()),
  });
}

export function validateEscalationGraphIntegration(
  input: EscalationGraphIntegrationInput,
): EscalationGraphIntegrationValidation {
  const reasons: EscalationGraphIntegrationReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const bindings = buildBindings(normalizedInput);
  const evidencePath = createEscalationGraphIntegrationEvidencePath(normalizedInput);

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const contextValid = validateContext(request, reasons);
  const identityValid = validateIdentity(normalizedInput, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const lineageIntegrity = validateLineagePresence(normalizedInput, reasons);
  const graphEvidenceValid = validateGraphEvidence(normalizedInput, reasons);
  const relationshipsBound = validateRelationshipReferences(normalizedInput, bindings, reasons);
  const topologyIntegrityVerified = validateTopology(normalizedInput, reasons);
  const replayAlignmentValid = validateReplayGraphAlignment(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(evidencePath, bindings, reasons);

  const boundedDegradation = normalizedInput.inspection.result.inspectionState === "LIMITED"
    || normalizedInput.replay.result.replayState === "LIMITED"
    || normalizedInput.governance.result.governanceEscalationState === "GOVERNANCE_AWARE";

  const valid = sealedArtifacts
    && contextValid
    && identityValid
    && tenantIsolationVerified
    && ownershipValid
    && lineageIntegrity
    && graphEvidenceValid
    && relationshipsBound
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  const integrationState = classifyIntegrationState(
    valid,
    topologyIntegrityVerified,
    replayAlignmentValid,
    boundedDegradation,
  );

  return Object.freeze({
    valid,
    integrationState,
    reasonCodes: normalizeStrings(reasons) as readonly EscalationGraphIntegrationReasonCode[],
    escalationRelationshipsBound: relationshipsBound,
    topologyIntegrityVerified,
    lineageIntegrity,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    graphReferenceCount: evidencePath.evidenceIds.length,
    bindingCount: bindings.length,
  });
}

export function buildEscalationGraphIntegrationResult(
  input: EscalationGraphIntegrationInput,
): EscalationGraphIntegrationResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const bindings = buildBindings(normalizedInput);
  const evidencePath = createEscalationGraphIntegrationEvidencePath(normalizedInput);
  const validation = validateEscalationGraphIntegration(normalizedInput);

  const relationshipHash = hashIntegrationValue("escalation-graph-integration-relationships", bindings);
  const graphEvidenceHash = hashIntegrationValue("escalation-graph-integration", {
    request,
    evidencePath,
    relationshipHash,
    integrationState: validation.integrationState,
    topologyIntegrityVerified: validation.topologyIntegrityVerified,
    lineageIntegrity: validation.lineageIntegrity,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    graphId: request.graphId,
    integrationState: validation.integrationState,
    escalationRelationshipsBound: validation.escalationRelationshipsBound,
    topologyIntegrityVerified: validation.topologyIntegrityVerified,
    lineageIntegrity: validation.lineageIntegrity,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    graphEvidenceHash,
    relationshipHash,
    deterministic: true,
  });
}

export function buildEscalationGraphIntegrationObservability(
  result: EscalationGraphIntegrationResult,
): EscalationGraphIntegrationObservability {
  return Object.freeze({
    graphId: result.graphId,
    integrationState: result.integrationState,
    escalationRelationshipsBound: result.escalationRelationshipsBound,
    topologyIntegrityVerified: result.topologyIntegrityVerified,
    graphEvidenceHash: result.graphEvidenceHash,
    relationshipHash: result.relationshipHash,
  });
}

export function sealEscalationGraphIntegration(
  input: EscalationGraphIntegrationInput,
): SealedEscalationGraphIntegrationRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const bindings = buildBindings(normalizedInput);
  const evidencePath = createEscalationGraphIntegrationEvidencePath(normalizedInput);
  const validation = validateEscalationGraphIntegration(normalizedInput);
  const result = buildEscalationGraphIntegrationResult(normalizedInput);
  const observability = buildEscalationGraphIntegrationObservability(result);

  return Object.freeze({
    result,
    bindings,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    integrationOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    notificationDispatchAllowed: false as const,
    approvalCreationAllowed: false as const,
    graphMutationAllowed: false as const,
    graphOptimizationAllowed: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const EscalationGraphIntegrationValidator = Object.freeze({
  validate: validateEscalationGraphIntegration,
});

export const EscalationGraphIntegration = Object.freeze({
  buildRequest: buildEscalationGraphIntegrationRequest,
  createEvidencePath: createEscalationGraphIntegrationEvidencePath,
  buildResult: buildEscalationGraphIntegrationResult,
  seal: sealEscalationGraphIntegration,
});

export const EscalationGraphIntegrationObservabilityService = Object.freeze({
  build: buildEscalationGraphIntegrationObservability,
});
