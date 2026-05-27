export type SafeActionRiskClass =
  | "read_only"
  | "advisory"
  | "simulation_only"
  | "operator_escalation"
  | "handoff_preparation"
  | "forbidden";
