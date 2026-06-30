import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  EscalationIntelligenceContext,
  EscalationIntelligenceEvidencePath,
  EscalationIntelligenceInput,
  EscalationIntelligenceObservability,
  EscalationIntelligenceReasonCode,
  EscalationIntelligenceRequest,
  EscalationIntelligenceResult,
  EscalationIntelligenceValidation,
  SealedEscalationIntelligenceRecord,
} from "./types";

export const MAX_ANALYSIS_DEPTH = 20;
export const MAX_ANALYZED_ARTIFACTS = 5000;

const ESCALATION_CONTEXTS: readonly EscalationIntelligenceContext[] = Object.freeze([
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

function addReason(reasons: EscalationIntelligenceReasonCode[], reason: EscalationIntelligenceReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashEscalationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: EscalationIntelligenceRequest): EscalationIntelligenceRequest {
  return Object.freeze({
    graphId: request.graphId,
    tenantId: request.tenantId,
    escalationContext: request.escalationContext,
    lineageReferences: normalizeStrings(request.lineageReferences),
    graphVersion: request.graphVersion,
  });
}

function collectLineage(input: Omit<EscalationIntelligenceInput, "request">): string[] {
  return normalizeStrings([
    ...input.certification.evidenceChain.lineageReferences,
    ...input.verification.verificationPath.lineageReferences,
    ...input.inspection.projection.lineageReferences,
  ]);
}

function collectEvidenceHashes(input: EscalationIntelligenceInput): string[] {
  return normalizeStrings([
    input.certification.result.certificationHash,
    input.verification.result.verificationHash,
    input.inspection.result.inspectionHash,
    input.topology.result.topologyHash,
    input.topology.result.reconstructionHash,
  ]);
}

function collectEvidenceIds(input: EscalationIntelligenceInput): string[] {
  return normalizeStrings([
    ...input.certification.evidenceChain.evidenceIds,
    ...input.verification.verificationPath.artifactIds,
    ...input.inspection.projection.nodeIds,
    ...input.inspection.projection.edgeIds,
  ]);
}

function projectEvidenceIds(context: EscalationIntelligenceContext, input: EscalationIntelligenceInput): string[] {
  switch (context) {
    case "OWNERSHIP":
      return normalizeStrings(
        input.certification.evidenceChain.evidenceIds.filter((id) =>
          input.verification.verificationPath.artifactIds.includes(id),
        ),
      );
    case "LINEAGE":
      return collectLineage({
        certification: input.certification,
        verification: input.verification,
        inspection: input.inspection,
        topology: input.topology,
        mutationSignalsDetected: input.mutationSignalsDetected,
        executionRequested: input.executionRequested,
        workflowRoutingRequested: input.workflowRoutingRequested,
        approvalCreationRequested: input.approvalCreationRequested,
        notificationDispatchRequested: input.notificationDispatchRequested,
        governanceMutationRequested: input.governanceMutationRequested,
        containmentActionRequested: input.containmentActionRequested,
        authorityExpansionRequested: input.authorityExpansionRequested,
      });
    case "TOPOLOGY":
      return normalizeStrings([
        ...input.topology.nodes.map((node) => node.nodeHash),
        ...input.topology.edges.map((edge) => edge.edgeHash),
      ]);
    case "AUTHORITY":
      return normalizeStrings(
        input.certification.evidenceChain.evidenceIds.filter((id) =>
          input.inspection.projection.nodeIds.includes(id) || input.inspection.projection.edgeIds.includes(id),
        ),
      );
    case "FULL":
      return collectEvidenceIds(input);
  }
}

function collectTopologyNodeHashes(context: EscalationIntelligenceContext, input: EscalationIntelligenceInput): string[] {
  return context === "TOPOLOGY" || context === "FULL"
    ? normalizeStrings(input.topology.nodes.map((node) => node.nodeHash))
    : [];
}

function collectTopologyEdgeHashes(context: EscalationIntelligenceContext, input: EscalationIntelligenceInput): string[] {
  return context === "TOPOLOGY" || context === "FULL"
    ? normalizeStrings(input.topology.edges.map((edge) => edge.edgeHash))
    : [];
}

function validateSealedArtifacts(input: EscalationIntelligenceInput, reasons: EscalationIntelligenceReasonCode[]): boolean {
  const certificationSealed = input.certification.sealed;
  const verificationSealed = input.verification.sealed;
  const inspectionSealed = input.inspection.sealed;
  const topologySealed = input.topology.sealed && input.topology.result.sealed;

  addReason(reasons, certificationSealed ? "CERTIFICATION_REQUIRED" : "CERTIFICATION_UNSEALED");
  addReason(reasons, verificationSealed ? "VERIFICATION_REQUIRED" : "VERIFICATION_UNSEALED");
  addReason(reasons, inspectionSealed ? "INSPECTION_REQUIRED" : "INSPECTION_UNSEALED");
  addReason(reasons, topologySealed ? "TOPOLOGY_REQUIRED" : "TOPOLOGY_UNSEALED");

  return certificationSealed && verificationSealed && inspectionSealed && topologySealed;
}

function validateContext(request: EscalationIntelligenceRequest, reasons: EscalationIntelligenceReasonCode[]): boolean {
  const valid = ESCALATION_CONTEXTS.includes(request.escalationContext);
  addReason(reasons, valid ? "ESCALATION_CONTEXT_VALID" : "ESCALATION_CONTEXT_INVALID");
  return valid;
}

function validateIdentity(input: EscalationIntelligenceInput, reasons: EscalationIntelligenceReasonCode[]): boolean {
  const graphIdValid = input.request.graphId === input.certification.result.graphId
    && input.verification.result.graphId === input.request.graphId
    && input.inspection.result.graphId === input.request.graphId
    && input.topology.result.graphId === input.request.graphId;
  const versionValid = input.request.graphVersion === "decision-graph/v1";
  addReason(reasons, graphIdValid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  addReason(reasons, versionValid ? "GRAPH_VERSION_MATCHED" : "GRAPH_VERSION_MISMATCH");
  return graphIdValid && versionValid;
}

function validateTenantScope(input: EscalationIntelligenceInput, reasons: EscalationIntelligenceReasonCode[]): boolean {
  const valid = input.certification.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified
    && input.inspection.result.tenantIsolationVerified
    && input.topology.result.tenantIsolationVerified
    && input.topology.nodes.every((node) => node.tenantId === input.request.tenantId);
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: EscalationIntelligenceInput, reasons: EscalationIntelligenceReasonCode[]): boolean {
  const valid = input.certification.result.ownershipCertified
    && input.verification.result.ownershipIntegrity;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateLineage(input: EscalationIntelligenceInput, reasons: EscalationIntelligenceReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const required = collectLineage({
    certification: input.certification,
    verification: input.verification,
    inspection: input.inspection,
    topology: input.topology,
    mutationSignalsDetected: input.mutationSignalsDetected,
    executionRequested: input.executionRequested,
    workflowRoutingRequested: input.workflowRoutingRequested,
    approvalCreationRequested: input.approvalCreationRequested,
    notificationDispatchRequested: input.notificationDispatchRequested,
    governanceMutationRequested: input.governanceMutationRequested,
    containmentActionRequested: input.containmentActionRequested,
    authorityExpansionRequested: input.authorityExpansionRequested,
  });
  const valid = lineageReferences.length > 0
    && input.certification.result.lineageCertified
    && input.verification.result.lineageIntegrity
    && input.inspection.result.lineageIntegrity
    && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateTopology(input: EscalationIntelligenceInput, reasons: EscalationIntelligenceReasonCode[]): boolean {
  const valid = input.certification.result.topologyCertified
    && input.verification.result.topologyIntegrity
    && input.inspection.result.topologyDeterministic
    && input.topology.result.topologyDeterministic
    && input.topology.validation.reconstructionComplete;
  addReason(reasons, valid ? "TOPOLOGY_INTEGRITY_VALID" : "TOPOLOGY_DEGRADATION_DETECTED");
  return valid;
}

function validateEvidenceChain(input: EscalationIntelligenceInput, reasons: EscalationIntelligenceReasonCode[]): boolean {
  const valid = input.certification.evidenceChain.evidenceIds.length > 0
    && input.verification.verificationPath.artifactIds.length > 0
    && input.inspection.projection.nodeIds.length >= 0
    && input.certification.evidenceChain.evidenceHashes.length > 0;
  addReason(reasons, valid ? "EVIDENCE_CHAIN_VALID" : "EVIDENCE_CHAIN_BROKEN");
  return valid;
}

function validateEvidenceHashes(input: EscalationIntelligenceInput, reasons: EscalationIntelligenceReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(input: EscalationIntelligenceInput, reasons: EscalationIntelligenceReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionRequested !== true
    && input.certification.result.authorityBounded
    && input.verification.result.authorityBounded;
  const invalidBoundary = input.mutationSignalsDetected === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.approvalCreationRequested === true
    || input.notificationDispatchRequested === true
    || input.governanceMutationRequested === true
    || input.containmentActionRequested === true;

  addReason(reasons, input.mutationSignalsDetected === true ? "MUTATION_SIGNALS_DETECTED" : "MUTATION_SIGNALS_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.approvalCreationRequested === true ? "APPROVAL_CREATION_DETECTED" : "APPROVAL_CREATION_BLOCKED");
  addReason(reasons, input.notificationDispatchRequested === true ? "NOTIFICATION_DISPATCH_DETECTED" : "NOTIFICATION_DISPATCH_BLOCKED");
  addReason(reasons, input.governanceMutationRequested === true ? "GOVERNANCE_MUTATION_DETECTED" : "GOVERNANCE_MUTATION_BLOCKED");
  addReason(reasons, input.containmentActionRequested === true ? "CONTAINMENT_ACTION_DETECTED" : "CONTAINMENT_ACTION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "ESCALATION_INTELLIGENCE_IS_NOT_EXECUTION");

  return Object.freeze({
    executionImpossible,
    authorityBounded,
    invalidBoundary,
  });
}

function classifyEscalation(
  ownershipConcern: boolean,
  lineageConcern: boolean,
  authorityConcern: boolean,
  topologyConcern: boolean,
  topologyDegraded: boolean,
  tenantIsolationVerified: boolean,
): EscalationIntelligenceResult["escalationClassification"] {
  if (authorityConcern || !tenantIsolationVerified || lineageConcern || topologyDegraded) {
    return "HIGH_ATTENTION";
  }

  const concernCount = [ownershipConcern, lineageConcern, authorityConcern, topologyConcern].filter(Boolean).length;
  if (concernCount >= 2) return "ESCALATION_CANDIDATE";
  if (concernCount === 1) return "REVIEW_REQUIRED";
  return "NO_ESCALATION";
}

function validateLimits(path: EscalationIntelligenceEvidencePath, reasons: EscalationIntelligenceReasonCode[]): boolean {
  const depthValid = path.lineageReferences.length <= MAX_ANALYSIS_DEPTH;
  const artifactCount = path.evidenceIds.length + path.topologyNodeHashes.length + path.topologyEdgeHashes.length;
  const artifactValid = artifactCount <= MAX_ANALYZED_ARTIFACTS;
  addReason(reasons, depthValid ? "ANALYSIS_DEPTH_VALID" : "ANALYSIS_DEPTH_EXCEEDED");
  addReason(reasons, artifactValid ? "ANALYZED_ARTIFACT_LIMIT_VALID" : "ANALYZED_ARTIFACT_LIMIT_EXCEEDED");
  return depthValid && artifactValid;
}

export function buildEscalationIntelligenceRequest(
  input: Omit<EscalationIntelligenceInput, "request"> & {
    escalationContext?: EscalationIntelligenceContext;
    tenantId?: string;
    graphVersion?: string;
  },
): EscalationIntelligenceRequest {
  return Object.freeze({
    graphId: input.certification.result.graphId,
    tenantId: input.tenantId ?? input.topology.nodes[0]?.tenantId ?? "",
    escalationContext: input.escalationContext ?? "FULL",
    lineageReferences: collectLineage(input),
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  } as EscalationIntelligenceRequest);
}

export function createEscalationIntelligenceEvidencePath(
  input: EscalationIntelligenceInput,
): EscalationIntelligenceEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    context: request.escalationContext,
    evidenceIds: Object.freeze(projectEvidenceIds(request.escalationContext, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
    lineageReferences: Object.freeze(
      request.escalationContext === "OWNERSHIP" || request.escalationContext === "AUTHORITY"
        ? request.lineageReferences.slice(0, MAX_ANALYSIS_DEPTH)
        : request.lineageReferences,
    ),
    topologyNodeHashes: Object.freeze(collectTopologyNodeHashes(request.escalationContext, input)),
    topologyEdgeHashes: Object.freeze(collectTopologyEdgeHashes(request.escalationContext, input)),
  });
}

export function validateEscalationIntelligence(input: EscalationIntelligenceInput): EscalationIntelligenceValidation {
  const reasons: EscalationIntelligenceReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const contextValid = validateContext(request, reasons);
  const identityValid = validateIdentity(normalizedInput, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const lineageValid = validateLineage(normalizedInput, reasons);
  const topologyValid = validateTopology(normalizedInput, reasons);
  const evidenceChainValid = validateEvidenceChain(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const evidencePath = createEscalationIntelligenceEvidencePath(normalizedInput);
  const limitsValid = validateLimits(evidencePath, reasons);

  const ownershipConcern = !ownershipValid;
  const lineageConcern = !lineageValid;
  const authorityConcern = !boundary.authorityBounded;
  const topologyConcern = !topologyValid || normalizedInput.certification.result.certificationStatus === "CONDITIONAL_PASS";
  const topologyDegraded = !topologyValid;
  const escalationClassification = boundary.authorityBounded
    ? classifyEscalation(
      ownershipConcern,
      lineageConcern,
      authorityConcern,
      topologyConcern,
      topologyDegraded,
      tenantIsolationVerified,
    )
    : "HIGH_ATTENTION";

  const valid = sealedArtifacts
    && contextValid
    && identityValid
    && tenantIsolationVerified
    && ownershipValid
    && lineageValid
    && topologyValid
    && evidenceChainValid
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    reasonCodes: normalizeStrings(reasons) as readonly EscalationIntelligenceReasonCode[],
    escalationClassification,
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
    analyzedArtifactCount:
      evidencePath.evidenceIds.length + evidencePath.topologyNodeHashes.length + evidencePath.topologyEdgeHashes.length,
  });
}

export function buildEscalationIntelligenceResult(input: EscalationIntelligenceInput): EscalationIntelligenceResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const validation = validateEscalationIntelligence(normalizedInput);
  const evidencePath = createEscalationIntelligenceEvidencePath(normalizedInput);
  const escalationEvidenceHash = hashEscalationValue("escalation-intelligence-engine", {
    request,
    evidencePath,
    escalationClassification: validation.escalationClassification,
    ownershipConcern: validation.ownershipConcern,
    lineageConcern: validation.lineageConcern,
    authorityConcern: validation.authorityConcern,
    topologyConcern: validation.topologyConcern,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    graphId: request.graphId,
    escalationClassification: validation.escalationClassification,
    ownershipConcern: validation.ownershipConcern,
    lineageConcern: validation.lineageConcern,
    authorityConcern: validation.authorityConcern,
    topologyConcern: validation.topologyConcern,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    escalationEvidenceHash,
    deterministic: true,
  });
}

export function buildEscalationIntelligenceObservability(
  result: EscalationIntelligenceResult,
): EscalationIntelligenceObservability {
  return Object.freeze({
    graphId: result.graphId,
    escalationClassification: result.escalationClassification,
    ownershipConcern: result.ownershipConcern,
    lineageConcern: result.lineageConcern,
    authorityConcern: result.authorityConcern,
    escalationEvidenceHash: result.escalationEvidenceHash,
  });
}

export function sealEscalationIntelligence(input: EscalationIntelligenceInput): SealedEscalationIntelligenceRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createEscalationIntelligenceEvidencePath(normalizedInput);
  const validation = validateEscalationIntelligence(normalizedInput);
  const result = buildEscalationIntelligenceResult(normalizedInput);
  const observability = buildEscalationIntelligenceObservability(result);

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    intelligenceOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    approvalCreationAllowed: false as const,
    notificationDispatchAllowed: false as const,
    governanceMutationAllowed: false as const,
    containmentActionAllowed: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const EscalationIntelligenceValidator = Object.freeze({
  validate: validateEscalationIntelligence,
});

export const EscalationIntelligenceEngine = Object.freeze({
  buildRequest: buildEscalationIntelligenceRequest,
  createEvidencePath: createEscalationIntelligenceEvidencePath,
  buildResult: buildEscalationIntelligenceResult,
  seal: sealEscalationIntelligence,
});

export const EscalationIntelligenceObservabilityService = Object.freeze({
  build: buildEscalationIntelligenceObservability,
});
