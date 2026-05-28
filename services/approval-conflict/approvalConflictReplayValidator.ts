import type {
  ApprovalConflictError,
  ApprovalConflictStressInput,
} from "@/types/approval-conflict";

function normalizeMarkers(value: unknown, buffer: string[]): void {
  if (typeof value === "string") {
    buffer.push(value.toLowerCase().replace(/[^a-z0-9]+/g, ""));
    return;
  }
  if (typeof value === "boolean" || typeof value === "number") {
    buffer.push(String(value).toLowerCase());
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      normalizeMarkers(item, buffer);
    }
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      buffer.push(key.toLowerCase().replace(/[^a-z0-9]+/g, ""));
      normalizeMarkers(item, buffer);
    }
  }
}

export function validateApprovalConflictReplayIntegrity(
  input: ApprovalConflictStressInput,
): Readonly<{
  replayDeterministic: boolean;
  errors: readonly ApprovalConflictError[];
}> {
  const markers: string[] = [];
  normalizeMarkers(input.metadata, markers);
  const errors: ApprovalConflictError[] = [];
  if (markers.some((item) =>
    item.includes("replaydivergence")
    || item.includes("approvalambiguity")
    || item.includes("replayrepair")
    || item.includes("syntheticcontinuity")
  )) {
    errors.push({
      code: "APPROVAL_CONFLICT_REPLAY_INCONSISTENT",
      message: "Approval conflict replay diverged from immutable historical lineage.",
      path: "metadata",
    });
  }
  if (markers.some((item) =>
    item.includes("hiddenorchestration")
    || item.includes("continueworkflow")
    || item.includes("hiddendispatch")
    || item.includes("orchestrationimport")
  )) {
    errors.push({
      code: "APPROVAL_CONFLICT_HIDDEN_ORCHESTRATION",
      message: "Hidden orchestration markers invalidate advisory-only approval conflict simulation.",
      path: "metadata",
    });
  }
  if (markers.some((item) => item.includes("executionimport") || item.includes("schedulerimport"))) {
    errors.push({
      code: "APPROVAL_CONFLICT_ISOLATION_VIOLATION",
      message: "Execution or scheduler imports violate approval conflict isolation.",
      path: "metadata",
    });
  }
  if (markers.some((item) => item.includes("runtimemutation"))) {
    errors.push({
      code: "APPROVAL_CONFLICT_RUNTIME_MUTATION_ATTEMPT",
      message: "Runtime mutation attempts are forbidden in approval conflict simulation.",
      path: "metadata",
    });
  }
  return Object.freeze({
    replayDeterministic: errors.length === 0,
    errors: Object.freeze(errors),
  });
}

export const validateApprovalConflictReplay = validateApprovalConflictReplayIntegrity;
