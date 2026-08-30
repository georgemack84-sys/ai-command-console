import { describe, expect, it, vi } from "vitest";
import {
  PrismaHeadlineFlowEventPreferenceRepository,
  summarizePreference,
} from "@/src/server/headline-flow/event-registry/event-preferences";

const NOW = new Date("2026-08-29T12:00:00.000Z");

function preference(overrides: Partial<{
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
}> = {}) {
  return {
    id: "preference_1",
    workspaceId: "workspace_1",
    userId: "user_1",
    eventId: "hfe_1",
    savedAt: null,
    mutedAt: null,
    resolvedAt: null,
    restoredAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe("headline flow event preferences", () => {
  it("summarizes preference state for the client", () => {
    expect(summarizePreference(null)).toEqual({
      saved: false,
      muted: false,
      resolved: false,
    });
    expect(summarizePreference({
      id: "preference_1",
      workspaceId: "workspace_1",
      userId: "user_1",
      eventId: "hfe_1",
      savedAt: NOW.toISOString(),
      mutedAt: NOW.toISOString(),
      resolvedAt: NOW.toISOString(),
      restoredAt: null,
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    })).toEqual({
      saved: true,
      muted: true,
      resolved: true,
    });
  });

  it("lists muted and unresolved user events as hidden", async () => {
    const client = {
      headlineFlowEventPreference: {
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([
          preference({ eventId: "hfe_muted", mutedAt: NOW }),
          preference({ eventId: "hfe_resolved", resolvedAt: NOW }),
          preference({
            eventId: "hfe_restored",
            resolvedAt: new Date("2026-08-29T11:00:00.000Z"),
            restoredAt: NOW,
          }),
        ]),
        upsert: vi.fn(),
      },
    };
    const repository = new PrismaHeadlineFlowEventPreferenceRepository(client as never);

    const hidden = await repository.listHiddenEventIds({
      workspaceId: "workspace_1",
      userId: "user_1",
      eventIds: ["hfe_muted", "hfe_resolved", "hfe_restored"],
    });

    expect(hidden).toEqual(new Set(["hfe_muted", "hfe_resolved"]));
  });
});
