export function buildSystemDependencyGraph(input: {
  systems: string[];
  dependencies: Record<string, string[]>;
}) {
  return input.systems.reduce<Record<string, string[]>>((accumulator, system) => {
    accumulator[system] = Array.from(new Set(input.dependencies[system] ?? [])).sort();
    return accumulator;
  }, {});
}
