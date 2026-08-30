import { describe, expect, it } from "vitest";
import { OpenAIWebSearchNewsProvider } from "@/src/server/headline-flow/providers/openai-web-search-news-provider";

const NOW = new Date("2026-08-27T12:00:00.000Z");

describe("OpenAIWebSearchNewsProvider", () => {
  it("parses current article results and removes non-article URLs", async () => {
    const provider = new OpenAIWebSearchNewsProvider({
      responses: {
        create: async () => ({
          output_text: JSON.stringify({
            articles: [
              {
                sourceName: "Example News",
                sourceUrl: "https://news.example.com",
                title: "Specific current event gets article treatment",
                description: "A current article with a specific URL.",
                canonicalUrl: "https://news.example.com/2026/08/27/specific-current-event-gets-article-treatment",
                imageUrl: null,
                author: null,
                publishedAt: "2026-08-27T10:30:00.000Z",
                topics: ["world"],
              },
              {
                sourceName: "Example News",
                title: "Homepage should not pass",
                canonicalUrl: "https://news.example.com",
                publishedAt: "2026-08-27T10:00:00.000Z",
                topics: ["world"],
              },
              {
                sourceName: "Old News",
                title: "Old article should not pass",
                canonicalUrl: "https://old.example.com/2026/08/20/old-event-with-specific-article-slug",
                publishedAt: "2026-08-20T10:00:00.000Z",
                topics: ["world"],
              },
            ],
          }),
        }),
      },
    });

    const articles = await provider.fetchLatest({ now: NOW, topic: "world", limit: 10 });

    expect(articles).toHaveLength(1);
    expect(articles[0]).toMatchObject({
      providerId: "web_search",
      sourceName: "Example News",
      title: "Specific current event gets article treatment",
      canonicalUrl: "https://news.example.com/2026/08/27/specific-current-event-gets-article-treatment",
      topics: ["world"],
    });
  });

  it("uses broad discovery first when no topic is selected", async () => {
    const requestedPrompts: string[] = [];
    const provider = new OpenAIWebSearchNewsProvider({
      responses: {
        create: async (params: { input?: string }) => {
          const prompt = String(params.input ?? "");
          requestedPrompts.push(prompt);
          const targetedTopic = prompt.match(/Focus only on the "([^"]+)" subject/)?.[1];
          const topics = targetedTopic
            ? [targetedTopic]
            : ["world", "politics", "business", "technology", "science", "health"];
          return {
            output_text: JSON.stringify({
              articles: topics.map((topic) => ({
                  sourceName: `${topic} Source`,
                  sourceUrl: `https://${topic}.example.com`,
                  title: `${topic} article has a specific current event headline`,
                  description: `A current ${topic} article.`,
                  canonicalUrl: `https://${topic}.example.com/2026/08/27/${topic}-article-has-specific-current-event-headline`,
                  imageUrl: null,
                  author: null,
                  publishedAt: "2026-08-27T10:30:00.000Z",
                  topics: [topic],
                })),
            }),
          };
        },
      },
    });

    const articles = await provider.fetchLatest({ now: NOW, limit: 20 });
    const diagnostics = provider.getRuntimeDiagnostics();

    expect(requestedPrompts).toHaveLength(4);
    expect(articles.map((article) => article.topics[0])).toEqual([
      "world",
      "politics",
      "business",
      "technology",
      "science",
      "health",
      "sports",
      "entertainment",
      "general",
    ]);
    expect(diagnostics.discoveryStrategy).toBe("targeted_fill");
    expect(diagnostics.topicCoverage).toMatchObject({
      attemptedTopics: ["world", "politics", "business", "technology", "science", "health", "sports", "entertainment", "general"],
      fulfilledTopics: ["world", "politics", "business", "technology", "science", "health", "sports", "entertainment", "general"],
      topicArticleCounts: {
        world: 1,
        politics: 1,
        business: 1,
        technology: 1,
        science: 1,
        health: 1,
        sports: 1,
        entertainment: 1,
        general: 1,
      },
      lowYieldTopics: [],
      failedTopics: [],
    });
    expect(diagnostics.freshnessWindowHours).toBe(48);
  });

  it("runs targeted fill only for missing subjects after thin broad discovery", async () => {
    const requestedPrompts: string[] = [];
    const provider = new OpenAIWebSearchNewsProvider({
      responses: {
        create: async (params: { input?: string }) => {
          const prompt = String(params.input ?? "");
          requestedPrompts.push(prompt);
          const topic = prompt.match(/Focus only on the "([^"]+)" subject/)?.[1] ?? "world";
          const topics = requestedPrompts.length === 1 ? ["world"] : [topic];
          return {
            output_text: JSON.stringify({
              articles: topics.map((candidateTopic) => ({
                sourceName: `${candidateTopic} Source`,
                sourceUrl: `https://${candidateTopic}.example.com`,
                title: `${candidateTopic} article has a specific current event headline`,
                description: `A current ${candidateTopic} article.`,
                canonicalUrl: `https://${candidateTopic}.example.com/2026/08/27/${candidateTopic}-article-has-specific-current-event-headline`,
                imageUrl: null,
                author: null,
                publishedAt: "2026-08-27T10:30:00.000Z",
                topics: [candidateTopic],
              })),
            }),
          };
        },
      },
    });

    const articles = await provider.fetchLatest({ now: NOW, limit: 4 });
    const diagnostics = provider.getRuntimeDiagnostics();

    expect(requestedPrompts.length).toBeGreaterThan(1);
    expect(articles).toHaveLength(4);
    expect(diagnostics.discoveryStrategy).toBe("targeted_fill");
    expect(diagnostics.topicCoverage?.fulfilledTopics.length).toBe(9);
    expect(diagnostics.topicCoverage?.lowYieldTopics).toEqual([]);
  });

  it("recovers article candidates from markdown links when JSON parsing fails", async () => {
    const provider = new OpenAIWebSearchNewsProvider({
      responses: {
        create: async () => ({
          output_text:
            "Here are current articles:\n- [Recovered markdown article headline](https://news.example.com/2026/08/27/recovered-markdown-article-headline) published 2026-08-27T10:30:00.000Z",
        }),
      },
    });

    const articles = await provider.fetchLatest({ now: NOW, topic: "technology", limit: 5 });
    const diagnostics = provider.getRuntimeDiagnostics();

    expect(articles).toHaveLength(1);
    expect(articles[0]).toMatchObject({
      title: "Recovered markdown article headline",
      canonicalUrl: "https://news.example.com/2026/08/27/recovered-markdown-article-headline",
      topics: ["technology"],
    });
    expect(diagnostics.rawResponse).toMatchObject({
      responseCount: 1,
      parsedArticleCount: 1,
      parseStrategies: ["markdown_links"],
    });
  });

  it("recovers article candidates from bare URLs when structured output is unavailable", async () => {
    const provider = new OpenAIWebSearchNewsProvider({
      responses: {
        create: async () => ({
          output_text:
            "A useful article is at https://news.example.com/2026/08/27/bare-url-current-event-article-headline and was published on 2026-08-27.",
        }),
      },
    });

    const articles = await provider.fetchLatest({ now: NOW, topic: "business", limit: 5 });
    const diagnostics = provider.getRuntimeDiagnostics();

    expect(articles).toHaveLength(1);
    expect(articles[0]).toMatchObject({
      title: "Bare Url Current Event Article Headline",
      canonicalUrl: "https://news.example.com/2026/08/27/bare-url-current-event-article-headline",
      topics: ["business"],
    });
    expect(diagnostics.rawResponse).toMatchObject({
      responseCount: 1,
      parsedArticleCount: 1,
      parseStrategies: ["bare_urls"],
    });
  });
});
