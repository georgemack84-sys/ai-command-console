import type { AutonomyLevel, AutonomyState } from "@/types/autonomy-readiness";

export type SafeActionScopeState = "allowed" | "future_bound" | "denied" | "disputed";

export type SafeActionScope = Readonly<{
  state: SafeActionScopeState;
  currentLevel: AutonomyLevel;
  readinessState: AutonomyState;
  allowedNow: boolean;
  futureBound: boolean;
  withinAuthorityCeiling: boolean;
  snapshotLineageHashes: readonly string[];
  reasons: readonly string[];
}>;
