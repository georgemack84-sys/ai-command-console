import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedSimulationBoundaryVerificationRecord,
  SimulationBoundaryVerificationInput,
  SimulationBoundaryVerificationReasonCode,
  SimulationBoundaryVerificationRequest,
  SimulationBoundaryVerificationResult,
  SimulationBoundaryVerificationValidation,
} from "./types";

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: SimulationBoundaryVerificationReasonCode[], reason: SimulationBoundaryVerificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashVerificationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

export function buildSimulationBoundaryVerificationRequest(input: Omit<SimulationBoundaryVerificationInput, "request"> & {
  verificationId: string;
  verificationScope: SimulationBoundaryVerificationRequest["verificationScope"];
}): SimulationBoundaryVerificationRequest {
  return Object.freeze({
    verificationId: input.verificationId,
    simulationId: input.resultModel.result.simulationId,
    tenantId: input.resultModel.result.tenantId,
    verificationScope: input.verificationScope,
    artifactReferences: normalizeStrings([
      input.sealedContract.contract.immutableHash,
      ...input.branchReplays.map((replay) => replay.result.replayHash),
      ...input.sandboxes.map((sandbox) => sandbox.result.isolationHash),
      ...input.forecasts.map((forecast) => forecast.result.forecastHash),
      ...input.analyses.map((analysis) => analysis.result.analysisHash),
      input.replayLedger.bundle.reconstructionHash,
      input.resultModel.result.immutableHash,
      input.certification.result.certificationHash,
      input.certificationReplay.result.reconstructedHash,
      input.observability.result.observabilityHash,
    ]),
    lineageReferences: normalizeStrings([
      input.resultModel.result.lineageHash,
      ...input.replayLedger.entries.map((entry) => entry.lineageHash),
      ...input.branchReplays.map((replay) => replay.result.replayLineageHash),
      ...input.sandboxes.map((sandbox) => sandbox.result.isolationHash),
      ...input.forecasts.map((forecast) => forecast.result.lineageHash),
      ...input.analyses.map((analysis) => analysis.result.lineageHash),
    ]),
  });
}

function validateScope(input: SimulationBoundaryVerificationInput, reasons: SimulationBoundaryVerificationReasonCode[]): boolean {
  const valid = [
    "EXECUTION_BOUNDARY",
    "MUTATION_BOUNDARY",
    "AUTHORITY_BOUNDARY",
    "GOVERNANCE_BOUNDARY",
    "OBSERVABILITY_BOUNDARY",
    "FULL",
  ].includes(input.request.verificationScope);
  addReason(reasons, valid ? "VERIFICATION_SCOPE_VALID" : "VERIFICATION_SCOPE_INVALID");
  return valid;
}

function validateSealedArtifacts(input: SimulationBoundaryVerificationInput, reasons: SimulationBoundaryVerificationReasonCode[]): boolean {
  const valid = input.sealedContract.sealed
    && input.branchReplays.length > 0
    && input.branchReplays.every((replay) => replay.sealed)
    && input.sandboxes.length > 0
    && input.sandboxes.every((sandbox) => sandbox.sealed)
    && input.forecasts.length > 0
    && input.forecasts.every((forecast) => forecast.sealed)
    && input.analyses.length > 0
    && input.analyses.every((analysis) => analysis.sealed)
    && input.replayLedger.sealed
    && input.resultModel.sealed
    && input.certification.sealed
    && input.certificationReplay.sealed
    && input.observability.sealed;
  addReason(reasons, valid ? "ARTIFACTS_SEALED" : "ARTIFACT_UNSEALED");
  return valid;
}

