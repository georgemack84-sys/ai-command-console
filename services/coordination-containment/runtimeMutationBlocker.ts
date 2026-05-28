const RUNTIME_MUTATION_MARKERS = [
  "runtimemutation",
  "rewriteworkflow",
  "repairreplay",
  "mutateruntime",
  "workflowrewrite",
  "schedulerule",
  "retryloop",
];

export function blockRuntimeMutation(metadata?: Readonly<Record<string, unknown>>): readonly string[] {
  const serialized = JSON.stringify(metadata ?? {}).toLowerCase();
  return Object.freeze(RUNTIME_MUTATION_MARKERS
    .filter((marker) => serialized.includes(marker))
    .map((marker) => `metadata:${marker}`));
}
