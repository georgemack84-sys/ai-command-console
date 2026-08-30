import type { ArticleCandidate } from "@/src/server/headline-flow/domain/types";
import type { NewsProvider, NewsProviderFetchInput } from "@/src/server/headline-flow/providers/types";

export const fixtureArticles: ArticleCandidate[] = [
  {
    providerId: "fixture",
    providerArticleId: "fixture-001",
    sourceName: "Fixture Times",
    sourceUrl: "https://fixture.example.com",
    title: "City approves overnight cooling centers",
    description: "Officials opened additional cooling centers as high temperatures continue.",
    canonicalUrl: "https://fixture.example.com/city-cooling-centers?utm_source=test",
    imageUrl: "https://fixture.example.com/images/cooling.jpg",
    publishedAt: "2026-08-27T01:30:00.000Z",
    topics: ["health"],
  },
  {
    providerId: "fixture",
    providerArticleId: "fixture-002",
    sourceName: "Metro Wire",
    sourceUrl: "https://metro-wire.example.com",
    title: "City approves overnight cooling centers",
    description: "The city will keep cooling centers open overnight during the heat emergency.",
    canonicalUrl: "https://metro-wire.example.com/cooling-centers",
    publishedAt: "2026-08-27T01:34:00.000Z",
    topics: ["health"],
  },
  {
    providerId: "fixture",
    providerArticleId: "fixture-003",
    sourceName: "Fixture Times",
    sourceUrl: "https://fixture.example.com",
    title: "City approves overnight cooling centers",
    description: "Duplicate article with tracking parameters.",
    canonicalUrl: "https://fixture.example.com/city-cooling-centers?utm_medium=social&utm_source=test",
    publishedAt: "2026-08-27T01:31:00.000Z",
    topics: ["health"],
  },
  {
    providerId: "fixture",
    providerArticleId: "fixture-004",
    sourceName: "Market Ledger",
    sourceUrl: "https://market-ledger.example.com",
    title: "Chipmaker shares rise after earnings forecast",
    description: "A major chipmaker raised its sales forecast after stronger demand.",
    canonicalUrl: "https://market-ledger.example.com/chipmaker-forecast",
    publishedAt: "2026-08-27T00:40:00.000Z",
    topics: ["business", "technology"],
  },
  {
    providerId: "fixture",
    providerArticleId: "fixture-005",
    sourceName: "Broken Fixture",
    title: "",
    description: "This record should be rejected.",
    canonicalUrl: "https://fixture.example.com/broken",
    publishedAt: "2026-08-27T00:30:00.000Z",
  },
];

export class FixtureNewsProvider implements NewsProvider {
  readonly id = "fixture";

  constructor(private readonly articles: ArticleCandidate[] = fixtureArticles) {}

  async fetchLatest(input: NewsProviderFetchInput) {
    const topic = input.topic?.toLowerCase();
    const filtered = topic
      ? this.articles.filter((article) => article.topics?.some((candidateTopic) => candidateTopic === topic))
      : this.articles;
    return filtered.slice(0, input.limit ?? filtered.length);
  }
}
