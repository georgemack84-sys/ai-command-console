import { z } from "zod";
import { headlineCategories } from "@/types/headline";

export const headlineCategorySchema = z.enum(headlineCategories);

export const headlineSchema = z.object({
  id: z.string().min(8),
  title: z.string().min(8).max(220),
  summary: z.string().min(12).max(420),
  source: z.object({
    name: z.string().min(2),
    initials: z.string().min(1).max(4),
    type: z.string().optional(),
  }),
  category: headlineCategorySchema,
  publishedAt: z.string().datetime(),
  articleUrl: z.string().url(),
  image: z
    .object({
      url: z.string().url(),
      alt: z.string().min(1),
      credit: z.string().optional(),
    })
    .optional(),
  visualMode: z.enum(["ARTICLE_IMAGE", "CATEGORY_FALLBACK", "DATA_VISUAL", "MULTI_SOURCE"]).optional(),
  visualQualityScore: z.number().min(0).max(100).optional(),
  visualExplanation: z.string().optional(),
  visualFallback: z.object({ symbol: z.string(), label: z.string() }).optional(),
  importanceScore: z.number().min(0).max(100),
  freshnessScore: z.number().min(0).max(100),
  trust: z
    .object({
      trustStanding: z.enum(["NOMINAL", "DEGRADED", "SUSPENDED", "REVOKED", "EXPIRED", "UNKNOWN"]),
      confidence: z.number().min(0).max(100),
      evidenceCount: z.number().int().nonnegative(),
      sourceReputation: z.number().min(0).max(100),
      misinformationRisk: z.number().min(0).max(100),
      explanation: z.string(),
      evaluatedAt: z.string().datetime(),
      history: z.array(
        z.object({
          standing: z.enum(["NOMINAL", "DEGRADED", "SUSPENDED", "REVOKED", "EXPIRED", "UNKNOWN"]),
          at: z.string().datetime(),
          reason: z.string(),
        }),
      ),
    })
    .optional(),
  explanation: z
    .object({
      whyThisStory: z.string(),
      whyThisRanking: z.string(),
      whyThisImage: z.string(),
      whyThisSource: z.string(),
      whyThisTrustScore: z.string(),
      whyHidden: z.string(),
      whyRecommended: z.string(),
    })
    .optional(),
  saved: z.boolean(),
  hidden: z.boolean(),
});

export const headlineResponseSchema = z.object({
  generatedAt: z.string().datetime(),
  category: z.string(),
  count: z.number().int().nonnegative(),
  stories: z.array(headlineSchema),
});

export const headlineQuerySchema = z.object({
  category: headlineCategorySchema.default("top"),
  limit: z.coerce.number().int().min(1).max(50).default(25),
  query: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
  mock: z.coerce.boolean().optional(),
});
