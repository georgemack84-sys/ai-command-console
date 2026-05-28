import { z } from "zod";

export const intentLifecycleStateSchema = z.enum([
  "RECEIVED",
  "NORMALIZING",
  "CLASSIFYING",
  "VALIDATING",
  "AMBIGUOUS",
  "CLARIFICATION_REQUIRED",
  "ACCEPTED",
  "REJECTED",
  "DISPUTED",
  "FROZEN",
]);

export const intentCategorySchema = z.enum([
  "system",
  "network",
  "filesystem",
  "runtime",
  "diagnostics",
  "governance",
  "recovery",
  "security",
  "unknown",
]);

export const parserSourceSchema = z.enum(["deterministic", "ai", "fallback"]);

export const structuredIntentSchema = z.object({
  intentId: z.string().min(1),
  rawInput: z.string(),
  normalizedInput: z.string(),
  operationalIntent: z.string(),
  category: intentCategorySchema,
  intent: z.object({
    action: z.string().min(1),
    target: z.string().min(1),
    parameters: z.record(z.string(), z.unknown()),
  }),
  confidence: z.number().min(0).max(1),
  source: parserSourceSchema,
  ambiguities: z.array(z.string()),
  clarificationRequired: z.boolean(),
  warnings: z.array(z.string()),
  supported: z.boolean(),
  dangerous: z.boolean(),
  semanticWarnings: z.array(z.string()),
  lifecycleState: intentLifecycleStateSchema,
  replayHash: z.string().min(1),
  immutableHash: z.string().min(1),
  lineageId: z.string().min(1),
  semanticIntegrityVerified: z.boolean(),
  createdAt: z.number(),
  schemaVersion: z.string().min(1),
  taxonomyVersion: z.string().min(1),
  parserVersion: z.string().min(1),
});

export const intentParserResultSchema = z.object({
  intent: z.object({
    action: z.string().min(1),
    target: z.string().min(1),
    parameters: z.record(z.string(), z.unknown()),
  }),
  confidence: z.number().min(0).max(1),
  source: parserSourceSchema,
  ambiguities: z.array(z.string()),
  clarificationRequired: z.boolean(),
  warnings: z.array(z.string()),
  lifecycleState: intentLifecycleStateSchema,
  replayHash: z.string().min(1),
  immutableHash: z.string().min(1),
  lineageId: z.string().min(1),
  semanticIntegrityVerified: z.boolean(),
});

export const canonicalIntentSchema = z.object({
  intentId: z.string().min(1),
  action: z.string().min(1),
  target: z.string().min(1),
  parameters: z.record(z.string(), z.unknown()),
  semanticMeaning: z.string().min(1),
  confidence: z.number().min(0).max(1),
  source: parserSourceSchema,
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
