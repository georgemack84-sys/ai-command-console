import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HeadlineFlowEventRecord } from "@/src/server/headline-flow/event-registry/types";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/headline-flow/event-registry/prisma-event-registry-repository", () => ({
  headlineFlowEventRegistryRepository: {
    listByWorkspace: vi.fn(),
  },
}));

vi.mock("@/src/server/headline-flow/event-registry/event-preferences", async () => {
  const actual = await vi.importActual<typeof import("@/src/server/headline-flow/event-registry/event-preferences")>(
    "@/src/server/headline-flow/event-registry/event-preferences",
  );
  return {
    ...actual,
    headlineFlowEventPreferenceRepository: {
      listUserPreferences: vi.fn(),
    },
  };
});

import { GET } from "@/app/api/headline-flow/events/preferences/route";
import { getSessionUser } from "@/src/lib/auth";
import { headlineFlowEventPreferenceRepository } from "@/src/server/headline-flow/event-registry/event-preferences";
import { headlineFlowEventRegistryRepository } from "@/src/server/headline-flow/event-registry/prisma-event-registry-repository";

const EVENT: HeadlineFlowEventRecord = {
  id: "hfe_saved",
  workspaceId: "workspace_1",
  title: "City expands emergency cooling centers",
  summary: "Officials extended public cooling center hours.",
  topic: "health",
  status: "updated",
  importance: "important",
  confidence: "multi_source",
  firstDetectedAt: "2026-08-29T12:00:00.000Z",
  lastUpdatedAt: "2026-08-29T13:00:00.000Z",
  lastMeaningfulUpdateAt: "2026-08-29T13:00:00.000Z",
  version: 2,
  matchKey: "health:city-expands-emergency-cooling-centers",
  updateSummary: "1 source updated the event.",
  updateReasons: ["new_evidence"],
  sourceCount: 1,
  articleCount: 1,
  evidence: [],
};

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

describe("headline flow event preferences route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user preferences joined to workspace events", async () => {
    mockAuthenticatedUser();
    vi.mocked(headlineFlowEventPreferenceRepository.listUserPreferences).mockResolvedValue([
      {
        id: "preference_1",
        workspaceId: "workspace_1",
        userId: "user_1",
        eventId: "hfe_saved",
        savedAt: "2026-08-29T13:00:00.000Z",
        mutedAt: null,
        resolvedAt: null,
        restoredAt: null,
        createdAt: "2026-08-29T13:00:00.000Z",
        updatedAt: "2026-08-29T13:00:00.000Z",
      },
    ]);
    vi.mocked(headlineFlowEventRegistryRepository.listByWorkspace).mockResolvedValue([EVENT]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.events).toHaveLength(1);
    expect(payload.data.events[0]).toMatchObject({
      event: { id: "hfe_saved", title: "City expands emergency cooling centers" },
      preference: { saved: true, muted: false, resolved: false },
    });
  });

  it("returns unauthorized for anonymous users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("unauthorized");
  });
});
