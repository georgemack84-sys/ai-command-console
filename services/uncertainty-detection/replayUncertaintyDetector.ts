import type { CoordinationReplayResult } from "@/types/coordination-replay";

export function detectReplayUncertainty(input: {
  coordinationReplay: CoordinationReplayResult;
  metadata?: Readonly<Record<string, unknown>>;
}): number {
  let score = 0;
  if (input.coordinationReplay.state === "fail_closed") {
    score += 1;
  } else if (input.coordinationReplay.state === "invalid") {
    score += 0.7;
  } else if (input.coordinationReplay.state === "restricted") {
    score += 0.4;
  }
  if (input.coordinationReplay.errors.some((error) => error.code.includes("AMBIGUITY"))) {
    score += 0.4;
  }
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  if (serialized.includes("replayuncertainty") || serialized.includes("replaybreak")) {
    score += 0.4;
  }
  return Math.min(score, 1);
}
