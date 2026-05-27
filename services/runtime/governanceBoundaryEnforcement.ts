export function enforceGovernanceBoundary(input: {
  constitutionalSafe: boolean;
  validationSafe: boolean;
  containmentRequired: boolean;
  blockedReasons: string[];
}) {
  return {
    boundarySafe: input.constitutionalSafe && input.validationSafe && !input.containmentRequired && input.blockedReasons.length === 0,
    blockedReasons: Array.from(new Set([
      ...(input.constitutionalSafe ? [] : ["constitutional_safety_failed"]),
      ...(input.validationSafe ? [] : ["validation_safety_failed"]),
      ...(input.containmentRequired ? ["containment_required"] : []),
      ...input.blockedReasons,
    ])).sort(),
  };
}
