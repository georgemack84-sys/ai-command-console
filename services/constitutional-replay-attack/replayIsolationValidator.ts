import type {
  ConstitutionalReplayAttackInput,
  ConstitutionalReplayError,
} from "@/types/constitutional-replay";

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

export function validateReplayIsolation(
  input: ConstitutionalReplayAttackInput,
): readonly ConstitutionalReplayError[] {
  const markers: string[] = [];
  normalizeMarkers(input.metadata, markers);
  const errors: ConstitutionalReplayError[] = [];
  if (markers.some((item) => item.includes("executionimport") || item.includes("schedulerimport"))) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_ISOLATION_VIOLATION",
      message: "Execution or scheduler imports violate constitutional replay isolation.",
      path: "metadata",
    }));
  }
  if (markers.some((item) => item.includes("runtimemutation") || item.includes("runtimecontamination"))) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_RUNTIME_CONTAMINATION",
      message: "Runtime contamination or mutation markers are forbidden in replay attack simulation.",
      path: "metadata",
    }));
  }
  if (markers.some((item) =>
    item.includes("hiddenorchestration")
    || item.includes("continueworkflow")
    || item.includes("hiddendispatch")
    || item.includes("topologysynthesis")
  )) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_HIDDEN_ORCHESTRATION",
      message: "Hidden orchestration or topology synthesis markers violate replay isolation.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
