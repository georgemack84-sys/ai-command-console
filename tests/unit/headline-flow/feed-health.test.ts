import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { env } from "@/src/config/env";
import { getHeadlineFlowFeedHealth, recordHeadlineFlowFeedFailure, recordHeadlineFlowFeedSuccess, resetHeadlineFlowFeedHealthForTests } from "@/src/server/headline-flow/application/feed-health";
import type { HeadlineFlowFeed, HeadlineFlowTopic, StoryPackage } from "@/src/server/headline-flow/domain/types";

const originalEnv = {
  NODE_ENV: env.NODE_ENV,
  HEADLINE_FLOW_MIN_READY_STORIES: env.HEADLINE_FLOW_MIN_READY_STORIES,
  HEADLINE_FLOW_MIN_READY_TOPICS: env.HEADLINE_FLOW_MIN_READY_TOPICS,
  HEADLINE_FLOW_STALE_CACHE_MAX_AGE_MS: env.HEADLINE_FLOW_STALE_CACHE_MAX_AGE_MS,
  HEADLINE_FLOW_FEED_CACHE_TTL_MS: env.HEADLINE_FLOW_FEED_CACHE_TTL_MS,
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

describe("headline flow feed health", () => {
  beforeEach(() => {
    resetHeadlineFlowFeedHealthForTests();
    env.NODE_ENV = "production";
    env.HEADLINE_FLOW_MIN_READY_STORIES = "3";
    env.HEADLINE_FLOW_MIN_READY_TOPICS = "3";
    env.HEADLINE_FLOW_FEED_CACHE_TTL_MS = "120000";
    env.HEADLINE_FLOW_STALE_CACHE_MAX_AGE_MS = "600000";
  });

  afterEach(() => {
    resetHeadlineFlowFeedHealthForTests();
    env.NODE_ENV = originalEnv.NODE_ENV;
    env.HEADLINE_FLOW_MIN_READY_STORIES = originalEnv.HEADLINE_FLOW_MIN_READY_STORIES;
    env.HEADLINE_FLOW_MIN_READY_TOPICS = originalEnv.HEADLINE_FLOW_MIN_READY_TOPICS;
    env.HEADLINE_FLOW_FEED_CACHE_TTL_MS = originalEnv.HEADLINE_FLOW_FEED_CACHE_TTL_MS;
    env.HEADLINE_FLOW_STALE_CACHE_MAX_AGE_MS = originalEnv.HEADLINE_FLOW_STALE_CACHE_MAX_AGE_MS;
  });

  it("starts as not_started before a feed has been built", () => {
    expect(getHeadlineFlowFeedHealth()).toMatchObject({
      status: "not_started",
      productionReady: false,
    });
  });

  it("marks broad fresh live feeds healthy", () => {
    recordHeadlineFlowFeedSuccess(feed(["world", "politics", "business"]));

    expect(getHeadlineFlowFeedHealth()).toMatchObject({
      status: "healthy",
      providerId: "rss",
      storyCount: 3,
      topicCount: 3,
      fixtureBacked: false,
      productionReady: true,
    });
  });

  it("degrades production health for fixture-backed feeds", () => {
    recordHeadlineFlowFeedSuccess(feed(["world", "politics", "business"], "fixture"));

    expect(getHeadlineFlowFeedHealth()).toMatchObject({
      status: "degraded",
      fixtureBacked: true,
      productionReady: false,
    });
  });

  it("records provider failures without discarding the last successful snapshot", () => {
    recordHeadlineFlowFeedSuccess(feed(["world", "politics", "business"]));
    recordHeadlineFlowFeedFailure(new Error("rss_fetch_failed_503"));

    expect(getHeadlineFlowFeedHealth()).toMatchObject({
      status: "healthy",
      lastFailureMessage: "rss_fetch_failed_503",
      productionReady: true,
    });
  });
});
