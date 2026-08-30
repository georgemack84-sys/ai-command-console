import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/headline-flow/analytics/interaction-events", () => ({
  headlineFlowInteractionRepository: {
    record: vi.fn(),
    summarizeWindows: vi.fn(),
  },
}));

import { GET, POST } from "@/app/api/headline-flow/interactions/route";
import { getSessionUser } from "@/src/lib/auth";
import { headlineFlowInteractionRepository } from "@/src/server/headline-flow/analytics/interaction-events";

const WINDOW_SUMMARY = {
  retentionDays: 90,
  prunedEvents: 0,
  windows: {
    "24h": {
      totalEvents: 1,
      actionCounts: { story_opened: 1 },
      topicCounts: { technology: 1 },
      savedTopicCounts: {},
      mutedTopicCounts: {},
      sourceOpenRate: 0,
    },
    "7d": {
      totalEvents: 1,
      actionCounts: { story_opened: 1 },
      topicCounts: { technology: 1 },
      savedTopicCounts: {},
      mutedTopicCounts: {},
      sourceOpenRate: 0,
    },
    all: {
      totalEvents: 1,
      actionCounts: { story_opened: 1 },
      topicCounts: { technology: 1 },
      savedTopicCounts: {},
      mutedTopicCounts: {},
      sourceOpenRate: 0,
    },
  },
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

describe("headline flow interactions route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records authenticated interactions", async () => {
    mockAuthenticatedUser();
    vi.mocked(headlineFlowInteractionRepository.record).mockResolvedValue({
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
      occurredAt: "2026-08-29T12:00:00.000Z",
    });
    vi.mocked(headlineFlowInteractionRepository.summarizeWindows).mockResolvedValue(WINDOW_SUMMARY);

    const response = await POST(new Request("http://localhost/api/headline-flow/interactions", {
      method: "POST",
      body: JSON.stringify({
        action: "story_opened",
        eventId: "hfe_1",
        storyId: "story_1",
        topic: "technology",
        providerId: "rss",
        sourceName: "Example Source",
        metadata: { selectedRank: 1 },
      }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(headlineFlowInteractionRepository.record).toHaveBeenCalledWith({
      workspaceId: "workspace_1",
      userId: "user_1",
      action: "story_opened",
      eventId: "hfe_1",
      storyId: "story_1",
      topic: "technology",
      providerId: "rss",
      sourceName: "Example Source",
      metadata: { selectedRank: 1 },
    });
    expect(headlineFlowInteractionRepository.summarizeWindows).toHaveBeenCalledWith({
      workspaceId: "workspace_1",
      userId: "user_1",
      retentionDays: 90,
    });
    expect(payload.data.summary).toEqual(WINDOW_SUMMARY);
  });

  it("loads authenticated interaction summaries", async () => {
    mockAuthenticatedUser();
    vi.mocked(headlineFlowInteractionRepository.summarizeWindows).mockResolvedValue(WINDOW_SUMMARY);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.summary).toEqual(WINDOW_SUMMARY);
  });

  it("returns unauthorized for anonymous users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await POST(new Request("http://localhost/api/headline-flow/interactions", {
      method: "POST",
      body: JSON.stringify({ action: "story_opened" }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("unauthorized");
  });

  it("validates interaction actions", async () => {
    mockAuthenticatedUser();

    const response = await POST(new Request("http://localhost/api/headline-flow/interactions", {
      method: "POST",
      body: JSON.stringify({ action: "external_site_visited" }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("validation_error");
  });
});
