import { hashContainmentValue } from "@/services/coordination-containment/containmentHasher";

export function hashOrchestrationValue(label: string, value: unknown): string {
  return hashContainmentValue(`bounded-orchestration:${label}`, value);
}
