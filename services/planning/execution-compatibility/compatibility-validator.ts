import { validateSequentialDependencies } from "../dependencies";
import type { DependencyGraph, SequentialDependencyValidationResult } from "../dependencies";
import type { ExecutionTruthPackage } from "../execution-truth";
import type { NormalizedPlan } from "../normalization";
import { normalizeApprovalContract } from "./approval-contract-normalizer";
import { buildAuthorityGraph, validateAuthorityGraph } from "./authority-graph-validator";
import { buildCompensationContracts, validateCompensationContracts } from "./compensation-validator";
import { createCompatibilityViolation } from "./execution-compatibility-errors";
import { hashExecutionCompatibilityContract } from "./execution-compatibility-hasher";
import { buildEscalationGraph, validateEscalationGraph } from "./escalation-graph-validator";
import { normalizeRollbackContract } from "./rollback-contract-normalizer";
import { validateRollbackDependencyCompatibility } from "./dependency-compatibility-validator";
import { buildCompatibilitySnapshot } from "./compatibility-snapshot-builder";
import { validateScopeBoundaries } from "./scope-boundary-validator";
import type {
  ApprovalContract,
  CompatibilityViolation,
  ExecutionCompatibilityContract,
  ExecutionCompatibilityInput,
  ExecutionCompatibilityValidationResult,
  RollbackContract,
} from "./execution-compatibility-types";

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        deepFreeze(item);
      }
    } else {
      for (const nested of Object.values(value)) {
        deepFreeze(nested);
      }
    }
  }
  return value as Readonly<T>;
}

function needsRollback(step: NormalizedPlan["steps"][number]) {
  return step.inputs.isDestructive === true || step.inputs.hasExternalSideEffect === true;
}

function isExecutableStep(step: NormalizedPlan["steps"][number]) {
  const action = readRecord(step.action);
  const operation = typeof action.operation === "string" ? action.operation : "";
  return operation !== "approval_gate";
}

function validateApprovalContracts(steps: NormalizedPlan["steps"], approvalContracts: ApprovalContract[]): CompatibilityViolation[] {
  const map = new Map(approvalContracts.map((contract) => [contract.stepId, contract]));
  const violations: CompatibilityViolation[] = [];
  for (const step of steps) {
    if (!isExecutableStep(step)) {
      continue;
    }
    if (!map.has(step.id)) {
      violations.push(createCompatibilityViolation(
        "PLAN_APPROVAL_CONTRACT_MISSING",
        `Executable step ${step.id} is missing approval compatibility metadata.`,
        `steps.${step.id}.inputs.compatibility.approval`,
      ));
    }
  }
  return violations;
}

function validateRollbackContracts(steps: NormalizedPlan["steps"], rollbackContracts: RollbackContract[]): CompatibilityViolation[] {
  const map = new Map(rollbackContracts.map((contract) => [contract.stepId, contract]));
  const violations: CompatibilityViolation[] = [];

  for (const step of steps) {
    if (!needsRollback(step)) {
      continue;
    }
    const contract = map.get(step.id);
    if (!contract) {
      violations.push(createCompatibilityViolation(
        "PLAN_ROLLBACK_CONTRACT_MISSING",
        `Mutating step ${step.id} is missing rollback compatibility metadata.`,
        `steps.${step.id}.inputs.compatibility.rollback`,
      ));
    }
  }

  return violations;
}

function validateRollbackGovernance(steps: NormalizedPlan["steps"], rollbackContracts: RollbackContract[], approvalContracts: ApprovalContract[]): CompatibilityViolation[] {
  const rollbackMap = new Map(rollbackContracts.map((contract) => [contract.stepId, contract]));
  const approvalMap = new Map(approvalContracts.map((contract) => [contract.stepId, contract]));
  const violations: CompatibilityViolation[] = [];

  for (const step of steps) {
    const rollback = rollbackMap.get(step.id);
    const approval = approvalMap.get(step.id);
    if (!rollback?.required) {
      continue;
    }
    if (rollback.compensationRequired && !approval?.required) {
      violations.push(createCompatibilityViolation(
        "PLAN_ROLLBACK_GOVERNANCE_WEAKER_THAN_FORWARD",
        `Rollback governance for ${step.id} cannot be weaker than forward approval requirements.`,
        `rollbackContracts.${step.id}`,
      ));
    }
  }

  return violations;
}

