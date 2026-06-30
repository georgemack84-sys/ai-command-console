import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  RecommendationGovernanceBindingEvidencePath,
  RecommendationGovernanceBindingInput,
  RecommendationGovernanceBindingObservability,
  RecommendationGovernanceBindingReasonCode,
  RecommendationGovernanceBindingRequest,
  RecommendationGovernanceBindingResult,
  RecommendationGovernanceBindingValidation,
  RecommendationGovernanceScope,
  SealedRecommendationGovernanceBindingRecord,
} from "./types";

const MAX_BINDING_DEPTH = 20;
const MAX_GOVERNANCE_REFERENCES = 5000;
const MAX_LINEAGE_REFERENCES = 1000;

const GOVERNANCE_SCOPES: readonly RecommendationGovernanceScope[] = Object.freeze([
  "FULL",
  "LINEAGE",
  "OBSERVABILITY",
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

function addReason(
  reasons: RecommendationGovernanceBindingReasonCode[],
  reason: RecommendationGovernanceBindingReasonCode,
): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashGovernanceValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: RecommendationGovernanceBindingRequest): RecommendationGovernanceBindingRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    governanceScope: request.governanceScope,
    governanceReferences: normalizeStrings(request.governanceReferences),
    graphVersion: request.graphVersion,
  });
}

function collectEvidenceHashes(input: RecommendationGovernanceBindingInput): string[] {
  return normalizeStrings([
    input.ledger.result.ledgerHash,
    input.lineage.result.reconstructionHash,
    input.lineage.result.lineageHash,
    input.verification.result.verificationHash,
    input.replay.result.replayHash,
    input.integrity.result.integrityHash,
    input.certification.result.certificationHash,
    input.observability.result.observabilityHash,
    input.inspection.result.inspectionHash,
    input.visibility.result.visibilityHash,
    input.audit.result.exportHash,
    input.observabilityCertification.result.certificationHash,
    input.governanceReferences.governanceHash,
    input.lineageEvidence.lineageHash,
    input.replayEvidence.replayHash,
  ]);
}

function lineageReferencesForScope(scope: RecommendationGovernanceScope, input: RecommendationGovernanceBindingInput): string[] {
  if (scope === "OWNERSHIP") return [];
  return normalizeStrings([
    ...input.lineage.evidencePath.lineageReferences,
    ...input.verification.evidencePath.lineageReferences,
    ...input.observability.evidencePath.lineageReferences,
    ...input.audit.evidencePath.lineageReferences,
    ...input.lineageEvidence.lineageReferences,
  ]);
}

function replayReferencesForScope(scope: RecommendationGovernanceScope, input: RecommendationGovernanceBindingInput): string[] {
  if (scope !== "REPLAY" && scope !== "FULL") return [];
  return normalizeStrings([
    ...input.replay.evidencePath.evidenceIds,
    ...input.audit.evidencePath.evidenceIds,
    ...input.replayEvidence.replayReferences,
  ]);
}

function governanceReferencesForScope(
  scope: RecommendationGovernanceScope,
  input: RecommendationGovernanceBindingInput,
): string[] {
  if (scope === "OWNERSHIP") {
    return normalizeStrings(input.request.governanceReferences);
  }
  return normalizeStrings([
    ...input.request.governanceReferences,
    ...input.governanceReferences.governanceReferences,
  ]);
}

function validateSealedArtifacts(
  input: RecommendationGovernanceBindingInput,
  reasons: RecommendationGovernanceBindingReasonCode[],
): boolean {
  const states = [
    [input.observability.sealed, "OBSERVABILITY_REQUIRED", "OBSERVABILITY_UNSEALED"],
    [input.inspection.sealed, "INSPECTION_REQUIRED", "INSPECTION_UNSEALED"],
    [input.visibility.sealed, "VISIBILITY_REQUIRED", "VISIBILITY_UNSEALED"],
    [input.audit.sealed, "AUDIT_REQUIRED", "AUDIT_UNSEALED"],
    [input.observabilityCertification.sealed, "OBSERVABILITY_CERTIFICATION_REQUIRED", "OBSERVABILITY_CERTIFICATION_UNSEALED"],
    [input.ledger.sealed, "LEDGER_REQUIRED", "LEDGER_UNSEALED"],
    [input.lineage.sealed, "LINEAGE_REQUIRED", "LINEAGE_UNSEALED"],
    [input.verification.sealed, "VERIFICATION_REQUIRED", "VERIFICATION_UNSEALED"],
    [input.replay.sealed, "REPLAY_REQUIRED", "REPLAY_UNSEALED"],
    [input.integrity.sealed, "INTEGRITY_REQUIRED", "INTEGRITY_UNSEALED"],
    [input.certification.sealed, "CERTIFICATION_REQUIRED", "CERTIFICATION_UNSEALED"],
    [input.governanceReferences.sealed, "GOVERNANCE_REFERENCES_REQUIRED", "GOVERNANCE_REFERENCES_UNSEALED"],
    [input.lineageEvidence.sealed, "LINEAGE_EVIDENCE_REQUIRED", "LINEAGE_EVIDENCE_UNSEALED"],
    [input.replayEvidence.sealed, "REPLAY_EVIDENCE_REQUIRED", "REPLAY_EVIDENCE_UNSEALED"],
  ] as const;
  for (const [sealed, ok, fail] of states) addReason(reasons, sealed ? ok : fail);
  return states.every(([sealed]) => sealed);
}

