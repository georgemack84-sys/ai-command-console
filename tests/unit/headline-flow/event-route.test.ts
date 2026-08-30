import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HeadlineFlowEventRecord } from "@/src/server/headline-flow/event-registry/types";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/headline-flow/event-registry/prisma-event-registry-repository", () => ({
  headlineFlowEventRegistryRepository: {
    findByIdForWorkspace: vi.fn(),
  },
}));

vi.mock("@/src/server/headline-flow/event-registry/event-preferences", async () => {
  const actual = await vi.importActual<typeof import("@/src/server/headline-flow/event-registry/event-preferences")>(
    "@/src/server/headline-flow/event-registry/event-preferences",
  );
  return {
    ...actual,
    headlineFlowEventPreferenceRepository: {
      findPreference: vi.fn().mockResolvedValue(null),
    },
  };
});

import { GET } from "@/app/api/headline-flow/events/[eventId]/route";
import { getSessionUser } from "@/src/lib/auth";
import { headlineFlowEventPreferenceRepository } from "@/src/server/headline-flow/event-registry/event-preferences";
import { headlineFlowEventRegistryRepository } from "@/src/server/headline-flow/event-registry/prisma-event-registry-repository";

const EVENT: HeadlineFlowEventRecord = {
  id: "hfe_demo",
  workspaceId: "workspace_1",
  title: "Senate advances bipartisan infrastructure bill",
  summary: "Lawmakers moved the infrastructure bill forward.",
  topic: "politics",
  status: "updated",
  importance: "important",
  confidence: "multi_source",
  firstDetectedAt: "2026-08-29T12:00:00.000Z",
  lastUpdatedAt: "2026-08-29T13:00:00.000Z",
  lastMeaningfulUpdateAt: "2026-08-29T13:00:00.000Z",
  version: 2,
  matchKey: "politics:senate-advances-bipartisan-infrastructure-bill",
  updateSummary: "1 new source corroborated this story.",
  updateReasons: ["source_corroboration"],
  sourceCount: 1,
  articleCount: 1,
  evidence: [
    {
      id: "evidence_demo",
      storyPackageId: "package_story_1",
      articleId: "article_demo",
      providerId: "fixture",
      providerArticleId: "provider_article_demo",
      sourceId: "source_npr",
      sourceName: "NPR",
      articleUrl: "https://npr.example.com/senate-advances-bipartisan-infrastructure-bill",
      articleFingerprint: "fingerprint_demo",
      author: "Reporter One",
      imageUrl: "https://npr.example.com/image.jpg",
      headline: "Senate advances bipartisan infrastructure bill",
      summary: "Lawmakers moved the infrastructure bill forward.",
      topic: "politics",
      publishedAt: "2026-08-29T11:30:00.000Z",
      retrievedAt: "2026-08-29T11:35:00.000Z",
      observedAt: "2026-08-29T13:00:00.000Z",
      updateReason: "new_evidence",
    },
  ],
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

describe("headline flow event route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an event inside the authenticated workspace", async () => {
    mockAuthenticatedUser();
    vi.mocked(headlineFlowEventRegistryRepository.findByIdForWorkspace).mockResolvedValue(EVENT);

    const response = await GET(new Request("http://localhost/api/headline-flow/events/hfe_demo"), {
      params: Promise.resolve({ eventId: "hfe_demo" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(headlineFlowEventRegistryRepository.findByIdForWorkspace).toHaveBeenCalledWith("hfe_demo", "workspace_1");
    expect(payload.data.event).toMatchObject({
      id: "hfe_demo",
      workspaceId: "workspace_1",
      version: 2,
      evidence: [{ sourceName: "NPR" }],
    });
    expect(payload.data.preference).toEqual({
      saved: false,
      muted: false,
      resolved: false,
    });
    expect(headlineFlowEventPreferenceRepository.findPreference).toHaveBeenCalledWith({
      workspaceId: "workspace_1",
      userId: "user_1",
      eventId: "hfe_demo",
    });
  });

  it("returns unauthorized for anonymous users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/headline-flow/events/hfe_demo"), {
      params: Promise.resolve({ eventId: "hfe_demo" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("unauthorized");
  });

  it("returns not found when the event is missing from the workspace", async () => {
    mockAuthenticatedUser();
    vi.mocked(headlineFlowEventRegistryRepository.findByIdForWorkspace).mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/headline-flow/events/hfe_missing"), {
      params: Promise.resolve({ eventId: "hfe_missing" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("headline_flow_event_not_found");
  });
});
