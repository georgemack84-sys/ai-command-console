import type { ApprovalAwareRoutingResult } from "@/types/approval-aware-coordination-router";

const FORBIDDEN_TRANSITION_MARKERS = [
  "execute",
  "dispatch",
  "schedule",
  "retry",
  "workflow",
  "generated_workflow",
  "continue",
];

export function guardBoundedOrchestrationTransition(input: {
  routingResult: ApprovalAwareRoutingResult;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly string[] {
  const errors: string[] = [];
  const routePath = [
    ...input.routingResult.lineage.entries.map((entry) => entry.target),
    input.routingResult.target,
  ].join("->").toLowerCase();
  for (const marker of FORBIDDEN_TRANSITION_MARKERS) {
    if (routePath.includes(marker)) {
      errors.push(`routePath:${marker}`);
    }
  }
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  for (const marker of FORBIDDEN_TRANSITION_MARKERS) {
    if (serialized.includes(marker)) {
      errors.push(`metadata:${marker}`);
    }
  }
  return Object.freeze(errors.sort());
}
