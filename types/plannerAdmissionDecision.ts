export type PlannerAdmissionDecision = {
  admissible: boolean;
  denied: boolean;
  reasons: string[];
  escalationRequired: boolean;
  governanceState: string;
};
