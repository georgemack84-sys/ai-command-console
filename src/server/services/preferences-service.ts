import { prisma } from "@/src/server/db/prisma";

export type ResearchDeskPreferences = {
  views: Array<{
    name: string;
    filter: "all" | "blocked" | "review" | "publish" | "complete";
    sort: "urgency" | "priority" | "recent";
    freshnessHours: number;
  }>;
  schedules: Array<{
    id: string;
    viewName: string;
    cadence: "weekday-morning" | "daily-brief" | "weekly-review";
    destination: "report-draft" | "clipboard-memo";
    lastRunAt?: string | null;
  }>;
};

const DEFAULT_PREFERENCES: ResearchDeskPreferences = {
  views: [
    { name: "Morning Triage", filter: "blocked", sort: "priority", freshnessHours: 24 },
    { name: "Review Pass", filter: "review", sort: "recent", freshnessHours: 72 },
    { name: "Publishing Pass", filter: "publish", sort: "urgency", freshnessHours: 168 },
  ],
  schedules: [
    {
      id: "schedule-morning-triage",
      viewName: "Morning Triage",
      cadence: "weekday-morning",
      destination: "report-draft",
      lastRunAt: null,
    },
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizePreferences(value: unknown): ResearchDeskPreferences {
  if (!isRecord(value)) {
    return DEFAULT_PREFERENCES;
  }

  const views = Array.isArray(value.views)
    ? value.views.filter((item): item is ResearchDeskPreferences["views"][number] => {
        return (
          isRecord(item) &&
          typeof item.name === "string" &&
          ["all", "blocked", "review", "publish", "complete"].includes(String(item.filter)) &&
          ["urgency", "priority", "recent"].includes(String(item.sort)) &&
          Number.isFinite(Number(item.freshnessHours))
        );
      })
    : DEFAULT_PREFERENCES.views;

  const schedules = Array.isArray(value.schedules)
    ? value.schedules.filter((item): item is ResearchDeskPreferences["schedules"][number] => {
        return (
          isRecord(item) &&
          typeof item.id === "string" &&
          typeof item.viewName === "string" &&
          ["weekday-morning", "daily-brief", "weekly-review"].includes(String(item.cadence)) &&
          ["report-draft", "clipboard-memo"].includes(String(item.destination))
        );
      })
    : DEFAULT_PREFERENCES.schedules;

  return {
    views: views.length ? views.slice(0, 6) : DEFAULT_PREFERENCES.views,
    schedules: schedules.length ? schedules.slice(0, 6) : DEFAULT_PREFERENCES.schedules,
  };
}

export async function getResearchDeskPreferences(workspaceId: string, userId: string) {
  const saved = await prisma.savedView.findFirst({
    where: {
      workspaceId,
      userId,
      name: "Research Desk Preferences",
    },
  });

  if (!saved) {
    return DEFAULT_PREFERENCES;
  }

  return sanitizePreferences(saved.filters);
}

export async function saveResearchDeskPreferences(workspaceId: string, userId: string, preferences: ResearchDeskPreferences) {
  const sanitized = sanitizePreferences(preferences);
  await prisma.savedView.upsert({
    where: {
      id: `research-desk-preferences-${userId}`,
    },
    update: {
      workspaceId,
      userId,
      name: "Research Desk Preferences",
      description: "Saved triage views and summary schedules for the research desk.",
      filters: sanitized,
    },
    create: {
      id: `research-desk-preferences-${userId}`,
      workspaceId,
      userId,
      name: "Research Desk Preferences",
      description: "Saved triage views and summary schedules for the research desk.",
      filters: sanitized,
    },
  });

  return sanitized;
}
