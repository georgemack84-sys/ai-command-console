import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedSimulationCompletionCertificationRecord,
  SimulationCompletionCertificationInput,
  SimulationCompletionCertificationObservability,
  SimulationCompletionCertificationReasonCode,
  SimulationCompletionCertificationRequest,
  SimulationCompletionCertificationResult,
  SimulationCompletionCertificationValidation,
} from "./types";

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(
  reasons: SimulationCompletionCertificationReasonCode[],
  reason: SimulationCompletionCertificationReasonCode,
): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashCompletionValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function aggregateHash(domain: string, values: readonly string[]): string {
  return hashCompletionValue(domain, normalizeStrings(values));
}

export function buildSimulationCompletionCertificationRequest(
  input: Omit<SimulationCompletionCertificationInput, "request">,
): SimulationCompletionCertificationRequest {
  return Object.freeze({
    certificationId: input.certification.result.certificationId,
    simulationId: input.resultModel.result.simulationId,
    tenantId: input.resultModel.result.tenantId,
    contractHash: input.sealedContract.contract.immutableHash,
    replayHash: aggregateHash(
      "intent-simulation-completion-certification-replay-hash",
      input.branchReplays.map((replay) => replay.result.replayHash),
    ),
    sandboxHash: aggregateHash(
      "intent-simulation-completion-certification-sandbox-hash",
      input.sandboxes.map((sandbox) => sandbox.result.isolationHash),
    ),
    forecastHash: aggregateHash(
      "intent-simulation-completion-certification-forecast-hash",
      input.forecasts.map((forecast) => forecast.result.forecastHash),
    ),
    analysisHash: aggregateHash(
      "intent-simulation-completion-certification-analysis-hash",
      input.analyses.map((analysis) => analysis.result.analysisHash),
    ),
    reconstructionHash: input.replayLedger.bundle.reconstructionHash,
    resultHash: input.resultModel.result.immutableHash,
    verificationHash: input.verification.result.verificationHash,
    lineageReferences: normalizeStrings([
      input.resultModel.result.lineageHash,
      ...input.replayLedger.entries.map((entry) => entry.lineageHash),
      ...input.branchReplays.map((replay) => replay.result.replayLineageHash),
      ...input.sandboxes.map((sandbox) => sandbox.result.isolationHash),
      ...input.forecasts.map((forecast) => forecast.result.lineageHash),
      ...input.analyses.map((analysis) => analysis.result.lineageHash),
    ]),
    governanceVersion: input.resultModel.result.governanceVersion,
  });
}

function validateSealedArtifacts(
  input: SimulationCompletionCertificationInput,
  reasons: SimulationCompletionCertificationReasonCode[],
): boolean {
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
    && input.observability.sealed
    && input.verification.sealed;
  addReason(reasons, valid ? "ARTIFACTS_SEALED" : "ARTIFACT_UNSEALED");
  return valid;
}

function validateArtifactHashes(
  input: SimulationCompletionCertificationInput,
  reasons: SimulationCompletionCertificationReasonCode[],
): boolean {
  const expectedRequest = buildSimulationCompletionCertificationRequest(input);
  const valid = input.request.certificationId === expectedRequest.certificationId
    && input.request.simulationId === expectedRequest.simulationId
    && input.request.tenantId === expectedRequest.tenantId
    && input.request.contractHash === expectedRequest.contractHash
    && input.request.replayHash === expectedRequest.replayHash
    && input.request.sandboxHash === expectedRequest.sandboxHash
    && input.request.forecastHash === expectedRequest.forecastHash
    && input.request.analysisHash === expectedRequest.analysisHash
    && input.request.reconstructionHash === expectedRequest.reconstructionHash
    && input.request.resultHash === expectedRequest.resultHash
    && input.request.verificationHash === expectedRequest.verificationHash;
  addReason(reasons, valid ? "ARTIFACT_HASHES_MATCH" : "ARTIFACT_HASH_MISMATCH");
  return valid;
}

function validateReplayDeterminism(
  input: SimulationCompletionCertificationInput,
  reasons: SimulationCompletionCertificationReasonCode[],
): boolean {
  const valid = input.branchReplays.every((replay) => replay.result.replayStatus === "PASS")
    && input.replayLedger.bundle.replayable
    && input.resultModel.result.replayable
    && input.certification.result.deterministicReplay
    && input.certificationReplay.result.reconstructionDeterministic
    && input.certificationReplay.result.replayable
    && input.replayLedger.bundle.reconstructionHash === input.resultModel.result.reconstructionHash
    && input.request.reconstructionHash === input.replayLedger.bundle.reconstructionHash;
  addReason(reasons, valid ? "REPLAY_DETERMINISTIC_VERIFIED" : "REPLAY_DETERMINISTIC_FAILED");
  return valid;
}

