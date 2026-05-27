import type { ConstitutionalCoordinationError } from "@/types/constitutional-coordination";
import { createConstitutionalCoordinationError } from "@/services/constitutional-coordination/coordinationBoundaryEnforcer";

const MUTATION_MARKERS = [
  "mutateruntime",
  "repairreplay",
  "workflowsynthesis",
  "schedule",
  "dispatch",
  "retry",
];

export function detectCoordinationMutation(metadata?: Readonly<Record<string, unknown>>): readonly ConstitutionalCoordinationError[] {
  const serialized = JSON.stringify(metadata ?? {}).toLowerCase();
  const errors = MUTATION_MARKERS
    .filter((marker) => serialized.includes(marker))
    .map((marker) => createConstitutionalCoordinationError(
      marker === "mutateruntime"
        ? "CONSTITUTIONAL_COORDINATION_RUNTIME_MUTATION"
        : "CONSTITUTIONAL_COORDINATION_HIDDEN_ORCHESTRATION",
      "Coordination mutation or hidden orchestration marker detected.",
      `metadata.${marker}`,
    ));
  return Object.freeze(errors);
}
