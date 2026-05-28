import { hashOrchestrationValue } from "@/services/bounded-orchestration-framework";

export function hashCoordinationReplayValue(label: string, value: unknown): string {
  return hashOrchestrationValue(`coordination-replay:${label}`, value);
}
