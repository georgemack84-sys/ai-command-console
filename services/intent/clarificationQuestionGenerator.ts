export function generateClarificationQuestions(input: {
  missingContext: string[];
  conflictingContext: string[];
  unsafeAssumptions: string[];
  protectedTargetDetected: boolean;
}) {
  const questions = [
    ...(input.missingContext.includes("environment") ? ["Which environment should be targeted?"] : []),
    ...(input.missingContext.includes("deploymentTarget") ? ["Which deployment target should be used?"] : []),
    ...(input.missingContext.includes("scope") ? ["What exact operational scope is intended?"] : []),
    ...(input.missingContext.includes("rollbackPolicy") ? ["Should rollback capability be enabled?"] : []),
    ...(input.missingContext.includes("service") ? ["Which service should be targeted?"] : []),
    ...(input.missingContext.includes("mode") ? ["Should this be graceful or forced?"] : []),
    ...(input.conflictingContext.includes("SEMANTIC_SCOPE_CONFLICT") ? ["Should this apply to localhost only or external systems as well?"] : []),
    ...(input.unsafeAssumptions.some((reason) => reason === "UNSAFE_PRODUCTION_INFERENCE") ? ["Is this intended for production?"] : []),
    ...(input.protectedTargetDetected ? ["Which protected target is explicitly authorized for access?"] : []),
  ];

  return Array.from(new Set(questions));
}
