import { z } from "zod";
import { headlineCategorySchema } from "@/lib/news/schemas";

export const discoveredStorySchema = z.object({
  id: z.string().min(8),
  headline: z.string().min(8),
  summary: z.string().min(12),
  source: z.object({
    name: z.string().min(2),
    author: z.string().optional().default(""),
  }),
  category: headlineCategorySchema,
  publishedAt: z.string().datetime(),
  articleUrl: z.string().url(),
  image: z
    .object({
      url: z.string().url(),
      alt: z.string().min(1),
      credit: z.string().optional().default(""),
    })
    .optional(),
  visualMode: z.enum(["ARTICLE_IMAGE", "CATEGORY_FALLBACK"]),
  tags: z.array(z.string()),
  importanceScore: z.number().min(0).max(100),
  freshnessScore: z.number().min(0).max(100),
  reasonSelected: z.string().min(12),
});

export const newsDiscoveryRequestSchema = z.object({
  category: headlineCategorySchema.default("top"),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  query: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
  timeWindowHours: z.coerce.number().int().min(1).max(720).default(72),
});

export const newsDiscoveryResponseSchema = z.object({
  generatedAt: z.string().datetime(),
  agent: z.literal("headline-flow-news-discovery"),
  mode: z.enum(["local-provider-backed", "external-web-agent-ready"]),
  promptVersion: z.string(),
  count: z.number().int().nonnegative(),
  stories: z.array(discoveredStorySchema),
});

export type DiscoveredStory = z.infer<typeof discoveredStorySchema>;
export type NewsDiscoveryRequest = z.infer<typeof newsDiscoveryRequestSchema>;
