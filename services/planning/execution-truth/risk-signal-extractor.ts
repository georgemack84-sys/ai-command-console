import type { NormalizedPlan } from "../normalization";
import { createExecutionTruthError } from "./execution-truth-errors";
import type { ExecutionRiskSignals } from "./execution-truth-types";

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function readEnvironment(value: unknown): ExecutionRiskSignals["targetEnvironment"] {
  return value === "local" || value === "staging" || value === "production" ? value : "unknown";
}

function readRollbackCapability(value: unknown): ExecutionRiskSignals["rollbackCapability"] {
  return value === "full" || value === "partial" || value === "none" ? value : "unknown";
}

function readAutonomySensitivity(value: unknown): ExecutionRiskSignals["autonomySensitivity"] {
  return value === "safe" || value === "restricted" || value === "critical" ? value : "unknown";
}

export function extractRiskSignals(normalizedPlan: NormalizedPlan):
  | { ok: true; stepSignals: ExecutionRiskSignals[] }
  | { ok: false; error: ReturnType<typeof createExecutionTruthError> } {
  try {
    const stepSignals = normalizedPlan.steps.map((step) => {
      const action = readRecord(step.action);
      const inputs = step.inputs ?? {};
      const operation = typeof action.operation === "string" ? action.operation : "";
      const branchType = inputs.branchType;
      return {
        stepId: step.id,
        destructive: inputs.isDestructive === true,
        externalSideEffect: inputs.hasExternalSideEffect === true,
        idempotent: Boolean(inputs.idempotencyKey) || operation === "approval_gate" || operation === "preflight_check",
        targetEnvironment: readEnvironment(inputs.targetEnvironment),
        rollbackCapability: readRollbackCapability(inputs.rollbackCapability),
        autonomySensitivity: readAutonomySensitivity(inputs.autonomySensitivity),
        terminalBranch: branchType === "terminal",
        failureBranch: branchType === "failure",
        rollbackBranch: branchType === "rollback",
        source: "normalized_step_inputs" as const,
      };
    });

    return { ok: true, stepSignals };
  } catch (error) {
    return {
      ok: false,
      error: createExecutionTruthError(
        "PHASE_4_2E_RISK_SIGNAL_EXTRACTION_FAILED",
        "Failed to extract deterministic risk signals from normalized steps.",
        { error: error instanceof Error ? error.message : String(error) },
      ),
    };
  }
}
