import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SandboxResult,
  SandboxResultStatus,
  SealedSimulationSandboxRecord,
  SimulationSandboxContext,
  SimulationSandboxObservability,
  SimulationSandboxReasonCode,
  SimulationSandboxRequest,
  SimulationSandboxValidation,
} from "./types";

export const MAX_SANDBOX_DURATION = 300;
export const MAX_REPLAY_CONTEXTS = 25;
export const MAX_RESOURCE_SCOPE = 50;

const SANDBOX_LIFECYCLE = Object.freeze([
  "CREATE_SANDBOX",
  "VALIDATE_CONTRACT",
  "VALIDATE_REPLAY",
  "ISOLATE_CONTEXT",
  "GENERATE_HASH",
  "SEAL_SANDBOX",
  "ALLOW_SIMULATION",
] as const);

function normalizeStrings(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))].sort());
}

function addReason(reasons: SimulationSandboxReasonCode[], reason: SimulationSandboxReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function requestedDuration(input: SimulationSandboxRequest): number {
  return input.requestedDurationSeconds ?? MAX_SANDBOX_DURATION;
}

function replayContexts(input: SimulationSandboxRequest): readonly string[] {
  return normalizeStrings(input.replayContextIds ?? input.branchReplay.result.reconstructedBranches);
}

function validateContract(input: SimulationSandboxRequest, reasons: SimulationSandboxReasonCode[]): boolean {
  const valid = input.sealedContract.sealed
    && input.sealedContract.validation.status === "SEALED"
    && input.sealedContract.contract.tenantId === input.tenantId;
  addReason(reasons, valid ? "CONTRACT_VALID" : "CONTRACT_INVALID");
  if (input.sealedContract.contract.tenantId !== input.tenantId) addReason(reasons, "CROSS_TENANT_ACCESS_BLOCKED");
  addReason(reasons, "TENANT_CONTEXT_IMMUTABLE");
  return valid;
}

function validateReplay(input: SimulationSandboxRequest, reasons: SimulationSandboxReasonCode[]): boolean {
  const valid = input.branchReplay.sealed
    && input.branchReplay.result.replayStatus === "PASS"
    && input.branchReplay.result.simulationId === input.sealedContract.contract.simulationId;
  addReason(reasons, valid ? "REPLAY_VALID" : "REPLAY_INTEGRITY_FAILED");
  return valid;
}

function validateAccess(input: SimulationSandboxRequest, reasons: SimulationSandboxReasonCode[]): boolean {
  let valid = true;
  if (input.runtimeAccessAllowed === true) {
    addReason(reasons, "RUNTIME_ACCESS_BLOCKED");
    valid = false;
  }
  if (input.persistenceAllowed === true) {
    addReason(reasons, "PERSISTENCE_BLOCKED");
    valid = false;
  }
  if (input.networkAccessAllowed === true) {
    addReason(reasons, "NETWORK_ACCESS_BLOCKED");
    valid = false;
  }
  if (input.schedulerAccessAllowed === true) {
    addReason(reasons, "SCHEDULER_ACCESS_BLOCKED");
    valid = false;
  }
  if (input.authorityMutationAllowed === true) {
    addReason(reasons, "AUTHORITY_MUTATION_BLOCKED");
    valid = false;
  }
  if (input.workerAccessAllowed === true) {
    addReason(reasons, "WORKERS_BLOCKED");
    valid = false;
  }
  if (input.writeAccessAllowed === true) {
    addReason(reasons, "WRITES_BLOCKED");
    valid = false;
  }
  if (input.sandboxPermissionsMutated === true) {
    addReason(reasons, "PERMISSIONS_IMMUTABLE");
    valid = false;
  }
  addReason(reasons, "SANDBOX_ESCAPE_BLOCKED");
  addReason(reasons, "SANDBOX_IS_NOT_EXECUTION");
  addReason(reasons, "AUTHORITY_BOUNDARY_PRESERVED");
  return valid;
}

function validateResources(input: SimulationSandboxRequest, reasons: SimulationSandboxReasonCode[]): boolean {
  let valid = true;
  if (input.permittedResources.length > MAX_RESOURCE_SCOPE) {
    addReason(reasons, "RESOURCE_SCOPE_LIMITED");
    valid = false;
  }
  if (replayContexts(input).length > MAX_REPLAY_CONTEXTS) {
    addReason(reasons, "REPLAY_CONTEXT_LIMITED");
    valid = false;
  }
  if (requestedDuration(input) > MAX_SANDBOX_DURATION) {
    addReason(reasons, "SANDBOX_DURATION_LIMITED");
    valid = false;
  }
  return valid;
}

function resolveStatus(input: {
  contractValid: boolean;
  replayValid: boolean;
  accessValid: boolean;
  resourcesValid: boolean;
}): SandboxResultStatus {
  if (!input.contractValid || !input.accessValid) return "FREEZE";
  if (!input.replayValid) return "ESCALATE";
  if (!input.resourcesValid) return "LIMIT_SCOPE";
  return "PASS";
}

function containmentState(status: SandboxResultStatus): SimulationSandboxValidation["containmentState"] {
  switch (status) {
    case "PASS":
      return "CONTAINED";
    case "LIMIT_SCOPE":
      return "LIMITED";
    case "ESCALATE":
      return "ESCALATED";
    case "FREEZE":
      return "FROZEN";
  }
}

function sandboxContextHashInput(input: SimulationSandboxRequest, status: SandboxResultStatus): Omit<SimulationSandboxContext, "immutableHash"> {
  return Object.freeze({
    sandboxId: input.sandboxId,
    simulationId: input.sealedContract.contract.simulationId,
    tenantId: input.tenantId,
    contractId: input.sealedContract.contract.immutableHash,
    replayId: input.branchReplay.result.replayId,
    sandboxStatus: status === "PASS" ? "ACTIVE" as const : status === "LIMIT_SCOPE" ? "LIMITED" as const : "FROZEN" as const,
    isolationLevel: input.isolationLevel,
    permittedResources: normalizeStrings(input.permittedResources),
    createdAt: input.createdAt,
    runtimeAccessAllowed: false as const,
    persistenceAllowed: false as const,
    networkAccessAllowed: false as const,
    authorityMutationAllowed: false as const,
    schedulerAccessAllowed: false as const,
  });
}

export function validateSimulationSandbox(input: SimulationSandboxRequest): SimulationSandboxValidation {
  const reasons: SimulationSandboxReasonCode[] = [];
  const contractValid = validateContract(input, reasons);
  const replayValid = validateReplay(input, reasons);
  const accessValid = validateAccess(input, reasons);
  const resourcesValid = validateResources(input, reasons);
  const status = resolveStatus({
    contractValid,
    replayValid,
    accessValid,
    resourcesValid,
  });
  const resourceUsageSummary = Object.freeze({
    permittedResourceCount: input.permittedResources.length,
    replayContextCount: replayContexts(input).length,
    requestedDurationSeconds: requestedDuration(input),
    maxSandboxDuration: MAX_SANDBOX_DURATION,
    maxReplayContexts: MAX_REPLAY_CONTEXTS,
    maxResourceScope: MAX_RESOURCE_SCOPE,
  });

  return Object.freeze({
    sandboxStatus: status,
    reasonCodes: normalizeStrings(reasons) as readonly SimulationSandboxReasonCode[],
    lifecycle: SANDBOX_LIFECYCLE,
    replayIntegrity: replayValid,
    containmentState: containmentState(status),
    resourceUsageSummary,
    deterministic: true as const,
    readOnly: true as const,
    authorityBounded: accessValid,
    runtimeInaccessible: input.runtimeAccessAllowed !== true,
    networkInaccessible: input.networkAccessAllowed !== true,
    stateProtected: input.persistenceAllowed !== true && input.writeAccessAllowed !== true,
  });
}

export function createSimulationSandboxContext(input: SimulationSandboxRequest): Readonly<SimulationSandboxContext> {
  const validation = validateSimulationSandbox(input);
  const contextCore = sandboxContextHashInput(input, validation.sandboxStatus);

  return Object.freeze({
    ...contextCore,
    immutableHash: hashConfidenceValue("simulation-sandbox-context", canonicalizeConfidenceToString(contextCore)),
  });
}

export function buildSandboxResult(input: {
  context: SimulationSandboxContext;
  validation: SimulationSandboxValidation;
}): Readonly<SandboxResult> {
  const resultCore = Object.freeze({
    sandboxId: input.context.sandboxId,
    simulationId: input.context.simulationId,
    sandboxStatus: input.validation.sandboxStatus,
    replayIntegrity: input.validation.replayIntegrity,
    containmentState: input.validation.containmentState,
    resourceUsageSummary: input.validation.resourceUsageSummary,
    contextHash: input.context.immutableHash,
  });

  return Object.freeze({
    sandboxId: resultCore.sandboxId,
    simulationId: resultCore.simulationId,
    sandboxStatus: resultCore.sandboxStatus,
    isolationHash: hashConfidenceValue("simulation-sandbox-result", canonicalizeConfidenceToString(resultCore)),
    replayIntegrity: resultCore.replayIntegrity,
    containmentState: resultCore.containmentState,
    resourceUsageSummary: resultCore.resourceUsageSummary,
  });
}

export function buildSimulationSandboxObservability(input: {
  context: SimulationSandboxContext;
  result: SandboxResult;
}): SimulationSandboxObservability {
  return Object.freeze({
    sandboxId: input.context.sandboxId,
    sandboxStatus: input.result.sandboxStatus,
    isolationLevel: input.context.isolationLevel,
    replayIntegrity: input.result.replayIntegrity,
    containmentState: input.result.containmentState,
    isolationHash: input.result.isolationHash,
  });
}

export function sealSimulationSandbox(input: SimulationSandboxRequest): SealedSimulationSandboxRecord {
  const validation = validateSimulationSandbox(input);
  const context = createSimulationSandboxContext(input);
  const result = buildSandboxResult({ context, validation });
  const observability = buildSimulationSandboxObservability({ context, result });

  return Object.freeze({
    context,
    validation,
    result,
    observability,
    sealed: true as const,
    readOnly: true as const,
    advisoryOnly: true as const,
    runtimeAccessAllowed: false as const,
    persistenceAllowed: false as const,
    networkAccessAllowed: false as const,
    authorityMutationAllowed: false as const,
    schedulerAccessAllowed: false as const,
    workerAccessAllowed: false as const,
    writeAccessAllowed: false as const,
  });
}

export const SimulationSandboxValidator = Object.freeze({
  validate: validateSimulationSandbox,
});

export const SimulationSandboxFactory = Object.freeze({
  create: createSimulationSandboxContext,
  seal: sealSimulationSandbox,
});

export const SimulationSandboxObservabilityService = Object.freeze({
  build: buildSimulationSandboxObservability,
});
