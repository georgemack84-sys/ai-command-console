export type OperatorIntervention = Readonly<{
  interventionId: string;
  interventionType: "override-visible" | "freeze-visible" | "review-required";
  deterministicHash: string;
}>;

export type OutcomeRecord = Readonly<{
  outcomeId: string;
  outcomeState: "verified" | "frozen" | "blocked" | "disputed";
  deterministicHash: string;
}>;
