import { z } from "zod";

export const replayVerifyRequestSchema = z.object({
  executionId: z.string(),
}).strict();

export const replayVerificationResponseSchema = z.object({
  executionId: z.string(),
  verified: z.boolean(),
  deterministic: z.boolean(),
  divergences: z.array(z.object({
    category: z.string(),
    severity: z.string(),
    deterministic: z.boolean(),
    replayState: z.string(),
    historicalState: z.string(),
    evidence: z.array(z.string()),
    requiresEscalation: z.boolean(),
  })),
  confidence: z.object({
    score: z.number(),
    deterministic: z.boolean(),
    confidenceLevel: z.string(),
    riskFactors: z.array(z.string()),
    verifiedEvidence: z.array(z.string()),
    warnings: z.array(z.string()),
  }),
  reconstruction: z.object({
    executionId: z.string(),
    reconstructedStates: z.array(z.string()),
    replaySequence: z.array(z.string()),
    missingEvidence: z.array(z.string()),
    reconstructionConfidence: z.number(),
    deterministic: z.boolean(),
    warnings: z.array(z.string()),
  }),
});
