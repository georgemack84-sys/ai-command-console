import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedSimulationResultModelRecord,
  SimulationResultModel,
  SimulationResultModelInput,
  SimulationResultModelObservability,
  SimulationResultModelReasonCode,
  SimulationResultModelValidation,
} from "./types";

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: SimulationResultModelReasonCode[], reason: SimulationResultModelReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashResultValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function aggregateHash(domain: string, values: readonly string[]): string {
  return hashResultValue(domain, normalizeStrings(values));
}

function collectEvidenceReferences(input: SimulationResultModelInput): string[] {
  return normalizeStrings([
    ...input.sealedContract.contract.evidenceReferences,
    input.sealedContract.contract.riskCertificationReference,
    input.sealedContract.contract.approvalReference,
    ...input.sealedContract.contract.replayReferenceIds,
    ...input.branchReplays.flatMap((replay) => replay.result.reconstructedBranches),
    ...input.sandboxes.flatMap((sandbox) => sandbox.context.permittedResources),
    ...input.forecasts.map((forecast) => forecast.result.forecastId),
    ...input.analyses.map((analysis) => analysis.result.analysisId),
    ...input.replayLedger.bundle.ledgerEntries,
    ...(input.evidenceReferences ?? []),
  ]);
}

function validateSealedArtifacts(input: SimulationResultModelInput, reasons: SimulationResultModelReasonCode[]): boolean {
  const contractSealed = input.sealedContract.sealed === true;
  const replaysSealed = input.branchReplays.length > 0 && input.branchReplays.every((replay) => replay.sealed === true);
  const sandboxesSealed = input.sandboxes.length > 0 && input.sandboxes.every((sandbox) => sandbox.sealed === true);
  const forecastsSealed = input.forecasts.length > 0 && input.forecasts.every((forecast) => forecast.sealed === true);
  const analysesSealed = input.analyses.length > 0 && input.analyses.every((analysis) => analysis.sealed === true);
  const ledgerSealed = input.replayLedger.sealed === true;

  addReason(reasons, contractSealed ? "CONTRACT_ARTIFACT_SEALED" : "CONTRACT_ARTIFACT_UNSEALED");
  addReason(reasons, replaysSealed ? "REPLAY_ARTIFACTS_SEALED" : "REPLAY_ARTIFACT_UNSEALED");
  addReason(reasons, sandboxesSealed ? "SANDBOX_ARTIFACTS_SEALED" : "SANDBOX_ARTIFACT_UNSEALED");
  addReason(reasons, forecastsSealed ? "FORECAST_ARTIFACTS_SEALED" : "FORECAST_ARTIFACT_UNSEALED");
  addReason(reasons, analysesSealed ? "ANALYSIS_ARTIFACTS_SEALED" : "ANALYSIS_ARTIFACT_UNSEALED");
  addReason(reasons, ledgerSealed ? "LEDGER_ARTIFACT_SEALED" : "LEDGER_ARTIFACT_UNSEALED");

  return contractSealed && replaysSealed && sandboxesSealed && forecastsSealed && analysesSealed && ledgerSealed;
}

function validateLineage(input: SimulationResultModelInput, reasons: SimulationResultModelReasonCode[]): boolean {
  const ledgerEntryHashes = new Set(input.replayLedger.entries.map((entry) => entry.immutableHash));
  const ledgerLineageValid = input.replayLedger.validation.lineageIntegrity && input.replayLedger.bundle.lineageIntegrity;
  const contractValid = input.sealedContract.validation.status === "SEALED"
    && input.sealedContract.contract.simulationId === input.simulationId;
  const replaysValid = input.branchReplays.every((replay) => replay.result.simulationId === input.simulationId && replay.result.replayHash.length > 0);
  const sandboxesValid = input.sandboxes.every((sandbox) => sandbox.context.simulationId === input.simulationId && sandbox.result.isolationHash.length > 0);
  const forecastsValid = input.forecasts.every((forecast) => forecast.result.simulationId === input.simulationId && forecast.result.lineageHash.length > 0);
  const analysesValid = input.analyses.every((analysis) => analysis.result.simulationId === input.simulationId && analysis.result.lineageHash.length > 0);
  const entriesValid = input.replayLedger.entries.length > 0
    && input.replayLedger.entries.every((entry) => (
      entry.simulationId === input.simulationId
      && entry.tenantId === input.tenantId
      && entry.sealed
      && ledgerEntryHashes.has(entry.immutableHash)
    ));

  const valid = ledgerLineageValid && contractValid && replaysValid && sandboxesValid && forecastsValid && analysesValid && entriesValid;
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_INTEGRITY_FAILED");
  return valid;
}

