import type { NewsProvider } from "@/lib/news/providers/NewsProvider";
import { GNewsProvider, GuardianProvider, NewsApiProvider } from "@/lib/news/providers/ApiNewsProviders";
import { MockNewsProvider } from "@/lib/news/providers/MockNewsProvider";
import { RssNewsProvider } from "@/lib/news/providers/RssNewsProvider";
import { WebSearchNewsProvider } from "@/lib/news/providers/WebSearchNewsProvider";

export const providerRegistry: Record<string, () => NewsProvider> = {
  mock: () => new MockNewsProvider(),
  "web-search": () => new WebSearchNewsProvider(),
  web: () => new WebSearchNewsProvider(),
  rss: () => new RssNewsProvider(),
  newsapi: () => new NewsApiProvider(),
  gnews: () => new GNewsProvider(),
  guardian: () => new GuardianProvider(),
};

export function createNewsProvider(forceMock = false): NewsProvider {
  if (forceMock) return new MockNewsProvider();
  const provider = (process.env.NEWS_PROVIDER || "mock").toLowerCase();
  return providerRegistry[provider as keyof typeof providerRegistry]?.() ?? new MockNewsProvider();
}

export function createConfiguredProviders(forceMock = false): NewsProvider[] {
  if (forceMock) return [new MockNewsProvider()];
  const requested = (process.env.NEWS_PROVIDERS || process.env.NEWS_PROVIDER || "mock")
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
  const providers = requested
    .map((name) => providerRegistry[name as keyof typeof providerRegistry]?.())
    .filter((provider): provider is NewsProvider => Boolean(provider))
    .filter((provider) => provider.isConfigured?.() ?? true);
  return providers.length ? providers : [new MockNewsProvider()];
}

export async function getProviderHealth() {
  const providers = Object.entries(providerRegistry)
    .filter(([name]) => name !== "web")
    .map(([, create]) => create());
  return Promise.all(
    providers.map((provider) =>
      provider.health
        ? provider.health()
        : Promise.resolve({
            name: provider.name,
            kind: provider.kind ?? "api",
            configured: provider.isConfigured?.() ?? true,
            status: "ok" as const,
            message: "No provider health check implemented.",
            checkedAt: new Date().toISOString(),
          }),
    ),
  );
}
