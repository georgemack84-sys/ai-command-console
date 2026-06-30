import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedStrategicContextAlignmentRecord,
  StrategicContextAlignmentEvidencePath,
  StrategicContextAlignmentInput,
  StrategicContextAlignmentObservability,
  StrategicContextAlignmentReasonCode,
  StrategicContextAlignmentRequest,
  StrategicContextAlignmentResult,
  StrategicContextAlignmentScope,
  StrategicContextAlignmentValidation,
} from "./types";

const MAX_ALIGNMENT_DEPTH = 20;
const MAX_EVIDENCE_REFERENCES = 5000;
const MAX_ALIGNMENT_REFERENCES = 1000;

const ALIGNMENT_SCOPES: readonly StrategicContextAlignmentScope[] = Object.freeze([
  "FULL",
  "GOVERNANCE",
  "MISSION",
  "OBJECTIVES",
  "RISK",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: StrategicContextAlignmentReasonCode[], reason: StrategicContextAlignmentReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashAlignmentValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: StrategicContextAlignmentRequest): StrategicContextAlignmentRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    alignmentScope: request.alignmentScope,
    graphVersion: request.graphVersion,
  });
}

function collectEvidenceHashes(input: StrategicContextAlignmentInput): string[] {
  return normalizeStrings([
    input.readiness.result.readinessHash,
    input.ledger.result.ledgerHash,
    input.lineage.result.reconstructionHash,
    input.verification.result.verificationHash,
    input.replay.result.replayHash,
    input.replay.result.reconstructionHash,
    input.integrity.result.integrityHash,
    input.certification.result.certificationHash,
    input.observability.result.observabilityHash,
    input.inspection.result.inspectionHash,
    input.visibility.result.visibilityHash,
    input.audit.result.exportHash,
    input.observabilityCertification.result.certificationHash,
    input.binding.result.governanceHash,
    input.authorityScope.result.authorityHash,
    input.policyVisibility.result.policyHash,
    input.governanceReplay.result.replayHash,
    input.governanceReplay.result.reconstructionHash,
    input.governanceCertification.result.certificationHash,
    input.governanceReferences.governanceHash,
    input.ownershipEvidence.ownershipHash,
    input.replayEvidence.replayHash,
  ]);
}

function evidenceReferencesForScope(scope: StrategicContextAlignmentScope, input: StrategicContextAlignmentInput): string[] {
  if (scope === "MISSION") {
    return normalizeStrings([
      ...input.lineage.evidencePath.evidenceIds,
      ...input.lineage.ancestryChain.map((node) => node.lineageReference),
      ...input.ownershipEvidence.ownershipReferences,
    ]);
  }
  if (scope === "OBJECTIVES") {
    return normalizeStrings([
      ...input.ledger.entry.evidenceIds,
      ...input.verification.evidencePath.evidenceIds,
      ...input.audit.evidencePath.evidenceIds,
    ]);
  }
  if (scope === "GOVERNANCE") {
    return normalizeStrings([
      ...input.binding.evidencePath.governanceReferences,
      ...input.authorityScope.evidencePath.scopeReferences,
      ...input.policyVisibility.evidencePath.policyReferences,
    ]);
  }
  if (scope === "RISK") {
    return normalizeStrings([
      ...input.replay.evidencePath.evidenceIds,
      ...input.governanceReplay.evidencePath.replayReferences,
      ...input.replayEvidence.replayReferences,
    ]);
  }
  return normalizeStrings([
    ...input.lineage.evidencePath.evidenceIds,
    ...input.ledger.entry.evidenceIds,
    ...input.verification.evidencePath.evidenceIds,
    ...input.audit.evidencePath.evidenceIds,
    ...input.replay.evidencePath.evidenceIds,
    ...input.governanceReplay.evidencePath.replayReferences,
  ]);
}

function alignmentReferencesForScope(scope: StrategicContextAlignmentScope, input: StrategicContextAlignmentInput): string[] {
  if (scope === "MISSION") {
    return normalizeStrings([
      ...input.lineage.ancestryChain.map((node) => node.lineageReference),
      ...input.ownershipEvidence.ownershipReferences,
    ]);
  }
  if (scope === "OBJECTIVES") {
    return normalizeStrings([
      ...input.ledger.entry.evidenceIds,
      ...input.audit.result.exportedArtifacts,
    ]);
  }
  if (scope === "GOVERNANCE") {
    return normalizeStrings(input.governanceReferences.governanceReferences);
  }
  if (scope === "RISK") {
    return normalizeStrings([
      ...input.replayEvidence.replayReferences,
      ...input.audit.result.exportedArtifacts,
    ]);
  }
  return normalizeStrings([
    ...input.governanceReferences.governanceReferences,
    ...input.ownershipEvidence.ownershipReferences,
    ...input.replayEvidence.replayReferences,
  ]);
}

