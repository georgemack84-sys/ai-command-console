import type { CanonicalPlanStep } from "./step-types";

export const PLAN_PRIORITIES = ["low", "normal", "high", "critical"] as const;
export const MISSION_CLASSIFICATIONS = ["informational", "operational", "mutating", "restricted"] as const;
export const EXECUTION_MODES = ["dry_run", "supervised", "approval_required", "blocked"] as const;

export type PlanPriority = (typeof PLAN_PRIORITIES)[number];
export type MissionClassification = (typeof MISSION_CLASSIFICATIONS)[number];
export type ExecutionMode = (typeof EXECUTION_MODES)[number];

export type RetryPolicy = {
  maxAttempts: number;
  backoffMs: number;
};

export type CanonicalPlan = {
  schemaVersion: string;
  planId: string;
  createdAt: string;
  mission: {
    objective: string;
    priority: PlanPriority;
    classification: MissionClassification;
  };
  context: {
    sourceIds: string[];
    evidenceRefs: string[];
    constraints: string[];
  };
  approvals: {
    required: boolean;
    policyRefs: string[];
  };
  execution: {
    mode: ExecutionMode;
    timeoutMs: number;
    retryPolicy: RetryPolicy;
  };
  steps: CanonicalPlanStep[];
  governance: {
    truthScoreRequired: number;
    validationProfile: string;
  };
  metadata: {
    plannerVersion: string;
    generatedBy: string;
  };
};

