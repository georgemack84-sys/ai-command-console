export function resolveClarificationRequirement(input: {
  ambiguityDetected: boolean;
  confidence: number;
  semanticConflicts: string[];
  protectedTargetDetected: boolean;
}) {
  return (
    input.ambiguityDetected
    || input.confidence < 0.7
    || input.semanticConflicts.length > 0
    || input.protectedTargetDetected
  );
}
