import { Prisma } from "@prisma/client";
import { prisma } from "@/src/server/db/prisma";
import { AppError } from "@/src/server/api/errors";
import { headlineFlowEventRegistryRepository } from "@/src/server/headline-flow/event-registry/prisma-event-registry-repository";
import type {
  HeadlineFlowEventPreference,
  HeadlineFlowEventUserAction,
} from "@/src/server/headline-flow/event-registry/types";

type PreferenceRow = {
  id: string;
  workspaceId: string;
  userId: string;
  eventId: string;
  savedAt: Date | null;
  mutedAt: Date | null;
  resolvedAt: Date | null;
  restoredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type PreferenceClient = Prisma.TransactionClient & {
  headlineFlowEventPreference: {
    findFirst(input: unknown): Promise<PreferenceRow | null>;
    findMany(input: unknown): Promise<PreferenceRow[]>;
    upsert(input: unknown): Promise<PreferenceRow>;
  };
};

export type HeadlineFlowEventPreferenceRepository = {
  findPreference(input: { workspaceId: string; userId: string; eventId: string }): Promise<HeadlineFlowEventPreference | null>;
  listPreferences(input: { workspaceId: string; userId: string; eventIds: string[] }): Promise<Map<string, HeadlineFlowEventPreference>>;
  listUserPreferences(input: { workspaceId: string; userId: string }): Promise<HeadlineFlowEventPreference[]>;
  listHiddenEventIds(input: { workspaceId: string; userId: string; eventIds: string[] }): Promise<Set<string>>;
  applyAction(input: {
    workspaceId: string;
    userId: string;
    eventId: string;
    action: HeadlineFlowEventUserAction;
    now?: Date;
  }): Promise<HeadlineFlowEventPreference>;
};

function mapPreference(row: PreferenceRow): HeadlineFlowEventPreference {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    userId: row.userId,
    eventId: row.eventId,
    savedAt: row.savedAt?.toISOString() ?? null,
    mutedAt: row.mutedAt?.toISOString() ?? null,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    restoredAt: row.restoredAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function actionData(action: HeadlineFlowEventUserAction, now: Date) {
  if (action === "save") {
    return { savedAt: now };
  }
  if (action === "unsave") {
    return { savedAt: null };
  }
  if (action === "mute") {
    return { mutedAt: now };
  }
  if (action === "unmute") {
    return { mutedAt: null };
  }
  if (action === "resolve") {
    return { resolvedAt: now, restoredAt: null };
  }
  return { resolvedAt: null, restoredAt: now };
}

function isResolvedPreference(preference: Pick<HeadlineFlowEventPreference, "resolvedAt" | "restoredAt">) {
  const resolvedAt = preference.resolvedAt;
  if (!resolvedAt) {
    return false;
  }
  return !preference.restoredAt || preference.restoredAt <= resolvedAt;
}

function isHiddenPreference(preference: HeadlineFlowEventPreference) {
  return Boolean(preference.mutedAt) || isResolvedPreference(preference);
}

export function summarizePreference(preference: HeadlineFlowEventPreference | null) {
  return {
    saved: Boolean(preference?.savedAt),
    muted: Boolean(preference?.mutedAt),
    resolved: preference ? isResolvedPreference(preference) : false,
  };
}

export class PrismaHeadlineFlowEventPreferenceRepository implements HeadlineFlowEventPreferenceRepository {
  constructor(private readonly client: PreferenceClient = prisma as unknown as PreferenceClient) {}

  async findPreference(input: { workspaceId: string; userId: string; eventId: string }) {
    const row = await this.client.headlineFlowEventPreference.findFirst({
      where: input,
    });
    return row ? mapPreference(row) : null;
  }

  async listPreferences(input: { workspaceId: string; userId: string; eventIds: string[] }) {
    if (!input.eventIds.length) {
      return new Map<string, HeadlineFlowEventPreference>();
    }
    const rows = await this.client.headlineFlowEventPreference.findMany({
      where: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        eventId: { in: input.eventIds },
      },
    });
    return new Map(rows.map((row) => {
      const preference = mapPreference(row);
      return [preference.eventId, preference];
    }));
  }

  async listUserPreferences(input: { workspaceId: string; userId: string }) {
    const rows = await this.client.headlineFlowEventPreference.findMany({
      where: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        OR: [
          { savedAt: { not: null } },
          { mutedAt: { not: null } },
          { resolvedAt: { not: null } },
        ],
      },
      orderBy: [
        { updatedAt: "desc" },
      ],
    });
    return rows.map(mapPreference);
  }

  async listHiddenEventIds(input: { workspaceId: string; userId: string; eventIds: string[] }) {
    const preferences = await this.listPreferences(input);
    return new Set(
      Array.from(preferences.values())
        .filter(isHiddenPreference)
        .map((preference) => preference.eventId),
    );
  }

  async applyAction(input: {
    workspaceId: string;
    userId: string;
    eventId: string;
    action: HeadlineFlowEventUserAction;
    now?: Date;
  }) {
    const event = await headlineFlowEventRegistryRepository.findByIdForWorkspace(input.eventId, input.workspaceId);
    if (!event) {
      throw new AppError(404, "headline_flow_event_not_found", "Headline Flow event not found.");
    }

    const now = input.now ?? new Date();
    const data = actionData(input.action, now);
    const row = await this.client.headlineFlowEventPreference.upsert({
      where: {
        workspaceId_userId_eventId: {
          workspaceId: input.workspaceId,
          userId: input.userId,
          eventId: input.eventId,
        },
      },
      create: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        eventId: input.eventId,
        ...data,
      },
      update: data,
    });
    return mapPreference(row);
  }
}

export const headlineFlowEventPreferenceRepository = new PrismaHeadlineFlowEventPreferenceRepository();
