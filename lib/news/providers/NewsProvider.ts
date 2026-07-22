import type { RawNewsStory } from "@/types/headline";

export interface NewsProvider {
  readonly name: string;
  readonly kind?: "mock" | "rss" | "api";
  isConfigured?(): boolean;
  health?(): Promise<NewsProviderHealth>;
  getHeadlines(input: { category?: string; limit?: number; query?: string; location?: string }): Promise<RawNewsStory[]>;
}

export type NewsProviderHealth = {
  name: string;
  kind: "mock" | "rss" | "api";
  configured: boolean;
  status: "ok" | "degraded" | "unconfigured";
  message: string;
  checkedAt: string;
};
