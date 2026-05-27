const HIDDEN_ORCHESTRATION_MARKERS = [
  "schedule",
  "scheduler",
  "dispatch",
  "workflow",
  "orchestrat",
  "retry",
  "resume",
  "execute",
  "runtimeplan",
  "hiddenstep",
];

function flattenMetadata(value: unknown, path = "metadata"): readonly string[] {
  if (typeof value === "string") {
    return [`${path}:${value}`];
  }
  if (typeof value === "boolean" || typeof value === "number") {
    return [`${path}:${String(value)}`];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => flattenMetadata(entry, `${path}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) =>
      flattenMetadata(entry, `${path}.${key}`));
  }
  return [];
}

export function detectHiddenOrchestration(metadata?: Readonly<Record<string, unknown>>): readonly string[] {
  const flattened = flattenMetadata(metadata ?? {});
  return Object.freeze(flattened.filter((entry) =>
    HIDDEN_ORCHESTRATION_MARKERS.some((marker) => entry.toLowerCase().includes(marker))));
}
