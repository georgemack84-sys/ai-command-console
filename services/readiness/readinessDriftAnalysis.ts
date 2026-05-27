export type ReadinessDrift = {
  domain: string;
  previousScore: number;
  currentScore: number;
  degradationVelocity: number;
  constitutionalRisk: number;
};

export function analyzeReadinessDrift(input: {
  previous: Record<string, number>;
  current: Record<string, number>;
}) : ReadinessDrift[] {
  return Object.keys(input.current)
    .filter((key) => typeof input.previous[key] === "number")
    .map((key) => {
      const previousScore = input.previous[key] ?? 0;
      const currentScore = input.current[key] ?? 0;
      return {
        domain: key,
        previousScore,
        currentScore,
        degradationVelocity: Number(Math.max(previousScore - currentScore, 0).toFixed(4)),
        constitutionalRisk: Number(Math.max(1 - currentScore, 0).toFixed(4)),
      };
    })
    .filter((drift) => drift.degradationVelocity > 0)
    .sort((a, b) => b.degradationVelocity - a.degradationVelocity);
}
