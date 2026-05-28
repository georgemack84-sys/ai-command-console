export function buildSurvivabilityDependencyGraph() {
  const nodes = ["Governance", "Containment", "Continuity", "Recovery", "Readiness"] as const;

  return {
    nodes: [...nodes],
    edges: [
      ["Governance", "Containment"],
      ["Containment", "Continuity"],
      ["Continuity", "Recovery"],
      ["Recovery", "Readiness"],
    ] as Array<[string, string]>,
    trace(from: string, to: string) {
      const start = nodes.indexOf(from as (typeof nodes)[number]);
      const end = nodes.indexOf(to as (typeof nodes)[number]);
      if (start === -1 || end === -1 || start > end) {
        return [] as string[];
      }
      return [...nodes.slice(start, end + 1)];
    },
  };
}
