import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

import { GET } from "@/app/api/headline-flow/readiness/route";
import { env } from "@/src/config/env";
import { getSessionUser } from "@/src/lib/auth";
import { getHeadlineFlowReadiness } from "@/src/server/headline-flow/application/readiness";
import { recordHeadlineFlowFeedSuccess, resetHeadlineFlowFeedHealthForTests } from "@/src/server/headline-flow/application/feed-health";
import type { HeadlineFlowFeed, HeadlineFlowTopic, StoryPackage } from "@/src/server/headline-flow/domain/types";

const originalEnv = {
  NODE_ENV: env.NODE_ENV,
  OPENAI_API_KEY: env.OPENAI_API_KEY,
  HEADLINE_FLOW_ALLOW_FIXTURE_PROVIDER: env.HEADLINE_FLOW_ALLOW_FIXTURE_PROVIDER,
  HEADLINE_FLOW_PROVIDER: env.HEADLINE_FLOW_PROVIDER,
  HEADLINE_FLOW_MIN_READY_STORIES: env.HEADLINE_FLOW_MIN_READY_STORIES,
  HEADLINE_FLOW_MIN_READY_TOPICS: env.HEADLINE_FLOW_MIN_READY_TOPICS,
};

function feed(topics: HeadlineFlowTopic[], providerId = "rss"): HeadlineFlowFeed {
  const stories: StoryPackage[] = topics.map((topic, index) => ({
    id: `story_${index}`,
    eventId: `event_${index}`,
    headline: `${topic} headline`,
    shortSummary: `${topic} summary`,
    narration: `${topic} narration`,
    topic,
    importance: "important",
    confidence: "single_source",
    status: "developing",
    sourceSummary: "Example Source",
    sourceCount: 1,
    sources: [{ id: `source_${index}`, name: "Example Source", url: "https://example.com" }],
    publishedAt: "2026-08-27T03:00:00.000Z",
    updatedAt: "2026-08-27T03:00:00.000Z",
    displayMetadata: {
      rankingReason: "Readiness fixture.",
      briefingScore: 50,
      prioritySignals: [],
      personalizationReason: null,
      rankingAudit: {
        baseScore: 50,
        personalizationBoost: 0,
        finalScore: 50,
        originalRank: index + 1,
        personalizedRank: index + 1,
      },
      whyItMatters: "This story is part of a readiness fixture.",
      articleCount: 1,
      heroImageUrl: null,
    },
  }));

  return {
    generatedAt: "2026-08-27T03:00:00.000Z",
    providerId,
    stories,
    diagnostics: {
      receivedArticles: stories.length,
      acceptedArticles: stories.length,
      rejectedArticles: 0,
      duplicateArticles: 0,
      storyCount: stories.length,
      rejections: [],
    },
  };
}

describe("headline flow readiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHeadlineFlowFeedHealthForTests();
    env.NODE_ENV = "production";
    env.OPENAI_API_KEY = "test-key";
    env.HEADLINE_FLOW_ALLOW_FIXTURE_PROVIDER = "false";
    env.HEADLINE_FLOW_PROVIDER = "rss";
    env.HEADLINE_FLOW_MIN_READY_STORIES = "3";
    env.HEADLINE_FLOW_MIN_READY_TOPICS = "3";
  });

  afterEach(() => {
    resetHeadlineFlowFeedHealthForTests();
    env.NODE_ENV = originalEnv.NODE_ENV;
    env.OPENAI_API_KEY = originalEnv.OPENAI_API_KEY;
    env.HEADLINE_FLOW_ALLOW_FIXTURE_PROVIDER = originalEnv.HEADLINE_FLOW_ALLOW_FIXTURE_PROVIDER;
    env.HEADLINE_FLOW_PROVIDER = originalEnv.HEADLINE_FLOW_PROVIDER;
    env.HEADLINE_FLOW_MIN_READY_STORIES = originalEnv.HEADLINE_FLOW_MIN_READY_STORIES;
    env.HEADLINE_FLOW_MIN_READY_TOPICS = originalEnv.HEADLINE_FLOW_MIN_READY_TOPICS;
  });

  it("reports ready when live search is configured and feed quality is healthy", () => {
    recordHeadlineFlowFeedSuccess(feed(["world", "politics", "business"]));

    expect(getHeadlineFlowReadiness()).toMatchObject({
      status: "ready",
      checks: {
        rss: { ok: true, status: "available" },
        webSearch: { ok: true, status: "configured" },
        fixtureFallback: { ok: false, status: "disabled" },
        feed: {
          status: "healthy",
          productionReady: true,
        },
      },
      warnings: [],
      blockers: [],
    });
  });

  it("does not warn when RSS mode is live and optional web search is missing", () => {
    env.NODE_ENV = "development";
    env.OPENAI_API_KEY = "";
    recordHeadlineFlowFeedSuccess(feed(["world", "politics", "business"]));

    const readiness = getHeadlineFlowReadiness();

    expect(readiness).toMatchObject({
      status: "ready",
      checks: {
        webSearch: { ok: false, status: "missing_configuration" },
        fixtureFallback: { ok: false, status: "disabled" },
      },
    });
    expect(readiness.warnings).toEqual([]);
    expect(readiness.blockers).toEqual([]);
  });

  it("fails production readiness when auto mode expects web search and feed quality is thin", () => {
    env.OPENAI_API_KEY = "";
    env.HEADLINE_FLOW_PROVIDER = "auto";

    const readiness = getHeadlineFlowReadiness();

    expect(readiness.status).toBe("not_ready");
    expect(readiness.blockers).toContainEqual(expect.objectContaining({ code: "web_search_missing" }));
  });

  it("returns authenticated readiness from the route", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    recordHeadlineFlowFeedSuccess(feed(["world", "politics", "business"]));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.workspaceId).toBe("workspace_1");
    expect(payload.data.readiness.status).toBe("ready");
  });

  it("requires authentication for route access", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("unauthorized");
  });
});