function validateTenant(input: SimulationBoundaryVerificationInput, reasons: SimulationBoundaryVerificationReasonCode[]): boolean {
  const valid = input.request.tenantId === input.sealedContract.contract.tenantId
    && input.resultModel.result.tenantId === input.request.tenantId
    && input.sandboxes.every((sandbox) => sandbox.context.tenantId === input.request.tenantId)
    && input.replayLedger.entries.every((entry) => entry.tenantId === input.request.tenantId)
    && input.observability.result.simulationId === input.request.simulationId;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateReferences(input: SimulationBoundaryVerificationInput, reasons: SimulationBoundaryVerificationReasonCode[]): boolean {
  const expected = buildSimulationBoundaryVerificationRequest({
    sealedContract: input.sealedContract,
    branchReplays: input.branchReplays,
    sandboxes: input.sandboxes,
    forecasts: input.forecasts,
    analyses: input.analyses,
    replayLedger: input.replayLedger,
    resultModel: input.resultModel,
    certification: input.certification,
    certificationReplay: input.certificationReplay,
    observability: input.observability,
    verificationId: input.request.verificationId,
    verificationScope: input.request.verificationScope,
  });
  const artifactValid = input.request.artifactReferences.length > 0
    && expected.artifactReferences.every((reference) => normalizeStrings(input.request.artifactReferences).includes(reference));
  const lineageValid = input.request.lineageReferences.length > 0
    && expected.lineageReferences.every((reference) => normalizeStrings(input.request.lineageReferences).includes(reference));
  addReason(reasons, artifactValid ? "ARTIFACT_REFERENCES_PRESENT" : "ARTIFACT_REFERENCES_MISSING");
  addReason(reasons, lineageValid ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  return artifactValid && lineageValid;
}

function validateLineage(input: SimulationBoundaryVerificationInput, reasons: SimulationBoundaryVerificationReasonCode[]): boolean {
  const valid = input.replayLedger.validation.lineageIntegrity
    && input.resultModel.validation.lineageIntegrity
    && input.certification.validation.lineageIntegrity
    && input.certificationReplay.validation.lineageIntegrity
    && input.observability.validation.lineageIntegrity;
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_INTEGRITY_FAILED");
  return valid;
}

function probeExecutionBoundary(input: SimulationBoundaryVerificationInput, reasons: SimulationBoundaryVerificationReasonCode[]): boolean {
  const valid = input.sealedContract.executionAuthorized === false
    && input.sealedContract.schedulingAllowed === false
    && input.branchReplays.every((replay) => replay.executionAuthorized === false && replay.schedulingAllowed === false)
    && input.sandboxes.every((sandbox) => sandbox.runtimeAccessAllowed === false && sandbox.schedulerAccessAllowed === false)
    && input.forecasts.every((forecast) => forecast.executionAuthorized === false)
    && input.replayLedger.executionAuthorized === false
    && input.replayLedger.schedulingAllowed === false
    && input.resultModel.executionAuthorized === false
    && input.certification.executionAuthorized === false
    && input.certificationReplay.executionAuthorized === false
    && input.observability.executionAuthorized === false
    && input.observability.schedulingAllowed === false;
  addReason(reasons, valid ? "EXECUTION_BOUNDARY_VERIFIED" : "EXECUTION_PATH_DETECTED");
  return valid;
}

function probeMutationBoundary(input: SimulationBoundaryVerificationInput, reasons: SimulationBoundaryVerificationReasonCode[]): boolean {
  const valid = input.sealedContract.runtimeMutationAllowed === false
    && input.sealedContract.persistenceAllowed === false
    && input.branchReplays.every((replay) => replay.runtimeMutationAllowed === false && replay.persistenceAllowed === false)
    && input.sandboxes.every((sandbox) => sandbox.persistenceAllowed === false && sandbox.writeAccessAllowed === false)
    && input.forecasts.every((forecast) => forecast.policyMutationAllowed === false)
    && input.analyses.every((analysis) => analysis.workflowMutationAllowed === false)
    && input.replayLedger.workflowMutationAllowed === false
    && input.replayLedger.persistenceAllowed === false
    && input.resultModel.evidenceMutationAllowed === false
    && input.resultModel.workflowMutationAllowed === false
    && input.certification.workflowMutationAllowed === false
    && input.certification.governanceMutationAllowed === false
    && input.certificationReplay.artifactMutationAllowed === false
    && input.certificationReplay.lineageMutationAllowed === false
    && input.observability.artifactMutationAllowed === false
    && input.observability.workflowMutationAllowed === false;
  addReason(reasons, valid ? "MUTATION_BOUNDARY_VERIFIED" : "MUTATION_PATH_DETECTED");
  return valid;
}

function probeAuthorityBoundary(input: SimulationBoundaryVerificationInput, reasons: SimulationBoundaryVerificationReasonCode[]): boolean {
  const valid = input.sealedContract.authorityMutationAllowed === false
    && input.branchReplays.every((replay) => replay.authorityMutationAllowed === false)
    && input.sandboxes.every((sandbox) => sandbox.authorityMutationAllowed === false)
    && input.forecasts.every((forecast) => forecast.approvalAuthorized === false && forecast.rejectionAuthorized === false && forecast.authorityMutationAllowed === false)
    && input.analyses.every((analysis) => (
      analysis.pathSelectionAuthorized === false
      && analysis.executionRecommended === false
      && analysis.optimizationAllowed === false
      && analysis.authorityMutationAllowed === false
    ))
    && input.replayLedger.authorityMutationAllowed === false
    && input.resultModel.decisionAuthorized === false
    && input.resultModel.recommendationAllowed === false
    && input.resultModel.rankingAllowed === false
    && input.resultModel.authorityMutationAllowed === false
    && input.certification.approvalAuthorized === false
    && input.certification.repairAuthorized === false
    && input.certification.remediationAllowed === false
    && input.certification.authorityMutationAllowed === false
    && input.certificationReplay.recertificationAllowed === false
    && input.certificationReplay.remediationAllowed === false
    && input.certificationReplay.authorityMutationAllowed === false
    && input.observability.authorityMutationAllowed === false
    && input.observability.remediationAllowed === false;
  addReason(reasons, valid ? "AUTHORITY_BOUNDARY_VERIFIED" : "AUTHORITY_EXPANSION_DETECTED");
  return valid;
}

function probeGovernanceBoundary(input: SimulationBoundaryVerificationInput, reasons: SimulationBoundaryVerificationReasonCode[]): boolean {
  const valid = input.sealedContract.contract.governanceVersion.length > 0
    && input.forecasts.every((forecast) => forecast.validation.governanceAuthoritative && forecast.policyMutationAllowed === false)
    && input.analyses.every((analysis) => analysis.validation.governanceAuthoritative)
    && input.resultModel.validation.governanceAuthoritative
    && input.certification.result.governanceVerified
    && input.certification.governanceMutationAllowed === false
    && input.certificationReplay.governanceMutationAllowed === false
    && input.observability.governanceMutationAllowed === false;
  addReason(reasons, valid ? "GOVERNANCE_BOUNDARY_VERIFIED" : "GOVERNANCE_BOUNDARY_VIOLATION");
  return valid;
}

function probeObservabilityBoundary(input: SimulationBoundaryVerificationInput, reasons: SimulationBoundaryVerificationReasonCode[]): boolean {
  const valid = input.observability.readOnly
    && input.observability.visibilityOnly
    && input.observability.executionAuthorized === false
    && input.observability.workflowMutationAllowed === false
    && input.observability.artifactMutationAllowed === false
    && input.observability.remediationAllowed === false;
  addReason(reasons, valid ? "OBSERVABILITY_BOUNDARY_VERIFIED" : "OBSERVABILITY_CONTROL_DETECTED");
  return valid;
}

function resolveStatus(input: {
  artifactsSealed: boolean;
  tenantValid: boolean;
  referencesValid: boolean;
  scopeValid: boolean;
  lineageIntegrity: boolean;
  executionBoundaryVerified: boolean;
  mutationBoundaryVerified: boolean;
  authorityBoundaryVerified: boolean;
  governanceBoundaryVerified: boolean;
  observabilityBoundaryVerified: boolean;
}): SimulationBoundaryVerificationResult["verificationStatus"] {
  if (!input.artifactsSealed || !input.tenantValid || !input.scopeValid) return "FREEZE";
  if (!input.referencesValid) return "ESCALATE";
  if (!input.lineageIntegrity) return "ESCALATE";
  if (!input.executionBoundaryVerified || !input.mutationBoundaryVerified || !input.observabilityBoundaryVerified) return "BLOCK";
  if (!input.authorityBoundaryVerified) return "FREEZE";
  if (!input.governanceBoundaryVerified) return "AUDIT";
  return "PASS";
}

function escalationReason(validation: SimulationBoundaryVerificationValidation): string | undefined {
  if (validation.verificationStatus === "PASS") return undefined;
  return validation.reasonCodes.join(",");
}

export function validateSimulationBoundaryVerification(input: SimulationBoundaryVerificationInput): SimulationBoundaryVerificationValidation {
  const reasons: SimulationBoundaryVerificationReasonCode[] = [];
  const artifactsSealed = validateSealedArtifacts(input, reasons);
  const tenantValid = validateTenant(input, reasons);
  const scopeValid = validateScope(input, reasons);
  const referencesValid = validateReferences(input, reasons);
  const lineageIntegrity = validateLineage(input, reasons);
  const executionBoundaryVerified = probeExecutionBoundary(input, reasons);
  const mutationBoundaryVerified = probeMutationBoundary(input, reasons);
  const authorityBoundaryVerified = probeAuthorityBoundary(input, reasons);
  const governanceBoundaryVerified = probeGovernanceBoundary(input, reasons);
  const observabilityBoundaryVerified = probeObservabilityBoundary(input, reasons);
  addReason(reasons, "VERIFICATION_IS_NOT_AUTHORITY");

  return Object.freeze({
    verificationStatus: resolveStatus({
      artifactsSealed,
      tenantValid,
      referencesValid,
      scopeValid,
      lineageIntegrity,
      executionBoundaryVerified,
      mutationBoundaryVerified,
      authorityBoundaryVerified,
      governanceBoundaryVerified,
      observabilityBoundaryVerified,
    }),
    reasonCodes: normalizeStrings(reasons) as readonly SimulationBoundaryVerificationReasonCode[],
    executionBoundaryVerified,
    mutationBoundaryVerified,
    authorityBoundaryVerified,
    governanceBoundaryVerified,
    observabilityBoundaryVerified,
    lineageIntegrity,
    deterministic: true as const,
    readOnly: true as const,
    verificationOnly: true as const,
  });
}

export function verifySimulationBoundaries(input: SimulationBoundaryVerificationInput): SimulationBoundaryVerificationResult {
  const validation = validateSimulationBoundaryVerification(input);
  const core = Object.freeze({
    verificationId: input.request.verificationId,
    simulationId: input.request.simulationId,
    tenantId: input.request.tenantId,
    verificationScope: input.request.verificationScope,
    artifactReferences: normalizeStrings(input.request.artifactReferences),
    lineageReferences: normalizeStrings(input.request.lineageReferences),
    verificationStatus: validation.verificationStatus,
    executionBoundaryVerified: validation.executionBoundaryVerified,
    mutationBoundaryVerified: validation.mutationBoundaryVerified,
    authorityBoundaryVerified: validation.authorityBoundaryVerified,
    governanceBoundaryVerified: validation.governanceBoundaryVerified,
    observabilityBoundaryVerified: validation.observabilityBoundaryVerified,
    lineageIntegrity: validation.lineageIntegrity,
  });
  const verificationHash = hashVerificationValue("simulation-boundary-verification-harness", core);

  return Object.freeze({
    verificationId: input.request.verificationId,
    simulationId: input.request.simulationId,
    verificationStatus: validation.verificationStatus,
    executionBoundaryVerified: validation.executionBoundaryVerified,
    mutationBoundaryVerified: validation.mutationBoundaryVerified,
    authorityBoundaryVerified: validation.authorityBoundaryVerified,
    governanceBoundaryVerified: validation.governanceBoundaryVerified,
    observabilityBoundaryVerified: validation.observabilityBoundaryVerified,
    lineageIntegrity: validation.lineageIntegrity,
    verificationHash,
    escalationReason: escalationReason(validation),
  });
}

export function sealSimulationBoundaryVerification(input: SimulationBoundaryVerificationInput): SealedSimulationBoundaryVerificationRecord {
  const validation = validateSimulationBoundaryVerification(input);
  const result = verifySimulationBoundaries(input);

  return Object.freeze({
    result,
    validation,
    sealed: true as const,
    readOnly: true as const,
    verificationOnly: true as const,
    executionAuthorized: false as const,
    workflowMutationAllowed: false as const,
    artifactMutationAllowed: false as const,
    governanceMutationAllowed: false as const,
    authorityMutationAllowed: false as const,
    approvalAuthorized: false as const,
    remediationAllowed: false as const,
    persistenceAllowed: false as const,
    schedulingAllowed: false as const,
  });
}

export const SimulationBoundaryVerificationValidator = Object.freeze({
  validate: validateSimulationBoundaryVerification,
});

export const SimulationBoundaryVerificationHarness = Object.freeze({
  buildRequest: buildSimulationBoundaryVerificationRequest,
  verify: verifySimulationBoundaries,
  seal: sealSimulationBoundaryVerification,
});