function validateContainment(
  input: SimulationCompletionCertificationInput,
  reasons: SimulationCompletionCertificationReasonCode[],
): boolean {
  const valid = input.sandboxes.every((sandbox) => (
    sandbox.result.sandboxStatus === "PASS"
    && sandbox.validation.containmentState === "CONTAINED"
    && sandbox.result.replayIntegrity
    && sandbox.runtimeAccessAllowed === false
    && sandbox.persistenceAllowed === false
    && sandbox.networkAccessAllowed === false
    && sandbox.authorityMutationAllowed === false
    && sandbox.schedulerAccessAllowed === false
    && sandbox.workerAccessAllowed === false
    && sandbox.writeAccessAllowed === false
  )) && input.certification.result.containmentVerified;
  addReason(reasons, valid ? "CONTAINMENT_OPERATIONAL" : "CONTAINMENT_FAILED");
  return valid;
}

function validateGovernance(
  input: SimulationCompletionCertificationInput,
  reasons: SimulationCompletionCertificationReasonCode[],
): boolean {
  const governancePresent = input.request.governanceVersion.length > 0
    && input.sealedContract.contract.governanceVersion.length > 0
    && input.resultModel.result.governanceVersion.length > 0;
  if (!governancePresent) {
    addReason(reasons, "GOVERNANCE_VERSION_MISSING");
    return false;
  }

  const valid = input.request.governanceVersion === input.sealedContract.contract.governanceVersion
    && input.request.governanceVersion === input.resultModel.result.governanceVersion
    && input.forecasts.every((forecast) => forecast.validation.governanceAuthoritative)
    && input.analyses.every((analysis) => analysis.validation.governanceAuthoritative)
    && input.resultModel.validation.governanceAuthoritative
    && input.certification.result.governanceVerified
    && input.verification.result.governanceBoundaryVerified;
  addReason(reasons, valid ? "GOVERNANCE_AUTHORITATIVE" : "GOVERNANCE_VIOLATION");
  return valid;
}

function validateTenantIsolation(
  input: SimulationCompletionCertificationInput,
  reasons: SimulationCompletionCertificationReasonCode[],
): boolean {
  const valid = input.request.tenantId === input.sealedContract.contract.tenantId
    && input.resultModel.result.tenantId === input.request.tenantId
    && input.sandboxes.every((sandbox) => sandbox.context.tenantId === input.request.tenantId)
    && input.replayLedger.entries.every((entry) => entry.tenantId === input.request.tenantId)
    && input.certification.result.tenantIsolationVerified
    && input.certificationReplay.validation.tenantBoundaryPreserved
    && input.verification.result.simulationId === input.request.simulationId;
  addReason(reasons, valid ? "TENANT_ISOLATION_VERIFIED" : "CROSS_TENANT_LEAKAGE");
  return valid;
}

function validateLineage(
  input: SimulationCompletionCertificationInput,
  reasons: SimulationCompletionCertificationReasonCode[],
): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const required = normalizeStrings([
    input.resultModel.result.lineageHash,
    ...input.replayLedger.entries.map((entry) => entry.lineageHash),
    ...input.branchReplays.map((replay) => replay.result.replayLineageHash),
    ...input.sandboxes.map((sandbox) => sandbox.result.isolationHash),
    ...input.forecasts.map((forecast) => forecast.result.lineageHash),
    ...input.analyses.map((analysis) => analysis.result.lineageHash),
  ]);
  const referencesPresent = lineageReferences.length > 0;
  const valid = referencesPresent
    && input.replayLedger.validation.lineageIntegrity
    && input.resultModel.validation.lineageIntegrity
    && input.certification.validation.lineageIntegrity
    && input.certificationReplay.validation.lineageIntegrity
    && input.observability.validation.lineageIntegrity
    && input.verification.validation.lineageIntegrity
    && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, referencesPresent ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_INTEGRITY_FAILED");
  return valid;
}

function validateObservability(
  input: SimulationCompletionCertificationInput,
  reasons: SimulationCompletionCertificationReasonCode[],
): boolean {
  const state = input.observability.result.observabilityState;
  const operational = state === "HEALTHY" || state === "DEGRADED";
  addReason(
    reasons,
    state === "DEGRADED"
      ? "OBSERVABILITY_DEGRADED"
      : operational
        ? "OBSERVABILITY_OPERATIONAL"
        : "OBSERVABILITY_FAILED",
  );
  return operational;
}

