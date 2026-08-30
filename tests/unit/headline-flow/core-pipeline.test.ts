import { describe, expect, it } from "vitest";
import { buildHeadlineFlowFeed } from "@/src/server/headline-flow/application/build-feed";
import { canonicalizeArticleUrl } from "@/src/server/headline-flow/domain/url";
import type { ArticleCandidate } from "@/src/server/headline-flow/domain/types";
import { InMemoryHeadlineFlowEventRegistryRepository } from "@/src/server/headline-flow/event-registry/event-registry-service";
import { FixtureNewsProvider } from "@/src/server/headline-flow/providers/fixture-news-provider";

const NOW = new Date("2026-08-27T03:00:00.000Z");

describe("headline flow core pipeline", () => {
  it("turns fixture provider articles into story packages with diagnostics", async () => {
    const feed = await buildHeadlineFlowFeed({
      provider: new FixtureNewsProvider(),
      now: NOW,
    });

    expect(feed).toMatchObject({
      generatedAt: NOW.toISOString(),
      providerId: "fixture",
      diagnostics: {
        receivedArticles: 5,
        acceptedArticles: 4,
        rejectedArticles: 1,
        duplicateArticles: 1,
        storyCount: 2,
      },
    });
    expect(feed.stories.map((story) => story.headline)).toEqual([
      "City approves overnight cooling centers",
      "Chipmaker shares rise after earnings forecast",
    ]);
    expect(feed.stories[0]).toMatchObject({
      topic: "health",
      confidence: "multi_source",
      status: "confirmed",
      sourceCount: 2,
      displayMetadata: {
        articleCount: 2,
        briefingScore: expect.any(Number),
        prioritySignals: expect.arrayContaining(["2 independent sources"]),
        whyItMatters: expect.stringContaining("2 sources are converging"),
        heroImageUrl: "https://fixture.example.com/images/cooling.jpg",
        imageProvenance: {
          status: "article",
          sourceName: "Fixture Times",
          articleUrl: "https://fixture.example.com/city-cooling-centers",
          imageUrl: "https://fixture.example.com/images/cooling.jpg",
        },
        sourceTrail: expect.arrayContaining([
          expect.objectContaining({
            sourceName: "Fixture Times",
            articleUrl: "https://fixture.example.com/city-cooling-centers",
            providerId: "fixture",
            imageUrl: "https://fixture.example.com/images/cooling.jpg",
          }),
        ]),
      },
    });
    expect(feed.diagnostics.rejections[0]).toMatchObject({
      providerId: "fixture",
      reason: "missing_title",
    });
  });

  it("filters fixture articles by topic before packaging", async () => {
    const feed = await buildHeadlineFlowFeed({
      provider: new FixtureNewsProvider(),
      now: NOW,
      topic: "technology",
    });

    expect(feed.diagnostics.receivedArticles).toBe(1);
    expect(feed.stories).toHaveLength(1);
    expect(feed.stories[0]?.headline).toBe("Chipmaker shares rise after earnings forecast");
    expect(feed.stories[0]?.topic).toBe("business");
  });

  it("keeps feed size bounded by limit", async () => {
    const feed = await buildHeadlineFlowFeed({
      provider: new FixtureNewsProvider(),
      now: NOW,
      limit: 1,
    });

    expect(feed.stories).toHaveLength(1);
    expect(feed.stories[0]?.headline).toBe("City approves overnight cooling centers");
  });

  it("prioritizes stronger story packages over slightly newer single-source updates", async () => {
    const articles: ArticleCandidate[] = [
      {
        providerId: "fixture",
        providerArticleId: "newer-1",
        sourceName: "Fast Wire",
        sourceUrl: "https://fast-wire.example.com",
        title: "Single source update just landed",
        description: "A newer but thinner current-event update.",
        canonicalUrl: "https://fast-wire.example.com/single-source-update-just-landed",
        publishedAt: "2026-08-27T02:55:00.000Z",
        topics: ["general"],
      },
      {
        providerId: "fixture",
        providerArticleId: "confirmed-1",
        sourceName: "Metro Wire",
        sourceUrl: "https://metro-wire.example.com",
        title: "Confirmed transit disruption affects downtown",
        description: "A confirmed disruption with multiple reports.",
        canonicalUrl: "https://metro-wire.example.com/confirmed-transit-disruption-affects-downtown",
        imageUrl: "https://metro-wire.example.com/images/transit.jpg",
        publishedAt: "2026-08-27T02:20:00.000Z",
        topics: ["general"],
      },
      {
        providerId: "fixture",
        providerArticleId: "confirmed-2",
        sourceName: "City Desk",
        sourceUrl: "https://city-desk.example.com",
        title: "Confirmed transit disruption affects downtown",
        description: "City Desk confirms the same disruption.",
        canonicalUrl: "https://city-desk.example.com/confirmed-transit-disruption-affects-downtown",
        publishedAt: "2026-08-27T02:25:00.000Z",
        topics: ["general"],
      },
    ];

    const feed = await buildHeadlineFlowFeed({
      provider: new FixtureNewsProvider(articles),
      now: NOW,
    });

    expect(feed.stories.map((story) => story.headline)).toEqual([
      "Confirmed transit disruption affects downtown",
      "Single source update just landed",
    ]);
    expect(feed.stories[0]).toMatchObject({
      confidence: "multi_source",
      sourceCount: 2,
      displayMetadata: {
        briefingScore: expect.any(Number),
        prioritySignals: expect.arrayContaining(["2 independent sources", "Article media available"]),
        heroImageUrl: "https://metro-wire.example.com/images/transit.jpg",
      },
    });
  });

  it("boosts fresh current events over older single-source items inside the 48-hour window", async () => {
    const articles: ArticleCandidate[] = [
      {
        providerId: "fixture",
        providerArticleId: "older-authority-1",
        sourceName: "Associated Press",
        sourceUrl: "https://ap.example.com",
        title: "Older market update remains inside the window",
        description: "A valid but older market update is still inside the forty eight hour window.",
        canonicalUrl: "https://ap.example.com/older-market-update-remains-inside-window",
        publishedAt: "2026-08-25T18:30:00.000Z",
        topics: ["business"],
      },
      {
        providerId: "fixture",
        providerArticleId: "fresh-local-1",
        sourceName: "Local Wire",
        sourceUrl: "https://local-wire.example.com",
        title: "New emergency transit outage affects commuters",
        description: "Officials reported a new emergency outage affecting downtown commuters.",
        canonicalUrl: "https://local-wire.example.com/new-emergency-transit-outage-affects-commuters",
        publishedAt: "2026-08-27T02:45:00.000Z",
        topics: ["general"],
      },
    ];

    const feed = await buildHeadlineFlowFeed({
      provider: new FixtureNewsProvider(articles),
      now: NOW,
    });

    expect(feed.stories.map((story) => story.headline)).toEqual([
      "New emergency transit outage affects commuters",
      "Older market update remains inside the window",
    ]);
    expect(feed.stories[0]?.displayMetadata).toMatchObject({
      freshness: {
        bucket: "live",
        label: "Live",
        ageMinutes: 15,
      },
      prioritySignals: expect.arrayContaining(["Live current event", "High-impact current event"]),
    });
    expect(feed.stories[1]?.displayMetadata.freshness).toMatchObject({
      bucket: "past_48h",
      label: "Past 48h",
    });
  });

  it("boosts stories that match saved event topic preferences", async () => {
    const articles: ArticleCandidate[] = [
      {
        providerId: "fixture",
        providerArticleId: "politics-1",
        sourceName: "Local Wire",
        sourceUrl: "https://local-wire.example.com",
        title: "City council schedules routine budget hearing",
        description: "Officials scheduled a budget hearing for next week.",
        canonicalUrl: "https://local-wire.example.com/city-council-schedules-routine-budget-hearing",
        publishedAt: "2026-08-27T02:50:00.000Z",
        topics: ["politics"],
      },
      {
        providerId: "fixture",
        providerArticleId: "technology-1",
        sourceName: "Local Wire",
        sourceUrl: "https://local-wire.example.com",
        title: "Startup tests battery monitoring platform",
        description: "A local startup is testing a battery monitoring platform.",
        canonicalUrl: "https://local-wire.example.com/startup-tests-battery-monitoring-platform",
        publishedAt: "2026-08-27T02:20:00.000Z",
        topics: ["technology"],
      },
    ];

    const feed = await buildHeadlineFlowFeed({
      provider: new FixtureNewsProvider(articles),
      now: NOW,
      preferenceProfile: {
        topicWeights: {
          technology: 8,
        },
      },
    });

    expect(feed.stories.map((story) => story.topic)).toEqual(["technology", "politics"]);
    expect(feed.stories[0]?.displayMetadata).toMatchObject({
      personalizationReason: "Saved technology events boosted this story.",
      rankingAudit: {
        personalizationBoost: 8,
        originalRank: 2,
        personalizedRank: 1,
      },
      prioritySignals: expect.arrayContaining(["Personalized match"]),
    });
    expect(feed.diagnostics.personalization).toMatchObject({
      status: "applied",
      savedEventCount: 0,
      topicWeights: {
        technology: 8,
      },
      interactionEventCount: 0,
      interactionTopicWeights: {},
      mutedTopicWeights: {},
      boostedStories: 1,
      penalizedStories: 0,
      reorderedStories: 2,
    });
  });

  it("boosts stories from recent interaction topic weights", async () => {
    const articles: ArticleCandidate[] = [
      {
        providerId: "fixture",
        providerArticleId: "politics-1",
        sourceName: "Local Wire",
        sourceUrl: "https://local-wire.example.com",
        title: "City council schedules routine budget hearing",
        description: "Officials scheduled a budget hearing for next week.",
        canonicalUrl: "https://local-wire.example.com/city-council-schedules-routine-budget-hearing",
        publishedAt: "2026-08-27T02:50:00.000Z",
        topics: ["politics"],
      },
      {
        providerId: "fixture",
        providerArticleId: "science-1",
        sourceName: "Science Wire",
        sourceUrl: "https://science-wire.example.com",
        title: "Researchers publish new coastal sensor results",
        description: "A research team published updated coastal sensor results.",
        canonicalUrl: "https://science-wire.example.com/researchers-publish-new-coastal-sensor-results",
        publishedAt: "2026-08-27T02:20:00.000Z",
        topics: ["science"],
      },
    ];

    const feed = await buildHeadlineFlowFeed({
      provider: new FixtureNewsProvider(articles),
      now: NOW,
      preferenceProfile: {
        interactionEventCount: 4,
        interactionTopicWeights: {
          science: 6,
        },
      },
    });

    expect(feed.stories.map((story) => story.topic)).toEqual(["science", "politics"]);
    expect(feed.stories[0]?.displayMetadata).toMatchObject({
      personalizationReason: "Recent science interactions boosted this story.",
      rankingAudit: {
        personalizationBoost: 6,
        originalRank: 2,
        personalizedRank: 1,
      },
      prioritySignals: expect.arrayContaining(["Personalized match"]),
    });
    expect(feed.diagnostics.personalization).toMatchObject({
      status: "applied",
      interactionEventCount: 4,
      interactionTopicWeights: {
        science: 6,
      },
      boostedStories: 1,
      reorderedStories: 2,
    });
  });

  it("penalizes stories from muted interaction topic weights", async () => {
    const articles: ArticleCandidate[] = [
      {
        providerId: "fixture",
        providerArticleId: "sports-1",
        sourceName: "Sports Wire",
        sourceUrl: "https://sports-wire.example.com",
        title: "Club announces routine training update",
        description: "Breaking emergency schedule change prompts a major league response.",
        canonicalUrl: "https://sports-wire.example.com/club-announces-routine-training-update",
        publishedAt: "2026-08-27T02:50:00.000Z",
        topics: ["sports"],
      },
      {
        providerId: "fixture",
        providerArticleId: "business-1",
        sourceName: "Market Wire",
        sourceUrl: "https://market-wire.example.com",
        title: "Regional bank reports lending growth",
        description: "A regional bank reported lending growth.",
        canonicalUrl: "https://market-wire.example.com/regional-bank-reports-lending-growth",
        publishedAt: "2026-08-27T02:20:00.000Z",
        topics: ["business"],
      },
    ];

    const feed = await buildHeadlineFlowFeed({
      provider: new FixtureNewsProvider(articles),
      now: NOW,
      preferenceProfile: {
        interactionEventCount: 2,
        mutedTopicWeights: {
          sports: 18,
        },
      },
    });

    expect(feed.stories.map((story) => story.topic)).toEqual(["business", "sports"]);
    expect(feed.stories[1]?.displayMetadata).toMatchObject({
      personalizationReason: "Muted sports interactions reduced this story.",
      rankingAudit: {
        personalizationBoost: -18,
        originalRank: 1,
        personalizedRank: 2,
      },
    });
    expect(feed.diagnostics.personalization).toMatchObject({
      status: "applied",
      mutedTopicWeights: {
        sports: 18,
      },
      penalizedStories: 1,
      reorderedStories: 2,
    });
  });

  it("clusters matching event headlines even when wording differs", async () => {
    const articles: ArticleCandidate[] = [
      {
        providerId: "fixture",
        providerArticleId: "cluster-1",
        sourceName: "NPR",
        sourceUrl: "https://npr.example.com",
        title: "Senate advances bipartisan infrastructure bill",
        description: "Lawmakers moved the infrastructure bill forward.",
        canonicalUrl: "https://npr.example.com/senate-advances-bipartisan-infrastructure-bill",
        publishedAt: "2026-08-27T02:10:00.000Z",
        topics: ["politics"],
      },
      {
        providerId: "fixture",
        providerArticleId: "cluster-2",
        sourceName: "Regional Ledger",
        sourceUrl: "https://regional-ledger.example.com",
        title: "Bipartisan infrastructure bill advances in Senate",
        description: "The Senate advanced the measure after negotiations.",
        canonicalUrl: "https://regional-ledger.example.com/bipartisan-infrastructure-bill-advances-senate",
        publishedAt: "2026-08-27T02:20:00.000Z",
        topics: ["politics"],
      },
    ];

    const feed = await buildHeadlineFlowFeed({
      provider: new FixtureNewsProvider(articles),
      now: NOW,
    });

    expect(feed.stories).toHaveLength(1);
    expect(feed.stories[0]).toMatchObject({
      headline: "Senate advances bipartisan infrastructure bill",
      importance: "important",
      confidence: "multi_source",
      sourceCount: 2,
      displayMetadata: {
        articleCount: 2,
      },
    });
    expect(feed.stories[0]?.displayMetadata.rankingReason).toContain("2 sources");
    expect(feed.stories[0]?.displayMetadata.rankingReason).toContain("impact signals: bill");
    expect(feed.stories[0]?.displayMetadata.prioritySignals).toContain("High-impact current event");
    expect(feed.stories[0]?.displayMetadata.whyItMatters).toContain("policy direction");
  });

  it("labels breaking impact stories from headline signals", async () => {
    const articles: ArticleCandidate[] = [
      {
        providerId: "fixture",
        providerArticleId: "breaking-1",
        sourceName: "Fast Wire",
        sourceUrl: "https://fast-wire.example.com",
        title: "Breaking wildfire prompts evacuation order",
        description: "Officials issued an emergency evacuation order.",
        canonicalUrl: "https://fast-wire.example.com/breaking-wildfire-prompts-evacuation-order",
        publishedAt: "2026-08-27T02:50:00.000Z",
        topics: ["general"],
      },
    ];

    const feed = await buildHeadlineFlowFeed({
      provider: new FixtureNewsProvider(articles),
      now: NOW,
    });

    expect(feed.stories[0]).toMatchObject({
      importance: "breaking",
      displayMetadata: {
        briefingScore: expect.any(Number),
        prioritySignals: expect.arrayContaining(["Breaking impact terms detected", "Developing story to monitor"]),
        rankingReason: "Recent reporting from Fast Wire; impact signals: emergency, evacuation.",
      },
    });
  });

  it("canonicalizes article URLs for stable deduplication", () => {
    expect(canonicalizeArticleUrl("HTTPS://Fixture.Example.com/story/?utm_source=test&keep=1#section")).toBe(
      "https://fixture.example.com/story?keep=1",
    );
  });

  it("maps story packages to durable event ids when the event registry is enabled", async () => {
    const repository = new InMemoryHeadlineFlowEventRegistryRepository();

    const feed = await buildHeadlineFlowFeed({
      provider: new FixtureNewsProvider(),
      now: NOW,
      limit: 1,
      eventRegistry: {
        workspaceId: "workspace_demo",
        repository,
      },
    });

    expect(feed.stories[0]?.eventId).toMatch(/^hfe_/);
    expect(feed.stories[0]?.eventId).not.toBe(feed.stories[0]?.id);
    expect(feed.diagnostics.eventRegistry).toMatchObject({
      status: "updated",
      createdEvents: 1,
      updatedEvents: 0,
      unchangedEvents: 0,
      mappedStories: 1,
      error: null,
    });
  });

  it("keeps serving feed packages when optional event registry persistence is unavailable", async () => {
    const feed = await buildHeadlineFlowFeed({
      provider: new FixtureNewsProvider(),
      now: NOW,
      limit: 1,
      eventRegistry: {
        workspaceId: "workspace_demo",
        timeoutMs: 10,
        repository: {
          findByIdForWorkspace: async () => null,
          listByWorkspace: () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
          upsert: async (event) => event,
        },
      },
    });

    expect(feed.stories).toHaveLength(1);
    expect(feed.diagnostics.eventRegistry).toMatchObject({
      status: "unavailable",
      createdEvents: 0,
      updatedEvents: 0,
      unchangedEvents: 0,
      mappedStories: 0,
      error: "event_registry_timeout_10ms",
    });
  });

  it("filters hidden event preferences from the active feed", async () => {
    const registry = new InMemoryHeadlineFlowEventRegistryRepository();
    const feed = await buildHeadlineFlowFeed({
      provider: new FixtureNewsProvider(),
      now: NOW,
      eventRegistry: {
        workspaceId: "workspace_demo",
        repository: registry,
      },
      eventPreferences: {
        workspaceId: "workspace_demo",
        userId: "user_demo",
        repository: {
          findPreference: async () => null,
          listPreferences: async ({ eventIds }) =>
            new Map([
              [
                eventIds[1]!,
                {
                  id: "preference_1",
                  workspaceId: "workspace_demo",
                  userId: "user_demo",
                  eventId: eventIds[1]!,
                  savedAt: null,
                  mutedAt: NOW.toISOString(),
                  resolvedAt: null,
                  restoredAt: null,
                  createdAt: NOW.toISOString(),
                  updatedAt: NOW.toISOString(),
                },
              ],
            ]),
          listHiddenEventIds: async ({ eventIds }) => new Set([eventIds[1]!]),
          listUserPreferences: async () => [],
          applyAction: async () => {
            throw new Error("not used");
          },
        },
      },
    });

    expect(feed.stories).toHaveLength(1);
    expect(feed.stories[0]?.headline).toBe("City approves overnight cooling centers");
    expect(feed.diagnostics.eventRegistry).toMatchObject({
      hiddenEvents: 1,
      mappedStories: 2,
    });
  });
});
