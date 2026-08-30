import { Prisma } from "@prisma/client";
import { prisma } from "@/src/server/db/prisma";
import type { HeadlineFlowTopic } from "@/src/server/headline-flow/domain/types";

export type HeadlineFlowInteractionAction =
  | "story_opened"
  | "source_opened"
  | "save"
  | "unsave"
  | "mute"
  | "unmute"
  | "resolve"
  | "restore"
  | "next_story"
  | "previous_story"
  | "topic_filter_selected";

type InteractionRow = {
  id: string;
  workspaceId: string;
  userId: string;
  eventId: string | null;
  storyId: string | null;
  topic: string | null;
  action: string;
  providerId: string | null;
  sourceName: string | null;
  metadata: Prisma.JsonValue | null;
  occurredAt: Date;
};

type InteractionClient = Prisma.TransactionClient & {
  headlineFlowInteractionEvent: {
    create(input: unknown): Promise<InteractionRow>;
    deleteMany(input: unknown): Promise<{ count: number }>;
    findMany(input: unknown): Promise<InteractionRow[]>;
  };
};

export type HeadlineFlowInteractionInput = {
  workspaceId: string;
  userId: string;
  action: HeadlineFlowInteractionAction;
  eventId?: string | null;
  storyId?: string | null;
  topic?: HeadlineFlowTopic | null;
  providerId?: string | null;
  sourceName?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
  occurredAt?: Date;
};

export type HeadlineFlowInteractionSummary = {
  totalEvents: number;
  actionCounts: Record<string, number>;
  topicCounts: Record<string, number>;
  savedTopicCounts: Record<string, number>;
  mutedTopicCounts: Record<string, number>;
  sourceOpenRate: number;
};

export type HeadlineFlowInteractionWindow = "24h" | "7d" | "all";

export type HeadlineFlowInteractionWindowedSummary = {
  retentionDays: number;
  prunedEvents: number;
  windows: Record<HeadlineFlowInteractionWindow, HeadlineFlowInteractionSummary>;
};

function mapRow(row: InteractionRow) {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    userId: row.userId,
    eventId: row.eventId,
    storyId: row.storyId,
    topic: row.topic as HeadlineFlowTopic | null,
    action: row.action as HeadlineFlowInteractionAction,
    providerId: row.providerId,
    sourceName: row.sourceName,
    metadata: row.metadata,
    occurredAt: row.occurredAt.toISOString(),
  };
}

function increment(counts: Record<string, number>, key: string | null) {
  if (!key) {
    return;
  }
  counts[key] = (counts[key] ?? 0) + 1;
}

function summarize(rows: InteractionRow[]): HeadlineFlowInteractionSummary {
  const actionCounts: Record<string, number> = {};
  const topicCounts: Record<string, number> = {};
  const savedTopicCounts: Record<string, number> = {};
  const mutedTopicCounts: Record<string, number> = {};

  for (const row of rows) {
    increment(actionCounts, row.action);
    increment(topicCounts, row.topic);
    if (row.action === "save") {
      increment(savedTopicCounts, row.topic);
    }
    if (row.action === "mute") {
      increment(mutedTopicCounts, row.topic);
    }
  }

  const openedStories = actionCounts.story_opened ?? 0;
  const openedSources = actionCounts.source_opened ?? 0;

  return {
    totalEvents: rows.length,
    actionCounts,
    topicCounts,
    savedTopicCounts,
    mutedTopicCounts,
    sourceOpenRate: openedStories > 0 ? Number((openedSources / openedStories).toFixed(2)) : 0,
  };
}

function isForeignKeyError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError || (
    error instanceof Error &&
    "code" in error &&
    error.code === "P2003"
  );
}

export class PrismaHeadlineFlowInteractionRepository {
  constructor(private readonly client: InteractionClient = prisma as unknown as InteractionClient) {}

  async record(input: HeadlineFlowInteractionInput) {
    const data = {
      workspaceId: input.workspaceId,
      userId: input.userId,
      eventId: input.eventId ?? null,
      storyId: input.storyId ?? null,
      topic: input.topic ?? null,
      action: input.action,
      providerId: input.providerId ?? null,
      sourceName: input.sourceName ?? null,
      metadata: input.metadata ?? Prisma.JsonNull,
      occurredAt: input.occurredAt ?? new Date(),
    };
    try {
      const row = await this.client.headlineFlowInteractionEvent.create({
        data,
      });
      return mapRow(row);
    } catch (error) {
      if (!isForeignKeyError(error) || !input.eventId) {
        throw error;
      }
      const row = await this.client.headlineFlowInteractionEvent.create({
        data: {
          ...data,
          eventId: null,
        },
      });
      return mapRow(row);
    }
  }

  async summarize(input: { workspaceId: string; userId: string; since?: Date }) {
    const rows = await this.client.headlineFlowInteractionEvent.findMany({
      where: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        ...(input.since ? { occurredAt: { gte: input.since } } : {}),
      },
      orderBy: { occurredAt: "desc" },
      take: 500,
    });
    return summarize(rows);
  }

  async prune(input: { workspaceId: string; before: Date }) {
    const result = await this.client.headlineFlowInteractionEvent.deleteMany({
      where: {
        workspaceId: input.workspaceId,
        occurredAt: { lt: input.before },
      },
    });
    return result.count;
  }

  async summarizeWindows(input: { workspaceId: string; userId: string; now?: Date; retentionDays: number }) {
    const now = input.now ?? new Date();
    const retentionCutoff = new Date(now.getTime() - input.retentionDays * 24 * 60 * 60 * 1000);
    const oneDayCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDayCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prunedEvents = await this.prune({
      workspaceId: input.workspaceId,
      before: retentionCutoff,
    });
    const [day, week, all] = await Promise.all([
      this.summarize({ workspaceId: input.workspaceId, userId: input.userId, since: oneDayCutoff }),
      this.summarize({ workspaceId: input.workspaceId, userId: input.userId, since: sevenDayCutoff }),
      this.summarize({ workspaceId: input.workspaceId, userId: input.userId, since: retentionCutoff }),
    ]);
    return {
      retentionDays: input.retentionDays,
      prunedEvents,
      windows: {
        "24h": day,
        "7d": week,
        all,
      },
    };
  }
}

export const headlineFlowInteractionRepository = new PrismaHeadlineFlowInteractionRepository();
