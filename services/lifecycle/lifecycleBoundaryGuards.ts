import type {
  LifecycleContainmentBoundary,
  LifecycleError,
  LifecycleTransitionRecord,
  LifecycleTransitionRequest,
} from "@/types/lifecycle";

const FORBIDDEN_METADATA_KEYS = [
  "schedulerId",
  "queueId",
  "workerId",
  "runtimeHandle",
  "processId",
  "dispatchId",
  "retryLoop",
  "workflow",
  "workflowStep",
  "executionHandle",
  "autoApprove",
  "derivedApproval",
  "inheritedApproval",
  "authorityChain",
  "scheduleAt",
];

const READ_ONLY_TOKENS = [
  "dispatch(",
  "setTimeout(",
  "setInterval(",
  "queueId",
  "workerId",
  "schedulerId",
  "executionHandle",
  "processId",
  "runtimeHandle",
];

export function createLifecycleError(
  code: LifecycleError["code"],
  message: string,
  path: string,
): LifecycleError {
  return Object.freeze({ code, message, path });
}

export function guardLifecycleRequest(request: LifecycleTransitionRequest): readonly LifecycleError[] {
  const errors: LifecycleError[] = [];
  const metadataKeys = Object.keys(request.metadata ?? {});

  for (const key of metadataKeys) {
    if (FORBIDDEN_METADATA_KEYS.includes(key)) {
      errors.push(createLifecycleError(
        key === "retryLoop" ? "LIFECYCLE_HIDDEN_RETRY_REJECTED"
        : key === "schedulerId" || key === "scheduleAt" ? "LIFECYCLE_SCHEDULING_REJECTED"
        : key === "dispatchId" ? "LIFECYCLE_DISPATCH_REJECTED"
        : "LIFECYCLE_EXECUTION_LEAK_REJECTED",
        `Forbidden runtime or orchestration metadata detected: ${key}.`,
        `metadata.${key}`,
      ));
    }
  }

  return Object.freeze(errors);
}

export function validateLifecycleSourceBoundary(record: LifecycleTransitionRecord): readonly LifecycleError[] {
  const errors: LifecycleError[] = [];
  const boundary: LifecycleContainmentBoundary = record.boundary;
  const falseOnlyValues = Object.values(boundary);
  if (falseOnlyValues.some((value) => value !== false)) {
    errors.push(createLifecycleError(
      "LIFECYCLE_BOUNDARY_VIOLATION",
      "Lifecycle containment boundary must remain false-only.",
      "boundary",
    ));
  }
  if (record.handoff && record.handoff.executionAuthorized !== false) {
    errors.push(createLifecycleError(
      "LIFECYCLE_HANDOFF_AUTHORITY_REJECTED",
      "Bounded handoff must never authorize execution.",
      "handoff.executionAuthorized",
    ));
  }
  return Object.freeze(errors);
}

export function assertLifecycleSourcesAreReadOnly(source: string): readonly string[] {
  return Object.freeze(READ_ONLY_TOKENS.filter((token) => source.includes(token)).map(
    (token) => `forbidden token detected: ${token}`,
  ));
}
