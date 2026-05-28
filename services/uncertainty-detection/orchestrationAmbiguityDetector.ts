import type { BoundedOrchestrationRecord } from "@/types/bounded-orchestration-framework";

export function detectOrchestrationAmbiguity(input: {
  orchestrationRecord: BoundedOrchestrationRecord;
  metadata?: Readonly<Record<string, unknown>>;
}): number {
  let score = 0;
  if (input.orchestrationRecord.state === "invalid") {
    score += 0.7;
  }
  if (input.orchestrationRecord.state === "frozen") {
    score += 0.5;
  }
  if (input.orchestrationRecord.isolation.leakage.length > 0) {
    score += 0.3;
  }
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  if (serialized.includes("orchestrationambiguity") || serialized.includes("unknown_topology")) {
    score += 0.4;
  }
  return Math.min(score, 1);
}
