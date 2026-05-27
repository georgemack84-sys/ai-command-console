export type IsolationCoverageState =
  | "boundary_enforced"
  | "persistence_enforced"
  | "fully_verified"
  | "legacy_unscoped"
  | "degraded";

const SCORE: Record<IsolationCoverageState, number> = {
  legacy_unscoped: 0,
  degraded: 1,
  boundary_enforced: 2,
  persistence_enforced: 3,
  fully_verified: 4,
};

export function buildIsolationCoverageSnapshot(components: Record<string, IsolationCoverageState>) {
  const states = Object.values(components);
  const overall = states.length === 0
    ? "degraded"
    : states.some((state) => state === "legacy_unscoped" || state === "degraded")
      ? "degraded"
      : states.some((state) => state === "fully_verified")
        ? "fully_verified"
        : states.some((state) => state === "persistence_enforced")
          ? "persistence_enforced"
          : "boundary_enforced";

  return {
    overall: overall as IsolationCoverageState,
    components,
    score: Math.min(...states.map((state) => SCORE[state])),
  };
}