function validateTenant(input: SimulationResultModelInput, reasons: SimulationResultModelReasonCode[]): boolean {
  const valid = input.sealedContract.contract.tenantId === input.tenantId
    && input.sandboxes.every((sandbox) => sandbox.context.tenantId === input.tenantId)
    && input.replayLedger.entries.every((entry) => entry.tenantId === input.tenantId);
  addReason(reasons, valid ? "TENANT_BOUNDARY_PRESERVED" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateReplayable(input: SimulationResultModelInput, reasons: SimulationResultModelReasonCode[]): boolean {
  const valid = input.replayLedger.bundle.replayable === true;
  addReason(reasons, valid ? "REPLAYABLE" : "REPLAYABLE_FALSE");
  return valid;
}

function validateReconstruction(input: SimulationResultModelInput, reasons: SimulationResultModelReasonCode[]): boolean {
  const valid = input.replayLedger.bundle.reconstructionHash.length > 0;
  addReason(reasons, valid ? "RECONSTRUCTION_HASH_PRESENT" : "RECONSTRUCTION_HASH_MISSING");
  return valid;
}

function validateGovernance(input: SimulationResultModelInput, reasons: SimulationResultModelReasonCode[]): boolean {
  const valid = input.sealedContract.contract.governanceVersion.length > 0
    && input.replayLedger.entries.every((entry) => entry.governanceVersion === input.sealedContract.contract.governanceVersion);
  addReason(reasons, valid ? "GOVERNANCE_VERSION_PRESENT" : "GOVERNANCE_VERSION_MISSING");
  return valid;
}

function validateEvidenceReferences(input: SimulationResultModelInput, reasons: SimulationResultModelReasonCode[]): boolean {
  const valid = collectEvidenceReferences(input).length > 0;
  addReason(reasons, valid ? "EVIDENCE_REFERENCES_PRESENT" : "EVIDENCE_REFERENCES_MISSING");
  return valid;
}

function resolveStatus(input: {
  artifactsSealed: boolean;
  lineageIntegrity: boolean;
  replayable: boolean;
  tenantBoundary: boolean;
  reconstructionPresent: boolean;
  governancePresent: boolean;
  evidencePresent: boolean;
  ledgerStatus: SimulationResultModel["resultStatus"];
}): SimulationResultModel["resultStatus"] {
  if (
    !input.artifactsSealed
    || !input.lineageIntegrity
    || !input.tenantBoundary
    || !input.reconstructionPresent
    || !input.evidencePresent
  ) {
    return "FREEZE";
  }
  if (!input.replayable || !input.governancePresent || input.ledgerStatus === "ESCALATE") return "ESCALATE";
  if (input.ledgerStatus === "LIMIT_SCOPE") return "LIMIT_SCOPE";
  if (input.ledgerStatus === "FREEZE") return "FREEZE";
  return "PASS";
}

export function validateSimulationResultModel(input: SimulationResultModelInput): SimulationResultModelValidation {
  const reasons: SimulationResultModelReasonCode[] = [];
  const artifactsSealed = validateSealedArtifacts(input, reasons);
  const lineageIntegrity = validateLineage(input, reasons);
  const replayable = validateReplayable(input, reasons);
  const tenantBoundary = validateTenant(input, reasons);
  const reconstructionPresent = validateReconstruction(input, reasons);
  const governancePresent = validateGovernance(input, reasons);
  const evidencePresent = validateEvidenceReferences(input, reasons);
  addReason(reasons, "RESULT_IS_NOT_DECISION");
  addReason(reasons, "AUTHORITY_BOUNDARY_PRESERVED");

  return Object.freeze({
    resultStatus: resolveStatus({
      artifactsSealed,
      lineageIntegrity,
      replayable,
      tenantBoundary,
      reconstructionPresent,
      governancePresent,
      evidencePresent,
      ledgerStatus: input.replayLedger.bundle.bundleStatus,
    }),
    reasonCodes: normalizeStrings(reasons) as readonly SimulationResultModelReasonCode[],
    lineageIntegrity,
    replayable,
    tenantBoundaryPreserved: tenantBoundary,
    evidenceReferencesPreserved: evidencePresent,
    deterministic: true as const,
    readOnly: true as const,
    authorityBounded: true as const,
    governanceAuthoritative: true as const,
  });
}

function resultLineageHash(input: SimulationResultModelInput): string {
  return hashResultValue("simulation-result-lineage", {
    contractHash: input.sealedContract.contract.immutableHash,
    replayLineageHashes: normalizeStrings(input.branchReplays.map((replay) => replay.result.replayLineageHash)),
    sandboxHashes: normalizeStrings(input.sandboxes.map((sandbox) => sandbox.result.isolationHash)),
    forecastLineageHashes: normalizeStrings(input.forecasts.map((forecast) => forecast.result.lineageHash)),
    analysisLineageHashes: normalizeStrings(input.analyses.map((analysis) => analysis.result.lineageHash)),
    ledgerLineageHashes: normalizeStrings(input.replayLedger.entries.map((entry) => entry.lineageHash)),
    reconstructionHash: input.replayLedger.bundle.reconstructionHash,
  });
}

export function buildSimulationResultModel(input: SimulationResultModelInput): SimulationResultModel {
  const validation = validateSimulationResultModel(input);
  const evidenceReferences = collectEvidenceReferences(input);
  const contractHash = input.sealedContract.contract.immutableHash;
  const replayHash = aggregateHash("simulation-result-replay-hash", input.branchReplays.map((replay) => replay.result.replayHash));
  const sandboxHash = aggregateHash("simulation-result-sandbox-hash", input.sandboxes.map((sandbox) => sandbox.result.isolationHash));
  const forecastHash = aggregateHash("simulation-result-forecast-hash", input.forecasts.map((forecast) => forecast.result.forecastHash));
  const analysisHash = aggregateHash("simulation-result-analysis-hash", input.analyses.map((analysis) => analysis.result.analysisHash));
  const lineageHash = resultLineageHash(input);
  const immutableCore = Object.freeze({
    simulationId: input.simulationId,
    tenantId: input.tenantId,
    contractHash,
    replayHash,
    sandboxHash,
    forecastHash,
    analysisHash,
    reconstructionHash: input.replayLedger.bundle.reconstructionHash,
    lineageHash,
    governanceVersion: input.sealedContract.contract.governanceVersion,
    resultVersion: input.resultVersion,
    replayable: validation.replayable,
    lineageIntegrity: validation.lineageIntegrity,
    resultStatus: validation.resultStatus,
    evidenceReferences,
  });
  const immutableHash = hashResultValue("simulation-result-model", immutableCore);

  return Object.freeze({
    resultId: hashResultValue("simulation-result-model-id", immutableHash),
    simulationId: input.simulationId,
    tenantId: input.tenantId,
    contractHash,
    replayHash,
    sandboxHash,
    forecastHash,
    analysisHash,
    reconstructionHash: input.replayLedger.bundle.reconstructionHash,
    lineageHash,
    governanceVersion: input.sealedContract.contract.governanceVersion,
    resultVersion: input.resultVersion,
    replayable: validation.replayable,
    lineageIntegrity: validation.lineageIntegrity,
    resultStatus: validation.resultStatus,
    evidenceReferences,
    createdAt: input.createdAt,
    immutableHash,
  });
}

export function buildSimulationResultModelObservability(result: SimulationResultModel): SimulationResultModelObservability {
  return Object.freeze({
    resultId: result.resultId,
    simulationId: result.simulationId,
    resultStatus: result.resultStatus,
    replayable: result.replayable,
    lineageIntegrity: result.lineageIntegrity,
    immutableHash: result.immutableHash,
  });
}

export function sealSimulationResultModel(input: SimulationResultModelInput): SealedSimulationResultModelRecord {
  const result = buildSimulationResultModel(input);
  const validation = validateSimulationResultModel(input);
  const observability = buildSimulationResultModelObservability(result);

  return Object.freeze({
    result,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    advisoryOnly: true as const,
    decisionAuthorized: false as const,
    recommendationAllowed: false as const,
    rankingAllowed: false as const,
    executionAuthorized: false as const,
    workflowMutationAllowed: false as const,
    authorityMutationAllowed: false as const,
    evidenceMutationAllowed: false as const,
    persistenceAllowed: false as const,
    schedulingAllowed: false as const,
  });
}

export const SimulationResultModelValidator = Object.freeze({
  validate: validateSimulationResultModel,
});

export const SimulationResultModelEngine = Object.freeze({
  build: buildSimulationResultModel,
  seal: sealSimulationResultModel,
});

export const SimulationResultModelObservabilityService = Object.freeze({
  build: buildSimulationResultModelObservability,
});
