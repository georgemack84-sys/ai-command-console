import { z } from "zod";

export const canonicalIntentSchema = z.object({
  intentId: z.string().min(1),
  action: z.string().min(1),
  target: z.string().min(1),
  parameters: z.record(z.string(), z.unknown()),
  semanticMeaning: z.string().min(1),
  confidence: z.number().min(0).max(1),
  source: z.enum(["deterministic", "ai", "fallback"]),
  ambiguities: z.array(z.string()),
  clarificationRequired: z.boolean(),
  governanceRisk: z.enum(["safe", "review", "restricted", "blocked"]),
  supported: z.boolean(),
  normalized: z.boolean(),
  validation: z.object({
    schemaValid: z.boolean(),
    semanticValid: z.boolean(),
    governanceValid: z.boolean(),
    toolCompatible: z.boolean(),
  }),
  warnings: z.array(z.string()),
  createdAt: z.number(),
});
