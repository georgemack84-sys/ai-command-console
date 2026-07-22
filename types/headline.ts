export const headlineCategories = [
  "top",
  "local",
  "business",
  "technology",
  "science",
  "health",
  "politics",
  "sports",
  "entertainment",
  "world",
] as const;

export type HeadlineCategory = (typeof headlineCategories)[number];

export type Headline = {
  id: string;
  title: string;
  summary: string;
  source: {
    name: string;
    initials: string;
    type?: string;
  };
  category: HeadlineCategory;
  publishedAt: string;
  articleUrl: string;
  image?: {
    url: string;
    alt: string;
    credit?: string;
  };
  visualMode?: "ARTICLE_IMAGE" | "CATEGORY_FALLBACK" | "DATA_VISUAL" | "MULTI_SOURCE";
  visualQualityScore?: number;
  visualExplanation?: string;
  visualFallback?: {
    symbol: string;
    label: string;
  };
  importanceScore: number;
  freshnessScore: number;
  trust?: {
    trustStanding: "NOMINAL" | "DEGRADED" | "SUSPENDED" | "REVOKED" | "EXPIRED" | "UNKNOWN";
    confidence: number;
    evidenceCount: number;
    sourceReputation: number;
    misinformationRisk: number;
    explanation: string;
    evaluatedAt: string;
    history: Array<{
      standing: "NOMINAL" | "DEGRADED" | "SUSPENDED" | "REVOKED" | "EXPIRED" | "UNKNOWN";
      at: string;
      reason: string;
    }>;
  };
  explanation?: {
    whyThisStory: string;
    whyThisRanking: string;
    whyThisImage: string;
    whyThisSource: string;
    whyThisTrustScore: string;
    whyHidden: string;
    whyRecommended: string;
  };
  saved: boolean;
  hidden: boolean;
};

export type HeadlineResponse = {
  generatedAt: string;
  category: string;
  count: number;
  provider?: string;
  providers?: Array<{
    name: string;
    status: "fulfilled" | "rejected";
    count: number;
    error?: string;
  }>;
  stories: Headline[];
};

export type RawNewsStory = {
  id?: string;
  title?: string;
  summary?: string;
  sourceName?: string;
  sourceType?: string;
  category?: string;
  publishedAt?: string | Date;
  articleUrl?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCredit?: string;
  importanceScore?: number;
  freshnessScore?: number;
  providerName?: string;
  sourceUrl?: string;
};