function governanceReferencesForScope(scope: StrategicContextAlignmentScope, input: StrategicContextAlignmentInput): string[] {
  if (scope === "GOVERNANCE" || scope === "FULL") {
    return normalizeStrings(input.governanceReferences.governanceReferences);
  }
  return normalizeStrings(input.binding.evidencePath.governanceReferences);
}

function validateSealedArtifacts(input: StrategicContextAlignmentInput, reasons: StrategicContextAlignmentReasonCode[]): boolean {
  const states = [
    [input.readiness.sealed, "READINESS_REQUIRED", "READINESS_UNSEALED"],
    [input.ledger.sealed, "LEDGER_REQUIRED", "LEDGER_UNSEALED"],
    [input.lineage.sealed, "LINEAGE_REQUIRED", "LINEAGE_UNSEALED"],
    [input.verification.sealed, "VERIFICATION_REQUIRED", "VERIFICATION_UNSEALED"],
    [input.replay.sealed, "REPLAY_REQUIRED", "REPLAY_UNSEALED"],
    [input.integrity.sealed, "INTEGRITY_REQUIRED", "INTEGRITY_UNSEALED"],
    [input.certification.sealed, "CERTIFICATION_REQUIRED", "CERTIFICATION_UNSEALED"],
    [input.observability.sealed, "OBSERVABILITY_REQUIRED", "OBSERVABILITY_UNSEALED"],
    [input.inspection.sealed, "INSPECTION_REQUIRED", "INSPECTION_UNSEALED"],
    [input.visibility.sealed, "VISIBILITY_REQUIRED", "VISIBILITY_UNSEALED"],
    [input.audit.sealed, "AUDIT_REQUIRED", "AUDIT_UNSEALED"],
    [input.observabilityCertification.sealed, "OBSERVABILITY_CERTIFICATION_REQUIRED", "OBSERVABILITY_CERTIFICATION_UNSEALED"],
    [input.binding.sealed, "BINDING_REQUIRED", "BINDING_UNSEALED"],
    [input.authorityScope.sealed, "AUTHORITY_SCOPE_REQUIRED", "AUTHORITY_SCOPE_UNSEALED"],
    [input.policyVisibility.sealed, "POLICY_VISIBILITY_REQUIRED", "POLICY_VISIBILITY_UNSEALED"],
    [input.governanceReplay.sealed, "GOVERNANCE_REPLAY_REQUIRED", "GOVERNANCE_REPLAY_UNSEALED"],
    [input.governanceCertification.sealed, "GOVERNANCE_CERTIFICATION_REQUIRED", "GOVERNANCE_CERTIFICATION_UNSEALED"],
    [input.governanceReferences.sealed, "GOVERNANCE_REFERENCES_REQUIRED", "GOVERNANCE_REFERENCES_UNSEALED"],
    [input.ownershipEvidence.sealed, "OWNERSHIP_EVIDENCE_REQUIRED", "OWNERSHIP_EVIDENCE_UNSEALED"],
    [input.replayEvidence.sealed, "REPLAY_EVIDENCE_REQUIRED", "REPLAY_EVIDENCE_UNSEALED"],
  ] as const;
  for (const [sealed, ok, fail] of states) addReason(reasons, sealed ? ok : fail);
  return states.every(([sealed]) => sealed);
}

function validateScope(scope: StrategicContextAlignmentScope, reasons: StrategicContextAlignmentReasonCode[]): boolean {
  const valid = ALIGNMENT_SCOPES.includes(scope);
  addReason(reasons, valid ? "ALIGNMENT_SCOPE_VALID" : "ALIGNMENT_SCOPE_INVALID");
  return valid;
}

