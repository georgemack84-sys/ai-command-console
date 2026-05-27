import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";

export const REPLAY_ENGINE_VERSION = "4.4E";

function stripUndefined(value: unknown): unknown {
  if (value === undefined) {
    return "__undefined__";
  }
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, stripUndefined((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

export function hashReplayValue(label: string, value: unknown): string {
  return hashStableContent("EVIDENCE_BUNDLE", {
    label,
    engineVersion: REPLAY_ENGINE_VERSION,
    value: stripUndefined(value),
  });
}
