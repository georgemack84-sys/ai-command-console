import { describe, expect, it } from "vitest";
import {
  InMemoryHeadlineFlowEventRegistryRepository,
  ingestHeadlineFlowStoriesIntoEventRegistry,
  ingestStoryPackagesIntoEventRegistry,
} from "@/src/server/headline-flow/event-registry/event-registry-service";
import type { CanonicalStory, StoryPackage } from "@/src/server/headline-flow/domain/types";

const NOW = new Date("2026-08-29T12:00:00.000Z");
const LATER = new Date("2026-08-29T13:00:00.000Z");

function story(overrides: Partial<StoryPackage> = {}): StoryPackage {
  return {
    id: "package_story_1",
    eventId: "story_1",
    headline: "Senate advances bipartisan infrastructure bill",
    shortSummary: "Lawmakers moved the infrastructure bill forward after negotiations.",
    narration: "Senate advances bipartisan infrastructure bill. Lawmakers moved the infrastructure bill forward.",
    topic: "politics",
    importance: "important",
    confidence: "single_source",
    status: "developing",
    sourceSummary: "NPR",
    sourceCount: 1,
    sources: [
      {
        id: "source_npr",
        name: "NPR",
        url: "https://npr.example.com/senate-advances-bipartisan-infrastructure-bill",
      },
    ],
    publishedAt: "2026-08-29T11:30:00.000Z",
    updatedAt: "2026-08-29T11:45:00.000Z",
    displayMetadata: {
      rankingReason: "Recent reporting from NPR; impact signals: bill.",
      briefingScore: 50,
      prioritySignals: ["High-impact current event"],
      personalizationReason: null,
      rankingAudit: {
        baseScore: 50,
        personalizationBoost: 0,
        finalScore: 50,
        originalRank: 1,
        personalizedRank: 1,
      },
      whyItMatters: "NPR is reporting a developing event. It can shift policy direction.",
      articleCount: 1,
      heroImageUrl: null,
    },
    ...overrides,
  };
}