function validateRecommendation(request: StrategicContextAlignmentRequest, reasons: StrategicContextAlignmentReasonCode[]): boolean {
  const present = request.recommendationId.length > 0;
  addReason(reasons, present ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  return present;
}

function validateTenantScope(input: StrategicContextAlignmentInput, reasons: StrategicContextAlignmentReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.readiness.result.tenantIsolationVerified
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
    && input.binding.result.tenantIsolationVerified
    && input.authorityScope.result.tenantIsolationVerified
    && input.policyVisibility.result.tenantIsolationVerified
    && input.governanceReplay.result.tenantIsolationVerified
    && input.governanceCertification.result.tenantIsolationVerified
    && input.governanceReferences.tenantId === tenantId
    && input.ownershipEvidence.tenantId === tenantId
    && input.replayEvidence.tenantId === tenantId;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ALIGNMENT_BLOCKED");
  return valid;
}

function validateOwnership(input: StrategicContextAlignmentInput, reasons: StrategicContextAlignmentReasonCode[]): boolean {
  const valid = input.ownershipEvidence.recommendationId === input.request.recommendationId
    && input.ownershipEvidence.ownershipReferences.length > 0
    && input.certification.result.ownershipCertified
    && input.authorityScope.result.ownershipValidated;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateMissionAlignment(input: StrategicContextAlignmentInput, reasons: StrategicContextAlignmentReasonCode[]): boolean | null {
  if (input.lineage.ancestryChain.length === 0 || input.readiness.result.evidenceComplete !== true) {
    addReason(reasons, "MISSION_ALIGNMENT_UNKNOWN");
    return null;
  }
  const aligned = input.lineage.result.lineageIntegrity
    && input.verification.result.lineageIntegrity
    && input.ownershipEvidence.ownershipReferences.some((reference) => reference.startsWith("owner:"))
    && input.readiness.result.evidenceComplete;
  addReason(reasons, aligned ? "MISSION_ALIGNED" : "MISSION_CONFLICT_DETECTED");
  return aligned;
}

function validateObjectiveAlignment(input: StrategicContextAlignmentInput, reasons: StrategicContextAlignmentReasonCode[]): boolean | null {
  if (input.ledger.entry.evidenceIds.length === 0 || input.audit.result.exportedArtifacts.length === 0) {
    addReason(reasons, "OBJECTIVE_ALIGNMENT_UNKNOWN");
    return null;
  }
  const aligned = input.verification.result.historyIntegrity
    && input.verification.result.replayConsistency
    && input.audit.result.exportedArtifacts.length > 0
    && input.readiness.result.evidenceComplete;
  addReason(reasons, aligned ? "OBJECTIVES_ALIGNED" : "OBJECTIVE_CONFLICT_DETECTED");
  return aligned;
}

function validateGovernanceAlignment(input: StrategicContextAlignmentInput, reasons: StrategicContextAlignmentReasonCode[]): boolean {
  const aligned = input.readiness.result.governanceAligned
    && input.binding.result.bindingState !== "INVALID"
    && input.authorityScope.result.scopeState !== "INVALID"
    && input.policyVisibility.result.visibilityState !== "INVALID"
    && input.governanceCertification.result.certificationState !== "FAIL";
  addReason(reasons, aligned ? "GOVERNANCE_ALIGNED" : "GOVERNANCE_CONFLICT_DETECTED");
  return aligned;
}

function validateRiskAlignment(input: StrategicContextAlignmentInput, reasons: StrategicContextAlignmentReasonCode[]): boolean {
  const aligned = input.integrity.result.integrityState === "HEALTHY"
    && input.replay.result.replayState === "REPLAYABLE"
    && input.governanceReplay.result.replayState === "REPLAYABLE"
    && input.visibility.result.replayVisible
    && input.audit.result.replayIncluded;
  addReason(reasons, aligned ? "RISK_ALIGNED" : "RISK_ALIGNMENT_INCOMPLETE");
  return aligned;
}

function validateOperationalAlignment(input: StrategicContextAlignmentInput, reasons: StrategicContextAlignmentReasonCode[]): boolean {
  const aligned = input.readiness.result.readinessState === "READY"
    && input.readiness.result.observabilityComplete
    && input.readiness.result.replayReady
    && input.readiness.result.certificationValid
    && input.observability.result.observabilityState !== "INVALID"
    && input.governanceCertification.result.certificationState !== "FAIL";
  addReason(reasons, aligned ? "OPERATIONAL_ALIGNMENT_VALID" : "OPERATIONAL_ALIGNMENT_INCOMPLETE");
  return aligned;
}

function validateEvidenceHashes(input: StrategicContextAlignmentInput, reasons: StrategicContextAlignmentReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateHiddenState(input: StrategicContextAlignmentInput, reasons: StrategicContextAlignmentReasonCode[]): boolean {
  const valid = input.hiddenStateDetected !== true;
  addReason(reasons, valid ? "HIDDEN_STATE_ABSENT" : "HIDDEN_STATE_DETECTED");
  return valid;
}

function validateBoundary(input: StrategicContextAlignmentInput, reasons: StrategicContextAlignmentReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true
    && input.readiness.validation.authorityBounded
    && input.observabilityCertification.validation.authorityBounded
    && input.binding.validation.authorityBounded
    && input.authorityScope.validation.authorityBounded
    && input.policyVisibility.validation.authorityBounded
    && input.governanceReplay.validation.authorityBounded
    && input.governanceCertification.validation.authorityBounded;
  const invalidBoundary = input.alignmentMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.recommendationApprovalRequested === true
    || input.recommendationRankingRequested === true
    || input.recommendationPrioritizationRequested === true
    || input.governanceExecutionRequested === true
    || input.authorityExpansionDetected === true
    || input.hiddenStateDetected === true;
  addReason(reasons, input.alignmentMutationAttempted === true ? "ALIGNMENT_MUTATION_DETECTED" : "ALIGNMENT_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.recommendationApprovalRequested === true ? "RECOMMENDATION_APPROVAL_DETECTED" : "RECOMMENDATION_APPROVAL_BLOCKED");
  addReason(reasons, input.recommendationRankingRequested === true ? "RECOMMENDATION_RANKING_DETECTED" : "RECOMMENDATION_RANKING_BLOCKED");
  addReason(reasons, input.recommendationPrioritizationRequested === true ? "RECOMMENDATION_PRIORITIZATION_DETECTED" : "RECOMMENDATION_PRIORITIZATION_BLOCKED");
  addReason(reasons, input.governanceExecutionRequested === true ? "GOVERNANCE_EXECUTION_DETECTED" : "GOVERNANCE_EXECUTION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "STRATEGIC_ALIGNMENT_IS_NOT_APPROVAL");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(input: StrategicContextAlignmentInput, path: StrategicContextAlignmentEvidencePath, reasons: StrategicContextAlignmentReasonCode[]): boolean {
  const depthValid = input.lineage.ancestryChain.length <= MAX_ALIGNMENT_DEPTH;
  const evidenceValid = path.evidenceReferences.length <= MAX_EVIDENCE_REFERENCES;
  const alignmentValid = path.alignmentReferences.length <= MAX_ALIGNMENT_REFERENCES;
  addReason(reasons, depthValid ? "ALIGNMENT_DEPTH_VALID" : "ALIGNMENT_DEPTH_EXCEEDED");
  addReason(reasons, evidenceValid ? "EVIDENCE_REFERENCE_LIMIT_VALID" : "EVIDENCE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, alignmentValid ? "ALIGNMENT_REFERENCE_LIMIT_VALID" : "ALIGNMENT_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && evidenceValid && alignmentValid;
}

function classifyAlignmentState(
  valid: boolean,
  missionAligned: boolean | null,
  objectiveAligned: boolean | null,
  governanceAligned: boolean,
  riskAligned: boolean,
  operationallyAligned: boolean,
  authorityBounded: boolean,
): StrategicContextAlignmentResult["alignmentState"] {
  if (!valid) return "MISALIGNED";
  if (missionAligned === true && objectiveAligned === true && governanceAligned && riskAligned && operationallyAligned) {
    return "ALIGNED";
  }
  if (missionAligned === null || objectiveAligned === null) {
    return "OBSERVE";
  }
  if (governanceAligned && authorityBounded) {
    return "PARTIALLY_ALIGNED";
  }
  return "MISALIGNED";
}

export function buildStrategicContextAlignmentRequest(
  input: Omit<StrategicContextAlignmentInput, "request"> & {
    recommendationId?: string;
    tenantId?: string;
    alignmentScope?: StrategicContextAlignmentScope;
    graphVersion?: string;
  },
): StrategicContextAlignmentRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    alignmentScope: input.alignmentScope ?? "FULL",
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  });
}

export function createStrategicContextAlignmentEvidencePath(input: StrategicContextAlignmentInput): StrategicContextAlignmentEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    scope: request.alignmentScope,
    evidenceReferences: Object.freeze(evidenceReferencesForScope(request.alignmentScope, input)),
    alignmentReferences: Object.freeze(alignmentReferencesForScope(request.alignmentScope, input)),
    governanceReferences: Object.freeze(governanceReferencesForScope(request.alignmentScope, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
  });
}

export function validateStrategicContextAlignment(input: StrategicContextAlignmentInput): StrategicContextAlignmentValidation {
  const reasons: StrategicContextAlignmentReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createStrategicContextAlignmentEvidencePath(normalizedInput);

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const scopeValid = validateScope(request.alignmentScope, reasons);
  const recommendationValid = validateRecommendation(request, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const missionAligned = validateMissionAlignment(normalizedInput, reasons);
  const objectiveAligned = validateObjectiveAlignment(normalizedInput, reasons);
  const governanceAligned = validateGovernanceAlignment(normalizedInput, reasons);
  const riskAligned = validateRiskAlignment(normalizedInput, reasons);
  const operationallyAligned = validateOperationalAlignment(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const hiddenStateValid = validateHiddenState(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(normalizedInput, evidencePath, reasons);

  const valid = sealedArtifacts
    && scopeValid
    && recommendationValid
    && tenantIsolationVerified
    && ownershipValid
    && governanceAligned
    && evidenceHashesValid
    && hiddenStateValid
    && limitsValid
    && !boundary.invalidBoundary
    && missionAligned !== false
    && objectiveAligned !== false;

  return Object.freeze({
    valid,
    alignmentState: classifyAlignmentState(
      valid,
      missionAligned,
      objectiveAligned,
      governanceAligned,
      riskAligned,
      operationallyAligned,
      boundary.authorityBounded,
    ),
    reasonCodes: normalizeStrings(reasons) as readonly StrategicContextAlignmentReasonCode[],
    missionAligned: missionAligned === true,
    objectiveAligned: objectiveAligned === true,
    governanceAligned,
    riskAligned,
    operationallyAligned,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    alignmentReferenceCount: evidencePath.alignmentReferences.length,
  });
}

export function buildStrategicContextAlignmentResult(input: StrategicContextAlignmentInput): StrategicContextAlignmentResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createStrategicContextAlignmentEvidencePath(normalizedInput);
  const validation = validateStrategicContextAlignment(normalizedInput);

  const alignmentHash = hashAlignmentValue("strategic-context-alignment", {
    request,
    evidencePath,
    alignmentState: validation.alignmentState,
    missionAligned: validation.missionAligned,
    objectiveAligned: validation.objectiveAligned,
    governanceAligned: validation.governanceAligned,
    riskAligned: validation.riskAligned,
    operationallyAligned: validation.operationallyAligned,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    recommendationId: request.recommendationId,
    alignmentState: validation.alignmentState,
    missionAligned: validation.missionAligned,
    objectiveAligned: validation.objectiveAligned,
    governanceAligned: validation.governanceAligned,
    riskAligned: validation.riskAligned,
    operationallyAligned: validation.operationallyAligned,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    alignmentHash,
    deterministic: true,
  });
}

export function buildStrategicContextAlignmentObservability(result: StrategicContextAlignmentResult): StrategicContextAlignmentObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    alignmentState: result.alignmentState,
    missionAligned: result.missionAligned,
    objectiveAligned: result.objectiveAligned,
    governanceAligned: result.governanceAligned,
    riskAligned: result.riskAligned,
    operationallyAligned: result.operationallyAligned,
    alignmentHash: result.alignmentHash,
  });
}

export function sealStrategicContextAlignment(input: StrategicContextAlignmentInput): SealedStrategicContextAlignmentRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createStrategicContextAlignmentEvidencePath(normalizedInput);
  const validation = validateStrategicContextAlignment(normalizedInput);
  const result = buildStrategicContextAlignmentResult(normalizedInput);
  const observability = buildStrategicContextAlignmentObservability(result);

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    alignmentOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    recommendationApprovalAllowed: false as const,
    recommendationRankingAllowed: false as const,
    recommendationPrioritizationAllowed: false as const,
    governanceExecutionAllowed: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const StrategicContextAlignmentValidator = Object.freeze({
  validate: validateStrategicContextAlignment,
});

export const StrategicContextAlignment = Object.freeze({
  buildRequest: buildStrategicContextAlignmentRequest,
  createEvidencePath: createStrategicContextAlignmentEvidencePath,
  buildResult: buildStrategicContextAlignmentResult,
  seal: sealStrategicContextAlignment,
});

export const StrategicContextAlignmentObservabilityService = Object.freeze({
  build: buildStrategicContextAlignmentObservability,
});
