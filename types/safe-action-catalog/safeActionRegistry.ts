import type { AutonomyLevel } from "@/types/autonomy-readiness";

export type SafeActionCategory =
  | "observe"
  | "recommend"
  | "simulate"
  | "escalate"
  | "pause_request"
  | "prepare_handoff";

export type SafeActionDefinition = Readonly<{
  id: string;
  version: string;
  category: SafeActionCategory;
  allowedAutonomyLevels: readonly Extract<AutonomyLevel, "A0" | "A1" | "A2">[];
  futureBoundLevels: readonly Extract<AutonomyLevel, "A3" | "A4" | "A5">[];
  forbiddenLevels: readonly Extract<AutonomyLevel, "A6">[];
  mutating: false;
  executionAllowed: false;
  selfApprovalAllowed: false;
  policyMutationAllowed: false;
  requiresGovernanceBinding: true;
  requiresReplayBinding: true;
  requiresAudit: true;
}>;
