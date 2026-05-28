export function buildDivergenceEvidence(category: string, replayState: string, historicalState: string) {
  return [
    `replay:${category.toLowerCase()}`,
    `replay_state:${replayState || "unknown"}`,
    `historical_state:${historicalState || "unknown"}`,
  ];
}
