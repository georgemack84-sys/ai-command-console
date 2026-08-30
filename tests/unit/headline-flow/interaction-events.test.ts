import { describe, expect, it, vi } from "vitest";
import { PrismaHeadlineFlowInteractionRepository } from "@/src/server/headline-flow/analytics/interaction-events";

const NOW = new Date("2026-08-29T12:00:00.000Z");

describe("headline flow interaction events", () => {
  it("records narrow interaction payloads", async () => {
    const client = {
      headlineFlowInteractionEvent: {
        create: vi.fn().mockResolvedValue({
          id: "interaction_1",
          workspaceId: "workspace_1",
          userId: "user_1",
          eventId: "hfe_1",
          storyId: "story_1",
          topic: "technology",
          action: "story_opened",
          providerId: "rss",
          sourceName: "Example Source",
          metadata: { selectedRank: 1 },
          occurredAt: NOW,
        }),
        deleteMany: vi.fn(),
        findMany: vi.fn(),
      },
    };
    const repository = new PrismaHeadlineFlowInteractionRepository(client as never);

    const event = await repository.record({
      workspaceId: "workspace_1",
      userId: "user_1",
      eventId: "hfe_1",
      storyId: "story_1",
      topic: "technology",
      action: "story_opened",
      providerId: "rss",
      sourceName: "Example Source",
      metadata: { selectedRank: 1 },
      occurredAt: NOW,
    });

    expect(client.headlineFlowInteractionEvent.create).toHaveBeenCalledWith({
      data: {
        workspaceId: "workspace_1",
        userId: "user_1",
        eventId: "hfe_1",
        storyId: "story_1",
        topic: "technology",
        action: "story_opened",
        providerId: "rss",
        sourceName: "Example Source",
        metadata: { selectedRank: 1 },
        occurredAt: NOW,
      },
    });
    expect(event).toMatchObject({
      action: "story_opened",
      topic: "technology",
      occurredAt: NOW.toISOString(),
    });
  });

  it("summarizes action and topic counts", async () => {
    const client = {
      headlineFlowInteractionEvent: {
        create: vi.fn(),
        deleteMany: vi.fn(),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "interaction_1",
            workspaceId: "workspace_1",
            userId: "user_1",
            eventId: "hfe_1",
            storyId: "story_1",
            topic: "technology",
            action: "story_opened",
            providerId: "rss",
            sourceName: "Example Source",
            metadata: null,
            occurredAt: NOW,
          },
          {
            id: "interaction_2",
            workspaceId: "workspace_1",
            userId: "user_1",
            eventId: "hfe_1",
            storyId: "story_1",
            topic: "technology",
            action: "source_opened",
            providerId: "rss",
            sourceName: "Example Source",
            metadata: null,
            occurredAt: NOW,
          },
          {
            id: "interaction_3",
            workspaceId: "workspace_1",
            userId: "user_1",
            eventId: "hfe_2",
            storyId: "story_2",
            topic: "health",
            action: "save",
            providerId: "rss",
            sourceName: "Example Source",
            metadata: null,
            occurredAt: NOW,
          },
        ]),
      },
    };
    const repository = new PrismaHeadlineFlowInteractionRepository(client as never);

    await expect(repository.summarize({ workspaceId: "workspace_1", userId: "user_1" })).resolves.toEqual({
      totalEvents: 3,
      actionCounts: {
        save: 1,
        source_opened: 1,
        story_opened: 1,
      },
      topicCounts: {
        health: 1,
        technology: 2,
      },
      savedTopicCounts: {
        health: 1,
      },
      mutedTopicCounts: {},
      sourceOpenRate: 1,
    });
  });

  it("keeps the interaction when a transient event id is not yet durable", async () => {
    const foreignKeyError = Object.create(Error.prototype, {
      code: { value: "P2003" },
    });
    const client = {
      headlineFlowInteractionEvent: {
        create: vi
          .fn()
          .mockRejectedValueOnce(foreignKeyError)
          .mockResolvedValue({
            id: "interaction_1",
            workspaceId: "workspace_1",
            userId: "user_1",
            eventId: null,
            storyId: "story_1",
            topic: "technology",
            action: "next_story",
            providerId: "rss",
            sourceName: "Example Source",
            metadata: null,
            occurredAt: NOW,
          }),
        deleteMany: vi.fn(),
        findMany: vi.fn(),
      },
    };
    const repository = new PrismaHeadlineFlowInteractionRepository(client as never);

    await expect(repository.record({
      workspaceId: "workspace_1",
      userId: "user_1",
      eventId: "story_transient",
      storyId: "story_1",
      topic: "technology",
      action: "next_story",
      providerId: "rss",
      sourceName: "Example Source",
      occurredAt: NOW,
    })).resolves.toMatchObject({
      eventId: null,
      action: "next_story",
    });
    expect(client.headlineFlowInteractionEvent.create).toHaveBeenLastCalledWith({
      data: expect.objectContaining({
        eventId: null,
        storyId: "story_1",
      }),
    });
  });

  it("prunes retained windows and returns 24h, 7d, and all-time summaries", async () => {
    const client = {
      headlineFlowInteractionEvent: {
        create: vi.fn(),
        deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
        findMany: vi
          .fn()
          .mockResolvedValueOnce([
            {
              id: "interaction_24h",
              workspaceId: "workspace_1",
              userId: "user_1",
              eventId: null,
              storyId: "story_1",
              topic: "technology",
              action: "story_opened",
              providerId: "rss",
              sourceName: "Example Source",
              metadata: null,
              occurredAt: NOW,
            },
          ])
          .mockResolvedValueOnce([
            {
              id: "interaction_7d",
              workspaceId: "workspace_1",
              userId: "user_1",
              eventId: null,
              storyId: "story_2",
              topic: "health",
              action: "save",
              providerId: "rss",
              sourceName: "Example Source",
              metadata: null,
              occurredAt: NOW,
            },
          ])
          .mockResolvedValueOnce([]),
      },
    };
    const repository = new PrismaHeadlineFlowInteractionRepository(client as never);

    const summary = await repository.summarizeWindows({
      workspaceId: "workspace_1",
      userId: "user_1",
      now: NOW,
      retentionDays: 90,
    });

    expect(client.headlineFlowInteractionEvent.deleteMany).toHaveBeenCalledWith({
      where: {
        workspaceId: "workspace_1",
        occurredAt: { lt: new Date("2026-05-31T12:00:00.000Z") },
      },
    });
    expect(summary).toMatchObject({
      retentionDays: 90,
      prunedEvents: 2,
      windows: {
        "24h": { totalEvents: 1, topicCounts: { technology: 1 } },
        "7d": { totalEvents: 1, savedTopicCounts: { health: 1 } },
        all: { totalEvents: 0 },
      },
    });
  });
});