function validateScope(scope: RecommendationGovernanceScope, reasons: RecommendationGovernanceBindingReasonCode[]): boolean {
  const valid = GOVERNANCE_SCOPES.includes(scope);
  addReason(reasons, valid ? "GOVERNANCE_SCOPE_VALID" : "GOVERNANCE_SCOPE_INVALID");
  return valid;
}

function validateRecommendation(
  request: RecommendationGovernanceBindingRequest,
  reasons: RecommendationGovernanceBindingReasonCode[],
): boolean {
  const present = request.recommendationId.length > 0;
  addReason(reasons, present ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  return present;
}

function validateTenantScope(
  input: RecommendationGovernanceBindingInput,
  reasons: RecommendationGovernanceBindingReasonCode[],
): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.ledger.entry.tenantId === tenantId
    && input.ledger.result.tenantIsolationVerified
    && input.lineage.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.integrity.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
    && input.inspection.result.tenantIsolationVerified
    && input.visibility.result.tenantIsolationVerified
    && input.audit.result.tenantIsolationVerified
    && input.observabilityCertification.result.tenantIsolationVerified
    && input.governanceReferences.tenantId === tenantId
    && input.lineageEvidence.tenantId === tenantId
    && input.replayEvidence.tenantId === tenantId;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_BINDING_BLOCKED");
  return valid;
}

