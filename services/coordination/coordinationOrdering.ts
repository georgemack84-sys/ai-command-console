const PRIORITY: Record<string, number> = {
  CONTAINMENT: 0,
  ENFORCEMENT: 1,
  ESCALATION: 2,
  STABILIZATION: 3,
  SUPERVISION: 4,
  CONTINUITY: 5,
  GOVERNANCE: 6,
  REPLAY: 7,
  SIMULATION: 8,
  RECOVERY: 9,
};

export function orderCoordinationSystems(systems: string[]) {
  return [...systems].sort((left, right) => {
    const leftPriority = PRIORITY[left] ?? 99;
    const rightPriority = PRIORITY[right] ?? 99;
    if (leftPriority !== rightPriority) return leftPriority - rightPriority;
    return left.localeCompare(right);
  });
}
