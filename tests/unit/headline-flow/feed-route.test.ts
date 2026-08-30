import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const webSearchProviderMock = vi.hoisted(() => ({
  configured: false,
  fetchLatest: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/headline-flow/event-registry/prisma-event-registry-repository", () => ({
  headlineFlowEventRegistryRepository: {
    findByIdForWorkspace: vi.fn().mockResolvedValue(null),
    listByWorkspace: vi.fn().mockResolvedValue([]),
    upsert: vi.fn(async (event) => event),
  },
}));

vi.mock("@/src/server/headline-flow/event-registry/event-preferences", async () => {
  const actual = await vi.importActual<typeof import("@/src/server/headline-flow/event-registry/event-preferences")>(
    "@/src/server/headline-flow/event-registry/event-preferences",
  );
  return {
    ...actual,
    headlineFlowEventPreferenceRepository: {
      findPreference: vi.fn().mockResolvedValue(null),
      listPreferences: vi.fn().mockResolvedValue(new Map()),
      listUserPreferences: vi.fn().mockResolvedValue([]),
      listHiddenEventIds: vi.fn().mockResolvedValue(new Set()),
      applyAction: vi.fn(),
    },
  };
});

vi.mock("@/src/server/headline-flow/analytics/interaction-events", () => ({
  headlineFlowInteractionRepository: {
    summarize: vi.fn().mockResolvedValue({
      totalEvents: 0,
      actionCounts: {},
      topicCounts: {},
      savedTopicCounts: {},
      mutedTopicCounts: {},
      sourceOpenRate: 0,
    }),
  },
}));

vi.mock("@/src/server/headline-flow/providers/openai-web-search-news-provider", () => ({
  isOpenAIWebSearchConfigured: () => webSearchProviderMock.configured,
  OpenAIWebSearchNewsProvider: class {
    readonly id = "web_search";

    async fetchLatest(input: unknown) {
      return webSearchProviderMock.fetchLatest(input);
    }

    getRuntimeDiagnostics() {
      return {
        configured: webSearchProviderMock.configured,
        freshnessWindowHours: 48,
        topicCoverage: {
          attemptedTopics: ["world"],
          fulfilledTopics: ["world"],
          topicArticleCounts: { world: 1 },
          lowYieldTopics: [],
          failedTopics: [],
        },
        error: null,
      };
    }
  },
}));

import { clearHeadlineFlowFeedCacheForTests, GET } from "@/app/api/headline-flow/feed/route";
import { env } from "@/src/config/env";
import { getSessionUser } from "@/src/lib/auth";
import { clearRateLimitsForTests } from "@/src/server/security/rate-limit";

const originalHeadlineFlowEnv = {
  NODE_ENV: env.NODE_ENV,
  HEADLINE_FLOW_ALLOW_FIXTURE_PROVIDER: env.HEADLINE_FLOW_ALLOW_FIXTURE_PROVIDER,
  HEADLINE_FLOW_FEED_CACHE_TTL_MS: env.HEADLINE_FLOW_FEED_CACHE_TTL_MS,
  HEADLINE_FLOW_STALE_CACHE_MAX_AGE_MS: env.HEADLINE_FLOW_STALE_CACHE_MAX_AGE_MS,
  RATE_LIMIT_ENABLED: env.RATE_LIMIT_ENABLED,
  RATE_LIMIT_SOURCE_LIMIT: env.RATE_LIMIT_SOURCE_LIMIT,
  RATE_LIMIT_WINDOW_MS: env.RATE_LIMIT_WINDOW_MS,
};

