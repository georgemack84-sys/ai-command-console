import { serializeContainmentValue } from "@/services/coordination-containment/containmentSerializer";

export function serializeOrchestrationBoundaryValue(label: string, value: unknown): string {
  return serializeContainmentValue({
    label: `bounded-orchestration:${label}`,
    value,
  });
}
