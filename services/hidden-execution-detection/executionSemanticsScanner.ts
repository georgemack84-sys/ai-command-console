import { REPLAY_FORBIDDEN_DYNAMIC_TERMS } from "@/services/deterministic-replay/constants/replayTerms";
import type { HiddenExecutionDetectionInput } from "./types/hiddenExecutionDetectionTypes";

export type ScannedString = Readonly<{
  path: string;
  value: string;
}>;

function scanValue(
  value: unknown,
  path: string,
  seen: WeakSet<object>,
  results: ScannedString[],
): void {
  if (typeof value === "string") {
    results.push(Object.freeze({ path, value }));
    return;
  }
  if (!value || typeof value !== "object") {
    return;
  }
  if (seen.has(value as object)) {
    throw new Error("HIDDEN_EXECUTION_CIRCULAR_STRUCTURE");
  }
  seen.add(value as object);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanValue(entry, `${path}[${index}]`, seen, results));
  } else {
    Object.keys(value as Record<string, unknown>)
      .sort((left, right) => left.localeCompare(right))
      .forEach((key) => scanValue((value as Record<string, unknown>)[key], `${path}.${key}`, seen, results));
  }
  seen.delete(value as object);
}

export function scanExecutionSemantics(input: HiddenExecutionDetectionInput): readonly ScannedString[] {
  const results: ScannedString[] = [];
  scanValue(input.artifact, "artifact", new WeakSet<object>(), results);
  if (input.metadata) {
    scanValue(input.metadata, "metadata", new WeakSet<object>(), results);
  }
  return Object.freeze(results.sort((left, right) =>
    left.path.localeCompare(right.path) || left.value.localeCompare(right.value)));
}

export function collectDangerousDynamicTerms(scanned: readonly ScannedString[]): readonly ScannedString[] {
  return Object.freeze(scanned.filter((entry) => {
    const lower = entry.value.toLowerCase();
    return REPLAY_FORBIDDEN_DYNAMIC_TERMS.some((term) => lower.includes(term));
  }));
}
