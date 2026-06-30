import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  DecisionGraphCertificationEvidenceChain,
  DecisionGraphCertificationInput,
  DecisionGraphCertificationObservability,
  DecisionGraphCertificationReasonCode,
  DecisionGraphCertificationRequest,
  DecisionGraphCertificationResult,
  DecisionGraphCertificationScope,
  DecisionGraphCertificationValidation,
  SealedDecisionGraphCertificationRecord,
} from "./types";

export const MAX_CERTIFICATION_DEPTH = 20;
export const MAX_CERTIFIED_ARTIFACTS = 5000;

const CERTIFICATION_SCOPES: readonly DecisionGraphCertificationScope[] = Object.freeze([
  "AUTHORITY",
  "FULL",
  "LINEAGE",
  "OWNERSHIP",
  "TOPOLOGY",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  failBoundary: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: DecisionGraphCertificationReasonCode[], reason: DecisionGraphCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashCertificationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: DecisionGraphCertificationRequest): DecisionGraphCertificationRequest {
  return Object.freeze({
    graphId: request.graphId,
    tenantId: request.tenantId,
    certificationScope: request.certificationScope,
    lineageReferences: normalizeStrings(request.lineageReferences),
    graphVersion: request.graphVersion,
  });
}

function collectLineage(input: Omit<DecisionGraphCertificationInput, "request">): string[] {
  return normalizeStrings([
    ...input.graph.contract.lineageReferences,
    ...input.graph.nodes.map((node) => node.lineageReference),
    ...input.proposalGraph.proposalNodes.map((node) => node.lineageReference),
    ...input.governanceGraph.governanceNodes.map((node) => node.lineageReference),
    ...input.escalationGraph.escalationNodes.map((node) => node.lineageReference),
    ...input.inspection.projection.lineageReferences,
    ...input.verification.verificationPath.lineageReferences,
  ]);
}

function collectAllEvidenceIds(input: DecisionGraphCertificationInput): string[] {
  return normalizeStrings([
    input.graph.contract.graphId,
    ...input.graph.nodes.map((node) => node.nodeId),
    ...input.graph.edges.map((edge) => edge.edgeId),
    ...input.dependencyGraph.edges.map((edge) => edge.edgeId),
    ...input.proposalGraph.proposalNodes.map((node) => node.proposalId),
    ...input.proposalGraph.edges.map((edge) => edge.edgeId),
    ...input.governanceGraph.governanceNodes.map((node) => node.governanceId),
    ...input.governanceGraph.edges.map((edge) => edge.edgeId),
    ...input.escalationGraph.escalationNodes.map((node) => node.escalationId),
    ...input.escalationGraph.edges.map((edge) => edge.edgeId),
    ...input.topology.nodes.map((node) => node.nodeHash),
    ...input.topology.edges.map((edge) => edge.edgeHash),
    ...input.inspection.projection.nodeIds,
    ...input.inspection.projection.edgeIds,
    ...input.verification.verificationPath.artifactIds,
  ]);
}

function collectOwnershipEvidenceIds(input: DecisionGraphCertificationInput): string[] {
  return normalizeStrings([
    input.graph.contract.graphId,
    ...input.graph.nodes.map((node) => node.nodeId),
    ...input.proposalGraph.proposalNodes.map((node) => node.proposalId),
    ...input.governanceGraph.governanceNodes.map((node) => node.governanceId),
    ...input.escalationGraph.escalationNodes.map((node) => node.escalationId),
    ...input.verification.verificationPath.artifactIds,
  ]);
}

function collectAuthorityEvidenceIds(input: DecisionGraphCertificationInput): string[] {
  return normalizeStrings([
    ...input.governanceGraph.governanceNodes.map((node) => node.governanceId),
    ...input.escalationGraph.escalationNodes.map((node) => node.escalationId),
    ...input.governanceGraph.edges.map((edge) => edge.edgeId),
    ...input.escalationGraph.edges.map((edge) => edge.edgeId),
    ...input.verification.verificationPath.artifactIds,
  ]);
}

function collectTopologyEvidenceIds(input: DecisionGraphCertificationInput): string[] {
  return normalizeStrings([
    ...input.topology.nodes.map((node) => node.nodeHash),
    ...input.topology.edges.map((edge) => edge.edgeHash),
    ...input.inspection.projection.topologyNodeHashes,
    ...input.inspection.projection.topologyEdgeHashes,
  ]);
}

function collectEvidenceHashes(input: DecisionGraphCertificationInput): string[] {
  return normalizeStrings([
    input.graph.contract.graphHash,
    input.dependencyGraph.result.dependencyHash,
    input.proposalGraph.result.relationshipHash,
    input.governanceGraph.result.influenceHash,
    input.escalationGraph.result.escalationHash,
    input.topology.result.topologyHash,
    input.topology.result.reconstructionHash,
    input.inspection.result.inspectionHash,
    input.verification.result.verificationHash,
  ]);
}

function projectEvidenceIds(scope: DecisionGraphCertificationScope, input: DecisionGraphCertificationInput): string[] {
  switch (scope) {
    case "OWNERSHIP":
      return collectOwnershipEvidenceIds(input);
    case "LINEAGE":
      return collectLineage({
        graph: input.graph,
        dependencyGraph: input.dependencyGraph,
        proposalGraph: input.proposalGraph,
        governanceGraph: input.governanceGraph,
        escalationGraph: input.escalationGraph,
        topology: input.topology,
        inspection: input.inspection,
        verification: input.verification,
        certificationMutationAttempted: input.certificationMutationAttempted,
        executionRequested: input.executionRequested,
        workflowRoutingRequested: input.workflowRoutingRequested,
        graphOptimizationRequested: input.graphOptimizationRequested,
        authorityExpansionRequested: input.authorityExpansionRequested,
        ownershipMutationRequested: input.ownershipMutationRequested,
      });
    case "TOPOLOGY":
      return collectTopologyEvidenceIds(input);
    case "AUTHORITY":
      return collectAuthorityEvidenceIds(input);
    case "FULL":
      return collectAllEvidenceIds(input);
  }
}

function collectTopologyNodeHashes(scope: DecisionGraphCertificationScope, input: DecisionGraphCertificationInput): string[] {
  return scope === "TOPOLOGY" || scope === "FULL"
    ? normalizeStrings(input.topology.nodes.map((node) => node.nodeHash))
    : [];
}

function collectTopologyEdgeHashes(scope: DecisionGraphCertificationScope, input: DecisionGraphCertificationInput): string[] {
  return scope === "TOPOLOGY" || scope === "FULL"
    ? normalizeStrings(input.topology.edges.map((edge) => edge.edgeHash))
    : [];
}

function validateSealedArtifacts(input: DecisionGraphCertificationInput, reasons: DecisionGraphCertificationReasonCode[]): boolean {
  const graphSealed = input.graph.sealed && input.graph.contract.sealed;
  const dependencySealed = input.dependencyGraph.sealed && input.dependencyGraph.result.sealed;
  const proposalSealed = input.proposalGraph.sealed && input.proposalGraph.result.sealed;
  const governanceSealed = input.governanceGraph.sealed && input.governanceGraph.result.sealed;
  const escalationSealed = input.escalationGraph.sealed && input.escalationGraph.result.sealed;
  const topologySealed = input.topology.sealed && input.topology.result.sealed;
  const inspectionSealed = input.inspection.sealed;
  const verificationSealed = input.verification.sealed;

  addReason(reasons, graphSealed ? "SEALED_GRAPH_REQUIRED" : "GRAPH_UNSEALED");
  addReason(reasons, dependencySealed ? "DEPENDENCY_GRAPH_REQUIRED" : "DEPENDENCY_GRAPH_UNSEALED");
  addReason(reasons, proposalSealed ? "PROPOSAL_GRAPH_REQUIRED" : "PROPOSAL_GRAPH_UNSEALED");
  addReason(reasons, governanceSealed ? "GOVERNANCE_GRAPH_REQUIRED" : "GOVERNANCE_GRAPH_UNSEALED");
  addReason(reasons, escalationSealed ? "ESCALATION_GRAPH_REQUIRED" : "ESCALATION_GRAPH_UNSEALED");
  addReason(reasons, topologySealed ? "TOPOLOGY_REQUIRED" : "TOPOLOGY_UNSEALED");
  addReason(reasons, inspectionSealed ? "INSPECTION_REQUIRED" : "INSPECTION_UNSEALED");
  addReason(reasons, verificationSealed ? "VERIFICATION_REQUIRED" : "VERIFICATION_MISSING");

  return graphSealed && dependencySealed && proposalSealed && governanceSealed && escalationSealed && topologySealed && inspectionSealed && verificationSealed;
}

function validateScope(request: DecisionGraphCertificationRequest, reasons: DecisionGraphCertificationReasonCode[]): boolean {
  const valid = CERTIFICATION_SCOPES.includes(request.certificationScope);
  addReason(reasons, valid ? "CERTIFICATION_SCOPE_VALID" : "CERTIFICATION_SCOPE_INVALID");
  return valid;
}

function validateIdentity(input: DecisionGraphCertificationInput, reasons: DecisionGraphCertificationReasonCode[]): boolean {
  const graphIdValid = input.request.graphId === input.graph.contract.graphId
    && input.dependencyGraph.result.graphId === input.request.graphId
    && input.proposalGraph.result.graphId === input.request.graphId
    && input.governanceGraph.result.graphId === input.request.graphId
    && input.escalationGraph.result.graphId === input.request.graphId
    && input.topology.result.graphId === input.request.graphId
    && input.inspection.result.graphId === input.request.graphId
    && input.verification.result.graphId === input.request.graphId;
  const versionValid = input.request.graphVersion === input.graph.contract.graphVersion;
  addReason(reasons, graphIdValid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  addReason(reasons, versionValid ? "GRAPH_VERSION_MATCHED" : "GRAPH_VERSION_MISMATCH");
  return graphIdValid && versionValid;
}

function validateTenantScope(input: DecisionGraphCertificationInput, reasons: DecisionGraphCertificationReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.graph.contract.tenantId === tenantId
    && input.graph.nodes.every((node) => node.tenantId === tenantId)
    && input.graph.edges.every((edge) => edge.tenantId === tenantId)
    && input.dependencyGraph.edges.every((edge) => edge.tenantId === tenantId)
    && input.proposalGraph.proposalNodes.every((node) => node.tenantId === tenantId)
    && input.proposalGraph.edges.every((edge) => edge.tenantId === tenantId)
    && input.governanceGraph.governanceNodes.every((node) => node.tenantId === tenantId)
    && input.governanceGraph.edges.every((edge) => edge.tenantId === tenantId)
    && input.escalationGraph.escalationNodes.every((node) => node.tenantId === tenantId)
    && input.escalationGraph.edges.every((edge) => edge.tenantId === tenantId)
    && input.topology.nodes.every((node) => node.tenantId === tenantId)
    && input.inspection.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: DecisionGraphCertificationInput, reasons: DecisionGraphCertificationReasonCode[]): boolean {
  const graphId = input.request.graphId;
  const tenantId = input.request.tenantId;
  const valid = input.graph.nodes.every((node) => node.graphId === graphId && node.tenantId === tenantId)
    && input.graph.edges.every((edge) => edge.graphId === graphId && edge.tenantId === tenantId)
    && input.dependencyGraph.edges.every((edge) => edge.graphId === graphId && edge.tenantId === tenantId)
    && input.proposalGraph.proposalNodes.every((node) => node.graphId === graphId && node.tenantId === tenantId)
    && input.proposalGraph.edges.every((edge) => edge.graphId === graphId && edge.tenantId === tenantId)
    && input.governanceGraph.governanceNodes.every((node) => node.graphId === graphId && node.tenantId === tenantId)
    && input.governanceGraph.edges.every((edge) => edge.graphId === graphId && edge.tenantId === tenantId)
    && input.escalationGraph.escalationNodes.every((node) => node.graphId === graphId && node.tenantId === tenantId)
    && input.escalationGraph.edges.every((edge) => edge.graphId === graphId && edge.tenantId === tenantId)
    && input.topology.nodes.every((node) => node.graphId === graphId && node.tenantId === tenantId)
    && input.topology.edges.every((edge) => edge.graphId === graphId)
    && input.verification.result.ownershipIntegrity;
  addReason(reasons, valid ? "OWNERSHIP_CERTIFIED" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateLineage(input: DecisionGraphCertificationInput, reasons: DecisionGraphCertificationReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const requiredLineage = collectLineage({
    graph: input.graph,
    dependencyGraph: input.dependencyGraph,
    proposalGraph: input.proposalGraph,
    governanceGraph: input.governanceGraph,
    escalationGraph: input.escalationGraph,
    topology: input.topology,
    inspection: input.inspection,
    verification: input.verification,
    certificationMutationAttempted: input.certificationMutationAttempted,
    executionRequested: input.executionRequested,
    workflowRoutingRequested: input.workflowRoutingRequested,
    graphOptimizationRequested: input.graphOptimizationRequested,
    authorityExpansionRequested: input.authorityExpansionRequested,
    ownershipMutationRequested: input.ownershipMutationRequested,
  });
  const valid = lineageReferences.length > 0
    && input.graph.validation.lineagePreserved
    && input.dependencyGraph.validation.lineageIntegrity
    && input.proposalGraph.validation.lineageIntegrity
    && input.governanceGraph.validation.lineageIntegrity
    && input.escalationGraph.validation.lineageIntegrity
    && input.topology.validation.lineageIntegrity
    && input.inspection.result.lineageIntegrity
    && input.verification.result.lineageIntegrity
    && requiredLineage.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_CERTIFIED" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateTopology(input: DecisionGraphCertificationInput, reasons: DecisionGraphCertificationReasonCode[]): boolean {
  const valid = input.topology.validation.valid
    && input.topology.validation.reconstructionComplete
    && input.topology.validation.topologyDeterministic
    && input.topology.result.topologyDeterministic
    && input.verification.result.topologyIntegrity;
  addReason(reasons, valid ? "TOPOLOGY_CERTIFIED" : "TOPOLOGY_CORRUPTION_DETECTED");
  return valid;
}

function validateVerificationEvidence(input: DecisionGraphCertificationInput, reasons: DecisionGraphCertificationReasonCode[]): boolean {
  const present = input.verification.result.verificationHash.length > 0
    && input.verification.validation.reasonCodes.length > 0
    && input.verification.result.graphId === input.request.graphId;
  addReason(reasons, present ? "VERIFICATION_EVIDENCE_PRESENT" : "VERIFICATION_EVIDENCE_MISSING");
  return present;
}

function validateEvidenceHashes(input: DecisionGraphCertificationInput, reasons: DecisionGraphCertificationReasonCode[]): boolean {
  const expectedVerificationHash = hashConfidenceValue(
    "graph-integrity-verification-harness",
    canonicalizeConfidenceToString({
      request: {
        graphId: input.request.graphId,
        tenantId: input.request.tenantId,
        verificationScope: input.verification.verificationPath.scope,
        lineageReferences: [...input.verification.verificationPath.lineageReferences],
      },
      verificationPath: input.verification.verificationPath,
      verificationStatus: input.verification.validation.validationState,
      ownershipIntegrity: input.verification.validation.ownershipIntegrity,
      lineageIntegrity: input.verification.validation.lineageIntegrity,
      topologyIntegrity: input.verification.validation.topologyIntegrity,
      authorityBounded: input.verification.validation.authorityBounded,
      tenantIsolationVerified: input.verification.validation.tenantIsolationVerified,
      deterministicReplayVerified: input.verification.validation.deterministicReplayVerified,
    }),
  );
  const valid = input.verification.result.verificationHash.length === 64
    && input.inspection.result.inspectionHash.length === 64
    && input.topology.result.topologyHash.length === 64
    && input.topology.result.reconstructionHash.length === 64
    && input.graph.contract.graphHash.length === 64
    && input.dependencyGraph.result.dependencyHash.length === 64
    && input.proposalGraph.result.relationshipHash.length === 64
    && input.governanceGraph.result.influenceHash.length === 64
    && input.escalationGraph.result.escalationHash.length === 64
    && expectedVerificationHash === input.verification.result.verificationHash;
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateReplayDeterminism(input: DecisionGraphCertificationInput, reasons: DecisionGraphCertificationReasonCode[]): boolean {
  const valid = input.topology.result.topologyDeterministic
    && input.topology.validation.topologyDeterministic
    && input.inspection.result.topologyDeterministic
    && input.inspection.validation.topologyDeterministic
    && input.verification.result.deterministicReplayVerified;
  addReason(reasons, valid ? "REPLAY_DETERMINISM_VERIFIED" : "REPLAY_DETERMINISM_FAILURE");
  return valid;
}

function validateBoundary(input: DecisionGraphCertificationInput, reasons: DecisionGraphCertificationReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionRequested !== true
    && input.graph.validation.authorityBounded
    && input.dependencyGraph.validation.authorityBounded
    && input.proposalGraph.validation.authorityBounded
    && input.governanceGraph.validation.authorityBounded
    && input.escalationGraph.validation.authorityBounded
    && input.topology.validation.authorityBounded
    && input.inspection.validation.authorityBounded
    && input.verification.result.authorityBounded;
  const failBoundary = input.certificationMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.graphOptimizationRequested === true
    || input.authorityExpansionRequested === true
    || input.ownershipMutationRequested === true;

  addReason(reasons, input.certificationMutationAttempted === true ? "CERTIFICATION_ATTEMPTS_MUTATION" : "CERTIFICATION_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.graphOptimizationRequested === true ? "GRAPH_OPTIMIZATION_DETECTED" : "GRAPH_OPTIMIZATION_BLOCKED");
  addReason(reasons, input.ownershipMutationRequested === true ? "OWNERSHIP_MUTATION_DETECTED" : "OWNERSHIP_MUTATION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDARY_PRESERVED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "DECISION_GRAPH_CERTIFICATION_IS_NOT_CONTROL");

  return Object.freeze({
    executionImpossible,
    authorityBounded,
    failBoundary,
  });
}

function validateLimits(chain: DecisionGraphCertificationEvidenceChain, reasons: DecisionGraphCertificationReasonCode[]): boolean {
  const depthValid = chain.lineageReferences.length <= MAX_CERTIFICATION_DEPTH;
  const artifactCount = chain.evidenceIds.length + chain.topologyNodeHashes.length + chain.topologyEdgeHashes.length;
  const artifactValid = artifactCount <= MAX_CERTIFIED_ARTIFACTS;
  addReason(reasons, depthValid ? "CERTIFICATION_DEPTH_VALID" : "CERTIFICATION_DEPTH_EXCEEDED");
  addReason(reasons, artifactValid ? "CERTIFIED_ARTIFACT_LIMIT_VALID" : "CERTIFIED_ARTIFACT_LIMIT_EXCEEDED");
  return depthValid && artifactValid;
}

export function buildDecisionGraphCertificationRequest(
  input: Omit<DecisionGraphCertificationInput, "request"> & { certificationScope?: DecisionGraphCertificationScope },
): DecisionGraphCertificationRequest {
  return Object.freeze({
    graphId: input.graph.contract.graphId,
    tenantId: input.graph.contract.tenantId,
    certificationScope: input.certificationScope ?? "FULL",
    lineageReferences: collectLineage(input),
    graphVersion: input.graph.contract.graphVersion,
  });
}

export function createDecisionGraphCertificationEvidenceChain(
  input: DecisionGraphCertificationInput,
): DecisionGraphCertificationEvidenceChain {
  const request = requestCore(input.request);
  return Object.freeze({
    scope: request.certificationScope,
    evidenceIds: Object.freeze(projectEvidenceIds(request.certificationScope, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
    lineageReferences: Object.freeze(
      request.certificationScope === "OWNERSHIP" || request.certificationScope === "AUTHORITY"
        ? request.lineageReferences.slice(0, MAX_CERTIFICATION_DEPTH)
        : request.lineageReferences,
    ),
    topologyNodeHashes: Object.freeze(collectTopologyNodeHashes(request.certificationScope, input)),
    topologyEdgeHashes: Object.freeze(collectTopologyEdgeHashes(request.certificationScope, input)),
  });
}

export function validateDecisionGraphCertification(
  input: DecisionGraphCertificationInput,
): DecisionGraphCertificationValidation {
  const reasons: DecisionGraphCertificationReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = {
    ...input,
    request,
  };

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const scopeValid = validateScope(request, reasons);
  const identityValid = validateIdentity(normalizedInput, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipCertified = validateOwnership(normalizedInput, reasons);
  const lineageCertified = validateLineage(normalizedInput, reasons);
  const topologyCertified = validateTopology(normalizedInput, reasons);
  const verificationEvidencePresent = validateVerificationEvidence(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const replayDeterministic = validateReplayDeterminism(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const evidenceChain = createDecisionGraphCertificationEvidenceChain(normalizedInput);
  const limitsValid = validateLimits(evidenceChain, reasons);

  const fail = !sealedArtifacts
    || !scopeValid
    || !identityValid
    || !tenantIsolationVerified
    || !ownershipCertified
    || !lineageCertified
    || !topologyCertified
    || !verificationEvidencePresent
    || !evidenceHashesValid
    || !limitsValid
    || !boundary.authorityBounded
    || boundary.failBoundary;
  const conditionalPass = !fail && !replayDeterministic;
  const certificationStatus: DecisionGraphCertificationResult["certificationStatus"] = fail
    ? "FAIL"
    : conditionalPass
      ? "CONDITIONAL_PASS"
      : "PASS";

  return Object.freeze({
    valid: certificationStatus !== "FAIL",
    certificationStatus,
    reasonCodes: normalizeStrings(reasons) as readonly DecisionGraphCertificationReasonCode[],
    ownershipCertified,
    lineageCertified,
    topologyCertified,
    authorityBounded: boundary.authorityBounded,
    tenantIsolationVerified,
    replayDeterministic,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    controlSurfaceAbsent: true as const,
    certifiedArtifactCount:
      evidenceChain.evidenceIds.length
      + evidenceChain.topologyNodeHashes.length
      + evidenceChain.topologyEdgeHashes.length,
  });
}

export function buildDecisionGraphCertificationResult(
  input: DecisionGraphCertificationInput,
): DecisionGraphCertificationResult {
  const request = requestCore(input.request);
  const normalizedInput = {
    ...input,
    request,
  };
  const validation = validateDecisionGraphCertification(normalizedInput);
  const evidenceChain = createDecisionGraphCertificationEvidenceChain(normalizedInput);
  const certificationHash = hashCertificationValue("decision-graph-certification-gate", {
    request,
    evidenceChain,
    certificationStatus: validation.certificationStatus,
    ownershipCertified: validation.ownershipCertified,
    lineageCertified: validation.lineageCertified,
    topologyCertified: validation.topologyCertified,
    authorityBounded: validation.authorityBounded,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    replayDeterministic: validation.replayDeterministic,
  });

  return Object.freeze({
    graphId: request.graphId,
    certificationStatus: validation.certificationStatus,
    ownershipCertified: validation.ownershipCertified,
    lineageCertified: validation.lineageCertified,
    topologyCertified: validation.topologyCertified,
    authorityBounded: validation.authorityBounded,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    replayDeterministic: validation.replayDeterministic,
    certificationHash,
  });
}

export function buildDecisionGraphCertificationObservability(
  result: DecisionGraphCertificationResult,
): DecisionGraphCertificationObservability {
  return Object.freeze({
    graphId: result.graphId,
    certificationStatus: result.certificationStatus,
    ownershipCertified: result.ownershipCertified,
    lineageCertified: result.lineageCertified,
    topologyCertified: result.topologyCertified,
    certificationHash: result.certificationHash,
  });
}

export function sealDecisionGraphCertification(
  input: DecisionGraphCertificationInput,
): SealedDecisionGraphCertificationRecord {
  const request = requestCore(input.request);
  const normalizedInput = {
    ...input,
    request,
  };
  const evidenceChain = createDecisionGraphCertificationEvidenceChain(normalizedInput);
  const validation = validateDecisionGraphCertification(normalizedInput);
  const result = buildDecisionGraphCertificationResult(normalizedInput);
  const observability = buildDecisionGraphCertificationObservability(result);

  return Object.freeze({
    result,
    evidenceChain,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    certificationOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    graphMutationAllowed: false as const,
    graphOptimizationAllowed: false as const,
    authorityMutationAllowed: false as const,
    ownershipMutationAllowed: false as const,
    repairAuthorized: false as const,
    controlSurfacePresent: false as const,
  });
}

export const DecisionGraphCertificationValidator = Object.freeze({
  validate: validateDecisionGraphCertification,
});

export const DecisionGraphCertificationGate = Object.freeze({
  buildRequest: buildDecisionGraphCertificationRequest,
  createEvidenceChain: createDecisionGraphCertificationEvidenceChain,
  buildResult: buildDecisionGraphCertificationResult,
  seal: sealDecisionGraphCertification,
});

export const DecisionGraphCertificationObservabilityService = Object.freeze({
  build: buildDecisionGraphCertificationObservability,
});