describe("headline flow event registry", () => {
  it("creates event records from story packages", async () => {
    const repository = new InMemoryHeadlineFlowEventRegistryRepository();

    const result = await ingestStoryPackagesIntoEventRegistry({
      workspaceId: "workspace_demo",
      repository,
      stories: [story()],
      now: NOW,
    });

    expect(result.created).toHaveLength(1);
    expect(result.updated).toHaveLength(0);
    expect(result.packageEvents).toEqual([
      {
        storyPackageId: "package_story_1",
        eventId: result.created[0]?.id,
        eventVersion: 1,
        eventStatus: "new",
        updateReasons: ["new_evidence"],
        updateSummary: "1 new article added to this event.",
      },
    ]);
    expect(result.created[0]).toMatchObject({
      workspaceId: "workspace_demo",
      title: "Senate advances bipartisan infrastructure bill",
      topic: "politics",
      status: "new",
      version: 1,
      updateSummary: "1 new article added to this event.",
      updateReasons: ["new_evidence"],
      sourceCount: 1,
      articleCount: 1,
      firstDetectedAt: NOW.toISOString(),
      lastMeaningfulUpdateAt: NOW.toISOString(),
    });
    expect(result.created[0]?.evidence[0]).toMatchObject({
      sourceName: "NPR",
      articleUrl: "https://npr.example.com/senate-advances-bipartisan-infrastructure-bill",
    });
  });

  it("merges related updates into the same event", async () => {
    const repository = new InMemoryHeadlineFlowEventRegistryRepository();
    await ingestStoryPackagesIntoEventRegistry({
      workspaceId: "workspace_demo",
      repository,
      stories: [story()],
      now: NOW,
    });

    const result = await ingestStoryPackagesIntoEventRegistry({
      workspaceId: "workspace_demo",
      repository,
      stories: [
        story({
          id: "package_story_2",
          eventId: "story_2",
          headline: "Bipartisan infrastructure bill advances in Senate",
          shortSummary: "A second outlet reports the bill advanced after negotiations.",
          confidence: "multi_source",
          sources: [
            {
              id: "source_regional",
              name: "Regional Ledger",
              url: "https://regional-ledger.example.com/bipartisan-infrastructure-bill-advances-senate",
            },
          ],
        }),
      ],
      now: LATER,
    });

    expect(result.created).toHaveLength(0);
    expect(result.updated).toHaveLength(1);
    expect(result.packageEvents).toEqual([
      {
        storyPackageId: "package_story_2",
        eventId: result.updated[0]?.id,
        eventVersion: 2,
        eventStatus: "updated",
        updateReasons: ["source_corroboration", "lead_angle_changed"],
        updateSummary: "Lead angle changed with 1 new source corroborating the story.",
      },
    ]);
    expect(result.updated[0]).toMatchObject({
      title: "Bipartisan infrastructure bill advances in Senate",
      status: "updated",
      version: 2,
      updateSummary: "Lead angle changed with 1 new source corroborating the story.",
      updateReasons: ["source_corroboration", "lead_angle_changed"],
      confidence: "multi_source",
      sourceCount: 2,
      articleCount: 2,
      lastMeaningfulUpdateAt: LATER.toISOString(),
    });
  });

  it("keeps duplicate evidence from creating extra versions", async () => {
    const repository = new InMemoryHeadlineFlowEventRegistryRepository();
    await ingestStoryPackagesIntoEventRegistry({
      workspaceId: "workspace_demo",
      repository,
      stories: [story()],
      now: NOW,
    });

    const result = await ingestStoryPackagesIntoEventRegistry({
      workspaceId: "workspace_demo",
      repository,
      stories: [story()],
      now: LATER,
    });

    expect(result.created).toHaveLength(0);
    expect(result.updated).toHaveLength(0);
    expect(result.unchanged).toHaveLength(1);
    expect(result.unchanged[0]).toMatchObject({
      version: 1,
      updateSummary: "No meaningful change since the previous event version.",
      updateReasons: ["duplicate", "stale"],
      articleCount: 1,
      lastMeaningfulUpdateAt: NOW.toISOString(),
      lastUpdatedAt: LATER.toISOString(),
    });
  });

  it("keeps unrelated stories as separate events", async () => {
    const repository = new InMemoryHeadlineFlowEventRegistryRepository();

    const result = await ingestStoryPackagesIntoEventRegistry({
      workspaceId: "workspace_demo",
      repository,
      stories: [
        story(),
        story({
          id: "package_story_3",
          eventId: "story_3",
          headline: "Governor signs emergency wildfire funding package",
          shortSummary: "State officials approved emergency wildfire funding.",
          topic: "general",
          sources: [
            {
              id: "source_ap",
              name: "AP News",
              url: "https://ap.example.com/governor-signs-emergency-wildfire-funding-package",
            },
          ],
        }),
      ],
      now: NOW,
    });

    expect(result.created).toHaveLength(2);
    expect(result.events.map((event) => event.title).sort()).toEqual([
      "Governor signs emergency wildfire funding package",
      "Senate advances bipartisan infrastructure bill",
    ]);
  });

  it("stores canonical article metadata as event evidence", async () => {
    const repository = new InMemoryHeadlineFlowEventRegistryRepository();
    const canonicalStory: CanonicalStory = {
      id: "story_1",
      headline: "Senate advances bipartisan infrastructure bill",
      summary: "Lawmakers moved the infrastructure bill forward.",
      topic: "politics",
      status: "developing",
      importance: "important",
      confidence: "single_source",
      firstPublishedAt: new Date("2026-08-29T11:30:00.000Z"),
      lastPublishedAt: new Date("2026-08-29T11:30:00.000Z"),
      rankingReason: "Recent reporting from NPR.",
      articles: [
        {
          id: "article_npr_1",
          providerId: "rss",
          providerArticleId: "rss-article-1",
          source: {
            id: "source_npr",
            name: "NPR",
            providerId: "rss",
            sourceType: "news_outlet",
            url: "https://npr.example.com",
          },
          title: "Senate advances bipartisan infrastructure bill",
          description: "Lawmakers moved the infrastructure bill forward.",
          canonicalUrl: "https://npr.example.com/senate-advances-bipartisan-infrastructure-bill",
          imageUrl: "https://npr.example.com/infrastructure.jpg",
          author: "Reporter One",
          publishedAt: new Date("2026-08-29T11:30:00.000Z"),
          retrievedAt: new Date("2026-08-29T11:35:00.000Z"),
          topics: ["politics"],
          fingerprint: "fingerprint_npr_1",
          rawReference: null,
        },
      ],
    };

    const result = await ingestHeadlineFlowStoriesIntoEventRegistry({
      workspaceId: "workspace_demo",
      repository,
      stories: [{ storyPackage: story(), canonicalStory }],
      now: NOW,
    });

    expect(result.created[0]?.evidence[0]).toMatchObject({
      articleId: "article_npr_1",
      providerId: "rss",
      providerArticleId: "rss-article-1",
      articleFingerprint: "fingerprint_npr_1",
      author: "Reporter One",
      imageUrl: "https://npr.example.com/infrastructure.jpg",
      retrievedAt: "2026-08-29T11:35:00.000Z",
      updateReason: "new_evidence",
    });
  });

  it("marks dormant events as resolved after the active event window", async () => {
    const repository = new InMemoryHeadlineFlowEventRegistryRepository();
    await ingestStoryPackagesIntoEventRegistry({
      workspaceId: "workspace_demo",
      repository,
      stories: [story()],
      now: NOW,
    });

    const result = await ingestStoryPackagesIntoEventRegistry({
      workspaceId: "workspace_demo",
      repository,
      stories: [
        story({
          id: "package_story_4",
          eventId: "story_4",
          headline: "Governor signs emergency wildfire funding package",
          shortSummary: "State officials approved emergency wildfire funding.",
          topic: "general",
          sources: [
            {
              id: "source_ap",
              name: "AP News",
              url: "https://ap.example.com/governor-signs-emergency-wildfire-funding-package",
            },
          ],
        }),
      ],
      now: new Date("2026-08-31T13:00:00.000Z"),
    });

    expect(result.resolved).toHaveLength(1);
    expect(result.resolved[0]).toMatchObject({
      title: "Senate advances bipartisan infrastructure bill",
      status: "resolved",
      version: 2,
      updateReasons: ["stale"],
      updateSummary: "No current evidence appeared in the active briefing window.",
    });
  });
});