function validateOwnership(
  input: RecommendationGovernanceBindingInput,
  reasons: RecommendationGovernanceBindingReasonCode[],
): boolean {
  const valid = input.ledger.result.ownershipVerified
    && input.verification.result.ownershipVerified
    && input.integrity.result.ownershipIntegrity
    && input.certification.result.ownershipCertified;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateGovernanceBinding(
  input: RecommendationGovernanceBindingInput,
  reasons: RecommendationGovernanceBindingReasonCode[],
): { governanceBound: boolean; escalated: boolean } {
  const requestRefs = normalizeStrings(input.request.governanceReferences);
  const sealedRefs = normalizeStrings(input.governanceReferences.governanceReferences);
  const governanceMissing = requestRefs.length === 0 || !requestRefs.every((reference) => sealedRefs.includes(reference));
  const degraded = input.observabilityCertification.result.certificationState !== "PASS"
    || input.audit.result.exportState === "ESCALATED"
    || input.visibility.result.visibilityState === "ESCALATED";
  const governanceBound = !governanceMissing && !degraded;
  addReason(reasons, governanceBound ? "GOVERNANCE_BOUND" : governanceMissing ? "GOVERNANCE_REFERENCE_MISSING" : "GOVERNANCE_BINDING_DEGRADED");
  return { governanceBound, escalated: !governanceMissing && degraded };
}

function validateLineageBinding(
  input: RecommendationGovernanceBindingInput,
  reasons: RecommendationGovernanceBindingReasonCode[],
): { lineageBound: boolean; escalated: boolean } {
  const expected = normalizeStrings(lineageReferencesForScope(input.request.governanceScope, input));
  if (expected.length === 0) {
    addReason(reasons, "LINEAGE_BOUND");
    return { lineageBound: true, escalated: false };
  }
  const provided = normalizeStrings(input.lineageEvidence.lineageReferences);
  const missing = !expected.every((reference) => provided.includes(reference));
  const escalated = missing;
  addReason(reasons, missing ? "LINEAGE_REFERENCES_MISSING" : "LINEAGE_BOUND");
  return { lineageBound: !missing, escalated };
}

function validateReplayBinding(
  input: RecommendationGovernanceBindingInput,
  reasons: RecommendationGovernanceBindingReasonCode[],
): boolean {
  const expected = normalizeStrings(replayReferencesForScope(input.request.governanceScope, input));
  if (expected.length === 0) {
    addReason(reasons, "REPLAY_BOUND");
    return true;
  }
  const provided = normalizeStrings(input.replayEvidence.replayReferences);
  const bound = expected.every((reference) => provided.includes(reference));
  addReason(reasons, bound ? "REPLAY_BOUND" : "REPLAY_REFERENCES_MISSING");
  return bound;
}

function validateEvidenceHashes(
  input: RecommendationGovernanceBindingInput,
  reasons: RecommendationGovernanceBindingReasonCode[],
): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(
  input: RecommendationGovernanceBindingInput,
  reasons: RecommendationGovernanceBindingReasonCode[],
): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true
    && input.lineage.validation.authorityBounded
    && input.verification.validation.authorityBounded
    && input.replay.validation.authorityBounded
    && input.integrity.validation.authorityBounded
    && input.certification.validation.authorityBounded
    && input.observability.validation.authorityBounded
    && input.inspection.validation.authorityBounded
    && input.visibility.validation.authorityBounded
    && input.audit.validation.authorityBounded
    && input.observabilityCertification.validation.authorityBounded;
  const invalidBoundary = input.governanceMutationAttempted === true
    || input.bindingMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.recommendationGenerationRequested === true
    || input.recommendationPrioritizationRequested === true
    || input.approvalBehaviorRequested === true
    || input.repairRequested === true
    || input.authorityExpansionDetected === true;
  addReason(reasons, input.governanceMutationAttempted === true ? "GOVERNANCE_MUTATION_DETECTED" : "GOVERNANCE_MUTATION_BLOCKED");
  addReason(reasons, input.bindingMutationAttempted === true ? "BINDING_MUTATION_DETECTED" : "BINDING_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.recommendationGenerationRequested === true ? "RECOMMENDATION_GENERATION_DETECTED" : "RECOMMENDATION_GENERATION_BLOCKED");
  addReason(reasons, input.recommendationPrioritizationRequested === true ? "RECOMMENDATION_PRIORITIZATION_DETECTED" : "RECOMMENDATION_PRIORITIZATION_BLOCKED");
  addReason(reasons, input.approvalBehaviorRequested === true ? "APPROVAL_BEHAVIOR_DETECTED" : "APPROVAL_BEHAVIOR_BLOCKED");
  addReason(reasons, input.repairRequested === true ? "REPAIR_DETECTED" : "REPAIR_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "RECOMMENDATION_GOVERNANCE_BINDING_IS_NOT_CONTROL");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(
  path: RecommendationGovernanceBindingEvidencePath,
  reasons: RecommendationGovernanceBindingReasonCode[],
): boolean {
  const depthValid = path.lineageReferences.length <= MAX_BINDING_DEPTH;
  const governanceValid = path.governanceReferences.length <= MAX_GOVERNANCE_REFERENCES;
  const lineageValid = path.lineageReferences.length <= MAX_LINEAGE_REFERENCES;
  addReason(reasons, depthValid ? "BINDING_DEPTH_VALID" : "BINDING_DEPTH_EXCEEDED");
  addReason(reasons, governanceValid ? "GOVERNANCE_REFERENCE_LIMIT_VALID" : "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageValid ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && governanceValid && lineageValid;
}

function classifyBindingState(
  valid: boolean,
  governanceBound: boolean,
  lineageBound: boolean,
  replayBound: boolean,
  governanceEscalated: boolean,
  lineageEscalated: boolean,
): RecommendationGovernanceBindingResult["bindingState"] {
  if (!valid) return "INVALID";
  if (governanceEscalated || lineageEscalated) return "ESCALATED";
  if (!governanceBound || !replayBound) return "LIMITED";
  return "BOUND";
}

export function buildRecommendationGovernanceBindingRequest(
  input: Omit<RecommendationGovernanceBindingInput, "request"> & {
    recommendationId?: string;
    tenantId?: string;
    governanceScope?: RecommendationGovernanceScope;
    requestedGovernanceReferences?: readonly string[];
    graphVersion?: string;
  },
): RecommendationGovernanceBindingRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    governanceScope: input.governanceScope ?? "FULL",
    governanceReferences: normalizeStrings(
      input.requestedGovernanceReferences ?? input.governanceReferences.governanceReferences,
    ),
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  } as RecommendationGovernanceBindingRequest);
}

