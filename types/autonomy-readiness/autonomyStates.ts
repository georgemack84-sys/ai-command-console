export type AutonomyLevel = "A0" | "A1" | "A2" | "A3" | "A4" | "A5" | "A6";

export type AutonomyState =
  | "observe_only"
  | "recommendation_only"
  | "planning_only"
  | "simulation_only"
  | "restricted"
  | "paused"
  | "revoked"
  | "disputed"
  | "forbidden";
