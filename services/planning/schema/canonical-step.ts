import { z } from "zod";

import { PLAN_LOG_LEVELS, PLAN_RISK_LEVELS, PLAN_STEP_TYPES } from "../contracts/step-types";

export const canonicalStepSchema = z.strictObject({
  stepId: z.string().min(1),
  type: z.enum(PLAN_STEP_TYPES),
  title: z.string().min(1),
  dependencies: z.array(z.string().min(1)),
  action: z.strictObject({
    tool: z.string().min(1),
    operation: z.string().min(1),
    parameters: z.record(z.string(), z.unknown()),
  }),
  safety: z.strictObject({
    approvalRequired: z.boolean(),
    dryRunSupported: z.boolean(),
    riskLevel: z.enum(PLAN_RISK_LEVELS),
  }),
  execution: z.strictObject({
    timeoutMs: z.number().int().positive(),
    retryable: z.boolean(),
    idempotent: z.boolean(),
  }),
  observability: z.strictObject({
    logLevel: z.enum(PLAN_LOG_LEVELS),
    metricsEnabled: z.boolean(),
  }),
});

