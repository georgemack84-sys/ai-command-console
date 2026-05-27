import { createNormalizationError } from "./normalization-errors";
import type {
  ApprovalMode,
  AutonomyLevel,
  ContainmentLevel,
  ExecutionMode,
  NormalizationEvent,
  PlanNormalizationError,
  RetryMode,
} from "./normalization-types";

type EnumNormalization = {
  executionMode: ExecutionMode;
  retryMode: RetryMode;
  approvalMode: ApprovalMode;
  autonomyLevel: AutonomyLevel;
  containmentLevel: ContainmentLevel;
  events: NormalizationEvent[];
  error?: PlanNormalizationError;
};

export function normalizeStepEnums(input: {
  stepIndex: number;
  sourceId: string;
  retryable: boolean;
  approvalRequired: boolean;
  executionMode?: unknown;
  retryMode?: unknown;
  approvalMode?: unknown;
  autonomyLevel?: unknown;
  containmentLevel?: unknown;
}): EnumNormalization {
  const executionModeRaw = input.executionMode ?? "SERIAL";
  const retryModeRaw = input.retryMode ?? (input.retryable ? "SAFE_ONLY" : "NEVER");
  const approvalModeRaw = input.approvalMode ?? (input.approvalRequired ? "REQUIRED" : "OPTIONAL");
  const autonomyLevelRaw = input.autonomyLevel ?? "NONE";
  const containmentLevelRaw = input.containmentLevel ?? "STRICT";

  const canonicalExecutionMode = executionModeRaw === "PARALLEL" ? "PARALLEL" : executionModeRaw === "SERIAL" ? "SERIAL" : null;
  const canonicalRetryMode = retryModeRaw === "NEVER" || retryModeRaw === "SAFE_ONLY" || retryModeRaw === "MANUAL_ONLY"
    ? retryModeRaw
    : null;
  const canonicalApprovalMode = approvalModeRaw === "REQUIRED" || approvalModeRaw === "OPTIONAL" || approvalModeRaw === "BLOCKED"
    ? approvalModeRaw
    : null;
  const canonicalAutonomyLevel = autonomyLevelRaw === "NONE" || autonomyLevelRaw === "ADVISORY" || autonomyLevelRaw === "SUPERVISED"
    ? autonomyLevelRaw
    : null;
  const canonicalContainmentLevel = containmentLevelRaw === "STRICT" || containmentLevelRaw === "STANDARD"
    ? containmentLevelRaw
    : null;

  if (!canonicalExecutionMode || !canonicalRetryMode || !canonicalApprovalMode || !canonicalAutonomyLevel || !canonicalContainmentLevel) {
    return {
      executionMode: "SERIAL",
      retryMode: "NEVER",
      approvalMode: "BLOCKED",
      autonomyLevel: "NONE",
      containmentLevel: "STRICT",
      events: [],
      error: createNormalizationError(
        "PLAN_NORMALIZATION_ENUM_UNKNOWN",
        `Unknown enum value encountered while normalizing step ${input.sourceId}.`,
      ),
    };
  }

  const events: NormalizationEvent[] = [
    {
      eventId: `enum:${input.sourceId}:execution`,
      path: `steps.${input.stepIndex}.executionMode`,
      action: "ENUM_CANONICALIZED",
      before: executionModeRaw,
      after: canonicalExecutionMode,
      reason: "Execution mode is canonicalized to a stable planner enum.",
    },
    {
      eventId: `enum:${input.sourceId}:retry`,
      path: `steps.${input.stepIndex}.retryMode`,
      action: "ENUM_CANONICALIZED",
      before: retryModeRaw,
      after: canonicalRetryMode,
      reason: "Retry mode is canonicalized to a stable planner enum.",
    },
    {
      eventId: `enum:${input.sourceId}:approval`,
      path: `steps.${input.stepIndex}.approvalMode`,
      action: "ENUM_CANONICALIZED",
      before: approvalModeRaw,
      after: canonicalApprovalMode,
      reason: "Approval mode is canonicalized to a stable planner enum.",
    },
  ];

  return {
    executionMode: canonicalExecutionMode,
    retryMode: canonicalRetryMode,
    approvalMode: canonicalApprovalMode,
    autonomyLevel: canonicalAutonomyLevel,
    containmentLevel: canonicalContainmentLevel,
    events,
  };
}

