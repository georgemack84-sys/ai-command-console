export function aggregateRecoveryDivergence({
  replayDisputes = [],
  simulationDisputes = [],
  continuityDisputes = [],
  governanceDisputes = [],
}: {
  replayDisputes?: string[];
  simulationDisputes?: string[];
  continuityDisputes?: string[];
  governanceDisputes?: string[];
}) {
  const disputes = Array.from(
    new Set([
      ...replayDisputes,
      ...simulationDisputes,
      ...continuityDisputes,
      ...governanceDisputes,
    ]),
  ).sort((left, right) => left.localeCompare(right));

  return {
    divergenceDetected: replayDisputes.length > 0 || simulationDisputes.length > 0,
    replayDivergenceCount: replayDisputes.length,
    disputes,
    governanceDisputes: Array.from(new Set(governanceDisputes)).sort((left, right) => left.localeCompare(right)),
  };
}
