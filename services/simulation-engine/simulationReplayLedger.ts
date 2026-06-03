import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedSimulationReplayLedgerRecord,
  SimulationReplayBundle,
  SimulationReplayLedgerEntry,
  SimulationReplayLedgerInput,
  SimulationReplayLedgerObservability,
  SimulationReplayLedgerReasonCode,
  SimulationReplayLedgerValidation,
} from "./types";

function normalizeStrings(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))].sort());
}

function addReason(reasons: SimulationReplayLedgerReasonCode[], reason: SimulationReplayLedgerReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashLedgerValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function aggregateHash(domain: string, values: readonly string[]): string {
  return hashLedgerValue(domain, normalizeStrings(values));
}

function analysisOrder(input: SimulationReplayLedgerInput): readonly string[] {
  return Object.freeze(input.analyses.map((analysis) => analysis.result.analysisId).sort());
}

function validateSealedArtifacts(input: SimulationReplayLedgerInput, reasons: SimulationReplayLedgerReasonCode[]): boolean {
  const contractSealed = input.sealedContract.sealed === true;
  const replaysSealed = input.branchReplays.length > 0 && input.branchReplays.every((replay) => replay.sealed === true);
  const sandboxesSealed = input.sandboxes.length > 0 && input.sandboxes.every((sandbox) => sandbox.sealed === true);
  const forecastsSealed = input.forecasts.length > 0 && input.forecasts.every((forecast) => forecast.sealed === true);
  const analysesSealed = input.analyses.length > 0 && input.analyses.every((analysis) => analysis.sealed === true);

  addReason(reasons, contractSealed ? "CONTRACT_ARTIFACT_SEALED" : "CONTRACT_ARTIFACT_UNSEALED");
  addReason(reasons, replaysSealed ? "REPLAY_ARTIFACTS_SEALED" : "REPLAY_ARTIFACT_UNSEALED");
  addReason(reasons, sandboxesSealed ? "SANDBOX_ARTIFACTS_SEALED" : "SANDBOX_ARTIFACT_UNSEALED");
  addReason(reasons, forecastsSealed ? "FORECAST_ARTIFACTS_SEALED" : "FORECAST_ARTIFACT_UNSEALED");
  addReason(reasons, analysesSealed ? "ANALYSIS_ARTIFACTS_SEALED" : "ANALYSIS_ARTIFACT_UNSEALED");

  return contractSealed && replaysSealed && sandboxesSealed && forecastsSealed && analysesSealed;
}

function validateLineageIntegrity(input: SimulationReplayLedgerInput, reasons: SimulationReplayLedgerReasonCode[]): boolean {
  const simulationId = input.simulationId;
  const contractHash = input.sealedContract.contract.immutableHash;
  const replayIds = new Set(input.branchReplays.map((replay) => replay.result.replayId));
  const sandboxIds = new Set(input.sandboxes.map((sandbox) => sandbox.context.sandboxId));
  const forecastIds = new Set(input.forecasts.map((forecast) => forecast.result.forecastId));

  const contractValid = input.sealedContract.validation.status === "SEALED"
    && input.sealedContract.contract.simulationId === simulationId;
  const replaysValid = input.branchReplays.length > 0
    && input.branchReplays.every((replay) => replay.result.simulationId === simulationId && replay.result.replayStatus === "PASS");
  const sandboxesValid = input.sandboxes.length > 0
    && input.sandboxes.every((sandbox) => (
      sandbox.context.simulationId === simulationId
      && sandbox.context.contractId === contractHash
      && replayIds.has(sandbox.context.replayId)
      && sandbox.result.sandboxStatus === "PASS"
      && sandbox.result.replayIntegrity
    ));
  const forecastsValid = input.forecasts.length > 0
    && input.forecasts.every((forecast) => (
      forecast.result.simulationId === simulationId
      && forecast.result.forecastStatus !== "FREEZE"
      && forecast.result.replayIntegrity
      && forecast.result.containmentIntegrity
      && forecast.result.lineageHash.length > 0
    ));
  const analysesValid = input.analyses.length > 0
    && input.analyses.every((analysis) => (
      analysis.result.simulationId === simulationId
      && analysis.result.analysisStatus !== "FREEZE"
      && analysis.result.replayIntegrity
      && analysis.result.containmentIntegrity
      && analysis.result.lineageHash.length > 0
      && analysis.validation.reasonCodes.includes("LINEAGE_PRESENT")
      && analysis.validation.reasonCodes.includes("ANALYSIS_REFERENCES_SEALED_ARTIFACTS")
      && analysis.result.analysisHash.length > 0
      && forecastIds.size > 0
      && sandboxIds.size > 0
    ));

  const valid = contractValid && replaysValid && sandboxesValid && forecastsValid && analysesValid;
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_INTEGRITY_FAILED");
  return valid;
}

function validateTenantBoundary(input: SimulationReplayLedgerInput, reasons: SimulationReplayLedgerReasonCode[]): boolean {
  const valid = input.sealedContract.contract.tenantId === input.tenantId
    && input.sandboxes.every((sandbox) => sandbox.context.tenantId === input.tenantId);
  addReason(reasons, valid ? "TENANT_BOUNDARY_PRESERVED" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateReplayOrder(input: SimulationReplayLedgerInput, reasons: SimulationReplayLedgerReasonCode[]): boolean {
  const expected = analysisOrder(input);
  const provided = input.replayOrder ? input.replayOrder.filter((analysisId) => analysisId.length > 0) : expected;
  const valid = expected.length > 0 && JSON.stringify(expected) === JSON.stringify(provided);
  addReason(reasons, valid ? "REPLAY_ORDER_VALID" : "REPLAY_ORDER_INVALID");
  return valid;
}

function validateGovernanceVersion(input: SimulationReplayLedgerInput, reasons: SimulationReplayLedgerReasonCode[]): boolean {
  const valid = input.sealedContract.contract.governanceVersion.length > 0;
  addReason(reasons, valid ? "GOVERNANCE_VERSION_PRESENT" : "GOVERNANCE_VERSION_MISSING");
  return valid;
}

function ledgerLineageHash(input: SimulationReplayLedgerInput, analysisLineageHash: string): string {
  return hashLedgerValue("simulation-replay-ledger-lineage", {
    contractHash: input.sealedContract.contract.immutableHash,
    replayLineageHashes: normalizeStrings(input.branchReplays.map((replay) => replay.result.replayLineageHash)),
    sandboxHashes: normalizeStrings(input.sandboxes.map((sandbox) => sandbox.result.isolationHash)),
    forecastLineageHashes: normalizeStrings(input.forecasts.map((forecast) => forecast.result.lineageHash)),
    analysisLineageHash,
  });
}

export function buildSimulationReplayLedgerEntries(input: SimulationReplayLedgerInput): readonly Readonly<SimulationReplayLedgerEntry>[] {
  const contractHash = input.sealedContract.contract.immutableHash;
  const replayHash = aggregateHash("simulation-replay-ledger-replay-hash", input.branchReplays.map((replay) => replay.result.replayHash));
  const sandboxHash = aggregateHash("simulation-replay-ledger-sandbox-hash", input.sandboxes.map((sandbox) => sandbox.result.isolationHash));
  const forecastHash = aggregateHash("simulation-replay-ledger-forecast-hash", input.forecasts.map((forecast) => forecast.result.forecastHash));
  const governanceVersion = input.sealedContract.contract.governanceVersion;
  const orderedAnalyses = [...input.analyses].sort((left, right) => left.result.analysisId.localeCompare(right.result.analysisId));

  return Object.freeze(orderedAnalyses.map((analysis, index) => {
    const replayOrder = index + 1;
    const lineageHash = ledgerLineageHash(input, analysis.result.lineageHash);
    const immutableCore = Object.freeze({
      simulationId: input.simulationId,
      tenantId: input.tenantId,
      contractHash,
      replayHash,
      sandboxHash,
      forecastHash,
      analysisHash: analysis.result.analysisHash,
      lineageHash,
      governanceVersion,
      replayOrder,
      sealed: true,
    });
    const immutableHash = hashLedgerValue("simulation-replay-ledger-entry", immutableCore);
    const ledgerId = hashLedgerValue("simulation-replay-ledger-entry-id", immutableHash);

    return Object.freeze({
      ledgerId,
      simulationId: input.simulationId,
      tenantId: input.tenantId,
      contractHash,
      replayHash,
      sandboxHash,
      forecastHash,
      analysisHash: analysis.result.analysisHash,
      lineageHash,
      governanceVersion,
      replayOrder,
      createdAt: input.createdAt,
      immutableHash,
      sealed: true as const,
    });
  }));
}

export function buildSimulationReconstructionHash(entries: readonly Readonly<SimulationReplayLedgerEntry>[]): string {
  return hashLedgerValue("simulation-replay-ledger-reconstruction", {
    ledgerEntries: entries.map((entry) => Object.freeze({
      ledgerId: entry.ledgerId,
      immutableHash: entry.immutableHash,
      lineageHash: entry.lineageHash,
      replayOrder: entry.replayOrder,
    })),
  });
}

function resolveStatus(input: {
  artifactsSealed: boolean;
  lineageIntegrity: boolean;
  tenantBoundary: boolean;
  replayOrderValid: boolean;
  governanceVersionValid: boolean;
  reconstructionHashValid: boolean;
}): SimulationReplayBundle["bundleStatus"] {
  if (
    !input.artifactsSealed
    || !input.lineageIntegrity
    || !input.tenantBoundary
    || !input.replayOrderValid
    || !input.reconstructionHashValid
  ) {
    return "FREEZE";
  }
  if (!input.governanceVersionValid) return "ESCALATE";
  return "PASS";
}

export function validateSimulationReplayLedger(input: SimulationReplayLedgerInput): SimulationReplayLedgerValidation {
  const reasons: SimulationReplayLedgerReasonCode[] = [];
  const entries = buildSimulationReplayLedgerEntries(input);
  const reconstructionHash = buildSimulationReconstructionHash(entries);
  const artifactsSealed = validateSealedArtifacts(input, reasons);
  const lineageIntegrity = validateLineageIntegrity(input, reasons);
  const tenantBoundary = validateTenantBoundary(input, reasons);
  const replayOrderValid = validateReplayOrder(input, reasons);
  const governanceVersionValid = validateGovernanceVersion(input, reasons);
  const reconstructionHashValid = !input.expectedReconstructionHash || input.expectedReconstructionHash === reconstructionHash;
  addReason(reasons, reconstructionHashValid ? "RECONSTRUCTION_HASH_VALID" : "RECONSTRUCTION_HASH_MISMATCH");
  addReason(reasons, "LEDGER_IS_NOT_EXECUTION");
  addReason(reasons, "AUTHORITY_BOUNDARY_PRESERVED");

  return Object.freeze({
    bundleStatus: resolveStatus({
      artifactsSealed,
      lineageIntegrity,
      tenantBoundary,
      replayOrderValid,
      governanceVersionValid,
      reconstructionHashValid,
    }),
    reasonCodes: normalizeStrings(reasons) as readonly SimulationReplayLedgerReasonCode[],
    lineageIntegrity,
    tenantBoundaryPreserved: tenantBoundary,
    replayOrderValid,
    reconstructionHashValid,
    deterministic: true as const,
    readOnly: true as const,
    authorityBounded: true as const,
    governanceAuthoritative: true as const,
  });
}

export function buildSimulationReplayBundle(input: SimulationReplayLedgerInput): SimulationReplayBundle {
  const entries = buildSimulationReplayLedgerEntries(input);
  const reconstructionHash = buildSimulationReconstructionHash(entries);
  const validation = validateSimulationReplayLedger(input);
  const bundleCore = Object.freeze({
    simulationId: input.simulationId,
    ledgerEntries: entries.map((entry) => entry.ledgerId),
    reconstructionHash,
    bundleStatus: validation.bundleStatus,
  });

  return Object.freeze({
    bundleId: hashLedgerValue("simulation-replay-ledger-bundle-id", bundleCore),
    simulationId: input.simulationId,
    ledgerEntries: entries.map((entry) => entry.ledgerId),
    reconstructionHash,
    replayable: validation.bundleStatus === "PASS",
    lineageIntegrity: validation.lineageIntegrity,
    bundleStatus: validation.bundleStatus,
  });
}

export function buildSimulationReplayLedgerObservability(record: {
  entries: readonly Readonly<SimulationReplayLedgerEntry>[];
  bundle: Readonly<SimulationReplayBundle>;
}): SimulationReplayLedgerObservability {
  const firstEntry = record.entries[0];

  return Object.freeze({
    ledgerId: firstEntry?.ledgerId ?? record.bundle.bundleId,
    simulationId: record.bundle.simulationId,
    replayOrder: firstEntry?.replayOrder ?? 0,
    reconstructionHash: record.bundle.reconstructionHash,
    lineageIntegrity: record.bundle.lineageIntegrity,
    bundleStatus: record.bundle.bundleStatus,
  });
}

export function sealSimulationReplayLedger(input: SimulationReplayLedgerInput): SealedSimulationReplayLedgerRecord {
  const entries = buildSimulationReplayLedgerEntries(input);
  const bundle = buildSimulationReplayBundle(input);
  const validation = validateSimulationReplayLedger(input);
  const observability = buildSimulationReplayLedgerObservability({ entries, bundle });

  return Object.freeze({
    entries,
    bundle,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    advisoryOnly: true as const,
    executionAuthorized: false as const,
    workflowMutationAllowed: false as const,
    authorityMutationAllowed: false as const,
    persistenceAllowed: false as const,
    schedulingAllowed: false as const,
  });
}

export const SimulationReplayLedgerValidator = Object.freeze({
  validate: validateSimulationReplayLedger,
});

export const SimulationReplayLedgerEngine = Object.freeze({
  buildEntries: buildSimulationReplayLedgerEntries,
  buildBundle: buildSimulationReplayBundle,
  seal: sealSimulationReplayLedger,
});

export const SimulationReplayLedgerObservabilityService = Object.freeze({
  build: buildSimulationReplayLedgerObservability,
});
