import type { EvidenceChain } from "./signalTypes";

export function scoreConfidence(evidenceChain: EvidenceChain): number {
  const movementStrength = evidenceChain.events.reduce((total, event) => total + event.change_percentage, 0);
  const sourceStrength = Math.min(0.2, evidenceChain.source_ids.length * 0.05);
  const score = 0.45 + Math.min(0.3, movementStrength) + sourceStrength;

  return Math.min(0.95, Number(score.toFixed(2)));
}