function validateVerification(
  input: SimulationCompletionCertificationInput,
  reasons: SimulationCompletionCertificationReasonCode[],
): boolean {
  const valid = input.verification.result.verificationStatus === "PASS"
    && input.verification.result.executionBoundaryVerified
    && input.verification.result.mutationBoundaryVerified
    && input.verification.result.authorityBoundaryVerified
    && input.verification.result.governanceBoundaryVerified
    && input.verification.result.observabilityBoundaryVerified;
  addReason(reasons, valid ? "VERIFICATION_OPERATIONAL" : "VERIFICATION_FAILED");
  return valid;
}

function validateAuthority(
  input: SimulationCompletionCertificationInput,
  reasons: SimulationCompletionCertificationReasonCode[],
): boolean {
  const valid = input.sealedContract.executionAuthorized === false
    && input.sealedContract.authorityMutationAllowed === false
    && input.branchReplays.every((replay) => replay.executionAuthorized === false && replay.authorityMutationAllowed === false)
    && input.sandboxes.every((sandbox) => sandbox.authorityMutationAllowed === false && sandbox.runtimeAccessAllowed === false)
    && input.forecasts.every((forecast) => (
      forecast.approvalAuthorized === false
      && forecast.rejectionAuthorized === false
      && forecast.executionAuthorized === false
      && forecast.authorityMutationAllowed === false
    ))
    && input.analyses.every((analysis) => (
      analysis.pathSelectionAuthorized === false
      && analysis.executionRecommended === false
      && analysis.optimizationAllowed === false
      && analysis.authorityMutationAllowed === false
    ))
    && input.replayLedger.executionAuthorized === false
    && input.replayLedger.workflowMutationAllowed === false
    && input.replayLedger.authorityMutationAllowed === false
    && input.resultModel.decisionAuthorized === false
    && input.resultModel.recommendationAllowed === false
    && input.resultModel.rankingAllowed === false
    && input.resultModel.executionAuthorized === false
    && input.resultModel.authorityMutationAllowed === false
    && input.certification.executionAuthorized === false
    && input.certification.approvalAuthorized === false
    && input.certification.repairAuthorized === false
    && input.certification.remediationAllowed === false
    && input.certification.authorityMutationAllowed === false
    && input.certificationReplay.executionAuthorized === false
    && input.certificationReplay.recertificationAllowed === false
    && input.certificationReplay.authorityMutationAllowed === false
    && input.observability.executionAuthorized === false
    && input.observability.authorityMutationAllowed === false
    && input.observability.remediationAllowed === false
    && input.verification.executionAuthorized === false
    && input.verification.approvalAuthorized === false
    && input.verification.authorityMutationAllowed === false
    && input.verification.remediationAllowed === false
    && input.certification.result.authorityBounded
    && input.verification.result.authorityBoundaryVerified;
  addReason(reasons, valid ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  return valid;
}

function resolveStatus(input: {
  artifactsSealed: boolean;
  hashesMatch: boolean;
  replayDeterministic: boolean;
  containmentOperational: boolean;
  governanceAuthoritative: boolean;
  governanceVersionMissing: boolean;
  tenantIsolationVerified: boolean;
  lineageIntegrity: boolean;
  lineageReferencesMissing: boolean;
  observabilityOperational: boolean;
  observabilityDegraded: boolean;
  verificationOperational: boolean;
  authorityBounded: boolean;
}): SimulationCompletionCertificationResult["completionStatus"] {
  if (
    !input.artifactsSealed
    || !input.hashesMatch
    || !input.replayDeterministic
    || !input.containmentOperational
    || (!input.governanceAuthoritative && !input.governanceVersionMissing)
    || !input.tenantIsolationVerified
    || !input.lineageIntegrity
    || input.lineageReferencesMissing
    || !input.observabilityOperational
    || !input.verificationOperational
    || !input.authorityBounded
  ) {
    return "FAIL";
  }

  if (input.governanceVersionMissing || input.observabilityDegraded) return "CONDITIONAL_PASS";
  return "PASS";
}

function escalationReason(validation: SimulationCompletionCertificationValidation): string | undefined {
  if (validation.completionStatus === "PASS") return undefined;
  return validation.reasonCodes.join(",");
}

export function validateSimulationCompletionCertification(
  input: SimulationCompletionCertificationInput,
): SimulationCompletionCertificationValidation {
  const reasons: SimulationCompletionCertificationReasonCode[] = [];
  const artifactsSealed = validateSealedArtifacts(input, reasons);
  const hashesMatch = validateArtifactHashes(input, reasons);
  const replayDeterministic = validateReplayDeterminism(input, reasons);
  const containmentOperational = validateContainment(input, reasons);
  const governanceAuthoritative = validateGovernance(input, reasons);
  const tenantIsolationVerified = validateTenantIsolation(input, reasons);
  const lineageIntegrity = validateLineage(input, reasons);
  const observabilityOperational = validateObservability(input, reasons);
  const verificationOperational = validateVerification(input, reasons);
  const authorityBounded = validateAuthority(input, reasons);
  addReason(reasons, "COMPLETION_CERTIFICATION_IS_NOT_AUTHORITY");
  addReason(reasons, "NO_REMEDIATION_AUTHORITY");

  return Object.freeze({
    completionStatus: resolveStatus({
      artifactsSealed,
      hashesMatch,
      replayDeterministic,
      containmentOperational,
      governanceAuthoritative,
      governanceVersionMissing: reasons.includes("GOVERNANCE_VERSION_MISSING"),
      tenantIsolationVerified,
      lineageIntegrity,
      lineageReferencesMissing: reasons.includes("LINEAGE_REFERENCES_MISSING"),
      observabilityOperational,
      observabilityDegraded: reasons.includes("OBSERVABILITY_DEGRADED"),
      verificationOperational,
      authorityBounded,
    }),
    reasonCodes: normalizeStrings(reasons) as readonly SimulationCompletionCertificationReasonCode[],
    replayDeterministic,
    containmentOperational,
    governanceAuthoritative,
    tenantIsolationVerified,
    lineageIntegrity,
    observabilityOperational,
    verificationOperational,
    authorityBounded,
    deterministic: true as const,
    readOnly: true as const,
    certificationOnly: true as const,
  });
}

export function certifySimulationCompletion(
  input: SimulationCompletionCertificationInput,
): SimulationCompletionCertificationResult {
  const validation = validateSimulationCompletionCertification(input);
  const completionCore = Object.freeze({
    request: {
      ...input.request,
      lineageReferences: normalizeStrings(input.request.lineageReferences),
    },
    completionStatus: validation.completionStatus,
    replayDeterministic: validation.replayDeterministic,
    containmentOperational: validation.containmentOperational,
    governanceAuthoritative: validation.governanceAuthoritative,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    lineageIntegrity: validation.lineageIntegrity,
    observabilityOperational: validation.observabilityOperational,
    verificationOperational: validation.verificationOperational,
    authorityBounded: validation.authorityBounded,
  });
  const completionHash = hashCompletionValue("intent-simulation-completion-certification", completionCore);

  return Object.freeze({
    completionId: hashCompletionValue("intent-simulation-completion-certification-id", completionHash),
    simulationId: input.request.simulationId,
    completionStatus: validation.completionStatus,
    replayDeterministic: validation.replayDeterministic,
    containmentOperational: validation.containmentOperational,
    governanceAuthoritative: validation.governanceAuthoritative,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    lineageIntegrity: validation.lineageIntegrity,
    observabilityOperational: validation.observabilityOperational,
    verificationOperational: validation.verificationOperational,
    authorityBounded: validation.authorityBounded,
    completionHash,
    escalationReason: escalationReason(validation),
  });
}

export function buildSimulationCompletionCertificationObservability(
  result: SimulationCompletionCertificationResult,
): SimulationCompletionCertificationObservability {
  return Object.freeze({
    completionId: result.completionId,
    completionStatus: result.completionStatus,
    replayDeterministic: result.replayDeterministic,
    containmentOperational: result.containmentOperational,
    governanceAuthoritative: result.governanceAuthoritative,
    verificationOperational: result.verificationOperational,
    completionHash: result.completionHash,
  });
}

export function sealSimulationCompletionCertification(
  input: SimulationCompletionCertificationInput,
): SealedSimulationCompletionCertificationRecord {
  const validation = validateSimulationCompletionCertification(input);
  const result = certifySimulationCompletion(input);
  const observability = buildSimulationCompletionCertificationObservability(result);

  return Object.freeze({
    result,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    certificationOnly: true as const,
    executionAuthorized: false as const,
    repairAuthorized: false as const,
    approvalAuthorized: false as const,
    remediationAllowed: false as const,
    workflowMutationAllowed: false as const,
    governanceMutationAllowed: false as const,
    authorityMutationAllowed: false as const,
    persistenceAllowed: false as const,
    schedulingAllowed: false as const,
  });
}

export const SimulationCompletionCertificationValidator = Object.freeze({
  validate: validateSimulationCompletionCertification,
});

export const IntentSimulationCompletionCertificationGate = Object.freeze({
  buildRequest: buildSimulationCompletionCertificationRequest,
  certify: certifySimulationCompletion,
  seal: sealSimulationCompletionCertification,
});

export const SimulationCompletionCertificationObservabilityService = Object.freeze({
  build: buildSimulationCompletionCertificationObservability,
});