export function createRecommendationGovernanceBindingEvidencePath(
  input: RecommendationGovernanceBindingInput,
): RecommendationGovernanceBindingEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    scope: request.governanceScope,
    governanceReferences: Object.freeze(governanceReferencesForScope(request.governanceScope, input)),
    lineageReferences: Object.freeze(lineageReferencesForScope(request.governanceScope, input)),
    replayReferences: Object.freeze(replayReferencesForScope(request.governanceScope, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
  });
}

export function validateRecommendationGovernanceBinding(
  input: RecommendationGovernanceBindingInput,
): RecommendationGovernanceBindingValidation {
  const reasons: RecommendationGovernanceBindingReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationGovernanceBindingEvidencePath(normalizedInput);

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const scopeValid = validateScope(request.governanceScope, reasons);
  const recommendationValid = validateRecommendation(request, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const governance = validateGovernanceBinding(normalizedInput, reasons);
  const lineage = validateLineageBinding(normalizedInput, reasons);
  const replayBound = validateReplayBinding(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(evidencePath, reasons);

  const valid = sealedArtifacts
    && scopeValid
    && recommendationValid
    && tenantIsolationVerified
    && ownershipValid
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    bindingState: classifyBindingState(
      valid,
      governance.governanceBound,
      lineage.lineageBound,
      replayBound,
      governance.escalated,
      lineage.escalated,
    ),
    reasonCodes: normalizeStrings(reasons) as readonly RecommendationGovernanceBindingReasonCode[],
    governanceBound: governance.governanceBound,
    lineageBound: lineage.lineageBound,
    replayBound,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    governanceReferenceCount: evidencePath.governanceReferences.length,
  });
}

export function buildRecommendationGovernanceBindingResult(
  input: RecommendationGovernanceBindingInput,
): RecommendationGovernanceBindingResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationGovernanceBindingEvidencePath(normalizedInput);
  const validation = validateRecommendationGovernanceBinding(normalizedInput);

  const governanceHash = hashGovernanceValue("recommendation-governance-binding", {
    request,
    evidencePath,
    bindingState: validation.bindingState,
    governanceBound: validation.governanceBound,
    lineageBound: validation.lineageBound,
    replayBound: validation.replayBound,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    recommendationId: request.recommendationId,
    bindingState: validation.bindingState,
    governanceBound: validation.governanceBound,
    lineageBound: validation.lineageBound,
    replayBound: validation.replayBound,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    governanceHash,
    deterministic: true,
  });
}

export function buildRecommendationGovernanceBindingObservability(
  result: RecommendationGovernanceBindingResult,
): RecommendationGovernanceBindingObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    bindingState: result.bindingState,
    governanceBound: result.governanceBound,
    lineageBound: result.lineageBound,
    replayBound: result.replayBound,
    governanceHash: result.governanceHash,
  });
}

export function sealRecommendationGovernanceBinding(
  input: RecommendationGovernanceBindingInput,
): SealedRecommendationGovernanceBindingRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationGovernanceBindingEvidencePath(normalizedInput);
  const validation = validateRecommendationGovernanceBinding(normalizedInput);
  const result = buildRecommendationGovernanceBindingResult(normalizedInput);
  const observability = buildRecommendationGovernanceBindingObservability(result);

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    governanceOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    recommendationGenerationAllowed: false as const,
    recommendationPrioritizationAllowed: false as const,
    approvalBehaviorAllowed: false as const,
    authorityMutationAllowed: false as const,
    repairAuthorized: false as const,
    controlSurfacePresent: false as const,
  });
}

export const RecommendationGovernanceBindingValidator = Object.freeze({
  validate: validateRecommendationGovernanceBinding,
});

export const RecommendationGovernanceBindingLayer = Object.freeze({
  buildRequest: buildRecommendationGovernanceBindingRequest,
  createEvidencePath: createRecommendationGovernanceBindingEvidencePath,
  buildResult: buildRecommendationGovernanceBindingResult,
  seal: sealRecommendationGovernanceBinding,
});

export const RecommendationGovernanceBindingObservabilityService = Object.freeze({
  build: buildRecommendationGovernanceBindingObservability,
});
