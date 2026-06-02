import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RiskCertificationRecord } from "@/services/confidence-engine/riskCertificationGate";
import type {
  SealedSimulationBoundaryRecord,
  SimulationBoundaryContract,
  SimulationBoundaryContractInput,
  SimulationBoundaryObservability,
  SimulationBoundaryReasonCode,
  SimulationBoundaryReplayRecord,
  SimulationBoundaryReplayStatus,
  SimulationBoundaryStatus,
  SimulationBoundaryValidationResult,
  SimulationRiskCertificationEvidence,
} from "./types";

export const MAX_BRANCH_DEPTH = 3;
export const MAX_BRANCH_COUNT = 25;

function normalizeStrings(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))].sort());
}

function addReason(reasons: SimulationBoundaryReasonCode[], reason: SimulationBoundaryReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function branchCount(input: SimulationBoundaryContractInput): number {
  return input.branches?.length ?? input.approvedScope.length;
}

function contractHashInput(input: SimulationBoundaryContractInput): Omit<SimulationBoundaryContract, "immutableHash"> {
  return Object.freeze({
    simulationId: input.simulationId,
    tenantId: input.tenantId,
    ...(input.missionId ? { missionId: input.missionId } : {}),
    simulationType: input.simulationType,
    approvedScope: [...normalizeStrings(input.approvedScope)],
    branchLimit: input.branchLimit,
    replayReferenceIds: [...normalizeStrings(input.replayReferenceIds)],
    evidenceReferences: [...normalizeStrings(input.evidenceReferences)],
    riskCertificationReference: input.riskCertificationReference,
    approvalReference: input.approvalReference,
    operatorId: input.operatorId,
    governanceVersion: input.governanceVersion,
    createdAt: input.createdAt,
    contractVersion: input.contractVersion,
    executionAuthorized: false as const,
    runtimeMutationAllowed: false as const,
    schedulingAllowed: false as const,
    authorityMutationAllowed: false as const,
    persistenceAllowed: false as const,
  });
}

export function deriveRiskCertificationEvidence(record: RiskCertificationRecord): SimulationRiskCertificationEvidence {
  return Object.freeze({
    certificationState: record.result.certification_state,
    certificationHash: record.certification_hash,
    certificationLineageHash: record.lineage.lineage_hash,
    replayValidation: record.result.replay_validation,
    containmentState: record.result.lineage_validation ? "LINEAGE_VALIDATED" : "LINEAGE_DISPUTED",
  });
}

export function generateSimulationBoundaryHash(input: SimulationBoundaryContractInput): string {
  return hashConfidenceValue("simulation-boundary-contract", canonicalizeConfidenceToString(contractHashInput(input)));
}

function validateSchema(input: SimulationBoundaryContractInput, reasons: SimulationBoundaryReasonCode[]): boolean {
  const valid = input.simulationId.length > 0
    && input.tenantId.length > 0
    && input.operatorId.length > 0
    && input.contractVersion.length > 0
    && input.createdAt.length > 0
    && input.approvedScope.length > 0
    && input.replayReferenceIds.length > 0
    && input.evidenceReferences.length > 0;

  addReason(reasons, valid ? "SCHEMA_VALID" : "SCHEMA_INVALID");
  return valid;
}

function validateGovernance(input: SimulationBoundaryContractInput, reasons: SimulationBoundaryReasonCode[]): boolean {
  const valid = input.governanceVersion.length > 0 && input.approvalReference.length > 0;
  if (input.approvalReference.length === 0) addReason(reasons, "APPROVAL_REFERENCE_MISSING");
  addReason(reasons, valid ? "GOVERNANCE_VALID" : "GOVERNANCE_INVALID");
  return valid;
}

function validateRiskCertification(input: SimulationBoundaryContractInput, reasons: SimulationBoundaryReasonCode[]): boolean {
  if (input.riskCertificationReference.length === 0) {
    addReason(reasons, "RISK_CERTIFICATION_MISSING");
    return false;
  }
  const evidence = input.riskCertificationEvidence;
  if (!evidence) {
    addReason(reasons, "RISK_CERTIFICATION_VALID");
    return true;
  }
  if (evidence.certificationHash !== input.riskCertificationReference) {
    addReason(reasons, "RISK_CERTIFICATION_MISMATCH");
    return false;
  }
  if (evidence.certificationState === "FAIL" || !evidence.replayValidation) {
    addReason(reasons, "RISK_CERTIFICATION_NOT_PASSING");
    return false;
  }
  addReason(reasons, "RISK_CERTIFICATION_VALID");
  return true;
}

function validateBoundary(input: SimulationBoundaryContractInput, reasons: SimulationBoundaryReasonCode[]): boolean {
  let valid = true;
  if (input.executionAuthorized === true) {
    addReason(reasons, "EXECUTION_AUTHORITY_BLOCKED");
    valid = false;
  }
  if (input.runtimeMutationAllowed === true) {
    addReason(reasons, "RUNTIME_MUTATION_BLOCKED");
    valid = false;
  }
  if (input.schedulingAllowed === true) {
    addReason(reasons, "SCHEDULING_BLOCKED");
    valid = false;
  }
  if (input.authorityMutationAllowed === true) {
    addReason(reasons, "AUTHORITY_MUTATION_BLOCKED");
    valid = false;
  }
  if (input.persistenceAllowed === true) {
    addReason(reasons, "PERSISTENCE_BLOCKED");
    valid = false;
  }
  addReason(reasons, "BOUNDARY_ENFORCED");
  addReason(reasons, "SIMULATION_IS_NOT_EXECUTION");
  return valid;
}

function validateBranches(input: SimulationBoundaryContractInput, reasons: SimulationBoundaryReasonCode[]): boolean {
  let valid = true;
  const count = branchCount(input);

  if (input.branchLimit <= 0) {
    addReason(reasons, "BRANCH_LIMIT_INVALID");
    valid = false;
  }
  if (count > MAX_BRANCH_COUNT || input.branchLimit > MAX_BRANCH_COUNT) {
    addReason(reasons, "BRANCH_COUNT_EXCEEDED");
    valid = false;
  }
  if (input.branches?.some((branch) => branch.depth > MAX_BRANCH_DEPTH)) {
    addReason(reasons, "BRANCH_DEPTH_EXCEEDED");
    valid = false;
  }
  if (input.branches?.some((branch) => branch.nestedSimulation)) {
    addReason(reasons, "NESTED_SIMULATION_BLOCKED");
    valid = false;
  }
  if (input.branches?.some((branch) => branch.parentBranchId === branch.branchId)) {
    addReason(reasons, "RECURSIVE_SIMULATION_BLOCKED");
    valid = false;
  }
  if (input.branches?.some((branch) => branch.generatedBySimulation)) {
    addReason(reasons, "SELF_GENERATED_BRANCH_BLOCKED");
    valid = false;
  }

  return valid;
}

function resolveStatus(input: {
  schemaValid: boolean;
  governanceValid: boolean;
  riskCertificationValid: boolean;
  boundaryValid: boolean;
  branchValid: boolean;
  riskCertificationMissing: boolean;
}): SimulationBoundaryStatus {
  if (input.riskCertificationMissing && input.schemaValid && input.governanceValid && input.boundaryValid && input.branchValid) {
    return "ESCALATE";
  }
  if (!input.schemaValid || !input.governanceValid || !input.boundaryValid || !input.branchValid || !input.riskCertificationValid) {
    return "FREEZE";
  }
  return "SEALED";
}

function replayStatusFor(status: SimulationBoundaryStatus): SimulationBoundaryReplayStatus {
  switch (status) {
    case "SEALED":
      return "REPLAYABLE";
    case "ESCALATE":
      return "ESCALATE_REPLAY";
    case "FREEZE":
      return "FREEZE_REPLAY";
  }
}

export function validateSimulationBoundaryContract(input: SimulationBoundaryContractInput): SimulationBoundaryValidationResult {
  const reasons: SimulationBoundaryReasonCode[] = [];
  const schemaValid = validateSchema(input, reasons);
  const governanceValid = validateGovernance(input, reasons);
  const riskCertificationValid = validateRiskCertification(input, reasons);
  const boundaryValid = validateBoundary(input, reasons);
  const branchValid = validateBranches(input, reasons);
  const immutableHash = generateSimulationBoundaryHash(input);
  const riskCertificationMissing = input.riskCertificationReference.length === 0;
  const status = resolveStatus({
    schemaValid,
    governanceValid,
    riskCertificationValid,
    boundaryValid,
    branchValid,
    riskCertificationMissing,
  });
  addReason(reasons, "IMMUTABLE_HASH_GENERATED");

  return Object.freeze({
    status,
    reasonCodes: normalizeStrings(reasons) as readonly SimulationBoundaryReasonCode[],
    immutableHash,
    replayStatus: replayStatusFor(status),
    escalationState: status === "ESCALATE" ? "ESCALATE" : status === "FREEZE" ? "FREEZE" : "NONE",
    branchCount: branchCount(input),
    deterministic: true as const,
    readOnly: true as const,
    authorityBounded: boundaryValid,
    executionImpossible: boundaryValid,
  });
}

export function createSimulationBoundaryContract(input: SimulationBoundaryContractInput): Readonly<SimulationBoundaryContract> {
  const hashInput = contractHashInput(input);
  return Object.freeze({
    ...hashInput,
    immutableHash: generateSimulationBoundaryHash(input),
  });
}

export function replaySimulationBoundaryContract(
  contract: SimulationBoundaryContract,
  validation: SimulationBoundaryValidationResult,
): SimulationBoundaryReplayRecord {
  const replayCore = Object.freeze({
    simulationId: contract.simulationId,
    tenantId: contract.tenantId,
    contractHash: contract.immutableHash,
    replayStatus: validation.replayStatus,
    replayReferenceIds: normalizeStrings(contract.replayReferenceIds),
    riskCertificationReference: contract.riskCertificationReference,
    governanceVersion: contract.governanceVersion,
    branchCount: validation.branchCount,
  });

  return Object.freeze({
    ...replayCore,
    replayHash: hashConfidenceValue("simulation-boundary-replay", canonicalizeConfidenceToString(replayCore)),
    replayMode: "READ_ONLY" as const,
    executionAuthorized: false as const,
    runtimeMutationAllowed: false as const,
  });
}

export function buildSimulationBoundaryObservability(
  contract: SimulationBoundaryContract,
  validation: SimulationBoundaryValidationResult,
): SimulationBoundaryObservability {
  return Object.freeze({
    simulationId: contract.simulationId,
    simulationType: contract.simulationType,
    contractVersion: contract.contractVersion,
    branchCount: validation.branchCount,
    governanceVersion: contract.governanceVersion,
    immutableHash: contract.immutableHash,
    replayStatus: validation.replayStatus,
    escalationState: validation.escalationState,
  });
}

export function sealSimulationBoundaryContract(input: SimulationBoundaryContractInput): SealedSimulationBoundaryRecord {
  const validation = validateSimulationBoundaryContract(input);
  const contract = createSimulationBoundaryContract(input);
  const replay = replaySimulationBoundaryContract(contract, validation);
  const observability = buildSimulationBoundaryObservability(contract, validation);

  return Object.freeze({
    contract,
    validation,
    replay,
    observability,
    sealed: true as const,
    readOnly: true as const,
    advisoryOnly: true as const,
    executionAuthorized: false as const,
    runtimeMutationAllowed: false as const,
    schedulingAllowed: false as const,
    authorityMutationAllowed: false as const,
    persistenceAllowed: false as const,
  });
}

export const SimulationBoundaryValidator = Object.freeze({
  validate: validateSimulationBoundaryContract,
});

export const SimulationBoundaryContractFactory = Object.freeze({
  create: createSimulationBoundaryContract,
  seal: sealSimulationBoundaryContract,
});

export const SimulationBoundaryReplayService = Object.freeze({
  replay: replaySimulationBoundaryContract,
});

export const SimulationBoundaryObservabilityService = Object.freeze({
  build: buildSimulationBoundaryObservability,
});