describe("headline flow feed route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    webSearchProviderMock.configured = false;
    webSearchProviderMock.fetchLatest.mockReset();
    clearHeadlineFlowFeedCacheForTests();
    clearRateLimitsForTests();
  });

  afterEach(() => {
    env.NODE_ENV = originalHeadlineFlowEnv.NODE_ENV;
    env.HEADLINE_FLOW_ALLOW_FIXTURE_PROVIDER = originalHeadlineFlowEnv.HEADLINE_FLOW_ALLOW_FIXTURE_PROVIDER;
    env.HEADLINE_FLOW_FEED_CACHE_TTL_MS = originalHeadlineFlowEnv.HEADLINE_FLOW_FEED_CACHE_TTL_MS;
    env.HEADLINE_FLOW_STALE_CACHE_MAX_AGE_MS = originalHeadlineFlowEnv.HEADLINE_FLOW_STALE_CACHE_MAX_AGE_MS;
    env.RATE_LIMIT_ENABLED = originalHeadlineFlowEnv.RATE_LIMIT_ENABLED;
    env.RATE_LIMIT_SOURCE_LIMIT = originalHeadlineFlowEnv.RATE_LIMIT_SOURCE_LIMIT;
    env.RATE_LIMIT_WINDOW_MS = originalHeadlineFlowEnv.RATE_LIMIT_WINDOW_MS;
    clearRateLimitsForTests();
    vi.unstubAllGlobals();
  });

  function mockAuthenticatedUser() {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
  }

  it("returns fixture story packages for authenticated users", async () => {
    mockAuthenticatedUser();

    const response = await GET(new Request("http://localhost/api/headline-flow/feed?limit=1&provider=fixture"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data).toMatchObject({
      mode: "fixture",
      requestedProvider: "fixture",
      workspaceId: "workspace_1",
      diagnostics: {
        cache: {
          status: "miss",
        },
      },
      feed: {
        providerId: "fixture",
        diagnostics: {
          receivedArticles: 1,
          acceptedArticles: 1,
          rejectedArticles: 0,
          duplicateArticles: 0,
          storyCount: 1,
        },
      },
    });
    expect(payload.data.feed.stories[0]).toMatchObject({
      headline: "City approves overnight cooling centers",
      topic: "health",
    });
  });

  it("serves repeated feed requests from the route cache", async () => {
    mockAuthenticatedUser();

    const firstResponse = await GET(new Request("http://localhost/api/headline-flow/feed?limit=1&provider=fixture"));
    const firstPayload = await firstResponse.json();
    const secondResponse = await GET(new Request("http://localhost/api/headline-flow/feed?limit=1&provider=fixture"));
    const secondPayload = await secondResponse.json();

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(firstPayload.data.diagnostics.cache.status).toBe("miss");
    expect(secondPayload.data.diagnostics.cache.status).toBe("hit");
    expect(secondPayload.data.feed.generatedAt).toBe(firstPayload.data.feed.generatedAt);
  });

  it("does not spend live-provider rate limit budget on fresh cache hits", async () => {
    mockAuthenticatedUser();
    env.RATE_LIMIT_ENABLED = "true";
    env.RATE_LIMIT_SOURCE_LIMIT = "1";
    env.RATE_LIMIT_WINDOW_MS = "60000";

    const firstResponse = await GET(new Request("http://localhost/api/headline-flow/feed?limit=1&provider=fixture", {
      headers: { "x-real-ip": "203.0.113.7" },
    }));
    const secondResponse = await GET(new Request("http://localhost/api/headline-flow/feed?limit=1&provider=fixture", {
      headers: { "x-real-ip": "203.0.113.7" },
    }));
    const thirdResponse = await GET(new Request("http://localhost/api/headline-flow/feed?limit=2&provider=fixture", {
      headers: { "x-real-ip": "203.0.113.7" },
    }));
    const secondPayload = await secondResponse.json();
    const thirdPayload = await thirdResponse.json();

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(secondPayload.data.diagnostics.cache.status).toBe("hit");
    expect(thirdResponse.status).toBe(429);
    expect(thirdPayload.error.code).toBe("rate_limited");
  });

  it("supports topic filtering", async () => {
    mockAuthenticatedUser();

    const response = await GET(new Request("http://localhost/api/headline-flow/feed?topic=technology&provider=fixture"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.feed.stories).toHaveLength(1);
    expect(payload.data.feed.stories[0].headline).toBe("Chipmaker shares rise after earnings forecast");
  });

  it("returns unauthorized for anonymous users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/headline-flow/feed"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("unauthorized");
  });

  it("validates query parameters", async () => {
    mockAuthenticatedUser();

    const response = await GET(new Request("http://localhost/api/headline-flow/feed?limit=200"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("validation_error");
  });

  it("blocks fixture provider access in production unless explicitly enabled", async () => {
    mockAuthenticatedUser();
    env.NODE_ENV = "production";
    env.HEADLINE_FLOW_ALLOW_FIXTURE_PROVIDER = "false";

    const response = await GET(new Request("http://localhost/api/headline-flow/feed?provider=fixture"));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("fixture_provider_disabled");
  });

  it("serves a stale cached live feed when the auto provider returns no stories", async () => {
    mockAuthenticatedUser();
    env.HEADLINE_FLOW_FEED_CACHE_TTL_MS = "1";
    env.HEADLINE_FLOW_STALE_CACHE_MAX_AGE_MS = "600000";
    const pubDate = new Date().toUTCString();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(`
        <rss>
          <channel>
            <item>
              <title>Global leaders announce current summit - Example Source</title>
              <link>https://example.com/global-leaders-announce-current-summit</link>
              <guid>global-leaders-announce-current-summit</guid>
              <pubDate>${pubDate}</pubDate>
              <description>Current international reporting from today.</description>
            </item>
          </channel>
        </rss>
      `, { status: 200 }))
      .mockResolvedValue(new Response("<rss><channel></channel></rss>", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const firstResponse = await GET(new Request("http://localhost/api/headline-flow/feed?limit=1&provider=auto"));
    await new Promise((resolve) => setTimeout(resolve, 5));
    const secondResponse = await GET(new Request("http://localhost/api/headline-flow/feed?limit=1&provider=auto"));
    const firstPayload = await firstResponse.json();
    const secondPayload = await secondResponse.json();

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(firstPayload.data.diagnostics.cache.status).toBe("miss");
    expect(secondPayload.data.diagnostics.cache.status).toBe("stale");
    expect(secondPayload.data.diagnostics.fallbackReason).toBe("provider_empty_stale_cache");
    expect(secondPayload.data.feed.generatedAt).toBe(firstPayload.data.feed.generatedAt);
  });

  it("promotes auto mode from empty RSS to web search before stale or fixture fallback", async () => {
    mockAuthenticatedUser();
    webSearchProviderMock.configured = true;
    webSearchProviderMock.fetchLatest.mockResolvedValue([
      {
        providerId: "web_search",
        providerArticleId: "web-search-world-1",
        sourceName: "Example Live News",
        sourceUrl: "https://live.example.com",
        title: "Global leaders announce current summit",
        description: "A current world article discovered by web search.",
        canonicalUrl: "https://live.example.com/2026/08/27/global-leaders-announce-current-summit",
        imageUrl: null,
        author: null,
        publishedAt: new Date().toISOString(),
        retrievedAt: new Date().toISOString(),
        topics: ["world"],
      },
    ]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<rss><channel></channel></rss>", { status: 200 })));

    const response = await GET(new Request("http://localhost/api/headline-flow/feed?limit=6&provider=auto"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(webSearchProviderMock.fetchLatest).toHaveBeenCalled();
    expect(payload.data.mode).toBe("web_search");
    expect(payload.data.diagnostics.selectedProvider).toBe("web_search");
    expect(payload.data.diagnostics.fallbackReason).toBe("rss_empty_web_search_fill");
    expect(payload.data.feed.stories[0]).toMatchObject({
      headline: "Global leaders announce current summit",
      topic: "world",
    });
  });
});
