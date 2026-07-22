import type { NewsProvider } from "@/lib/news/providers/NewsProvider";
import type { RawNewsStory } from "@/types/headline";

const now = Date.now();
const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString();

export const mockStories: RawNewsStory[] = [
  {
    title: "City transit agency pilots quieter late-night service plan",
    summary: "A mock local transit board is testing a reduced-noise service pattern intended for overnight riders and residential corridors.",
    sourceName: "Mock Metro Desk",
    sourceType: "Analysis",
    category: "local",
    publishedAt: hoursAgo(2),
    articleUrl: "https://example.com/mock/local-transit-service",
    imageUrl: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1400&q=80",
    imageCredit: "Unsplash",
    importanceScore: 72,
    freshnessScore: 86,
  },
  {
    title: "Chip designers turn attention to lower-power inference hardware",
    summary: "Several mock semiconductor teams are prioritizing efficient inference chips for office displays, appliances, and edge devices.",
    sourceName: "Mock Technology Review",
    sourceType: "Briefing",
    category: "technology",
    publishedAt: hoursAgo(1),
    articleUrl: "https://example.com/mock/edge-inference-chips",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80",
    imageCredit: "Unsplash",
    importanceScore: 88,
    freshnessScore: 94,
  },
  {
    title: "Chip makers shift focus toward low-power inference hardware",
    summary: "A near-duplicate mock item describes the same edge hardware trend with a slightly different title for deduplication testing.",
    sourceName: "Mock Silicon Wire",
    sourceType: "Wire",
    category: "technology",
    publishedAt: hoursAgo(3),
    articleUrl: "https://example.com/mock/edge-inference-chips-alt",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80",
    importanceScore: 79,
    freshnessScore: 82,
  },
  {
    title: "Regional hospitals test shared dashboard for bed capacity",
    summary: "A mock health network is trialing a shared operations display to make transfer decisions faster during seasonal demand.",
    sourceName: "Mock Health Ledger",
    category: "health",
    publishedAt: hoursAgo(5),
    articleUrl: "https://example.com/mock/hospital-capacity-dashboard",
    imageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1400&q=80",
    imageCredit: "Unsplash",
    importanceScore: 83,
    freshnessScore: 70,
  },
  {
    title: "Researchers publish new measurements from coastal observatories",
    summary: "The mock science bulletin says coordinated sensors are improving long-term climate and marine forecasting models.",
    sourceName: "Mock Science Bulletin",
    category: "science",
    publishedAt: hoursAgo(7),
    articleUrl: "https://example.com/mock/coastal-observatories",
    imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1400&q=80",
    imageCredit: "Unsplash",
    importanceScore: 76,
    freshnessScore: 61,
  },
  {
    title: "Markets open mixed as investors watch industrial data",
    summary: "A mock business desk tracks cautious trading as analysts wait for updated production and hiring indicators.",
    sourceName: "Mock Market Daily",
    category: "business",
    publishedAt: hoursAgo(4),
    articleUrl: "https://example.com/mock/markets-industrial-data",
    imageUrl: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=80",
    imageCredit: "Unsplash",
    importanceScore: 78,
    freshnessScore: 76,
  },
  {
    title: "Global shipping groups prepare for revised port schedules",
    summary: "This mock world story follows logistics firms adapting to new inspection windows and seasonal cargo patterns.",
    sourceName: "Mock World Service",
    category: "world",
    publishedAt: hoursAgo(6),
    articleUrl: "https://example.com/mock/global-shipping-schedules",
    imageUrl: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1400&q=80",
    imageCredit: "Unsplash",
    importanceScore: 81,
    freshnessScore: 65,
  },
  {
    title: "League officials approve expanded player safety review",
    summary: "A mock sports governing body adds independent checks to evaluate equipment, recovery windows, and field conditions.",
    sourceName: "Mock Sports Desk",
    category: "sports",
    publishedAt: hoursAgo(9),
    articleUrl: "https://example.com/mock/player-safety-review",
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1400&q=80",
    importanceScore: 67,
    freshnessScore: 52,
  },
  {
    title: "Streaming studios test shorter release windows for documentary series",
    summary: "A mock entertainment report says studios are experimenting with staggered launches to sustain audience attention.",
    sourceName: "Mock Culture Monitor",
    category: "entertainment",
    publishedAt: hoursAgo(11),
    articleUrl: "https://example.com/mock/documentary-release-windows",
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80",
    importanceScore: 63,
    freshnessScore: 43,
  },
  {
    title: "Lawmakers schedule hearing on public data resilience",
    summary: "A mock politics story previews testimony on public records continuity, backup standards, and citizen access.",
    sourceName: "Mock Civic Wire",
    category: "politics",
    publishedAt: hoursAgo(8),
    articleUrl: "https://example.com/mock/public-data-resilience",
    importanceScore: 74,
    freshnessScore: 57,
  },
  {
    title: "Morning brief: five signals shaping the day ahead",
    summary: "A mock top-story roundup collects business, science, civic, and technology developments into one calm briefing.",
    sourceName: "Mock Headline Flow",
    sourceType: "Roundup",
    category: "top",
    publishedAt: hoursAgo(1.5),
    articleUrl: "https://example.com/mock/morning-brief",
    importanceScore: 92,
    freshnessScore: 91,
  },
  {
    title: "Broken image test story uses fallback art immediately",
    summary: "This mock item intentionally points at a missing image so the visual panel can prove its professional fallback behavior.",
    sourceName: "Mock QA Desk",
    category: "technology",
    publishedAt: hoursAgo(10),
    articleUrl: "https://example.com/mock/broken-image-fallback",
    imageUrl: "https://example.com/missing-headline-flow-image.jpg",
    importanceScore: 58,
    freshnessScore: 40,
  },
];

export class MockNewsProvider implements NewsProvider {
  readonly name = "mock";
  readonly kind = "mock" as const;

  isConfigured() {
    return true;
  }

  async health() {
    return {
      name: this.name,
      kind: this.kind,
      configured: true,
      status: "ok" as const,
      message: "Mock provider is always available.",
      checkedAt: new Date().toISOString(),
    };
  }

  async getHeadlines(input: { category?: string; limit?: number }) {
    const category = input.category ?? "top";
    const filtered = category === "top" ? mockStories : mockStories.filter((story) => story.category === category);
    return filtered.slice(0, input.limit ?? 25).map((story) => ({ ...story, providerName: this.name }));
  }
}
