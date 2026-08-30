export type HeadlineFlowTopic =
  | "world"
  | "politics"
  | "business"
  | "technology"
  | "science"
  | "health"
  | "sports"
  | "entertainment"
  | "general";

export type CanonicalSource = {
  id: string;
  name: string;
  providerId: string;
  sourceType: "news_outlet" | "wire_service" | "primary_source" | "specialist_publication" | "other";
  url: string | null;
};

export type ArticleCandidate = {
  providerId: string;
  providerArticleId?: string | null;
  sourceName: string;
  sourceUrl?: string | null;
  title?: string | null;
  description?: string | null;
  canonicalUrl?: string | null;
  imageUrl?: string | null;
  author?: string | null;
  publishedAt?: string | Date | null;
  retrievedAt?: string | Date | null;
  topics?: HeadlineFlowTopic[];
  rawReference?: Record<string, unknown>;
};

export type CanonicalArticle = {
  id: string;
  providerId: string;
  providerArticleId: string | null;
  source: CanonicalSource;
  title: string;
  description: string | null;
  canonicalUrl: string | null;
  imageUrl: string | null;
  author: string | null;
  publishedAt: Date;
  retrievedAt: Date;
  topics: HeadlineFlowTopic[];
  fingerprint: string;
  rawReference: Record<string, unknown> | null;
};

export type ArticleRejection = {
  providerId: string;
  reason: "missing_title" | "invalid_published_at" | "invalid_url";
  title: string | null;
  rawReference: Record<string, unknown> | null;
};

export type CanonicalStory = {
  id: string;
  headline: string;
  summary: string;
  topic: HeadlineFlowTopic;
  status: "developing" | "confirmed";
  importance: "awareness" | "important" | "breaking";
  confidence: "single_source" | "multi_source";
  articles: CanonicalArticle[];
  firstPublishedAt: Date;
  lastPublishedAt: Date;
  rankingReason: string;
};

export type StoryPackage = {
  id: string;
  eventId: string;
  headline: string;
  shortSummary: string;
  narration: string;
  topic: HeadlineFlowTopic;
  importance: CanonicalStory["importance"];
  confidence: CanonicalStory["confidence"];
  status: CanonicalStory["status"];
  sourceSummary: string;
  sourceCount: number;
  sources: Array<{
    id: string;
    name: string;
    url: string | null;
  }>;
  publishedAt: string;
  updatedAt: string;
  displayMetadata: {
    rankingReason: string;
    briefingScore: number;
    prioritySignals: string[];
    personalizationReason: string | null;
    rankingAudit: {
      baseScore: number;
      personalizationBoost: number;
      finalScore: number;
      originalRank: number;
      personalizedRank: number;
    };
    whyItMatters: string;
    articleCount: number;
    heroImageUrl: string | null;
    freshness: {
      bucket: "live" | "today" | "past_48h";
      label: "Live" | "Today" | "Past 48h";
      ageMinutes: number;
    };
    imageProvenance?: {
      status: "article" | "topic_fallback";
      sourceName: string | null;
      articleUrl: string | null;
      imageUrl: string | null;
    };
    sourceTrail?: Array<{
      sourceName: string;
      articleUrl: string | null;
      publishedAt: string;
      providerId: string;
      discoveryProvider: string | null;
      feedUrl: string | null;
      originalUrl: string | null;
      linkResolutionStatus: string | null;
      imageUrl: string | null;
    }>;
  };
  eventMetadata?: {
    status: "new" | "developing" | "updated" | "resolved";
    version: number;
    updateReasons: Array<"new_evidence" | "source_corroboration" | "lead_angle_changed" | "duplicate" | "stale">;
    updateSummary: string;
  };
  userPreference?: {
    saved: boolean;
    muted: boolean;
    resolved: boolean;
  };
};

export type HeadlineFlowFeed = {
  generatedAt: string;
  providerId: string;
  stories: StoryPackage[];
  diagnostics: {
    receivedArticles: number;
    acceptedArticles: number;
    rejectedArticles: number;
    duplicateArticles: number;
    storyCount: number;
    rejections: ArticleRejection[];
    eventRegistry?: {
      status: "disabled" | "updated" | "unavailable";
      createdEvents: number;
      updatedEvents: number;
      unchangedEvents: number;
      resolvedEvents: number;
      hiddenEvents: number;
      mappedStories: number;
      error: string | null;
    };
    personalization?: {
      status: "applied" | "skipped";
      savedEventCount: number;
      topicWeights: Partial<Record<HeadlineFlowTopic, number>>;
      interactionEventCount?: number;
      interactionTopicWeights?: Partial<Record<HeadlineFlowTopic, number>>;
      mutedTopicWeights?: Partial<Record<HeadlineFlowTopic, number>>;
      boostedStories: number;
      penalizedStories?: number;
      reorderedStories: number;
    };
  };
};
