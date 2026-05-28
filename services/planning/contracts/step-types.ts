export const PLAN_STEP_TYPES = [
  "analyze",
  "retrieve",
  "transform",
  "validate",
  "propose",
  "route",
  "execute_candidate",
] as const;

export const PLAN_RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export const PLAN_LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

export type StepType = (typeof PLAN_STEP_TYPES)[number];
export type RiskLevel = (typeof PLAN_RISK_LEVELS)[number];
export type LogLevel = (typeof PLAN_LOG_LEVELS)[number];

export type CanonicalStepAction = {
  tool: string;
  operation: string;
  parameters: Record<string, unknown>;
};

export type CanonicalPlanStep = {
  stepId: string;
  type: StepType;
  title: string;
  dependencies: string[];
  action: CanonicalStepAction;
  safety: {
    approvalRequired: boolean;
    dryRunSupported: boolean;
    riskLevel: RiskLevel;
  };
  execution: {
    timeoutMs: number;
    retryable: boolean;
    idempotent: boolean;
  };
  observability: {
    logLevel: LogLevel;
    metricsEnabled: boolean;
  };
};

