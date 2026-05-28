import { z } from "zod";

import { EXECUTION_MODES, MISSION_CLASSIFICATIONS, PLAN_PRIORITIES } from "../contracts/plan-types";
import { canonicalStepSchema } from "./canonical-step";

export const canonicalPlanSchema = z.strictObject({
  schemaVersion: z.string().min(1),
  planId: z.string().min(1),
  createdAt: z.string().datetime(),
  mission: z.strictObject({
    objective: z.string().min(1),
    priority: z.enum(PLAN_PRIORITIES),
    classification: z.enum(MISSION_CLASSIFICATIONS),
  }),
  context: z.strictObject({
    sourceIds: z.array(z.string()),
    evidenceRefs: z.array(z.string()),
    constraints: z.array(z.string()),
  }),
  approvals: z.strictObject({
    required: z.boolean(),
    policyRefs: z.array(z.string()),
  }),
  execution: z.strictObject({
    mode: z.enum(EXECUTION_MODES),
    timeoutMs: z.number().int().positive(),
    retryPolicy: z.strictObject({
      maxAttempts: z.number().int().min(1),
      backoffMs: z.number().int().min(0),
    }),
  }),
  steps: z.array(canonicalStepSchema).min(1),
  governance: z.strictObject({
    truthScoreRequired: z.number().min(0).max(1),
    validationProfile: z.string().min(1),
  }),
  metadata: z.strictObject({
    plannerVersion: z.string().min(1),
    generatedBy: z.string().min(1),
  }),
});

