import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  IntentSimulationCertificationInput,
  IntentSimulationCertificationObservability,
  IntentSimulationCertificationReasonCode,
  IntentSimulationCertificationValidation,
  SealedIntentSimulationCertificationRecord,
  SimulationCertificationRequest,
  SimulationCertificationResult,
} from "./types";

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: IntentSimulationCertificationReasonCode[], reason: IntentSimulationCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashCertificationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function aggregateHash(domain: string, values: readonly string[]): string {
  return hashCertificationValue(domain, normalizeStrings(values));
}

export function buildSimulationCertificationRequest(input: Omit<IntentSimulationCertificationInput, "request">): SimulationCertificationRequest {
  return Object.freeze({
    simulationId: input.resultModel.result.simulationId,
    tenantId: input.resultModel.result.tenantId,
    contractHash: input.sealedContract.contract.immutableHash,
    replayHash: aggregateHash("intent-simulation-certification-replay-hash", input.branchReplays.map((replay) => replay.result.replayHash)),
    sandboxHash: aggregateHash("intent-simulation-certification-sandbox-hash", input.sandboxes.map((sandbox) => sandbox.result.isolationHash)),
    forecastHash: aggregateHash("intent-simulation-certification-forecast-hash", input.forecasts.map((forecast) => forecast.result.forecastHash)),
    analysisHash: aggregateHash("intent-simulation-certification-analysis-hash", input.analyses.map((analysis) => analysis.result.analysisHash)),
    reconstructionHash: input.replayLedger.bundle.reconstructionHash,
    resultHash: input.resultModel.result.immutableHash,
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

function validateSealedArtifacts(input: IntentSimulationCertificationInput, reasons: IntentSimulationCertificationReasonCode[]): boolean {
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
    && input.resultModel.sealed;
  addReason(reasons, valid ? "ARTIFACTS_SEALED" : "ARTIFACT_UNSEALED");
  return valid;
}

function validateArtifactHashes(input: IntentSimulationCertificationInput, reasons: IntentSimulationCertificationReasonCode[]): boolean {
  const expectedRequest = buildSimulationCertificationRequest(input);
  const valid = input.request.simulationId === expectedRequest.simulationId
    && input.request.tenantId === expectedRequest.tenantId
    && input.request.contractHash === expectedRequest.contractHash
    && input.request.replayHash === expectedRequest.replayHash
    && input.request.sandboxHash === expectedRequest.sandboxHash
    && input.request.forecastHash === expectedRequest.forecastHash
    && input.request.analysisHash === expectedRequest.analysisHash
    && input.request.reconstructionHash === expectedRequest.reconstructionHash
    && input.request.resultHash === expectedRequest.resultHash;
  addReason(reasons, valid ? "ARTIFACT_HASHES_MATCH" : "ARTIFACT_HASH_MISMATCH");
  return valid;
}

function validateReplay(input: IntentSimulationCertificationInput, reasons: IntentSimulationCertificationReasonCode[]): boolean {
  const valid = input.branchReplays.every((replay) => replay.result.replayStatus === "PASS")
    && input.replayLedger.bundle.replayable
    && input.resultModel.result.replayable
    && input.resultModel.result.reconstructionHash === input.replayLedger.bundle.reconstructionHash
    && input.request.reconstructionHash === input.replayLedger.bundle.reconstructionHash;
  addReason(reasons, valid ? "DETERMINISTIC_REPLAY_VERIFIED" : "DETERMINISTIC_REPLAY_FAILED");
  return valid;
}

function validateContainment(input: IntentSimulationCertificationInput, reasons: IntentSimulationCertificationReasonCode[]): boolean {
  const valid = input.sandboxes.every((sandbox) => (
    sandbox.result.sandboxStatus === "PASS"
    && sandbox.result.replayIntegrity
    && sandbox.validation.containmentState === "CONTAINED"
    && sandbox.runtimeAccessAllowed === false
    && sandbox.persistenceAllowed === false
    && sandbox.networkAccessAllowed === false
    && sandbox.schedulerAccessAllowed === false
    && sandbox.workerAccessAllowed === false
    && sandbox.writeAccessAllowed === false
  ));
  addReason(reasons, valid ? "CONTAINMENT_VERIFIED" : "CONTAINMENT_FAILED");
  return valid;
}

function validateGovernance(input: IntentSimulationCertificationInput, reasons: IntentSimulationCertificationReasonCode[]): boolean {
  const governancePresent = input.request.governanceVersion.length > 0 && input.resultModel.result.governanceVersion.length > 0;
  const governanceAligned = input.request.governanceVersion === input.sealedContract.contract.governanceVersion
    && input.forecasts.every((forecast) => forecast.validation.governanceAuthoritative && !forecast.approvalAuthorized && !forecast.rejectionAuthorized)
    && input.analyses.every((analysis) => analysis.validation.governanceAuthoritative)
    && input.resultModel.validation.governanceAuthoritative;

  if (!governancePresent) {
    addReason(reasons, "GOVERNANCE_VERSION_MISSING");
    return false;
  }
  addReason(reasons, governanceAligned ? "GOVERNANCE_VERIFIED" : "GOVERNANCE_VIOLATION");
  return governanceAligned;
}

function validateLineage(input: IntentSimulationCertificationInput, reasons: IntentSimulationCertificationReasonCode[]): boolean {
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
    && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, referencesPresent ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_INTEGRITY_FAILED");
  return valid;
}

function validateTenant(input: IntentSimulationCertificationInput, reasons: IntentSimulationCertificationReasonCode[]): boolean {
  const valid = input.request.tenantId === input.sealedContract.contract.tenantId
    && input.resultModel.result.tenantId === input.request.tenantId
    && input.sandboxes.every((sandbox) => sandbox.context.tenantId === input.request.tenantId)
    && input.replayLedger.entries.every((entry) => entry.tenantId === input.request.tenantId)
    && input.resultModel.validation.tenantBoundaryPreserved;
  addReason(reasons, valid ? "TENANT_ISOLATION_VERIFIED" : "CROSS_TENANT_LEAKAGE");
  return valid;
}

function validateAuthority(input: IntentSimulationCertificationInput, reasons: IntentSimulationCertificationReasonCode[]): boolean {
  const valid = input.sealedContract.executionAuthorized === false
    && input.branchReplays.every((replay) => replay.executionAuthorized === false && replay.authorityMutationAllowed === false)
    && input.sandboxes.every((sandbox) => sandbox.authorityMutationAllowed === false && sandbox.runtimeAccessAllowed === false)
    && input.forecasts.every((forecast) => (
      forecast.approvalAuthorized === false
      && forecast.rejectionAuthorized === false
      && forecast.policyMutationAllowed === false
      && forecast.executionAuthorized === false
      && forecast.authorityMutationAllowed === false
    ))
    && input.analyses.every((analysis) => (
      analysis.pathSelectionAuthorized === false
      && analysis.executionRecommended === false
      && analysis.optimizationAllowed === false
      && analysis.pathGenerationAllowed === false
      && analysis.workflowMutationAllowed === false
      && analysis.authorityMutationAllowed === false
    ))
    && input.replayLedger.executionAuthorized === false
    && input.replayLedger.workflowMutationAllowed === false
    && input.replayLedger.authorityMutationAllowed === false
    && input.resultModel.decisionAuthorized === false
    && input.resultModel.recommendationAllowed === false
    && input.resultModel.rankingAllowed === false
    && input.resultModel.executionAuthorized === false
    && input.resultModel.authorityMutationAllowed === false;
  addReason(reasons, valid ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  return valid;
}

function resolveStatus(input: {
  artifactsSealed: boolean;
  hashesMatch: boolean;
  deterministicReplay: boolean;
  containmentVerified: boolean;
  governanceVerified: boolean;
  governanceVersionMissing: boolean;
  lineageIntegrity: boolean;
  lineageReferencesMissing: boolean;
  tenantIsolationVerified: boolean;
  authorityBounded: boolean;
  resultStatus: string;
}): SimulationCertificationResult["certificationStatus"] {
  if (
    !input.artifactsSealed
    || !input.hashesMatch
    || !input.deterministicReplay
    || !input.containmentVerified
    || (!input.governanceVerified && !input.governanceVersionMissing)
    || !input.lineageIntegrity
    || input.lineageReferencesMissing
    || !input.tenantIsolationVerified
    || !input.authorityBounded
    || input.resultStatus === "FREEZE"
  ) {
    return "FAIL";
  }
  if (input.governanceVersionMissing || input.resultStatus === "ESCALATE" || input.resultStatus === "LIMIT_SCOPE") return "CONDITIONAL_PASS";
  return "PASS";
}

function escalationReason(validation: IntentSimulationCertificationValidation): string | undefined {
  if (validation.certificationStatus === "PASS") return undefined;
  return validation.reasonCodes.join(",");
}

export function validateIntentSimulationCertification(input: IntentSimulationCertificationInput): IntentSimulationCertificationValidation {
  const reasons: IntentSimulationCertificationReasonCode[] = [];
  const artifactsSealed = validateSealedArtifacts(input, reasons);
  const hashesMatch = validateArtifactHashes(input, reasons);
  const deterministicReplay = validateReplay(input, reasons);
  const containmentVerified = validateContainment(input, reasons);
  const governanceVerified = validateGovernance(input, reasons);
  const lineageIntegrity = validateLineage(input, reasons);
  const tenantIsolationVerified = validateTenant(input, reasons);
  const authorityBounded = validateAuthority(input, reasons);
  addReason(reasons, "CERTIFICATION_IS_NOT_CONTROL");
  addReason(reasons, "NO_REMEDIATION_AUTHORITY");

  return Object.freeze({
    certificationStatus: resolveStatus({
      artifactsSealed,
      hashesMatch,
      deterministicReplay,
      containmentVerified,
      governanceVerified,
      governanceVersionMissing: reasons.includes("GOVERNANCE_VERSION_MISSING"),
      lineageIntegrity,
      lineageReferencesMissing: reasons.includes("LINEAGE_REFERENCES_MISSING"),
      tenantIsolationVerified,
      authorityBounded,
      resultStatus: input.resultModel.result.resultStatus,
    }),
    reasonCodes: normalizeStrings(reasons) as readonly IntentSimulationCertificationReasonCode[],
    deterministicReplay,
    containmentVerified,
    governanceVerified,
    lineageIntegrity,
    tenantIsolationVerified,
    authorityBounded,
    deterministic: true as const,
    readOnly: true as const,
    certificationOnly: true as const,
  });
}

export function certifyIntentSimulation(input: IntentSimulationCertificationInput): SimulationCertificationResult {
  const validation = validateIntentSimulationCertification(input);
  const certificationCore = Object.freeze({
    request: {
      ...input.request,
      lineageReferences: normalizeStrings(input.request.lineageReferences),
    },
    certificationStatus: validation.certificationStatus,
    deterministicReplay: validation.deterministicReplay,
    containmentVerified: validation.containmentVerified,
    governanceVerified: validation.governanceVerified,
    lineageIntegrity: validation.lineageIntegrity,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    authorityBounded: validation.authorityBounded,
  });
  const certificationHash = hashCertificationValue("intent-simulation-certification", certificationCore);

  return Object.freeze({
    certificationId: hashCertificationValue("intent-simulation-certification-id", certificationHash),
    simulationId: input.request.simulationId,
    certificationStatus: validation.certificationStatus,
    deterministicReplay: validation.deterministicReplay,
    containmentVerified: validation.containmentVerified,
    governanceVerified: validation.governanceVerified,
    lineageIntegrity: validation.lineageIntegrity,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    authorityBounded: validation.authorityBounded,
    certificationHash,
    escalationReason: escalationReason(validation),
  });
}

export function buildIntentSimulationCertificationObservability(
  result: SimulationCertificationResult,
): IntentSimulationCertificationObservability {
  return Object.freeze({
    certificationId: result.certificationId,
    certificationStatus: result.certificationStatus,
    deterministicReplay: result.deterministicReplay,
    containmentVerified: result.containmentVerified,
    governanceVerified: result.governanceVerified,
    authorityBounded: result.authorityBounded,
    certificationHash: result.certificationHash,
  });
}

export function sealIntentSimulationCertification(input: IntentSimulationCertificationInput): SealedIntentSimulationCertificationRecord {
  const validation = validateIntentSimulationCertification(input);
  const result = certifyIntentSimulation(input);
  const observability = buildIntentSimulationCertificationObservability(result);

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

export const IntentSimulationCertificationValidator = Object.freeze({
  validate: validateIntentSimulationCertification,
});

export const IntentSimulationCertificationGate = Object.freeze({
  buildRequest: buildSimulationCertificationRequest,
  certify: certifyIntentSimulation,
  seal: sealIntentSimulationCertification,
});

export const IntentSimulationCertificationObservabilityService = Object.freeze({
  build: buildIntentSimulationCertificationObservability,
});
