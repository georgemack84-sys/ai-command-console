import type { RollbackContract } from "./execution-compatibility-types";

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export function normalizeRollbackContract(step: {
  id: string;
  inputs: Record<string, unknown>;
}): RollbackContract | null {
  const compatibility = readRecord(step.inputs.compatibility);
  const rollback = readRecord(compatibility.rollback);
  if (Object.keys(rollback).length === 0) {
    return null;
  }

  return {
    stepId: step.id,
    required: rollback.required === true,
    rollbackStrategy: typeof rollback.rollbackStrategy === "string" ? rollback.rollbackStrategy : undefined,
    rollbackOrder: typeof rollback.rollbackOrder === "number" ? rollback.rollbackOrder : undefined,
    checkpointRequired: rollback.checkpointRequired === true,
    compensationRequired: rollback.compensationRequired === true,
  };
}
