import type { ArticleCandidate } from "@/src/server/headline-flow/domain/types";

export type NewsProviderFetchInput = {
  now: Date;
  topic?: string;
  limit?: number;
};

export type NewsProvider = {
  id: string;
  fetchLatest(input: NewsProviderFetchInput): Promise<ArticleCandidate[]>;
  getRuntimeDiagnostics?(): NewsProviderRuntimeDiagnostics;
};

export type NewsProviderRuntimeDiagnostics = {
  configured?: boolean;
  rejectedArticleUrls?: Array<{
    url: string;
    reason: string;
    title: string | null;
  }>;
  rejectedOutOfWindow?: number;
  rejectedTopicMismatch?: number;
  linkResolution?: {
    attempted: number;
    resolved: number;
    unresolved: number;
    rejected: number;
    direct: number;
    skipped: number;
  };
  imageExtraction?: {
    attempted: number;
    found: number;
    fallback: number;
    rejected: number;
  };
  rawResponse?: {
    responseCount: number;
    totalTextLength: number;
    lastTextLength: number;
    parseStrategies: string[];
    parsedArticleCount: number;
    parseErrors: string[];
  };
  discoveryStrategy?: "targeted" | "broad" | "targeted_fill" | "rss_broad" | "rss_targeted";
  freshnessWindowHours?: number;
  topicCoverage?: {
    attemptedTopics: string[];
    fulfilledTopics: string[];
    topicArticleCounts?: Record<string, number>;
    lowYieldTopics?: string[];
    failedTopics: Array<{ topic: string; error: string }>;
  };
  error?: string | null;
};