function resolveDependencyValidation(input: ExecutionCompatibilityInput): SequentialDependencyValidationResult | undefined {
  if (input.dependencyValidation) {
    return input.dependencyValidation;
  }
  return validateSequentialDependencies(input.normalizedPlan);
}

function resolveDependencyGraph(input: ExecutionCompatibilityInput, dependencyValidation?: SequentialDependencyValidationResult): DependencyGraph | undefined {
  return input.dependencyGraph ?? dependencyValidation?.graph;
}

export function validateExecutionCompatibility(input: ExecutionCompatibilityInput): ExecutionCompatibilityValidationResult {
  if (!input.normalizedPlan || !input.executionTruth || !input.executionTruthHash) {
    return {
      ok: false,
      violations: [createCompatibilityViolation("PLAN_COMPATIBILITY_INPUT_MISSING", "Execution compatibility requires normalized plan, execution truth, and execution truth hash.")],
    };
  }

  const dependencyValidation = resolveDependencyValidation(input);
  if (!dependencyValidation?.ok || !dependencyValidation.dependencyGraphFingerprint) {
    return {
      ok: false,
      violations: [createCompatibilityViolation("PLAN_COMPATIBILITY_VALIDATION_FAILED", "Execution compatibility requires a valid dependency validation artifact.")],
    };
  }

  const dependencyGraph = resolveDependencyGraph(input, dependencyValidation);
  if (!dependencyGraph) {
    return {
      ok: false,
      violations: [createCompatibilityViolation("PLAN_COMPATIBILITY_VALIDATION_FAILED", "Execution compatibility requires a dependency graph.")],
    };
  }

  const approvalContracts = input.normalizedPlan.steps
    .map((step) => normalizeApprovalContract(step))
    .filter((contract): contract is ApprovalContract => Boolean(contract));
  const rollbackContracts = input.normalizedPlan.steps.reduce<RollbackContract[]>((contracts, step, index) => {
    const contract = normalizeRollbackContract(step);
    if (!contract) {
      return contracts;
    }
    contracts.push({
      ...contract,
      rollbackOrder: contract.rollbackOrder ?? ((input.normalizedPlan.steps.length - 1) - index),
    });
    return contracts;
  }, []);
  const compensationContracts = buildCompensationContracts(input.normalizedPlan.steps);
  const authorityGraph = buildAuthorityGraph(approvalContracts, input.normalizedPlan.steps);
  const escalationGraph = buildEscalationGraph(input.normalizedPlan.steps);

  const violations = [
    ...validateApprovalContracts(input.normalizedPlan.steps, approvalContracts),
    ...validateRollbackContracts(input.normalizedPlan.steps, rollbackContracts),
    ...validateCompensationContracts(compensationContracts),
    ...validateScopeBoundaries(approvalContracts),
    ...validateAuthorityGraph(authorityGraph),
    ...validateEscalationGraph(escalationGraph),
    ...validateRollbackDependencyCompatibility(dependencyGraph, rollbackContracts),
    ...validateRollbackGovernance(input.normalizedPlan.steps, rollbackContracts, approvalContracts),
  ];

  const compatibilitySnapshot = buildCompatibilitySnapshot({
    planId: input.normalizedPlan.planId,
    executionTruthHash: input.executionTruthHash,
    dependencyGraphFingerprint: dependencyValidation.dependencyGraphFingerprint,
    approvalContracts,
    rollbackContracts,
    compensationContracts,
    authorityGraph,
    escalationGraph,
  });

  const bareContract = {
    executionTruthHash: input.executionTruthHash,
    approvalContracts,
    rollbackContracts,
    compensationContracts,
    authorityGraph,
    escalationGraph,
    compatibilitySnapshot,
  };

  const executionCompatibilityHash = hashExecutionCompatibilityContract(bareContract);
  if (input.expectedCompatibilityHash && input.expectedCompatibilityHash !== executionCompatibilityHash) {
    violations.push(createCompatibilityViolation(
      "PLAN_COMPATIBILITY_HASH_MISMATCH",
      "Execution compatibility hash drift detected.",
      "executionCompatibilityHash",
    ));
  }

  const contract: ExecutionCompatibilityContract = {
    ...bareContract,
    executionCompatibilityHash,
    violations,
    compatible: violations.every((violation) => violation.severity !== "BLOCKING"),
  };

  const frozenContract = deepFreeze(contract);
  if (!frozenContract.compatible) {
    return {
      ok: false,
      contract: frozenContract,
      violations,
    };
  }

  return {
    ok: true,
    contract: frozenContract,
    violations,
  };
}
