import type { RecoveryPrioritizationAssessment, RecoveryPrioritizationInput } from "./prioritizationTypes";

export function evaluatePrioritizationGovernance({
  assessments,
  input,
}: {
  assessments: RecoveryPrioritizationAssessment[];
  input: RecoveryPrioritizationInput;
}) {
  const disputed = assessments.some((assessment) => assessment.state === "DISPUTED" || assessment.state === "FROZEN");
  const governanceReviewRequired = Boolean(
    input.overrideRequested
      || input.operatorDirective === "PRIORITIZE"
      || assessments.some((assessment) => assessment.governanceReviewRequired),
  );

  return {
    governanceReviewRequired,
    freezePrioritization: disputed || Boolean(input.convergence?.state === "DISPUTED"),
    warnings: [
      ...(input.overrideRequested ? ["priority_override_requested"] : []),
      ...(governanceReviewRequired ? ["governance_review_required"] : []),
      ...(disputed ? ["constitutional_dispute_present"] : []),
    ],
  };
}
