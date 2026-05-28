import type { CoordinationReplayResult } from "@/types/coordination-replay";

export function detectConfidenceDegradation(input: {
  coordinationReplay: CoordinationReplayResult;
  metadata?: Readonly<Record<string, unknown>>;
}): number {
  let score = 0;
  if (input.coordinationReplay.state === "restricted") {
    score += 0.35;
  }
  if (input.coordinationReplay.state === "invalid" || input.coordinationReplay.state === "fail_closed") {
    score += 0.6;
  }
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  if (serialized.includes("confidence") || serialized.includes("degradation")) {
    score += 0.4;
  }
  return Math.min(score, 1);
}
